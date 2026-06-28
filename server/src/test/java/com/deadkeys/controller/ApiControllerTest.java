package com.deadkeys.controller;

import com.deadkeys.persistence.ProfileStore;
import com.deadkeys.service.ProfileService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ApiControllerTest {
  @Test
  @SuppressWarnings("unchecked")
  void healthIsShallowAndTouchesNoDatabase() {
    ProfileStore store = mock(ProfileStore.class);
    ApiController controller = new ApiController(store, mock(ProfileService.class));

    Map<String, Object> body = (Map<String, Object>) controller.health();

    assertEquals("ok", body.get("status"));
    assertFalse(body.containsKey("profiles"));
    assertFalse(body.containsKey("leaderboard"));
    // A liveness check must never wake Neon.
    verifyNoInteractions(store);
  }

  @Test
  @SuppressWarnings("unchecked")
  void readinessChecksTheDatabase() {
    ProfileStore store = mock(ProfileStore.class);
    when(store.countProfiles()).thenReturn(3L);
    when(store.countLeaderboard()).thenReturn(2L);
    ApiController controller = new ApiController(store, mock(ProfileService.class));

    Map<String, Object> body = (Map<String, Object>) controller.ready();

    assertEquals("ready", body.get("status"));
    assertEquals(3L, body.get("profiles"));
    assertEquals(2L, body.get("leaderboard"));
    verify(store).countProfiles();
    verify(store).countLeaderboard();
  }
}
