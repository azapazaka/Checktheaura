class AudioSystem {
  private ctx: AudioContext | null = null;
  private enabled = true;

  constructor() {
    this.enabled = typeof window !== 'undefined' && window.localStorage.getItem('checktheaura-sfx') !== 'off';
  }

  private getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public toggle() {
    this.enabled = !this.enabled;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('checktheaura-sfx', this.enabled ? 'on' : 'off');
    }
    return this.enabled;
  }

  public isEnabled() {
    return this.enabled;
  }

  private playTone(frequency: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio errors
    }
  }

  playSelect() {
    this.playTone(600, 'sine', 0.1, 0.05);
  }

  playMove() {
    this.playTone(400, 'sine', 0.15, 0.05);
  }

  playCapture() {
    this.playTone(150, 'sawtooth', 0.2, 0.1);
  }

  playPromote() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Ignore audio errors
    }
  }
}

export const audioSystem = new AudioSystem();
