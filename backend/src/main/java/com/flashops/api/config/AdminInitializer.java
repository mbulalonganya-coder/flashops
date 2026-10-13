package com.flashops.api.config;

import com.flashops.api.domain.Role;
import com.flashops.api.domain.Utilisateur;
import com.flashops.api.repository.RoleRepository;
import com.flashops.api.repository.UtilisateurRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

  private final UtilisateurRepository utilisateurs;
  private final RoleRepository roles;
  private final PasswordEncoder passwordEncoder;
  private final FlashOpsProperties props;

  public AdminInitializer(
      UtilisateurRepository utilisateurs,
      RoleRepository roles,
      PasswordEncoder passwordEncoder,
      FlashOpsProperties props) {
    this.utilisateurs = utilisateurs;
    this.roles = roles;
    this.passwordEncoder = passwordEncoder;
    this.props = props;
  }

  @Override
  public void run(ApplicationArguments args) {
    String email = props.admin().email().toLowerCase();
    var existing = utilisateurs.findByCourrielIgnoreCase(email);
    if (existing.isPresent()) {
      Utilisateur u = existing.get();
      boolean changed = false;
      if (!u.isActif()) {
        u.setActif(true);
        changed = true;
      }
      if (!passwordEncoder.matches(props.admin().password(), u.getMotDePasseHash())) {
        u.setMotDePasseHash(passwordEncoder.encode(props.admin().password()));
        changed = true;
      }
      if (changed) {
        utilisateurs.save(u);
        log.info("Compte administrateur synchronisé : {}", email);
      }
      return;
    }
    Role admin =
        roles
            .findByCode("ADMIN")
            .orElseThrow(() -> new IllegalStateException("Rôle ADMIN manquant (Flyway)"));
    Utilisateur u = new Utilisateur();
    u.setCourriel(email);
    u.setNomComplet(props.admin().fullName());
    u.setMotDePasseHash(passwordEncoder.encode(props.admin().password()));
    u.setRole(admin);
    u.setActif(true);
    utilisateurs.save(u);
    log.info("Utilisateur administrateur créé : {}", email);
  }
}
