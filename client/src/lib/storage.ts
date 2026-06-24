// ---------------------------------------------------------------------------
// localStorage persistence. Functions accept an injectable Storage for tests.
// ---------------------------------------------------------------------------
import type { GameStats, HighScore, Settings, Upgrades } from '../types';

const KEYS = {
  stats: 'ztr.stats',
  upgrades: 'ztr.upgrades',
  upgradeGames: 'ztr.upgradeGames',
  settings: 'ztr.settings',
  highscores: 'ztr.highscores',
  daily: 'ztr.daily',
} as const;

export const DEFAULT_STATS: GameStats = {
  bestScore: 0,
  longestSurvivalMs: 0,
  highestWpm: 0,
  bestAccuracy: 0,
  totalKills: 0,
  bossesDefeated: 0,
  longestStreak: 0,
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

export const loadUpgrades = (store?: Storage) => loadJSON(KEYS.upgrades, DEFAULT_UPGRADES, store);
export const saveUpgrades = (v: Upgrades, store?: Storage) => saveJSON(KEYS.upgrades, v, store);

/** Games remaining before purchased upgrades expire (0 = expired). */
export const loadUpgradeGames = (store?: Storage) => loadJSON<number>(KEYS.upgradeGames, 0, store);
export const saveUpgradeGames = (v: number, store?: Storage) => saveJSON(KEYS.upgradeGames, v, store);

export const loadSettings = (store?: Storage) => loadJSON(KEYS.settings, DEFAULT_SETTINGS, store);
export const saveSettings = (v: Settings, store?: Storage) => saveJSON(KEYS.settings, v, store);

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
