package com.deadkeys.security;

import com.deadkeys.security.FirebaseTokenVerifier.FirebaseUser;
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

/**
 * Authentication gate: every {@code /api/**} request must carry a valid Firebase
 * ID token from our project, so only our signed-in client can reach the API.
 * The verified uid/name are attached to the request; endpoints act ONLY on that
 * uid, so a player can never touch another player's profile.
 *
 * <p>Public exceptions: health checks and the read-only leaderboard.
 */
@Component
@Order(2)
public class FirebaseAuthFilter extends OncePerRequestFilter {
  public static final String UID_ATTR = "deadkeys.uid";
  public static final String NAME_ATTR = "deadkeys.name";

  private final FirebaseTokenVerifier verifier;
  private final ObjectMapper mapper;

  public FirebaseAuthFilter(FirebaseTokenVerifier verifier, ObjectMapper mapper) {
    this.verifier = verifier;
    this.mapper = mapper;
  }

  private static boolean isPublic(HttpServletRequest req) {
    String path = req.getRequestURI();
    if (path == null) return true;
    if (path.equals("/health") || path.equals("/api/health")) return true;
    // The leaderboard is public, read-only data.
    if (path.equals("/api/leaderboard") && "GET".equalsIgnoreCase(req.getMethod())) return true;
    // CORS preflight carries no auth header by design.
    return "OPTIONS".equalsIgnoreCase(req.getMethod());
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String path = req.getRequestURI();
    boolean isApi = path != null && path.startsWith("/api/");

    if (!isApi || isPublic(req)) {
      chain.doFilter(req, res);
      return;
    }

    String header = req.getHeader("Authorization");
    String token = (header != null && header.startsWith("Bearer ")) ? header.substring(7) : null;
    FirebaseUser user = verifier.verify(token);
    if (user == null) {
      res.setStatus(401);
      res.setContentType("application/json");
      res.getWriter().write(mapper.writeValueAsString(Map.of("error", "authentication required")));
      return;
    }

    req.setAttribute(UID_ATTR, user.uid());
    req.setAttribute(NAME_ATTR, user.name());
    chain.doFilter(req, res);
  }
}
