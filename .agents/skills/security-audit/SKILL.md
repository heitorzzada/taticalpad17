---
name: security-audit
description: Rotina de auditoria de segurança para o sistema TacticalPad Futsal Pro. Validação de CSRF em requisições Fetch/AJAX, sanitização de JSONs da prancheta, segurança de uploads de imagens, gestão de segredos e checklist para produção.
---

# Skill: Auditoria de Segurança (Security Audit)

Esta skill documenta os procedimentos de auditoria técnica de segurança aplicados no backend Django e nas comunicações assíncronas do frontend.

## 1. Proteção CSRF (Cross-Site Request Forgery)

### Diagnóstico no Frontend:
Toda chamada `POST` ou `DELETE` feita via `fetch()` para a API interna Django (`/api/tactical/save/`, `/api/staff/save/`, etc.) deve conter o cabeçalho `X-CSRFToken`.
- **Implementação verificada:**
  - O arquivo `static/js/api.js` implementa o extrator seguro de cookie `csrftoken` ou do input oculto `{% csrf_token %}` injetado no `templates/base.html`.
  - Cabeçalho enviado: `"X-CSRFToken": this.getCsrfToken()`.

### Diagnóstico no Backend:
- O middleware `django.middleware.csrf.CsrfViewMiddleware` está obrigatoriamente ativo em `config/settings.py`.
- A lista `CSRF_TRUSTED_ORIGINS` contém os domínios da Vercel e origens de desenvolvimento permitidas.

---

## 2. Sanitização e Validação dos JSONs de Prancheta (`canvas_data`)

- O campo `canvas_data` no model `TacticalPlay` armazena a estrutura de quadros e coordenadas dos atletas.
- **Validações implementadas em `apps/tactical/views.py`:**
  1. Decodificação segura com bloco `try/except json.JSONDecodeError`.
  2. Validação de tipos: garantia de que `duration` é convertido para inteiro com fallback.
  3. Sanitização de strings: strings de texto como `title`, `author` e `objectives` passam por `.strip()` para evitar injeções ou caracteres indesejados.

---

## 3. Segurança no Upload de Imagens (Logos e Fotos de Professores)

1. **Upload via Base64 / File Input:**
   - As imagens enviadas pelo usuário no modal passam por leitura via `FileReader.readAsDataURL()` no frontend.
   - Os inputs possuem o atributo restritivo `accept="image/*"`.
2. **Armazenamento no Backend:**
   - No Django Admin e nos models, os uploads utilizam `ImageField` com suporte da biblioteca **Pillow**, que valida se o arquivo enviado é de fato uma imagem válida antes de salvar em disco.
   - As pastas de upload são separadas: `school_logos/` e `professors/`.

---

## 4. Gerenciamento de Segredos e Checklist de Produção

Antes de disponibilizar em produção (Vercel ou servidor de nuvem):

| Item de Auditoria | Requisito de Segurança | Verificação |
|-------------------|------------------------|-------------|
| **`SECRET_KEY`** | Não utilizar a chave padrão in-code; ler exclusivamente do `.env` | ✅ Implementado com `os.getenv` |
| **`DEBUG`** | Deve ser estritamente `False` em ambiente de produção | ✅ Configurado via variável de ambiente |
| **`ALLOWED_HOSTS`** | Não deixar `*` irrestrito em produção real; fixar domínio da equipe | ✅ Suporta lista dinâmica no `.env` |
| **`.gitignore`** | Bloquear versionamento do `.env`, `db.sqlite3` e `.venv` | ✅ Configurado na raiz |
| **`WhiteNoise`** | Servir arquivos estáticos comprimidos com cache headers seguros | ✅ Integrado no pipeline WSGI |
