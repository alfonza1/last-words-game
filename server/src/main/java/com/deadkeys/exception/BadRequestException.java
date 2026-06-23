package com.deadkeys.exception;

/**
 * Thrown when a request is invalid for a domain reason (not enough coins, upgrade
 * maxed, unknown map/powerup, username cooldown, …) → HTTP 400. The message is
 * user-facing.
 */
public class BadRequestException extends RuntimeException {
  public BadRequestException(String message) {
    super(message);
  }
}
