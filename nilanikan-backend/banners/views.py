from rest_framework import viewsets, permissions
from .models import Slide
from .serializers import SlideSerializer

class SlideViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/slides/    → لیست اسلایدهای فعال
    GET /api/slides/ID/ → جزئیات
    """
    queryset = Slide.objects.filter(is_active=True).order_by("order", "-created_at")
    serializer_class = SlideSerializer
    permission_classes = [permissions.AllowAny]
