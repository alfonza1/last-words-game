import { describe, expect, it } from 'vitest';
import { cosmeticByKey, DEFAULT_CHARACTER, EXPRESSIONS, HAIR_STYLES, lipColorForSkinTone, normalizeCharacter, skinColor } from './cosmetics';

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
    expect(HAIR_STYLES.find((style) => style.key === 'undercut')?.label).toBe('Undercut');
    expect(HAIR_STYLES.find((style) => style.key === 'ponytail')?.label).toBe('Dread Locs');
    expect(HAIR_STYLES.map((style) => style.key as string)).not.toContain('signal-braids');
    expect(EXPRESSIONS.find((expression) => expression.key === 'grave-grin')?.label).toBe('Scarred Smirk');
    expect(cosmeticByKey('accessory-cap')?.name).toBe('Gut Trophy Necklace');
    expect(cosmeticByKey('accessory-mask')?.name).toBe('Crawler Head Charm');
  });

  it('falls back from removed hair styles', () => {
    expect(normalizeCharacter({ hair: 'signal-braids' }).hair).toBe('buzz');
  });

  it('derives lips from the selected skin tone', () => {
    expect(lipColorForSkinTone('warm')).not.toBe(lipColorForSkinTone('undead'));
    expect(lipColorForSkinTone('warm')).not.toBe(skinColor('warm'));
  });
});
