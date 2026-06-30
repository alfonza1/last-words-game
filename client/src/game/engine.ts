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
  PuzzleStyle,
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
  MOBILE_SPEED_MULT,
  waveSpawnInterval,
  waveSpeed,
  waveZombieCount,
  wordTierForWave,
} from './difficulty';
import { makePuzzle, puzzleKills, puzzlePoolSize, puzzleSpeedMult, type Puzzle } from '../data/puzzles';
import {
  createScreamerAdd,
  createZombie,
  zombieTypeForWave,
} from './spawn';
import type { WordTier } from '../data/words';
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
  /** Puzzle Mode: solve prompts to fire a multi-kill volley. */
  riddleMode?: boolean;
  /** Which puzzle to solve when riddleMode is on (default 'riddles'). */
  puzzleStyle?: PuzzleStyle;
  /** Mobile session: smaller screen + voice input, so zombies move a bit slower. */
  mobile?: boolean;
}

const DOUBLE_DAMAGE_MS = 5000;
const FREEZE_MS = 3000;
const INTER_WAVE_BREATHER = 2.4;
const QUEUE_SIZE = 5; // words shown / typeable at once
const SHOT_DAMAGE = 2; // base damage a completed word deals to the nearest zombie
const SHOT_VISUAL_TTL = 0.18;
const SOLVER_SHOT_SPACING = 0.25;
const GRENADE_RADIUS = 260;
const MEDKIT_HEAL = 35; // health restored by a med kit
// Global match economy tuning. Difficulty and Scavenger multipliers still
// apply on top, so Normal remains 1.25x and Nightmare remains 2x.
const MATCH_COIN_PAYOUT_RATE = 0.421875;
// Zombies spawn just below the on-screen word panel.
const SPAWN_FRAC = 0.24;
// Vertical movement is scaled to the play-field height so a zombie takes the same
// time to reach the base on any screen size. Without this, a shorter viewport
// (e.g. dev tools docked at the bottom) shrinks the distance and zombies arrive
// sooner. The difficulty speeds (px/sec) are tuned against this reference height.
const REFERENCE_HEIGHT = 600;

interface SolverShot {
  zombieId: string;
  damage: number;
  combo: number;
  forceKill: boolean;
}

export class GameEngine {
  state: GameState;
  private rng: () => number;
  private wordStartMs = 0;
  private typingElapsedMs = 0;
  private slowMoCooldown = 0;
  private recentWords: Array<{ t: number; chars: number }> = []; // rolling WPM window
  // Puzzle Mode: parallels wordQueue (which holds answers) with the full puzzles,
  // so we can show prompts and accept synonyms while reusing the typing pipeline.
  private riddleQueue: Puzzle[] = [];
  private puzzleStyle: PuzzleStyle = 'riddles';
  private mobile = false;
  private solvedPuzzlePrompts = new Set<string>();
  private finitePuzzleGoal: number | null = null;
  private queuedSolverShots: SolverShot[] = [];
  private queuedSolverTargetCounts = new Map<string, number>();
  private solverShotCooldown = 0;

  constructor(opts: EngineOptions) {
    this.rng = mulberry32(opts.seed ?? hashSeed(`${Date.now()}-${Math.random()}`));
    this.puzzleStyle = opts.puzzleStyle ?? 'riddles';
    this.mobile = !!opts.mobile;
    const difficulty = opts.mode === 'bossrush' ? 'normal' : opts.difficulty;
    const cfg = getDifficultyConfig(difficulty);
    const maxHealth = cfg.startHealth + maxHealthBonus(opts.upgrades);
    this.state = {
      mode: opts.mode,
      difficulty,
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
      wordsToClearWave: QUEUE_SIZE,
      input: '',
      riddleMode: !!opts.riddleMode,
      puzzleStyle: opts.puzzleStyle ?? 'riddles',
      riddlePrompt: null,
      survived: false,
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
      shotsFired: 0,
      upgrades: opts.upgrades,
      settings: opts.settings,
    };
    this.finitePuzzleGoal = this.computeFinitePuzzleGoal();
    // Fill the initial queue (words, or riddle answers in Riddle Mode).
    for (let i = 0; i < QUEUE_SIZE; i++) this.enqueueItem();
    this.syncRiddlePrompt();
    this.refreshWordsToClearWave();
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

  /** Append one item to the queue — a word, or a riddle (answer + prompt) in Riddle Mode. */
  private enqueueItem() {
    if (this.state.riddleMode) {
      if (this.hasQueuedAllFinitePuzzles()) return;
      const riddle = this.pickRiddle();
      this.riddleQueue.push(riddle);
      this.state.wordQueue.push(riddle.answer);
    } else {
      this.state.wordQueue.push(this.makeWord());
    }
  }

  /** Drop the consumed first item from the queue and append a fresh one. */
  private cycleQueue() {
    this.state.wordQueue.shift();
    if (this.state.riddleMode) this.riddleQueue.shift();
    this.enqueueItem();
    this.syncRiddlePrompt();
  }

  /** Make a puzzle for the current style + wave tier, avoiding answers already solved/queued. */
  private pickRiddle(): Puzzle {
    const tier = this.currentPuzzleTier();
    let puzzle = makePuzzle(this.puzzleStyle, this.rng, this.state.difficulty, tier);
    const poolSize = puzzlePoolSize(this.puzzleStyle, tier);
    const guardLimit = Math.max(8, (poolSize ?? 30) * 3);
    let guard = 0;
    while (
      (this.state.wordQueue.includes(puzzle.answer) ||
        this.riddleQueue.some((queued) => queued.prompt === puzzle.prompt) ||
        this.solvedPuzzlePrompts.has(puzzle.prompt)) &&
      guard++ < guardLimit
    ) {
      puzzle = makePuzzle(this.puzzleStyle, this.rng, this.state.difficulty, tier);
    }
    return puzzle;
  }

  private currentPuzzleTier(): WordTier {
    const cfg = getDifficultyConfig(this.state.difficulty);
    return wordTierForWave(Math.max(1, this.state.wave), cfg.wordLengthBias);
  }

  private computeFinitePuzzleGoal(): number | null {
    if (!this.state.riddleMode || (this.puzzleStyle !== 'riddles' && this.puzzleStyle !== 'trivia')) {
      return null;
    }
    return puzzlePoolSize(this.puzzleStyle, this.currentPuzzleTier());
  }

  private hasQueuedAllFinitePuzzles(): boolean {
    return (
      this.finitePuzzleGoal !== null &&
      this.solvedPuzzlePrompts.size + this.riddleQueue.length >= this.finitePuzzleGoal
    );
  }

  private hasSolvedFinitePuzzlePool(): boolean {
    return this.finitePuzzleGoal !== null && this.solvedPuzzlePrompts.size >= this.finitePuzzleGoal;
  }

  private survivePuzzlePool() {
    const s = this.state;
    if (s.status === 'gameover') return;
    s.survived = true;
    s.status = 'gameover';
    s.input = '';
    s.wordQueue = [];
    this.riddleQueue = [];
    this.syncRiddlePrompt();
    this.addEvent('YOU SURVIVED', 'finisher');
  }

  private syncRiddlePrompt() {
    this.state.riddlePrompt = this.state.riddleMode ? this.riddleQueue[0]?.prompt ?? null : null;
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

  forfeit() {
    if (this.state.status === 'gameover') return;
    this.state.health = 0;
    this.state.status = 'gameover';
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
    // Puzzle answers are not prefix-friendly (especially numeric answers), so
    // reserve red mismatch feedback for Typing Defense only.
    if (s.riddleMode) return false;
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
   * Activate a consumable powerup from a UI button (mobile, where typing the
   * command word isn't practical). Returns true if a charge was spent.
   */
  activatePowerup(key: string): boolean {
    const s = this.state;
    if (s.status !== 'playing' || (s.wave > 0 && s.betweenWaves > 0)) return false;
    const owned = (s.powerups.consumables as unknown as Record<string, number>)[key] ?? 0;
    if (owned <= 0) return false;
    this.runCommand(key);
    return true;
  }

  /**
   * Forward the current input box value. A word fires only when the player
   * presses SPACE — never mid-word — so nothing fires unless typed in full.
   */
  handleInput(raw: string) {
    const s = this.state;
    if (s.status !== 'playing') {
      return;
    }
    if (s.wave > 0 && s.betweenWaves > 0) {
      s.input = '';
      return;
    }
    if (s.input.trim().length === 0 && raw.trim().length > 0) this.wordStartMs = this.typingElapsedMs;

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

    // 2) Riddle Mode: solving the current riddle fires a multi-kill volley
    // (sized so kills/min ≈ typing — see DifficultyConfig.riddleKills).
    if (s.riddleMode) {
      const riddle = this.riddleQueue[0];
      if (riddle && this.riddleMatches(candidate, riddle)) {
        const answer = riddle.answer;
        this.solvedPuzzlePrompts.add(riddle.prompt);
        this.cycleQueue();
        this.fireShots(puzzleKills(this.puzzleStyle, s.difficulty));
        this.registerCorrect(answer);
        s.input = '';
        if (this.hasSolvedFinitePuzzlePool()) this.survivePuzzlePool();
        return;
      }
      this.registerMistake();
      s.input = '';
      return;
    }

    // 3) Type the words IN ORDER — only the first counts. On a hit the queue
    // shifts left and a fresh word appends, so typing fast can't jump ahead.
    const first = s.wordQueue[0];
    if (first && matchesTarget(candidate, first, opts)) {
      this.cycleQueue();
      this.fireShots(1);
      this.registerCorrect(first);
      s.input = '';
      return;
    }

    // 4) Otherwise it's a miss. Keep the typed text (minus the trailing space)
    // so the player can fix a typo instead of losing the whole word.
    this.registerMistake();
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
    // Survival time includes wave breaks, but WPM should only measure periods
    // when the typing prompt is active.
    if (s.betweenWaves <= 0) this.typingElapsedMs += realMs;
    tickPowerups(s.powerups, realMs);
    this.slowMoCooldown = Math.max(0, this.slowMoCooldown - realMs);
    s.shake = Math.max(0, s.shake - dt * 60);
    s.flash = Math.max(0, s.flash - dt * 4);
    s.bossWarning = Math.max(0, s.bossWarning - dt);
    if (s.survivorShot) {
      s.survivorShot.life -= dt;
      if (s.survivorShot.life <= 0) s.survivorShot = null;
    }
    this.updateQueuedSolverShots(dt);

    this.updateFloating(dt);
    this.updateEvents(dt);

    this.updateSpawning(sdt);
    this.updateZombies(sdt);
    this.recomputeMetrics();
    this.refreshWordsToClearWave();
  }

  /**
   * Typing Defense: count how many queued words are still required to clear the
   * current wave — the shots left to kill every zombie on the field plus one for
   * each wave member not yet spawned — capped at the queue size. Recomputed every
   * frame from live state, so it self-corrects as zombies spawn, die, or split.
   * Other modes (Puzzle/Riddle) keep the full queue.
   */
  private refreshWordsToClearWave() {
    this.state.wordsToClearWave = this.computeWordsToClearWave();
  }

  private computeWordsToClearWave(): number {
    const s = this.state;
    if (s.riddleMode) return s.wordQueue.length;
    // Before the first wave or during the inter-wave breather, show the full queue.
    if (s.wave === 0 || s.betweenWaves > 0) return Math.max(1, s.wordQueue.length);

    const dmg = SHOT_DAMAGE * damageMultiplier(s.powerups);
    let shots = 0;
    for (const z of s.zombies) {
      const perShot = z.isBoss ? dmg + bossDamageBonus(s.upgrades) : dmg;
      shots += Math.max(1, Math.ceil(z.hp / Math.max(1, perShot)));
    }
    // Every wave member still to spawn needs at least one more word.
    shots += Math.max(0, s.waveZombiesToSpawn - s.waveZombiesSpawned);
    return Math.min(s.wordQueue.length, Math.max(1, shots));
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
    } else if (s.zombies.length === 0) this.completeWave();
  }

  private spawnNext() {
    const s = this.state;
    const cfg = getDifficultyConfig(s.difficulty);
    let speed = waveSpeed(cfg, s.wave);
    // "Slow Start" upgrade eases the first waves.
    if (s.wave <= 3 && s.upgrades.slowWaves > 0) {
      speed *= 1 - Math.min(0.45, s.upgrades.slowWaves * 0.15);
    }
    // Puzzle Mode slows zombies — kills come in bursts after each solve.
    if (s.riddleMode) speed *= puzzleSpeedMult(this.puzzleStyle);
    // Mobile sessions (smaller screen + slower voice input) ease zombie speed.
    if (this.mobile) speed *= MOBILE_SPEED_MULT;

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

      if (this.queuedSolverTargetCounts.has(z.id)) {
        survivors.push(z);
        continue;
      }

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

  /** Fire a completed word or puzzle volley at zombies currently on the field. */
  private fireShots(count: number) {
    const damage = SHOT_DAMAGE * damageMultiplier(this.state.powerups);
    const combo = this.state.combo;
    if (this.state.riddleMode) {
      this.scheduleSolverVolley(count, damage, combo);
      this.prepareTargetForNextSubmission();
      return;
    }

    for (let i = 0; i < count; i++) {
      const target = this.fireAtNearest(damage, combo);
      if (!target) break;
      this.emitShot(target);
    }
    this.prepareTargetForNextSubmission();
  }

  /** Fire at the nearest zombie. Returns the target point if the field is not empty. */
  private fireAtNearest(damage: number, combo: number): { x: number; y: number } | null {
    const s = this.state;
    const target = [...s.zombies].sort((a, b) => b.y - a.y)[0];
    if (!target) return null;
    const shotTarget = { x: target.x, y: target.y };
    let dmg = damage;
    if (target.isBoss) dmg += bossDamageBonus(s.upgrades);
    target.hp -= dmg;
    target.hitFlash = 1;
    if (target.isBoss && target.hp > 0) {
      this.addFloating(target.x, target.y - target.size, `${Math.max(0, target.hp)}`, '#ff8fe6', 16);
    }
    if (target.hp <= 0) this.killZombie(target, false, combo);
    return shotTarget;
  }

  private scheduleSolverVolley(count: number, damage: number, combo: number) {
    const shots = this.collectSolverShots(count, damage, combo);
    if (shots.length === 0) return;
    for (const shot of shots) this.reserveSolverTarget(shot.zombieId);
    if (this.queuedSolverShots.length > 0 || this.solverShotCooldown > 0) {
      this.queuedSolverShots.push(...shots);
      return;
    }

    const [first, ...rest] = shots;
    this.emitSolverShot(first);
    this.queuedSolverShots.push(...rest);
    if (rest.length > 0) this.solverShotCooldown = SOLVER_SHOT_SPACING;
  }

  private collectSolverShots(count: number, damage: number, combo: number): SolverShot[] {
    const s = this.state;
    const shots: SolverShot[] = [];
    const reserved = new Set(this.queuedSolverTargetCounts.keys());
    const predictedHp = new Map<string, number>();

    for (let i = 0; i < count; i++) {
      const target = [...s.zombies]
        .filter((z) => !reserved.has(z.id))
        .sort((a, b) => b.y - a.y)[0];
      if (!target) break;

      if (target.isBoss) {
        const hp = predictedHp.get(target.id) ?? target.hp;
        const shotDamage = damage + bossDamageBonus(s.upgrades);
        shots.push({
          zombieId: target.id,
          damage: shotDamage,
          combo,
          forceKill: false,
        });
        const nextHp = hp - shotDamage;
        predictedHp.set(target.id, nextHp);
        if (nextHp <= 0) reserved.add(target.id);
      } else {
        shots.push({
          zombieId: target.id,
          damage: target.hp,
          combo,
          forceKill: true,
        });
        reserved.add(target.id);
      }
    }

    return shots;
  }

  private updateQueuedSolverShots(dt: number) {
    if (this.queuedSolverShots.length === 0) {
      this.solverShotCooldown = 0;
      return;
    }

    this.solverShotCooldown -= dt;
    if (this.solverShotCooldown > 0.0001) return;

    const target = this.queuedSolverShots.shift();
    if (!target) return;
    this.emitSolverShot(target);
    this.solverShotCooldown = this.queuedSolverShots.length > 0 ? SOLVER_SHOT_SPACING : 0;
  }

  private emitSolverShot(shot: SolverShot) {
    const s = this.state;
    const target = s.zombies.find((z) => z.id === shot.zombieId);
    if (!target) {
      this.releaseSolverTarget(shot.zombieId);
      return;
    }

    this.emitShot({ x: target.x, y: target.y });
    target.hitFlash = 1;
    target.hp -= shot.forceKill ? Math.max(target.hp, shot.damage) : shot.damage;
    if (target.isBoss && target.hp > 0) {
      this.addFloating(target.x, target.y - target.size, `${Math.max(0, target.hp)}`, '#ff8fe6', 16);
    }
    if (target.hp <= 0) this.killZombie(target, false, shot.combo);
    this.releaseSolverTarget(shot.zombieId);
    this.prepareTargetForNextSubmission();
  }

  private reserveSolverTarget(zombieId: string) {
    this.queuedSolverTargetCounts.set(zombieId, (this.queuedSolverTargetCounts.get(zombieId) ?? 0) + 1);
  }

  private releaseSolverTarget(zombieId: string) {
    const count = this.queuedSolverTargetCounts.get(zombieId) ?? 0;
    if (count <= 1) this.queuedSolverTargetCounts.delete(zombieId);
    else this.queuedSolverTargetCounts.set(zombieId, count - 1);
  }

  private emitShot(target: { x: number; y: number }) {
    const s = this.state;
    s.survivorShot = { ...target, life: SHOT_VISUAL_TTL, ttl: SHOT_VISUAL_TTL };
    s.shotsFired += 1;
  }

  /**
   * Keep a live wave populated after a successful submission. If the wave quota
   * is exhausted, enter the break immediately so another word cannot slip in.
   */
  private prepareTargetForNextSubmission() {
    const s = this.state;
    if (s.zombies.length > 0 || (s.wave > 0 && s.betweenWaves > 0)) return;
    if (s.wave === 0) {
      s.betweenWaves = 0;
      this.startWave(1);
    }
    if (s.waveZombiesSpawned < s.waveZombiesToSpawn) {
      this.spawnNext();
      const cfg = getDifficultyConfig(s.difficulty);
      s.spawnCooldown = waveSpawnInterval(cfg, s.wave);
      return;
    }
    if (s.wave > 0) this.completeWave();
  }

  private completeWave() {
    const s = this.state;
    if (s.wave <= 0 || s.betweenWaves > 0) return;
    s.input = '';
    s.betweenWaves = INTER_WAVE_BREATHER;
    this.addEvent(`WAVE ${s.wave} CLEARED`, 'finisher');
  }

  /** Puzzle answers match case-insensitively, ignore spaces/articles, accept synonyms. */
  private riddleMatches(candidate: string, riddle: Puzzle): boolean {
    const got = this.normalizeAnswer(candidate);
    if (got.length === 0) return false;
    if (got === this.normalizeAnswer(riddle.answer)) return true;
    return (riddle.accept ?? []).some((alt) => this.normalizeAnswer(alt) === got);
  }

  private normalizeAnswer(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/^(a|an|the)\s+/, '')
      .replace(/[^a-z0-9]+/g, '');
  }

  private killZombie(z: Zombie, silent = false, rewardCombo = this.state.combo) {
    const s = this.state;
    s.zombies = s.zombies.filter((other) => other.id !== z.id);
    s.kills += 1;

    const comboBonus = 1 + Math.min(1.5, rewardCombo * 0.02);
    const difficulty = getDifficultyConfig(s.difficulty);
    const score = Math.round(z.reward.score * comboBonus * difficulty.scoreMult);
    s.score += score;
    const coinMult = MATCH_COIN_PAYOUT_RATE * coinMultiplier(s.upgrades) * difficulty.coinMult;
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
      const nearby = s.zombies.filter(
        (o) => !o.isBoss && !this.queuedSolverTargetCounts.has(o.id) && distance(o.x, o.y, z.x, z.y) <= radius,
      );
      for (const o of nearby) this.killZombie(o, true, rewardCombo);
      if (nearby.length > 0) {
        this.addFloating(z.x, z.y, `SHOTGUN x${nearby.length}`, '#ff2bd6', 22);
        s.shake = Math.max(s.shake, 16);
      }
    }
  }

  private registerCorrect(word: string) {
    const s = this.state;
    const clearedMs = this.typingElapsedMs - this.wordStartMs;
    const charCount = word.replace(/\s+/g, '').length;
    s.correctWords += 1;
    s.charsTyped += charCount;
    this.recentWords.push({ t: this.typingElapsedMs, chars: charCount });
    s.combo += 1;
    s.streak += 1;
    s.noMistakeStreak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);

    // Headshot bonus.
    if (isHeadshot(word.replace(/\s+/g, '').length, clearedMs)) {
      const bonus = 50 * getDifficultyConfig(s.difficulty).scoreMult;
      s.score += bonus;
      this.addFloating(s.width / 2, s.height * 0.4, 'HEADSHOT', '#ff2bd6', 26);
    }

    this.checkPowerups();
    this.checkFinishers();
  }

  private registerMistake() {
    const s = this.state;
    const strict = this.matchOptions.strict ?? false;
    s.mistakes += 1;
    s.streak = strict ? 0 : Math.floor(s.streak / 2);
    s.noMistakeStreak = 0;
    s.combo = 0;
    s.flash = Math.max(s.flash, 0.3);
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
      this.clearNearestCluster(GRENADE_RADIUS, 'GRENADE');
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
    const anchor = [...s.zombies]
      .filter((z) => !z.isBoss && !this.queuedSolverTargetCounts.has(z.id))
      .sort((a, b) => b.y - a.y)[0];
    if (!anchor) return;
    const hit = s.zombies.filter(
      (z) => !z.isBoss && !this.queuedSolverTargetCounts.has(z.id) && distance(z.x, z.y, anchor.x, anchor.y) <= radius,
    );
    for (const z of hit) this.killZombie(z, true);
    s.shake = Math.max(s.shake, 16);
    this.addFloating(anchor.x, anchor.y, `${label} x${hit.length}`, '#ff2bd6', 22);
  }

  // --- Helpers ------------------------------------------------------------

  private recomputeMetrics() {
    const s = this.state;
    s.accuracy = calcAccuracy(s.correctWords, s.mistakes);
    if (s.riddleMode) {
      s.wpm = 0;
      s.maxWpm = 0;
      this.recentWords = [];
      return;
    }
    // Live WPM over a rolling window so it responds to current typing speed.
    const windowMs = 6000;
    const cutoff = this.typingElapsedMs - windowMs;
    this.recentWords = this.recentWords.filter((r) => r.t >= cutoff);
    const chars = this.recentWords.reduce((a, r) => a + r.chars, 0);
    const span = Math.min(windowMs, Math.max(1000, this.typingElapsedMs));
    s.wpm = calcWpm(chars, span);
    s.maxWpm = Math.max(s.maxWpm, s.wpm);
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
