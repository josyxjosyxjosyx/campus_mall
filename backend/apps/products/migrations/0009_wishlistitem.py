from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = False

    dependencies = [
        ('products', '0008_merge_0002_add_shipping_fee_0007_category_image'),
        ('users', '0004_remove_address_street_address_address_address_line1_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='WishlistItem',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='wishlisted_by', to='products.product')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='wishlist', to='users.user')),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('user', 'product')},
            },
        ),
    ]
