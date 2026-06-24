package com.deadkeys.catalog;

import java.util.List;
import java.util.Set;

/** Character cosmetics sold for coins plus the free appearance choices. */
public final class CharacterCatalog {
  private CharacterCatalog() {}

  public static final String OUTFIT = "outfit";
  public static final String ACCESSORY = "accessory";

  public record Def(String key, String slot, int cost) {}

  public static final List<Def> DEFS = List.of(
      new Def("outfit-field", OUTFIT, 0),
      new Def("outfit-hoodie", OUTFIT, 0),
      new Def("outfit-raider", OUTFIT, 450),
      new Def("outfit-hazmat", OUTFIT, 650),
      new Def("outfit-neon", OUTFIT, 800),
      new Def("outfit-warden", OUTFIT, 1_100),
      new Def("outfit-inferno", OUTFIT, 1_400),
      new Def("accessory-none", ACCESSORY, 0),
      new Def("accessory-cap", ACCESSORY, 180),
      new Def("accessory-headphones", ACCESSORY, 300),
      new Def("accessory-goggles", ACCESSORY, 420),
      new Def("accessory-mask", ACCESSORY, 600),
      new Def("accessory-crown", ACCESSORY, 1_000));

  public static final List<String> DEFAULT_OWNED =
      List.of("outfit-field", "outfit-hoodie", "accessory-none");

  public static final Set<String> SKIN_TONES =
      Set.of("porcelain", "warm", "tan", "brown", "deep", "undead");
  public static final Set<String> HAIR_STYLES =
      Set.of("buzz", "undercut", "mohawk", "ponytail", "bald");
  public static final Set<String> HAIR_COLORS =
      Set.of("charcoal", "brown", "blonde", "red", "cyan", "pink");

  public static Def find(String key) {
    return DEFS.stream().filter(d -> d.key().equals(key)).findFirst().orElse(null);
  }
}
