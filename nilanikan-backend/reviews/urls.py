from django.urls import path
from .views import ReviewListCreateAPIView, ReviewDestroyAPIView

urlpatterns = [
    path("reviews/", ReviewListCreateAPIView.as_view(), name="review-list-create"),
    path("reviews/<int:pk>/", ReviewDestroyAPIView.as_view(), name="review-destroy"),
]
