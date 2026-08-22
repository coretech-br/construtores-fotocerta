#!/bin/sh
# ============================================================================
# CONFERE AS VERSOES DOS ARQUIVOS SERVIDOS COM ?v=
# ============================================================================
# POR QUE ELE EXISTE. As duas paginas ja conferem, ao carregar, se a versao do
# fc-compartilhado.js que chegou e a que elas pediram -- mas essa guarda e CEGA
# POR CONSTRUCAO: quem declara a versao e o proprio arquivo cuja atualidade esta
# em duvida. Se o arquivo muda e a versao NAO muda, o endereco continua o mesmo,
# o navegador continua servindo a copia velha (com 'immutable', por muito tempo)
# e a copia velha se apresenta com a versao certa. Medido: trocando ':' por ';'
# dentro de seloDe sem tocar na versao, o arquivo em cache selava D57C e o
# arquivo novo selava 625D -- dois selos diferentes para a mesma cobranca -- e
# nenhuma das duas paginas avisou nada.
#
# E o "so atrasa a publicacao" nao vale nem no caso simples: ele so descreveria
# UM navegador. Os outros dois participantes do contrato ficam de fora -- o
# OUTRO APARELHO do dono, que pode ter a copia nova enquanto este tem a velha, e
# o BLOCO JA COLADO na /pagar, que nao e versionado e vai conferir o selo do
# jeito que estava no dia em que foi colado.
#
# COMO ELE CONFERE. scripts/versoes.txt guarda uma linha por arquivo versionado:
#
#     <caminho do arquivo>  <versao declarada>  <sha256 do conteudo>
#
# O script recalcula o sha256 e recusa quando o conteudo mudou sem a versao
# mudar junto. Depois de trocar a versao de verdade, rode:
#
#     scripts/conferir-versoes.sh --registrar
#
# que reescreve versoes.txt com o que esta no disco (o commit mostra a troca).
#
# ALEM DO HASH, ele confere a COERENCIA das declaracoes espalhadas:
#   fc-compartilhado.js  FC_COMPART_VERSAO
#                        ?v= do <script> em index.html e em cobrar/index.html
#                        FC_COMPART_ESPERADA nas duas paginas
#   cobrar/manifest.json ?v= do <link rel="manifest"> em cobrar/index.html
#                        (o quarto lugar de versao do projeto, que estava fora
#                         de qualquer disciplina)
#
# Saida: "OK" e codigo 0, ou a lista do que nao bate e codigo 1.
# sh puro, sem dependencia -- roda no Mac do dono e em qualquer CI.
# ============================================================================
set -eu

raiz=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
reg="$raiz/scripts/versoes.txt"
registrar=0
[ "${1:-}" = "--registrar" ] && registrar=1

sha() { shasum -a 256 "$1" 2>/dev/null | cut -d' ' -f1 || openssl dgst -sha256 "$1" | awk '{print $NF}'; }

# ---- as versoes declaradas, lidas de onde elas moram ----
v_arquivo=$(sed -n "s/.*FC_COMPART_VERSAO='\([^']*\)'.*/\1/p" "$raiz/fc-compartilhado.js" | head -1)
v_manifesto=$(sed -n 's/.*rel="manifest" href="manifest\.json?v=\([^"]*\)".*/\1/p' "$raiz/cobrar/index.html" | head -1)

if [ "$registrar" = "1" ]; then
  {
    echo "# Gerado por scripts/conferir-versoes.sh --registrar. Uma linha por arquivo servido"
    echo "# com ?v=: <arquivo>  <versao declarada>  <sha256 do conteudo>."
    echo "fc-compartilhado.js  $v_arquivo  $(sha "$raiz/fc-compartilhado.js")"
    echo "cobrar/manifest.json  $v_manifesto  $(sha "$raiz/cobrar/manifest.json")"
  } > "$reg"
  echo "Registrado em scripts/versoes.txt:"
  grep -v '^#' "$reg"
  exit 0
fi

falhas=""
erro() { falhas="$falhas
  - $1"; }

# ---- 1. o conteudo bate com a versao registrada? ----
if [ ! -f "$reg" ]; then
  erro "scripts/versoes.txt nao existe. Rode: scripts/conferir-versoes.sh --registrar"
else
  while read -r arq ver hash; do
    case "$arq" in ''|'#'*) continue;; esac
    atual=$(sha "$raiz/$arq")
    case "$arq" in
      fc-compartilhado.js) decl="$v_arquivo";;
      cobrar/manifest.json) decl="$v_manifesto";;
      *) decl="$ver";;
    esac
    if [ "$atual" != "$hash" ] && [ "$decl" = "$ver" ]; then
      erro "$arq MUDOU e a versao continua \"$ver\". Troque a versao (e o ?v= de quem o carrega) e rode --registrar. Sem isso o navegador segue servindo a copia velha, sem aviso nenhum."
    fi
    if [ "$atual" = "$hash" ] && [ "$decl" != "$ver" ]; then
      erro "$arq esta com a versao \"$decl\" mas o conteudo e o mesmo da versao \"$ver\". Ou faltou --registrar, ou a versao foi trocada a toa."
    fi
  done < "$reg"
fi

# ---- 2. as declaracoes espalhadas concordam entre si? ----
confere() {
  achado=$(sed -n "s/.*$2.*/&/p" "$raiz/$1" | grep -c "$3" || true)
  [ "$achado" = "1" ] || erro "$1: esperava exatamente 1 ocorrencia de \"$3\" ($4), achei $achado."
}
for pag in index.html cobrar/index.html; do
  n=$(grep -c "fc-compartilhado\.js?v=$v_arquivo" "$raiz/$pag" || true)
  [ "$n" = "1" ] || erro "$pag: o <script> deveria pedir fc-compartilhado.js?v=$v_arquivo (achei $n ocorrencia(s))."
  n=$(grep -c "FC_COMPART_ESPERADA='$v_arquivo'" "$raiz/$pag" || true)
  [ "$n" = "1" ] || erro "$pag: FC_COMPART_ESPERADA deveria ser '$v_arquivo' (achei $n ocorrencia(s))."
done
n=$(grep -c "manifest\.json?v=$v_manifesto" "$raiz/cobrar/index.html" || true)
[ "$n" = "1" ] || erro "cobrar/index.html: o <link rel=manifest> deveria pedir manifest.json?v=$v_manifesto (achei $n)."

if [ -n "$falhas" ]; then
  echo "CONFERENCIA DE VERSOES: FALHOU$falhas"
  exit 1
fi
echo "CONFERENCIA DE VERSOES: OK  (fc-compartilhado.js=$v_arquivo, cobrar/manifest.json=$v_manifesto)"
