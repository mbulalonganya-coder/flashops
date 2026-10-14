package com.flashops.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "journal_actions")
public class JournalAction {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "utilisateur_id")
  private Utilisateur utilisateur;

  @Column(name = "code_action", nullable = false, length = 80)
  private String codeAction;

  @Column(length = 50)
  private String module;

  @Column(nullable = false, length = 250)
  private String libelle;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private String details;

  @Column(name = "adresse_ip", length = 45)
  private String adresseIp;

  @Column(name = "user_agent", length = 500)
  private String userAgent;

  @Column(name = "cree_le", nullable = false)
  private Instant creeLe;

  public Long getId() {
    return id;
  }

  public Utilisateur getUtilisateur() {
    return utilisateur;
  }

  public void setUtilisateur(Utilisateur utilisateur) {
    this.utilisateur = utilisateur;
  }

  public String getCodeAction() {
    return codeAction;
  }

  public void setCodeAction(String codeAction) {
    this.codeAction = codeAction;
  }

  public String getModule() {
    return module;
  }

  public void setModule(String module) {
    this.module = module;
  }

  public String getLibelle() {
    return libelle;
  }

  public void setLibelle(String libelle) {
    this.libelle = libelle;
  }

  public String getDetails() {
    return details;
  }

  public void setDetails(String details) {
    this.details = details;
  }

  public String getAdresseIp() {
    return adresseIp;
  }

  public void setAdresseIp(String adresseIp) {
    this.adresseIp = adresseIp;
  }

  public String getUserAgent() {
    return userAgent;
  }

  public void setUserAgent(String userAgent) {
    this.userAgent = userAgent;
  }

  public Instant getCreeLe() {
    return creeLe;
  }

  public void setCreeLe(Instant creeLe) {
    this.creeLe = creeLe;
  }
}
