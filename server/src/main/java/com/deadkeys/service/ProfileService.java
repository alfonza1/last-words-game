package com.deadkeys.service;

import com.deadkeys.catalog.MapCatalog;
import com.deadkeys.catalog.PowerupCatalog;
import com.deadkeys.catalog.UpgradeCatalog;
import com.deadkeys.catalog.CharacterCatalog;
import com.deadkeys.exception.BadRequestException;
import com.deadkeys.model.CharacterLoadout;
import com.deadkeys.model.Dtos.LeaderboardEntry;
import com.deadkeys.model.Dtos.RunResult;
import com.deadkeys.model.Profile;
import com.deadkeys.model.Stats;
import com.deadkeys.model.Upgrades;
import com.deadkeys.persistence.ProfileStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.ArrayList;

/**
 * Domain logic for a player's profile: merging finished runs (with anti-cheat
 * sanity caps), buying upgrades / maps / powerups, and the once-per-week rename.
 * Keeps the web layer thin and all rules in one place.
 */
@Service
public class ProfileService {
  private static final Logger log = LoggerFactory.getLogger(ProfileService.class);
  private static final long USERNAME_COOLDOWN_MS = 7L * 24 * 60 * 60 * 1000; // once per week
  private static final long REWARD_COOLDOWN_MS = 20_000; // limit rewarded-ad spam

  // Anti-cheat: clamp a submitted run to plausible maxima before it is stored,
  // so a spoofed request can't inject an impossible score/coin haul.
  private static final int MAX_SCORE = 5_000_000;
  private static final int MAX_WAVE = 1_000;
  private static final int MAX_WPM = 400;
  private static final long MAX_SURVIVAL_MS = 6L * 60 * 60 * 1000; // 6 hours
  private static final int MAX_KILLS = 200_000;
  private static final int MAX_BOSSES = 5_000;
  private static final int MAX_STREAK = 200_000;
  private static final int MAX_COINS = 1_000_000;

  private final ProfileStore store;
  private final String grantUser;
  private final int grantCoins;
  private final int rewardCoins;

  public ProfileService(
      ProfileStore store,
      @Value("${deadkeys.grantUser:}") String grantUser,
      @Value("${deadkeys.grantCoins:30000}") int grantCoins,
      @Value("${deadkeys.rewardCoins:50}") int rewardCoins) {
    this.store = store;
    this.grantUser = grantUser;
    this.grantCoins = grantCoins;
    this.rewardCoins = rewardCoins;
  }

  /** The current account's profile (created on first sign-in), grant applied. */
  public Profile getOrCreate(String uid, String name) {
    Profile p = store.ensureProfile(uid, name);
    boolean changed = normalizeProfile(p);
    if (!p.granted) {
      maybeGrant(p);
      changed = changed || p.granted;
    }
    if (changed) store.save(p);
    return p;
  }

  /** Merge a finished (or abandoned) run into the profile + leaderboard. */
  public boolean applyRun(Profile profile, RunResult run) {
    RunResult safe = clamp(run);
    normalizeProfile(profile);
    Stats recordStats = safe.riddle() ? profile.riddleStats : profile.stats;
    boolean isHighScore = safe.score() > recordStats.bestScore && safe.score() > 0;
    mergeStats(recordStats, safe);
    // Coins are one shared wallet even though the record panels are separate.
    if (safe.riddle()) profile.stats.totalCoins += safe.coins();
    consumeUpgradeLife(profile);
    // One leaderboard row per player — only updated on a new personal best.
    store.upsertLeaderboard(profile.guestId, new LeaderboardEntry(
        null, profile.name, safe.score(), safe.wave(), safe.wpm(),
        safe.accuracy(), safe.mode(), safe.difficulty(), safe.riddle(), safe.style(), 0));
    store.save(profile);
    log.info("run applied uid={} score={} wave={} kills={} coins+={} highScore={}",
        profile.guestId, safe.score(), safe.wave(), safe.kills(), safe.coins(), isHighScore);
    return isHighScore;
  }

  /** Grant the rewarded-ad bonus (coins for watching an optional ad). */
  public int claimReward(Profile profile) {
    long now = System.currentTimeMillis();
    if (now - profile.lastRewardAt < REWARD_COOLDOWN_MS) {
      throw new BadRequestException("Reward not ready yet — play another match first.");
    }
    profile.lastRewardAt = now;
    profile.stats.totalCoins += rewardCoins;
    store.save(profile);
    log.info("reward claimed uid={} coins+={}", profile.guestId, rewardCoins);
    return rewardCoins;
  }

  private static RunResult clamp(RunResult r) {
    return new RunResult(
        clampInt(r.score(), MAX_SCORE),
        clampInt(r.wave(), MAX_WAVE),
        clampInt(r.wpm(), MAX_WPM),
        Math.max(0, Math.min(100, r.accuracy())),
        Math.max(0, Math.min(MAX_SURVIVAL_MS, r.survivalMs())),
        clampInt(r.kills(), MAX_KILLS),
        clampInt(r.bossesDefeated(), MAX_BOSSES),
        clampInt(r.streak(), MAX_STREAK),
        clampInt(r.coins(), MAX_COINS),
        r.missedWords(), r.mode(), r.difficulty(), r.riddle(), r.style());
  }

  private static int clampInt(int v, int max) {
    return Math.max(0, Math.min(max, v));
  }

  private static void mergeStats(Stats stats, RunResult run) {
    stats.bestScore = Math.max(stats.bestScore, run.score());
    stats.longestSurvivalMs = Math.max(stats.longestSurvivalMs, run.survivalMs());
    stats.highestWpm = Math.max(stats.highestWpm, run.wpm());
    stats.bestAccuracy = Math.max(stats.bestAccuracy, run.accuracy());
    stats.totalKills += run.kills();
    stats.bossesDefeated += run.bossesDefeated();
    stats.longestStreak = Math.max(stats.longestStreak, run.streak());
    stats.coinsEarned += run.coins();
    stats.totalCoins += run.coins();
    stats.gamesPlayed += 1;
    if (run.missedWords() != null) {
      for (Map.Entry<String, Integer> missed : run.missedWords().entrySet()) {
        stats.missedWords.merge(missed.getKey(), missed.getValue(), Integer::sum);
      }
    }
  }

  /** Each finished/abandoned run consumes one game of the upgrade lifespan. */
  private static void consumeUpgradeLife(Profile profile) {
    if (profile.upgradeGames <= 0) return;
    profile.upgradeGames -= 1;
    if (profile.upgradeGames <= 0) profile.upgrades = new Upgrades();
  }

  /** Buy one level of an upgrade. */
  public void buyUpgrade(Profile profile, String key) {
    if (key == null || key.isBlank()) throw new BadRequestException("upgrade key is required");
    UpgradeCatalog.Def def = UpgradeCatalog.find(key);
    if (def == null) throw new BadRequestException("unknown upgrade key: " + key);

    int currentLevel = profile.upgrades.get(key);
    int costLevel = Math.min(currentLevel, def.maxLevel() - 1);
    int cost = UpgradeCatalog.cost(def, costLevel);
    if (profile.stats.totalCoins < cost) throw new BadRequestException("not enough coins");

    if (currentLevel < def.maxLevel()) {
      profile.upgrades.set(key, currentLevel + 1);
    }
    profile.stats.totalCoins -= cost;
    profile.upgradeGames += UpgradeCatalog.LIFESPAN;
    store.save(profile);
    log.info("upgrade bought uid={} key={} strength={} games={} cost={}",
        profile.guestId, key, profile.upgrades.get(key), profile.upgradeGames, cost);
  }

  /** Update the display name. Limited to once per week per account. */
  public void setName(Profile profile, String name) {
    long now = System.currentTimeMillis();
    if (profile.usernameChangedAt > 0 && now - profile.usernameChangedAt < USERNAME_COOLDOWN_MS) {
      long days = Math.max(1, (USERNAME_COOLDOWN_MS - (now - profile.usernameChangedAt)) / (24L * 60 * 60 * 1000));
      throw new BadRequestException("You can change your username again in about " + days + " day(s).");
    }
    // Display names must be unique (case-insensitive) so leaderboard entries are
    // distinguishable. Recasing/keeping your own name doesn't count as taken.
    if (store.isNameTaken(name, profile.guestId)) {
      throw new BadRequestException("That username is already taken — please pick another.");
    }
    profile.name = name;
    profile.usernameChangedAt = now;
    maybeGrant(profile);
    store.save(profile);
  }

  /** Buy a map theme. */
  public void buyMap(Profile profile, String mapId) {
    MapCatalog.Def def = MapCatalog.find(mapId);
    if (def == null) throw new BadRequestException("unknown map");
    if (profile.maps.contains(mapId)) return; // already owned — no-op
    if (profile.stats.totalCoins < def.cost()) throw new BadRequestException("not enough coins");
    profile.stats.totalCoins -= def.cost();
    profile.maps.add(mapId);
    store.save(profile);
    log.info("map bought uid={} map={} cost={}", profile.guestId, mapId, def.cost());
  }

  /** Buy a permanent outfit or accessory. */
  public void buyCosmetic(Profile profile, String key) {
    CharacterCatalog.Def def = CharacterCatalog.find(key);
    if (def == null) throw new BadRequestException("unknown cosmetic");
    normalizeProfile(profile);
    if (profile.cosmetics.contains(key)) return;
    if (profile.stats.totalCoins < def.cost()) throw new BadRequestException("not enough coins");
    profile.stats.totalCoins -= def.cost();
    profile.cosmetics.add(key);
    store.save(profile);
    log.info("cosmetic bought uid={} key={} cost={}", profile.guestId, key, def.cost());
  }

  /** Equip a complete validated survivor appearance. */
  public void equipCharacter(
      Profile profile,
      String skinTone,
      String hair,
      String hairColor,
      String outfit,
      String accessory) {
    normalizeProfile(profile);
    if (!CharacterCatalog.SKIN_TONES.contains(skinTone)) throw new BadRequestException("unknown skin tone");
    if (!CharacterCatalog.HAIR_STYLES.contains(hair)) throw new BadRequestException("unknown hair style");
    if (!CharacterCatalog.HAIR_COLORS.contains(hairColor)) throw new BadRequestException("unknown hair color");

    CharacterCatalog.Def outfitDef = CharacterCatalog.find(outfit);
    if (outfitDef == null || !CharacterCatalog.OUTFIT.equals(outfitDef.slot())) {
      throw new BadRequestException("unknown outfit");
    }
    CharacterCatalog.Def accessoryDef = CharacterCatalog.find(accessory);
    if (accessoryDef == null || !CharacterCatalog.ACCESSORY.equals(accessoryDef.slot())) {
      throw new BadRequestException("unknown accessory");
    }
    if (!profile.cosmetics.contains(outfit) || !profile.cosmetics.contains(accessory)) {
      throw new BadRequestException("cosmetic is not owned");
    }

    profile.character.skinTone = skinTone;
    profile.character.hair = hair;
    profile.character.hairColor = hairColor;
    profile.character.outfit = outfit;
    profile.character.accessory = accessory;
    store.save(profile);
    log.info("character equipped uid={} outfit={} accessory={}", profile.guestId, outfit, accessory);
  }

  /** Buy one charge of a consumable powerup. */
  public void buyPowerup(Profile profile, String key) {
    PowerupCatalog.Def def = PowerupCatalog.find(key);
    if (def == null) throw new BadRequestException("unknown powerup");
    if (profile.stats.totalCoins < def.cost()) throw new BadRequestException("not enough coins");
    profile.stats.totalCoins -= def.cost();
    profile.powerups.merge(key, 1, Integer::sum);
    store.save(profile);
    log.info("powerup bought uid={} key={} cost={}", profile.guestId, key, def.cost());
  }

  /** Add coins from a completed coin-pack purchase (called after payment). */
  public void grantCoins(Profile profile, int coins) {
    profile.stats.totalCoins += coins;
    store.save(profile);
    log.info("coins granted uid={} coins+={}", profile.guestId, coins);
  }

  /** Spend one charge of a consumable powerup (used in-game). No-op if none owned. */
  public void usePowerup(Profile profile, String key) {
    int have = profile.powerups.getOrDefault(key, 0);
    if (have <= 0) return;
    profile.powerups.put(key, have - 1);
    store.save(profile);
  }

  /** Apply the one-time owner coin grant if this account matches the configured name. */
  public void maybeGrant(Profile profile) {
    if (profile.granted) return;
    if (grantUser == null || grantUser.isBlank()) return;
    if (!grantUser.equalsIgnoreCase(profile.name)) return;
    profile.stats.totalCoins += grantCoins;
    profile.granted = true;
  }

  /** Backfill fields for profiles saved before newer profile features existed. */
  private static boolean normalizeProfile(Profile profile) {
    boolean changed = false;
    if (profile.stats == null) {
      profile.stats = new Stats();
      changed = true;
    }
    if (profile.riddleStats == null) {
      profile.riddleStats = new Stats();
      changed = true;
    }
    if (profile.cosmetics == null) {
      profile.cosmetics = new ArrayList<>();
      changed = true;
    }
    for (String key : CharacterCatalog.DEFAULT_OWNED) {
      if (!profile.cosmetics.contains(key)) {
        profile.cosmetics.add(key);
        changed = true;
      }
    }
    if (profile.character == null) {
      profile.character = new CharacterLoadout();
      changed = true;
    }
    if (!CharacterCatalog.SKIN_TONES.contains(profile.character.skinTone)) {
      profile.character.skinTone = "warm";
      changed = true;
    }
    if (!CharacterCatalog.HAIR_STYLES.contains(profile.character.hair)) {
      profile.character.hair = "undercut";
      changed = true;
    }
    if (!CharacterCatalog.HAIR_COLORS.contains(profile.character.hairColor)) {
      profile.character.hairColor = "charcoal";
      changed = true;
    }
    if (!profile.cosmetics.contains(profile.character.outfit)) {
      profile.character.outfit = "outfit-field";
      changed = true;
    }
    if (!profile.cosmetics.contains(profile.character.accessory)) {
      profile.character.accessory = "accessory-none";
      changed = true;
    }
    return changed;
  }
}
