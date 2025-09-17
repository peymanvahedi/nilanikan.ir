# orders/views.py
from django.db import transaction
from django.db.models import F
from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import CartItem, Order, OrderItem
from .serializers import CartItemSerializer, OrderSerializer
from catalog.models import Product


# --- helpers ---
def user_field_name(model):
    names = {f.name for f in model._meta.get_fields()}
    if "user" in names:
        return "user"
    if "customer" in names:
        return "customer"
    if "owner" in names:
        return "owner"
    return "user"


def user_filter(model, user):
    return {user_field_name(model): user}


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(
            **user_filter(CartItem, self.request.user)
        ).select_related("product")

    def create(self, request, *args, **kwargs):
        pid = request.data.get("product_id") or request.data.get("product")
        qty = int(request.data.get("quantity") or 1)
        if not pid:
            return Response({"product_id": ["این مقدار لازم است."]}, status=400)
        try:
            product = Product.objects.get(pk=pid)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found"}, status=404)

        uf = user_filter(CartItem, request.user)
        item, created = CartItem.objects.get_or_create(
            product=product, defaults={"quantity": qty, **uf}, **uf
        )
        if not created:
            CartItem.objects.filter(pk=item.pk).update(quantity=F("quantity") + qty)
            item.refresh_from_db()

        data = CartItemSerializer(item, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        product_id = request.query_params.get("product_id") or request.query_params.get("product")
        if product_id:
            CartItem.objects.filter(
                **user_filter(CartItem, self.request.user), product_id=product_id
            ).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["post"])
    def clear(self, request):
        self.get_queryset().delete()
        return Response({"detail": "Cart cleared"}, status=200)

    @action(detail=False, methods=["post"], url_path="remove")
    def remove(self, request):
        pid = request.data.get("product_id") or request.data.get("id")
        if not pid:
            return Response({"detail": "product_id required"}, status=400)
        CartItem.objects.filter(
            **user_filter(CartItem, request.user), product_id=pid
        ).delete()
        return Response({"detail": "Removed"}, status=200)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Order.objects.filter(
            **user_filter(Order, self.request.user)
        ).prefetch_related("items__product")
        if self.request.user.is_staff:
            qs = Order.objects.all().prefetch_related("items__product")
        return qs

    # 👇 فقط برای تست: اجازهٔ مشاهدهٔ یک سفارش بدون لاگین
    def get_permissions(self):
        if getattr(self, "action", None) == "retrieve":
            return [AllowAny()]
        return super().get_permissions()

    # 👇 فقط برای تست: در حالت retrieve از فیلتر مالک عبور کن
    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        try:
            order = Order.objects.prefetch_related("items__product").get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        data = OrderSerializer(order, context={"request": request}).data
        return Response(data, status=200)

    # ============================
    #  Checkout – پرداخت درب منزل (COD)
    # ============================
    @transaction.atomic
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],      # برای تست لوکال
        authentication_classes=[],          # در تولید حذف شود
        url_path="checkout",
    )
    def checkout(self, request):
        """
        سفارش را می‌سازد و پرداخت را «درب منزل» قرار می‌دهد.
        انتظار بدنه:
        {
          "cart":[{"product_id":1,"qty":2}, ...],
          "customer":{"first_name":"...","last_name":"","email":"","phone":"0912..."},
          "shipping_address":{"line1":"...","city":""},
          "shipping_method":"post"
        }
        """
        # 1) تعیین کاربر و سبد
        if request.user.is_authenticated:
            order_user = request.user
            cart_qs = CartItem.objects.filter(
                **user_filter(CartItem, order_user)
            ).select_related("product")
            cart_list = [{"product": ci.product, "qty": ci.quantity} for ci in cart_qs]
        else:
            User = get_user_model()
            guest_id = int(getattr(settings, "GUEST_USER_ID", 1))
            order_user = User.objects.filter(pk=guest_id).first()
            if not order_user:
                return Response(
                    {"detail": "Guest user not found. Create user id=1 or set GUEST_USER_ID."},
                    status=400,
                )

            body_cart = request.data.get("cart") or []
            if not isinstance(body_cart, list) or not body_cart:
                return Response({"detail": "Cart is empty. Send: cart: [{product_id, qty}]."}, status=400)

            product_ids = [item.get("product_id") for item in body_cart if item.get("product_id")]
            products = Product.objects.in_bulk(product_ids)

            cart_list = []
            for item in body_cart:
                pid = item.get("product_id")
                qty = int(item.get("qty") or item.get("quantity") or 1)
                if pid in products and qty > 0:
                    cart_list.append({"product": products[pid], "qty": qty})

            cart_qs = None  # مهمان

        if not cart_list:
            return Response({"detail": "Cart is empty"}, status=400)

        # 2) آدرس و ارسال (بدون کد پستی)
        address = (
            request.data.get("address")
            or (request.data.get("shipping_address") or {}).get("line1")
            or ""
        )
        shipping_method = (
            request.data.get("shipping_method")
            or (request.data.get("shipping") or {}).get("method")
            or "post"
        )
        shipping_cost = int(
            request.data.get("shipping_cost")
            or (request.data.get("shipping") or {}).get("cost")
            or 0
        )

        # 3) ساخت سفارش (پرداخت COD)
        order = Order.objects.create(
            user=order_user,
            address=address,
            shipping_method=shipping_method,
            shipping_cost=shipping_cost,
        )

        total = 0
        for row in cart_list:
            product = row["product"]
            qty = row["qty"]
            price = getattr(product, "discount_price", None) or product.price
            OrderItem.objects.create(order=order, product=product, price=price, quantity=qty)
            total += price * qty

        order.items_subtotal = total
        order.total_amount = total + (order.shipping_cost or 0)

        # اگر مدل Order فیلد status دارد، وضعیت را مناسب COD بگذار
        if hasattr(order, "status"):
            try:
                setattr(order, "status", "pending")  # یا 'cod' اگر دارید
            except Exception:
                pass

        # برای پیگیری داخلی، tracking_code ساده بگذار (بدون درگاه)
        try:
            order.tracking_code = f"COD-{order.id}"
        except Exception:
            pass

        order.save(update_fields=["items_subtotal", "total_amount", "status", "tracking_code"])

        # اگر کاربر لاگین بود، سبد را خالی کن
        if cart_qs is not None:
            cart_qs.delete()

        # خروجی ساده؛ فرانت اگر لینک پرداخت نبیند خودش به صفحهٔ Success/Order Detail می‌رود
        return Response(
            {
                "ok": True,
                "order_id": order.id,
                "total_amount": int(order.total_amount),
                "payment_method": "cod",
                "status": getattr(order, "status", "pending"),
            },
            status=201,
        )
