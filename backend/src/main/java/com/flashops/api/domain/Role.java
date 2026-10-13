package com.flashops.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "roles")
public class Role {

  @Id private Short id;

  @Column(nullable = false, unique = true, length = 30)
  private String code;

  @Column(nullable = false, length = 100)
  private String libelle;

  @Column(name = "cree_le", nullable = false)
  private Instant creeLe;

  public Short getId() {
    return id;
  }

  public String getCode() {
    return code;
  }

  public String getLibelle() {
    return libelle;
  }
}
