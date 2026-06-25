import { describe, expect, it } from 'vitest';
import { DEFAULT_CHARACTER, EXPRESSIONS, normalizeCharacter } from './cosmetics';

describe('default character', () => {
  it('selects buzz hair for new survivors', () => {
    expect(DEFAULT_CHARACTER.hair).toBe('buzz');
    expect(normalizeCharacter(null).hair).toBe('buzz');
  });

  it('defaults old survivor records to the Last Light expression', () => {
    expect(DEFAULT_CHARACTER.expression).toBe('last-light');
    expect(normalizeCharacter({ hair: 'mohawk' }).expression).toBe('last-light');
    expect(EXPRESSIONS.map((expression) => expression.key)).toContain('not-yet-dead');
    expect(EXPRESSIONS.find((expression) => expression.key === 'not-yet-dead')?.outfitReactive).toBe(true);
  });
});
