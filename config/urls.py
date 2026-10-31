"""
URL configuration for TacticalPad Futsal Pro.
Roteia requisições principais para os apps 'core', 'staff' e 'tactical'.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # Rotas Principais e API de Configuração Global
    path("", include("apps.core.urls")),
    
    # API da Comissão Técnica (Professores)
    path("api/staff/", include("apps.staff.urls")),
    
    # API de Pranchetas e Treinos Táticos
    path("api/tactical/", include("apps.tactical.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
