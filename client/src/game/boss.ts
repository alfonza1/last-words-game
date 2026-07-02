// ---------------------------------------------------------------------------
// Boss creation. Bosses are large HP sponges; reaching the base is an instant
// game over (handled in the engine). Pure helpers — unit-tested.
// ---------------------------------------------------------------------------
import type { Zombie } from '../types';
import { BOSSES, type BossDef } from '../data/bosses';
import { uid } from '../lib/utils';

/** Pick a boss deterministically from a 0..1 random source. */
export function pickBoss(rng: () => number): BossDef {
  return BOSSES[Math.floor(rng() * BOSSES.length)];
}

/** Hits required to drop a boss, scaling with the wave. */
export function bossHp(wave: number): number {
  return 10 + Math.floor(wave * 1.5);
}

export function createBossZombie(def: BossDef, x: number, speed: number, wave: number): Zombie {
  const hp = bossHp(wave);
  return {
    id: uid('boss'),
    type: 'boss',
    x,
    y: 0,
    speed,
    hp,
    maxHp: hp,
    size: 64,
    damage: 999, // reaching the base is an instant kill
    reward: { score: 1000 + wave * 100, coins: 120 + wave * 10, xp: 200 },
    hitFlash: 0,
    isBoss: true,
    bossName: def.name,
    bossColor: def.color,
  };
}

/** Boss health as a 0..1 fraction of remaining HP. */
export function bossHealthFraction(z: Zombie): number {
  if (z.maxHp <= 0) return 0;
  return Math.max(0, z.hp / z.maxHp);
}
