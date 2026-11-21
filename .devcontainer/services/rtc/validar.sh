#!/usr/bin/env bash
set -euo pipefail

rtc_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
compose=(docker compose -f "$rtc_dir/../../docker-compose.yml")
services=(rtc-regime-regular rtc-simples-nacional rtc-danfse)
case "${1:-}" in
  '') ;;
  --recriar) ;;
  rtc-regime-regular|rtc-simples-nacional|rtc-danfse) services=("$1") ;;
  *) echo "Uso: $0 [--recriar|rtc-regime-regular|rtc-simples-nacional|rtc-danfse]" >&2; exit 2 ;;
esac

tmp=$(mktemp -d)
trap 'rm -rf -- "$tmp"' EXIT
curl_opts=(-fsSL --max-time 30)

get() {
  local origem=$1 url=$2
  if [[ $origem == host ]]; then
    curl "${curl_opts[@]}" "$url"
  else
    "${compose[@]}" exec -T app curl "${curl_opts[@]}" "$url"
  fi
}

verificar() {
  local servico=$1 origem=$2 base variavel rota swagger
  case "$servico" in
    rtc-regime-regular)
      if [[ $origem == host ]]; then
        base=http://$("${compose[@]}" port "$servico" 8080)
      fi
      variavel=RTC_REGIME_REGULAR_URL
      rota=/api/calculadora/dados-abertos/ufs
      swagger=/api/swagger-ui.html
      ;;
    rtc-simples-nacional)
      base=http://127.0.0.1:8082
      variavel=RTC_SIMPLES_NACIONAL_URL
      rota='/api/calculadora/simples-nacional/atividades?data=2027-01-01'
      swagger=/api/swagger-ui.html
      ;;
    rtc-danfse)
      base=http://127.0.0.1:8083
      variavel=RTC_DANFSE_URL
      swagger=/api/swagger-ui/index.html
      ;;
  esac

  if [[ $origem == app ]]; then
    base=$("${compose[@]}" exec -T app printenv "$variavel")
    base=${base%/api}
  fi

  get "$origem" "$base$swagger" > "$tmp/swagger.html"
  grep -qi 'Swagger UI' "$tmp/swagger.html"
  if [[ $servico == rtc-danfse ]]; then
    get "$origem" "$base/health/ready" > /dev/null
    local post=(curl "${curl_opts[@]}" -i -H 'Content-Type: application/xml' --data-binary @- "$base/api/danfse")
    if [[ $origem == app ]]; then
      post=("${compose[@]}" exec -T app "${post[@]}")
    fi
    "${post[@]}" < "$rtc_dir/exemplo-nfse.xml" > "$tmp/resposta"
    python3 -c 'import sys; headers, pdf = sys.stdin.buffer.read().split(b"\r\n\r\n", 1); assert b"content-type: application/pdf" in headers.lower() and pdf.startswith(b"%PDF-") and pdf.rstrip().endswith(b"%%EOF")' < "$tmp/resposta"
  else
    get "$origem" "$base$rota" | python3 -c 'import json, sys; dados = json.load(sys.stdin); assert isinstance(dados, list) and dados, dados'
  fi
  printf '%s via %s OK\n' "$servico" "$origem"
}

bancos() {
  local servico
  for servico in rtc-regime-regular rtc-simples-nacional; do
    "${compose[@]}" exec -T "$servico" sha256sum /app/calculadora/db/calculadora-pro.db
  done
}

for servico in "${services[@]}"; do
  id=$("${compose[@]}" ps -q "$servico")
  if [[ -z $id || $(docker inspect --format '{{.State.Health.Status}}' "$id") != healthy ]]; then
    echo "$servico precisa estar healthy" >&2
    exit 1
  fi
  verificar "$servico" host
  verificar "$servico" app
done

if [[ ${1:-} == --recriar ]]; then
  bancos > "$tmp/bancos-antes"
  "${compose[@]}" up -d --wait --wait-timeout 180 --no-deps --no-build --force-recreate "${services[@]}"
  bancos > "$tmp/bancos-depois"
  diff -u "$tmp/bancos-antes" "$tmp/bancos-depois"
  for servico in "${services[@]}"; do
    verificar "$servico" host
    verificar "$servico" app
  done
fi
