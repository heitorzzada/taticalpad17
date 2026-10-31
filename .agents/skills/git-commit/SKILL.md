---
name: git-commit
description: Regras e padrões para commits padronizados (Conventional Commits), verificação de status do Git e proteção estrita contra o versionamento de credenciais e arquivos .env.
---

# Skill: Git Commit Padronizado & Segurança

Esta skill define as diretrizes obrigatórias para auditoria de status do repositório, validação de arquivos sensíveis e geração de mensagens de commit no padrão **Conventional Commits**.

## 1. Verificação Pré-Commit (Checklist de Segurança)

Antes de executar qualquer comando `git add` ou `git commit`, o agente ou desenvolvedor DEVE:

1. **Inspecionar o status dos arquivos modificados:**
   ```bash
   git status
   ```
2. **Garantir a NÃO inclusão do arquivo `.env`:**
   - ⚠️ **REGRA CRÍTICA:** O arquivo `.env` NUNCA deve ser commitado no Git. Ele contém segredos como `SECRET_KEY`, credenciais de banco de dados e tokens de API.
   - Verifique se o `.gitignore` possui a regra `.env`.
   - Se por engano o `.env` estiver em *staging* (`Changes to be committed`), remova imediatamente:
     ```bash
     git reset HEAD .env
     ```

3. **Verificar arquivos desnecessários ou temporários:**
   - Certifique-se de que `db.sqlite3`, `__pycache__/`, `*.pyc` e arquivos de log não estão sendo versionados.

---

## 2. Formato Obrigatório da Mensagem de Commit

Os commits devem seguir rigorosamente o padrão **Conventional Commits**:

```
<tipo>(<escopo>): <descrição no imperativo e em português>

[corpo opcional detalhando o motivo da alteração]
```

### Tipos Permitidos:
- **`feat:`** Introdução de uma nova funcionalidade (ex: `feat(tactical): adiciona suporte a formação rápida 5x4 com goleiro-linha`).
- **`fix:`** Correção de um bug ou erro de execução (ex: `fix(canvas): corrige interpolação angular no tweening de jogadores`).
- **`style:`** Alterações puramente visuais, CSS ou formatação que não alteram a lógica (ex: `style(css): modulariza variáveis de cores e layout da quadra`).
- **`refactor:`** Refatoração de código sem alterar comportamento externo (ex: `refactor(backend): converte prancheta estática para Django MVT e API`).
- **`security:`** Melhorias e correções de segurança (ex: `security(csrf): adiciona validação de token CSRF em requisições Fetch`).
- **`chore:`** Atualizações de build, dependências ou tarefas administrativas (ex: `chore(deps): adiciona whitenoise e dj-database-url ao requirements.txt`).

---

## 3. Fluxo Recomendado de Execução

```bash
# 1. Checagem de segurança
git status

# 2. Adicionar arquivos mantendo .env ignorado
git add apps/ config/ static/ templates/ .agents/ manage.py requirements.txt vercel.json .gitignore .gcloudignore

# 3. Commit com mensagem clara
git commit -m "feat(architecture): refatora tacticalpad para django com css modular e skills antigravity"
```
