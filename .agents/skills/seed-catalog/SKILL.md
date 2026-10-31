---
name: seed-catalog
description: Automação e documentação do comando 'python manage.py seed_catalog' para inicialização e preenchimento automático do banco de dados com a identidade da escolinha, comissão técnica e pranchetas táticas animadas de futsal.
---

# Skill: Catálogo de Dados Táticos (Seed Catalog)

Esta skill documenta a execução e os dados populados pelo comando customizado do Django `seed_catalog`, localizado em `apps/tactical/management/commands/seed_catalog.py`.

## 1. Objetivo do Comando

Garantir que um ambiente recém-instalado ou implantado em nuvem (Vercel, Render, Railway, etc.) seja inicializado imediatamente com:
1. A identidade visual completa e configurada da escolinha de futsal.
2. 3 membros da comissão técnica registrados no CREF com fotos e biografias.
3. 4 sistemas táticos oficiais de futsal já com **quadros-chave de animação** gravados para teste imediato de reprodução na prancheta.

---

## 2. Como Executar

Após rodar as migrações do Django:

```bash
# 1. Aplicar migrações
python manage.py migrate

# 2. Executar o seed de catálogo
python manage.py seed_catalog
```

---

## 3. Conteúdo Populado pelo Seed

### A. Configuração Institucional (`SchoolConfig`)
- **Nome:** Falcão 12 Futsal Academy
- **Slogan:** Centro de Formação Tática & Alto Rendimento
- **Cores:** Azul Royal (`#004AAD`), Amarelo Dourado (`#FFCC00`), Piso Azul Quadra (`#1E3A5F`), Área (`#142640`) e Linhas Brancas (`#FFFFFF`).
- **Logo Oficial:** Emblema vetorial de futsal com escudo, estrela e bola estilizada.

### B. Comissão Técnica (`Professor`)
1. **Prof. Lucas 'Falcão' Silveira:** Coordenador Técnico & Treinador Principal (Licença PRO CBFS / CREF 034891-G/SP).
2. **Profª. Mariana Castro:** Treinadora de Base & Especialista em Iniciação Motora (Certificação Barça Innovation Hub / CREF 078234-G/SP).
3. **Prof. Rodrigo 'Muralha' Rocha:** Preparador de Goleiros & Análise de Desempenho (CREF 051902-G/SP).

### C. Sistemas Táticos de Futsal com Animação (`TacticalPlay`)
1. **Sistema 3-1 Padrão (Sub-15):** Rotação de ala com corte e apoio no pivô para finalização diagonal.
2. **Saída de Bola 4-0 (Sub-17):** Circulação em linha de quatro com infiltração vertical no espaço cego da defesa.
3. **Marcação Quadrado 2-2 (Sub-13):** Bloco médio defensivo compacto em zona com balanço lateral.
4. **Goleiro-Linha 5x4 (Adulto):** Ataque posicional em "W" com superioridade numérica e conclusão na segunda trave.

Cada um desses treinos inclui o objeto `canvas_data` com coordenadas de início e finalização (`Quadro 1` e `Quadro 2`), permitindo ao treinador clicar em **"Abrir na Prancheta"** e imediatamente pressionar **"Play"** para assistir à movimentação orgânica calculada pela engine.
