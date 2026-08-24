#!/bin/sh
# ============================================================================
# CARIMBA A VERSAO E A HORA DE PUBLICACAO NO index.html
# ============================================================================
# POR QUE ELE EXISTE. A ferramenta mostra, logo abaixo do titulo, qual versao o
# navegador esta executando e quando ela foi publicada. Esse carimbo so vale se
# for escrito SEMPRE, e sempre do mesmo jeito -- carimbo escrito a mao envelhece
# calado, que e exatamente o defeito que ele deveria denunciar.
#
# QUANDO RODAR: uma vez, logo antes do commit que vai para o ar. Depois dele,
# commit e push -- o GitHub Pages publica sozinho em seguida.
#
#     scripts/carimbar-publicacao.sh
#
# O QUE ELE FAZ:
#   1. escolhe a versao: AAAA-MM-DD + letra. Data diferente da que esta la
#      dentro -> comeca em "a"; mesma data -> avanca a letra (a, b, c...).
#   2. escreve FC_VERSAO e FC_PUBLICADO (America/Sao_Paulo) no index.html.
#   3. re-registra SO a linha do index.html em scripts/versoes.txt -- as linhas
#      dos outros arquivos ficam intocadas, porque abenco-las aqui furaria a
#      disciplina delas.
#   4. roda scripts/conferir-versoes.sh inteiro e devolve o codigo dele.
#
# --data "AAAA-MM-DD HH:MM" forca um instante (usado só para conferir o script).
# ============================================================================
set -eu

raiz=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
alvo="$raiz/index.html"
reg="$raiz/scripts/versoes.txt"

agora=$(TZ=America/Sao_Paulo date '+%Y-%m-%d %H:%M')
if [ "${1:-}" = "--data" ]; then agora="${2:?--data precisa do instante}"; fi
hoje=$(echo "$agora" | cut -d' ' -f1)

atual=$(sed -n "s/^var FC_VERSAO='\([^']*\)';.*/\1/p" "$alvo" | head -1)
[ -n "$atual" ] || { echo "carimbar: nao achei FC_VERSAO em index.html"; exit 1; }

dia_atual=$(echo "$atual" | cut -c1-10)
letra=$(echo "$atual" | cut -c11-)
[ -n "$letra" ] || letra=a
if [ "$dia_atual" = "$hoje" ]; then
  # avanca a letra: a->b, b->c ... Sem tabela: usa o codigo ASCII.
  n=$(printf '%d' "'$letra")
  letra=$(awk -v n="$((n+1))" 'BEGIN{printf "%c", n}')
else
  letra=a
fi
nova="$hoje$letra"

# sed -i portatil (o do Mac exige o sufixo; o do GNU nao aceita sufixo vazio junto)
tmp=$(mktemp)
sed -e "s/^var FC_VERSAO='[^']*';/var FC_VERSAO='$nova';/" \
    -e "s/^var FC_PUBLICADO='[^']*';/var FC_PUBLICADO='$agora';/" "$alvo" > "$tmp"
mv "$tmp" "$alvo"

confere=$(sed -n "s/^var FC_VERSAO='\([^']*\)';.*/\1/p" "$alvo" | head -1)
[ "$confere" = "$nova" ] || { echo "carimbar: a troca nao pegou (li \"$confere\")"; exit 1; }

# ---- re-registra so a linha do index.html ----
h=$(sh "$raiz/scripts/sha-index.sh")
if [ -f "$reg" ]; then
  tmp=$(mktemp)
  grep -v '^index\.html ' "$reg" > "$tmp" || true
  echo "index.html  $nova  $h" >> "$tmp"
  mv "$tmp" "$reg"
fi

echo "Carimbado: versao $nova, publicada em $agora (America/Sao_Paulo)."
exec sh "$raiz/scripts/conferir-versoes.sh"
