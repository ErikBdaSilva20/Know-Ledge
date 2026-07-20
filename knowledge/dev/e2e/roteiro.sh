#!/usr/bin/env bash
# Story 7.5 — roteiro de teste E2E do tenant-local, incl. casos negativos de
# zero-trust (doc/architecture/03-seguranca-zero-trust.md §6). Requer o
# stack de dev/docker-compose.yml no ar e o seed (dev/mock-gateway) rodado.
#
#   cd knowledge/dev && docker compose up -d && cd mock-gateway && npm run seed
#   cd ../e2e && ./roteiro.sh
#
# Se QUALQUER caso negativo passar com o resultado errado, a segurança está
# no lugar errado (front) — é bug crítico (P0), não um teste "flaky".
set -uo pipefail

GW="${GATEWAY_URL:-http://localhost:8787}"
TENANT="${TENANT_ID:-local-dev}"
WRONG_TENANT="some-other-tenant"
SEED_PASSWORD="password123"

# Fixed ids from dev/mock-gateway/src/seed.ts — keep in sync if the seed changes.
REP1_ID="seed-rep-1"
REP2_ID="seed-rep-2"
DOC_REP2_ID="a0000000-0000-4000-8000-000000000004"

pass=0
fail=0

check() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "PASS  $desc (got $actual)"
    pass=$((pass + 1))
  else
    echo "FAIL  $desc (expected $expected, got $actual)"
    fail=$((fail + 1))
  fi
}

login() {
  local email="$1" jar="$2"
  curl -s -o /dev/null -c "$jar" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$SEED_PASSWORD\"}" \
    "$GW/api/auth/sign-in/email"
}

REP1_JAR=$(mktemp)
REP2_JAR=$(mktemp)
MANAGER_JAR=$(mktemp)
trap 'rm -f "$REP1_JAR" "$REP2_JAR" "$MANAGER_JAR"' EXIT

login "rep1@seed.local" "$REP1_JAR"
login "rep2@seed.local" "$REP2_JAR"
login "manager@seed.local" "$MANAGER_JAR"

echo "== Fluxos felizes =="

status=$(curl -s -o /dev/null -w "%{http_code}" -b "$REP1_JAR" -H "X-Tenant-Id: $TENANT" \
  "$GW/data/documents")
check "rep1 lista os próprios documentos" 200 "$status"

status=$(curl -s -o /dev/null -w "%{http_code}" -b "$REP1_JAR" -H "X-Tenant-Id: $TENANT" \
  -H "Content-Type: application/json" -d '{"folder_id":null,"title":"Novo doc","content":""}' \
  "$GW/data/documents")
check "rep1 cria um documento" 201 "$status"

echo
echo "== Casos negativos de zero-trust (P0) =="

# §1 — owner_id injetado é ignorado
resp=$(curl -s -b "$REP1_JAR" -H "X-Tenant-Id: $TENANT" -H "Content-Type: application/json" \
  -d "{\"folder_id\":null,\"title\":\"x\",\"content\":\"\",\"owner_id\":\"$REP2_ID\"}" \
  "$GW/data/documents")
owner=$(echo "$resp" | grep -o '"owner_id":"[^"]*"' | cut -d'"' -f4)
check "owner_id injetado no create é ignorado (fica com o da sessão)" "$REP1_ID" "$owner"

# §3 — rep1 não recebe documentos de rep2 na lista
status=$(curl -s -b "$REP1_JAR" -H "X-Tenant-Id: $TENANT" "$GW/data/documents" | grep -c "$DOC_REP2_ID" || true)
check "rep1 não vê documento de rep2 em list" "0" "$status"

status=$(curl -s -b "$MANAGER_JAR" -H "X-Tenant-Id: $TENANT" "$GW/data/documents" | grep -c "$DOC_REP2_ID" || true)
check "manager vê documento de rep2 em list" "1" "$status"

# §4 — IDOR: rep1 tentando mexer no documento de rep2
status=$(curl -s -o /dev/null -w "%{http_code}" -b "$REP1_JAR" -H "X-Tenant-Id: $TENANT" \
  -X PATCH -H "Content-Type: application/json" -d '{"title":"hack"}' \
  "$GW/data/documents/$DOC_REP2_ID")
check "rep1 PATCH em documento de rep2 -> negado sem vazar existência" 404 "$status"

status=$(curl -s -o /dev/null -w "%{http_code}" -b "$REP1_JAR" -H "X-Tenant-Id: $TENANT" \
  -X DELETE "$GW/data/documents/$DOC_REP2_ID")
check "rep1 DELETE em documento de rep2 -> negado" 404 "$status"

# §5 — gate de escrita ownerless
status=$(curl -s -o /dev/null -w "%{http_code}" -b "$REP1_JAR" -H "X-Tenant-Id: $TENANT" \
  -H "Content-Type: application/json" -d '{"title":"x","content":"","source_document_id":null}' \
  "$GW/data/shared_documents")
check "rep1 POST em shared_documents -> 403" 403 "$status"

status=$(curl -s -o /dev/null -w "%{http_code}" -b "$MANAGER_JAR" -H "X-Tenant-Id: $TENANT" \
  -H "Content-Type: application/json" -d '{"title":"x","content":"","source_document_id":null}' \
  "$GW/data/shared_documents")
check "manager POST em shared_documents -> 201" 201 "$status"

# Story 4.1 — rota Publicar
status=$(curl -s -o /dev/null -w "%{http_code}" -b "$REP1_JAR" -H "X-Tenant-Id: $TENANT" \
  -H "Content-Type: application/json" -d '{"source_document_id":"'"$DOC_REP2_ID"'"}' \
  "$GW/shared/publish")
check "rep1 POST /shared/publish -> 403" 403 "$status"

status=$(curl -s -o /dev/null -w "%{http_code}" -b "$MANAGER_JAR" -H "X-Tenant-Id: $TENANT" \
  -H "Content-Type: application/json" -d '{"source_document_id":"'"$DOC_REP2_ID"'"}' \
  "$GW/shared/publish")
check "manager POST /shared/publish (cross-owner) -> 201" 201 "$status"

# Story 6.9 — tenant errado
status=$(curl -s -o /dev/null -w "%{http_code}" -b "$REP1_JAR" -H "X-Tenant-Id: $WRONG_TENANT" \
  "$GW/data/documents")
check "X-Tenant-Id errado -> 403" 403 "$status"

# Sem sessão nenhuma
status=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Tenant-Id: $TENANT" "$GW/data/documents")
check "sem cookie de sessão -> 401" 401 "$status"

echo
echo "Resultado: $pass passou, $fail falhou"
[ "$fail" -eq 0 ]
