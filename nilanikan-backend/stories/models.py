from django.db import models

class Story(models.Model):
    title = models.CharField(max_length=200)
    image = models.ImageField(upload_to="stories/")
    link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
