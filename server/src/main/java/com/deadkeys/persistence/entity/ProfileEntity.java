package com.deadkeys.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * A player's profile row. The id is the account's Firebase uid. The aggregate
 * (stats, upgrades, owned maps/powerups) is stored as JSON in {@code json};
 * {@code name} and {@code email} are also columns so the leaderboard/display
 * and account lookups can use them directly.
 */
@Entity
@Table(name = "profiles", indexes = @Index(name = "idx_profiles_email", columnList = "email"))
public class ProfileEntity {
  @Id
  public String id;

  public String name;

  /**
   * The account's verified email (from the auth provider), or null for profiles
   * created before it was captured. Indexed so accounts can be found by email —
   * e.g. to relink after an auth-provider change, or for opt-in emails.
   */
  public String email;

  @Column(length = 100_000)
  public String json;

  public ProfileEntity() {}

  public ProfileEntity(String id, String name, String email, String json) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.json = json;
  }
}
