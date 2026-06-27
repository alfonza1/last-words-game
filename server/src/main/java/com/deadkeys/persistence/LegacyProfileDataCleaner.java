package com.deadkeys.persistence;

import com.deadkeys.persistence.entity.ProfileEntity;
import com.deadkeys.persistence.repository.ProfileRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Removes retired weak-word maps from profile JSON already stored in the database. */
@Component
public class LegacyProfileDataCleaner implements ApplicationRunner {
  private static final Logger log = LoggerFactory.getLogger(LegacyProfileDataCleaner.class);

  private final ProfileRepository profiles;
  private final ObjectMapper mapper;

  public LegacyProfileDataCleaner(ProfileRepository profiles, ObjectMapper mapper) {
    this.profiles = profiles;
    this.mapper = mapper;
  }

  @Override
  public void run(ApplicationArguments args) {
    int cleaned = 0;
    for (ProfileEntity entity : profiles.findAll()) {
      String updated = removeWeakWords(mapper, entity.json);
      if (updated == null) continue;
      entity.json = updated;
      profiles.save(entity);
      cleaned++;
    }
    if (cleaned > 0) log.info("removed legacy weak-word data from {} profiles", cleaned);
  }

  static String removeWeakWords(ObjectMapper mapper, String json) {
    if (json == null || json.isBlank()) return null;
    try {
      JsonNode root = mapper.readTree(json);
      if (!(root instanceof ObjectNode object)) return null;
      boolean changed = removeFromStats(object.get("stats"));
      changed = removeFromStats(object.get("riddleStats")) || changed;
      return changed ? mapper.writeValueAsString(object) : null;
    } catch (Exception ex) {
      throw new IllegalStateException("could not clean legacy profile data", ex);
    }
  }

  private static boolean removeFromStats(JsonNode stats) {
    return stats instanceof ObjectNode object && object.remove("missedWords") != null;
  }
}
