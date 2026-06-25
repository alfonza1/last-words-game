package com.deadkeys.persistence;

import com.deadkeys.model.Dtos.LeaderboardEntry;
import com.deadkeys.model.Profile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

/**
 * Data-access facade over the JPA repositories. Profiles are (de)serialized to
 * JSON for storage; the leaderboard is a normal relational table. Backed by H2
 * in dev and Postgres in prod (selected purely by datasource env vars).
 */
@Component
public class ProfileStore {
  public record EnsuredProfile(Profile profile, boolean created) {}

  private final ProfileRepository profiles;
  private final LeaderboardRepository leaderboard;
  private final ObjectMapper mapper;

  private static final Random RNG = new Random();
  /** Global leaderboard size — only the world's top N are ever stored. */
  private static final int MAX_ENTRIES = 20;

  public ProfileStore(ProfileRepository profiles, LeaderboardRepository leaderboard, ObjectMapper mapper) {
    this.profiles = profiles;
    this.leaderboard = leaderboard;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public Profile findProfile(String id) {
    return profiles.findById(id).map(this::deserialize).orElse(null);
  }

  /**
   * Whether {@code name} is already used by a DIFFERENT account (case-insensitive).
   * {@code exceptId} is the caller's own uid, so keeping/recasing their own name
   * never counts as taken.
   */
  @Transactional(readOnly = true)
  public boolean isNameTaken(String name, String exceptId) {
    return profiles.findByNameIgnoreCase(name).stream()
        .anyMatch(e -> !e.id.equals(exceptId));
  }

  /** Get the profile for this account id, reporting whether this call created it. */
  @Transactional
  public EnsuredProfile ensureProfile(String id, String name) {
    Profile existing = findProfile(id);
    if (existing != null) return new EnsuredProfile(existing, false);
    String handle = (name != null && !name.trim().isEmpty()) ? name.trim() : randomHandle();
    Profile p = new Profile(id, handle);
    save(p);
    return new EnsuredProfile(p, true);
  }

  @Transactional
  public void save(Profile p) {
    profiles.save(new ProfileEntity(p.guestId, p.name, serialize(p)));
  }

  /**
   * Record a run on the leaderboard, keeping only ONE row per player (their best
   * score). Prevents the table from filling up with every replay.
   */
  @Transactional
  public void upsertLeaderboard(String ownerId, LeaderboardEntry run) {
    // Two independent boards keyed by run.riddle(): Typers (false) and Riddlers (true).
    boolean riddle = run.riddle();
    LeaderboardEntity e = leaderboard.findByOwnerIdAndRiddle(ownerId, riddle).orElse(null);
    if (e != null && run.score() <= e.score) {
      return; // not a new personal best on this board — leave the row untouched
    }
    if (e == null) {
      // Brand-new entrant: only store them if they'd crack this board's top N,
      // so the table never grows beyond the leaderboards we actually show.
      List<LeaderboardEntity> top = leaderboard.findByRiddleOrderByScoreDesc(riddle, PageRequest.of(0, MAX_ENTRIES));
      if (top.size() >= MAX_ENTRIES && run.score() <= top.get(top.size() - 1).score) {
        return;
      }
      e = new LeaderboardEntity();
      e.ownerId = ownerId;
      e.riddle = riddle;
    }
    e.name = run.name();
    e.score = run.score();
    e.wave = run.wave();
    e.wpm = run.wpm();
    e.accuracy = run.accuracy();
    e.mode = run.mode();
    e.difficulty = run.difficulty();
    e.style = run.style();
    e.at = System.currentTimeMillis();
    leaderboard.save(e);
    pruneLeaderboard(riddle);
  }

  /** Keep only the top {@link #MAX_ENTRIES} rows on one board. */
  private void pruneLeaderboard(boolean riddle) {
    List<LeaderboardEntity> all = leaderboard.findByRiddleOrderByScoreDesc(riddle);
    if (all.size() > MAX_ENTRIES) {
      leaderboard.deleteAll(all.subList(MAX_ENTRIES, all.size()));
    }
  }

  @Transactional(readOnly = true)
  public List<LeaderboardEntry> topLeaderboard(boolean riddle, int limit) {
    return leaderboard.findByRiddleOrderByScoreDesc(riddle, PageRequest.of(0, limit)).stream().map(this::toDto).toList();
  }

  public long countProfiles() {
    return profiles.count();
  }

  public long countLeaderboard() {
    return leaderboard.count();
  }

  // --- helpers --------------------------------------------------------------

  private Profile deserialize(ProfileEntity e) {
    try {
      return mapper.readValue(e.json, Profile.class);
    } catch (Exception ex) {
      throw new IllegalStateException("corrupt profile " + e.id, ex);
    }
  }

  private String serialize(Profile p) {
    try {
      return mapper.writeValueAsString(p);
    } catch (Exception ex) {
      throw new IllegalStateException("could not serialize profile " + p.guestId, ex);
    }
  }

  private LeaderboardEntry toDto(LeaderboardEntity e) {
    return new LeaderboardEntry("lb-" + e.id, e.name, e.score, e.wave, e.wpm,
        e.accuracy, e.mode, e.difficulty, e.riddle, e.style, e.at);
  }

  private static String randomHandle() {
    String[] a = {"calm", "swift", "sleepy", "brave", "rusty", "lucky", "grim", "pale"};
    String[] b = {"otter", "falcon", "panda", "yak", "lynx", "heron", "ghoul", "wraith"};
    return a[RNG.nextInt(a.length)] + "-" + b[RNG.nextInt(b.length)];
  }
}
