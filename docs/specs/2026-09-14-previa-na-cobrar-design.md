# Prévia na página /cobrar: como fica a /pagar e o que vai ao PayPal

Pedido do dono em 14/09/2026: *"Hoje ela não me mostra uma prévia de como ficará na página Pagar e
também não mostra como os campos são enviados para o PayPal. Crie uma coluna adicional na página
Cobrar, onde deverá renderizar essa prévia."*

## As três medições que decidem o desenho

1. **A `/cobrar` NÃO tem o gerador do bloco da `/pagar`.** Ele é `pJs`, e vive só no `index.html`.
   Desenhar a página por conta própria ali seria uma **segunda implementação** do que o bloco faz —
   exatamente o que a regra da casa recusa (*"prévia roda o gerador, não imita o gerador"*), e o que
   já divergiu duas vezes na aba Contagem regressiva.
2. **A `/pagar` publicada aceita ser exibida em quadro** — `curl -I` na página real não traz
   `X-Frame-Options` nem `frame-ancestors`.
3. **A montagem do pedido do PayPal ainda não é compartilhada.** `P_PP_SRC` cobre só
   `paypalLinkOk` (validação do host do link). O `createOrder` vive dentro de `pJs`.

## Parte 1 — "como vai ficar": a página REAL, não um desenho

O quadro carrega **a `/pagar` publicada do dono, com o link recém-gerado**. Fiel por construção: é a
página real, com o bloco que ele colou, lendo o link que ele acabou de fazer.

**O efeito colateral é a maior vantagem, e precisa ser dito na tela:** se o bloco colado estiver
desatualizado, a prévia mostra **a recusa** — que é precisamente o aviso que ele precisa, no momento
em que ele precisa. Hoje ele só descobriria pelo cliente. Depois da rodada do sinal (13/09) isso
deixou de ser hipótese: links com sinal são recusados por bloco antigo, e a tarefa de recolar o
código 1 está pendente do lado dele.

**Obrigações:**
- O quadro é **somente leitura**: nada de o dono pagar sem querer a própria cobrança. `pointer-events`
  desligado sobre o quadro, com uma linha dizendo por quê e um botão "abrir em outra aba" para quem
  quiser interagir de verdade.
- **Precisa de internet**, ao contrário do resto da `/cobrar`. Declarar na tela, e tratar a falha
  (sem rede, ou a página fora do ar) com recado claro — **nunca com quadro branco**, que parece
  defeito da cobrança e não da conexão.
- O endereço da `/pagar` sai da configuração que já existe, nunca digitado de novo.

## Parte 2 — "o que vai ao PayPal": fonte única, não segunda conta

A `/cobrar` precisa mostrar os mesmos campos que a prévia da ferramenta mostra (`items[]`,
`item_total`, `discount`, `amount`, `description`, `custom_id`, `sku`). **Recalcular ali seria a
segunda implementação de dinheiro** — a classe onde este projeto achou 60.097 divergências.

**O caminho é o padrão da casa:** extrair a montagem do pedido de `pJs` para
`fc-compartilhado.js` como **texto literal**, e as duas páginas **avaliam** esse mesmo texto — como
`fcPixApi` já faz com `FC_PIX_SRC`. O bloco entregue continua autossuficiente e continua levando a
própria cópia dentro dele.

**Se a medição mostrar que a extração muda um byte do bloco entregue, a extração está errada — não
o teste.** É regra escrita, e a regressão byte a byte é a prova.

## Disciplina obrigatória

Mexer em `fc-compartilhado.js` troca a versão nos **QUATRO** lugares e roda
`conferir-versoes.sh --registrar`.

## Layout: "coluna" no computador, empilhado no celular

A `/cobrar` é **mobile-first** e é usada no celular, em pé, entre uma coisa e outra. Coluna de
verdade não cabe em 375 px. Então: coluna ao lado em tela larga, e **abaixo do link, recolhida**, no
celular — usando a mecânica de seção recolhível que já existe, sem inventar outra.

## A release note

**Esta rodada escreve a entrada dela** no topo de `FCR_NOTAS`, pela regra de 14/09/2026. As três
redes cobram se não for escrita.

## Provas

1. `regressao.sh` → **zero divergência**: a extração é refatoração, e a `/pagar` não pode mudar um
   byte. E o **invariante do link**: o link que a `/cobrar` gera continua idêntico ao da aba.
2. A prévia do PayPal da `/cobrar` mostra **os mesmos campos** que a da ferramenta, para a mesma
   cobrança — comparadas campo a campo, as duas lendo da fonte única.
3. O quadro carrega a página real e **não é clicável**; sem rede, aparece recado e não quadro branco.
4. Bloco desatualizado → a prévia mostra a recusa. **Provado servindo um bloco antigo de propósito.**
5. A 375 px, a prévia não empurra o botão de gerar para fora da tela.
