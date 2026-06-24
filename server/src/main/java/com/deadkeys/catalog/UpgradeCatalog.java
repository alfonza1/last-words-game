package com.deadkeys.catalog;

import java.util.List;

/** Upgrade definitions + cost math, mirroring the frontend data/upgrades.ts. */
public final class UpgradeCatalog {
  private UpgradeCatalog() {}

  /** Games an upgrade purchase stays active before expiring. */
  public static final int LIFESPAN = 5;

  public record Def(String key, int maxLevel, int baseCost, double costGrowth) {}

  public static final List<Def> DEFS = List.of(
      new Def("maxHealth", 5, 240, 1.6),
      new Def("startShield", 3, 400, 1.8),
      new Def("slowWaves", 3, 300, 1.7),
      new Def("shotgunRadius", 4, 280, 1.6),
      new Def("slowMoDuration", 4, 320, 1.6),
      new Def("bossDamage", 3, 440, 1.9),
      new Def("bonusCoins", 5, 260, 1.5),
      new Def("powerupChance", 4, 360, 1.7));

  public static Def find(String key) {
    return DEFS.stream().filter(d -> d.key().equals(key)).findFirst().orElse(null);
  }

  public static int cost(Def def, int currentLevel) {
    return (int) Math.round(def.baseCost() * Math.pow(def.costGrowth(), currentLevel));
  }
}
