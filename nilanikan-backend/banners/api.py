from rest_framework import serializers, viewsets
from .models import Slide

class SlideSerializer(serializers.ModelSerializer):
    # برای سازگاری با فرانت، imageUrl هم برگردانیم
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Slide
        fields = [
            "id",
            "title",
            "alt",
            "image",     # URL کامل فایل
            "imageUrl",  # برابر image (برای سازگاری)
            "link",
            "is_active",
            "order",
        ]

    def get_imageUrl(self, obj):
        try:
            return obj.image.url if obj.image else None
        except Exception:
            return None

class SlideViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Slide.objects.filter(is_active=True).order_by("order", "-created_at")
    serializer_class = SlideSerializer
