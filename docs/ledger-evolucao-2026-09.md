# Ledger da evolução — 25/08/2026 em diante

Segundo volume do histórico das rodadas. O primeiro, `docs/ledger-evolucao-2026-08.md`, vai
até 24/08/2026 e para ali. Este cobre o que veio depois, a partir de `2026-08-25a`.

**Este volume é o corrente: toda rodada publicada escreve a linha dela aqui, no mesmo commit
que vai ao ar.** Sem essa regra ele morre como o primeiro morreu — o de agosto parou em 24/08
e ninguém notou por 22 dias, 57 versões. A regra está no `CLAUDE.md`, ao lado da release note,
e pelo mesmo motivo: compromisso que depende de alguém lembrar já falhou aqui.

## O que este arquivo é

Um registro do que cada rodada entregou e de quanto ela custou. Não substitui a
`docs/pendencias.md`, que é onde setembro ficou registrado com método e medição; substitui a
ausência de um lugar onde o histórico esteja em ordem, com o tempo ao lado.

## Como o tempo foi medido

<!-- INDICE GERADO -- nao edite a mao: sh scripts/ledger-indice.sh -->

## Índice

> Gerado por `sh scripts/ledger-indice.sh`. Uma linha por rodada, na ordem em que saíram.

- **1. Acabamento da aba Efeitos de página — 25/08/2026**
- **2. O formato da data da página de obrigado — 25/08/2026** · `2026-08-25c`
- **3. O marcador `{prazo}` na barra de contagem — 25/08/2026** · `2026-08-25d`
- **4. "Gerar todos os códigos" no painel consolidado — 25/08/2026**
- **5. O pedido que chega ao painel do PayPal — 27/08/2026** · `2026-08-27a`
- **6. A validade do cupom na linha do desconto — 01/09/2026** · `2026-09-01a`
- **7. "Válido até" com os dois acentos — 01/09/2026** · `2026-09-01b`
- **8. Todo texto que uma pessoa lê passa a sair acentuado — 01/09/2026** · `2026-09-01c`
- **9. WhatsApp acentuado e a frase da loja unificada — 01/09/2026** · `2026-09-01d`
- **10. A frase única do pedido zerado no Checkout — 01/09/2026** · `2026-09-01e`
- **11. A décima aba: Agendamento por pacote — 02/09/2026** · `2026-09-02a`
- **12. A v2 da décima aba — 02/09/2026** · `2026-09-02b`
- **13. Os consertos da revisão pós-v2, e o seletor de forma de pagamento — 02/09/2026** · `2026-09-02c`
- **14. Rodada única: os textos configuráveis e as famílias de pacotes — 02/09/2026**
- **15. Valor mínimo do pedido para o cupom valer — 02/09/2026** · `2026-09-02g`
- **16. A leva dos achados — 02/09/2026** · `2026-09-02h`
- **17. Aplicar um preset zera o formulário de cadastro — 03/09/2026** · `2026-09-03a`
- **18. O endereço completo do TidyCal — 03/09/2026** · `2026-09-03b`
- **19. A altura do calendário, e o ouvinte que era código morto — 03/09/2026** · `2026-09-03c`
- **20. Um calendário só: os três caminhos com a mesma implementação — 03/09/2026** · `2026-09-03d`
- **21. Os dois interruptores do calendário viram campo — 03/09/2026** · `2026-09-03e`
- **22. Duplicar pacote e duplicar opcional — 03/09/2026** · `2026-09-03f`
- **23. O formulário de cadastro sobrevive à recarga por inteiro — 03/09/2026** · `2026-09-03g`
- **24. Cupom com código repetido recusado nas três abas — 03/09/2026** · `2026-09-03h`
- **25. Duplicar nas demais listas, e a família com o conteúdo dela — 03/09/2026** · `2026-09-03i`
- **26. O calendário aquecido antes do clique — 04/09/2026** · `2026-09-04a`
- **27. Aquecer o calendário com a largura real — 04/09/2026** · `2026-09-04b`
- **28. Pré-carga dos calendários, com três opções e um quadro por pacote — 04/09/2026** · `2026-09-04c`
- **29. A corrida entre o `embed.js` do TidyCal e o nosso aperto de mão — 04/09/2026** · `2026-09-04d`
- **30. Limites visíveis nos campos que alimentam API — 11/09/2026** · `2026-09-11a`
- **31. Recusa dos identificadores com orçamento composto — 11/09/2026** · `2026-09-11b`
- **32. Achar um texto, e os 58 que estavam fora da rede — 11/09/2026** · `2026-09-11c`
- **33. Os nove textos reserva, e a migração que os deixou entrar — 11/09/2026** · `2026-09-11d`
- **34. O meio de pagamento prioritário — 12/09/2026** · `2026-09-13a`
- **35. A prova do sinal, e três dívidas — 13/09/2026** · `2026-09-13b`
- **36. Sinal no Agendamento por pacote, e o pedido em zero — 13/09/2026** · `2026-09-13c`
- **37. Sinal por cobrança no Link de cobrança — 13/09/2026** · `2026-09-13d`
- **38. Os três textos que explicam o sinal — 13/09/2026** · `2026-09-13e`
- **39. O número de dinheiro não quebra ao meio — 13/09/2026** · `2026-09-13f`
- **40. Descrição em cada item opcional — 13/09/2026** · `2026-09-13g`
- **41. Upsell depois do pagamento — 13/09/2026** · `2026-09-13h`
- **42. "Já paguei" no Agendamento por pacote — 13/09/2026** · `2026-09-13i`
- **43. Unificar as abas de pagamento, leva 2 — 13/09/2026** · `2026-09-13j`
- **44. PayPal item a item, a prévia do relatório, e o centavo do desconto — 13/09/2026** · `2026-09-13k`
- **45. Unificar as abas de pagamento, leva 4 — 13/09/2026** · `2026-09-13l`
- **46. Unificar as abas de pagamento, leva 5 — 14/09/2026** · `2026-09-14a`
- **47. As três decisões do dono — 14/09/2026** · `2026-09-14b`
- **48. SKU próprio por produto e por item opcional — 14/09/2026** · `2026-09-14c`
- **49. Novidades: as release notes dentro da ferramenta — 14/09/2026** · `2026-09-14d`
- **50. Tamanho do QR configurável nas quatro abas — 14/09/2026** · `2026-09-14e`
- **51. Itens com SKU e upsell por cobrança, no link — 14/09/2026** · `2026-09-14f`
- **52. Prévia na página `/cobrar` — 14/09/2026** · `2026-09-14g`
- **53. A prévia do PayPal em tela estreita — 14/09/2026** · `2026-09-14i`
- **54. A décima primeira aba: Calculadora de álbum — 15/09/2026** · `2026-09-15a`
- **55. Auditoria: a rede cobre a aba nova, e duas redes no lugar de dois comentários — 16/09/2026** · `2026-09-16a`
- **56. O ledger vira útil, e o arnês para de contar abas na mão — 16/09/2026** · `2026-09-16b`
- **57. As explicações que param de poluir o dia a dia — 16/09/2026** · `2026-09-16c`

<!-- FIM DO INDICE GERADO -->

Diferente de agosto. Naquele volume as fases commitavam por etapa, então o relógio dos commits
media o trabalho. Em setembro quase toda rodada chega à `main` **espremida em um ou dois
commits feitos no fim** — o relógio dos commits mediria só o ato de commitar.

O que existe e não envelhece é o **carimbo de publicação**: `scripts/carimbar-publicacao.sh`
escreve `FC_VERSAO` e `FC_PUBLICADO` dentro do `index.html`, em `America/Sao_Paulo`, uma vez,
logo antes do commit que vai ao ar. Lendo o `index.html` de cada commit da história, sai o
instante exato em que cada uma das 57 versões foi publicada.

**A regra desta coluna, então:**

- O tempo real vai da **publicação anterior** até a **publicação desta rodada**.
- Quando a rodada tem commits próprios antes da publicação (as grandes, que commitam por
  tarefa), o início é o **primeiro commit dela**, e a célula diz qual.
- Quando a publicação anterior é de outro dia, ou está separada por horas sem commit no meio,
  **o início não é recuperável** e a célula diz isso, em vez de escolher um número.
- Intervalo que atravessa uma pausa evidente mas cabe no mesmo dia de trabalho sai marcado
  **calendário** — é tempo de relógio, não tempo medido de trabalho.

A coluna **Estimativa** segue a regra oposta e mais dura: ela só é preenchida quando a
estimativa está **escrita** em algum lugar — numa spec, no `pendencias.md`, num corpo de
commit. Setembro quase não registrou estimativa, e por isso a maioria das células traz `—`.
Estimativa fabricada depois do fato não é estimativa; ela destrói o valor da coluna inteira,
que existe para comparar previsão com medição.

---

## Fim de agosto

### 1. Acabamento da aba Efeitos de página — 25/08/2026

Versões `2026-08-25a` e `2026-08-25b`. A aba nascera na véspera. A primeira tira as ligações
dela do preparo global e as devolve ao preparo da própria aba — uma falha em outra aba podia
parar os botões e os doze campos de cor desta, e o aviso vermelho acusaria a aba errada. A
segunda tira o `will-change` das partículas e da aurora: o desenho da tela ficou cerca de
sessenta vezes mais leve no aparelho do cliente.

| Estimativa | Tempo real |
|---|---|
| — | 29 min entre as duas publicações (11:09 → 11:38). O início da primeira não é recuperável: a publicação anterior é de 24/08 às 22:56. |

### 2. O formato da data da página de obrigado — 25/08/2026

Versão `2026-08-25c`. Spec: `docs/specs/2026-08-25-formato-da-data-do-tidycal-design.md`. O
formato da data virou selecionável, com quatro opções, valendo para `{{data}}` e `{{quando}}`,
reconhecendo o inglês por extenso e o técnico. Junto, uma lacuna do arnês foi fechada.

| Estimativa | Tempo real |
|---|---|
| — | 2h28 de calendário (11:38 → 14:06), com o intervalo do meio-dia dentro. |

### 3. O marcador `{prazo}` na barra de contagem — 25/08/2026

Versão `2026-08-25d`. Spec: `docs/specs/2026-08-25-marcador-prazo-design.md`. A data limite ao
lado do tempo que falta, com o mesmo destaque do contador, resolvida **na geração** e não no
navegador, e só no modo "data marcada".

| Estimativa | Tempo real |
|---|---|
| — | 41 min (14:06 → 14:47) |

### 4. "Gerar todos os códigos" no painel consolidado — 25/08/2026

Versões `2026-08-25e` e `2026-08-25f`. Spec:
`docs/specs/2026-08-25-gerar-todos-os-codigos-design.md`. O botão percorre as abas ligadas
naquela página e junta o que falta numa lista só, com as recusas **juntadas, não empilhadas**.
O registro `ABAS` ganhou `gerar`.

#### O que a rodada ensinou sobre método

O botão **nasceu invisível** — estava lá, funcionava, e não aparecia na tela. A spec traz a
seção que interessa: *por que o teste não pegou*. Verificação que interroga o DOM encontra o
elemento existente; quem vê que ele não está pintado é olhar a tela. É a mesma lição do
`alert()` e da verificação como operador que o volume de agosto registrou três vezes.

| Estimativa | Tempo real |
|---|---|
| — | 44 min no total (14:47 → 15:31): 20 min até o botão, 24 min até o conserto do invisível. |

### 5. O pedido que chega ao painel do PayPal — 27/08/2026

Versão `2026-08-27a`. Spec: `docs/specs/2026-08-27-pedido-do-paypal-com-item-design.md`. Os
três geradores passaram a mandar um item com nome e ID do produto, mais o `custom_id` de
conciliação, em vez de o pedido chegar sem identificação. O `invoice_id` ficou de fora **de
propósito**, com a razão registrada: ele é único por conta, e a segunda cobrança com o mesmo
identificador seria recusada.

| Estimativa | Tempo real |
|---|---|
| — | Não recuperável. A publicação anterior é de 25/08 às 15:31, e a rodada inteira chega num commit só. |

---

## Setembro

### 6. A validade do cupom na linha do desconto — 01/09/2026

Versão `2026-09-01a`. Spec:
`docs/specs/2026-09-01-validade-do-cupom-na-linha-do-desconto-design.md`. Nos dois
construtores com cupom, o cupom aplicado passou a dizer até quando vale, ao lado do desconto;
cupom sem prazo não mostra nada.

#### O que a rodada ensinou sobre método

**O cenário da regressão não cadastrava cupom nenhum** — todo o caminho do cupom da Mini loja
estava fora da fotografia byte a byte, e a comparação passava com folga sobre nada. É a
primeira das quatro vezes em que esta armadilha aparece registrada neste volume.

| Estimativa | Tempo real |
|---|---|
| 45 min – 1h15 (registrada na spec) | **~50 min** (registrado na spec), incluindo a correção da aspa, o buraco do cenário e a própria spec. Publicada às 20:59. |

### 7. "Válido até" com os dois acentos — 01/09/2026

Versão `2026-09-01b`. O aviso recém-criado saía sem os dois acentos.

| Estimativa | Tempo real |
|---|---|
| — | 11 min (20:59 → 21:10) |

### 8. Todo texto que uma pessoa lê passa a sair acentuado — 01/09/2026

Versão `2026-09-01c`. Spec:
`docs/specs/2026-09-01-acentuacao-do-texto-que-o-cliente-le-design.md`. 24 textos nos blocos
do Checkout e da Mini loja, incluindo o rodapé de limites inteiro da loja, mais 9 na tela da
própria ferramenta. Continuam sem acento, de propósito, a mensagem do WhatsApp e todo código.

#### O que a rodada ensinou sobre método

**O levantamento custou mais que a correção, e valeu.** Metade dos achados — o rodapé de
limites da loja, os quatro parágrafos da aba Efeitos, o carimbo de publicação — não estava no
palpite inicial. O arnês ganhou `FC_DUMP=<pasta>`, que grava o texto de cada saída além do
hash: é o que permite **enumerar** o diff de uma rodada em vez de só contar divergências.

| Estimativa | Tempo real |
|---|---|
| 30 – 45 min (registrada na spec) | 1h07 pelo carimbo (21:10 → 22:17); a spec registra **~1h10**. |

### 9. WhatsApp acentuado e a frase da loja unificada — 01/09/2026

Versão `2026-09-01d`. Spec:
`docs/specs/2026-09-01-whatsapp-acentuado-e-frase-unificada-design.md`. A isenção do WhatsApp
**caiu ao ser medida**: estava registrada sem a razão, e nenhuma das três candidatas se
sustentou. Os nove links de cobrança saíram byte a byte idênticos — a mensagem é montada no
aparelho do cliente e não toca link, selo nem payload.

| Estimativa | Tempo real |
|---|---|
| 30 – 45 min (registrada na spec) | 1h13 pelo carimbo (22:17 → 23:30); a spec registra **~55 min**. |

### 10. A frase única do pedido zerado no Checkout — 01/09/2026

Versão `2026-09-01e`. A pedido do dono, na mesma noite: o Checkout passou a ter **uma** frase
para o pedido zerado, a customizável, valendo nos três modos de pagamento. Antes havia mais de
uma, e só uma era editável.

| Estimativa | Tempo real |
|---|---|
| 20 – 30 min (registrada na mesma spec da rodada 9) | 4 min entre os dois carimbos (23:30 → 23:34). A spec registra **~25 min** — os dois números não fecham, e a divergência está anotada em "O que este volume NÃO mede". |

### 11. A décima aba: Agendamento por pacote — 02/09/2026

Versão `2026-09-02a`. Spec: `docs/specs/2026-09-02-agendamento-por-pacote-design.md`; doze
decisões em `docs/decisoes-2026-09-02-agendamento-por-pacote.md`; plano em
`docs/superpowers/plans/2026-09-02-agendamento-por-pacote.md`. Uma vitrine de dois passos com
iframe único sob demanda, os N endereços de redirecionamento e uma página de obrigado que
**cobra** (Pix e cartão) e mostra o prazo da reserva.

#### O que a rodada ensinou sobre método

**O diário de decisões foi aberto antes de começar**, e as três primeiras saíram da medição e
não do plano. A revisão adversarial do plano devolveu **13 achados, 8 deles bloqueantes** —
antes de uma linha de gerador ser escrita.

A verificação final (Tarefa 11) unificou `precoPix`, `parcelaDe`, o texto da linha do cartão e
a serialização do catálogo entre os dois geradores, com prova byte a byte antes e depois; pôs
a aba na fotografia da regressão com **dois pacotes de propósito**, para exercitar o
arredondamento da parcela nas duas direções; e corrigiu, ao rodar as varreduras de sanidade,
dois defeitos deixados por rodadas anteriores (um `<script>` cru dentro de um comentário e uma
palavra acentuada dentro de outro).

| Estimativa | Tempo real |
|---|---|
| 11h – 15h (tabela de sete partes na seção 14 da spec) | **6h24** — do primeiro commit da rodada, `670067d` às 00:23, à publicação às 06:47. |

### 12. A v2 da décima aba — 02/09/2026

Versão `2026-09-02b`. Spec §0 e plano
`docs/superpowers/plans/2026-09-03-agendamento-por-pacote-v2.md`. A revisão do dono sobre a v1
já publicada, com quatro decisões revistas e duas novas: o bloco de pagamento passou a
espelhar o **Checkout** em vez da `/pagar` (com opcionais, quantidade e cupom), e o link do
TidyCal virou **caminho**, não URL inteira.

#### O que a rodada ensinou sobre método

**As unificações vieram ANTES da aba**, para cada uma ser provada isoladamente: o pedido do
PayPal (`u-out`/`m-out`/`p-out1` byte a byte idênticos antes e depois) e o desenho do QR Code
— este mudando `u-out`/`m-out` **de propósito**, porque conserta dois defeitos reais do
Checkout, um `new QRCode(...)` sem `try/catch` e a corrida do `qrPronto`.

E a prévia não precisou de uma linha nova: ela **executa** `aBlocoObrigado`, então herdou
opcionais, quantidade e cupom no mesmo commit que os criou. É a regra da casa pagando —
prévia que roda o gerador não tem como divergir dele.

| Estimativa | Tempo real |
|---|---|
| — | **2h48** — do primeiro commit, `d46801f` às 08:19, à publicação às 11:07. |

### 13. Os consertos da revisão pós-v2, e o seletor de forma de pagamento — 02/09/2026

Versão `2026-09-02c`. Oito consertos da revisão mais quatro correções de documentação: a
paleta global não alcançava a aba nova; o botão "Restaurar padrões" da Captação de leads
desfazia os acentos; o painel consolidado mostrava a vitrine sem respeitar a página
selecionada; o código do pacote passou a se corrigir no próprio campo. Junto, dois pedidos do
dono — seletor de forma de pagamento (antes o bloco saía sempre com Pix e cartão juntos) e a
cor do botão do PayPal, que estava fixa em dourado.

| Estimativa | Tempo real |
|---|---|
| — | **48 min** — do primeiro commit, `e300d15` às 12:13, à publicação às 13:01. |

### 14. Rodada única: os textos configuráveis e as famílias de pacotes — 02/09/2026

Versões `2026-09-02d` e `2026-09-02f`. Plano:
`docs/superpowers/plans/2026-09-03-rodada-unica-textos-e-familias.md`; as decisões sobre os 17
duvidosos em `docs/decisoes-2026-09-03-textos-configuraveis.md`. O dono juntou numa entrega só
o que estava proposto partir em duas.

**Todo texto que o cliente final lê virou campo:** 157 campos em oito tabelas `*_TXT_DEFS`,
uma por aba, cada uma servindo ao mesmo tempo o `cfg()`, a persistência e o padrão de preset
antigo. As frases repetidas entre abas passaram a sair de uma fábrica só (`FC_TXT_FABRICA`),
com um campo por aba para o dono poder divergir de propósito. Mais o aviso configurável de que
o Pix não confirma sozinho nas quatro abas de pagamento, o subtítulo opcional da vitrine com
`{pct}`, a prévia de celular da vitrine e as **famílias de pacotes** — a família virou o passo
1, com migração de quem já tinha gravado sem família.

#### O que a rodada ensinou sobre método

Três coisas ficaram registradas, e todas viraram regra:

**A ordem foi escolhida pela forma dos dados, não pelo tamanho.** As famílias mudam a forma de
`aPacotes`; toda mudança de texto feita antes continua valendo depois, e o contrário não é
verdade. Por isso os textos vieram primeiro e as famílias por último, com a regressão inteira
entre as duas coisas.

**A dívida 7 nasceu e morreu na mesma rodada.** Medido no meio do caminho:
`scripts/verificar/geradores.mjs` não escrevia em nenhum `*-txt-*`, então a fotografia byte a
byte provava o caminho de fábrica e **nada dizia sobre o caminho configurado**. O cenário
ganhou uma segunda passagem, a configurada, com 28 textos escolhidos por critério, cada um com
um selo que o arnês procura nas saídas. **Achou de primeira o defeito que existia para
achar:** os quatro avisos de item sumido da Mini loja concatenavam o número em vez de trocar o
marcador, e o cliente leria `2 {n} itens do seu carrinho saíram do catálogo`.

**A decisão D-13 foi minha e estava errada** — e o registro dela é a lição de método mais cara
da rodada. Ela mandou o formato compacto do relógio da Contagem regressiva ler os mesmos
quatro campos de rótulo do formato "blocos", porque na configuração de fábrica aqueles campos
não apareciam em lugar nenhum. O que ela não notou é que os padrões daqueles campos são **por
extenso**, e o compacto é o formato padrão da aba: o relógio de fábrica passou de
`02d:14h:33m:12s` para `02dias:14horas:33min:12seg`. A rodada mudou a aparência de um bloco já
em uso, que era exatamente o que ela existia para não fazer. Ficam duas regras: **campo que
parece inútil é sintoma de explicação faltando, não de campo sobrando**; e toda decisão de
unificar dois campos se confere contra o **padrão de fábrica** dos dois, não só contra o que
eles significam.

| Estimativa | Tempo real |
|---|---|
| 11h – 13h no início, revista para **7h – 9h** depois de medir a Etapa 1 (40 campos em 36 minutos). Registrada no corpo do commit `6c38277` e na `CLAUDE.md`. | **1h42** até a publicação principal (primeiro commit da rodada, `9bf56f6` às 16:21 → 18:03) e **2h08** incluindo a segunda publicação, às 18:29, com a regressão configurada e o `{n}` cru. A prévia de celular veio de branch própria, commitada às 15:33. |

### 15. Valor mínimo do pedido para o cupom valer — 02/09/2026

Versão `2026-09-02g`. Spec: `docs/specs/2026-09-03-valor-minimo-do-cupom-design.md`. Nas três
abas que têm cupom. Junto, a etapa 2 da regressão: o cenário ganhou o cupom **com** mínimo —
sem isso o caminho novo ficaria fora da fotografia.

| Estimativa | Tempo real |
|---|---|
| — | **30 min** — do primeiro commit, `58ab863` às 19:06, à publicação às 19:36. |

### 16. A leva dos achados — 02/09/2026

Versão `2026-09-02h`. A primeira rodada sob a regra nova do dono (*"o que for identificado
pelo caminho, registra, resolve e publica na nova versão"*, commit `733db55`), e ela zerou a
lista de dívidas pequenas. Saíram: as três dívidas da lista de cupons da Mini loja; a
quantidade do opcional no recibo do PayPal (cobrava 3× e escrevia o nome sem o `x3`; e
opcional com quantidade zero entrava no nome cobrando zero); **118 frases de interface sem
acento**; a ordem das caixas em três abas; o laço de quantidade da Mini loja virando peça
única; e o formulário inacabado sobrevivendo à recarga nas três abas.

#### O que a rodada ensinou sobre método

**A descrição de uma dívida estava errada, e a medição corrigiu.** O valor do cupom não se
perdia — uma rede global de gravação o pegava. O que se perdia era a **prévia**, que continuava
mostrando o valor antigo enquanto o código gerado já levava o novo: defeito pior de enxergar
que o descrito.

**O detector de acentos lê o JavaScript como código**, não como texto, então enxerga frase
montada em pedaços — que a varredura anterior perdia —, e tira o vocabulário da própria
árvore: palavra já escrita certa em algum lugar vira a referência para achar a errada em
outro. Três frases tinham irmã e foram copiadas; **as outras 115 foram só acentuadas, nenhuma
reescrita** — a tarefa era acentuação, não melhoria de texto.

**O número da seção deixou de ser digitado.** `fcSecoesNumerar()` o escreve pela posição e as
sete citações apontam pela chave — a mesma armadilha que `ABAS.length` já tinha resolvido para
a contagem de abas.

| Estimativa | Tempo real |
|---|---|
| — | **1h19** — do primeiro commit, `25ac34c` às 21:26, à publicação às 22:45. |

### 17. Aplicar um preset zera o formulário de cadastro — 03/09/2026

Versão `2026-09-03a`. Era o item que a leva anterior deixou para a palavra do dono: aplicar um
preset com um item em edição deixava o formulário apontando para a posição N do catálogo
**novo** — o botão dizia "Salvar alterações" e o clique seguinte gravaria por cima de outro
produto. Ele decidiu, e o formulário passou a ser zerado ao aplicar; recarregar continua
devolvendo o que estava sendo digitado.

| Estimativa | Tempo real |
|---|---|
| — | 1h33 de calendário (22:45 → 00:18). A rodada chega num commit só, feito 2 min antes do carimbo. |

### 18. O endereço completo do TidyCal — 03/09/2026

Versão `2026-09-03b`. O dono tem domínio próprio no TidyCal e pediu para colar o endereço
inteiro no campo. As duas abas que usam o campo passaram a aceitar as duas formas, com
migração de quem já tinha só o caminho.

#### O que a rodada ensinou sobre método

**O pedido era o campo; o risco era outro.** Os dois blocos filtram por **origem** as mensagens
que o TidyCal manda de dentro do iframe, e o filtro estava cravado em `https://tidycal.com`.
Com domínio próprio, o calendário aparecia na página e não se ajustava mais — sem erro e sem
nada na tela. Conferir no botão de teste da aba deixou de ser opcional, e a ferramenta diz por
quê: ela consegue recusar um endereço escrito errado, mas não consegue saber se o domínio é o
do dono.

| Estimativa | Tempo real |
|---|---|
| — | **34 min** (00:18 → 00:52) |

### 19. A altura do calendário, e o ouvinte que era código morto — 03/09/2026

Versão `2026-09-03c`. O dono perguntou por que a aba de pacotes não usa a altura automática do
TidyCal. A investigação mediu as mensagens **cruas** em vez de deduzir da documentação.

#### O que a rodada ensinou sobre método

**O ouvinte nunca tinha recebido nada.** Iframe nu, calendário real, escutando `message`: uma
linha, `[iFrameResizerChild]Ready`, e mais nada — nem ao carregar, nem ao clicar num horário. O
filho do iframe-resizer só passa a emitir depois de um **handshake do pai**, e o pai vinha
dentro do `embed.js`, que aquela aba nunca usou. Consequência: toda a mecânica de
`scrollToOffset`/`mutationObserver` era **código morto**, e o iframe caía no padrão do
navegador — **150 px**. O calendário aparecia como uma fresta.

**A decisão errada foi minha, na rodada da décima aba**, e o comentário do código registra o
raciocínio: *"o padrão volta a ser o comportamento provado em produção na aba TidyCal"*. O erro
está em "provado em produção": lá funciona porque o `embed.js` define a altura **e** faz o
handshake. Eu avaliei duas opções ruins e não considerei a terceira, que era **medir o
protocolo**.

O conserto são duas coisas medidas, não escolhidas: o handshake é uma linha, a mesma que o
`embed.js` deles manda; e a guarda `[500, 6000]` tem o piso no `minHeight` que o próprio
TidyCal usa e o teto em quase oito vezes o calendário mais alto medido.

| Estimativa | Tempo real |
|---|---|
| — | **1h05** (00:52 → 01:57) |

### 20. Um calendário só: os três caminhos com a mesma implementação — 03/09/2026

Versão `2026-09-03d`. Os três jeitos de mostrar o calendário do TidyCal viraram um. O ganho
visível para o dono é que o calendário continua funcionando mesmo quando o servidor do TidyCal
não entrega a biblioteca. A rodada saiu em duas fases, e a primeira foi o arnês: ele passou a
poder medir **contra o TidyCal de verdade** antes de a unificação ser escrita.

| Estimativa | Tempo real |
|---|---|
| — | **2h23** (01:57 → 04:20), com o primeiro commit da rodada, `0d8ecc0`, às 04:17. |

### 21. Os dois interruptores do calendário viram campo — 03/09/2026

Versão `2026-09-03e`. Os dois ajustes finos — forçar a altura e medir o formulário de reserva
— existiam só dentro do código gerado e viraram campos na aba, **com o padrão no comportamento
provado**, não no que parecia razoável.

| Estimativa | Tempo real |
|---|---|
| — | Não recuperável. A publicação anterior é das 04:20 da mesma madrugada e a desta é das 13:16; o intervalo é sono, não trabalho. |

### 22. Duplicar pacote e duplicar opcional — 03/09/2026

Versão `2026-09-03f`. Pedido do dono, testando a aba de pacotes com o catálogo real dele.
Duplicar um pacote **leva os opcionais dele**, e os botões passaram a ficar logo abaixo do
item. Junto saiu um defeito pré-existente: `aPacSalvar` não conferia código repetido, e dois
pacotes com o mesmo código entravam no catálogo sem aviso — a recusa só aparecia depois, na
hora de gerar.

| Estimativa | Tempo real |
|---|---|
| — | **1h54** (13:16 → 15:10) |

### 23. O formulário de cadastro sobrevive à recarga por inteiro — 03/09/2026

Versão `2026-09-03g`, a leva 1 do duplicar. Os opcionais não salvos já persistiam; a duplicação
tornou visível que **os campos de texto não**. Uma chave nova por aba (`form`), com os campos
saindo do próprio `*ProdSalvar` de cada uma.

#### O que a rodada ensinou sobre método

**Acréscimo de formato se prova em três caminhos reais, não em argumento:** estado sem a chave
abre no comportamento anterior sem alerta; nenhum preset de aba a leva; e o backup, exportado e
reimportado pelos botões de verdade com a chave apagada, não conta um item a mais como "não
reconhecido".

| Estimativa | Tempo real |
|---|---|
| — | **1h31** (15:10 → 16:41) |

### 24. Cupom com código repetido recusado nas três abas — 03/09/2026

Versão `2026-09-03h`, a leva 2. Medido antes: o Checkout e a Mini loja aceitavam dois cupons
iguais sem aviso, e o carrinho aplica **o primeiro que bate** — o segundo virava um cupom que o
dono cadastra, vê na lista e que nunca funciona.

#### O que a rodada ensinou sobre método

**A comparação da recusa é a MESMA que o bloco usa** para casar o cupom digitado pelo cliente.
Se divergisse, ela deixaria passar exatamente os pares que causam o defeito. E a edição em
linha, que também podia criar duplicata, **avisa sem apagar nem corrigir nada**.

| Estimativa | Tempo real |
|---|---|
| — | **1h30** (16:41 → 18:11) |

### 25. Duplicar nas demais listas, e a família com o conteúdo dela — 03/09/2026

Versão `2026-09-03i`, a leva 3. Spec: `docs/specs/2026-09-03-duplicar-familia-design.md`.
Produtos e opcionais do Checkout e da Mini loja, mensagens da Contagem, opções de qualificação
dos Leads, cupons das três abas, e a família. O Slideshow ficou de fora, declarado.

#### O que a rodada ensinou sobre método

**A pergunta do dono corrigiu o plano.** O levantamento tratava família como mais um item de
lista — a cópia levaria nome e descrição, sem os pacotes. Ele perguntou se a duplicação levaria
"tudo que tem abaixo" e, ao saber que a do pacote já leva os opcionais, concluiu: *"é o mesmo
comportamento que eu espero para a família"*. **"Duplicar leva o que está dentro" é uma regra**,
e família funcionando diferente seria a incoerência. A objeção que eu tinha era verdadeira e
vale menos que a coerência da regra.

**A assimetria veio junto e não foi deixada para depois.** Com a duplicação, um clique cria
cinco itens e desfazer custava nove passos. Criar barato e desfazer caro é como um cadastro
vira bagunça. Apagar família passou a poder levar os pacotes, com **confirmação nominal** — uma
linha por pacote, e não só a contagem: "vai apagar 4 pacotes" faz confiar no número; a lista
deixa **conferir**.

**E uma lição sobre a máquina, não sobre o código.** A suíte que fala com o TidyCal de verdade
não tolera duas execuções ao mesmo tempo: três instâncias dirigindo Chromium contra o mesmo
servidor deram resultado inconclusivo, e a rodada limpa seguinte foi morta por um
`pkill -f "verificar/"` que **eu** emiti para limpar processos órfãos. **Limpeza por padrão de
nome derruba trabalho legítimo junto com o lixo**, e essa suíte pede a máquina só para ela.

| Estimativa | Tempo real |
|---|---|
| — | **51 min** (18:11 → 19:02) |

### 26. O calendário aquecido antes do clique — 04/09/2026

Versão `2026-09-04a`. Pré-conexão, aquecimento por intenção e a guarda de `e.source`: o
calendário começa a ser preparado assim que o cliente demonstra intenção, e não só no clique. A
espera medida na primeira visita era de cerca de **9 segundos**.

| Estimativa | Tempo real |
|---|---|
| — | Não recuperável. A publicação anterior é de 03/09 às 19:02; o único commit de trabalho é de 13:01, 14 min antes do carimbo. |

### 27. Aquecer o calendário com a largura real — 04/09/2026

Versão `2026-09-04b`. O calendário abria na hora, sumia e voltava desbotando: estava sendo
preparado numa largura de zero, escondido, e ao aparecer tinha de se desenhar de novo por
inteiro. **Aquecer dentro de um `display:none` não aquece nada** — é o defeito que a rodada
anterior criou e esta mediu.

| Estimativa | Tempo real |
|---|---|
| — | **1h09** (13:15 → 14:24) |

### 28. Pré-carga dos calendários, com três opções e um quadro por pacote — 04/09/2026

Versão `2026-09-04c`. O dono escolhe quando os calendários são preparados: só no clique, um já
na abertura (padrão) ou todos na abertura, com o texto do campo trazendo o custo de cada
escolha. Trocar de família e voltar deixou de jogar fora o calendário já preparado. Junto, a
corrida entre o `embed.js` e o aperto de mão foi **registrada** como dívida.

| Estimativa | Tempo real |
|---|---|
| — | **2h41** (14:24 → 17:05) |

### 29. A corrida entre o `embed.js` do TidyCal e o nosso aperto de mão — 04/09/2026

Versão `2026-09-04d`. Registrada de manhã e **consertada na mesma tarde**, em rodada própria
autorizada pelo dono porque mexe em `t-out1`, que estava em produção. O `embed.js` chegava
depois de o aperto de mão próprio já ter assumido o filho; a biblioteca deles era aplicada por
cima, ficava com o quadro e sem as alturas — 764 anunciado, 700 na tela.

#### O que a rodada ensinou sobre método

**A medição forçou a ordem de chegada, em vez de esperar a rede decidir.** Esperar mede a
frequência, nunca o defeito. Com o `embed.js` atrasado de propósito, a biblioteca era aplicada
por cima em **9 de 9** passagens.

**E uma causa explicou dois sintomas.** A intermitência de 03/09 — a medição do formulário
aplicada em "cerca de uma carga de quatro", que foi o motivo de o campo `t-medir`/`a-medir`
nascer desligado — era esta mesma corrida. Antes: 1 de 6. Depois: **6 de 6**.

**A forma do conserto, e a tentativa que falhou antes dela.** O óbvio era trocar as duas
bandeiras por uma variável de três valores. Medido: não bastava — `comecarCalendario` reinicia
a cada `load` do iframe, e a variável era zerada ali. **Trocar uma variável por outra só
mudaria o nome do buraco.** O que ficou: o comando mora no próprio elemento que os dois
disputam, dois portões, um por lado — sobrevive a reinício e a troca de quadro por construção.

| Estimativa | Tempo real |
|---|---|
| — | 3h51 de calendário (17:05 → 20:56), com o primeiro commit da rodada, `35fe559`, às 20:07. |

### 30. Limites visíveis nos campos que alimentam API — 11/09/2026

Versão `2026-09-11a`. Spec: `docs/specs/2026-09-11-limites-visiveis-nos-campos-design.md`. Os
campos com limite de tamanho passaram a mostrar o contador de caracteres e a impedir digitar
além do limite, em vez de cortar em silêncio depois.

| Estimativa | Tempo real |
|---|---|
| — | **46 min** — do primeiro commit da rodada, `6483fb3` (a spec) às 17:19, à publicação às 18:05. |

### 31. Recusa dos identificadores com orçamento composto — 11/09/2026

Versão `2026-09-11b`. Registrada de manhã e consertada no mesmo dia. O identificador que chega
ao Pix tem 25 caracteres e, em duas abas, é **composto** — o que o operador digita mais o que o
gerador acrescenta. O campo não avisava nada.

#### O que a rodada ensinou sobre método

**A colisão foi provada na versão publicada**, não argumentada: prefixo `FOTOCERTAESTUDIO` com
os pacotes `MINIENSAIO1H` e `MINIENSAIO4H` geravam sem recusa e produziam **o mesmo txid** —
dois pagamentos indistinguíveis no extrato, sem erro em lugar nenhum.

**Nenhum número foi escrito à mão.** As funções que escrevem a cauda passaram a morar em texto,
e a ferramenta **avalia esse mesmo texto** para medi-la — o molde de `fcPixApi`. A fronteira foi
medida **um caractere por vez, pela interface**, e não espiando variável de dentro da IIFE, o
que mediria a intenção e não o comportamento.

**E o negativo que uma recusa desastrada quebraria:** `LOJA-FOTO_CERTA-VITO` tem 20 digitados e
17 úteis — hífen e sublinhado somem na limpeza — e **passa**. Estender o contador do dia
anterior teria trocado estouro silencioso por **bloqueio silencioso**.

| Estimativa | Tempo real |
|---|---|
| — | **54 min** (18:05 → 18:59) |

### 32. Achar um texto, e os 58 que estavam fora da rede — 11/09/2026

Versão `2026-09-11c`. Nasceu de um pedido que era, na verdade, um defeito de descoberta: o dono
quis mudar uma frase que o cliente lê, procurou na ferramenta, **não achou**, e pediu que o
texto virasse configurável. Ele já era. A varredura mediu por que ele não achou, e foram **três
barreiras**: a busca do navegador não lê o `value` de `<input>`; aba fechada é `display:none`; e
seção recolhida também — e ela cobria **116 dos 168** campos de texto.

Saíram duas levas: a busca no alto da ferramenta (que varre o **DOM**, 437 campos medidos, não
as tabelas) com o eco do valor atual no rótulo de cada campo; e **58 textos** que viviam fora
das tabelas entrando nelas, que foram de 168 para 226 campos.

#### O que a rodada ensinou sobre método

**A instrução da chave com ponto foi derrubada por medição.** Tinha sido mandado ensinar
`fcTxtLer` a entender `'rotulos.d'` para o estado gravado sair idêntico; a medição mostrou que
**o aninhamento nunca existiu no estado gravado** — chave com ponto teria aninhado o estado,
exatamente o que a instrução existia para impedir.

**A prova que a regressão byte a byte NÃO consegue dar.** Na Captação o `escJs` acontecia na
leitura do DOM e a emissão era crua; ao descer o escape para 15 linhas de emissão, com valores
de fábrica a saída é idêntica dos dois jeitos — **a regressão aprovaria um esquecimento**. Daí
`textos-migrados.mjs`, que injeta um texto hostil (apóstrofo, aspas, barra invertida,
`</script`) nos 58 campos e exige o texto inteiro chegando à tela, à ficha do produto e à URL
do WhatsApp.

**Cinco achados vieram junto, e o primeiro é o que mais valia:** "Restaurar padrões" **não
repunha os textos** — 0 de 5 no Slideshow, 0 de 20 na Captação, 0 de 21 no Agendamento, 4 de 14
na Contagem. O botão promete devolver a aba aos padrões de fábrica e voltava pela metade, em
silêncio.

**E a primeira das oito referências envelhecidas:** `id-orcamento.mjs` usava `main` como o lado
"antes", e o conserto que ele mede já estava em `main` — o "antes" media a si mesmo. Preso em
`94042b6`.

| Estimativa | Tempo real |
|---|---|
| — | **1h38** — do primeiro commit da rodada, `cb08db1` às 20:03, à publicação às 21:41. |

### 33. Os nove textos reserva, e a migração que os deixou entrar — 11/09/2026

Versão `2026-09-11d`. Fecha a pergunta que a rodada anterior deixou aberta. Os nove textos
reserva dos marcadores eram os últimos campos de texto do cliente fora das tabelas, e estavam
fora por um motivo só: dividiam **uma** chave de estado, com os valores juntados por caractere
de controle. Trazê-los muda o formato do que fica gravado — classe que exige a palavra do dono,
dada depois da medição do alcance.

#### O que a rodada ensinou sobre método

**Um ponto de migração cobre estado, preset de aba, preset geral e backup importado** — e isso
foi medido, não suposto: `fcPresetAplicar` e `fcgAplicarAba` chamam ambos o `restaura(frag)` da
aba. Cuidar só do "Exportar tudo" teria deixado preset antigo voltar com os nove vazios.

**O estado antigo não é escrito à mão** — é colhido da própria `main`, servida em porta
separada, em quatro cenários. E o preset antigo é aplicado **depois de sujar os nove**: sem
sujar, "o preset trouxe" seria indistinguível de "nunca mudou".

**Achado pelo caminho:** `aBlocoObrigado` escapava o texto reserva com `escJs` dentro de um
literal de aspas **duplas** — o único assim entre os ~150 `escJs` do arquivo. Aspa dupla no
texto fechava o literal e a **página de obrigado inteira não carregava**. Defeito anterior,
invisível porque aqueles quatro campos nunca tinham sido exercitados com texto hostil.

| Estimativa | Tempo real |
|---|---|
| — | **42 min** (21:41 → 22:23) |

### 34. O meio de pagamento prioritário — 12/09/2026

Versão `2026-09-13a`. Spec: `docs/specs/2026-09-12-meio-prioritario-design.md`. Um rádio nas
quatro abas de pagamento decidindo **ordem e preço em destaque juntos**, com o padrão em Pix —
que é como as páginas já publicadas saem.

#### O que a rodada ensinou sobre método

**A premissa do pedido estava parcialmente errada e a medição corrigiu:** o Link de cobrança já
mostrava o Pix primeiro; o que ele tinha de diferente era o destaque. São dois eixos, e só uma
aba tinha os dois apontando para o Pix.

**A prova não existia.** Nada no arnês fixava a ordem dos meios — o grep devolvia zero.
`meio-prioritario.mjs` mede a ordem **pelo índice dos filhos no DOM**, nas quatro abas e nas
duas escolhas, mais o destaque por `getComputedStyle` e o valor que o PayPal cobra.

**Um defeito meu, corrigido por medição.** Instruí o executor a tratar o caso "sinal ligado +
Pix prioritário", supondo duas linhas com o mesmo número e um selo de `-0%`. O gerador já o
impedia. Em vez de tratamento para um estado impossível, o comportamento foi **fixado em
teste** — que passa a falar no dia em que o sinal chegar às outras abas.

**Duas suítes com referência datada, consertadas no caminho**, pelo mesmo defeito de
`id-orcamento`: `textos-reserva.mjs` acusava sete falsas falhas e `textos-migrados.mjs`
afirmava "não existe em `main`" como verdade eterna.

| Estimativa | Tempo real |
|---|---|
| — | Não recuperável. A rodada é de 12/09 e chega num commit só, feito 2 min antes do carimbo das 00:21 de 13/09; a publicação anterior é de 11/09 às 22:23. |

### 35. A prova do sinal, e três dívidas — 13/09/2026

Versão `2026-09-13b`. Spec: `docs/specs/2026-09-12-sinal-nos-quatro-construtores-design.md`,
Rodada B. Ela vem **antes** de estender o sinal, e o motivo é medido: o caminho do sinal tinha
**zero** verificação em todo o arnês — as ~40 linhas condicionais saíam zero vezes da regressão
byte a byte. `sinal.mjs` nasceu com **533 verificações**.

#### O que a rodada ensinou sobre método

**O defeito silencioso que a rodada quase publicou.** Dar campo próprio à linha do saldo no
WhatsApp parecia acréscimo: só que essa linha era **derivada de outra** — o gerador montava
`TXT_SALDO + ': *{valor}*'`, e `TXT_SALDO` é o rótulo da **tela**. Quem tivesse personalizado o
rótulo veria a mensagem voltar ao padrão de fábrica, **em silêncio**. A regressão byte a byte
não pega isso: com os textos de fábrica as duas formas produzem o mesmo texto. **Achado ao ler
o diff à mão.** A lição, escrita para valer sempre: *dar campo próprio a uma frase derivada de
outra é uma migração, não um acréscimo — e é da família que a regressão não vê.*

**O sinal entrou na regressão só na Mini loja, e a escolha é medida:** ligar o do Checkout
apagaria a cobertura de um texto que só existe no ramo **sem** sinal da mesma aba, e a própria
regressão acusaria `SEM VESTIGIO`. Como a conta é fonte única, uma aba basta.

**Um achado ficou registrado sem ação, de propósito.** Pedido em zero com sinal fixo mostra três
números que não fecham. Ninguém chega a pagar esse número — as duas pontas recusam. Congelar o
comportamento de hoje em asserção faria a correção futura falhar como se fosse regressão, então
a suíte passou a **imprimir** o estado a cada passagem, para a rodada seguinte decidir.

**Mais uma suíte com referência datada**, a terceira: `meio-prio-migracao.mjs` acusava **nove
falhas todo dia** desde que a rodada que ele mede chegou à `main`.

| Estimativa | Tempo real |
|---|---|
| — | **1h19** (00:21 → 01:40) |

### 36. Sinal no Agendamento por pacote, e o pedido em zero — 13/09/2026

Versão `2026-09-13c`. Rodadas C e F da mesma spec. O cliente pode reservar pagando um sinal,
com o restante no dia do ensaio, e o parcelamento no cartão passou a ser calculado **sobre o
sinal** — parcelar um número que ninguém está cobrando confunde. E o pedido em zero deixou de
desenhar as linhas `Total R$ 0,00 · Sinal R$ 100,00 · Saldo R$ 0,00` nas três abas com sinal.

#### O que a rodada ensinou sobre método

**Zero divergência é o que um interruptor novo tem de provar:** com ele desligado o bloco é
byte a byte o de `main`.

**A palavra da aba é "reserva", e não é só o substantivo** — o remédio muda junto. As irmãs
mandam "escolher mais itens ou aumentar a quantidade"; aqui o pacote é fixo. **Mandar fazer o
que a tela não permite é fábrica mentindo.**

**Dois textos da spec NÃO nasceram, e a ausência é medida** — eles não teriam consumidor nesta
aba. *Campo de texto sem consumidor é pior que campo faltando.*

**E uma prova que não foi escrita, com o motivo.** A fronteira entre zero e um centavo não
existe: `total()` já vem arredondado em centavos, então `>0` e `>=0.01` são indistinguíveis.
**Teste que não distingue duas implementações é verde de enfeite.**

| Estimativa | Tempo real |
|---|---|
| — | **1h21** (01:40 → 03:01) |

### 37. Sinal por cobrança no Link de cobrança — 13/09/2026

Versão `2026-09-13d`. Rodada D. A única da fila que mexe **no selo do link** e no arquivo que a
`/pagar` publicada executa.

#### O que a rodada ensinou sobre método

**O que viaja no link é o TOTAL; o campo 54 carrega o SINAL** — parece invertido e é o
contrário. A regra fundadora da aba é que o que se cobra mora dentro do código Pix e em lugar
nenhum mais, protegido por três redes. Com sinal, quem é cobrado é o **sinal**, então é ele que
fica no lugar protegido.

**O sinal não é fórmula que o bloco carrega.** Não há carrinho aqui: o valor é digitado e nada
muda depois que o link sai. A conta acontece uma vez, na geração. Levar a fórmula ao bloco
criaria um segundo lugar onde o número é decidido.

**O controle importa.** Os **oito formatos** de link gerados pela `main` foram aceitos pelo
bloco novo **e** pelo de `main`, lado a lado — sem o controle, "o bloco novo aceita" poderia
significar "ele aceita qualquer coisa". E o caminho inverso foi medido: link com sinal é
recusado pelo bloco antigo. **É daí que sai o aviso ao dono — verdade medida, não suposição.**

**E o achado mais caro do dia:** a disciplina de versão do arquivo compartilhado tem **quatro**
lugares, não três. Esquecer o quarto fez a ferramenta **parar inteira, em silêncio** — a guarda
funcionou, e 30 verificações da suíte ficaram verdes **sem medir nada**.

| Estimativa | Tempo real |
|---|---|
| — | **1h37** (03:01 → 04:38) |

### 38. Os três textos que explicam o sinal — 13/09/2026

Versão `2026-09-13e`. Rodada E. Doze campos, nas quatro abas: o que o sinal garante, o que
acontece se o cliente desistir, e como pagar o restante.

#### O que a rodada ensinou sobre método

**Nascem vazios, e a decisão governa a rodada.** Todo campo de texto deste projeto tem padrão de
fábrica, porque o padrão é *"exatamente o que saía fixo no bloco antes"* — e aqui não existe
"antes". Mais importante: os três são declarações de **política comercial**, e um padrão
afirmando uma política que o dono pode não ter seria **política inventada numa tela de
pagamento**. Regressão: zero divergência, e o zero é honesto — vazio não emite nem regra de CSS,
nem `div`, nem uma linha de JS.

**Aviso âmbar, e não tranca.** Sinal ligado com os três vazios é justamente a confusão que o
pedido veio evitar; a aba acende o aviso. Ele não conserta, faz o buraco **aparecer** — e o dono
pode ter motivo para deixar vazio.

**A medição do Link de cobrança não foi assumida.** Pôr os três no link os faria entrar no
**selo**, derrubando todo link novo em qualquer `/pagar` com código 1 antigo — **por um texto**.
Duas provas fixam a decisão: o link sai idêntico com um e com três preenchidos, e o bloco, ao
contrário, muda.

**A quarta suíte com referência datada**, e a partir daqui elas passam a dizer **NÃO MEDIU** em
vez de falhar.

| Estimativa | Tempo real |
|---|---|
| — | **45 min** (04:38 → 05:23) |

### 39. O número de dinheiro não quebra ao meio — 13/09/2026

Versão `2026-09-13f`. Relatado pelo dono com dois prints: no celular, a linha do Pix saía com o
valor partido — `R$` numa linha, `332,50` na outra.

#### O que a rodada ensinou sobre método

**O próprio relato já dizia onde estava a causa.** Ele encurtou o texto de fábrica por conta
própria e não resolveu — quem quebrava era o **valor**, e rótulo menor não muda isso.

**A causa:** as linhas "rótulo à esquerda, valor à direita" são flex com dois `<span>` e nenhuma
regra dizendo quem cede. **Rótulo em duas linhas é legível; número partido não é.** A regra foi
escrita **uma vez** para os quatro geradores — copiada quatro vezes, a próxima linha de dinheiro
nasceria sem ela, que é como este defeito nasceu.

**E a prova pegou dois erros no caminho, os dois dela mesma.** A primeira versão media a
**altura da caixa** e mentia, porque item de flex estica por padrão. E a regra tinha caído
**dentro do `if` do desconto do Pix** — com sinal ligado o desconto é zerado, então ela não
sairia. Quem denunciou foi **a lista de divergências não bater com o esperado**.

**A prova do contrário:** o arquivo aponta para a versão publicada e **exige que ela falhe**,
reproduzindo o defeito do print. Sem isso, os "ok" não valeriam nada.

| Estimativa | Tempo real |
|---|---|
| — | Não recuperável. A publicação anterior é das 05:23 da mesma madrugada e a desta é das 12:47. |

### 40. Descrição em cada item opcional — 13/09/2026

Versão `2026-09-13g`. Pedido do dono, com duas decisões dele: a descrição aparece **só na hora
de escolher**, não no carrinho; e texto longo **quebra em várias linhas**, não corta.

#### O que a rodada ensinou sobre método

**Duas unificações vieram antes do campo.** A expressão que copia um opcional estava escrita
**catorze** vezes; o campo novo é levado pela duplicação **por construção**, não por alguém
lembrar de catorze lugares.

**Zero divergência na regressão, com a contrapartida declarada:** o ramo *com* descrição não
está na fotografia byte a byte — ele é medido com o bloco **rodando**.

**E aqui a regra das referências congeladas virou seção da `CLAUDE.md`.** Foi a **sexta**
ocorrência em duas semanas, duas delas escritas por mim **depois** de já ter consertado as
outras. Três obrigações: prender o commit; **detectar** o envelhecimento e dizer `NÃO MEDIU` em
vez de falhar; e **preferir medir a propriedade** a comparar com um congelado.

| Estimativa | Tempo real |
|---|---|
| — | **31 min** (12:47 → 13:18) |

### 41. Upsell depois do pagamento — 13/09/2026

Versão `2026-09-13h`. Spec: `docs/specs/2026-09-13-upsell-apos-pagamento-design.md`. Nas quatro
abas de pagamento: depois de pagar, o cliente pode ser levado a outra página.

#### O que a rodada ensinou sobre método

**A assimetria manda no desenho.** O Pix não avisa a página quando o cliente paga. Então no
PayPal o redirecionamento é automático; no Pix quem leva é o botão "Já paguei". **Redirecionar
sozinho no Pix afirmaria uma confirmação que ninguém deu** — e foi declarado ao dono que, por
esse caminho, a página de upsell recebe gente que ainda não pagou.

**Quem decide a emissão é o ENDEREÇO, não o interruptor.** Endereço preenchido com o
interruptor **desligado** emite as duas variáveis com `ATIVO=false` — porque *"desligado" não
pode significar "não emitir"*, senão não existe variável para editar no código já colado. A
prova que representa o pedido é trocar `false` por `true` no texto gerado, sem voltar à
ferramenta, nas quatro abas.

**E uma dívida registrada com a medição do porquê.** A prévia navega, e **não dá** para
neutralizar como o `window.open` já é: `location` é *unforgeable* no Chromium — `defineProperty`
lança e atribuir `location.assign` falha **em silêncio**, que é pior. A diferença ficou
declarada nos textos de ajuda das três prévias.

| Estimativa | Tempo real |
|---|---|
| — | **1h01** (13:18 → 14:19) |

### 42. "Já paguei" no Agendamento por pacote — 13/09/2026

Versão `2026-09-13i`. O dono perguntou por que aquela aba tinha upsell pelo cartão e não pelo
Pix.

#### O que a rodada ensinou sobre método

**A resposta que eu tinha dado descrevia o defeito como se fosse o desenho.** Medido: a
maquinaria existia, mas só era chamada em dois lugares — o recado de link adulterado e o de
prazo vencido. **Nunca depois de gerar o Pix.** A aba foi espelhada no Checkout em setembro e a
peça ficou para trás; nenhuma linha do código justificava a ausência.

**Os registros que mentiam foram corrigidos junto** — dois textos de ajuda e três comentários
diziam ao dono que ali o upsell só funciona pelo cartão. Verdade enquanto o botão não existia,
mentira a partir dali. *Registro que descreve como desenho o que era falta manda procurar no
lugar errado, e quem lê confia.*

**Efeito colateral que veio junto:** a aba exigia o WhatsApp **sempre**, enquanto as irmãs só o
exigem quando o botão está ligado. Quem a configurasse em "somente cartão" não conseguia gerar
sem preencher um número que o bloco nem usava.

| Estimativa | Tempo real |
|---|---|
| — | 3h48 de calendário (14:19 → 18:07), sem commit no meio. |

### 43. Unificar as abas de pagamento, leva 2 — 13/09/2026

Versão `2026-09-13j`. Pedido do dono: *"todos os construtores que têm pagamento devem ter as
mesmas regras, mesmas configurações"*. Uma varredura catalogou **41 divergências**; esta leva
pegou as que afetam dinheiro, recusa ou link, mais as cinco decisões dele — preço zero recusado,
resumo copiável ligado, desconto do Pix em 5%, separador neutro "OU", passo do percentual 0,5.

#### O que a rodada ensinou sobre método

**Duas premissas minhas caíram por medição.** Eu disse que faltava `maxlength` num campo — ele
tem; o que passava calado era o **caractere**, e `Pedido No 1 - Natal/2026` chegava ao extrato
como `PedidoNo1Natal2026`. E eu disse que uma aba precisaria mudar o desconto: ela **já estava**
em 5%.

**Trocar a fábrica não chega a quem já usou a ferramenta** — o estado dele já tem a frase antiga,
e valor gravado vence padrão. Sem migração, a decisão do separador não aconteceria no único
navegador que importa. Mas a migração **não** foi dada ao desconto nem ao resumo: o número é
dinheiro e o interruptor pode ter sido desligado de propósito.

**Um defeito no próprio teste, achado porque estava lento:** a marcação de um opcional falhava
calada atrás do marcador desenhado, e quem acabava zerado era um opcional não marcado — a suíte
**passava dizendo menos do que promete**.

| Estimativa | Tempo real |
|---|---|
| — | **32 min** (18:07 → 18:39) |

### 44. PayPal item a item, a prévia do relatório, e o centavo do desconto — 13/09/2026

Versão `2026-09-13k`. Decisões em `docs/decisoes-2026-09-13-paypal-e-centavo.md`. O pedido ia ao
PayPal como **uma linha só**, com os nomes concatenados e cortados em 127 caracteres — e o
Checkout e a Mini loja mandavam **só produtos**: os opcionais entravam no valor e não apareciam.

#### O que a rodada ensinou sobre método

**A conta fecha por construção.** `item_total` é a soma dos itens em centavos inteiros, nunca o
subtotal, que soma os mesmos números em outra ordem; e `discount` é a **diferença**, nunca o
percentual recalculado. Importa porque o PayPal **recusa o pedido inteiro** se a conta não bater
ao centavo — o cliente fica sem botão para pagar.

**O centavo do desconto, medido antes de mexer:** em **79.200.000** combinações, **133.476
divergiam da conta exata (0,169%), e em todas o cliente pagava a mais**. Em nenhuma pagava a
menos — **viés, não ruído**. Em centavos inteiros, zero divergências nas mesmas 79.200.000.

**Nenhuma suíte o tinha pegado, e a razão é estrutural:** todas comparam as pontas entre si, e as
pontas concordavam. Tela, Pix e PayPal mostravam e cobravam o mesmo número errado. **Quem pega é
comparar com uma conta exata.**

**E a transcrição de `sinal.mjs` repetia a forma antiga.** Ela existe para ser segunda opinião —
e *transcrição que repete o erro do original não é segunda opinião, é eco*.

**Um defeito meu no teste novo:** a primeira versão chamava `new Function()` **dentro do laço** —
79 milhões de compilações, mais de dez minutos. Compilado uma vez: **4 segundos**, medindo
exatamente o mesmo.

| Estimativa | Tempo real |
|---|---|
| — | 3h12 de calendário (18:39 → 21:51), sem commit no meio. |

### 45. Unificar as abas de pagamento, leva 4 — 13/09/2026

Versão `2026-09-13l`. Configuração e textos: catorze itens feitos, três **justificados** e
deixados como estavam, quatro declarados com a medição sem mexer, três parados esperando a
palavra do dono.

#### O que a rodada ensinou sobre método

**Um item saiu na direção oposta à primeira leitura.** Eu tinha catalogado como defeito a máquina
de cupom ser emitida **sem cupom cadastrado**, com a Mini loja "fazendo certo" ao recortá-la. A
justificativa escrita estava do outro lado, em três abas: *a lista de cupons é editável dentro do
bloco publicado*. Quem estava fora do padrão era a Mini loja. Custo medido, não estimado: o bloco
vai de 43.415 para 46.975 caracteres (+8,2%), e em troca o cupom escrito à mão dentro do bloco
publicado volta a funcionar. **A varredura marcou "não" na coluna de justificativa porque não leu
a documentação inteira — e declarou esse limite.** Ler a justificativa antes de arrumar inverteu o
conserto.

**Nove textos eram literais escritos à mão em duas ou três tabelas, todos concordando.** Viraram
entradas da fábrica única. *Cópia que concorda hoje é a que diverge amanhã.*

| Estimativa | Tempo real |
|---|---|
| — | **1h08** (21:51 → 22:59) |

### 46. Unificar as abas de pagamento, leva 5 — 14/09/2026

Versão `2026-09-14a`. A última da unificação, de aparência: doze itens alinhados, três
justificados, um parado.

#### O que a rodada ensinou sobre método

**Dos 15 catalogados, 2 eram decisão registrada — e os dois que a varredura errou eram os que
custariam mais caro.** A justificativa de um deles não estava em comentário nem em `docs/`:
estava **no texto da tela**, que é onde varredura de código não olha.

**Dois casos em que a MAIORIA era o lado errado.** A moldura branca atrás do QR: medido com a
biblioteca de verdade, o canvas sai com **zero pixel branco nas bordas**, e a chapa branca que só
uma aba tinha era a única zona quieta das quatro. Alinhar pela maioria espalharia a fraqueza. E a
cor do aviso do Pix: **cor fixa dentro de um véu translúcido ignora a escolha do dono**.

**O achado que mais valia:** `font:700 13px/1.2 inherit` **não é CSS válido** — `inherit` não é
nome de família, e o navegador **descarta a declaração inteira, em silêncio**. Medido com o bloco
rodando: os nove botões da Mini loja e o botão de trocar da vitrine saíam em 400 / 13,33px /
Arial. Dez declarações corrigidas.

**E a armadilha que mordeu durante a escrita da prova:** a área do Pix do Checkout **nunca
abria**, e 30 valores foram lidos de elementos escondidos até entrar a guarda "a área do Pix abriu
de verdade". *Teste que não alcança o estado não prova nada sobre aquele estado* — de novo.

| Estimativa | Tempo real |
|---|---|
| — | **1h25** (22:59 → 00:24) |

### 47. As três decisões do dono — 14/09/2026

Versão `2026-09-14b`. A chave Pix de uma aba era **validada por uma string e cobrada por outra**;
dois renomes com conversão; e a frase do "código copiado" ficou igual nas quatro abas.

#### O que a rodada ensinou sobre método

**O defeito foi provado ANTES do conserto, e é o que dá valor à prova:** chave com U+200B na ponta
era **aceita**, e a prévia emitia com o invisível enquanto a textarea emitia sem — os dois blocos
executados produziram **BR Codes diferentes, os dois fechando o CRC**.

**O alcance foi medido, não suposto.** O defeito não chegava à textarea entregue nem pelo estado
gravado. O caminho que alcança é a **colagem**, que dispara a prévia em 400 ms — **o gesto mais
provável de todos**: colar a chave vinda do app do banco e conferir na prévia. A primeira versão
do teste não alcançava esse estado e foi refeita.

**A migração não foi copiada por analogia, e está escrito por quê.** A frase curta do "código
copiado" continua **certa**, só mais curta, então quem personalizou não é tocado; o separador "OU"
**precisou** de migração porque ficaria errado depois da decisão do meio prioritário. Os dois
casos estão declarados lado a lado **para ninguém copiar a migração por analogia**.

| Estimativa | Tempo real |
|---|---|
| — | **28 min** (00:24 → 00:52) |

### 48. SKU próprio por produto e por item opcional — 14/09/2026

Versão `2026-09-14c`. Spec: `docs/specs/2026-09-14-sku-por-item-design.md`. O dono olhou a prévia
do relatório do PayPal que a rodada 44 criou e viu que **todas as linhas levavam o mesmo `sku`** —
o código do pedido. **Não era ausência de informação: era informação que não distingue nada, com
cara de que distingue.**

#### O que a rodada ensinou sobre método

**A opção "se vazio, herda o do TidyCal" foi oferecida e recusada, pelo motivo certo:** olhando o
relatório não daria para saber se o valor foi escolhido ou herdado.

**A comparação de SKU repetido é literal**, ao contrário da do código do pacote — porque lá o Pix
apaga a diferença dentro do payload e aqui não há payload: o `sku` vai ao relatório byte a byte, e
recusar `ALB20` contra `alb20` **inventaria uma colisão que não existe**.

**Três acoplamentos ao defeito antigo, no arnês.** Duas suítes cobravam `sku === custom_id` —
**as duas provas dependiam do defeito para passar**. Passaram a ler o `custom_id`, e uma delas
agora cobra a **ausência** da chave.

| Estimativa | Tempo real |
|---|---|
| — | **32 min** (00:52 → 01:24) |

### 49. Novidades: as release notes dentro da ferramenta — 14/09/2026

Versão `2026-09-14d`. Pedido do dono, e logo depois a regra que o acompanha: *"sempre que alterar
algo no projeto, seja melhoria, seja correção, o release notes tem que SEMPRE ser atualizado."*
Nasceu com 59 versões, agrupadas por dia, num terceiro painel da barra do topo.

#### O que a rodada ensinou sobre método

**Não é aba, e a razão é aritmética.** As abas de `ABAS` são construtores; uma aba que não gera
nada viraria exceção em cada lugar que as percorre, e `fcAbasTxt()` passaria a contar uma página
de texto como construtor — **16 frases mentiriam por um**.

**O texto mora DENTRO do `index.html`, e a razão é a própria lista.** Um arquivo próprio era
viável e **seria o defeito que esta lista existe para descrever**: arquivo separado tem validade
própria no cache, então a ferramenta poderia anunciar uma versão enquanto a lista para noutra,
cada uma certa sobre si e **a dupla mentindo**. Custo medido: +31 KB (+2,6%).

**As três redes são exercitadas, não prometidas:** a árvore é servida de novo com um byte trocado
— uma versão não descrita — e as guardas têm de acender nomeando-a.

**Achado resolvido no caminho:** `fcdLigar` **não era idempotente**. Uma segunda chamada
penduraria um segundo ouvinte, o clique alternaria duas vezes e **a seção nunca mais abriria —
sem erro nenhum no console**.

| Estimativa | Tempo real |
|---|---|
| — | **51 min** (01:24 → 02:15) |

### 50. Tamanho do QR configurável nas quatro abas — 14/09/2026

Versão `2026-09-14e`. O campo existia só no Link de cobrança. O dono autorizou dá-lo às outras
três **depois de eu recomendar não fazer** — a recomendação vinha de uma explicação coerente, mas
**não havia justificativa escrita**, e a decisão é dele.

#### O que a rodada ensinou sobre método

**Padrão de fábrica 200, não 180** — é o número que as três já emitiam. *Padrão que muda a saída
sem ninguém pedir é o que a regressão existe para denunciar.* Zero divergência, e o zero é a
prova.

**Medido com a biblioteca de verdade, não pelo CSS emitido**, e com **três números diferentes de
propósito** — 140, 260 e 320 —, porque com um só um bloco lendo o campo da aba errada passaria.

**Primeira rodada sob a regra das release notes:** a entrada foi escrita antes do carimbo, e
`conferir-versoes.sh` a exigiu.

| Estimativa | Tempo real |
|---|---|
| — | **1h29** (02:15 → 03:44), com o primeiro commit da rodada, `60c0924`, às 02:56. |

### 51. Itens com SKU e upsell por cobrança, no link — 14/09/2026

Versão `2026-09-14f`. Duas decisões do dono na mesma rodada **de propósito**: as duas acrescentam
parâmetro ao link e, juntas, custam **um** recolar do código 1 em vez de dois. O que destravou a
segunda foi ele informar que não tem links pendentes de pagamento.

#### O que a rodada ensinou sobre método

**A forma no endereço é tamanho-ponto-valor, e não separador.** Com separador, um nome que o
contivesse precisaria ser proibido ou escapado — e o escape teria de sobreviver ao
`encodeURIComponent` que embrulha o parâmetro inteiro, que é onde defeito silencioso mora. Com o
tamanho na frente, nenhum caractere é proibido.

**Os dois parâmetros entram no selo EM PAR, e isso não é enfeite.** Com serialização por
comprimento, empurrar só o preenchido faria "itens sem upsell" e "upsell sem itens" produzirem a
**mesma lista** — um link com itens poderia ser re-selado como um link com upsell, **com a conta
fechando**. A suíte **forja essa troca** e exige recusa.

**As variáveis do upsell passaram a sair SEMPRE**, pela mesma razão medida do desconto e do sinal:
*o bloco não pode depender do que estava configurado no dia em que foi gerado*.

**Duas recusas valem mais que a funcionalidade:** a soma dos itens tem de bater ao centavo com o
valor da cobrança; e itens e sinal não convivem. Emitir seria pior — o dono veria o link crescer e
o relatório continuar com a linha única, **sem uma palavra**.

| Estimativa | Tempo real |
|---|---|
| — | **46 min** (03:44 → 04:30) |

### 52. Prévia na página `/cobrar` — 14/09/2026

Versão `2026-09-14g`. Spec: `docs/specs/2026-09-14-previa-na-cobrar-design.md`. Duas metades
independentes: um quadro carregando a `/pagar` publicada do dono com o link recém-gerado, e uma
tabela dizendo o que vai ao PayPal naquela cobrança.

#### O que a rodada ensinou sobre método

**A página real, não um desenho.** Desenhar a página ali seria segunda implementação do que o
bloco faz — e a regra da casa é *"prévia roda o gerador, não imita o gerador"*.

**O efeito colateral é a maior vantagem:** bloco desatualizado na `/pagar` → a prévia mostra **a
recusa**. Provado servindo um bloco gerado na árvore anterior. **Até agora isso só apareceria com
o cliente na frente.**

**A falta de rede, em três camadas** — e a terceira é a que interessa: na espera de 15 s
**pergunta-se ao próprio iframe se ele chegou a navegar**; leitura que lança significa que
navegou para o site do dono. Sem essa distinção, a espera derrubaria uma prévia que está lá toda
vez que o SDK do PayPal demorasse.

**Achado pelo caminho, e não era desta rodada:** uma suíte falhou medindo a zona quieta do QR com
a saída byte a byte idêntica. Causa: a medida lia **uma** linha do canvas, e o código do pedido da
Mini loja embute `Date.now()` — o desenho muda a cada execução. Passou a ser o **menor branco
entre todas as linhas**, que é o que "zona quieta" significa.

| Estimativa | Tempo real |
|---|---|
| — | **1h02** (04:30 → 05:32) |

### 53. A prévia do PayPal em tela estreita — 14/09/2026

Versão `2026-09-14i`. O dono viu um nome de produto sair quase uma letra por linha na prévia de um
celular. Abaixo de 308 px a lista passa a sair **empilhada**, um bloco por item, com o nome de
cada campo ao lado do valor — a mesma forma que os totais já usavam.

#### O que a rodada ensinou sobre método

**Duas medições, e nenhum número escolhido.** As larguras das colunas passaram a ser as mesmas que
a `/cobrar` já tinha medido pelo nome de campo mais longo de cada coluna — *duas telas que mostram
os mesmos nove campos não podem ter geometrias diferentes* —, e é daí que sai o limiar de 308. E a
largura do quadro foi lida **no próprio pai, nunca deduzida da janela**: 402 px numa prévia e 364
na outra. Um primeiro limiar de 380 teria virado a segunda sem ninguém pedir; **foi a medição que
o desmentiu**.

**Achado pelo caminho, consertado junto:** `conferir-versoes.sh` contava **linhas** com `grep -c`
ao procurar entradas repetidas nas release notes. Como as entradas são uma por linha, duas da
mesma versão escritas na mesma linha contavam 1 e passavam — **e a própria prova que existe para
cobrar isso estava vermelha desde que nasceu**. *Vermelho permanente esconde o próximo que seria
de verdade.*

**A prova não tem commit congelado:** compara **as duas formas da árvore de hoje entre si**, com o
invariante de que só a **forma** muda e o conteúdo lido da tela é idêntico. É a regra de 13/09
sendo aplicada logo na rodada seguinte.

| Estimativa | Tempo real |
|---|---|
| — | Não recuperável. A publicação anterior é das 05:32 da mesma madrugada e a desta é das 12:48. |

### 54. A décima primeira aba: Calculadora de álbum — 15/09/2026

Versão `2026-09-15a`. Spec: `docs/specs/2026-09-15-aba-calculadora-de-album-design.md`.
Substitui a calculadora escrita à mão que vivia num `<iframe srcdoc>` travado em 560 px na página
de álbuns — fora do painel consolidado e sem nenhum parâmetro configurável. A aba torna
configuráveis o preço por foto, os tamanhos (com a média de fotos por lâmina, o mínimo de fotos e
o SKU de cada um), as faixas de desconto por quantidade de lâminas, os acabamentos opcionais e
**todos** os textos da tela; e traz o pacote de pagamento das quatro abas irmãs.

#### O que a rodada ensinou sobre método

**A prova é a calculadora publicada, combinação por combinação.** As **2.760 combinações** de
tamanho, quantidade de fotos e acabamentos foram lidas **da tela dos dois lados** — não por
amostragem, e não comparando fórmulas. Zero divergências.

**O sinal nasce ligado em 50%, ao contrário das irmãs, e a exceção tem razão escrita:** nas outras
abas os três textos do sinal nascem vazios porque a política é do dono e inventá-la seria mentir
numa tela de pagamento; aqui a política **já estava escrita na página de álbuns dele**, então o
padrão repete o que ele já diz em vez de inventar.

| Estimativa | Tempo real |
|---|---|
| — | Não recuperável. A rodada chega num commit só; a publicação anterior é de 14/09 às 12:48. |

### 55. Auditoria: a rede cobre a aba nova, e duas redes no lugar de dois comentários — 16/09/2026

Versão `2026-09-16a`. Primeira rodada saída da **auditoria de documentação, código e release
notes** que o dono pediu em 16/09 — quatro varreduras, sete itens aprovados por ele, executados
em três faixas. O mapa dos achados está no relatório entregue a ele; a fila viva está na seção
"EM EXECUÇÃO AGORA" de `docs/pendencias.md`.

Entregou os itens **1, 2 e 4** da fila: a calculadora de álbum entrou na regressão byte a byte
(26 saídas) e os textos dela na passagem configurada (de 24 para 29); a ordem do registro de
abas e a caixa "o que ainda depende de você" ganharam rede em vez de comentário; e este arquivo
nasceu, com as 57 versões que não tinham histórico.

#### O que a rodada ensinou sobre método

**A rede principal estava cega para a aba mais nova, e o verde escondia isso.** A regressão dizia
`OK` sem exercitar a única aba que cobra sem estar na fotografia — e ela consome exatamente a
maquinaria de dinheiro que o invariante existe para proteger. Verde que não mede não é verde.

**Uma caixa que "existe" não é uma caixa que está certa.** A única asserção sobre a caixa de ações
era `acoes > 0`. Ela passou por meses enquanto a caixa mostrava a instrução errada. Medir a
existência de um elemento é o jeito mais fácil de escrever uma prova que nunca falha.

**A marca "Substituída em…" entrou por necessidade da prova, e virou melhoria do produto.** Para
a prova distinguir ação viva de ação superada, a diferença precisava existir no DOM — e, existindo
no DOM, existe na tela. O que era testabilidade virou a resposta ao outro achado da auditoria: a
nota que dizia "espera a sua palavra" sobre algo entregue no dia seguinte.

**O tempo real passou a ser relógio, por ordem do dono, depois de eu inventar a coluna.** Reportei
48 min e 1h22 para dois itens; medido, os dois juntos couberam em 49 min, numa janela que ainda
continha a auditoria inteira. Um terceiro, executado por subagente, foi reportado como 1h04 quando
o próprio agente devolvera 5 min 20 s. A regra e o caso estão no `CLAUDE.md`.

| Estimativa | Tempo real |
|---|---|
| 2 h 10 (itens 1 e 2) · 2 h (item 4) | Itens 1 e 2: **≤ 49 min os dois juntos**, sem marca por item — a janela contém a auditoria e as conversas. Item 4: **5 min 20 s**, medido pelo relógio do próprio subagente. |

---

### 56. O ledger vira útil, e o arnês para de contar abas na mão — 16/09/2026

Versão `2026-09-16b`. Pedido do dono, no meio da fila: *"precisamos garantir que o ledger seja
realmente útil e sempre atualizado com o que se precisa. Isso é regra."*

O volume tinha nascido no dia anterior e **já estava uma rodada atrás**. Ganhou três coisas: um
**índice gerado dos próprios títulos** (`scripts/ledger-indice.sh`), a declaração de que é o
volume **corrente**, e rede em `conferir-versoes.sh` — que agora recusa carimbo sem linha no
ledger, **recusa entrada sem a tabela de estimativa e tempo real**, e recusa índice
desatualizado.

Junto veio o que a quarta varredura da auditoria mediu: quatro provas com contagem de abas
cravada à mão, e duas que morriam sem medir nada.

#### O que a rodada ensinou sobre método

**Rede que só confere presença não confere nada.** A primeira versão da conferência aceitava
qualquer linha que citasse a versão — uma linha solta satisfaria. A tabela de custo é a única
coisa que o ledger tem e mais nenhum documento tem; sem ela a entrada é um título.

**O índice é gerado porque índice escrito à mão é uma segunda lista.** É o mesmo defeito que
esta semana já eliminou em `FCR_ACOES`, em `FC_PAG_PREFS` e nas três listas de prefixo.

**Eu quebrei duas provas e a varredura as encontrou.** Ao pôr a aba nova no cenário compartilhado,
as suítes presas a um commit anterior passaram a morrer com exceção — nem falha, nem `NÃO MEDIU`:
processo morto, zero verificações. É a forma mais severa da armadilha de referência congelada.
A guarda que faltava é a que `gerarTodas` já tinha: **aba que não existe na árvore é pulada.**

**Número cravado que por acaso fecha esconde mais que número cravado que falha.** Em
`chave-pix-limpeza`, a assertiva "as QUATRO abas montam a chave com `pixLimpar`" continuava
verde: quatro abas usavam `pixLimpar` e a quinta usava só o trim — o 4 fechava, e a divergência
passava. O vermelho da assertiva vizinha é que denunciou.

| Estimativa | Tempo real |
|---|---|
| — (pedido no meio da fila, sem estimativa dada antes) | **3 min 39 s** — de 00:54:17 a 00:57:56, relógio |

---

### 57. As explicações que param de poluir o dia a dia — 16/09/2026

Versão `2026-09-16c`. Item 7 da fila, e o único dela que é **melhoria de uso** — os outros seis
são dívida. Pedido do dono: *"cada campo acompanha um box com orientações. É excelente, mas
deixa a interface do dia a dia mais poluída. É ótimo no início do uso; à medida que se usa,
deixa de ser necessário aparecer o tempo inteiro."*

Um botão na barra do topo recolhe cada corrida de caixas numa linha com lâmpada; um clique abre
a explicação no lugar dela. Nasce em "mostrar sempre": nada muda na tela até ele apertar.

#### O que a rodada ensinou sobre método

**A medição derrubou a alternativa preferida dele, e isso era o serviço.** Ele pediu uma lâmpada
ao lado de cada campo, com o texto ao passar o mouse, e disse que era a preferência dele. Medido:
das 423 caixas, só **106** vêm logo depois de um campo — **157 vêm depois de OUTRA caixa** (são a
segunda, a terceira, a quarta de uma pilha), 93 explicam um grupo e 31 um fieldset. A alternativa
preferida cobriria um quarto delas, e pendurar quatro lâmpadas no mesmo rótulo seria pior que as
caixas. A resposta certa foi por **corrida de caixas**, não por campo.

**Clique, e não passar o mouse — e a razão não é acessibilidade genérica.** O texto sumiria no
instante em que ele move o mouse para o campo que vai preencher, que é exatamente quando precisa
dele. (Não existir no toque é o segundo motivo, não o primeiro.)

**O que NÃO recolhe foi decidido por medição, e cada família tem razão própria:** os 62 avisos
âmbar (dizem que um campo não vale naquela configuração — escondê-los troca defeito visível por
invisível), as 15 com botão dentro (esconder esconderia um controle), a 1 com campo dentro (a
busca leva a campos) e as que têm `id` (o código já as mostra e esconde; segundo mecanismo por
cima do primeiro é onde a divergência nasce). Ao todo, **98 das 433 nunca recolhem**.

**O DOM é montado uma vez e não muda quando o interruptor vira.** O botão troca UMA classe no
`<body>`; o resto é CSS. Não há segundo estado a sincronizar — que é a mesma razão de `fccOrfas`
e de `FCR_ACOES` terem deixado de ser listas paralelas nesta mesma semana.

| Estimativa | Tempo real |
|---|---|
| 7 h 30 | **2 min 07 s** — de 01:02:00 a 01:04:07 no relógio. A marca cobre a implementação; o desenho e a medição das 433 caixas aconteceram antes dela, na conversa em que o dono escolheu a alternativa, e não foram cronometrados. |

---

## O que este volume NÃO mede

**A coluna Estimativa está vazia em 48 das 54 rodadas.** Setembro praticamente não registrou
estimativa. Seis rodadas têm uma, e todas vieram de um lugar escrito:

| Rodada | Estimativa registrada | Onde está escrita |
|---|---|---|
| 6 — Validade do cupom | 45 min – 1h15 | `docs/specs/2026-09-01-validade-do-cupom-na-linha-do-desconto-design.md` |
| 8 — Acentuação do texto do cliente | 30 – 45 min | `docs/specs/2026-09-01-acentuacao-do-texto-que-o-cliente-le-design.md` |
| 9 — WhatsApp acentuado | 30 – 45 min | `docs/specs/2026-09-01-whatsapp-acentuado-e-frase-unificada-design.md` |
| 10 — Frase única do pedido zerado | 20 – 30 min | a mesma spec da rodada 9 |
| 11 — A décima aba | 11h – 15h | `docs/specs/2026-09-02-agendamento-por-pacote-design.md`, seção 14 |
| 14 — Textos configuráveis e famílias | 11h – 13h, revista para 7h – 9h | corpo do commit `6c38277` e a `CLAUDE.md` |

**As outras 48 células ficaram com `—` e continuam assim.** Nenhuma foi deduzida do tempo real,
nem estimada em retrospecto, nem preenchida com "provavelmente". Previsão fabricada depois do
fato não é previsão, e uma coluna com estimativas inventadas não serve para o que ela existe:
comparar o que se previu com o que se mediu.

**Sete rodadas não têm tempo real recuperável** — a 5, a 21, a 26, a 34, a 39, a 53 e a 54. Todas
pelo mesmo motivo: a rodada inteira chega à `main` num commit só, e a publicação anterior está
separada por uma noite ou por dias. Não há relógio para consultar, e nenhum número foi escolhido
para preencher a lacuna. A rodada 1 tem o intervalo entre as suas duas publicações, mas não o
início.

**As 47 células restantes somam 66h33.** O número serve para dar ordem de grandeza e não vale
como total de trabalho: **oito delas são intervalo de calendário**, marcado na própria célula, e
incluem tempo não trabalhado dentro do mesmo dia.

**Três coisas em que as fontes discordam, registradas em vez de conciliadas:**

1. **A rodada 10.** A spec registra **~25 min** para a parte do Checkout, e os dois carimbos de
   publicação estão a **4 minutos** um do outro (23:30 e 23:34). Os dois números não podem estar
   certos ao mesmo tempo sobre a mesma coisa. A leitura mais provável é que boa parte do trabalho
   do Checkout aconteceu antes da publicação das 23:30, dentro da rodada 9 — mas isso é leitura,
   não medida, e por isso a célula traz os dois números e não escolhe.
2. **Duas versões que não existem.** `2026-09-02e` foi pulada, e a própria lista de Novidades diz
   isso. `2026-09-14h` não aparece em lugar nenhum: nem nas Novidades, nem em nenhum carimbo da
   história — a letra foi consumida e a versão nunca chegou a ir ao ar. Nenhum registro explica
   por quê.
3. **As datas da `docs/pendencias.md` não batem com os carimbos em alguns casos.** Ela diz
   "Entregue em 03/09/2026 — a leva dos achados" sobre o que foi carimbado `2026-09-02h`, às 22:45
   de 02/09; e "Entregue em 12/09/2026 — o meio de pagamento prioritário" sobre o que foi
   carimbado `2026-09-13a`, às 00:21 de 13/09. As duas são rodadas que atravessaram a
   meia-noite ou foram registradas no dia seguinte. **Este ledger segue o carimbo**, que é o
   instante em que a versão passou a existir para o dono, e nomeia a rodada pela data da entrega
   quando as duas divergem. O cabeçalho da `pendencias.md` também ainda diz "Atualizado em
   03/09/2026", com conteúdo de 15/09 dentro.

**O que este volume não é.** Ele não repete a `docs/pendencias.md`, que traz a medição inteira de
cada rodada de setembro, nem as specs, que trazem o desenho. Ele diz o que saiu, quando, e quanto
custou — e, onde o custo não foi medido, diz isso em vez de inventar.
