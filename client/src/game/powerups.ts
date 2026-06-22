// ---------------------------------------------------------------------------
// Powerup activation rules. Pure helpers — unit-tested.
// ---------------------------------------------------------------------------
import type { PowerupState, Upgrades } from '../types';

export const SHOTGUN_STREAK = 10;
export const SHIELD_STREAK = 15;
export const GRENADE_COMBO = 20;
export const WPM_DOUBLE_THRESHOLD = 55;
export const ACCURACY_SLOWMO_THRESHOLD = 95;

export function initialPowerups(upgrades: Upgrades): PowerupState {
  return {
    shotgunArmed: false,
    shieldCharges: upgrades.startShield,
    doubleDamageMs: 0,
    slowMotionMs: 0,
    freezeMs: 0,
    grenadeCharges: 0,
    panicUsed: false,
  };
}

/** Shotgun arms every Nth word in a streak. */
export function shouldArmShotgun(streak: number): boolean {
  return streak > 0 && streak % SHOTGUN_STREAK === 0;
}

/** A shield is granted every Nth mistake-free word. */
export function shouldGrantShield(noMistakeStreak: number): boolean {
  return noMistakeStreak > 0 && noMistakeStreak % SHIELD_STREAK === 0;
}

/** A grenade charge is granted every Nth combo word. */
export function shouldGrantGrenade(combo: number): boolean {
  return combo > 0 && combo % GRENADE_COMBO === 0;
}

export function shouldDoubleDamage(wpm: number, threshold = WPM_DOUBLE_THRESHOLD): boolean {
  return wpm >= threshold;
}

export function shouldSlowMotion(accuracy: number, wordsTyped: number, threshold = ACCURACY_SLOWMO_THRESHOLD): boolean {
  // Needs a meaningful sample before high accuracy means anything.
  return wordsTyped >= 12 && accuracy >= threshold;
}

/** Effective damage multiplier from active powerups. */
export function damageMultiplier(p: PowerupState): number {
  return p.doubleDamageMs > 0 ? 2 : 1;
}

/** Global time scale from slow-motion / freeze. */
export function timeScale(p: PowerupState): number {
  if (p.freezeMs > 0) return 0;
  if (p.slowMotionMs > 0) return 0.4;
  return 1;
}

/** Tick down all timed powerups by `dtMs`. Mutates and returns the state. */
export function tickPowerups(p: PowerupState, dtMs: number): PowerupState {
  p.doubleDamageMs = Math.max(0, p.doubleDamageMs - dtMs);
  p.slowMotionMs = Math.max(0, p.slowMotionMs - dtMs);
  p.freezeMs = Math.max(0, p.freezeMs - dtMs);
  return p;
}
