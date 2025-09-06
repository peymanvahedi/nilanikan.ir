# catalog/api.py
from rest_framework import serializers, viewsets
from .models import Banner

class BannerSerializer(serializers.ModelSerializer):
    # برای راحتی فرانت، imageUrl هم برگردونیم
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = [
            "id",
            "image",     # URL فایل
            "imageUrl",  # آینه‌ی image برای سازگاری
            "href",
            "alt",
            "is_active",
            "order",
        ]

    def get_imageUrl(self, obj):
        try:
            return obj.image.url if obj.image else None
        except Exception:
            return None


class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/banners/ → لیست بنرهای فعال، مرتب‌شده
    """
    queryset = Banner.objects.filter(is_active=True).order_by("order", "-id")
    serializer_class = BannerSerializer


# ✅ برای سازگاری با import قدیمی:
# اگر جایی SlideViewSet را import کرده‌ای، همین alias جواب می‌دهد.
SlideViewSet = BannerViewSet
