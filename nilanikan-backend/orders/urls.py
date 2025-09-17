# orders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartViewSet, OrderViewSet

router = DefaultRouter()
router.register(r"cart", CartViewSet, basename="cart")
router.register(r"orders", OrderViewSet, basename="orders")

urlpatterns = [
    path("", include(router.urls)),
    # مسیر جداگانهٔ کال‌بک زرین‌پال (درست مثل آدرسی که در settings به عنوان ZARINPAL_CALLBACK_URL گذاشتی)
    # این مسیر عملاً به متد payment_callback در OrderViewSet می‌رود
    path("orders/payment/callback/", OrderViewSet.as_view({"get": "payment_callback"}), name="zarinpal-callback"),
]
