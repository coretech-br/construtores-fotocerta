# Aba nova: Calculadora de álbum — especificação

Aprovada pelo dono em 15/09/2026, decisões 1 a 6 aceitas, mais:
*"todos os textos que aparecem na tela customizáveis pelo construtor, inclusive os textos dos botões."*

## Identificadores

| O quê | Valor | Por quê |
|---|---|---|
| `id` da aba | `alb` | livre |
| prefixo dos campos | `v-` | medido: zero ocorrências de `id="v-` |
| prefixo das classes do bloco | `fcal-` | medido: zero ocorrências. `fcv-` foi **recusado**: a ferramenta já tem `.fcv` (a linha da versão), e um grep traria as duas coisas misturadas — a regra do CLAUDE.md |
| chave de estado | `v` | |

## O que o bloco calcula

```
base        = fotos x PRECO_POR_FOTO
laminas     = round(fotos / media_do_tamanho)
descLaminas = faixa(laminas).pct  aplicado SO na base
opcionais   = soma dos acabamentos marcados
subtotal    = base + opcionais
total       = subtotal - descLaminas          (arredondado uma vez, em centavos)
totalPix    = total - DESCONTO_PIX%           (fcTotalPixSrc, compartilhado)
sinalAgora  = total x SINAL% ou valor fixo    (FC_CARRINHO_SRC.sinal)
saldoDepois = total - sinalAgora
```

**A conta do desconto é feita em CENTAVOS INTEIROS**, como o cupom do Checkout desde
13/09/2026: `Math.round(base*100)` primeiro, e só então o percentual. A calculadora que está
no ar hoje faz `base * pct / 100` em ponto flutuante — a mesma forma que custou 133.476
divergências, **todas contra o cliente**. Ver "A prova que manda", abaixo.

## Campos da aba

### Seção 1 — Como o álbum é orçado
- `v-preco` preço por foto (moeda)
- `v-lam-min` lâminas mínimas · `v-lam-max` lâminas máximas
- Lista **tamanhos** (cadastro + lista, com duplicar): `cm`, `media` (fotos por lâmina),
  `minfotos`, `sku`
- Lista **faixas de desconto** (cadastro + lista): `laminas` (a partir de), `pct`

### Seção 2 — Acabamentos opcionais
- Lista **acabamentos**: `nome`, `desc`, `valor`, `sku`

### Seção 3 — Pagamento
Herda o pacote das quatro abas que cobram:
- `v-pix` / `v-pp` (usa Pix / usa PayPal) · `v-prio` (meio prioritário, fábrica `pix`)
- `v-descpix` (desconto no Pix, fábrica 5)
- `v-sinal` (fábrica **sim**) · `v-sinaltipo` (fábrica `pct`) · `v-sinalpct` (fábrica **50**)
  · `v-sinalfixo`
- `v-txt-sinal-garante` / `-desistir` / `-saldo` — **nascem preenchidos** (decisão 5)
- `v-cod` código do pedido · `v-qr` tamanho do QR (fábrica 200)
- `v-upsell` + `v-upsellon` (endereço e interruptor)
- `v-zap` (oferecer WhatsApp) — liga/desliga o botão de orçamento
- `v-resumo` **resumo do pedido copiável pelo cliente** (pedido do dono, 15/09/2026, no meio
  da rodada). Mesmo molde das outras quatro abas: uma caixa somente-leitura reescrita a cada
  mudança (resumo que só se atualiza no clique de copiar é numero velho com cara de atual),
  mais o botao de copiar e a confirmacao. Linhas: tamanho, fotos, laminas, valor por foto,
  base, desconto por laminas, cada acabamento, total, sinal e saldo, e o valor no Pix.
  Fabrica: **ligado** — nas outras abas ligado tambem e o padrao desde a decisao 24.

### Seção 4 — Aparência
- `v-cor-destaque`, `v-cor-fundo`, `v-cor-texto`, `v-larg`

### Seção 5 — Textos
**Todos** os textos da tela, incluindo os dos botões. Tabela `V_TXT_DEFS`, para ganharem de
graça o eco no rótulo, a busca do topo, a persistência, o preset e o "Restaurar padrões".

### Seção 6 — Prévia e código gerado

## Responsividade

A virada para duas colunas mede a **largura do bloco**, com `@container`, e nunca a janela:
o bloco vive numa coluna do Prosite que pode ser bem mais estreita que a tela. Medido no
mockup: com `@media`, encolher a coluna não mudava nada e as duas colunas se sobrepunham.
Sem suporte a `@container`, o bloco fica numa coluna só — que é o estado seguro.

`@container` exige `container-type:inline-size` na raiz do bloco. At-rule vai em `<style>`,
nunca no campo CSS Customizado do componente (Manual do Prosite).

## A prova que manda

**O bloco novo cobra o mesmo que a calculadora publicada hoje** — em TODAS as combinações
de tamanho x quantidade de fotos x acabamentos, não por amostragem. São 6 tamanhos x
(até 203 fotos) x 4 combinações de acabamento: cabe numa varredura exaustiva.

Onde divergir, a divergência é **declarada e justificada** — e a única esperada é o centavo
do desconto, em que o bloco novo está certo e o publicado está errado.

---

## O que a implementação mediu, e o que ela desmentiu

**A previsão do centavo estava errada, e a medição a corrigiu.** Antes de começar, eu disse ao
dono que a prova acusaria uma divergência de um centavo contra a calculadora publicada, porque
ela faz `base * pct / 100` em ponto flutuante. Medido nas 2.760 combinações reais: **zero
divergências**. Com preço por foto inteiro (R$ 30) e faixas múltiplas de 5, o produto é sempre
múltiplo de 1,5 — exatamente representável em binário. A forma em centavos inteiros entrou
assim mesmo, e o motivo verdadeiro foi medido depois: varrendo preço de R$ 1,00 a R$ 60,00 de
centavo em centavo, as duas contas divergem em **0,610%** das combinações com desconto, e em
todas elas a forma antiga dá desconto **menor** — contra o cliente.

**A virada de layout mede o CONTAINER, e isso saiu de um defeito no próprio mockup.** A primeira
versão usava `@media`, e ao encolher a prévia nada mudava: a janela continuava larga e as duas
colunas se sobrepunham. O bloco vive numa coluna do Prosite, que pode ser bem mais estreita que
a tela — então quem decide é `container-type:inline-size` mais `@container`. Navegador sem
suporte fica na coluna única, que é o estado seguro.

**Três listas de prefixo viraram uma, com rede.** A ferramenta tinha o prefixo das abas que
cobram escrito à mão em três lugares sem ligação entre si: a regex do aviso dos textos do sinal,
a lista `abas` de `fcSinalTxtDiverge` e o objeto `fcOrdAtual`. Uma aba de pagamento nova entrava
em silêncio nas três. Agora é `FC_PAG_PREFS`, uma só — e `fcPagPrefsConferir`, na partida,
compara essa lista com as abas que declaram `pagamento:true` em `ABAS` e acende a barra vermelha
se discordarem.

**A aba entra ANTES da `pac` em `ABAS`, e não depois.** `aRestaura` chama `salvarEstado()` de
dentro dela quando migra alguma chave. Com `alb` depois da `pac`, esse `salvarEstado` rodaria
com o painel da calculadora ainda por restaurar: `vColeta` devolveria os padrões — ela é
defensiva de propósito — e o que o dono tivesse configurado seria sobrescrito, sem erro nenhum
na tela.

**Os padrões de fábrica precisam nascer na declaração, não no `restaura`.** Numa instalação
nova, `restaurarEstado` não chega a chamar `vRestaura` (não há fragmento `v` a restaurar), e a
aba nascia vazia: a primeira geração recusava com "Cadastre ao menos um tamanho". Medido, e
corrigido inicializando as três listas na declaração. **Ausente cai na fábrica; vazio continua
vazio** — quem apagou todos os tamanhos escolheu isso.
