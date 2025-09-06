# nilanikan-backend/banners/serializers.py
from rest_framework import serializers
from .models import Slide

class SlideSerializer(serializers.ModelSerializer):
    # فرانت فیلد href می‌خواهد؛ در مدل اسمش link است
    href = serializers.CharField(source="link", required=False, allow_blank=True)
    # فرانت فیلد imageUrl می‌خواهد؛ از image.url بسازیم
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Slide
        fields = ["id", "title", "href", "alt", "imageUrl"]

    def get_imageUrl(self, obj):
        # آدرس نسبی بده تا Next از /media/ لود کند
        try:
            return obj.image.url or ""
        except Exception:
            return ""
