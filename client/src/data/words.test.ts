import { describe, expect, it } from 'vitest';
import { GENERAL_WORDS, PHRASES } from './words';

describe('typing word pools', () => {
  it('keeps a broad unique word pool for every generated tier', () => {
    expect(new Set(GENERAL_WORDS).size).toBe(GENERAL_WORDS.length);
    expect(GENERAL_WORDS.filter((word) => word.length >= 3 && word.length <= 5).length).toBeGreaterThanOrEqual(
      100,
    );
    expect(GENERAL_WORDS.filter((word) => word.length >= 5 && word.length <= 7).length).toBeGreaterThanOrEqual(
      90,
    );
    expect(GENERAL_WORDS.filter((word) => word.length >= 7 && word.length <= 12).length).toBeGreaterThanOrEqual(
      80,
    );
  });

  it('keeps tank phrases unique', () => {
    expect(new Set(PHRASES).size).toBe(PHRASES.length);
  });
});
