#!/bin/sh
# ============================================================================
# A BATERIA DE VERIFICACAO, PARTIDA EM DUAS
# ============================================================================
# POR QUE ELA FOI PARTIDA. Rodar TODOS os arquivos deste diretorio leva por
# volta de 50 minutos -- MEDIDO em 16/09/2026, em duas passagens independentes
# do mesmo dia (50m05s e 51m00s), com a maquina rodando uma bateria por vez.
# Bateria que custa isso deixa de ser rodada, e bateria que nao roda nao mede
# nada -- e o mesmo defeito que este projeto ja conhece de outro lado: vermelho que e
# sempre vermelho esconde o proximo, e suite que ninguem roda esconde todos.
#
#   scripts/verificar/bateria.sh curta      # rede externa FECHADA
#   scripts/verificar/bateria.sh com-rede   # as que falam com a internet
#   scripts/verificar/bateria.sh tudo       # as duas, em sequencia
#   scripts/verificar/bateria.sh --listar   # so imprime as listas
#
# O CRITERIO QUE SEPARA AS DUAS, e ele e mecanico e nao de impressao: vai para
# a bateria COM REDE o arquivo que declara host em `permitir:` na chamada de
# `comBlocoNaPagina` -- ou seja, o que abre a rede externa DE PROPOSITO. Todo o
# resto roda com `pagina.mjs` abortando toda requisicao que nao seja do proprio
# servidor, entao nao depende da internet para nada.
#
# A LISTA MORA AQUI, EM UM LUGAR SO (a funcao `lista` logo abaixo). Este projeto
# tem historico de lista escrita duas vezes que diverge em silencio -- foi assim
# com `FC_PAG_PREFS`, com os prefixos e com o indice do ledger. Por isso, alem de
# a lista ser unica, `conferir` a compara com o DIRETORIO e com o proprio codigo
# dos arquivos, nos tres sentidos:
#   1. arquivo .mjs que nao esta na lista nem na lista de bibliotecas -- suite
#      nova entraria em silencio e nunca seria rodada;
#   2. arquivo na bateria curta que declara `permitir:` -- passou a abrir rede e
#      esta na lista errada;
#   3. arquivo na bateria com rede que NAO declara `permitir:` -- deixou de
#      abrir rede e esta segurando 30 minutos a toa.
# A conferencia nao conserta nada; ela faz o buraco aparecer, como `fccOrfas`.
#
# CODIGO DE SAIDA: 0 so quando TODAS as suites da lista escolhida passam. Uma
# falha qualquer = falha da bateria. Verde falso e pior que vermelho.
#
# Precisa de Node e Playwright -- ver lib.mjs, que diz o que instalar se faltar.
# ============================================================================
set -u

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

# ----------------------------------------------------------------------------
# A LISTA. Uma linha por suite: <bateria>|<arquivo>
# `curta` = rede externa fechada. `rede` = abre a internet de proposito.
# O executor sai da extensao: .sh roda com sh, .mjs com node. Nenhuma suite
# precisa de argumento -- todas tem referencia padrao propria.
# ----------------------------------------------------------------------------
lista(){
  cat <<'FIM'
curta|regressao.sh
curta|acentos.mjs
curta|achar-textos.mjs
curta|calculadora-album.mjs
curta|centavo-do-desconto.mjs
curta|chave-pix-formatos.mjs
curta|chave-pix-limpeza.mjs
curta|chaves-renomeadas.mjs
curta|cupom-minimo.mjs
curta|descricao-opcionais.mjs
curta|duplicar-itens.mjs
curta|explicacoes.mjs
curta|exportar-sem-dados.mjs
curta|frase-copiado.mjs
curta|id-orcamento.mjs
curta|itens-upsell.mjs
curta|limites-visiveis.mjs
curta|linha-de-dinheiro.mjs
curta|lista-cupons.mjs
curta|meio-prio-migracao.mjs
curta|meio-prioritario.mjs
curta|novidades.mjs
curta|pac-quantidade.mjs
curta|painel-orfas.mjs
curta|paypal-itens.mjs
curta|paypal-previa.mjs
curta|preset-formulario.mjs
curta|previa-cobrar.mjs
curta|previa-estreita.mjs
curta|redes-da-partida.mjs
curta|sinal-cobranca.mjs
curta|sinal.mjs
curta|sku-por-item.mjs
curta|textos-escape.mjs
curta|textos-migrados.mjs
curta|textos-reserva.mjs
curta|textos-sinal.mjs
curta|tidycal-altura.mjs
curta|tidycal-origem.mjs
curta|unificar-config.mjs
curta|unificar-pagamento.mjs
curta|upsell-janela.mjs
curta|upsell.mjs
curta|zap-saldo-migracao.mjs
rede|aparencia.mjs
rede|qr-configuravel.mjs
rede|calendario-aquecido.mjs
rede|corrida-calendario.mjs
rede|tidycal-unificado.mjs
FIM
}

# Os arquivos .mjs que NAO sao suite: bibliotecas, chamadas por outros.
# Declarados aqui para que `conferir` saiba distingui-los de suite esquecida.
BIBLIOTECAS='lib.mjs pagina.mjs cenario.mjs geradores.mjs'

# ----------------------------------------------------------------------------
# A conferencia da lista contra o diretorio e contra o codigo.
# ----------------------------------------------------------------------------
conferir(){
  falhas=0

  # 1. arquivo .mjs que ninguem roda
  for f in "$DIR"/*.mjs; do
    n=$(basename "$f")
    case " $BIBLIOTECAS " in *" $n "*) continue;; esac
    if ! lista | grep -q "|$n\$"; then
      echo "  LISTA INCOMPLETA: $n nao esta em bateria nenhuma e nao e biblioteca."
      falhas=$((falhas+1))
    fi
  done

  # 2. e 3. o lado da rede
  lista | while IFS='|' read -r bat arq; do
    [ -f "$DIR/$arq" ] || { echo "  LISTA VELHA: $arq nao existe mais."; echo x >> "$MARCA"; continue; }
    if grep -q "permitir *[:=]" "$DIR/$arq"; then
      if [ "$bat" = curta ]; then
        echo "  LISTA ERRADA: $arq declara 'permitir:' (abre a rede) e esta na bateria CURTA."
        echo x >> "$MARCA"
      fi
    else
      if [ "$bat" = rede ]; then
        echo "  LISTA ERRADA: $arq nao declara mais 'permitir:' e esta na bateria COM REDE."
        echo x >> "$MARCA"
      fi
    fi
  done
  [ -s "$MARCA" ] && falhas=$((falhas + $(wc -l < "$MARCA")))
  : > "$MARCA"

  if [ "$falhas" -gt 0 ]; then
    echo
    echo "A lista de suites divergiu do diretorio. Conserte a funcao 'lista' em $0."
    return 1
  fi
  return 0
}

# ----------------------------------------------------------------------------
# hhmmss a partir de segundos
# ----------------------------------------------------------------------------
tempo(){
  s=$1
  if [ "$s" -ge 60 ]; then
    printf '%dm%02ds' $((s/60)) $((s%60))
  else
    printf '%ds' "$s"
  fi
}

rodar(){
  alvo=$1
  total_ini=$(date +%s)

  : > "$RESUMO"

  lista | while IFS='|' read -r bat arq; do
    case "$alvo" in
      curta)    [ "$bat" = curta ] || continue;;
      rede)     [ "$bat" = rede ]  || continue;;
      tudo)     ;;
    esac
    printf '  %-26s ... ' "$arq"
    ini=$(date +%s)
    case "$arq" in
      *.sh)  sh "$DIR/$arq"   > "$LOGS/$arq.log" 2>&1; cod=$?;;
      *)     node "$DIR/$arq" > "$LOGS/$arq.log" 2>&1; cod=$?;;
    esac
    fim=$(date +%s)
    dur=$((fim-ini))
    if [ "$cod" -eq 0 ]; then est=OK; else est="FALHOU (codigo $cod)"; fi
    printf '%s  %s\n' "$(tempo $dur)" "$est"
    printf '%s|%s|%s|%s\n' "$arq" "$cod" "$dur" "$bat" >> "$RESUMO"
  done

  total_fim=$(date +%s)
  echo "$((total_fim-total_ini))" > "$TOTAL"
}

# ----------------------------------------------------------------------------
# O resumo final. Sai do arquivo que `rodar` escreveu -- o laco roda num
# subshell por causa do pipe, entao contador de shell nao sobrevive a ele.
# ----------------------------------------------------------------------------
resumir(){
  echo
  echo '============================================================'
  echo " RESUMO"
  echo '============================================================'
  passou=0; falhou=0; soma=0
  while IFS='|' read -r arq cod dur bat; do
    if [ "$cod" -eq 0 ]; then
      printf '  OK      %-26s %8s  [%s]\n' "$arq" "$(tempo "$dur")" "$bat"
      passou=$((passou+1))
    fi
    soma=$((soma+dur))
  done < "$RESUMO"
  while IFS='|' read -r arq cod dur bat; do
    if [ "$cod" -ne 0 ]; then
      printf '  FALHOU  %-26s %8s  [%s]  codigo %s\n' "$arq" "$(tempo "$dur")" "$bat" "$cod"
      falhou=$((falhou+1))
    fi
  done < "$RESUMO"
  echo '------------------------------------------------------------'
  # Subtotal por bateria: e o numero que o README publica, e ele tem de sair da
  # medicao e nunca de uma frase escrita a mao.
  for b in curta rede; do
    sub=0; qtd=0
    while IFS='|' read -r arq cod dur bat; do
      [ "$bat" = "$b" ] || continue
      sub=$((sub+dur)); qtd=$((qtd+1))
    done < "$RESUMO"
    [ "$qtd" -gt 0 ] && printf '  bateria %-9s %2d suite(s)  %8s\n' "$b" "$qtd" "$(tempo "$sub")"
  done
  printf '  %d suite(s): %d passaram, %d falharam. Tempo somado: %s\n' \
    $((passou+falhou)) "$passou" "$falhou" "$(tempo "$soma")"
  echo "  Saida completa de cada uma em: $LOGS"
  echo '============================================================'
  [ "$falhou" -eq 0 ]
}

# ----------------------------------------------------------------------------
ALVO="${1:-}"
case "$ALVO" in
  --listar)
    echo 'BATERIA CURTA (rede externa fechada):'
    lista | grep '^curta|' | sed 's/^curta|/  /'
    echo
    echo 'BATERIA COM REDE (abre a internet de proposito):'
    lista | grep '^rede|'  | sed 's/^rede|/  /'
    exit 0;;
  curta|tudo) ;;
  com-rede) ALVO=rede;;
  *)
    echo "uso: $0 curta | com-rede | tudo | --listar"
    exit 2;;
esac

LOGS=$(mktemp -d "${TMPDIR:-/tmp}/fc-bateria-XXXXXX")
RESUMO="$LOGS/.resumo"
TOTAL="$LOGS/.total"
MARCA="$LOGS/.marca"
: > "$MARCA"

echo "conferindo a lista contra o diretorio..."
conferir || exit 1
echo "  lista OK"
echo

case "$ALVO" in
  curta) echo 'BATERIA CURTA -- rede externa fechada';;
  rede)  echo 'BATERIA COM REDE -- pode falhar por internet; quando falhar, a leitura certa e "nao mediu"';;
  tudo)  echo 'BATERIA COMPLETA -- as duas em sequencia';;
esac
echo

rodar "$ALVO"
resumir
