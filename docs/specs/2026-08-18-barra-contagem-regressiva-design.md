# Design — Aba "Contagem regressiva" (6ª aba do index.html)

> Spec validado com o usuário em 18/08/2026. Alvo: `index.html`, projeto Foto Certa / Alboom Prosite.

## 1. Objetivo

Nova aba na ferramenta `utl-construtor` que gera o código de uma **barra de contagem regressiva no topo de uma landing page**, para trabalhar senso de urgência. A barra combina mensagem, contador em dias/horas/minutos/segundos, efeitos de movimento e destaque, e elementos auxiliares (CTA, botão fechar, barra de progresso, coruja da identidade).

## 2. Decisões de arquitetura

### 2.1 Onde o código gerado é colado

O radio **fixa no topo / no fluxo** decide o destino da saída:

| Escolha | Destino | Motivo |
|---|---|---|
| Fixa no topo | **Tag Body da página** | Componentes HTML vivem em iframe (manual do Prosite, item 6): `position:fixed` dentro do componente gruda no iframe, não na página, e é recortado pela caixa do componente. A Tag Body é o caminho comprovado — é onde vive `.fcw-botao{position:fixed}` da captação de leads, publicado e funcionando. |
| No fluxo | **Componente HTML** | Sem `position:fixed`, o componente funciona e permite posicionar o bloco visualmente pelo editor. |

**Saída única.** O bloco gerado é sempre autocontido (`<style>` + `<div>` + `<script>`), e `@keyframes` funcionam tanto na Tag Body quanto dentro de um componente HTML (manual, itens 9 e 11). Diferente da aba Bordas, **nenhum dos dois caminhos exige código na Tag Head do site**.

O título da saída na aba muda sozinho entre "Código para a Tag Body da página" e "Código para o componente HTML" conforme a escolha.

### 2.2 Persistência do início da contagem

Chave derivada de um **código de campanha** informado pelo usuário: `fcbar:<CODIGO>` (ex.: `fcbar:NATAL26`), no mesmo espírito do `u-cod` do checkout.

- Duas campanhas convivem na mesma origem sem colidir.
- Trocar o código **zera a contagem de todos os visitantes** — é o botão de emergência para recomeçar a campanha.
- Toda leitura e escrita dentro de `try/catch`: com storage bloqueado a barra ainda funciona, apenas recomeça a cada visita.

O carimbo é gravado **nos dois modos**. No modo `abertura` ele é a origem da contagem. No modo `data` o restante vem da constante ISO do alvo, mas o carimbo continua sendo gravado porque a barra de progresso precisa de um ponto de partida (ver seção 5).

Alternativas descartadas: chave derivada do caminho da página (quebra ao renomear a página) e chave global fixa (campanhas brigam entre si).

### 2.3 Compensação do espaço da barra fixa

Mede a **altura real** da barra e aplica `padding-top` no `<body>` por JS, reagindo a `resize` e a `ResizeObserver` sobre a própria barra — mesmo arsenal do `ajustarAltura` da página intermediária, que já dá conta das reflows do Prosite. Valor fixo em px foi descartado: erra assim que o texto quebra em duas linhas no celular.

Radio **empurrar o conteúdo / sobrepor**, porque a convivência com o menu do tema pode exigir sobrepor.

Ao esconder a barra no fim da contagem, o `padding-top` é devolvido.

### 2.4 Rolagem contínua (marquee)

CSS puro: trilho com o conteúdo **duplicado** e `@keyframes` transladando de `0` a `-50%` — emenda invisível e loop perfeito, sem JS no laço de animação.

Como o contador vive dentro do texto que rola, o tick de cada segundo escreve em **todos** os `[data-fcb-rel]` de uma vez, mantendo os clones idênticos.

Descartados: `requestAnimationFrame` movendo o trilho (mais CPU, sem ganho) e `<marquee>` (obsoleta e provável alvo do sanitizador).

### 2.5 Motor da contagem

Um único `setInterval` de 1 segundo que **recalcula o restante a partir de carimbos absolutos** (`alvo - Date.now()`), nunca decrementando um acumulador. A barra sobrevive a aba em segundo plano, notebook suspenso e travadas de tempo: ao voltar, o número já está certo, sem deriva.

### 2.6 A coruja da identidade

O SVG reaproveitado de `svgCorujaStr` é **bicolor**: corpo e cabeça `#fff` fixos, e contorno das penas, olhos, bico e pés na cor passada. Num fundo claro o corpo branco desapareceria, então o desenho passa a receber **duas cores** — corpo e detalhes — mantendo a geometria idêntica à da identidade.

- **Ancorada nas pontas, fora da área que rola.** O container é `[coruja] [conteúdo] [coruja]`, e só o miolo tem `overflow:hidden`. Dentro do trilho, as corujas sumiriam junto com o texto.
- **Injetada por JavaScript**, via função `svgCoruja(corpo, detalhes)` + `innerHTML`, exatamente como no código gerado da captação de leads. SVG cru no HTML colado seria exposição desnecessária ao sanitizador.
- `aria-hidden="true"` preservado: é decorativa.

## 3. Layout da aba

Aba `id="aba-cnt"`, painel `id="painel-cnt"`, rótulo **"Contagem regressiva"**. Prefixo **`c-`** em campos e funções (livre: `s-`, `l-`, `t-`, `u-`, `b-` já usados). Classes e animações do código gerado com prefixo **`fcb-`**.

Segue o padrão obrigatório da seção 4 da documentação: descrição → seções numeradas com `grade` de duas colunas → última seção "Prévia e código gerado" → instruções em largura total.

### Seção 1 — Contagem e encerramento

| Campo | ID | Tipo | Padrão |
|---|---|---|---|
| Modo | `c-modo` | radio `abertura` \| `data` | `abertura` |
| Duração — dias / horas / minutos | `c-dias`, `c-horas`, `c-mins` | number | 0 / 48 / 0 |
| Data e hora do alvo | `c-alvo` | datetime-local | vazio |
| Código da campanha | `c-cod` | text | `NATAL26` |
| Unidades exibidas | `c-un-d`, `c-un-h`, `c-un-m`, `c-un-s` | checkbox | todas marcadas |
| Esconder dias quando zerar | `c-diaszero` | radio sim \| nao | `sim` |
| Ao chegar a zero | `c-fim` | radio `esconder` \| `mensagem` \| `zerado` \| `reiniciar` | `esconder` |
| Mensagem final | `c-fimtxt` | text | `Promocao encerrada` |

`c-alvo` exibe `<small>` avisando que o instante é fixado em **−03:00** no código gerado, para que todo visitante conte até o mesmo momento independentemente do fuso do aparelho.

`reiniciar` só se aplica ao modo `abertura`; no modo `data` a opção fica desabilitada com nota explicativa.

### Seção 2 — Mensagens

Formulário de cadastro à esquerda, lista à direita (mesmo padrão de imagens e produtos). Array `cMsgs`, itens `{texto, curta}`.

| Campo | ID |
|---|---|
| Texto da mensagem | `c-msg` |
| Versão curta (celular, opcional) | `c-msgcurta` |
| Adicionar | `c-msg-add` |
| Lista com reordenar/remover | `c-msg-lista` |

**Marcador `{contador}`**: indica onde o relógio entra no texto — *"Oferta de Natal termina em {contador} · garanta a sua"*. Regras:

- Todas as ocorrências de `{contador}` são substituídas pelo contador (todas atualizam juntas via `[data-fcb-rel]`).
- Sem o marcador, o contador é anexado depois do texto.
- Lista vazia: o código gerado usa a mensagem padrão `Oferta por tempo limitado {contador}`.

Uma mensagem = barra estática ou rolante. Duas ou mais = os efeitos de alternância têm o que alternar.

### Seção 3 — Aparência e posição

**Fieldset "Cores e tipografia"**

| Campo | ID | Padrão |
|---|---|---|
| Cor de fundo | `c-cfundo` (+ `-t`) | `#0F3A30` |
| Cor do texto | `c-ctexto` (+ `-t`) | `#FDFBF6` |
| Cor de destaque dos números | `c-cdestaque` (+ `-t`) | `#FFC94A` |
| Pilha de fonte | `c-fonte` radio `neutra` \| `humanista` \| `condensada` \| `mono` | `neutra` |
| Tamanho da fonte (px) | `c-tam` | 15 |
| Espessura | `c-peso` radio 400 \| 600 \| 700 | 600 |

Pilhas, todas sem serifa e sem webfont externa (`<link>`/`@import` são risco desnecessário com o sanitizador):

- `neutra`: `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,sans-serif`
- `humanista`: `"Helvetica Neue",Helvetica,Arial,sans-serif`
- `condensada`: `"Roboto Condensed","Arial Narrow",Arial,sans-serif`
- `mono`: `ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`

Os dígitos sempre recebem `font-variant-numeric: tabular-nums` para não dançarem a cada segundo.

**Fieldset "Formato e espaço"**

| Campo | ID | Padrão |
|---|---|---|
| Formato do contador | `c-formato` radio `compacto` \| `blocos` | `compacto` |
| Rótulos das unidades | `c-rd`, `c-rh`, `c-rm`, `c-rs` | `dias`, `horas`, `min`, `seg` |
| Espaçamento interno vertical (px) | `c-pad` | 10 |
| Largura máxima do conteúdo (px) | `c-largmax` | 1100 |
| Alinhamento | `c-alinha` radio `centro` \| `esquerda` | `centro` |
| Linha divisória inferior | `c-borda` radio sim \| nao + `c-cborda` (+ `-t`) | `nao`, `#FFC94A` |
| Largura de corte do celular (px) | `c-mob` | 640 |

No formato `compacto` os rótulos viram sufixos curtos (`d`, `h`, `m`, `s`); no formato `blocos` aparecem por extenso sob cada caixa.

**Fieldset "Posição"**

| Campo | ID | Padrão |
|---|---|---|
| Fixa no topo / no fluxo | `c-fixa` radio `fixa` \| `fluxo` | `fixa` |
| Empurrar o conteúdo / sobrepor | `c-empurrar` radio `empurrar` \| `sobrepor` | `empurrar` |
| z-index | `c-z` | 99980 |

`c-empurrar` e `c-z` só se aplicam quando `c-fixa = fixa`; ficam ocultos no modo fluxo.

**Fieldset "Extras da barra"**

| Campo | ID | Padrão |
|---|---|---|
| Botão CTA | `c-cta` radio sim \| nao | `nao` |
| Texto do CTA | `c-ctatxt` | `Quero garantir` |
| URL ou âncora do CTA | `c-ctaurl` | `#reserva` |
| Cores do CTA | `c-ctafundo`, `c-ctatexto` (+ `-t`) | `#FFC94A`, `#23281F` |
| Botão fechar | `c-fechar` radio `nao` \| `sessao` \| `sempre` | `nao` |
| Barra de progresso | `c-prog` radio sim \| nao + `c-cprog` (+ `-t`) | `nao`, `#FFC94A` |
| Usar a coruja | `c-coruja` radio sim \| nao | `nao` |
| Altura da coruja (px) | `c-corujaalt` | 26 |
| Espaçamento até o conteúdo (px) | `c-corujagap` | 16 |
| Cor do corpo | `c-corujacorpo` (+ `-t`) | `#FDFBF6` |
| Cor dos detalhes | `c-corujadet` (+ `-t`) | `#FFC94A` |
| Esconder no celular | `c-corujamob` radio sim \| nao | `sim` |

Botão fechar: `sessao` grava em `sessionStorage`, `sempre` em `localStorage`, ambos na chave `fcbar:<CODIGO>:fechada`.

### Seção 4 — Efeitos e movimento

| Campo | ID | Valores | Padrão |
|---|---|---|---|
| Movimento | `c-mov` | `estatico` \| `rolaesq` \| `roladir` \| `altfade` \| `altdesliza` | `estatico` |
| Duração do ciclo de rolagem (s) | `c-vel` | 2–60 | 18 |
| Intervalo da alternância (s) | `c-alt` | 2–30 | 5 |
| Destaque contínuo | `c-ef-pulsar`, `c-ef-brilho`, `c-ef-degrade`, `c-ef-piscar`, `c-ef-tremor` | checkboxes | nenhum |
| Urgência progressiva | `c-urg` radio sim \| nao | | `nao` |
| Limiar (minutos restantes) | `c-urglim` | | 60 |
| Cor de urgência | `c-curg` (+ `-t`) | | `#8C1D18` |
| Pulsar ao entrar na urgência | `c-urgpulsar` radio sim \| nao | | `sim` |
| Virada dos dígitos | `c-dig` | `nenhuma` \| `fade` \| `flip` | `nenhuma` |
| Entrada da barra | `c-entrada` | `imediata` \| `deslizar` \| `aposrolar` | `imediata` |
| Rolar quantos px antes de aparecer | `c-entradapx` | | 300 |

Semântica dos efeitos de destaque: `pulsar` = respiração suave de escala/opacidade no conteúdo; `brilho` = facho atravessando a barra pela técnica de dupla camada da aba Bordas; `degrade` = fundo em degradê com `background-position` animada; `piscar` = separador `:` alternando opacidade a cada segundo (só no formato compacto); `tremor` = sacudida curta e periódica.

Urgência progressiva troca a cor de fundo da barra por `c-curg` e, se marcado, liga o pulsar — independentemente dos efeitos de destaque escolhidos.

### Seção 5 — Prévia e código gerado

Botões `c-gerar`, `c-atualizar`, `c-limpar` numa `div.acoes`; prévia ao vivo em `c-pv-box` à esquerda, rodando o mesmo motor e os mesmos efeitos (coruja inclusa); saída única `c-out1` com `c-copy1` / `c-cop1` à direita, sob o título dinâmico `c-out-titulo`.

### Instruções ao final

Onde colar em cada caso; pré-requisito do CTA quando aponta para âncora (coluna com ID Html correspondente); publicar e conferir em aba anônima; e os limites da seção 6 deste spec, escritos de forma visível.

## 4. Arquitetura do código gerado

Ordem fixa: `<style>` → `<div class="fcb-barra">` → `<script>`. Variáveis de customização no topo do script, comentadas com os valores permitidos, seguidas da linha `/* Daqui para baixo nao precisa mexer */`.

**Conformidade com o manual do Prosite** (obrigatória, verificar item a item na implementação):

1. `addEventListener` em todos os eventos, nunca inline.
2. `<style`/`<script`/`<iframe` dentro de strings JS blindados por concatenação.
3. Só `<div>` — nenhuma tag semântica HTML5.
4. Todo o script em IIFE.
5. Sem acentos no código; acentos apenas em textos visíveis.
6. `@keyframes` e `@media` dentro do `<style>` do próprio bloco.

**Classes**: `fcb-barra`, `fcb-conteudo`, `fcb-trilho`, `fcb-msg`, `fcb-rel`, `fcb-bloco`, `fcb-num`, `fcb-rot`, `fcb-sep`, `fcb-coruja`, `fcb-cta`, `fcb-fechar`, `fcb-prog`, `fcb-urgente`.

**Animações**: `fcb-rola`, `fcb-pulsar`, `fcb-brilho`, `fcb-degrade`, `fcb-piscar`, `fcb-tremor`, `fcb-entra`, `fcb-flip`, `fcb-fade`.

**Acessibilidade**: todo bloco de animação acompanhado de `@media (prefers-reduced-motion: reduce)` que congela o movimento, como já faz a aba Bordas.

**Ciclo de vida**: monta o DOM → resolve o carimbo de início/alvo → aplica padding no body (se fixa) → primeiro render → `setInterval` de 1s → ao zerar, executa o comportamento escolhido e encerra o intervalo.

## 5. Casos de borda

| Situação | Comportamento |
|---|---|
| Duração total zero ou negativa | Trata como já encerrado; executa direto o comportamento de fim. |
| Data-alvo no passado | Idem. |
| Código de campanha vazio | Usa `padrao` como sufixo da chave. |
| Lista de mensagens vazia | Mensagem padrão embutida. |
| `{contador}` ausente | Contador anexado após o texto. |
| Múltiplos `{contador}` | Todas as ocorrências recebem o contador e atualizam juntas. |
| `localStorage` indisponível | `try/catch`; a barra funciona e recomeça a cada visita. |
| Alternância com uma só mensagem | Degrada para estático. |
| `esconder dias quando zerar` com dias desmarcado | Sem efeito; a unidade já não aparece. |
| Barra fechada pelo visitante | Não monta; padding não é aplicado. |

**Barra de progresso nos dois modos**: o percentual precisa de um início e um fim. No modo `abertura`, início = carimbo gravado, fim = início + duração. No modo `data`, o carimbo da primeira visita **também é gravado** e serve de início, com fim = data-alvo. Portanto o carimbo é gravado nos dois modos, embora só o modo `abertura` o use para calcular o restante.

## 6. Limites conhecidos (vão escritos nas instruções da aba)

- **Relógio do visitante**: a contagem é client-side e confia no relógio do aparelho. Sem servidor não há correção — mesmo trade-off já aceito no Pix estático.
- **Carimbo por navegador**: celular e desktop do mesmo visitante começam separado; aba anônima recomeça; limpar dados zera.
- **Safari / ITP**: pode descartar o storage após cerca de 7 dias sem visita. Irrelevante para campanhas de 24–72h, relevante para campanhas de semanas.
- **Fuso da data-alvo**: fixado em −03:00 no código gerado.
- **Convivência com o menu do tema**: se o menu do Prosite também for fixo, os dois disputam o topo. Resolve-se com `z-index` ou trocando para "sobrepor" — só se verifica na página publicada.

## 7. Impacto no restante da ferramenta

- `trocarAba` passa a listar `'cnt'`.
- `salvarEstado` / `restaurarEstado` ganham o ramo `c:{...}` e o array `cMsgs`.
- `parearCor` chamado para cada novo campo de cor da aba.
- Bootstrap final da IIFE ganha `cMsgRender()`, `cToggles()`, `cPreview()`.
- Após a implementação: atualizar `docs/documentacao-fotocerta.md` (a ferramenta passa de 5 para 6 abas, seções 4 e 6), o inventário de `CLAUDE.md` e a tabela de abas do `README.md`. Publicação é commit + push — o GitHub Pages atualiza `construtores.fotocerta.com.br` sozinho.

## 8. Verificação

- Prévia da aba reflete cada combinação de formato, movimento, destaque, urgência, extras e coruja.
- Código gerado inspecionado contra os 6 itens de conformidade da seção 4.
- Teste na página publicada (feito pelo usuário): barra fixa não cobre o menu; contagem não reinicia ao recarregar; contagem continua correta após fechar e reabrir o navegador; comportamento de fim correto; rolagem sem emenda visível; celular e desktop.
