from django.contrib import admin
from .models import TacticalPlay

@admin.register(TacticalPlay)
class TacticalPlayAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "type", "author", "duration", "view_mode", "created_at")
    list_filter = ("category", "type", "view_mode")
    search_fields = ("title", "author", "objectives", "description")
