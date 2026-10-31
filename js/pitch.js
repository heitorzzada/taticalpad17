/**
 * ==============================================================================
 * 3.A. RENDERIZAÇÃO DA QUADRA DE FUTSAL OFICIAL (PITCH RENDERER)
 * Canvas 2D engine com marcações oficiais FIFA/CBFS, proporções exatas,
 * suporte a orientações (Horizontal, Vertical, Meia-Quadra) e renderização de logo.
 * ==============================================================================
 */

class PitchRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.viewMode = "horizontal"; // 'horizontal' | 'vertical' | 'half'
    
    // Dimensões do espaço virtual da quadra (proporção oficial 40m x 20m = 1000 x 500)
    this.VIRTUAL_WIDTH = 1000;
    this.VIRTUAL_HEIGHT = 500;
    this.BORDER_MARGIN = 40; // Margem de escape (zona de segurança)

    // Cache da imagem da logo para desenho de alta performance
    this.logoImage = null;
    this.logoLoaded = false;
    this.loadLogo(SCHOOL_CONFIG.logoUrl);

    // Métricas calculadas para transformação de coordenadas
    this.metrics = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      pitchWidth: 0,
      pitchHeight: 0,
      canvasWidth: 0,
      canvasHeight: 0
    };
  }

  loadLogo(url) {
    if (!url) return;
    this.logoImage = new Image();
    this.logoImage.crossOrigin = "anonymous";
    this.logoImage.onload = () => {
      this.logoLoaded = true;
    };
    this.logoImage.src = url;
  }

  setViewMode(mode) {
    if (["horizontal", "vertical", "half"].includes(mode)) {
      this.viewMode = mode;
      this.updateMetrics();
    }
  }

  /**
   * Atualiza as métricas de escala e posicionamento da quadra no canvas
   */
  updateMetrics() {
    const container = this.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    const displayWidth = Math.max(300, Math.floor(rect.width));
    const displayHeight = Math.max(250, Math.floor(rect.height));

    this.canvas.width = Math.floor(displayWidth * dpr);
    this.canvas.height = Math.floor(displayHeight * dpr);
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    // Espaço virtual dependendo do modo de visualização
    let targetVW, targetVH;
    if (this.viewMode === "horizontal") {
      targetVW = this.VIRTUAL_WIDTH + this.BORDER_MARGIN * 2;
      targetVH = this.VIRTUAL_HEIGHT + this.BORDER_MARGIN * 2;
    } else if (this.viewMode === "vertical") {
      targetVW = this.VIRTUAL_HEIGHT + this.BORDER_MARGIN * 2;
      targetVH = this.VIRTUAL_WIDTH + this.BORDER_MARGIN * 2;
    } else { // 'half' (meia quadra horizontal ou focada)
      targetVW = (this.VIRTUAL_WIDTH / 2) + this.BORDER_MARGIN * 2;
      targetVH = this.VIRTUAL_HEIGHT + this.BORDER_MARGIN * 2;
    }

    // Calcula a escala uniforme para caber perfeitamente mantendo proporção
    const scaleX = (displayWidth - 20) / targetVW;
    const scaleY = (displayHeight - 20) / targetVH;
    const scale = Math.min(scaleX, scaleY);

    const pitchWidth = targetVW * scale;
    const pitchHeight = targetVH * scale;
    const offsetX = (displayWidth - pitchWidth) / 2;
    const offsetY = (displayHeight - pitchHeight) / 2;

    this.metrics = {
      scale,
      offsetX,
      offsetY,
      pitchWidth,
      pitchHeight,
      canvasWidth: displayWidth,
      canvasHeight: displayHeight,
      targetVW,
      targetVH
    };
  }

  /**
   * Converte coordenadas do espaço de quadra virtual (0 a 1000 x 0 a 500) para coordenadas de tela do canvas
   */
  courtToCanvas(vx, vy) {
    const { scale, offsetX, offsetY } = this.metrics;
    const bm = this.BORDER_MARGIN;

    if (this.viewMode === "horizontal") {
      return {
        x: offsetX + (vx + bm) * scale,
        y: offsetY + (vy + bm) * scale
      };
    } else if (this.viewMode === "vertical") {
      // Rotaciona 90 graus: X vira Y invertido, Y vira X
      return {
        x: offsetX + (vy + bm) * scale,
        y: offsetY + ((this.VIRTUAL_WIDTH - vx) + bm) * scale
      };
    } else { // 'half' (foco na metade direita: 500 a 1000)
      const clampedVx = Math.max(500, Math.min(1000, vx));
      const relX = clampedVx - 500;
      return {
        x: offsetX + (relX + bm) * scale,
        y: offsetY + (vy + bm) * scale
      };
    }
  }

  /**
   * Converte coordenadas de clique/toque da tela para o espaço virtual da quadra (0 a 1000 x 0 a 500)
   */
  canvasToCourt(screenX, screenY) {
    const { scale, offsetX, offsetY } = this.metrics;
    const bm = this.BORDER_MARGIN;

    if (this.viewMode === "horizontal") {
      return {
        x: (screenX - offsetX) / scale - bm,
        y: (screenY - offsetY) / scale - bm
      };
    } else if (this.viewMode === "vertical") {
      const rotatedY = (screenX - offsetX) / scale - bm;
      const rotatedX = (screenY - offsetY) / scale - bm;
      return {
        x: this.VIRTUAL_WIDTH - rotatedX,
        y: rotatedY
      };
    } else { // 'half'
      const relX = (screenX - offsetX) / scale - bm;
      return {
        x: relX + 500,
        y: (screenY - offsetY) / scale - bm
      };
    }
  }

  /**
   * Renderiza a quadra inteira com todas as marcações oficiais
   */
  render() {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.metrics;
    const dpr = window.devicePixelRatio || 1;

    // Garante escala de alta resolução (Retina / 4K)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Limpa o canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Salva estado
    ctx.save();

    // Desenha o fundo da área de escape (cor da quadra com leve escurecimento)
    this.drawBackground();

    // Desenha o piso da quadra de jogo
    this.drawCourtFloor();

    // Desenha a logo no centro e nos cantos
    this.drawLogos();

    // Desenha todas as linhas oficiais de futsal
    this.drawOfficialMarkings();

    // Desenha as traves/gols
    this.drawGoals();

    ctx.restore();
  }

  /**
   * Desenha o fundo e a área de escape
   */
  drawBackground() {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.metrics;

    // Fundo geral do canvas
    ctx.fillStyle = "#0B1120";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  /**
   * Desenha o piso da quadra e texturas (Madeira/Tarasflex)
   */
  drawCourtFloor() {
    const ctx = this.ctx;
    const bm = this.BORDER_MARGIN;

    // Coordenadas dos cantos da quadra no modo atual
    let xMin = 0, xMax = this.VIRTUAL_WIDTH;
    let yMin = 0, yMax = this.VIRTUAL_HEIGHT;

    if (this.viewMode === "half") {
      xMin = 500;
    }

    const pTL = this.courtToCanvas(xMin - bm, yMin - bm);
    const pBR = this.courtToCanvas(xMax + bm, yMax + bm);

    const floorX = Math.min(pTL.x, pBR.x);
    const floorY = Math.min(pTL.y, pBR.y);
    const floorW = Math.abs(pBR.x - pTL.x);
    const floorH = Math.abs(pBR.y - pTL.y);

    // 1. Piso da Quadra (Base Color)
    ctx.fillStyle = SCHOOL_CONFIG.pitchColor;
    ctx.fillRect(floorX, floorY, floorW, floorH);

    // 2. Se for preset de Madeira, desenha réguas de parquet elegantes
    if (SCHOOL_CONFIG.pitchPreset === "wood") {
      this.drawWoodTexture(floorX, floorY, floorW, floorH);
    }

    // 3. Área de Gol / Garrafão (Cor diferenciada se configurada)
    this.drawPenaltyAreasFloor();

    // Borda exterior suave e sombra da quadra
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(floorX, floorY, floorW, floorH);
  }

  /**
   * Textura estilizada de tábuas de madeira de quadra oficial (Parquet)
   */
  drawWoodTexture(x, y, w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const plankHeight = Math.max(12, Math.floor(18 * this.metrics.scale));
    const plankWidth = plankHeight * 5;

    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;

    let row = 0;
    for (let py = y; py < y + h; py += plankHeight) {
      const offset = (row % 3) * (plankWidth / 3);
      for (let px = x - offset; px < x + w; px += plankWidth) {
        ctx.fillStyle = (row + Math.floor(px / plankWidth)) % 2 === 0 
          ? "rgba(255, 255, 255, 0.03)" 
          : "rgba(0, 0, 0, 0.03)";
        ctx.fillRect(px, py, plankWidth, plankHeight);
        ctx.strokeRect(px, py, plankWidth, plankHeight);
      }
      row++;
    }
    ctx.restore();
  }

  /**
   * Preenchimento da área de meta / garrafão com cor de contraste
   */
  drawPenaltyAreasFloor() {
    if (!SCHOOL_CONFIG.pitchAreaColor || SCHOOL_CONFIG.pitchAreaColor === SCHOOL_CONFIG.pitchColor) return;

    const ctx = this.ctx;
    ctx.fillStyle = SCHOOL_CONFIG.pitchAreaColor;

    // No futsal oficial: 6 metros de raio a partir de cada poste, conectados por linha reta de 3.16m
    // Em escala virtual: Raio = 150 unidades (6m). Trave = 75 unidades (3m)
    // Postes em Y: 212.5 e 287.5 (Centro Y = 250)

    // Área Esquerda (se não for modo half ou se for half esquerdo)
    if (this.viewMode !== "half") {
      this.drawSinglePenaltyAreaFloor(0, 212.5, 287.5, 150, 1);
    }

    // Área Direita
    this.drawSinglePenaltyAreaFloor(1000, 212.5, 287.5, 150, -1);
  }

  drawSinglePenaltyAreaFloor(goalLineX, post1Y, post2Y, radius, dir) {
    const ctx = this.ctx;
    ctx.beginPath();
    
    // Início na linha de gol acima do poste superior
    const p1 = this.courtToCanvas(goalLineX, post1Y - radius);
    ctx.moveTo(p1.x, p1.y);

    // Amostragem de arco suave convertida para canvas
    const steps = 18;
    // Arco do poste superior
    for (let i = 0; i <= steps; i++) {
      const angle = (dir === 1) 
        ? -Math.PI / 2 + (i / steps) * (Math.PI / 2) 
        : -Math.PI / 2 - (i / steps) * (Math.PI / 2);
      const vx = goalLineX + Math.cos(angle) * radius;
      const vy = post1Y + Math.sin(angle) * radius;
      const pt = this.courtToCanvas(vx, vy);
      ctx.lineTo(pt.x, pt.y);
    }

    const straightEnd = this.courtToCanvas(goalLineX + (dir === 1 ? radius : -radius), post2Y);
    ctx.lineTo(straightEnd.x, straightEnd.y);

    // Arco do poste inferior
    for (let i = 0; i <= steps; i++) {
      const angle = (dir === 1) 
        ? (i / steps) * (Math.PI / 2) 
        : Math.PI - (i / steps) * (Math.PI / 2);
      const vx = goalLineX + Math.cos(angle) * radius;
      const vy = post2Y + Math.sin(angle) * radius;
      const pt = this.courtToCanvas(vx, vy);
      ctx.lineTo(pt.x, pt.y);
    }

    // Fecha na linha de gol
    const pEnd = this.courtToCanvas(goalLineX, post2Y + radius);
    ctx.lineTo(pEnd.x, pEnd.y);
    const pBase = this.courtToCanvas(goalLineX, post1Y - radius);
    ctx.lineTo(pBase.x, pBase.y);
    ctx.closePath();

    ctx.fill();
  }

  /**
   * Renderiza a Logo da Escolinha no Centro e/ou Cantos
   */
  drawLogos() {
    if (!this.logoLoaded || !this.logoImage) return;
    const ctx = this.ctx;

    // 1. Logo Central
    if (SCHOOL_CONFIG.showCenterLogo) {
      ctx.save();
      ctx.globalAlpha = SCHOOL_CONFIG.logoOpacity || 0.25;

      const centerCoord = (this.viewMode === "half")
        ? this.courtToCanvas(750, 250)
        : this.courtToCanvas(500, 250);

      const logoSize = 180 * this.metrics.scale;
      ctx.drawImage(
        this.logoImage,
        centerCoord.x - logoSize / 2,
        centerCoord.y - logoSize / 2,
        logoSize,
        logoSize
      );
      ctx.restore();
    }

    // 2. Logos nos Cantos (Opcional)
    if (SCHOOL_CONFIG.showCornerLogos && this.viewMode === "horizontal") {
      ctx.save();
      ctx.globalAlpha = 0.15;
      const cornerSize = 70 * this.metrics.scale;

      const corners = [
        this.courtToCanvas(70, 70),
        this.courtToCanvas(930, 70),
        this.courtToCanvas(70, 430),
        this.courtToCanvas(930, 430)
      ];

      corners.forEach(pt => {
        ctx.drawImage(
          this.logoImage,
          pt.x - cornerSize / 2,
          pt.y - cornerSize / 2,
          cornerSize,
          cornerSize
        );
      });
      ctx.restore();
    }
  }

  /**
   * Marcações Oficiais de Futsal (Linhas de 8cm normalizadas)
   */
  drawOfficialMarkings() {
    const ctx = this.ctx;
    ctx.strokeStyle = SCHOOL_CONFIG.courtLineColor;
    ctx.fillStyle = SCHOOL_CONFIG.courtLineColor;
    ctx.lineWidth = Math.max(1.8, 2.8 * this.metrics.scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const isHalf = this.viewMode === "half";
    const xMin = isHalf ? 500 : 0;
    const xMax = 1000;

    // 1. Linhas Limítrofes da Quadra (Retângulo Principal 1000 x 500)
    const pTL = this.courtToCanvas(xMin, 0);
    const pTR = this.courtToCanvas(xMax, 0);
    const pBR = this.courtToCanvas(xMax, 500);
    const pBL = this.courtToCanvas(xMin, 500);

    ctx.beginPath();
    ctx.moveTo(pTL.x, pTL.y);
    ctx.lineTo(pTR.x, pTR.y);
    ctx.lineTo(pBR.x, pBR.y);
    ctx.lineTo(pBL.x, pBL.y);
    ctx.closePath();
    ctx.stroke();

    // 2. Linha Central e Círculo Central (Raio = 75 unidades = 3 metros)
    if (!isHalf) {
      const pMidTop = this.courtToCanvas(500, 0);
      const pMidBot = this.courtToCanvas(500, 500);
      ctx.beginPath();
      ctx.moveTo(pMidTop.x, pMidTop.y);
      ctx.lineTo(pMidBot.x, pMidBot.y);
      ctx.stroke();

      // Círculo Central
      this.drawCourtCircle(500, 250, 75, false);

      // Ponto Central (Kickoff)
      this.drawCourtDot(500, 250, 4.5);
    } else {
      // No modo meia quadra, a linha central é o limite esquerdo
      const pMidTop = this.courtToCanvas(500, 0);
      const pMidBot = this.courtToCanvas(500, 500);
      ctx.beginPath();
      ctx.moveTo(pMidTop.x, pMidTop.y);
      ctx.lineTo(pMidBot.x, pMidBot.y);
      ctx.stroke();

      // Meio círculo central visível na meia-quadra
      this.drawCourtCircle(500, 250, 75, false, Math.PI / 2, -Math.PI / 2);
      this.drawCourtDot(500, 250, 4.5);
    }

    // 3. Áreas de Meta / Garrafão (6m) e Linha de Pênalti
    if (!isHalf) {
      this.drawPenaltyMarkings(0, 1);     // Lado Esquerdo
    }
    this.drawPenaltyMarkings(1000, -1);   // Lado Direito

    // 4. Marca dos 10 metros (Tiro Livre Sem Barreira / Segunda Marca de Pênalti)
    if (!isHalf) {
      this.drawTenMeterSpot(250); // 10m da linha esquerda
    }
    this.drawTenMeterSpot(750);   // 10m da linha direita

    // 5. Arcos de Escanteio (Raio de 25cm = 6.25 unidades)
    this.drawCornerArcs(isHalf);

    // 6. Zonas de Substituição (5 metros de largura ao lado dos bancos)
    this.drawSubstitutionZones(isHalf);
  }

  /**
   * Desenha marcação completa da área de meta de 6m e ponto penal
   */
  drawPenaltyMarkings(goalLineX, dir) {
    const ctx = this.ctx;
    const post1Y = 212.5; // Post superior (largura trave = 75)
    const post2Y = 287.5; // Post inferior
    const radius = 150;   // 6 metros

    // Desenha o contorno da área
    ctx.beginPath();
    const steps = 20;

    // Arco 1
    for (let i = 0; i <= steps; i++) {
      const angle = (dir === 1) 
        ? -Math.PI / 2 + (i / steps) * (Math.PI / 2) 
        : -Math.PI / 2 - (i / steps) * (Math.PI / 2);
      const vx = goalLineX + Math.cos(angle) * radius;
      const vy = post1Y + Math.sin(angle) * radius;
      const pt = this.courtToCanvas(vx, vy);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }

    // Linha reta de 3.16m conectando os arcos
    const straightEnd = this.courtToCanvas(goalLineX + (dir === 1 ? radius : -radius), post2Y);
    ctx.lineTo(straightEnd.x, straightEnd.y);

    // Arco 2
    for (let i = 0; i <= steps; i++) {
      const angle = (dir === 1) 
        ? (i / steps) * (Math.PI / 2) 
        : Math.PI - (i / steps) * (Math.PI / 2);
      const vx = goalLineX + Math.cos(angle) * radius;
      const vy = post2Y + Math.sin(angle) * radius;
      const pt = this.courtToCanvas(vx, vy);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Ponto Penal dos 6 metros
    const penX = goalLineX + (dir === 1 ? radius : -radius);
    this.drawCourtDot(penX, 250, 4);

    // Marca de 5 metros para a barreira em escanteios (linha de 40cm a 5m do escanteio)
    this.drawFiveMeterCornerMarks(goalLineX, dir);
  }

  /**
   * Marca de tiro livre sem barreira (10 metros)
   */
  drawTenMeterSpot(x) {
    const ctx = this.ctx;
    // Ponto central dos 10m
    this.drawCourtDot(x, 250, 4);

    // Tracinho regulamentar perpendicular de 10cm
    const p1 = this.courtToCanvas(x, 245);
    const p2 = this.courtToCanvas(x, 255);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  /**
   * Marcas de 5 metros nos tiros de canto
   */
  drawFiveMeterCornerMarks(goalLineX, dir) {
    const ctx = this.ctx;
    // 5 metros = 125 unidades da linha lateral
    const marks = [
      { x: goalLineX + 125 * dir, y: 0 },
      { x: goalLineX + 125 * dir, y: 500 }
    ];

    marks.forEach(m => {
      const pt1 = this.courtToCanvas(m.x, m.y);
      const pt2 = this.courtToCanvas(m.x, m.y === 0 ? -10 : 510);
      ctx.beginPath();
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
    });
  }

  /**
   * Arcos dos escanteios (25cm de raio = 6.25 unidades)
   */
  drawCornerArcs(isHalf) {
    const radius = 12; // Visualmente nítido
    const corners = isHalf 
      ? [
          { x: 1000, y: 0, a1: Math.PI / 2, a2: Math.PI },
          { x: 1000, y: 500, a1: Math.PI, a2: 1.5 * Math.PI }
        ]
      : [
          { x: 0, y: 0, a1: 0, a2: Math.PI / 2 },
          { x: 0, y: 500, a1: 1.5 * Math.PI, a2: 2 * Math.PI },
          { x: 1000, y: 0, a1: Math.PI / 2, a2: Math.PI },
          { x: 1000, y: 500, a1: Math.PI, a2: 1.5 * Math.PI }
        ];

    corners.forEach(c => {
      this.drawCourtCircle(c.x, c.y, radius, false, c.a1, c.a2);
    });
  }

  /**
   * Zonas de substituição (5m de extensão na linha lateral dos bancos)
   */
  drawSubstitutionZones(isHalf) {
    const ctx = this.ctx;
    // Linha lateral inferior (bancos) a 5m da linha central
    const zones = isHalf 
      ? [ { x: 500 + 125, w: 125 } ]
      : [
          { x: 500 - 250, w: 125 },
          { x: 500 + 125, w: 125 }
        ];

    zones.forEach(z => {
      const p1 = this.courtToCanvas(z.x, 500);
      const p2 = this.courtToCanvas(z.x, 515);
      const p3 = this.courtToCanvas(z.x + z.w, 500);
      const p4 = this.courtToCanvas(z.x + z.w, 515);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    });
  }

  /**
   * Desenha as traves de gol com rede tridimensional realista
   */
  drawGoals() {
    const isHalf = this.viewMode === "half";
    if (!isHalf) {
      this.drawSingleGoal(0, -1);
    }
    this.drawSingleGoal(1000, 1);
  }

  drawSingleGoal(goalLineX, dir) {
    const ctx = this.ctx;
    const post1Y = 212.5; // Post 1 (3m = 75 unidades)
    const post2Y = 287.5; // Post 2
    const depth = 35;     // Profundidade da trave (1 metro)

    const pP1 = this.courtToCanvas(goalLineX, post1Y);
    const pP2 = this.courtToCanvas(goalLineX, post2Y);
    const pB1 = this.courtToCanvas(goalLineX + depth * dir, post1Y);
    const pB2 = this.courtToCanvas(goalLineX + depth * dir, post2Y);

    // Fundo da rede (semi-transparente)
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(pP1.x, pP1.y);
    ctx.lineTo(pB1.x, pB1.y);
    ctx.lineTo(pB2.x, pB2.y);
    ctx.lineTo(pP2.x, pP2.y);
    ctx.closePath();
    ctx.fill();

    // Malha da rede
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const frac = i / 4;
      const n1 = this.courtToCanvas(goalLineX + depth * dir * frac, post1Y);
      const n2 = this.courtToCanvas(goalLineX + depth * dir * frac, post2Y);
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();
    }

    // Armação da trave e postes brancos reforçados
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(3, 4 * this.metrics.scale);
    ctx.beginPath();
    // Postes frontais
    ctx.moveTo(pP1.x, pP1.y);
    ctx.lineTo(pP2.x, pP2.y);
    // Estrutura traseira
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = Math.max(1.5, 2.2 * this.metrics.scale);
    ctx.beginPath();
    ctx.moveTo(pP1.x, pP1.y);
    ctx.lineTo(pB1.x, pB1.y);
    ctx.lineTo(pB2.x, pB2.y);
    ctx.lineTo(pP2.x, pP2.y);
    ctx.stroke();

    // Pinos vermelhos/brancos clássicos de futsal nos postes
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.arc(pP1.x, pP1.y, Math.max(2.5, 3.5 * this.metrics.scale), 0, Math.PI * 2);
    ctx.arc(pP2.x, pP2.y, Math.max(2.5, 3.5 * this.metrics.scale), 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Helper: Desenha círculo em coordenadas de quadra
   */
  drawCourtCircle(vx, vy, vRadius, fill = false, startAngle = 0, endAngle = Math.PI * 2) {
    const ctx = this.ctx;
    const center = this.courtToCanvas(vx, vy);
    const radiusPx = vRadius * this.metrics.scale;

    ctx.beginPath();
    ctx.arc(center.x, center.y, radiusPx, startAngle, endAngle);
    if (fill) ctx.fill();
    else ctx.stroke();
  }

  /**
   * Helper: Desenha ponto/marca circular
   */
  drawCourtDot(vx, vy, radius = 3.5) {
    const ctx = this.ctx;
    const pt = this.courtToCanvas(vx, vy);
    const r = Math.max(2, radius * this.metrics.scale);

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
