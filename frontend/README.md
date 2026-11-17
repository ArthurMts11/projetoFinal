# Imobiliária Fogami — Front-end (Angular)

Trabalho final de Programação Web IV (IFFar, Campus Panambi). Front-end do sistema da imobiliária,
em **Angular 22**, consumindo a API REST em Spring Boot construída na disciplina
(pasta `../backend` deste repositório).

## Tecnologias

- Angular 22 (componentes standalone, signals, controle de fluxo `@if`/`@for`, sem zone.js)
- Reactive Forms para os formulários e validações
- HttpClient com interceptor para o JWT
- Chart.js para os gráficos dos painéis
- Vitest (com jsdom) para os testes: `npm test`
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
| corretor.jwt@teste.com | Senha@123 | CORRETOR |

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

### Área do corretor
- **Painel** com o que espera por ele (ofertas pendentes, contratos para preparar, contratos em aprovação) e gráficos
  de ofertas e de contratos por situação.
- **Ofertas**: lista todas, filtra por situação, aceita ou recusa. Ao aceitar, o contrato é gerado em rascunho.
- **Contratos**: abas por etapa ("Para preparar", "Em aprovação", "Com o cliente", "Encerrados"). Cada contrato abre a
  tela de preparo, com a trilha de etapas, os dados do cliente e da oferta, o motivo da devolução (se houver) e o
  formulário de condições: valor final, prazo em meses (só no aluguel), dia de vencimento (1 a 28) e observações.
  "Salvar" regera o PDF; "Enviar para aprovação" salva e envia ao administrador.

### Área do admin
- **Painel** com totais (contratos em aprovação, aguardando assinatura, ofertas pendentes, imóveis disponíveis) e
  gráficos de imóveis por bairro, ofertas por situação, contratos por situação e imóveis por finalidade.
- **CRUD** de imóveis, bairros, tipos de imóveis e fotos, sempre com confirmação antes de excluir.
- **Usuários**: cadastra, lista, busca por nome ou e-mail, edita (inclusive o perfil: cliente, corretor ou admin) e
  exclui (o admin não pode excluir a si mesmo nem trocar o próprio perfil).
- **Ofertas**: consulta todas e filtra por situação (quem responde é o corretor).
- **Contratos**: abre em "Em aprovação"; mostra as condições preparadas e o corretor; baixa o PDF, aprova (o cliente
  recebe e-mail), devolve ao corretor com um motivo ou cancela (menos os assinados).

### Requisitos não funcionais
- Toda requisição autenticada envia `Authorization: Bearer <token>` (`core/auth.interceptor.ts`).
- Rotas protegidas por perfil (`core/guards.ts`): sem login vai para `/login`, perfil errado vai para `/acesso-negado`.
- Menu muda conforme o perfil logado (`layout/cabecalho.ts`).
- Testes (`npm test`) cobrem os estados de carregando/vazio/erro, as mensagens de erro da API, o interceptor, os guards
  e as telas de contrato do corretor e do admin.
- Formulários validam obrigatórios, e-mail e números antes de enviar.
- Toda tela que busca dados mostra "Carregando…", "Sem resultados" e uma mensagem de erro amigável (`shared/estado.ts`).
- Erros da API (`core/erros.ts`): 401 apaga o token e leva ao login; 403 mostra "Acesso negado"; 409 mostra a mensagem
  da regra de negócio que veio do backend; 404 mostra que o item não foi encontrado.
- Layout responsivo (menu recolhível, filtros recolhíveis, tabelas viram cartões no celular).

## Regras de negócio (aplicadas no backend e refletidas na tela)

1. Só imóveis disponíveis recebem ofertas; reservados, alugados ou vendidos não mostram "Fazer oferta".
2. Um cliente não pode ter duas ofertas pendentes para o mesmo imóvel (a API responde 409).
3. Um imóvel pode receber ofertas de vários clientes ao mesmo tempo.
4. Só o corretor aceita ofertas. Ao aceitar, o imóvel fica **reservado**, as outras pendentes ficam **em espera** e o
   contrato é gerado em **rascunho**.
5. O corretor só altera o contrato em rascunho ou devolvido; no aluguel o prazo é obrigatório.
6. Só o admin aprova ou devolve, e só contratos **em aprovação**. Devolver exige um motivo.
7. O cliente só vê o contrato depois de aprovado. Ao assinar, o imóvel fica **alugado** ou **vendido** e as outras
   ofertas são recusadas.
8. Se o cliente desistir, o admin cancela o contrato e o imóvel volta a ficar **disponível**. Contrato assinado não é
   cancelado.

## Fluxo para a demonstração (checkpoint)

1. Sem login, filtrar a vitrine e abrir um imóvel; clicar em "Entrar em contato".
2. Entrar como `cliente.jwt`, favoritar e fazer uma oferta. Entrar como `cliente2.jwt` e ofertar no mesmo imóvel.
3. Entrar como `corretor.jwt`, aceitar a oferta do primeiro cliente (a do segundo fica em espera), ajustar o valor
   final e o prazo, ver o PDF e enviar para aprovação.
4. Entrar como admin: em "Contratos", devolver com um motivo. Voltar como corretor, corrigir e reenviar.
   Como admin, aprovar.
5. Voltar como `cliente.jwt` e assinar em "Contratos": o imóvel fica alugado/vendido e some da vitrine.

## Estrutura

```
src/app/
  core/        autenticação, interceptor, guards, serviços da API, modelos, mensagens de erro
  shared/      componentes reutilizáveis (card, paginação, estados, badge, confirmação, toasts)
  layout/      cabeçalho com o menu por perfil
  pages/
    publico/   vitrine, detalhe, login, cadastro, 403 e 404
    cliente/   minhas ofertas, favoritos, contratos
    corretor/  painel, contratos, preparo do contrato (as ofertas reaproveitam a tela do admin)
    admin/     painel, imóveis, fotos, bairros, tipos, usuários, ofertas, contratos
src/testing/   dados e tokens falsos usados nos testes (*.spec.ts ao lado de cada arquivo)
```
