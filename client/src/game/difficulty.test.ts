import { describe, it, expect } from 'vitest';
import {
  getDifficultyConfig,
  waveSpeed,
  waveSpawnInterval,
  waveZombieCount,
  wordTierForWave,
  isBossWave,
} from './difficulty';

describe('difficulty scaling', () => {
  const cfg = getDifficultyConfig('normal');

  it('speed increases with waves', () => {
    expect(waveSpeed(cfg, 2)).toBeGreaterThan(waveSpeed(cfg, 1));
  });
  it('speed is clamped to the max', () => {
    expect(waveSpeed(cfg, 1000)).toBe(cfg.maxSpeed);
  });
  it('spawn interval shrinks but never below the floor', () => {
    expect(waveSpawnInterval(cfg, 2)).toBeLessThan(waveSpawnInterval(cfg, 1));
    expect(waveSpawnInterval(cfg, 1000)).toBe(cfg.spawnIntervalMin);
  });
  it('more zombies each wave', () => {
    expect(waveZombieCount(cfg, 3)).toBeGreaterThan(waveZombieCount(cfg, 1));
  });
  it('harder difficulties are faster', () => {
    expect(getDifficultyConfig('nightmare').baseSpeed).toBeGreaterThan(
      getDifficultyConfig('easy').baseSpeed,
    );
  });
});

describe('word tiers & boss waves', () => {
  it('escalates word difficulty by wave', () => {
    expect(wordTierForWave(1)).toBe('easy');
    expect(wordTierForWave(4)).toBe('medium');
    expect(wordTierForWave(9)).toBe('hard');
  });
  it('bias shifts the tier upward', () => {
    expect(wordTierForWave(1, 2)).toBe('medium');
  });
  it('boss waves are every 5th', () => {
    expect(isBossWave(5)).toBe(true);
    expect(isBossWave(10)).toBe(true);
    expect(isBossWave(4)).toBe(false);
    expect(isBossWave(0)).toBe(false);
  });
});
