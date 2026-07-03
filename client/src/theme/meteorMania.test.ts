import { describe, expect, it } from 'vitest';
import { DEFAULT_CHARACTER } from '../data/cosmetics';
import { DEFAULT_SETTINGS } from '../lib/storage';
import {
  normalizeCharacterForFamilyMode,
  normalizeSettingsForFamilyMode,
  powerupsForFamilyMode,
  selectableMapsForFamilyMode,
  skinTonesForFamilyMode,
  upgradesForFamilyMode,
} from './meteorMania';

describe('Meteor Mania theme helpers', () => {
  it('preserves normal mode-only maps when unrelated settings are saved', () => {
    const normalized = normalizeSettingsForFamilyMode({
      ...DEFAULT_SETTINGS,
      familyFriendlyMode: false,
      map: 'arena',
    });

    expect(normalized.map).toBe('arena');
  });

  it('moves between Dead Keys and Meteor Mania map sets when family mode changes', () => {
    expect(normalizeSettingsForFamilyMode({ ...DEFAULT_SETTINGS, familyFriendlyMode: true, map: 'graveyard' }).map).toBe(
      'planet-aurora',
    );
    expect(
      normalizeSettingsForFamilyMode({ ...DEFAULT_SETTINGS, familyFriendlyMode: false, map: 'planet-aurora' }).map,
    ).toBe('graveyard');
  });

  it('keeps selectable maps isolated by mode', () => {
    const deadKeysMaps = selectableMapsForFamilyMode(false, 'survival', 'normal');
    const meteorMaps = selectableMapsForFamilyMode(true, 'survival', 'normal');

    expect(deadKeysMaps.every((map) => !map.familyFriendly)).toBe(true);
    expect(meteorMaps.every((map) => map.familyFriendly)).toBe(true);
  });

  it('defaults Meteor Mania characters to a simple family-safe face', () => {
    expect(normalizeCharacterForFamilyMode(DEFAULT_CHARACTER, true).expression).toBe('first-light');
  });

  it('offers the undead tone only in Dead Keys and alien green only in Meteor Mania', () => {
    const deadKeysKeys = skinTonesForFamilyMode(false).map((tone) => tone.key);
    const meteorKeys = skinTonesForFamilyMode(true).map((tone) => tone.key);

    expect(deadKeysKeys).toContain('undead');
    expect(deadKeysKeys).not.toContain('alien');
    expect(meteorKeys).toContain('alien');
    expect(meteorKeys).not.toContain('undead');
  });

  it('swaps the inhuman tone between undead and alien when family mode changes', () => {
    expect(normalizeCharacterForFamilyMode({ ...DEFAULT_CHARACTER, skinTone: 'undead' }, true).skinTone).toBe('alien');
    expect(normalizeCharacterForFamilyMode({ ...DEFAULT_CHARACTER, skinTone: 'alien' }, false).skinTone).toBe('undead');
    expect(normalizeCharacterForFamilyMode({ ...DEFAULT_CHARACTER, skinTone: 'warm' }, true).skinTone).toBe('warm');
  });

  it('re-skins consumable powerups for Meteor Mania but keeps keys, costs, and Dead Keys copy', () => {
    const meteor = powerupsForFamilyMode(true);
    const deadKeys = powerupsForFamilyMode(false);

    expect(meteor.find((p) => p.key === 'grenade')).toMatchObject({ name: 'Comet Burst', word: 'burst' });
    expect(meteor.find((p) => p.key === 'freeze')).toMatchObject({ name: 'Stasis Beam', word: 'stasis' });
    expect(meteor.find((p) => p.key === 'medkit')).toMatchObject({ name: 'Repair Burst', word: 'repair' });
    // Same keys and costs so purchases/effects are unaffected.
    expect(meteor.map((p) => `${p.key}:${p.cost}`)).toEqual(deadKeys.map((p) => `${p.key}:${p.cost}`));
    // Dead Keys copy is untouched.
    expect(deadKeys.find((p) => p.key === 'grenade')).toMatchObject({ name: 'Grenade', word: 'grenade' });
  });

  it('renames only the non-family-friendly upgrades in Meteor Mania', () => {
    const meteor = upgradesForFamilyMode(true);
    const byKey = (key: string) => meteor.find((u) => u.key === key);

    expect(byKey('shotgunRadius')?.name).toBe('Wide Zap');
    expect(byKey('bossDamage')?.name).toBe('Mega Meteor Buster');
    // Names that are already family-friendly are left as-is.
    expect(byKey('startShield')?.name).toBe('Starting Shield');
    expect(byKey('slowMoDuration')?.name).toBe('Time Dilation');
    expect(byKey('maxHealth')?.name).toBe('Reinforced Base');
    // No weapon/violent words leak into Meteor Mania copy.
    const copy = meteor.map((u) => `${u.name} ${u.description}`).join(' ').toLowerCase();
    expect(copy).not.toContain('shotgun');
    expect(copy).not.toContain('slayer');
  });

  it('leaves upgrade copy unchanged outside family mode', () => {
    expect(upgradesForFamilyMode(false).find((u) => u.key === 'shotgunRadius')?.name).toBe('Wide Choke');
    expect(upgradesForFamilyMode(false).find((u) => u.key === 'bossDamage')?.name).toBe('Boss Slayer');
  });
});
