# Java-web: API da imobiliária com JWT

Projeto da disciplina de Programação Web IV (IFFar, Campus Panambi). É uma API em Spring Boot para uma imobiliária, com autenticação e autorização usando JWT.

As respostas das perguntas da atividade estão em [Respostas_Atividade_JWT_ArthurFogacaMartins.pdf](Respostas_Atividade_JWT_ArthurFogacaMartins.pdf).

## Tecnologias

- Java 25 e Spring Boot 4
- Spring Security e `com.auth0:java-jwt`
- MySQL (MAMP)

## Como rodar

1. Inicie o MySQL (MAMP, porta 8889, usuário e senha `root`).
2. Importe o arquivo `../banco/pw4.sql`, que cria o banco `pw4` já com as tabelas e os dados de demonstração.
3. Na pasta do projeto, rode:
   ```
   mvn spring-boot:run
   ```
4. A API fica em `http://localhost:8080`.

Opcionalmente, defina a variável `JWT_SECRET` com pelo menos 32 caracteres. Sem ela o sistema cria uma chave temporária e os tokens deixam de valer quando ele reinicia.

## Trabalho final: ofertas, contratos e favoritos

O front-end em Angular que consome esta API está na pasta `../frontend`.

- Na primeira execução o Hibernate cria as tabelas `ofertas`, `contratos` e `favoritos`, e o `MigracaoBanco`
  converte a coluna `imoveis.status` para VARCHAR (para aceitar o novo status `RESERVADO`).
- `../banco/pw4.sql` já traz tudo pronto. Para um banco antigo, `../banco/dados_demo.sql` (rode depois de subir a API uma vez) adiciona bairros, tipos, imóveis e o usuário
  `cliente2.jwt@teste.com` para testar ofertas concorrentes.
- Os PDFs dos contratos são gerados sem biblioteca externa (`PdfSimples`) e salvos em `uploads/contratos/`.
- E-mails (com `MAIL_USER` e `MAIL_PASSWORD`, senha de app do Gmail): o cliente é avisado quando a oferta é aceita ou
  recusada, quando o contrato fica pronto para assinar, é cancelado ou é assinado; os corretores recebem cada oferta nova;
  os administradores recebem cada contrato enviado para aprovação; o corretor é avisado quando o contrato é devolvido
  (com o motivo) e quando o cliente assina. Sem as variáveis a operação funciona normalmente e só o e-mail deixa de ser
  enviado (fica registrado no log).
- O CORS libera `http://localhost:4200`; para outra origem defina `CORS_ORIGENS`.

### Perfis

- **CLIENTE**: faz ofertas, favorita imóveis e assina contratos.
- **CORRETOR**: aceita ou recusa ofertas e prepara os contratos (valor final, prazo, vencimento e observações).
- **ADMIN**: cadastra imóveis e usuários (inclusive corretores), consulta ofertas e aprova, devolve ou cancela contratos.

### Regras de negócio

1. Só imóveis `DISPONIVEL` recebem ofertas, e um cliente não pode ter duas ofertas `PENDENTE` para o mesmo imóvel (409).
2. O corretor aceita uma oferta: oferta `ACEITA`, imóvel `RESERVADO`, demais pendentes do imóvel `EM_ESPERA` e contrato
   gerado em `RASCUNHO`, com o valor da oferta, vencimento no dia 10 e, no aluguel, prazo de 30 meses.
3. O corretor ajusta os dados (só em `RASCUNHO` ou `DEVOLVIDO`; no aluguel o prazo é obrigatório) e envia: `EM_APROVACAO`.
4. O admin aprova (`AGUARDANDO_ASSINATURA`, o cliente recebe e-mail) ou devolve com um motivo (`DEVOLVIDO`, volta ao corretor).
5. O cliente só vê o contrato depois de aprovado. Ao assinar: `ASSINADO`, imóvel `ALUGADO` ou `VENDIDO`, demais ofertas `RECUSADA`.
6. Cancelar o contrato (cliente desistiu): contrato `CANCELADO`, imóvel volta a `DISPONIVEL` e as ofertas em espera voltam
   a `PENDENTE`. Contrato assinado não pode ser cancelado.
7. Ações simultâneas: o aceite trava o imóvel no banco (dois corretores aceitando ofertas do mesmo imóvel são atendidos
   em fila) e ofertas e contratos têm controle de versão; quem agir sobre um registro que acabou de mudar recebe 409
   pedindo para recarregar a página.

```
RASCUNHO ──enviar──▶ EM_APROVACAO ──aprovar──▶ AGUARDANDO_ASSINATURA ──assinar──▶ ASSINADO
   ▲                     │
   └──── DEVOLVIDO ◀─devolver
(cancelar: qualquer situação antes de ASSINADO)
```

Erros seguem sempre o formato `{"status": 409, "erro": "mensagem"}` (404 item não encontrado, 403 sem permissão, 409 regra de negócio).

## Usuários de teste

| E-mail | Senha | Papel |
|---|---|---|
| admin.jwt@teste.com | Senha@123 | ADMIN |
| cliente.jwt@teste.com | Senha@123 | CLIENTE |
| cliente2.jwt@teste.com | Senha@123 | CLIENTE |
| corretor.jwt@teste.com | Senha@123 | CORRETOR |

## Rotas

| Ação | Rota | Quem acessa |
|---|---|---|
| Login / cadastro de cliente | `POST /public/login`, `POST /public/cadastro` | Todos |
| Vitrine com filtros e paginação | `GET /imoveis/buscar?status=&bairroId=&tipoId=&finalidade=&precoMin=&precoMax=&ordem=preco_asc\|preco_desc&page=&size=` | Todos |
| Listar imóveis / um imóvel | `GET /imoveis`, `GET /imoveis/{id}` | Todos |
| Cadastrar, alterar e remover imóveis | `POST`, `PUT`, `DELETE /imoveis` | ADMIN |
| Cadastrar e gerenciar usuários (busca `?busca=`, `DELETE`) | `/api/usuarios` | ADMIN |
| Fazer oferta / minhas ofertas / cancelar | `POST /ofertas`, `GET /ofertas/minhas`, `PATCH /ofertas/{id}/cancelar` | CLIENTE |
| Listar ofertas | `GET /ofertas?status=` | ADMIN, CORRETOR |
| Aceitar ou recusar oferta | `PATCH /ofertas/{id}/aceitar`, `PATCH /ofertas/{id}/recusar` | CORRETOR |
| Favoritos | `GET /favoritos`, `GET /favoritos/ids`, `POST` e `DELETE /favoritos/{imovelId}` | CLIENTE |
| Meus contratos / assinar | `GET /contratos/meus`, `PATCH /contratos/{id}/assinar` | CLIENTE |
| Listar contratos / um contrato | `GET /contratos?status=`, `GET /contratos/{id}` | ADMIN, CORRETOR |
| Preparar contrato / enviar para aprovação | `PUT /contratos/{id}`, `PATCH /contratos/{id}/enviar` | CORRETOR |
| Aprovar, devolver (`{"motivo": "..."}`), cancelar contrato | `PATCH /contratos/{id}/aprovar`, `/devolver`, `/cancelar` | ADMIN |
| PDF do contrato | `GET /contratos/{id}/pdf` | ADMIN, CORRETOR ou o cliente dono (depois de aprovado) |
| Painel do admin (totais e gráficos) | `GET /dashboard` | ADMIN |
| Painel do corretor | `GET /dashboard/corretor` | CORRETOR |
| Alterar status de imóvel | `PATCH /imoveis/{id}/status` | Qualquer usuário logado |

O login devolve um token, que deve ser enviado nas outras requisições no cabeçalho `Authorization: Bearer <token>`.

- Sem token, ou com token inválido ou expirado, a API retorna **401**.
- Com um token válido de um usuário sem permissão (por exemplo, CLIENTE cadastrando imóvel ou ADMIN aceitando oferta), retorna **403**.

A pasta `postman/` tem a coleção "Imobiliária - JWT" com esses testes; a pasta "6. Fluxo do contrato" percorre
oferta → aceite do corretor → preparo → devolução → aprovação → assinatura (defina `imovelId` com um imóvel disponível).
`./testar-seguranca.sh` confere as permissões de cada perfil.
