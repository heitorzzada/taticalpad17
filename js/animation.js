/**
 * ==============================================================================
 * 3.E. SISTEMA DE ANIMAÇÃO QUADRO A QUADRO (KEYFRAMES & TWEENING ENGINE)
 * Linha do tempo, interpolação linear suave (tweening), controles de reprodução
 * (Play/Pause/Stop/Loop/Velocidade) e rastros de movimento (Ghost Trails).
 * ==============================================================================
 */

class AnimationEngine {
  constructor(board) {
    this.board = board;
    this.pitch = board.pitch;

    // Lista de quadros-chave (Keyframes)
    // Cada quadro contém: { id, label, duration, players, balls, equipment, drawings }
    this.keyframes = [];
    this.currentFrameIndex = 0;

    // Estado da Reprodução
    this.isPlaying = false;
    this.isLooping = true;
    this.speed = 1.0; // 0.5x, 1.0x, 1.5x, 2.0x
    this.frameDuration = 1.8; // Segundos padrão por transição de quadro
    this.showMotionTrails = true; // Exibir rastros de movimento

    // Variáveis de animação do loop
    this.animProgress = 0; // Progresso entre quadro atual e próximo (0.0 a 1.0)
    this.animReqId = null;
    this.lastTimestamp = 0;

    // Inicializa com o primeiro quadro capturado
    this.initDefaultKeyframe();
  }

  /**
   * Captura o quadro inicial
   */
  initDefaultKeyframe() {
    this.keyframes = [
      this.createKeyframe("Quadro 1")
    ];
    this.currentFrameIndex = 0;
  }

  /**
   * Cria um objeto de quadro-chave com snapshot das posições
   */
  createKeyframe(label = "") {
    const frameIndex = this.keyframes.length + 1;
    return {
      id: `frame-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: label || `Quadro ${frameIndex}`,
      duration: this.frameDuration,
      players: JSON.parse(JSON.stringify(this.board.players)),
      balls: JSON.parse(JSON.stringify(this.board.balls)),
      equipment: JSON.parse(JSON.stringify(this.board.equipment)),
      drawings: JSON.parse(JSON.stringify(this.board.drawings))
    };
  }

  /**
   * Adiciona um novo quadro capturando o estado atual da prancheta
   */
  addKeyframe() {
    // Atualiza o quadro atual antes de criar um novo
    this.saveCurrentToActiveFrame();

    const newFrame = this.createKeyframe(`Quadro ${this.keyframes.length + 1}`);
    this.keyframes.push(newFrame);
    this.currentFrameIndex = this.keyframes.length - 1;

    this.onTimelineChange?.();
    this.board.render();
  }

  /**
   * Duplica o quadro atual
   */
  duplicateCurrentKeyframe() {
    this.saveCurrentToActiveFrame();
    const current = this.keyframes[this.currentFrameIndex];
    if (!current) return;

    const copy = JSON.parse(JSON.stringify(current));
    copy.id = `frame-${Date.now()}`;
    copy.label = `Quadro ${this.keyframes.length + 1} (Cópia)`;

    this.keyframes.splice(this.currentFrameIndex + 1, 0, copy);
    this.currentFrameIndex++;

    this.onTimelineChange?.();
    this.board.render();
  }

  /**
   * Remove o quadro atual
   */
  deleteCurrentKeyframe() {
    if (this.keyframes.length <= 1) {
      alert("A animação precisa de pelo menos 1 quadro!");
      return;
    }

    this.keyframes.splice(this.currentFrameIndex, 1);
    this.currentFrameIndex = Math.max(0, this.currentFrameIndex - 1);
    this.loadFrame(this.currentFrameIndex);

    this.onTimelineChange?.();
  }

  /**
   * Salva as alterações feitas na prancheta para o quadro ativo
   */
  saveCurrentToActiveFrame() {
    if (!this.keyframes[this.currentFrameIndex]) return;
    const frame = this.keyframes[this.currentFrameIndex];
    frame.players = JSON.parse(JSON.stringify(this.board.players));
    frame.balls = JSON.parse(JSON.stringify(this.board.balls));
    frame.equipment = JSON.parse(JSON.stringify(this.board.equipment));
    frame.drawings = JSON.parse(JSON.stringify(this.board.drawings));
  }

  /**
   * Carrega um quadro específico para a prancheta
   */
  loadFrame(index) {
    if (index < 0 || index >= this.keyframes.length) return;

    // Se estiver editando, salva o atual antes de trocar
    if (!this.isPlaying) {
      this.saveCurrentToActiveFrame();
    }

    this.currentFrameIndex = index;
    const frame = this.keyframes[index];

    this.board.players = JSON.parse(JSON.stringify(frame.players));
    this.board.balls = JSON.parse(JSON.stringify(frame.balls));
    this.board.equipment = JSON.parse(JSON.stringify(frame.equipment));
    this.board.drawings = JSON.parse(JSON.stringify(frame.drawings));

    this.onTimelineChange?.();
    this.board.render();
  }

  /**
   * Alterna reprodução (Play / Pause)
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.keyframes.length < 2) {
      alert("Adicione pelo menos 2 quadros para reproduzir a movimentação dos atletas!");
      return;
    }

    // Salva o quadro antes de iniciar o loop
    this.saveCurrentToActiveFrame();

    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.animReqId = requestAnimationFrame(this.playbackLoop.bind(this));
    this.onPlaybackStatusChange?.(true);
  }

  pause() {
    this.isPlaying = false;
    if (this.animReqId) {
      cancelAnimationFrame(this.animReqId);
      this.animReqId = null;
    }
    // Aplica o estado exato do quadro atual
    this.loadFrame(this.currentFrameIndex);
    this.onPlaybackStatusChange?.(false);
  }

  stop() {
    this.pause();
    this.currentFrameIndex = 0;
    this.animProgress = 0;
    this.loadFrame(0);
    this.onTimelineChange?.();
  }

  setSpeed(speedVal) {
    this.speed = parseFloat(speedVal) || 1.0;
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    return this.isLooping;
  }

  toggleTrails() {
    this.showMotionTrails = !this.showMotionTrails;
    this.board.render();
    return this.showMotionTrails;
  }

  /**
   * Loop principal de animação com delta-time preciso e interpolação linear (tweening)
   */
  playbackLoop(timestamp) {
    if (!this.isPlaying) return;

    const deltaMs = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    const totalTransitionTimeMs = (this.frameDuration / this.speed) * 1000;
    this.animProgress += deltaMs / totalTransitionTimeMs;

    if (this.animProgress >= 1.0) {
      this.animProgress = 0;
      this.currentFrameIndex++;

      // Fim da linha do tempo
      if (this.currentFrameIndex >= this.keyframes.length - 1) {
        if (this.isLooping) {
          this.currentFrameIndex = 0;
        } else {
          this.currentFrameIndex = this.keyframes.length - 1;
          this.pause();
          return;
        }
      }

      this.onTimelineChange?.();
    }

    // Aplica interpolação entre o quadro atual e o próximo
    const frameA = this.keyframes[this.currentFrameIndex];
    const nextIndex = (this.currentFrameIndex + 1) % this.keyframes.length;
    const frameB = this.keyframes[nextIndex];

    this.interpolate(frameA, frameB, this.animProgress);

    // Renderiza a prancheta
    this.board.render();

    // Desenha os rastros de movimento por cima da quadra se ativado
    if (this.showMotionTrails) {
      this.drawMotionTrails();
    }

    this.animReqId = requestAnimationFrame(this.playbackLoop.bind(this));
  }

  /**
   * Interpolação Linear (Tweening) entre dois quadros-chave
   */
  interpolate(frameA, frameB, t) {
    // Easing suave (easeInOutQuad) para movimentação atlética orgânica
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // 1. Interpolação dos Jogadores
    this.board.players = frameA.players.map(pA => {
      const pB = frameB.players.find(p => p.id === pA.id);
      if (!pB) return pA;

      return {
        ...pA,
        x: pA.x + (pB.x - pA.x) * easeT,
        y: pA.y + (pB.y - pA.y) * easeT,
        angle: this.lerpAngle(pA.angle || 0, pB.angle || 0, easeT)
      };
    });

    // 2. Interpolação das Bolas
    this.board.balls = frameA.balls.map(bA => {
      const bB = frameB.balls.find(b => b.id === bA.id);
      if (!bB) return bA;

      return {
        ...bA,
        x: bA.x + (bB.x - bA.x) * easeT,
        y: bA.y + (bB.y - bA.y) * easeT
      };
    });

    // 3. Interpolação dos Equipamentos
    this.board.equipment = frameA.equipment.map(eqA => {
      const eqB = frameB.equipment.find(e => e.id === eqA.id);
      if (!eqB) return eqA;

      return {
        ...eqA,
        x: eqA.x + (eqB.x - eqA.x) * easeT,
        y: eqA.y + (eqB.y - eqA.y) * easeT,
        angle: this.lerpAngle(eqA.angle || 0, eqB.angle || 0, easeT)
      };
    });
  }

  /**
   * Interpolação angular contínua no menor arco (-PI a PI)
   */
  lerpAngle(a, b, t) {
    let diff = (b - a) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  /**
   * Desenha rastros de movimento (Ghost Trails / Trajetórias dos Atletas e Bola)
   */
  drawMotionTrails() {
    if (this.keyframes.length < 2) return;

    const ctx = this.board.ctx;
    const scale = this.pitch.metrics.scale;

    ctx.save();

    // Trajetórias de cada jogador entre todos os quadros
    const firstFramePlayers = this.keyframes[0].players;

    firstFramePlayers.forEach(player => {
      const isTeamA = player.team === "A";
      const trailColor = isTeamA ? SCHOOL_CONFIG.secondaryColor : "#F87171";

      ctx.strokeStyle = trailColor;
      ctx.lineWidth = Math.max(1.5, 2.2 * scale);
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.globalAlpha = 0.55;

      ctx.beginPath();
      for (let i = 0; i < this.keyframes.length; i++) {
        const pInstance = this.keyframes[i].players.find(p => p.id === player.id);
        if (!pInstance) continue;

        const pt = this.pitch.courtToCanvas(pInstance.x, pInstance.y);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Pequenas bolinhas numeradas de cada parada nos quadros
      ctx.setLineDash([]);
      for (let i = 0; i < this.keyframes.length; i++) {
        const pInstance = this.keyframes[i].players.find(p => p.id === player.id);
        if (!pInstance) continue;

        const pt = this.pitch.courtToCanvas(pInstance.x, pInstance.y);
        ctx.fillStyle = trailColor;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(2.5, 3.5 * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Trajetória da bola
    if (this.keyframes[0].balls.length > 0) {
      const ballId = this.keyframes[0].balls[0].id;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = Math.max(2, 2.5 * scale);
      ctx.setLineDash([3 * scale, 3 * scale]);
      ctx.globalAlpha = 0.7;

      ctx.beginPath();
      for (let i = 0; i < this.keyframes.length; i++) {
        const bInst = this.keyframes[i].balls.find(b => b.id === ballId);
        if (!bInst) continue;

        const pt = this.pitch.courtToCanvas(bInst.x, bInst.y);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}
