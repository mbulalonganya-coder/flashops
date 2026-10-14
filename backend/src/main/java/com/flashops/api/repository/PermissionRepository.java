package com.flashops.api.repository;

import com.flashops.api.domain.Permission;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PermissionRepository extends JpaRepository<Permission, Integer> {

  @Query(
      value =
          """
          SELECT p.* FROM permissions p
          JOIN roles_permissions rp ON rp.permission_id = p.id
          WHERE rp.role_id = :roleId
          ORDER BY p.code
          """,
      nativeQuery = true)
  List<Permission> findByRoleId(@Param("roleId") Short roleId);

  List<Permission> findAllByOrderByModuleAscCodeAsc();
}
