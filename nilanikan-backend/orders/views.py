# orders/views.py
from django.db import transaction
from django.db.models import F
from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CartItem, Order, OrderItem
from .serializers import CartItemSerializer, OrderSerializer
from catalog.models import Product


# helper ها
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
                **user_filter(CartItem, request.user), product_id=product_id
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

    @transaction.atomic
    @action(detail=False, methods=["post"], permission_classes=[permissions.AllowAny])
    def checkout(self, request):
        # 1) تعیین کاربر و سبد
        if request.user.is_authenticated:
            order_user = request.user
            cart_qs = CartItem.objects.filter(
                **user_filter(CartItem, order_user)
            ).select_related("product")
            cart_list = [{"product": ci.product, "qty": ci.quantity} for ci in cart_qs]
        else:
            # کاربر مهمان: از settings یک کاربر واقعی انتخاب کن
            User = get_user_model()
            guest_id = int(getattr(settings, "GUEST_USER_ID", 1))
            order_user = User.objects.filter(pk=guest_id).first()
            if not order_user:
                return Response(
                    {"detail": "Guest user not found. Create user with id=1 or set GUEST_USER_ID in settings."},
                    status=400,
                )

            # cart از بدنهٔ درخواست
            body_cart = request.data.get("cart") or []
            if not isinstance(body_cart, list) or not body_cart:
                return Response(
                    {"detail": "Cart is empty. Send: cart: [{product_id, qty}]."},
                    status=400,
                )

            product_ids = [item.get("product_id") for item in body_cart if item.get("product_id")]
            products = Product.objects.in_bulk(product_ids)

            cart_list = []
            for item in body_cart:
                pid = item.get("product_id")
                qty = int(item.get("qty") or item.get("quantity") or 1)
                if pid in products and qty > 0:
                    cart_list.append({"product": products[pid], "qty": qty})

            cart_qs = None  # برای مهمان چیزی برای پاک‌کردن نداریم

        if not cart_list:
            return Response({"detail": "Cart is empty"}, status=400)

        # 2) آدرس و ارسال
        address = request.data.get("address", "")
        postal_code = request.data.get("postal_code") or request.data.get("postalCode") or ""
        shipping_method = request.data.get("shipping_method") or request.data.get("shipping", {}).get("method") or "post"
        shipping_cost = request.data.get("shipping_cost") or request.data.get("shipping", {}).get("cost") or 0

        # 3) ساخت سفارش
        order = Order.objects.create(
            user=order_user,
            address=address,
            postal_code=postal_code,
            shipping_method=shipping_method,
            shipping_cost=shipping_cost or 0,
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
        order.save(update_fields=["items_subtotal", "total_amount"])

        # اگر لاگین بود، سبد DB را خالی کن
        if cart_qs is not None:
            cart_qs.delete()

        return Response(
            {"order_id": order.id, "total_amount": str(order.total_amount), "status": getattr(order, "status", "pending")},
            status=201,
        )
