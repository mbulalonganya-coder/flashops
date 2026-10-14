package com.flashops.api.web;

import com.flashops.api.admin.AdministrationService;
import com.flashops.api.web.dto.AdminDtos;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AdminController {

  private final AdministrationService admin;

  public AdminController(AdministrationService admin) {
    this.admin = admin;
  }

  @GetMapping("/users")
  public Map<String, List<AdminDtos.AdminUserRow>> listUsers() {
    int actorId = AuthSupport.currentUserId();
    return Map.of("data", admin.listUsers(actorId));
  }

  @PostMapping("/users")
  public Map<String, AdminDtos.AdminUserRow> createUser(@Valid @RequestBody AdminDtos.AdminUserInput body) {
    int actorId = AuthSupport.currentUserId();
    return Map.of("data", admin.createUser(actorId, body));
  }

  @PutMapping("/users/{id}")
  public Map<String, AdminDtos.AdminUserRow> updateUser(
      @PathVariable int id, @Valid @RequestBody AdminDtos.AdminUserInput body) {
    int actorId = AuthSupport.currentUserId();
    return Map.of("data", admin.updateUser(actorId, id, body));
  }

  @GetMapping("/roles")
  public Map<String, List<AdminDtos.RoleRow>> listRoles() {
    int actorId = AuthSupport.currentUserId();
    return Map.of("data", admin.listRoles(actorId));
  }

  @PutMapping("/roles/{id}/permissions")
  public Map<String, AdminDtos.RoleRow> setRolePermissions(
      @PathVariable Short id, @RequestBody AdminDtos.RolePermissionsInput body) {
    int actorId = AuthSupport.currentUserId();
    return Map.of("data", admin.setRolePermissions(actorId, id, body));
  }

  @GetMapping("/permissions")
  public Map<String, List<AdminDtos.PermissionRow>> listPermissions() {
    int actorId = AuthSupport.currentUserId();
    return Map.of("data", admin.listPermissions(actorId));
  }

  @GetMapping("/settings")
  public Map<String, AdminDtos.AppSettingsView> getSettings() {
    int actorId = AuthSupport.currentUserId();
    return Map.of("data", admin.getSettings(actorId));
  }

  @PutMapping("/settings")
  public Map<String, AdminDtos.AppSettingsView> updateSettings(@RequestBody AdminDtos.AppSettingsUpdate body) {
    int actorId = AuthSupport.currentUserId();
    return Map.of("data", admin.updateSettings(actorId, body));
  }

  @PostMapping("/settings/smtp/test")
  public Map<String, Object> testSmtp(@RequestBody(required = false) AdminDtos.SmtpTestRequest body) {
    int actorId = AuthSupport.currentUserId();
    String to = body == null ? "" : body.to();
    return admin.testSmtp(actorId, to);
  }

  @GetMapping("/actions")
  public Map<String, AdminDtos.PagedActions> listActions(
      @RequestParam(defaultValue = "0") int page, @RequestParam(name = "page_size", defaultValue = "25") int pageSize) {
    int actorId = AuthSupport.currentUserId();
    return Map.of("data", admin.listActions(actorId, page, pageSize));
  }

  @GetMapping("/actions/{id}")
  public Map<String, AdminDtos.ActionDetailRow> getAction(@PathVariable long id) {
    int actorId = AuthSupport.currentUserId();
    return Map.of("data", admin.getAction(actorId, id));
  }
}
