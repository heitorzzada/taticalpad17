from django.db import models
import os

class SchoolConfig(models.Model):
    """
    Modelo de Identidade Visual e Configurações Globais da Escolinha/Equipe.
    Permite customizar nome, cores da interface, piso da quadra e logos.
    """
    school_name = models.CharField(
        max_length=150, 
        default="Amaporã Futsal Sub-17", 
        verbose_name="Nome da Escolinha/Equipe"
    )
    tagline = models.CharField(
        max_length=250, 
        default="Categoria de Base & Alto Rendimento | Desde 2025", 
        verbose_name="Slogan / Subtítulo"
    )
    
    # Cores Institucionais
    primary_color = models.CharField(
        max_length=30, 
        default="#004AAD", 
        verbose_name="Cor Primária (Interface & Time A)"
    )
    secondary_color = models.CharField(
        max_length=30, 
        default="#FFCC00", 
        verbose_name="Cor Secundária (Destaques & Acentos)"
    )
    
    # Cores e Piso da Quadra Oficial de Futsal
    pitch_preset = models.CharField(
        max_length=50, 
        default="wood", 
        verbose_name="Preset do Piso",
        choices=[
            ("wood", "Madeira Nobre (Parquet)"),
            ("blue", "Azul Oficial (Tarasflex)"),
            ("concrete", "Cinza Concreto Polido"),
            ("green", "Verde Tradicional"),
            ("terracotta", "Terracota / Laranja"),
        ]
    )
    pitch_color = models.CharField(
        max_length=30, 
        default="#C87B2E", 
        verbose_name="Cor do Piso da Quadra"
    )
    pitch_area_color = models.CharField(
        max_length=30, 
        default="#C87B2E", 
        verbose_name="Cor da Área de Gol / Garrafão"
    )
    court_line_color = models.CharField(
        max_length=30, 
        default="#FFFFFF", 
        verbose_name="Cor das Linhas da Quadra"
    )
    
    # Logo e Visualização
    logo_url = models.TextField(
        default="/static/img/logos/amapora_sub17.png",
        blank=True, 
        verbose_name="URL ou SVG da Logo"
    )
    logo_image = models.ImageField(
        upload_to="school_logos/", 
        blank=True, 
        null=True, 
        verbose_name="Arquivo de Imagem da Logo"
    )
    logo_opacity = models.FloatField(
        default=0.65, 
        verbose_name="Opacidade da Logo Central (0.0 a 1.0)"
    )
    show_center_logo = models.BooleanField(
        default=True, 
        verbose_name="Exibir Logo Central"
    )
    show_corner_logos = models.BooleanField(
        default=True, 
        verbose_name="Exibir Logos nos Cantos da Quadra"
    )
    
    # Uniformes das Equipes
    team_a_name = models.CharField(
        max_length=100, 
        default="Amaporã Futsal", 
        verbose_name="Nome do Time Principal"
    )
    team_b_name = models.CharField(
        max_length=100, 
        default="Adversário / Colete", 
        verbose_name="Nome do Time B"
    )
    team_a_color = models.CharField(
        max_length=30, 
        default="#004AAD", 
        verbose_name="Camisa Time A"
    )
    team_b_color = models.CharField(
        max_length=30, 
        default="#DC2626", 
        verbose_name="Camisa Time B"
    )
    team_a_gk_color = models.CharField(
        max_length=30, 
        default="#10B981", 
        verbose_name="Goleiro Time A"
    )
    team_b_gk_color = models.CharField(
        max_length=30, 
        default="#F59E0B", 
        verbose_name="Goleiro Time B"
    )
    
    default_coach = models.CharField(
        max_length=100, 
        default="Prof. Lucas Silveira", 
        verbose_name="Treinador Padrão"
    )
    is_active = models.BooleanField(
        default=True, 
        verbose_name="Configuração Ativa"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuração da Escolinha"
        verbose_name_plural = "Configurações da Escolinha"

    def __str__(self):
        return f"{self.school_name} (Ativa)" if self.is_active else self.school_name

    @classmethod
    def get_active_config(cls):
        """Retorna a configuração ativa atual ou cria uma inicial baseada no .env"""
        config = cls.objects.filter(is_active=True).first()
        if not config:
            config = cls.objects.create(
                school_name=os.getenv("SCHOOL_NAME", "Falcão 12 Futsal Academy"),
                tagline=os.getenv("SCHOOL_TAGLINE", "Centro de Formação Tática & Alto Rendimento"),
                primary_color=os.getenv("PRIMARY_COLOR", "#004AAD"),
                secondary_color=os.getenv("SECONDARY_COLOR", "#FFCC00"),
                pitch_color=os.getenv("PITCH_COLOR", "#1E3A5F"),
                pitch_area_color=os.getenv("PITCH_AREA_COLOR", "#142640"),
                court_line_color=os.getenv("COURT_LINE_COLOR", "#FFFFFF"),
                is_active=True
            )
        return config

    def to_dict(self):
        """Converte para objeto compatível com o frontend JavaScript"""
        logo = ""
        if self.logo_image:
            logo = self.logo_image.url
        elif self.logo_url:
            logo = self.logo_url

        return {
            "schoolName": self.school_name,
            "tagline": self.tagline,
            "primaryColor": self.primary_color,
            "secondaryColor": self.secondary_color,
            "pitchPreset": self.pitch_preset,
            "pitchColor": self.pitch_color,
            "pitchAreaColor": self.pitch_area_color,
            "courtLineColor": self.court_line_color,
            "woodFloorUrl": "/static/img/court/wood_floor.jpg",
            "logoUrl": logo,
            "logoOpacity": self.logo_opacity,
            "showCenterLogo": self.show_center_logo,
            "showCornerLogos": self.show_corner_logos,
            "teamAName": self.team_a_name,
            "teamBName": self.team_b_name,
            "teamAColor": self.team_a_color,
            "teamBColor": self.team_b_color,
            "teamAGkColor": self.team_a_gk_color,
            "teamBGkColor": self.team_b_gk_color,
            "defaultCoach": self.default_coach,
        }
