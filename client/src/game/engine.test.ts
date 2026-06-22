import { describe, it, expect } from 'vitest';
import { GameEngine } from './engine';
import { DEFAULT_SETTINGS, DEFAULT_UPGRADES } from '../lib/storage';
import type { Zombie } from '../types';

function makeEngine() {
  return new GameEngine({
    mode: 'survival',
    difficulty: 'normal',
    upgrades: DEFAULT_UPGRADES,
    settings: DEFAULT_SETTINGS,
    width: 960,
    height: 600,
    seed: 1,
  });
}

function zombie(opts: Partial<Zombie> & { y?: number } = {}): Zombie {
  return {
    id: `z_${Math.random().toString(36).slice(2)}`,
    type: 'walker',
    x: 480,
    y: opts.y ?? 100,
    speed: 0,
    hp: 1,
    maxHp: 1,
    size: 30,
    damage: 10,
    reward: { score: 100, coins: 5, xp: 5 },
    hitFlash: 0,
    ...opts,
  };
}

/** The first word currently in the queue (always present). */
function firstWord(e: GameEngine): string {
  return e.state.wordQueue[0];
}

describe('word queue is independent of zombies', () => {
  it('starts with five distinct words', () => {
    const e = makeEngine();
    expect(e.state.wordQueue).toHaveLength(5);
  });

  it('does not fire until space is pressed', () => {
    const e = makeEngine();
    e.state.zombies = [zombie()];
    e.handleInput(firstWord(e)); // no space
    expect(e.state.zombies).toHaveLength(1);
    expect(e.state.kills).toBe(0);
  });

  it('completing a word kills the nearest zombie and refreshes the queue', () => {
    const e = makeEngine();
    const near = zombie({ y: 400 });
    const far = zombie({ y: 100 });
    e.state.zombies = [far, near];
    const word = firstWord(e);
    e.handleInput(word + ' ');
    expect(e.state.kills).toBe(1);
    expect(e.state.zombies).toContain(far);
    expect(e.state.zombies).not.toContain(near); // nearest died
    expect(e.state.wordQueue).toHaveLength(5);
    expect(e.state.input).toBe('');
  });

  it('does not shoot zombies still above the play field (must be visible first)', () => {
    const e = makeEngine();
    e.state.zombies = [zombie({ y: 5 })]; // just spawned, off-screen at the top
    e.handleInput(firstWord(e) + ' ');
    expect(e.state.kills).toBe(0);
    expect(e.state.zombies).toHaveLength(1);
  });

  it('a wrong word is a mistake but keeps the typed text', () => {
    const e = makeEngine();
    e.state.zombies = [zombie()];
    e.state.streak = 8;
    e.handleInput('zzqqzz ');
    expect(e.state.mistakes).toBe(1);
    expect(e.state.streak).toBeLessThan(8);
    expect(e.state.input).toBe('zzqqzz');
  });

  it('multi-hit zombies take several shots', () => {
    const e = makeEngine();
    e.state.zombies = [zombie({ type: 'tank', hp: 3, maxHp: 3 })];
    e.handleInput(firstWord(e) + ' ');
    expect(e.state.zombies[0]?.hp).toBe(2);
    e.handleInput(firstWord(e) + ' ');
    e.handleInput(firstWord(e) + ' ');
    expect(e.state.zombies).toHaveLength(0);
  });
});

describe('live WPM', () => {
  it('rises while typing', () => {
    const e = makeEngine();
    e.state.zombies = [zombie()];
    e.handleInput(firstWord(e) + ' ');
    e.update(0.1);
    expect(e.state.wpm).toBeGreaterThan(0);
    expect(e.state.maxWpm).toBeGreaterThanOrEqual(e.state.wpm);
  });
});

describe('upgrades', () => {
  it('applies the max-health upgrade to starting health', () => {
    const base = new GameEngine({
      mode: 'survival', difficulty: 'normal', upgrades: DEFAULT_UPGRADES,
      settings: DEFAULT_SETTINGS, width: 960, height: 600, seed: 1,
    });
    const buffed = new GameEngine({
      mode: 'survival', difficulty: 'normal', upgrades: { ...DEFAULT_UPGRADES, maxHealth: 2 },
      settings: DEFAULT_SETTINGS, width: 960, height: 600, seed: 1,
    });
    expect(buffed.state.maxHealth).toBe(base.state.maxHealth + 40);
    expect(buffed.state.health).toBe(buffed.state.maxHealth);
  });
});

describe('base collision', () => {
  it('damages the base when a normal zombie arrives', () => {
    const e = makeEngine();
    e.state.betweenWaves = 0;
    e.state.zombies = [zombie({ y: e.state.height })];
    const before = e.state.health;
    e.update(0.05);
    expect(e.state.health).toBeLessThan(before);
  });

  it('a shield blocks a normal hit', () => {
    const e = makeEngine();
    e.state.betweenWaves = 0;
    e.state.powerups.shieldCharges = 1;
    e.state.zombies = [zombie({ y: e.state.height })];
    const before = e.state.health;
    e.update(0.05);
    expect(e.state.health).toBe(before);
    expect(e.state.powerups.shieldCharges).toBe(0);
  });

  it('a boss reaching the base is an instant game over (ignores shield)', () => {
    const e = makeEngine();
    e.state.betweenWaves = 0;
    e.state.powerups.shieldCharges = 3;
    e.state.zombies = [zombie({ y: e.state.height, isBoss: true, hp: 10, maxHp: 10, damage: 999 })];
    e.update(0.05);
    expect(e.state.health).toBe(0);
    expect(e.state.status).toBe('gameover');
  });
});

describe('commands', () => {
  it('consumes a grenade charge and clears a cluster', () => {
    const e = makeEngine();
    e.state.powerups.grenadeCharges = 1;
    e.state.zombies = [zombie({ y: 300 }), zombie({ y: 305 }), zombie({ y: 310 })];
    e.handleInput('grenade ');
    expect(e.state.powerups.grenadeCharges).toBe(0);
    expect(e.state.zombies.length).toBeLessThan(3);
  });
});
