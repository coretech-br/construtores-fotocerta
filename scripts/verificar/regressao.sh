#!/bin/sh
# ============================================================================
# REGRESSAO BYTE A BYTE DOS DEZ GERADORES, EM DUAS PASSAGENS
# ============================================================================
# Compara o que a arvore de trabalho produz com o que uma referencia produz --
# por padrao a 'main'. Mexer numa aba nao pode mudar um byte do que as outras
# geram, e este script e o que transforma essa frase em medida.
#
#   scripts/verificar/regressao.sh            # compara com main
#   scripts/verificar/regressao.sh <ref>      # compara com outro commit/branch
#
# AS DUAS PASSAGENS (ver o cabecalho de geradores.mjs):
#   fabrica     -- todos os textos no padrao. Prova o INVARIANTE.
#   configurada -- 28 campos de texto preenchidos, com marcador, acento, aspas,
#                  barra invertida e '</script'. Prova que o texto do dono chega
#                  ao bloco. Sem ela a fotografia nao dizia NADA sobre o caminho
#                  configurado, que e onde os 162 campos criados em 03/09/2026
#                  vivem -- e foi assim que um marcador cru chegou a tela.
#
# A passagem configurada so e COMPARAVEL contra uma referencia que tambem tenha
# os campos de texto. Contra uma anterior a rodada dos textos, ela e pulada com
# aviso -- e a cobertura ('todo texto configurado apareceu em alguma saida')
# continua sendo cobrada na arvore de trabalho, que e onde ela significa algo.
#
# Saida: "REGRESSAO: OK" e codigo 0, ou a lista do que divergiu e codigo 1.
#
# COMO ELE FUNCIONA. A referencia sai de 'git archive <ref>' para uma pasta
# temporaria -- nao mexe na arvore de trabalho e nao precisa de checkout. As
# duas arvores sao servidas por HTTP em PORTAS SEPARADAS, cada uma exercitada
# num navegador com o armazenamento limpo.
#
# O QUE ELE NAO COBRE, e esta dito para nao ser confundido: ele compara TEXTO
# GERADO. Nao roda o bloco entregue, nao confere layout e nao substitui a
# conferencia visual nem o teste do dono na pagina publicada. Quem EXECUTA os
# blocos (com os mesmos textos de escape, numa pagina de verdade) e o
# scripts/verificar/textos-escape.mjs -- os dois se completam, nenhum substitui
# o outro.
#
# Precisa de Node e Playwright -- ver scripts/verificar/lib.mjs, que diz o que
# instalar se faltar.
# ============================================================================
set -eu

REF="${1:-main}"
raiz=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

command -v node >/dev/null 2>&1 || { echo "REGRESSAO: FALHOU -- Node nao encontrado."; exit 1; }
git -C "$raiz" rev-parse --verify "$REF" >/dev/null 2>&1 || {
  echo "REGRESSAO: FALHOU -- a referencia \"$REF\" nao existe neste repositorio."; exit 1; }

echo "referencia: $REF ($(git -C "$raiz" rev-parse --short "$REF"))"
mkdir -p "$tmp/ref"
git -C "$raiz" archive "$REF" | tar -x -C "$tmp/ref"

node "$raiz/scripts/verificar/geradores.mjs" "$tmp/ref" 8931 "$tmp/ref.json"
node "$raiz/scripts/verificar/geradores.mjs" "$raiz"     8932 "$tmp/novo.json"

node -e '
const fs=require("fs");
const a=JSON.parse(fs.readFileSync(process.argv[1]));
const b=JSON.parse(fs.readFileSync(process.argv[2]));
let mau=0;
for(const k of Object.keys(a.geradores))
  if(a.geradores[k]!==b.geradores[k]){console.log("  DIFERE  [fabrica] saida "+k);mau++;}
for(const k of Object.keys(a.cobrancas)){
  if(a.cobrancas[k].link!==b.cobrancas[k].link){console.log("  DIFERE  link da cobranca: "+k);mau++;}
  if(a.cobrancas[k].bloco!==b.cobrancas[k].bloco){console.log("  DIFERE  bloco da cobranca: "+k);mau++;}
}
/* A PASSAGEM CONFIGURADA so vale como comparacao quando os DOIS lados tem os campos de
   texto. Contra uma referencia anterior a rodada de 03/09/2026 ela nao existe la, e
   comparar seria acusar 25 divergencias que so dizem "a referencia e mais velha". */
const semTextos = (a.configTextosAusentes||[]).length || (b.configTextosAusentes||[]).length;
if(!a.configurado){
  console.log("  (a referencia e anterior a segunda passagem -- so a de fabrica foi comparada)");
}else if(semTextos){
  console.log("  (passagem configurada NAO comparavel: a referencia nao tem "+
              (a.configTextosAusentes||[]).length+" dos campos de texto)");
}else{
  for(const k of Object.keys(a.configurado))
    if(a.configurado[k]!==b.configurado[k]){console.log("  DIFERE  [configurada] saida "+k);mau++;}
}
/* A COBERTURA e cobrada SEMPRE na arvore de trabalho, comparavel ou nao: texto configurado
   que nao aparece em saida nenhuma faz a segunda passagem ser tao cega quanto a primeira,
   so que mais cara. Ramo declarado (quarta coluna da tabela em cenario.mjs) nao entra aqui;
   ramo declarado que VOLTOU a aparecer entra, porque a declaracao envelheceu. */
if((b.configSemVestigio||[]).length){
  console.log("  SEM VESTIGIO  texto configurado que nao chegou a saida nenhuma: "+b.configSemVestigio.join(", "));
  mau++;
}
if((b.configRamoDeclaradoQueApareceu||[]).length){
  console.log("  DECLARACAO VELHA  ramo dito nao exercitado que apareceu: "+b.configRamoDeclaradoQueApareceu.join(", "));
  mau++;
}
const n=Object.keys(a.geradores).length, m=Object.keys(a.cobrancas).length;
if(mau){
  console.log("\nREGRESSAO: "+mau+" DIVERGENCIA(S).");
  console.log("Se alguma delas for INTENCIONAL, diga isso na spec da rodada, com o motivo.");
  process.exit(1);
}
console.log("\nREGRESSAO: OK  ("+n+" saidas x 2 passagens e "+m+" cobrancas, bloco e link, byte a byte identicas)");
if(b.erros.length){console.log("Mas houve erro de console na arvore de trabalho: "+b.erros.slice(0,3).join(" | "));process.exit(1);}
' "$tmp/ref.json" "$tmp/novo.json"
