package com.deadkeys;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class DeadKeysApplication {
  public static void main(String[] args) {
    SpringApplication.run(DeadKeysApplication.class, args);
  }

  /** Permissive CORS so the Vite dev server can call the API directly. */
  @Component
  static class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
      registry.addMapping("/**").allowedOrigins("*").allowedMethods("*").allowedHeaders("*");
    }
  }
}
