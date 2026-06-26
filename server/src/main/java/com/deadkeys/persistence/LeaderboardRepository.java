package com.deadkeys.persistence;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaderboardRepository extends JpaRepository<LeaderboardEntity, Long> {
  /** Top runs on one board (true = Riddlers, false = Typers), highest score first. */
  List<LeaderboardEntity> findByRiddleOrderByScoreDesc(boolean riddle, Pageable pageable);

  /** Top runs on one board (true = Riddlers, false = Typers), highest WPM first. */
  List<LeaderboardEntity> findByRiddleOrderByWpmDescScoreDesc(boolean riddle, Pageable pageable);

  /** A player's existing row on a given board, if any. */
  Optional<LeaderboardEntity> findByOwnerIdAndRiddle(String ownerId, boolean riddle);

  /** All rows on one board (for pruning), highest score first. */
  List<LeaderboardEntity> findByRiddleOrderByScoreDesc(boolean riddle);

  /** All rows on one board (for pruning), highest WPM first. */
  List<LeaderboardEntity> findByRiddleOrderByWpmDescScoreDesc(boolean riddle);
}
