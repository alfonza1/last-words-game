package com.deadkeys.persistence;

import com.deadkeys.model.Dtos.LeaderboardEntry;
import com.deadkeys.model.Profile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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

  /** Get the profile for this account id, creating it on first sign-in. */
  @Transactional
  public Profile ensureProfile(String id, String name) {
    Profile existing = findProfile(id);
    if (existing != null) return existing;
    String handle = (name != null && !name.trim().isEmpty()) ? name.trim() : randomHandle();
    Profile p = new Profile(id, handle);
    save(p);
    return p;
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
    LeaderboardEntity e = leaderboard.findByOwnerId(ownerId).orElse(null);
    if (e != null && run.score() <= e.score) {
      return; // not a new personal best — leave the existing row untouched
    }
    if (e == null) {
      // Brand-new entrant: only store them if they'd crack the global top N,
      // so the table never grows beyond the leaderboard we actually show.
      List<LeaderboardEntity> top = leaderboard.findAllByOrderByScoreDesc(PageRequest.of(0, MAX_ENTRIES));
      if (top.size() >= MAX_ENTRIES && run.score() <= top.get(top.size() - 1).score) {
        return;
      }
      e = new LeaderboardEntity();
      e.ownerId = ownerId;
    }
    e.name = run.name();
    e.score = run.score();
    e.wave = run.wave();
    e.wpm = run.wpm();
    e.accuracy = run.accuracy();
    e.mode = run.mode();
    e.difficulty = run.difficulty();
    e.at = System.currentTimeMillis();
    leaderboard.save(e);
    pruneLeaderboard();
  }

  /** Keep only the global top {@link #MAX_ENTRIES} rows. */
  private void pruneLeaderboard() {
    List<LeaderboardEntity> all = leaderboard.findAll(Sort.by(Sort.Direction.DESC, "score"));
    if (all.size() > MAX_ENTRIES) {
      leaderboard.deleteAll(all.subList(MAX_ENTRIES, all.size()));
    }
  }

  @Transactional(readOnly = true)
  public List<LeaderboardEntry> topLeaderboard(int limit) {
    return leaderboard.findAllByOrderByScoreDesc(PageRequest.of(0, limit)).stream().map(this::toDto).toList();
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
        e.accuracy, e.mode, e.difficulty, e.at);
  }

  private static String randomHandle() {
    String[] a = {"calm", "swift", "sleepy", "brave", "rusty", "lucky", "grim", "pale"};
    String[] b = {"otter", "falcon", "panda", "yak", "lynx", "heron", "ghoul", "wraith"};
    return a[RNG.nextInt(a.length)] + "-" + b[RNG.nextInt(b.length)];
  }
}
