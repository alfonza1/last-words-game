package com.deadkeys.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Structured access log for every API request: method, path, status, the
 * authenticated uid (if any), and duration. Runs outermost so it captures
 * rate-limited (429) and unauthenticated (401) responses too. Ship these logs
 * to your monitoring platform (see docs/DEPLOYMENT.md).
 */
@Component
@Order(0)
public class RequestLogFilter extends OncePerRequestFilter {
  private static final Logger log = LoggerFactory.getLogger("api.access");

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String path = req.getRequestURI();
    if (path == null || !path.startsWith("/api/")) {
      chain.doFilter(req, res);
      return;
    }
    long start = System.currentTimeMillis();
    try {
      chain.doFilter(req, res);
    } finally {
      long ms = System.currentTimeMillis() - start;
      Object uid = req.getAttribute(FirebaseAuthFilter.UID_ATTR);
      log.info("{} {} -> {} ({}ms) uid={}", req.getMethod(), path, res.getStatus(), ms, uid == null ? "-" : uid);
    }
  }
}
