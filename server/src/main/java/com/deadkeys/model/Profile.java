package com.deadkeys.model;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** A player's saved profile: identity + progress. The id is the account's
 *  Firebase uid (a player can only ever read/modify their own profile). */
public class Profile {
  /** Account id (Firebase uid). Field name kept for client compatibility. */
  public String guestId;
  public String name;
  /** The account's verified email from the auth provider (null if not captured
   *  yet). Set from the signed-in token, never edited by the player. */
  public String email;
  /** Typing-mode records plus the shared coin wallet. */
  public Stats stats = new Stats();
  /** Records earned specifically while playing Riddle Mode. */
  public Stats riddleStats = new Stats();
  public Upgrades upgrades = new Upgrades();
  public int upgradeGames = 0; // games remaining before upgrades expire
  /** Consumable powerup charges bought in the store (key -> count). */
  public Map<String, Integer> powerups = new LinkedHashMap<>();
  /** Map theme ids the player owns. The graveyard is always free. */
  public List<String> maps = new ArrayList<>(List.of("graveyard"));
  /** Character cosmetic ids the player owns by default or has purchased. */
  public List<String> cosmetics = new ArrayList<>(
      List.of("outfit-field", "accessory-none"));
  /** The survivor appearance shown in menus and during runs. */
  public CharacterLoadout character = new CharacterLoadout();
  /** Epoch millis of the last username change (username is limited to once/week). */
  public long usernameChangedAt = 0;
  /** True once the one-time owner coin grant has been applied. */
  public boolean granted = false;
  /** Epoch millis of the last rewarded-ad claim (cooldown to limit abuse). */
  public long lastRewardAt = 0;
  /** True after local guest progress has been transferred into this account. */
  public boolean guestProgressImported = false;

  public Profile() {}

  public Profile(String guestId, String name) {
    this.guestId = guestId;
    this.name = name;
  }
}
