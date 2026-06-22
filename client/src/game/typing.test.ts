import { describe, it, expect } from 'vitest';
import { normalize, matchesTarget, isPrefix, findQueueMatch, findQueuePrefix } from './typing';

describe('normalize', () => {
  it('lowercases and trims by default', () => {
    expect(normalize('  Run  ')).toBe('run');
  });
  it('collapses internal whitespace', () => {
    expect(normalize('lock   gate')).toBe('lock gate');
  });
  it('keeps case in strict mode', () => {
    expect(normalize('Lock Gate', { strict: true })).toBe('Lock Gate');
  });
  it('drops punctuation in casual mode', () => {
    expect(normalize("don't", { casual: true })).toBe('dont');
  });
});

describe('matchesTarget', () => {
  it('is case-insensitive by default', () => {
    expect(matchesTarget('RUN', 'run')).toBe(true);
  });
  it('rejects empty input', () => {
    expect(matchesTarget('   ', 'run')).toBe(false);
  });
  it('honors case sensitivity', () => {
    expect(matchesTarget('bunker-17', 'BUNKER-17', { caseSensitive: true })).toBe(false);
    expect(matchesTarget('BUNKER-17', 'BUNKER-17', { caseSensitive: true })).toBe(true);
  });
  it('strict mode requires exact case', () => {
    expect(matchesTarget('Fire', 'fire', { strict: true })).toBe(false);
    expect(matchesTarget('fire', 'fire', { strict: true })).toBe(true);
  });
});

describe('isPrefix', () => {
  it('detects a non-empty prefix', () => {
    expect(isPrefix('ru', 'run')).toBe(true);
    expect(isPrefix('run', 'run')).toBe(true);
  });
  it('returns false for empty input', () => {
    expect(isPrefix('', 'run')).toBe(false);
    expect(isPrefix('   ', 'run')).toBe(false);
  });
  it('returns false for a wrong path', () => {
    expect(isPrefix('x', 'run')).toBe(false);
  });
});

describe('queue matching (words independent of zombies)', () => {
  const queue = ['run', 'fire', 'amber', 'storm', 'pine'];

  it('finds the exact match index', () => {
    expect(findQueueMatch('fire', queue)).toBe(1);
    expect(findQueueMatch('FIRE', queue)).toBe(1);
    expect(findQueueMatch('nope', queue)).toBe(-1);
  });
  it('finds a prefix index for highlighting', () => {
    expect(findQueuePrefix('st', queue)).toBe(3); // "storm"
    expect(findQueuePrefix('ru', queue)).toBe(0);
    expect(findQueuePrefix('zzz', queue)).toBe(-1);
  });
});
