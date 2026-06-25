// ---------------------------------------------------------------------------
// localStorage persistence. Functions accept an injectable Storage for tests.
// ---------------------------------------------------------------------------
import type { CharacterLoadout, GameStats, HighScore, Settings, Upgrades } from '../types';
import { DEFAULT_CHARACTER, DEFAULT_COSMETICS } from '../data/cosmetics';

const KEYS = {
  stats: 'ztr.stats',
  riddleStats: 'ztr.riddleStats',
  upgrades: 'ztr.upgrades',
  upgradeGames: 'ztr.upgradeGames',
  settings: 'ztr.settings',
  highscores: 'ztr.highscores',
  daily: 'ztr.daily',
  guest: 'ztr.guest',
} as const;

export const DEFAULT_STATS: GameStats = {
  bestScore: 0,
  longestSurvivalMs: 0,
  highestWpm: 0,
  bestAccuracy: 0,
  totalKills: 0,
  bossesDefeated: 0,
  longestStreak: 0,
  coinsEarned: 0,
  totalCoins: 0,
  gamesPlayed: 0,
  missedWords: {},
};

export const DEFAULT_UPGRADES: Upgrades = {
  startShield: 0,
  slowWaves: 0,
  shotgunRadius: 0,
  slowMoDuration: 0,
  maxHealth: 0,
  bonusCoins: 0,
  bossDamage: 0,
  powerupChance: 0,
};

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'normal',
  map: 'graveyard',
  screenShake: true,
  music: true,
  musicVolume: 0.65,
  sound: true,
  sfxVolume: 0.4,
  weapon: 'pistol',
  riddleMode: false,
  puzzleStyle: 'riddles',
};

function getStore(store?: Storage): Storage | null {
  if (store) return store;
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    /* access blocked */
  }
  return null;
}

export function loadJSON<T>(key: string, fallback: T, store?: Storage): T {
  const s = getStore(store);
  if (!s) return fallback;
  try {
    const raw = s.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<T>;
    // Merge so newly-added fields keep their defaults.
    return typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)
      ? { ...(fallback as object), ...(parsed as object) } as T
      : (parsed as T);
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T, store?: Storage): void {
  const s = getStore(store);
  if (!s) return;
  try {
    s.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

export const loadStats = (store?: Storage) => loadJSON(KEYS.stats, DEFAULT_STATS, store);
export const saveStats = (v: GameStats, store?: Storage) => saveJSON(KEYS.stats, v, store);
export const loadRiddleStats = (store?: Storage) => loadJSON(KEYS.riddleStats, DEFAULT_STATS, store);
export const saveRiddleStats = (v: GameStats, store?: Storage) => saveJSON(KEYS.riddleStats, v, store);

export const loadUpgrades = (store?: Storage) => loadJSON(KEYS.upgrades, DEFAULT_UPGRADES, store);
export const saveUpgrades = (v: Upgrades, store?: Storage) => saveJSON(KEYS.upgrades, v, store);

/** Games remaining before purchased upgrades expire (0 = expired). */
export const loadUpgradeGames = (store?: Storage) => loadJSON<number>(KEYS.upgradeGames, 0, store);
export const saveUpgradeGames = (v: number, store?: Storage) => saveJSON(KEYS.upgradeGames, v, store);

export const loadSettings = (store?: Storage) => loadJSON(KEYS.settings, DEFAULT_SETTINGS, store);
export const saveSettings = (v: Settings, store?: Storage) => saveJSON(KEYS.settings, v, store);

/**
 * A guest's locally-owned inventory (no account). Guests can buy cosmetics,
 * power-ups, upgrades, and maps with their local coins; it all lives here on
 * the device. Coins live in stats; real-money coin packs still require signing in.
 */
export interface GuestProfile {
  name: string;
  maps: string[];
  cosmetics: string[];
  powerups: Record<string, number>;
  upgrades: Upgrades;
  upgradeGames: number;
  character: CharacterLoadout;
}

export const DEFAULT_GUEST: GuestProfile = {
  name: '',
  maps: ['graveyard'],
  cosmetics: [...DEFAULT_COSMETICS],
  powerups: {},
  upgrades: DEFAULT_UPGRADES,
  upgradeGames: 0,
  character: DEFAULT_CHARACTER,
};

export const saveGuest = (v: GuestProfile, store?: Storage) => saveJSON(KEYS.guest, v, store);

export function generateGuestName(rng: () => number = Math.random): string {
  const digits = Math.floor(rng() * 100_000)
    .toString()
    .padStart(5, '0');
  return `Survivor${digits}`;
}

export function loadGuest(store?: Storage): GuestProfile {
  const loaded = loadJSON(KEYS.guest, DEFAULT_GUEST, store);
  const name = loaded.name || generateGuestName();
  const existingMaps = Array.isArray(loaded.maps) ? loaded.maps : [];
  const maps = [...new Set(['graveyard', ...existingMaps])];
  const guest = { ...loaded, name, maps };
  const mapsChanged = maps.length !== existingMaps.length || maps.some((map, i) => map !== existingMaps[i]);

  // Persist generated/migrated fields so a guest keeps the same identity and
  // map ownership on future visits without creating a database profile.
  if (name !== loaded.name || mapsChanged) {
    saveGuest(guest, store);
  }
  return guest;
}

export interface GuestProgressSnapshot {
  stats: GameStats;
  riddleStats: GameStats;
  upgrades: Upgrades;
  upgradeGames: number;
  powerups: Record<string, number>;
  maps: string[];
  cosmetics: string[];
  character: CharacterLoadout;
}

export function loadGuestProgress(store?: Storage): GuestProgressSnapshot {
  const guest = loadGuest(store);
  return {
    stats: loadStats(store),
    riddleStats: loadRiddleStats(store),
    upgrades: guest.upgrades,
    upgradeGames: guest.upgradeGames,
    powerups: guest.powerups,
    maps: guest.maps,
    cosmetics: guest.cosmetics,
    character: guest.character,
  };
}

function hasStats(stats: GameStats): boolean {
  return (
    stats.bestScore > 0 ||
    stats.longestSurvivalMs > 0 ||
    stats.highestWpm > 0 ||
    stats.bestAccuracy > 0 ||
    stats.totalKills > 0 ||
    stats.bossesDefeated > 0 ||
    stats.longestStreak > 0 ||
    stats.coinsEarned > 0 ||
    stats.totalCoins > 0 ||
    stats.gamesPlayed > 0 ||
    Object.values(stats.missedWords ?? {}).some((count) => count > 0)
  );
}

/** Whether there is meaningful local progress worth transferring to an account. */
export function hasGuestProgress(progress: GuestProgressSnapshot): boolean {
  return (
    hasStats(progress.stats) ||
    hasStats(progress.riddleStats) ||
    Object.values(progress.upgrades).some((level) => level > 0) ||
    progress.upgradeGames > 0 ||
    Object.values(progress.powerups).some((count) => count > 0) ||
    progress.maps.some((map) => map !== 'graveyard') ||
    progress.cosmetics.some((key) => !DEFAULT_COSMETICS.includes(key)) ||
    Object.entries(DEFAULT_CHARACTER).some(
      ([key, value]) => progress.character[key as keyof CharacterLoadout] !== value,
    )
  );
}

/** Remove only transferred progress; device-local settings remain unchanged. */
export function clearGuestProgress(store?: Storage): void {
  const s = getStore(store);
  if (!s) return;
  try {
    s.removeItem(KEYS.stats);
    s.removeItem(KEYS.riddleStats);
    s.removeItem(KEYS.guest);
  } catch {
    /* access blocked */
  }
}

export const loadHighScores = (store?: Storage) => loadJSON<HighScore[]>(KEYS.highscores, [], store);

export function addHighScore(score: HighScore, store?: Storage, limit = 10): HighScore[] {
  const list = loadHighScores(store);
  list.push(score);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, limit);
  saveJSON(KEYS.highscores, trimmed, store);
  return trimmed;
}

/** Merge a finished run's results into the lifetime stats and persist. */
export function mergeRunIntoStats(
  prev: GameStats,
  run: {
    score: number;
    survivalMs: number;
    wpm: number;
    accuracy: number;
    kills: number;
    bossesDefeated: number;
    streak: number;
    coins: number;
    missedWords: Record<string, number>;
  },
): GameStats {
  const missedWords = { ...prev.missedWords };
  for (const [word, count] of Object.entries(run.missedWords)) {
    missedWords[word] = (missedWords[word] ?? 0) + count;
  }
  return {
    bestScore: Math.max(prev.bestScore, run.score),
    longestSurvivalMs: Math.max(prev.longestSurvivalMs, run.survivalMs),
    highestWpm: Math.max(prev.highestWpm, run.wpm),
    bestAccuracy: Math.max(prev.bestAccuracy, run.accuracy),
    totalKills: prev.totalKills + run.kills,
    bossesDefeated: prev.bossesDefeated + run.bossesDefeated,
    longestStreak: Math.max(prev.longestStreak, run.streak),
    coinsEarned: (prev.coinsEarned ?? 0) + run.coins,
    totalCoins: prev.totalCoins + run.coins,
    gamesPlayed: prev.gamesPlayed + 1,
    missedWords,
  };
}

export interface DailyRecord {
  date: string;
  best: number;
}

export function loadDailyBest(date: string, store?: Storage): number {
  const rec = loadJSON<DailyRecord | null>(KEYS.daily, null, store);
  return rec && rec.date === date ? rec.best : 0;
}

export function saveDailyBest(date: string, score: number, store?: Storage): number {
  const current = loadDailyBest(date, store);
  const best = Math.max(current, score);
  saveJSON<DailyRecord>(KEYS.daily, { date, best }, store);
  return best;
}

export const STORAGE_KEYS = KEYS;
