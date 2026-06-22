package com.deadkeys.model;

import java.util.LinkedHashMap;
import java.util.Map;

/** Lifetime player stats. Mirrors the frontend GameStats. */
public class Stats {
  public int bestScore = 0;
  public long longestSurvivalMs = 0;
  public int highestWpm = 0;
  public double bestAccuracy = 0;
  public int totalKills = 0;
  public int bossesDefeated = 0;
  public int longestStreak = 0;
  public int totalCoins = 0;
  public int gamesPlayed = 0;
  public Map<String, Integer> missedWords = new LinkedHashMap<>();
}
