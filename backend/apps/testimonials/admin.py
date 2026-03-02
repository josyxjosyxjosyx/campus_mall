from django.contrib import admin
from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("author", "title", "is_active", "position", "created_at")
    list_filter = ("is_active",)
    search_fields = ("author", "title", "content")
    ordering = ("position", "-created_at")
