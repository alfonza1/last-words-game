package com.deadkeys.service;

/** Thrown when an upgrade purchase is invalid (unknown key, maxed, or too poor). */
public class UpgradeException extends RuntimeException {
  public UpgradeException(String message) {
    super(message);
  }
}
