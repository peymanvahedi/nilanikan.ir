from django.db import models
from django.contrib.auth.models import User
from catalog.models import Product
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver


# -------------------------------
# Cart & Orders (کدهای موجود شما)
# -------------------------------
class CartItem(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="cart_items"
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "product")

    def __str__(self):
        return f"{self.user} - {self.product} x {self.quantity}"


class Order(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("canceled", "Canceled"),
    )

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="orders"
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    address = models.TextField(blank=True, null=True)
    tracking_code = models.CharField(max_length=64, blank=True, null=True)
    shipping_method = models.CharField(max_length=50, default="post")
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    items_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user} - {self.status}"

    # محاسبه جمع آیتم‌ها از روی OrderItemها (اختیاری اگر جایی دیگر محاسبه می‌کنید)
    def compute_items_subtotal(self):
        subtotal = Decimal("0")
        for it in self.items.all():
            subtotal += (it.price or Decimal("0")) * Decimal(it.quantity or 0)
        self.items_subtotal = subtotal
        return subtotal

    # محاسبه total_amount بر اساس subtotal + هزینه ارسال
    def compute_total(self, save: bool = True):
        subtotal = self.compute_items_subtotal()
        total = (subtotal or Decimal("0")) + (self.shipping_cost or Decimal("0"))
        self.total_amount = total
        if save:
            self.save(update_fields=["items_subtotal", "total_amount"])
        return total

    # پرداخت سفارش از کیف پول
    def pay_with_wallet(self):
        # مطمئن شو total_amount به‌روز است
        if not self.total_amount or self.total_amount <= 0:
            self.compute_total(save=True)

        amount = Decimal(self.total_amount or 0)
        w = getattr(self.user, "wallet", None)
        if not w:
            return {"ok": False, "error": "WALLET_NOT_FOUND"}

        trx = w.debit(amount, reason="ORDER_PAYMENT", meta={"order_id": self.id})
        trx.order = self
        trx.save(update_fields=["order"])

        if trx.status == WalletTransaction.Status.SUCCESS:
            self.status = "paid"
            self.save(update_fields=["status"])
            return {"ok": True, "transaction_id": trx.id}
        else:
            return {"ok": False, "error": "INSUFFICIENT_FUNDS"}


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.product} x {self.quantity} (Order {self.order.id})"


# -------------------------------
# Wallet (کیف پول)
# -------------------------------
class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def __str__(self):
        return f"Wallet({self.user.username}) - {self.balance}"

    def credit(self, amount: Decimal, reason: str = "", meta: dict = None):
        amount = Decimal(amount)
        self.balance = (self.balance or Decimal("0")) + amount
        self.save(update_fields=["balance"])
        return WalletTransaction.objects.create(
            user=self.user,
            amount=amount,
            trx_type=WalletTransaction.Type.CREDIT,
            status=WalletTransaction.Status.SUCCESS,
            reason=reason,
            meta=meta or {},
        )

    def debit(self, amount: Decimal, reason: str = "", meta: dict = None):
        amount = Decimal(amount)
        if (self.balance or Decimal("0")) < amount:
            return WalletTransaction.objects.create(
                user=self.user,
                amount=amount,
                trx_type=WalletTransaction.Type.DEBIT,
                status=WalletTransaction.Status.FAILED,
                reason="INSUFFICIENT_FUNDS",
                meta={"requested_reason": reason, **(meta or {})},
            )
        self.balance = (self.balance or Decimal("0")) - amount
        self.save(update_fields=["balance"])
        return WalletTransaction.objects.create(
            user=self.user,
            amount=amount,
            trx_type=WalletTransaction.Type.DEBIT,
            status=WalletTransaction.Status.SUCCESS,
            reason=reason,
            meta=meta or {},
        )


class WalletTransaction(models.Model):
    class Type(models.TextChoices):
        CREDIT = "CREDIT", "Credit"
        DEBIT = "DEBIT", "Debit"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wallet_transactions")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    trx_type = models.CharField(max_length=10, choices=Type.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    reason = models.CharField(max_length=255, blank=True, default="")
    meta = models.JSONField(default=dict, blank=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name="wallet_transactions")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.trx_type} {self.amount} - {self.user} - {self.status}"


# ساخت خودکار کیف پول برای هر کاربر
@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.create(user=instance)
