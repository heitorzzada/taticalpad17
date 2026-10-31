from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("api/config/", views.api_get_config, name="api_get_config"),
    path("api/config/save/", views.api_save_config, name="api_save_config"),
]
