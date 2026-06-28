import type { CharacterLoadout } from '../types';

export type CosmeticSlot = 'outfit' | 'accessory';

export interface CosmeticDef {
  key: string;
  slot: CosmeticSlot;
  name: string;
  description: string;
  cost: number;
  rarity: 'standard' | 'rare' | 'epic' | 'legendary' | 'exclusive-mythic';
  /** Item's color follows the equipped outfit's glow (e.g. crown, glasses). */
  outfitReactive?: boolean;
}

export interface OutfitPalette {
  primary: string;
  secondary: string;
  trim: string;
  glow?: string;
}

export interface ExpressionDef {
  key: string;
  label: string;
  icon: string;
  description: string;
  /** Expression accents follow the equipped outfit's glow color. */
  outfitReactive?: boolean;
}

export const DEFAULT_CHARACTER: CharacterLoadout = {
  skinTone: 'warm',
  hair: 'buzz',
  hairColor: 'charcoal',
  expression: 'last-light',
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
  { key: 'ponytail', label: 'Dread Locs' },
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

export const EXPRESSIONS: ExpressionDef[] = [
  {
    key: 'last-light',
    label: 'Last Light',
    icon: '•_•',
    description: 'Focused. Breathing. Still human.',
  },
  {
    key: 'grave-grin',
    label: 'Scarred Smirk',
    icon: '/¬_¬',
    description: 'A cut through the stare and a smile that says keep coming.',
  },
  {
    key: 'dead-calm',
    label: 'Dead Calm',
    icon: '—_—',
    description: 'Nothing left to fear. Nothing left to prove.',
  },
  {
    key: 'haunted',
    label: 'Haunted',
    icon: '◉_◉',
    description: 'You saw what moved beyond the barricade.',
  },
  {
    key: 'blood-rush',
    label: 'Blood Rush',
    icon: '▼皿▼',
    description: 'Teeth clenched. Trigger ready.',
  },
  {
    key: 'not-yet-dead',
    label: 'Not Yet Dead',
    icon: '◉‿◌',
    description: 'One eye changed. You insist it is fine.',
    outfitReactive: true,
  },
];

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
    key: 'outfit-godmode-revenant',
    slot: 'outfit',
    name: 'Bonelord Revenant',
    description:
      'Not a survivor at all — a skeletal admin-lich risen in gold-bound bone, its hollow sockets burning with corrupted command-light.',
    cost: 66666,
    rarity: 'exclusive-mythic',
  },
  {
    key: 'outfit-neon-plague-saint',
    slot: 'outfit',
    name: 'Hollow Plague Doctor',
    description: 'A plague-cursed doctor sealed inside a beaked toxic mask and a tattered bio-hazard shroud leaking neon green.',
    cost: 66666,
    rarity: 'exclusive-mythic',
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
    key: 'accessory-crown',
    slot: 'accessory',
    name: 'Static Crown',
    description: 'A broken broadcast halo for survivors with a reputation.',
    cost: 2000,
    rarity: 'legendary',
    outfitReactive: true,
  },
  {
    key: 'accessory-blackout-shoulder-drone',
    slot: 'accessory',
    name: 'Blackout Shoulder Drone',
    description: 'A hovering blackout drone that scans the field with corrupted admin light.',
    cost: 33333,
    rarity: 'exclusive-mythic',
    outfitReactive: true,
  },
  {
    key: 'accessory-toxic-angel-halo',
    slot: 'accessory',
    name: 'Toxic Angel Halo',
    description: 'A cracked toxic halo leaking neon plague light above the survivor.',
    cost: 33333,
    rarity: 'exclusive-mythic',
    outfitReactive: true,
  },
];

export const OUTFIT_PALETTES: Record<string, OutfitPalette> = {
  'outfit-field': { primary: '#384832', secondary: '#1d2920', trim: '#8fa26f' },
  'outfit-hoodie': { primary: '#151c22', secondary: '#080b0e', trim: '#39ff14', glow: '#39ff14' },
  'outfit-raider': { primary: '#5b2e23', secondary: '#24201d', trim: '#ffb300' },
  'outfit-neon': { primary: '#13243b', secondary: '#11101f', trim: '#00f0ff', glow: '#ff2bd6' },
  'outfit-warden': { primary: '#272335', secondary: '#0c0b11', trim: '#a78bfa', glow: '#a78bfa' },
  'outfit-inferno': { primary: '#260806', secondary: '#080101', trim: '#ff3b12', glow: '#ff3b12' },
  'outfit-godmode-revenant': { primary: '#07070d', secondary: '#111827', trim: '#f8d66d', glow: '#00f0ff' },
  'outfit-neon-plague-saint': { primary: '#07100b', secondary: '#18251b', trim: '#9dff4f', glow: '#39ff14' },
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

export function lipColorForSkinTone(key: string): string {
  return darkenHex(skinColor(key), 0.62);
}

export function hairColor(key: string): string {
  return HAIR_COLORS.find((color) => color.key === key)?.color ?? HAIR_COLORS[0].color;
}

export function normalizeCharacter(value?: Partial<CharacterLoadout> | null): CharacterLoadout {
  const merged = { ...DEFAULT_CHARACTER, ...(value ?? {}) };
  const hair = HAIR_STYLES.some((style) => style.key === merged.hair) ? merged.hair : DEFAULT_CHARACTER.hair;
  const outfit = cosmeticByKey(merged.outfit)?.slot === 'outfit' ? merged.outfit : DEFAULT_CHARACTER.outfit;
  const accessory = cosmeticByKey(merged.accessory)?.slot === 'accessory' ? merged.accessory : DEFAULT_CHARACTER.accessory;
  return { ...merged, hair, outfit, accessory };
}

function darkenHex(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  const value = Number.parseInt(clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean, 16);
  if (Number.isNaN(value)) return '#512c28';

  const r = Math.max(0, Math.min(255, Math.round(((value >> 16) & 255) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(((value >> 8) & 255) * factor)));
  const b = Math.max(0, Math.min(255, Math.round((value & 255) * factor)));

  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}`;
}
