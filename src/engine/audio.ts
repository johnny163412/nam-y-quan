import { AuscultationType, ElementKey } from '../types/tcm';

const PENTATONIC_BY_ELEMENT: Record<ElementKey, number[]> = {
  moc: [293.66, 329.63, 392.0, 440.0, 523.25, 587.33],
  hoa: [329.63, 392.0, 440.0, 523.25, 659.25],
  tho: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25],
  kim: [246.94, 293.66, 349.23, 392.0, 493.88],
  thuy: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0]
};

class ApothecaryAudio {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private ambientActive = false;
  private sfxVolume = 0.8;
  private musicVolume = 0.65;
  private activeRoom: 0 | 1 | 2 | 3 = 0;
  private elementMood: ElementKey = 'tho';

  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private chimeTimer: number | null = null;
  private crackleTimer: number | null = null;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolumes(sfxVol: number, musicVol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, sfxVol));
    this.musicVolume = Math.max(0, Math.min(1, musicVol));
    this.applyRoomAcousticProfile();
  }

  setActiveRoom(room: 0 | 1 | 2 | 3): void {
    this.activeRoom = room;
    this.applyRoomAcousticProfile();
  }

  setElementMood(element: ElementKey): void {
    this.elementMood = element;
  }

  private applyRoomAcousticProfile(): void {
    const ctx = this.ctx;
    if (!ctx || !this.ambientFilter || !this.ambientGain || !this.ambientActive) return;
    try {
      const now = ctx.currentTime;
      const targetFreq =
        this.activeRoom === 0
          ? 640
          : this.activeRoom === 1
          ? 360
          : this.activeRoom === 2
          ? 280
          : 520;
      const baseGain =
        this.activeRoom === 0
          ? 0.036
          : this.activeRoom === 1
          ? 0.018
          : this.activeRoom === 2
          ? 0.026
          : 0.024;
      this.ambientFilter.frequency.setTargetAtTime(targetFreq, now, 0.25);
      this.ambientGain.gain.setTargetAtTime(baseGain * this.musicVolume, now, 0.25);
    } catch {
      // Safe no-op
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

  private playTraditionalPluck(c: AudioContext, freq: number, useDanBauBend: boolean): void {
    const now = c.currentTime;
    const master = c.createGain();
    master.gain.setValueAtTime(0.0005, now);
    master.gain.exponentialRampToValueAtTime(0.022 * Math.max(0.15, this.musicVolume), now + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0004, now + (useDanBauBend ? 2.4 : 1.7));
    master.connect(c.destination);

    // Fundamental + harmonic overtone for Đàn Tranh / Đàn Bầu warmth
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);

    if (useDanBauBend) {
      // Characteristic subtle Đàn Bầu pitch glide + vibrato
      osc1.frequency.exponentialRampToValueAtTime(freq * 1.045, now + 0.35);
      osc1.frequency.exponentialRampToValueAtTime(freq * 0.995, now + 1.4);
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.setValueAtTime(4.8, now);
      lfoGain.gain.setValueAtTime(3.2, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfo.start(now);
      lfo.stop(now + 2.45);
    }

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 1.5);

    const g2 = c.createGain();
    g2.gain.setValueAtTime(0.32, now);

    osc1.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);
    filter.connect(master);

    const dur = useDanBauBend ? 2.45 : 1.75;
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur);
    osc2.stop(now + dur);
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

      // Filtered rain / timber air / ember hearth noise bed
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
      filter.frequency.setValueAtTime(
        this.activeRoom === 0 ? 640 : this.activeRoom === 1 ? 360 : this.activeRoom === 2 ? 280 : 520,
        ctx.currentTime
      );
      filter.Q.setValueAtTime(0.75, ctx.currentTime);

      const gain = ctx.createGain();
      const baseGain =
        this.activeRoom === 0 ? 0.036 : this.activeRoom === 1 ? 0.018 : this.activeRoom === 2 ? 0.026 : 0.024;
      gain.gain.setValueAtTime(baseGain * this.musicVolume, ctx.currentTime);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();

      this.ambientSource = src;
      this.ambientFilter = filter;
      this.ambientGain = gain;

      // Plucked Đàn Tranh / Đàn Bầu pentatonic phrase every few seconds
      this.chimeTimer = window.setInterval(() => {
        if (!this.ambientActive || this.musicVolume <= 0.02) return;
        const c = this.getContext(true);
        if (!c) return;
        try {
          const scale = PENTATONIC_BY_ELEMENT[this.elementMood] ?? PENTATONIC_BY_ELEMENT.tho;
          const freq = scale[Math.floor(Math.random() * scale.length)];
          const useBend = Math.random() < 0.35;
          this.playTraditionalPluck(c, freq, useBend);
        } catch {
          // Safe no-op
        }
      }, 3800);

      // Subtle bamboo wind chime (Room 2) or charcoal ember crackle (Room 3)
      this.crackleTimer = window.setInterval(() => {
        if (!this.ambientActive || this.musicVolume <= 0.02) return;
        const c = this.getContext(true);
        if (!c) return;
        try {
          const now = c.currentTime;
          if (this.activeRoom === 2) {
            const osc = c.createOscillator();
            const g = c.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160 + Math.random() * 140, now);
            g.gain.setValueAtTime(0.014 * this.musicVolume, now);
            g.gain.exponentialRampToValueAtTime(0.0004, now + 0.045);
            osc.connect(g);
            g.connect(c.destination);
            osc.start(now);
            osc.stop(now + 0.05);
          } else if (this.activeRoom === 1 && Math.random() < 0.45) {
            const osc = c.createOscillator();
            const g = c.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(760 + Math.random() * 220, now);
            g.gain.setValueAtTime(0.009 * this.musicVolume, now);
            g.gain.exponentialRampToValueAtTime(0.0004, now + 0.4);
            osc.connect(g);
            g.connect(c.destination);
            osc.start(now);
            osc.stop(now + 0.42);
          }
        } catch {
          // Safe no-op
        }
      }, 2100);
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
      if (this.ambientFilter) {
        this.ambientFilter.disconnect();
        this.ambientFilter = null;
      }
      if (this.ambientGain) {
        this.ambientGain.disconnect();
        this.ambientGain = null;
      }
      if (this.chimeTimer !== null && typeof window !== 'undefined') {
        window.clearInterval(this.chimeTimer);
        this.chimeTimer = null;
      }
      if (this.crackleTimer !== null && typeof window !== 'undefined') {
        window.clearInterval(this.crackleTimer);
        this.crackleTimer = null;
      }
    } catch {
      // Safe no-op
    }
  }

  private stopAmbient(): void {
    this.ambientActive = false;
    this.stopAmbientNodesOnly();
  }

  private sfxLevel(base: number): number {
    return base * Math.max(0.05, this.sfxVolume);
  }

  playCurtainBell(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Temple woodblock tap + bamboo wind chime harmonic
      const tap = ctx.createOscillator();
      const tGain = ctx.createGain();
      tap.type = 'triangle';
      tap.frequency.setValueAtTime(340, now);
      tap.frequency.exponentialRampToValueAtTime(160, now + 0.08);
      tGain.gain.setValueAtTime(this.sfxLevel(0.065), now);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      tap.connect(tGain);
      tGain.connect(ctx.destination);
      tap.start(now);
      tap.stop(now + 0.1);

      [880, 1174.66].forEach((freq, i) => {
        const chime = ctx.createOscillator();
        const cGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(freq, now + 0.08 + i * 0.06);
        cGain.gain.setValueAtTime(this.sfxLevel(0.03), now + 0.08 + i * 0.06);
        cGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.7 + i * 0.1);
        chime.connect(cGain);
        cGain.connect(ctx.destination);
        chime.start(now + 0.08 + i * 0.06);
        chime.stop(now + 0.75 + i * 0.1);
      });
    } catch {
      // Safe no-op
    }
  }

  playDeQiChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);
      gain.gain.setValueAtTime(this.sfxLevel(0.048), now);
      gain.gain.exponentialRampToValueAtTime(0.0006, now + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Safe no-op
    }
  }

  playBambooFan(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.22);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(480, now);
      filter.Q.setValueAtTime(1.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.sfxLevel(0.06), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // Safe no-op
    }
  }

  playWaterPour(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.34);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const mod = 0.7 + 0.3 * Math.sin((i / ctx.sampleRate) * 42);
        data[i] = (Math.random() * 2 - 1) * mod * (1 - (i / len) * 0.5);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.frequency.linearRampToValueAtTime(1650, now + 0.3);
      filter.Q.setValueAtTime(2.4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.sfxLevel(0.055), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // Safe no-op
    }
  }

  playRoomSlide(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.22);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.linearRampToValueAtTime(420, now + 0.22);
      filter.Q.setValueAtTime(1.4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.sfxLevel(0.05), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // Safe no-op
    }
  }

  playBambooTally(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.045);
      gain.gain.setValueAtTime(this.sfxLevel(0.055), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    } catch {
      // Safe no-op
    }
  }

  playMortarGrind(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Two rhythmic brass pestle thuds + crunch
      [0, 0.14].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240 - offset * 80, now + offset);
        osc.frequency.exponentialRampToValueAtTime(98, now + offset + 0.11);
        gain.gain.setValueAtTime(this.sfxLevel(0.065), now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.13);
      });
    } catch {
      // Safe no-op
    }
  }

  playWokSizzle(honey = false): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const dur = honey ? 0.36 : 0.28;
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 0.6);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(honey ? 1300 : 1900, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.sfxLevel(0.055), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // Safe no-op
    }
  }

  playPaperFold(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.18);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const env = i < len * 0.4 ? i / (len * 0.4) : 1 - (i - len * 0.4) / (len * 0.6);
        data[i] = (Math.random() * 2 - 1) * env;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1450, now);
      filter.Q.setValueAtTime(1.1, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.sfxLevel(0.055), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // Safe no-op
    }
  }

  playMoxaWarmth(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(293.66, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
      gain.gain.setValueAtTime(this.sfxLevel(0.045), now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // Safe no-op
    }
  }

  playAuscultation(kind: AuscultationType = 'cold-sniffle'): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.85);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);

      for (let i = 0; i < len; i++) {
        const t = i / ctx.sampleRate;
        let env = Math.sin(Math.min(1, t / 0.85) * Math.PI);
        if (kind === 'weak-breath') {
          env *= t < 0.45 ? 0.55 : 0.2;
        } else if (kind === 'cold-sniffle' && t > 0.45 && t < 0.62) {
          env *= 1.4;
        }
        data[i] = (Math.random() * 2 - 1) * env;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      if (kind === 'wheeze-heat') {
        filter.frequency.setValueAtTime(920, now);
        filter.Q.setValueAtTime(4.2, now);
      } else if (kind === 'sigh-stagnation') {
        filter.frequency.setValueAtTime(520, now);
        filter.frequency.linearRampToValueAtTime(260, now + 0.8);
        filter.Q.setValueAtTime(1.5, now);
      } else if (kind === 'normal-gurgle') {
        filter.frequency.setValueAtTime(260, now);
        filter.Q.setValueAtTime(3.2, now);
      } else if (kind === 'weak-breath') {
        filter.frequency.setValueAtTime(360, now);
        filter.Q.setValueAtTime(1.0, now);
      } else {
        filter.frequency.setValueAtTime(680, now);
        filter.Q.setValueAtTime(1.8, now);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.sfxLevel(0.08), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // Safe no-op
    }
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
      gain.gain.setValueAtTime(this.sfxLevel(0.045), now);
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
      gain.gain.setValueAtTime(this.sfxLevel(0.065 * Math.max(0.2, Math.min(1, strength))), now);
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
      gain.gain.setValueAtTime(this.sfxLevel(0.055), now);
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
      nGain.gain.setValueAtTime(this.sfxLevel(0.05), now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(now);

      const osc = ctx.createOscillator();
      const oGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(opening ? 140 : 115, now);
      osc.frequency.exponentialRampToValueAtTime(opening ? 92 : 78, now + 0.085);
      oGain.gain.setValueAtTime(this.sfxLevel(0.045), now);
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
      gain.gain.setValueAtTime(this.sfxLevel(0.075), now);
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
      gain.gain.setValueAtTime(this.sfxLevel(0.032), now);
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
