from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Avg, Count
from .models import Review
from .serializers import ReviewSerializer


class ReviewListCreateAPIView(generics.ListCreateAPIView):
    """
    GET → لیست دیدگاه‌های تأییدشده (با ?product= و/یا ?slug=)
    POST → ثبت دیدگاه جدید (به‌صورت تأییدنشده)
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Review.objects.filter(is_approved=True)  # فقط تأییدشده‌ها
        product_id = self.request.query_params.get("product")
        slug = self.request.query_params.get("slug")
        if product_id:
            qs = qs.filter(product_id=product_id)
        if slug:
            qs = qs.filter(product_slug=slug)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        stats = qs.aggregate(avg=Avg("rating"), count=Count("id"))
        serializer = self.get_serializer(qs, many=True)
        return Response({
            "results": serializer.data,
            "avg": round((stats["avg"] or 0.0), 1),
            "count": stats["count"] or 0
        })

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        # ثبت به صورت تأییدنشده
        serializer.save(is_approved=False)
        return Response(
            {"detail": "دیدگاه شما ثبت شد و پس از تأیید نمایش داده می‌شود."},
            status=status.HTTP_201_CREATED,
        )


class ReviewDestroyAPIView(generics.DestroyAPIView):
    """
    حذف دیدگاه (فقط ادمین)
    """
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAdminUser]
