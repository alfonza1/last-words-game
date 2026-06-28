package com.deadkeys.persistence;

import com.deadkeys.persistence.repository.ProfileRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class LegacyProfileDataCleanerTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  void skipsTheFullScanWhenDisabled() {
    ProfileRepository repo = mock(ProfileRepository.class);
    new LegacyProfileDataCleaner(repo, mapper, false).run(mock(ApplicationArguments.class));
    // The whole point of the cost fix: no DB read on a normal (disabled) cold start.
    verifyNoInteractions(repo);
  }

  @Test
  void scansOnlyWhenExplicitlyEnabled() {
    ProfileRepository repo = mock(ProfileRepository.class);
    when(repo.findAll()).thenReturn(List.of());
    new LegacyProfileDataCleaner(repo, mapper, true).run(mock(ApplicationArguments.class));
    verify(repo).findAll();
    verify(repo, never()).save(org.mockito.ArgumentMatchers.any());
  }

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
