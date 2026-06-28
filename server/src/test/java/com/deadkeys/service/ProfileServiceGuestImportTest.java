package com.deadkeys.service;

import com.deadkeys.model.CharacterLoadout;
import com.deadkeys.model.Dtos.GuestProgressImport;
import com.deadkeys.model.Profile;
import com.deadkeys.model.Stats;
import com.deadkeys.model.Upgrades;
import com.deadkeys.persistence.ProfileStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfileServiceGuestImportTest {
  private ProfileStore store;
  private ProfileService service;
  private Profile profile;

  @BeforeEach
  void setup() {
    store = mock(ProfileStore.class);
    service = new ProfileService(store, "", 0, 50);
    profile = new Profile("uid-1", "account-name");
  }

  @Test
  void importsGuestProgressOnceAndKeepsAccountName() {
    Stats stats = new Stats();
    stats.bestScore = 1_200;
    stats.bestMode = "typing";
    stats.totalKills = 45;
    stats.coinsEarned = 900;
    stats.totalCoins = 275;
    stats.gamesPlayed = 4;
    Stats riddleStats = new Stats();
    riddleStats.bestScore = 500;
    riddleStats.bestMode = "trivia";
    riddleStats.gamesPlayed = 2;

    Upgrades upgrades = new Upgrades();
    upgrades.maxHealth = 2;
    upgrades.startShield = 1;

    CharacterLoadout character = new CharacterLoadout();
    character.skinTone = "deep";
    character.hair = "mohawk";
    character.hairColor = "cyan";
    character.expression = "haunted";
    character.outfit = "outfit-hoodie";
    character.accessory = "unknown-accessory";

    GuestProgressImport guest = new GuestProgressImport(
        stats,
        riddleStats,
        upgrades,
        4,
        Map.of("grenade", 2, "unknown", 99),
        List.of("graveyard", "city", "unknown"),
        List.of("outfit-field", "accessory-none", "outfit-hoodie", "unknown"),
        character);

    when(store.ensureProfile("uid-1", "account-name"))
        .thenReturn(new ProfileStore.EnsuredProfile(profile, true))
        .thenReturn(new ProfileStore.EnsuredProfile(profile, false));

    ProfileService.ProfileBootstrap first = service.bootstrapProfile("uid-1", "account-name", guest);
    assertTrue(first.created());
    assertTrue(first.imported());
    assertEquals("account-name", profile.name);
    assertEquals(1_200, profile.stats.bestScore);
    assertEquals("typing", profile.stats.bestMode);
    assertEquals(275, profile.stats.totalCoins);
    assertEquals(4, profile.stats.gamesPlayed);
    assertEquals(500, profile.riddleStats.bestScore);
    assertEquals("trivia", profile.riddleStats.bestMode);
    assertEquals(2, profile.upgrades.maxHealth);
    assertEquals(1, profile.upgrades.startShield);
    assertEquals(4, profile.upgradeGames);
    assertEquals(2, profile.powerups.get("grenade"));
    assertFalse(profile.powerups.containsKey("unknown"));
    assertTrue(profile.maps.contains("city"));
    assertFalse(profile.maps.contains("unknown"));
    assertTrue(profile.cosmetics.contains("outfit-hoodie"));
    assertFalse(profile.cosmetics.contains("unknown"));
    assertEquals("deep", profile.character.skinTone);
    assertEquals("haunted", profile.character.expression);
    assertEquals("outfit-hoodie", profile.character.outfit);
    assertEquals("accessory-none", profile.character.accessory);
    assertTrue(profile.guestProgressImported);

    ProfileService.ProfileBootstrap second = service.bootstrapProfile("uid-1", "account-name", guest);
    assertFalse(second.created());
    assertFalse(second.imported());
    assertEquals(275, profile.stats.totalCoins);
    verify(store, times(1)).save(profile);
  }

  @Test
  void existingAccountNeverImportsGuestProgress() {
    profile.stats.totalCoins = 500;
    Stats stats = new Stats();
    stats.totalCoins = 2_000;
    stats.gamesPlayed = 10;
    GuestProgressImport guest = new GuestProgressImport(
        stats, null, null, 0, null, List.of("city"), null, null);

    when(store.ensureProfile("uid-1", "account-name"))
        .thenReturn(new ProfileStore.EnsuredProfile(profile, false));

    ProfileService.ProfileBootstrap result = service.bootstrapProfile("uid-1", "account-name", guest);

    assertFalse(result.created());
    assertFalse(result.imported());
    assertEquals(500, profile.stats.totalCoins);
    assertFalse(profile.maps.contains("city"));
    verify(store, never()).save(profile);
  }

  @Test
  void clampsImportedValuesAndRejectsUnknownInventory() {
    profile.stats.totalCoins = 25_000_000;
    Stats stats = new Stats();
    stats.bestScore = Integer.MAX_VALUE;
    stats.totalCoins = Integer.MAX_VALUE;
    stats.bestAccuracy = 1_000;
    stats.gamesPlayed = Integer.MAX_VALUE;

    Upgrades upgrades = new Upgrades();
    upgrades.maxHealth = 999;

    GuestProgressImport guest = new GuestProgressImport(
        stats,
        null,
        upgrades,
        999,
        Map.of("medkit", Integer.MAX_VALUE),
        List.of("not-a-map"),
        List.of("not-a-cosmetic"),
        null);

    when(store.ensureProfile("uid-1", "account-name"))
        .thenReturn(new ProfileStore.EnsuredProfile(profile, true));

    assertTrue(service.bootstrapProfile("uid-1", "account-name", guest).imported());
    assertEquals(5_000_000, profile.stats.bestScore);
    assertEquals(35_000_000, profile.stats.totalCoins);
    assertEquals(100, profile.stats.bestAccuracy);
    assertEquals(100_000, profile.stats.gamesPlayed);
    assertEquals(5, profile.upgrades.maxHealth);
    assertEquals(5, profile.upgradeGames);
    assertEquals(1_000, profile.powerups.get("medkit"));
    assertFalse(profile.maps.contains("not-a-map"));
    assertFalse(profile.cosmetics.contains("not-a-cosmetic"));
  }
}
