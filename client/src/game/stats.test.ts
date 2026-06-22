import { describe, it, expect } from 'vitest';
import {
  calcAccuracy,
  calcWpm,
  bumpStreak,
  breakStreak,
  isHeadshot,
  headshotThresholdMs,
} from './stats';

describe('calcAccuracy', () => {
  it('is 100 with no attempts', () => {
    expect(calcAccuracy(0, 0)).toBe(100);
  });
  it('computes a percentage', () => {
    expect(calcAccuracy(9, 1)).toBe(90);
    expect(calcAccuracy(3, 1)).toBe(75);
  });
  it('rounds to one decimal', () => {
    expect(calcAccuracy(2, 1)).toBeCloseTo(66.7, 1);
  });
});

describe('calcWpm', () => {
  it('is 0 with no elapsed time', () => {
    expect(calcWpm(100, 0)).toBe(0);
  });
  it('uses the 5-chars-per-word convention', () => {
    // 50 chars in 60s => 10 "words" per minute
    expect(calcWpm(50, 60000)).toBe(10);
  });
  it('scales with time', () => {
    expect(calcWpm(50, 30000)).toBe(20);
  });
});

describe('streaks', () => {
  it('bumps up', () => {
    expect(bumpStreak(4)).toBe(5);
  });
  it('resets fully in strict mode', () => {
    expect(breakStreak(10, true)).toBe(0);
  });
  it('halves forgivingly otherwise', () => {
    expect(breakStreak(10, false)).toBe(5);
    expect(breakStreak(5, false)).toBe(2);
  });
});

describe('headshot', () => {
  it('threshold grows with word length', () => {
    expect(headshotThresholdMs(10)).toBeGreaterThan(headshotThresholdMs(3));
  });
  it('is a headshot when cleared quickly', () => {
    expect(isHeadshot(4, 300)).toBe(true);
  });
  it('is not a headshot when slow', () => {
    expect(isHeadshot(4, 5000)).toBe(false);
  });
  it('requires a positive time', () => {
    expect(isHeadshot(4, 0)).toBe(false);
  });
});
