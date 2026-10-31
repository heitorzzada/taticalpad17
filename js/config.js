/**
 * ==============================================================================
 * 1. CONFIGURAÇÕES DE IDENTIDADE VISUAL E PERSONALIZAÇÃO (VARIÁVEIS GLOBAIS)
 * Objeto centralizado fácil de editar e sincronizado com o localStorage.
 * ==============================================================================
 */

// Ícone SVG padrão de alta qualidade para a Logo da Escolinha (Emblema de Futsal com Bola, Chamas e Escudo)
const DEFAULT_FUTSAL_CREST_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23004AAD" />
      <stop offset="100%" stop-color="%23002661" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23FFEA75" />
      <stop offset="50%" stop-color="%23FFCC00" />
      <stop offset="100%" stop-color="%23D49B00" />
    </linearGradient>
  </defs>
  <!-- Escudo Externo -->
  <path d="M100 12 L175 38 C175 125, 100 178, 100 188 C100 178, 25 125, 25 38 Z" fill="url(%23shieldGrad)" stroke="url(%23goldGrad)" stroke-width="7" stroke-linejoin="round" />
  <!-- Borda interna dourada -->
  <path d="M100 24 L163 46 C163 118, 100 165, 100 173 C100 165, 37 118, 37 46 Z" fill="none" stroke="%23FFCC00" stroke-width="2" opacity="0.6"/>
  <!-- Faixa central -->
  <path d="M37 75 Q100 95 163 75 L163 95 Q100 115 37 95 Z" fill="%23FFCC00" opacity="0.25"/>
  <!-- Bola de Futsal estilizada -->
  <g transform="translate(100, 95)">
    <circle cx="0" cy="0" r="34" fill="%23FFFFFF" stroke="%231E293B" stroke-width="3"/>
    <!-- Pentágonos e gomos clássicos da bola -->
    <polygon points="0,-12 11,-4 7,9 -7,9 -11,-4" fill="%23004AAD"/>
    <line x1="0" y1="-12" x2="0" y2="-34" stroke="%231E293B" stroke-width="2.5"/>
    <line x1="11" y1="-4" x2="31" y2="-12" stroke="%231E293B" stroke-width="2.5"/>
    <line x1="7" y1="9" x2="22" y2="26" stroke="%231E293B" stroke-width="2.5"/>
    <line x1="-7" y1="9" x2="-22" y2="26" stroke="%231E293B" stroke-width="2.5"/>
    <line x1="-11" y1="-4" x2="-31" y2="-12" stroke="%231E293B" stroke-width="2.5"/>
  </g>
  <!-- Estrelas de Campeão no topo -->
  <polygon points="100,32 103,40 112,40 105,45 107,53 100,48 93,53 95,45 88,40 97,40" fill="url(%23goldGrad)"/>
  <polygon points="80,36 82,42 88,42 83,46 85,52 80,48 75,52 77,46 72,42 78,42" fill="url(%23goldGrad)" opacity="0.8"/>
  <polygon points="120,36 122,42 128,42 123,46 125,52 120,48 115,52 117,46 112,42 118,42" fill="url(%23goldGrad)" opacity="0.8"/>
  <!-- Texto "FUTSAL" -->
  <text x="100" y="152" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="%23FFCC00" text-anchor="middle" letter-spacing="3">FUTSAL</text>
  <text x="100" y="167" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="%23FFFFFF" text-anchor="middle" letter-spacing="2">ACADEMY</text>
</svg>`;

// Configuração Centralizada da Escolinha (Editável)
const SCHOOL_CONFIG = {
  // Identidade Institucional
  schoolName: "Amaporã Futsal Sub-17",
  tagline: "Categoria de Base & Alto Rendimento | Desde 2025",
  
  // Cores da Interface e Identidade
  primaryColor: "#0066CC",       // Azul Royal Amaporã
  secondaryColor: "#38BDF8",     // Azul Celeste
  
  // Cores e Texturas da Quadra de Futsal Oficial
  pitchPreset: "wood",           // "wood" | "blue" | "concrete" | "green" | "terracotta"
  pitchColor: "#C87B2E",         // Piso da Quadra
  pitchAreaColor: "#C87B2E",     // Área de Gol / Garrafão
  courtLineColor: "#FFFFFF",     // Linhas demarcatórias oficiais
  woodFloorUrl: "img/court/wood_floor.jpg", // Textura fotorrealista de madeira sem marcações
  
  // Logo da Equipe na Quadra
  logoUrl: "img/logos/amapora_sub17.png",
  logoOpacity: 0.65,             // Opacidade no centro da quadra (0.05 a 0.8)
  showCenterLogo: true,
  showCornerLogos: true,
  
  // Uniformes das Equipes na Prancheta
  teamAName: "Amaporã Futsal",
  teamBName: "Adversário / Colete",
  teamAColor: "#004AAD",         // Camisa Time A
  teamATextColor: "#FFFFFF",     // Número Time A
  teamBColor: "#DC2626",         // Camisa Time B (Vermelho)
  teamBTextColor: "#FFFFFF",     // Número Time B
  teamAGkColor: "#10B981",       // Goleiro Time A (Verde Esmeralda)
  teamBGkColor: "#F59E0B",       // Goleiro Time B (Laranja / Amarelo)

  // Treinador padrão para exportação
  defaultCoach: "Prof. Fawller Augusti"
};

// Presets visuais de pisos de quadra de Futsal
const PITCH_PRESETS = {
  blue: {
    name: "Azul Oficial (Piso Sintético/Tarasflex)",
    pitchColor: "#1E3A5F",
    pitchAreaColor: "#142640",
    courtLineColor: "#FFFFFF"
  },
  wood: {
    name: "Madeira Nobre (Parquet / Taboão)",
    pitchColor: "#BA7A3B",
    pitchAreaColor: "#9E642B",
    courtLineColor: "#FFFFFF"
  },
  concrete: {
    name: "Cinza Moderno (Concreto Polido / Epóxi)",
    pitchColor: "#334155",
    pitchAreaColor: "#1E293B",
    courtLineColor: "#FFCC00"
  },
  green: {
    name: "Verde Tradicional (Resina Poliuretano)",
    pitchColor: "#1B4D3E",
    pitchAreaColor: "#12352A",
    courtLineColor: "#FFFFFF"
  },
  terracotta: {
    name: "Terracota / Laranja Futsal",
    pitchColor: "#C25928",
    pitchAreaColor: "#9A3E15",
    courtLineColor: "#FFFFFF"
  }
};

/**
 * Gerenciador de Armazenamento Local para Configurações
 */
const ConfigManager = {
  STORAGE_KEY: "tacticalpad_school_config",

  init() {
    this.load();
    this.applyCSSVariables();
  },

  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(SCHOOL_CONFIG, parsed);
      }
    } catch (e) {
      console.warn("Erro ao carregar configurações salvas:", e);
    }
  },

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(SCHOOL_CONFIG));
      this.applyCSSVariables();
    } catch (e) {
      console.error("Erro ao salvar configurações no localStorage:", e);
    }
  },

  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    window.location.reload();
  },

  applyCSSVariables() {
    const root = document.documentElement;
    root.style.setProperty("--primary-color", SCHOOL_CONFIG.primaryColor);
    root.style.setProperty("--secondary-color", SCHOOL_CONFIG.secondaryColor);
    root.style.setProperty("--pitch-color", SCHOOL_CONFIG.pitchColor);
    root.style.setProperty("--court-line-color", SCHOOL_CONFIG.courtLineColor);

    // Atualiza nome e logo nos elementos da interface
    const schoolNameEls = document.querySelectorAll(".app-school-name");
    schoolNameEls.forEach(el => el.textContent = SCHOOL_CONFIG.schoolName);

    const schoolTaglineEls = document.querySelectorAll(".app-school-tagline");
    schoolTaglineEls.forEach(el => el.textContent = SCHOOL_CONFIG.tagline);

    const logoImgs = document.querySelectorAll(".app-school-logo");
    logoImgs.forEach(img => {
      img.src = SCHOOL_CONFIG.logoUrl || DEFAULT_FUTSAL_CREST_SVG;
    });
  }
};

/**
 * Dados Iniciais de Professores (Comissão Técnica)
 */
const DEFAULT_COACHES = [
  {
    id: "coach-1",
    name: "Prof. Fawller Augusti",
    role: "Técnico Principal",
    categories: ["Todas as Categorias", "Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17", "Adulto"],
    cref: "CREF 089412-G/SP",
    licenses: "Licença A Treinador CBFS/FIFA | Especialista em Metodologia de Futsal",
    experience: "Treinador Principal",
    photoUrl: "static/img/professors/fawller_augusti.png",
    bio: "Treinador principal com ampla liderança e atuação no desenvolvimento técnico, tático e disciplinar de atletas em todas as categorias da escolinha.",
    philosophy: "'Disciplina tática, intensidade e paixão pelo jogo formam atletas vencedores.'",
    email: "fawller.augusti@falcaofutsal.com.br",
    phone: "(11) 98888-5522"
  },
  {
    id: "coach-2",
    name: "Prof. Lucas 'Falcão' Silveira",
    role: "Coordenador Técnico & Treinador Principal",
    categories: ["Sub-15", "Sub-17", "Adulto"],
    cref: "CREF 034891-G/SP",
    licenses: "Licença PRO Futsal CBFS | Pós em Fisiologia do Exercício",
    experience: "14 anos de experiência",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
    bio: "Ex-atleta profissional com passagens por ligas nacionais e internacionais. Foco no desenvolvimento do raciocínio rápido sob pressão, tomada de decisão inteligente e transições letais.",
    philosophy: "'O futsal moderno exige atletas cognitivos que enxergam o espaço antes da bola chegar.'",
    email: "lucas.silveira@falcaofutsal.com.br",
    phone: "(11) 98765-4321"
  },
  {
    id: "coach-3",
    name: "Profª. Mariana Castro",
    role: "Treinadora de Base & Especialista em Iniciação",
    categories: ["Sub-7", "Sub-9", "Sub-11", "Sub-13"],
    cref: "CREF 078234-G/SP",
    licenses: "Mestre em Ciências do Movimento | Certificação Barça Innovation Hub",
    experience: "9 anos de formação de jovens",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80",
    bio: "Especialista em psicomotricidade infantil, desenvolvimento de habilidades motoras fundamentais e ludicidade aplicada à inteligência tática do futsal.",
    philosophy: "'Na base, a técnica não é fim, é instrumento para a criança expressar sua criatividade e alegria de jogar.'",
    email: "mariana.castro@falcaofutsal.com.br",
    phone: "(11) 97654-3210"
  },
  {
    id: "coach-4",
    name: "Prof. Rodrigo 'Muralha' Rocha",
    role: "Preparador Específico de Goleiros & Análise de Desempenho",
    categories: ["Todas as Categorias", "Goleiros"],
    cref: "CREF 051902-G/SP",
    licenses: "Especialista em Biomecânica da Defesa | Licença A Treinador de Goleiros",
    experience: "12 anos no alto rendimento",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
    bio: "Trabalho detalhado de postura em 'X', cruz de braços, velocidade de reação, leitura de finalizações e atuação moderna do goleiro como 5º homem de linha (saída de bola com os pés).",
    philosophy: "'O goleiro de futsal é o primeiro armador do time e o último guardião da meta.'",
    email: "rodrigo.muralha@falcaofutsal.com.br",
    phone: "(11) 96543-2109"
  }
];

/**
 * Treinos Táticos Pré-Cadastrados para a Biblioteca
 */
const DEFAULT_DRILLS = [
  {
    id: "drill-1",
    title: "Saída de Pressão 3-1 com Rotação de Ala e Pivô",
    category: "Sub-15",
    type: "Tática",
    duration: 25,
    author: "Prof. Lucas Silveira",
    description: "Exercício tático de quebra de pressão alta adversária. Goleiro inicia a jogada pelo fixo, que atrai o marcador e aciona o ala oposto em diagonal. O pivô faz o movimento de faca para receber de costas e escorar.",
    objectives: "Desmarcar sob pressão, criar linha de passe diagonal, transição rápida para quadra de ataque com suporte no pivô.",
    rules: "Máximo de 2 toques por atleta na primeira linha de construção; finalização deve ocorrer em até 6 segundos após ultrapassar o meio-campo.",
    coachingPoints: "Atenção ao tempo de bola do ala; orientação corporal ao receber (perfilado); pivô deve fixar o último homem antes de pedir no pé.",
    date: "2026-10-15",
    viewMode: "horizontal"
  },
  {
    id: "drill-2",
    title: "Circulação em Linha de 4 (4-0) com Passe e Vai",
    category: "Sub-17",
    type: "Tática",
    duration: 30,
    author: "Prof. Lucas Silveira",
    description: "Sistema tático sem pivô de referência para atrair a defesa adversária e atacar o espaço nas costas da primeira linha de marcação.",
    objectives: "Mobilidade constante, criação de linhas de infiltração nas costas, leitura dos bloqueios indiretos e finalização na segunda trave.",
    rules: "Passe obriga infiltração imediata; rotação contínua em formato de 'oito' ou pêndulo.",
    coachingPoints: "Intensidade no desmarque; troca de ritmo na aceleração; precisão no passe rasteiro forte.",
    date: "2026-10-18",
    viewMode: "horizontal"
  },
  {
    id: "drill-3",
    title: "Escanteio Ensaiado: Bloqueio Central e Chute da 2ª Trave",
    category: "Adulto",
    type: "Bola Parada",
    duration: 20,
    author: "Prof. Rodrigo Rocha",
    description: "Jogada ensaiada de escanteio em meia-quadra ofensiva. Jogador 2 simula aproximação curta, Jogador 3 faz o bloqueio no marcador central e Jogador 4 infiltra livre pelo lado cego para concluir de primeira.",
    objectives: "Sincronia de movimento, tela tática limpa sem falta, finalização rápida de primeiro pau ou segunda trave.",
    rules: "Cobrança rápida dentro dos 4 segundos regulamentares; jogador bloqueador deve manter os pés firmes.",
    coachingPoints: "Comunicação não verbal (sinal combinado); força e direção precisa do passe na altura da área.",
    date: "2026-10-22",
    viewMode: "half"
  },
  {
    id: "drill-4",
    title: "Circuito Técnico-Motor: Agilidade + Condução + Chute",
    category: "Sub-11",
    type: "Físico/Técnico",
    duration: 35,
    author: "Profª. Mariana Castro",
    description: "Estação de agilidade com escada de coordenação (passos rápidos 2 dentro / 2 fora), transição para slalom com drible curto entre cones e finalização rápida contra mini-trave com ambas as pernas.",
    objectives: "Coordenação psicomotora, controle de bola em velocidade com sola e peito do pé, tomada de decisão motora rápida.",
    rules: "Alternar perna dominante e não dominante em cada repetição; comemorar em equipe ao marcar.",
    coachingPoints: "Corpo inclinado para frente nos cones; olhar não deve ficar preso somente na bola; troca rápida de direção.",
    date: "2026-10-25",
    viewMode: "vertical"
  },
  {
    id: "drill-5",
    title: "Ataque 5x4 com Goleiro-Linha: Circulação em W e Finalização",
    category: "Sub-17",
    type: "Tática",
    duration: 25,
    author: "Prof. Lucas Silveira",
    description: "Estrutura posicional em 'W' no ataque de goleiro-linha. Paciência na troca de passes na linha dos alas até desorganizar o quadrado defensivo adversário e abrir a paralela para finalização no fundo.",
    objectives: "Manter a superioridade numérica limpa, evitar perdas perigosas no meio, bola rápida na diagonal.",
    rules: "Nunca arriscar passe central sem linha limpa; retorno defensivo imediato em caso de chute bloqueado.",
    coachingPoints: "Passes fortes e rente ao solo; alas bem abertos colados na linha lateral para alargar o bloco adversário.",
    date: "2026-10-28",
    viewMode: "half"
  }
];
