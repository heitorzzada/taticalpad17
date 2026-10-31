/**
 * ==============================================================================
 * TACTICALPAD FUTSAL PRO - BACKEND API CLIENT (DJANGO INTEGRATION)
 * Comunicação assíncrona (Fetch) com proteção CSRF para salvar e carregar
 * configurações, professores e treinos táticos diretamente no banco de dados.
 * ==============================================================================
 */

class TacticalApi {
  constructor() {
    this.csrfToken = this.getCsrfToken();
  }

  /**
   * Obtém o token CSRF dos cookies do Django ou do input oculto no DOM
   */
  getCsrfToken() {
    let token = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, 10) === "csrftoken=") {
          token = decodeURIComponent(cookie.substring(10));
          break;
        }
      }
    }
    if (!token) {
      const csrfInput = document.querySelector("[name=csrfmiddlewaretoken]");
      if (csrfInput) token = csrfInput.value;
    }
    return token || "";
  }

  /**
   * Helper para chamadas Fetch seguras com cabeçalhos apropriados
   */
  async request(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      "X-CSRFToken": this.csrfToken || this.getCsrfToken(),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`Erro na requisição para ${url}:`, err);
      throw err;
    }
  }

  // --- CONFIGURAÇÃO DA ESCOLINHA ---
  async getSchoolConfig() {
    return this.request("/api/config/");
  }

  async saveSchoolConfig(configData) {
    return this.request("/api/config/save/", {
      method: "POST",
      body: JSON.stringify(configData)
    });
  }

  // --- COMISSÃO TÉCNICA (PROFESSORES) ---
  async listProfessors() {
    return this.request("/api/staff/list/");
  }

  async saveProfessor(professorData) {
    return this.request("/api/staff/save/", {
      method: "POST",
      body: JSON.stringify(professorData)
    });
  }

  async deleteProfessor(id) {
    return this.request(`/api/staff/delete/${id}/`, {
      method: "POST"
    });
  }

  // --- PRANCHETA TÁTICA & BIBLIOTECA DE TREINOS ---
  async listTacticalPlays(category = "all", drillType = "all", search = "") {
    const params = new URLSearchParams();
    if (category && category !== "all") params.append("category", category);
    if (drillType && drillType !== "all") params.append("type", drillType);
    if (search) params.append("q", search);

    return this.request(`/api/tactical/list/?${params.toString()}`);
  }

  async getTacticalPlay(id) {
    return this.request(`/api/tactical/${id}/`);
  }

  async saveTacticalPlay(playData) {
    return this.request("/api/tactical/save/", {
      method: "POST",
      body: JSON.stringify(playData)
    });
  }

  async deleteTacticalPlay(id) {
    return this.request(`/api/tactical/delete/${id}/`, {
      method: "POST"
    });
  }
}

// Instância global do cliente de API
window.tacticalApi = new TacticalApi();
