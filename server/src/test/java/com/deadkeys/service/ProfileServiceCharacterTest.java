package com.deadkeys.service;

import com.deadkeys.exception.BadRequestException;
import com.deadkeys.model.Profile;
import com.deadkeys.persistence.ProfileStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class ProfileServiceCharacterTest {
  private ProfileStore store;
  private ProfileService service;
  private Profile profile;

  @BeforeEach
  void setup() {
    store = mock(ProfileStore.class);
    service = new ProfileService(store, "", 0, 50);
    profile = new Profile("uid-1", "tester");
    profile.stats.totalCoins = 4_000;
  }

  @Test
  void buyingCosmeticDeductsCoinsAndAddsOwnership() {
    service.buyCosmetic(profile, "outfit-neon"); // costs 2600

    assertEquals(1_400, profile.stats.totalCoins);
    assertTrue(profile.cosmetics.contains("outfit-neon"));
    verify(store).save(profile);
  }

  @Test
  void newProfilesDefaultToBuzzHair() {
    assertEquals("buzz", profile.character.hair);
    assertEquals("last-light", profile.character.expression);
  }

  @Test
  void signalHoodieMustBePurchased() {
    service.buyCosmetic(profile, "outfit-hoodie");

    assertEquals(3_200, profile.stats.totalCoins);
    assertTrue(profile.cosmetics.contains("outfit-hoodie"));
    verify(store).save(profile);
  }

  @Test
  void ownedCosmeticsCanBeEquippedWithFreeAppearanceChoices() {
    profile.cosmetics.add("outfit-neon");
    profile.cosmetics.add("accessory-goggles");

    service.equipCharacter(profile, "deep", "mohawk", "cyan", "blood-rush", "outfit-neon", "accessory-goggles");

    assertEquals("deep", profile.character.skinTone);
    assertEquals("mohawk", profile.character.hair);
    assertEquals("cyan", profile.character.hairColor);
    assertEquals("blood-rush", profile.character.expression);
    assertEquals("outfit-neon", profile.character.outfit);
    assertEquals("accessory-goggles", profile.character.accessory);
    verify(store).save(profile);
  }

  @Test
  void unownedCosmeticCannotBeEquipped() {
    assertThrows(
        BadRequestException.class,
        () -> service.equipCharacter(
            profile, "warm", "buzz", "charcoal", "last-light", "outfit-inferno", "accessory-none"));
  }

  @Test
  void rejectsUnknownExpressions() {
    assertThrows(
        BadRequestException.class,
        () -> service.equipCharacter(
            profile, "warm", "buzz", "charcoal", "possessed", "outfit-field", "accessory-none"));
  }
}
