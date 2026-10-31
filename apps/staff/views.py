import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Professor

@require_http_methods(["GET"])
def api_list_professors(request):
    """
    Retorna a lista de professores da comissão técnica em formato JSON.
    """
    professors = Professor.objects.filter(is_active=True).order_by("display_order", "id")
    data = [p.to_dict() for p in professors]
    return JsonResponse({"status": "success", "data": data})

@require_http_methods(["POST"])
def api_save_professor(request):
    """
    Cadastra ou atualiza um professor via requisição AJAX/Fetch.
    """
    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else request.POST
        prof_id = data.get("id")

        categories_val = data.get("categories", "")
        if isinstance(categories_val, list):
            categories_str = ", ".join(categories_val)
        else:
            categories_str = str(categories_val)

        if prof_id and str(prof_id).isdigit():
            professor = Professor.objects.filter(id=int(prof_id)).first()
            if not professor:
                professor = Professor()
        else:
            professor = Professor()

        professor.name = data.get("name", "").strip() or "Professor"
        professor.role = data.get("role", "").strip() or "Treinador"
        professor.categories = categories_str
        professor.cref = data.get("cref", "").strip()
        professor.licenses = data.get("licenses", "").strip()
        professor.experience = data.get("experience", "").strip()
        professor.bio = data.get("bio", "").strip()
        professor.philosophy = data.get("philosophy", "").strip()
        professor.email = data.get("email", "").strip()
        professor.phone = data.get("phone", "").strip()
        
        if "photoUrl" in data and data["photoUrl"]:
            professor.photo_url = data["photoUrl"]

        professor.save()
        return JsonResponse({"status": "success", "data": professor.to_dict()})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)

@require_http_methods(["DELETE", "POST"])
def api_delete_professor(request, pk):
    """
    Remove ou desativa um professor pelo ID.
    """
    try:
        professor = Professor.objects.filter(id=pk).first()
        if not professor:
            return JsonResponse({"status": "error", "message": "Professor não encontrado."}, status=404)
        
        professor.delete()
        return JsonResponse({"status": "success", "message": "Professor removido com sucesso."})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)
