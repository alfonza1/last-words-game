package com.deadkeys.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

class CharacterCatalogTest {
  @Test
  void registersGodmodeRevenantExclusiveMythicSet() {
    CharacterCatalog.Def outfit = CharacterCatalog.find("outfit-godmode-revenant");
    assertNotNull(outfit);
    assertEquals(CharacterCatalog.OUTFIT, outfit.slot());
    assertEquals(66_666, outfit.cost());

    CharacterCatalog.Def drone = CharacterCatalog.find("accessory-blackout-shoulder-drone");
    assertNotNull(drone);
    assertEquals(CharacterCatalog.ACCESSORY, drone.slot());
    assertEquals(33_333, drone.cost());
  }

  @Test
  void registersNeonPlagueSaintExclusiveMythicSet() {
    CharacterCatalog.Def outfit = CharacterCatalog.find("outfit-neon-plague-saint");
    assertNotNull(outfit);
    assertEquals(CharacterCatalog.OUTFIT, outfit.slot());
    assertEquals(66_666, outfit.cost());

    CharacterCatalog.Def halo = CharacterCatalog.find("accessory-toxic-angel-halo");
    assertNotNull(halo);
    assertEquals(CharacterCatalog.ACCESSORY, halo.slot());
    assertEquals(33_333, halo.cost());
  }
}
