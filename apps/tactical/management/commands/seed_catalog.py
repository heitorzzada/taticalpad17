import json
from django.core.management.base import BaseCommand
from apps.core.models import SchoolConfig
from apps.staff.models import Professor
from apps.tactical.models import TacticalPlay

# SVG padrão da Logo oficial da escolinha
DEFAULT_CREST_SVG = """data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23004AAD" />
      <stop offset="100%" stop-color="%23002661" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23FFEA75" />
      <stop offset="50%" stop-color="%23FFCC00" />
      <stop offset="100%" stop-color="%23D49B00" />
    </linearGradient>
  </defs>
  <path d="M100 12 L175 38 C175 125, 100 178, 100 188 C100 178, 25 125, 25 38 Z" fill="url(%23shieldGrad)" stroke="url(%23goldGrad)" stroke-width="7" stroke-linejoin="round" />
  <path d="M100 24 L163 46 C163 118, 100 165, 100 173 C100 165, 37 118, 37 46 Z" fill="none" stroke="%23FFCC00" stroke-width="2" opacity="0.6"/>
  <path d="M37 75 Q100 95 163 75 L163 95 Q100 115 37 95 Z" fill="%23FFCC00" opacity="0.25"/>
  <g transform="translate(100, 95)">
    <circle cx="0" cy="0" r="34" fill="%23FFFFFF" stroke="%231E293B" stroke-width="3"/>
    <polygon points="0,-12 11,-4 7,9 -7,9 -11,-4" fill="%23004AAD"/>
    <line x1="0" y1="-12" x2="0" y2="-34" stroke="%231E293B" stroke-width="2.5"/>
    <line x1="11" y1="-4" x2="31" y2="-12" stroke="%231E293B" stroke-width="2.5"/>
    <line x1="7" y1="9" x2="22" y2="26" stroke="%231E293B" stroke-width="2.5"/>
    <line x1="-7" y1="9" x2="-22" y2="26" stroke="%231E293B" stroke-width="2.5"/>
    <line x1="-11" y1="-4" x2="-31" y2="-12" stroke="%231E293B" stroke-width="2.5"/>
  </g>
  <polygon points="100,32 103,40 112,40 105,45 107,53 100,48 93,53 95,45 88,40 97,40" fill="url(%23goldGrad)"/>
  <polygon points="80,36 82,42 88,42 83,46 85,52 80,48 75,52 77,46 72,42 78,42" fill="url(%23goldGrad)" opacity="0.8"/>
  <polygon points="120,36 122,42 128,42 123,46 125,52 120,48 115,52 117,46 112,42 118,42" fill="url(%23goldGrad)" opacity="0.8"/>
  <text x="100" y="152" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="%23FFCC00" text-anchor="middle" letter-spacing="3">FUTSAL</text>
  <text x="100" y="167" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="%23FFFFFF" text-anchor="middle" letter-spacing="2">ACADEMY</text>
</svg>"""

class Command(BaseCommand):
    help = "Popula o banco de dados com a identidade da escolinha, professores e sistemas táticos de futsal"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Iniciando seed do banco de dados TacticalPad Futsal Pro..."))

        # 1. Configuração da Escolinha
        self.seed_school_config()

        # 2. Comissão Técnica (Professores)
        self.seed_professors()

        # 3. Treinos Táticos com Animações Quadro a Quadro
        self.seed_tactical_plays()

        self.stdout.write(self.style.SUCCESS("[OK] Seed concluído com sucesso! Banco pronto para uso."))

    def seed_school_config(self):
        config, created = SchoolConfig.objects.get_or_create(
            is_active=True,
            defaults={
                "school_name": "Amaporã Futsal Sub-17",
                "tagline": "Categoria de Base & Alto Rendimento | Desde 2025",
                "primary_color": "#0066CC",
                "secondary_color": "#38BDF8",
                "pitch_preset": "wood",
                "pitch_color": "#C87B2E",
                "pitch_area_color": "#C87B2E",
                "court_line_color": "#FFFFFF",
                "logo_url": "/static/img/logos/amapora_sub17.png",
                "logo_opacity": 0.65,
                "show_center_logo": True,
                "show_corner_logos": True,
                "team_a_name": "Amaporã Futsal",
                "team_b_name": "Adversário",
                "team_a_color": "#0066CC",
                "team_b_color": "#DC2626",
                "team_a_gk_color": "#10B981",
                "team_b_gk_color": "#F59E0B",
                "default_coach": "Prof. Fawller Augusti"
            }
        )
        if not created and not config.logo_url:
            config.logo_url = "/static/img/logos/amapora_sub17.png"
            config.save()
        self.stdout.write(self.style.SUCCESS(f"  [OK] Configuração da Escolinha: '{config.school_name}'"))

    def seed_professors(self):
        coaches_data = [
            {
                "name": "Prof. Fawller Augusti",
                "role": "Técnico Principal",
                "categories": "Todas as Categorias, Sub-7, Sub-9, Sub-11, Sub-13, Sub-15, Sub-17, Adulto",
                "cref": "CREF 089412-G/SP",
                "licenses": "Licença A Treinador CBFS/FIFA | Especialista em Metodologia de Futsal",
                "experience": "Treinador Principal",
                "photo_url": "/static/img/professors/fawller_augusti.png",
                "photo_image": "professors/fawller_augusti.png",
                "bio": "Treinador principal com ampla liderança e atuação no desenvolvimento técnico, tático e disciplinar de atletas em todas as categorias da escolinha.",
                "philosophy": "Disciplina tática, intensidade e paixão pelo jogo formam atletas vencedores.",
                "email": "fawller.augusti@falcaofutsal.com.br",
                "phone": "(11) 98888-5522",
                "display_order": 1
            },
            {
                "name": "Prof. Lucas 'Falcão' Silveira",
                "role": "Coordenador Técnico & Treinador Adjunto",
                "categories": "Sub-15, Sub-17, Adulto",
                "cref": "CREF 034891-G/SP",
                "licenses": "Licença PRO Futsal CBFS | Pós em Fisiologia do Exercício",
                "experience": "14 anos de experiência",
                "photo_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
                "bio": "Ex-atleta profissional com passagens por ligas nacionais e internacionais. Foco no desenvolvimento do raciocínio rápido sob pressão, tomada de decisão inteligente e transições letais.",
                "philosophy": "'O futsal moderno exige atletas cognitivos que enxergam o espaço antes da bola chegar.'",
                "email": "lucas.silveira@falcaofutsal.com.br",
                "phone": "(11) 98765-4321",
                "display_order": 2
            },
            {
                "name": "Profª. Mariana Castro",
                "role": "Treinadora de Base & Especialista em Iniciação",
                "categories": "Sub-7, Sub-9, Sub-11, Sub-13",
                "cref": "CREF 078234-G/SP",
                "licenses": "Mestre em Ciências do Movimento | Certificação Barça Innovation Hub",
                "experience": "9 anos de formação de jovens",
                "photo_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80",
                "bio": "Especialista em psicomotricidade infantil, desenvolvimento de habilidades motoras fundamentais e ludicidade aplicada à inteligência tática do futsal.",
                "philosophy": "'Na base, a técnica não é fim, é instrumento para a criança expressar sua criatividade e alegria de jogar.'",
                "email": "mariana.castro@falcaofutsal.com.br",
                "phone": "(11) 97654-3210",
                "display_order": 3
            },
            {
                "name": "Prof. Rodrigo 'Muralha' Rocha",
                "role": "Preparador Específico de Goleiros & Análise de Desempenho",
                "categories": "Todas as Categorias, Goleiros",
                "cref": "CREF 051902-G/SP",
                "licenses": "Especialista em Biomecânica da Defesa | Licença A Treinador de Goleiros",
                "experience": "12 anos no alto rendimento",
                "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
                "bio": "Trabalho detalhado de postura em 'X', cruz de braços, velocidade de reação, leitura de finalizações e atuação moderna do goleiro como 5º homem de linha (saída de bola com os pés).",
                "philosophy": "'O goleiro de futsal é o primeiro armador do time e o último guardião da meta.'",
                "email": "rodrigo.muralha@falcaofutsal.com.br",
                "phone": "(11) 96543-2109",
                "display_order": 4
            }
        ]

        count = 0
        for data in coaches_data:
            p, created = Professor.objects.update_or_create(
                cref=data["cref"],
                defaults=data
            )
            count += 1
        self.stdout.write(self.style.SUCCESS(f"  [OK] {count} Professores cadastrados na Comissão Técnica."))

    def seed_tactical_plays(self):
        # 1. Sistema 3-1 Padrão
        frame_3_1_a = {
            "id": "frame-1",
            "label": "Quadro 1: Organização 3-1",
            "duration": 1.8,
            "players": [
                {"id": "ta-gk", "team": "A", "isGk": True, "number": 1, "name": "Goleiro", "x": 100, "y": 250, "angle": 0},
                {"id": "ta-fixo", "team": "A", "isGk": False, "number": 3, "name": "Fixo", "x": 240, "y": 250, "angle": 0},
                {"id": "ta-ala-e", "team": "A", "isGk": False, "number": 7, "name": "Ala Esq", "x": 360, "y": 120, "angle": 0},
                {"id": "ta-ala-d", "team": "A", "isGk": False, "number": 10, "name": "Ala Dir", "x": 360, "y": 380, "angle": 0},
                {"id": "ta-pivo", "team": "A", "isGk": False, "number": 9, "name": "Pivô", "x": 480, "y": 250, "angle": 0},
                {"id": "tb-pivo", "team": "B", "isGk": False, "number": 9, "name": "Marcador", "x": 560, "y": 250, "angle": 3.14},
                {"id": "tb-ala-e", "team": "B", "isGk": False, "number": 11, "name": "Ala Adv", "x": 660, "y": 130, "angle": 3.14},
                {"id": "tb-ala-d", "team": "B", "isGk": False, "number": 8, "name": "Ala Adv", "x": 660, "y": 370, "angle": 3.14},
                {"id": "tb-fixo", "team": "B", "isGk": False, "number": 4, "name": "Fixo Adv", "x": 760, "y": 250, "angle": 3.14},
                {"id": "tb-gk", "team": "B", "isGk": True, "number": 12, "name": "Goleiro Adv", "x": 910, "y": 250, "angle": 3.14}
            ],
            "balls": [{"id": "ball-1", "x": 260, "y": 250, "radius": 11}],
            "equipment": [],
            "drawings": [
                {"id": "d1", "type": "arrow_dashed", "startX": 260, "startY": 250, "endX": 380, "endY": 370, "color": "#FFCC00"},
                {"id": "d2", "type": "arrow_solid", "startX": 480, "startY": 250, "endX": 530, "endY": 340, "color": "#FFFFFF"}
            ]
        }
        frame_3_1_b = {
            "id": "frame-2",
            "label": "Quadro 2: Apoio e Escora do Pivô",
            "duration": 1.8,
            "players": [
                {"id": "ta-gk", "team": "A", "isGk": True, "number": 1, "name": "Goleiro", "x": 120, "y": 250, "angle": 0},
                {"id": "ta-fixo", "team": "A", "isGk": False, "number": 3, "name": "Fixo", "x": 280, "y": 210, "angle": 0.3},
                {"id": "ta-ala-e", "team": "A", "isGk": False, "number": 7, "name": "Ala Esq", "x": 420, "y": 90, "angle": 0.2},
                {"id": "ta-ala-d", "team": "A", "isGk": False, "number": 10, "name": "Ala Dir", "x": 460, "y": 390, "angle": 0},
                {"id": "ta-pivo", "team": "A", "isGk": False, "number": 9, "name": "Pivô", "x": 580, "y": 310, "angle": -0.6},
                {"id": "tb-pivo", "team": "B", "isGk": False, "number": 9, "name": "Marcador", "x": 510, "y": 290, "angle": 3.14},
                {"id": "tb-ala-e", "team": "B", "isGk": False, "number": 11, "name": "Ala Adv", "x": 620, "y": 150, "angle": 3.14},
                {"id": "tb-ala-d", "team": "B", "isGk": False, "number": 8, "name": "Ala Adv", "x": 540, "y": 410, "angle": 3.14},
                {"id": "tb-fixo", "team": "B", "isGk": False, "number": 4, "name": "Fixo Adv", "x": 680, "y": 280, "angle": 3.14},
                {"id": "tb-gk", "team": "B", "isGk": True, "number": 12, "name": "Goleiro Adv", "x": 910, "y": 250, "angle": 3.14}
            ],
            "balls": [{"id": "ball-1", "x": 475, "y": 385, "radius": 11}],
            "equipment": [],
            "drawings": []
        }

        # 2. Saída de Bola 4-0
        frame_4_0_a = {
            "id": "frame-1",
            "label": "Quadro 1: Formação 4-0",
            "duration": 1.8,
            "players": [
                {"id": "ta-gk", "team": "A", "isGk": True, "number": 1, "name": "Goleiro", "x": 90, "y": 250, "angle": 0},
                {"id": "ta-ala-e", "team": "A", "isGk": False, "number": 7, "name": "Ala Esq", "x": 300, "y": 90, "angle": 0},
                {"id": "ta-fixo-e", "team": "A", "isGk": False, "number": 5, "name": "Central 1", "x": 260, "y": 195, "angle": 0},
                {"id": "ta-fixo-d", "team": "A", "isGk": False, "number": 3, "name": "Central 2", "x": 260, "y": 305, "angle": 0},
                {"id": "ta-ala-d", "team": "A", "isGk": False, "number": 10, "name": "Ala Dir", "x": 300, "y": 410, "angle": 0},
                {"id": "tb-1", "team": "B", "isGk": False, "number": 9, "name": "Press 1", "x": 420, "y": 180, "angle": 3.14},
                {"id": "tb-2", "team": "B", "isGk": False, "number": 10, "name": "Press 2", "x": 420, "y": 320, "angle": 3.14},
                {"id": "tb-3", "team": "B", "isGk": False, "number": 4, "name": "Fixo Adv", "x": 580, "y": 250, "angle": 3.14},
                {"id": "tb-gk", "team": "B", "isGk": True, "number": 1, "name": "Goleiro Adv", "x": 900, "y": 250, "angle": 3.14}
            ],
            "balls": [{"id": "ball-1", "x": 275, "y": 195, "radius": 11}],
            "equipment": [],
            "drawings": [
                {"id": "d1", "type": "arrow_dashed", "startX": 275, "startY": 195, "endX": 310, "endY": 90, "color": "#FFCC00"},
                {"id": "d2", "type": "arrow_solid", "startX": 260, "startY": 195, "endX": 450, "endY": 210, "color": "#FFFFFF"}
            ]
        }
        frame_4_0_b = {
            "id": "frame-2",
            "label": "Quadro 2: Infiltração 'Passe e Vai'",
            "duration": 1.8,
            "players": [
                {"id": "ta-gk", "team": "A", "isGk": True, "number": 1, "name": "Goleiro", "x": 100, "y": 250, "angle": 0},
                {"id": "ta-ala-e", "team": "A", "isGk": False, "number": 7, "name": "Ala Esq", "x": 380, "y": 80, "angle": 0.4},
                {"id": "ta-fixo-e", "team": "A", "isGk": False, "number": 5, "name": "Central 1", "x": 540, "y": 180, "angle": 0},
                {"id": "ta-fixo-d", "team": "A", "isGk": False, "number": 3, "name": "Central 2", "x": 310, "y": 260, "angle": 0},
                {"id": "ta-ala-d", "team": "A", "isGk": False, "number": 10, "name": "Ala Dir", "x": 320, "y": 420, "angle": 0},
                {"id": "tb-1", "team": "B", "isGk": False, "number": 9, "name": "Press 1", "x": 440, "y": 130, "angle": 3.14},
                {"id": "tb-2", "team": "B", "isGk": False, "number": 10, "name": "Press 2", "x": 400, "y": 280, "angle": 3.14},
                {"id": "tb-3", "team": "B", "isGk": False, "number": 4, "name": "Fixo Adv", "x": 590, "y": 220, "angle": 3.14},
                {"id": "tb-gk", "team": "B", "isGk": True, "number": 1, "name": "Goleiro Adv", "x": 900, "y": 250, "angle": 3.14}
            ],
            "balls": [{"id": "ball-1", "x": 395, "y": 85, "radius": 11}],
            "equipment": [],
            "drawings": []
        }

        # 3. Marcação Quadrado 2-2
        frame_2_2_a = {
            "id": "frame-1",
            "label": "Quadro 1: Bloco Médio 2-2",
            "duration": 1.8,
            "players": [
                {"id": "tb-gk", "team": "B", "isGk": True, "number": 1, "name": "Goleiro", "x": 920, "y": 250, "angle": 3.14},
                {"id": "tb-def-1", "team": "B", "isGk": False, "number": 3, "name": "Def 1", "x": 750, "y": 160, "angle": 3.14},
                {"id": "tb-def-2", "team": "B", "isGk": False, "number": 4, "name": "Def 2", "x": 750, "y": 340, "angle": 3.14},
                {"id": "tb-atk-1", "team": "B", "isGk": False, "number": 7, "name": "Atk 1", "x": 620, "y": 160, "angle": 3.14},
                {"id": "tb-atk-2", "team": "B", "isGk": False, "number": 9, "name": "Atk 2", "x": 620, "y": 340, "angle": 3.14},
                {"id": "ta-fixo", "team": "A", "isGk": False, "number": 8, "name": "Armador", "x": 420, "y": 250, "angle": 0},
                {"id": "ta-ala-e", "team": "A", "isGk": False, "number": 11, "name": "Ala Esq", "x": 520, "y": 100, "angle": 0},
                {"id": "ta-ala-d", "team": "A", "isGk": False, "number": 10, "name": "Ala Dir", "x": 520, "y": 400, "angle": 0}
            ],
            "balls": [{"id": "ball-1", "x": 440, "y": 250, "radius": 11}],
            "equipment": [],
            "drawings": [
                {"id": "d1", "type": "zone_rect", "startX": 590, "startY": 130, "endX": 780, "endY": 370, "color": "#DC2626"}
            ]
        }
        frame_2_2_b = {
            "id": "frame-2",
            "label": "Quadro 2: Balanço Defensivo Lateral",
            "duration": 1.8,
            "players": [
                {"id": "tb-gk", "team": "B", "isGk": True, "number": 1, "name": "Goleiro", "x": 920, "y": 230, "angle": 3.14},
                {"id": "tb-def-1", "team": "B", "isGk": False, "number": 3, "name": "Def 1", "x": 740, "y": 120, "angle": 3.14},
                {"id": "tb-def-2", "team": "B", "isGk": False, "number": 4, "name": "Def 2", "x": 760, "y": 270, "angle": 3.14},
                {"id": "tb-atk-1", "team": "B", "isGk": False, "number": 7, "name": "Atk 1", "x": 590, "y": 110, "angle": 3.14},
                {"id": "tb-atk-2", "team": "B", "isGk": False, "number": 9, "name": "Atk 2", "x": 640, "y": 260, "angle": 3.14},
                {"id": "ta-fixo", "team": "A", "isGk": False, "number": 8, "name": "Armador", "x": 450, "y": 210, "angle": 0},
                {"id": "ta-ala-e", "team": "A", "isGk": False, "number": 11, "name": "Ala Esq", "x": 570, "y": 90, "angle": 0},
                {"id": "ta-ala-d", "team": "A", "isGk": False, "number": 10, "name": "Ala Dir", "x": 500, "y": 380, "angle": 0}
            ],
            "balls": [{"id": "ball-1", "x": 585, "y": 95, "radius": 11}],
            "equipment": [],
            "drawings": []
        }

        # 4. Goleiro-Linha 5x4
        frame_5x4_a = {
            "id": "frame-1",
            "label": "Quadro 1: Estrutura em 'W' no Ataque",
            "duration": 1.8,
            "players": [
                {"id": "ta-gk", "team": "A", "isGk": True, "number": 1, "name": "Gol-Linha", "x": 640, "y": 250, "angle": 0},
                {"id": "ta-1", "team": "A", "isGk": False, "number": 10, "name": "Ala Dir", "x": 730, "y": 360, "angle": 0},
                {"id": "ta-2", "team": "A", "isGk": False, "number": 7, "name": "Ala Esq", "x": 730, "y": 140, "angle": 0},
                {"id": "ta-3", "team": "A", "isGk": False, "number": 9, "name": "Pivô Fundo 1", "x": 860, "y": 110, "angle": 0},
                {"id": "ta-4", "team": "A", "isGk": False, "number": 11, "name": "Pivô Fundo 2", "x": 860, "y": 390, "angle": 0},
                {"id": "tb-def-1", "team": "B", "isGk": False, "number": 3, "name": "Losango 1", "x": 780, "y": 190, "angle": 3.14},
                {"id": "tb-def-2", "team": "B", "isGk": False, "number": 4, "name": "Losango 2", "x": 780, "y": 310, "angle": 3.14},
                {"id": "tb-def-3", "team": "B", "isGk": False, "number": 5, "name": "Losango 3", "x": 840, "y": 250, "angle": 3.14},
                {"id": "tb-gk", "team": "B", "isGk": True, "number": 12, "name": "Goleiro Adv", "x": 920, "y": 250, "angle": 3.14}
            ],
            "balls": [{"id": "ball-1", "x": 655, "y": 250, "radius": 11}],
            "equipment": [],
            "drawings": [
                {"id": "d1", "type": "arrow_dashed", "startX": 655, "startY": 250, "endX": 730, "endY": 350, "color": "#FFCC00"}
            ]
        }
        frame_5x4_b = {
            "id": "frame-2",
            "label": "Quadro 2: Passe na Paralela e Finalização",
            "duration": 1.8,
            "players": [
                {"id": "ta-gk", "team": "A", "isGk": True, "number": 1, "name": "Gol-Linha", "x": 660, "y": 230, "angle": 0},
                {"id": "ta-1", "team": "A", "isGk": False, "number": 10, "name": "Ala Dir", "x": 770, "y": 380, "angle": 0},
                {"id": "ta-2", "team": "A", "isGk": False, "number": 7, "name": "Ala Esq", "x": 750, "y": 120, "angle": 0},
                {"id": "ta-3", "team": "A", "isGk": False, "number": 9, "name": "Pivô Fundo 1", "x": 880, "y": 170, "angle": 0},
                {"id": "ta-4", "team": "A", "isGk": False, "number": 11, "name": "Pivô Fundo 2", "x": 890, "y": 330, "angle": -0.5},
                {"id": "tb-def-1", "team": "B", "isGk": False, "number": 3, "name": "Losango 1", "x": 800, "y": 210, "angle": 3.14},
                {"id": "tb-def-2", "team": "B", "isGk": False, "number": 4, "name": "Losango 2", "x": 820, "y": 330, "angle": 3.14},
                {"id": "tb-def-3", "team": "B", "isGk": False, "number": 5, "name": "Losango 3", "x": 860, "y": 270, "angle": 3.14},
                {"id": "tb-gk", "team": "B", "isGk": True, "number": 12, "name": "Goleiro Adv", "x": 920, "y": 270, "angle": 3.14}
            ],
            "balls": [{"id": "ball-1", "x": 885, "y": 320, "radius": 11}],
            "equipment": [],
            "drawings": [
                {"id": "d2", "type": "arrow_dashed", "startX": 885, "startY": 320, "endX": 960, "endY": 250, "color": "#FFCC00"}
            ]
        }

        plays_data = [
            {
                "title": "Sistema 3-1 Padrão: Rotação de Ala e Apoio do Pivô",
                "category": "Sub-15",
                "type": "Tática",
                "duration": 25,
                "author": "Prof. Lucas Silveira",
                "description": "Desenvolvimento do sistema 3-1 oficial com movimentação em faca do pivô e infiltração rápida do ala oposto.",
                "objectives": "Desmarcar sob pressão, criar linha de passe diagonal limpa e suporte imediato para finalização.",
                "rules": "Máximo de 2 toques por atleta na primeira linha de construção; finalizar em até 6 segundos.",
                "coaching_points": "Orientação corporal perfilada antes de receber; tempo de bola do pivô ao pedir no pé.",
                "view_mode": "horizontal",
                "canvas_data": {
                    "keyframes": [frame_3_1_a, frame_3_1_b]
                }
            },
            {
                "title": "Saída de Bola 4-0 com Infiltração 'Passe e Vai'",
                "category": "Sub-17",
                "type": "Tática",
                "duration": 30,
                "author": "Prof. Lucas Silveira",
                "description": "Construção ofensiva em linha de 4 sem pivô fixo para quebrar a primeira linha de marcação alta adversária.",
                "objectives": "Atrair a pressão adversária, circular com velocidade e atacar o espaço nas costas da defesa.",
                "rules": "Ao realizar o passe, atleta deve infiltrar imediatamente no corredor central ou fundo de quadra.",
                "coaching_points": "Troca de ritmo ao acelerar para o espaço vazio; precisão no passe rasteiro forte.",
                "view_mode": "horizontal",
                "canvas_data": {
                    "keyframes": [frame_4_0_a, frame_4_0_b]
                }
            },
            {
                "title": "Marcação Quadrado 2-2: Bloco Compacto e Cobertura",
                "category": "Sub-13",
                "type": "Tática",
                "duration": 20,
                "author": "Profª. Mariana Castro",
                "description": "Organização defensiva zonal em bloco médio. Equipe se desloca compactada como uma unidade conforme a bola viaja.",
                "objectives": "Fechar o meio da quadra, induzir o passe adversário para a lateral e realizar coberturas automáticas.",
                "rules": "Nenhum jogador pode ser ultrapassado no um contra um sem que o parceiro de linha ofereça cobertura.",
                "coaching_points": "Comunicação constante; postura baixa com centro de gravidade firme; pernas flexionadas.",
                "view_mode": "horizontal",
                "canvas_data": {
                    "keyframes": [frame_2_2_a, frame_2_2_b]
                }
            },
            {
                "title": "Goleiro-Linha 5x4: Circulação em W e Finalização no Segundo Pau",
                "category": "Adulto",
                "type": "Tática",
                "duration": 25,
                "author": "Prof. Rodrigo Rocha",
                "description": "Sistema de ataque em superioridade numérica 5x4 com goleiro avançado atuando como quinto homem de linha.",
                "objectives": "Paciência na circulação rápida, alargar o quadrado defensivo adversário e encontrar a diagonal na segunda trave.",
                "rules": "Proibido passe arriscado pelo centro sem cobertura; recuperação imediata em caso de finalização bloqueada.",
                "coaching_points": "Alas bem colados na linha lateral para ampliar o campo; passe firme no pé de apoio do companheiro.",
                "view_mode": "half",
                "canvas_data": {
                    "keyframes": [frame_5x4_a, frame_5x4_b]
                }
            }
        ]

        for data in plays_data:
            play, created = TacticalPlay.objects.update_or_create(
                title=data["title"],
                defaults=data
            )
            self.stdout.write(self.style.SUCCESS(f"  [OK] Prancheta Tática: '{play.title}' ({play.category})"))
