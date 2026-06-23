package com.deadkeys.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One submitted run on the global leaderboard. */
@Entity
@Table(name = "leaderboard")
public class LeaderboardEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  /** Account uid that owns this entry — one row per player (their best run). */
  @Column(unique = true)
  public String ownerId;

  public String name;
  public int score;
  public int wave;
  public int wpm;
  public double accuracy;
  public String mode;
  public String difficulty;
  public long at;
}
