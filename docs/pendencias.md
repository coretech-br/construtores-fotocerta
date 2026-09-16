# Pendências — o que ficou combinado e ainda não foi feito

Atualizado em 03/09/2026. Este arquivo é a lista viva; o histórico do que já foi entregue está no `docs/ledger-evolucao-2026-08.md` e nas specs.

---

## O que já foi entregue

Entregue em 15/09/2026: a **décima primeira aba, Calculadora de álbum** (`docs/specs/2026-09-15-aba-calculadora-de-album-design.md`). Substitui a calculadora escrita à mão que vivia num `<iframe srcdoc>` travado em 560 px na página de álbuns — fora do painel consolidado e sem nenhum parâmetro configurável pela ferramenta. A aba nova torna configuráveis o preço por foto, os tamanhos (com a média de fotos por lâmina, o mínimo de fotos e o SKU de cada um), as faixas de desconto por quantidade de lâminas, os acabamentos opcionais e **todos** os textos da tela, inclusive os dos botões; e traz o pacote de pagamento das quatro abas irmãs (Pix com QR e copia e cola, PayPal item a item, sinal com os três textos, meio prioritário, desconto no Pix, upsell, tamanho do QR, resumo copiável e "Já paguei"). Provado contra as **2.760 combinações** da calculadora publicada, lidas da tela dos dois lados: zero divergências.


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

## Entregue em 03/09/2026 — o endereço completo do TidyCal (2026-09-03b)

O dono tem **domínio próprio** no TidyCal (`agendamento.fotocerta.com.br`) e pediu para colar
o endereço inteiro no campo, em vez do pedaço depois de `tidycal.com/`. As duas abas que usam
o campo passaram a aceitar as duas formas; quem já tinha o caminho cadastrado é migrado na
abertura, com aviso, uma vez.

**O pedido era o campo; o risco era outro.** Os dois blocos filtram por **origem** as mensagens
que o TidyCal manda de dentro do iframe, e o filtro estava cravado em `https://tidycal.com`.
Com domínio próprio, **todo sinal seria descartado** — o calendário apareceria e não se
ajustaria, sem erro no console e sem nada na tela. A origem passou a derivar do endereço: em
tempo de geração na aba `tidy` (um endereço por bloco) e em tempo de execução na aba `pac`,
onde pacotes podem estar em domínios diferentes e o iframe é um só (`origemCal`).

**Uma medição mudou o desenho.** O `embed.js` do TidyCal monta o `src` como
`'https://tidycal.com/'+data-path` — o host é cravado **dentro dele**, e o arquivo servido pelo
domínio próprio é byte a byte o mesmo do CDN. Logo, com domínio próprio não existe `data-path`
que aponte para a página certa, e o bloco passa a criar o próprio iframe. **O preço está
escrito no bloco gerado:** sem o `embed.js` não vem a biblioteca que ajusta a altura sozinha.

**A guarda mudou de natureza.** Antes ela garantia que o host "nunca sai de `tidycal.com`";
agora o host é o que o dono digitar, então ela exige `https`, host com ponto, e recusa `@` no
host, esquema estranho e caractere perigoso. O que ela **não** pode fazer — dizer se o domínio
é o dele — está escrito na aba: conferir no botão de teste deixou de ser extra e virou
obrigação.

**Prova:** uma divergência, `a-out1` nas duas passagens, que é a origem virando variável.
`t-out1..t-out5` e `a-out3` **idênticos** — quem está em `tidycal.com` não ganha bloco novo.
Mais 74 verificações com os blocos rodando, incluindo o caso **negativo** (sinal de outra
origem recusado), sem o qual o filtro poderia ter sido apagado e o teste passaria igual.

**Confirmado pelo dono depois:** `tidycal.com` e o domínio próprio **convivem** — o endereço
original continua respondendo. Por isso ele fica no formato `tidycal.com/usuario/nome` na aba
TidyCal, que é o único caminho com altura automática. Na aba `pac` a escolha é indiferente: ela
nunca usou o `embed.js`, e por um motivo anterior a domínio próprio (o endereço muda quando o
cliente troca de pacote, e o `embed.js` cria o iframe uma vez só).

---

## Entregue em 03/09/2026 — a leva dos achados

Sob a regra nova do dono (*"o que for identificado pelo caminho, registra, resolve e publica
na nova versão"*), a lista de dívidas pequenas foi **zerada** nesta leva, com uma exceção
declarada no fim. O que saiu:

- **As três dívidas da lista de cupons da Mini loja.** A descrição de uma delas estava errada
  e a medição corrigiu: o valor **não** se perdia (uma rede global de gravação o pegava) — o
  que se perdia era a **prévia**, que continuava mostrando o valor antigo enquanto o código
  gerado já levava o novo. Defeito pior de enxergar que o descrito. Junto, a **validade** do
  cupom voltou a aparecer na lista (estava sendo gravada e nunca mostrada).
- **A quantidade do opcional no recibo do PayPal**, na página de obrigado: o pedido cobrava
  3× e escrevia o nome sem o `x3`. Uma linha, provada lendo o pedido de verdade que o bloco
  monta. E, junto, **opcional com quantidade zero** deixou de entrar no nome (saía
  `Album 20x30 x0`, cobrando zero).
- **As 118 frases de interface sem acento**, achadas por um detector novo e versionado
  (`scripts/verificar/acentos.mjs`) que lê o JavaScript **como código** — enxergando frase
  montada em pedaços, que a varredura anterior perdia — e tira o vocabulário da **própria
  árvore**: palavra já escrita certa em algum lugar vira a referência para achar a errada em
  outro. Três tinham irmã e foram copiadas; **as outras 115 foram só acentuadas, nenhuma
  reescrita** — a tarefa era acentuação, não melhoria de texto.
- **A ordem das caixas** (spec: `docs/specs/2026-09-03-ordem-logica-das-abas-design.md`).
  Seis abas estavam certas. Três não: a aba `pac` virou duas seções numeradas (famílias antes
  de pacotes), o Slideshow juntou os dois passos da importação numa caixa, e a Mini loja pôs a
  fonte antes do consumidor. **O número da seção deixou de ser digitado**: `fcSecoesNumerar()`
  o escreve pela posição, e as sete citações apontam pela chave — mesma armadilha que
  `ABAS.length` já tinha resolvido para a contagem de abas.
- **O laço de quantidade da Mini loja** virou peça única, no molde das irmãs (`m-out` idêntico
  byte a byte, que é a prova de que a extração não mudou a saída).
- **A dependência implícita** entre as três `*CpCodAjustar`: gravavam por tabela, contando com
  um ouvinte a 14 mil linhas dali.
- **O formulário inacabado sobrevive à recarga**, nas três abas — com o índice de edição
  junto, porque restaurar os opcionais sem saber que o dono estava **editando** um item, e não
  criando um novo, seria pior que perder: ele clicaria em "Adicionar" e duplicaria. E a tela
  diz que o formulário está pendente, nomeando o item.

**Prova da leva:** `regressao.sh main` → **2 divergências, as duas em `a-out3`**, que são as
duas mudanças intencionais do recibo do PayPal. As outras 23 saídas e as 9 cobranças, byte a
byte idênticas, nas duas passagens. Mais as cinco suítes de navegador (`cupom-minimo` 68,
`textos-escape` 51, `lista-cupons` 51, `pac-quantidade` 44, `acentos` limpo).

### O que ficou, e é decisão do dono

**Aplicar um preset com um item em edição** deixa o formulário apontando para a posição N do
catálogo **novo** — o botão diz "Salvar alterações" e gravaria por cima de outro produto. É
anterior a esta rodada, e a mudança do formulário inacabado já **melhora** o caminho (índice
fora da faixa vira "item novo"). Zerar o formulário ao aplicar um preset é uma decisão sobre o
que "aplicar preset" significa — e a resposta provável é sim, porque preset já é declarado
como *fotografia da aba inteira*. Fica para a palavra do dono.

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

---

## Entregue em 03/09/2026 — a altura do calendario, e o ouvinte que era codigo morto

O dono perguntou por que a aba `pac` nao usa a altura automatica do TidyCal, e se o formulario
de reserva caberia sem barra de rolagem. A investigacao mediu as mensagens **cruas** em vez de
deduzir da documentacao, e o achado foi pior e melhor que o esperado.

### O achado: o ouvinte nunca recebeu nada

Iframe nu, calendario real, escutando `message`:

```
1518ms  [https://agendamento.fotocerta.com.br]  "[iFrameResizerChild]Ready"
total: 1
```

**Uma linha, e mais nada** — nem ao carregar, nem ao clicar num horario. O filho do
iframe-resizer so passa a emitir depois de um **handshake do pai**, e o pai vinha dentro do
`embed.js`. Como a aba `pac` nunca usou o `embed.js` (o endereco muda a cada troca de pacote, e
o `embed.js` cria o iframe uma vez so), **ninguem mandava o handshake**.

Consequencia: toda a mecanica de `scrollToOffset`/`mutationObserver` da aba `pac` — e do
caminho de dominio proprio da aba `t`, criado no mesmo dia — era **codigo morto**. E, sem
sinal, `expandir()` nunca rodava; `recolher()` **remove** o `min-height`; e o iframe, criado por
JavaScript sem atributo de altura, caia no padrao do navegador: **150px**. O calendario
aparecia como uma fresta.

**A decisao errada foi minha, na rodada da decima aba**, e o comentario do codigo registra o
raciocinio: *"o padrao volta a ser o comportamento provado em producao na aba TidyCal: altura
natural, e o sinal expande"*. O erro esta em "provado em producao na aba TidyCal" — la funciona
porque o `embed.js` define a altura **e** faz o handshake. Sem ele, "altura natural" quer dizer
150px. Eu avaliei duas opcoes ruins (expandir sempre, com ~1500px de vazio; ou altura natural,
que e a fresta) e nao considerei a terceira, que era medir o protocolo.

### O conserto

O bloco manda o handshake — **uma linha**, a mesma que o `embed.js` deles manda, so com os
valores de fabrica — e passa a ler a altura da mensagem. O formato, medido:

```
[iFrameSizer]<id>:<altura>:<largura>:<tipo>
```

| | antes | depois | conteudo real |
|---|---|---|---|
| `t` dominio proprio, 1100px | 700px fixos | **511px** | 511px |
| `t` dominio proprio, 375px | 700px (cortando) | **716px** | 716px |
| `pac` vitrine, 1100px | **150px** | **949px** | 949px |
| `pac` vitrine, 375px | **150px** | **716px** | 716px |

**A guarda e `[500, 6000]`**, e os dois numeros sao medidos, nao escolhidos: o piso e o
`minHeight:500` que o proprio TidyCal usa (no carregamento o calendario chega a anunciar 38px e
75px — sem piso, ele piscaria achatado); o teto e quase oito vezes o calendario mais alto
medido. Valor fora da faixa, negativo ou nao-numero **nao mexe em nada**.

**Degradacao segura:** se o `init` nao for reconhecido um dia, nenhuma altura chega e o bloco
fica na altura de partida — exatamente o comportamento de hoje. Provado no caso "SEM SINAL".

### O que a altura automatica NAO resolve

Medido: ao abrir o formulario "Confirme a reserva", a altura anunciada **nao muda** (553 -> 553).
O modal e sobreposicao, nao empurra o conteudo. **As alturas calibradas continuam obrigatorias**,
e o `ALTURA_SEMPRE` continua sendo o escape para quem vir o modal cortado na pagina publicada.

### Sobre a fragilidade, que era o criterio para parar

O handshake e **uma linha**, nao uma reimplementacao da biblioteca. A dependencia da versao do
protocolo **ja existia** no codigo (o prefixo `[iFrameSizer]` e os nomes dos tipos), e o que o
TidyCal customiza (`minHeight`, `checkOrigin`) e do lado do pai e nao entra na mensagem. Por
isso nao se aplicou a regra de parar.

---

## Entregue em 03/09/2026 — duplicar itens, nas listas que cadastram varios

Pedido do dono, testando a aba de pacotes com o catalogo real dele: duplicar um pacote com os
opcionais, e depois a mesma ideia nas outras listas. Saiu em tres levas.

**Leva 1 (`2026-09-03g`) — o formulario de cadastro sobrevive a recarga por inteiro.** Ontem
os opcionais nao salvos passaram a persistir; a duplicacao tornou visivel que os campos de
texto nao. Uma chave nova por aba (`form`), com os campos saindo do proprio `*ProdSalvar` de
cada uma. **Acrescimo provado em tres caminhos reais**: estado sem a chave abre no
comportamento anterior sem alerta; nenhum preset de aba a leva; e o backup, exportado e
reimportado pelos botoes de verdade com a chave apagada, nao conta um item a mais como "nao
reconhecido".

**Leva 2 (`2026-09-03h`) — cupom com codigo repetido recusado nas tres abas.** Medido antes: o
Checkout e a Mini loja aceitavam dois cupons iguais sem aviso, e o carrinho aplica **o
primeiro que bater** — o segundo virava um cupom que o dono cadastra, ve na lista e que nunca
funciona. A comparacao da recusa e a **mesma** que o bloco usa para casar o cupom digitado
pelo cliente: se divergisse, ela deixaria passar exatamente os pares que causam o defeito. A
edicao em linha tambem podia criar duplicata, e avisa **sem apagar nem corrigir nada**.

**Leva 3 — duplicar nas demais listas, e a familia com o conteudo.** Produtos e opcionais do
Checkout e da Mini loja, mensagens da Contagem, opcoes de qualificacao dos Leads, cupons das
tres, e a familia. O Slideshow ficou de fora, declarado: a lista tem area de rolagem com
cortes calibrados em cartoes inteiros.

### A pergunta do dono que corrigiu o plano

O levantamento tratava familia como mais um item de lista — a copia levaria nome e descricao,
sem os pacotes. Ele perguntou se a duplicacao levaria "tudo que tem abaixo" e, ao saber que a
do pacote **ja leva os opcionais**, concluiu: *"e o mesmo comportamento que eu espero para a
familia"*.

**"Duplicar leva o que esta dentro" e uma regra**, e familia funcionando diferente seria a
incoerencia. A objecao que eu tinha — o ganho e so evitar quatro cliques, porque codigos e
precos continuam a ser editados um a um — e verdadeira e vale menos que a coerencia da regra.
Spec: `docs/specs/2026-09-03-duplicar-familia-design.md`.

### A assimetria que veio junto, e nao foi deixada para depois

`aFamDel` **proibia** apagar familia com pacotes, com razao registrada ("mover os pacotes
sozinho seria mexer no seu cadastro sem voce mandar"). Com a duplicacao isso vira
desequilibrio: **um clique cria cinco itens, e desfazer custava nove passos**. Criar barato e
desfazer caro e como um cadastro vira bagunca.

Agora apagar pode levar os pacotes, com **confirmacao nominal** — uma linha por pacote,
`• CODIGO — Nome`, e nao so a contagem. "Vai apagar 4 pacotes" faz confiar no numero; a lista
deixa **conferir**. Mesma razao pela qual o contador da importacao, que diz quantos itens nao
reconheceu e nao diz quais, esta registrado como divida.

### Defeitos pre-existentes achados e corrigidos no caminho

- **`aPacSalvar` nao conferia codigo repetido**: dois pacotes com o mesmo codigo entravam no
  catalogo sem aviso, e a recusa so aparecia depois, na previa e no Gerar. Com o duplicar
  isso deixaria de ser hipotese.
- **`fcOpPendente` lia o rotulo do botao ANTES da troca**, nas tres abas: o aviso mandava
  clicar em "Adicionar pacote" enquanto o botao ja dizia "Salvar alteracoes" — mandava apertar
  um botao que nao estava na tela.

### Uma licao de metodo, sobre a maquina e nao sobre o codigo

A suite `tidycal-unificado.mjs` e a **unica** do arnes que fala com o TidyCal de verdade, e
**nao tolera duas execucoes ao mesmo tempo**. Nesta rodada ela deu um resultado inconclusivo
porque tres instancias dirigiam Chromium contra o mesmo servidor; e a rodada limpa seguinte
foi morta por um `pkill -f "verificar/"` que **eu** emiti para limpar processos orfaos.

Duas regras que ficam: limpeza por padrao de nome derruba trabalho legitimo junto com o lixo;
e essa suite pede a maquina so para ela.

---

## Divida aberta em 03/09/2026 — o limiar de crescimento do calendario envelheceu

`tidycal-unificado.mjs` cobra que, no modo **medindo**, abrir o formulario de reserva faca o
quadro crescer **pelo menos 300px**. O numero foi calibrado em 03/09 contra uma pagina do
TidyCal que descansava em **764px** e ia a 1662px.

**Medido hoje, na pagina do TidyCal SOZINHA, sem o nosso bloco:** ela descansa em **1386px** em
largura cheia e cresce **907px** ao revelar a lista de horarios. Dentro do nosso iframe, na
largura do teste, o repouso medido foi **958px** (e **1006px** noutra execucao — a
intermitencia ja registrada), com o formulario levando a **1127px**: crescimento de ~169px,
abaixo do limiar.

**A pagina do TidyCal mudou de tamanho desde a calibragem.** Se ela ja descansa alta, o modal
acrescenta pouco, e o limiar cobra um delta que a pagina de hoje nao produz.

**Por que isto NAO bloqueou a publicacao do aquecimento**, e a razao e um encadeamento, nao uma
impressao:

1. A regressao byte a byte deu exatamente as 6 divergencias esperadas (as 3 saidas de
   calendario nas 2 passagens) e **nenhuma outra**.
2. As outras nove suites passam, incluindo a nova (37 verificacoes), que prova que o
   aquecimento carrega de verdade, que a guarda do `e.source` funciona e que nenhum CSS mudou.
3. A assercao que falha esta no modo **medindo**, que **nao e o padrao** — e cuja altura, ja
   medido em 03/09, so e aplicada em cerca de uma carga de quatro.
4. **A mudanca publicada nao pode afetar a altura da pagina do TidyCal.** Ela acrescenta
   `preconnect` e cria o iframe mais cedo; nao toca o que a pagina de terceiro renderiza.

**O que ficou por fazer, e e a divida:** nao consegui rodar a suite contra a arvore da `main`
para a comparacao direta. A suite nova nao dirige a ferramenta antiga (campos que nao existem
la), e a suite antiga nao roda em arvore extraida por `git archive` (ela usa contexto de git
que so existe no repositorio). **Isso e uma limitacao do arnes, nao do codigo**, e vale
consertar: comparacao com a versao publicada e o instrumento que separa "defeito meu" de
"mudanca de terceiro", e hoje ela nao esta disponivel para esta suite.

**Duas coisas para a proxima rodada que tocar isto:**

- **Recalibrar o limiar** medindo a pagina do TidyCal de hoje, e escrever a data da medicao ao
  lado do numero — foi a falta dela que fez o limiar envelhecer em silencio.
- **Fazer o arnes rodar contra uma arvore de referencia** sem depender do contexto de git.

---

## FECHADA em 04/09/2026 — a corrida entre o embed.js do TidyCal e o nosso aperto de mao

Registrada de manha e **consertada na mesma tarde**, em rodada propria autorizada pelo dono
(ela mexe em `t-out1`, a saida da aba TidyCal, que estava em producao).

**O que era:** o `embed.js` do TidyCal chegava **depois** de o aperto de mao proprio ja ter
assumido o filho. A biblioteca deles era entao aplicada ao elemento **por cima**, ficava com o
quadro e sem as alturas — porque o filho aceita um `init` so. Resultado: 764 anunciado, 700 na
tela.

**A medicao que o conserto exigiu foi forcar a ordem de chegada**, e nao esperar a rede
decidir: esperar mede a frequencia, nunca o defeito. Com o `embed.js` atrasado de proposito, a
biblioteca era aplicada por cima em **9 de 9** passagens.

**E ela era a causa de um segundo defeito, ja registrado como outra coisa.** A intermitencia de
03/09 — a medicao do formulario aplicada em "cerca de uma carga de quatro", que foi o motivo de
o campo `t-medir`/`a-medir` nascer **desligado** — era esta mesma corrida:

| | aplica a altura anunciada |
|---|---|
| antes | **1 de 6** |
| depois | **6 de 6** |

**A forma do conserto, e a tentativa que falhou antes dela.** O obvio era trocar as duas
bandeiras (`libNoComando`, `manualAtivo`) por uma variavel de tres valores. **Medido: nao
bastava** — `comecarCalendario` reinicia a cada `load` do iframe, e o primeiro `load` chega
depois de o aperto de mao ja ter falado com o filho; a variavel era zerada ali e a biblioteca
se achava livre. Trocar uma variavel por outra so mudaria o nome do buraco.

O que ficou: **o comando mora no proprio elemento**, que e o que os dois disputam
(`data-fc-lib` e `data-fc-mao`, lidas por `comandoDe`). Dois portoes, um por lado. Sobrevive a
reinicio e a troca de quadro por construcao.

Junto saiu `soltarBiblioteca`, que nunca era chamada e chamava `iFrameResizer.close()` — que
**remove o iframe do documento**.

**O que isso reabre, e e decisao do dono:** o campo `t-medir`/`a-medir` nasce desligado desde
03/09, e o unico motivo era a instabilidade que acabou de ser consertada. Com 6 de 6, o padrao
merece ser reconsiderado — agora com numero, e nao com impressao.

---

## FECHADA em 11/09/2026 — dois identificadores com ORCAMENTO composto

Registrada de manha e **consertada no mesmo dia**, em rodada propria aprovada pelo dono.

**O que era:** o identificador que chega ao Pix tem 25 caracteres, e em duas abas ele e
**composto** — o que o operador digita mais o que o gerador acrescenta. O campo nao avisava
nada.

**A colisao, provada na versao publicada:** prefixo `FOTOCERTAESTUDIO` com os pacotes
`MINIENSAIO1H` e `MINIENSAIO4H` geravam **sem recusa** e produziam **o mesmo txid** —
`FOTOCERTAESTUDIOMINIENSAI` nos dois. Dois pagamentos indistinguiveis no extrato, sem erro em
lugar nenhum.

**A truncagem, tambem provada:** `m-cod` com 20 caracteres fazia a tela dizer
`Pedido LOJAFOTOCERTAVITORIA-MYPV1GG0` e o extrato receber `LOJAFOTOCERTAVITORIAMYPV1`.

**O conserto: recusa no gerador, com os limites DERIVADOS.** Nenhum numero foi escrito a mao.
As funcoes que escrevem a cauda passaram a morar em texto, e a ferramenta **avalia esse mesmo
texto** para medi-la — o molde de `fcPixApi`:

| Fonte | Medicao | Sobra |
|---|---|---|
| `M_PEDIDO_CAUDA_SRC` (o base36 do `novoPedido`) | 8 | `M_COD_MAX` = **17** |
| `A_DIAHORA_SRC` + `A_SUFALEAT_SRC` | 12 | `A_ID_MAX` = **13** |

**A fronteira foi medida um caractere por vez, pela interface** — nao espiando variavel de
dentro da IIFE, o que mediria a intencao e nao o comportamento. A recusa comeca exatamente um
caractere depois do ultimo aceito, e o numero que a mensagem **diz** e o mesmo que a ferramenta
**faz**.

**O negativo que uma recusa desastrada quebraria:** `LOJA-FOTO_CERTA-VITO` tem 20 digitados e
17 uteis — hifen e sublinhado somem na limpeza — e **passa**.

### Por que o contador de ontem NAO foi estendido

`FC_LIM_CAMPOS` instala `maxlength` e compara o **texto digitado**. O orcamento aqui e sobre o
que **sobrevive a limpeza**: com `max:17` a peca bloquearia a digitacao nos 17 e recusaria
`MINI-LOJA-CENTRO-SP` (19 digitados, 16 uteis), que e legitimo — trocando estouro silencioso
por **bloqueio silencioso**. E no Agendamento o orcamento e dividido entre um campo e uma
**lista** (os pacotes ja cadastrados), sobre a qual um contador por campo ficaria calado
justamente no caso que causa a colisao. Ficou so na recusa, e a razao esta escrita.

## Entregue em 11/09/2026 — achar um texto, e os 58 que estavam fora da rede

Nasceu de um pedido que era, na verdade, um defeito de descoberta: o dono quis mudar a frase
`Sem opcional` que o cliente lê, procurou na ferramenta, **não achou**, e pediu que o texto
virasse configurável. Ele já era (`u-txt-semopcional`, Checkout) e funcionava. A varredura mediu
por que ele não achou, e foram **três barreiras**, nenhuma resolvida por rótulo melhor:

1. A busca do navegador **não lê o `value` de `<input>`** — só `<label>`, `<legend>` e `.ajuda`.
2. **Aba fechada é `display:none`.**
3. **Seção recolhida também** (`.fcd-oculto`), e ela cobria **116 dos 168** campos de texto.

### Leva 1 — a busca e o eco no rótulo

A busca vive na **segunda linha da barra grudada** (`.fcg-fixa`), campo sempre à vista e não botão
que abre painel: o defeito é de descoberta, e busca escondida repetiria o erro que ela veio
consertar. Ela varre o **DOM** (437 campos medidos), **não as tabelas** — uma busca sobre as
tabelas ignoraria os campos de fora e diria "não encontrado" sobre coisa que existe, que é pior
que não ter busca. Alcança também o que nasce em tempo de execução (código de cupom, nome de
produto). Ficam de fora, declarados: o código gerado (`readonly` — é resultado, não destino), as
superfícies de colagem do importador (`data-fcs="nao"`) e os painéis Identidade/Detalhes.

O rótulo passou a mostrar o **valor atual** do campo, gerado a partir da tabela — nunca escrito à
mão, que criaria uma terceira cópia das frases que nenhuma guarda fiscaliza. `fcTxtTabelas()`
virou a fonte única da lista das tabelas (antes ela só existia dentro de `fcTxtFabricaDiverge`).

**Achado resolvido na mesma leva:** a busca entregava o operador num campo **invisível** quando
outra opção da aba o escondia por `style.display` (`c-ctatxt`, dentro de `#c-cta-campos`). Abrir a
aba e expandir a seção não bastavam. Agora ela para no container visível mais próximo e avisa.

**Achado resolvido:** `id-orcamento.mjs` usava `main` como referência do lado "antes" — e o
conserto que ele mede já estava em `main`, então o "antes" media a si mesmo. Preso em `94042b6`:
"antes" é estado histórico, não "o que estiver em main hoje".

### Leva 2 — os 58 que estavam fora das tabelas

Eram 68 campos que o cliente final lê e que viviam fora das `*_TXT_DEFS`, cada um escrito à mão em
três a seis lugares. **58 entraram**; as tabelas foram de 168 para 226 campos, em nove tabelas
(`B_TXT_DEFS` é nova, só com o selo das bordas).

**Ficaram fora, com motivo medido:** os nove textos reserva dos marcadores (`t-ob-fb-*`,
`a-ob-fb-*`), porque dividem **uma** chave de estado juntada por caractere de controle — trazê-los
muda o formato do que fica gravado, classe que exige a palavra do dono; e `m-cod`, que é
identificador com regex e teto, não frase.

**A instrução da chave com ponto foi derrubada por medição.** Tinha sido mandado ensinar
`fcTxtLer`/`fcTxtRestaura` a entender `'rotulos.d'`, para o estado gravado sair idêntico. A medição
mostrou que **o aninhamento nunca existiu no estado gravado** — ele só existe no `cfg` efêmero do
gerador. Chave com ponto teria **aninhado o estado**, exatamente o que a instrução existia para
impedir. Manteve-se a chave plana e achatou-se o `cfg` em 6 pontos de emissão.

### Os cinco achados da leva 2

1. **"Restaurar padrões" não repunha os textos.** `sLimpar` repunha 0 de 5, `lPadroes` 0 de 20,
   `pLimpar` 0 de 21, `cLimpar` 4 de 14. O botão promete devolver a aba aos padrões de fábrica e
   voltava pela metade, em silêncio. Consertado nos quatro — e são **quatro**, não oito: as outras
   seis abas não têm botão de reposição (medido; não se criou botão novo, que seria funcionalidade).
2. **Segunda fábrica fora da vigilância:** `c-txt-suf-d/h/m/s` tinham o padrão escrito em
   `C_TXT_DEFS` e de novo dentro de `cLimpar`. `fcTxtFabricaDiverge` compara a tabela com o
   atributo `value=`, **nunca com `cLimpar`**. Morreu junto com o conserto do item 1.
3. **`lRestaura` nunca chamava `fcTxtRestaura(L_TXT_DEFS,…)`**: os cinco textos da Captação eram
   coletados e **perdidos a cada recarga**. A regressão nunca pegou porque ela preenche e gera na
   mesma sessão, sem recarregar.
4. **`"undefined"` gravado no campo** quando a chave faltava (`uRestaura`, `cRestaura`,
   `lRestaura`). Dentro da tabela, chave ausente cai no padrão. Muda comportamento observável em
   31 campos, e só com estado antigo ou parcial.
5. **Dezesseis comentários com contagem errada** (U dizia 33 e tinha 36; A 31/40; P 11/12; M
   55/58). 31 números escritos à mão foram removidos; o número sai de `TABELA.length`.

### A prova que a regressão byte a byte NÃO consegue dar

Na Captação o `escJs` acontecia **na leitura do DOM** e a emissão era crua. `fcTxtLer` devolve cru,
então o `escJs` desceu para **15 linhas de emissão**. Com valores de fábrica a saída é idêntica dos
dois jeitos — **a regressão aprovaria um esquecimento**. Conferiu-se a passagem "configurada": os
valores dela **não contêm apóstrofo**, então ela passava por motivo certo mas insuficiente.

Daí `scripts/verificar/textos-migrados.mjs` (131 verificações): injeta um texto hostil com
apóstrofo, aspas, barra invertida e `</script` **nos 58 campos**, gera, executa cada bloco numa
página com marcador de fim, e exige raiz desenhada, zero erro de console e o texto **inteiro**
chegando à tela, à ficha do produto e à URL do WhatsApp. Um `escJs` esquecido quebra o bloco e o
marcador não aparece.

### Aberto, esperando decisão do dono

- **Os nove textos reserva dos marcadores.** Trazê-los para a tabela muda o formato do que fica
  gravado. A conversão automática faria backup antigo continuar abrindo; o risco é o inverso e é
  pequeno — backup feito **depois**, aberto numa versão **antiga** da ferramenta, perderia os nove.

## Entregue em 11/09/2026 — os nove textos reserva, e a migração que os deixou entrar

Fecha a pergunta que ficou aberta na rodada anterior. Os nove textos reserva dos marcadores
(`t-ob-fb-*`, 5, e `a-ob-fb-*`, 4 — o que a página de obrigado escreve quando o TidyCal **não**
manda o dado) eram os únicos campos de texto do cliente ainda fora das tabelas. Estavam fora por
um motivo só: os nove dividiam **uma** chave de estado (`obfb`), com os valores juntados por
caractere de controle. Trazê-los muda o formato do que fica gravado — classe que exige a palavra
do dono, dada em 11/09/2026 depois da medição do alcance.

### A migração, e por que ela cobre mais do que o backup

Quatro funções curtas ao lado de `fcTxtLer`/`fcTxtRestaura`: `fcObFbChave`, `fcObFbDefs` (monta as
linhas da tabela a partir de `T_OB_VARS`/`A_OB_VARS` — nada digitado duas vezes), `fcObFbJuntar`
(a chave antiga, **projetada** das novas) e `fcObFbMigrar` (reparte `obfb` na ordem do array,
nunca em ordem de objeto; chave nova vence; devolve **cópia**, porque o fragmento pode ser o de um
preset em memória).

**Presets entram pelo mesmo caminho, e isso foi medido, não suposto:** `fcPresetAplicar` e
`fcgAplicarAba` chamam ambos o `a.restaura(frag)` da aba. Um ponto de migração cobre estado,
preset de aba, preset geral e backup importado. Cuidar só do "Exportar tudo" teria deixado preset
antigo voltar com os nove vazios.

**`obfb` continua sendo gravado, e o motivo é medido:** o molde da importação é o que o `coleta()`
devolve *agora*, e `fcxConformar` **descarta** chave fora do molde. Tirar `obfb` do `coleta()`
faria o backup chegar a `tRestaura`/`aRestaura` já sem os nove textos — a migração rodaria com
nada na mão. É o defeito que `'link'` custou em 03/09/2026. O custo de manter foi eliminado:
`obfb` é **projeção** das chaves novas, calculada depois do `fcTxtLer`, não uma segunda leitura do
DOM — não tem como divergir.

**`vazioVale`:** as duas abas tratavam texto vazio de forma diferente (a TidyCal testava
`!==undefined`, a de pacote `!=null && !==''`). Uniformizar mudaria em silêncio o bloco que um
estado já gravado produz. As duas foram preservadas e provadas.

### Achado pelo caminho, resolvido

`aBlocoObrigado` (~18311) escapava o texto reserva com **`escJs` dentro de um literal de aspas
DUPLAS** — o único assim na ferramenta, entre os ~150 `escJs` do arquivo. Aspa dupla no texto
fechava o literal e a **página de obrigado inteira não carregava** (`Unexpected identifier 'b'`,
medido com o bloco rodando). Defeito **anterior**, invisível porque esses quatro campos nunca
tinham sido exercitados com texto hostil. Passou a `escJsD`. Com os padrões de fábrica a saída é
byte a byte a mesma — a regressão prova.

Junto: o `guarda:` da aba TidyCal não mencionava a seção 4, embora o preset carregue aqueles
campos. `T_OB_VARS` ganhou `padrao:` (antes o padrão morava **só** no `value=`, porque `tRestaura`
nunca repunha texto reserva nenhum), copiado letra por letra do atributo — sem segunda fábrica.

### As provas (`scripts/verificar/textos-reserva.mjs`, 83 verificações)

O estado antigo **não é escrito à mão** — é colhido da própria `main`, servida em porta separada,
em quatro cenários: valores distintos, todos vazios, hostil, e **com o caractere de controle
dentro**. Mais: preset antigo salvo pela `main` e aplicado aqui **depois de sujar os nove** (sem
sujar, "o preset trouxe" seria indistinguível de "nunca mudou"); ida e volta no formato novo; a
**ordem do endereço** provada com os cinco marcadores ligados ao contrário, endereço idêntico ao
de `main` caractere por caractere; eco no rótulo e fábrica divergente plantada nos nove; e o texto
hostil **executando** em `t-out5` e `a-out3`, numa página sem parâmetros — a única circunstância
em que o texto reserva aparece.

**O caractere de controle: medido, não suposto.** Ele chega ao campo intacto pelos quatro caminhos,
inclusive colagem de verdade — logo o formato antigo **é** ambíguo. O teste cobra que a árvore se
comporte, diante de um estado antigo assim, **exatamente como a `main`**: a ambiguidade é herdada
do formato antigo, não criada aqui. O formato novo acaba com ela.

### Dívida registrada, pequena

**Preset geral salvo antes desta rodada mostra "alterado"** até ser salvo de novo. Medido:
`fcgCamposDiferentes` usa `fcCanon`, e `fcCanon(undefined)` ≠ `fcCanon('tudo certo')`, então as
nove chaves novas aparecem como diferentes. Nada na tela mudou; só a forma guardada. Um "Salvar"
resolve para sempre. Migrar o fragmento na entrada do preset geral seriam dois caminhos novos de
escrita, cada um com prova própria, fora do núcleo autorizado desta rodada.

## Entregue em 12/09/2026 — o meio de pagamento prioritário

Spec: `docs/specs/2026-09-12-meio-prioritario-design.md`. Um radio `*-prio` (`pix` | `pp`) nas
quatro abas de pagamento, padrão **Pix**, decidindo **ordem e preço em destaque juntos**.

**A premissa do pedido estava parcialmente errada e a medição corrigiu:** o Link de cobrança já
mostrava o Pix primeiro; o que ele tinha de diferente era o destaque. São dois eixos, e só a `pac`
tinha os dois apontando para o Pix.

**17 divergências na regressão, todas intencionais e explicadas uma a uma** (ver a spec). 21 das 25
saídas idênticas, **os nove links de cobrança idênticos** — só o bloco mudou. `a-out3` divergiu
**só num comentário**: o código gerado da `pac` é byte a byte idêntico ao de `main`, o que prova que
o padrão de fábrica reproduz o que está no ar. Prova do outro lado feita: com o campo em cartão,
`u-out` e `m-out` voltam a ser idênticos aos de `main`.

**A prova que não existia:** nada no arnês fixava a ordem dos meios (grep devolvia zero).
`meio-prioritario.mjs`, 104 verificações, mede a ordem **pelo índice dos filhos no DOM**, nas quatro
abas e nas duas escolhas, mais o destaque por `getComputedStyle`, o valor que o PayPal cobra, e as
frases. `meio-prio-migracao.mjs`, 52 verificações, cobre a migração do texto.

### Duas suítes com referência datada, corrigidas no caminho

Mesmo defeito de `id-orcamento` em 11/09: asserção que usa `main` como lado "antes" passa a medir a
si mesma quando a rodada que ela mede entra em `main`.

- `textos-reserva.mjs` acusava sete falsas falhas — referência presa em `77d9db2`.
- `textos-migrados.mjs` comparava o estado gravado exigindo identidade fora de uma lista fixa;
  passou a declarar **chave nova por rodada** e **fábrica trocada** com os dois valores, em vez de
  afirmar "não existe em main" como verdade eterna.

**A lição, que já apareceu três vezes:** *"antes" é estado histórico, não "o que estiver em `main`
hoje".* Toda suíte que compare com uma referência precisa prendê-la a um commit.

### Um defeito meu, corrigido por medição

Instruí o executor a tratar o caso "sinal ligado + Pix prioritário", supondo que a tela mostraria
duas linhas com o mesmo número e um selo de `-0%`. **O gerador já o impedia:** a linha do Pix só é
emitida com `descpix>0`, e o sinal zera o desconto antes disso. Em vez de tratamento para um estado
impossível, o comportamento foi **fixado em teste** (+32 verificações) — que passa a falar no dia em
que o sinal chegar às outras abas.

## Entregue em 13/09/2026 — a prova do sinal, e três dívidas

Spec: `docs/specs/2026-09-12-sinal-nos-quatro-construtores-design.md`, Rodada B. Ela vem **antes**
de estender o sinal para mais duas abas, e o motivo é medido: o caminho do sinal tinha **zero**
verificação em todo o arnês. `u-sinal`/`m-sinal` nascem em `nao` e nada as ligava, então as ~40
linhas condicionais de `FC_CARRINHO_SRC.sinal`, `fcTotalPixSrc`, `fcPpBotoesSrc`, `uBloco` e
`mBloco*` saíam **zero vezes** da regressão byte a byte. Quem mexesse na conta do sinal mexia sem
rede — e a propriedade que este projeto mais persegue ("o cliente paga o número que leu") não tinha
medida nenhuma ali, apesar de ter sido exatamente em arredondamento de meio centavo que se acharam
60.097 divergências em 2.002.000 combinações.

`sinal.mjs`, **533 verificações**: a conta nos dois tipos sobre o total com cupom; o campo 54 do
payload relido por **leitor TLV escrito dentro do teste**; o `createOrder` lido do próprio bloco; o
arredondamento com catálogo **escolhido por critério declarado** (a varredura de 39.006.394
combinações achou 313.708 em que `Math.round` e `toFixed(2)` discordam, **sempre com o `Math.round`
por cima**); as três recusas e os **quatro** consumidores recusando juntos; e as três linhas da tela
e da mensagem.

**O sinal entrou na regressão**, na passagem **configurada** e **só na Mini loja** — medido: ligar o
do Checkout apagaria a cobertura de `u-txt-zap-valor`, que só existe no ramo **sem** sinal da mesma
aba, e a própria regressão acusaria `SEM VESTIGIO`. Como a conta é fonte única, uma aba basta.
`m-out` configurada foi de 46.196 para 49.048 bytes: ~2,8 KB que só agora estão sob a rede.

### O defeito silencioso que a rodada quase publicou

**D1** dava campo próprio à linha do saldo no WhatsApp. Só que essa linha era **derivada de outra**:
o gerador montava `TXT_SALDO + ': *{valor}*'`, e `TXT_SALDO` é o rótulo da **TELA** (`t9`). Quem
tivesse personalizado o rótulo veria a mensagem voltar ao padrão de fábrica, **em silêncio**.

**A regressão byte a byte não pega isso** — com os textos de fábrica as duas formas produzem o mesmo
texto, e a única divergência da rodada (uma linha em `m-out`) passava como inofensiva. Achado ao ler
o diff à mão, não por teste.

Conserto: `fcZapSaldoMigrar`, que age **só** quando a chave nova está ausente **e** o rótulo da tela
foi personalizado. Prova em `zap-saldo-migracao.mjs` (18 verificações), com o estado colhido da
própria referência. **A lição, que vale para toda rodada futura: dar campo próprio a uma frase
derivada de outra é uma migração, não um acréscimo — e é da família que a regressão não vê.**

### As outras duas dívidas

- **D2** — `m-descpix` passou a ser desabilitado com sinal ligado, como o do Checkout já era.
- **D3** — o aviso âmbar da Mini loja passou a seguir só o sinal. Medido: a condição extra não mudava
  o que se via (o aviso mora dentro de um campo que já some fora de "ambos"); o que ela criava era
  divergência de **regra** entre abas que a fonte declara gêmeas.

### Achado registrado, sem ação — decisão do dono

**Pedido em zero com sinal FIXO mostra três números que não fecham:** `Total R$ 0,00 · Sinal R$
100,00 · Saldo R$ 0,00`, e no Checkout o resumo copiável repete isso. Vem da primeira guarda de
`sinalRecusa()`, que devolve vazio de propósito quando o total é zero (para não haver dois avisos).
**Ninguém chega a pagar esse número** — as duas pontas recusam pela recusa de total zero, e a prova
verifica isso. É defeito de **leitura**, não de cobrança.

Não virou asserção: congelar o comportamento de hoje faria a correção futura falhar como se fosse
regressão. E mexer em recusa é da classe que precisa da palavra do dono antes. A suíte **imprime** o
estado a cada passagem, para a rodada seguinte decidir.

### Mais uma suíte com referência datada

`meio-prio-migracao.mjs` acusava **nove falhas todo dia** desde que a rodada que ele mede chegou à
`main` (medido: as mesmas 9 de 52 numa árvore limpa). É a **terceira** vez que este padrão aparece.
Agora ele detecta a situação, diz "NAO MEDIU" e troca de pergunta. Contra `4c66719`, volta a medir
de verdade: 51 verificações.

## Entregue em 13/09/2026 — sinal no Agendamento por pacote, e o pedido em zero

Spec: `docs/specs/2026-09-12-sinal-nos-quatro-construtores-design.md`, Rodadas C e F.

### C — o sinal na aba `pac`

Mesma mecânica do Checkout, com a conta vinda de `FC_CARRINHO_SRC.sinal` — **fonte única, não
reescrita**. O parcelamento passa a ser **sobre o sinal** (decisão do dono): parcelar um número que
ninguém está cobrando confunde. **Regressão: zero divergências** — com o interruptor desligado o
bloco é byte a byte o de `main`, que é o que um interruptor novo tem de provar.

**A palavra da aba é "reserva", e não é só o substantivo:** o remédio muda junto. As irmãs mandam
"escolher mais itens ou aumentar a quantidade"; aqui o pacote é fixo e o cliente só tem opcionais e
cupom. Mandar fazer o que a tela não permite é fábrica mentindo. `t9` virou `Restante no dia do
ensaio` — "entrega" nomeia um momento que numa reserva não existe.

**Dois textos da spec NÃO nasceram, e a ausência é medida:** `txtSinalRecusado` (o único consumidor
dele nas irmãs é o resumo copiável, e esta página não tem um — são **três** consumidores de
`sinalRecusa()` aqui, não quatro) e `txtZapSaldo` (as mensagens desta aba são recados fixos e não
citam valor). **Campo de texto sem consumidor é pior que campo faltando.**

**O identificador de conciliação continua imune ao sinal** — idêntico nas quatro combinações, depois
de recarregar e de mexer no carrinho, lido do `custom_id` do pedido ao SDK e não de variável
interna. Sinal que entrasse nele reabriria o defeito mais caro daquela rodada.

**Achado anterior à rodada, corrigido junto:** a segunda linha de preço (`ou {valor} no cartão`) não
tinha guarda de desconto, então com desconto 0 ela repetia o número de cima — na vitrine e na página
de obrigado, independentemente do sinal.

### F — o pedido em zero (autorizada pelo dono)

Com o total em zero, a primeira guarda de `sinalRecusa()` devolve vazio **de propósito** — quem
avisa ali é a recusa de total zero, e dois avisos ao mesmo tempo se esconderiam. Mas as duas linhas
continuavam desenhadas: o cliente lia `Total R$ 0,00 / Sinal R$ 100,00 / Saldo R$ 0,00`. Nas **três**
abas com sinal, e no resumo copiável do Checkout.

**Nunca foi defeito de cobrança** — as duas pontas recusam, e a suíte verifica isso. Era de
**leitura**. O conserto é de tela e **não toca a conta**: `sinalAgora`/`saldoDepois`/`sinalRecusa`
são fonte única consumida por vários lugares, e trocar risco de dinheiro por um caso de tela seria
mau negócio. O que some é informação **falsa**, não um aviso.

O achado que `sinal.mjs` imprimia a cada passagem **virou asserção** — 868 verificações.

**A prova da fronteira não existe, e a ausência é medida:** `total()` já vem arredondado em centavos,
então não existe valor entre zero e um centavo, e `>0` e `>=0.01` são indistinguíveis na prática. Um
teste ali não provaria nada que o carrinho vazio e o caso de R$ 0,49 já não provem. **Teste que não
distingue duas implementações é verde de enfeite.**

## Entregue em 13/09/2026 — sinal por cobrança no Link de cobrança

Spec: `docs/specs/2026-09-12-sinal-nos-quatro-construtores-design.md`, Rodada D. A única da fila que
mexe no **selo do link** e no arquivo que a `/pagar` publicada executa.

### O desenho: o que viaja no link é o TOTAL; o campo 54 carrega o SINAL

Parece invertido e é o contrário. A regra fundadora desta aba é que **o que se cobra mora dentro do
código Pix e em lugar nenhum mais** — protegido por três redes (CRC, remontagem com a chave do dono,
selo). Com sinal, quem é cobrado é o **sinal**, então é ele que fica no lugar protegido. O total,
que ninguém cobra, é informação de tela e viaja no endereço, como `n`.

**O sinal não é fórmula que o bloco carrega.** Não há carrinho aqui: o valor é digitado e nada muda
depois que o link sai. A conta acontece **uma vez, na geração**. Levar `FC_CARRINHO_SRC.sinal` ao
bloco criaria um segundo lugar onde o número é decidido — e a segunda rede daqui é declaradamente
mais fraca que a do desconto: não há fórmula viajando, só faixa a conferir (`0,01 ≤ sinal ≤ total`).

### O selo, e a prova que manda

`seloDe` ganhou o sétimo parâmetro com o **mesmo padrão condicional** do par `t`/`x`: os quatro de
sempre contam sempre, `t`/`x` depois e só em par, `n` por último e **só quando vem preenchido**.

- **`regressao.sh main`: os NOVE links byte a byte idênticos.** A regressão compara link e bloco
  separadamente, e nenhuma divergência de link apareceu. As 11 divergências são todas `p-out1`, o
  bloco, contado por passagem e por cobrança.
- **`sinal-cobranca.mjs` (368 verificações):** os **oito formatos** de link gerados pela `main` (com
  e sem `t`/`x`, com e sem PayPal, com e sem prazo, com acentos) são aceitos pelo bloco novo **e**
  pelo de `main`, lado a lado, com o mesmo valor e o mesmo campo 54. **O controle importa:** sem
  ele, "o bloco novo aceita" poderia significar "ele aceita qualquer coisa".
- **O caminho inverso, medido:** link com sinal é **recusado** pelo bloco de `main`. É daí que sai o
  aviso ao dono — verdade medida, não suposição.

### O que o dono precisa fazer, uma vez

Regerar o **Código 1** da aba Link de cobrança e recolá-lo no componente HTML da página `/pagar`,
publicando em seguida. Sem isso ela recusa os links **novos** com sinal. Precedente idêntico
registrado no texto de ajuda da `/cobrar`. **Nenhum link já enviado para de funcionar** — exceto os
de antes de agosto/2026, de quando o link ainda não tinha selo, que já eram recusados antes.

### Três achados

1. **A disciplina de versão tem QUATRO lugares, não três.** O `index.html` também declara
   `FC_COMPART_ESPERADA`. Esquecê-lo fez a ferramenta **parar inteira, em silêncio** — a guarda
   funcionou, mas 30 verificações da suíte ficaram verdes **sem medir nada**. A `CLAUDE.md` e a
   documentação dizem "três lugares" e estão desatualizadas.
2. **Um aviso obsoleto ao lado do Código 1** dizia que recolar derruba os links já enviados. Deixou
   de ser verdade quando o selo virou superconjunto — e o dono leria isso exatamente no passo que
   precisa executar. Corrigido.
3. **Pedido em zero (rodada F) não existe aqui** — a geração recusa valor zero. Mas existe o
   espelho: sinal fixo igual ao valor. As duas linhas somem quando o saldo é zero, para não repetir
   o número do destaque.

## Entregue em 13/09/2026 — os três textos que explicam o sinal

Spec: `docs/specs/2026-09-12-sinal-nos-quatro-construtores-design.md`, Rodada E. Pedido do dono:
três textos configuráveis que respondam, **antes** de o cliente pagar, *o que o sinal garante*, *e
se eu desistir* e *o que fazer com o saldo*. Doze campos, nas quatro abas de pagamento.

### A decisão que governa a rodada: nascem VAZIOS

Todo campo de texto deste projeto tem padrão de fábrica, porque o padrão é *"exatamente o que saía
fixo no bloco antes"*. Aqui não existe "antes". E, mais importante: os três são **declarações de
política comercial**. Um padrão dizendo `Cancelamento não há devolução do sinal` afirmaria, para um
cliente prestes a pagar, uma política que o dono pode não ter — **política inventada numa tela de
pagamento é pior que nenhuma**.

`value=""`, exemplos no `placeholder`, e **cada linha só é emitida quando preenchida**. Três vazios
= nenhuma linha, e o bloco sai exatamente como sairia sem a rodada. **Regressão: zero divergência**,
e o zero é honesto: vazio não emite nem regra de CSS, nem `div`, nem uma linha de JS.

Um estado que sinal ligado + três vazios cria é justamente a confusão que o pedido veio evitar — daí
o **aviso âmbar** na aba. Ela não conserta; faz o buraco **aparecer**. Aviso e não tranca: o dono
pode ter motivo para deixar vazio, e recusar o forçaria a escrever algo só para destravar.

### A medição do Link de cobrança: da PÁGINA, não da cobrança

Não foi assumido. Naquela aba **todo `TXT_*` já mora no bloco** e nada disso viaja no endereço; o
que viaja é valor (`t`, `x`, `n`). Os três são política do negócio, não desta venda — duas cobranças
da mesma página não teriam por que responder diferente "e se eu desistir?". Pô-los no link os faria
entrar no **selo**, derrubando todo link novo em qualquer `/pagar` com código 1 antigo — **por um
texto**. Duas provas fixam a decisão: o link sai **idêntico** com um e com três preenchidos, e o
bloco (ao contrário) muda.

### Uma armadilha real, evitada

Sem `value=""` **escrito no HTML**, `getAttribute('value')` devolve `null`, `null !== ''`, e
`fcTxtFabricaDiverge` acenderia a barra vermelha na partida. Os doze trazem o atributo, com prova.

### A quarta suíte com referência datada

`sinal-cobranca.mjs` acusava **três falhas todo dia** desde que a rodada D chegou à `main`: a parte
2 afirma que "o bloco de hoje recusa o link com sinal", e o bloco de hoje passou a conhecê-lo. É a
**quarta** vez (depois de `id-orcamento`, `textos-reserva` e `meio-prio-migracao`). Passa a dizer
**NÃO MEDIU**. Contra `69e5fa2` (o anterior à rodada D), volta a medir: 368 verificações.

### A documentação estava errada, e o erro tinha custo

`CLAUDE.md` e a `documentacao-fotocerta.md` diziam que a versão do arquivo compartilhado se troca em
**três** lugares. **São quatro** — faltava o `FC_COMPART_ESPERADA` do próprio `index.html`.
Esquecê-lo faz a ferramenta **parar inteira, em silêncio**: a guarda funciona, mas quem estiver
medindo vê a suíte ficar verde **sem medir nada**, porque a página nem chega a carregar. Medido
nesse dia, com 30 verificações passando sobre uma ferramenta parada. Corrigido nos três lugares onde
a frase aparecia.

### Achado resolvido no caminho

`textos-migrados.mjs` quebrava com o final novo das tabelas: o leitor só conhecia `];` e um
`.concat`, e com o segundo `.concat` o padrão não parava e **engolia as tabelas seguintes** — 32
campos acusados de estarem na aba errada. Os dois concats agora são opcionais e ambos expandidos.

## Entregue em 13/09/2026 — o número de dinheiro não quebra ao meio

Relatado pelo dono com dois prints: no carrinho do Checkout, a linha do Pix saía com o rótulo em
duas linhas **e o valor partido** — `R$` numa linha, `332,50` na outra. Ele encurtou o texto de
fábrica por conta própria e **não resolveu**, o que já dizia onde estava a causa: quem quebrava era
o **valor**, e rótulo menor não muda isso. Depois esclareceu: *"Isso acontece na tela de celular."*

**A causa:** as linhas "rótulo à esquerda, valor à direita" são flex com dois `<span>` e **nenhuma
regra dizendo quem cede**. Item de flex tem `min-width:auto`, então os dois disputam a largura até
os dois quebrarem. O corpo maior que a rodada do meio prioritário trouxe (20px/800) foi o empurrão.

**A regra (`fcLinhaValorCss`):** o valor nunca quebra e nunca encolhe (`white-space:nowrap` +
`flex:none`); o rótulo encolhe (`min-width:0`) e, se precisar, usa duas linhas. **Rótulo em duas
linhas é legível; número partido não é.** Escrita **uma vez** para os quatro geradores — copiada
quatro vezes, a próxima linha de dinheiro nasceria sem a regra, que é como este defeito nasceu.

**15 divergências, todas o CSS novo:** duas regras por carrinho e uma propriedade em `.fcpg-valor`.
Nada de carona — conferido lendo o texto das três saídas.

### A prova, e os dois erros que ela pegou no caminho

`linha-de-dinheiro.mjs` mede a **375 CSS px**, a largura do iPhone do dono, e conta **fragmentos de
linha** do texto (um `Range` sobre o conteúdo devolve um retângulo por linha).

1. **A primeira versão media a ALTURA DA CAIXA e mentia.** Item de flex estica por padrão, então a
   caixa do valor fica com a altura da linha inteira quando o rótulo quebra — ela acusava quebra
   onde não havia.
2. **A regra tinha caído DENTRO do `if` do desconto do Pix** no Checkout e na Mini loja. Com sinal
   ligado o desconto é zerado, então ela não sairia e o total continuaria quebrando. **Quem
   denunciou foi a lista de divergências não bater com o esperado** — a Mini loja divergia na
   passagem de fábrica e não na configurada, o que não fazia sentido.

**A prova do contrário:** o arquivo aponta para a versão publicada e **exige que ela falhe**,
reproduzindo o defeito do print. Sem isso, os "ok" não valeriam nada.

### E uma correção que as suítes existentes impuseram

A lista de classes passou a seguir **as linhas que realmente existem**: seletor para classe que o
bloco nunca emite é regra morta viajando para o site — e fez duas suítes acharem a palavra
`pixlinha` num bloco sem linha de Pix, derrubando a garantia de que, com sinal ligado, ela não
existe. **As suítes estavam certas.**

## Entregue em 13/09/2026 — descrição em cada item opcional

Pedido do dono: *"Nos opcionais dos produtos, hoje eu cadastro o nome e o valor. Eu gostaria também
de poder cadastrar uma descrição de cada item opcional e que ela aparecesse sem destaque, como na
descrição curta do produto."* Decisões dele: aparece **só na hora de escolher**, não no carrinho; e
texto longo **quebra em várias linhas**, não corta.

**Três abas têm opcionais** — Checkout, Mini loja e Agendamento por pacote, confirmado no registro
`ABAS` (são as únicas que declaram `formulario:['edops','editidx','form']`).

**Zero divergência na regressão:** com o campo vazio, nem a regra de CSS nem a linha de JS são
emitidas. Contrapartida declarada: o ramo *com* descrição não está na fotografia byte a byte — ele é
medido com o bloco **rodando**, em `descricao-opcionais.mjs` (118 verificações, a 375 px).

### Duas unificações que vieram antes do campo

- **`fcOpCopia`** — a expressão que copia um opcional (`{nome, preco, qtd}`) estava escrita
  **catorze** vezes. O campo novo é levado pela duplicação **por construção**, não por alguém
  lembrar de catorze lugares.
- **`fcApoioCss`** — a regra do cinza da descrição curta do produto passou a sair de uma fonte
  única, e as três novas saem dela. Byte a byte idêntica, provado pela regressão. Fica de fora,
  medido, `.fcm-det-d`: é outro papel (texto principal de um cartão aberto), e forçá-la mudaria a
  página de quem já usa a loja sem ninguém pedir.

### A sexta prova com referência datada — e a regra que passou a existir

`linha-de-dinheiro.mjs`, escrita na véspera, usava `main` como o lado "antes"; mesclada a rodada, o
"antes" passou a medir a si mesmo. E `meio-prio-migracao.mjs` parte 4 quebrou porque a rodada do
número de dinheiro tocou `u-out`/`m-out` legitimamente.

**Seis ocorrências em duas semanas**, duas delas escritas por mim **depois** de já ter consertado as
outras. Virou seção da `CLAUDE.md`, com três obrigações: prender o commit; **detectar** e dizer
`NÃO MEDIU` em vez de falhar; e **preferir medir a propriedade** a comparar com um congelado.

A parte 4 de `meio-prio-migracao` foi reescrita nesse espírito: em vez de "igual a um commit
antigo", ela compara **as duas escolhas da árvore de hoje entre si** e exige que as linhas
divergentes sejam **poucas** e estejam numa lista declarada. Não envelhece, e diz **onde** pode
diferir em vez de só "igual ou diferente". O teto de linhas existe porque a lista de marcas sozinha
é fraca: uma mudança grande e alheia que por acaso contivesse uma das palavras passaria por ela.

## Entregue em 13/09/2026 — upsell depois do pagamento

Spec: `docs/specs/2026-09-13-upsell-apos-pagamento-design.md`. Nas **quatro** abas de pagamento.

### O desenho, e a assimetria que manda nele

**O Pix não avisa a página quando o cliente paga.** Então: no **PayPal** o redirecionamento é
automático (houve confirmação de verdade); no **Pix** quem leva é o botão **"Já paguei"**, que já
existia. Redirecionar sozinho no Pix afirmaria uma confirmação que ninguém deu.

**Declarado ao dono, e é decisão de negócio dele:** pelo caminho do "Já paguei", a página de upsell
recebe gente que ainda **não pagou**.

### A regra de emissão: quem decide é o ENDEREÇO, não o interruptor

| Endereço | Interruptor | O bloco leva |
|---|---|---|
| vazio | desligado | **nada** — byte a byte igual a antes |
| preenchido | ligado | as duas variáveis, `ATIVO=true` |
| preenchido | **desligado** | **as duas variáveis, `ATIVO=false`** |
| vazio | ligado | **recusa gerar** |

A terceira linha é o coração do pedido — *"para não ter que ficar regerando código, eu poderia
editar diretamente o código na página"*. **Desligado não pode significar "não emitir"**, senão não
existe variável para editar. **A prova que representa o pedido:** trocar `false` por `true` no
texto já gerado, sem voltar à ferramenta, passa a redirecionar — medido **nas quatro abas**.

A quarta é recusa e não aviso: ligado sem destino **não faz nada e parece que faz**. A frase diz o
que está errado **e o que fazer**.

### O caminho C foi medido antes de escrito

A dúvida real era se `window.open` (WhatsApp) e a navegação da página conviviam.
`upsell-janela.mjs`: seis cenários de ordem, duas larguras, três passagens — **a aba do WhatsApp
nunca é perdida**, zero intermitência. *Alcance declarado: é o Blink do Playwright, não é prova
sobre o Safari do iPhone.*

- Sem WhatsApp configurado **não existe botão**, logo não existe caminho C — o upsell continua
  valendo pelo cartão.
- **No Agendamento por pacote não há "Já paguei" nenhum** — o botão daquela aba só serve à recusa e
  ao vencido. **O C não se aplica a ela**, medido no texto do bloco, e a ajuda do campo diz isso.

### O que não foi tocado, com o motivo

- **Nenhum link de cobrança muda um byte** (endereço fixo da página, não viaja no link) — e o código
  1 **muda**, que é o que impede a medida anterior de ser vacuidade.
- **A `/pagar` continua fora da extração:** compartilha-se `fcUpsellChamada` (o texto que escreve a
  chamada), não o `onApprove`, que já está registrado como divergente em quase toda linha.
- **`fc-compartilhado.js` e `cobrar/` intocados** — nada de versão para trocar.
- Validação do endereço: **reusou** `cUrlOk`/`urlLimpa` da Contagem regressiva. Recusa
  `javascript:` (inclusive com tabulação no meio), `data:`, barra invertida e protocol-relative.

### Dívida registrada — decisão do dono

**A prévia navega.** Com o upsell ligado, clicar em "Já paguei" **dentro da prévia** leva a prévia
para a página de upsell, porque a prévia executa o bloco de verdade. Medido que **não dá** para
neutralizar como o `window.open` já é: `location` é *unforgeable* no Chromium — `defineProperty`
lança, e atribuir `location.assign` falha **em silêncio**, que é pior. Mexer em qualquer campo
remonta a prévia. A diferença está declarada nos `<p class="ajuda">` das três prévias que têm o
botão. Remontar sozinha ao detectar a saída é rodada curta à parte — não foi feita por conta
própria porque a requisição à página do dono **já aconteceu** quando a detecção seria possível, e
uma guarda parcial sugeriria proteção que não existe.

## Entregue em 13/09/2026 — "Já paguei" no Agendamento por pacote

O dono perguntou por que aquela aba tinha upsell pelo cartão e não pelo Pix. A resposta que eu tinha
dado — *"o caminho C não se aplica a esta aba"* — **descrevia o defeito como se fosse o desenho**.

Medido: a maquinaria existia (`botaoZap`), mas só era chamada em **dois** lugares — o recado de link
adulterado e o de prazo vencido. **Nunca depois de gerar o Pix.** A aba foi espelhada no Checkout em
setembro e a peça ficou para trás. Nenhuma linha do código justificava a ausência; o que havia de
comentário justificava o *texto* diferente **dado que** o botão não existia.

**Duas divergências, só `a-out3`**, nas duas passagens (+1.440 bytes). As outras 24 saídas e as 9
cobranças, bloco e link, byte a byte idênticas.

### O efeito colateral que veio junto

`aRecusa` exigia o WhatsApp **sempre**, enquanto `u`/`m`/`p` só o exigem quando o botão está ligado.
Quem configurasse aquela aba em "somente cartão" não conseguia gerar sem preencher um número que o
bloco nem usava.

### A mensagem: nada inventado

Nove dos dez padrões saem de `FC_TXT_FABRICA`. Com sinal, abertura própria e as três linhas
(total/sinal/saldo); sem sinal, abertura, desconto do Pix e valor pago. Duas divergências
deliberadas e declaradas: `txtZapPago` é campo **novo** (o `txtZapBotao` que já existia rotula os
recados de recusa, onde ninguém pagou nada), e o saldo diz *"Restante no dia do ensaio"* — "entrega"
nomeia um momento que numa reserva não existe.

`txtPixManual` **voltou para a fábrica única**: ele só divergia porque o botão não existia. Quem já
tinha a frase antiga gravada não a perde.

### Os registros que mentiam, corrigidos

Dois textos de ajuda e três comentários diziam ao dono que ali o upsell só funciona pelo cartão —
verdade enquanto o botão não existia, mentira a partir de agora. **Registro que descreve como
desenho o que era falta manda procurar no lugar errado, e quem lê confia.**

### Seis divergências novas, para as levas seguintes

1. A `/pagar` tem outro modelo de mensagem (uma frase só contra nove linhas configuráveis).
2. A tabela dos textos do WhatsApp é escrita à mão **três vezes** — há molde pronto (`fcSinalTxtDefs`,
   `fcObFbDefs`) para um `fcZapTxtDefs(pref)`.
3. A `a` não tem interruptor de "Já paguei" (as outras três têm) — consequência: o `pixManual` sai
   sempre nela e só com o botão ligado nas irmãs.
4. Duas mecânicas para o mesmo botão: `window.open` em `u`/`m`, âncora `target=_blank` em `p`/`a`.
5. A Mini loja guarda a linha do cupom com `if(usaCupom)` e o Checkout não.
6. Só a Mini loja dá retorno visual depois do clique (`TXT_PEDIDO_ENVIADO`) e esvazia a cesta.

## Entregue em 13/09/2026 — unificar as abas de pagamento, leva 2

Pedido do dono: *"Todos os construtores que têm pagamento devem ter as mesmas regras, mesmas
configurações, etc."* Uma varredura catalogou **41 divergências**; esta leva pegou as que afetam
dinheiro, recusa ou link, mais as cinco decisões dele.

### Os quatro consertos — e duas premissas MINHAS que a medição derrubou

1. **`aTotalMaximo` criada.** O Agendamento aceitava publicar uma página que ninguém consegue pagar
   (sinal fixo acima do maior pedido possível). O teto é **o maior pacote, nunca a soma** — a
   vitrine leva a um pacote só, e somar daria um teto inalcançável. Medido: 400 gera (os opcionais
   entram), 800 gera (limite exato), 801 recusa; e com dois pacotes sem opcionais, 501 recusa
   (prova que não soma).
2. **`u-cod`: a premissa do meu enunciado estava errada.** Eu disse que faltava `maxlength` — ele
   **tem**, aplicado na partida por `fcLimIniciar`. O que passava calado era o **caractere**:
   `Pedido No 1 - Natal/2026` chegava ao extrato como `PedidoNo1Natal2026`. Alinhado pela Mini loja:
   **recusa, não filtro**, que é a regra já escrita na própria tabela de limites.
3. **O endereço da página de obrigado: a guarda estava errada, não a mensagem.** Medido —
   `urlobrigado` tem **um** consumidor, a lista que o dono cola dentro do TidyCal, e quem redireciona
   é o TidyCal, de fora do site. Não há uso legítimo de caminho relativo. Passou a usar `pUrlOk`.
4. **O segundo laço do WhatsApp removido** no Checkout. Com resumo ligado a saída é byte a byte a
   mesma — o ramo começava exatamente ali.

**A outra premissa derrubada:** a aba `a` **já estava** em 5% de desconto. Quem muda são `u` e `m` —
e é por isso que `a-out1`/`a-out3` não divergiram.

### As cinco decisões do dono

Preço zero **recusado** nas quatro (opcional a R$ 0,00 continua válido); resumo copiável **ligado**;
desconto do Pix **5%** nas três de catálogo; separador **neutro "OU"**; passo do percentual **0,5**.

**`fcSepNeutro` entrou sem ser pedido, e com razão medida:** trocar a fábrica **não chega** a quem já
usou a ferramenta — o estado dele já tem a frase antiga, e valor gravado vence padrão. Sem migração
a decisão não aconteceria no único navegador que importa. Só troca o que for, caractere por
caractere, uma das fábricas anteriores. **Descpix e resumo não ganharam migração** — o número é
dinheiro e o interruptor pode ter sido desligado de propósito; as decisões dizem "de fábrica".

**Órfãos removidos:** `FC_ORD_PARES.ou`/`.ouDesc` e as linhas `u`/`m` de `FC_ORD_TXT`. **Não
removidos, e por quê:** os campos `u-txt-ou-desc`/`m-txt-ou-desc` — apagá-los sumiria em silêncio
com texto que o dono pode ter escrito, e mexeria no inventário do que fica gravado.

### Quatro divergências, todas explicadas

`u-out` e `m-out`, nas duas passagens. **Nenhuma cobrança e nenhum link mudaram.**

### Três asserções que esta leva envelheceu — consertadas, não silenciadas

`meio-prioritario` cobrava que o separador **nomeasse** o meio de baixo; trocou de pergunta (o
separador de fábrica não nomeia nenhum dos dois, nas duas ordens). `meio-prio-migracao` ganhou o
destino de hoje — são duas migrações em fila agora. `textos-migrados` passou a aceitar **lista** de
fábricas trocadas: o separador teve três, e com um valor só o arquivo passaria contra uma referência
e falharia contra outra.

**Um defeito no próprio teste, achado porque estava lento:** a parte 4 usava opcionais de rádio; a
marcação falhava calada atrás do marcador desenhado, e quem acabava zerado era um opcional não
marcado — **passava dizendo menos do que promete.**

### Nove divergências novas, para as levas seguintes

Duas da mesma classe que esta leva consertou: `a-prefixo` **sem regra de caractere nenhuma** (entra
no txid e consome orçamento errado), e `a` exigindo WhatsApp incondicionalmente. Mais: `aRecusa` lê
o DOM em vez do `cfg`, contra o que o próprio cabeçalho dela promete; `mTotalMaximo` lê preço sem
trocar vírgula por ponto; `FC_LIM_CAMPOS` ignora `m-cod`/`a-pcod`/`a-prefixo`; o `max` de
`sinalfixo` está nas tabelas e em nenhum `<input>`; e **todas as recusas do Link de cobrança saem
sem acento**, contra a norma registrada.

## Entregue em 13/09/2026 — PayPal item a item, a prévia do relatório, e o centavo do desconto

Pedido do dono: *"que cada construtor que tem pagamento via PayPal me mostre uma prévia de como
ficará no relatório do PayPal os campos que são levados para lá. Verifica se todos os construtores
estão levando o produto e seus opcionais."* Decisões em
`docs/decisoes-2026-09-13-paypal-e-centavo.md`.

### O que ia ao PayPal, medido

**Uma linha só**, com os nomes concatenados e cortados em 127 caracteres. E `nomesSelecionados()`
divergia: Checkout e Mini loja mandavam **só produtos** — os opcionais entravam no valor e **não
apareciam**; só o Agendamento os incluía. Mais uma da família do "Já paguei": peça que a aba nova
ganhou e as duas antigas não.

### O desenho: a conta fecha por construção

`items` com preço cheio e quantidade real; `item_total` é a **soma dos itens em centavos inteiros**
(nunca `subtotal()`, que soma os mesmos números em outra ordem); `discount` é a **diferença**
`item_total − amount`, **nunca o percentual recalculado**.

A diferença importa porque o PayPal **recusa o pedido inteiro** se a conta não bater ao centavo — o
cliente fica sem botão para pagar. Recomputar o percentual reintroduziria o arredondamento; pela
diferença, a identidade `amount = item_total − discount` é aritmética.

**Com sinal, mantida a linha única:** não há conceito de entrada no formato do PayPal, e forçar a
diferença para `discount` faria o recibo chamar de **desconto** o saldo que o cliente ainda deve.

**Item de R$ 0,00 fica de fora** — a spec permite valor zero, mas a lista de erros 422 traz
`CANNOT_BE_ZERO_OR_NEGATIVE` **sem dizer a que campos se aplica**. Apostar em comportamento não
documentado custaria o pedido inteiro. Decisão do dono: aceitar a ausência.

**A sonda manuscrita da aba Link de cobrança (~40 linhas quase iguais) foi apagada** — a prévia das
quatro abas agora lê do `createOrder` do próprio bloco.

### O centavo do desconto

`descontoAtual()` multiplicava em ponto flutuante e arredondava depois. Medido antes de mexer, em
**79.200.000** combinações: **133.476 divergiam da conta exata (0,169%), e em TODAS o cliente pagava
a mais.** Em nenhuma pagava a menos — viés, não ruído. Em centavos inteiros: **zero divergências nas
mesmas 79.200.000.**

**Não era incoerência entre tela e cobrança** — tela, Pix e PayPal mostravam e cobravam o mesmo
número. Por isso nenhuma suíte o pegou: todas comparam as pontas entre si, e as pontas concordavam.
Quem o pega é comparar com uma conta **exata**, e é o que `centavo-do-desconto.mjs` faz.

### Duas coisas que o conserto revelou no próprio arnês

1. **A transcrição de `sinal.mjs` repetia a forma antiga.** Ela existe para ser segunda opinião —
   e **transcrição que repete o erro do original não é segunda opinião, é eco.** Passou a fazer a
   conta exata.
2. **O caso B+D saiu da família do meio centavo** por causa do conserto (o total foi de 333,95 para
   333,94). Trocado por A+B+D, que a varredura mostra ainda nela. O que o teste protege é o
   **comportamento** no meio centavo, não aquele subconjunto.

### Um defeito no teste novo, meu

A primeira versão de `centavo-do-desconto.mjs` chamava `new Function()` **dentro do laço** — 79
milhões de compilações, mais de dez minutos, e o custo era todo do compilador. Compilado uma vez:
**4 segundos**, medindo exatamente o mesmo.

## Entregue em 13/09/2026 — unificar as abas de pagamento, leva 4 (configuração e textos)

Catorze itens feitos, três **justificados** e deixados como estavam, quatro declarados com a
medição sem mexer, **três parados esperando a palavra do dono**.

**Duas divergências**, as duas `m-out` (+73 bytes). **Nenhum link e nenhuma cobrança mudaram.**

### O item que saiu na direção oposta à primeira leitura

Eu tinha catalogado como defeito a máquina de cupom ser emitida **sem cupom cadastrado** em `u` e
`a`, com a Mini loja "fazendo certo" ao recortá-la. **A justificativa escrita estava do outro lado,
em três abas:** *a lista `CUPONS` é editável dentro do bloco publicado*, e amarrar o bloco à
configuração do momento de gerar já custou uma rodada a este projeto.

Quem estava fora do padrão era a Mini loja. Custo medido, não estimado: bloco sem cupom cadastrado
vai de **43.415 para 46.975 caracteres (+8,2%)**. Em troca, o cupom escrito à mão dentro do bloco
publicado volta a funcionar — caminho que o recorte matava em silêncio.

**A lição:** a varredura marcou "não" na coluna de justificativa porque **não leu a documentação
inteira** — e declarou esse limite. Ler a justificativa antes de arrumar inverteu o conserto.

### Correção a uma premissa minha

Eu disse que o prefixo sujo do Agendamento **consumia orçamento errado** na conta do identificador.
**Não consumia:** `fcIdUteis` limpa antes de contar, igual ao bloco. O que passava calado era só o
caractere — real, mas menor do que eu descrevi.

### Justificados — divergência que é decisão

- **`a` exigir WhatsApp**: a regra é a mesma das irmãs ("exija o que o bloco usa"); ali o `botaoZap`
  escreve três botões, dois deles recados de recusa que existem em qualquer forma de pagamento.
- **`u-cod` vazio cair em `'PEDIDO'`**: comentário em `uRecusa` explica.
- **Só a Mini loja dar retorno visual** depois do clique: só ela guarda cesta; nas outras não há o
  que esvaziar.

### Declarados com a medição, sem mudar código

Onde moram os textos do sinal (mover campo é leva 5); as duas mecânicas do botão (cada forma tem
medição própria — trocar joga uma prova fora sem o cliente ver diferença); a mensagem da `/pagar`
(não há carrinho: nove campos dariam sete sem consumidor); e a `description` do PayPal (cortada em
127; o registro é `items[]`, idêntico nas três desde a leva 3).

### Achados fora da lista, resolvidos

Nove textos eram literais escritos à mão em duas ou três tabelas, **todos concordando** — viraram
entradas de `FC_TXT_FABRICA`. *Cópia que concorda hoje é a que diverge amanhã.*

E o contador de limite podia **mentir** quando o valor chega sem teclado (limpar, editar, duplicar
pacote, aplicar preset da aba e preset geral): cinco chamadas que faltavam.

### PARADO — precisa da palavra do dono

1. **`CHAVE_PIX` da aba `pac`.** Quatro das cinco linhas passaram a ler do `cfg` (byte a byte
   idênticas). A quinta não: `cfg.chave` passa por `pixLimpar` e `fciVal` por `fcTrim`, que aparam
   conjuntos **diferentes** de invisíveis — trocar mexeria no **payload**. Achado junto, e é o mais
   sério: hoje `aRecusa` valida a versão limpa e o gerador emite a outra. **Quem tiver invisível na
   ponta da chave Pix é validado por uma string e cobrado por outra.**
2. **Renomear `txtPixRotulo` (dois significados) e o `t4` da `/pagar`.** Renomear chave **zera o
   campo de quem já customizou** — atinge backup em arquivo.
3. **Qual frase de "código copiado" as quatro vão dizer.** A fonte já é única; escolher o texto é
   redação para o cliente.

## Entregue em 14/09/2026 — unificar as abas de pagamento, leva 5 (aparência)

A última da unificação. **Doze itens alinhados, três justificados, um parado.**

**Dos 15 catalogados, 2 eram decisão registrada** — e os dois que a varredura errou eram os que
custariam mais caro. A justificativa do item 15 **não estava em comentário nem em `docs/`: estava no
texto da tela**, que é onde varredura de código não olha. Outros seis tinham comentário ao lado que
*parecia* justificativa e explicava **quando a regra é emitida**, nunca a aparência.

### Dois casos em que a MAIORIA era o lado errado

- **A moldura do QR.** Medido com a biblioteca de verdade: o canvas sai com **zero pixel branco nas
  bordas**. A chapa branca do Checkout era a **única zona quieta** das quatro, e as quatro têm fundo
  de cartão configurável. Alinhar pela maioria espalharia a fraqueza — a chapa foi dada às outras.
- **A cor do aviso do Pix.** As quatro têm a cor do texto configurável. **Cor fixa dentro de um véu
  translúcido ignora a escolha do dono.** As quatro passaram a herdar.

### O achado que mais valia

**`font:700 13px/1.2 inherit` não é CSS válido** — `inherit` não é nome de família, e o navegador
**descarta a declaração inteira, em silêncio**. Medido com o bloco rodando: os **nove botões da Mini
loja** e o `.fca-trocar` da vitrine saíam em **400 / 13,33px / Arial**, não no peso, tamanho e fonte
do site. O controle vizinho escrito sem o atalho saía correto. Dez declarações corrigidas.

### 19 divergências, todas intencionais

Cinco saídas mudaram, em 60 linhas. **Nenhuma cobrança e nenhum LINK mudaram** — os nove links byte
a byte idênticos, o selo intacto, e a `/pagar` aceita tudo o que já foi enviado.

### A sétima referência congelada

`meio-prio-migracao.mjs` parte 4 comparava uma saída byte a byte com `main` e virou vermelho
permanente quando o conserto do `font:` a mudou. Agora diz `NÃO MEDIU` e ganhou uma propriedade que
não envelhece. **Sétima ocorrência** — a regra da `CLAUDE.md` segue sendo cobrada na prática.

### A armadilha que mordeu durante a escrita da prova

A área do Pix do Checkout **nunca abria**, e 30 valores foram lidos de elementos escondidos até
entrar a guarda "a área do Pix abriu de verdade". **Teste que não alcança o estado não prova nada
sobre aquele estado** — de novo.

### PARADO — precisa da palavra do dono

O **campo configurável de tamanho do QR** existe só no Link de cobrança. Dá-lo às outras três cria
chave nova no estado, no preset e no "Exportar tudo" — formato do que fica gravado, que atinge
backups em arquivo. Alinhado só o número fixo (220 → 200 nas quatro).

## Entregue em 14/09/2026 — as três decisões do dono

### 1. A chave Pix da aba `pac`: validada por uma string, cobrada por outra

`aRecusa` validava a chave passada por `fcTrim` e o gerador emitia a passada por `pixLimpar` — os
dois aparam conjuntos **diferentes** de invisíveis. Passou a usar `pixLimpar` nas duas pontas: é a
que já governa o payload, a que `pixChaveErro` confere e a que a `/cobrar` usa dos dois lados.

**O defeito foi provado ANTES do conserto**, e é o que dá valor à prova: chave com U+200B na ponta
era **aceita**, e a **prévia** emitia com o invisível enquanto a **textarea** emitia sem — os dois
blocos executados produziram **BR Codes diferentes, os dois fechando o CRC**.

**O alcance, medido e não suposto:** o defeito **não** chegava à textarea entregue (`aGerar` limpa
antes) **nem** pelo estado gravado (a partida limpa e regrava). O caminho que alcança é a
**colagem** — `input` não corrige o campo mas dispara a prévia em 400 ms, que executa o bloco com a
chave suja. É o gesto mais provável de todos: colar a chave vinda do app do banco e conferir na
prévia. **A primeira versão do teste não alcançava o estado** e foi refeita.

**As outras três abas não tinham o descompasso** — virou varredura estática, para não voltar.

### 2. Os dois renomes, com conversão

`txtPixRotulo` → **`txtSecaoPix`** na `pac`: o nome que o Link de cobrança **já usa para este mesmo
texto**. Um terceiro nome criaria um terceiro vocabulário para um papel só. Agora `txtPixRotulo`
significa **uma** coisa em toda a ferramenta.

`t4` → **`txtZapBotao`** na `cob`: o mesmo papel das irmãs, sem colisão.

**Os ids dos campos não mudaram, de propósito:** o id não é persistido, e renomeá-lo faria o cenário
— que dirige **as duas** árvores na regressão — estourar contra qualquer referência anterior.

**Correção de uma afirmação do próprio executor:** ele escreveu que "a chave antiga fica no estado";
a medição desmentiu (`coleta()` reescreve o fragmento inteiro). Comentário e asserção corrigidos
para o que foi medido.

### 3. A frase do "código copiado"

As quatro dizem `Código copiado! Cole no aplicativo do seu banco.` A segunda entrada de fábrica foi
removida — duas entradas com a mesma string seriam duas fábricas para divergir.

**Quem já personalizou não é tocado, e aqui isso é o desejado.** A diferença para o separador "OU",
que **precisou** de migração: a frase curta continua **certa**, só mais curta; "ou pague com cartão"
ficaria **errado** depois da decisão do meio prioritário. Está escrito nos dois lugares **para
ninguém copiar a migração por analogia**.

### Quatro divergências, todas do item 3

Uma linha em `u-out` e uma em `m-out`, nas duas passagens. As saídas dos dois renomes (`a-out3`,
`p-out1`) saíram **byte a byte idênticas**, como tinham de sair. Nenhuma cobrança, nenhum link.

### A oitava referência congelada

`meio-prio-migracao.mjs 4c66719` acusava 1 falha numa árvore sem defeito: a linha exigia uma
referência **anterior a 12/09 e posterior a 13/09** ao mesmo tempo — condições que não se encontram
e não vão passar a se encontrar. Passou a dizer `NÃO MEDIU`.

## Entregue em 14/09/2026 — SKU próprio por produto e por item opcional

Spec: `docs/specs/2026-09-14-sku-por-item-design.md`. O dono olhou a prévia do relatório do PayPal
que a leva 3 criou e viu que **todas as linhas levavam o mesmo `sku`** — o código do pedido. E
nomeou a distinção que resolve: *"Código do pedido é uma coisa... SKU de produto e o SKU para cada
um dos itens opcionais é outra."*

**Não era ausência de informação: era informação que não distingue nada, com cara de que distingue.**

**Seis campos novos**, com contador à vista. O **pacote não reaproveita o código do TidyCal** —
decisão dele, pela própria distinção: aquele código identifica o **agendamento**, não o produto
vendido. A opção "se vazio, herda o do TidyCal" foi oferecida e **recusada**, pelo motivo certo:
olhando o relatório não daria para saber se o valor foi escolhido ou herdado.

### As decisões dentro da recusa de SKU repetido

- **Comparação literal:** `ALB20` e `alb20` geram. O código do pacote é comparado em maiúsculas
  porque o Pix apaga a diferença **dentro do payload**; aqui não há payload — o `sku` vai ao
  relatório byte a byte, e recusar inventaria uma colisão que não existe.
- **Duplicar deriva o SKU com `-COPIA`**, a regra que já valia para o código do pacote. Cópia com
  SKU intacto nasceria recusada; cópia com campo vazio perderia o que o dono cadastrou.
- Chave com prefixo, para um SKU chamado `constructor` não achar o protótipo.

### O defeito que a regressão pegou, e era do próprio executor

`temSku` nasceu num gerador e quem escreve a lista de itens da Mini loja é **outro** — o bloco morria
inteiro com `temSku is not defined`, e a saída da Mini loja saía **vazia**. Pega pela regressão, não
por leitura.

### Três acoplamentos ao defeito antigo, no arnês

`sinal.mjs` cobrava `sku === custom_id` em quatro casos e `pac-quantidade.mjs` montava a descrição
esperada lendo o código do pedido de `items[0].sku`. **As duas provas dependiam do defeito para
passar.** Passaram a ler o `custom_id`, e `sinal.mjs` agora cobra a **ausência** da chave.

### Rider por analogia

`txtCopiado`/`txtNaocopiou` da aba `cob` → `txtPixCopiado`/`txtPixNaocopiou`, com a mesma conversão
das duas que o dono autorizou. Era a **terceira** da mesma família; as quatro abas agora concordam.

## Entregue em 14/09/2026 — Novidades: as release notes dentro da ferramenta

Pedido do dono, e logo depois a regra que o acompanha: *"sempre que alterar algo no projeto, seja
melhoria, seja correção, o release notes tem que SEMPRE ser atualizado."*

**59 versões** — as 58 que o git conhece mais a desta rodada. Agrupadas por **dia**: 10 seções
recolhíveis mais uma de "antes da numeração", a mais recente nascendo aberta. 59 cabeçalhos
recolhidos seriam parede também.

### Onde vive, e por quê

**Terceiro painel da barra do topo**, ao lado de *Detalhes* e *Identidade* — **não é aba**. As abas
de `ABAS` são construtores: coletam, restauram, guardam preset, entram no preset geral e no painel
consolidado. Uma aba que não gera nada viraria exceção em cada um desses lugares, e `fcAbasTxt()`
passaria a contar uma página de texto como construtor — **16 frases** mentiriam por um.

### O texto mora DENTRO do `index.html`, e a razão é a própria lista

Um arquivo próprio era viável e **seria o defeito que esta lista existe para descrever**: arquivo
separado tem validade própria no cache, então a ferramenta poderia anunciar uma versão enquanto a
lista para noutra — cada uma certa sobre si, **a dupla mentindo**. Aqui a lista viaja nos mesmos
bytes que o `FC_VERSAO` que ela descreve; a divergência é impossível por construção.

Custo medido: **+31 KB (+2,6%)**, desenho de **2,6 ms / 518 nós**, na primeira abertura e não na
partida.

### As três redes

Detalhadas na `CLAUDE.md`. **São exercitadas, não prometidas:** a árvore é servida de novo com um
byte trocado (uma versão não descrita) e as guardas têm de acender nomeando-a.

### Achado resolvido no caminho

`fcdLigar` **não era idempotente**. O painel cria seções recolhíveis depois da partida; uma segunda
chamada penduraria um segundo ouvinte nos cabeçalhos das abas, o clique alternaria duas vezes e **a
seção nunca mais abriria — sem erro nenhum no console.**

### Declarado

**A busca do topo não alcança as Novidades** — medido, não suposto: ela varre campos de formulário
dentro dos painéis, e o painel não tem campo nenhum.

## Entregue em 14/09/2026 — tamanho do QR configurável nas quatro abas

O campo existia só no Link de cobrança. O dono autorizou dá-lo às outras três **depois de eu
recomendar não fazer** — a recomendação vinha de uma explicação coerente (lá o QR **é** o conteúdo
da página; nas outras é um elemento no meio de um carrinho), mas **não havia justificativa escrita**,
e a decisão é dele.

**Padrão de fábrica 200, não 180** — é o número que as três já emitiam. Padrão que muda a saída sem
ninguém pedir é o que a regressão existe para denunciar. **Zero divergência**, e o zero é a prova:
quem não mexer no campo recebe exatamente os mesmos bytes.

**Medido com a biblioteca de verdade**, não pelo CSS emitido: 140 px no Checkout, 260 na Mini loja,
320 no Agendamento — **três números diferentes de propósito**, porque com um só um bloco lendo o
campo da aba errada passaria.

**Dois comentários que afirmavam "o campo não foi estendido às outras três" foram corrigidos.**
Registro que descreve o passado como presente manda procurar no lugar errado.

A legenda do fieldset da aba `pac` passou de "Cores" para "Aparência" — o conjunto deixou de ser só
de cores. Única mudança de texto de interface fora dos campos, declarada por isso.

**Primeira rodada sob a regra das release notes:** a entrada foi escrita antes do carimbo, e
`conferir-versoes.sh` a exigiu.

## Entregue em 14/09/2026 — itens com SKU e upsell por cobrança, no link

Duas decisões do dono na mesma rodada **de propósito**: as duas acrescentam parâmetro ao link, e
juntas custam **um** recolar do código 1 em vez de dois. O que destravou a segunda foi ele informar
que **não tem links pendentes de pagamento**.

### A forma no endereço: tamanho-ponto-valor, e não separador

`18.Ensaio de gestante5.ENS016.900.00`. Com separador, um nome que o contivesse precisaria ser
**proibido** ou **escapado** — e o escape teria de sobreviver ao `encodeURIComponent` que embrulha o
parâmetro inteiro, que é onde defeito silencioso mora. Com o tamanho na frente, o leitor nunca
procura separador **dentro** de um valor: nenhum caractere é proibido e o preço pode ter o próprio
ponto. É o idioma que o selo já usa, e o `.` não custa bytes ao ser codificado.

### O selo: `i` e `u` entram EM PAR, e isso não é enfeite

Com serialização por comprimento, empurrar só o preenchido faria **"i sem u" e "u sem i" produzirem
a mesma lista** — um link com itens poderia ser re-selado como um link com upsell, **com a conta
fechando**. É o mesmo defeito que fez `t` e `x` entrarem juntos. A suíte **forja essa troca** e
exige recusa.

**O padrão condicional ficou, e o motivo mudou:** deixou de ser "não quebrar o que já foi enviado"
(não há) e passou a ser **"permitir que o próximo parâmetro entre sem quebrar nada"** — e no dia do
próximo pode haver cobrança em aberto.

### Duas recusas que valem mais que a funcionalidade

- **A soma dos itens tem de bater ao centavo** com o valor da cobrança, senão a ferramenta recusa
  dizendo os dois números. Não há cupom nem carrinho aqui: sobrar diferença faria o relatório do
  PayPal chamar de **desconto** um número que ninguém descontou.
- **Itens e sinal não convivem, e a ferramenta recusa** em vez de emitir e deixar o bloco ignorar.
  Emitir seria pior: o dono veria o link crescer e o relatório continuar com a linha única, **sem
  uma palavra**.

### As variáveis do upsell passaram a sair SEMPRE na `/pagar`

Antes só saíam com o campo preenchido. Mesma razão medida do desconto e do sinal: **o bloco não pode
depender do que estava configurado no dia em que foi gerado** — senão o dono manda um link com
upsell pela `/cobrar` e a página não sabe o que fazer com ele.

### 11 divergências, todas a mesma

`p-out1` (25.612 → 32.335 bytes) e as nove fotografias dela nos cenários. **Nenhum dos 9 links
mudou** — `p-out2` continua em 231 bytes. As 24 outras saídas, mesmo hash.

Tamanho do link, medido: 231 simples · 259 um item · 362 cinco itens · 365 itens + upsell.

### Três suítes envelheceram e foram consertadas, não silenciadas

`sinal-cobranca` fixava o **texto inteiro** da assinatura do selo e passou a medir a **propriedade**
(sobrevive ao próximo parâmetro); `upsell` exigia um comportamento que deixou de valer **só numa
aba** e passou a pular aquela **dizendo por quê**; `textos-migrados` ganhou as duas chaves novas.

## Entregue em 14/09/2026 — prévia na página /cobrar

Spec: `docs/specs/2026-09-14-previa-na-cobrar-design.md`. Duas metades **independentes**.

### 1. A página REAL, não um desenho

Um quadro carregando a `/pagar` publicada do dono, com o link recém-gerado. Fiel por construção.
Desenhar a página ali seria **segunda implementação** do que o bloco faz — a `/cobrar` não tem o
gerador, e a regra da casa é *"prévia roda o gerador, não imita o gerador"*.

**Quem rola é a caixa, não o quadro:** o iframe tem 1100 px e a caixa 520, com rolagem própria —
assim a página inteira é alcançável sem um toque entrar nela. `pointer-events` desligado, medido no
estilo computado.

**O efeito colateral é a maior vantagem:** bloco desatualizado → a prévia mostra **a recusa**.
Provado servindo um bloco gerado na árvore anterior à leva 10. Até agora isso só apareceria **com o
cliente na frente**.

### 2. A tabela do PayPal, da mesma fonte

Lida do pedido que o **mesmo texto** do bloco monta. Foi para `fc-compartilhado.js`:
`P_PP_PEDIDO_SRC` (o corpo do `createOrder`, movido **verbatim**, convertendo as linhas `j+='…'` por
script para não redigitar um byte), `fcPpItensSrc`, os tetos, `FC_PP_CAMPOS` (os nove nomes, que a
sonda passou a ler em vez de literais) e `pPpPedidoApi()`, no padrão de `fcPixApi`.

**Não** foi compartilhado o desenho da tabela — o da ferramenta é texto JS que roda dentro do
iframe; o da `/cobrar` é DOM da página em largura de celular. Declarado no código, e **a paridade é
provada por teste em vez de por construção**: três caminhos comparados para a mesma cobrança.

### A falta de rede, em três camadas

`navigator.onLine` falso nem cria o quadro; enquanto carrega, aviso dentro da caixa; e na espera de
15 s **pergunta-se ao próprio iframe se ele chegou a navegar** — leitura que lança significa que
navegou para o site do dono (mantém o quadro). Sem essa distinção, a espera derrubaria uma prévia
que está lá toda vez que o SDK do PayPal demorasse.

### Achado pelo caminho, e não era desta rodada

`aparencia.mjs` falhou uma vez medindo a zona quieta do QR. **`m-out` era byte a byte idêntico** e a
mesma suíte passava em `main`. Causa: a medida lia **uma** linha do canvas, e o código do pedido da
Mini loja embute `Date.now()` — o desenho muda a cada execução. Passou a ser o **menor branco entre
todas as linhas**, que é o que "zona quieta" significa. Quatro execuções seguidas, 201/201.

**Regressão: zero divergência.** É prévia, não gerador.
