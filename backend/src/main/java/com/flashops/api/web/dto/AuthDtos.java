package com.flashops.api.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;

public final class AuthDtos {

  private AuthDtos() {}

  public record LoginRequest(String email, String password) {}

  public record RefreshRequest(@JsonProperty("refresh_token") String refreshToken) {}

  public record TokenPair(
      @JsonProperty("access_token") String accessToken,
      @JsonProperty("refresh_token") String refreshToken) {}

  public record LoginResponse(UserView user, TokenPair tokens) {}

  public record RefreshResponse(TokenPair tokens) {}

  public record MeResponse(UserView user) {}

  public record RoleView(Short id, String code, String label) {}

  public record PermissionView(Integer id, String code, String label) {}

  public record UserView(
      Integer id,
      String email,
      @JsonProperty("full_name") String fullName,
      RoleView role,
      List<PermissionView> permissions,
      @JsonProperty("permission_codes") List<String> permissionCodes,
      @JsonProperty("last_login_at") Instant lastLoginAt) {}
}
