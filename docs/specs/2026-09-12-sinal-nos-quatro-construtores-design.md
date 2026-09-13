# O sinal nos quatro construtores de pagamento — design

Decidido pelo dono em 12/09/2026, depois do levantamento. Três rodadas (B, C, D), nesta ordem.

## O estado medido

| Construtor | Sinal hoje |
|---|---|
| Checkout (`u`) | **tem** — `u-sinal`/`u-sinaltipo`/`u-sinalpct`/`u-sinalfixo` (1612-1633) |
| Mini loja (`m`) | **tem** — `m-sinal*` (3099-3119), mesma fonte |
| Agendamento por pacote (`a`) | **não** — `usaSinal=false` literal em 18708 e 18782 |
| Link de cobrança (`p`) | **não** — zero campos |

A conta mora em `FC_CARRINHO_SRC.sinal` (`index.html` 5311-5333), **não** em `fc-compartilhado.js`.
O compartilhado só carrega a *consequência*: `fcTotalPixSrc(descpix,usaPix,usaSinal)`, linha 457 —
`if(usaPix&&usaSinal)return 'function totalPix(){return sinalAgora();}'`.

**A spec 7.0 não proíbe sinal na aba `pac`.** O texto é *"Cobrança de sinal não foi pedida aqui"*
(`docs/specs/2026-09-02-agendamento-por-pacote-design.md` 177). O impedimento técnico da v1 — bloco
sem carrinho — **deixou de existir na v2**, que trouxe opcionais, quantidade e cupom.

## Rodada B — a prova que não existe, e três dívidas

**Por que primeiro.** O caminho do sinal tem **zero** verificações (grep em `scripts/`: duas
ocorrências, ambas em comentário, `cenario.mjs` 213-214). O padrão de fábrica de `u-sinal`/`m-sinal`
é `nao` e nada no arnês o liga, então as ~40 linhas condicionais de `fcPpBotoesSrc`,
`fcTotalPixSrc`, `uBloco` e `mBloco*` que só existem com sinal **saem zero vezes** da suíte, e
`FC_CARRINHO_SRC.sinal` nunca é emitido durante a regressão.

Estender antes de medir dobraria a superfície sem rede, e um defeito achado depois seria
indistinguível de um defeito herdado. A ausência está declarada como buraco conhecido em
`cenario.mjs` 213-217 e no `README.md` 204-210 — é dívida registrada, não descuido.

**O que a prova tem de cobrir**, com o bloco **executando** (molde `pagina.mjs`), nas duas abas:

1. A conta: `sinalAgora()` em percentual e em fixo, sobre o total **com cupom**.
2. **O número que o cliente lê é o número que as duas pontas cobram**: campo 54 do payload Pix
   (relido por leitor TLV independente) e `amount.value` do `createOrder` (lido do próprio bloco
   pela sonda `fcPvSondaPP`) — os dois iguais a `sinalAgora()`.
3. O arredondamento, com os casos que já morderam este projeto (meio centavo).
4. As três recusas de `sinalRecusa()` (5327-5333) e os **quatro** consumidores que leem dela:
   linha vermelha (14454), clique do PayPal (5062), botão do Pix (14560), resumo (14521).
5. O desconto do Pix zerado: `if(sinalOn)descpix=0` (13857/22284) e o ramo 457 do compartilhado.
6. As três linhas na tela (total, sinal, saldo) e as três linhas do WhatsApp.

**As três dívidas, resolvidas na mesma rodada** (regra de 03/09: registra, resolve, publica):

- **D1.** A linha do saldo no WhatsApp é o **único** texto do conjunto do sinal que não é campo:
  `partes.push(TXT_SALDO+': *'+moedaFmt(saldoDepois())+'*')` (14616 e 23411). O `': *…*'` está
  cravado. Todas as outras linhas da mesma mensagem passam por `aTplJs` com `{valor}`. Viola a
  regra D-2 registrada em 4313-4315 (*"metade configurável é armadilha"*). Nasce `zapSaldo` em
  `FC_TXT_FABRICA` e entra nas duas tabelas.
- **D2.** `m-descpix` **não** é desabilitado com sinal ligado; o Checkout desabilita (13633) com o
  comentário que explica por quê (13628-13631). Divergência entre abas que a fonte declara gêmeas.
- **D3.** O aviso âmbar da Mini loja só aparece quando `m==='ambos' && sinalOn` (22181); o Checkout
  mostra sempre que `sinalOn` (13632).

A divergência visual do aviso (Checkout texto vermelho solto 14041; Mini loja caixa `#FDF2F1`
22518) **não** entra: não há comentário justificando nem evidência de que seja deriva, e mexer em
aparência sem pedido do dono está fora da regra.

## Rodada C — sinal no Agendamento por pacote

Mecânica idêntica ao Checkout: percentual (1-99) ou valor fixo, sobre o total **com cupom**; Pix e
PayPal cobrando o sinal; saldo na entrega. Um pacote por reserva, então não há ambiguidade.

**Decisão do dono: o parcelamento passa a ser sobre o SINAL**, não sobre o total — é o valor que o
cartão cobra naquele momento, e parcelar um número que ninguém está cobrando confunde.

Oito pontos de emissão: `aCfg` zerar `descpix` com sinal (17109); `FC_CARRINHO_SRC.sinal` no bloco
(após 18530); `elValor` (18684); `elLinha2` (18686); `elParcela` (18688); `fcTotalPixSrc` (18708);
`montarPayload` (18728); `fcPpBotoesSrc` (18782). Mais markup/CSS das linhas de sinal, saldo e
aviso, `A_NUMS`, `aColeta`/`aRestaura` e `A_TXT_DEFS`.

**O identificador de conciliação fica FORA do sinal.** O comentário 18506-18509 registra que ele é
calculado antes do carrinho existir, só a partir do pacote e do horário, e que essa independência
é a correção do defeito mais caro daquela rodada — extrato com várias cobranças para uma reserva
só. Sinal que entrasse no identificador reabriria o defeito.

Textos novos: `t8`, `t9`, `txtSinalMaior` (com a palavra desta aba — no Checkout é "carrinho", na
Mini loja é "pedido"; frase parecida não é frase única, ver 4269-4271), `txtSinalZero`,
`txtSinalRecusado`.

**A interação com o meio prioritário (rodada A).** Aquela rodada dá à aba um campo de ordem e põe o
preço do Pix em destaque. Com sinal ligado o desconto do Pix é zerado, então "preço do Pix" e
"preço cheio" passam a ser o mesmo número. A tela não pode mostrar duas linhas idênticas nem um
selo de "-0%". **Medir e tratar**, não deixar acontecer.

## Rodada D — sinal no Link de cobrança

**Decisão do dono: por cobrança**, não fixo da página. Coerente com `naoEmite` (5913), que já põe o
desconto do Pix do lado "por cobrança"; o sinal é irmão gêmeo dele.

**O que isso custa, medido.** O sinal viaja no link, logo entra no selo. `seloDe`
(`fc-compartilhado.js` 732-738) conta `[c,d,pp,v]` sempre e `[t,x]` **só quando pelo menos um vem
preenchido**. O comentário 702-729 registra as quatro propriedades, e duas são a ameaça:
apagar `t`/`x` derruba o link, e **acrescentá-los a um link que não os tinha também derruba**.

Portanto o parâmetro novo tem de repetir **exatamente** o padrão condicional do par `t`/`x`: entra
na conta **só quando vem preenchido**, e depois deles. Com isso:

- **Links já enviados continuam válidos** — eles não têm o parâmetro, a conta deles não muda.
  **Provar com links gerados pela versão de hoje sendo aceitos pela versão nova.**
- **O bloco `/pagar` já colado recusará links NOVOS com sinal**, porque a `seloDe` dele não conhece
  o campo. Correção: regerar e recolar o código 1, **uma vez**. Há precedente idêntico, escrito no
  texto de ajuda da `/cobrar` (208): *"Se a página de pagamento ainda estiver com um código 1
  gerado antes desta versão, ela recusa links com desconto."* O dono foi avisado e aceitou.

Doze pontos de emissão, dois deles fora do `index.html`: `pBusca` (compart. 936-946) e `pSeloDeSrc`
(compart. 731-739). Mais `fcTotalPixSrc` (20749), conferência do selo (20819), remontagem (20829),
coerência `|totalPix()-valor|>0.0001` (20845), `fcpg-valor` (20863), `fcpg-pixlinha` (20864),
`createOrder` (20942+), `zapBotao` (21007-21011), `cbCfg`/`pLinkDe` na `/cobrar` (485-489, 738), e
`naoEmite`/`P_LINK_CAMPOS`/`P_TXT_DEFS`.

**Disciplina de versão obrigatória:** mexer em `fc-compartilhado.js` troca a versão em três lugares
(`FC_COMPART_VERSAO`, o `?v=` do `index.html`, o `?v=` mais `FC_COMPART_ESPERADA` em
`cobrar/index.html`) e roda `scripts/conferir-versoes.sh --registrar`. A guarda que as páginas
fazem ao carregar é cega por construção (compart. 40-46).

**A `/cobrar` é o terceiro gerador do mesmo link** (`C.pLinkDe`, 738; `cbCfg`, 485-489). Parâmetro
novo nasce lá também, ou ela passa a gerar links incompletos em silêncio.

**Não generalizar o par `t`/`x` para carregar o sinal.** Foi levantado como caminho que evitaria
mexer no selo, mas a conferência de 20845 exige que `totalPix()` bata com o valor do código Pix
pela conta do desconto — o sinal violaria isso, e essa conferência é uma segunda rede deliberada.
Trocar uma rede por uma economia de trabalho é o que este projeto recusa.

## Rodada E — os três textos que explicam o sinal (pedido do dono, 12/09/2026)

**O pedido, verbatim:** *"a utilização de sinal implica em dar a opção para um cliente em pagar um
sinal para garantir uma reserva, um serviço ou uma produção de algum produto e pagar o restante em
algum momento. Mas para ficar claro isso antes do cliente fazer o pagamento do sinal, seria bem
conveniente termos [três] textos configuráveis que respondam [três] pontos: 1 - o que o sinal
garante? 2 - e se eu desistir? 3 - o que fazer com o saldo a ser pago?"*

Exemplos que ele deu, para uma reserva de ensaio:

1. `O sinal garante o seu horário agendado`
2. `Cancelamento não há devolução do sinal`
3. `O saldo deve ser pago até 1 dia antes do seu ensaio`

**Ele escreveu "dois textos" e listou três pontos com três exemplos.** Vale três — os exemplos são
a evidência mais forte do que ele quer. Registrado aqui para não virar dúvida depois.

### Onde aparecem

Na **tela do cliente**, logo abaixo das linhas de sinal e saldo e **antes dos botões de pagamento**
— é o que "para ficar claro isso **antes** de fazer o pagamento" exige. Não na mensagem do
WhatsApp: ela é confirmação do que já foi pago, e ele pediu a tela de pagamento.

Nos **quatro** construtores, assim que cada um tiver sinal: Checkout, Mini loja, Agendamento por
pacote e Link de cobrança. Só saem quando o sinal está **ligado** — sem sinal não há o que explicar.

### Nascem VAZIOS, e a linha vazia não aparece

Esta é a decisão de desenho que mais importa, e ela contraria o padrão da casa de propósito.

Todo campo de texto deste projeto tem padrão de fábrica, porque o padrão é *"exatamente o que saía
fixo no bloco antes"*. Aqui não existe "antes" — o texto é novo. E, mais importante: **os três são
declarações de política comercial**. Um padrão de fábrica dizendo `Cancelamento não há devolução do
sinal` afirmaria, para um cliente pagante, uma política que o dono pode não ter — e uma política
inventada, exibida numa tela de pagamento, é pior que nenhuma.

Então: os três nascem `value=""`, com os exemplos dele no `placeholder`, e **cada linha só é emitida
quando está preenchida**. Três vazios = nenhuma linha na tela, e o bloco sai exatamente como sairia
sem esta rodada — o que também é o que mantém a regressão byte a byte honesta.

### A guarda que faz o buraco aparecer

Sinal ligado com os três vazios é precisamente a confusão que o pedido existe para evitar. A aba
mostra **aviso âmbar** nesse estado, no mesmo molde do aviso que já existe para o desconto do Pix
com sinal (`u-descpix-aviso`, 1680). Ela não conserta; ela faz o buraco **aparecer** — mesma
família de `fccOrfas` e `fcTxtFabricaDiverge`.

Não é recusa: o dono pode ter motivo para deixar vazio, e recusar o forçaria a escrever algo só
para destravar. Aviso, não tranca.

### Implementação

Três campos por aba, nas tabelas `*_TXT_DEFS` (com padrão vazio, o que a mecânica já suporta —
`fcTxtRestaura` cai no terceiro item da linha, que aqui é `''`). Doze campos ao todo.

Rótulos na ferramenta, escritos como as perguntas que respondem, porque foi assim que ele pensou:

- `O que o sinal garante`
- `E se o cliente desistir`
- `O que fazer com o saldo`

Como o eco do rótulo (rodada de 11/09) é gerado a partir da tabela, os doze já nascem com ele e são
achaveis pela busca — sem trabalho extra.

**Prova obrigatória:** os três vazios não emitem **nada** (saída byte a byte igual à de antes da
rodada); um preenchido emite só ele; os três preenchidos emitem os três, na ordem, **antes** dos
botões de pagamento, conferido pela posição no DOM e não pela aparência. Mais o texto hostil
(apóstrofo, aspas, barra, `</script`) nos doze, com o bloco executando.
