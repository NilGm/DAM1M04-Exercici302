-- escola_mysql.sql (MySQL 8+)
-- Creates tables, relations and sample data for a small "escola" database.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

DROP DATABASE IF EXISTS escola;
CREATE DATABASE escola CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE escola;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS estudiant_curs;
DROP TABLE IF EXISTS mestre_curs;
DROP TABLE IF EXISTS mestre_especialitat;
DROP TABLE IF EXISTS estudiants;
DROP TABLE IF EXISTS mestres;
DROP TABLE IF EXISTS cursos;
DROP TABLE IF EXISTS especialitats;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- Taules principals
-- =========================

CREATE TABLE estudiants (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom  VARCHAR(100) NOT NULL,
  edat TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_estudiants_edat CHECK (edat >= 0)
) ENGINE=InnoDB;

CREATE TABLE mestres (
  id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom VARCHAR(120) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE cursos (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom      VARCHAR(120) NOT NULL,
  tematica VARCHAR(120) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE especialitats (
  id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_especialitats_nom (nom)
) ENGINE=InnoDB;

-- =========================
-- Relacions
-- =========================

-- Cada estudiant fa 0..N cursos (N..N)
CREATE TABLE estudiant_curs (
  estudiant_id INT UNSIGNED NOT NULL,
  curs_id      INT UNSIGNED NOT NULL,
  data_alta    DATE NOT NULL DEFAULT (CURRENT_DATE),
  PRIMARY KEY (estudiant_id, curs_id),
  CONSTRAINT fk_estudiant_curs_estudiant
    FOREIGN KEY (estudiant_id) REFERENCES estudiants(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_estudiant_curs_curs
    FOREIGN KEY (curs_id) REFERENCES cursos(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Cada mestre té 1..N especialitats (N..N)
CREATE TABLE mestre_especialitat (
  mestre_id       INT UNSIGNED NOT NULL,
  especialitat_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (mestre_id, especialitat_id),
  CONSTRAINT fk_mestre_especialitat_mestre
    FOREIGN KEY (mestre_id) REFERENCES mestres(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_mestre_especialitat_especialitat
    FOREIGN KEY (especialitat_id) REFERENCES especialitats(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Cada mestre imparteix 0..N cursos (N..N)
CREATE TABLE mestre_curs (
  mestre_id INT UNSIGNED NOT NULL,
  curs_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (mestre_id, curs_id),
  CONSTRAINT fk_mestre_curs_mestre
    FOREIGN KEY (mestre_id) REFERENCES mestres(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_mestre_curs_curs
    FOREIGN KEY (curs_id) REFERENCES cursos(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================
-- Dades d'exemple
-- =========================

INSERT INTO estudiants (nom, edat) VALUES
  ('Aina', 16),
  ('Pol', 17),
  ('Júlia', 15),
  ('Marc', 18),
  ('Núria', 16);

INSERT INTO mestres (nom) VALUES
  ('Carme Soler'),
  ('Jordi Vidal'),
  ('Laia Ferrer');

INSERT INTO especialitats (nom) VALUES
  ('Programació'),
  ('Bases de dades'),
  ('Xarxes'),
  ('Disseny web');

INSERT INTO cursos (nom, tematica) VALUES
  ('Introducció a Python', 'Programació'),
  ('SQL bàsic', 'Bases de dades'),
  ('Administració de xarxes', 'Xarxes'),
  ('HTML i CSS', 'Disseny web'),
  ('Projecte de full-stack', 'Disseny web');

-- Especialitats per mestre (cada mestre en té 1 o més)
INSERT INTO mestre_especialitat (mestre_id, especialitat_id)
SELECT m.id, e.id
FROM mestres m
JOIN especialitats e ON e.nom IN ('Programació', 'Disseny web')
WHERE m.nom = 'Carme Soler';

INSERT INTO mestre_especialitat (mestre_id, especialitat_id)
SELECT m.id, e.id
FROM mestres m
JOIN especialitats e ON e.nom IN ('Bases de dades', 'Xarxes')
WHERE m.nom = 'Jordi Vidal';

INSERT INTO mestre_especialitat (mestre_id, especialitat_id)
SELECT m.id, e.id
FROM mestres m
JOIN especialitats e ON e.nom IN ('Disseny web')
WHERE m.nom = 'Laia Ferrer';

-- Cursos impartits (cada mestre pot impartir 0 o més)
INSERT INTO mestre_curs (mestre_id, curs_id)
SELECT m.id, c.id
FROM mestres m
JOIN cursos c ON c.nom IN ('Introducció a Python', 'HTML i CSS', 'Projecte de full-stack')
WHERE m.nom = 'Carme Soler';

INSERT INTO mestre_curs (mestre_id, curs_id)
SELECT m.id, c.id
FROM mestres m
JOIN cursos c ON c.nom IN ('SQL bàsic', 'Administració de xarxes')
WHERE m.nom = 'Jordi Vidal';

-- Laia: 0 cursos -> no inserim res

-- Matrícules estudiants (cada estudiant pot fer 0 o més cursos)
INSERT INTO estudiant_curs (estudiant_id, curs_id)
SELECT s.id, c.id
FROM estudiants s
JOIN cursos c ON c.nom IN ('Introducció a Python', 'HTML i CSS')
WHERE s.nom = 'Aina';

INSERT INTO estudiant_curs (estudiant_id, curs_id)
SELECT s.id, c.id
FROM estudiants s
JOIN cursos c ON c.nom IN ('SQL bàsic')
WHERE s.nom = 'Pol';

-- Júlia: 0 cursos -> no inserim res

INSERT INTO estudiant_curs (estudiant_id, curs_id)
SELECT s.id, c.id
FROM estudiants s
JOIN cursos c ON c.nom IN ('Administració de xarxes', 'Projecte de full-stack')
WHERE s.nom = 'Marc';

INSERT INTO estudiant_curs (estudiant_id, curs_id)
SELECT s.id, c.id
FROM estudiants s
JOIN cursos c ON c.nom IN ('HTML i CSS', 'SQL bàsic')
WHERE s.nom = 'Núria';
