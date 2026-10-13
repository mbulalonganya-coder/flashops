package com.flashops.api.auth;

import com.flashops.api.config.FlashOpsProperties;
import com.flashops.api.domain.JetonActualisation;
import com.flashops.api.domain.Permission;
import com.flashops.api.domain.Utilisateur;
import com.flashops.api.repository.JetonActualisationRepository;
import com.flashops.api.repository.PermissionRepository;
import com.flashops.api.repository.UtilisateurRepository;
import com.flashops.api.web.dto.AuthDtos;
import com.flashops.api.web.dto.AuthDtos.PermissionView;
import com.flashops.api.web.dto.AuthDtos.RoleView;
import com.flashops.api.web.dto.AuthDtos.TokenPair;
import com.flashops.api.web.dto.AuthDtos.UserView;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  private final UtilisateurRepository utilisateurs;
  private final JetonActualisationRepository jetons;
  private final PermissionRepository permissions;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final FlashOpsProperties props;
  private final SecureRandom random = new SecureRandom();

  public AuthService(
      UtilisateurRepository utilisateurs,
      JetonActualisationRepository jetons,
      PermissionRepository permissions,
      PasswordEncoder passwordEncoder,
      JwtService jwtService,
      FlashOpsProperties props) {
    this.utilisateurs = utilisateurs;
    this.jetons = jetons;
    this.permissions = permissions;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.props = props;
  }

  @Transactional
  public AuthDtos.LoginResponse login(String email, String password) {
    Utilisateur u =
        utilisateurs
            .findByCourrielIgnoreCase(email.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials"));
    if (!u.isActif()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "inactive user");
    }
    if (!passwordEncoder.matches(password, u.getMotDePasseHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
    }
    u.setDerniereConnexionLe(Instant.now());
    TokenPair tokens = issueTokens(u);
    return new AuthDtos.LoginResponse(toUserView(u), tokens);
  }

  @Transactional
  public TokenPair refresh(String refreshToken) {
    String hash = sha256(refreshToken);
    JetonActualisation row =
        jetons
            .findByEmpreinteJetonAndRevoqueLeIsNull(hash)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token"));
    if (row.getExpireLe().isBefore(Instant.now())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "expired refresh token");
    }
    row.setRevoqueLe(Instant.now());
    Utilisateur u = row.getUtilisateur();
    if (!u.isActif()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "inactive user");
    }
    return issueTokens(u);
  }

  @Transactional(readOnly = true)
  public UserView me(int userId) {
    Utilisateur u =
        utilisateurs
            .findWithRoleById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "user not found"));
    return toUserView(u);
  }

  private TokenPair issueTokens(Utilisateur u) {
    String access = jwtService.createAccessToken(u.getId(), u.getCourriel(), u.getRole().getCode());
    String refreshRaw = randomToken();
    JetonActualisation j = new JetonActualisation();
    j.setUtilisateur(u);
    j.setEmpreinteJeton(sha256(refreshRaw));
    j.setExpireLe(Instant.now().plusSeconds(props.jwt().refreshTtlHours() * 3600L));
    jetons.save(j);
    return new TokenPair(access, refreshRaw);
  }

  private UserView toUserView(Utilisateur u) {
    List<Permission> perms = permissions.findByRoleId(u.getRole().getId());
    List<PermissionView> permViews =
        perms.stream()
            .map(p -> new PermissionView(p.getId(), p.getCode(), p.getLibelle()))
            .toList();
    List<String> codes = perms.stream().map(Permission::getCode).toList();
    RoleView role = new RoleView(u.getRole().getId(), u.getRole().getCode(), u.getRole().getLibelle());
    return new UserView(
        u.getId(),
        u.getCourriel(),
        u.getNomComplet(),
        role,
        permViews,
        codes,
        u.getDerniereConnexionLe());
  }

  private static String randomToken() {
    byte[] buf = new byte[32];
    new SecureRandom().nextBytes(buf);
    return HexFormat.of().formatHex(buf);
  }

  private static String sha256(String value) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }
}
