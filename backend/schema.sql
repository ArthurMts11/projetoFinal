-- Script de criação do banco usado pela aplicação (datasource configurado em
-- src/main/resources/application.properties).
-- Execute este script no MySQL antes de rodar a aplicação.
-- (spring.jpa.hibernate.ddl-auto=update também aplica alterações de schema
-- automaticamente ao subir a aplicação, mas este script serve de referência.)

CREATE DATABASE IF NOT EXISTS pw4
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE pw4;

CREATE TABLE IF NOT EXISTS produtos (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    preco      DOUBLE       NOT NULL,
    quantidade INT          NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    senha      VARCHAR(100) NOT NULL,
    tipo       ENUM('ADMIN', 'CLIENTE') NOT NULL DEFAULT 'CLIENTE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bairros (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    cidade      VARCHAR(100),
    estado      VARCHAR(100),
    cep_inicial VARCHAR(100),
    cep_final   VARCHAR(100),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tipos_imoveis (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    descricao  TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS imoveis (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    titulo           VARCHAR(255) NOT NULL,
    descricao        TEXT,
    preco_venda      DECIMAL(12, 2),
    preco_aluguel    DECIMAL(12, 2),
    finalidade       ENUM('VENDA', 'ALUGUEL') NOT NULL,
    status           ENUM('DISPONIVEL', 'VENDIDO', 'ALUGADO', 'INATIVO') NOT NULL DEFAULT 'DISPONIVEL',
    dormitorios      INT,
    banheiros        INT,
    garagem          INT,
    area_total       DECIMAL(10, 2),
    tipo_imovel_id   INT NOT NULL,
    area_construida  DECIMAL(10, 2),
    endereco         VARCHAR(255),
    numero           VARCHAR(20),
    complemento      VARCHAR(100),
    cep              VARCHAR(20),
    caracteristicas  TEXT,
    destaque         BOOLEAN NOT NULL DEFAULT FALSE,
    bairro_id        INT NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    usuario_id       INT NOT NULL,
    FOREIGN KEY (tipo_imovel_id) REFERENCES tipos_imoveis (id),
    FOREIGN KEY (bairro_id) REFERENCES bairros (id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

CREATE TABLE IF NOT EXISTS fotos_imoveis (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    imovel_id    INT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    caminho      VARCHAR(255) NOT NULL,
    capa         BOOLEAN NOT NULL DEFAULT FALSE,
    ordem        INT,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (imovel_id) REFERENCES imoveis (id)
);
