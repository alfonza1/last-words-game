import type { CharacterLoadout, Difficulty, GameMode, Settings } from '../types';
import { MAPS, isMapOwned, type MapTheme } from '../data/maps';
import {
  DEFAULT_CHARACTER,
  EXPRESSIONS,
  cosmeticByKey,
  cosmeticsFor,
  normalizeCharacter,
  type CosmeticDef,
  type CosmeticSlot,
  type ExpressionDef,
} from '../data/cosmetics';

export const DEAD_KEYS_DEFAULT_MAP = 'graveyard';
export const METEOR_MANIA_DEFAULT_MAP = 'planet-aurora';
export const METEOR_MANIA_DEFAULT_OUTFIT = 'outfit-orbit-cadet';
export const METEOR_MANIA_DEFAULT_ACCESSORY = 'accessory-none';
export const METEOR_MANIA_DEFAULT_EXPRESSION = 'first-light';
export const METEOR_MANIA_HARD_MODE_LABEL = 'Meteor Mayhem';

function mapMatchesFamilyMode(map: MapTheme, familyFriendlyMode: boolean): boolean {
  return Boolean(map.familyFriendly) === familyFriendlyMode;
}

function mapIsPlayable(map: MapTheme, mode: GameMode, difficulty: Difficulty): boolean {
  return (!map.nightmareOnly || difficulty === 'nightmare') && (!map.bossRushOnly || mode === 'bossrush');
}

export function defaultMapForFamilyMode(familyFriendlyMode: boolean): string {
  return familyFriendlyMode ? METEOR_MANIA_DEFAULT_MAP : DEAD_KEYS_DEFAULT_MAP;
}

export function mapIdForFamilyMode(
  mapId: string,
  familyFriendlyMode: boolean,
  mode: GameMode = 'survival',
  difficulty: Difficulty = 'normal',
): string {
  const map = MAPS.find((candidate) => candidate.id === mapId);
  if (!map || !mapMatchesFamilyMode(map, familyFriendlyMode) || !mapIsPlayable(map, mode, difficulty)) {
    return defaultMapForFamilyMode(familyFriendlyMode);
  }
  return map.id;
}

export function normalizeSettingsForFamilyMode(settings: Settings): Settings {
  const map = MAPS.find((candidate) => candidate.id === settings.map);
  const validMap = map && mapMatchesFamilyMode(map, settings.familyFriendlyMode);
  return {
    ...settings,
    map: validMap ? settings.map : defaultMapForFamilyMode(settings.familyFriendlyMode),
  };
}

export function selectableMapsForFamilyMode(
  familyFriendlyMode: boolean,
  mode: GameMode,
  difficulty: Difficulty,
): MapTheme[] {
  const playable = MAPS.filter(
    (map) => mapMatchesFamilyMode(map, familyFriendlyMode) && mapIsPlayable(map, mode, difficulty),
  );
  const exclusive = playable.filter((map) => map.nightmareOnly || map.bossRushOnly);
  const normal = playable.filter((map) => !map.nightmareOnly && !map.bossRushOnly);
  return normal.length ? [normal[0], ...exclusive, ...normal.slice(1)] : exclusive;
}

export function isMapOwnedForFamilyMode(map: MapTheme, ownedMaps: string[]): boolean {
  return isMapOwned(map, ownedMaps);
}

export function cosmeticMatchesFamilyMode(item: CosmeticDef, familyFriendlyMode: boolean): boolean {
  if (item.key === METEOR_MANIA_DEFAULT_ACCESSORY) return true;
  return familyFriendlyMode ? item.familyFriendly === true : item.familyFriendly !== true;
}

export function cosmeticsForFamilyMode(slot: CosmeticSlot, familyFriendlyMode: boolean): CosmeticDef[] {
  return cosmeticsFor(slot).filter((item) => cosmeticMatchesFamilyMode(item, familyFriendlyMode));
}

export function expressionMatchesFamilyMode(expression: ExpressionDef, familyFriendlyMode: boolean): boolean {
  return familyFriendlyMode ? expression.familyFriendly === true : expression.familyFriendly !== true;
}

export function expressionsForFamilyMode(familyFriendlyMode: boolean): ExpressionDef[] {
  return EXPRESSIONS.filter((expression) => expressionMatchesFamilyMode(expression, familyFriendlyMode));
}

export function ownedCosmeticKeysForFamilyMode(ownedCosmetics: string[], familyFriendlyMode: boolean): string[] {
  const owned = new Set(ownedCosmetics);
  owned.add(METEOR_MANIA_DEFAULT_ACCESSORY);
  owned.add(familyFriendlyMode ? METEOR_MANIA_DEFAULT_OUTFIT : DEFAULT_CHARACTER.outfit);
  return [...owned];
}

export function normalizeCharacterForFamilyMode(
  character: CharacterLoadout,
  familyFriendlyMode: boolean,
): CharacterLoadout {
  const normalized = normalizeCharacter(character);
  const outfit = cosmeticByKey(normalized.outfit);
  const accessory = cosmeticByKey(normalized.accessory);
  const expression = EXPRESSIONS.find((candidate) => candidate.key === normalized.expression);

  return {
    ...normalized,
    outfit:
      outfit && cosmeticMatchesFamilyMode(outfit, familyFriendlyMode)
        ? normalized.outfit
        : familyFriendlyMode
          ? METEOR_MANIA_DEFAULT_OUTFIT
          : DEFAULT_CHARACTER.outfit,
    accessory:
      accessory && cosmeticMatchesFamilyMode(accessory, familyFriendlyMode)
        ? normalized.accessory
        : DEFAULT_CHARACTER.accessory,
    expression:
      expression && expressionMatchesFamilyMode(expression, familyFriendlyMode)
        ? normalized.expression
        : familyFriendlyMode
          ? METEOR_MANIA_DEFAULT_EXPRESSION
          : DEFAULT_CHARACTER.expression,
  };
}
