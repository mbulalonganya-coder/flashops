-- Flash OPS — schéma authentification (noms en français)

CREATE TABLE IF NOT EXISTS roles (
    id          SMALLSERIAL PRIMARY KEY,
    code        VARCHAR(30) NOT NULL UNIQUE,
    libelle     VARCHAR(100) NOT NULL,
    cree_le     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utilisateurs (
    id                  SERIAL PRIMARY KEY,
    courriel            VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe_hash   VARCHAR(255) NOT NULL,
    nom_complet         VARCHAR(200) NOT NULL DEFAULT '',
    role_id             SMALLINT NOT NULL REFERENCES roles(id),
    actif               BOOLEAN NOT NULL DEFAULT TRUE,
    derniere_connexion_le TIMESTAMPTZ,
    cree_le             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modifie_le          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jetons_actualisation (
    id              BIGSERIAL PRIMARY KEY,
    utilisateur_id  INT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    empreinte_jeton VARCHAR(64) NOT NULL UNIQUE,
    expire_le       TIMESTAMPTZ NOT NULL,
    revoque_le      TIMESTAMPTZ,
    cree_le         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(80) NOT NULL UNIQUE,
    libelle     VARCHAR(200) NOT NULL,
    module      VARCHAR(50),
    cree_le     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles_permissions (
    role_id         SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_jetons_utilisateur_actifs
    ON jetons_actualisation (utilisateur_id) WHERE revoque_le IS NULL;

INSERT INTO roles (code, libelle) VALUES
    ('ADMIN', 'Administrateur'),
    ('MANAGER', 'Manager'),
    ('ANALYST', 'Analyste'),
    ('READONLY', 'Lecture seule')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, libelle, module) VALUES
    ('auth.profil.lire', 'Profil utilisateur', 'auth'),
    ('auth.utilisateurs.lire', 'Utilisateurs — lecture', 'auth'),
    ('auth.utilisateurs.ecrire', 'Utilisateurs — écriture', 'auth'),
    ('auth.roles.lire', 'Rôles — lecture', 'auth'),
    ('dashboard.voir', 'Tableau de bord', 'reporting')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('auth.profil.lire', 'dashboard.voir')
WHERE r.code IN ('MANAGER', 'ANALYST', 'READONLY')
ON CONFLICT DO NOTHING;
