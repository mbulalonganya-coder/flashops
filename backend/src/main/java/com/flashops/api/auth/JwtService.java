package com.flashops.api.auth;

import com.flashops.api.config.FlashOpsProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final SecretKey key;
  private final int accessTtlMinutes;

  public JwtService(FlashOpsProperties props) {
    byte[] secret = props.jwt().secret().getBytes(StandardCharsets.UTF_8);
    this.key = Keys.hmacShaKeyFor(secret);
    this.accessTtlMinutes = props.jwt().accessTtlMinutes();
  }

  public String createAccessToken(int userId, String email, String roleCode) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(accessTtlMinutes * 60L);
    return Jwts.builder()
        .subject(String.valueOf(userId))
        .claim("email", email)
        .claim("role", roleCode)
        .issuedAt(Date.from(now))
        .expiration(Date.from(exp))
        .signWith(key)
        .compact();
  }

  public Claims parse(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
  }

  public int userIdFromClaims(Claims claims) {
    return Integer.parseInt(claims.getSubject());
  }
}
