// ---------------------------------------------------------------------------
// GameEngine — the framework-agnostic core. Holds mutable state and advances
// it with a delta-time update(). React only reads `state` and forwards input.
// ---------------------------------------------------------------------------
import type {
  Difficulty,
  FloatingText,
  GameEvent,
  GameMode,
  GameState,
  Settings,
  Upgrades,
  Zombie,
} from '../types';
import {
  clamp,
  distance,
  hashSeed,
  mulberry32,
  uid,
} from '../lib/utils';
import {
  getDifficultyConfig,
  isBossWave,
  waveSpawnInterval,
  waveSpeed,
  waveZombieCount,
  wordTierForWave,
} from './difficulty';
import {
  createScreamerAdd,
  createZombie,
  zombieTypeForWave,
} from './spawn';
import { generateToken } from './wordgen';
import { createBossZombie, pickBoss } from './boss';
import {
  damageMultiplier,
  initialPowerups,
  shouldArmShotgun,
  shouldDoubleDamage,
  shouldGrantShield,
  shouldSlowMotion,
  tickPowerups,
  timeScale,
} from './powerups';
import { calcAccuracy, calcWpm, isHeadshot } from './stats';
import { isPrefix, matchesTarget, type MatchOptions } from './typing';
import {
  bossDamageBonus,
  coinMultiplier,
  maxHealthBonus,
  powerupChanceBonus,
  shotgunRadius,
  slowMoDurationMs,
} from '../data/upgrades';

export interface EngineOptions {
  mode: GameMode;
  difficulty: Difficulty;
  upgrades: Upgrades;
  settings: Settings;
  width: number;
  height: number;
  seed?: number;
  /** Consumable powerup charges the player owns (grenade/freeze). */
  powerups?: Record<string, number>;
}

const DOUBLE_DAMAGE_MS = 5000;
const FREEZE_MS = 3000;
const INTER_WAVE_BREATHER = 2.4;
const QUEUE_SIZE = 5; // words shown / typeable at once
const SHOT_DAMAGE = 2; // base damage a completed word deals to the nearest zombie
const MEDKIT_HEAL = 35; // health restored by a med kit
// Zombies spawn just below the on-screen word panel, and become shootable a bit
// further down (so a fast typer can't snipe them the instant they appear).
const SPAWN_FRAC = 0.24;
const MIN_TARGET_FRAC = 0.29;
// Vertical movement is scaled to the play-field height so a zombie takes the same
// time to reach the base on any screen size. Without this, a shorter viewport
// (e.g. dev tools docked at the bottom) shrinks the distance and zombies arrive
// sooner. The difficulty speeds (px/sec) are tuned against this reference height.
const REFERENCE_HEIGHT = 600;

export class GameEngine {
  state: GameState;
  private rng: () => number;
  private wordStartMs = 0;
  private slowMoCooldown = 0;
  private recentWords: Array<{ t: number; chars: number }> = []; // rolling WPM window

  constructor(opts: EngineOptions) {
    this.rng = mulberry32(opts.seed ?? hashSeed(`${Date.now()}-${Math.random()}`));
    const cfg = getDifficultyConfig(opts.difficulty);
    const maxHealth = cfg.startHealth + maxHealthBonus(opts.upgrades);
    this.state = {
      mode: opts.mode,
      difficulty: opts.difficulty,
      status: 'playing',
      width: opts.width,
      height: opts.height,
      health: maxHealth,
      maxHealth,
      score: 0,
      coins: 0,
      xp: 0,
      wave: 0,
      waveZombiesToSpawn: 0,
      waveZombiesSpawned: 0,
      spawnCooldown: 0,
      betweenWaves: 1.2,
      streak: 0,
      bestStreak: 0,
      noMistakeStreak: 0,
      combo: 0,
      zombies: [],
      wordQueue: [],
      input: '',
      elapsedMs: 0,
      correctWords: 0,
      mistakes: 0,
      charsTyped: 0,
      accuracy: 100,
      wpm: 0,
      maxWpm: 0,
      kills: 0,
      bossesDefeated: 0,
      powerups: initialPowerups(opts.upgrades, opts.powerups),
      floatingTexts: [],
      events: [],
      shake: 0,
      flash: 0,
      weather: 'clear',
      bossActive: false,
      bossWarning: 0,
      survivorShot: null,
      missedWords: {},
      upgrades: opts.upgrades,
      settings: opts.settings,
    };
    // Fill the initial word queue.
    for (let i = 0; i < QUEUE_SIZE; i++) this.state.wordQueue.push(this.makeWord());
  }

  /** Generate one queue word for the current difficulty + a rising tier by wave. */
  private makeWord(): string {
    const cfg = getDifficultyConfig(this.state.difficulty);
    const tier = wordTierForWave(Math.max(1, this.state.wave), cfg.wordLengthBias);
    let word = generateToken(this.rng, this.state.difficulty, tier);
    // Avoid duplicates already in the queue so each of the five is distinct.
    let guard = 0;
    while (this.state.wordQueue.includes(word) && guard++ < 8) {
      word = generateToken(this.rng, this.state.difficulty, tier);
    }
    return word;
  }

  // --- Public API ---------------------------------------------------------

  resize(width: number, height: number) {
    this.state.width = width;
    this.state.height = height;
  }

  pause() {
    if (this.state.status === 'playing') this.state.status = 'paused';
  }

  resume() {
    if (this.state.status === 'paused') this.state.status = 'playing';
  }

  togglePause() {
    if (this.state.status === 'playing') this.pause();
    else if (this.state.status === 'paused') this.resume();
  }

  get matchOptions(): MatchOptions {
    // Strictness is dictated by difficulty: harder modes require exact
    // capitalization & punctuation, no matter the player's preference.
    const cfg = getDifficultyConfig(this.state.difficulty);
    return { strict: cfg.strict };
  }

  /**
   * True when the current buffer can no longer become any target or command —
   * i.e. the player has mistyped. The UI tints the input red.
   */
  get inputWrong(): boolean {
    const s = this.state;
    const raw = s.input.trim();
    if (raw.length === 0) return false;
    const opts = this.matchOptions;
    const cmdPrefix = this.activeCommands().some((c) => isPrefix(raw, c, opts));
    const first = s.wordQueue[0];
    const wordPrefix = first ? isPrefix(raw, first, opts) : false;
    return !cmdPrefix && !wordPrefix;
  }

  /** Consumable powerup words the player can type right now (only if owned). */
  activeCommands(): string[] {
    const cmds: string[] = [];
    const c = this.state.powerups.consumables;
    if (c.grenade > 0) cmds.push('grenade');
    if (c.freeze > 0) cmds.push('freeze');
    if (c.medkit > 0) cmds.push('medkit');
    return cmds;
  }

  /**
   * Forward the current input box value. A word fires only when the player
   * presses SPACE — never mid-word — so nothing fires unless typed in full.
   */
  handleInput(raw: string) {
    const s = this.state;
    if (s.status !== 'playing') {
      s.input = raw;
      return;
    }
    if (s.input.trim().length === 0 && raw.trim().length > 0) this.wordStartMs = s.elapsedMs;

    // No submit until a space is pressed: just accumulate keystrokes.
    if (!raw.endsWith(' ')) {
      s.input = raw;
      return;
    }

    const candidate = raw.trim();
    if (candidate.length === 0) {
      s.input = '';
      return;
    }
    this.submitWord(candidate);
  }

  private submitWord(candidate: string) {
    const s = this.state;
    const opts = this.matchOptions;

    // 1) Special commands take priority.
    for (const cmd of this.activeCommands()) {
      if (matchesTarget(candidate, cmd, opts)) {
        this.runCommand(cmd);
        this.registerCorrect(cmd);
        s.input = '';
        return;
      }
    }

    // 2) You must type the words IN ORDER — only the first word counts. On a hit
    // the queue shifts left and a fresh word is appended, so the order is stable
    // and typing fast can never jump ahead to the second word.
    const first = s.wordQueue[0];
    if (first && matchesTarget(candidate, first, opts)) {
      s.wordQueue.shift();
      s.wordQueue.push(this.makeWord());
      this.fireAtNearest();
      this.registerCorrect(first);
      s.input = '';
      return;
    }

    // 3) Otherwise it's a miss. Keep the typed text (minus the trailing space)
    // so the player can fix a typo instead of losing the whole word.
    this.registerMistake(candidate);
    s.input = candidate;
  }

  /** Advance the simulation by `dt` seconds. */
  update(dt: number) {
    const s = this.state;
    if (s.status !== 'playing') return;
    // Clamp dt so an alt-tab pause doesn't teleport zombies into the base.
    dt = Math.min(dt, 0.05);

    const scale = timeScale(s.powerups);
    const sdt = dt * scale; // simulation dt (slowed by powerups)
    const realMs = dt * 1000;

    s.elapsedMs += realMs;
    tickPowerups(s.powerups, realMs);
    this.slowMoCooldown = Math.max(0, this.slowMoCooldown - realMs);
    s.shake = Math.max(0, s.shake - dt * 60);
    s.flash = Math.max(0, s.flash - dt * 4);
    s.bossWarning = Math.max(0, s.bossWarning - dt);
    if (s.survivorShot) {
      s.survivorShot.life -= dt;
      if (s.survivorShot.life <= 0) s.survivorShot = null;
    }

    this.updateFloating(dt);
    this.updateEvents(dt);

    this.updateSpawning(sdt);
    this.updateZombies(sdt);
    this.recomputeMetrics();
  }

  // --- Spawning & waves ---------------------------------------------------

  private startWave(wave: number) {
    const s = this.state;
    s.wave = wave;
    s.waveZombiesSpawned = 0;
    s.weather = this.rollWeather();

    const bossWave = s.mode === 'bossrush' || isBossWave(wave);
    if (bossWave) {
      s.waveZombiesToSpawn = s.mode === 'bossrush' ? 1 : 1;
      s.bossWarning = 3.2;
      this.addEvent('⚠ BOSS INCOMING ⚠', 'companion');
    } else {
      const cfg = getDifficultyConfig(s.difficulty);
      s.waveZombiesToSpawn = waveZombieCount(cfg, wave);
    }
    s.spawnCooldown = 0.4;
  }

  private updateSpawning(dt: number) {
    const s = this.state;
    if (s.betweenWaves > 0) {
      s.betweenWaves -= dt;
      if (s.betweenWaves <= 0) this.startWave(s.wave + 1);
      return;
    }

    if (s.waveZombiesSpawned < s.waveZombiesToSpawn) {
      s.spawnCooldown -= dt;
      if (s.spawnCooldown <= 0) {
        this.spawnNext();
        const cfg = getDifficultyConfig(s.difficulty);
        s.spawnCooldown = waveSpawnInterval(cfg, s.wave);
      }
    } else if (s.zombies.length === 0) {
      // Wave cleared.
      s.betweenWaves = INTER_WAVE_BREATHER;
      this.addEvent(`WAVE ${s.wave} CLEARED`, 'finisher');
    }
  }

  private spawnNext() {
    const s = this.state;
    const cfg = getDifficultyConfig(s.difficulty);
    let speed = waveSpeed(cfg, s.wave);
    // "Slow Start" upgrade eases the first waves.
    if (s.wave <= 3 && s.upgrades.slowWaves > 0) {
      speed *= 1 - Math.min(0.45, s.upgrades.slowWaves * 0.15);
    }

    const spawnY = s.height * SPAWN_FRAC; // appear just below the word panel
    const bossWave = s.mode === 'bossrush' || isBossWave(s.wave);
    if (bossWave) {
      const boss = createBossZombie(pickBoss(this.rng), s.width / 2, speed * 0.5, s.wave);
      boss.y = spawnY;
      s.zombies.push(boss);
      s.bossActive = true;
      this.addEvent(boss.bossName ?? 'BOSS', 'companion');
    } else {
      const type = zombieTypeForWave(this.rng, s.wave);
      const z = createZombie(type, { rng: this.rng, width: s.width, wave: s.wave, speed });
      z.y = spawnY;
      s.zombies.push(z);
    }
    s.waveZombiesSpawned += 1;
  }

  private updateZombies(dt: number) {
    const s = this.state;
    const baseY = s.height - 70;
    // Keep time-to-base constant across screen sizes (see REFERENCE_HEIGHT).
    const speedScale = s.height / REFERENCE_HEIGHT;
    const survivors: Zombie[] = [];

    for (const z of s.zombies) {
      z.hitFlash = Math.max(0, z.hitFlash - dt * 4);

      // Screamers periodically spawn adds.
      if (z.type === 'screamer' && (z.spawnsLeft ?? 0) > 0) {
        z.spawnTimer = (z.spawnTimer ?? 0) - dt;
        if (z.spawnTimer <= 0) {
          z.spawnsLeft = (z.spawnsLeft ?? 1) - 1;
          z.spawnTimer = 4.5;
          s.zombies.push(createScreamerAdd(z, { rng: this.rng, width: s.width, wave: s.wave, speed: z.speed }));
          this.addEvent('Screamer is calling more!', 'companion');
        }
      }

      z.y += z.speed * speedScale * dt;

      if (z.y >= baseY) {
        this.zombieReachedBase(z);
        continue; // removed
      }
      survivors.push(z);
    }
    s.zombies = survivors;

    if (this.state.health <= 0) {
      this.endGame();
    }
  }

  private zombieReachedBase(z: Zombie) {
    const s = this.state;

    // A boss reaching the base is an instant game over — no shield saves you.
    if (z.isBoss) {
      s.bossActive = false;
      s.health = 0;
      s.flash = 1;
      s.shake = Math.max(s.shake, 24);
      this.addFloating(s.width / 2, s.height * 0.5, 'OVERRUN', '#ff3860', 30);
      return;
    }

    // Shield blocks the hit entirely.
    if (s.powerups.shieldCharges > 0) {
      s.powerups.shieldCharges -= 1;
      this.addFloating(z.x, s.height - 80, 'BLOCKED', '#00f0ff', 22);
      this.addEvent('Shield absorbed a hit!', 'companion');
      s.shake = Math.max(s.shake, 8);
      return;
    }
    s.health = clamp(s.health - z.damage, 0, s.maxHealth);
    s.flash = Math.max(s.flash, 0.8);
    s.shake = Math.max(s.shake, 14);
    this.addFloating(z.x, s.height - 80, `-${z.damage}`, '#ff3860', 24);
  }

  // --- Hits, kills, scoring ----------------------------------------------

  /** A completed word fires a shot at the nearest *visible* zombie (one hit). */
  private fireAtNearest() {
    const s = this.state;
    // Only target zombies that have entered the play field — prevents fast
    // typers from killing zombies before they're even on screen.
    const minY = s.height * MIN_TARGET_FRAC;
    const target = s.zombies.filter((z) => z.y >= minY).sort((a, b) => b.y - a.y)[0];
    if (!target) return; // nothing visible to shoot yet — the shot misses
    s.survivorShot = { x: target.x, y: target.y, life: 0.18, ttl: 0.18 };
    let dmg = SHOT_DAMAGE * damageMultiplier(s.powerups);
    if (target.isBoss) dmg += bossDamageBonus(s.upgrades);
    target.hp -= dmg;
    target.hitFlash = 1;
    if (target.isBoss && target.hp > 0) {
      this.addFloating(target.x, target.y - target.size, `${Math.max(0, target.hp)}`, '#ff8fe6', 16);
    }
    if (target.hp <= 0) this.killZombie(target);
  }

  private killZombie(z: Zombie, silent = false) {
    const s = this.state;
    s.zombies = s.zombies.filter((other) => other.id !== z.id);
    s.kills += 1;

    const comboBonus = 1 + Math.min(1.5, s.combo * 0.02);
    const score = Math.round(z.reward.score * comboBonus);
    s.score += score;
    const coinMult = coinMultiplier(s.upgrades) * getDifficultyConfig(s.difficulty).coinMult;
    s.coins += Math.round(z.reward.coins * coinMult);
    s.xp += z.reward.xp;

    if (!silent) this.addFloating(z.x, z.y - z.size, `+${score}`, '#ffb300', 20);

    if (z.isBoss) {
      s.bossesDefeated += 1;
      s.bossActive = false;
      s.shake = Math.max(s.shake, 20);
      this.addEvent(`${z.bossName ?? 'BOSS'} DESTROYED`, 'finisher');
    }

    // Shotgun: a primed kill blasts nearby zombies.
    if (s.powerups.shotgunArmed && !silent) {
      s.powerups.shotgunArmed = false;
      const radius = shotgunRadius(s.upgrades);
      const nearby = s.zombies.filter((o) => !o.isBoss && distance(o.x, o.y, z.x, z.y) <= radius);
      for (const o of nearby) this.killZombie(o, true);
      if (nearby.length > 0) {
        this.addFloating(z.x, z.y, `SHOTGUN x${nearby.length}`, '#ff2bd6', 22);
        s.shake = Math.max(s.shake, 16);
      }
    }
  }

  private registerCorrect(word: string) {
    const s = this.state;
    const clearedMs = s.elapsedMs - this.wordStartMs;
    const charCount = word.replace(/\s+/g, '').length;
    s.correctWords += 1;
    s.charsTyped += charCount;
    this.recentWords.push({ t: s.elapsedMs, chars: charCount });
    s.combo += 1;
    s.streak += 1;
    s.noMistakeStreak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);

    // Headshot bonus.
    if (isHeadshot(word.replace(/\s+/g, '').length, clearedMs)) {
      const bonus = 50;
      s.score += bonus;
      this.addFloating(s.width / 2, s.height * 0.4, 'HEADSHOT', '#ff2bd6', 26);
    }

    this.checkPowerups();
    this.checkFinishers();
  }

  private registerMistake(candidate = '') {
    const s = this.state;
    const strict = this.matchOptions.strict ?? false;
    s.mistakes += 1;
    s.streak = strict ? 0 : Math.floor(s.streak / 2);
    s.noMistakeStreak = 0;
    s.combo = 0;
    s.flash = Math.max(s.flash, 0.3);
    this.noteMissedWord(candidate);
  }

  private checkPowerups() {
    const s = this.state;
    if (shouldArmShotgun(s.streak) && !s.powerups.shotgunArmed) {
      s.powerups.shotgunArmed = true;
      this.addEvent('SHOTGUN ARMED — next kill blasts a cone!', 'companion');
    }
    if (shouldGrantShield(s.noMistakeStreak)) {
      s.powerups.shieldCharges += 1;
      this.addEvent('SHIELD UP', 'companion');
    }
    if (shouldDoubleDamage(s.wpm) && s.powerups.doubleDamageMs <= 0) {
      s.powerups.doubleDamageMs = DOUBLE_DAMAGE_MS;
      this.addEvent('DOUBLE DAMAGE', 'companion');
    }
    const luck = powerupChanceBonus(s.upgrades);
    if (
      shouldSlowMotion(s.accuracy, s.correctWords) &&
      s.powerups.slowMotionMs <= 0 &&
      this.slowMoCooldown <= 0 &&
      this.rng() < 0.5 + luck
    ) {
      s.powerups.slowMotionMs = slowMoDurationMs(s.upgrades);
      this.slowMoCooldown = 14000;
      this.addEvent('SLOW MOTION', 'companion');
    }
  }

  private checkFinishers() {
    const s = this.state;
    if (s.streak === 25) this.addEvent('NO MERCY COMBO', 'finisher');
    else if (s.streak === 50) this.addEvent('PERFECT DEFENSE', 'finisher');
    else if (s.streak === 100) this.addEvent('BUNKER CLEAR', 'finisher');
  }

  // --- Commands -----------------------------------------------------------

  /** Activate a consumable powerup (bought in the store, typed in-game). */
  private runCommand(cmd: string) {
    const s = this.state;
    if (cmd === 'grenade' && s.powerups.consumables.grenade > 0) {
      s.powerups.consumables.grenade -= 1;
      this.clearNearestCluster(150, 'GRENADE');
    } else if (cmd === 'freeze' && s.powerups.consumables.freeze > 0) {
      s.powerups.consumables.freeze -= 1;
      s.powerups.freezeMs = FREEZE_MS;
      this.addEvent('ZOMBIES FROZEN', 'companion');
      this.addFloating(s.width / 2, s.height * 0.45, 'FREEZE', '#00f0ff', 24);
    } else if (cmd === 'medkit' && s.powerups.consumables.medkit > 0) {
      s.powerups.consumables.medkit -= 1;
      s.health = clamp(s.health + MEDKIT_HEAL, 0, s.maxHealth);
      this.addEvent('+HEALTH', 'companion');
      this.addFloating(s.width / 2, s.height * 0.45, `+${MEDKIT_HEAL} HP`, '#39ff14', 24);
    }
  }

  private clearNearestCluster(radius: number, label: string) {
    const s = this.state;
    const anchor = [...s.zombies].filter((z) => !z.isBoss).sort((a, b) => b.y - a.y)[0];
    if (!anchor) return;
    const hit = s.zombies.filter((z) => !z.isBoss && distance(z.x, z.y, anchor.x, anchor.y) <= radius);
    for (const z of hit) this.killZombie(z, true);
    s.shake = Math.max(s.shake, 16);
    this.addFloating(anchor.x, anchor.y, `${label} x${hit.length}`, '#ff2bd6', 22);
  }

  // --- Helpers ------------------------------------------------------------

  private recomputeMetrics() {
    const s = this.state;
    s.accuracy = calcAccuracy(s.correctWords, s.mistakes);
    // Live WPM over a rolling window so it responds to current typing speed.
    const windowMs = 6000;
    const cutoff = s.elapsedMs - windowMs;
    this.recentWords = this.recentWords.filter((r) => r.t >= cutoff);
    const chars = this.recentWords.reduce((a, r) => a + r.chars, 0);
    const span = Math.min(windowMs, Math.max(1000, s.elapsedMs));
    s.wpm = calcWpm(chars, span);
    s.maxWpm = Math.max(s.maxWpm, s.wpm);
  }

  private noteMissedWord(word: string) {
    if (!word) return;
    const w = word.toLowerCase();
    this.state.missedWords[w] = (this.state.missedWords[w] ?? 0) + 1;
  }

  private addFloating(x: number, y: number, text: string, color: string, size: number) {
    const ft: FloatingText = { id: uid('ft'), x, y, text, color, life: 1, ttl: 1, size };
    this.state.floatingTexts.push(ft);
    if (this.state.floatingTexts.length > 40) this.state.floatingTexts.shift();
  }

  private updateFloating(dt: number) {
    for (const ft of this.state.floatingTexts) {
      ft.life -= dt;
      ft.y -= dt * 28;
    }
    this.state.floatingTexts = this.state.floatingTexts.filter((f) => f.life > 0);
  }

  private addEvent(text: string, kind: GameEvent['kind']) {
    this.state.events.push({ id: uid('ev'), text, kind, life: kind === 'finisher' ? 2.2 : 2.6 });
    if (this.state.events.length > 6) this.state.events.shift();
  }

  private updateEvents(dt: number) {
    for (const ev of this.state.events) ev.life -= dt;
    this.state.events = this.state.events.filter((e) => e.life > 0);
  }

  private rollWeather() {
    const r = this.rng();
    if (this.state.wave < 3) return 'clear';
    if (r < 0.18) return 'fog';
    if (r < 0.34) return 'rain';
    return 'clear';
  }

  private endGame() {
    this.state.status = 'gameover';
  }
}
