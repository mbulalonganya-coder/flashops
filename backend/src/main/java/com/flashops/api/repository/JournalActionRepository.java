package com.flashops.api.repository;

import com.flashops.api.domain.JournalAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JournalActionRepository extends JpaRepository<JournalAction, Long> {

  @EntityGraph(attributePaths = "utilisateur")
  Page<JournalAction> findAllByOrderByCreeLeDesc(Pageable pageable);

  @EntityGraph(attributePaths = {"utilisateur", "utilisateur.role"})
  java.util.Optional<JournalAction> findWithUserById(Long id);
}
