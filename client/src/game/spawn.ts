// ---------------------------------------------------------------------------
// Zombie spawning. Zombies carry no words — they just have HP, and each shot
// (a completed word) deals one hit to the nearest zombie.
// ---------------------------------------------------------------------------
import type { Zombie, ZombieType } from '../types';
import { uid, randRange } from '../lib/utils';

export interface SpawnContext {
  rng: () => number;
  width: number;
  wave: number;
  speed: number;
}

/** Weighted pool of zombie types that becomes nastier as waves climb. */
export function zombieTypeForWave(rng: () => number, wave: number): ZombieType {
  const table: Array<[ZombieType, number]> = [
    ['walker', 5],
    ['crawler', wave >= 2 ? 3 : 1],
    ['runner', wave >= 2 ? 4 : 1],
    ['screamer', wave >= 3 ? 2 : 0],
    ['glitch', wave >= 4 ? 2 : 0],
    ['armored', wave >= 4 ? 2 : 0],
    ['tank', wave >= 3 ? 2 : 0],
  ];
  const total = table.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [type, weight] of table) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return 'walker';
}

interface Spec {
  speedMul: number;
  hp: number;
  size: number;
  damage: number;
  reward: { score: number; coins: number; xp: number };
}

const SPECS: Record<Exclude<ZombieType, 'boss'>, Spec> = {
  walker: { speedMul: 1, hp: 2, size: 34, damage: 10, reward: { score: 100, coins: 6, xp: 10 } },
  runner: { speedMul: 1.8, hp: 2, size: 26, damage: 8, reward: { score: 80, coins: 4, xp: 8 } },
  crawler: { speedMul: 0.9, hp: 2, size: 18, damage: 6, reward: { score: 60, coins: 3, xp: 6 } },
  tank: { speedMul: 0.55, hp: 6, size: 56, damage: 25, reward: { score: 300, coins: 18, xp: 30 } },
  screamer: { speedMul: 0.8, hp: 4, size: 38, damage: 14, reward: { score: 160, coins: 10, xp: 16 } },
  glitch: { speedMul: 1, hp: 3, size: 34, damage: 12, reward: { score: 140, coins: 8, xp: 14 } },
  armored: { speedMul: 0.7, hp: 4, size: 44, damage: 18, reward: { score: 240, coins: 15, xp: 24 } },
};

export function createZombie(type: ZombieType, ctx: SpawnContext): Zombie {
  const { rng, width } = ctx;
  const spec = SPECS[type as Exclude<ZombieType, 'boss'>] ?? SPECS.walker;
  const z: Zombie = {
    id: uid('z'),
    type,
    x: randRange(rng, 60, Math.max(80, width - 60)),
    y: 0,
    speed: ctx.speed * spec.speedMul,
    hp: spec.hp,
    maxHp: spec.hp,
    size: spec.size,
    damage: spec.damage,
    reward: spec.reward,
    hitFlash: 0,
  };
  if (type === 'screamer') {
    z.spawnTimer = 4.5;
    z.spawnsLeft = 2;
  }
  return z;
}

/** Build the small adds spawned by a Screamer. */
export function createScreamerAdd(parent: Zombie, ctx: SpawnContext): Zombie {
  return {
    id: uid('z'),
    type: 'runner',
    x: Math.min(ctx.width - 40, Math.max(40, parent.x + randRange(ctx.rng, -60, 60))),
    y: parent.y,
    speed: parent.speed * 1.4,
    hp: 2,
    maxHp: 2,
    size: 22,
    damage: 6,
    reward: { score: 50, coins: 2, xp: 4 },
    hitFlash: 0,
  };
}
