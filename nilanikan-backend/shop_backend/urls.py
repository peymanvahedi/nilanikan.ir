# shop_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from django.http import JsonResponse

from catalog.views import (
    CategoryViewSet,
    ProductViewSet,
    BundleViewSet,
    home_view,
    ProductVideoViewSet,
    BundleVideoViewSet,
)
from orders.views import CartViewSet, OrderViewSet
from coupons.views import CouponViewSet
from support.views import TicketViewSet
from accounts.views import MeView, RegisterView, LoginView, UserViewSet
from catalog.api import SlideViewSet, BannerViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products",   ProductViewSet,  basename="product")
router.register(r"bundles",    BundleViewSet,   basename="bundle")
router.register(r"cart",       CartViewSet,     basename="cart")
router.register(r"orders",     OrderViewSet,    basename="order")
router.register(r"coupons",    CouponViewSet,   basename="coupon")
router.register(r"tickets",    TicketViewSet,   basename="ticket")
router.register(r"users",      UserViewSet,     basename="user")
router.register(r"slides",     SlideViewSet,    basename="slide")
router.register(r"banners",    BannerViewSet,   basename="banner")
router.register(r"product-videos", ProductVideoViewSet, basename="product-video")
router.register(r"bundle-videos",  BundleVideoViewSet,  basename="bundle-video")

def health(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("", RedirectView.as_view(url="/api/", permanent=False)),
    path("admin/", admin.site.urls),

    path("api/", include(router.urls)),

    path("api/checkout/", OrderViewSet.as_view({"post": "checkout"})),
    path("api/checkout",  OrderViewSet.as_view({"post": "checkout"})),

    path("api/home/", home_view, name="home"),

    path("api/auth/me/",       MeView.as_view(),       name="me"),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/",    LoginView.as_view(),    name="login"),
    path("api/auth/", include("rest_framework.urls", namespace="rest_framework")),

    path("api/", include("stories.urls")),
    path("api/", include("reviews.urls")),
    path("api/chat/", include("chat.urls")),  # ← اضافه شده

    path("api/health/", health, name="health"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
