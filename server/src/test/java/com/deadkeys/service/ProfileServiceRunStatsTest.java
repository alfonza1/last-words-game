package com.deadkeys.service;

import com.deadkeys.model.Dtos.RunResult;
import com.deadkeys.model.Profile;
import com.deadkeys.persistence.ProfileStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class ProfileServiceRunStatsTest {
  private ProfileService service;
  private Profile profile;

  @BeforeEach
  void setup() {
    service = new ProfileService(mock(ProfileStore.class), "", 0, 50);
    profile = new Profile("uid-1", "tester");
    profile.stats.totalCoins = 100;
  }

  @Test
  void riddleRunsUseSeparateRecordsAndCreditTheSharedWallet() {
    boolean highScore = service.applyRun(profile, run(500, 8, 20, true));

    assertTrue(highScore);
    assertEquals(0, profile.stats.bestScore);
    assertEquals(120, profile.stats.totalCoins);
    assertEquals(500, profile.riddleStats.bestScore);
    assertEquals(8, profile.riddleStats.totalKills);
    assertEquals(20, profile.riddleStats.coinsEarned);
    assertEquals(20, profile.riddleStats.totalCoins);
    assertEquals(1, profile.riddleStats.gamesPlayed);
  }

  @Test
  void typingRunsDoNotChangeRiddleRecords() {
    service.applyRun(profile, run(300, 2, 10, false));

    assertEquals(300, profile.stats.bestScore);
    assertEquals(2, profile.stats.totalKills);
    assertEquals(10, profile.stats.coinsEarned);
    assertEquals(110, profile.stats.totalCoins);
    assertEquals(0, profile.riddleStats.bestScore);
    assertEquals(0, profile.riddleStats.gamesPlayed);
  }

  private static RunResult run(int score, int kills, int coins, boolean riddle) {
    return new RunResult(
        score, 3, 42, 96.5, 60_000,
        kills, 0, 4, coins, "survival", "normal", riddle, riddle ? "riddles" : "typing");
  }
}
