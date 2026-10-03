-- pedro@gmail.com: assinante Premium ativo | ph@gmail.com: sem assinatura (testa "assinatura inativa")
INSERT INTO tb_user (name, cpf, phone, email, password, premium_until) VALUES ('Pedro Henrique', '11590329635', '35999032909', 'pedro@gmail.com', '$2a$10$zMYHbCHGd8iw2dJ3hYWNkOL76C2p.OT5g9ZgEAborVI1C1qnTO.By', TIMESTAMP WITH TIME ZONE '2099-12-31 23:59:59+00:00');
INSERT INTO tb_user (name, cpf, phone, email, password, premium_until) VALUES ('Henrique', '11590329635', '35999032909', 'ph@gmail.com', '$2a$10$zMYHbCHGd8iw2dJ3hYWNkOL76C2p.OT5g9ZgEAborVI1C1qnTO.By', NULL);

INSERT INTO tb_role (authority) VALUES ('ROLE_EMPLOYEE');
INSERT INTO tb_role (authority) VALUES ('ROLE_ADMIN');
INSERT INTO tb_role (authority) VALUES ('ROLE_PLAYER');

INSERT INTO tb_user_role (user_id, role_id) VALUES (1, 1);
INSERT INTO tb_user_role (user_id, role_id) VALUES (1, 2);
INSERT INTO tb_user_role (user_id, role_id) VALUES (2, 1);