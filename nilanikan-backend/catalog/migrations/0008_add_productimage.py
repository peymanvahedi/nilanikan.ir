from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0007_remove_product_images_productimage"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name="ProductImage",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("image", models.ImageField(upload_to="products/gallery/")),
                        ("alt", models.CharField(max_length=200, blank=True, null=True)),
                        (
                            "product",
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name="gallery",
                                to="catalog.product",
                            ),
                        ),
                    ],
                ),
            ],
            database_operations=[],  # 👈 دیتابیس دست نمی‌خوره
        )
    ]
