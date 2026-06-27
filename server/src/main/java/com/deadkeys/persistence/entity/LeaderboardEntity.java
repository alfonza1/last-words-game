package com.deadkeys.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** One submitted run on the global leaderboard. */
@Entity
@Table(name = "leaderboard", uniqueConstraints = @UniqueConstraint(columnNames = {"ownerId", "riddle"}))
public class LeaderboardEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  /** Account uid — one row per player PER board (their best typing run and best riddle run). */
  public String ownerId;

  /** Which board this entry belongs to: true = Riddlers, false = Typers. */
  @Column(nullable = false, columnDefinition = "boolean default false")
  public boolean riddle;

  public String name;
  public int score;
  public int wave;
  public int wpm;
  public double accuracy;
  public String mode;
  public String difficulty;
  /** Play style of this run: typing / riddles / math / trivia (nullable for old rows). */
  public String style;
  public long at;
}
