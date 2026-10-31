from django.db import models

class TacticalPlay(models.Model):
    """
    Modelo representativo de um Treino, Jogada Ensaiada ou Prancheta Tática.
    Armazena anotações pedagógicas e os dados brutos de animação (JSONField canvas_data).
    """
    CATEGORY_CHOICES = [
        ("Sub-7", "Sub-7 (Iniciação Lúdica)"),
        ("Sub-9", "Sub-9 (Coordenação & Domínio)"),
        ("Sub-11", "Sub-11 (Fundamentos & Drible)"),
        ("Sub-13", "Sub-13 (Passe & Noção Espacial)"),
        ("Sub-15", "Sub-15 (Tática Coletiva & Transições)"),
        ("Sub-17", "Sub-17 (Alto Rendimento & Sistemas)"),
        ("Adulto", "Adulto / Profissional"),
    ]

    TYPE_CHOICES = [
        ("Tática", "Tática Ofensiva / Defensiva"),
        ("Bola Parada", "Bola Parada (Falta / Escanteio / Lateral)"),
        ("Físico/Técnico", "Físico / Técnico (Circuitos e Agilidade)"),
        ("Transição", "Transição e Contra-Ataque"),
    ]

    title = models.CharField(max_length=200, verbose_name="Título do Treino")
    category = models.CharField(
        max_length=50, 
        choices=CATEGORY_CHOICES, 
        default="Sub-15", 
        verbose_name="Categoria"
    )
    type = models.CharField(
        max_length=50, 
        choices=TYPE_CHOICES, 
        default="Tática", 
        verbose_name="Tipo de Treino"
    )
    duration = models.PositiveIntegerField(default=25, verbose_name="Duração (min)")
    author = models.CharField(max_length=150, default="Comissão Técnica", verbose_name="Professor Responsável")
    
    description = models.TextField(blank=True, verbose_name="Descrição Detalhada")
    objectives = models.TextField(blank=True, verbose_name="Objetivos Principais")
    rules = models.TextField(blank=True, verbose_name="Regras e Dinâmica")
    coaching_points = models.TextField(blank=True, verbose_name="Pontos de Correção (Coaching)")
    
    view_mode = models.CharField(
        max_length=30, 
        default="horizontal", 
        choices=[
            ("horizontal", "Quadra Inteira Horizontal"),
            ("vertical", "Quadra Inteira Vertical"),
            ("half", "Meia-Quadra (Ataque / Bolas Paradas)"),
        ],
        verbose_name="Modo de Visualização"
    )
    thumbnail = models.TextField(blank=True, verbose_name="Miniatura em Base64")

    # JSONField estruturado contendo todos os quadros (keyframes), atletas, equipamentos e traços
    canvas_data = models.JSONField(
        default=dict, 
        verbose_name="Dados do Canvas e Quadros da Animação"
    )

    is_favorite = models.BooleanField(default=False, verbose_name="Favorito")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Prancheta Tática"
        verbose_name_plural = "Biblioteca de Treinos e Jogadas"
        ordering = ["-updated_at", "-created_at"]

    def __str__(self):
        return f"[{self.category}] {self.title} - {self.author}"

    def to_dict(self):
        """Converte a prancheta para formato consumível pela UI JavaScript"""
        # Extrai keyframes salvos dentro do canvas_data
        keyframes = self.canvas_data.get("keyframes", []) if isinstance(self.canvas_data, dict) else []

        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "type": self.type,
            "duration": self.duration,
            "author": self.author,
            "description": self.description,
            "objectives": self.objectives,
            "rules": self.rules,
            "coachingPoints": self.coaching_points,
            "viewMode": self.view_mode,
            "thumbnail": self.thumbnail,
            "date": self.created_at.strftime("%Y-%m-%d"),
            "keyframes": keyframes,
            "canvasData": self.canvas_data,
        }
