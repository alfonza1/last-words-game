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

  public record FirebaseUser(String uid, String name) {}

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
      return new FirebaseUser(uid, name instanceof String s ? s : null);
    } catch (Exception e) {
      return null; // any failure = not authenticated
    }
  }
}
