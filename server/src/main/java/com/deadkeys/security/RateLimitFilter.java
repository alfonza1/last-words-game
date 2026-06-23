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

  private final ObjectMapper mapper;
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  public RateLimitFilter(ObjectMapper mapper) {
    this.mapper = mapper;
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

  private boolean allow(String ip) {
    long now = System.currentTimeMillis();
    Bucket b = buckets.computeIfAbsent(ip, k -> new Bucket());
    synchronized (b) {
      if (now - b.windowStart > WINDOW_MS) {
        b.windowStart = now;
        b.count = 0;
      }
      b.count++;
      return b.count <= MAX_PER_WINDOW;
    }
  }

  private static String clientIp(HttpServletRequest req) {
    String fwd = req.getHeader("X-Forwarded-For");
    if (fwd != null && !fwd.isBlank()) return fwd.split(",")[0].trim();
    return req.getRemoteAddr();
  }
}
