import type { Difficulty } from '../types';

export interface WpmBonus {
  tiers: number;
  coins: number;
  score: number;
}

const coinBonusPerTier: Record<Difficulty, number> = {
  easy: 10,
  normal: 20,
  nightmare: 50,
};

const scoreBonusPerTier: Record<Difficulty, number> = {
  easy: 100,
  normal: 250,
  nightmare: 500,
};

export function calculateWpmBonus(highestWpm: number, difficulty: Difficulty): WpmBonus {
  const wpmBonusTiers = Math.max(0, Math.floor((highestWpm - 50) / 10));

  return {
    tiers: wpmBonusTiers,
    coins: wpmBonusTiers * coinBonusPerTier[difficulty],
    score: wpmBonusTiers * scoreBonusPerTier[difficulty],
  };
}
