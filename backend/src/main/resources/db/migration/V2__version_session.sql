-- Invalidation globale des sessions après changement de mot de passe
ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS version_session BIGINT NOT NULL DEFAULT 0;
