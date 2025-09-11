from django.db import models
from django.utils import timezone

class Coupon(models.Model):
    code = models.CharField(max_length=40, unique=True)
    percent_off = models.PositiveIntegerField(default=0)  # 0-100
    max_uses = models.PositiveIntegerField(default=0)  # 0 means unlimited
    used = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.code

    def is_valid(self):
        now = timezone.now()
        if not self.active: return False
        if self.starts_at and now < self.starts_at: return False
        if self.ends_at and now > self.ends_at: return False
        if self.max_uses and self.used >= self.max_uses: return False
        return True
