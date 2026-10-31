import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db.models import Q
from .models import TacticalPlay

@require_http_methods(["GET"])
def api_list_tactical_plays(request):
    """
    Retorna a lista de treinos da biblioteca com filtros opcionais.
    """
    category = request.GET.get("category", "all")
    drill_type = request.GET.get("type", "all")
    search = request.GET.get("q", "").strip()

    plays = TacticalPlay.objects.all()

    if category != "all":
        plays = plays.filter(category=category)

    if drill_type != "all":
        plays = plays.filter(type=drill_type)

    if search:
        plays = plays.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(objectives__icontains=search) |
            Q(author__icontains=search)
        )

    data = [p.to_dict() for p in plays]
    return JsonResponse({"status": "success", "data": data})

@require_http_methods(["GET"])
def api_get_tactical_play(request, pk):
    """
    Retorna os detalhes completos de um treino específico.
    """
    play = TacticalPlay.objects.filter(id=pk).first()
    if not play:
        return JsonResponse({"status": "error", "message": "Treino não encontrado."}, status=404)
    return JsonResponse({"status": "success", "data": play.to_dict()})

@require_http_methods(["POST"])
def api_save_tactical_play(request):
    """
    Salva ou atualiza um treino tático no banco de dados.
    """
    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else request.POST
        play_id = data.get("id")

        if play_id and str(play_id).isdigit():
            play = TacticalPlay.objects.filter(id=int(play_id)).first()
            if not play:
                play = TacticalPlay()
        else:
            play = TacticalPlay()

        play.title = data.get("title", "").strip() or "Treino Tático Sem Título"
        play.category = data.get("category", "Sub-15")
        play.type = data.get("type", "Tática")
        
        try:
            play.duration = int(data.get("duration", 25))
        except (ValueError, TypeError):
            play.duration = 25

        play.author = data.get("author", "").strip() or "Comissão Técnica"
        play.description = data.get("description", "").strip()
        play.objectives = data.get("objectives", "").strip()
        play.rules = data.get("rules", "").strip()
        play.coaching_points = data.get("coachingPoints", "").strip()
        play.view_mode = data.get("viewMode", "horizontal")

        if "thumbnail" in data and data["thumbnail"]:
            play.thumbnail = data["thumbnail"]

        # Monta a estrutura JSON com os quadros e entidades da prancheta
        canvas_data = data.get("canvasData") or {}
        if "keyframes" in data:
            canvas_data["keyframes"] = data["keyframes"]

        play.canvas_data = canvas_data
        play.save()

        return JsonResponse({"status": "success", "data": play.to_dict()})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)

@require_http_methods(["DELETE", "POST"])
def api_delete_tactical_play(request, pk):
    """
    Exclui um treino tático do banco de dados pelo ID.
    """
    try:
        play = TacticalPlay.objects.filter(id=pk).first()
        if not play:
            return JsonResponse({"status": "error", "message": "Treino não encontrado."}, status=404)
        
        play.delete()
        return JsonResponse({"status": "success", "message": "Treino excluído com sucesso."})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)
