import { describe, expect, it } from 'vitest';
import { DEFAULT_CHARACTER } from '../data/cosmetics';
import { DEFAULT_SETTINGS } from '../lib/storage';
import { normalizeCharacterForFamilyMode, normalizeSettingsForFamilyMode, selectableMapsForFamilyMode } from './meteorMania';

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
});
