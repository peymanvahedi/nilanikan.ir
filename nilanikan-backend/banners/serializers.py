from rest_framework import serializers
from .models import Slide, Banner  # فرض بر این که Banner هم توی همین app هست


class SlideSerializer(serializers.ModelSerializer):
    # فرانت فیلد link و imageUrl می‌خواهد
    link = serializers.CharField(required=False, allow_blank=True, allow_null=True)
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
    # فرانت فیلدهای زیر را می‌خواهد
    link = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    subtitle = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = ["id", "title", "subtitle", "link", "imageUrl"]

    def get_imageUrl(self, obj):
        try:
            return obj.image.url or ""
        except Exception:
            return ""
