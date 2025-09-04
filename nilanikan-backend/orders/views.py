# orders/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F
from django.forms.models import model_to_dict

from .models import CartItem, Order, OrderItem
from .serializers import CartItemSerializer, OrderSerializer
from catalog.models import Product  # ← مسیر اپ محصولات شما

# helper: تعیین فیلد کاربر در مدل (user | customer | owner)
def user_field_name(model):
    names = {f.name for f in model._meta.get_fields()}
    if "user" in names:
        return "user"
    if "customer" in names:
        return "customer"
    if "owner" in names:
        return "owner"
    return "user"  # پیش‌فرض

def user_filter(model, user):
    return {user_field_name(model): user}

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            CartItem.objects
            .filter(**user_filter(CartItem, self.request.user))
            .select_related("product")
        )

    # ایجاد/افزایش آیتم سبد به‌صورت صریح (بدون تکیه بر serializer.save)
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
        # get_or_create بر اساس کاربر + محصول
        item, created = CartItem.objects.get_or_create(
            product=product,
            defaults={"quantity": qty, **uf},
            **uf
        )
        if not created:
            CartItem.objects.filter(pk=item.pk).update(quantity=F("quantity") + qty)
            item.refresh_from_db()

        data = CartItemSerializer(item, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        # DELETE /api/cart/?product_id=12
        product_id = request.query_params.get("product_id") or request.query_params.get("product")
        if product_id:
            CartItem.objects.filter(**user_filter(CartItem, request.user), product_id=product_id).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["post"])
    def clear(self, request):
        self.get_queryset().delete()
        return Response({"detail": "Cart cleared"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="remove")
    def remove(self, request):
        pid = request.data.get("product_id") or request.data.get("id")
        if not pid:
            return Response({"detail": "product_id required"}, status=400)
        CartItem.objects.filter(**user_filter(CartItem, request.user), product_id=pid).delete()
        return Response({"detail": "Removed"}, status=200)

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Order.objects.filter(**user_filter(Order, self.request.user)).prefetch_related("items__product")
        if self.request.user.is_staff:
            qs = Order.objects.all().prefetch_related("items__product")
        return qs

    @transaction.atomic
    @action(detail=False, methods=["post"])
    def checkout(self, request):
        # سبد را بر اساس همان فیلد کاربر بخوان
        cart_items = CartItem.objects.filter(**user_filter(CartItem, request.user)).select_related("product")
        if not cart_items.exists():
            return Response({"detail": "Cart is empty"}, status=400)

        address = request.data.get("address", "")
        postal_code = request.data.get("postal_code") or request.data.get("postalCode") or ""
        shipping_method = request.data.get("shipping_method") or request.data.get("shipping", {}).get("method") or "post"
        shipping_cost = request.data.get("shipping_cost") or request.data.get("shipping", {}).get("cost") or 0

        # ساخت سفارش با همان فیلد کاربر
        ofn = user_field_name(Order)
        order_kwargs = {
            ofn: request.user,
            "address": address,
            "postal_code": postal_code,
            "shipping_method": shipping_method,
            "shipping_cost": shipping_cost or 0,
        }
        order = Order.objects.create(**order_kwargs)

        total = 0
        for ci in cart_items:
            price = getattr(ci.product, "discount_price", None) or ci.product.price
            OrderItem.objects.create(order=order, product=ci.product, price=price, quantity=ci.quantity)
            total += price * ci.quantity

        order.items_subtotal = total
        order.total_amount = total + (order.shipping_cost or 0)
        order.save(update_fields=["items_subtotal", "total_amount"])

        cart_items.delete()

        return Response({"order_id": order.id, "total_amount": str(order.total_amount), "status": getattr(order, "status", "pending")}, status=201)
