package com.deadkeys.persistence;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaderboardRepository extends JpaRepository<LeaderboardEntity, Long> {
  List<LeaderboardEntity> findAllByOrderByScoreDesc(Pageable pageable);

  Optional<LeaderboardEntity> findByOwnerId(String ownerId);
}
