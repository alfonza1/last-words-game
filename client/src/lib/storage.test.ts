import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_STATS,
  loadRiddleStats,
  loadStats,
  saveRiddleStats,
  saveStats,
  loadUpgrades,
  saveUpgrades,
  loadSettings,
  saveSettings,
  addHighScore,
  loadHighScores,
  mergeRunIntoStats,
  DEFAULT_UPGRADES,
  generateGuestName,
  loadGuest,
  saveGuest,
  clearGuestProgress,
  hasGuestProgress,
  loadGuestProgress,
  STORAGE_KEYS,
} from './storage';

/** Minimal in-memory Storage for deterministic tests. */
class MemStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
}

let store: MemStorage;
beforeEach(() => {
  store = new MemStorage();
});

describe('save/load round trips', () => {
  it('returns defaults when empty', () => {
    expect(loadStats(store)).toEqual(DEFAULT_STATS);
    expect(loadUpgrades(store)).toEqual(DEFAULT_UPGRADES);
    expect(loadHighScores(store)).toEqual([]);
  });
  it('persists and reloads stats', () => {
    const s = { ...DEFAULT_STATS, bestScore: 1234 };
    saveStats(s, store);
    expect(loadStats(store).bestScore).toBe(1234);
  });
  it('does not keep WPM records for solver stats', () => {
    saveRiddleStats({ ...DEFAULT_STATS, highestWpm: 90 }, store);
    expect(loadRiddleStats(store).highestWpm).toBe(0);
    expect(JSON.parse(store.getItem(STORAGE_KEYS.riddleStats)!).highestWpm).toBe(0);
  });
  it('merges new default fields into older saves', () => {
    store.setItem('ztr.settings', JSON.stringify({ difficulty: 'nightmare' }));
    const loaded = loadSettings(store);
    expect(loaded.difficulty).toBe('nightmare');
    expect(loaded.screenShake).toBe(true); // filled from defaults
    expect(loaded.music).toBe(true); // filled from defaults
  });
  it('persists upgrades and settings', () => {
    saveUpgrades({ ...DEFAULT_UPGRADES, maxHealth: 3 }, store);
    expect(loadUpgrades(store).maxHealth).toBe(3);
    saveSettings({ ...loadSettings(store), music: false }, store);
    expect(loadSettings(store).music).toBe(false);
  });
});

describe('guest profile', () => {
  it('generates a five-digit survivor name', () => {
    expect(generateGuestName(() => 0.12141)).toBe('Survivor12141');
    expect(generateGuestName(() => 0)).toBe('Survivor00000');
  });

  it('persists a generated name and starter map for legacy guests', () => {
    store.setItem('ztr.guest', JSON.stringify({ cosmetics: ['shirt_survivor'] }));

    const first = loadGuest(store);
    const second = loadGuest(store);

    expect(first.name).toMatch(/^Survivor\d{5}$/);
    expect(second.name).toBe(first.name);
    expect(second.maps).toEqual(['graveyard']);
    expect(second.cosmetics).toEqual(['shirt_survivor']);

    saveGuest({ ...second, maps: [...second.maps, 'city'] }, store);
    expect(loadGuest(store).maps).toEqual(['graveyard', 'city']);
  });

  it('persists a selected face expression', () => {
    const guest = loadGuest(store);
    saveGuest({ ...guest, character: { ...guest.character, expression: 'blood-rush' } }, store);

    expect(loadGuest(store).character.expression).toBe('blood-rush');
  });

  it('detects and clears transferable progress while preserving settings', () => {
    const empty = loadGuestProgress(store);
    expect(hasGuestProgress(empty)).toBe(false);

    saveStats({ ...DEFAULT_STATS, totalCoins: 350, gamesPlayed: 2 }, store);
    saveSettings({ ...loadSettings(store), music: false }, store);
    saveGuest({ ...loadGuest(store), maps: ['graveyard', 'city'] }, store);

    const progress = loadGuestProgress(store);
    expect(hasGuestProgress(progress)).toBe(true);
    expect(progress.stats.totalCoins).toBe(350);
    expect(progress.maps).toContain('city');

    clearGuestProgress(store);
    expect(loadStats(store)).toEqual(DEFAULT_STATS);
    expect(loadGuest(store).maps).toEqual(['graveyard']);
    expect(loadSettings(store).music).toBe(false);
  });
});

describe('high scores', () => {
  it('keeps a sorted, capped leaderboard', () => {
    for (const score of [100, 500, 300, 900, 50]) {
      addHighScore({ score, wave: 1, wpm: 0, accuracy: 100, date: '' }, store, 3);
    }
    const list = loadHighScores(store);
    expect(list.map((h) => h.score)).toEqual([900, 500, 300]);
  });
});

describe('mergeRunIntoStats', () => {
  it('accumulates totals and tracks records', () => {
    const merged = mergeRunIntoStats(DEFAULT_STATS, {
      score: 500,
      survivalMs: 30000,
      wpm: 60,
      accuracy: 95,
      kills: 12,
      bossesDefeated: 1,
      streak: 20,
      coins: 40,
      style: 'typing',
    });
    expect(merged.bestScore).toBe(500);
    expect(merged.totalKills).toBe(12);
    expect(merged.totalCoins).toBe(40);
    expect(merged.gamesPlayed).toBe(1);
    expect(merged.bestMode).toBe('typing');

    const again = mergeRunIntoStats(merged, {
      score: 200,
      survivalMs: 10000,
      wpm: 70,
      accuracy: 90,
      kills: 3,
      bossesDefeated: 0,
      streak: 5,
      coins: 10,
      style: 'riddles',
    });
    expect(again.bestScore).toBe(500); // keeps the higher
    expect(again.highestWpm).toBe(60); // solver modes do not track WPM
    expect(again.totalKills).toBe(15);
    expect(again.gamesPlayed).toBe(2);
    expect(again.bestMode).toBe('typing');
  });
});

describe('legacy weak-word cleanup', () => {
  it('removes retired weak-word data when stats are loaded', () => {
    store.setItem(STORAGE_KEYS.stats, JSON.stringify({
      ...DEFAULT_STATS,
      bestScore: 100,
      missedWords: { wold: 1 },
    }));

    const loaded = loadStats(store);

    expect(loaded.bestScore).toBe(100);
    expect(loaded).not.toHaveProperty('missedWords');
    expect(JSON.parse(store.getItem(STORAGE_KEYS.stats)!)).not.toHaveProperty('missedWords');
  });
});
