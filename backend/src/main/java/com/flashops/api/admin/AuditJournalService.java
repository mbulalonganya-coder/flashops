package com.flashops.api.admin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flashops.api.domain.JournalAction;
import com.flashops.api.domain.Utilisateur;
import com.flashops.api.repository.JournalActionRepository;
import com.flashops.api.repository.UtilisateurRepository;
import java.time.Instant;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditJournalService {

  private final JournalActionRepository journal;
  private final UtilisateurRepository utilisateurs;
  private final RequestContext requestContext;
  private final ObjectMapper objectMapper;

  public AuditJournalService(
      JournalActionRepository journal,
      UtilisateurRepository utilisateurs,
      RequestContext requestContext,
      ObjectMapper objectMapper) {
    this.journal = journal;
    this.utilisateurs = utilisateurs;
    this.requestContext = requestContext;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public void log(Integer userId, String code, String module, String label, Map<String, ?> details) {
    JournalAction row = new JournalAction();
    if (userId != null) {
      utilisateurs.findById(userId).ifPresent(row::setUtilisateur);
    }
    row.setCodeAction(code);
    row.setModule(module);
    row.setLibelle(label == null ? code : label);
    row.setAdresseIp(requestContext.clientIp());
    row.setUserAgent(requestContext.userAgent());
    row.setCreeLe(Instant.now());
    if (details != null && !details.isEmpty()) {
      try {
        row.setDetails(objectMapper.writeValueAsString(details));
      } catch (JsonProcessingException ignored) {
        row.setDetails("{}");
      }
    }
    journal.save(row);
  }
}
