import { describe, it, expect } from 'vitest';
import {
  shouldArmShotgun,
  shouldGrantShield,
  shouldDoubleDamage,
  shouldSlowMotion,
  damageMultiplier,
  timeScale,
  tickPowerups,
  initialPowerups,
} from './powerups';
import { DEFAULT_UPGRADES } from '../lib/storage';
import type { PowerupState } from '../types';

describe('streak-based powerups', () => {
  it('arms the shotgun every 10th word', () => {
    expect(shouldArmShotgun(10)).toBe(true);
    expect(shouldArmShotgun(20)).toBe(true);
    expect(shouldArmShotgun(9)).toBe(false);
    expect(shouldArmShotgun(0)).toBe(false);
  });
  it('grants a shield every 15 mistake-free words', () => {
    expect(shouldGrantShield(15)).toBe(true);
    expect(shouldGrantShield(30)).toBe(true);
    expect(shouldGrantShield(14)).toBe(false);
  });
});

describe('metric-based powerups', () => {
  it('double damage above the wpm threshold', () => {
    expect(shouldDoubleDamage(60)).toBe(true);
    expect(shouldDoubleDamage(40)).toBe(false);
  });
  it('slow motion needs a sample and high accuracy', () => {
    expect(shouldSlowMotion(98, 20)).toBe(true);
    expect(shouldSlowMotion(98, 5)).toBe(false); // too few words
    expect(shouldSlowMotion(80, 20)).toBe(false); // accuracy too low
  });
});

describe('powerup state helpers', () => {
  it('initializes shield from upgrades', () => {
    const p = initialPowerups({ ...DEFAULT_UPGRADES, startShield: 2 });
    expect(p.shieldCharges).toBe(2);
  });
  it('seeds consumable charges from the owned inventory', () => {
    const p = initialPowerups(DEFAULT_UPGRADES, { grenade: 3, freeze: 1 });
    expect(p.consumables.grenade).toBe(3);
    expect(p.consumables.freeze).toBe(1);
  });
  it('doubles damage while active', () => {
    const p = initialPowerups(DEFAULT_UPGRADES);
    p.doubleDamageMs = 1000;
    expect(damageMultiplier(p)).toBe(2);
    p.doubleDamageMs = 0;
    expect(damageMultiplier(p)).toBe(1);
  });
  it('freeze stops time, slow-mo slows it', () => {
    const base = initialPowerups(DEFAULT_UPGRADES);
    expect(timeScale(base)).toBe(1);
    const slow: PowerupState = { ...base, slowMotionMs: 1000 };
    expect(timeScale(slow)).toBeLessThan(1);
    const frozen: PowerupState = { ...base, freezeMs: 1000 };
    expect(timeScale(frozen)).toBe(0);
  });
  it('ticks timed powerups down without going negative', () => {
    const p = initialPowerups(DEFAULT_UPGRADES);
    p.doubleDamageMs = 100;
    tickPowerups(p, 250);
    expect(p.doubleDamageMs).toBe(0);
  });
});
