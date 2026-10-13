package com.flashops.api.repository;

import com.flashops.api.domain.JetonActualisation;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JetonActualisationRepository extends JpaRepository<JetonActualisation, Long> {

  @EntityGraph(attributePaths = {"utilisateur", "utilisateur.role"})
  Optional<JetonActualisation> findByEmpreinteJetonAndRevoqueLeIsNull(String empreinteJeton);
}
