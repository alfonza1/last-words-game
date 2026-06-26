import { describe, expect, it } from 'vitest';
import { DEFAULT_CHARACTER, EXPRESSIONS, HAIR_STYLES, lipColorForSkinTone, normalizeCharacter, skinColor } from './cosmetics';

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

  it('uses the updated survivor cosmetic names', () => {
    expect(HAIR_STYLES.find((style) => style.key === 'undercut')?.label).toBe('Side-Swept Undercut');
    expect(HAIR_STYLES.find((style) => style.key === 'ponytail')?.label).toBe('Dread Locs');
    expect(EXPRESSIONS.find((expression) => expression.key === 'grave-grin')?.label).toBe('Scarred Smirk');
  });

  it('derives lips from the selected skin tone', () => {
    expect(lipColorForSkinTone('warm')).not.toBe(lipColorForSkinTone('undead'));
    expect(lipColorForSkinTone('warm')).not.toBe(skinColor('warm'));
  });
});
