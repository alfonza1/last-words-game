package com.deadkeys.model;

/** Purchased upgrade levels. Mirrors the frontend Upgrades. */
public class Upgrades {
  public int startShield = 0;
  public int slowWaves = 0;
  public int shotgunRadius = 0;
  public int slowMoDuration = 0;
  public int maxHealth = 0;
  public int bonusCoins = 0;
  public int bossDamage = 0;
  public int powerupChance = 0;

  public int get(String key) {
    return switch (key) {
      case "startShield" -> startShield;
      case "slowWaves" -> slowWaves;
      case "shotgunRadius" -> shotgunRadius;
      case "slowMoDuration" -> slowMoDuration;
      case "maxHealth" -> maxHealth;
      case "bonusCoins" -> bonusCoins;
      case "bossDamage" -> bossDamage;
      case "powerupChance" -> powerupChance;
      default -> -1;
    };
  }

  public void set(String key, int value) {
    switch (key) {
      case "startShield" -> startShield = value;
      case "slowWaves" -> slowWaves = value;
      case "shotgunRadius" -> shotgunRadius = value;
      case "slowMoDuration" -> slowMoDuration = value;
      case "maxHealth" -> maxHealth = value;
      case "bonusCoins" -> bonusCoins = value;
      case "bossDamage" -> bossDamage = value;
      case "powerupChance" -> powerupChance = value;
      default -> throw new IllegalArgumentException("unknown upgrade key: " + key);
    }
  }
}
