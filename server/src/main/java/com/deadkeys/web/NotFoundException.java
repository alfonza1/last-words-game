package com.deadkeys.web;

/** Thrown when a requested resource (e.g. a profile) does not exist → HTTP 404. */
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }
}
