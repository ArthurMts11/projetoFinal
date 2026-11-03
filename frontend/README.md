# Imobiliária Fogami — Front-end (Angular)

Trabalho final de Programação Web IV (IFFar, Campus Panambi). Front-end do sistema da imobiliária,
em **Angular 22**, consumindo a API REST em Spring Boot construída na disciplina
(pasta `../backend` deste repositório).

## Tecnologias

- Angular 22 (componentes standalone, signals, controle de fluxo `@if`/`@for`, sem zone.js)
- Reactive Forms para os formulários e validações
- HttpClient com interceptor para o JWT
- Chart.js para os gráficos do painel
- CSS próprio (sem framework), responsivo

## Como rodar

Veja o README na raiz do repositório (banco, backend e front-end).

Resumo do front-end, com a API já rodando em `http://localhost:8080`:

```bash
cd frontend
npm install
npm start
```

Abra `http://localhost:4200`. Precisa do Node.js 22.22 ou mais novo (ou 24+).
O endereço da API e o e-mail de contato da imobiliária ficam em `src/app/core/config.ts`.

## Usuários de teste

| E-mail | Senha | Perfil |
|---|---|---|
| admin.jwt@teste.com | Senha@123 | ADMIN |
| cliente.jwt@teste.com | Senha@123 | CLIENTE |
| cliente2.jwt@teste.com | Senha@123 | CLIENTE |

Também dá para criar uma conta de cliente pela tela "Cadastre-se".

## Funcionalidades

### Área pública
- **Vitrine** com cards (foto, tipo, bairro, cidade, valor e finalidade), **paginação**, **filtros** por bairro, tipo,
  finalidade e faixa de preço (combináveis) e **ordenação** por preço. Os filtros ficam na URL.
- **Detalhe do imóvel** com galeria de fotos e todas as informações.
- **Entrar em contato**: abre o e-mail com assunto e corpo já preenchidos (código, tipo, bairro e valor).
- **Login** com JWT, mensagens de validação e redirecionamento para a área inicial de cada perfil.

### Área do cliente
- **Fazer oferta** no detalhe do imóvel (só aparece em imóvel disponível).
- **Minhas ofertas** com a situação de cada uma (e cancelamento das pendentes).
- **Favoritos**: adiciona e remove pelo coração do card ou do detalhe; lista em "Favoritos".
- **Contratos**: lista os contratos enviados, baixa o PDF e assina.
- **Sair**: apaga o token.

### Área do admin
- **Painel** com totais (imóveis disponíveis, ofertas pendentes, contratos aguardando assinatura) e gráficos de imóveis
  por bairro, ofertas por situação e imóveis por finalidade.
- **CRUD** de imóveis, bairros, tipos de imóveis e fotos, sempre com confirmação antes de excluir.
- **Usuários**: cadastra, lista, busca por nome ou e-mail, edita, troca o perfil e exclui (o admin não pode excluir a si mesmo).
- **Ofertas**: lista todas, filtra por situação, aceita ou recusa.
- **Contratos**: lista, baixa o PDF, aprova e envia ao cliente (e-mail) ou recusa/cancela.

### Requisitos não funcionais
- Toda requisição autenticada envia `Authorization: Bearer <token>` (`core/auth.interceptor.ts`).
- Rotas protegidas por perfil (`core/guards.ts`): sem login vai para `/login`, perfil errado vai para `/acesso-negado`.
- Menu muda conforme o perfil logado (`layout/cabecalho.ts`).
- Formulários validam obrigatórios, e-mail e números antes de enviar.
- Toda tela que busca dados mostra "Carregando…", "Sem resultados" e uma mensagem de erro amigável (`shared/estado.ts`).
- Erros da API (`core/erros.ts`): 401 apaga o token e leva ao login; 403 mostra "Acesso negado"; 409 mostra a mensagem
  da regra de negócio que veio do backend; 404 mostra que o item não foi encontrado.
- Layout responsivo (menu recolhível, filtros recolhíveis, tabelas viram cartões no celular).

## Regras de negócio (aplicadas no backend e refletidas na tela)

1. Só imóveis disponíveis recebem ofertas; reservados, alugados ou vendidos não mostram "Fazer oferta".
2. Um cliente não pode ter duas ofertas pendentes para o mesmo imóvel (a API responde 409).
3. Um imóvel pode receber ofertas de vários clientes ao mesmo tempo.
4. Ao aceitar uma oferta, o imóvel fica **reservado**, as outras pendentes ficam **em espera** e o contrato é gerado.
5. Ao assinar o contrato, o imóvel fica **alugado** ou **vendido** (conforme o tipo da oferta) e as outras ofertas são recusadas.
6. Se o cliente desistir, o admin cancela o contrato e o imóvel volta a ficar **disponível**.

## Fluxo para a demonstração

1. Sem login, filtrar a vitrine e abrir um imóvel; clicar em "Entrar em contato".
2. Entrar como `cliente.jwt`, favoritar e fazer uma oferta. Entrar como `cliente2.jwt` e ofertar no mesmo imóvel.
3. Entrar como admin, aceitar a oferta do primeiro cliente (a do segundo fica em espera), baixar o PDF e aprovar o contrato.
4. Voltar como `cliente.jwt` e assinar em "Contratos": o imóvel fica alugado/vendido e some da vitrine.

## Estrutura

```
src/app/
  core/        autenticação, interceptor, guards, serviços da API, modelos, mensagens de erro
  shared/      componentes reutilizáveis (card, paginação, estados, badge, confirmação, toasts)
  layout/      cabeçalho com o menu por perfil
  pages/
    publico/   vitrine, detalhe, login, cadastro, 403 e 404
    cliente/   minhas ofertas, favoritos, contratos
    admin/     painel, imóveis, fotos, bairros, tipos, usuários, ofertas, contratos
```
