# Pendências — o que ficou combinado e ainda não foi feito

Atualizado em 03/09/2026. Este arquivo é a lista viva; o histórico do que já foi entregue está no `docs/ledger-evolucao-2026-08.md` e nas specs.

---

## O que já foi entregue

Entregues em 22/08/2026: os três itens que estavam aqui — o bloco sempre carregar a matemática do desconto, o "Já paguei" no lugar certo e o "OU" entre as duas formas (`docs/specs/2026-08-22-bloco-sempre-com-desconto-design.md`) — e mais a **conferência do formato da chave Pix**, que saiu do primeiro pagamento real (`docs/specs/2026-08-22-formato-da-chave-pix-design.md`).

Entregue também em 22/08/2026, a pedido do dono: o **contador da barra virou opcional** (`docs/specs/2026-08-22-contador-opcional-design.md`) — a barra pode mostrar só a mensagem, com a contagem correndo por dentro.

Entregue também em 22/08/2026: o **arnês da regressão** saiu da pasta temporária e virou `scripts/verificar/` — um comando (`scripts/verificar/regressao.sh`) compara a árvore de trabalho com qualquer referência.

Entregue também em 22/08/2026: a **guirlanda de Natal**, sexto efeito da aba Bordas (`docs/specs/2026-08-22-borda-natal-design.md`).

Entregue em 23/08/2026: a **página de obrigado do TidyCal** (`docs/specs/2026-08-23-pagina-de-obrigado-tidycal-design.md`) — marcadores no texto da página de confirmação, preenchidos com os dados do agendamento.

Entregue em 24/08/2026: a **nona aba, Efeitos de página** (`docs/specs/2026-08-24-aba-efeitos-de-pagina-design.md`), com o primeiro efeito: **neve caindo**, com alcance de página inteira ou preso a um bloco.

Entregue em 24/08/2026: a **consolidação passou a aceitar N componentes** (`docs/specs/2026-08-24-consolidacao-de-n-componentes-design.md`) — lista de marcação, até cinco outros componentes por página, uma saída numerada para cada.

Entregue em 24/08/2026: a **consolidação passou a entregar o CSS do outro componente** (`docs/specs/2026-08-24-codigo-2-do-outro-componente-design.md`), com o painel consolidado conhecendo a saída nova.

Entregue em 24/08/2026: o **nome da animação passou a sair do conteúdo dela** (`docs/specs/2026-08-24-nome-da-animacao-por-assinatura-design.md`) — dois componentes com o mesmo efeito e parâmetros diferentes convivem agora na mesma página, e dois com a mesma animação passam a colar um bloco só.

Entregue em 24/08/2026: o **selo de destaque na aba Bordas** (`docs/specs/2026-08-24-selo-de-destaque-design.md`) — três formas (faixa, selo circular, fita) mais a ênfase por elevação, para marcar o pacote recomendado. O pulsante ficou de fora por decisão do dono, com a razão registrada.

Entregue em 24/08/2026: o **carimbo de publicação** — a ferramenta diz, embaixo do título, qual versão o navegador está executando e quando ela foi publicada, com a conferência mecânica que impede o carimbo de mentir.

Entregue em 23/08/2026: a **consolidação da página de obrigado no painel**, mais a **regra** de que todo construtor que toca Tag Head, Tag Body ou o CSS de um componente customizado precisa consolidar — e a **rede** que denuncia a saída esquecida.

Entregue em 27/08/2026: o **pedido que chega ao painel do PayPal** (`docs/specs/2026-08-27-pedido-do-paypal-com-item-design.md`) — os três geradores passaram a mandar um item com nome e ID do produto, mais o `custom_id` de conciliação.

Entregue em 25/08/2026: o botão **"Gerar todos os códigos"** no painel consolidado (`docs/specs/2026-08-25-gerar-todos-os-codigos-design.md`) — percorre as abas ligadas na página, com as recusas numa lista só.

Entregue em 25/08/2026: o **marcador `{prazo}`** na barra de contagem (`docs/specs/2026-08-25-marcador-prazo-design.md`) — a data limite ao lado do tempo que falta, com o mesmo destaque do contador.

Entregue em 25/08/2026: o **formato da data da página de obrigado** virou selecionável (`docs/specs/2026-08-25-formato-da-data-do-tidycal-design.md`) — quatro opções, valendo para `{{data}}` e `{{quando}}`, reconhecendo o inglês por extenso e o técnico.

Entregue em 24/08/2026, na mesma aba: a **prévia de celular**, a **proporção do tamanho no celular** (pedido do dono depois de publicar a neve) e mais **três efeitos** — confete caindo, fundo animado (aurora) e luzes piscando. Spec: `docs/specs/2026-08-24-efeitos-proporcao-e-tres-efeitos-design.md`.

Entregue em 01/09/2026: a **validade do cupom na linha do desconto** (`docs/specs/2026-09-01-validade-do-cupom-na-linha-do-desconto-design.md`) — nos dois construtores que têm cupom, Checkout e Mini loja. Cupom com prazo mostra `Válido até: dd/mm/aa` ao lado do rótulo; cupom sem prazo não mostra nada. Junto veio um buraco fechado no arnês: o cenário da regressão não cadastrava cupom nenhum, então todo o caminho do cupom da Mini loja estava fora da fotografia byte a byte.

Entregue em 01/09/2026, na sequência: **todo texto que uma pessoa lê passou a sair acentuado** (`docs/specs/2026-09-01-acentuacao-do-texto-que-o-cliente-le-design.md`) — 24 textos nos blocos do Checkout e da Mini loja, incluindo o rodapé de limites inteiro da loja, mais 9 na tela da própria ferramenta. Continua sem acento, de propósito, a mensagem do WhatsApp e todo código. O arnês ganhou `FC_DUMP=<pasta>`, que grava o texto de cada saída além do hash — é o que permite enumerar o diff de uma rodada em vez de só contar divergências.

Entregue em 01/09/2026, fechando a acentuação: a **mensagem do WhatsApp passou a levar acento** e a **Mini loja passou a ter uma fonte só** para a frase do pedido zerado (`docs/specs/2026-09-01-whatsapp-acentuado-e-frase-unificada-design.md`). A isenção do WhatsApp caiu ao ser medida — estava registrada sem a razão, e nenhuma das três candidatas se sustentou. Os 9 **links** de cobrança saíram byte a byte idênticos: a mensagem é montada no aparelho do cliente e não toca link, selo nem payload. No mesmo dia, a pedido do dono, **o Checkout também passou a ter uma frase só** para o pedido zerado — a customizável —, provado nos três modos de pagamento.

**Opção registrada, não implementada:** mandar tambem o `invoice_id` ao PayPal. Ele apareceria no histórico e nos e-mails do comprador, mas é **único por conta** — a segunda cobrança com o mesmo identificador seria recusada. Serve como trava contra pagamento em duplicidade; é decisão do dono.

Entregue em 02–03/09/2026: a **décima aba, Agendamento por pacote** (`docs/specs/2026-09-02-agendamento-por-pacote-design.md`, doze decisões em `docs/decisoes-2026-09-02-agendamento-por-pacote.md`) — vitrine de dois passos com iframe único sob demanda, os N endereços de redirecionamento e a página de obrigado com pagamento e prazo de reserva. A rodada foi partida em duas entregas; a verificação final (Tarefa 11) unificou `precoPix`/`parcelaDe`/o texto da linha do cartão/a serialização do catálogo entre os dois geradores (prova byte a byte das três saídas, antes e depois), colocou a aba na fotografia da regressão (`scripts/verificar/geradores.mjs`, com dois pacotes de propósito para exercitar o arredondamento da parcela nas duas direções) e corrigiu, ao rodar as varreduras de sanidade, dois defeitos deixados por rodadas anteriores: um `<script>` cru dentro de um comentário de `aBlocoObrigado` e uma palavra acentuada dentro de outro comentário — nenhum dos dois mexia em lógica, e a regressão das 21 saídas antigas continuou idêntica à `main`. O que ficou de fora está nas duas seções abaixo.

Entregue em 03/09/2026: a **v2 da décima aba**, a revisão do dono sobre a v1 já publicada (`docs/specs/2026-09-02-agendamento-por-pacote-design.md` §0, quatro decisões revisadas + duas novas em `docs/decisoes-2026-09-02-agendamento-por-pacote.md`; plano: `docs/superpowers/plans/2026-09-03-agendamento-por-pacote-v2.md`). O bloco de pagamento passou a espelhar o **Checkout** em vez da `/pagar` (com opcionais, quantidade e cupom, e o link do TidyCal virou **caminho**, não URL inteira); duas fontes únicas foram extraídas **antes** da aba nova, para cada uma ser provada isoladamente — o pedido do PayPal (Checkout e Mini loja, `u-out`/`m-out`/`p-out1` byte a byte idênticos antes e depois) e o desenho do QR Code (molde da `/pagar`, consumido por Checkout, Mini loja, `/pagar` e a aba `pac` — **esta muda `u-out`/`m-out` de propósito**, corrigindo dois defeitos reais do Checkout: `new QRCode(...)` sem `try/catch` e a corrida do `qrPronto`). Cupom repetido passou a ser recusado também no Checkout e na Mini loja, e a quantidade dos opcionais passou a funcionar de verdade no pagamento (antes, a marcação existia e não fazia nada). A prévia não precisou de nenhuma linha nova — ela executa `aBlocoObrigado` diretamente, então herdou opcionais/quantidade/cupom no mesmo commit que os criou. Verificação final (Tarefa 7): o cenário da regressão passou a cadastrar um opcional com quantidade e um cupom com validade na aba `pac` — sem isso, os caminhos novos ficavam fora da fotografia byte a byte; `scripts/verificar/regressao.sh` contra a `main` (que já tem a v1): 4 divergências, todas explicadas (`u-out`, `m-out`, `a-out1`, `a-out3`), as outras 20 saídas e as 9 cobranças idênticas. O que ficou de fora está nas duas seções abaixo.

Entregue em 03/09/2026: **todo texto que o cliente final lê virou campo**, nas oito abas que têm texto que o cliente lê — Bordas com efeito e Efeitos de página não têm nenhum (documentação: `docs/documentacao-fotocerta.md` §4, "Todo texto que o cliente lê virou campo"; plano: `docs/superpowers/plans/2026-09-03-rodada-unica-textos-e-familias.md`; as decisões sobre os 17 duvidosos: `docs/decisoes-2026-09-03-textos-configuraveis.md`). São **157 campos** em oito tabelas `*_TXT_DEFS`, uma por aba, cada uma servindo ao mesmo tempo o `cfg()`, a persistência e o padrão de preset antigo; o texto de fábrica das frases repetidas entre abas passou a sair de uma tabela só (`FC_TXT_FABRICA`), com um campo por aba para o dono poder divergir de propósito. Junto vieram `aTplJs`/`escJsD` (que reconstroem em tempo de geração a concatenação que o texto fixo já escrevia, para o bloco entregue não engordar na configuração de fábrica), a seção recolhida por padrão (`.secao dobra`/`fcdLigar`) e `fcTxtFabricaDiverge`, a guarda que acende a barra vermelha quando o `value=` do HTML e a tabela da aba discordam sobre o padrão.

O que cada parte provou: **a regressão byte a byte** (`scripts/verificar/regressao.sh`) foi rodada ao fim de cada etapa contra a referência anterior, e toda divergência está nomeada no commit correspondente, ligada à decisão que a autorizou — D-1 (`{PCT}` → `{pct}`, com a leitura aceitando as duas grafias), D-2 e D-3 (a frase inteira no campo, em vez do sufixo colado por fora), D-5 (`{n}` nos avisos de carrinho), D-11 (`Próxima foto` acentuado), o aviso do Pix novo nas quatro abas, o `c-out1` da correção de D-13 e os dois rótulos de seção da `/pagar`. Fora dessas, as demais saídas e as 9 cobranças saíram **byte a byte idênticas**, que é o invariante que a rodada existia para não quebrar. Na Etapa 1, o mesmo invariante foi conferido também **nos cenários que a fotografia não exercita** (a vitrine no modo "somente PayPal"). A **prévia da vitrine ganhou o alternador computador/celular** (Etapa 6, mesclada de `pac-previa-celular`), com as 24 saídas byte a byte idênticas — mexer na prévia não pode mudar um byte do que a ferramenta gera, e não mudou. E um ponto foi provado **com o bloco rodando de verdade**, porque a regressão não alcançaria: depois da separação entre a identidade da unidade e o sufixo visível (D-12), o marcador do relógio continua se remontando ao cruzar 24h **com os sufixos de fábrica, vazios e repetidos** — se o dono tivesse ficado com a identidade, dois sufixos iguais parariam a remontagem em silêncio.

Entregue em 03/09/2026, fechando a mesma rodada: as **famílias de pacotes na aba `pac`** (documentação: `docs/documentacao-fotocerta.md` §4, "Famílias de pacotes na aba `pac`"; desenho: `docs/superpowers/plans/2026-09-03-rodada-unica-textos-e-familias.md`, item 7 e a revisão do desenho; commits `f393dea` e `540ab53`). A família virou o **passo 1** da vitrine — o caso real é o aluguel do estúdio para fotógrafos parceiros, com pacotes por duração separados entre dias úteis e fins de semana/feriados, estes mais caros. `aFamilias` é lista irmã de `aPacotes`, e cada pacote aponta para a família **pelo `id`**, nunca pelo nome; o `id` é determinístico (`'F'+(maior+1)`).

O que cada parte provou:

- **O colapso para dois passos**, na primeira etapa da regressão: com **uma** família, das 24 saídas e das 9 cobranças **só `a-out1` mudou**, e só nos dois trechos previstos (as regras do formato compacto dentro da `@media` e a classe da caixa de preço). Nenhum `var FAMILIAS=`, nenhum `fam:` dentro de `PACOTES`, nenhum terceiro passo — que era exatamente o que a leitura do diff existia para conferir.
- **A parametrização de `aPacotesSrc`**, na segunda etapa: o cenário de `scripts/verificar/geradores.mjs` ganhou a segunda família (`F2`, "Fins de semana") e um terceiro pacote nela, porque sem isso todo o caminho novo ficava **fora** da fotografia byte a byte. Depois disso, das 24 saídas só as três da aba `pac` diferem; `a-out2` e `a-out3` diferem **pelo terceiro pacote**, e `a-out3` continua **sem** o campo `fam` — a prova de que a página de obrigado não ganhou o que não pediu. As 9 cobranças, bloco e link, idênticas.
- **A migração**, pelos três caminhos (estado do navegador, preset antigo, arquivo de "Exportar tudo" antigo): um aviso, uma vez, que **não repete na recarga**, com os pacotes na família "Pacotes" e nada perdido — e **nenhum alerta em estado limpo**, que é obrigatório porque o arnês limpa o `localStorage` antes de cada passagem e coleta os alertas: um aviso ali viraria divergência na fotografia, e o dono veria na tela o aviso de uma migração que não aconteceu.
- **O conserto do "Exportar tudo"** (abaixo, item 8): o mesmo arquivo v1, a referência descarta **9** itens e a árvore nova descarta **7** — a diferença são os dois `link`, que agora sobrevivem e alimentam a migração.

A próxima rodada sai do que o dono encontrar no uso.

---

## O que depende só do dono

Em 23/08/2026 o dono fechou os **sete** itens desta lista. Dois itens novos entraram em 02–03/09/2026, com a décima aba.

O sétimo dos antigos — atualizar o espelho da Tag Body da hospedeira — foi resolvido **eliminando a causa**: os espelhos deixaram de existir. Ao classificar o que havia em `prosite/`, tudo era reproduzível pelos construtores, inclusive a âncora inteligente e o plano B. Ver a decisão registrada na `CLAUDE.md` e na documentação.

### Novo em 02–03/09/2026, décima aba

- **Colar os três códigos gerados e criar os tipos de agendamento no TidyCal**, cada um com o endereço de redirecionamento que a saída 2 (`a-out2`) gera para ele — a aba não sabe fazer isso sozinha, porque o cadastro dos tipos é do lado do TidyCal.
- **Confirmar como o modal do TidyCal se comporta dentro do bloco novo, numa página já publicada.** É a única incógnita que não se responde daqui: o bloco cria o iframe com as próprias mãos (ao contrário da aba TidyCal, que usa o `embed.js` deles), herdando só a origem e o prefixo dos sinais que eles emitem — mas o comportamento real do modal, num navegador de verdade, só se vê publicado. Se o modal aparecer **cortado**, a saída é ligar `ALTURA_SEMPRE=true` no topo do bloco (comentário explicando o custo: um vão vazio embaixo do calendário) e regerar.

### Fechado em 23/08/2026, com o que cada um provou

- **O código 1 recolado na `/pagar`**, com a chave Pix corrigida. Fecha de uma vez a chave certa, a conferência do desconto e o layout novo ("Já paguei" no Pix e o "OU").
- **Cobrança real de R$ 0,01 paga pelo app do banco.** É o único trecho do caminho que nunca foi verificável daqui, e ele fecha o percurso inteiro: link gerado → página remonta e aceita → aplicativo do banco processa.
- **A configuração foi levada para o celular** por *Exportar tudo → Com os dados* / *Importar*.
- **A página de obrigado foi colada e testada com um agendamento de verdade** — e com ela caem as **duas incógnitas** que a spec declarava: o editor de texto do Prosite **aceita** `{{` e `}}` sem transformar, e a **Tag Body roda a tempo** dos componentes do tema.
- **A `/cobrar` na tela de início do iPhone**, com ícone e abertura em tela cheia. Fecha a pendência de PWA que estava aberta desde ago/2026.

---

## Em observação, sem ação por enquanto

**Janela voltando a tela cheia.** O dono relatou em 22/08/2026 que a `/cobrar` no computador voltava a ocupar a tela inteira alguns segundos depois de ele redimensionar a janela. Descartado no código: **nenhuma chamada a `resizeTo`, `moveTo` ou `requestFullscreen`** em `index.html`, `cobrar/index.html` ou `fc-compartilhado.js`; o manifesto pede `standalone`, não `fullscreen`; e a `.faixa` tem `max-width:560px` centralizada. Não voltou a acontecer. Ele avisa se repetir.

---

## Dívidas registradas, pequenas, sem dono

Em 23/08/2026 o dono pediu que **todas** fossem feitas. Ficou uma, e ela é dele:

1. **A Tag Head da landing de Natal pode ainda ter a regra antiga de movimento reduzido** (`[style], * { animation-duration: 0.01ms !important }`), que mata toda animação **daquela página** para quem pede menos movimento. Quem a substitui é o **código 1 da aba Bordas com efeito**: gerar com o efeito em uso e colar no lugar do bloco antigo. Não é urgente, e o alcance é de uma página só — não do site, porque **o Prosite não tem cabeçalho global**.

### Novas em 03/09/2026, décima aba v2

2. **A `/pagar` continua com a própria cópia do pedido do PayPal (`actions.order.create`)**, e isso é decisão, não esquecimento — medida ao extrair a fonte única (Task 1 do plano v2): o Checkout e a Mini loja montam o item a partir de um carrinho (`subtotal()`/`somaProdutos()`/`cupomAtivo`); a `/pagar` monta de um item único vindo do link, sem carrinho nenhum. O esqueleto comum aos três (SDK, `style` dos botões, guarda de total zero, `purchase_units`, `onApprove`, `onError`) foi extraído e é consumido pelo Checkout e pela Mini loja; puxar a `/pagar` para dentro também exigiria mexer numa saída que já está publicada cobrando, fora do escopo desta rodada — e o ganho seria pequeno, porque a `/pagar` já é a mais simples das quatro. Extração completa fica registrada aqui, não forçada.
3. ~~**Dois defeitos pré-existentes do Checkout**~~ — **FECHADOS, e a dívida era do registro, não do código.**
   Ao ir consertá-los em 03/09/2026, a medição mostrou que os dois já tinham sido corrigidos no
   dia anterior, pelo commit `cc5aaae`: `uProdRender` já troca a palavra inteira
   (`ops.length>1?' opcionais':' opcional'`), `uProdSalvar` já diz `'Informe o preço do
   produto.'` e `uCpPctErro` já é a versão acentuada e **sem a marca** ("o pagamento recusa a
   cobrança zerada").

   O que sobrava eram **três comentários dentro do `index.html`** ainda afirmando que o defeito
   existia — um deles dizendo, textualmente, *"Nao mexido no original por estar fora do arquivo
   desta tarefa"*. Foram corrigidos para dizer o que é verdade hoje, com o commit que fechou
   cada um.

   **A lição, e ela é a mesma da dívida 7:** registro que descreve como pendente o que já foi
   feito é pior que registro ausente — ele **manda procurar no lugar errado**, e quem o lê
   confia. Duas vezes em dois dias. Ao fechar um item, fechá-lo em **todos** os lugares que o
   descrevem: a lista, e os comentários do código que apontam para ele.

   Sobrou uma **terceira cópia da mesma família**, essa de verdade: `mCpPctErro` (Mini loja)
   ainda tem a mensagem sem acento que o Checkout já perdeu. E, ao lado dela, `mCpRender` não
   mostra a validade na lista de cupons — o Checkout e a `pac` mostram — e os seus campos de
   código e valor não chamam `salvarEstado()`/`mPreview()`.

### Novas em 03/09/2026, rodada dos textos configuráveis

Três textos que o cliente final lê **continuam cravados**, e as três exclusões são decisão registrada, com a razão — não esquecimento. As duas primeiras estão em `docs/decisoes-2026-09-03-textos-configuraveis.md` (D-6 e D-14).

4. **A descrição do pedido que chega ao PayPal** não virou campo. O critério de 03/09 pega (o cliente lê essa descrição no PayPal e no recibo), mas ali não é tela do bloco e sim **payload de pagamento**: edição errada só aparece numa cobrança de verdade, com dinheiro no meio, e a rodada já era grande. **Dívida consciente.**
5. **Os nomes de mês e de dia da semana** (três tabelas, doze e sete itens) não viraram campo porque são **tradução, não customização** — ninguém troca "janeiro" por flexibilidade. Se um dia o site for para outra língua, é aqui que se mexe, e aí a rodada é essa, com as três tabelas juntas.
6. **Os dois `aria-label` do seletor de quantidade** — `Diminuir a quantidade` e `Aumentar a quantidade` — moram na fonte única `fcFazQtdSrc`, que serve **três** abas ao mesmo tempo (Checkout, Mini loja e Agendamento por pacote). Torná-los configuráveis por aba exigiria parametrizar a fonte e mexer nos três geradores; um campo só para as três seria a fábrica única sem a liberdade por aba, que é justamente o oposto da regra desta rodada. Fica como está, declarado.
7. **O cenário da regressão não preenche nenhum campo de texto.** Medido na árvore em 03/09/2026: `scripts/verificar/geradores.mjs` não escreve em nenhum `*-txt-*`, então a fotografia byte a byte prova **o caminho de fábrica** e nada diz sobre o caminho configurado — um texto que o gerador deixasse de emitir, ou emitisse escapado errado, passaria pela regressão sem acusar. É a mesma armadilha já registrada três vezes neste arquivo (o cupom da Mini loja em 01/09, `t-out4`/`t-out5`, a própria aba `pac` na v1): **cenário que não exercita um caminho não prova nada sobre ele.** **FECHADA na mesma rodada, algumas horas depois de registrada** (commit `bff63ba`): o cenário ganhou uma **segunda passagem, a configurada**, com 28 textos escolhidos por critério — um por aba (Bordas e Efeitos de página não têm campo de texto), todos os tipos de marcador, e os quatro caminhos de escape, incluindo um texto com `</script` para provar que a blindagem do manual do Prosite resiste ao que o dono digitar. Cada valor leva um selo que o arnês procura nas saídas; texto sem vestígio é tratado como defeito, e os **quatro** presos a ramo que o cenário não percorre estão declarados com o motivo, conferidos nos dois sentidos. **Achou de primeira o defeito que existia para achar:** os quatro avisos de item sumido da Mini loja concatenavam o número em vez de trocar o marcador, e o cliente leria `2 {n} itens do seu carrinho saíram do catálogo` — marcador cru na tela.

### Novas em 03/09/2026, rodada das famílias

8. **Os campos numéricos da aba `pac` são gravados como TEXTO, e a conferência da importação recusa por tipo — achado ao medir o conserto do `link`, e NÃO consertado.** `aColeta()` lê cada numérico por `aElVal(id, padrão)`, que devolve `el.value` — sempre uma **string**, mesmo o `<input type="number">`. São `prazoh`, `descpix`, `parcelas`, `altdesk`, `altmob`, `largmob` e `qtdmax`: **sete** antes desta rodada, **oito** com o `largcards` que ela acrescentou. Como o molde da conferência é uma fotografia do próprio `aColeta()` (`fcxMolde` chama `fcPresetCapturar`), o molde diz "string" para os oito; e `fcxConformar` compara `typeof` e recusa quando não bate (`index.html`, `if(typeof v!==t)return {ok:false}` dentro do ramo `string|number|boolean`). Consequência: um arquivo de "Exportar tudo" **gerado por outra ferramenta, ou editado à mão** com os números crus (`"prazoh": 24` em vez de `"prazoh": "24"`) perde os oito campos **em silêncio** — eles somem do fragmento, a aba volta aos padrões, e a única pista é o contador dizendo *"N item(ns) do arquivo NÃO foram reconhecidos e ficam de fora"*, **sem dizer quais**. O número foi medido nas duas árvores ao escrever o teste da migração: sete descartes que nada têm a ver com famílias.

   **Existe igual antes desta rodada** — é a forma como `aColeta` sempre gravou, e o mesmo padrão vale para os numéricos das outras abas —, e por isso não foi consertado aqui: a rodada era das famílias, e mexer no tipo do que `aColeta` grava muda o **formato do arquivo de backup** de todas as abas de uma vez, com a compatibilidade dos backups já existentes junto. Os dois consertos possíveis, para quando houver rodada: converter no `aColeta` (`parseFloat`), que muda o formato gravado, ou fazer `fcxConformar` aceitar a string que representa o número do molde, que não muda. O terceiro conserto, independente dos dois e mais barato, é a mensagem **dizer quais** chaves ficaram de fora, em vez de só contá-las — o contador existe para o operador confiar no número, e um número sem nome não dá o que conferir.

### Fechadas em 23/08/2026

Spec: `docs/specs/2026-08-23-dividas-pequenas-design.md`.

- **A recusa da chave Pix agora abre o painel Identidade e leva o foco ao campo** — as três recusas de "chave errada", não só a de campo vazio.
- **As regras de CSS do PayPal só saem quando o bloco tem PayPal.**
- **O nome de um item opcional não fica mais vazio** no editor em linha do Checkout e da Mini loja: ele se corrige à vista.
- **O arnês que executa os blocos entregues virou molde versionado** (`scripts/verificar/pagina.mjs`), com as duas armadilhas que custaram caro registradas dentro dele.

Junto delas, uma correção que não era dívida e sim **texto falso**: a ferramenta afirmava em onze lugares que existe um cabeçalho global do site, e um deles dava um caminho de menu inexistente. O Prosite só tem Tag Head e Tag Body **por página**.

---

## Combinado em 03/09/2026 — os três itens, todos entregues

Os três itens combinados em 03/09/2026 saíram na mesma rodada e estão descritos acima, na lista de entregues:

- **O aviso de que o Pix não confirma sozinho, nas quatro abas de pagamento** (item 1) — configurável, dentro da área do Pix e logo acima do "Já paguei", com o texto próprio da aba `pac` (aquela página não tem esse botão) e sem emissão nenhuma onde o botão do WhatsApp está desligado.
- **As famílias de pacotes na aba `pac`** (item 2) — opção A dos mockups: a família é o passo 1, e quem tiver uma família só continua vendo dois passos, sem passo vazio. Mockups apresentados em 03/09/2026 (quatro opções, celular, com a troca de pacote em foco): https://claude.ai/code/artifact/a83e1f73-53d9-4868-a8c6-243cf591963b
- **O subtítulo opcional da vitrine, com `{pct}`** (item 3) — vazio, que é o padrão, não emite regra de CSS, `div` nem variável: a vitrine de fábrica sai byte a byte como antes.

---

## A lição de método desta rodada

**Quando um campo "não faz nada" na configuração padrão, a resposta costuma ser explicar onde ele age — não fundi-lo com outro.**

A decisão D-13 foi minha e estava errada. Ela mandou o formato **compacto** do relógio da Contagem regressiva ler os mesmos quatro campos de rótulo que o formato "blocos" usa, porque do jeito que estava aqueles quatro campos não apareciam em lugar nenhum da tela na configuração de fábrica. O que ela não notou é que os padrões daqueles campos são **por extenso** (`dias`, `horas`, `min`, `seg`), justamente porque é assim que o formato "blocos" os mostra — e o compacto é o formato **padrão** da aba. Resultado: o relógio de fábrica passou de `02d:14h:33m:12s` para `02dias:14horas:33min:12seg`. A rodada mudou a aparência de um bloco já em uso, que era exatamente o que ela existia para não fazer.

A correção certa (commit `455c938`) foi dar ao formato compacto os **seus próprios quatro campos** e pôr, ao lado de cada grupo, uma linha de ajuda dizendo a qual formato ele serve. Custou desfazer trabalho já feito e reescrever os textos de interface que D-13 tinha ajustado no caminho errado (o rótulo do rádio de formato e a ajuda da seção de textos voltaram a descrever o que a barra faz).

Duas coisas ficam para as próximas rodadas:

1. **Campo que parece inútil é sintoma de explicação faltando, não de campo sobrando.** A queixa original ("estes quatro campos não fazem nada no formato padrão") era legítima; a resposta é dizer onde eles agem, e não estender o alcance deles até que façam algo.
2. **Toda decisão de "unificar dois campos" tem de ser conferida contra o padrão de fábrica dos dois**, não só contra o que eles significam. Aqui os dois significavam "o rótulo da unidade" e mesmo assim os padrões eram incompatíveis — a incompatibilidade estava no valor, não no conceito, e só apareceu quando o relógio foi lido na tela.
