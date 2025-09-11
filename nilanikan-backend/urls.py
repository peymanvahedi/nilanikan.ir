from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from catalog.views import CategoryViewSet, ProductViewSet, BundleViewSet
from orders.views import CartViewSet, OrderViewSet
from coupons.views import CouponViewSet
from support.views import TicketViewSet
from accounts.views import MeView, RegisterView, LoginView, UserViewSet

# روتر اصلی
router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"bundles", BundleViewSet, basename="bundle")
router.register(r"cart", CartViewSet, basename="cart")
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"coupons", CouponViewSet, basename="coupon")
router.register(r"tickets", TicketViewSet, basename="ticket")
router.register(r"users", UserViewSet, basename="user")

# برای اطمینان، مسیر دیتیل محصول با slug را هم صریح تعریف می‌کنیم
product_detail = ProductViewSet.as_view({"get": "retrieve"})

urlpatterns = [
    path("", RedirectView.as_view(url="/api/", permanent=False)),  # ریدایرکت / به /api/
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/products/<slug:slug>/", product_detail),  # مسیر صریح دیتیل با slug
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/", include("rest_framework.urls", namespace="rest_framework")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
