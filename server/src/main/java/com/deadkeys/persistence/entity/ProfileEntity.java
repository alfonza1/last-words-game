package com.deadkeys.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A player's profile row. The id is the account's Firebase uid. The aggregate
 * (stats, upgrades, owned maps/powerups) is stored as JSON in {@code json};
 * {@code name} is also a column so the leaderboard/display can use it directly.
 */
@Entity
@Table(name = "profiles")
public class ProfileEntity {
  @Id
  public String id;

  public String name;

  @Column(length = 100_000)
  public String json;

  public ProfileEntity() {}

  public ProfileEntity(String id, String name, String json) {
    this.id = id;
    this.name = name;
    this.json = json;
  }
}
