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
# O index.html entrou na mesma disciplina em 24/08/2026, quando ele passou a
# CARIMBAR na tela a versao e a hora da publicacao. O hash dele e calculado
# IGNORANDO as duas linhas do proprio carimbo (scripts/sha-index.sh), senao o
# carimbo mudaria o hash sozinho e a conferencia nunca saberia se o CONTEUDO
# mudou. Quem troca a versao dele e scripts/carimbar-publicacao.sh -- aqui so
# se confere que ela foi trocada.
#
# ALEM DISSO, desde 14/09/2026 ele confere se a VERSAO CARIMBADA TEM RELEASE NOTE.
# Regra do dono, nas palavras dele: "sempre que alterar algo no projeto, seja
# melhoria, seja correcao, o release notes tem que SEMPRE ser atualizado". Isso
# deixou de ser lembranca e virou contrato -- e contrato sem guarda e o defeito
# de amanha (a Tag Body da pagina de obrigado nasceu fora do painel consolidado
# exatamente assim, em silencio).
#
# ESTE e o momento certo de cobrar: carimbar-publicacao.sh escolhe a versao nova
# e chama este script em seguida, entao o "esqueci de escrever a nota" para AQUI,
# antes do commit que vai ao ar -- e nao depois, no navegador do dono. A cobranca
# e um grep pela chave da entrada dentro de FCR_NOTAS, sem Node e sem navegador,
# como o resto deste arquivo.
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
v_index=$(sed -n "s/^var FC_VERSAO='\([^']*\)';.*/\1/p" "$raiz/index.html" | head -1)

if [ "$registrar" = "1" ]; then
  {
    echo "# Gerado por scripts/conferir-versoes.sh --registrar. Uma linha por arquivo servido"
    echo "# com ?v=: <arquivo>  <versao declarada>  <sha256 do conteudo>."
    echo "fc-compartilhado.js  $v_arquivo  $(sha "$raiz/fc-compartilhado.js")"
    echo "cobrar/manifest.json  $v_manifesto  $(sha "$raiz/cobrar/manifest.json")"
    echo "index.html  $v_index  $(sh "$raiz/scripts/sha-index.sh")"
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
    case "$arq" in
      index.html) atual=$(sh "$raiz/scripts/sha-index.sh");;
      *)          atual=$(sha "$raiz/$arq");;
    esac
    case "$arq" in
      fc-compartilhado.js)  decl="$v_arquivo";;
      cobrar/manifest.json) decl="$v_manifesto";;
      index.html)           decl="$v_index";;
      *)                    decl="$ver";;
    esac
    if [ "$atual" != "$hash" ] && [ "$decl" = "$ver" ]; then
      if [ "$arq" = "index.html" ]; then
        erro "index.html MUDOU e a versao continua \"$ver\". Rode: scripts/carimbar-publicacao.sh. Sem isso a pagina publicada anuncia na tela uma versao e uma hora que nao sao as dela."
      else
        erro "$arq MUDOU e a versao continua \"$ver\". Troque a versao (e o ?v= de quem o carrega) e rode --registrar. Sem isso o navegador segue servindo a copia velha, sem aviso nenhum."
      fi
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

# ---- 3. a versao carimbada tem release note? (regra do dono, 14/09/2026) ----
# A entrada mora em FCR_NOTAS, no index.html, na forma {v:"AAAA-MM-DDx",...}. Uma
# ocorrencia, exatamente: zero e a nota que ninguem escreveu; duas e a mesma versao
# descrita em dois lugares, que o painel desenharia repetida.
# CONTA OCORRENCIAS, NAO LINHAS. 'grep -c' devolve o numero de LINHAS que casam, e as
# entradas de FCR_NOTAS sao uma por linha -- entao duas entradas da MESMA versao escritas
# na mesma linha contavam 1 e passavam. Medido em 14/09/2026: a propria prova que existe
# para cobrar isto (novidades.mjs, cenario "a mesma versao descrita duas vezes") estava
# vermelha desde que nasceu, e vermelho permanente esconde o proximo que seria de verdade.
n=$(grep -o "{v:\"$v_index\"," "$raiz/index.html" | wc -l | tr -d " ")
if [ "$n" = "0" ]; then
  erro "a versao \"$v_index\" esta carimbada e NAO tem release note. Acrescente a entrada no topo de FCR_NOTAS, no index.html -- o comentario \"COMO ENTRA A PROXIMA VERSAO\", logo acima da lista, diz a forma. Desde 14/09/2026 toda alteracao publicada entra la."
elif [ "$n" != "1" ]; then
  erro "a versao \"$v_index\" aparece $n vezes em FCR_NOTAS (index.html). Deveria aparecer uma so -- duas entradas fazem o painel mostrar a mesma versao duas vezes."
fi

# ---- 4. a versao carimbada tem linha no ledger? (regra de 16/09/2026) ----
# O ledger de agosto parou em 24/08 e ninguem notou por 22 dias -- 57 versoes sem historico.
# Reabri-lo sem rede so adiaria a mesma morte. A conferencia e a mesma da release note, e
# pelo mesmo motivo: compromisso que depende de alguem lembrar ja falhou aqui.
# O ledger CORRENTE e o de maior sufixo em docs/ledger-evolucao-*.md -- assim abrir um volume
# novo nao exige mexer neste script, e um volume fechado nao passa a ser cobrado para sempre.
ledger=$(ls "$raiz"/docs/ledger-evolucao-*.md 2>/dev/null | sort | tail -1)
if [ -z "$ledger" ]; then
  erro "nao achei nenhum docs/ledger-evolucao-*.md -- o historico das rodadas nao existe."
else
  n=$(grep -o "$v_index" "$ledger" | wc -l | tr -d " ")
  if [ "$n" = "0" ]; then
    erro "a versao \"$v_index\" esta carimbada e NAO tem linha no ledger ($(basename "$ledger")). Acrescente a rodada la -- o que ela entregou, o que ensinou sobre metodo, e a tabela de estimativa e tempo real (relogio, marcado no inicio e no fim). Desde 16/09/2026 toda rodada publicada escreve a linha dela."
  fi
fi

if [ -n "$falhas" ]; then
  echo "CONFERENCIA DE VERSOES: FALHOU$falhas"
  exit 1
fi
echo "CONFERENCIA DE VERSOES: OK  (fc-compartilhado.js=$v_arquivo, cobrar/manifest.json=$v_manifesto, index.html=$v_index)"
