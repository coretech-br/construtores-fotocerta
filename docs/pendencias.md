# Pendências — o que ficou combinado e ainda não foi feito

Atualizado em 03/09/2026. Este arquivo é a lista viva; o histórico do que já foi entregue está no `docs/ledger-evolucao-2026-08.md` e nas specs.

---

## Nada em fila para a próxima rodada

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

A próxima sai do que o dono encontrar no uso.

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
3. **Dois defeitos pré-existentes do Checkout, achados ao ler o código desta rodada e não corrigidos, por estarem fora do escopo** (o arquivo é do Checkout, a tarefa era da aba `pac`):
   - `uProdRender` (index.html:10636+) escreve o plural de "opcional" como `nome+'is'`, o que produz **"2 opcionalis"** em vez de "2 opcionais" — achado ao escrever o mesmo resumo para a aba `pac`, que usa a troca de palavra inteira (`'opcional'`/`'opcionais'`), correta.
   - `uProdSalvar` (`alert('Informe o preco do produto.')`) e `uCpPctErro` (index.html:10703, a recusa de cupom acima de 100%) têm mensagens **sem acento**, fora da norma de 01/09/2026 (texto que o cliente lê sai acentuado); a versão da aba `pac` (`aCpPctErro`) já nasceu acentuada e, por sinal, sem citar "PayPal" — a versão do Checkout ainda menciona a marca ("o PayPal recusa a ordem"), o que a v2 também evitaria se o arquivo estivesse no escopo.

### Fechadas em 23/08/2026

Spec: `docs/specs/2026-08-23-dividas-pequenas-design.md`.

- **A recusa da chave Pix agora abre o painel Identidade e leva o foco ao campo** — as três recusas de "chave errada", não só a de campo vazio.
- **As regras de CSS do PayPal só saem quando o bloco tem PayPal.**
- **O nome de um item opcional não fica mais vazio** no editor em linha do Checkout e da Mini loja: ele se corrige à vista.
- **O arnês que executa os blocos entregues virou molde versionado** (`scripts/verificar/pagina.mjs`), com as duas armadilhas que custaram caro registradas dentro dele.

Junto delas, uma correção que não era dívida e sim **texto falso**: a ferramenta afirmava em onze lugares que existe um cabeçalho global do site, e um deles dava um caminho de menu inexistente. O Prosite só tem Tag Head e Tag Body **por página**.

---

## Combinado em 03/09/2026, ainda nao feito

### 1. O aviso de que o Pix nao confirma sozinho, nas quatro abas

Hoje **so a Mini loja** diz ao cliente que o Pix estatico nao avisa ninguem e que a
conferencia e manual. O Checkout, a `/pagar` e a aba `pac` ficam calados: o cliente paga,
a tela nao muda, e ele pode sair achando que o sistema ja sabe -- e cobrar do dono uma
confirmacao que a pagina nunca prometeu.

Decidido pelo dono em 03/09/2026, depois de a diferenca ser explicada: **as quatro abas
recebem o mesmo tratamento**, e o texto e **configuravel**, como todos os outros. Entra na
mesma mecanica de `A_TXT_DEFS` / equivalentes por aba.

O ponto de partida e a frase que a Mini loja ja usa -- padronizada, nao copiada as cegas:
o texto tem de servir para as quatro (a `/pagar` cobra item unico, as outras tres tem
carrinho).

### 2. Familias de pacotes na aba `pac` -- desenho escolhido: familia como passo 1

O caso real do dono e **aluguel do estudio para fotografos parceiros**: pacotes por duracao
(1h, 2h, 4h, diaria), separados em **dias uteis** e **fins de semana/feriados**, estes com
preco maior. Oito pacotes numa vitrine so, no celular, e rolagem demais.

Mockups apresentados em 03/09/2026 (quatro opcoes, celular, com a troca de pacote em foco):
https://claude.ai/code/artifact/a83e1f73-53d9-4868-a8c6-243cf591963b

**Escolha do dono: opcao A -- a familia e o passo 1.** O fluxo passa a ser
`escolher a familia -> escolher o pacote -> agendar`, tres passos numerados. As familias sao
**definidas pelo dono**, com o nome que ele quiser; quem tiver uma familia so nao ve passo
a mais (a vitrine volta a ser de dois passos, como hoje).

O que isso implica, e que precisa de rodada propria:

- **Forma dos dados muda**: hoje `aPacotes` e uma lista plana. Passa a existir um cadastro
  de familias, e cada pacote aponta para uma. Migracao obrigatoria para quem ja gravou
  configuracao sem familia (mesmo padrao da migracao `link` -> `path` da v2).
- **Volta do passo 2 para o 1** ("trocar de pacote") e **volta do 1 para a familia**: no
  mockup sao duas linhas de resumo, cada uma com seu botao. O texto dos botoes tambem
  configuravel.
- **Titulo do passo novo** entra junto de `a-t2`/`a-t3`, que ja sao configuraveis.
- O dono gostou da **estrutura de passos numerados com o titulo ao lado** e quer esses
  textos configuraveis -- ja sao, e os novos nascem assim.
- **Painel consolidado, preset da aba e regressao byte a byte** acompanham, como sempre.

### 3. Subtitulo da vitrine (aba `pac`), com marcador -- aprovado em 03/09/2026

O bloco vai hoje do titulo (`a-t1`, ja configuravel) direto para o passo 1. O dono viu um
subtitulo nos mockups de 03/09 -- que era invencao do mockup, nao existia na ferramenta -- e
pediu que existisse.

**Campo novo, OPCIONAL**: em branco, nada e desenhado e o bloco fica identico ao de hoje
(byte a byte, com a configuracao de fabrica). Preenchido, sai uma linha abaixo do titulo.

**Com marcador `{pct}`**, decidido pelo dono depois de a armadilha ser explicada: subtitulo
com o percentual digitado a mao (`"...5% de desconto"`) passa a MENTIR no dia em que o
desconto do Pix mudar no campo de configuracao -- sem erro, sem aviso. O marcador e trocado
na hora de gerar e acompanha sozinho.

**Convencao: chave simples, como o resto da aba** (`{pct}`, `{valor}`, `{n}`, `{data}`, de
`A_TXT_DEFS` e de `TXT_PRAZO`/`TXT_VENCIDO` na aba Link de cobranca) -- NAO as chaves duplas
`{{...}}` da pagina de obrigado, que sao outro mecanismo: aquelas viajam ate o navegador e
sao trocadas em tempo de execucao pelo que o TidyCal manda na URL; esta e trocada na
ferramenta, na hora de gerar, pelo valor que ja esta na configuracao. Mesma aparencia,
momentos diferentes -- por isso a chave simples, que e a das trocas em tempo de geracao.
