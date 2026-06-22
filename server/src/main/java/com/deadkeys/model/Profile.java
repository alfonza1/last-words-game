package com.deadkeys.model;

/** A player's saved profile: identity + progress. */
public class Profile {
  public String guestId;
  public String name;
  public Stats stats = new Stats();
  public Upgrades upgrades = new Upgrades();
  public int upgradeGames = 0; // games remaining before upgrades expire

  public Profile() {}

  public Profile(String guestId, String name) {
    this.guestId = guestId;
    this.name = name;
  }
}
