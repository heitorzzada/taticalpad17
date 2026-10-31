/**
 * ==============================================================================
 * TACTICALPAD FUTSAL PRO - MÓDULO DE DESENHO TÁTICO
 * DRAWINGS.JS: Setas (Contínua, Tracejada, Ondulada, T), Zonas Táticas e Borracha
 * ==============================================================================
 */

class TacticalDrawings {
  constructor(board) {
    this.board = board;
    this.pitch = board.pitch;
    this.ctx = board.ctx;

    this.drawings = [];
    this.activeTool = "select";
    this.drawColor = "#FFCC00";
    this.drawLineWidth = 3.5;
    this.zoneOpacity = 0.25;

    this.currentDrawing = null;
    this.selectedDrawing = null;
  }

  setLineWidth(width) {
    this.drawLineWidth = parseFloat(width) || 3.5;
  }

  isDrawingTool(tool) {
    return [
      "arrow_solid",
      "arrow_dashed",
      "arrow_wavy",
      "arrow_tbar",
      "arrow_double",
      "zone_rect",
      "zone_ellipse",
      "player_line"
    ].includes(tool);
  }

  startDrawing(courtPos) {
    this.currentDrawing = {
      id: `draw-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

  updateDrawing(courtPos) {
    if (!this.currentDrawing) return;
    this.currentDrawing.endX = courtPos.x;
    this.currentDrawing.endY = courtPos.y;
    this.currentDrawing.points.push({ x: courtPos.x, y: courtPos.y });
  }

  finishDrawing() {
    if (!this.currentDrawing) return;
    const dx = this.currentDrawing.endX - this.currentDrawing.startX;
    const dy = this.currentDrawing.endY - this.currentDrawing.startY;
    if (Math.hypot(dx, dy) > 8) {
      this.drawings.push(this.currentDrawing);
      this.board.saveState();
    }
    this.currentDrawing = null;
    this.board.render();
  }

  findHitDrawing(screenX, screenY) {
    for (let i = this.drawings.length - 1; i >= 0; i--) {
      const d = this.drawings[i];
      const p1 = this.pitch.courtToCanvas(d.startX, d.startY);
      const p2 = this.pitch.courtToCanvas(d.endX, d.endY);
      const dist = this.pointToSegmentDistance(screenX, screenY, p1.x, p1.y, p2.x, p2.y);
      if (dist < 18) return d;
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

  renderZones() {
    const zones = this.drawings.filter(d => ["zone_rect", "zone_ellipse"].includes(d.type));
    zones.forEach(z => this.drawSingle(z));
  }

  renderStrokes() {
    const strokes = this.drawings.filter(d => !["zone_rect", "zone_ellipse"].includes(d.type));
    strokes.forEach(s => this.drawSingle(s));
    if (this.currentDrawing) {
      this.drawSingle(this.currentDrawing, true);
    }
  }

  drawSingle(draw, isPreview = false) {
    const ctx = this.ctx;
    const p1 = this.pitch.courtToCanvas(draw.startX, draw.startY);
    const p2 = this.pitch.courtToCanvas(draw.endX, draw.endY);
    const scale = this.pitch.metrics.scale;
    const lineWidth = (draw.lineWidth || 3) * scale;

    ctx.save();
    ctx.strokeStyle = draw.color || this.drawColor;
    ctx.fillStyle = draw.color || this.drawColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (draw.type) {
      case "arrow_solid":
        this.drawArrow(p1, p2, false);
        break;
      case "arrow_dashed":
        this.drawArrow(p1, p2, true);
        break;
      case "arrow_wavy":
        this.drawWavyArrow(p1, p2);
        break;
      case "arrow_tbar":
        this.drawTBar(p1, p2);
        break;
      case "arrow_double":
        this.drawDoubleArrow(p1, p2);
        break;
      case "player_line":
        ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 3 * scale, 0, Math.PI * 2);
        ctx.arc(p2.x, p2.y, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "zone_rect": {
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
      case "zone_ellipse": {
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

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    const endLineX = p2.x - Math.cos(angle) * (arrowHeadLen * 0.7);
    const endLineY = p2.y - Math.sin(angle) * (arrowHeadLen * 0.7);
    ctx.lineTo(endLineX, endLineY);
    ctx.stroke();

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

  drawTBar(p1, p2) {
    const ctx = this.ctx;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const scale = this.pitch.metrics.scale;
    const barLen = Math.max(14, 20 * scale);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const perpX = Math.cos(angle + Math.PI / 2) * barLen;
    const perpY = Math.sin(angle + Math.PI / 2) * barLen;

    ctx.lineWidth = ctx.lineWidth * 1.5;
    ctx.beginPath();
    ctx.moveTo(p2.x - perpX, p2.y - perpY);
    ctx.lineTo(p2.x + perpX, p2.y + perpY);
    ctx.stroke();
    ctx.restore();
  }

  drawDoubleArrow(p1, p2) {
    const ctx = this.ctx;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);
    const scale = this.pitch.metrics.scale;
    const arrowHeadLen = Math.max(12, 16 * scale);

    if (dist < arrowHeadLen * 1.8) return;

    ctx.save();
    ctx.beginPath();
    const startLineX = p1.x + Math.cos(angle) * (arrowHeadLen * 0.7);
    const startLineY = p1.y + Math.sin(angle) * (arrowHeadLen * 0.7);
    const endLineX = p2.x - Math.cos(angle) * (arrowHeadLen * 0.7);
    const endLineY = p2.y - Math.sin(angle) * (arrowHeadLen * 0.7);
    ctx.moveTo(startLineX, startLineY);
    ctx.lineTo(endLineX, endLineY);
    ctx.stroke();

    // Seta na ponta final
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - arrowHeadLen * Math.cos(angle - Math.PI / 6), p2.y - arrowHeadLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(p2.x - (arrowHeadLen * 0.6) * Math.cos(angle), p2.y - (arrowHeadLen * 0.6) * Math.sin(angle));
    ctx.lineTo(p2.x - arrowHeadLen * Math.cos(angle + Math.PI / 6), p2.y - arrowHeadLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Seta na ponta inicial (oposta)
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p1.x + arrowHeadLen * Math.cos(angle - Math.PI / 6), p1.y + arrowHeadLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(p1.x + (arrowHeadLen * 0.6) * Math.cos(angle), p1.y + (arrowHeadLen * 0.6) * Math.sin(angle));
    ctx.lineTo(p1.x + arrowHeadLen * Math.cos(angle + Math.PI / 6), p1.y + arrowHeadLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

window.TacticalDrawings = TacticalDrawings;
