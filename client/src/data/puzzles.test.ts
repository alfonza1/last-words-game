import { describe, expect, it } from 'vitest';
import { makePuzzle } from './puzzles';
import { RIDDLES } from './riddles';
import { TRIVIA } from './trivia';

describe('easy math puzzles', () => {
  it('uses two-digit operands for addition', () => {
    const values = [0.2, 0.7, 0.1];
    const puzzle = makePuzzle('math', () => values.shift() ?? 0, 'easy', 'easy');

    expect(puzzle.prompt).toBe('36 + 76');
    expect(puzzle.answer).toBe('112');
  });

  it('uses two-digit operands and non-negative answers for subtraction', () => {
    const values = [0.1, 0.6, 0.9];
    const puzzle = makePuzzle('math', () => values.shift() ?? 0, 'easy', 'easy');

    expect(puzzle.prompt).toBe('68 − 28');
    expect(puzzle.answer).toBe('40');
  });
});

describe('puzzle content pools', () => {
  it('keeps at least 30 riddles and trivia questions in every tier', () => {
    for (const tier of ['easy', 'medium', 'hard'] as const) {
      expect(RIDDLES[tier].length).toBeGreaterThanOrEqual(30);
      expect(TRIVIA[tier].length).toBeGreaterThanOrEqual(30);
    }
  });
});
