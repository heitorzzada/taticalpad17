from django.urls import path
from . import views

urlpatterns = [
    path("list/", views.api_list_tactical_plays, name="api_list_tactical_plays"),
    path("<int:pk>/", views.api_get_tactical_play, name="api_get_tactical_play"),
    path("save/", views.api_save_tactical_play, name="api_save_tactical_play"),
    path("delete/<int:pk>/", views.api_delete_tactical_play, name="api_delete_tactical_play"),
]
