-- MySQL dump 10.13  Distrib 8.0.40, for macos12.7 (arm64)
--
-- Host: 127.0.0.1    Database: pw4
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `pw4`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `pw4` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `pw4`;

--
-- Table structure for table `bairros`
--

DROP TABLE IF EXISTS `bairros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bairros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cep_final` varchar(255) DEFAULT NULL,
  `cep_inicial` varchar(255) DEFAULT NULL,
  `cidade` varchar(255) DEFAULT NULL,
  `estado` varchar(255) DEFAULT NULL,
  `nome` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bairros`
--

LOCK TABLES `bairros` WRITE;
/*!40000 ALTER TABLE `bairros` DISABLE KEYS */;
INSERT INTO `bairros` VALUES (1,'98289-999','98280-000','Panambi','RS','Centro','2026-09-22 23:33:47','2026-11-10 23:57:57'),(4,'98289-999','98280-000','Panambi','RS','Medianeira','2026-11-10 23:10:32','2026-11-10 23:57:57'),(5,'98289-999','98280-000','Panambi','RS','Arco-Íris','2026-11-10 23:10:32','2026-11-10 23:57:57'),(6,'98289-999','98280-000','Panambi','RS','Zona Norte','2026-11-10 23:10:32','2026-11-10 23:57:57'),(7,'98289-999','98280-000','Panambi','RS','Planalto','2026-11-10 23:10:32','2026-11-10 23:57:57');
/*!40000 ALTER TABLE `bairros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contratos`
--

DROP TABLE IF EXISTS `contratos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contratos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `caminho_pdf` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `data_aprovacao` datetime(6) DEFAULT NULL,
  `data_assinatura` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `oferta_id` int NOT NULL,
  `data_envio` datetime(6) DEFAULT NULL,
  `dia_vencimento` int DEFAULT NULL,
  `motivo_devolucao` text,
  `observacoes` text,
  `prazo_meses` int DEFAULT NULL,
  `valor_final` decimal(12,2) DEFAULT NULL,
  `corretor_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK90snmgaot1ywcdr0j67i601e9` (`oferta_id`),
  KEY `FKqu9i6nklupd57e6cafns24sfs` (`corretor_id`),
  CONSTRAINT `FKiaeme61hk3iji24m00oy8nwwk` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas` (`id`),
  CONSTRAINT `FKqu9i6nklupd57e6cafns24sfs` FOREIGN KEY (`corretor_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contratos`
--

LOCK TABLES `contratos` WRITE;
/*!40000 ALTER TABLE `contratos` DISABLE KEYS */;
/*!40000 ALTER TABLE `contratos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favoritos`
--

DROP TABLE IF EXISTS `favoritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favoritos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `imovel_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKaucadettp4w9xloja2h94v0v1` (`usuario_id`,`imovel_id`),
  KEY `FK8mmgjkewbwb9gxu7xm5a1nli` (`imovel_id`),
  CONSTRAINT `FK8mmgjkewbwb9gxu7xm5a1nli` FOREIGN KEY (`imovel_id`) REFERENCES `imoveis` (`id`),
  CONSTRAINT `FKq9wif2hcqfxj8t49wo613wm0h` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favoritos`
--

LOCK TABLES `favoritos` WRITE;
/*!40000 ALTER TABLE `favoritos` DISABLE KEYS */;
/*!40000 ALTER TABLE `favoritos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fotos_imoveis`
--

DROP TABLE IF EXISTS `fotos_imoveis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fotos_imoveis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `caminho` varchar(255) NOT NULL,
  `capa` bit(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `nome_arquivo` varchar(255) NOT NULL,
  `ordem` int DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `imovel_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKlxjlrrwj621jii9i201qr6x3d` (`imovel_id`),
  CONSTRAINT `FKlxjlrrwj621jii9i201qr6x3d` FOREIGN KEY (`imovel_id`) REFERENCES `imoveis` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fotos_imoveis`
--

LOCK TABLES `fotos_imoveis` WRITE;
/*!40000 ALTER TABLE `fotos_imoveis` DISABLE KEYS */;
INSERT INTO `fotos_imoveis` VALUES (20,'./uploads/24/789acd57-487a-4284-b1ae-3eb240fef2c5_sobrado-fachada.jpg',_binary '\0','2026-11-11 02:53:24','789acd57-487a-4284-b1ae-3eb240fef2c5_sobrado-fachada.jpg',1,'2026-11-11 02:53:24',24),(21,'./uploads/24/63956f0f-08f6-498a-85ad-2ebdabc69414_sobrado-sala.jpg',_binary '\0','2026-11-11 02:53:24','63956f0f-08f6-498a-85ad-2ebdabc69414_sobrado-sala.jpg',2,'2026-11-11 02:53:24',24),(22,'./uploads/32/1a96ad79-bcd6-4050-ac1d-2e34ea08bfb8_chacara-piscina.jpg',_binary '\0','2026-11-11 02:53:24','1a96ad79-bcd6-4050-ac1d-2e34ea08bfb8_chacara-piscina.jpg',1,'2026-11-11 02:53:24',32),(23,'./uploads/32/174b94fb-19f0-41f7-8802-c587b7e8f141_chacara-area.jpg',_binary '\0','2026-11-11 02:53:24','174b94fb-19f0-41f7-8802-c587b7e8f141_chacara-area.jpg',2,'2026-11-11 02:53:24',32),(24,'./uploads/21/e97dbf93-2258-4b05-95cd-a9da31921178_casa-piscina.jpg',_binary '\0','2026-11-11 02:53:24','e97dbf93-2258-4b05-95cd-a9da31921178_casa-piscina.jpg',1,'2026-11-11 02:53:24',21),(25,'./uploads/21/8b24c7fe-1bd5-4037-b53e-d8cc2ab6289b_casa-fundos.jpg',_binary '\0','2026-11-11 02:53:24','8b24c7fe-1bd5-4037-b53e-d8cc2ab6289b_casa-fundos.jpg',2,'2026-11-11 02:53:24',21),(26,'./uploads/27/91e0bc8b-fbde-4054-b780-3b745c6119bd_casa-quintal.jpg',_binary '\0','2026-11-11 02:53:24','91e0bc8b-fbde-4054-b780-3b745c6119bd_casa-quintal.jpg',1,'2026-11-11 02:53:24',27),(27,'./uploads/30/e1f256fc-3e17-4c21-aba7-2d859be74599_casa-portao.jpg',_binary '\0','2026-11-11 02:53:24','e1f256fc-3e17-4c21-aba7-2d859be74599_casa-portao.jpg',1,'2026-11-11 02:53:24',30),(28,'./uploads/30/792306ed-2fc1-4aed-860f-89cd021e2ca0_casa-portao-noite.jpg',_binary '\0','2026-11-11 02:53:24','792306ed-2fc1-4aed-860f-89cd021e2ca0_casa-portao-noite.jpg',2,'2026-11-11 02:53:24',30),(29,'./uploads/25/51e90ace-d795-4458-8b74-824de364186c_apto-mobiliado-sala.jpg',_binary '\0','2026-11-11 02:53:24','51e90ace-d795-4458-8b74-824de364186c_apto-mobiliado-sala.jpg',1,'2026-11-11 02:53:24',25),(30,'./uploads/25/aa856e3f-4a78-4180-8da1-84530d116bda_apto-mobiliado-cozinha.jpg',_binary '\0','2026-11-11 02:53:24','aa856e3f-4a78-4180-8da1-84530d116bda_apto-mobiliado-cozinha.jpg',2,'2026-11-11 02:53:24',25),(31,'./uploads/29/c80f5ea1-de73-4cd0-b6c5-fde557e7f16e_predio-portao.jpg',_binary '\0','2026-11-11 02:53:24','c80f5ea1-de73-4cd0-b6c5-fde557e7f16e_predio-portao.jpg',1,'2026-11-11 02:53:24',29),(32,'./uploads/29/37a36133-64c2-4238-9787-2520cc5874d7_apto-portao-sala.jpg',_binary '\0','2026-11-11 02:53:24','37a36133-64c2-4238-9787-2520cc5874d7_apto-portao-sala.jpg',2,'2026-11-11 02:53:24',29),(33,'./uploads/33/87295bef-124c-40b2-b5ec-f226fa4d3656_apto-compacto.jpg',_binary '\0','2026-11-11 02:53:24','87295bef-124c-40b2-b5ec-f226fa4d3656_apto-compacto.jpg',1,'2026-11-11 02:53:24',33),(34,'./uploads/26/6e3b7143-012d-44a8-8cc2-eca71b505b51_kitnet.jpg',_binary '\0','2026-11-11 02:53:24','6e3b7143-012d-44a8-8cc2-eca71b505b51_kitnet.jpg',1,'2026-11-11 02:53:24',26),(35,'./uploads/28/56ec7c6d-1c3b-4b9b-8cc7-2172f3e41be7_sala-comercial.jpg',_binary '\0','2026-11-11 02:53:24','56ec7c6d-1c3b-4b9b-8cc7-2172f3e41be7_sala-comercial.jpg',1,'2026-11-11 02:53:24',28),(36,'./uploads/31/743ada45-55e3-47e7-b134-70ad6ce09c2a_terreno.jpg',_binary '\0','2026-11-11 02:53:24','743ada45-55e3-47e7-b134-70ad6ce09c2a_terreno.jpg',1,'2026-11-11 02:53:24',31),(37,'./uploads/19/166bec53-62ca-422b-a598-d83999a11187_predio-centro.jpg',_binary '\0','2026-11-11 02:53:24','166bec53-62ca-422b-a598-d83999a11187_predio-centro.jpg',1,'2026-11-11 02:53:24',19),(38,'./uploads/19/5155d86e-aa8e-4b7c-801d-d03ee7596718_apto-reformado-sala.jpg',_binary '\0','2026-11-11 02:53:24','5155d86e-aa8e-4b7c-801d-d03ee7596718_apto-reformado-sala.jpg',2,'2026-11-11 02:53:24',19);
/*!40000 ALTER TABLE `fotos_imoveis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imoveis`
--

DROP TABLE IF EXISTS `imoveis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imoveis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `area_construida` decimal(10,2) DEFAULT NULL,
  `area_total` decimal(10,2) DEFAULT NULL,
  `banheiros` int DEFAULT NULL,
  `caracteristicas` text,
  `cep` varchar(255) DEFAULT NULL,
  `complemento` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descricao` text,
  `destaque` bit(1) NOT NULL,
  `dormitorios` int DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `finalidade` enum('ALUGUEL','VENDA') NOT NULL,
  `garagem` int DEFAULT NULL,
  `numero` varchar(255) DEFAULT NULL,
  `preco_aluguel` decimal(12,2) DEFAULT NULL,
  `preco_venda` decimal(12,2) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'DISPONIVEL',
  `titulo` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bairro_id` int NOT NULL,
  `tipo_imovel_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKlbe75ud15gr1jhci27a5febtj` (`bairro_id`),
  KEY `FK8l4n1619tyasatoa0a7051ins` (`tipo_imovel_id`),
  KEY `FK2ay3ugbb29heqhnjceltmh8ay` (`usuario_id`),
  CONSTRAINT `FK2ay3ugbb29heqhnjceltmh8ay` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `FK8l4n1619tyasatoa0a7051ins` FOREIGN KEY (`tipo_imovel_id`) REFERENCES `tipos_imoveis` (`id`),
  CONSTRAINT `FKlbe75ud15gr1jhci27a5febtj` FOREIGN KEY (`bairro_id`) REFERENCES `bairros` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imoveis`
--

LOCK TABLES `imoveis` WRITE;
/*!40000 ALTER TABLE `imoveis` DISABLE KEYS */;
INSERT INTO `imoveis` VALUES (4,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-23 02:39:07',NULL,_binary '\0',NULL,NULL,'VENDA',NULL,NULL,NULL,370000.00,'DISPONIVEL','Apartamento 2 quartos no Centro - Reformado','2026-10-28 01:53:49',1,1,1),(5,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-23 02:39:07',NULL,_binary '\0',NULL,NULL,'VENDA',NULL,NULL,NULL,370000.00,'DISPONIVEL','Apartamento 2 quartos no Centro - Reformado','2026-09-23 02:57:18',1,1,1),(6,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-23 02:40:14',NULL,_binary '\0',NULL,NULL,'VENDA',NULL,NULL,NULL,370000.00,'DISPONIVEL','Apartamento 2 quartos no Centro - Reformado','2026-09-23 02:57:20',1,1,1),(7,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-23 02:41:16',NULL,_binary '\0',NULL,NULL,'VENDA',NULL,NULL,NULL,370000.00,'DISPONIVEL','Apartamento 2 quartos no Centro - Reformado','2026-09-23 02:57:21',1,1,1),(8,60.00,65.50,1,'Varanda, armários planejados','98280-000','Apto 45','2026-09-23 02:41:16','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-11-10 23:57:57',1,1,1),(9,60.00,65.50,1,'Varanda, armários planejados','98280-000','Apto 45','2026-09-23 02:41:16','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-11-10 23:57:57',1,1,1),(10,60.00,65.50,1,'Varanda, armários planejados','98280-000','Apto 45','2026-09-23 02:42:16','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-11-10 23:57:57',1,1,1),(11,60.00,65.50,1,'Varanda, armários planejados','98280-000','Apto 45','2026-09-23 02:42:16','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-11-10 23:57:57',1,1,1),(13,60.00,65.50,1,'Varanda, armários planejados','98280-000','Apto 45','2026-09-23 02:42:16','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-11-10 23:57:57',1,1,1),(14,60.00,65.50,1,'Varanda, armários planejados','98280-000','Apto 45','2026-09-23 02:44:23','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-11-10 23:57:57',1,1,1),(15,60.00,65.50,1,'Varanda, armários planejados','98280-000','Apto 45','2026-09-23 02:45:30','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-11-10 23:57:57',1,1,1),(16,60.00,65.50,1,'Varanda, armários planejados','98280-000','Apto 45','2026-09-23 02:47:32','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-11-10 23:57:57',1,1,1),(17,60.00,65.50,1,'Varanda, armários planejados','98280-000','Apto 45','2026-09-23 02:54:33','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-11-10 23:57:57',1,1,1),(18,60.00,65.50,1,'Varanda, armários planejados','98280-000','Apto 45','2026-09-23 02:56:06','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-11-10 23:57:57',1,1,1),(19,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-23 02:58:26',NULL,_binary '\0',2,NULL,'VENDA',NULL,NULL,NULL,370000.00,'DISPONIVEL','Apartamento 2 quartos no Centro - Reformado','2026-11-10 23:10:37',1,1,1),(21,180.75,300.50,2,'Piscina, Churrasqueira, Jardim','98280-000','Casa 02','2026-10-07 03:29:35','Excelente casa em bairro tranquilo, próximo a escolas e comércios.',_binary '',3,'Rua das Flores','VENDA',2,'123',3500.00,850000.00,'DISPONIVEL','Casa ampla com piscina','2026-11-10 23:57:57',1,9,1),(24,260.00,320.00,3,'Espaço gourmet, Lareira, Jardim','98280-000',NULL,'2026-11-10 23:10:32','Sobrado com acabamento de alto padrão, sala ampla e espaço gourmet.',_binary '',4,'Rua das Palmeiras','VENDA',2,'1500',NULL,1250000.00,'DISPONIVEL','Sobrado moderno na Medianeira','2026-11-10 23:57:57',4,9,12),(25,85.00,85.00,2,'Mobiliado, Academia, Portaria 24h','98280-000',NULL,'2026-11-10 23:10:32','Apartamento mobiliado, pronto para morar, perto do comércio.',_binary '',2,'Av. Brasil','ALUGUEL',1,'1200',3800.00,NULL,'DISPONIVEL','Apartamento mobiliado na Medianeira','2026-11-10 23:57:57',4,1,12),(26,28.00,28.00,1,'Mobiliada, Internet inclusa','98280-000',NULL,'2026-11-10 23:10:32','Kitnet compacta e bem iluminada, ideal para estudantes.',_binary '\0',1,'Rua dos Estudantes','ALUGUEL',0,'300',950.00,NULL,'DISPONIVEL','Kitnet perto da universidade','2026-11-10 23:57:57',5,12,12),(27,180.00,360.00,2,'Churrasqueira, Quintal, Edícula','98280-000',NULL,'2026-11-10 23:10:32','Casa térrea com quintal grande e churrasqueira.',_binary '\0',3,'Rua dos Ipês','VENDA',2,'820',NULL,680000.00,'DISPONIVEL','Casa com quintal no Arco-Íris','2026-11-10 23:57:57',5,9,12),(28,45.00,45.00,1,'Elevador, Ar-condicionado','98280-000',NULL,'2026-11-10 23:10:32','Sala comercial com recepção, em prédio com elevador.',_binary '\0',0,'Rua XV de Novembro','ALUGUEL',1,'700',1800.00,NULL,'DISPONIVEL','Sala comercial no Centro','2026-11-10 23:57:57',1,10,12),(29,98.00,98.00,2,'Sacada, Piscina, Salão de festas','98280-000',NULL,'2026-11-10 23:10:32','Apartamento com sacada e churrasqueira, condomínio com lazer.',_binary '',3,'Av. Presidente Vargas','VENDA',2,'3000',NULL,520000.00,'DISPONIVEL','Apartamento 3 quartos na Zona Norte','2026-11-10 23:57:57',6,1,12),(30,90.00,200.00,1,'Quintal, Área de serviço','98280-000',NULL,'2026-11-10 23:10:32','Casa de dois quartos em rua tranquila.',_binary '\0',2,'Rua das Acácias','ALUGUEL',1,'150',2200.00,NULL,'DISPONIVEL','Casa para alugar na Zona Norte','2026-11-10 23:57:57',6,9,12),(31,0.00,480.00,0,'Plano, Esquina','98280-000',NULL,'2026-11-10 23:10:32','Terreno plano, pronto para construir, em região tranquila.',_binary '\0',0,'Rua Sete de Setembro','VENDA',0,'5000',NULL,390000.00,'DISPONIVEL','Terreno no Planalto','2026-11-10 23:57:57',7,11,12),(32,280.00,1500.00,3,'Pomar, Piscina, Churrasqueira','98280-000',NULL,'2026-11-10 23:10:32','Casa ampla com pomar e área verde.',_binary '',4,'Rua dos Pinheiros','VENDA',4,'90',NULL,980000.00,'DISPONIVEL','Chácara urbana no Planalto','2026-11-10 23:57:57',7,9,12),(33,40.00,40.00,1,'Próximo ao transporte público','98280-000',NULL,'2026-11-10 23:10:32','Um quarto, ótimo para quem trabalha no centro.',_binary '\0',1,'Rua Marechal Deodoro','ALUGUEL',0,'450',1400.00,NULL,'DISPONIVEL','Apartamento compacto no Centro','2026-11-10 23:57:57',1,1,12);
/*!40000 ALTER TABLE `imoveis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ofertas`
--

DROP TABLE IF EXISTS `ofertas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ofertas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `mensagem` text,
  `status` varchar(20) NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `valor_proposto` decimal(12,2) NOT NULL,
  `imovel_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK45qxoglntnt4fgdu3b8gdohj5` (`imovel_id`),
  KEY `FK9okk5sq8kbrf9nucsuu5rx0mq` (`usuario_id`),
  CONSTRAINT `FK45qxoglntnt4fgdu3b8gdohj5` FOREIGN KEY (`imovel_id`) REFERENCES `imoveis` (`id`),
  CONSTRAINT `FK9okk5sq8kbrf9nucsuu5rx0mq` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ofertas`
--

LOCK TABLES `ofertas` WRITE;
/*!40000 ALTER TABLE `ofertas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ofertas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `preco` double NOT NULL,
  `quantidade` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
INSERT INTO `produtos` VALUES (2,'Teclado Mecânico',249.9,15),(3,'Mouse Óptico',59.9,40),(4,'Monitor 24 polegadas',899,12),(5,'Notebook Gamer',4599.99,5),(6,'Cadeira Ergonômica',1299.5,8),(7,'Headset Bluetooth',199.9,25),(8,'Webcam Full HD',149,18),(9,'SSD 1TB',349.9,30),(10,'Impressora Multifuncional',799,7);
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_imoveis`
--

DROP TABLE IF EXISTS `tipos_imoveis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_imoveis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descricao` text,
  `nome` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_imoveis`
--

LOCK TABLES `tipos_imoveis` WRITE;
/*!40000 ALTER TABLE `tipos_imoveis` DISABLE KEYS */;
INSERT INTO `tipos_imoveis` VALUES (1,'2026-09-23 02:35:08','Unidade em prédio residencial, com área comum compartilhada','Apartamento','2026-09-23 02:35:08'),(9,'2026-11-10 23:10:32','Residência térrea ou sobrado com terreno próprio','Casa','2026-11-11 02:12:27'),(10,'2026-11-10 23:10:32','Espaço para escritório ou consultório','Sala comercial','2026-11-10 23:10:32'),(11,'2026-11-10 23:10:32','Lote sem construção','Terreno','2026-11-10 23:10:32'),(12,'2026-11-10 23:10:32','Unidade compacta, ideal para estudantes','Kitnet','2026-11-10 23:10:32');
/*!40000 ALTER TABLE `tipos_imoveis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `tipo` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Teste Run','teste@gmail.com','$2a$10$sWrcR1ZYAY.fNbZvSW1K1uYV1jZcpt20.sCuZ.FqLbZ2JycOos3YO','ADMIN','2026-09-08 22:38:16','2026-09-08 22:38:16'),(3,'Caetano','caetano@gmail.com','$2a$10$fsbRSq6kmQYn2G1ab40K4OZra1tS2zwr7amy5MddPiHUUzO6arhW.','ADMIN','2026-09-08 22:38:16','2026-09-08 22:38:16'),(4,'Teste Automatizado','teste.automatizado+1788907184@example.com','$2a$10$cd.Ck1V9GDOxrCJkg3azf.E6dWw/y7mgtfnb4ptYcOWRiFQSAGXKm','CLIENTE','2026-09-09 01:39:45','2026-09-09 01:39:45'),(5,'Teste Final','teste.final+1788909236@example.com','$2a$10$L1XqFo0Y65x98yqx0EWLX.l2tchWpOkOFORXiseeuzMzxQ1/s.GgW','CLIENTE','2026-09-09 02:13:56','2026-09-09 02:13:56'),(6,'Teste Thunder Client','thunderclient.teste+1788912193@example.com','$2a$10$bIYP7TnefJc94a5K5XycI.H3MK1cYYtl1PFRvGh2QSK/T9dUWxlx2','CLIENTE','2026-09-09 03:03:14','2026-09-09 03:03:14'),(7,'Teste JSON','json.teste2+1788912647@example.com','$2a$10$IUeOGWLzihvokECWa4XHHOFaFuY79sKysBFAR5zrFjnyu7I0kBjbW','CLIENTE','2026-09-09 03:10:48','2026-09-09 03:10:48'),(8,'Teste Form','form.teste+1788912656@example.com','$2a$10$vmhIqjjCxoBdm2GMIZaZ1O7wmXE40DuwCgI73CyxO7mNyJc6jnuT.','CLIENTE','2026-09-09 03:10:57','2026-09-09 03:10:57'),(9,'Teste JSON','algum-email-novo@example.com','$2a$10$GH8tfZbKlsSuPlyzaU6ude3R1YbczlQNlMZs6cZqIUI7y.f/JHRKm','CLIENTE','2026-09-09 03:11:18','2026-09-09 03:11:18'),(10,'Teste DTO Editado','editado@example.com','$2a$10$nWAKQqKuGI3mlObFoRSKUO.IjL5jNyoUNPYankZhifZSsGTk9OMda','CLIENTE','2026-09-09 03:25:11','2026-09-09 03:25:18'),(11,'Usuário Postman Editado','postman.editado+1791332799@teste.com','$2a$10$k/sUdhallFe3F.cl5hbJhuqQ10GavqqeLOVJ.9aPL0huuAmsvESK2','CLIENTE','2026-10-07 03:26:39','2026-10-07 03:26:39'),(12,'Admin JWT','admin.jwt@teste.com','$2a$10$j36A67OWsPS89e/JH6lMOOJ4JNEIKu9ojxjp33yrQFuNO81AQqKwe','ADMIN','2026-10-27 22:22:39','2026-10-27 22:22:39'),(13,'Cliente JWT','cliente.jwt@teste.com','$2a$10$j36A67OWsPS89e/JH6lMOOJ4JNEIKu9ojxjp33yrQFuNO81AQqKwe','CLIENTE','2026-10-27 22:22:39','2026-10-27 22:22:39'),(15,'Cliente Dois','cliente2.jwt@teste.com','$2a$10$j36A67OWsPS89e/JH6lMOOJ4JNEIKu9ojxjp33yrQFuNO81AQqKwe','CLIENTE','2026-11-10 23:10:32','2026-11-10 23:10:32'),(20,'Corretor JWT','corretor.jwt@teste.com','$2a$10$j36A67OWsPS89e/JH6lMOOJ4JNEIKu9ojxjp33yrQFuNO81AQqKwe','CORRETOR','2026-11-17 22:46:20','2026-11-17 22:46:20');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
