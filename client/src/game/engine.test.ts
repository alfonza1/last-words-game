import { describe, it, expect } from 'vitest';
import { GameEngine } from './engine';
import { DEFAULT_SETTINGS, DEFAULT_UPGRADES } from '../lib/storage';
import type { Zombie } from '../types';

function makeEngine() {
  const engine = new GameEngine({
    mode: 'survival',
    difficulty: 'normal',
    upgrades: DEFAULT_UPGRADES,
    settings: DEFAULT_SETTINGS,
    width: 960,
    height: 600,
    seed: 1,
  });
  engine.state.wave = 1;
  engine.state.betweenWaves = 0;
  engine.state.waveZombiesToSpawn = 1;
  engine.state.waveZombiesSpawned = 1;
  return engine;
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
    expect(e.state.survivorShot).toMatchObject({ x: near.x, y: near.y });
  });

  it('spawns the next zombie immediately when a completed word finds an empty field', () => {
    const e = makeEngine();
    e.state.waveZombiesToSpawn = 3;
    e.state.waveZombiesSpawned = 1;
    e.state.zombies = [];

    e.handleInput(firstWord(e) + ' ');

    expect(e.state.kills).toBe(0);
    expect(e.state.shotsFired).toBe(0);
    expect(e.state.zombies).toHaveLength(1);
    expect(e.state.waveZombiesSpawned).toBe(2);
  });

  it('uses the following word to shoot the zombie that was pulled in', () => {
    const e = makeEngine();
    e.state.waveZombiesToSpawn = 3;
    e.state.waveZombiesSpawned = 1;
    e.state.zombies = [];

    e.handleInput(firstWord(e) + ' ');
    const spawnedId = e.state.zombies[0]?.id;
    e.handleInput(firstWord(e) + ' ');

    expect(e.state.correctWords).toBe(2);
    expect(e.state.kills).toBe(1);
    expect(e.state.shotsFired).toBe(1);
    expect(e.state.zombies).toHaveLength(1);
    expect(e.state.zombies[0]?.id).not.toBe(spawnedId);
  });

  it('locks input as soon as the final zombie clears the wave', () => {
    const e = makeEngine();
    e.state.zombies = [zombie({ y: 400 })];
    const word = firstWord(e);
    e.handleInput(word + ' ');

    expect(e.state.kills).toBe(1);
    expect(e.state.betweenWaves).toBeGreaterThan(0);
    const correctWords = e.state.correctWords;

    e.handleInput(firstWord(e) + ' ');

    expect(e.state.correctWords).toBe(correctWords);
    expect(e.state.input).toBe('');
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

  it('multi-hit zombies take several shots (each word does 2 damage)', () => {
    const e = makeEngine();
    e.state.zombies = [zombie({ type: 'tank', hp: 6, maxHp: 6, y: 400 })];
    e.handleInput(firstWord(e) + ' ');
    expect(e.state.zombies[0]?.hp).toBe(4);
    e.handleInput(firstWord(e) + ' ');
    e.handleInput(firstWord(e) + ' ');
    expect(e.state.zombies).toHaveLength(0);
  });
});

describe('riddle mode', () => {
  function riddleEngine() {
    return new GameEngine({
      mode: 'survival', difficulty: 'normal', upgrades: DEFAULT_UPGRADES,
      settings: DEFAULT_SETTINGS, width: 960, height: 600, seed: 1, riddleMode: true,
    });
  }

  it('exposes a prompt and hides the answer behind it', () => {
    const e = riddleEngine();
    expect(e.state.riddleMode).toBe(true);
    expect(e.state.riddlePrompt).toBeTruthy();
    expect(e.state.wordQueue[0]).toBeTruthy(); // the answer lives here
  });

  it('solving a riddle fires a volley (normal = 8 kills) and refreshes the prompt', () => {
    const e = riddleEngine();
    const prompt = e.state.riddlePrompt;
    e.state.zombies = Array.from({ length: 12 }, () => zombie({ y: 400 }));
    e.handleInput(firstWord(e) + ' '); // type the answer
    expect(e.state.kills).toBe(8); // riddleKills for normal
    expect(e.state.zombies).toHaveLength(4);
    expect(e.state.input).toBe('');
    expect(e.state.riddlePrompt).not.toBe(prompt); // next riddle queued
  });

  it('a wrong answer is a mistake and keeps the typed text', () => {
    const e = riddleEngine();
    e.state.zombies = [zombie({ y: 400 })];
    e.handleInput('definitelywrong ');
    expect(e.state.mistakes).toBe(1);
    expect(e.state.kills).toBe(0);
    expect(e.state.input).toBe('definitelywrong');
    expect(e.inputWrong).toBe(false);
  });

  it('math style fires its own (smaller) volley — normal = 4 kills', () => {
    const e = new GameEngine({
      mode: 'survival', difficulty: 'normal', upgrades: DEFAULT_UPGRADES,
      settings: DEFAULT_SETTINGS, width: 960, height: 600, seed: 1,
      riddleMode: true, puzzleStyle: 'math',
    });
    expect(e.state.riddlePrompt).toBeTruthy(); // an equation
    e.state.zombies = Array.from({ length: 8 }, () => zombie({ y: 400 }));
    e.handleInput(firstWord(e) + ' '); // type the math answer
    expect(e.state.kills).toBe(4); // puzzleKills.math.normal
    expect(e.state.zombies).toHaveLength(4);
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

  it('does not fall during the wave-complete break', () => {
    const e = makeEngine();
    e.state.zombies = [zombie({ y: 400 })];
    e.handleInput(firstWord(e) + ' ');
    e.update(0.1);
    const beforeBreak = e.state.wpm;

    expect(e.state.betweenWaves).toBeGreaterThan(0);
    for (let i = 0; i < 20; i++) e.update(0.05);

    expect(e.state.wpm).toBe(beforeBreak);
    expect(e.state.elapsedMs).toBeGreaterThan(100);
  });
});

describe('difficulty rewards', () => {
  it('awards 1.25x on Normal and 2x on Nightmare', () => {
    const normal = makeEngine();
    const easy = new GameEngine({
      mode: 'survival',
      difficulty: 'easy',
      upgrades: DEFAULT_UPGRADES,
      settings: { ...DEFAULT_SETTINGS, difficulty: 'easy' },
      width: 960,
      height: 600,
      seed: 1,
    });
    const nightmare = new GameEngine({
      mode: 'survival',
      difficulty: 'nightmare',
      upgrades: DEFAULT_UPGRADES,
      settings: { ...DEFAULT_SETTINGS, difficulty: 'nightmare' },
      width: 960,
      height: 600,
      seed: 1,
    });
    easy.state.zombies = [zombie({ y: 400 })];
    normal.state.zombies = [zombie({ y: 400 })];
    nightmare.state.zombies = [zombie({ y: 400 })];

    easy.handleInput(firstWord(easy) + ' ');
    normal.handleInput(firstWord(normal) + ' ');
    nightmare.handleInput(firstWord(nightmare) + ' ');

    expect(easy.state.score).toBe(100);
    expect(easy.state.coins).toBe(4);
    expect(normal.state.score).toBe(125);
    expect(normal.state.coins).toBe(5);
    expect(nightmare.state.score).toBe(200);
    expect(nightmare.state.coins).toBe(8);
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

describe('powerups (consumables)', () => {
  it('consumes a grenade charge and clears a cluster', () => {
    const e = makeEngine();
    e.state.powerups.consumables.grenade = 1;
    e.state.zombies = [zombie({ y: 300 }), zombie({ y: 305 }), zombie({ y: 310 })];
    e.handleInput('grenade ');
    expect(e.state.powerups.consumables.grenade).toBe(0);
    expect(e.state.zombies.length).toBeLessThan(3);
  });

  it('ignores a powerup word when none are owned', () => {
    const e = makeEngine();
    e.state.powerups.consumables.grenade = 0;
    e.state.zombies = [zombie({ y: 300 }), zombie({ y: 305 })];
    e.handleInput('grenade ');
    expect(e.state.zombies.length).toBe(2); // no charge → no clear
  });
});
