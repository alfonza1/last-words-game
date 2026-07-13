import { describe, it, expect } from 'vitest';
import {
  getDifficultyConfig,
  waveSpeed,
  waveSpawnInterval,
  waveZombieCount,
  typingDefenseWaveZombieCount,
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
  it('doubles Easy Typing Defense waves only', () => {
    const easy = getDifficultyConfig('easy');
    const normal = getDifficultyConfig('normal');

    expect(typingDefenseWaveZombieCount(easy, 1)).toBe(waveZombieCount(easy, 1) * 2);
    expect(typingDefenseWaveZombieCount(normal, 1)).toBe(waveZombieCount(normal, 1));
  });
  it('harder difficulties are faster', () => {
    expect(getDifficultyConfig('nightmare').baseSpeed).toBeGreaterThan(
      getDifficultyConfig('easy').baseSpeed,
    );
  });
  it('Nightmare doubles both coins and score', () => {
    expect(getDifficultyConfig('nightmare').coinMult).toBe(2);
    expect(getDifficultyConfig('nightmare').scoreMult).toBe(2);
  });
  it('Normal pays 1.25x coins and score', () => {
    expect(getDifficultyConfig('normal').coinMult).toBe(1.25);
    expect(getDifficultyConfig('normal').scoreMult).toBe(1.25);
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
