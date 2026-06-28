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
    expect(cosmeticByKey('accessory-crown')?.name).toBe('Static Crown');
  });

  it('falls back from removed hair styles', () => {
    expect(normalizeCharacter({ hair: 'signal-braids' }).hair).toBe('buzz');
  });

  it('falls back from removed accessories', () => {
    expect(normalizeCharacter({ accessory: 'removed-accessory' }).accessory).toBe('accessory-none');
  });

  it('derives lips from the selected skin tone', () => {
    expect(lipColorForSkinTone('warm')).not.toBe(lipColorForSkinTone('undead'));
    expect(lipColorForSkinTone('warm')).not.toBe(skinColor('warm'));
  });
});

describe('exclusive mythic cosmetics', () => {
  it('adds the Bonelord Revenant + Blackout Drone set', () => {
    const outfit = cosmeticByKey('outfit-godmode-revenant');
    expect(outfit?.name).toBe('Bonelord Revenant');
    expect(outfit?.slot).toBe('outfit');
    expect(outfit?.rarity).toBe('exclusive-mythic');
    expect(outfit?.cost).toBe(66666);

    const drone = cosmeticByKey('accessory-blackout-shoulder-drone');
    expect(drone?.name).toBe('Blackout Drone');
    expect(drone?.slot).toBe('accessory');
    expect(drone?.rarity).toBe('exclusive-mythic');
    expect(drone?.cost).toBe(33333);
    expect(drone?.outfitReactive).toBe(true);
  });

  it('adds the Plague Doctor + Toxic Angel Halo set', () => {
    const outfit = cosmeticByKey('outfit-neon-plague-saint');
    expect(outfit?.name).toBe('Plague Doctor');
    expect(outfit?.slot).toBe('outfit');
    expect(outfit?.rarity).toBe('exclusive-mythic');
    expect(outfit?.cost).toBe(66666);

    const halo = cosmeticByKey('accessory-toxic-angel-halo');
    expect(halo?.name).toBe('Toxic Angel Halo');
    expect(halo?.slot).toBe('accessory');
    expect(halo?.rarity).toBe('exclusive-mythic');
    expect(halo?.cost).toBe(33333);
    expect(halo?.outfitReactive).toBe(true);
  });

  it('prices both mythic outfits at 66666 and both mythic accessories at 33333', () => {
    expect(cosmeticByKey('outfit-godmode-revenant')?.cost).toBe(66666);
    expect(cosmeticByKey('outfit-neon-plague-saint')?.cost).toBe(66666);
    expect(cosmeticByKey('accessory-blackout-shoulder-drone')?.cost).toBe(33333);
    expect(cosmeticByKey('accessory-toxic-angel-halo')?.cost).toBe(33333);
  });

  it('tags all four items as exclusive-mythic with outfit-reactive accessories', () => {
    const keys = [
      'outfit-godmode-revenant',
      'outfit-neon-plague-saint',
      'accessory-blackout-shoulder-drone',
      'accessory-toxic-angel-halo',
    ];
    for (const key of keys) {
      expect(cosmeticByKey(key)?.rarity).toBe('exclusive-mythic');
    }
    expect(cosmeticByKey('accessory-blackout-shoulder-drone')?.outfitReactive).toBe(true);
    expect(cosmeticByKey('accessory-toxic-angel-halo')?.outfitReactive).toBe(true);
  });
});
