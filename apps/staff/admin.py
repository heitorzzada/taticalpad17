from django.contrib import admin
from .models import Professor

@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "cref", "categories", "display_order", "is_active")
    list_editable = ("display_order", "is_active")
    search_fields = ("name", "role", "cref", "categories")
    list_filter = ("is_active",)
