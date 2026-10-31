from django.contrib import admin
from .models import SchoolConfig

@admin.register(SchoolConfig)
class SchoolConfigAdmin(admin.ModelAdmin):
    list_display = ("school_name", "primary_color", "pitch_preset", "is_active", "updated_at")
    list_editable = ("is_active",)
    fieldsets = (
        ("Identidade Institucional", {
            "fields": ("school_name", "tagline", "is_active")
        }),
        ("Cores da Marca", {
            "fields": ("primary_color", "secondary_color")
        }),
        ("Configurações da Quadra Oficial", {
            "fields": ("pitch_preset", "pitch_color", "pitch_area_color", "court_line_color")
        }),
        ("Logo da Equipe", {
            "fields": ("logo_url", "logo_image", "logo_opacity", "show_center_logo", "show_corner_logos")
        }),
        ("Uniformes e Times", {
            "fields": ("team_a_name", "team_a_color", "team_a_gk_color", "team_b_name", "team_b_color", "team_b_gk_color")
        }),
    )
