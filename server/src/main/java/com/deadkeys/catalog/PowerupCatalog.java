package com.deadkeys.catalog;

import java.util.List;

/** Buyable consumable powerups + their coin price. Mirrors client data/powerups.ts. */
public final class PowerupCatalog {
  private PowerupCatalog() {}

  public record Def(String key, int cost) {}

  public static final List<Def> DEFS = List.of(
      new Def("grenade", 60),
      new Def("freeze", 90),
      new Def("medkit", 120));

  public static Def find(String key) {
    return DEFS.stream().filter(d -> d.key().equals(key)).findFirst().orElse(null);
  }
}
