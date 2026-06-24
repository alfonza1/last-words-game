// ---------------------------------------------------------------------------
// Difficulty configuration & wave scaling. Pure & unit-tested.
// ---------------------------------------------------------------------------
import type { Difficulty } from '../types';
import type { WordTier } from '../data/words';

export interface DifficultyConfig {
  label: string;
  baseSpeed: number; // px/sec at wave 1
  speedPerWave: number; // px/sec added each wave
  maxSpeed: number;
  spawnInterval: number; // seconds between spawns at wave 1
  spawnIntervalMin: number;
  spawnAccel: number; // seconds shaved per wave
  baseZombies: number; // zombies in wave 1
  zombiesPerWave: number;
  startHealth: number;
  powerupChance: number; // 0..1 chance a kill yields a bonus opportunity
  strict: boolean;
  wordLengthBias: number; // shifts the word tier upward
  coinMult: number; // multiplies coins earned (harder = richer)
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    baseSpeed: 22,
    speedPerWave: 3,
    maxSpeed: 95,
    spawnInterval: 2.6,
    spawnIntervalMin: 1.1,
    spawnAccel: 0.12,
    baseZombies: 5,
    zombiesPerWave: 2,
    startHealth: 120,
    powerupChance: 0.35,
    strict: false,
    wordLengthBias: -1,
    coinMult: 1,
  },
  normal: {
    label: 'Normal',
    baseSpeed: 30,
    speedPerWave: 4,
    maxSpeed: 125,
    spawnInterval: 2.1,
    spawnIntervalMin: 0.85,
    spawnAccel: 0.14,
    baseZombies: 6,
    zombiesPerWave: 2,
    startHealth: 100,
    powerupChance: 0.25,
    strict: false,
    wordLengthBias: 0,
    coinMult: 1,
  },
  nightmare: {
    label: 'Nightmare',
    baseSpeed: 38,
    speedPerWave: 5,
    maxSpeed: 160,
    spawnInterval: 1.35,
    spawnIntervalMin: 0.5,
    spawnAccel: 0.18,
    baseZombies: 8,
    zombiesPerWave: 3,
    startHealth: 80,
    powerupChance: 0.1,
    strict: true,
    wordLengthBias: 2,
    coinMult: 2, // Nightmare pays double
  },
};

export function getDifficultyConfig(d: Difficulty): DifficultyConfig {
  return DIFFICULTY_CONFIGS[d];
}

export function waveSpeed(cfg: DifficultyConfig, wave: number): number {
  return Math.min(cfg.maxSpeed, cfg.baseSpeed + cfg.speedPerWave * (wave - 1));
}

export function waveSpawnInterval(cfg: DifficultyConfig, wave: number): number {
  return Math.max(cfg.spawnIntervalMin, cfg.spawnInterval - cfg.spawnAccel * (wave - 1));
}

export function waveZombieCount(cfg: DifficultyConfig, wave: number): number {
  return cfg.baseZombies + cfg.zombiesPerWave * (wave - 1);
}

/** Determine the dominant word tier for a given wave + difficulty. */
export function wordTierForWave(wave: number, bias = 0): WordTier {
  const level = wave + bias;
  if (level <= 2) return 'easy';
  if (level <= 6) return 'medium';
  return 'hard';
}

export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % 5 === 0;
}
