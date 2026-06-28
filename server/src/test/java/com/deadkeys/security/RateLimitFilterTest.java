package com.deadkeys.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimitFilterTest {
  private final ObjectMapper mapper = new ObjectMapper();

  /** Rate-limit behavior is unchanged: ~80 per 10s window, then blocked. */
  @Test
  void allowsUpToTheLimitThenBlocksWithinAWindow() {
    AtomicLong now = new AtomicLong(1_000_000L);
    RateLimitFilter filter = new RateLimitFilter(mapper, now::get);

    int allowed = 0;
    for (int i = 0; i < 200; i++) {
      if (filter.allow("1.2.3.4")) allowed++;
    }

    assertEquals(80, allowed);
    assertFalse(filter.allow("1.2.3.4"));
  }

  /** The counter resets once the window elapses. */
  @Test
  void resetsAfterTheWindowElapses() {
    AtomicLong now = new AtomicLong(1_000_000L);
    RateLimitFilter filter = new RateLimitFilter(mapper, now::get);

    for (int i = 0; i < 80; i++) filter.allow("9.9.9.9");
    assertFalse(filter.allow("9.9.9.9")); // limit hit

    now.addAndGet(11_000); // past the 10s window
    assertTrue(filter.allow("9.9.9.9")); // fresh window
  }

  /** The cost fix: idle IP buckets are evicted so the map can't grow unbounded. */
  @Test
  void evictsIdleBucketsSoTheMapStaysBounded() {
    AtomicLong now = new AtomicLong(1_000_000L);
    RateLimitFilter filter = new RateLimitFilter(mapper, now::get);

    for (int i = 0; i < 500; i++) filter.allow("10.0.0." + i);
    assertEquals(500, filter.bucketCount());

    now.addAndGet(120_000); // 2 minutes later: every existing bucket is idle
    filter.allow("8.8.8.8"); // any request triggers the sweep
    assertEquals(1, filter.bucketCount()); // only the just-seen IP remains
  }

  /** Sweeps run at most once per window — no churn for short-lived bursts. */
  @Test
  void doesNotEvictWithinTheSameWindow() {
    AtomicLong now = new AtomicLong(1_000_000L);
    RateLimitFilter filter = new RateLimitFilter(mapper, now::get);

    for (int i = 0; i < 300; i++) filter.allow("10.0.0." + i);
    now.addAndGet(5_000); // still inside the window/expiry
    filter.allow("7.7.7.7");

    assertEquals(301, filter.bucketCount());
  }
}
