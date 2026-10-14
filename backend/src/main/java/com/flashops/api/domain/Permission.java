package com.flashops.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "permissions")
public class Permission {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false, unique = true, length = 80)
  private String code;

  @Column(nullable = false, length = 200)
  private String libelle;

  @Column(length = 50)
  private String module;

  public Integer getId() {
    return id;
  }

  public String getCode() {
    return code;
  }

  public String getLibelle() {
    return libelle;
  }

  public String getModule() {
    return module;
  }
}
