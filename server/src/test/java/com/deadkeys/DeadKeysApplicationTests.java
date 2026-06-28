package com.deadkeys;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Boots the full Spring context (default MOCK servlet env, so servlet filters are
 * instantiated too). This catches bean-wiring regressions — e.g. a filter with an
 * ambiguous constructor — at build time instead of only at Cloud Run startup.
 * Uses in-memory H2 so it needs no external database.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:contexttest;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
    "sentry.dsn="
})
class DeadKeysApplicationTests {
  @Test
  void contextLoads() {
    // Intentionally empty: success means every bean (incl. RateLimitFilter) wired up.
  }
}
