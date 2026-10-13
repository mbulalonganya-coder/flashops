package com.flashops.api.web;

import com.flashops.api.auth.AuthService;
import com.flashops.api.web.dto.AuthDtos;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping({"/login", "/login/"})
  public AuthDtos.LoginResponse login(@Valid @RequestBody AuthDtos.LoginRequest req) {
    return authService.login(req.email(), req.password());
  }

  @PostMapping({"/refresh", "/refresh/"})
  public AuthDtos.RefreshResponse refresh(@Valid @RequestBody AuthDtos.RefreshRequest req) {
    return new AuthDtos.RefreshResponse(authService.refresh(req.refreshToken()));
  }

  @GetMapping("/me")
  public AuthDtos.MeResponse me() {
    int userId = AuthSupport.currentUserId();
    return new AuthDtos.MeResponse(authService.me(userId));
  }
}
