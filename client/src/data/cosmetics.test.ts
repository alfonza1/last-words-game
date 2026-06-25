import { describe, expect, it } from 'vitest';
import { DEFAULT_CHARACTER, normalizeCharacter } from './cosmetics';

describe('default character', () => {
  it('selects buzz hair for new survivors', () => {
    expect(DEFAULT_CHARACTER.hair).toBe('buzz');
    expect(normalizeCharacter(null).hair).toBe('buzz');
  });
});
