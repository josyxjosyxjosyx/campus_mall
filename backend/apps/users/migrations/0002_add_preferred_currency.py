# Generated migration for adding preferred_currency field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='preferred_currency',
            field=models.CharField(
                choices=[('USD', 'US Dollar'), ('GBP', 'British Pound'), ('SLE', 'Sierra Leonean Leone')],
                default='USD',
                help_text='Preferred currency for displaying prices',
                max_length=3
            ),
        ),
    ]
