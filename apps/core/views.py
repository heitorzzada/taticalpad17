import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import SchoolConfig

def school_config_context(request):
    """
    Context Processor que injeta a configuração ativa em todos os templates.
    """
    try:
        config = SchoolConfig.get_active_config()
        return {"school_config": config}
    except Exception:
        return {"school_config": None}

def index(request):
    """
    Renderiza a SPA completa da Prancheta Tática Futsal Pro.
    """
    config = SchoolConfig.get_active_config()
    return render(request, "core/index.html", {
        "school_config": config,
        "config_json": json.dumps(config.to_dict())
    })

@require_http_methods(["GET"])
def api_get_config(request):
    """
    Retorna a configuração ativa em formato JSON.
    """
    config = SchoolConfig.get_active_config()
    return JsonResponse({"status": "success", "data": config.to_dict()})

@require_http_methods(["POST"])
def api_save_config(request):
    """
    Salva ou atualiza a configuração da escolinha via requisição AJAX/Fetch.
    """
    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else request.POST
        config = SchoolConfig.get_active_config()

        if "schoolName" in data: config.school_name = data["schoolName"].strip()
        if "tagline" in data: config.tagline = data["tagline"].strip()
        if "primaryColor" in data: config.primary_color = data["primaryColor"]
        if "secondaryColor" in data: config.secondary_color = data["secondaryColor"]
        if "pitchPreset" in data: config.pitch_preset = data["pitchPreset"]
        if "pitchColor" in data: config.pitch_color = data["pitchColor"]
        if "pitchAreaColor" in data: config.pitch_area_color = data["pitchAreaColor"]
        if "courtLineColor" in data: config.court_line_color = data["courtLineColor"]
        if "logoUrl" in data: config.logo_url = data["logoUrl"]
        if "logoOpacity" in data: config.logo_opacity = float(data["logoOpacity"])
        if "showCornerLogos" in data: config.show_corner_logos = bool(data["showCornerLogos"])
        if "showCenterLogo" in data: config.show_center_logo = bool(data["showCenterLogo"])
        if "teamAColor" in data: config.team_a_color = data["teamAColor"]
        if "teamBColor" in data: config.team_b_color = data["teamBColor"]

        config.save()
        return JsonResponse({"status": "success", "data": config.to_dict()})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)
