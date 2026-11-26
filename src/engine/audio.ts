class ApothecaryAudio {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private ambientActive = false;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private chimeTimer: number | null = null;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAmbient();
    }
  }

  private getContext(ignoreEnabled = false): AudioContext | null {
    if ((!ignoreEnabled && !this.enabled) || typeof window === 'undefined') return null;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    try {
      if (!this.ctx) {
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  setAmbientEnabled(on: boolean): void {
    this.ambientActive = on;
    if (!on) {
      this.stopAmbient();
      return;
    }
    const ctx = this.getContext(true);
    if (!ctx) return;

    try {
      this.stopAmbientNodesOnly();

      // Gentle rain-on-bamboo-eaves filtered noise loop
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.04 * white) / 1.04;
        lastOut = output[i];
      }

      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(620, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.028, ctx.currentTime);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();

      this.ambientSource = src;
      this.ambientGain = gain;

      // Subtle pentatonic plucked zither / temple chime every few seconds
      const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
      this.chimeTimer = window.setInterval(() => {
        if (!this.ambientActive) return;
        const c = this.getContext(true);
        if (!c) return;
        try {
          const now = c.currentTime;
          const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          g.gain.setValueAtTime(0.001, now);
          g.gain.exponentialRampToValueAtTime(0.016, now + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0005, now + 1.4);
          osc.connect(g);
          g.connect(c.destination);
          osc.start(now);
          osc.stop(now + 1.45);
        } catch {
          // Safe no-op
        }
      }, 4200);
    } catch {
      // Safe no-op
    }
  }

  private stopAmbientNodesOnly(): void {
    try {
      if (this.ambientSource) {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
        this.ambientSource = null;
      }
      if (this.ambientGain) {
        this.ambientGain.disconnect();
        this.ambientGain = null;
      }
      if (this.chimeTimer !== null && typeof window !== 'undefined') {
        window.clearInterval(this.chimeTimer);
        this.chimeTimer = null;
      }
    } catch {
      // Safe no-op
    }
  }

  private stopAmbient(): void {
    this.ambientActive = false;
    this.stopAmbientNodesOnly();
  }

  playStoveSimmer(intense: boolean): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = intense ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(intense ? 185 : 130, now);
      osc.frequency.exponentialRampToValueAtTime(intense ? 260 : 155, now + 0.16);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Safe no-op
    }
  }

  playPulseBeat(strength = 0.7): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(72, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);
      gain.gain.setValueAtTime(0.06 * Math.max(0.2, Math.min(1, strength)), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Safe no-op
    }
  }

  playHerbDrop(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.07);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Safe no-op
    }
  }

  playDrawerSlide(opening = true): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Short filtered wood grain slide noise
      const len = Math.floor(ctx.sampleRate * 0.09);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(opening ? 380 : 290, now);
      filter.Q.setValueAtTime(2.0, now);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.045, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(now);

      // Low wood body thud resonance
      const osc = ctx.createOscillator();
      const oGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(opening ? 140 : 115, now);
      osc.frequency.exponentialRampToValueAtTime(opening ? 92 : 78, now + 0.085);
      oGain.gain.setValueAtTime(0.042, now);
      oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(oGain);
      oGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
    } catch {
      // Safe no-op
    }
  }

  playSealStamp(passed = true): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = passed ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(passed ? 528 : 190, now);
      osc.frequency.exponentialRampToValueAtTime(passed ? 660 : 120, now + 0.25);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Safe no-op
    }
  }

  playPageTurn(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(310, now + 0.05);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Safe no-op
    }
  }
}

export const apothecaryAudio = new ApothecaryAudio();
