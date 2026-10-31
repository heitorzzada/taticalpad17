/**
 * ==============================================================================
 * TACTICALPAD FUTSAL PRO - MÓDULO DE LINHA DO TEMPO E ANIMAÇÃO
 * TIMELINE.JS: AnimationEngine com Keyframes, Interpolação Suave (Tweening) e Rastros
 * ==============================================================================
 */

class AnimationEngine {
  constructor(board) {
    this.board = board;
    this.pitch = board.pitch;

    this.keyframes = [];
    this.currentFrameIndex = 0;

    this.isPlaying = false;
    this.isLooping = true;
    this.speed = 1.0;
    this.frameDuration = 1.8;
    this.showMotionTrails = true;

    this.animProgress = 0;
    this.animReqId = null;
    this.lastTimestamp = 0;

    this.initDefaultKeyframe();
  }

  initDefaultKeyframe() {
    this.keyframes = [
      this.createKeyframe("Quadro 1")
    ];
    this.currentFrameIndex = 0;
  }

  createKeyframe(label = "") {
    const frameIndex = this.keyframes.length + 1;
    return {
      id: `frame-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: label || `Quadro ${frameIndex}`,
      duration: this.frameDuration,
      players: JSON.parse(JSON.stringify(this.board.playersMgr.players)),
      balls: JSON.parse(JSON.stringify(this.board.playersMgr.balls)),
      equipment: JSON.parse(JSON.stringify(this.board.playersMgr.equipment)),
      drawings: JSON.parse(JSON.stringify(this.board.drawingsMgr.drawings))
    };
  }

  addKeyframe() {
    this.saveCurrentToActiveFrame();
    const newFrame = this.createKeyframe(`Quadro ${this.keyframes.length + 1}`);
    this.keyframes.push(newFrame);
    this.currentFrameIndex = this.keyframes.length - 1;

    this.onTimelineChange?.();
    this.board.render();
  }

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

  saveCurrentToActiveFrame() {
    if (!this.keyframes[this.currentFrameIndex]) return;
    const frame = this.keyframes[this.currentFrameIndex];
    frame.players = JSON.parse(JSON.stringify(this.board.playersMgr.players));
    frame.balls = JSON.parse(JSON.stringify(this.board.playersMgr.balls));
    frame.equipment = JSON.parse(JSON.stringify(this.board.playersMgr.equipment));
    frame.drawings = JSON.parse(JSON.stringify(this.board.drawingsMgr.drawings));
  }

  loadFrame(index) {
    if (index < 0 || index >= this.keyframes.length) return;
    if (!this.isPlaying) {
      this.saveCurrentToActiveFrame();
    }

    this.currentFrameIndex = index;
    const frame = this.keyframes[index];

    this.board.playersMgr.players = JSON.parse(JSON.stringify(frame.players || []));
    this.board.playersMgr.balls = JSON.parse(JSON.stringify(frame.balls || []));
    this.board.playersMgr.equipment = JSON.parse(JSON.stringify(frame.equipment || []));
    this.board.drawingsMgr.drawings = JSON.parse(JSON.stringify(frame.drawings || []));

    this.onTimelineChange?.();
    this.board.render();
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  play() {
    if (this.keyframes.length < 2) {
      alert("Adicione pelo menos 2 quadros para reproduzir a movimentação dos atletas!");
      return;
    }
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

  playbackLoop(timestamp) {
    if (!this.isPlaying) return;

    const deltaMs = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    const totalTransitionTimeMs = (this.frameDuration / this.speed) * 1000;
    this.animProgress += deltaMs / totalTransitionTimeMs;

    if (this.animProgress >= 1.0) {
      this.animProgress = 0;
      this.currentFrameIndex++;

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

    const frameA = this.keyframes[this.currentFrameIndex];
    const nextIndex = (this.currentFrameIndex + 1) % this.keyframes.length;
    const frameB = this.keyframes[nextIndex];

    this.interpolate(frameA, frameB, this.animProgress);
    this.board.render();

    if (this.showMotionTrails) {
      this.drawMotionTrails();
    }

    this.animReqId = requestAnimationFrame(this.playbackLoop.bind(this));
  }

  interpolate(frameA, frameB, t) {
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    this.board.playersMgr.players = frameA.players.map(pA => {
      const pB = frameB.players.find(p => p.id === pA.id);
      if (!pB) return pA;
      return {
        ...pA,
        x: pA.x + (pB.x - pA.x) * easeT,
        y: pA.y + (pB.y - pA.y) * easeT,
        angle: this.lerpAngle(pA.angle || 0, pB.angle || 0, easeT)
      };
    });

    this.board.playersMgr.balls = frameA.balls.map(bA => {
      const bB = frameB.balls.find(b => b.id === bA.id);
      if (!bB) return bA;
      return {
        ...bA,
        x: bA.x + (bB.x - bA.x) * easeT,
        y: bA.y + (bB.y - bA.y) * easeT
      };
    });

    this.board.playersMgr.equipment = frameA.equipment.map(eqA => {
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

  lerpAngle(a, b, t) {
    let diff = (b - a) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  drawMotionTrails() {
    if (this.keyframes.length < 2) return;
    const ctx = this.board.ctx;
    const scale = this.pitch.metrics.scale;
    const cfg = window.SCHOOL_CONFIG || {};

    ctx.save();
    const firstFramePlayers = this.keyframes[0].players;

    firstFramePlayers.forEach(player => {
      const isTeamA = player.team === "A";
      const trailColor = isTeamA ? (cfg.secondaryColor || "#FFCC00") : "#F87171";

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

window.AnimationEngine = AnimationEngine;
