
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

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `pw4` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `pw4`;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `bairros` WRITE;
/*!40000 ALTER TABLE `bairros` DISABLE KEYS */;
INSERT INTO `bairros` VALUES (1,'80099-999','80000-000','Curitiba','PR','Centro','2026-09-22 23:33:47','2026-09-22 23:33:47');
/*!40000 ALTER TABLE `bairros` ENABLE KEYS */;
UNLOCK TABLES;
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `fotos_imoveis` WRITE;
/*!40000 ALTER TABLE `fotos_imoveis` DISABLE KEYS */;
INSERT INTO `fotos_imoveis` VALUES (13,'/uploads/imoveis/19/fachada.jpg',_binary '','2026-09-23 03:01:03','fachada.jpg',1,'2026-09-23 03:01:03',19),(14,'/uploads/imoveis/19/fachada.jpg',_binary '','2026-09-23 03:01:24','fachada.jpg',1,'2026-09-23 03:01:24',19);
/*!40000 ALTER TABLE `fotos_imoveis` ENABLE KEYS */;
UNLOCK TABLES;
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
  `status` enum('ALUGADO','DISPONIVEL','INATIVO','VENDIDO') NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `imoveis` WRITE;
/*!40000 ALTER TABLE `imoveis` DISABLE KEYS */;
INSERT INTO `imoveis` VALUES (4,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-23 02:39:07',NULL,_binary '\0',NULL,NULL,'VENDA',NULL,NULL,NULL,370000.00,'DISPONIVEL','Apartamento 2 quartos no Centro - Reformado','2026-10-28 01:53:49',1,1,1),(5,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-23 02:39:07',NULL,_binary '\0',NULL,NULL,'VENDA',NULL,NULL,NULL,370000.00,'DISPONIVEL','Apartamento 2 quartos no Centro - Reformado','2026-09-23 02:57:18',1,1,1),(6,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-23 02:40:14',NULL,_binary '\0',NULL,NULL,'VENDA',NULL,NULL,NULL,370000.00,'DISPONIVEL','Apartamento 2 quartos no Centro - Reformado','2026-09-23 02:57:20',1,1,1),(7,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-23 02:41:16',NULL,_binary '\0',NULL,NULL,'VENDA',NULL,NULL,NULL,370000.00,'DISPONIVEL','Apartamento 2 quartos no Centro - Reformado','2026-09-23 02:57:21',1,1,1),(8,60.00,65.50,1,'Varanda, armários planejados','80000-000','Apto 45','2026-09-23 02:41:16','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-09-23 02:41:16',1,1,1),(9,60.00,65.50,1,'Varanda, armários planejados','80000-000','Apto 45','2026-09-23 02:41:16','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-09-23 02:41:16',1,1,1),(10,60.00,65.50,1,'Varanda, armários planejados','80000-000','Apto 45','2026-09-23 02:42:16','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-09-23 02:42:16',1,1,1),(11,60.00,65.50,1,'Varanda, armários planejados','80000-000','Apto 45','2026-09-23 02:42:16','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-09-23 02:42:16',1,1,1),(13,60.00,65.50,1,'Varanda, armários planejados','80000-000','Apto 45','2026-09-23 02:42:16','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-09-23 02:42:16',1,1,1),(14,60.00,65.50,1,'Varanda, armários planejados','80000-000','Apto 45','2026-09-23 02:44:23','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-09-23 02:44:23',1,1,1),(15,60.00,65.50,1,'Varanda, armários planejados','80000-000','Apto 45','2026-09-23 02:45:30','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-09-23 02:45:30',1,1,1),(16,60.00,65.50,1,'Varanda, armários planejados','80000-000','Apto 45','2026-09-23 02:47:32','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-09-23 02:47:32',1,1,1),(17,60.00,65.50,1,'Varanda, armários planejados','80000-000','Apto 45','2026-09-23 02:54:33','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-09-23 02:54:33',1,1,1),(18,60.00,65.50,1,'Varanda, armários planejados','80000-000','Apto 45','2026-09-23 02:56:06','Ótima localização, próximo ao comércio',_binary '',2,'Rua das Flores','VENDA',1,'123',NULL,350000.00,'DISPONIVEL','Apartamento 2 quartos no Centro','2026-09-23 02:56:06',1,1,1),(19,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-23 02:58:26',NULL,_binary '\0',NULL,NULL,'VENDA',NULL,NULL,NULL,370000.00,'DISPONIVEL','Apartamento 2 quartos no Centro - Reformado','2026-09-23 03:01:38',1,1,1),(21,180.75,300.50,2,'Piscina, Churrasqueira, Jardim','12345-678','Casa 02','2026-10-07 03:29:35','Excelente casa em bairro tranquilo, próximo a escolas e comércios.',_binary '',3,'Rua das Flores','VENDA',2,'123',3500.00,850000.00,'DISPONIVEL','Casa ampla com piscina','2026-10-07 03:29:35',1,1,1);
/*!40000 ALTER TABLE `imoveis` ENABLE KEYS */;
UNLOCK TABLES;
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

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
INSERT INTO `produtos` VALUES (2,'Teclado Mecânico',249.9,15),(3,'Mouse Óptico',59.9,40),(4,'Monitor 24 polegadas',899,12),(5,'Notebook Gamer',4599.99,5),(6,'Cadeira Ergonômica',1299.5,8),(7,'Headset Bluetooth',199.9,25),(8,'Webcam Full HD',149,18),(9,'SSD 1TB',349.9,30),(10,'Impressora Multifuncional',799,7);
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `tipos_imoveis` WRITE;
/*!40000 ALTER TABLE `tipos_imoveis` DISABLE KEYS */;
INSERT INTO `tipos_imoveis` VALUES (1,'2026-09-23 02:35:08','Unidade em prédio residencial, com área comum compartilhada','Apartamento','2026-09-23 02:35:08'),(2,'2026-09-23 02:45:11','Unidade em prédio residencial, com área comum compartilhada','Apartamento','2026-09-23 02:45:11'),(3,'2026-09-23 02:46:45','Unidade em prédio residencial, com área comum compartilhada','Apartamento','2026-09-23 02:46:45'),(4,'2026-09-23 02:54:08','Unidade em prédio residencial, com área comum compartilhada','Apartamento','2026-09-23 02:54:08'),(5,'2026-09-23 02:54:29','Unidade em prédio residencial, com área comum compartilhada','Apartamento','2026-09-23 02:54:29'),(6,'2026-09-23 02:55:54','Unidade em prédio residencial, com área comum compartilhada','Apartamento','2026-09-23 02:55:54'),(7,'2026-09-23 02:57:27','Unidade em prédio residencial, com área comum compartilhada','Apartamento','2026-09-23 02:57:27');
/*!40000 ALTER TABLE `tipos_imoveis` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `tipo` enum('ADMIN','CLIENTE') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Teste Run','teste@gmail.com','$2a$10$sWrcR1ZYAY.fNbZvSW1K1uYV1jZcpt20.sCuZ.FqLbZ2JycOos3YO','ADMIN','2026-09-08 22:38:16','2026-09-08 22:38:16'),(3,'Caetano','caetano@gmail.com','$2a$10$fsbRSq6kmQYn2G1ab40K4OZra1tS2zwr7amy5MddPiHUUzO6arhW.','ADMIN','2026-09-08 22:38:16','2026-09-08 22:38:16'),(4,'Teste Automatizado','teste.automatizado+1788907184@example.com','$2a$10$cd.Ck1V9GDOxrCJkg3azf.E6dWw/y7mgtfnb4ptYcOWRiFQSAGXKm','CLIENTE','2026-09-09 01:39:45','2026-09-09 01:39:45'),(5,'Teste Final','teste.final+1788909236@example.com','$2a$10$L1XqFo0Y65x98yqx0EWLX.l2tchWpOkOFORXiseeuzMzxQ1/s.GgW','CLIENTE','2026-09-09 02:13:56','2026-09-09 02:13:56'),(6,'Teste Thunder Client','thunderclient.teste+1788912193@example.com','$2a$10$bIYP7TnefJc94a5K5XycI.H3MK1cYYtl1PFRvGh2QSK/T9dUWxlx2','CLIENTE','2026-09-09 03:03:14','2026-09-09 03:03:14'),(7,'Teste JSON','json.teste2+1788912647@example.com','$2a$10$IUeOGWLzihvokECWa4XHHOFaFuY79sKysBFAR5zrFjnyu7I0kBjbW','CLIENTE','2026-09-09 03:10:48','2026-09-09 03:10:48'),(8,'Teste Form','form.teste+1788912656@example.com','$2a$10$vmhIqjjCxoBdm2GMIZaZ1O7wmXE40DuwCgI73CyxO7mNyJc6jnuT.','CLIENTE','2026-09-09 03:10:57','2026-09-09 03:10:57'),(9,'Teste JSON','algum-email-novo@example.com','$2a$10$GH8tfZbKlsSuPlyzaU6ude3R1YbczlQNlMZs6cZqIUI7y.f/JHRKm','CLIENTE','2026-09-09 03:11:18','2026-09-09 03:11:18'),(10,'Teste DTO Editado','editado@example.com','$2a$10$nWAKQqKuGI3mlObFoRSKUO.IjL5jNyoUNPYankZhifZSsGTk9OMda','CLIENTE','2026-09-09 03:25:11','2026-09-09 03:25:18'),(11,'Usuário Postman Editado','postman.editado+1791332799@teste.com','$2a$10$k/sUdhallFe3F.cl5hbJhuqQ10GavqqeLOVJ.9aPL0huuAmsvESK2','CLIENTE','2026-10-07 03:26:39','2026-10-07 03:26:39'),(12,'Admin JWT','admin.jwt@teste.com','$2a$10$j36A67OWsPS89e/JH6lMOOJ4JNEIKu9ojxjp33yrQFuNO81AQqKwe','ADMIN','2026-10-27 22:22:39','2026-10-27 22:22:39'),(13,'Cliente JWT','cliente.jwt@teste.com','$2a$10$j36A67OWsPS89e/JH6lMOOJ4JNEIKu9ojxjp33yrQFuNO81AQqKwe','CLIENTE','2026-10-27 22:22:39','2026-10-27 22:22:39');
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

