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
      new Def("outfit-hoodie", OUTFIT, 800),
      new Def("outfit-raider", OUTFIT, 1_500),
      new Def("outfit-hazmat", OUTFIT, 2_000),
      new Def("outfit-neon", OUTFIT, 2_600),
      new Def("outfit-warden", OUTFIT, 3_600),
      new Def("outfit-inferno", OUTFIT, 4_800),
      new Def("accessory-none", ACCESSORY, 0),
      new Def("accessory-headphones", ACCESSORY, 600),
      new Def("accessory-goggles", ACCESSORY, 840),
      new Def("accessory-mask", ACCESSORY, 1_200),
      new Def("accessory-crown", ACCESSORY, 2_000));

  public static final List<String> DEFAULT_OWNED =
      List.of("outfit-field", "accessory-none");

  public static final Set<String> SKIN_TONES =
      Set.of("porcelain", "warm", "tan", "brown", "deep", "undead");
  public static final Set<String> HAIR_STYLES =
      Set.of("buzz", "undercut", "mohawk", "ponytail", "bald");
  public static final Set<String> HAIR_COLORS =
      Set.of("charcoal", "brown", "blonde", "red", "cyan", "pink");
  public static final Set<String> EXPRESSIONS =
      Set.of("last-light", "grave-grin", "dead-calm", "haunted", "blood-rush", "not-yet-dead");

  public static Def find(String key) {
    return DEFS.stream().filter(d -> d.key().equals(key)).findFirst().orElse(null);
  }
}
