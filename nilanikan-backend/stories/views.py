from rest_framework import viewsets
from .models import Story
from .serializers import StorySerializer

class StoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint برای نمایش آخرین 20 استوری.
    """
    serializer_class = StorySerializer

    def get_queryset(self):
        # آخرین 20 استوری براساس زمان ساخته شدن
        return Story.objects.all().order_by("-created_at")[:20]
