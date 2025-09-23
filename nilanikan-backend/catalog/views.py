# catalog/views.py
from django.http import Http404
from django.db.models import Q, Prefetch
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response

from .models import (
    Category,
    Product,
    Bundle,
    ProductVideo,
    BundleVideo,
    MenuItem,
)
from .serializers import (
    CategorySerializer,
    CategoryDetailSerializer,
    ProductSerializer,
    BundleSerializer,
    ProductItemSerializer,
    ProductVideoSerializer,
    BundleVideoSerializer,
    MenuCategorySerializer,
    MenuItemSerializer,
)

from banners.models import Slide, Banner
from banners.serializers import SlideSerializer, BannerSerializer

from stories.models import Story
from stories.serializers import StorySerializer

# --- Holoo helpers (وقتی HOLOO_ENABLED=false باشد فقط Skip لاگ می‌شود)
try:
    from holoo_client import (
        holoo_products as _holoo_products,
        holoo_customers as _holoo_customers,
        holoo_login,
        holoo_invoice_create,
        holoo_preinvoice_create,
        holoo_order_create,
    )
except Exception:
    def holoo_login():
        return None
    def _holoo_products(params=None):
        return None
    def _holoo_customers(params=None):
        return None
    def holoo_invoice_create(inv):  # noqa
        return None
    def holoo_preinvoice_create(inv):  # noqa
        return None
    def holoo_order_create(inv):  # noqa
        return None


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


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by("menu_order", "name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "slug"]
    ordering_fields = ["menu_order", "name", "id"]

    def get_serializer_class(self):
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


# --- Product ---
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    پشتیبانی از:
    - GET /api/products/<slug>/          ← واکشی تکی با اسلاگ (و فالبک به id و الگوی slug-123)
    - GET /api/products/?slug=...        ← فیلتر دقیق با اسلاگ
    - GET /api/products/?id=...|&sku=... ← فیلتر دقیق با id یا SKU
    - GET /api/products/?search=...      ← جست‌وجو روی name/slug/description
    """
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "slug", "sku", "description"]
    ordering_fields = ["id", "price", "created_at"]

    def get_queryset(self):
        return (
            Product.objects.all()  # اگر فقط Activeها را می‌خواهی: .filter(is_active=True)
            .select_related("category")
            .prefetch_related(
                "gallery", "videos",
                "variants",
                "variants__color", "variants__color__attribute",
                "variants__size",  "variants__size__attribute",
            )
            .order_by("-id")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        slug   = request.query_params.get("slug")
        pid    = request.query_params.get("id") or request.query_params.get("pk")
        sku    = request.query_params.get("sku")
        search = request.query_params.get("search")

        if slug:
            qs = qs.filter(slug=slug)
        if pid:
            qs = qs.filter(pk=pid)
        if sku:
            qs = qs.filter(sku=sku)
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(slug__icontains=search) | Q(description__icontains=search)
            )

        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True, context={"request": request})
            return self.get_paginated_response(ser.data)
        ser = self.get_serializer(qs, many=True, context={"request": request})
        return Response(ser.data)

    def retrieve(self, request, *args, **kwargs):
        value = kwargs.get(self.lookup_field)
        qs = self.get_queryset()

        # 1) دقیق با اسلاگ
        obj = qs.filter(slug=value).first()

        # 2) اگر مقدار عددی بود → id
        if not obj and value and str(value).isdigit():
            obj = qs.filter(pk=value).first()

        # 3) اگر الگوی slug-123 بود → base-slug یا id
        if not obj and value:
            import re
            m = re.match(r"^(.*?)-(\d+)$", str(value))
            if m:
                base, num = m.group(1), m.group(2)
                obj = qs.filter(slug=base).first() or qs.filter(pk=num).first()

        # 4) آخرین تلاش: تطبیق دقیق روی name/slug/sku (بدون حروف بزرگ/کوچک)
        if not obj and value:
            obj = qs.filter(Q(slug__iexact=value) | Q(name__iexact=value) | Q(sku__iexact=value)).first()

        if not obj:
            raise Http404("Product not found")

        ser = self.get_serializer(obj, context={"request": request})
        return Response(ser.data)


class BundleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    پشتیبانی از:
    - GET /api/bundles/<slug>/            ← lookup با اسلاگ
    - GET /api/bundles/?slug=...          ← فیلتر دقیق
    - GET /api/bundles/?id=...            ← فیلتر بر اساس id
    - GET /api/bundles/?search=...        ← جستجو
    - و اگر اسلاگ شکل slug-1234 باشد، base-slug و id=1234 هم امتحان می‌شود.
    """
    serializer_class = BundleSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "slug"]
    ordering_fields = ["id", "bundle_price", "created_at"]

    def get_queryset(self):
        return (
            Bundle.objects.all()
            .prefetch_related(
                "products",
                Prefetch("products__gallery"),
                Prefetch("gallery"),
                Prefetch("videos"),
            )
            .order_by("-id")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        slug = request.query_params.get("slug")
        id_ = request.query_params.get("id") or request.query_params.get("pk")
        search = request.query_params.get("search")

        if slug:
            qs = qs.filter(slug=slug)
        if id_:
            qs = qs.filter(pk=id_)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(slug__icontains=search))

        ordering = request.query_params.get("ordering")
        if ordering in ("-created", "created"):
            qs = qs.order_by(("-" if ordering.startswith("-") else "") + "created_at")

        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True, context={"request": request})
            return self.get_paginated_response(ser.data)

        ser = self.get_serializer(qs, many=True, context={"request": request})
        return Response(ser.data)

    def retrieve(self, request, *args, **kwargs):
        value = kwargs.get(self.lookup_field)
        qs = self.get_queryset()

        obj = qs.filter(slug=value).first()
        if obj:
            ser = self.get_serializer(obj, context={"request": request})
            return Response(ser.data)

        import re
        m = re.match(r"^(.*?)-(\d+)$", value or "")
        if m:
            base, num = m.group(1), m.group(2)
            obj = qs.filter(slug=base).first() or qs.filter(pk=num).first()
            if obj:
                ser = self.get_serializer(obj, context={"request": request})
                return Response(ser.data)

        obj = qs.filter(Q(slug__iexact=value) | Q(title__iexact=value)).first()
        if obj:
            ser = self.get_serializer(obj, context={"request": request})
            return Response(ser.data)

        raise Http404("Bundle not found")


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


# ---------------- MenuItem View (منوی قابل مدیریت) ----------------
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def menu_view(request):
    """
    GET /api/v1/menu/
    """
    roots = MenuItem.objects.filter(is_active=True, parent__isnull=True).order_by("sort_order", "id")
    data = MenuItemSerializer(roots, many=True, context={"request": request}).data
    return Response(data)


# ---------------- Holoo proxy endpoints ----------------
@api_view(["GET"])
@permission_classes([permissions.AllowAny])  # می‌تونی در آینده به IsAdminUser تغییر بدی
def holoo_ping_view(request):
    """
    تست اتصال: اگر HOLOO_ENABLED=false باشد، Token=None برمی‌گردد.
    GET /api/holoo/ping/
    """
    token = holoo_login()
    return Response({"ok": True, "token": token}, status=200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def holoo_products_view(request):
    """
    پروکسی خواندن محصولات از هلو (فقط GET)
    GET /api/holoo/products/
    """
    params = request.query_params.dict()
    data = _holoo_products(params=params)
    return Response({"ok": True, "data": data}, status=200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def holoo_customers_view(request):
    """
    پروکسی خواندن اشخاص از هلو (فقط GET)
    GET /api/holoo/customers/
    """
    params = request.query_params.dict()
    data = _holoo_customers(params=params)
    return Response({"ok": True, "data": data}, status=200)


# ---------------- ایجاد فاکتور/پیش‌فاکتور/سفارش ----------------
def _build_detail_items(items):
    details = []
    for i, it in enumerate(items, start=1):
        details.append({
            "id": str(i),
            "ProductErpCode": it["productErpCode"],
            "few": float(it.get("few", 1)),
            "price": float(it["price"]),
            "levy": float(it.get("levy", 0)),
            "scot": float(it.get("scot", 0)),
        })
    return details


def _now_strings():
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%d"), now.strftime("%H:%M")


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def holoo_invoice_create_view(request):
    """
    ایجاد فاکتور فروش (Type=1)
    POST /api/holoo/invoice/
    body: { customerErpCode, items:[{productErpCode, few, price, levy?, scot?}], cash?, bank?, nesiyeh?, discount? }
    """
    body = request.data or {}
    customer = body.get("customerErpCode")
    items    = body.get("items") or []
    if not customer or not items:
        return Response({"ok": False, "error": "customerErpCode و items الزامی هستند"}, status=status.HTTP_400_BAD_REQUEST)

    details = _build_detail_items(items)
    cash     = float(body.get("cash", 0))
    bank     = float(body.get("bank", 0))
    nesiyeh  = float(body.get("nesiyeh", 0))
    discount = float(body.get("discount", 0))
    date_str, time_str = _now_strings()

    inv = {
        "id": "1",
        "Type": 1,  # فروش
        "customererpcode": customer,
        "date": date_str,
        "time": time_str,
        "Cash": cash,
        "Bank": bank,
        "Nesiyeh": nesiyeh,
        "Discount": discount,
        "detailinfo": details[0] if len(details) == 1 else details,
    }
    result = holoo_invoice_create(inv)
    return Response({"ok": True, "result": result}, status=200)


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def holoo_preinvoice_create_view(request):
    """
    ایجاد پیش‌فاکتور (همیشه Type=1 طبق مستند)
    POST /api/holoo/pre-invoice/
    body: { customerErpCode, items:[{productErpCode, few, price, levy?, scot?}], discount? }
    """
    body = request.data or {}
    customer = body.get("customerErpCode")
    items    = body.get("items") or []
    if not customer or not items:
        return Response({"ok": False, "error": "customerErpCode و items الزامی هستند"}, status=status.HTTP_400_BAD_REQUEST)

    details = _build_detail_items(items)
    discount = float(body.get("discount", 0))
    date_str, time_str = _now_strings()

    inv = {
        "id": "1",
        "type": 1,  # طبق مستند: نوع پیش‌فاکتور فعلاً همیشه 1
        "customererpcode": customer,
        "date": date_str,
        "time": time_str,
        "discount": discount,
        "detailinfo": {
            "id": "1",
            "type": 1,
            "ProductErpCode": details[0]["ProductErpCode"],
            "few": details[0]["few"],
            "price": details[0]["price"],
            "levy": details[0]["levy"],
            "scot": details[0]["scot"],
        } if len(details) == 1 else [
            {
                "id": d["id"], "type": 1, "ProductErpCode": d["ProductErpCode"],
                "few": d["few"], "price": d["price"], "levy": d["levy"], "scot": d["scot"]
            } for d in details
        ],
    }
    result = holoo_preinvoice_create(inv)
    return Response({"ok": True, "result": result}, status=200)


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def holoo_order_create_view(request):
    """
    ایجاد سفارش
    POST /api/holoo/order/
    body: { type(1 فروش/3 خرید), customerErpCode, items:[{productErpCode, few, price, levy?, scot?, karton?}], withDocument?, cash?, bank?, nesiyeh?, discount? }
    """
    body = request.data or {}
    order_type = int(body.get("type", 1))  # 1=سفارش فروش، 3=سفارش خرید
    customer = body.get("customerErpCode")
    items    = body.get("items") or []
    if not items:
        return Response({"ok": False, "error": "items الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

    details = []
    for i, it in enumerate(items, start=1):
        details.append({
            "id": str(i),
            "ProductErpCode": it["productErpCode"],
            "few": float(it.get("few", 1)),
            "karton": float(it.get("karton", 0)),
            "price": float(it["price"]),
            "levy": float(it.get("levy", 0)),
            "scot": float(it.get("scot", 0)),
        })

    date_str, time_str = _now_strings()
    payload = {
        "id": "1",
        "type": order_type,
        "customererpcode": customer,
        "date": date_str,
        "time": time_str,
        "detailinfo": details,
    }

    # اختیاری‌ها
    if "withDocument" in body:
        payload["withdocument"] = bool(body.get("withDocument"))
    for k_api, k_in in [("Cash", "cash"), ("Bank", "bank"), ("Nesiyeh", "nesiyeh"), ("discount", "discount")]:
        if k_in in body:
            payload[k_api] = float(body.get(k_in, 0))

    result = holoo_order_create(payload)
    return Response({"ok": True, "result": result}, status=200)
