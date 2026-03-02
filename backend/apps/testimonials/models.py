from django.db import models


class Testimonial(models.Model):
    author = models.CharField(max_length=120)
    title = models.CharField(max_length=150, blank=True)
    content = models.TextField()
    avatar = models.ImageField(upload_to="testimonials/avatars/", blank=True, null=True)
    is_active = models.BooleanField(default=True, help_text="If false the testimonial will not be shown on the public site")
    position = models.PositiveIntegerField(default=0, help_text="Order for display; lower first")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "-created_at"]
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonials"

    def __str__(self):
        return f"{self.author} — {self.title or 'testimonial'}"
