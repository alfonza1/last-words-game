package com.deadkeys.catalog;

import java.util.List;
import java.util.Set;

/** Character cosmetics sold for coins plus the free appearance choices. */
public final class CharacterCatalog {
  private CharacterCatalog() {}

  public static final String OUTFIT = "outfit";
  public static final String ACCESSORY = "accessory";

  public record Def(String key, String slot, int cost) {}

  public static final List<Def> DEFS =
      List.of(
          new Def("outfit-field", OUTFIT, 0),
          new Def("outfit-hoodie", OUTFIT, 800),
          new Def("outfit-raider", OUTFIT, 1_500),
          new Def("outfit-neon", OUTFIT, 2_600),
          new Def("outfit-warden", OUTFIT, 3_600),
          new Def("outfit-inferno", OUTFIT, 4_800),
          // Exclusive Mythic, cosmetic only (no gameplay effect).
          new Def("outfit-godmode-revenant", OUTFIT, 66_666),
          new Def("outfit-neon-plague-saint", OUTFIT, 66_666),
          new Def("outfit-orbit-cadet", OUTFIT, 0),
          new Def("outfit-stellar-ranger", OUTFIT, 900),
          new Def("outfit-comet-rider", OUTFIT, 1_800),
          new Def("outfit-nebula-guardian", OUTFIT, 3_600),
          // Meteor Mania Exclusive Mythic, cosmetic only (no gameplay effect).
          new Def("outfit-starforged-titan", OUTFIT, 66_666),
          new Def("outfit-cosmic-phoenix", OUTFIT, 66_666),
          new Def("accessory-none", ACCESSORY, 0),
          new Def("accessory-headphones", ACCESSORY, 600),
          new Def("accessory-goggles", ACCESSORY, 840),
          new Def("accessory-crown", ACCESSORY, 2_000),
          // Exclusive Mythic, cosmetic only (no gameplay effect).
          new Def("accessory-blackout-shoulder-drone", ACCESSORY, 33_333),
          new Def("accessory-toxic-angel-halo", ACCESSORY, 33_333),
          new Def("accessory-star-visor", ACCESSORY, 900),
          // Meteor Mania Exclusive Mythic, cosmetic only (no gameplay effect).
          new Def("accessory-orbit-drone", ACCESSORY, 33_333),
          new Def("accessory-saturn-crown", ACCESSORY, 33_333));

  public static final List<String> DEFAULT_OWNED = List.of("outfit-field", "accessory-none");

  // "undead" is the Last Words (horror) inhuman tone; "alien" is its Meteor Mania
  // (family-friendly) counterpart. Both are accepted so a survivor can carry the
  // mode-appropriate tone after normalization.
  public static final Set<String> SKIN_TONES =
      Set.of("porcelain", "warm", "tan", "brown", "deep", "undead", "alien");
  public static final Set<String> HAIR_STYLES =
      Set.of("buzz", "undercut", "mohawk", "ponytail", "bald");
  public static final Set<String> HAIR_COLORS =
      Set.of("charcoal", "brown", "blonde", "red", "cyan", "pink");
  public static final Set<String> EXPRESSIONS =
      Set.of(
          "last-light",
          "grave-grin",
          "dead-calm",
          "haunted",
          "blood-rush",
          "not-yet-dead",
          // Meteor Mania (family-friendly) faces.
          "first-light",
          "mission-calm",
          "zero-g-grin",
          "wide-eyed-wonder",
          "still-standing",
          "star-ready");

  public static Def find(String key) {
    return DEFS.stream().filter(d -> d.key().equals(key)).findFirst().orElse(null);
  }
}
