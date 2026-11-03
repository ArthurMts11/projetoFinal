# Atividade: autenticação e autorização com JWT

**Aluno:** Arthur Fogaça Martins · Programação Web IV · IFFar Panambi

## 1) Qual a diferença entre autenticação e autorização? Dê um exemplo.

**Autenticação** é verificar **quem** o usuário é. O sistema confere uma prova de identidade (e-mail e senha, biometria, código no celular) e confirma se ela pertence a alguém cadastrado.

**Autorização** vem depois e verifica **o que** esse usuário pode fazer. Ela compara o papel ou as permissões dele com o que a ação exige.

**Exemplo no nosso sistema de imobiliária:** a usuária Maria faz login com e-mail e senha corretos. Isso é a autenticação, e ela recebe um token. Em seguida ela tenta cadastrar um imóvel. O sistema sabe quem ela é, mas o papel dela é `CLIENTE`, e só `ADMIN` pode cadastrar imóveis. A autorização nega o pedido. Por isso a API devolve:

- **401 Unauthorized** quando a **autenticação** falha: não veio token, ou ele é inválido ou expirou. O sistema não sabe quem está pedindo.
- **403 Forbidden** quando a **autorização** falha: o token é válido e o sistema sabe quem é, mas essa pessoa não tem permissão.

Uma analogia: no aeroporto, mostrar o documento no check-in é autenticação. O cartão de embarque, que só deixa você entrar no seu voo e na sua classe, é autorização.

## 2) Qual a diferença entre *stateful* e *stateless*?

**Stateful (com estado):** o servidor guarda informações sobre cada cliente entre uma requisição e outra. O exemplo clássico é a **sessão**. Depois do login, o servidor cria uma sessão na memória ou no banco e manda ao navegador só um identificador (o cookie `JSESSIONID`). Em cada requisição, o servidor procura essa sessão para saber quem é o usuário.

- Vantagem: fica fácil invalidar o acesso no logout, porque basta apagar a sessão.
- Desvantagem: o servidor gasta memória por usuário. Com vários servidores, todos precisam compartilhar as sessões (*sticky session* ou um Redis, por exemplo).

**Stateless (sem estado):** o servidor não guarda nada sobre o cliente. **Cada requisição traz tudo** o que é preciso para ser atendida. Com JWT, o próprio token carrega quem é o usuário e qual o papel dele, e é assinado pelo servidor. O servidor só confere a assinatura e a validade.

- Vantagem: escala fácil, porque qualquer servidor que tenha a chave atende qualquer requisição. Também combina com APIs REST e apps mobile.
- Desvantagem: não dá para "apagar" um token emitido. Ele vale até expirar. Por isso se usa expiração curta (ou uma lista de tokens revogados, mas aí volta a existir estado).

**No projeto existem os dois.** As telas JSP de `/admin` usam sessão (stateful). A API REST (`/imoveis`, `/api/usuarios`...) usa JWT com `SessionCreationPolicy.STATELESS`.

## 3) Qual a semântica e a sintaxe de um JWT?

**Semântica (o que significa):** JWT (*JSON Web Token*, RFC 7519) é uma forma compacta e segura de transmitir **afirmações (claims)** sobre alguém entre duas partes. Um exemplo de afirmação: "este é o usuário teste@gmail.com, papel ADMIN, válido até 21h". O servidor **assina** o token. Se alguém alterar qualquer caractere, a assinatura deixa de bater e o token é rejeitado. O token é **autocontido**: o servidor confia nele sem consultar banco nem sessão.

> Importante: o JWT é **assinado, não criptografado**. Qualquer pessoa consegue ler o conteúdo decodificando o Base64. Por isso **nunca** se coloca senha ou dado sensível dentro dele.

**Sintaxe (como é escrito):** são três partes em **Base64URL**, separadas por ponto:

```
xxxxx.yyyyy.zzzzz
HEADER.PAYLOAD.SIGNATURE
```

1. **Header:** o algoritmo de assinatura e o tipo do token.
   ```json
   { "alg": "HS256", "typ": "JWT" }
   ```
2. **Payload:** as *claims*. Algumas são registradas (padronizadas) e outras são próprias da aplicação.
   ```json
   {
     "iss": "projeto2",           // emissor
     "sub": "teste@gmail.com",    // sujeito (quem é)
     "iat": 1761600000,           // emitido em (timestamp)
     "exp": 1761607200,           // expira em (timestamp)
     "id": 1,
     "nome": "Teste Run",
     "role": "ADMIN"              // papel usado na autorização
   }
   ```
3. **Signature:** garante a integridade e a autenticidade do token.
   ```
   HMACSHA256( base64url(header) + "." + base64url(payload), chaveSecreta )
   ```

O cliente envia o token em cada requisição pelo cabeçalho HTTP:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi...
```

## 4) Implementação

A tabela de rotas da atividade ficou assim no sistema:

| Ação | Rota | Quem acessa | Token? |
|---|---|---|---|
| Login | `POST /public/login` | Todos | Não |
| Listar imóveis / um imóvel | `GET /imoveis`, `GET /imoveis/{id}` | Todos | Não |
| Cadastrar, alterar e remover imóveis | `POST /imoveis`, `PUT /imoveis/{id}`, `DELETE /imoveis/{id}` | ADMIN | Sim |
| Cadastrar e gerenciar usuários | `/api/usuarios/**` | ADMIN | Sim |
| Alterar status de imóvel | `PATCH /imoveis/{id}/status` | Qualquer autenticado | Sim |

Erros: **401** quando não há token ou ele é inválido ou expirou. **403** quando o token é válido, mas o papel não tem permissão (ex.: `CLIENTE` cadastrando imóvel).

Arquivos principais:

- `config/SecurityConfig.java`: regras de acesso (cadeia da API, stateless com JWT)
- `security/TokenService.java`: gera e valida o token com a biblioteca `com.auth0:java-jwt` (HS256)
- `security/SecurityFilter.java`: lê o header `Authorization: Bearer`, valida o token e define o papel `ROLE_ADMIN`/`ROLE_CLIENTE`
- `controller/AuthController.java`: `POST /public/login`
- `security/JsonErroSeguranca.java`: respostas 401/403 em JSON
- `src/test/.../ApiSecurityTest.java`: testes automatizados de toda a tabela
