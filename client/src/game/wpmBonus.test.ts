import { describe, expect, it } from 'vitest';
import { calculateWpmBonus } from './wpmBonus';

describe('WPM bonus', () => {
  it('does not award a bonus at or below 50 WPM', () => {
    expect(calculateWpmBonus(50, 'normal')).toEqual({ tiers: 0, coins: 0, score: 0 });
    expect(calculateWpmBonus(49, 'nightmare')).toEqual({ tiers: 0, coins: 0, score: 0 });
  });

  it('awards one tier for every full 10 WPM above 50', () => {
    expect(calculateWpmBonus(60, 'easy')).toEqual({ tiers: 1, coins: 10, score: 100 });
    expect(calculateWpmBonus(70, 'normal')).toEqual({ tiers: 2, coins: 40, score: 500 });
    expect(calculateWpmBonus(90, 'nightmare')).toEqual({ tiers: 4, coins: 200, score: 2000 });
  });

  it('uses full tiers only', () => {
    expect(calculateWpmBonus(84, 'normal')).toEqual({ tiers: 3, coins: 60, score: 750 });
  });
});
