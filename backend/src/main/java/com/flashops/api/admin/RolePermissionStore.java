package com.flashops.api.admin;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RolePermissionStore {

  private final JdbcTemplate jdbc;

  public RolePermissionStore(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Transactional
  public void replaceRolePermissions(Short roleId, List<Integer> permissionIds) {
    jdbc.update("DELETE FROM roles_permissions WHERE role_id = ?", roleId);
    for (Integer permissionId : permissionIds) {
      jdbc.update(
          "INSERT INTO roles_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
          roleId,
          permissionId);
    }
  }
}
