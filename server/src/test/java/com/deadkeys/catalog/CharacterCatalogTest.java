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

  @Test
  void registersMeteorManiaExclusiveMythicSet() {
    CharacterCatalog.Def titan = CharacterCatalog.find("outfit-starforged-titan");
    assertNotNull(titan);
    assertEquals(CharacterCatalog.OUTFIT, titan.slot());
    assertEquals(66_666, titan.cost());

    CharacterCatalog.Def phoenix = CharacterCatalog.find("outfit-cosmic-phoenix");
    assertNotNull(phoenix);
    assertEquals(CharacterCatalog.OUTFIT, phoenix.slot());
    assertEquals(66_666, phoenix.cost());

    CharacterCatalog.Def drone = CharacterCatalog.find("accessory-orbit-drone");
    assertNotNull(drone);
    assertEquals(CharacterCatalog.ACCESSORY, drone.slot());
    assertEquals(33_333, drone.cost());

    CharacterCatalog.Def crown = CharacterCatalog.find("accessory-saturn-crown");
    assertNotNull(crown);
    assertEquals(CharacterCatalog.ACCESSORY, crown.slot());
    assertEquals(33_333, crown.cost());
  }
}
