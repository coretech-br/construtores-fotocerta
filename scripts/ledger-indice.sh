#!/bin/sh
# ============================================================================
# REGENERA O INDICE DO LEDGER CORRENTE, a partir dos proprios titulos.
# ============================================================================
# POR QUE ELE EXISTE. O ledger passou de 55 rodadas e 1.200 linhas. Sem indice,
# a pergunta "quando entrou o sinal?" custa rolar o arquivo inteiro -- e arquivo
# que custa consultar deixa de ser consultado, que e como o volume de agosto
# morreu sem ninguem notar por 22 dias.
#
# POR QUE ELE E GERADO, E NAO ESCRITO A MAO. Indice escrito a mao e uma segunda
# lista: concorda hoje e diverge amanha, sem erro e sem aviso -- o defeito que
# este projeto passou o mes eliminando (FCR_ACOES, FC_PAG_PREFS, as tres listas
# de prefixo). Aqui ele sai dos titulos, que sao a fonte.
#
# ROTEIRO: sh scripts/ledger-indice.sh             regenera
#          sh scripts/ledger-indice.sh --conferir  so diz se esta atual
# ============================================================================
set -u
raiz=$(cd "$(dirname "$0")/.." && pwd)
alvo=$(ls "$raiz"/docs/ledger-evolucao-*.md 2>/dev/null | sort | tail -1)
[ -n "$alvo" ] || { echo "ledger-indice: nao achei docs/ledger-evolucao-*.md"; exit 1; }

INI='<!-- INDICE GERADO -- nao edite a mao: sh scripts/ledger-indice.sh -->'
FIM='<!-- FIM DO INDICE GERADO -->'
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# --- o indice, a partir dos titulos "### N. Titulo — DD/MM/AAAA" ---
{
  printf '%s\n\n## Índice\n\n' "$INI"
  printf '> Gerado por `sh scripts/ledger-indice.sh`. Uma linha por rodada, na ordem em que saíram.\n\n'
  awk '
    /^### [0-9]+\./ {
      if (guardado != "") print "- **" guardado "**" (guardadaV != "" ? " · `" guardadaV "`" : "")
      guardado = substr($0, 5); guardadaV = ""; next
    }
    guardado != "" && guardadaV == "" && /Vers(ã|a)o `/ {
      v = $0; sub(/^.*Vers(ã|a)o `/, "", v); sub(/`.*$/, "", v); guardadaV = v; next
    }
    END { if (guardado != "") print "- **" guardado "**" (guardadaV != "" ? " · `" guardadaV "`" : "") }
  ' "$alvo"
  printf '\n%s\n' "$FIM"
} > "$tmp/novo"

# --- o que esta la hoje ---
awk -v i="$INI" -v f="$FIM" 'index($0,i){p=1} p{print} index($0,f){p=0}' "$alvo" > "$tmp/atual"

if [ "${1:-}" = "--conferir" ]; then
  if cmp -s "$tmp/atual" "$tmp/novo"; then
    echo "INDICE DO LEDGER: atual ($(basename "$alvo"), $(grep -c '^- ' "$tmp/novo") rodadas)"; exit 0
  fi
  echo "INDICE DO LEDGER: DESATUALIZADO em $(basename "$alvo") -- rode 'sh scripts/ledger-indice.sh'"; exit 1
fi

if [ -s "$tmp/atual" ]; then
  awk -v i="$INI" -v f="$FIM" -v arq="$tmp/novo" '
    index($0,i){ while((getline l < arq) > 0) print l; close(arq); pulando=1; next }
    pulando && index($0,f){ pulando=0; next }
    !pulando{ print }
  ' "$alvo" > "$tmp/saida"
else
  awk -v arq="$tmp/novo" '
    { print }
    !posto && /^## Como o tempo foi medido$/ { print ""; while((getline l < arq) > 0) print l; close(arq); posto=1 }
  ' "$alvo" > "$tmp/saida"
fi
cp "$tmp/saida" "$alvo"
echo "INDICE DO LEDGER: regenerado em $(basename "$alvo") ($(grep -c '^- ' "$tmp/novo") rodadas)"
