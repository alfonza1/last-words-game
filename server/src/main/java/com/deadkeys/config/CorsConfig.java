package com.deadkeys.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS allowlist. In dev it permits the Vite origins; in prod set
 * ALLOWED_ORIGINS (comma-separated) to your real domain(s).
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    String env = System.getenv("ALLOWED_ORIGINS");
    String[] origins = (env != null && !env.isBlank())
        ? env.split("\\s*,\\s*")
        : new String[] {
            "http://localhost:5180", "http://127.0.0.1:5180",
            "http://localhost:5173", "http://127.0.0.1:5173",
          };
    registry.addMapping("/**")
        .allowedOrigins(origins)
        .allowedMethods("GET", "POST", "OPTIONS")
        .allowedHeaders("*");
  }
}
