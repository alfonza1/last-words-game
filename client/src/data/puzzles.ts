// ---------------------------------------------------------------------------
// Puzzle framework — the shared backbone for the non-typing play styles
// (Riddle / Math / Trivia Defense). Each "puzzle" shows a prompt and hides its
// answer; solving it fires a multi-kill volley.
//
// BALANCE ("even with typing"): an average typist does ~40 WPM ≈ one word every
// ~1.5s, i.e. ~0.67 kills/sec. To keep each puzzle style at the same kills/min,
// a solve must kill N = (avg solve time) / 1.5s zombies. Faster-to-solve styles
// therefore kill fewer per answer; harder difficulties (slower solves) kill more.
// Zombies are also slowed so the wall isn't overrun during the quiet think time —
// less slowdown for quick styles (shorter gaps), more for slow ones.
//
//   Style    Difficulty  ~Solve time  Kills (=t/1.5)  Speed mult
//   riddles  easy/nm/nm   8 / 12 / 18s    5 / 8 / 12      0.65
//   math     easy/nm/nm   4.5 / 6 / 9s    3 /  4 /  6      0.80
//   trivia   easy/nm/nm   4.5 / 7.5 / 12s 3 /  5 /  8      0.70
// ---------------------------------------------------------------------------
import type { Difficulty, PuzzleStyle } from '../types';
import type { WordTier } from './words';
import { RIDDLES, type Riddle } from './riddles';
import { TRIVIA } from './trivia';

export type Puzzle = Riddle; // { prompt, answer, accept? }

const KILLS: Record<PuzzleStyle, Record<Difficulty, number>> = {
  riddles: { easy: 5, normal: 8, nightmare: 12 },
  math: { easy: 3, normal: 4, nightmare: 6 },
  trivia: { easy: 3, normal: 5, nightmare: 8 },
};

const SPEED_MULT: Record<PuzzleStyle, number> = {
  riddles: 0.65,
  math: 0.8,
  trivia: 0.7,
};

/** Zombies killed per solved puzzle (kept ~even with typing's kills/min). */
export function puzzleKills(style: PuzzleStyle, difficulty: Difficulty): number {
  return KILLS[style][difficulty];
}

/** How much this style slows zombies (kills arrive in bursts after each solve). */
export function puzzleSpeedMult(style: PuzzleStyle): number {
  return SPEED_MULT[style];
}

const STYLE_LABEL: Record<PuzzleStyle, string> = {
  riddles: 'Riddle',
  math: 'Math',
  trivia: 'Trivia',
};

export function puzzleLabel(style: PuzzleStyle): string {
  return STYLE_LABEL[style];
}

/** Pick/generate one puzzle for the current style, difficulty and wave tier. */
export function makePuzzle(style: PuzzleStyle, rng: () => number, difficulty: Difficulty, tier: WordTier): Puzzle {
  if (style === 'math') return makeMath(rng, difficulty);
  const pool = style === 'trivia' ? TRIVIA[tier] : RIDDLES[tier];
  return pool[Math.floor(rng() * pool.length)];
}

// --- Math generator --------------------------------------------------------

function ri(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Generate an arithmetic puzzle scaled by difficulty (answers are always ≥ 0). */
function makeMath(rng: () => number, difficulty: Difficulty): Puzzle {
  if (difficulty === 'easy') {
    const a = ri(rng, 20, 99);
    const b = ri(rng, 20, 99);
    if (rng() < 0.5) return { prompt: `${a} + ${b}`, answer: String(a + b) };
    const [hi, lo] = a >= b ? [a, b] : [b, a];
    return { prompt: `${hi} − ${lo}`, answer: String(hi - lo) };
  }
  if (difficulty === 'normal') {
    const roll = rng();
    if (roll < 0.45) {
      const a = ri(rng, 2, 12);
      const b = ri(rng, 2, 12);
      return { prompt: `${a} × ${b}`, answer: String(a * b) };
    }
    if (roll < 0.75) {
      const a = ri(rng, 15, 50);
      const b = ri(rng, 5, a);
      return { prompt: `${a} − ${b}`, answer: String(a - b) };
    }
    const a = ri(rng, 10, 60);
    const b = ri(rng, 10, 60);
    return { prompt: `${a} + ${b}`, answer: String(a + b) };
  }
  // nightmare: bigger products, exact division, and order-of-operations
  const roll = rng();
  if (roll < 0.4) {
    const a = ri(rng, 11, 29);
    const b = ri(rng, 3, 9);
    return { prompt: `${a} × ${b}`, answer: String(a * b) };
  }
  if (roll < 0.7) {
    const b = ri(rng, 3, 12);
    const q = ri(rng, 3, 12);
    return { prompt: `${b * q} ÷ ${b}`, answer: String(q) };
  }
  const a = ri(rng, 2, 12);
  const b = ri(rng, 2, 9);
  const c = ri(rng, 2, 9);
  return { prompt: `${a} + ${b} × ${c}`, answer: String(a + b * c) };
}
