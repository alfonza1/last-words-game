// ---------------------------------------------------------------------------
// Shared domain types for DEAD KEYS
// ---------------------------------------------------------------------------

export type Screen =
  | 'menu'
  | 'mapselect'
  | 'game'
  | 'gameover'
  | 'upgrades'
  | 'howto'
  | 'settings';

export type GameMode = 'survival' | 'bossrush';

export type Difficulty = 'easy' | 'normal' | 'nightmare';

export type ZombieType =
  | 'walker'
  | 'runner'
  | 'tank'
  | 'screamer'
  | 'glitch'
  | 'armored'
  | 'crawler'
  | 'boss';

export type Weather = 'clear' | 'fog' | 'rain';

export type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'smg';

export interface Reward {
  score: number;
  coins: number;
  xp: number;
}

export interface Zombie {
  id: string;
  type: ZombieType;
  x: number; // logical pixels
  y: number;
  speed: number; // logical pixels / second
  /** Hits required to kill — words are NOT tied to a zombie; each shot is one hit. */
  hp: number;
  maxHp: number;
  size: number;
  /** Damage dealt to the base when this zombie arrives. */
  damage: number;
  reward: Reward;
  hitFlash: number;
  // Type-specific timers / flags
  spawnTimer?: number; // screamer: time until it spawns adds
  spawnsLeft?: number; // screamer: remaining adds
  isBoss?: boolean;
  bossName?: string;
  frozen?: number; // seconds of freeze remaining
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // seconds remaining
  ttl: number; // total lifetime
  size: number;
}

export interface PowerupState {
  shotgunArmed: boolean;
  shieldCharges: number;
  doubleDamageMs: number;
  slowMotionMs: number;
  freezeMs: number;
  grenadeCharges: number;
  panicUsed: boolean;
}

export interface GameEvent {
  id: string;
  text: string;
  kind: 'companion' | 'radio' | 'finisher' | 'system';
  life: number;
}

export interface GameStats {
  bestScore: number;
  longestSurvivalMs: number;
  highestWpm: number;
  bestAccuracy: number;
  totalKills: number;
  bossesDefeated: number;
  longestStreak: number;
  totalCoins: number;
  gamesPlayed: number;
  missedWords: Record<string, number>;
}

export interface Upgrades {
  startShield: number; // extra shield charges
  slowWaves: number; // levels that slow early waves
  shotgunRadius: number;
  slowMoDuration: number;
  maxHealth: number;
  bonusCoins: number;
  bossDamage: number;
  powerupChance: number;
}

export type UpgradeKey = keyof Upgrades;

export interface Settings {
  difficulty: Difficulty;
  map: string; // selected map theme id
  screenShake: boolean;
  music: boolean;
  musicVolume: number; // 0..1
  sound: boolean; // sound effects enabled
  sfxVolume: number; // 0..1
  weapon: WeaponType;
}

export interface HighScore {
  score: number;
  wave: number;
  wpm: number;
  accuracy: number;
  date: string;
}

export interface GameState {
  mode: GameMode;
  difficulty: Difficulty;
  status: 'playing' | 'paused' | 'gameover';
  width: number;
  height: number;

  health: number;
  maxHealth: number;
  score: number;
  coins: number;
  xp: number;

  wave: number;
  waveZombiesToSpawn: number;
  waveZombiesSpawned: number;
  spawnCooldown: number;
  betweenWaves: number; // seconds remaining of inter-wave breather

  streak: number;
  bestStreak: number;
  noMistakeStreak: number;
  combo: number;

  zombies: Zombie[];
  /** The words the player can type — independent of the zombies. */
  wordQueue: string[];
  input: string;

  elapsedMs: number;
  correctWords: number;
  mistakes: number;
  charsTyped: number;
  accuracy: number;
  wpm: number;
  maxWpm: number;

  kills: number;
  bossesDefeated: number;

  powerups: PowerupState;
  floatingTexts: FloatingText[];
  events: GameEvent[];

  shake: number;
  flash: number;
  weather: Weather;
  bossActive: boolean;
  bossWarning: number; // seconds remaining of the warning overlay

  missedWords: Record<string, number>;
  upgrades: Upgrades;
  settings: Settings;
}
