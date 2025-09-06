from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# ViewSetهای فعلی پروژه
from catalog.views import CategoryViewSet, ProductViewSet, BundleViewSet, home_view
from orders.views import CartViewSet, OrderViewSet
from coupons.views import CouponViewSet
from support.views import TicketViewSet
from accounts.views import MeView, RegisterView, LoginView, UserViewSet

# ✅ SlideViewSet مربوط به بنرها
from catalog.api import SlideViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products",   ProductViewSet,  basename="product")
router.register(r"bundles",    BundleViewSet,   basename="bundle")
router.register(r"cart",       CartViewSet,     basename="cart")
router.register(r"orders",     OrderViewSet,    basename="order")
router.register(r"coupons",    CouponViewSet,   basename="coupon")
router.register(r"tickets",    TicketViewSet,   basename="ticket")
router.register(r"users",      UserViewSet,     basename="user")
router.register(r"banners",    SlideViewSet,    basename="banner")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),

    # Home API (برای صفحه اصلی فرانت)
    path("api/home/", home_view, name="home"),

    # احراز هویت
    path("api/auth/me/",       MeView.as_view(),       name="me"),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/",    LoginView.as_view(),    name="login"),

    # برای تست مرورگری DRF
    path("api/auth/", include("rest_framework.urls", namespace="rest_framework")),

    # 👇 استوری‌ها هم اینجا باشه
    path("api/", include("stories.urls")),
]

# سرو مدیا در حالت توسعه
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


from django.http import JsonResponse

def health(request):
    return JsonResponse({"status": "ok"})

urlpatterns += [
    path("api/health/", health),
]
