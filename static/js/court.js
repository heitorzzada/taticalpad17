/**
 * ==============================================================================
 * TACTICALPAD FUTSAL PRO - MÓDULO DE RENDERIZAÇÃO DA QUADRA
 * COURT.JS: PitchRenderer com marcações oficiais FIFA/CBFS, texturas e logo
 * ==============================================================================
 */

class PitchRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.viewMode = "horizontal"; // 'horizontal' | 'vertical' | 'half'
    
    // Proporção oficial de futsal: 40m x 20m (Espaço virtual 1000 x 500)
    this.VIRTUAL_WIDTH = 1000;
    this.VIRTUAL_HEIGHT = 500;
    this.BORDER_MARGIN = 40; // Zona de escape/segurança

    this.logoImage = null;
    this.logoLoaded = false;
    this.loadLogo(window.SCHOOL_CONFIG?.logoUrl || "");

    this.woodImage = null;
    this.woodLoaded = false;
    this.loadWoodTexture(window.SCHOOL_CONFIG?.woodFloorUrl || "/static/img/court/wood_floor.jpg");

    // Controle de Zoom & Pan Estilo Desktop App (TacticalPad)
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.minZoom = 0.6;
    this.maxZoom = 3.5;

    this.metrics = {
      scale: 1,
      baseScale: 1,
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
      this.render();
    };
    this.logoImage.src = url;
  }

  loadWoodTexture(url) {
    if (!url) return;
    this.woodImage = new Image();
    this.woodImage.crossOrigin = "anonymous";
    this.woodImage.onload = () => {
      this.woodLoaded = true;
      this.render();
    };
    this.woodImage.onerror = () => {
      // Fallback para caminhos relativos em aberturas locais
      if (url.startsWith("/static/")) {
        const altUrl = url.replace("/static/", "");
        if (this.woodImage.src !== altUrl) {
          this.woodImage.src = altUrl;
        }
      }
    };
    this.woodImage.src = url;
  }

  setViewMode(mode) {
    if (["horizontal", "vertical", "half"].includes(mode)) {
      this.viewMode = mode;
      this.resetZoomPan();
    }
  }

  setZoom(newZoom, screenCenterX, screenCenterY) {
    const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
    if (Math.abs(clampedZoom - this.zoom) < 0.001) return;

    if (screenCenterX !== undefined && screenCenterY !== undefined) {
      const courtBefore = this.canvasToCourt(screenCenterX, screenCenterY);
      this.zoom = clampedZoom;
      this.updateMetrics();
      const canvasAfter = this.courtToCanvas(courtBefore.x, courtBefore.y);
      this.panX += (screenCenterX - canvasAfter.x);
      this.panY += (screenCenterY - canvasAfter.y);
      this.updateMetrics();
    } else {
      this.zoom = clampedZoom;
      this.updateMetrics();
    }
  }

  zoomIn() {
    this.setZoom(this.zoom * 1.25);
  }

  zoomOut() {
    this.setZoom(this.zoom / 1.25);
  }

  resetZoomPan() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.updateMetrics();
  }

  panBy(dx, dy) {
    this.panX += dx;
    this.panY += dy;
    this.updateMetrics();
  }

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

    let targetVW, targetVH;
    if (this.viewMode === "horizontal") {
      targetVW = this.VIRTUAL_WIDTH + this.BORDER_MARGIN * 2;
      targetVH = this.VIRTUAL_HEIGHT + this.BORDER_MARGIN * 2;
    } else if (this.viewMode === "vertical") {
      targetVW = this.VIRTUAL_HEIGHT + this.BORDER_MARGIN * 2;
      targetVH = this.VIRTUAL_WIDTH + this.BORDER_MARGIN * 2;
    } else { // 'half'
      targetVW = (this.VIRTUAL_WIDTH / 2) + this.BORDER_MARGIN * 2;
      targetVH = this.VIRTUAL_HEIGHT + this.BORDER_MARGIN * 2;
    }

    const scaleX = (displayWidth - 20) / targetVW;
    const scaleY = (displayHeight - 20) / targetVH;
    const baseScale = Math.min(scaleX, scaleY);
    const effectiveScale = baseScale * this.zoom;

    const pitchWidth = targetVW * effectiveScale;
    const pitchHeight = targetVH * effectiveScale;
    const offsetX = (displayWidth - pitchWidth) / 2 + this.panX;
    const offsetY = (displayHeight - pitchHeight) / 2 + this.panY;

    this.metrics = {
      scale: effectiveScale,
      baseScale,
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

  courtToCanvas(vx, vy) {
    const { scale, offsetX, offsetY } = this.metrics;
    const bm = this.BORDER_MARGIN;

    if (this.viewMode === "horizontal") {
      return {
        x: offsetX + (vx + bm) * scale,
        y: offsetY + (vy + bm) * scale
      };
    } else if (this.viewMode === "vertical") {
      return {
        x: offsetX + (vy + bm) * scale,
        y: offsetY + ((this.VIRTUAL_WIDTH - vx) + bm) * scale
      };
    } else { // 'half'
      const clampedVx = Math.max(500, Math.min(1000, vx));
      const relX = clampedVx - 500;
      return {
        x: offsetX + (relX + bm) * scale,
        y: offsetY + (vy + bm) * scale
      };
    }
  }

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

  render() {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.metrics;
    const dpr = window.devicePixelRatio || 1;

    // Garante que o contexto permaneça perfeitamente escalado em alta resolução
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.save();
    this.drawBackground();
    this.drawCourtFloor();
    this.drawLogos();
    this.drawOfficialMarkings();
    this.drawGoals();
    ctx.restore();
  }

  drawBackground() {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.metrics;
    ctx.fillStyle = "#070D19";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  drawCourtFloor() {
    const ctx = this.ctx;
    const bm = this.BORDER_MARGIN;
    const cfg = window.SCHOOL_CONFIG || {};

    let xMin = (this.viewMode === "half") ? 500 : 0;
    let xMax = 1000;

    const pTL = this.courtToCanvas(xMin - bm, -bm);
    const pBR = this.courtToCanvas(xMax + bm, 500 + bm);

    const floorX = Math.min(pTL.x, pBR.x);
    const floorY = Math.min(pTL.y, pBR.y);
    const floorW = Math.abs(pBR.x - pTL.x);
    const floorH = Math.abs(pBR.y - pTL.y);

    // 1. Piso da Quadra (Cor de fundo sólida de base/fallback)
    ctx.fillStyle = cfg.pitchColor || "#C87B2E";
    ctx.fillRect(floorX, floorY, floorW, floorH);

    // 2. Textura Real de Madeira (se preset for "wood" ou imagem carregada)
    if (cfg.pitchPreset === "wood" || this.woodLoaded) {
      this.drawWoodTexture(floorX, floorY, floorW, floorH);
    }

    // 3. Área de Gol / Garrafão (Cor de contraste se configurada)
    this.drawPenaltyAreasFloor();

    // Contorno exterior
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(floorX, floorY, floorW, floorH);
  }

  drawWoodTexture(floorX, floorY, floorW, floorH) {
    const ctx = this.ctx;

    // Se a imagem de textura fotorrealista sem marcações estiver carregada, desenha a foto real
    if (this.woodLoaded && this.woodImage && this.woodImage.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(floorX, floorY, floorW, floorH);
      ctx.clip();

      const imgW = this.woodImage.naturalWidth;
      const imgH = this.woodImage.naturalHeight;

      if (this.viewMode === "vertical") {
        // Rotaciona a textura 90 graus para que as tábuas acompanhem o comprimento vertical da quadra
        ctx.translate(floorX + floorW / 2, floorY + floorH / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(this.woodImage, 0, 0, imgW, imgH, -floorH / 2, -floorW / 2, floorH, floorW);
      } else if (this.viewMode === "half") {
        // Na meia-quadra direita, projeta a metade da imagem de madeira correspondente
        const sx = Math.floor(imgW * 0.46);
        const sw = Math.floor(imgW * 0.54);
        ctx.drawImage(this.woodImage, sx, 0, sw, imgH, floorX, floorY, floorW, floorH);
      } else {
        // Modo horizontal inteiro: projeta a textura cobrindo perfeitamente a quadra
        ctx.drawImage(this.woodImage, 0, 0, imgW, imgH, floorX, floorY, floorW, floorH);
      }

      // Sutil vinheta / acabamento de borda e verniz de ginásio
      const grad = ctx.createLinearGradient(floorX, floorY, floorX, floorY + floorH);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.05)");
      grad.addColorStop(0.5, "rgba(0, 0, 0, 0)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0.06)");
      ctx.fillStyle = grad;
      ctx.fillRect(floorX, floorY, floorW, floorH);

      ctx.restore();
      return;
    }

    // Procedural Fallback caso a imagem ainda esteja sendo baixada
    ctx.save();
    ctx.beginPath();
    ctx.rect(floorX, floorY, floorW, floorH);
    ctx.clip();

    const plankH = Math.max(12, Math.floor(18 * this.metrics.scale));
    const plankW = plankH * 5;

    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 1;

    let row = 0;
    for (let py = floorY; py < floorY + floorH; py += plankH) {
      const offset = (row % 3) * (plankW / 3);
      for (let px = floorX - offset; px < floorX + floorW; px += plankW) {
        ctx.fillStyle = (row + Math.floor(px / plankW)) % 2 === 0 
          ? "rgba(255, 255, 255, 0.03)" 
          : "rgba(0, 0, 0, 0.03)";
        ctx.fillRect(px, py, plankW, plankH);
        ctx.strokeRect(px, py, plankW, plankH);
      }
      row++;
    }
    ctx.restore();
  }

  drawPenaltyAreasFloor() {
    const cfg = window.SCHOOL_CONFIG || {};
    if (!cfg.pitchAreaColor || cfg.pitchAreaColor === cfg.pitchColor) return;

    const ctx = this.ctx;
    ctx.save();
    if (cfg.pitchPreset === "wood") {
      ctx.globalAlpha = 0.35; // Mantém a textura de madeira visível sob a pintura da área
    }

    if (this.viewMode !== "half") {
      this.drawSinglePenaltyAreaFloor(0, 212.5, 287.5, 150, 1);
    }
    this.drawSinglePenaltyAreaFloor(1000, 212.5, 287.5, 150, -1);
    ctx.restore();
  }

  drawSinglePenaltyAreaFloor(goalLineX, post1Y, post2Y, radius, dir) {
    const ctx = this.ctx;
    const cfg = window.SCHOOL_CONFIG || {};
    ctx.fillStyle = cfg.pitchAreaColor || "#142640";
    ctx.beginPath();
    
    const p1 = this.courtToCanvas(goalLineX, post1Y - radius);
    ctx.moveTo(p1.x, p1.y);

    const steps = 18;
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

    for (let i = 0; i <= steps; i++) {
      const angle = (dir === 1) 
        ? (i / steps) * (Math.PI / 2) 
        : Math.PI - (i / steps) * (Math.PI / 2);
      const vx = goalLineX + Math.cos(angle) * radius;
      const vy = post2Y + Math.sin(angle) * radius;
      const pt = this.courtToCanvas(vx, vy);
      ctx.lineTo(pt.x, pt.y);
    }

    const pEnd = this.courtToCanvas(goalLineX, post2Y + radius);
    ctx.lineTo(pEnd.x, pEnd.y);
    const pBase = this.courtToCanvas(goalLineX, post1Y - radius);
    ctx.lineTo(pBase.x, pBase.y);
    ctx.closePath();
    ctx.fill();
  }

  drawLogos() {
    if (!this.logoLoaded || !this.logoImage) return;
    const ctx = this.ctx;
    const cfg = window.SCHOOL_CONFIG || {};

    const imgW = this.logoImage.naturalWidth || this.logoImage.width || 1;
    const imgH = this.logoImage.naturalHeight || this.logoImage.height || 1;
    const aspect = imgW / imgH;

    if (cfg.showCenterLogo !== false) {
      ctx.save();
      ctx.globalAlpha = cfg.logoOpacity || 0.38;

      const centerCoord = (this.viewMode === "half")
        ? this.courtToCanvas(750, 250)
        : this.courtToCanvas(500, 250);

      // Proporções ideais para caber perfeitamente harmonioso no círculo central
      let targetH = 185 * this.metrics.scale;
      let targetW = targetH * aspect;

      ctx.translate(centerCoord.x, centerCoord.y);
      if (this.viewMode === "vertical") {
        ctx.rotate(Math.PI / 2);
      }

      ctx.drawImage(
        this.logoImage,
        -targetW / 2,
        -targetH / 2,
        targetW,
        targetH
      );
      ctx.restore();
    }

    if (cfg.showCornerLogos && this.viewMode === "horizontal") {
      ctx.save();
      ctx.globalAlpha = (cfg.logoOpacity || 0.38) * 0.45;
      const cornerH = 70 * this.metrics.scale;
      const cornerW = cornerH * aspect;

      const corners = [
        this.courtToCanvas(70, 70),
        this.courtToCanvas(930, 70),
        this.courtToCanvas(70, 430),
        this.courtToCanvas(930, 430)
      ];

      corners.forEach(pt => {
        ctx.drawImage(
          this.logoImage,
          pt.x - cornerW / 2,
          pt.y - cornerH / 2,
          cornerW,
          cornerH
        );
      });
      ctx.restore();
    }
  }

  drawOfficialMarkings() {
    const ctx = this.ctx;
    const cfg = window.SCHOOL_CONFIG || {};
    const lineColor = cfg.courtLineColor || "#FFFFFF";

    ctx.strokeStyle = lineColor;
    ctx.fillStyle = lineColor;
    ctx.lineWidth = Math.max(1.8, 2.8 * this.metrics.scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const isHalf = this.viewMode === "half";
    const xMin = isHalf ? 500 : 0;
    const xMax = 1000;

    // Retângulo Principal da Quadra
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

    // Linha Central & Círculo Central (Raio = 3m = 75 unidades)
    const pMidTop = this.courtToCanvas(500, 0);
    const pMidBot = this.courtToCanvas(500, 500);
    ctx.beginPath();
    ctx.moveTo(pMidTop.x, pMidTop.y);
    ctx.lineTo(pMidBot.x, pMidBot.y);
    ctx.stroke();

    if (!isHalf) {
      this.drawCourtCircle(500, 250, 75, false);
      this.drawCourtDot(500, 250, 4.5);
    } else {
      this.drawCourtCircle(500, 250, 75, false, Math.PI / 2, -Math.PI / 2);
      this.drawCourtDot(500, 250, 4.5);
    }

    // Áreas de Meta / Garrafão (6m) e Pênaltis
    if (!isHalf) {
      this.drawPenaltyMarkings(0, 1);
      this.drawTenMeterSpot(250);
    }
    this.drawPenaltyMarkings(1000, -1);
    this.drawTenMeterSpot(750);

    // Arcos de Escanteio & Zonas de Substituição
    this.drawCornerArcs(isHalf);
    this.drawSubstitutionZones(isHalf);
  }

  drawPenaltyMarkings(goalLineX, dir) {
    const ctx = this.ctx;
    const post1Y = 212.5;
    const post2Y = 287.5;
    const radius = 150;

    ctx.beginPath();
    const steps = 20;

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

    const straightEnd = this.courtToCanvas(goalLineX + (dir === 1 ? radius : -radius), post2Y);
    ctx.lineTo(straightEnd.x, straightEnd.y);

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

    // Ponto Penal dos 6m
    this.drawCourtDot(goalLineX + (dir === 1 ? radius : -radius), 250, 4);
  }

  drawTenMeterSpot(x) {
    const ctx = this.ctx;
    this.drawCourtDot(x, 250, 4);

    const p1 = this.courtToCanvas(x, 245);
    const p2 = this.courtToCanvas(x, 255);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Marcas de barreira regulamentar a 5m (125 unidades) acima e abaixo da marca dos 10m
    const tickUp1 = this.courtToCanvas(x - 5, 250 - 125);
    const tickUp2 = this.courtToCanvas(x + 5, 250 - 125);
    const tickDown1 = this.courtToCanvas(x - 5, 250 + 125);
    const tickDown2 = this.courtToCanvas(x + 5, 250 + 125);
    ctx.beginPath();
    ctx.moveTo(tickUp1.x, tickUp1.y);
    ctx.lineTo(tickUp2.x, tickUp2.y);
    ctx.moveTo(tickDown1.x, tickDown1.y);
    ctx.lineTo(tickDown2.x, tickDown2.y);
    ctx.stroke();
  }

  drawCornerArcs(isHalf) {
    const radius = 12;
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

  drawSubstitutionZones(isHalf) {
    const ctx = this.ctx;
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

  drawGoals() {
    const isHalf = this.viewMode === "half";
    if (!isHalf) {
      this.drawSingleGoal(0, -1);
    }
    this.drawSingleGoal(1000, 1);
  }

  drawSingleGoal(goalLineX, dir) {
    const ctx = this.ctx;
    const post1Y = 212.5;
    const post2Y = 287.5;
    const depth = 35;

    const pP1 = this.courtToCanvas(goalLineX, post1Y);
    const pP2 = this.courtToCanvas(goalLineX, post2Y);
    const pB1 = this.courtToCanvas(goalLineX + depth * dir, post1Y);
    const pB2 = this.courtToCanvas(goalLineX + depth * dir, post2Y);

    // Rede
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(pP1.x, pP1.y);
    ctx.lineTo(pB1.x, pB1.y);
    ctx.lineTo(pB2.x, pB2.y);
    ctx.lineTo(pP2.x, pP2.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
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

    // Traves brancas
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(3, 4 * this.metrics.scale);
    ctx.beginPath();
    ctx.moveTo(pP1.x, pP1.y);
    ctx.lineTo(pP2.x, pP2.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = Math.max(1.5, 2.2 * this.metrics.scale);
    ctx.beginPath();
    ctx.moveTo(pP1.x, pP1.y);
    ctx.lineTo(pB1.x, pB1.y);
    ctx.lineTo(pB2.x, pB2.y);
    ctx.lineTo(pP2.x, pP2.y);
    ctx.stroke();

    // Detalhe vermelho nos postes
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.arc(pP1.x, pP1.y, Math.max(2.5, 3.5 * this.metrics.scale), 0, Math.PI * 2);
    ctx.arc(pP2.x, pP2.y, Math.max(2.5, 3.5 * this.metrics.scale), 0, Math.PI * 2);
    ctx.fill();
  }

  drawCourtCircle(vx, vy, vRadius, fill = false, startAngle = 0, endAngle = Math.PI * 2) {
    const ctx = this.ctx;
    const center = this.courtToCanvas(vx, vy);
    const radiusPx = vRadius * this.metrics.scale;

    ctx.beginPath();
    ctx.arc(center.x, center.y, radiusPx, startAngle, endAngle);
    if (fill) ctx.fill();
    else ctx.stroke();
  }

  drawCourtDot(vx, vy, radius = 3.5) {
    const ctx = this.ctx;
    const pt = this.courtToCanvas(vx, vy);
    const r = Math.max(2, radius * this.metrics.scale);

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.PitchRenderer = PitchRenderer;
