package com.deadkeys.persistence;

import com.deadkeys.model.Dtos.LeaderboardEntry;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfileStoreLeaderboardTest {
  private LeaderboardRepository leaderboard;
  private ProfileStore store;

  @BeforeEach
  void setup() {
    leaderboard = mock(LeaderboardRepository.class);
    store = new ProfileStore(mock(ProfileRepository.class), leaderboard, new ObjectMapper());
  }

  @Test
  void typingBoardKeepsTheHighestWpmRunForEachPlayer() {
    LeaderboardEntity existing = row(1L, false, 2_000, 5, 80);
    when(leaderboard.findByOwnerIdAndRiddle("uid-1", false)).thenReturn(Optional.of(existing));
    when(leaderboard.findByRiddleOrderByWpmDescScoreDesc(false)).thenReturn(List.of(existing));

    store.upsertLeaderboard("uid-1", run(5_000, 7, 70, false));

    verify(leaderboard, never()).save(any());

    store.upsertLeaderboard("uid-1", run(1_000, 3, 90, false));

    ArgumentCaptor<LeaderboardEntity> saved = ArgumentCaptor.forClass(LeaderboardEntity.class);
    verify(leaderboard).save(saved.capture());
    assertEquals(90, saved.getValue().wpm);
    assertEquals(1_000, saved.getValue().score);
  }

  @Test
  void topTypingLeaderboardIsReadByWpm() {
    when(leaderboard.findByRiddleOrderByWpmDescScoreDesc(eq(false), any(Pageable.class)))
        .thenReturn(List.of(row(1L, false, 900, 2, 110), row(2L, false, 2_000, 5, 80)));

    List<LeaderboardEntry> entries = store.topLeaderboard(false, 20);

    assertEquals(110, entries.get(0).wpm());
    assertEquals(80, entries.get(1).wpm());
    verify(leaderboard).findByRiddleOrderByWpmDescScoreDesc(eq(false), any(Pageable.class));
    verify(leaderboard, never()).findByRiddleOrderByScoreDesc(eq(false), any(Pageable.class));
  }

  @Test
  void solverLeaderboardStillUsesScore() {
    when(leaderboard.findByRiddleOrderByScoreDesc(eq(true), any(Pageable.class)))
        .thenReturn(List.of(row(1L, true, 3_000, 8, 55), row(2L, true, 1_200, 5, 120)));

    List<LeaderboardEntry> entries = store.topLeaderboard(true, 20);

    assertEquals(3_000, entries.get(0).score());
    assertEquals(1_200, entries.get(1).score());
    verify(leaderboard).findByRiddleOrderByScoreDesc(eq(true), any(Pageable.class));
    verify(leaderboard, never()).findByRiddleOrderByWpmDescScoreDesc(eq(true), any(Pageable.class));
  }

  private static LeaderboardEntry run(int score, int wave, int wpm, boolean riddle) {
    return new LeaderboardEntry(
        null, "tester", score, wave, wpm, 97.0,
        "survival", "normal", riddle, riddle ? "riddles" : "typing", 0);
  }

  private static LeaderboardEntity row(Long id, boolean riddle, int score, int wave, int wpm) {
    LeaderboardEntity e = new LeaderboardEntity();
    e.id = id;
    e.ownerId = "uid-" + id;
    e.riddle = riddle;
    e.name = "player-" + id;
    e.score = score;
    e.wave = wave;
    e.wpm = wpm;
    e.accuracy = 97.0;
    e.mode = "survival";
    e.difficulty = "normal";
    e.style = riddle ? "riddles" : "typing";
    e.at = 1_000L + id;
    return e;
  }
}
