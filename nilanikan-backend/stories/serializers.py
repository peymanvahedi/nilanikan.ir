from rest_framework import serializers
from .models import Story
import os
from typing import Optional

def abs_url(request, url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://"):
        return url
    base = (os.getenv("PUBLIC_BASE_URL") or "").rstrip("/")
    if base:
        return f"{base}{url}"
    if request is not None:
        return request.build_absolute_uri(url)
    return url

class StorySerializer(serializers.ModelSerializer):
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = ["id", "title", "imageUrl", "link", "created_at"]

    def get_imageUrl(self, obj):
        req = self.context.get("request")
        url = getattr(getattr(obj, "image", None), "url", None)
        return abs_url(req, url) or ""
