#!/bin/bash
# Testa as regras de segurança da API (401, 403 e 200) com curl.
# Uso: com a API rodando em http://localhost:8080, rode ./testar-seguranca.sh
# O resultado também é salvo em resultado-testes-seguranca.txt

API=${API:-http://localhost:8080}
SAIDA="$(dirname "$0")/resultado-testes-seguranca.txt"
OK=0; FALHA=0

token() {
  curl -s -X POST "$API/public/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"senha\":\"Senha@123\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}

# testa <descrição> <status esperado> <método> <rota> [token] [corpo]
testa() {
  local args=(-s -o /dev/null -w '%{http_code}' -X "$3" "$API$4")
  [ -n "$5" ] && args+=(-H "Authorization: Bearer $5")
  [ -n "$6" ] && args+=(-H 'Content-Type: application/json' -d "$6")
  local obtido
  obtido=$(curl "${args[@]}")
  if [ "$obtido" = "$2" ]; then OK=$((OK+1)); r="OK   "; else FALHA=$((FALHA+1)); r="FALHA"; fi
  printf '%s  esperado %s, veio %s  %-6s %-28s %s\n' "$r" "$2" "$obtido" "$3" "$4" "$1"
}

{
echo "Testes de segurança da API - $(date '+%d/%m/%Y %H:%M')"
echo "API: $API"
echo

ADMIN=$(token admin.jwt@teste.com)
CLIENTE=$(token cliente.jwt@teste.com)
[ -z "$ADMIN" ] && echo "ATENÇÃO: login do admin falhou (a API está rodando? o banco/pw4.sql foi importado?)"
[ -z "$CLIENTE" ] && echo "ATENÇÃO: login do cliente falhou"

echo "--- Rotas públicas (200 sem token) ---"
testa "Listar imóveis" 200 GET /imoveis
testa "Vitrine paginada" 200 GET "/imoveis/buscar?status=DISPONIVEL&size=3"
testa "Listar bairros" 200 GET /bairros
testa "Login com senha errada" 401 POST /public/login "" '{"email":"admin.jwt@teste.com","senha":"errada"}'

echo "--- 401: sem token ou token inválido ---"
testa "Usuários sem token" 401 GET /api/usuarios
testa "Usuários com token inválido" 401 GET /api/usuarios "token.invalido.123"
testa "Cadastrar imóvel sem token" 401 POST /imoveis "" '{"titulo":"Casa"}'
testa "Minhas ofertas sem token" 401 GET /ofertas/minhas
testa "Favoritos sem token" 401 GET /favoritos
testa "Painel sem token" 401 GET /dashboard

echo "--- 403: token válido, perfil sem permissão ---"
testa "Cliente lista usuários" 403 GET /api/usuarios "$CLIENTE"
testa "Cliente cadastra imóvel" 403 POST /imoveis "$CLIENTE" '{"titulo":"Casa"}'
testa "Cliente remove imóvel" 403 DELETE /imoveis/999999 "$CLIENTE"
testa "Cliente vê o painel" 403 GET /dashboard "$CLIENTE"
testa "Cliente lista todas as ofertas" 403 GET /ofertas "$CLIENTE"
testa "Cliente aceita oferta" 403 PATCH /ofertas/1/aceitar "$CLIENTE"
testa "Admin faz oferta" 403 POST /ofertas "$ADMIN" '{"imovelId":1,"tipo":"VENDA","valorProposto":1}'
testa "Admin acessa favoritos" 403 GET /favoritos "$ADMIN"

echo "--- 200: perfil certo ---"
testa "Admin lista usuários" 200 GET /api/usuarios "$ADMIN"
testa "Admin vê o painel" 200 GET /dashboard "$ADMIN"
testa "Admin lista ofertas" 200 GET /ofertas "$ADMIN"
testa "Admin lista contratos" 200 GET /contratos "$ADMIN"
testa "Cliente vê suas ofertas" 200 GET /ofertas/minhas "$CLIENTE"
testa "Cliente vê seus favoritos" 200 GET /favoritos "$CLIENTE"
testa "Cliente vê seus contratos" 200 GET /contratos/meus "$CLIENTE"

echo "--- CORS para o front Angular ---"
cors=$(curl -s -o /dev/null -D - -X OPTIONS "$API/imoveis" -H 'Origin: http://localhost:4200' \
  -H 'Access-Control-Request-Method: GET' | grep -i 'access-control-allow-origin' | tr -d '\r')
if [ -n "$cors" ]; then OK=$((OK+1)); echo "OK     $cors"; else FALHA=$((FALHA+1)); echo "FALHA  sem Access-Control-Allow-Origin"; fi

echo
echo "Resultado: $OK ok, $FALHA falha(s)"
} | tee "$SAIDA"
