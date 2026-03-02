# Generated migration for Coupon model
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('vendors', '0001_initial'),
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Coupon',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('description', models.CharField(blank=True, max_length=200)),
                ('discount_percentage', models.PositiveIntegerField(help_text='Discount percentage (0-100)', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('max_uses', models.PositiveIntegerField(help_text='Maximum number of times coupon can be used (null = unlimited)', null=True, blank=True)),
                ('current_uses', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('start_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('end_date', models.DateTimeField(help_text='Leave empty for no expiration', null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('products', models.ManyToManyField(blank=True, help_text='Leave empty to apply to all products from this vendor', related_name='coupons', to='products.product')),
                ('vendor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='coupons', to='vendors.vendor')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='coupon',
            index=models.Index(fields=['vendor', 'is_active'], name='coupons_coup_vendor_idx'),
        ),
    ]
