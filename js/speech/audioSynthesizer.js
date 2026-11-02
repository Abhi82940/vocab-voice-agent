/**
 * Audio Synthesizer using Web Audio API
 * Generates smooth, pleasant procedural UI chimes without requiring external audio files.
 */
class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type = "sine", gainVal = 0.15, delay = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const startTime = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Pleasant ascending chime when user answers correctly
  playSuccess() {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this.playTone(freq, 0.28, "sine", 0.12, idx * 0.08);
    });
  }

  // Sparkly sound when a target vocabulary word is detected in user's speech
  playWordFound() {
    this.init();
    const notes = [659.25, 880, 1174.66]; // E5, A5, D6
    notes.forEach((freq, idx) => {
      this.playTone(freq, 0.22, "triangle", 0.15, idx * 0.07);
    });
  }

  // Gentle tone when mic starts listening
  playMicStart() {
    this.init();
    this.playTone(440, 0.08, "sine", 0.08, 0);
    this.playTone(660, 0.12, "sine", 0.1, 0.06);
  }

  // Tone when mic turns off
  playMicStop() {
    this.init();
    this.playTone(550, 0.08, "sine", 0.08, 0);
    this.playTone(370, 0.12, "sine", 0.08, 0.06);
  }

  // Gentle marimba hint tone
  playHintTone() {
    this.init();
    this.playTone(440, 0.18, "triangle", 0.12, 0);
    this.playTone(554.37, 0.25, "triangle", 0.12, 0.09);
  }

  // Soft low buzz for incorrect or misunderstood phrase
  playErrorTone() {
    this.init();
    this.playTone(330, 0.18, "sine", 0.1, 0);
    this.playTone(293.66, 0.24, "sine", 0.1, 0.12);
  }

  // Celebration fanfare for streak milestones
  playStreak() {
    this.init();
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq) => {
      this.playTone(freq, 0.5, "sine", 0.08, 0.05);
    });
    this.playTone(1318.51, 0.6, "triangle", 0.12, 0.25); // E6
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export const soundFx = new AudioSynthesizer();
