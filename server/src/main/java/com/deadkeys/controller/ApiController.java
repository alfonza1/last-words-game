package com.deadkeys.controller;

import com.deadkeys.catalog.CoinPackCatalog;
import com.deadkeys.exception.BadRequestException;
import com.deadkeys.exception.NotFoundException;
import com.deadkeys.model.Dtos.GuestProgressImport;
import com.deadkeys.model.Dtos.RunResult;
import com.deadkeys.model.Profile;
import com.deadkeys.persistence.ProfileStore;
import com.deadkeys.security.FirebaseAuthFilter;
import com.deadkeys.service.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * HTTP layer only. Every {@code /api/profile/**} call acts on the CURRENT
 * authenticated account (the uid from the verified Firebase token), never an
 * id supplied by the client — so a player can only ever touch their own data.
 */
@RestController
public class ApiController {
  private static final int MAX_LEADERBOARD_LIMIT = 100;
  private static final int DEFAULT_LEADERBOARD_LIMIT = 20;

  private static final Logger log = LoggerFactory.getLogger(ApiController.class);

  private final ProfileStore store;
  private final ProfileService profileService;

  @Value("${stripe.secretKey:}")
  private String stripeSecretKey;

  public ApiController(ProfileStore store, ProfileService profileService) {
    this.store = store;
    this.profileService = profileService;
  }

  /**
   * Shallow liveness — process status only, no database. Cheap for frequent
   * uptime checks and deploy smoke tests so they don't wake Neon every time.
   */
  @GetMapping({"/health", "/api/health"})
  public Object health() {
    return json("status", "ok", "version", "1.0.0");
  }

  /**
   * Readiness — intentionally touches the database to verify connectivity.
   * Call this only when a DB check is specifically required, not on a loop.
   */
  @GetMapping({"/ready", "/api/ready"})
  public Object ready() {
    return json("status", "ready", "version", "1.0.0",
        "profiles", store.countProfiles(), "leaderboard", store.countLeaderboard());
  }

  @GetMapping("/api/profile")
  public Object getProfile(HttpServletRequest req) {
    return json("profile", current(req));
  }

  @PostMapping("/api/profile/bootstrap")
  public Object bootstrapProfile(HttpServletRequest req, @RequestBody(required = false) GuestProgressImport guest) {
    String uid = currentUid(req);
    String name = (String) req.getAttribute(FirebaseAuthFilter.NAME_ATTR);
    ProfileService.ProfileBootstrap result = profileService.bootstrapProfile(uid, name, guest);
    return json(
        "profile", result.profile(),
        "created", result.created(),
        "imported", result.imported());
  }

  @PostMapping("/api/profile/run")
  public Object submitRun(HttpServletRequest req, @RequestBody RunResult run) {
    Profile profile = current(req);
    boolean isHighScore = profileService.applyRun(profile, run);
    return json("profile", profile, "isHighScore", isHighScore);
  }

  @PostMapping("/api/profile/buy")
  public Object buyUpgrade(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    Profile profile = current(req);
    profileService.buyUpgrade(profile, readString(body, "key"));
    return json("profile", profile);
  }

  @PostMapping("/api/profile/name")
  public Object setName(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    Profile profile = current(req);
    String raw = readString(body, "name");
    String name = raw == null ? "" : raw.trim();
    if (name.length() < 2 || name.length() > 20) {
      throw new BadRequestException("Username must be 2–20 characters.");
    }
    profileService.setName(profile, name);
    return json("profile", profile);
  }

  @PostMapping("/api/profile/buy-powerup")
  public Object buyPowerup(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    Profile profile = current(req);
    profileService.buyPowerup(profile, readString(body, "key"));
    return json("profile", profile);
  }

  @PostMapping("/api/profile/use-powerup")
  public Object usePowerup(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    Profile profile = current(req);
    profileService.usePowerup(profile, readString(body, "key"));
    return json("profile", profile);
  }

  @PostMapping("/api/profile/buy-map")
  public Object buyMap(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    Profile profile = current(req);
    profileService.buyMap(profile, readString(body, "mapId"));
    return json("profile", profile);
  }

  @PostMapping("/api/profile/buy-cosmetic")
  public Object buyCosmetic(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    Profile profile = current(req);
    profileService.buyCosmetic(profile, readString(body, "key"));
    return json("profile", profile);
  }

  @PostMapping("/api/profile/equip-character")
  public Object equipCharacter(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    Profile profile = current(req);
    profileService.equipCharacter(
        profile,
        readString(body, "skinTone"),
        readString(body, "hair"),
        readString(body, "hairColor"),
        readString(body, "expression"),
        readString(body, "outfit"),
        readString(body, "accessory"));
    return json("profile", profile);
  }

  @PostMapping("/api/profile/reward")
  public Object claimReward(HttpServletRequest req) {
    Profile profile = current(req);
    int coins = profileService.claimReward(profile);
    return json("profile", profile, "reward", coins);
  }

  /**
   * Start a coin-pack purchase. Returns 503 until Stripe is configured (set
   * STRIPE_SECRET_KEY); the real flow will create a Checkout Session and a
   * webhook will credit coins after payment. See docs/DEPLOYMENT.md.
   */
  @PostMapping("/api/billing/checkout")
  public ResponseEntity<Object> checkout(HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    current(req); // must be authenticated
    String packId = readString(body, "packId");
    if (CoinPackCatalog.find(packId) == null) throw new BadRequestException("unknown coin pack");
    if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .body(json("error", "Coin packs aren’t available yet — check back soon."));
    }
    // TODO(setup): create a Stripe Checkout Session for `packId` and return its url.
    return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
        .body(json("error", "Checkout is being set up — try again later."));
  }

  @GetMapping("/api/leaderboard")
  public ResponseEntity<Object> getLeaderboard(@RequestParam(defaultValue = "20") int limit) {
    int safeLimit = Math.min(MAX_LEADERBOARD_LIMIT, limit <= 0 ? DEFAULT_LEADERBOARD_LIMIT : limit);
    // Public, slow-changing data: let browsers/CDN serve it from cache for a short
    // window (and keep serving the stale copy briefly while revalidating) to cut load.
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(Duration.ofSeconds(30)).cachePublic().staleWhileRevalidate(Duration.ofSeconds(60)))
        .body(json(
            "typers", store.topLeaderboard(false, safeLimit),
            "solvers", store.topLeaderboard(true, safeLimit)));
  }

  // --- helpers ---------------------------------------------------------------

  /** The authenticated account's profile (the auth filter guarantees a uid). */
  private Profile current(HttpServletRequest req) {
    String uid = currentUid(req);
    String name = (String) req.getAttribute(FirebaseAuthFilter.NAME_ATTR);
    return profileService.getOrCreate(uid, name);
  }

  private String currentUid(HttpServletRequest req) {
    String uid = (String) req.getAttribute(FirebaseAuthFilter.UID_ATTR);
    if (uid == null) throw new NotFoundException("no authenticated account");
    return uid;
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

  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<Object> onBadRequest(BadRequestException e) {
    log.warn("bad request: {}", e.getMessage());
    return ResponseEntity.badRequest().body(json("error", e.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Object> onError(Exception e) {
    log.error("unhandled error", e);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(json("error", "Something went wrong. Please try again."));
  }
}
