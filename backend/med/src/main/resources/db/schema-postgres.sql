-- =====================================================================
-- Esquema completo do banco do CruzadinhaMed (PostgreSQL)
--
-- Uso: rodar UMA vez num banco novo (ex.: o de producao) antes de subir o backend
-- com o perfil prod. No perfil prod o Hibernate so confere (ddl-auto=validate) se as
-- tabelas batem com as entidades Java; ele nao cria nada.
--
-- Sempre que uma entidade mudar, atualizar este arquivo E rodar o ALTER/CREATE
-- correspondente nos bancos que ja existem.
-- =====================================================================

-- Usuarios
CREATE TABLE tb_user (
  id       BIGSERIAL PRIMARY KEY,
  name     VARCHAR(255),
  cpf      VARCHAR(255),
  phone    VARCHAR(255),
  email    VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  -- Validade da assinatura Premium (NULL = nunca assinou)
  premium_until TIMESTAMP(6) WITH TIME ZONE
);

-- Perfis de acesso
CREATE TABLE tb_role (
  id        BIGSERIAL PRIMARY KEY,
  authority VARCHAR(255)
);

-- Vinculo usuario x perfil
CREATE TABLE tb_user_role (
  user_id BIGINT NOT NULL REFERENCES tb_user(id),
  role_id BIGINT NOT NULL REFERENCES tb_role(id),
  PRIMARY KEY (user_id, role_id)
);

-- Sessoes (refresh tokens). Guarda apenas o hash SHA-256 do token.
CREATE TABLE tb_refresh_token (
  id         BIGSERIAL PRIMARY KEY,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  user_id    BIGINT NOT NULL REFERENCES tb_user(id),
  created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP(6) WITH TIME ZONE
);

-- Codigos de "esqueci minha senha". Guarda apenas o hash do codigo.
CREATE TABLE tb_password_reset (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES tb_user(id),
  code_hash  VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
  attempts   INTEGER NOT NULL,
  used_at    TIMESTAMP(6) WITH TIME ZONE
);

-- Progresso do usuario em cada cruzadinha (uma linha por usuario e cruzadinha)
CREATE TABLE tb_puzzle_progress (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES tb_user(id),
  puzzle_id    VARCHAR(64) NOT NULL,
  cells        VARCHAR(4000) NOT NULL,
  solved_words INTEGER NOT NULL,
  total_words  INTEGER NOT NULL,
  hints_used   INTEGER NOT NULL,
  completed    BOOLEAN NOT NULL,
  completed_at TIMESTAMP(6) WITH TIME ZONE,
  updated_at   TIMESTAMP(6) WITH TIME ZONE NOT NULL,
  CONSTRAINT uk_puzzle_progress_user_puzzle UNIQUE (user_id, puzzle_id)
);

-- Perfis iniciais (novos cadastros recebem ROLE_PLAYER)
INSERT INTO tb_role (authority) VALUES ('ROLE_EMPLOYEE');
INSERT INTO tb_role (authority) VALUES ('ROLE_ADMIN');
INSERT INTO tb_role (authority) VALUES ('ROLE_PLAYER');
