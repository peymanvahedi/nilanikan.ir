# banners/serializers.py
from rest_framework import serializers
from .models import Slide, Banner  # فرض بر این‌که Banner هم توی همین app هست

class SlideSerializer(serializers.ModelSerializer):
    # فرانت `link` می‌خواهد (نه href)
    link = serializers.CharField(source="link", required=False, allow_blank=True)
    # فرانت `imageUrl` می‌خواهد
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Slide
        fields = ["id", "title", "alt", "link", "imageUrl"]

    def get_imageUrl(self, obj):
        try:
            return obj.image.url or ""
        except Exception:
            return ""

class BannerSerializer(serializers.ModelSerializer):
    # کلیدهای موردنیاز فرانت
    imageUrl = serializers.SerializerMethodField()
    link = serializers.CharField(source="link", required=False, allow_blank=True, allow_null=True)
    subtitle = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Banner
        fields = ["id", "title", "subtitle", "link", "imageUrl"]

    def get_imageUrl(self, obj):
        try:
            return obj.image.url or ""
        except Exception:
            return ""
