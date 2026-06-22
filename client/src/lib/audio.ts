// ---------------------------------------------------------------------------
// Procedural horror ambience + gunshot SFX via the Web Audio API — no assets.
// A low detuned drone, a slow heartbeat, eerie stabs, and weapon-specific shots.
// Must be started from a user gesture (browser autoplay policy).
// ---------------------------------------------------------------------------
import type { WeaponType } from '../types';

interface WeaponProfile {
  crackHz: number;
  crackGain: number;
  boomHz: number;
  boomGain: number;
  boomDecay: number;
  tailDur: number;
  tailHz: number;
  tailGain: number;
}

// Distinct character per weapon so the shot changes when you switch weapons.
const WEAPON_PROFILES: Record<WeaponType, WeaponProfile> = {
  pistol: { crackHz: 1800, crackGain: 0.7, boomHz: 200, boomGain: 0.6, boomDecay: 0.11, tailDur: 0.22, tailHz: 2600, tailGain: 0.35 },
  shotgun: { crackHz: 1100, crackGain: 0.8, boomHz: 130, boomGain: 0.9, boomDecay: 0.18, tailDur: 0.42, tailHz: 1800, tailGain: 0.5 },
  rifle: { crackHz: 2800, crackGain: 0.85, boomHz: 240, boomGain: 0.5, boomDecay: 0.08, tailDur: 0.3, tailHz: 3400, tailGain: 0.3 },
  smg: { crackHz: 2200, crackGain: 0.5, boomHz: 280, boomGain: 0.4, boomDecay: 0.05, tailDur: 0.12, tailHz: 3000, tailGain: 0.2 },
};

export interface AudioConfig {
  music: boolean;
  musicVolume: number;
  sfx: boolean;
  sfxVolume: number;
}

class HorrorAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null; // music bus
  private sfxBus: GainNode | null = null; // sound-effects bus
  private drone: OscillatorNode[] = [];
  private heartTimer: number | null = null;
  private stabTimer: number | null = null;
  private enabled = true; // music enabled
  private started = false;
  private volume = 0.65; // music volume 0..1
  private paused = false;
  private sfxEnabled = true;
  private sfxVolume = 0.6; // 0..1
  private muted = false; // master mute (music + sfx)

  get isStarted() {
    return this.started;
  }

  private running() {
    return this.ctx != null && this.ctx.state === 'running' && this.enabled && !this.paused;
  }

  /** Build the audio graph (music + sfx). Safe to call repeatedly. */
  start(cfg: AudioConfig) {
    this.enabled = cfg.music;
    this.volume = clamp01(cfg.musicVolume);
    this.sfxEnabled = cfg.sfx;
    this.sfxVolume = clamp01(cfg.sfxVolume);
    if (typeof window === 'undefined') return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;

    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxEnabled ? this.sfxVolume * 0.3 : 0;
      this.sfxBus.connect(this.ctx.destination);
      this.buildDrone();
      this.scheduleHeartbeat();
      this.scheduleStabs();
      this.started = true;
    }
    this.paused = false;
    void this.ctx.resume();
    this.applySfxVolume();
    this.fadeIn();
  }

  /** Clean fade from silence to the current target — never spikes to full. */
  private fadeIn() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const target = this.enabled && !this.muted ? this.volume * 0.22 : 0;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(0.0001, now);
    this.master.gain.linearRampToValueAtTime(target, now + 1.1);
  }

  private buildDrone() {
    if (!this.ctx || !this.master) return;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.connect(this.master);

    // Two detuned low oscillators for an uneasy beating drone.
    for (const freq of [55, 58.3]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.value = 0.1;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.drone.push(osc);

      // Slow "breathing" LFO on the filter cutoff.
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07 + Math.random() * 0.05;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 120;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.drone.push(lfo);
    }
  }

  private scheduleHeartbeat() {
    const beat = () => {
      this.thump(0.0);
      this.thump(0.18); // double-thud
      this.heartTimer = window.setTimeout(beat, 1500 + Math.random() * 400);
    };
    this.heartTimer = window.setTimeout(beat, 1200);
  }

  private thump(delay: number) {
    if (!this.ctx || !this.master || !this.running()) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  private scheduleStabs() {
    const stab = () => {
      this.eerie();
      this.stabTimer = window.setTimeout(stab, 6000 + Math.random() * 9000);
    };
    this.stabTimer = window.setTimeout(stab, 5000);
  }

  private eerie() {
    if (!this.ctx || !this.master || !this.running()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    const base = 600 + Math.random() * 700;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.linearRampToValueAtTime(base * 0.6, t + 1.6);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    const pan = this.ctx.createStereoPanner?.();
    osc.connect(g);
    if (pan) {
      pan.pan.value = Math.random() * 2 - 1;
      g.connect(pan);
      pan.connect(this.master);
    } else {
      g.connect(this.master);
    }
    osc.start(t);
    osc.stop(t + 2);
  }

  /** Master mute toggles BOTH music and gunshots at once. */
  setMuted(on: boolean) {
    this.muted = on;
    this.applyVolume();
    this.applySfxVolume();
  }

  private applyVolume() {
    if (!this.ctx || !this.master) return;
    // Map the 0..1 user volume to a sane gain ceiling.
    const target = this.enabled && !this.paused && !this.muted ? this.volume * 0.22 : 0;
    const now = this.ctx.currentTime;
    const current = this.master.gain.value;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(current, now); // anchor so the ramp starts here
    this.master.gain.linearRampToValueAtTime(target, now + 0.4);
  }

  /** Set music level (0..1) without toggling on/off. */
  setVolume(v: number) {
    this.volume = clamp01(v);
    this.applyVolume();
  }

  private applySfxVolume() {
    if (!this.sfxBus) return;
    this.sfxBus.gain.value = this.sfxEnabled && !this.muted ? this.sfxVolume * 0.3 : 0;
  }

  setSfxEnabled(on: boolean) {
    this.sfxEnabled = on;
    this.applySfxVolume();
  }

  setSfxVolume(v: number) {
    this.sfxVolume = clamp01(v);
    this.applySfxVolume();
  }

  /** A short procedural gunshot — fired when the player completes a word. */
  gunshot(weapon: WeaponType = 'pistol') {
    if (!this.ctx || !this.sfxBus || !this.sfxEnabled || this.muted || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const bus = this.sfxBus;
    const p = WEAPON_PROFILES[weapon];

    const makeNoise = (dur: number, shape: number) => {
      const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, shape);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      return src;
    };

    // 1) Sharp crack transient — the supersonic "snap".
    const crack = makeNoise(0.05, 0.5);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = p.crackHz;
    const crackG = ctx.createGain();
    crackG.gain.setValueAtTime(p.crackGain, t);
    crackG.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    crack.connect(hp);
    hp.connect(crackG);
    crackG.connect(bus);
    crack.start(t);
    crack.stop(t + 0.05);

    // 2) Body boom — punchy pitch-down thump.
    const boom = ctx.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(p.boomHz, t);
    boom.frequency.exponentialRampToValueAtTime(p.boomHz * 0.2, t + p.boomDecay);
    const boomG = ctx.createGain();
    boomG.gain.setValueAtTime(0.0001, t);
    boomG.gain.exponentialRampToValueAtTime(p.boomGain, t + 0.008);
    boomG.gain.exponentialRampToValueAtTime(0.001, t + p.boomDecay + 0.04);
    boom.connect(boomG);
    boomG.connect(bus);
    boom.start(t);
    boom.stop(t + p.boomDecay + 0.06);

    // 3) Report tail — the rolling "echo" as the bang decays.
    const tail = makeNoise(p.tailDur, 1.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(p.tailHz, t);
    lp.frequency.exponentialRampToValueAtTime(280, t + p.tailDur * 0.95);
    const tailG = ctx.createGain();
    tailG.gain.setValueAtTime(p.tailGain, t + 0.01);
    tailG.gain.exponentialRampToValueAtTime(0.001, t + p.tailDur);
    tail.connect(lp);
    lp.connect(tailG);
    tailG.connect(bus);
    tail.start(t);
    tail.stop(t + p.tailDur);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on && !this.started) {
      this.start({ music: true, musicVolume: this.volume, sfx: this.sfxEnabled, sfxVolume: this.sfxVolume });
      return;
    }
    this.applyVolume();
  }

  /** Actually pause the ambience (used while the game is paused). */
  pause() {
    if (!this.ctx) return;
    this.paused = true;
    this.applyVolume();
    // Suspend shortly after the fade so nothing keeps sounding.
    window.setTimeout(() => {
      if (this.paused && this.ctx) void this.ctx.suspend();
    }, 420);
  }

  resume() {
    if (!this.ctx) return;
    this.paused = false;
    void this.ctx.resume();
    this.applyVolume();
  }

  /** Fully stop and tear down (used when leaving the game). */
  stop() {
    if (this.heartTimer) window.clearTimeout(this.heartTimer);
    if (this.stabTimer) window.clearTimeout(this.stabTimer);
    this.heartTimer = null;
    this.stabTimer = null;
    for (const o of this.drone) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    }
    this.drone = [];
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.master = null;
      this.sfxBus = null;
    }
    this.started = false;
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export const audio = new HorrorAudio();
