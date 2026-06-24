package com.deadkeys.service;

import com.deadkeys.model.Profile;
import com.deadkeys.persistence.ProfileStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class ProfileServiceUpgradeTest {
  private ProfileService service;
  private Profile profile;

  @BeforeEach
  void setup() {
    service = new ProfileService(mock(ProfileStore.class), "", 0, 50);
    profile = new Profile("uid-1", "tester");
    profile.stats.totalCoins = 20_000;
  }

  @Test
  void eachPurchaseAddsFiveGames() {
    service.buyUpgrade(profile, "startShield");
    service.buyUpgrade(profile, "slowWaves");

    assertEquals(10, profile.upgradeGames);
    assertEquals(1, profile.upgrades.startShield);
    assertEquals(1, profile.upgrades.slowWaves);
  }

  @Test
  void cappedUpgradeCanBeRenewedForMoreGames() {
    service.buyUpgrade(profile, "startShield");
    service.buyUpgrade(profile, "startShield");
    service.buyUpgrade(profile, "startShield");
    service.buyUpgrade(profile, "startShield");

    assertEquals(3, profile.upgrades.startShield);
    assertEquals(20, profile.upgradeGames);
  }
}
