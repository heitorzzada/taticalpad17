/**
 * ==============================================================================
 * TACTICALPAD FUTSAL PRO - MÓDULO DE ATLETAS E FORMAÇÕES
 * PLAYERS.JS: Pinos de Atletas, Equipamentos de Treino, Formações Rápidas e Interação
 * ==============================================================================
 */

class PlayerEntityManager {
  constructor(board) {
    this.board = board;
    this.pitch = board.pitch;
    this.ctx = board.ctx;

    this.players = [];
    this.balls = [];
    this.equipment = [];

    this.selectedItem = null;
    this.selectedType = null; // 'player' | 'ball' | 'equipment'
    this.isDragging = false;
    this.isRotating = false;
    this.dragStart = { x: 0, y: 0 };
    this.itemStartPos = { x: 0, y: 0 };
  }

  initDefault() {
    this.balls = [
      { id: "ball-1", x: 500, y: 250, radius: 11 }
    ];

    // Time A (Principal) - Formação Inicial 3-1
    this.players = [
      { id: "ta-gk", team: "A", isGk: true, number: 1, name: "Goleiro", x: 100, y: 250, angle: 0 },
      { id: "ta-fixo", team: "A", isGk: false, number: 3, name: "Fixo", x: 240, y: 250, angle: 0 },
      { id: "ta-ala-e", team: "A", isGk: false, number: 7, name: "Ala Esq", x: 370, y: 110, angle: 0 },
      { id: "ta-ala-d", team: "A", isGk: false, number: 10, name: "Ala Dir", x: 370, y: 390, angle: 0 },
      { id: "ta-pivo", team: "A", isGk: false, number: 9, name: "Pivô", x: 480, y: 250, angle: 0 },

      // Time B (Adversário)
      { id: "tb-pivo", team: "B", isGk: false, number: 9, name: "Marcador", x: 550, y: 250, angle: Math.PI },
      { id: "tb-ala-e", team: "B", isGk: false, number: 11, name: "Ala Adv", x: 650, y: 120, angle: Math.PI },
      { id: "tb-ala-d", team: "B", isGk: false, number: 8, name: "Ala Adv", x: 650, y: 380, angle: Math.PI },
      { id: "tb-fixo", team: "B", isGk: false, number: 4, name: "Fixo Adv", x: 760, y: 250, angle: Math.PI },
      { id: "tb-gk", team: "B", isGk: true, number: 12, name: "Goleiro Adv", x: 910, y: 250, angle: Math.PI }
    ];

    this.equipment = [];
  }

  applyFormation(teamKey, formationName) {
    const isTeamA = teamKey === "A";
    const baseGoalX = isTeamA ? 70 : 930;
    const midX = isTeamA ? 350 : 650;
    const frontX = isTeamA ? 480 : 520;
    const targetAngle = isTeamA ? 0 : Math.PI;

    const teamPlayers = this.players.filter(p => p.team === teamKey);
    if (teamPlayers.length === 0) return;

    let gk = teamPlayers.find(p => p.isGk) || teamPlayers[0];
    let line = teamPlayers.filter(p => p.id !== gk.id);

    if (formationName === "5x4") {
      gk.x = isTeamA ? 620 : 380;
      gk.y = 250;
      gk.angle = targetAngle;
    } else {
      gk.x = baseGoalX;
      gk.y = 250;
      gk.angle = targetAngle;
    }

    if (formationName === "3-1") {
      if (line[0]) { line[0].x = isTeamA ? 230 : 770; line[0].y = 250; line[0].angle = targetAngle; }
      if (line[1]) { line[1].x = midX; line[1].y = 110; line[1].angle = targetAngle; }
      if (line[2]) { line[2].x = midX; line[2].y = 390; line[2].angle = targetAngle; }
      if (line[3]) { line[3].x = frontX; line[3].y = 250; line[3].angle = targetAngle; }
    } else if (formationName === "4-0") {
      const xPos = isTeamA ? 310 : 690;
      if (line[0]) { line[0].x = xPos; line[0].y = 90; line[0].angle = targetAngle; }
      if (line[1]) { line[1].x = isTeamA ? 270 : 730; line[1].y = 195; line[1].angle = targetAngle; }
      if (line[2]) { line[2].x = isTeamA ? 270 : 730; line[2].y = 305; line[2].angle = targetAngle; }
      if (line[3]) { line[3].x = xPos; line[3].y = 410; line[3].angle = targetAngle; }
    } else if (formationName === "2-2") {
      const defX = isTeamA ? 240 : 760;
      const atkX = isTeamA ? 460 : 540;
      if (line[0]) { line[0].x = defX; line[0].y = 150; line[0].angle = targetAngle; }
      if (line[1]) { line[1].x = defX; line[1].y = 350; line[1].angle = targetAngle; }
      if (line[2]) { line[2].x = atkX; line[2].y = 150; line[2].angle = targetAngle; }
      if (line[3]) { line[3].x = atkX; line[3].y = 350; line[3].angle = targetAngle; }
    } else if (formationName === "1-2-1") {
      if (line[0]) { line[0].x = isTeamA ? 220 : 780; line[0].y = 250; line[0].angle = targetAngle; }
      if (line[1]) { line[1].x = midX; line[1].y = 100; line[1].angle = targetAngle; }
      if (line[2]) { line[2].x = midX; line[2].y = 400; line[2].angle = targetAngle; }
      if (line[3]) { line[3].x = frontX; line[3].y = 250; line[3].angle = targetAngle; }
    } else if (formationName === "5x4") {
      const deepX = isTeamA ? 840 : 160;
      const wingX = isTeamA ? 740 : 260;
      if (line[0]) { line[0].x = deepX; line[0].y = 100; line[0].angle = targetAngle; }
      if (line[1]) { line[1].x = deepX; line[1].y = 400; line[1].angle = targetAngle; }
      if (line[2]) { line[2].x = wingX; line[2].y = 150; line[2].angle = targetAngle; }
      if (line[3]) { line[3].x = wingX; line[3].y = 350; line[3].angle = targetAngle; }
    } else if (formationName === "def_zona") {
      const defX = isTeamA ? 200 : 800;
      const frontDefX = isTeamA ? 320 : 680;
      if (line[0]) { line[0].x = defX; line[0].y = 180; line[0].angle = targetAngle; }
      if (line[1]) { line[1].x = defX; line[1].y = 320; line[1].angle = targetAngle; }
      if (line[2]) { line[2].x = frontDefX; line[2].y = 160; line[2].angle = targetAngle; }
      if (line[3]) { line[3].x = frontDefX; line[3].y = 340; line[3].angle = targetAngle; }
    }

    this.board.saveState();
    this.board.render();
  }

  addPlayer(team = "A", isGk = false) {
    const isTeamA = team === "A";
    const teamCount = this.players.filter(p => p.team === team).length;
    const newNumber = teamCount + 1;
    const center = this.pitch.viewMode === "half" ? { x: 750, y: 250 } : { x: 500, y: 250 };

    const player = {
      id: `player-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      team,
      isGk,
      number: newNumber,
      name: isGk ? "Goleiro" : `Atleta ${newNumber}`,
      x: center.x + (isTeamA ? -60 : 60),
      y: center.y + (Math.random() - 0.5) * 80,
      angle: isTeamA ? 0 : Math.PI
    };

    this.players.push(player);
    this.selectItem(player, "player", { x: player.x, y: player.y });
    this.board.saveState();
    this.board.render();
  }

  addBall() {
    const center = this.pitch.viewMode === "half" ? { x: 750, y: 250 } : { x: 500, y: 250 };
    const ball = {
      id: `ball-${Date.now()}`,
      x: center.x + (Math.random() - 0.5) * 40,
      y: center.y + (Math.random() - 0.5) * 40,
      radius: 11
    };
    this.balls.push(ball);
    this.selectItem(ball, "ball", { x: ball.x, y: ball.y });
    this.board.saveState();
    this.board.render();
  }

  addEquipment(type, color = "#F97316") {
    const center = this.pitch.viewMode === "half" ? { x: 750, y: 250 } : { x: 500, y: 250 };
    const item = {
      id: `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      color,
      x: center.x + (Math.random() - 0.5) * 60,
      y: center.y + (Math.random() - 0.5) * 60,
      angle: 0
    };
    this.equipment.push(item);
    this.selectItem(item, "equipment", { x: item.x, y: item.y });
    this.board.saveState();
    this.board.render();
  }

  selectItem(item, type, courtPos) {
    this.selectedItem = item;
    this.selectedType = type;
    this.isDragging = true;
    this.dragStart = { x: courtPos.x, y: courtPos.y };
    this.itemStartPos = { x: item.x, y: item.y };
    this.board.onSelectionChange?.(item, type);
  }

  clearSelection() {
    this.selectedItem = null;
    this.selectedType = null;
    this.board.onSelectionChange?.(null, null);
  }

  deleteSelected() {
    if (!this.selectedItem) return;
    if (this.selectedType === "player") {
      this.players = this.players.filter(p => p.id !== this.selectedItem.id);
    } else if (this.selectedType === "ball") {
      if (this.balls.length > 1) {
        this.balls = this.balls.filter(b => b.id !== this.selectedItem.id);
      }
    } else if (this.selectedType === "equipment") {
      this.equipment = this.equipment.filter(e => e.id !== this.selectedItem.id);
    }
    this.clearSelection();
    this.board.saveState();
    this.board.render();
  }

  findHitPlayer(courtPos) {
    const hitRadius = 22;
    for (let i = this.players.length - 1; i >= 0; i--) {
      const p = this.players[i];
      const dx = courtPos.x - p.x;
      const dy = courtPos.y - p.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) return p;
    }
    return null;
  }

  isHitRotationHandle(screenX, screenY, player) {
    if (!player) return false;
    const pt = this.pitch.courtToCanvas(player.x, player.y);
    const scale = this.pitch.metrics.scale;
    const radius = Math.max(14, 19 * scale);
    const handleDist = radius * 1.85;
    const angle = player.angle || 0;
    const handleX = pt.x + Math.cos(angle) * handleDist;
    const handleY = pt.y + Math.sin(angle) * handleDist;
    const dx = screenX - handleX;
    const dy = screenY - handleY;
    const hitR = Math.max(12, 14 * scale);
    return dx * dx + dy * dy <= hitR * hitR;
  }

  findHitBall(courtPos) {
    const hitRadius = 18;
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      const dx = courtPos.x - b.x;
      const dy = courtPos.y - b.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) return b;
    }
    return null;
  }

  findHitEquipment(courtPos) {
    const hitRadius = 24;
    for (let i = this.equipment.length - 1; i >= 0; i--) {
      const eq = this.equipment[i];
      const dx = courtPos.x - eq.x;
      const dy = courtPos.y - eq.y;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) return eq;
    }
    return null;
  }

  render() {
    this.renderEquipment();
    this.renderPlayers();
    this.renderBalls();
  }

  renderEquipment() {
    const ctx = this.ctx;
    const scale = this.pitch.metrics.scale;

    this.equipment.forEach(eq => {
      const pt = this.pitch.courtToCanvas(eq.x, eq.y);
      const isSelected = this.selectedItem && this.selectedItem.id === eq.id;

      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(eq.angle || 0);

      if (isSelected) {
        ctx.shadowColor = "#FFCC00";
        ctx.shadowBlur = 14;
      }

      switch (eq.type) {
        case "cone": {
          const coneH = Math.max(26, 34 * scale);
          const baseW = Math.max(20, 26 * scale);
          const baseH = Math.max(6, 8.5 * scale);
          const topW = Math.max(4.5, 6 * scale);
          const yBase = coneH * 0.35;
          const yTop = yBase - coneH;
          const coneColor = eq.color || "#F97316";

          // 1. Sombra projetada no piso da quadra (Drop Shadow)
          ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
          ctx.beginPath();
          if (ctx.ellipse) {
            ctx.ellipse(0, yBase + 1.5 * scale, baseW * 0.62, baseH * 0.6, 0, 0, Math.PI * 2);
          } else {
            ctx.arc(0, yBase + 1.5 * scale, baseW * 0.5, 0, Math.PI * 2);
          }
          ctx.fill();

          // 2. Base Quadrada/Chanfrada de apoio (Base plate)
          ctx.fillStyle = coneColor;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-baseW / 2, yBase - baseH, baseW, baseH, 2.5 * scale);
          } else {
            ctx.rect(-baseW / 2, yBase - baseH, baseW, baseH);
          }
          ctx.fill();

          // Sombra 3D na borda inferior da base
          const baseShade = ctx.createLinearGradient(0, yBase - baseH, 0, yBase);
          baseShade.addColorStop(0, "rgba(255, 255, 255, 0.2)");
          baseShade.addColorStop(0.5, "rgba(0, 0, 0, 0)");
          baseShade.addColorStop(1, "rgba(0, 0, 0, 0.35)");
          ctx.fillStyle = baseShade;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-baseW / 2, yBase - baseH, baseW, baseH, 2.5 * scale);
          } else {
            ctx.rect(-baseW / 2, yBase - baseH, baseW, baseH);
          }
          ctx.fill();

          ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
          ctx.lineWidth = 1;
          if (ctx.roundRect) {
            ctx.roundRect(-baseW / 2, yBase - baseH, baseW, baseH, 2.5 * scale);
            ctx.stroke();
          } else {
            ctx.strokeRect(-baseW / 2, yBase - baseH, baseW, baseH);
          }

          // 3. Corpo Cônico Triangular (Tapered Cone Body)
          const bLeft = -baseW * 0.36;
          const bRight = baseW * 0.36;
          const bY = yBase - baseH * 0.65;
          const tLeft = -topW * 0.5;
          const tRight = topW * 0.5;

          ctx.fillStyle = coneColor;
          ctx.beginPath();
          ctx.moveTo(bLeft, bY);
          ctx.lineTo(tLeft, yTop);
          // Topo com pequena curvatura
          ctx.quadraticCurveTo(0, yTop - 1.5 * scale, tRight, yTop);
          ctx.lineTo(bRight, bY);
          // Base do corpo com curvatura cilíndrica para frente
          ctx.quadraticCurveTo(0, bY + 3 * scale, bLeft, bY);
          ctx.closePath();
          ctx.fill();

          // 4. Faixa Branca Refletiva Central (Reflective Stripe)
          const fTopRatio = 0.34;
          const fBotRatio = 0.62;

          const sTopY = yTop + (bY - yTop) * fTopRatio;
          const sBotY = yTop + (bY - yTop) * fBotRatio;

          const sTopL = tLeft + (bLeft - tLeft) * fTopRatio;
          const sTopR = tRight + (bRight - tRight) * fTopRatio;
          const sBotL = tLeft + (bLeft - tLeft) * fBotRatio;
          const sBotR = tRight + (bRight - tRight) * fBotRatio;

          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.moveTo(sTopL, sTopY);
          ctx.quadraticCurveTo(0, sTopY + 1.2 * scale, sTopR, sTopY);
          ctx.lineTo(sBotR, sBotY);
          ctx.quadraticCurveTo(0, sBotY + 2 * scale, sBotL, sBotY);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // 5. Iluminação e Volume Tridimensional (3D Lighting Overlay)
          const lightGrad = ctx.createLinearGradient(-baseW / 2, 0, baseW / 2, 0);
          lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.32)");  // Brilho na esquerda
          lightGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.1)");
          lightGrad.addColorStop(0.65, "rgba(0, 0, 0, 0)");
          lightGrad.addColorStop(1, "rgba(0, 0, 0, 0.35)");       // Sombra na direita

          ctx.fillStyle = lightGrad;
          ctx.beginPath();
          ctx.moveTo(bLeft, bY);
          ctx.lineTo(tLeft, yTop);
          ctx.quadraticCurveTo(0, yTop - 1.5 * scale, tRight, yTop);
          ctx.lineTo(bRight, bY);
          ctx.quadraticCurveTo(0, bY + 3 * scale, bLeft, bY);
          ctx.closePath();
          ctx.fill();

          // 6. Contorno externo sutil do cone
          ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bLeft, bY);
          ctx.lineTo(tLeft, yTop);
          ctx.quadraticCurveTo(0, yTop - 1.5 * scale, tRight, yTop);
          ctx.lineTo(bRight, bY);
          ctx.quadraticCurveTo(0, bY + 3 * scale, bLeft, bY);
          ctx.closePath();
          ctx.stroke();

          // 7. Orifício / Abertura Superior do Cone
          ctx.fillStyle = "#451A03"; // Abertura escura no topo do cone
          ctx.beginPath();
          if (ctx.ellipse) {
            ctx.ellipse(0, yTop, topW * 0.42, 1.2 * scale, 0, 0, Math.PI * 2);
          } else {
            ctx.arc(0, yTop, topW * 0.3, 0, Math.PI * 2);
          }
          ctx.fill();

          // 8. Borda de seleção quando selecionado
          if (isSelected) {
            ctx.strokeStyle = "#FFCC00";
            ctx.lineWidth = 2;
            ctx.setLineDash([3 * scale, 3 * scale]);
            ctx.beginPath();
            if (ctx.ellipse) {
              ctx.ellipse(0, yBase - baseH / 2, baseW * 0.65, baseH * 0.85, 0, 0, Math.PI * 2);
            } else {
              ctx.arc(0, yBase - baseH / 2, baseW * 0.6, 0, Math.PI * 2);
            }
            ctx.stroke();
            ctx.setLineDash([]);
          }
          break;
        }

        case "disc": {
          const r = Math.max(7, 10 * scale);
          ctx.fillStyle = eq.color || "#FFCC00";
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = "#0B1120";
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "ladder": {
          const w = Math.max(65, 95 * scale);
          const h = Math.max(18, 26 * scale);
          const rungs = 5;
          ctx.strokeStyle = "#FDE047";
          ctx.lineWidth = Math.max(2, 3 * scale);
          ctx.beginPath();
          ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2);
          ctx.moveTo(-w / 2, h / 2); ctx.lineTo(w / 2, h / 2);
          const step = w / (rungs - 1);
          for (let i = 0; i < rungs; i++) {
            const rx = -w / 2 + i * step;
            ctx.moveTo(rx, -h / 2); ctx.lineTo(rx, h / 2);
          }
          ctx.stroke();
          break;
        }

        case "hurdle": {
          const w = Math.max(24, 34 * scale);
          const h = Math.max(8, 12 * scale);
          ctx.fillStyle = "#EF4444";
          ctx.fillRect(-w / 2, -h / 2, w, h);
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          break;
        }

        case "pole": {
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

        case "hoop": {
          const r = Math.max(14, 20 * scale);
          ctx.strokeStyle = "#EC4899";
          ctx.lineWidth = Math.max(2.5, 3.5 * scale);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case "mini_goal": {
          const w = Math.max(28, 40 * scale);
          const h = Math.max(14, 20 * scale);
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2.5;
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          ctx.fillRect(-w / 2, -h / 2, w, h);
          break;
        }
      }
      ctx.restore();
    });
  }

  renderPlayers() {
    const ctx = this.ctx;
    const scale = this.pitch.metrics.scale;
    const radius = Math.max(14, 19 * scale);
    const cfg = window.SCHOOL_CONFIG || {};

    this.players.forEach(p => {
      const pt = this.pitch.courtToCanvas(p.x, p.y);
      const isSelected = this.selectedItem && this.selectedItem.id === p.id;

      ctx.save();
      ctx.translate(pt.x, pt.y);

      let jerseyColor, numberColor;
      if (p.team === "A") {
        jerseyColor = p.isGk ? (cfg.teamAGkColor || "#10B981") : (cfg.teamAColor || "#004AAD");
        numberColor = "#FFFFFF";
      } else {
        jerseyColor = p.isGk ? (cfg.teamBGkColor || "#F59E0B") : (cfg.teamBColor || "#DC2626");
        numberColor = "#FFFFFF";
      }

      if (isSelected) {
        ctx.shadowColor = "#FFCC00";
        ctx.shadowBlur = 16;
      } else {
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
      }

      // 1. Indicador Direcional (Olhar/Corpo)
      const angle = p.angle || 0;
      const coneLength = radius * 1.55;

      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = isSelected ? "#FFCC00" : "rgba(255, 255, 255, 0.65)";
      ctx.beginPath();
      ctx.moveTo(radius * 0.7, -radius * 0.4);
      ctx.lineTo(coneLength, 0);
      ctx.lineTo(radius * 0.7, radius * 0.4);
      ctx.closePath();
      ctx.fill();

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

      // 2. Pino do Atleta
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = jerseyColor;
      ctx.fill();

      ctx.strokeStyle = isSelected ? "#FFCC00" : (p.isGk ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)");
      ctx.lineWidth = isSelected ? Math.max(2.5, 3.5 * scale) : Math.max(1.5, 2.2 * scale);
      ctx.stroke();

      // 3. Número da Camisa
      ctx.shadowColor = "transparent";
      ctx.fillStyle = numberColor;
      ctx.font = `bold ${Math.max(11, Math.floor(13 * scale))}px 'Outfit', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.number, 0, 0.5);

      // 4. Nome do Atleta
      if (p.name) {
        const nameY = radius + Math.max(10, 13 * scale);
        ctx.font = `600 ${Math.max(9, Math.floor(11 * scale))}px 'Inter', sans-serif`;
        const nameMetrics = ctx.measureText(p.name);
        const padX = 5 * scale;
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

  renderBalls() {
    const ctx = this.ctx;
    const scale = this.pitch.metrics.scale;
    const radius = Math.max(8, 11 * scale);

    this.balls.forEach(b => {
      const pt = this.pitch.courtToCanvas(b.x, b.y);
      const isSelected = this.selectedItem && this.selectedItem.id === b.id;

      ctx.save();
      ctx.translate(pt.x, pt.y);

      if (isSelected) {
        ctx.shadowColor = "#FFCC00";
        ctx.shadowBlur = 12;
      } else {
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
      }

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1E293B";
      ctx.lineWidth = Math.max(1.2, 1.8 * scale);
      ctx.stroke();

      // Pentágono da bola de futsal em azul
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

      ctx.restore();
    });
  }
}

window.PlayerEntityManager = PlayerEntityManager;
