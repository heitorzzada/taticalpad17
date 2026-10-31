/**
 * ==============================================================================
 * 3.B, 3.C, 3.D. MOTOR DA PRANCHETA TÁTICA (TACTICALPAD ENGINE)
 * Jogadores, Equipamentos, Ferramentas de Desenho Tático, Formações,
 * Histórico Undo/Redo e Interação com Pointer Events (Mouse/Touch).
 * ==============================================================================
 */

class TacticalBoard {
  constructor(pitchRenderer) {
    this.pitch = pitchRenderer;
    this.canvas = pitchRenderer.canvas;
    this.ctx = pitchRenderer.ctx;

    // Estado da ferramenta ativa
    // Ferramentas: 'select', 'arrow_solid', 'arrow_dashed', 'arrow_wavy', 'arrow_tbar',
    //              'zone_rect', 'zone_ellipse', 'player_line', 'eraser'
    this.activeTool = "select";
    this.drawColor = "#FFCC00";     // Amarelo padrão de prancheta
    this.drawLineWidth = 3.5;       // Espessura
    this.zoneOpacity = 0.25;

    // Entidades na quadra (em coordenadas virtuais 0..1000 x 0..500)
    this.players = [];
    this.balls = [];
    this.equipment = [];
    this.drawings = []; // Traços, setas e zonas

    // Banco de reservas
    this.benchTeamA = [];
    this.benchTeamB = [];

    // Histórico para Desfazer/Refazer
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 40;

    // Seleção e interação
    this.selectedItem = null;
    this.selectedType = null; // 'player' | 'ball' | 'equipment' | 'drawing'
    this.isDragging = false;
    this.isRotating = false;
    this.dragStart = { x: 0, y: 0 };
    this.itemStartPos = { x: 0, y: 0 };

    // Desenho em andamento
    this.currentDrawing = null;

    // Configuração dos eventos
    this.setupEvents();

    // Inicializa com time completo e formação padrão
    this.initDefaultEntities();
    this.saveState();
  }

  /**
   * Inicializa jogadores padrão (Time A: 5 em quadra + 3 banco; Time B: 5 em quadra + 3 banco; 1 bola)
   */
  initDefaultEntities() {
    this.players = [];
    this.balls = [];
    this.equipment = [];
    this.drawings = [];

    // 1 Bola no centro
    this.balls.push({
      id: "ball-1",
      x: 500,
      y: 250,
      radius: 11
    });

    // Time A (Escolinha) - Formação Inicial 3-1
    const teamAPlayers = [
      { id: "ta-gk", team: "A", isGk: true, number: 1, name: "Goleiro", x: 100, y: 250, angle: 0 },
      { id: "ta-fixo", team: "A", isGk: false, number: 3, name: "Fixo", x: 250, y: 250, angle: 0 },
      { id: "ta-ala-e", team: "A", isGk: false, number: 7, name: "Ala Esq", x: 380, y: 110, angle: 0 },
      { id: "ta-ala-d", team: "A", isGk: false, number: 10, name: "Ala Dir", x: 380, y: 390, angle: 0 },
      { id: "ta-pivo", team: "A", isGk: false, number: 9, name: "Pivô", x: 480, y: 250, angle: 0 }
    ];

    // Time B (Adversário) - Marcação Losango
    const teamBPlayers = [
      { id: "tb-pivo", team: "B", isGk: false, number: 9, name: "Marcador", x: 550, y: 250, angle: Math.PI },
      { id: "tb-ala-e", team: "B", isGk: false, number: 11, name: "Ala", x: 650, y: 120, angle: Math.PI },
      { id: "tb-ala-d", team: "B", isGk: false, number: 8, name: "Ala", x: 650, y: 380, angle: Math.PI },
      { id: "tb-fixo", team: "B", isGk: false, number: 4, name: "Fixo", x: 760, y: 250, angle: Math.PI },
      { id: "tb-gk", team: "B", isGk: true, number: 12, name: "Goleiro", x: 910, y: 250, angle: Math.PI }
    ];

    this.players = [...teamAPlayers, ...teamBPlayers];

    // Reservas no banco
    this.benchTeamA = [
      { id: "ta-res-1", team: "A", isGk: false, number: 5, name: "Enzo", angle: 0 },
      { id: "ta-res-2", team: "A", isGk: false, number: 11, name: "Matheus", angle: 0 },
      { id: "ta-res-3", team: "A", isGk: true, number: 22, name: "Gabriel", angle: 0 }
    ];

    this.benchTeamB = [
      { id: "tb-res-1", team: "B", isGk: false, number: 14, name: "Res 1", angle: Math.PI },
      { id: "tb-res-2", team: "B", isGk: false, number: 17, name: "Res 2", angle: Math.PI },
      { id: "tb-res-3", team: "B", isGk: true, number: 1, name: "Goleiro R", angle: Math.PI }
    ];
  }

  /**
   * Sistema de Formações Rápidas (3-1, 4-0, 2-2, 1-2-1, 5x4 Goleiro-Linha, etc.)
   */
  applyFormation(teamKey, formationName) {
    const isTeamA = teamKey === "A";
    const dir = isTeamA ? 1 : -1;
    const baseGoalX = isTeamA ? 70 : 930;
    const midX = isTeamA ? 350 : 650;
    const frontX = isTeamA ? 480 : 520;
    const targetAngle = isTeamA ? 0 : Math.PI;

    const teamPlayers = this.players.filter(p => p.team === teamKey);
    if (teamPlayers.length === 0) return;

    // Encontra ou define goleiro e jogadores de linha
    let gk = teamPlayers.find(p => p.isGk) || teamPlayers[0];
    let line = teamPlayers.filter(p => p.id !== gk.id);

    // Ajusta o goleiro
    if (formationName === "5x4") {
      // No 5x4, goleiro sobe para a quadra ofensiva
      gk.x = isTeamA ? 620 : 380;
      gk.y = 250;
      gk.angle = targetAngle;
    } else {
      gk.x = baseGoalX;
      gk.y = 250;
      gk.angle = targetAngle;
    }

    if (formationName === "3-1") {
      // 1 Fixo recuado, 2 Alas abertos, 1 Pivô adiantado
      if (line[0]) { line[0].x = isTeamA ? 230 : 770; line[0].y = 250; line[0].angle = targetAngle; }
      if (line[1]) { line[1].x = midX; line[1].y = 110; line[1].angle = targetAngle; }
      if (line[2]) { line[2].x = midX; line[2].y = 390; line[2].angle = targetAngle; }
      if (line[3]) { line[3].x = frontX; line[3].y = 250; line[3].angle = targetAngle; }
    } else if (formationName === "4-0") {
      // Linha de quatro espalhada sem pivô de referência
      const xPos = isTeamA ? 310 : 690;
      if (line[0]) { line[0].x = xPos; line[0].y = 90; line[0].angle = targetAngle; }
      if (line[1]) { line[1].x = isTeamA ? 270 : 730; line[1].y = 195; line[1].angle = targetAngle; }
      if (line[2]) { line[2].x = isTeamA ? 270 : 730; line[2].y = 305; line[2].angle = targetAngle; }
      if (line[3]) { line[3].x = xPos; line[3].y = 410; line[3].angle = targetAngle; }
    } else if (formationName === "2-2") {
      // Quadrado clássico: 2 defensores, 2 atacantes
      const defX = isTeamA ? 240 : 760;
      const atkX = isTeamA ? 460 : 540;
      if (line[0]) { line[0].x = defX; line[0].y = 150; line[0].angle = targetAngle; }
      if (line[1]) { line[1].x = defX; line[1].y = 350; line[1].angle = targetAngle; }
      if (line[2]) { line[2].x = atkX; line[2].y = 150; line[2].angle = targetAngle; }
      if (line[3]) { line[3].x = atkX; line[3].y = 350; line[3].angle = targetAngle; }
    } else if (formationName === "1-2-1") {
      // Losango clássico
      if (line[0]) { line[0].x = isTeamA ? 220 : 780; line[0].y = 250; line[0].angle = targetAngle; } // Fixo
      if (line[1]) { line[1].x = midX; line[1].y = 100; line[1].angle = targetAngle; }                 // Ala Esq
      if (line[2]) { line[2].x = midX; line[2].y = 400; line[2].angle = targetAngle; }                 // Ala Dir
      if (line[3]) { line[3].x = frontX; line[3].y = 250; line[3].angle = targetAngle; }               // Pivô
    } else if (formationName === "5x4") {
      // Goleiro-Linha em W (superioridade numérica no ataque)
      const deepX = isTeamA ? 840 : 160;
      const wingX = isTeamA ? 740 : 260;
      if (line[0]) { line[0].x = deepX; line[0].y = 100; line[0].angle = targetAngle; } // Fundo 1
      if (line[1]) { line[1].x = deepX; line[1].y = 400; line[1].angle = targetAngle; } // Fundo 2
      if (line[2]) { line[2].x = wingX; line[2].y = 150; line[2].angle = targetAngle; } // Ala
      if (line[3]) { line[3].x = wingX; line[3].y = 350; line[3].angle = targetAngle; } // Ala
    } else if (formationName === "def_zona") {
      // Bloco de Defesa em Zona compacto
      const defX = isTeamA ? 200 : 800;
      const frontDefX = isTeamA ? 320 : 680;
      if (line[0]) { line[0].x = defX; line[0].y = 180; line[0].angle = targetAngle; }
      if (line[1]) { line[1].x = defX; line[1].y = 320; line[1].angle = targetAngle; }
      if (line[2]) { line[2].x = frontDefX; line[2].y = 160; line[2].angle = targetAngle; }
      if (line[3]) { line[3].x = frontDefX; line[3].y = 340; line[3].angle = targetAngle; }
    }

    this.saveState();
    this.render();
  }

  /**
   * Adiciona equipamento de treino à quadra
   */
  addEquipment(type, color = "#F97316") {
    // Posição no centro da quadra ou área livre
    const center = this.pitch.viewMode === "half" ? { x: 750, y: 250 } : { x: 500, y: 250 };
    // Leve offset aleatório para não sobrepor
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 60;

    const item = {
      id: `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type, // 'cone', 'disc', 'ladder', 'hurdle', 'pole', 'hoop', 'mini_goal'
      color,
      x: center.x + offsetX,
      y: center.y + offsetY,
      angle: 0,
      scale: 1
    };

    this.equipment.push(item);
    this.selectedItem = item;
    this.selectedType = "equipment";
    this.saveState();
    this.render();
  }

  /**
   * Adiciona nova bola à quadra
   */
  addBall() {
    const center = this.pitch.viewMode === "half" ? { x: 750, y: 250 } : { x: 500, y: 250 };
    const ball = {
      id: `ball-${Date.now()}`,
      x: center.x + (Math.random() - 0.5) * 40,
      y: center.y + (Math.random() - 0.5) * 40,
      radius: 11
    };
    this.balls.push(ball);
    this.selectedItem = ball;
    this.selectedType = "ball";
    this.saveState();
    this.render();
  }

  /**
   * Adiciona novo jogador
   */
  addPlayer(team = "A", isGk = false) {
    const isTeamA = team === "A";
    const teamCount = this.players.filter(p => p.team === team).length;
    const newNumber = teamCount + 1;
    const center = this.pitch.viewMode === "half" ? { x: 750, y: 250 } : { x: 500, y: 250 };

    const player = {
      id: `player-${Date.now()}`,
      team,
      isGk,
      number: newNumber,
      name: isGk ? "Goleiro" : `Atleta ${newNumber}`,
      x: center.x + (isTeamA ? -60 : 60),
      y: center.y + (Math.random() - 0.5) * 80,
      angle: isTeamA ? 0 : Math.PI
    };

    this.players.push(player);
    this.selectedItem = player;
    this.selectedType = "player";
    this.saveState();
    this.render();
  }

  /**
   * Configuração de eventos de ponteiro (Pointer Events)
   */
  setupEvents() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this));
    window.addEventListener("pointermove", this.handlePointerMove.bind(this));
    window.addEventListener("pointerup", this.handlePointerUp.bind(this));
    window.addEventListener("pointercancel", this.handlePointerUp.bind(this));

    // Tecla Delete / Backspace para excluir item selecionado
    window.addEventListener("keydown", (e) => {
      if (["Delete", "Backspace"].includes(e.key) && this.selectedItem) {
        // Ignora se estiver digitando em input ou textarea
        if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
        this.deleteSelectedItem();
      }
    });
  }

  /**
   * Trata clique / toque inicial no canvas
   */
  handlePointerDown(e) {
    e.preventDefault();
    this.canvas.setPointerCapture?.(e.pointerId);

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const courtPos = this.pitch.canvasToCourt(screenX, screenY);

    // Modo Borracha: apaga elemento sob o clique
    if (this.activeTool === "eraser") {
      this.handleEraser(screenX, screenY, courtPos);
      return;
    }

    // Ferramentas de Desenho
    if (this.isDrawingTool(this.activeTool)) {
      this.startDrawing(courtPos);
      return;
    }

    // Modo Seleção / Arrastar
    if (this.activeTool === "select") {
      // 1. Verifica se clicou na alça de rotação do jogador selecionado
      if (this.selectedItem && this.selectedType === "player") {
        if (this.isHitRotationHandle(courtPos, this.selectedItem)) {
          this.isRotating = true;
          this.canvas.classList.add("cursor-grabbing");
          return;
        }
      }

      // 2. Verifica clique em jogadores
      const hitPlayer = this.findHitPlayer(courtPos);
      if (hitPlayer) {
        this.selectItem(hitPlayer, "player", courtPos);
        return;
      }

      // 3. Verifica clique em bolas
      const hitBall = this.findHitBall(courtPos);
      if (hitBall) {
        this.selectItem(hitBall, "ball", courtPos);
        return;
      }

      // 4. Verifica clique em equipamentos
      const hitEq = this.findHitEquipment(courtPos);
      if (hitEq) {
        this.selectItem(hitEq, "equipment", courtPos);
        return;
      }

      // 5. Verifica clique em traços de desenho
      const hitDraw = this.findHitDrawing(screenX, screenY);
      if (hitDraw) {
        this.selectItem(hitDraw, "drawing", courtPos);
        return;
      }

      // Clicou no vazio da quadra: desmarca seleção
      this.clearSelection();
      this.render();
    }
  }

  /**
   * Trata movimento do ponteiro (arrastar, girar ou desenhar)
   */
  handlePointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const courtPos = this.pitch.canvasToCourt(screenX, screenY);

    // 1. Rotação do jogador selecionado
    if (this.isRotating && this.selectedItem) {
      const dx = courtPos.x - this.selectedItem.x;
      const dy = courtPos.y - this.selectedItem.y;
      this.selectedItem.angle = Math.atan2(dy, dx);
      this.render();
      return;
    }

    // 2. Arrastando item selecionado
    if (this.isDragging && this.selectedItem) {
      const dx = courtPos.x - this.dragStart.x;
      const dy = courtPos.y - this.dragStart.y;

      this.selectedItem.x = this.itemStartPos.x + dx;
      this.selectedItem.y = this.itemStartPos.y + dy;

      // Limita suavemente dentro da margem da quadra
      this.clampItemPosition(this.selectedItem);

      this.render();
      return;
    }

    // 3. Desenhando traço ou zona tática
    if (this.currentDrawing) {
      this.updateDrawing(courtPos);
      this.render();
      return;
    }

    // 4. Borracha contínua durante clique
    if (this.activeTool === "eraser" && (e.buttons === 1)) {
      this.handleEraser(screenX, screenY, courtPos);
    }
  }

  /**
   * Finaliza clique / toque
   */
  handlePointerUp(e) {
    if (this.isDragging || this.isRotating) {
      this.isDragging = false;
      this.isRotating = false;
      this.canvas.classList.remove("cursor-grabbing");
      this.saveState();
    }

    if (this.currentDrawing) {
      // Adiciona o traço finalizado se tiver tamanho mínimo
      if (this.isValidDrawing(this.currentDrawing)) {
        this.drawings.push(this.currentDrawing);
        this.saveState();
      }
      this.currentDrawing = null;
      this.render();
    }
  }

  /**
   * Verifica se a ferramenta atual é de desenho
   */
  isDrawingTool(tool) {
    return [
      "arrow_solid",
      "arrow_dashed",
      "arrow_wavy",
      "arrow_tbar",
      "zone_rect",
      "zone_ellipse",
      "player_line"
    ].includes(tool);
  }

  /**
   * Inicia um novo desenho
   */
  startDrawing(courtPos) {
    this.currentDrawing = {
      id: `draw-${Date.now()}`,
      type: this.activeTool,
      color: this.drawColor,
      lineWidth: this.drawLineWidth,
      opacity: this.zoneOpacity,
      startX: courtPos.x,
      startY: courtPos.y,
      endX: courtPos.x,
      endY: courtPos.y,
      points: [{ x: courtPos.x, y: courtPos.y }]
    };
  }

  /**
   * Atualiza coordenadas do desenho em tempo real
   */
  updateDrawing(courtPos) {
    if (!this.currentDrawing) return;
    this.currentDrawing.endX = courtPos.x;
    this.currentDrawing.endY = courtPos.y;
    this.currentDrawing.points.push({ x: courtPos.x, y: courtPos.y });
  }

  /**
   * Valida se o desenho tem dimensão mínima
   */
  isValidDrawing(draw) {
    const dx = draw.endX - draw.startX;
    const dy = draw.endY - draw.startY;
    return Math.sqrt(dx * dx + dy * dy) > 8;
  }

  /**
   * Seleciona um item e prepara arraste
   */
  selectItem(item, type, courtPos) {
    this.selectedItem = item;
    this.selectedType = type;
    this.isDragging = true;
    this.dragStart = { x: courtPos.x, y: courtPos.y };
    this.itemStartPos = { x: item.x, y: item.y };
    this.canvas.classList.add("cursor-grabbing");

    // Dispara evento para atualizar barra de propriedades/roster
    this.onSelectionChange?.(item, type);
    this.render();
  }

  clearSelection() {
    this.selectedItem = null;
    this.selectedType = null;
    this.onSelectionChange?.(null, null);
  }

  deleteSelectedItem() {
    if (!this.selectedItem) return;

    if (this.selectedType === "player") {
      this.players = this.players.filter(p => p.id !== this.selectedItem.id);
    } else if (this.selectedType === "ball") {
      this.balls = this.balls.filter(b => b.id !== this.selectedItem.id);
    } else if (this.selectedType === "equipment") {
      this.equipment = this.equipment.filter(e => e.id !== this.selectedItem.id);
    } else if (this.selectedType === "drawing") {
      this.drawings = this.drawings.filter(d => d.id !== this.selectedItem.id);
    }

    this.clearSelection();
    this.saveState();
    this.render();
  }

  /**
   * Ferramenta Borracha: detecta e remove elemento mais próximo
   */
  handleEraser(screenX, screenY, courtPos) {
    // 1. Tenta apagar traços de desenho
    const hitDraw = this.findHitDrawing(screenX, screenY);
    if (hitDraw) {
      this.drawings = this.drawings.filter(d => d.id !== hitDraw.id);
      this.saveState();
      this.render();
      return;
    }

    // 2. Tenta apagar equipamentos
    const hitEq = this.findHitEquipment(courtPos);
    if (hitEq) {
      this.equipment = this.equipment.filter(e => e.id !== hitEq.id);
      this.saveState();
      this.render();
      return;
    }

    // 3. Tenta apagar bolas extras (mantém pelo menos 1)
    const hitBall = this.findHitBall(courtPos);
    if (hitBall && this.balls.length > 1) {
      this.balls = this.balls.filter(b => b.id !== hitBall.id);
      this.saveState();
      this.render();
    }
  }

  /**
   * Limpa apenas os desenhos e anotações, mantendo jogadores e equipamentos
   */
  clearDrawings() {
    this.drawings = [];
    this.saveState();
    this.render();
  }

  /**
   * Reset completo da prancheta
   */
  resetBoard() {
    this.initDefaultEntities();
    this.clearSelection();
    this.saveState();
    this.render();
  }

  /**
   * Detecção de colisão / clique em Jogador
   */
  findHitPlayer(courtPos) {
    const hitRadius = 22; // Raio de toque confortável
    for (let i = this.players.length - 1; i >= 0; i--) {
      const p = this.players[i];
      const dx = courtPos.x - p.x;
      const dy = courtPos.y - p.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return p;
      }
    }
    return null;
  }

  /**
   * Detecção de clique na alça de rotação direcional do jogador
   */
  isHitRotationHandle(courtPos, player) {
    const distHandle = 34; // Distância da alça do centro do jogador
    const handleX = player.x + Math.cos(player.angle || 0) * distHandle;
    const handleY = player.y + Math.sin(player.angle || 0) * distHandle;
    const dx = courtPos.x - handleX;
    const dy = courtPos.y - handleY;
    return dx * dx + dy * dy <= 14 * 14;
  }

  /**
   * Detecção de colisão / clique em Bola
   */
  findHitBall(courtPos) {
    const hitRadius = 18;
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      const dx = courtPos.x - b.x;
      const dy = courtPos.y - b.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return b;
      }
    }
    return null;
  }

  /**
   * Detecção de colisão / clique em Equipamento
   */
  findHitEquipment(courtPos) {
    const hitRadius = 24;
    for (let i = this.equipment.length - 1; i >= 0; i--) {
      const eq = this.equipment[i];
      const dx = courtPos.x - eq.x;
      const dy = courtPos.y - eq.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return eq;
      }
    }
    return null;
  }

  /**
   * Detecção de clique em Traço de Desenho (distância ponto-segmento)
   */
  findHitDrawing(screenX, screenY) {
    for (let i = this.drawings.length - 1; i >= 0; i--) {
      const d = this.drawings[i];
      const p1 = this.pitch.courtToCanvas(d.startX, d.startY);
      const p2 = this.pitch.courtToCanvas(d.endX, d.endY);

      // Distância do ponto ao segmento
      const dist = this.pointToSegmentDistance(screenX, screenY, p1.x, p1.y, p2.x, p2.y);
      if (dist < 18) {
        return d;
      }
    }
    return null;
  }

  pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  clampItemPosition(item) {
    const bm = this.pitch.BORDER_MARGIN;
    const xMin = -bm + 10;
    const xMax = 1000 + bm - 10;
    const yMin = -bm + 10;
    const yMax = 500 + bm - 10;

    item.x = Math.max(xMin, Math.min(xMax, item.x));
    item.y = Math.max(yMin, Math.min(yMax, item.y));
  }

  /**
   * Histórico Undo / Redo
   */
  saveState() {
    // Trunca histórico se estiver no meio
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    const snapshot = {
      players: JSON.parse(JSON.stringify(this.players)),
      balls: JSON.parse(JSON.stringify(this.balls)),
      equipment: JSON.parse(JSON.stringify(this.equipment)),
      drawings: JSON.parse(JSON.stringify(this.drawings))
    };

    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;

    // Notifica atualização de estado para habilitar/desabilitar botões
    this.onHistoryChange?.(this.historyIndex > 0, this.historyIndex < this.history.length - 1);
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState(this.history[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreState(this.history[this.historyIndex]);
    }
  }

  restoreState(snapshot) {
    if (!snapshot) return;
    this.players = JSON.parse(JSON.stringify(snapshot.players || []));
    this.balls = JSON.parse(JSON.stringify(snapshot.balls || []));
    this.equipment = JSON.parse(JSON.stringify(snapshot.equipment || []));
    this.drawings = JSON.parse(JSON.stringify(snapshot.drawings || []));
    this.clearSelection();
    this.render();
    this.onHistoryChange?.(this.historyIndex > 0, this.historyIndex < this.history.length - 1);
  }

  /**
   * ============================================================================
   * RENDERIZAÇÃO GERAL DA PRANCHETA
   * ============================================================================
   */
  render() {
    // 1. Renderiza a quadra e linhas
    this.pitch.render();

    const ctx = this.ctx;
    ctx.save();

    // 2. Renderiza Zonas Táticas (no plano de fundo, abaixo dos jogadores)
    this.renderTacticalZones();

    // 3. Renderiza Linhas de Conexão e Traços/Setas
    this.renderDrawings();

    // 4. Renderiza Equipamentos de Treino
    this.renderEquipment();

    // 5. Renderiza Jogadores e Goleiros
    this.renderPlayers();

    // 6. Renderiza Bolas
    this.renderBalls();

    // 7. Renderiza Desenho em Andamento (Preview)
    if (this.currentDrawing) {
      this.drawSingleDrawing(this.currentDrawing, true);
    }

    ctx.restore();
  }

  /**
   * Renderiza Zonas Táticas (Retângulos e Elipses)
   */
  renderTacticalZones() {
    const zones = this.drawings.filter(d => ["zone_rect", "zone_ellipse"].includes(d.type));
    zones.forEach(z => this.drawSingleDrawing(z));
  }

  /**
   * Renderiza Traços, Linhas de Jogadores e Setas
   */
  renderDrawings() {
    const strokes = this.drawings.filter(d => !["zone_rect", "zone_ellipse"].includes(d.type));
    strokes.forEach(s => this.drawSingleDrawing(s));
  }

  /**
   * Desenho de uma forma tática específica
   */
  drawSingleDrawing(draw, isPreview = false) {
    const ctx = this.ctx;
    const p1 = this.pitch.courtToCanvas(draw.startX, draw.startY);
    const p2 = this.pitch.courtToCanvas(draw.endX, draw.endY);

    const isSelected = this.selectedItem && this.selectedItem.id === draw.id;
    const scale = this.pitch.metrics.scale;
    const lineWidth = (draw.lineWidth || 3) * scale;

    ctx.save();
    ctx.strokeStyle = draw.color || this.drawColor;
    ctx.fillStyle = draw.color || this.drawColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isSelected) {
      ctx.shadowColor = "#FFCC00";
      ctx.shadowBlur = 12;
    }

    switch (draw.type) {
      case "arrow_solid": // Corrida sem bola
        this.drawArrow(p1, p2, false);
        break;

      case "arrow_dashed": // Passe ou Chute
        this.drawArrow(p1, p2, true);
        break;

      case "arrow_wavy": // Condução de bola / drible
        this.drawWavyArrow(p1, p2);
        break;

      case "arrow_tbar": // Bloqueio / Parede tática (T)
        this.drawTBar(p1, p2);
        break;

      case "player_line": // Linha de conexão tática
        ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        // Pequenas bolinhas nas pontas
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 3 * scale, 0, Math.PI * 2);
        ctx.arc(p2.x, p2.y, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "zone_rect": { // Retângulo tático
        const rx = Math.min(p1.x, p2.x);
        const ry = Math.min(p1.y, p2.y);
        const rw = Math.abs(p2.x - p1.x);
        const rh = Math.abs(p2.y - p1.y);

        ctx.globalAlpha = draw.opacity || 0.25;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.globalAlpha = 1;
        ctx.setLineDash([6 * scale, 4 * scale]);
        ctx.strokeRect(rx, ry, rw, rh);
        break;
      }

      case "zone_ellipse": { // Elipse / Círculo tático
        const cx = (p1.x + p2.x) / 2;
        const cy = (p1.y + p2.y) / 2;
        const rx = Math.abs(p2.x - p1.x) / 2;
        const ry = Math.abs(p2.y - p1.y) / 2;

        ctx.globalAlpha = draw.opacity || 0.25;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(4, rx), Math.max(4, ry), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.setLineDash([6 * scale, 4 * scale]);
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Helper: Desenha seta contínua ou tracejada com ponta triangular elegante
   */
  drawArrow(p1, p2, isDashed = false) {
    const ctx = this.ctx;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);
    const scale = this.pitch.metrics.scale;
    const arrowHeadLen = Math.max(12, 16 * scale);

    if (dist < 4) return;

    ctx.save();
    if (isDashed) {
      ctx.setLineDash([8 * scale, 6 * scale]);
    }

    // Corpo da linha
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    const endLineX = p2.x - Math.cos(angle) * (arrowHeadLen * 0.7);
    const endLineY = p2.y - Math.sin(angle) * (arrowHeadLen * 0.7);
    ctx.lineTo(endLineX, endLineY);
    ctx.stroke();

    // Cabeça da seta
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(
      p2.x - arrowHeadLen * Math.cos(angle - Math.PI / 6),
      p2.y - arrowHeadLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      p2.x - (arrowHeadLen * 0.6) * Math.cos(angle),
      p2.y - (arrowHeadLen * 0.6) * Math.sin(angle)
    );
    ctx.lineTo(
      p2.x - arrowHeadLen * Math.cos(angle + Math.PI / 6),
      p2.y - arrowHeadLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Helper: Seta Ondulada (Zig-zag / Drible com condução)
   */
  drawWavyArrow(p1, p2) {
    const ctx = this.ctx;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const scale = this.pitch.metrics.scale;
    const arrowHeadLen = Math.max(12, 16 * scale);

    if (dist < 8) return;

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    const waveLen = Math.max(14, 18 * scale);
    const amp = Math.max(5, 7 * scale);
    const targetDist = dist - arrowHeadLen * 0.8;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x < targetDist; x += 4) {
      const y = Math.sin((x / waveLen) * Math.PI * 2) * amp;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Seta no final
    ctx.translate(dist, 0);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-arrowHeadLen, -arrowHeadLen * 0.5);
    ctx.lineTo(-arrowHeadLen * 0.6, 0);
    ctx.lineTo(-arrowHeadLen, arrowHeadLen * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Helper: Seta T-Bar (Bloqueio ou Barreira)
   */
  drawTBar(p1, p2) {
    const ctx = this.ctx;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const scale = this.pitch.metrics.scale;
    const barLen = Math.max(14, 20 * scale);

    ctx.save();
    // Linha principal
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Barra perpendicular em T
    const perpX = Math.cos(angle + Math.PI / 2) * barLen;
    const perpY = Math.sin(angle + Math.PI / 2) * barLen;

    ctx.lineWidth = ctx.lineWidth * 1.5;
    ctx.beginPath();
    ctx.moveTo(p2.x - perpX, p2.y - perpY);
    ctx.lineTo(p2.x + perpX, p2.y + perpY);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renderiza Equipamentos de Treino (Cones, Pratinhos, Escada, Barreiras, Mini-Gols)
   */
  renderEquipment() {
    this.equipment.forEach(eq => {
      const pt = this.pitch.courtToCanvas(eq.x, eq.y);
      const isSelected = this.selectedItem && this.selectedItem.id === eq.id;
      const scale = this.pitch.metrics.scale;
      const ctx = this.ctx;

      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(eq.angle || 0);

      if (isSelected) {
        ctx.shadowColor = "#FFCC00";
        ctx.shadowBlur = 14;
      }

      switch (eq.type) {
        case "cone": { // Cone alto
          const r = Math.max(9, 13 * scale);
          // Base
          ctx.fillStyle = eq.color || "#F97316";
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Topo circular concêntrico
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "disc": { // Pratinho / Chapéu chinês
          const r = Math.max(7, 10 * scale);
          ctx.fillStyle = eq.color || "#FFCC00";
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
          // Furo central
          ctx.fillStyle = "#0B1120";
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "ladder": { // Escada de agilidade
          const w = Math.max(65, 95 * scale);
          const h = Math.max(18, 26 * scale);
          const rungs = 5;

          ctx.strokeStyle = "#FDE047"; // Amarelo fluorescente
          ctx.lineWidth = Math.max(2, 3 * scale);
          // Hastes laterais
          ctx.beginPath();
          ctx.moveTo(-w / 2, -h / 2);
          ctx.lineTo(w / 2, -h / 2);
          ctx.moveTo(-w / 2, h / 2);
          ctx.lineTo(w / 2, h / 2);
          // Degraus
          const step = w / (rungs - 1);
          for (let i = 0; i < rungs; i++) {
            const rx = -w / 2 + i * step;
            ctx.moveTo(rx, -h / 2);
            ctx.lineTo(rx, h / 2);
          }
          ctx.stroke();
          break;
        }

        case "hurdle": { // Barreira de salto
          const w = Math.max(24, 34 * scale);
          const h = Math.max(8, 12 * scale);
          ctx.fillStyle = "#EF4444";
          ctx.fillRect(-w / 2, -h / 2, w, h);
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          break;
        }

        case "pole": { // Estaca de drible
          const r = Math.max(6, 9 * scale);
          ctx.fillStyle = "#38BDF8";
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#0284C7";
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        }

        case "hoop": { // Arco / Bambolê
          const r = Math.max(14, 20 * scale);
          ctx.strokeStyle = "#EC4899";
          ctx.lineWidth = Math.max(2.5, 3.5 * scale);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case "mini_goal": { // Mini-trave / Caixotinho
          const w = Math.max(28, 40 * scale);
          const h = Math.max(14, 20 * scale);
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2.5;
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          // Rede interna
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          ctx.fillRect(-w / 2, -h / 2, w, h);
          break;
        }
      }

      ctx.restore();
    });
  }

  /**
   * Renderiza Jogadores e Goleiros (Pinos com Número, Nome e Direção)
   */
  renderPlayers() {
    const ctx = this.ctx;
    const scale = this.pitch.metrics.scale;
    const radius = Math.max(14, 19 * scale);

    this.players.forEach(p => {
      const pt = this.pitch.courtToCanvas(p.x, p.y);
      const isSelected = this.selectedItem && this.selectedItem.id === p.id;

      ctx.save();
      ctx.translate(pt.x, pt.y);

      // Cores do time e do uniforme
      let jerseyColor, numberColor;
      if (p.team === "A") {
        jerseyColor = p.isGk ? SCHOOL_CONFIG.teamAGkColor : SCHOOL_CONFIG.teamAColor;
        numberColor = SCHOOL_CONFIG.teamATextColor;
      } else {
        jerseyColor = p.isGk ? SCHOOL_CONFIG.teamBGkColor : SCHOOL_CONFIG.teamBColor;
        numberColor = SCHOOL_CONFIG.teamBTextColor;
      }

      // Sombra e realce de seleção
      if (isSelected) {
        ctx.shadowColor = "#FFCC00";
        ctx.shadowBlur = 16;
      } else {
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
      }

      // 1. Indicador Direcional (Orientação do corpo / olhar do atleta)
      const angle = p.angle || 0;
      const coneLength = radius * 1.55;
      const coneWidth = Math.PI / 4;

      ctx.save();
      ctx.rotate(angle);

      // Triângulo/Cone de orientação
      ctx.fillStyle = isSelected ? "#FFCC00" : "rgba(255, 255, 255, 0.65)";
      ctx.beginPath();
      ctx.moveTo(radius * 0.7, -radius * 0.4);
      ctx.lineTo(coneLength, 0);
      ctx.lineTo(radius * 0.7, radius * 0.4);
      ctx.closePath();
      ctx.fill();

      // Se selecionado, desenha a alça de rotação para arrastar e girar
      if (isSelected) {
        const handleDist = radius * 1.85;
        ctx.fillStyle = "#FFCC00";
        ctx.strokeStyle = "#0B1120";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(handleDist, 0, Math.max(5, 6.5 * scale), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // 2. Círculo do Corpo (Pino de Futsal)
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = jerseyColor;
      ctx.fill();

      // Borda do pino
      ctx.strokeStyle = isSelected ? "#FFCC00" : (p.isGk ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)");
      ctx.lineWidth = isSelected ? Math.max(2.5, 3.5 * scale) : Math.max(1.5, 2.2 * scale);
      ctx.stroke();

      // Distintivo GK
      if (p.isGk) {
        ctx.strokeStyle = "#0B1120";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Número da Camisa no Centro
      ctx.shadowColor = "transparent";
      ctx.fillStyle = numberColor;
      ctx.font = `bold ${Math.max(11, Math.floor(13 * scale))}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.number, 0, 0.5);

      // 4. Nome do Jogador Abaixo do Pino
      if (p.name) {
        const nameY = radius + Math.max(10, 13 * scale);
        ctx.font = `600 ${Math.max(9, Math.floor(11 * scale))}px 'Inter', sans-serif`;

        // Fundo semitransparente para legibilidade sobre as linhas da quadra
        const nameMetrics = ctx.measureText(p.name);
        const padX = 5 * scale;
        const padY = 2 * scale;
        const bgW = nameMetrics.width + padX * 2;
        const bgH = Math.max(12, 14 * scale);

        ctx.fillStyle = "rgba(11, 17, 32, 0.75)";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-bgW / 2, nameY - bgH / 2, bgW, bgH, 3);
        } else {
          ctx.rect(-bgW / 2, nameY - bgH / 2, bgW, bgH);
        }
        ctx.fill();

        ctx.fillStyle = "#F8FAFC";
        ctx.fillText(p.name, 0, nameY);
      }

      ctx.restore();
    });
  }

  /**
   * Renderiza Bolas de Futsal (Design oficial de alto contraste)
   */
  renderBalls() {
    const ctx = this.ctx;
    const scale = this.pitch.metrics.scale;
    const radius = Math.max(8, 11 * scale);

    this.balls.forEach(b => {
      const pt = this.pitch.courtToCanvas(b.x, b.y);
      const isSelected = this.selectedItem && this.selectedItem.id === b.id;

      ctx.save();
      ctx.translate(pt.x, pt.y);

      // Sombra
      if (isSelected) {
        ctx.shadowColor = "#FFCC00";
        ctx.shadowBlur = 12;
      } else {
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
      }

      // Base da bola (Branco com borda)
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1E293B";
      ctx.lineWidth = Math.max(1.2, 1.8 * scale);
      ctx.stroke();

      // Gomos clássicos da bola de futsal em azul / estrela
      ctx.fillStyle = "#004AAD";
      ctx.beginPath();
      const pCount = 5;
      for (let i = 0; i < pCount; i++) {
        const a = (i / pCount) * Math.PI * 2 - Math.PI / 2;
        const rPent = radius * 0.45;
        const px = Math.cos(a) * rPent;
        const py = Math.sin(a) * rPent;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Linhas dos gomos
      ctx.strokeStyle = "#1E293B";
      ctx.lineWidth = 1;
      for (let i = 0; i < pCount; i++) {
        const a = (i / pCount) * Math.PI * 2 - Math.PI / 2;
        const rInner = radius * 0.45;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rInner, Math.sin(a) * rInner);
        ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
        ctx.stroke();
      }

      ctx.restore();
    });
  }
}
