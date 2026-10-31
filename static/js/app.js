/**
 * ==============================================================================
 * TACTICALPAD FUTSAL PRO - APLICAÇÃO PRINCIPAL (APP.JS)
 * Orquestrador central: Canvas Engine, Pointer Events, Integração com Django API,
 * Linha do tempo, Biblioteca de Treinos, Gestão de Professores e Exportador PNG.
 * ==============================================================================
 */

class TacticalBoardCore {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.pitch = new window.PitchRenderer(canvas);
    this.playersMgr = new window.PlayerEntityManager(this);
    this.drawingsMgr = new window.TacticalDrawings(this);
    this.animationEngine = new window.AnimationEngine(this);

    // Histórico Undo / Redo
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 40;

    this.setupEvents();
    this.playersMgr.initDefault();
    this.saveState();
  }

  setupEvents() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this));
    window.addEventListener("pointermove", this.handlePointerMove.bind(this));
    window.addEventListener("pointerup", this.handlePointerUp.bind(this));
    window.addEventListener("pointercancel", this.handlePointerUp.bind(this));

    window.addEventListener("keydown", (e) => {
      if (["Delete", "Backspace"].includes(e.key)) {
        if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
        this.playersMgr.deleteSelected();
      }
    });
  }

  handlePointerDown(e) {
    e.preventDefault();
    this.canvas.setPointerCapture?.(e.pointerId);

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const courtPos = this.pitch.canvasToCourt(screenX, screenY);

    // Borracha
    if (this.drawingsMgr.activeTool === "eraser") {
      const hitDraw = this.drawingsMgr.findHitDrawing(screenX, screenY);
      if (hitDraw) {
        this.drawingsMgr.drawings = this.drawingsMgr.drawings.filter(d => d.id !== hitDraw.id);
        this.saveState();
        this.render();
        return;
      }
      const hitEq = this.playersMgr.findHitEquipment(courtPos);
      if (hitEq) {
        this.playersMgr.equipment = this.playersMgr.equipment.filter(eq => eq.id !== hitEq.id);
        this.saveState();
        this.render();
        return;
      }
      const hitBall = this.playersMgr.findHitBall(courtPos);
      if (hitBall && this.playersMgr.balls.length > 1) {
        this.playersMgr.balls = this.playersMgr.balls.filter(b => b.id !== hitBall.id);
        this.saveState();
        this.render();
      }
      return;
    }

    // Ferramentas de Desenho
    if (this.drawingsMgr.isDrawingTool(this.drawingsMgr.activeTool)) {
      this.drawingsMgr.startDrawing(courtPos);
      return;
    }

    // Seleção / Mover
    if (this.drawingsMgr.activeTool === "select") {
      // 1. Alça de Rotação do Jogador
      if (this.playersMgr.selectedItem && this.playersMgr.selectedType === "player") {
        if (this.playersMgr.isHitRotationHandle(courtPos, this.playersMgr.selectedItem)) {
          this.playersMgr.isRotating = true;
          this.canvas.classList.add("cursor-grabbing");
          return;
        }
      }

      // 2. Jogador
      const hitPlayer = this.playersMgr.findHitPlayer(courtPos);
      if (hitPlayer) {
        this.playersMgr.selectItem(hitPlayer, "player", courtPos);
        this.render();
        return;
      }

      // 3. Bola
      const hitBall = this.playersMgr.findHitBall(courtPos);
      if (hitBall) {
        this.playersMgr.selectItem(hitBall, "ball", courtPos);
        this.render();
        return;
      }

      // 4. Equipamento
      const hitEq = this.playersMgr.findHitEquipment(courtPos);
      if (hitEq) {
        this.playersMgr.selectItem(hitEq, "equipment", courtPos);
        this.render();
        return;
      }

      // Vazio: desseleciona
      this.playersMgr.clearSelection();
      this.render();
    }
  }

  handlePointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const courtPos = this.pitch.canvasToCourt(screenX, screenY);

    if (this.playersMgr.isRotating && this.playersMgr.selectedItem) {
      const dx = courtPos.x - this.playersMgr.selectedItem.x;
      const dy = courtPos.y - this.playersMgr.selectedItem.y;
      this.playersMgr.selectedItem.angle = Math.atan2(dy, dx);
      this.render();
      return;
    }

    if (this.playersMgr.isDragging && this.playersMgr.selectedItem) {
      const dx = courtPos.x - this.playersMgr.dragStart.x;
      const dy = courtPos.y - this.playersMgr.dragStart.y;
      this.playersMgr.selectedItem.x = this.playersMgr.itemStartPos.x + dx;
      this.playersMgr.selectedItem.y = this.playersMgr.itemStartPos.y + dy;

      // Limita suavemente dentro da margem
      const bm = this.pitch.BORDER_MARGIN;
      this.playersMgr.selectedItem.x = Math.max(-bm + 10, Math.min(1000 + bm - 10, this.playersMgr.selectedItem.x));
      this.playersMgr.selectedItem.y = Math.max(-bm + 10, Math.min(500 + bm - 10, this.playersMgr.selectedItem.y));

      this.render();
      return;
    }

    if (this.drawingsMgr.currentDrawing) {
      this.drawingsMgr.updateDrawing(courtPos);
      this.render();
    }
  }

  handlePointerUp(e) {
    if (this.playersMgr.isDragging || this.playersMgr.isRotating) {
      this.playersMgr.isDragging = false;
      this.playersMgr.isRotating = false;
      this.canvas.classList.remove("cursor-grabbing");
      this.saveState();
    }
    if (this.drawingsMgr.currentDrawing) {
      this.drawingsMgr.finishDrawing();
    }
  }

  render() {
    this.pitch.render();
    this.drawingsMgr.renderZones();
    this.drawingsMgr.renderStrokes();
    this.playersMgr.render();
  }

  saveState() {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    const snapshot = {
      players: JSON.parse(JSON.stringify(this.playersMgr.players)),
      balls: JSON.parse(JSON.stringify(this.playersMgr.balls)),
      equipment: JSON.parse(JSON.stringify(this.playersMgr.equipment)),
      drawings: JSON.parse(JSON.stringify(this.drawingsMgr.drawings))
    };
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIndex = this.history.length - 1;
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
    this.playersMgr.players = JSON.parse(JSON.stringify(snapshot.players || []));
    this.playersMgr.balls = JSON.parse(JSON.stringify(snapshot.balls || []));
    this.playersMgr.equipment = JSON.parse(JSON.stringify(snapshot.equipment || []));
    this.drawingsMgr.drawings = JSON.parse(JSON.stringify(snapshot.drawings || []));
    this.playersMgr.clearSelection();
    this.render();
    this.onHistoryChange?.(this.historyIndex > 0, this.historyIndex < this.history.length - 1);
  }

  clearDrawings() {
    this.drawingsMgr.drawings = [];
    this.saveState();
    this.render();
  }

  resetBoard() {
    this.playersMgr.initDefault();
    this.drawingsMgr.drawings = [];
    this.playersMgr.clearSelection();
    this.saveState();
    this.render();
  }
}

/**
 * Aplicação Master TacticalPad Futsal Pro
 */
class TacticalPadApp {
  constructor() {
    this.currentTab = "board";
    this.drills = [];
    this.professors = [];
    this.activeDrillId = null;

    this.init();
  }

  async init() {
    // 1. Inicializa Configurações a partir do Django Template
    this.applyCSSVariables();

    // 2. Inicializa o motor da prancheta
    const canvas = document.getElementById("tactical-canvas");
    this.board = new TacticalBoardCore(canvas);

    // 3. Conecta Callbacks
    this.board.onSelectionChange = (item, type) => this.updateInspectorPanel(item, type);
    this.board.onHistoryChange = (canUndo, canRedo) => {
      const u = document.getElementById("btn-undo");
      const r = document.getElementById("btn-redo");
      if (u) u.disabled = !canUndo;
      if (r) r.disabled = !canRedo;
    };
    this.board.animationEngine.onTimelineChange = () => this.updateTimelineUI();
    this.board.animationEngine.onPlaybackStatusChange = (isPlaying) => {
      const btn = document.getElementById("btn-play-pause");
      if (btn) {
        btn.innerHTML = isPlaying
          ? `<i data-lucide="pause" class="w-5 h-5 fill-current"></i>`
          : `<i data-lucide="play" class="w-5 h-5 fill-current"></i>`;
        window.safeRenderIcons?.();
      }
    };

    // 4. Carrega Dados do Backend Django (Treinos e Professores)
    await Promise.all([
      this.loadDrillsFromBackend(),
      this.loadProfessorsFromBackend()
    ]);

    // 5. Vincula Eventos da Interface
    this.bindUIEvents();

    // 6. Atualização inicial de tela
    window.addEventListener("resize", () => {
      this.board.pitch.updateMetrics();
      this.board.render();
    });

    setTimeout(() => {
      this.board.pitch.updateMetrics();
      this.board.render();
      this.updateTimelineUI();
      window.safeRenderIcons?.();
    }, 100);
  }

  applyCSSVariables() {
    const cfg = window.SCHOOL_CONFIG || {};
    const root = document.documentElement;
    if (cfg.primaryColor) root.style.setProperty("--primary-color", cfg.primaryColor);
    if (cfg.secondaryColor) root.style.setProperty("--secondary-color", cfg.secondaryColor);
    if (cfg.pitchColor) root.style.setProperty("--court-floor", cfg.pitchColor);
    if (cfg.courtLineColor) root.style.setProperty("--court-lines", cfg.courtLineColor);

    document.querySelectorAll(".app-school-name").forEach(el => el.textContent = cfg.schoolName || "Futsal Academy");
    document.querySelectorAll(".app-school-tagline").forEach(el => el.textContent = cfg.tagline || "");
    document.querySelectorAll(".app-school-logo").forEach(img => {
      if (cfg.logoUrl) img.src = cfg.logoUrl;
    });
  }

  bindUIEvents() {
    // 1. Navegação SPA
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });

    // 2. Modos de Visualização
    document.querySelectorAll(".view-mode-btn").forEach(btn => {
      btn.addEventListener("click", () => this.setViewMode(btn.dataset.mode));
    });

    // 3. Ferramentas Táticas
    document.querySelectorAll(".tool-action-btn").forEach(btn => {
      btn.addEventListener("click", () => this.setActiveTool(btn.dataset.tool));
    });

    // 4. Cores do Traço
    document.querySelectorAll(".color-swatch-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.board.drawingsMgr.drawColor = btn.dataset.color;
        document.querySelectorAll(".color-swatch-btn").forEach(b => b.classList.remove("ring-2", "ring-white"));
        btn.classList.add("ring-2", "ring-white");
      });
    });

    // 5. Ações da Prancheta (Undo, Redo, Limpar, Reset)
    document.getElementById("btn-undo")?.addEventListener("click", () => this.board.undo());
    document.getElementById("btn-redo")?.addEventListener("click", () => this.board.redo());
    document.getElementById("btn-clear-drawings")?.addEventListener("click", () => {
      if (confirm("Limpar todos os desenhos da quadra? (Jogadores serão mantidos)")) {
        this.board.clearDrawings();
        this.showToast("Desenhos removidos da quadra.", "info");
      }
    });
    document.getElementById("btn-reset-board")?.addEventListener("click", () => {
      if (confirm("Reiniciar posicionamento padrão da quadra?")) {
        this.board.resetBoard();
        this.board.animationEngine.initDefaultKeyframe();
        this.updateTimelineUI();
        this.showToast("Prancheta reiniciada.", "info");
      }
    });

    // 6. Formações Rápidas
    document.querySelectorAll(".formation-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const formation = btn.dataset.formation;
        const team = btn.dataset.team || "A";
        this.board.playersMgr.applyFormation(team, formation);
        this.showToast(`Formação ${formation.toUpperCase()} aplicada!`, "success");
      });
    });

    // 7. Equipamentos e Bolas
    document.querySelectorAll(".add-equipment-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        const color = btn.dataset.color || "#F97316";
        if (type === "ball") {
          this.board.playersMgr.addBall();
          this.showToast("Nova bola adicionada à quadra!", "success");
        } else {
          this.board.playersMgr.addEquipment(type, color);
          this.showToast("Equipamento adicionado!", "success");
        }
      });
    });

    // 8. Adicionar Atletas
    document.getElementById("btn-add-player-a")?.addEventListener("click", () => this.board.playersMgr.addPlayer("A", false));
    document.getElementById("btn-add-player-b")?.addEventListener("click", () => this.board.playersMgr.addPlayer("B", false));
    document.getElementById("btn-add-gk-a")?.addEventListener("click", () => this.board.playersMgr.addPlayer("A", true));

    // 9. Linha do Tempo e Animação
    document.getElementById("btn-add-keyframe")?.addEventListener("click", () => {
      this.board.animationEngine.addKeyframe();
      this.showToast(`Quadro ${this.board.animationEngine.keyframes.length} capturado!`, "success");
    });
    document.getElementById("btn-duplicate-keyframe")?.addEventListener("click", () => {
      this.board.animationEngine.duplicateCurrentKeyframe();
      this.showToast("Quadro duplicado com sucesso!", "success");
    });
    document.getElementById("btn-delete-keyframe")?.addEventListener("click", () => {
      this.board.animationEngine.deleteCurrentKeyframe();
    });
    document.getElementById("btn-play-pause")?.addEventListener("click", () => {
      this.board.animationEngine.togglePlay();
    });
    document.getElementById("btn-stop-anim")?.addEventListener("click", () => {
      this.board.animationEngine.stop();
    });
    document.getElementById("btn-toggle-loop")?.addEventListener("click", (e) => {
      const isLoop = this.board.animationEngine.toggleLoop();
      e.currentTarget.classList.toggle("text-amber-400", isLoop);
      e.currentTarget.classList.toggle("text-slate-400", !isLoop);
    });
    document.getElementById("btn-toggle-trails")?.addEventListener("click", (e) => {
      const show = this.board.animationEngine.toggleTrails();
      e.currentTarget.classList.toggle("text-amber-400", show);
      e.currentTarget.classList.toggle("text-slate-400", !show);
    });

    document.querySelectorAll(".speed-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const speed = parseFloat(btn.dataset.speed) || 1.0;
        this.board.animationEngine.setSpeed(speed);
        document.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("bg-amber-400", "text-slate-950", "font-bold"));
        btn.classList.add("bg-amber-400", "text-slate-950", "font-bold");
      });
    });

    // 10. Salvar e Exportar
    document.getElementById("btn-save-to-library")?.addEventListener("click", () => this.saveCurrentDrillToBackend());
    document.getElementById("btn-export-highres-png")?.addEventListener("click", () => this.exportHighResPng());

    // 11. Modal de Configurações da Quadra
    this.setupCourtSettingsModal();

    // 12. Modal de Professores
    this.setupProfessorModal();

    // 13. Filtros da Biblioteca
    this.setupLibraryFilters();
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle("bg-amber-400", isActive);
      btn.classList.toggle("text-slate-950", isActive);
      btn.classList.toggle("font-bold", isActive);
      btn.classList.toggle("text-slate-300", !isActive);
    });

    document.getElementById("tab-board-container").classList.toggle("hidden", tab !== "board");
    document.getElementById("tab-library-container").classList.toggle("hidden", tab !== "library");
    document.getElementById("tab-coaches-container").classList.toggle("hidden", tab !== "coaches");

    if (tab === "board") {
      this.board.pitch.updateMetrics();
      this.board.render();
    } else if (tab === "library") {
      this.renderLibraryGallery();
    } else if (tab === "coaches") {
      this.renderCoachesGrid();
    }
    window.safeRenderIcons?.();
  }

  setViewMode(mode) {
    this.board.pitch.setViewMode(mode);
    document.querySelectorAll(".view-mode-btn").forEach(btn => {
      const isActive = btn.dataset.mode === mode;
      btn.classList.toggle("bg-amber-400", isActive);
      btn.classList.toggle("text-slate-950", isActive);
      btn.classList.toggle("font-bold", isActive);
      btn.classList.toggle("text-slate-400", !isActive);
    });
    this.board.render();
  }

  setActiveTool(tool) {
    this.board.drawingsMgr.activeTool = tool;
    const canvas = this.board.pitch.canvas;
    canvas.className = "";
    if (tool === "select") canvas.classList.add("cursor-grab");
    else if (tool === "eraser") canvas.classList.add("cursor-eraser");
    else canvas.classList.add("cursor-crosshair");

    document.querySelectorAll(".tool-action-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tool === tool);
    });
  }

  updateTimelineUI() {
    const container = document.getElementById("timeline-thumbnails-list");
    if (!container) return;
    const anim = this.board.animationEngine;

    container.innerHTML = anim.keyframes.map((kf, idx) => {
      const isActive = idx === anim.currentFrameIndex;
      return `
        <button onclick="window.app.board.animationEngine.loadFrame(${idx})"
                class="timeline-frame px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive ? 'active' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border-slate-700'
                }">
          <i data-lucide="video" class="w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}"></i>
          <span>${kf.label || `Quadro ${idx + 1}`}</span>
        </button>
      `;
    }).join("");
    window.safeRenderIcons?.();
  }

  updateInspectorPanel(item, type) {
    const inspector = document.getElementById("item-inspector-panel");
    if (!inspector) return;
    if (!item) {
      inspector.classList.add("hidden");
      return;
    }
    inspector.classList.remove("hidden");

    if (type === "player") {
      inspector.innerHTML = `
        <div class="p-3 bg-slate-900/95 border border-amber-400/30 rounded-xl space-y-2.5 text-xs">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span class="font-bold text-amber-400 flex items-center gap-1">
              <i data-lucide="user-check" class="w-3.5 h-3.5"></i> Atleta (Time ${item.team})
            </span>
            <button onclick="window.app.board.playersMgr.deleteSelected()"
                    class="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-slate-400 text-[10px] block mb-0.5">Camisa</label>
              <input type="number" value="${item.number}" min="1" max="99"
                     onchange="window.app.updatePlayerNumber(this.value)"
                     class="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-center font-bold" />
            </div>
            <div>
              <label class="text-slate-400 text-[10px] block mb-0.5">Posição</label>
              <button onclick="window.app.togglePlayerGk()"
                      class="w-full py-1 rounded font-semibold text-center ${
                        item.isGk ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }">
                ${item.isGk ? 'Goleiro' : 'Linha'}
              </button>
            </div>
          </div>
          <div>
            <label class="text-slate-400 text-[10px] block mb-0.5">Nome do Atleta</label>
            <input type="text" value="${item.name || ''}"
                   oninput="window.app.updatePlayerName(this.value)"
                   class="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-medium" />
          </div>
          <div class="flex gap-1.5 pt-1">
            <button onclick="window.app.rotatePlayer(45)"
                    class="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1">
              <i data-lucide="rotate-cw" class="w-3 h-3"></i> Girar +45°
            </button>
            <button onclick="window.app.togglePlayerTeam()"
                    class="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium">
              Trocar Time
            </button>
          </div>
        </div>
      `;
    } else if (type === "equipment") {
      inspector.innerHTML = `
        <div class="p-3 bg-slate-900/95 border border-amber-400/30 rounded-xl space-y-2 text-xs">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span class="font-bold text-amber-400 flex items-center gap-1">
              <i data-lucide="box" class="w-3.5 h-3.5"></i> Equipamento: ${item.type.toUpperCase()}
            </span>
            <button onclick="window.app.board.playersMgr.deleteSelected()"
                    class="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <button onclick="window.app.rotatePlayer(45)"
                  class="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1">
            <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i> Girar Equipamento
          </button>
        </div>
      `;
    }
    window.safeRenderIcons?.();
  }

  updatePlayerNumber(n) {
    if (this.board.playersMgr.selectedItem) {
      this.board.playersMgr.selectedItem.number = parseInt(n, 10) || 1;
      this.board.saveState();
      this.board.render();
    }
  }

  updatePlayerName(name) {
    if (this.board.playersMgr.selectedItem) {
      this.board.playersMgr.selectedItem.name = name;
      this.board.render();
    }
  }

  togglePlayerGk() {
    const p = this.board.playersMgr.selectedItem;
    if (p) {
      p.isGk = !p.isGk;
      this.board.saveState();
      this.board.render();
      this.updateInspectorPanel(p, "player");
    }
  }

  togglePlayerTeam() {
    const p = this.board.playersMgr.selectedItem;
    if (p) {
      p.team = p.team === "A" ? "B" : "A";
      this.board.saveState();
      this.board.render();
      this.updateInspectorPanel(p, "player");
    }
  }

  rotatePlayer(deg) {
    const item = this.board.playersMgr.selectedItem;
    if (item) {
      item.angle = (item.angle || 0) + (deg * Math.PI / 180);
      this.board.saveState();
      this.board.render();
    }
  }

  // --- INTEGRAÇÃO COM DJANGO BACKEND ---
  async loadDrillsFromBackend() {
    try {
      const res = await window.tacticalApi.listTacticalPlays();
      if (res.status === "success") {
        this.drills = res.data;
        this.renderLibraryGallery();
      }
    } catch (err) {
      console.warn("Backend offline ou sem conexão. Usando fallback local.");
    }
  }

  async saveCurrentDrillToBackend() {
    this.board.animationEngine.saveCurrentToActiveFrame();
    const title = document.getElementById("drill-title-input")?.value.trim() || "Treino Tático";
    const category = document.getElementById("drill-category-select")?.value || "Sub-15";
    const type = document.getElementById("drill-type-select")?.value || "Tática";
    const duration = document.getElementById("drill-duration-input")?.value || 25;
    const author = document.getElementById("drill-author-input")?.value.trim() || "Comissão Técnica";
    const objectives = document.getElementById("drill-objectives-input")?.value.trim() || "";
    const rules = document.getElementById("drill-rules-input")?.value.trim() || "";
    const coachingPoints = document.getElementById("drill-coaching-input")?.value.trim() || "";

    const payload = {
      id: this.activeDrillId,
      title,
      category,
      type,
      duration,
      author,
      objectives,
      rules,
      coachingPoints,
      viewMode: this.board.pitch.viewMode,
      thumbnail: this.generateThumbnail(),
      keyframes: this.board.animationEngine.keyframes
    };

    try {
      const res = await window.tacticalApi.saveTacticalPlay(payload);
      if (res.status === "success") {
        this.activeDrillId = res.data.id;
        await this.loadDrillsFromBackend();
        this.showToast(`Treino "${res.data.title}" salvo no banco de dados!`, "success");
      }
    } catch (err) {
      this.showToast("Erro ao salvar treino no banco de dados.", "error");
    }
  }

  async loadDrillToBoard(drillId) {
    try {
      const res = await window.tacticalApi.getTacticalPlay(drillId);
      if (res.status === "success") {
        const drill = res.data;
        this.activeDrillId = drill.id;

        if (drill.viewMode) this.setViewMode(drill.viewMode);
        if (drill.keyframes && drill.keyframes.length > 0) {
          this.board.animationEngine.keyframes = JSON.parse(JSON.stringify(drill.keyframes));
          this.board.animationEngine.currentFrameIndex = 0;
          this.board.animationEngine.loadFrame(0);
        }

        if (document.getElementById("drill-title-input")) document.getElementById("drill-title-input").value = drill.title || "";
        if (document.getElementById("drill-category-select")) document.getElementById("drill-category-select").value = drill.category || "Sub-15";
        if (document.getElementById("drill-type-select")) document.getElementById("drill-type-select").value = drill.type || "Tática";
        if (document.getElementById("drill-duration-input")) document.getElementById("drill-duration-input").value = drill.duration || 25;
        if (document.getElementById("drill-author-input")) document.getElementById("drill-author-input").value = drill.author || "";
        if (document.getElementById("drill-objectives-input")) document.getElementById("drill-objectives-input").value = drill.objectives || "";
        if (document.getElementById("drill-rules-input")) document.getElementById("drill-rules-input").value = drill.rules || "";
        if (document.getElementById("drill-coaching-input")) document.getElementById("drill-coaching-input").value = drill.coachingPoints || "";

        this.switchTab("board");
        this.showToast(`Treino "${drill.title}" carregado com sucesso!`, "success");
      }
    } catch (err) {
      this.showToast("Erro ao carregar treino.", "error");
    }
  }

  async deleteDrillFromBackend(drillId, title) {
    if (!confirm(`Deseja realmente remover o treino "${title}"?`)) return;
    try {
      const res = await window.tacticalApi.deleteTacticalPlay(drillId);
      if (res.status === "success") {
        await this.loadDrillsFromBackend();
        this.showToast("Treino removido com sucesso.", "info");
      }
    } catch (err) {
      this.showToast("Erro ao remover treino.", "error");
    }
  }

  generateThumbnail() {
    try {
      const thumb = document.createElement("canvas");
      thumb.width = 320; thumb.height = 180;
      const tCtx = thumb.getContext("2d");
      tCtx.drawImage(this.board.canvas, 0, 0, 320, 180);
      return thumb.toDataURL("image/jpeg", 0.7);
    } catch (e) {
      return "";
    }
  }

  renderLibraryGallery() {
    const container = document.getElementById("drills-gallery-grid");
    const countBadge = document.getElementById("drills-count-badge");
    if (!container) return;

    if (countBadge) countBadge.textContent = `${this.drills.length} treinos`;

    if (this.drills.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <i data-lucide="folder-search" class="w-16 h-16 mx-auto mb-4 text-slate-600"></i>
          <h3 class="text-xl font-bold text-slate-200 mb-1">Nenhum treino na biblioteca</h3>
          <p class="text-sm">Execute 'python manage.py seed_catalog' ou monte um novo treino na prancheta!</p>
        </div>
      `;
      window.safeRenderIcons?.();
      return;
    }

    container.innerHTML = this.drills.map(drill => {
      const kfCount = drill.keyframes ? drill.keyframes.length : 1;
      return `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800 hover:border-amber-400/50 transition-all duration-300">
          <div class="relative h-44 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
            ${drill.thumbnail ? `
              <img src="${drill.thumbnail}" alt="${drill.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ` : `
              <div class="flex flex-col items-center justify-center text-slate-600">
                <i data-lucide="clipboard" class="w-12 h-12 mb-2 text-slate-700"></i>
                <span class="text-xs font-semibold">Sem miniatura</span>
              </div>
            `}
            <div class="absolute top-3 left-3 flex gap-2">
              <span class="px-2.5 py-1 text-xs font-bold rounded-lg border bg-blue-500/20 text-blue-300 border-blue-500/40 backdrop-blur-md">
                ${drill.category}
              </span>
              <span class="px-2.5 py-1 text-xs font-semibold rounded-lg border bg-slate-900/80 text-slate-300 border-slate-700 backdrop-blur-md">
                ${drill.type}
              </span>
            </div>
            <div class="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-amber-400 border border-slate-700">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
              <span>${kfCount} ${kfCount === 1 ? 'quadro' : 'quadros'}</span>
            </div>
          </div>

          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${drill.duration} min</span>
                <span class="flex items-center gap-1"><i data-lucide="user" class="w-3.5 h-3.5"></i> ${drill.author}</span>
              </div>
              <h4 class="text-base font-bold text-white mb-2 line-clamp-1 group-hover:text-amber-400 transition-colors">
                ${drill.title}
              </h4>
              <p class="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                ${drill.objectives || drill.description || "Sem objetivos descritos."}
              </p>
            </div>

            <div class="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <button onclick="window.app.loadDrillToBoard(${drill.id})"
                      class="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-400/20">
                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i> Abrir na Prancheta
              </button>
              <button onclick="window.app.deleteDrillFromBackend(${drill.id}, '${drill.title}')"
                      title="Excluir Treino"
                      class="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
    window.safeRenderIcons?.();
  }

  // --- PROFESSORES (COMISSÃO TÉCNICA) ---
  async loadProfessorsFromBackend() {
    try {
      const res = await window.tacticalApi.listProfessors();
      if (res.status === "success") {
        this.professors = res.data;
        this.renderCoachesGrid();
      }
    } catch (err) {
      console.warn("Erro ao carregar comissão técnica.");
    }
  }

  renderCoachesGrid() {
    const grid = document.getElementById("coaches-grid");
    if (!grid) return;

    if (this.professors.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <i data-lucide="users" class="w-16 h-16 mx-auto mb-4 text-slate-600"></i>
          <h3 class="text-xl font-bold text-slate-200 mb-1">Nenhum professor cadastrado</h3>
          <p class="text-sm">Clique em 'Adicionar Professor' ou execute 'python manage.py seed_catalog'.</p>
        </div>
      `;
      window.safeRenderIcons?.();
      return;
    }

    grid.innerHTML = this.professors.map(coach => {
      const catList = Array.isArray(coach.categories) ? coach.categories : [coach.categories];
      const categoriesHtml = catList.filter(Boolean).map(cat => `
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30">
          ${cat}
        </span>
      `).join("");

      return `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col border border-slate-800 hover:border-amber-400/50 transition-all duration-300">
          <div class="relative h-32 bg-gradient-to-r from-blue-900 to-indigo-950 p-4 flex items-end">
            <div class="absolute top-3 right-3 flex gap-2">
              <button onclick="window.app.openEditProfessorModal(${coach.id})"
                      class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition-colors border border-slate-700 shadow"
                      title="Editar Professor">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="window.app.deleteProfessorFromBackend(${coach.id}, '${coach.name}')"
                      class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-500 hover:text-white text-slate-400 transition-colors border border-slate-700 shadow"
                      title="Remover Professor">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="absolute -bottom-8 left-6">
              <div class="w-20 h-20 rounded-2xl border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-xl">
                <img src="${coach.photoUrl}" alt="${coach.name}" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div class="pt-11 p-6 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-1">
                <h3 class="text-lg font-bold text-white font-heading">${coach.name}</h3>
                <span class="text-xs font-medium text-slate-400">${coach.experience || ''}</span>
              </div>
              <p class="text-xs font-semibold text-amber-400 mb-3 flex items-center gap-1.5">
                <i data-lucide="award" class="w-4 h-4 text-amber-400"></i> ${coach.role}
              </p>
              <div class="flex flex-wrap gap-1.5 mb-4">${categoriesHtml}</div>
              <div class="bg-slate-900/70 rounded-xl p-3 mb-4 border border-slate-800 text-xs space-y-1.5">
                <div class="flex items-center gap-2 text-slate-300">
                  <i data-lucide="badge-check" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span class="font-semibold">${coach.cref}</span>
                </div>
                <div class="flex items-center gap-2 text-slate-400">
                  <i data-lucide="graduation-cap" class="w-4 h-4 text-cyan-400 shrink-0"></i>
                  <span class="truncate">${coach.licenses}</span>
                </div>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed mb-4">${coach.bio}</p>
              ${coach.philosophy ? `
                <div class="pl-3 border-l-2 border-amber-400 text-xs italic text-amber-200/90 mb-4 py-0.5">
                  ${coach.philosophy}
                </div>
              ` : ''}
            </div>

            <div class="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span class="flex items-center gap-1.5 truncate"><i data-lucide="mail" class="w-3.5 h-3.5"></i> ${coach.email || 'contato@escolinha.com'}</span>
              <span class="flex items-center gap-1.5"><i data-lucide="phone" class="w-3.5 h-3.5"></i> ${coach.phone || ''}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
    window.safeRenderIcons?.();
  }

  setupProfessorModal() {
    const modal = document.getElementById("coach-modal");
    const form = document.getElementById("coach-form");
    const photoInput = document.getElementById("coach-photo-input");
    const photoPreview = document.getElementById("coach-photo-preview");

    photoInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          if (photoPreview) photoPreview.src = re.target.result;
          photoInput.dataset.base64 = re.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        id: form.dataset.editId || null,
        name: document.getElementById("coach-name-input").value.trim(),
        role: document.getElementById("coach-role-input").value.trim(),
        categories: document.getElementById("coach-categories-input").value.trim(),
        cref: document.getElementById("coach-cref-input").value.trim(),
        licenses: document.getElementById("coach-licenses-input").value.trim(),
        experience: document.getElementById("coach-experience-input").value.trim(),
        bio: document.getElementById("coach-bio-input").value.trim(),
        philosophy: document.getElementById("coach-philosophy-input").value.trim(),
        email: document.getElementById("coach-email-input").value.trim(),
        phone: document.getElementById("coach-phone-input").value.trim(),
        photoUrl: photoInput?.dataset?.base64 || photoPreview?.src || ""
      };

      try {
        const res = await window.tacticalApi.saveProfessor(payload);
        if (res.status === "success") {
          await this.loadProfessorsFromBackend();
          modal?.classList.remove("open");
          this.showToast("Professor salvo com sucesso!", "success");
        }
      } catch (err) {
        this.showToast("Erro ao salvar dados do professor.", "error");
      }
    });
  }

  openCreateProfessorModal() {
    const modal = document.getElementById("coach-modal");
    const form = document.getElementById("coach-form");
    if (form) {
      form.reset();
      delete form.dataset.editId;
    }
    const title = document.getElementById("coach-modal-title");
    if (title) title.textContent = "Adicionar Novo Professor";
    modal?.classList.add("open");
    window.safeRenderIcons?.();
  }

  openEditProfessorModal(id) {
    const coach = this.professors.find(c => c.id === id);
    if (!coach) return;

    const modal = document.getElementById("coach-modal");
    const form = document.getElementById("coach-form");
    if (form) form.dataset.editId = id;

    const title = document.getElementById("coach-modal-title");
    if (title) title.textContent = `Editar: ${coach.name}`;

    document.getElementById("coach-name-input").value = coach.name || "";
    document.getElementById("coach-role-input").value = coach.role || "";
    document.getElementById("coach-categories-input").value = (coach.categories || []).join(", ");
    document.getElementById("coach-cref-input").value = coach.cref || "";
    document.getElementById("coach-licenses-input").value = coach.licenses || "";
    document.getElementById("coach-experience-input").value = coach.experience || "";
    document.getElementById("coach-bio-input").value = coach.bio || "";
    document.getElementById("coach-philosophy-input").value = coach.philosophy || "";
    document.getElementById("coach-email-input").value = coach.email || "";
    document.getElementById("coach-phone-input").value = coach.phone || "";

    const preview = document.getElementById("coach-photo-preview");
    if (preview) preview.src = coach.photoUrl || "";

    modal?.classList.add("open");
    window.safeRenderIcons?.();
  }

  async deleteProfessorFromBackend(id, name) {
    if (!confirm(`Remover "${name}" da comissão técnica?`)) return;
    try {
      const res = await window.tacticalApi.deleteProfessor(id);
      if (res.status === "success") {
        await this.loadProfessorsFromBackend();
        this.showToast("Professor removido com sucesso.", "info");
      }
    } catch (err) {
      this.showToast("Erro ao remover professor.", "error");
    }
  }

  // --- MODAL DE CONFIGURAÇÕES DA QUADRA ---
  setupCourtSettingsModal() {
    const modal = document.getElementById("court-settings-modal");
    const openBtn = document.getElementById("btn-open-court-settings");
    const closeBtn = document.getElementById("btn-close-court-settings");
    const saveBtn = document.getElementById("btn-save-court-settings");
    const logoInput = document.getElementById("setting-logo-input");

    openBtn?.addEventListener("click", () => {
      const cfg = window.SCHOOL_CONFIG || {};
      document.getElementById("setting-school-name").value = cfg.schoolName || "";
      document.getElementById("setting-tagline").value = cfg.tagline || "";
      document.getElementById("setting-primary-color").value = cfg.primaryColor || "#004AAD";
      document.getElementById("setting-secondary-color").value = cfg.secondaryColor || "#FFCC00";
      document.getElementById("setting-pitch-color").value = cfg.pitchColor || "#1E3A5F";
      document.getElementById("setting-area-color").value = cfg.pitchAreaColor || "#142640";
      document.getElementById("setting-line-color").value = cfg.courtLineColor || "#FFFFFF";
      document.getElementById("setting-team-a-color").value = cfg.teamAColor || "#004AAD";
      document.getElementById("setting-team-b-color").value = cfg.teamBColor || "#DC2626";
      document.getElementById("setting-logo-opacity").value = cfg.logoOpacity || 0.28;
      modal?.classList.add("open");
    });

    closeBtn?.addEventListener("click", () => modal?.classList.remove("open"));

    logoInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          logoInput.dataset.base64 = re.target.result;
          this.showToast("Logo carregada! Clique em Salvar para aplicar.", "info");
        };
        reader.readAsDataURL(file);
      }
    });

    saveBtn?.addEventListener("click", async () => {
      const payload = {
        schoolName: document.getElementById("setting-school-name").value.trim(),
        tagline: document.getElementById("setting-tagline").value.trim(),
        primaryColor: document.getElementById("setting-primary-color").value,
        secondaryColor: document.getElementById("setting-secondary-color").value,
        pitchPreset: document.getElementById("setting-pitch-preset").value,
        pitchColor: document.getElementById("setting-pitch-color").value,
        pitchAreaColor: document.getElementById("setting-area-color").value,
        courtLineColor: document.getElementById("setting-line-color").value,
        teamAColor: document.getElementById("setting-team-a-color").value,
        teamBColor: document.getElementById("setting-team-b-color").value,
        logoOpacity: parseFloat(document.getElementById("setting-logo-opacity").value) || 0.28,
        showCornerLogos: document.getElementById("setting-corner-logos").checked,
      };

      if (logoInput?.dataset?.base64) {
        payload.logoUrl = logoInput.dataset.base64;
      }

      try {
        const res = await window.tacticalApi.saveSchoolConfig(payload);
        if (res.status === "success") {
          window.SCHOOL_CONFIG = res.data;
          this.applyCSSVariables();
          if (payload.logoUrl) this.board.pitch.loadLogo(payload.logoUrl);
          this.board.render();
          modal?.classList.remove("open");
          this.showToast("Configurações salvas no servidor Django!", "success");
        }
      } catch (err) {
        this.showToast("Erro ao salvar configurações.", "error");
      }
    });
  }

  setupLibraryFilters() {
    document.querySelectorAll(".category-filter-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const cat = btn.dataset.category;
        document.querySelectorAll(".category-filter-btn").forEach(b => {
          b.classList.remove("bg-amber-400", "text-slate-950", "font-bold");
          b.classList.add("bg-slate-800", "text-slate-300");
        });
        btn.classList.remove("bg-slate-800", "text-slate-300");
        btn.classList.add("bg-amber-400", "text-slate-950", "font-bold");

        const drillType = document.getElementById("library-type-select")?.value || "all";
        const q = document.getElementById("library-search-input")?.value.trim() || "";
        const res = await window.tacticalApi.listTacticalPlays(cat, drillType, q);
        if (res.status === "success") {
          this.drills = res.data;
          this.renderLibraryGallery();
        }
      });
    });

    document.getElementById("library-type-select")?.addEventListener("change", async (e) => {
      const cat = document.querySelector(".category-filter-btn.bg-amber-400")?.dataset?.category || "all";
      const q = document.getElementById("library-search-input")?.value.trim() || "";
      const res = await window.tacticalApi.listTacticalPlays(cat, e.target.value, q);
      if (res.status === "success") {
        this.drills = res.data;
        this.renderLibraryGallery();
      }
    });

    document.getElementById("library-search-input")?.addEventListener("input", async (e) => {
      const cat = document.querySelector(".category-filter-btn.bg-amber-400")?.dataset?.category || "all";
      const drillType = document.getElementById("library-type-select")?.value || "all";
      const res = await window.tacticalApi.listTacticalPlays(cat, drillType, e.target.value.trim());
      if (res.status === "success") {
        this.drills = res.data;
        this.renderLibraryGallery();
      }
    });
  }

  exportHighResPng() {
    this.showToast("Gerando prancheta em alta resolução Full HD...", "info");
    const title = document.getElementById("drill-title-input")?.value.trim() || "Treino Tático";
    const category = document.getElementById("drill-category-select")?.value || "Geral";
    const author = document.getElementById("drill-author-input")?.value.trim() || "Comissão Técnica";
    const objectives = document.getElementById("drill-objectives-input")?.value.trim() || "";
    const cfg = window.SCHOOL_CONFIG || {};

    const expW = 1920;
    const expH = 1080;
    const expCanvas = document.createElement("canvas");
    expCanvas.width = expW; expCanvas.height = expH;
    const expCtx = expCanvas.getContext("2d");

    expCtx.fillStyle = "#070D19";
    expCtx.fillRect(0, 0, expW, expH);

    // Header oficial
    const headerH = 130;
    const grad = expCtx.createLinearGradient(0, 0, expW, 0);
    grad.addColorStop(0, "#002B66");
    grad.addColorStop(1, "#070D19");
    expCtx.fillStyle = grad;
    expCtx.fillRect(0, 0, expW, headerH);

    expCtx.fillStyle = cfg.secondaryColor || "#FFCC00";
    expCtx.fillRect(0, headerH - 4, expW, 4);

    if (this.board.pitch.logoImage && this.board.pitch.logoLoaded) {
      expCtx.drawImage(this.board.pitch.logoImage, 40, 20, 90, 90);
    }

    expCtx.fillStyle = "#FFFFFF";
    expCtx.font = "bold 32px 'Outfit', sans-serif";
    expCtx.fillText((cfg.schoolName || "Futsal Academy").toUpperCase(), 150, 52);

    expCtx.fillStyle = cfg.secondaryColor || "#FFCC00";
    expCtx.font = "600 24px 'Outfit', sans-serif";
    expCtx.fillText(title, 150, 90);

    expCtx.font = "600 16px 'Inter', sans-serif";
    expCtx.fillStyle = "#94A3B8";
    const dateStr = new Date().toLocaleDateString("pt-BR");
    expCtx.fillText(`Categoria: ${category} | Prof: ${author} | Data: ${dateStr}`, expW - 520, 72);

    // Desenha a quadra
    const courtAreaY = headerH + 20;
    const courtAreaH = expH - headerH - (objectives ? 100 : 40);
    const courtAreaW = expW - 80;

    expCtx.drawImage(this.board.canvas, 0, 0, this.board.canvas.width, this.board.canvas.height, 40, courtAreaY, courtAreaW, courtAreaH);

    if (objectives) {
      const footerY = expH - 80;
      expCtx.fillStyle = "rgba(17, 28, 46, 0.92)";
      expCtx.fillRect(40, footerY, expW - 80, 60);
      expCtx.strokeStyle = "rgba(255, 204, 0, 0.35)";
      expCtx.strokeRect(40, footerY, expW - 80, 60);

      expCtx.fillStyle = "#FFCC00";
      expCtx.font = "bold 15px 'Outfit', sans-serif";
      expCtx.fillText("OBJETIVOS DO TREINO:", 60, footerY + 26);

      expCtx.fillStyle = "#F1F5F9";
      expCtx.font = "400 14px 'Inter', sans-serif";
      expCtx.fillText(objectives, 60, footerY + 48, expW - 120);
    }

    const link = document.createElement("a");
    link.download = `TacticalPad_${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;
    link.href = expCanvas.toDataURL("image/png");
    link.click();
    this.showToast("Imagem Full HD baixada com sucesso!", "success");
  }

  showToast(message, type = "info") {
    let toast = document.getElementById("app-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "app-toast";
      toast.className = "fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-semibold transition-all duration-300 transform translate-y-8 opacity-0";
      document.body.appendChild(toast);
    }

    const typeClasses = {
      success: "bg-emerald-500/90 text-white border border-emerald-400/40",
      info: "bg-blue-600/90 text-white border border-blue-400/40",
      error: "bg-rose-600/90 text-white border border-rose-400/40"
    };

    toast.className = `fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-semibold transition-all duration-300 ${typeClasses[type] || typeClasses.info}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-triangle' : 'info')}" class="w-4 h-4"></i>
      <span>${message}</span>
    `;

    window.safeRenderIcons?.();
    setTimeout(() => toast.classList.remove("translate-y-8", "opacity-0"), 10);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.add("translate-y-8", "opacity-0"), 3200);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.app = new TacticalPadApp();
});
