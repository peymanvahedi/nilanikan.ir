from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.http import Http404

from .models import Category, Product, Bundle
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    BundleSerializer,
    ProductItemSerializer,
)
from banners.models import Slide
from banners.serializers import SlideSerializer

# 👇 اضافه کردیم
from stories.models import Story
from stories.serializers import StorySerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return bool(request.user and request.user.is_staff)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "slug"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "slug", "sku", "description"]
    ordering_fields = ["price", "created_at"]

    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    lookup_value_regex = r"[-\w]+"


class BundleViewSet(viewsets.ModelViewSet):
    queryset = Bundle.objects.prefetch_related("products").all()
    serializer_class = BundleSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "slug"]

    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    lookup_value_regex = r"[-\w]+"

    def retrieve(self, request, *args, **kwargs):
        lookup = kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        qs = self.get_queryset()

        obj = qs.filter(slug=lookup).first()
        if not obj and str(lookup).isdigit():
            obj = qs.filter(pk=int(lookup)).first()

        if not obj:
            raise Http404

        self.check_object_permissions(request, obj)
        serializer = self.get_serializer(obj)
        return Response(serializer.data)


# ---------------- صفحه اصلی ----------------

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def home_view(request):
    # نمونه: پرفروش‌ها → اولین 10 محصول فعال
    best_sellers = Product.objects.filter(is_active=True)[:10]

    # جدیدترین‌ها → آخرین 8 محصول
    new_arrivals = Product.objects.filter(is_active=True).order_by("-created_at")[:8]

    # اسلایدهای هدر
    slides = Slide.objects.filter(is_active=True).order_by("order")

    # استوری‌ها
    stories = Story.objects.all().order_by("-created_at")

    return Response({
        "stories": StorySerializer(stories, many=True, context={"request": request}).data,
        "vip": {
            "endsAt": "2025-12-31T23:59:59Z",
            "products": [],
            "seeAllLink": "/vip",
        },
        "setsAndPuffer": {"items": []},
        "miniLooks": [],
        "bestSellers": ProductItemSerializer(best_sellers, many=True, context={"request": request}).data,
        "banners": [],
        "newArrivals": ProductItemSerializer(new_arrivals, many=True, context={"request": request}).data,
        "heroSlides": SlideSerializer(slides, many=True, context={"request": request}).data,
    })
