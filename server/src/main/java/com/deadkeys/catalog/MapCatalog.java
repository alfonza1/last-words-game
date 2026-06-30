package com.deadkeys.catalog;

import java.util.List;

/** Buyable map themes plus their coin price. Prices rise with map complexity. */
public final class MapCatalog {
  private MapCatalog() {}

  public record Def(String id, int cost) {}

  public static final List<Def> DEFS =
      List.of(
          new Def("graveyard", 0), // Forsaken, free and always owned
          new Def("tundra", 150), // Frozen Outpost
          new Def("city", 350), // Dead City
          new Def("lab", 600), // Quarantine Lab
          new Def("forest", 900), // Bleeding Forest
          new Def("arena", 0), // boss-rush exclusive, free
          new Def("planet-aurora", 0), // Meteor Mania starter planet
          new Def("planet-crystal", 250), // Meteor Mania planet
          new Def("planet-volcanic", 650), // Meteor Mania planet
          new Def("planet-nebula", 1_000), // Meteor Mania planet
          new Def("inferno", 0)); // nightmare-exclusive, free

  public static Def find(String id) {
    return DEFS.stream().filter(d -> d.id().equals(id)).findFirst().orElse(null);
  }
}
