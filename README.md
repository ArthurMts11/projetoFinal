# Imobiliária Fogami — Trabalho final de Programação Web IV

Sistema de uma imobiliária (IFFar, Campus Panambi): API REST em Spring Boot com JWT e front-end em Angular.

| Pasta | Conteúdo |
|---|---|
| [`banco/`](banco) | `pw4.sql`: banco MySQL completo (estrutura e dados de demonstração) |
| [`backend/`](backend) | API REST em Java 25 + Spring Boot 4, Spring Security e JWT ([README](backend/README.md)) |
| [`frontend/`](frontend) | Front-end em Angular 22 ([README](frontend/README.md)) |

## Como rodar

### 1. Banco de dados

Inicie o MySQL do MAMP (porta 8889, usuário e senha `root`) e importe `banco/pw4.sql`
(pelo phpMyAdmin, em Importar, ou pelo terminal):

```bash
/Applications/MAMP/Library/bin/mysql80/bin/mysql -uroot -proot -h 127.0.0.1 -P 8889 < banco/pw4.sql
```

O script cria o banco `pw4` com todas as tabelas: usuários, bairros, tipos, imóveis, fotos, ofertas, contratos e favoritos.

### 2. Backend

```bash
cd backend
export JWT_SECRET="uma-chave-com-pelo-menos-32-caracteres"
mvn spring-boot:run
```

A API sobe em `http://localhost:8080`. Para conferir as regras de segurança (401, 403 e 200), com a API rodando:

```bash
./testar-seguranca.sh
```

Para enviar e-mails, defina também `MAIL_USER` e `MAIL_PASSWORD` (senha de app do Gmail).

### 3. Front-end

```bash
cd frontend
npm install
npm start
```

Abra `http://localhost:4200`. Precisa do Node.js 22.22 ou mais novo.

## Usuários de teste

| E-mail | Senha | Perfil |
|---|---|---|
| admin.jwt@teste.com | Senha@123 | ADMIN |
| cliente.jwt@teste.com | Senha@123 | CLIENTE |
| cliente2.jwt@teste.com | Senha@123 | CLIENTE |

As funcionalidades, as regras de negócio e o roteiro da demonstração estão no [README do front-end](frontend/README.md).
As rotas da API estão no [README do backend](backend/README.md).
