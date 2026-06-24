import type { CharacterLoadout } from '../types';

export type CosmeticSlot = 'outfit' | 'accessory';

export interface CosmeticDef {
  key: string;
  slot: CosmeticSlot;
  name: string;
  description: string;
  cost: number;
  rarity: 'standard' | 'rare' | 'epic' | 'legendary';
  /** Item's color follows the equipped outfit's glow (e.g. crown, glasses). */
  outfitReactive?: boolean;
}

export interface OutfitPalette {
  primary: string;
  secondary: string;
  trim: string;
  glow?: string;
}

export const DEFAULT_CHARACTER: CharacterLoadout = {
  skinTone: 'warm',
  hair: 'undercut',
  hairColor: 'charcoal',
  outfit: 'outfit-field',
  accessory: 'accessory-none',
};

export const DEFAULT_COSMETICS = ['outfit-field', 'accessory-none'];

export const SKIN_TONES = [
  { key: 'porcelain', label: 'Porcelain', color: '#f3c8ad' },
  { key: 'warm', label: 'Warm', color: '#c9855a' },
  { key: 'tan', label: 'Tan', color: '#a96745' },
  { key: 'brown', label: 'Brown', color: '#75452f' },
  { key: 'deep', label: 'Deep', color: '#48291f' },
  { key: 'undead', label: 'Undead', color: '#8aa17a' },
] as const;

export const HAIR_STYLES = [
  { key: 'buzz', label: 'Buzz' },
  { key: 'undercut', label: 'Undercut' },
  { key: 'mohawk', label: 'Mohawk' },
  { key: 'ponytail', label: 'Ponytail' },
  { key: 'bald', label: 'Bald' },
] as const;

export const HAIR_COLORS = [
  { key: 'charcoal', label: 'Charcoal', color: '#15191d' },
  { key: 'brown', label: 'Brown', color: '#4b2d20' },
  { key: 'blonde', label: 'Blonde', color: '#d1a956' },
  { key: 'red', label: 'Red', color: '#9d3828' },
  { key: 'cyan', label: 'Cyan', color: '#00d9d9' },
  { key: 'pink', label: 'Pink', color: '#ff4db8' },
] as const;

export const COSMETICS: CosmeticDef[] = [
  {
    key: 'outfit-field',
    slot: 'outfit',
    name: 'Outpost Jacket',
    description: 'Classic scavenger layers with reinforced sleeves.',
    cost: 0,
    rarity: 'standard',
  },
  {
    key: 'outfit-hoodie',
    slot: 'outfit',
    name: 'Signal Hoodie',
    description: 'A clean black hoodie with a bright dead-signal mark.',
    cost: 800,
    rarity: 'standard',
  },
  {
    key: 'outfit-raider',
    slot: 'outfit',
    name: 'Road Raider',
    description: 'Scrap armor, warning paint, and no interest in subtlety.',
    cost: 1500,
    rarity: 'rare',
  },
  {
    key: 'outfit-hazmat',
    slot: 'outfit',
    name: 'Containment Tech',
    description: 'Area 67 response gear with sealed neon seams.',
    cost: 2000,
    rarity: 'rare',
  },
  {
    key: 'outfit-neon',
    slot: 'outfit',
    name: 'Dead City Runner',
    description: 'Street armor wired with cyan and magenta light.',
    cost: 2600,
    rarity: 'epic',
  },
  {
    key: 'outfit-warden',
    slot: 'outfit',
    name: 'Grave Warden',
    description: 'A long armored coat made for the last watch.',
    cost: 3600,
    rarity: 'epic',
  },
  {
    key: 'outfit-inferno',
    slot: 'outfit',
    name: 'Ashbound',
    description: 'Black ritual plate carrying a living ember seam.',
    cost: 4800,
    rarity: 'legendary',
  },
  {
    key: 'accessory-none',
    slot: 'accessory',
    name: 'No Accessory',
    description: 'Keep the silhouette clean.',
    cost: 0,
    rarity: 'standard',
  },
  {
    key: 'accessory-cap',
    slot: 'accessory',
    name: 'Last Shift Cap',
    description: 'Standard issue, long after standards stopped mattering.',
    cost: 360,
    rarity: 'standard',
    outfitReactive: true,
  },
  {
    key: 'accessory-headphones',
    slot: 'accessory',
    name: 'Signal Breakers',
    description: 'Heavy comms headphones with a live cyan channel.',
    cost: 600,
    rarity: 'rare',
    outfitReactive: true,
  },
  {
    key: 'accessory-goggles',
    slot: 'accessory',
    name: 'Glasses',
    description: 'Glowing tactical lenses tuned for movement.',
    cost: 840,
    rarity: 'rare',
    outfitReactive: true,
  },
  {
    key: 'accessory-mask',
    slot: 'accessory',
    name: 'Bone Filter',
    description: 'A respirator shaped to make the infected hesitate.',
    cost: 1200,
    rarity: 'epic',
  },
  {
    key: 'accessory-crown',
    slot: 'accessory',
    name: 'Static Crown',
    description: 'A broken broadcast halo for survivors with a reputation.',
    cost: 2000,
    rarity: 'legendary',
    outfitReactive: true,
  },
];

export const OUTFIT_PALETTES: Record<string, OutfitPalette> = {
  'outfit-field': { primary: '#384832', secondary: '#1d2920', trim: '#8fa26f' },
  'outfit-hoodie': { primary: '#151c22', secondary: '#080b0e', trim: '#39ff14', glow: '#39ff14' },
  'outfit-raider': { primary: '#5b2e23', secondary: '#24201d', trim: '#ffb300' },
  'outfit-hazmat': { primary: '#d3a72f', secondary: '#30372e', trim: '#9dff4f', glow: '#9dff4f' },
  'outfit-neon': { primary: '#13243b', secondary: '#11101f', trim: '#00f0ff', glow: '#ff2bd6' },
  'outfit-warden': { primary: '#272335', secondary: '#0c0b11', trim: '#a78bfa', glow: '#a78bfa' },
  'outfit-inferno': { primary: '#260806', secondary: '#080101', trim: '#ff3b12', glow: '#ff3b12' },
};

export function cosmeticByKey(key: string): CosmeticDef | undefined {
  return COSMETICS.find((item) => item.key === key);
}

export function cosmeticsFor(slot: CosmeticSlot): CosmeticDef[] {
  return COSMETICS.filter((item) => item.slot === slot);
}

export function skinColor(key: string): string {
  return SKIN_TONES.find((tone) => tone.key === key)?.color ?? SKIN_TONES[1].color;
}

export function hairColor(key: string): string {
  return HAIR_COLORS.find((color) => color.key === key)?.color ?? HAIR_COLORS[0].color;
}

export function normalizeCharacter(value?: Partial<CharacterLoadout> | null): CharacterLoadout {
  return { ...DEFAULT_CHARACTER, ...(value ?? {}) };
}
