# banners/views.py
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Slide, Banner
from .serializers import SlideSerializer, BannerSerializer

class SlideViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/slides/    → لیست اسلایدهای فعال
    GET /api/slides/{id}/ → جزئیات اسلاید
    """
    queryset = Slide.objects.filter(is_active=True).order_by("order", "-created_at")
    serializer_class = SlideSerializer
    permission_classes = [permissions.AllowAny]

class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/banners/    → لیست بنرهای فعال
    GET /api/banners/{id}/ → جزئیات بنر
    """
    queryset = Banner.objects.filter(is_active=True).order_by("order", "-created_at")
    serializer_class = BannerSerializer
    permission_classes = [permissions.AllowAny]


class HomeAPIView(APIView):
    """
    GET /api/home/ → payload صفحه اصلی با تفکیک کامل:
      {
        "heroSlides": [...],
        "banners": [...]
        // می‌تونی بعداً stories / vip / ... رو هم اضافه کنی
      }
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        slides_qs = Slide.objects.filter(is_active=True).order_by("order", "-created_at")
        banners_qs = Banner.objects.filter(is_active=True).order_by("order", "-created_at")

        slides = SlideSerializer(slides_qs, many=True, context={"request": request}).data
        banners = BannerSerializer(banners_qs, many=True, context={"request": request}).data

        # ⛔️ اختیاری: اگر می‌خواهی هر بنری که تصویرش عین اسلاید است حذف شود (ایمنی اضافه)
        slide_imgs = {s.get("imageUrl", "") for s in slides if s.get("imageUrl")}
        banners = [b for b in banners if b.get("imageUrl") and b["imageUrl"] not in slide_imgs]

        return Response({
            "heroSlides": slides,
            "banners": banners,
            # می‌تونی بقیه فیلدها رو بعداً اضافه کنی:
            # "stories": [],
            # "vip": {"endsAt": "", "products": [], "seeAllLink": "/vip"},
            # "setsAndPuffer": {"items": []},
            # "miniLooks": [],
            # "bestSellers": [],
            # "newArrivals": [],
        })
