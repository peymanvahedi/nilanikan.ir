from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers, viewsets
from .models import Banner, Product, Bundle

# ==== Banner Serializer (قدیمی) ====
class BannerSerializer(serializers.ModelSerializer):
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = ["id", "image", "imageUrl", "href", "alt", "is_active", "order"]

    def get_imageUrl(self, obj):
        try:
            return obj.image.url if obj.image else None
        except Exception:
            return None


class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Banner.objects.filter(is_active=True).order_by("order", "-id")
    serializer_class = BannerSerializer


# alias
SlideViewSet = BannerViewSet


# ==== Home API ====
class HomeView(APIView):
    def get(self, request):
        # فقط محصولاتی که تیک is_recommended دارند
        products = Product.objects.filter(is_active=True, is_recommended=True)[:12]
        bundles = Bundle.objects.filter(active=True, is_recommended=True)[:12]

        def norm_product(p):
            return {
                "id": p.id,
                "title": p.name,
                "imageUrl": p.image.url if p.image else "",
                "price": float(p.discount_price or p.price or 0),
                "compareAtPrice": float(p.price) if p.discount_price else None,
                "link": f"/product/{p.slug}/",
            }

        def norm_bundle(b):
            return {
                "id": b.id,
                "title": b.title,
                "imageUrl": b.image.url if b.image else "",
                "price": float(b.bundle_price or 0),
                "compareAtPrice": None,
                "link": f"/bundle/{b.slug}/",
            }

        vip_items = [norm_product(p) for p in products] + [norm_bundle(b) for b in bundles]

        return Response({
            "vip": {
                "endsAt": None,  # اگه تایمر داری اینجا مقدار بده
                "seeAllLink": "/products?recommended=1",
                "products": vip_items,
            }
        })
