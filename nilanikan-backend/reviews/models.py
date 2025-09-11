# reviews/models.py
from django.db import models

class Review(models.Model):
    product_id = models.IntegerField(db_index=True)
    product_slug = models.SlugField(max_length=200, blank=True, null=True, db_index=True)
    name = models.CharField(max_length=120)
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)  # ⬅️ قبلاً True بود

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product_id", "is_approved"]),
            models.Index(fields=["product_slug", "is_approved"]),
        ]

    def __str__(self):
        return f"{self.product_slug or self.product_id} - {self.name} ({self.rating})"
