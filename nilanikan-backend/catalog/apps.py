from django.apps import AppConfig

class CatalogConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'catalog'

    def ready(self):
        # هنگام استارتاپ، فایل سیگنال‌ها را لود می‌کند
        import catalog.signals  # noqa: F401
