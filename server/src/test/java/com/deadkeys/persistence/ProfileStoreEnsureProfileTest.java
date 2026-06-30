package com.deadkeys.persistence;

import com.deadkeys.persistence.entity.ProfileEntity;
import com.deadkeys.persistence.repository.LeaderboardRepository;
import com.deadkeys.persistence.repository.ProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class ProfileStoreEnsureProfileTest {
  private ProfileRepository profiles;
  private ProfileStore store;

  @BeforeEach
  void setup() {
    profiles = mock(ProfileRepository.class);
    store = new ProfileStore(profiles, mock(LeaderboardRepository.class), new ObjectMapper());
  }

  @Test
  void initialHandleIsCappedAtTwentyCharacters() {
    String longName = "Way Too Long Display Name From Firebase";
    store.ensureProfile("uid-long", longName, "player@example.com");

    ArgumentCaptor<ProfileEntity> saved = ArgumentCaptor.forClass(ProfileEntity.class);
    verify(profiles).save(saved.capture());
    assertTrue(saved.getValue().name.length() <= 20, "username must be capped at 20 chars");
    assertEquals(longName.substring(0, 20).trim(), saved.getValue().name);
    assertEquals("player@example.com", saved.getValue().email, "verified email is stored on creation");
  }
}
