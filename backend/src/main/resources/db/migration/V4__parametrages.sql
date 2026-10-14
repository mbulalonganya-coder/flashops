-- Paramètres application, journal des actions, permissions admin

CREATE TABLE IF NOT EXISTS parametres_application (
    id                      SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    app_name                VARCHAR(120) NOT NULL DEFAULT 'Flash OPS',
    app_short_name          VARCHAR(40) NOT NULL DEFAULT 'Flash',
    app_url                 VARCHAR(500) NOT NULL DEFAULT 'http://localhost:4201',
    logo_light              TEXT NOT NULL DEFAULT '/branding/logo-light1.png',
    logo_dark               TEXT NOT NULL DEFAULT '/branding/logo-dark1.png',
    favicon                 TEXT NOT NULL DEFAULT '/branding/logo-light1.png',
    default_language        VARCHAR(10) NOT NULL DEFAULT 'fr',
    fuseau_horaire          VARCHAR(64) NOT NULL DEFAULT 'Africa/Kinshasa',
    smtp_host               VARCHAR(255) NOT NULL DEFAULT '',
    smtp_port               INT NOT NULL DEFAULT 587,
    smtp_username           VARCHAR(255) NOT NULL DEFAULT '',
    smtp_mot_de_passe       TEXT,
    smtp_encryption         VARCHAR(10) NOT NULL DEFAULT 'tls',
    smtp_from_email         VARCHAR(255) NOT NULL DEFAULT '',
    smtp_from_name          VARCHAR(120) NOT NULL DEFAULT '',
    smtp_test_to            VARCHAR(255) NOT NULL DEFAULT '',
    modifie_le              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO parametres_application (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS journal_actions (
    id              BIGSERIAL PRIMARY KEY,
    utilisateur_id  INT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    code_action     VARCHAR(80) NOT NULL,
    module          VARCHAR(50),
    libelle         VARCHAR(250) NOT NULL DEFAULT '',
    details         JSONB,
    adresse_ip      VARCHAR(45),
    user_agent      VARCHAR(500),
    cree_le         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_actions_cree_le ON journal_actions (cree_le DESC);
CREATE INDEX IF NOT EXISTS idx_journal_actions_utilisateur ON journal_actions (utilisateur_id);

INSERT INTO permissions (code, libelle, module) VALUES
    ('auth.roles.ecrire', 'Rôles — écriture', 'auth'),
    ('auth.permissions.lire', 'Permissions — lecture', 'auth'),
    ('auth.parametres.lire', 'Paramètres — lecture', 'auth'),
    ('auth.parametres.ecrire', 'Paramètres — écriture', 'auth'),
    ('audit.actions.lire', 'Journal des actions — lecture', 'audit')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;
