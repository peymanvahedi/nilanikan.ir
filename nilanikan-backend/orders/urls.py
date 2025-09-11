from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartViewSet, OrderViewSet

router = DefaultRouter()
router.register(r"api/cart", CartViewSet, basename="cart")
router.register(r"api/orders", OrderViewSet, basename="orders")

urlpatterns = [path("", include(router.urls))]
