package com.deadkeys.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfileRepository extends JpaRepository<ProfileEntity, String> {
  /** All profiles whose display name matches, ignoring case — for uniqueness checks. */
  List<ProfileEntity> findByNameIgnoreCase(String name);
}
