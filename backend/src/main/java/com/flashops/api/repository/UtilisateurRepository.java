package com.flashops.api.repository;

import com.flashops.api.domain.Utilisateur;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Integer> {

  @EntityGraph(attributePaths = "role")
  List<Utilisateur> findAllByOrderByNomCompletAsc();

  @EntityGraph(attributePaths = "role")
  Optional<Utilisateur> findByCourrielIgnoreCase(String courriel);

  @EntityGraph(attributePaths = "role")
  Optional<Utilisateur> findWithRoleById(Integer id);
}
