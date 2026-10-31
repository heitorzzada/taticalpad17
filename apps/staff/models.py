from django.db import models

class Professor(models.Model):
    """
    Modelo representativo dos Professores e Membros da Comissão Técnica.
    """
    name = models.CharField(max_length=150, verbose_name="Nome Completo")
    role = models.CharField(max_length=150, verbose_name="Cargo / Função")
    categories = models.CharField(
        max_length=200, 
        blank=True, 
        help_text="Ex: Sub-11, Sub-13, Sub-15",
        verbose_name="Categorias Atendidas"
    )
    cref = models.CharField(max_length=80, verbose_name="Registro CREF")
    licenses = models.CharField(
        max_length=250, 
        blank=True, 
        verbose_name="Formação e Licenças (CBFS/FIFA)"
    )
    experience = models.CharField(
        max_length=100, 
        blank=True, 
        verbose_name="Tempo de Experiência"
    )
    bio = models.TextField(blank=True, verbose_name="Biografia e Trajetória")
    philosophy = models.CharField(
        max_length=300, 
        blank=True, 
        verbose_name="Filosofia de Treino (Citação)"
    )
    email = models.EmailField(blank=True, verbose_name="Email de Contato")
    phone = models.CharField(max_length=50, blank=True, verbose_name="Telefone / WhatsApp")
    photo_url = models.TextField(blank=True, verbose_name="URL ou Base64 da Foto")
    photo_image = models.ImageField(
        upload_to="professors/", 
        blank=True, 
        null=True, 
        verbose_name="Arquivo da Foto"
    )
    display_order = models.PositiveIntegerField(default=0, verbose_name="Ordem de Exibição")
    is_active = models.BooleanField(default=True, verbose_name="Ativo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Professor / Treinador"
        verbose_name_plural = "Professores (Comissão Técnica)"
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"{self.name} - {self.role}"

    def get_categories_list(self):
        if not self.categories:
            return []
        return [c.strip() for c in self.categories.split(",") if c.strip()]

    def to_dict(self):
        photo = self.photo_image.url if self.photo_image else self.photo_url
        if not photo:
            photo = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80"

        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "categories": self.get_categories_list(),
            "cref": self.cref,
            "licenses": self.licenses,
            "experience": self.experience,
            "bio": self.bio,
            "philosophy": self.philosophy,
            "email": self.email,
            "phone": self.phone,
            "photoUrl": photo,
            "displayOrder": self.display_order
        }
