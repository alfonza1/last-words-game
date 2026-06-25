package com.deadkeys.persistence;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

class LegacyProfileDataCleanerTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  void removesWeakWordsFromBothStatsObjects() throws Exception {
    String json = """
        {"stats":{"bestScore":10,"missedWords":{"wold":1}},
         "riddleStats":{"bestScore":5,"missedWords":{"answer":2}},
         "name":"survivor"}
        """;

    String cleaned = LegacyProfileDataCleaner.removeWeakWords(mapper, json);
    JsonNode root = mapper.readTree(cleaned);

    assertFalse(root.path("stats").has("missedWords"));
    assertFalse(root.path("riddleStats").has("missedWords"));
  }

  @Test
  void leavesAlreadyCleanProfilesUntouched() {
    assertNull(LegacyProfileDataCleaner.removeWeakWords(
        mapper,
        "{\"stats\":{\"bestScore\":10},\"riddleStats\":{\"bestScore\":5}}"));
  }
}
