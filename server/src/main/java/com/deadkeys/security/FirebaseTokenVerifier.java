package com.deadkeys.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTClaimsVerifier;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.Date;
import java.util.Set;

/**
 * Verifies Firebase ID tokens against Google's public signing keys. Needs no
 * server secret — only the (public) Firebase project id. Confirms the RS256
 * signature, issuer, audience, and expiry, then yields the account uid + name.
 */
@Component
public class FirebaseTokenVerifier {
  private static final String JWKS_URL =
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

  private final String projectId;
  private final ConfigurableJWTProcessor<SecurityContext> processor;

  public record FirebaseUser(String uid, String name, String email) {}

  public FirebaseTokenVerifier(@Value("${firebase.projectId}") String projectId) throws Exception {
    this.projectId = projectId;
    DefaultJWTProcessor<SecurityContext> p = new DefaultJWTProcessor<>();
    JWKSource<SecurityContext> keys = new RemoteJWKSet<>(new URL(JWKS_URL));
    JWSKeySelector<SecurityContext> keySelector = new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keys);
    p.setJWSKeySelector(keySelector);
    p.setJWTClaimsSetVerifier(new DefaultJWTClaimsVerifier<>(
        new JWTClaimsSet.Builder()
            .issuer("https://securetoken.google.com/" + projectId)
            .audience(projectId)
            .build(),
        Set.of("sub", "iat", "exp")));
    this.processor = p;
  }

  /** Returns the verified user, or null if the token is missing/invalid/expired. */
  public FirebaseUser verify(String idToken) {
    if (idToken == null || idToken.isBlank()) return null;
    try {
      JWTClaimsSet claims = processor.process(idToken, null);
      Date exp = claims.getExpirationTime();
      if (exp == null || exp.before(new Date())) return null;
      String uid = claims.getSubject();
      if (uid == null || uid.isBlank()) return null;
      Object name = claims.getClaim("name");
      return new FirebaseUser(uid, name instanceof String s ? s : null, verifiedEmail(claims));
    } catch (Exception e) {
      return null; // any failure = not authenticated
    }
  }

  /**
   * The account's email, but only when Firebase reports it verified. Normalized
   * to lower-case so it works as a stable match key (e.g. relinking an account
   * after an auth-provider change, or opt-in emails). Returns null when absent or
   * unverified — and a malformed email claim never fails token verification.
   */
  private static String verifiedEmail(JWTClaimsSet claims) {
    try {
      Object verified = claims.getClaim("email_verified");
      Object email = claims.getClaim("email");
      if (Boolean.TRUE.equals(verified) && email instanceof String s) {
        String normalized = s.trim().toLowerCase();
        return normalized.isEmpty() ? null : normalized;
      }
    } catch (Exception ignored) {
      // Email is optional; never let a bad claim block authentication.
    }
    return null;
  }
}
