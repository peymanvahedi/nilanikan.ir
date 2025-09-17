from django.http import Http404
from django.db.models import Prefetch
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response

from .models import Category, Product, Bundle, ProductVideo, BundleVideo  # ← ویدیوها
from .serializers import (
    CategorySerializer,
    CategoryDetailSerializer,   # ← اضافه شد (برای صفحه جزئیات دسته)
    ProductSerializer,
    BundleSerializer,
    ProductItemSerializer,
    ProductVideoSerializer,   # ← اضافه شد
    BundleVideoSerializer,    # ← اضافه شد
    MenuCategorySerializer,   # ← سریالایزر منو
)

# اسلایدها و بنرها
from banners.models import Slide, Banner
from banners.serializers import SlideSerializer, BannerSerializer

# استوری‌ها
from stories.models import Story
from stories.serializers import StorySerializer


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def home_view(request):
    rec_products = Product.objects.filter(is_active=True, is_recommended=True).order_by("-id")[:12]
    rec_bundles  = Bundle.objects.filter(is_recommended=True).order_by("-id")[:12]
    vip_items = [
        {
            "id": p.id,
            "title": p.name,
            "imageUrl": getattr(getattr(p, "image", None), "url", "") or "",
            "price": float(p.price or 0),
            "compareAtPrice": None,
            "link": f"/product/{p.slug or p.id}/",
        } for p in rec_products
    ] + [
        {
            "id": b.id,
            "title": b.title,
            "imageUrl": getattr(getattr(b, "image", None), "url", "") or "",
            "price": float(b.bundle_price or 0),
            "compareAtPrice": None,
            "link": f"/bundle/{b.slug or b.id}/",
        } for b in rec_bundles
    ]

    slides_qs = Slide.objects.filter(is_active=True).order_by("order", "-id")
    hero_slides = SlideSerializer(slides_qs, many=True, context={"request": request}).data

    banners_qs = Banner.objects.filter(is_active=True).order_by("order", "-id")
    banners = BannerSerializer(banners_qs, many=True, context={"request": request}).data

    # حذف بنرهای تکراری نسبت به اسلایدها
    slide_imgs = {s.get("imageUrl", "") for s in hero_slides if s.get("imageUrl")}
    banners = [b for b in banners if b.get("imageUrl") and b["imageUrl"] not in slide_imgs]

    best_sellers_qs = Product.objects.filter(is_active=True).order_by("-stock", "-id")[:12]
    best_sellers = ProductItemSerializer(best_sellers_qs, many=True, context={"request": request}).data

    new_arrivals_qs = Product.objects.filter(is_active=True).order_by("-created_at")[:12]
    new_arrivals = ProductItemSerializer(new_arrivals_qs, many=True, context={"request": request}).data

    sets_qs = Bundle.objects.all().order_by("-created_at")[:20]
    sets_serialized = BundleSerializer(sets_qs, many=True, context={"request": request}).data
    sets_items = [
        {
            "id": b["id"],
            "title": b.get("title") or "",
            "imageUrl": (b.get("image") or "") or (b.get("images")[0] if b.get("images") else ""),
            "price": float(b.get("bundle_price") or 0),
            "compareAtPrice": None,
            "link": f"/bundle/{b.get('slug') or b.get('id')}/",
        }
        for b in sets_serialized
    ]

    stories_qs = Story.objects.order_by("-created_at")[:50]
    stories = StorySerializer(stories_qs, many=True, context={"request": request}).data

    return Response({
        "stories": stories,
        "heroSlides": hero_slides,
        "banners": banners,
        "vip": {
            "endsAt": None,
            "seeAllLink": "/products?recommended=1",
            "products": vip_items,
        },
        "setsAndPuffer": {"items": sets_items},
        "miniLooks": [],
        "bestSellers": best_sellers,
        "newArrivals": new_arrivals,
    })


# --- ReadOnly API viewsets for router /api/... ---
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by("menu_order", "name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "slug"]
    ordering_fields = ["menu_order", "name", "id"]

    # ✨ فقط افزوده شده؛ هیچ‌چیز از کد قبلی حذف نشده
    def get_serializer_class(self):
        # برای صفحه جزئیات دسته، آیکن و بنر (image) هم برگردانده شود
        if self.action == "retrieve":
            return CategoryDetailSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=["get"], url_path="menu", permission_classes=[permissions.AllowAny])
    def menu(self, request):
        roots = (
            Category.objects
            .filter(parent__isnull=True, is_active=True, show_in_menu=True)
            .order_by("menu_order", "name")
            .prefetch_related(
                Prefetch(
                    "children",
                    queryset=Category.objects.filter(is_active=True, show_in_menu=True).order_by("menu_order", "name")
                    .prefetch_related(
                        Prefetch(
                            "children",
                            queryset=Category.objects.filter(is_active=True, show_in_menu=True).order_by("menu_order", "name")
                        )
                    )
                )
            )
        )
        data = MenuCategorySerializer(roots, many=True, context={"request": request}).data
        return Response(data)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all().select_related("category").order_by("-id")
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "slug", "description"]
    ordering_fields = ["id", "price"]


class BundleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Bundle.objects.all().prefetch_related("products").order_by("-id")
    serializer_class = BundleSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "slug"]
    ordering_fields = ["id", "bundle_price"]


# --- اختیاری: CRUD API برای ویدیوها (فقط ادمین) ---
class ProductVideoViewSet(viewsets.ModelViewSet):
    serializer_class = ProductVideoSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = ProductVideo.objects.all().order_by("order", "id")
        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs


class BundleVideoViewSet(viewsets.ModelViewSet):
    serializer_class = BundleVideoSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = BundleVideo.objects.all().order_by("order", "id")
        bundle_id = self.request.query_params.get("bundle")
        if bundle_id:
            qs = qs.filter(bundle_id=bundle_id)
        return qs
