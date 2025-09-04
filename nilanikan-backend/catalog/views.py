# views.py
from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from django.http import Http404
from .models import Category, Product, Bundle
from .serializers import CategorySerializer, ProductSerializer, BundleSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return bool(request.user and request.user.is_staff)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "slug"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "slug", "sku", "description"]
    ordering_fields = ["price", "created_at"]

    # دسترسی دیتیل با اسلاگ
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    lookup_value_regex = r"[-\w]+"

class BundleViewSet(viewsets.ModelViewSet):
    queryset = Bundle.objects.prefetch_related("products").all()
    serializer_class = BundleSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "slug"]

    # دسترسی دیتیل با اسلاگ + فالبک به آیدی
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    lookup_value_regex = r"[-\w]+"

    def retrieve(self, request, *args, **kwargs):
        lookup = kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        qs = self.get_queryset()

        obj = qs.filter(slug=lookup).first()
        if not obj and str(lookup).isdigit():
            obj = qs.filter(pk=int(lookup)).first()

        if not obj:
            raise Http404

        self.check_object_permissions(request, obj)
        serializer = self.get_serializer(obj)
        return Response(serializer.data)
