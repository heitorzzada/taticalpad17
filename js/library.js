/**
 * ==============================================================================
 * 2. & 3.F. BIBLIOTECA DE TREINOS E JOGADAS (DRILL LIBRARY)
 * Galeria, filtros por categoria (Sub-7 a Adulto) e tipo, miniaturas dinâmicas,
 * persistência em localStorage, exportação/importação JSON e carregamento na prancheta.
 * ==============================================================================
 */

class DrillLibrary {
  constructor(app) {
    this.app = app;
    this.drills = [];
    this.selectedCategory = "all";
    this.selectedType = "all";
    this.searchQuery = "";
    this.STORAGE_KEY = "tacticalpad_drills_library";

    this.init();
  }

  init() {
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.drills = JSON.parse(saved);
      } else {
        // Inicializa com os treinos padrão definidos no config
        this.drills = JSON.parse(JSON.stringify(DEFAULT_DRILLS));
        this.saveToStorage();
      }
    } catch (e) {
      console.warn("Erro ao carregar treinos da biblioteca:", e);
      this.drills = JSON.parse(JSON.stringify(DEFAULT_DRILLS));
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.drills));
    } catch (e) {
      console.error("Erro ao salvar treinos no localStorage:", e);
    }
  }

  /**
   * Salva o treino atualmente montado na prancheta para a biblioteca
   */
  saveCurrentDrill(metadata) {
    const board = this.app.board;
    const anim = this.app.animationEngine;

    // Garante que o quadro atual está sincronizado
    anim.saveCurrentToActiveFrame();

    const drillId = metadata.id || `drill-${Date.now()}`;
    const newDrill = {
      id: drillId,
      title: metadata.title || "Treino Tático Sem Título",
      category: metadata.category || "Sub-15",
      type: metadata.type || "Tática",
      duration: parseInt(metadata.duration, 10) || 20,
      author: metadata.author || SCHOOL_CONFIG.defaultCoach || "Comissão Técnica",
      description: metadata.description || "",
      objectives: metadata.objectives || "",
      rules: metadata.rules || "",
      coachingPoints: metadata.coachingPoints || "",
      viewMode: board.pitch.viewMode,
      date: new Date().toISOString().split("T")[0],
      // Snapshot completo da prancheta e animação
      keyframes: JSON.parse(JSON.stringify(anim.keyframes)),
      activeFrameIndex: anim.currentFrameIndex,
      // Miniatura gerada em base64
      thumbnail: this.generateThumbnailDataUrl()
    };

    // Verifica se já existe um treino com esse ID (edição) ou se é novo
    const existingIndex = this.drills.findIndex(d => d.id === drillId);
    if (existingIndex >= 0) {
      this.drills[existingIndex] = newDrill;
    } else {
      this.drills.unshift(newDrill);
    }

    this.saveToStorage();
    this.renderGallery();
    return newDrill;
  }

  /**
   * Gera miniatura leve (data URL) do estado atual da quadra
   */
  generateThumbnailDataUrl() {
    try {
      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = 320;
      thumbCanvas.height = 180;
      const tCtx = thumbCanvas.getContext("2d");

      // Desenha scaled do canvas principal
      tCtx.drawImage(this.app.board.canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      return thumbCanvas.toDataURL("image/jpeg", 0.75);
    } catch (e) {
      return "";
    }
  }

  /**
   * Carrega um treino da biblioteca diretamente para a prancheta
   */
  loadDrillToBoard(drillId) {
    const drill = this.drills.find(d => d.id === drillId);
    if (!drill) return;

    const board = this.app.board;
    const anim = this.app.animationEngine;

    // 1. Ajusta o modo de visualização da quadra
    if (drill.viewMode) {
      this.app.setViewMode(drill.viewMode);
    }

    // 2. Carrega os quadros da animação
    if (drill.keyframes && drill.keyframes.length > 0) {
      anim.keyframes = JSON.parse(JSON.stringify(drill.keyframes));
      anim.currentFrameIndex = 0;
      anim.loadFrame(0);
    } else {
      board.initDefaultEntities();
      anim.initDefaultKeyframe();
    }

    // 3. Atualiza os campos do bloco de anotações lateral
    this.app.fillDrillNotesForm(drill);

    // 4. Muda para a aba da Prancheta
    this.app.switchTab("board");

    // Notificação amigável
    this.app.showNotification(`Treino "${drill.title}" carregado com sucesso!`, "success");
  }

  /**
   * Exclui um treino da biblioteca
   */
  deleteDrill(drillId) {
    const drill = this.drills.find(d => d.id === drillId);
    if (!drill) return;

    if (confirm(`Deseja realmente remover o treino "${drill.title}" da biblioteca?`)) {
      this.drills = this.drills.filter(d => d.id !== drillId);
      this.saveToStorage();
      this.renderGallery();
      this.app.showNotification("Treino removido da biblioteca.", "info");
    }
  }

  /**
   * Exporta a biblioteca completa como arquivo JSON
   */
  exportToJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.drills, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `Biblioteca_Treinos_${SCHOOL_CONFIG.schoolName.replace(/\s+/g, "_")}.json`);
    dlAnchor.click();
  }

  /**
   * Importa treinos a partir de um arquivo JSON
   */
  importFromJson(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          // Mescla sem duplicar IDs
          const existingIds = new Set(this.drills.map(d => d.id));
          let count = 0;
          imported.forEach(d => {
            if (!existingIds.has(d.id)) {
              this.drills.push(d);
              count++;
            }
          });
          this.saveToStorage();
          this.renderGallery();
          this.app.showNotification(`${count} novos treinos importados com sucesso!`, "success");
        } else {
          alert("Arquivo JSON inválido. Formato esperado: lista de treinos.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  /**
   * Renderiza a galeria de treinos na página da biblioteca com filtros e pesquisa
   */
  renderGallery() {
    const container = document.getElementById("drills-gallery-grid");
    const countEl = document.getElementById("drills-count-badge");
    if (!container) return;

    // Filtra treinos
    const filtered = this.drills.filter(drill => {
      // Filtro de categoria
      if (this.selectedCategory !== "all" && drill.category !== this.selectedCategory) {
        return false;
      }
      // Filtro de tipo
      if (this.selectedType !== "all" && drill.type !== this.selectedType) {
        return false;
      }
      // Busca por texto
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchesTitle = (drill.title || "").toLowerCase().includes(q);
        const matchesDesc = (drill.description || "").toLowerCase().includes(q);
        const matchesObj = (drill.objectives || "").toLowerCase().includes(q);
        const matchesAuthor = (drill.author || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesObj && !matchesAuthor) {
          return false;
        }
      }
      return true;
    });

    if (countEl) {
      countEl.textContent = `${filtered.length} treinos encontrados`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <i data-lucide="folder-search" class="w-16 h-16 mx-auto mb-4 text-slate-600"></i>
          <h3 class="text-xl font-bold text-slate-200 mb-1">Nenhum treino encontrado</h3>
          <p class="text-sm">Tente ajustar seus filtros de categoria ou termo de busca.</p>
        </div>
      `;
      window.safeRenderIcons();
      return;
    }

    // Cores das badges de categoria
    const categoryColors = {
      "Sub-7": "bg-pink-500/20 text-pink-300 border-pink-500/30",
      "Sub-9": "bg-purple-500/20 text-purple-300 border-purple-500/30",
      "Sub-11": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      "Sub-13": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      "Sub-15": "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "Sub-17": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      "Adulto": "bg-amber-500/20 text-amber-300 border-amber-500/30"
    };

    container.innerHTML = filtered.map(drill => {
      const catClass = categoryColors[drill.category] || "bg-slate-700 text-slate-200 border-slate-600";
      const keyframeCount = drill.keyframes ? drill.keyframes.length : 1;
      const thumbSrc = drill.thumbnail || "";

      return `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800 hover:border-amber-400/50 transition-all duration-300">
          <!-- Thumbnail / Visualizador -->
          <div class="relative h-44 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
            ${thumbSrc ? `
              <img src="${thumbSrc}" alt="${drill.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ` : `
              <div class="flex flex-col items-center justify-center text-slate-600">
                <i data-lucide="clipboard" class="w-12 h-12 mb-2 text-slate-700"></i>
                <span class="text-xs font-semibold">Sem miniatura</span>
              </div>
            `}
            <!-- Badges sobrepostas -->
            <div class="absolute top-3 left-3 flex gap-2">
              <span class="px-2.5 py-1 text-xs font-bold rounded-lg border backdrop-blur-md ${catClass}">
                ${drill.category}
              </span>
              <span class="px-2.5 py-1 text-xs font-semibold rounded-lg border bg-slate-900/80 text-slate-300 border-slate-700 backdrop-blur-md">
                ${drill.type}
              </span>
            </div>

            <div class="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-amber-400 border border-slate-700">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
              <span>${keyframeCount} ${keyframeCount === 1 ? 'quadro' : 'quadros'}</span>
            </div>
          </div>

          <!-- Conteúdo do Card -->
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

            <!-- Botões de Ação -->
            <div class="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <button onclick="window.app.drillLibrary.loadDrillToBoard('${drill.id}')"
                      class="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-400/20">
                <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                Abrir na Prancheta
              </button>

              <button onclick="window.app.drillLibrary.exportDrillPng('${drill.id}')"
                      title="Exportar Imagem PNG"
                      class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700">
                <i data-lucide="image" class="w-4 h-4"></i>
              </button>

              <button onclick="window.app.drillLibrary.deleteDrill('${drill.id}')"
                      title="Excluir Treino"
                      class="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    window.safeRenderIcons();
  }

  /**
   * Exporta PNG a partir de um treino da biblioteca
   */
  exportDrillPng(drillId) {
    this.loadDrillToBoard(drillId);
    setTimeout(() => {
      this.app.exportHighResPng();
    }, 200);
  }
}
