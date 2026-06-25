import { describe, expect, it } from 'vitest';
import { CONNECTION_GAME_DELAY_MS, scoreSignalKey } from './ConnectingScreen';

describe('cold-start signal game', () => {
  it('starts after four seconds', () => {
    expect(CONNECTION_GAME_DELAY_MS).toBe(4_000);
  });

  it('scores matching keys and builds a streak', () => {
    expect(scoreSignalKey('D', 'd', 200, 2, 1)).toEqual({
      score: 350,
      streak: 3,
      misses: 1,
      hit: true,
    });
  });

  it('counts a breach and breaks the streak on a miss', () => {
    expect(scoreSignalKey('D', 'x', 200, 4, 1)).toEqual({
      score: 200,
      streak: 0,
      misses: 2,
      hit: false,
    });
  });
});
