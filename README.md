# ⚽ TacticalPad Futsal Pro (Django MVT + API + CSS Puro Modular)

> **Aplicação Web Completa de Prancheta Tática, Análise de Desempenho e Gestão de Treinos para Escolinhas de Futsal.**
> Arquitetura moderna em **Python / Django (MVT + REST API)**, **CSS3 Modular baseado em Variáveis (`:root`)**, **Automação via Agentes Antigravity (`.agents/skills/`)** e suporte a deploy na **Vercel** com **WhiteNoise**.

---

## 🚀 Como Executar o Projeto

### 1. Inicializar o Ambiente e Banco de Dados
O projeto já conta com o SQLite configurado e o catálogo de dados pronto para ser populado:

```bash
# 1. Aplicar migrações do banco de dados
python manage.py migrate

# 2. Executar o comando customizado que popula o catálogo inicial
python manage.py seed_catalog
```

### 2. Iniciar o Servidor de Desenvolvimento
```bash
python manage.py runserver 8000
```
Acesse no seu navegador:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 🏛️ 1. Arquitetura Back-End em Django (MVT + API)

O projeto está organizado no padrão Django corporativo com 3 aplicativos especializados:

- **`config/`:** Configurações do projeto (`settings.py`, `urls.py`, `wsgi.py`, `asgi.py`).
- **`apps/core/`:**
  - Model `SchoolConfig`: Identidade visual completa (nome da escolinha, slogan, cores primária/secundária, cores do piso da quadra, uniformes e logo oficial).
  - Rotas e Context Processor injetando as configurações automaticamente nos templates.
  - Endpoints: `GET /api/config/` e `POST /api/config/save/`.
- **`apps/staff/`:**
  - Model `Professor`: Comissão técnica com nome, cargo, categorias atendidas, CREF, licenças CBFS/FIFA, biografia, filosofia de treino, foto e ordem de exibição.
  - Endpoints: `GET /api/staff/list/`, `POST /api/staff/save/`, `POST /api/staff/delete/<id>/`.
  - Integrado ao Django Admin (`/admin/`).
- **`apps/tactical/`:**
  - Model `TacticalPlay`: Pranchetas táticas com título, categoria (Sub-7 ao Adulto), tipo (Tática, Bola Parada, Físico/Técnico), duração, autor e o campo `canvas_data` (`JSONField`) que armazena todas as coordenadas de quadros da animação, atletas, equipamentos e desenhos.
  - Endpoints: `GET /api/tactical/list/`, `GET /api/tactical/<id>/`, `POST /api/tactical/save/`, `POST /api/tactical/delete/<id>/`.
  - Comando customizado: `python manage.py seed_catalog`.

---

## 🎨 2. Arquitetura CSS3 Puro Modular

O projeto adota uma arquitetura de Design System limpa em `static/css/`, sem dependências engessadas:

1. **`static/css/variables.css`:** Declaração de todas as Custom Properties (`:root`), incluindo `--primary-color`, `--secondary-color`, `--court-floor`, `--court-lines`, `--bg-dark`, sombras, raios e tipografia.
2. **`static/css/base.css`:** Reset global, tipografia (Outfit + Inter), scrollbars esportivas customizadas e layout base.
3. **`static/css/components.css`:** Botões de ferramentas com estados ativo/inativo, badges de turmas (Sub-7 a Adulto), cards dos professores, modais com glassmorphism e notificações toast.
4. **`static/css/tacticalpad.css`:** Grid da prancheta tática travado na viewport (`100vh overflow-hidden`), barra de ferramentas de desenho, área central do Canvas de alta resolução e timeline de quadros (keyframes).

### JavaScript Modular em `static/js/`
- **`api.js`:** Cliente HTTP Fetch com extração automática e injeção do cabeçalho `X-CSRFToken`.
- **`court.js`:** `PitchRenderer` oficial FIFA/CBFS (proporções 40m x 20m, traves 3m com rede 3D, linhas de 6m e 10m, texturas de madeira/parquet e logo da escolinha).
- **`players.js`:** Gerenciador de atletas, alça de rotação corporal, drag & drop, materiais de treino e formações táticas (`3-1`, `4-0`, `2-2`, `1-2-1`, `5x4 Goleiro-Linha`, `Defesa em Zona`).
- **`drawings.js`:** Ferramentas táticas (seta contínua, tracejada, ondulada de drible, T-bar de bloqueio, zonas táticas, borracha e undo/redo).
- **`timeline.js`:** `AnimationEngine` com interpolação suave (tweening), controles de reprodução (Play, Pause, Loop, Velocidade) e rastros de movimento (Ghost Trails).
- **`app.js`:** Controlador master conectando a interface ao backend Django e exportador PNG Full HD (1920x1080).

---

## 🔒 3. Variáveis de Ambiente e Arquivos de Nuvem

- **`.env` e `.env.example`:** Contém as variáveis `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL` (SQLite local ou PostgreSQL em produção) e cores padrão da escolinha.
- **`.gitignore` e `.gcloudignore`:** Blindagem completa contra o versionamento acidental de arquivos `.env`, `db.sqlite3`, `__pycache__/`, `*.pyc`, `staticfiles/` e ambientes virtuais.

---

## 🤖 4. Skills do Agente Antigravity (`.agents/skills/`)

A pasta [`.agents/skills/`](file:///c:/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/tatical17/.agents/skills/) contém 3 módulos de automação documentados em `SKILL.md`:

1. **[`git-commit`](file:///c:/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/tatical17/.agents/skills/git-commit/SKILL.md):** Padrão Conventional Commits (`feat:`, `fix:`, `style:`, `refactor:`, `chore:`), rotina de status e proteção contra inclusão do `.env`.
2. **[`security-audit`](file:///c:/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/tatical17/.agents/skills/security-audit/SKILL.md):** Auditoria de segurança verificando proteção `CSRF_TOKEN` nas requisições Fetch, sanitização de JSONs `canvas_data`, validação de upload de imagens e ocultação de `SECRET_KEY`.
3. **[`seed-catalog`](file:///c:/Users/perei/OneDrive/%C3%81rea%20de%20Trabalho/tatical17/.agents/skills/seed-catalog/SKILL.md):** Manual e execução do comando `python manage.py seed_catalog` que popula automaticamente a escolinha, 3 professores e 4 pranchetas animadas (`Sistema 3-1`, `Saída 4-0`, `Marcação 2-2`, `Goleiro-Linha 5x4`).

---

## ☁️ 5. Deploy na Vercel com WhiteNoise

O projeto está 100% preparado para deploy contínuo na Vercel:

- **`vercel.json`:** Configurado com build `@vercel/python` apontando para `config/wsgi.py`.
- **`requirements.txt`:** Lista completa com `Django`, `whitenoise`, `dj-database-url`, `python-dotenv`, `psycopg2-binary` e `Pillow`.
- **`WhiteNoise`:** `whitenoise.middleware.WhiteNoiseMiddleware` ativo em `config/settings.py` para servir arquivos estáticos comprimidos diretamente via WSGI em produção.
- **`config/wsgi.py`:** Exporta tanto `application` quanto `app` para compatibilidade imediata com as funções serverless da Vercel.

---

## 📁 Estrutura de Diretórios

```
tatical17/
├── manage.py
├── requirements.txt
├── vercel.json
├── .env
├── .env.example
├── .gitignore
├── .gcloudignore
├── README.md
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── core/           # Configurações da Escolinha e Rotas Globais
│   ├── staff/          # Model Professor e API da Comissão Técnica
│   └── tactical/       # Model TacticalPlay, API e comando seed_catalog
├── templates/
│   ├── base.html       # Layout base, CSRF e injeção do config
│   └── core/
│       └── index.html  # SPA integrada com Prancheta, Biblioteca e Professores
├── static/
│   ├── css/
│   │   ├── variables.css
│   │   ├── base.css
│   │   ├── components.css
│   │   └── tacticalpad.css
│   └── js/
│       ├── api.js
│       ├── court.js
│       ├── players.js
│       ├── drawings.js
│       ├── timeline.js
│       └── app.js
└── .agents/
    └── skills/
        ├── git-commit/SKILL.md
        ├── security-audit/SKILL.md
        └── seed-catalog/SKILL.md
```
