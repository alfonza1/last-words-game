package com.deadkeys.catalog;

import java.util.List;

/** Purchasable coin packs (real-money via Stripe). Mirrors client data/coinPacks.ts. */
public final class CoinPackCatalog {
  private CoinPackCatalog() {}

  public record Def(String id, int coins, int priceCents) {}

  public static final List<Def> DEFS = List.of(
      new Def("small", 500, 99),
      new Def("medium", 3_000, 399),
      new Def("large", 8_000, 999),
      new Def("huge", 20_000, 1999));

  public static Def find(String id) {
    return DEFS.stream().filter(d -> d.id().equals(id)).findFirst().orElse(null);
  }
}
