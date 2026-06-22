package com.deadkeys.service;

import com.deadkeys.model.Dtos.LeaderboardEntry;
import com.deadkeys.model.Dtos.RunResult;
import com.deadkeys.model.Profile;
import com.deadkeys.model.Stats;
import com.deadkeys.model.Upgrades;
import com.deadkeys.store.Store;
import com.deadkeys.upgrades.UpgradeCatalog;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Domain logic for a player's profile: merging finished runs, buying upgrades,
 * and the testing grant. Keeps the web layer thin and the rules in one place.
 */
@Service
public class ProfileService {
  private static final int DEV_GRANT_COINS = 30_000;
  private static final int DEV_GRANT_MIN_KILLS = 250;
  private static final int DEV_GRANT_MIN_BOSSES = 3;

  private final Store store;

  public ProfileService(Store store) {
    this.store = store;
  }

  /** Merge a finished run into the profile and record it on the leaderboard. */
  public boolean applyRun(Profile profile, RunResult run) {
    boolean isHighScore = run.score() > profile.stats.bestScore && run.score() > 0;
    mergeStats(profile.stats, run);
    consumeUpgradeLife(profile);
    store.addLeaderboardEntry(new LeaderboardEntry(
        null, profile.name, run.score(), run.wave(), run.wpm(),
        run.accuracy(), run.mode(), run.difficulty(), 0));
    store.save();
    return isHighScore;
  }

  private static void mergeStats(Stats stats, RunResult run) {
    stats.bestScore = Math.max(stats.bestScore, run.score());
    stats.longestSurvivalMs = Math.max(stats.longestSurvivalMs, run.survivalMs());
    stats.highestWpm = Math.max(stats.highestWpm, run.wpm());
    stats.bestAccuracy = Math.max(stats.bestAccuracy, run.accuracy());
    stats.totalKills += run.kills();
    stats.bossesDefeated += run.bossesDefeated();
    stats.longestStreak = Math.max(stats.longestStreak, run.streak());
    stats.totalCoins += run.coins();
    stats.gamesPlayed += 1;
    if (run.missedWords() != null) {
      for (Map.Entry<String, Integer> missed : run.missedWords().entrySet()) {
        stats.missedWords.merge(missed.getKey(), missed.getValue(), Integer::sum);
      }
    }
  }

  /** Each finished run consumes one game of the upgrade lifespan; expire at zero. */
  private static void consumeUpgradeLife(Profile profile) {
    if (profile.upgradeGames <= 0) return;
    profile.upgradeGames -= 1;
    if (profile.upgradeGames <= 0) profile.upgrades = new Upgrades();
  }

  /** Buy one level of an upgrade. Throws {@link UpgradeException} when not allowed. */
  public void buyUpgrade(Profile profile, String key) {
    if (key == null || key.isBlank()) throw new UpgradeException("upgrade key is required");
    UpgradeCatalog.Def def = UpgradeCatalog.find(key);
    if (def == null) throw new UpgradeException("unknown upgrade key: " + key);

    int currentLevel = profile.upgrades.get(key);
    if (currentLevel >= def.maxLevel()) throw new UpgradeException("upgrade already maxed");

    int cost = UpgradeCatalog.cost(def, currentLevel);
    if (profile.stats.totalCoins < cost) throw new UpgradeException("not enough coins");

    profile.upgrades.set(key, currentLevel + 1);
    profile.stats.totalCoins -= cost;
    profile.upgradeGames = UpgradeCatalog.LIFESPAN; // a purchase (re)starts the timer
    store.save();
  }

  /** Testing helper: top up coins and the stats that unlock maps. */
  public void applyDevGrant(Profile profile) {
    profile.stats.totalCoins += DEV_GRANT_COINS;
    profile.stats.totalKills = Math.max(profile.stats.totalKills, DEV_GRANT_MIN_KILLS);
    profile.stats.bossesDefeated = Math.max(profile.stats.bossesDefeated, DEV_GRANT_MIN_BOSSES);
    store.save();
  }
}
