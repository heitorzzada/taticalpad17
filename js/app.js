/**
 * ==============================================================================
 * APLICAÇÃO PRINCIPAL - TACTICALPAD FUTSAL PRO
 * Orquestrador geral: navegação SPA, barra de ferramentas, linha do tempo,
 * modal de configurações de identidade e exportação PNG em alta resolução.
 * ==============================================================================
 */

class TacticalPadApp {
  constructor() {
    this.currentTab = "board"; // 'board' | 'library' | 'coaches'
    this.init();
  }

  init() {
    // 1. Inicializa configurações visuais e identidade da escolinha
    ConfigManager.init();

    // 2. Inicializa o renderizador da quadra de futsal
    const canvas = document.getElementById("tactical-canvas");
    this.pitch = new PitchRenderer(canvas);

    // 3. Inicializa o motor tático interativo
    this.board = new TacticalBoard(this.pitch);

    // 4. Inicializa o sistema de animação quadro a quadro
    this.animationEngine = new AnimationEngine(this.board);

    // 5. Inicializa gerenciadores das páginas da SPA
    this.drillLibrary = new DrillLibrary(this);
    this.coachesManager = new CoachesManager(this);

    // 6. Conecta callbacks e ouvintes de interface
    this.bindCallbacks();
    this.bindUIEvents();

    // 7. Ajusta dimensões iniciais e renderiza
    window.addEventListener("resize", () => {
      this.pitch.updateMetrics();
      this.board.render();
    });

    setTimeout(() => {
      this.pitch.updateMetrics();
      this.board.render();
      this.updateTimelineUI();
      window.safeRenderIcons();
    }, 100);
  }

  /**
   * Conecta callbacks entre o motor tático e a interface
   */
  bindCallbacks() {
    // Mudança de seleção de jogador/item
    this.board.onSelectionChange = (item, type) => {
      this.updateInspectorPanel(item, type);
    };

    // Mudança no histórico Undo/Redo
    this.board.onHistoryChange = (canUndo, canRedo) => {
      const undoBtn = document.getElementById("btn-undo");
      const redoBtn = document.getElementById("btn-redo");
      if (undoBtn) undoBtn.disabled = !canUndo;
      if (redoBtn) redoBtn.disabled = !canRedo;
    };

    // Mudança na linha do tempo
    this.animationEngine.onTimelineChange = () => {
      this.updateTimelineUI();
    };

    // Status de reprodução (Play / Pause)
    this.animationEngine.onPlaybackStatusChange = (isPlaying) => {
      const playBtn = document.getElementById("btn-play-pause");
      if (playBtn) {
        playBtn.innerHTML = isPlaying
          ? `<i data-lucide="pause" class="w-5 h-5 fill-current"></i>`
          : `<i data-lucide="play" class="w-5 h-5 fill-current"></i>`;
        window.safeRenderIcons();
      }
    };
  }

  /**
   * Vincula todos os botões e controles da interface
   */
  bindUIEvents() {
    // 1. Navegação de Abas
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // 2. Modos de Visualização da Quadra
    document.querySelectorAll(".view-mode-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        this.setViewMode(mode);
      });
    });

    // 3. Ferramentas Táticas (Seleção, Setas, Zonas, Borracha)
    document.querySelectorAll(".tool-action-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tool = btn.dataset.tool;
        this.setActiveTool(tool);
      });
    });

    // 4. Seletor de Cores de Linha
    document.querySelectorAll(".color-swatch-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const color = btn.dataset.color;
        this.board.drawColor = color;
        document.querySelectorAll(".color-swatch-btn").forEach(b => b.classList.remove("ring-2", "ring-white"));
        btn.classList.add("ring-2", "ring-white");
      });
    });

    // 5. Espessura do Traço
    const strokeRange = document.getElementById("stroke-width-range");
    if (strokeRange) {
      strokeRange.addEventListener("input", (e) => {
        this.board.drawLineWidth = parseFloat(e.target.value) || 3.5;
      });
    }

    // 6. Undo, Redo, Limpar Desenhos, Reset Geral
    document.getElementById("btn-undo")?.addEventListener("click", () => this.board.undo());
    document.getElementById("btn-redo")?.addEventListener("click", () => this.board.redo());
    document.getElementById("btn-clear-drawings")?.addEventListener("click", () => {
      if (confirm("Limpar todos os desenhos e setas da quadra? (Jogadores serão mantidos)")) {
        this.board.clearDrawings();
        this.showNotification("Desenhos removidos da quadra.", "info");
      }
    });
    document.getElementById("btn-reset-board")?.addEventListener("click", () => {
      if (confirm("Deseja reiniciar a prancheta para o posicionamento inicial?")) {
        this.board.resetBoard();
        this.animationEngine.initDefaultKeyframe();
        this.updateTimelineUI();
        this.showNotification("Prancheta reiniciada.", "info");
      }
    });

    // 7. Formações Rápidas
    document.querySelectorAll(".formation-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const formation = btn.dataset.formation;
        const team = btn.dataset.team || "A";
        this.board.applyFormation(team, formation);
        this.showNotification(`Formação ${formation.toUpperCase()} aplicada ao Time ${team}!`, "success");
      });
    });

    // 8. Equipamentos e Bolas (Clique para adicionar)
    document.querySelectorAll(".add-equipment-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        const color = btn.dataset.color || "#F97316";
        if (type === "ball") {
          this.board.addBall();
          this.showNotification("Nova bola adicionada à quadra!", "success");
        } else {
          this.board.addEquipment(type, color);
          this.showNotification(`Equipamento adicionado!`, "success");
        }
      });
    });

    // 9. Adicionar Jogador
    document.getElementById("btn-add-player-a")?.addEventListener("click", () => {
      this.board.addPlayer("A", false);
    });
    document.getElementById("btn-add-player-b")?.addEventListener("click", () => {
      this.board.addPlayer("B", false);
    });
    document.getElementById("btn-add-gk-a")?.addEventListener("click", () => {
      this.board.addPlayer("A", true);
    });

    // 10. Controles da Linha do Tempo
    document.getElementById("btn-add-keyframe")?.addEventListener("click", () => {
      this.animationEngine.addKeyframe();
      this.showNotification(`Quadro ${this.animationEngine.keyframes.length} capturado!`, "success");
    });
    document.getElementById("btn-duplicate-keyframe")?.addEventListener("click", () => {
      this.animationEngine.duplicateCurrentKeyframe();
      this.showNotification("Quadro duplicado com sucesso!", "success");
    });
    document.getElementById("btn-delete-keyframe")?.addEventListener("click", () => {
      this.animationEngine.deleteCurrentKeyframe();
    });
    document.getElementById("btn-play-pause")?.addEventListener("click", () => {
      this.animationEngine.togglePlay();
    });
    document.getElementById("btn-stop-anim")?.addEventListener("click", () => {
      this.animationEngine.stop();
    });
    document.getElementById("btn-toggle-loop")?.addEventListener("click", (e) => {
      const isLoop = this.animationEngine.toggleLoop();
      e.currentTarget.classList.toggle("text-amber-400", isLoop);
      e.currentTarget.classList.toggle("text-slate-400", !isLoop);
    });
    document.getElementById("btn-toggle-trails")?.addEventListener("click", (e) => {
      const show = this.animationEngine.toggleTrails();
      e.currentTarget.classList.toggle("text-amber-400", show);
      e.currentTarget.classList.toggle("text-slate-400", !show);
    });

    // Seletor de Velocidade da Animação
    document.querySelectorAll(".speed-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const speed = parseFloat(btn.dataset.speed) || 1.0;
        this.animationEngine.setSpeed(speed);
        document.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("bg-amber-400", "text-slate-950", "font-bold"));
        btn.classList.add("bg-amber-400", "text-slate-950", "font-bold");
      });
    });

    // 11. Bloco de Anotações do Treino
    document.getElementById("btn-save-to-library")?.addEventListener("click", () => {
      this.saveDrillFromNotes();
    });
    document.getElementById("btn-export-highres-png")?.addEventListener("click", () => {
      this.exportHighResPng();
    });
    document.getElementById("btn-export-json")?.addEventListener("click", () => {
      this.drillLibrary.exportToJson();
    });
    document.getElementById("json-file-input")?.addEventListener("change", (e) => {
      if (e.target.files[0]) {
        this.drillLibrary.importFromJson(e.target.files[0]);
      }
    });

    // 12. Modal de Configurações da Quadra e Identidade
    this.setupSettingsModalEvents();

    // 13. Filtros da Biblioteca
    this.setupLibraryFilters();
  }

  /**
   * Alternância entre abas da SPA
   */
  switchTab(tab) {
    this.currentTab = tab;

    // Atualiza botões do cabeçalho
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle("bg-amber-400", isActive);
      btn.classList.toggle("text-slate-950", isActive);
      btn.classList.toggle("font-bold", isActive);
      btn.classList.toggle("text-slate-300", !isActive);
      btn.classList.toggle("hover:text-white", !isActive);
    });

    // Alterna visibilidade dos containers
    document.getElementById("tab-board-container").classList.toggle("hidden", tab !== "board");
    document.getElementById("tab-library-container").classList.toggle("hidden", tab !== "library");
    document.getElementById("tab-coaches-container").classList.toggle("hidden", tab !== "coaches");

    if (tab === "board") {
      this.pitch.updateMetrics();
      this.board.render();
    } else if (tab === "library") {
      this.drillLibrary.renderGallery();
    } else if (tab === "coaches") {
      this.coachesManager.renderCoaches();
    }

    window.safeRenderIcons();
  }

  /**
   * Alterna modo de visualização da quadra (Horizontal, Vertical, Meia-Quadra)
   */
  setViewMode(mode) {
    this.pitch.setViewMode(mode);
    document.querySelectorAll(".view-mode-btn").forEach(btn => {
      const isActive = btn.dataset.mode === mode;
      btn.classList.toggle("bg-amber-400", isActive);
      btn.classList.toggle("text-slate-950", isActive);
      btn.classList.toggle("font-bold", isActive);
      btn.classList.toggle("text-slate-300", !isActive);
    });
    this.board.render();
  }

  /**
   * Seleciona ferramenta tática ativa
   */
  setActiveTool(tool) {
    this.board.activeTool = tool;

    // Atualiza classe do cursor no canvas
    const canvas = this.pitch.canvas;
    canvas.className = "";
    if (tool === "select") canvas.classList.add("cursor-grab");
    else if (tool === "eraser") canvas.classList.add("cursor-eraser");
    else canvas.classList.add("cursor-crosshair");

    // Atualiza estado visual dos botões
    document.querySelectorAll(".tool-action-btn").forEach(btn => {
      const isActive = btn.dataset.tool === tool;
      btn.classList.toggle("active", isActive);
    });
  }

  /**
   * Atualiza a barra de miniaturas da Linha do Tempo
   */
  updateTimelineUI() {
    const container = document.getElementById("timeline-thumbnails-list");
    if (!container) return;

    const anim = this.animationEngine;
    container.innerHTML = anim.keyframes.map((kf, idx) => {
      const isActive = idx === anim.currentFrameIndex;
      return `
        <button onclick="window.app.animationEngine.loadFrame(${idx})"
                class="timeline-frame px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive ? 'active' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border-slate-700'
                }">
          <i data-lucide="video" class="w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}"></i>
          <span>${kf.label || `Quadro ${idx + 1}`}</span>
        </button>
      `;
    }).join("");

    window.safeRenderIcons();
  }

  /**
   * Painel Inspetor de Item Selecionado (Jogador ou Equipamento)
   */
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
              <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
              Atleta (Time ${item.team})
            </span>
            <button onclick="window.app.board.deleteSelectedItem()"
                    title="Excluir Atleta"
                    class="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-slate-400 text-[10px] block mb-0.5">Camisa</label>
              <input type="number" value="${item.number}" min="1" max="99"
                     onchange="window.app.updateSelectedPlayerNumber(this.value)"
                     class="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-center font-bold" />
            </div>
            <div>
              <label class="text-slate-400 text-[10px] block mb-0.5">Posição</label>
              <button onclick="window.app.toggleSelectedPlayerGk()"
                      class="w-full py-1 rounded font-semibold text-center ${
                        item.isGk ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }">
                ${item.isGk ? 'Goleiro (GK)' : 'Linha'}
              </button>
            </div>
          </div>

          <div>
            <label class="text-slate-400 text-[10px] block mb-0.5">Nome do Aluno/Atleta</label>
            <input type="text" value="${item.name || ''}" placeholder="Ex: Lucas"
                   oninput="window.app.updateSelectedPlayerName(this.value)"
                   class="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-medium" />
          </div>

          <div class="flex gap-1.5 pt-1">
            <button onclick="window.app.rotateSelectedPlayer(45)"
                    class="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1">
              <i data-lucide="rotate-cw" class="w-3 h-3"></i> Girar +45°
            </button>
            <button onclick="window.app.toggleSelectedPlayerTeam()"
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
              <i data-lucide="box" class="w-3.5 h-3.5"></i>
              Equipamento: ${item.type.toUpperCase()}
            </span>
            <button onclick="window.app.board.deleteSelectedItem()"
                    class="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div class="flex gap-2">
            <button onclick="window.app.rotateSelectedPlayer(45)"
                    class="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1">
              <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i> Girar
            </button>
          </div>
        </div>
      `;
    }

    window.safeRenderIcons();
  }

  updateSelectedPlayerNumber(num) {
    if (this.board.selectedItem && this.board.selectedType === "player") {
      this.board.selectedItem.number = parseInt(num, 10) || 1;
      this.board.saveState();
      this.board.render();
    }
  }

  updateSelectedPlayerName(name) {
    if (this.board.selectedItem && this.board.selectedType === "player") {
      this.board.selectedItem.name = name;
      this.board.render();
    }
  }

  toggleSelectedPlayerGk() {
    if (this.board.selectedItem && this.board.selectedType === "player") {
      this.board.selectedItem.isGk = !this.board.selectedItem.isGk;
      this.board.saveState();
      this.board.render();
      this.updateInspectorPanel(this.board.selectedItem, "player");
    }
  }

  toggleSelectedPlayerTeam() {
    if (this.board.selectedItem && this.board.selectedType === "player") {
      this.board.selectedItem.team = this.board.selectedItem.team === "A" ? "B" : "A";
      this.board.saveState();
      this.board.render();
      this.updateInspectorPanel(this.board.selectedItem, "player");
    }
  }

  rotateSelectedPlayer(deg) {
    if (this.board.selectedItem) {
      this.board.selectedItem.angle = (this.board.selectedItem.angle || 0) + (deg * Math.PI / 180);
      this.board.saveState();
      this.board.render();
    }
  }

  /**
   * Salva o treino atual a partir do formulário de anotações lateral
   */
  saveDrillFromNotes() {
    const title = document.getElementById("drill-title-input")?.value.trim() || "Treino Tático";
    const category = document.getElementById("drill-category-select")?.value || "Sub-15";
    const type = document.getElementById("drill-type-select")?.value || "Tática";
    const duration = document.getElementById("drill-duration-input")?.value || 25;
    const author = document.getElementById("drill-author-input")?.value.trim() || SCHOOL_CONFIG.defaultCoach;
    const objectives = document.getElementById("drill-objectives-input")?.value.trim() || "";
    const rules = document.getElementById("drill-rules-input")?.value.trim() || "";
    const coachingPoints = document.getElementById("drill-coaching-input")?.value.trim() || "";

    const savedDrill = this.drillLibrary.saveCurrentDrill({
      title,
      category,
      type,
      duration,
      author,
      objectives,
      rules,
      coachingPoints
    });

    this.showNotification(`Treino "${savedDrill.title}" salvo com sucesso na Biblioteca!`, "success");
  }

  /**
   * Preenche o formulário de anotações lateral com dados de um treino carregado
   */
  fillDrillNotesForm(drill) {
    if (document.getElementById("drill-title-input")) document.getElementById("drill-title-input").value = drill.title || "";
    if (document.getElementById("drill-category-select")) document.getElementById("drill-category-select").value = drill.category || "Sub-15";
    if (document.getElementById("drill-type-select")) document.getElementById("drill-type-select").value = drill.type || "Tática";
    if (document.getElementById("drill-duration-input")) document.getElementById("drill-duration-input").value = drill.duration || 20;
    if (document.getElementById("drill-author-input")) document.getElementById("drill-author-input").value = drill.author || "";
    if (document.getElementById("drill-objectives-input")) document.getElementById("drill-objectives-input").value = drill.objectives || "";
    if (document.getElementById("drill-rules-input")) document.getElementById("drill-rules-input").value = drill.rules || "";
    if (document.getElementById("drill-coaching-input")) document.getElementById("drill-coaching-input").value = drill.coachingPoints || "";
  }

  /**
   * ============================================================================
   * EXPORTAÇÃO DE IMAGEM PNG EM ALTA RESOLUÇÃO COM CABEÇALHO DA ESCOLINHA
   * ============================================================================
   */
  exportHighResPng() {
    this.showNotification("Gerando prancheta em alta resolução...", "info");

    const title = document.getElementById("drill-title-input")?.value.trim() || "Treino Tático de Futsal";
    const category = document.getElementById("drill-category-select")?.value || "Geral";
    const author = document.getElementById("drill-author-input")?.value.trim() || SCHOOL_CONFIG.defaultCoach;
    const objectives = document.getElementById("drill-objectives-input")?.value.trim() || "";
    const duration = document.getElementById("drill-duration-input")?.value || "20";

    // Dimensões do Canvas de Alta Resolução (1920 x 1080 Full HD)
    const expWidth = 1920;
    const expHeight = 1080;
    const expCanvas = document.createElement("canvas");
    expCanvas.width = expWidth;
    expCanvas.height = expHeight;
    const expCtx = expCanvas.getContext("2d");

    // 1. Fundo Geral Dark Escuro
    expCtx.fillStyle = "#0B1120";
    expCtx.fillRect(0, 0, expWidth, expHeight);

    // 2. Cabeçalho Esportivo Oficial
    const headerHeight = 130;
    const headerGrad = expCtx.createLinearGradient(0, 0, expWidth, 0);
    headerGrad.addColorStop(0, "#002B66");
    headerGrad.addColorStop(1, "#0B1120");
    expCtx.fillStyle = headerGrad;
    expCtx.fillRect(0, 0, expWidth, headerHeight);

    // Linha divisória dourada
    expCtx.fillStyle = SCHOOL_CONFIG.secondaryColor || "#FFCC00";
    expCtx.fillRect(0, headerHeight - 4, expWidth, 4);

    // Logo da Escolinha no Cabeçalho
    const logoImg = this.pitch.logoImage;
    if (logoImg && this.pitch.logoLoaded) {
      expCtx.drawImage(logoImg, 40, 20, 90, 90);
    }

    // Textos do Cabeçalho
    expCtx.fillStyle = "#FFFFFF";
    expCtx.font = "bold 32px 'Outfit', sans-serif";
    expCtx.fillText(SCHOOL_CONFIG.schoolName.toUpperCase(), 150, 52);

    expCtx.fillStyle = SCHOOL_CONFIG.secondaryColor || "#FFCC00";
    expCtx.font = "600 24px 'Outfit', sans-serif";
    expCtx.fillText(title, 150, 90);

    // Badges à direita do cabeçalho
    expCtx.font = "600 16px 'Inter', sans-serif";
    expCtx.fillStyle = "#94A3B8";
    const dateStr = new Date().toLocaleDateString("pt-BR");
    expCtx.fillText(`Categoria: ${category} | Duração: ${duration} min | Prof: ${author} | Data: ${dateStr}`, expWidth - 550, 72);

    // 3. Renderiza a quadra e desenhos dentro da área central
    const courtAreaY = headerHeight + 20;
    const courtAreaH = expHeight - headerHeight - (objectives ? 100 : 40);
    const courtAreaW = expWidth - 80;

    // Desenha scaled do canvas principal
    expCtx.drawImage(
      this.pitch.canvas,
      0, 0, this.pitch.canvas.width, this.pitch.canvas.height,
      40, courtAreaY, courtAreaW, courtAreaH
    );

    // 4. Rodapé com Objetivos e Regras se preenchidos
    if (objectives) {
      const footerY = expHeight - 80;
      expCtx.fillStyle = "rgba(19, 30, 50, 0.9)";
      expCtx.fillRect(40, footerY, expWidth - 80, 60);
      expCtx.strokeStyle = "rgba(255, 204, 0, 0.3)";
      expCtx.strokeRect(40, footerY, expWidth - 80, 60);

      expCtx.fillStyle = "#FFCC00";
      expCtx.font = "bold 15px 'Outfit', sans-serif";
      expCtx.fillText("OBJETIVOS DO TREINO:", 60, footerY + 26);

      expCtx.fillStyle = "#F1F5F9";
      expCtx.font = "400 14px 'Inter', sans-serif";
      expCtx.fillText(objectives, 60, footerY + 48, expWidth - 120);
    }

    // 5. Download do PNG
    const link = document.createElement("a");
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `TacticalPad_${sanitizedTitle}.png`;
    link.href = expCanvas.toDataURL("image/png");
    link.click();

    this.showNotification("Imagem PNG de alta resolução baixada!", "success");
  }

  /**
   * Modal de Configurações da Quadra e Identidade
   */
  setupSettingsModalEvents() {
    const modal = document.getElementById("court-settings-modal");
    const openBtn = document.getElementById("btn-open-court-settings");
    const closeBtn = document.getElementById("btn-close-court-settings");
    const saveBtn = document.getElementById("btn-save-court-settings");
    const resetBtn = document.getElementById("btn-reset-court-settings");
    const logoInput = document.getElementById("setting-logo-input");

    openBtn?.addEventListener("click", () => {
      // Preenche os campos com os valores atuais de SCHOOL_CONFIG
      document.getElementById("setting-school-name").value = SCHOOL_CONFIG.schoolName;
      document.getElementById("setting-tagline").value = SCHOOL_CONFIG.tagline;
      document.getElementById("setting-primary-color").value = SCHOOL_CONFIG.primaryColor;
      document.getElementById("setting-secondary-color").value = SCHOOL_CONFIG.secondaryColor;
      document.getElementById("setting-pitch-color").value = SCHOOL_CONFIG.pitchColor;
      document.getElementById("setting-area-color").value = SCHOOL_CONFIG.pitchAreaColor;
      document.getElementById("setting-line-color").value = SCHOOL_CONFIG.courtLineColor;
      document.getElementById("setting-team-a-color").value = SCHOOL_CONFIG.teamAColor;
      document.getElementById("setting-team-b-color").value = SCHOOL_CONFIG.teamBColor;
      document.getElementById("setting-logo-opacity").value = SCHOOL_CONFIG.logoOpacity;
      document.getElementById("setting-corner-logos").checked = SCHOOL_CONFIG.showCornerLogos;

      modal?.classList.add("open");
      modal?.classList.remove("pointer-events-none");
    });

    closeBtn?.addEventListener("click", () => {
      modal?.classList.remove("open");
      modal?.classList.add("pointer-events-none");
    });

    // Preset de pisos de quadra
    document.getElementById("setting-pitch-preset")?.addEventListener("change", (e) => {
      const preset = PITCH_PRESETS[e.target.value];
      if (preset) {
        document.getElementById("setting-pitch-color").value = preset.pitchColor;
        document.getElementById("setting-area-color").value = preset.pitchAreaColor;
        document.getElementById("setting-line-color").value = preset.courtLineColor;
      }
    });

    // Upload local de imagem da logo
    logoInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          logoInput.dataset.newLogo = re.target.result;
          this.showNotification("Logo carregada! Clique em Salvar para aplicar.", "info");
        };
        reader.readAsDataURL(file);
      }
    });

    saveBtn?.addEventListener("click", () => {
      SCHOOL_CONFIG.schoolName = document.getElementById("setting-school-name").value.trim() || SCHOOL_CONFIG.schoolName;
      SCHOOL_CONFIG.tagline = document.getElementById("setting-tagline").value.trim() || SCHOOL_CONFIG.tagline;
      SCHOOL_CONFIG.primaryColor = document.getElementById("setting-primary-color").value;
      SCHOOL_CONFIG.secondaryColor = document.getElementById("setting-secondary-color").value;
      SCHOOL_CONFIG.pitchColor = document.getElementById("setting-pitch-color").value;
      SCHOOL_CONFIG.pitchAreaColor = document.getElementById("setting-area-color").value;
      SCHOOL_CONFIG.courtLineColor = document.getElementById("setting-line-color").value;
      SCHOOL_CONFIG.teamAColor = document.getElementById("setting-team-a-color").value;
      SCHOOL_CONFIG.teamBColor = document.getElementById("setting-team-b-color").value;
      SCHOOL_CONFIG.logoOpacity = parseFloat(document.getElementById("setting-logo-opacity").value) || 0.25;
      SCHOOL_CONFIG.showCornerLogos = document.getElementById("setting-corner-logos").checked;

      const presetVal = document.getElementById("setting-pitch-preset").value;
      SCHOOL_CONFIG.pitchPreset = presetVal;

      if (logoInput?.dataset?.newLogo) {
        SCHOOL_CONFIG.logoUrl = logoInput.dataset.newLogo;
        this.pitch.loadLogo(SCHOOL_CONFIG.logoUrl);
      }

      ConfigManager.save();
      this.board.render();

      modal?.classList.remove("open");
      modal?.classList.add("pointer-events-none");
      this.showNotification("Configurações da quadra e identidade salvas!", "success");
    });

    resetBtn?.addEventListener("click", () => {
      if (confirm("Restaurar todas as cores e configurações para o padrão inicial?")) {
        ConfigManager.reset();
      }
    });
  }

  /**
   * Filtros e barra de busca da Biblioteca
   */
  setupLibraryFilters() {
    // Filtro por Categoria
    document.querySelectorAll(".category-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.category;
        this.drillLibrary.selectedCategory = cat;

        document.querySelectorAll(".category-filter-btn").forEach(b => {
          b.classList.remove("bg-amber-400", "text-slate-950", "font-bold");
          b.classList.add("bg-slate-800", "text-slate-300");
        });
        btn.classList.remove("bg-slate-800", "text-slate-300");
        btn.classList.add("bg-amber-400", "text-slate-950", "font-bold");

        this.drillLibrary.renderGallery();
      });
    });

    // Filtro por Tipo
    document.getElementById("library-type-select")?.addEventListener("change", (e) => {
      this.drillLibrary.selectedType = e.target.value;
      this.drillLibrary.renderGallery();
    });

    // Barra de Busca
    document.getElementById("library-search-input")?.addEventListener("input", (e) => {
      this.drillLibrary.searchQuery = e.target.value;
      this.drillLibrary.renderGallery();
    });
  }

  /**
   * Toast Notification simples e elegante
   */
  showNotification(message, type = "info") {
    let toast = document.getElementById("app-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "app-toast";
      toast.className = "fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-semibold transition-all duration-300 transform translate-y-8 opacity-0";
      document.body.appendChild(toast);
    }

    const typeClasses = {
      success: "bg-emerald-500/90 text-white border border-emerald-400/30",
      info: "bg-blue-600/90 text-white border border-blue-400/30",
      warning: "bg-amber-500/90 text-slate-950 border border-amber-300/40"
    };

    toast.className = `fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-semibold transition-all duration-300 ${typeClasses[type] || typeClasses.info}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" class="w-4 h-4"></i>
      <span>${message}</span>
    `;

    window.safeRenderIcons();

    // Anima entrada
    setTimeout(() => {
      toast.classList.remove("translate-y-8", "opacity-0");
    }, 10);

    // Anima saída
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add("translate-y-8", "opacity-0");
    }, 3200);
  }
}

// Inicialização Global
window.addEventListener("DOMContentLoaded", () => {
  window.app = new TacticalPadApp();
});
