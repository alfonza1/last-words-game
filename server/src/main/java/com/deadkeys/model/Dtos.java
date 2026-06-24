package com.deadkeys.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/** Request/response DTOs. */
public final class Dtos {
  private Dtos() {}

  public record Guest(String id, String name) {}

  public record LeaderboardEntry(
      String id, String name, int score, int wave, int wpm,
      double accuracy, String mode, String difficulty, boolean riddle, String style, long at) {}

  /** A finished run submitted by the client (mirrors RunResult + mode/difficulty). */
  @JsonIgnoreProperties(ignoreUnknown = true)
  public record RunResult(
      int score, int wave, int wpm, double accuracy, long survivalMs,
      int kills, int bossesDefeated, int streak, int coins,
      Map<String, Integer> missedWords, String mode, String difficulty, boolean riddle, String style) {}
}
