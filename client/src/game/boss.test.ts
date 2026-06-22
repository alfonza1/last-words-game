import { describe, it, expect } from 'vitest';
import { createBossZombie, bossHealthFraction, bossHp, pickBoss } from './boss';
import { BOSSES } from '../data/bosses';
import { mulberry32 } from '../lib/utils';

describe('boss creation', () => {
  const def = BOSSES[0];
  const boss = createBossZombie(def, 100, 30, 5);

  it('is a high-HP boss zombie', () => {
    expect(boss.isBoss).toBe(true);
    expect(boss.bossName).toBe(def.name);
    expect(boss.hp).toBe(bossHp(5));
    expect(boss.hp).toBe(boss.maxHp);
  });

  it('scales HP with the wave', () => {
    expect(bossHp(10)).toBeGreaterThan(bossHp(5));
  });

  it('reports full health initially and zero when drained', () => {
    expect(bossHealthFraction(boss)).toBe(1);
    expect(bossHealthFraction({ ...boss, hp: 0 })).toBe(0);
    expect(bossHealthFraction({ ...boss, hp: boss.maxHp / 2 })).toBeCloseTo(0.5, 5);
  });

  it('deals lethal base damage (instant kill on reaching the base)', () => {
    expect(boss.damage).toBeGreaterThan(100);
  });
});

describe('pickBoss', () => {
  it('is deterministic for a seeded rng', () => {
    expect(pickBoss(mulberry32(42)).id).toBe(pickBoss(mulberry32(42)).id);
  });
});
