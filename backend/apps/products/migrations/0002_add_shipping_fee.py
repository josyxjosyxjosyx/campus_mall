# Generated migration for adding shipping_fee to Product

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='shipping_fee',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                help_text='Shipping cost for this product',
                max_digits=10,
                validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
    ]
