/**
 * Interactive Canvas Voice Orb Visualizer
 * Renders an ethereal, pulsing 3D-like glowing orb with real-time audio wave animation.
 */
export class VoiceOrb {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.state = "idle"; // 'idle' | 'listening' | 'speaking' | 'thinking'
    this.phase = 0;
    this.audioLevel = 0;
    this.animId = null;

    if (this.canvas) {
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.startLoop();
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
    this.width = rect.width;
    this.height = rect.height;
  }

  setState(newState) {
    this.state = newState;
  }

  setAudioLevel(level) {
    this.audioLevel = Math.max(0, Math.min(1, level));
  }

  startLoop() {
    const render = () => {
      this.draw();
      this.phase += 0.04;
      this.animId = requestAnimationFrame(render);
    };
    this.animId = requestAnimationFrame(render);
  }

  draw() {
    if (!this.ctx || !this.width || !this.height) return;
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const baseRadius = Math.min(cx, cy) * 0.42;

    ctx.clearRect(0, 0, this.width, this.height);

    // Dynamic color palettes depending on agent state
    let coreColor1, coreColor2, glowColor, ringColor;

    switch (this.state) {
      case "listening":
        // Vibrant neon emerald & cyan (active mic listening)
        coreColor1 = "rgba(16, 185, 129, 0.9)";
        coreColor2 = "rgba(6, 182, 212, 0.85)";
        glowColor = "rgba(52, 211, 153, 0.35)";
        ringColor = "rgba(16, 185, 129, 0.5)";
        break;

      case "speaking":
        // Rich electric violet & indigo & rose (Lexi voice speaking)
        coreColor1 = "rgba(147, 51, 234, 0.92)";
        coreColor2 = "rgba(236, 72, 153, 0.85)";
        glowColor = "rgba(168, 85, 247, 0.4)";
        ringColor = "rgba(244, 114, 182, 0.6)";
        break;

      case "thinking":
        // Amber / golden intelligence (computing response)
        coreColor1 = "rgba(245, 158, 11, 0.9)";
        coreColor2 = "rgba(234, 88, 12, 0.85)";
        glowColor = "rgba(251, 191, 36, 0.35)";
        ringColor = "rgba(245, 158, 11, 0.5)";
        break;

      case "idle":
      default:
        // Deep soothing sapphire & teal
        coreColor1 = "rgba(59, 130, 246, 0.8)";
        coreColor2 = "rgba(20, 184, 166, 0.75)";
        glowColor = "rgba(99, 102, 241, 0.25)";
        ringColor = "rgba(59, 130, 246, 0.3)";
        break;
    }

    // Outer ambient glowing halo
    const glowRadius = baseRadius * 1.7 + Math.sin(this.phase * 0.8) * 6;
    const radialGlow = ctx.createRadialGradient(cx, cy, baseRadius * 0.6, cx, cy, glowRadius);
    radialGlow.addColorStop(0, glowColor);
    radialGlow.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = radialGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pulse rings for listening / speaking
    if (this.state === "listening" || this.state === "speaking") {
      const pulseSpeed = this.state === "speaking" ? 2.5 : 1.5;
      for (let i = 1; i <= 3; i++) {
        const ringProgress = ((this.phase * pulseSpeed + i * 1.8) % 6) / 6;
        const ringRad = baseRadius * (1 + ringProgress * 0.9);
        const ringAlpha = (1 - ringProgress) * 0.5;

        ctx.strokeStyle = ringColor.replace(/[\d.]+\)$/, `${ringAlpha})`);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRad, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Thinking orbital ring
    if (this.state === "thinking") {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.phase * 1.5);
      ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 1.25, 0, Math.PI * 2);
      ctx.stroke();

      // Satellite particle
      const satX = Math.cos(this.phase * 2) * (baseRadius * 1.25);
      const satY = Math.sin(this.phase * 2) * (baseRadius * 1.25);
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(satX, satY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Animated Core Orb with undulating perimeter
    const points = 36;
    const waveAmp = this.state === "speaking" ? 14 : this.state === "listening" ? 8 : 4;
    const waveSpeed = this.state === "speaking" ? 2.2 : 1.0;

    ctx.save();
    ctx.beginPath();

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const waveMod = Math.sin(angle * 4 + this.phase * waveSpeed) * waveAmp;
      const r = baseRadius + waveMod;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Fluid core gradient
    const coreGrad = ctx.createLinearGradient(
      cx - baseRadius,
      cy - baseRadius,
      cx + baseRadius,
      cy + baseRadius
    );
    coreGrad.addColorStop(0, coreColor1);
    coreGrad.addColorStop(1, coreColor2);

    ctx.fillStyle = coreGrad;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.restore();

    // Center internal specular highlight for 3D sphere illusion
    const highlightGrad = ctx.createRadialGradient(
      cx - baseRadius * 0.3,
      cy - baseRadius * 0.35,
      2,
      cx - baseRadius * 0.3,
      cy - baseRadius * 0.35,
      baseRadius * 0.7
    );
    highlightGrad.addColorStop(0, "rgba(255, 255, 255, 0.75)");
    highlightGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
    highlightGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = highlightGrad;
    ctx.beginPath();
    ctx.arc(cx - baseRadius * 0.25, cy - baseRadius * 0.3, baseRadius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic wave ribbon across the center while speaking
    if (this.state === "speaking") {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const waveW = baseRadius * 1.2;
      const startX = cx - waveW / 2;
      for (let x = 0; x <= waveW; x += 3) {
        const nx = x / waveW;
        const ny = Math.sin(nx * Math.PI * 3 + this.phase * 4) * Math.sin(nx * Math.PI) * 16;
        if (x === 0) {
          ctx.moveTo(startX + x, cy + ny);
        } else {
          ctx.lineTo(startX + x, cy + ny);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
  }
}
