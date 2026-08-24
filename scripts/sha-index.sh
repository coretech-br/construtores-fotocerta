#!/bin/sh
# O sha256 do index.html IGNORANDO as duas linhas do proprio carimbo.
# Sem essa exclusao o carimbo mudaria o hash a cada rodada e a conferencia
# nunca conseguiria dizer se o CONTEUDO mudou -- que e a unica coisa que ela
# precisa saber. Um arquivo, uma regra, usada pelos dois scripts.
set -eu
raiz=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
sed -e "s/^var FC_VERSAO='[^']*';.*/var FC_VERSAO=/" \
    -e "s/^var FC_PUBLICADO='[^']*';.*/var FC_PUBLICADO=/" "$raiz/index.html" \
  | { shasum -a 256 2>/dev/null || openssl dgst -sha256; } \
  | awk '{for(i=1;i<=NF;i++) if($i ~ /^[0-9a-f]{64}$/) print $i}'
