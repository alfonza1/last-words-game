import type { CharacterLoadout, Difficulty, GameMode, Settings, UpgradeKey } from '../types';
import { MAPS, isMapOwned, type MapTheme } from '../data/maps';
import {
  DEFAULT_CHARACTER,
  EXPRESSIONS,
  SKIN_TONES,
  cosmeticByKey,
  cosmeticsFor,
  normalizeCharacter,
  type CosmeticDef,
  type CosmeticSlot,
  type ExpressionDef,
  type SkinToneDef,
} from '../data/cosmetics';
import { POWERUP_DEFS, type PowerupDef } from '../data/powerups';
import { UPGRADE_DEFS, type UpgradeDef } from '../data/upgrades';

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

export function skinToneMatchesFamilyMode(tone: SkinToneDef, familyFriendlyMode: boolean): boolean {
  return !tone.mode || tone.mode === (familyFriendlyMode ? 'family' : 'horror');
}

export function skinTonesForFamilyMode(familyFriendlyMode: boolean): SkinToneDef[] {
  return SKIN_TONES.filter((tone) => skinToneMatchesFamilyMode(tone, familyFriendlyMode));
}

/**
 * Keep a survivor's skin tone valid for the active mode. The "inhuman" tone maps
 * across modes — undead (Last Words) <-> alien green (Meteor Mania) — so a
 * character keeps their look when toggling. Any other out-of-mode tone (there are
 * none today) falls back to the neutral default.
 */
export function skinToneForFamilyMode(skinTone: string, familyFriendlyMode: boolean): string {
  const tone = SKIN_TONES.find((candidate) => candidate.key === skinTone);
  if (tone && skinToneMatchesFamilyMode(tone, familyFriendlyMode)) return skinTone;
  if (skinTone === 'undead' && familyFriendlyMode) return 'alien';
  if (skinTone === 'alien' && !familyFriendlyMode) return 'undead';
  return DEFAULT_CHARACTER.skinTone;
}

// Meteor Mania re-skins each Last Words consumable: same key/cost/effect, but a
// space-themed name, icon, and activation word (the engine maps the word back —
// see GameEngine's consumable word handling).
const METEOR_POWERUP_COPY: Record<string, Partial<PowerupDef>> = {
  grenade: { name: 'Comet Burst', word: 'burst', icon: '*', description: 'Clears a nearby cluster of meteors.' },
  freeze: { name: 'Stasis Beam', word: 'stasis', icon: '||', description: 'Stops every meteor for 3 seconds.' },
  medkit: { name: 'Repair Burst', word: 'repair', icon: '+', description: 'Restores a chunk of planet defense health.' },
};

export function powerupForFamilyMode(def: PowerupDef, familyFriendlyMode: boolean): PowerupDef {
  if (!familyFriendlyMode) return def;
  const override = METEOR_POWERUP_COPY[def.key];
  return override ? { ...def, ...override } : def;
}

export function powerupsForFamilyMode(familyFriendlyMode: boolean): PowerupDef[] {
  return POWERUP_DEFS.map((def) => powerupForFamilyMode(def, familyFriendlyMode));
}

// Only the upgrades whose Last Words name isn't already family-friendly get a
// Meteor Mania alias (the shotgun/"slayer" wording). Neutral names — Starting
// Shield, Slow Start, Time Dilation, Scavenger, Lucky Charm, Reinforced Base —
// are kept as-is.
const METEOR_UPGRADE_COPY: Partial<Record<UpgradeKey, Pick<UpgradeDef, 'name' | 'description'>>> = {
  shotgunRadius: { name: 'Wide Zap', description: 'Wider Power Zap burst radius.' },
  bossDamage: { name: 'Mega Meteor Buster', description: 'Deal bonus progress vs mega meteors.' },
};

export function upgradeForFamilyMode(def: UpgradeDef, familyFriendlyMode: boolean): UpgradeDef {
  if (!familyFriendlyMode) return def;
  const override = METEOR_UPGRADE_COPY[def.key];
  return override ? { ...def, ...override } : def;
}

export function upgradesForFamilyMode(familyFriendlyMode: boolean): UpgradeDef[] {
  return UPGRADE_DEFS.map((def) => upgradeForFamilyMode(def, familyFriendlyMode));
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
    skinTone: skinToneForFamilyMode(normalized.skinTone, familyFriendlyMode),
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
