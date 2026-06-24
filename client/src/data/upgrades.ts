// ---------------------------------------------------------------------------
// Upgrade catalog: definitions, costs, and how each level affects play.
// ---------------------------------------------------------------------------
import type { UpgradeKey, Upgrades } from '../types';

/** How many games an upgrade purchase stays active before expiring. */
export const UPGRADE_LIFESPAN = 5;

export interface UpgradeDef {
  key: UpgradeKey;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number; // multiplier per level
}

export const UPGRADE_DEFS: UpgradeDef[] = [
  { key: 'maxHealth', name: 'Reinforced Base', description: '+20 max health per level.', maxLevel: 5, baseCost: 240, costGrowth: 1.6 },
  { key: 'startShield', name: 'Starting Shield', description: 'Begin each run with +1 shield charge.', maxLevel: 3, baseCost: 400, costGrowth: 1.8 },
  { key: 'slowWaves', name: 'Slow Start', description: 'Early waves move slower.', maxLevel: 3, baseCost: 300, costGrowth: 1.7 },
  { key: 'shotgunRadius', name: 'Wide Choke', description: 'Bigger shotgun blast radius.', maxLevel: 4, baseCost: 280, costGrowth: 1.6 },
  { key: 'slowMoDuration', name: 'Time Dilation', description: 'Longer slow-motion windows.', maxLevel: 4, baseCost: 320, costGrowth: 1.6 },
  { key: 'bossDamage', name: 'Boss Slayer', description: 'Deal bonus progress vs bosses.', maxLevel: 3, baseCost: 440, costGrowth: 1.9 },
  { key: 'bonusCoins', name: 'Scavenger', description: '+10% coins per level.', maxLevel: 5, baseCost: 260, costGrowth: 1.5 },
  { key: 'powerupChance', name: 'Lucky Charm', description: 'More frequent powerups.', maxLevel: 4, baseCost: 360, costGrowth: 1.7 },
];

export function upgradeCost(def: UpgradeDef, currentLevel: number): number {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, currentLevel));
}

export function canUpgrade(def: UpgradeDef, upgrades: Upgrades): boolean {
  return upgrades[def.key] < def.maxLevel;
}

// --- Derived gameplay values from upgrade levels -------------------------

export function maxHealthBonus(u: Upgrades): number {
  return u.maxHealth * 20;
}

export function shotgunRadius(u: Upgrades): number {
  return 110 + u.shotgunRadius * 35;
}

export function slowMoDurationMs(u: Upgrades): number {
  return 5000 + u.slowMoDuration * 1200;
}

export function coinMultiplier(u: Upgrades): number {
  return 1 + u.bonusCoins * 0.1;
}

export function bossDamageBonus(u: Upgrades): number {
  return u.bossDamage; // extra segments cleared per correct boss answer (capped in engine)
}

export function powerupChanceBonus(u: Upgrades): number {
  return u.powerupChance * 0.05;
}
