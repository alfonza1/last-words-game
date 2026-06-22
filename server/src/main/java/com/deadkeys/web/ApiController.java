package com.deadkeys.web;

import com.deadkeys.model.Dtos.Guest;
import com.deadkeys.model.Dtos.RunResult;
import com.deadkeys.model.Profile;
import com.deadkeys.service.ProfileService;
import com.deadkeys.service.UpgradeException;
import com.deadkeys.store.Store;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * HTTP layer only: parse requests, delegate to the store / {@link ProfileService},
 * and shape JSON responses. All game rules live in the service.
 */
@RestController
public class ApiController {
  private static final int MAX_LEADERBOARD_LIMIT = 100;
  private static final int DEFAULT_LEADERBOARD_LIMIT = 20;

  private final Store store;
  private final ProfileService profileService;

  public ApiController(Store store, ProfileService profileService) {
    this.store = store;
    this.profileService = profileService;
  }

  @GetMapping({"/health", "/api/health"})
  public Object health() {
    return json("status", "ok", "version", "1.0.0",
        "profiles", store.profiles.size(), "leaderboard", store.leaderboard.size());
  }

  @PostMapping("/api/guest")
  public Object createGuest(@RequestBody(required = false) Map<String, Object> body) {
    String name = readString(body, "name");
    Profile profile = store.createProfile(name);
    return json("guest", new Guest(profile.guestId, profile.name), "profile", profile);
  }

  @GetMapping("/api/profile/{id}")
  public Object getProfile(@PathVariable String id) {
    return json("profile", requireProfile(id));
  }

  @PostMapping("/api/profile/{id}/run")
  public Object submitRun(@PathVariable String id, @RequestBody RunResult run) {
    Profile profile = requireProfile(id);
    boolean isHighScore = profileService.applyRun(profile, run);
    return json("profile", profile, "isHighScore", isHighScore);
  }

  @PostMapping("/api/profile/{id}/buy")
  public Object buyUpgrade(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
    Profile profile = requireProfile(id);
    profileService.buyUpgrade(profile, readString(body, "key"));
    return json("profile", profile);
  }

  @PostMapping("/api/profile/{id}/devgrant")
  public Object devGrant(@PathVariable String id) {
    Profile profile = requireProfile(id);
    profileService.applyDevGrant(profile);
    return json("profile", profile);
  }

  @GetMapping("/api/leaderboard")
  public Object getLeaderboard(@RequestParam(defaultValue = "20") int limit) {
    int safeLimit = Math.min(MAX_LEADERBOARD_LIMIT, limit <= 0 ? DEFAULT_LEADERBOARD_LIMIT : limit);
    return json("leaderboard", store.topLeaderboard(safeLimit));
  }

  // --- helpers ---------------------------------------------------------------

  private Profile requireProfile(String id) {
    Profile profile = store.findProfile(id);
    if (profile == null) throw new NotFoundException("profile not found");
    return profile;
  }

  private static String readString(Map<String, Object> body, String key) {
    return body != null && body.get(key) instanceof String value ? value : null;
  }

  /** Build an ordered JSON object from alternating key/value pairs. */
  private static Map<String, Object> json(Object... keyValuePairs) {
    Map<String, Object> out = new LinkedHashMap<>();
    for (int i = 0; i < keyValuePairs.length; i += 2) {
      out.put((String) keyValuePairs[i], keyValuePairs[i + 1]);
    }
    return out;
  }

  // --- error mapping ---------------------------------------------------------

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<Object> onNotFound(NotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(json("error", e.getMessage()));
  }

  @ExceptionHandler(UpgradeException.class)
  public ResponseEntity<Object> onUpgradeError(UpgradeException e) {
    return ResponseEntity.badRequest().body(json("error", e.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Object> onError(Exception e) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(json("error", "internal error", "message", e.getMessage()));
  }
}
