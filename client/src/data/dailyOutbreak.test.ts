import { describe, expect, it } from 'vitest';
import { getDailyOutbreak } from './dailyOutbreak';

describe('getDailyOutbreak', () => {
  it('returns the same challenge for the same local date', () => {
    const date = new Date(2026, 5, 28);
    expect(getDailyOutbreak(date)).toEqual(getDailyOutbreak(date));
  });

  it('keeps boss-rush dailies normal and on the arena map', () => {
    const daily = getDailyOutbreak(new Date(2026, 5, 7));
    expect(daily.mode).toBe('bossrush');
    expect(daily.difficulty).toBe('normal');
    expect(daily.mapId).toBe('arena');
  });
});

