import { AuscultationType, BotanicalMotif, ElementKey } from '../types/tcm';

export type VoiceArchetype = 'elder' | 'lady' | 'youth' | 'merchant';

class ApothecaryAudio {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private ambientActive = false;
  private sfxVolume = 0.8;
  private musicVolume = 0.65;
  private activeRoom: 0 | 1 | 2 | 3 = 0;

  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private chimeTimer: number | null = null;
  private crackleTimer: number | null = null;

  // Dual-deck real traditional BGM tracks with smooth room crossfade
  private tranquilAudio: HTMLAudioElement | null = null;
  private hearthAudio: HTMLAudioElement | null = null;
  private bgmMix = 0; // 0 = tranquil-pavilion, 1 = warm-hearth
  private crossfadeTimer: number | null = null;

  /** The hearth track is only fetched once the player first reaches the stove room (room 2). */
  private ensureBgmDecks(withHearth: boolean): void {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    if (!this.tranquilAudio) {
      const a = new Audio('./audio/tranquil-pavilion.m4a');
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0;
      this.tranquilAudio = a;
    }
    if (withHearth && !this.hearthAudio) {
      const b = new Audio('./audio/warm-hearth.m4a');
      b.loop = true;
      b.preload = 'auto';
      b.volume = 0;
      this.hearthAudio = b;
    }
  }

  private syncBgmVolumes(): void {
    const master = this.ambientActive ? Math.max(0, Math.min(1, this.musicVolume)) * 0.42 : 0;
    if (this.tranquilAudio) {
      this.tranquilAudio.volume = Math.max(0, Math.min(1, master * (1 - this.bgmMix)));
    }
    if (this.hearthAudio) {
      this.hearthAudio.volume = Math.max(0, Math.min(1, master * this.bgmMix));
    }
  }

  private startBgmCrossfade(targetMix: 0 | 1): void {
    if (typeof window === 'undefined') return;
    if (this.crossfadeTimer !== null) {
      window.clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
    this.crossfadeTimer = window.setInterval(() => {
      const diff = targetMix - this.bgmMix;
      if (Math.abs(diff) < 0.04) {
        this.bgmMix = targetMix;
        this.syncBgmVolumes();
        if (this.crossfadeTimer !== null) {
          window.clearInterval(this.crossfadeTimer);
          this.crossfadeTimer = null;
        }
        return;
      }
      this.bgmMix += Math.sign(diff) * 0.05;
      this.syncBgmVolumes();
    }, 55);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolumes(sfxVol: number, musicVol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, sfxVol));
    this.musicVolume = Math.max(0, Math.min(1, musicVol));
    this.applyRoomAcousticProfile();
    this.syncBgmVolumes();
  }

  setActiveRoom(room: 0 | 1 | 2 | 3): void {
    this.activeRoom = room;
    this.applyRoomAcousticProfile();
    if (this.ambientActive) {
      if (room === 2 && !this.hearthAudio) {
        try {
          this.ensureBgmDecks(true);
          // re-read: TS still narrows the field to null from the guard above
          const hearth = this.hearthAudio as HTMLAudioElement | null;
          void hearth?.play().catch(() => {});
        } catch {
          // Safe fallback in headless/test browsers
        }
      }
      this.startBgmCrossfade(room === 2 ? 1 : 0);
    }
  }

  setElementMood(_element: ElementKey): void {
    // Reserved for future per-element acoustic flourishes
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

  setAmbientEnabled(on: boolean): void {
    this.ambientActive = on;
    if (!on) {
      this.stopAmbient();
      return;
    }
    try {
      this.ensureBgmDecks(this.activeRoom === 2);
      this.bgmMix = this.activeRoom === 2 ? 1 : 0;
      this.syncBgmVolumes();
      void this.tranquilAudio?.play().catch(() => {});
      void this.hearthAudio?.play().catch(() => {});
    } catch {
      // Safe fallback in headless/test browsers
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
          } else if (this.activeRoom === 3 && Math.random() < 0.5) {
            // Hậu Viên: a garden bird's two-note chirp
            for (let i = 0; i < 2; i++) {
              const t = now + i * 0.13;
              const osc = c.createOscillator();
              const g = c.createGain();
              osc.type = 'sine';
              const base = 2300 + Math.random() * 700;
              osc.frequency.setValueAtTime(base, t);
              osc.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.07);
              g.gain.setValueAtTime(0.0001, t);
              g.gain.exponentialRampToValueAtTime(0.012 * this.musicVolume, t + 0.015);
              g.gain.exponentialRampToValueAtTime(0.0003, t + 0.09);
              osc.connect(g);
              g.connect(c.destination);
              osc.start(t);
              osc.stop(t + 0.1);
            }
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
      if (this.crossfadeTimer !== null && typeof window !== 'undefined') {
        window.clearInterval(this.crossfadeTimer);
        this.crossfadeTimer = null;
      }
      if (!this.ambientActive) {
        this.tranquilAudio?.pause();
        this.hearthAudio?.pause();
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

  /**
   * A felt heartbeat under the fingertips: a low "thình" then a softer "thịch".
   * style shapes it: slippery (Hoạt) rolls round, tight/wiry (Khẩn/Huyền) snaps, thready (Tế) is faint and short.
   */
  playHeartbeat(strength = 0.7, style: 'smooth' | 'wiry' | 'tight' | 'slippery' | 'thready' | 'rapid-surging' = 'smooth'): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const s = Math.max(0.2, Math.min(1.15, strength)) * (style === 'thready' ? 0.55 : 1);
      const sharp = style === 'tight' || style === 'wiry';
      const thump = (at: number, level: number, from: number, to: number, len: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(from, now + at);
        osc.frequency.exponentialRampToValueAtTime(to, now + at + len * 0.8);
        gain.gain.setValueAtTime(0.0001, now + at);
        gain.gain.exponentialRampToValueAtTime(this.sfxLevel(level * s), now + at + (sharp ? 0.006 : 0.018));
        gain.gain.exponentialRampToValueAtTime(0.0001, now + at + len);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + at);
        osc.stop(now + at + len + 0.02);
      };
      const len = style === 'thready' ? 0.08 : style === 'slippery' ? 0.16 : 0.12;
      thump(0, 0.13, sharp ? 92 : 68, 36, len);
      thump(style === 'rapid-surging' ? 0.1 : 0.14, 0.075, sharp ? 84 : 60, 34, len * 0.85);
    } catch {
      // Safe no-op
    }
  }

  /** Clay lid knocking on a kettle at a rolling boil: two or three dull clacks a few ms apart. */
  playLidRattle(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [0, 0.07, 0.15].forEach((t, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(420 - i * 40, now + t);
        osc.frequency.exponentialRampToValueAtTime(180, now + t + 0.03);
        gain.gain.setValueAtTime(this.sfxLevel(0.03 - i * 0.006), now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.045);
      });
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

  /** Each kind of material lands with its own sound: leaves rustle, roots knock, seeds tick, flowers whisper. */
  playHerbDrop(motif?: BotanicalMotif): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const detune = 0.92 + Math.random() * 0.16; // avoid machine-gun repetition
    try {
      const now = ctx.currentTime;
      if (motif) {
        const kind = motif.startsWith('leaf') || motif === 'vine-tendril'
          ? 'rustle'
          : motif === 'root-tuber' || motif === 'rhizome' || motif === 'bark-quill'
          ? 'knock'
          : motif === 'seed-core' || motif === 'berry-cluster'
          ? 'tick'
          : 'whisper';
        if (kind === 'knock') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(210 * detune, now);
          osc.frequency.exponentialRampToValueAtTime(120 * detune, now + 0.08);
          gain.gain.setValueAtTime(this.sfxLevel(0.09), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          return;
        }
        if (kind === 'tick') {
          for (let i = 0; i < 3; i++) {
            const t = now + i * (0.035 + Math.random() * 0.02);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime((1800 + Math.random() * 600) * detune, t);
            gain.gain.setValueAtTime(this.sfxLevel(0.018), t);
            gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.018);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.02);
          }
          return;
        }
        // rustle / whisper: filtered noise burst
        const dur = kind === 'rustle' ? 0.16 : 0.1;
        const len = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime((kind === 'rustle' ? 2400 : 4200) * detune, now);
        filter.Q.setValueAtTime(kind === 'rustle' ? 0.9 : 1.6, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.sfxLevel(kind === 'rustle' ? 0.12 : 0.07), now);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(now);
        return;
      }
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

  playNeedleInsert(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1420, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
      gain.gain.setValueAtTime(this.sfxLevel(0.042), now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // Safe no-op
    }
  }

  playCuppingSuction(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(165, now);
      osc.frequency.exponentialRampToValueAtTime(64, now + 0.16);
      gain.gain.setValueAtTime(this.sfxLevel(0.065), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Safe no-op
    }
  }

  playHerbSnip(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.08);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(2.6, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.sfxLevel(0.065), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);

      const cling = ctx.createOscillator();
      const cGain = ctx.createGain();
      cling.type = 'triangle';
      cling.frequency.setValueAtTime(1880, now);
      cling.frequency.exponentialRampToValueAtTime(1240, now + 0.07);
      cGain.gain.setValueAtTime(this.sfxLevel(0.032), now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      cling.connect(cGain);
      cGain.connect(ctx.destination);
      cling.start(now);
      cling.stop(now + 0.09);
    } catch {
      // Safe no-op
    }
  }

  playVoiceBlip(archetype: VoiceArchetype = 'merchant'): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const baseFreq =
        archetype === 'elder'
          ? 215
          : archetype === 'lady'
          ? 395
          : archetype === 'youth'
          ? 470
          : 300;
      const jitter = (Math.random() - 0.5) * 38;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = archetype === 'elder' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq + jitter, now);
      osc.frequency.exponentialRampToValueAtTime((baseFreq + jitter) * 0.92, now + 0.045);

      gain.gain.setValueAtTime(this.sfxLevel(0.018), now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } catch {
      // Safe no-op
    }
  }

  playAchievementSeal(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Resonant bronze temple chime triad + crisp cinnabar seal stamp
      [587.33, 880.0, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.075);
        gain.gain.setValueAtTime(this.sfxLevel(0.048 - idx * 0.008), now + idx * 0.075);
        gain.gain.exponentialRampToValueAtTime(0.0004, now + 1.15 + idx * 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.075);
        osc.stop(now + 1.3 + idx * 0.12);
      });
      const thump = ctx.createOscillator();
      const tGain = ctx.createGain();
      thump.type = 'triangle';
      thump.frequency.setValueAtTime(140, now);
      thump.frequency.exponentialRampToValueAtTime(52, now + 0.12);
      tGain.gain.setValueAtTime(this.sfxLevel(0.09), now);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      thump.connect(tGain);
      tGain.connect(ctx.destination);
      thump.start(now);
      thump.stop(now + 0.15);
    } catch {
      // Safe no-op
    }
  }
}

export const apothecaryAudio = new ApothecaryAudio();
