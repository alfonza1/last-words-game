package com.deadkeys.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/**
 * Cheap in-memory, per-IP rate limit — a first line of defence against scripted
 * abuse. Allows a burst, then ~MAX_PER_WINDOW requests per window. Runs before
 * auth. For real DDoS protection put a CDN/WAF (e.g. Cloudflare) in front — see
 * docs/DEPLOYMENT.md. Also sets a couple of basic security headers.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {
  private static final long WINDOW_MS = 10_000; // 10s window
  private static final int MAX_PER_WINDOW = 80; // ~8 req/s sustained per IP
  // Evict buckets idle longer than this (well above WINDOW_MS) so the map can't
  // grow unbounded; an evicted idle IP just gets a fresh bucket on its next hit.
  private static final long IDLE_EXPIRY_MS = 60_000;
  // Hard ceiling on tracked IPs so a flood can't exhaust the 512 MiB instance —
  // a sweep is forced once this is exceeded.
  private static final int MAX_BUCKETS = 50_000;

  private final ObjectMapper mapper;
  private final LongSupplier clock;
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
  private volatile long lastSweep;

  public RateLimitFilter(ObjectMapper mapper) {
    this(mapper, System::currentTimeMillis);
  }

  // Package-private constructor so tests can drive time deterministically.
  RateLimitFilter(ObjectMapper mapper, LongSupplier clock) {
    this.mapper = mapper;
    this.clock = clock;
    this.lastSweep = clock.getAsLong();
  }

  private static final class Bucket {
    long windowStart;
    int count;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");

    String path = req.getRequestURI();
    if (path != null && path.startsWith("/api/") && !"OPTIONS".equalsIgnoreCase(req.getMethod())) {
      if (!allow(clientIp(req))) {
        res.setStatus(429);
        res.setContentType("application/json");
        res.getWriter().write(mapper.writeValueAsString(Map.of("error", "too many requests")));
        return;
      }
    }
    chain.doFilter(req, res);
  }

  boolean allow(String ip) {
    long now = clock.getAsLong();
    maybeSweep(now);
    // New buckets start their window now, so they're never seen as idle-since-epoch.
    Bucket b = buckets.computeIfAbsent(ip, k -> {
      Bucket nb = new Bucket();
      nb.windowStart = now;
      return nb;
    });
    synchronized (b) {
      if (now - b.windowStart > WINDOW_MS) {
        b.windowStart = now;
        b.count = 0;
      }
      b.count++;
      return b.count <= MAX_PER_WINDOW;
    }
  }

  /**
   * Drop buckets idle past {@link #IDLE_EXPIRY_MS}. Runs at most once per window,
   * or immediately when the map exceeds {@link #MAX_BUCKETS}. Cheap and bounded.
   */
  private void maybeSweep(long now) {
    if (now - lastSweep < WINDOW_MS && buckets.size() < MAX_BUCKETS) return;
    lastSweep = now;
    buckets.entrySet().removeIf(e -> {
      Bucket b = e.getValue();
      synchronized (b) {
        return now - b.windowStart > IDLE_EXPIRY_MS;
      }
    });
  }

  /** Number of IPs currently tracked — exposed for tests/observability. */
  int bucketCount() {
    return buckets.size();
  }

  private static String clientIp(HttpServletRequest req) {
    String fwd = req.getHeader("X-Forwarded-For");
    if (fwd != null && !fwd.isBlank()) return fwd.split(",")[0].trim();
    return req.getRemoteAddr();
  }
}
