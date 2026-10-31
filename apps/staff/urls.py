from django.urls import path
from . import views

urlpatterns = [
    path("list/", views.api_list_professors, name="api_list_professors"),
    path("save/", views.api_save_professor, name="api_save_professor"),
    path("delete/<int:pk>/", views.api_delete_professor, name="api_delete_professor"),
]
