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

@Entity
@Table(name = "jetons_actualisation")
public class JetonActualisation {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "utilisateur_id", nullable = false)
  private Utilisateur utilisateur;

  @Column(name = "empreinte_jeton", nullable = false, unique = true, length = 64)
  private String empreinteJeton;

  @Column(name = "expire_le", nullable = false)
  private Instant expireLe;

  @Column(name = "revoque_le")
  private Instant revoqueLe;

  public Long getId() {
    return id;
  }

  public Utilisateur getUtilisateur() {
    return utilisateur;
  }

  public void setUtilisateur(Utilisateur utilisateur) {
    this.utilisateur = utilisateur;
  }

  public String getEmpreinteJeton() {
    return empreinteJeton;
  }

  public void setEmpreinteJeton(String empreinteJeton) {
    this.empreinteJeton = empreinteJeton;
  }

  public Instant getExpireLe() {
    return expireLe;
  }

  public void setExpireLe(Instant expireLe) {
    this.expireLe = expireLe;
  }

  public Instant getRevoqueLe() {
    return revoqueLe;
  }

  public void setRevoqueLe(Instant revoqueLe) {
    this.revoqueLe = revoqueLe;
  }
}
