package com.deadkeys.store;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.deadkeys.model.Dtos.LeaderboardEntry;
import com.deadkeys.model.Profile;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * File-backed store so player progress + the leaderboard survive restarts
 * (unlike the in-memory incident-sim store — a game save should persist).
 */
@Component
public class Store {
  private final ObjectMapper mapper;

  @Value("${deadkeys.dataFile:dk-data.json}")
  private String dataFile;

  public final Map<String, Profile> profiles = new LinkedHashMap<>();
  public final List<LeaderboardEntry> leaderboard = new ArrayList<>();

  private static final Random RNG = new Random();
  private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  public Store(ObjectMapper mapper) {
    this.mapper = mapper;
  }

  /** Persisted shape. */
  public static class Snapshot {
    public Map<String, Profile> profiles = new LinkedHashMap<>();
    public List<LeaderboardEntry> leaderboard = new ArrayList<>();
  }

  @PostConstruct
  void load() {
    File f = new File(dataFile);
    if (!f.exists()) return;
    try {
      Snapshot snap = mapper.readValue(f, Snapshot.class);
      if (snap.profiles != null) profiles.putAll(snap.profiles);
      if (snap.leaderboard != null) leaderboard.addAll(snap.leaderboard);
    } catch (Exception e) {
      System.err.println("[dead-keys] could not read " + dataFile + ": " + e.getMessage());
    }
  }

  public synchronized void save() {
    Snapshot snap = new Snapshot();
    snap.profiles = new LinkedHashMap<>(profiles);
    snap.leaderboard = new ArrayList<>(leaderboard);
    try {
      mapper.writerWithDefaultPrettyPrinter().writeValue(new File(dataFile), snap);
    } catch (Exception e) {
      System.err.println("[dead-keys] could not write " + dataFile + ": " + e.getMessage());
    }
  }

  public Profile createProfile(String name) {
    String id = "guest-" + nanoid(10);
    String handle = (name != null && !name.trim().isEmpty()) ? name.trim() : randomHandle();
    Profile p = new Profile(id, handle);
    profiles.put(id, p);
    save();
    return p;
  }

  public Profile findProfile(String id) {
    return profiles.get(id);
  }

  public LeaderboardEntry addLeaderboardEntry(LeaderboardEntry partial) {
    LeaderboardEntry full = new LeaderboardEntry("lb-" + nanoid(8), partial.name(), partial.score(),
        partial.wave(), partial.wpm(), partial.accuracy(), partial.mode(), partial.difficulty(),
        System.currentTimeMillis());
    leaderboard.add(full);
    leaderboard.sort(Comparator.comparingInt(LeaderboardEntry::score).reversed());
    return full;
  }

  public List<LeaderboardEntry> topLeaderboard(int limit) {
    List<LeaderboardEntry> copy = new ArrayList<>(leaderboard);
    copy.sort(Comparator.comparingInt(LeaderboardEntry::score).reversed());
    return copy.subList(0, Math.min(limit, copy.size()));
  }

  public static String nanoid(int len) {
    StringBuilder sb = new StringBuilder(len);
    for (int i = 0; i < len; i++) sb.append(ALPHABET.charAt(RNG.nextInt(ALPHABET.length())));
    return sb.toString();
  }

  private static String randomHandle() {
    String[] a = {"calm", "swift", "sleepy", "brave", "rusty", "lucky", "grim", "pale"};
    String[] b = {"otter", "falcon", "panda", "yak", "lynx", "heron", "ghoul", "wraith"};
    return a[RNG.nextInt(a.length)] + "-" + b[RNG.nextInt(b.length)];
  }
}
