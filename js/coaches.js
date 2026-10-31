/**
 * ==============================================================================
 * 4. PÁGINA DOS PROFESSORES (COMISSÃO TÉCNICA)
 * Renderização de cards de treinadores, modal administrativo (CRUD completo),
 * upload de fotos em Base64 e persistência em localStorage.
 * ==============================================================================
 */

class CoachesManager {
  constructor(app) {
    this.app = app;
    this.coaches = [];
    this.STORAGE_KEY = "tacticalpad_coaches_list";
    this.editingCoachId = null;

    this.init();
  }

  init() {
    this.loadFromStorage();
    this.setupModalEvents();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.coaches = JSON.parse(saved);
      } else {
        this.coaches = JSON.parse(JSON.stringify(DEFAULT_COACHES));
        this.saveToStorage();
      }
    } catch (e) {
      console.warn("Erro ao carregar professores:", e);
      this.coaches = JSON.parse(JSON.stringify(DEFAULT_COACHES));
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.coaches));
    } catch (e) {
      console.error("Erro ao salvar professores no localStorage:", e);
    }
  }

  /**
   * Renderiza os cards dos professores na grade institucional
   */
  renderCoaches() {
    const grid = document.getElementById("coaches-grid");
    if (!grid) return;

    if (this.coaches.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <i data-lucide="users" class="w-16 h-16 mx-auto mb-4 text-slate-600"></i>
          <h3 class="text-xl font-bold text-slate-200 mb-1">Nenhum professor cadastrado</h3>
          <p class="text-sm">Clique em "Gerenciar Professores" para adicionar novos membros à comissão técnica.</p>
        </div>
      `;
      window.safeRenderIcons();
      return;
    }

    grid.innerHTML = this.coaches.map(coach => {
      const categoriesHtml = (coach.categories || []).map(cat => `
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30">
          ${cat}
        </span>
      `).join("");

      return `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col border border-slate-800 hover:border-amber-400/50 transition-all duration-300">
          <!-- Banner superior com foto de perfil -->
          <div class="relative h-32 bg-gradient-to-r from-blue-900 to-indigo-950 p-4 flex items-end">
            <!-- Badges e ações rápidas de admin -->
            <div class="absolute top-3 right-3 flex gap-2">
              <button onclick="window.app.coachesManager.openEditModal('${coach.id}')"
                      class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition-colors border border-slate-700 shadow"
                      title="Editar Professor">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="window.app.coachesManager.deleteCoach('${coach.id}')"
                      class="p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-500 hover:text-white text-slate-400 transition-colors border border-slate-700 shadow"
                      title="Remover Professor">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>

            <!-- Avatar do Professor -->
            <div class="absolute -bottom-8 left-6">
              <div class="w-20 h-20 rounded-2xl border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-xl">
                <img src="${coach.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}"
                     alt="${coach.name}"
                     class="w-full h-full object-cover object-top" />
              </div>
            </div>
          </div>

          <!-- Corpo do Card -->
          <div class="pt-11 p-6 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-1">
                <h3 class="text-lg font-bold text-white font-heading">${coach.name}</h3>
                <span class="text-xs font-medium text-slate-400">${coach.experience || ''}</span>
              </div>

              <p class="text-xs font-semibold text-amber-400 mb-3 flex items-center gap-1.5">
                <i data-lucide="award" class="w-4 h-4 text-amber-400"></i>
                ${coach.role}
              </p>

              <!-- Categorias -->
              <div class="flex flex-wrap gap-1.5 mb-4">
                ${categoriesHtml}
              </div>

              <!-- Registro e Licenças -->
              <div class="bg-slate-900/70 rounded-xl p-3 mb-4 border border-slate-800/80 text-xs space-y-1.5">
                <div class="flex items-center gap-2 text-slate-300">
                  <i data-lucide="badge-check" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span class="font-semibold">${coach.cref}</span>
                </div>
                <div class="flex items-center gap-2 text-slate-400">
                  <i data-lucide="graduation-cap" class="w-4 h-4 text-cyan-400 shrink-0"></i>
                  <span class="truncate">${coach.licenses}</span>
                </div>
              </div>

              <!-- Biografia -->
              <p class="text-xs text-slate-300 leading-relaxed mb-4">
                ${coach.bio}
              </p>

              <!-- Filosofia / Citação -->
              ${coach.philosophy ? `
                <div class="relative pl-3 border-l-2 border-amber-400/80 text-xs italic text-amber-200/90 mb-4 py-0.5">
                  ${coach.philosophy}
                </div>
              ` : ''}
            </div>

            <!-- Rodapé com contatos -->
            <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span class="flex items-center gap-1.5 truncate">
                <i data-lucide="mail" class="w-3.5 h-3.5 text-slate-500"></i>
                ${coach.email || 'contato@escolinha.com'}
              </span>
              <span class="flex items-center gap-1.5">
                <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-500"></i>
                ${coach.phone || ''}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    window.safeRenderIcons();
  }

  /**
   * Configura eventos do Modal de Edição / Criação de Treinador
   */
  setupModalEvents() {
    const modal = document.getElementById("coach-modal");
    const form = document.getElementById("coach-form");
    const photoInput = document.getElementById("coach-photo-input");
    const photoPreview = document.getElementById("coach-photo-preview");

    // Upload local de imagem convertendo para Base64
    if (photoInput) {
      photoInput.addEventListener("change", (e) => {
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
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveCoachFromForm();
      });
    }
  }

  openCreateModal() {
    this.editingCoachId = null;
    const form = document.getElementById("coach-form");
    if (form) form.reset();

    const titleEl = document.getElementById("coach-modal-title");
    if (titleEl) titleEl.textContent = "Adicionar Novo Professor";

    const preview = document.getElementById("coach-photo-preview");
    if (preview) {
      preview.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80";
    }

    const photoInput = document.getElementById("coach-photo-input");
    if (photoInput) photoInput.dataset.base64 = "";

    this.openModal();
  }

  openEditModal(coachId) {
    const coach = this.coaches.find(c => c.id === coachId);
    if (!coach) return;

    this.editingCoachId = coachId;

    const titleEl = document.getElementById("coach-modal-title");
    if (titleEl) titleEl.textContent = `Editar: ${coach.name}`;

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

    const photoInput = document.getElementById("coach-photo-input");
    if (photoInput) photoInput.dataset.base64 = coach.photoUrl || "";

    this.openModal();
  }

  saveCoachFromForm() {
    const name = document.getElementById("coach-name-input").value.trim();
    const role = document.getElementById("coach-role-input").value.trim();
    const categoriesStr = document.getElementById("coach-categories-input").value.trim();
    const cref = document.getElementById("coach-cref-input").value.trim();
    const licenses = document.getElementById("coach-licenses-input").value.trim();
    const experience = document.getElementById("coach-experience-input").value.trim();
    const bio = document.getElementById("coach-bio-input").value.trim();
    const philosophy = document.getElementById("coach-philosophy-input").value.trim();
    const email = document.getElementById("coach-email-input").value.trim();
    const phone = document.getElementById("coach-phone-input").value.trim();

    const photoInput = document.getElementById("coach-photo-input");
    const photoUrl = photoInput?.dataset?.base64 || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80";

    const categories = categoriesStr
      ? categoriesStr.split(",").map(c => c.trim()).filter(Boolean)
      : ["Sub-11", "Sub-13"];

    if (this.editingCoachId) {
      // Edição
      const idx = this.coaches.findIndex(c => c.id === this.editingCoachId);
      if (idx >= 0) {
        this.coaches[idx] = {
          ...this.coaches[idx],
          name,
          role,
          categories,
          cref,
          licenses,
          experience,
          bio,
          philosophy,
          email,
          phone,
          photoUrl
        };
      }
    } else {
      // Novo Professor
      const newCoach = {
        id: `coach-${Date.now()}`,
        name,
        role,
        categories,
        cref,
        licenses,
        experience,
        bio,
        philosophy,
        email,
        phone,
        photoUrl
      };
      this.coaches.push(newCoach);
    }

    this.saveToStorage();
    this.renderCoaches();
    this.closeModal();
    this.app.showNotification("Dados do professor atualizados com sucesso!", "success");
  }

  deleteCoach(coachId) {
    const coach = this.coaches.find(c => c.id === coachId);
    if (!coach) return;

    if (confirm(`Remover "${coach.name}" da comissão técnica?`)) {
      this.coaches = this.coaches.filter(c => c.id !== coachId);
      this.saveToStorage();
      this.renderCoaches();
      this.app.showNotification("Professor removido.", "info");
    }
  }

  openModal() {
    const modal = document.getElementById("coach-modal");
    if (modal) {
      modal.classList.add("open");
      modal.classList.remove("pointer-events-none");
    }
  }

  closeModal() {
    const modal = document.getElementById("coach-modal");
    if (modal) {
      modal.classList.remove("open");
      modal.classList.add("pointer-events-none");
    }
  }
}
