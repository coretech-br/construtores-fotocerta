# Agendamento por pacote — design

**Data:** 02/09/2026 · **revisão 2 em 03/09/2026**
**Estado:** v1 implementada e publicada; **v2 aprovada pelo dono e em implementação**
**Alcance:** aba nova (a décima), mais o painel consolidado, o preset geral, o backup — e, na v2, **as abas Checkout, Mini loja e Link de cobrança**, pelas duas unificações que a revisão pediu.

---

## 0. O que a revisão do dono mudou (03/09/2026)

Ele revisou as doze decisões do diário (`docs/decisoes-2026-09-02-agendamento-por-pacote.md`) uma a uma. Oito foram aprovadas como estavam. **Quatro mudam**, e duas delas mudam a arquitetura:

| # | Era | Passa a ser | Consequência |
|---|---|---|---|
| **1** | O bloco de pagamento espelha a `/pagar` (item único, valor fechado) | **Espelha o Checkout**, com opcionais, e o link do TidyCal vira **caminho** (`usuario/tipo`), não URL inteira | Muda o catálogo, o bloco de pagamento e a ordem das seções |
| **2** | `FC_CARRINHO_SRC` fica de fora (sem cupom, sem carrinho) | **Volta**: a página de obrigado tem **cupom** | O bloco passa a ter a conta de dinheiro completa |
| **3** | O prazo é duração, sem fuso | **Mantida** — mas a solução para o caso de virar data de calendário fica **registrada** | Só documentação |
| **8** | O pedido do PayPal fica duplicado; dívida registrada | **Extrair a fonte única agora**, e os quatro geradores consomem-na | Toca Checkout, Mini loja e `/pagar` |

E um pedido novo, fora das doze: **corrigir o tratamento do QR Code no Checkout**, como a `/pagar` faz.

### 0.1 Uma afirmação minha que estava errada, e a correção

Ao justificar a decisão 1, eu escrevi que *"o Checkout deixaria um retângulo branco de 220 px"* se a biblioteca do QR não carregasse. **É falso** — medido: ele faz `else{qr.style.display='none';}` e esconde a caixa, como a `/pagar`.

Os problemas reais do Checkout são outros, e **piores** que o que eu descrevi:

1. **`new QRCode(...)` não está dentro de `try/catch`.** Se a biblioteca carregar e lançar, a exceção escapa e **o resto de `gerarPix` nunca roda**: o copia-e-cola não é preenchido, o valor não é escrito, e a área do Pix nem chega a aparecer. O cliente fica sem forma nenhuma de pagar por Pix, sem mensagem.
2. **Corrida no carregamento.** `qrPronto` só vira verdadeiro no `onload` do script. Quem clicar em "Gerar Pix" antes de a biblioteca chegar fica sem QR **naquela geração**, mesmo que ela chegue logo depois. A `/pagar` carrega sob demanda, no momento de desenhar, e trata `onerror`.

A correção, então, não é "copiar o comportamento da `/pagar`" por gosto: são dois defeitos concretos, um deles capaz de tirar o Pix inteiro da tela.

---

## 1. O problema

O TidyCal não tem duração flexível. Para vender ensaios de 1, 2 e 3 horas, o dono precisa de **três tipos de agendamento**, e a recomendação do próprio TidyCal é colocar os três na página. Nas palavras dele: *"esteticamente isso não me atende… a página ficaria poluída"*.

O que ele quer é um agrupamento: o cliente escolhe a duração e vê **só o calendário daquela duração**. E, já que o construtor vai conhecer as durações, que ele conheça também o **preço** de cada uma — e leve esse preço até uma página de obrigado que cobra o que foi agendado.

## 2. As decisões, e quem as tomou

Todas foram fechadas com o dono antes desta spec, olhando mockups navegáveis das alternativas.

| Decisão | Escolha | Razão |
|---|---|---|
| Como o cliente escolhe | **Dois passos numerados** (variante C) | A página diz desde o começo que são dois passos; o passo 1 recolhe para uma linha ao ser escolhido e o passo 2 acende. A numeração não é enfeite: existe mesmo uma ordem. |
| Onde ele paga | **Só na página de obrigado** | O agendamento no TidyCal fica gratuito. O dinheiro entra pelo Pix (sem taxa de Stripe) ou PayPal. |
| O que o cliente pode mexer no pedido | **Nada — valor fechado** | O que ele vê é o que agendou. Sem opcionais e sem cupom nesta rodada. |
| O que vai na URL de redirecionamento | **Só um código de pacote** | O preço não viaja pela URL, então ninguém o edita na barra de endereço; e mudar um preço não obriga a mexer no TidyCal. |
| O horário reservado antes do pagamento | **Dizer o prazo, com contagem** | Urgência honesta. Quem libera o horário depois do prazo é o dono, à mão, e o texto diz isso. |
| O identificador de conciliação | **Prefixo + pacote + dia e hora** | O extrato do banco passa a dizer de qual agendamento é o dinheiro. |
| A colisão na página de obrigado | **A aba nova assume a página inteira** | Um dono só para aquela página. O bloco novo troca os marcadores E monta o pagamento. |

## 3. Por que uma aba nova, e por que só o modo direto

**Aba nova, não extensão da aba TidyCal.** A aba de hoje é sobre **um** tipo de agendamento e já tem cinco saídas; esta é sobre um **catálogo** com preço, e a página de obrigado dela tem outra forma. Juntas, o preset e o painel teriam de adivinhar qual das duas está ligada.

**Só o modo direto.** A aba atual tem dois modos, e o intermediário existe para um problema específico: o código 2 mede a altura de um lado e a aplica do outro, através da fronteira de dois documentos do mesmo domínio. Aqui esse problema não existe — o bloco é um script na própria página e cria o iframe do TidyCal com as próprias mãos, então escuta os sinais de altura direto, sem ponte. Trazer o modo intermediário seria manter uma segunda página e um terceiro código para resolver algo que este desenho não tem.

**O que se herda da aba atual é a MEDIDA, não o código:** os sinais reais do TidyCal (`scrollToOffset` abre o modal, `mutationObserver` fecha), a origem a conferir (`https://tidycal.com`) e as alturas calibradas em produção (2350 px no computador, 2700 px no celular, corte em 700 px).

## 4. O catálogo (v2)

Digitado **uma vez**, na aba. Cada pacote é um **produto no molde do Checkout**, com os campos do agendamento por cima:

| Campo | Regra |
|---|---|
| **Código** | letras, números e hífen. Vai na URL (`?pac=…`) e alimenta o identificador do Pix. **Nunca muda** — é o que o TidyCal guarda. |
| **Nome** | o que o cliente lê no cartão e no pagamento |
| **Descrição** | uma linha, opcional |
| **Duração** | texto livre ("2 horas", "1h30") |
| **Preço** | número, maior que zero |
| **Caminho do TidyCal** | `usuario/tipo-de-agendamento`, **não a URL inteira** |
| **Opcionais** | lista própria de cada pacote: nome, preço e se aceita quantidade — o mesmo molde do Checkout |

### 4.1 O caminho, e não a URL — pedido do dono na revisão

A v1 pedia o endereço completo (`https://tidycal.com/fotocerta/ensaio-2h`). **A aba TidyCal não faz assim**: ela pede o caminho (`fotocerta/natal-2026`) e monta o resto. Duas convenções para a mesma coisa, na mesma ferramenta, é a inconsistência que este projeto persegue — e a v1 escolheu a pior das duas, porque obriga a digitar o prefixo a cada pacote.

O campo passa a ser o **caminho**, com a mesma validação e o mesmo botão "abrir para conferir" que a aba TidyCal já tem.

### 4.2 Onde o cliente escolhe os opcionais, e por quê

**Na página de obrigado, não na vitrine.** A razão é do TidyCal, não nossa: quem faz a reserva é ele, e ele não sabe o que é um opcional. Se o cliente escolhesse um álbum na vitrine, a escolha se perderia ao passar pelo calendário.

Consequência que precisa estar dita na vitrine: o cartão mostra o **preço do pacote**, e os opcionais aparecem na hora do pagamento.

### 4.3 Os campos da aba, que valem para todos os pacotes

| Campo | Padrão | O que faz |
|---|---|---|
| **Endereço da página de obrigado** | vazio | para onde o TidyCal manda depois de agendar |
| **Prefixo do identificador** | vazio | começa o código que vai no Pix e no cartão |
| **Prazo da reserva** | 24 horas | quanto tempo o horário fica guardado |
| **Desconto no Pix** | 5 % | aparece no cartão, no resumo e no pagamento |
| **Parcelas no cartão** | 1 | o número anunciado, e o divisor do valor da parcela |
| **Cupons** | lista | código, tipo (% produtos, % total, fixo), valor e validade — **o mesmo cadastro do Checkout** |
| **Marcadores da página de obrigado** | todos ligados | quais variáveis do TidyCal viajam, e o **texto reserva** de cada uma |
| **Cores e textos** | os da paleta | mesma mecânica das outras abas |

**Os marcadores passam a ser configuráveis** (pedido da revisão). Na v1 os textos reserva ficaram fixos dentro do bloco; agora o operador escolhe quais variáveis passar e o que aparece quando cada uma não vem — a mesma mecânica que a página de obrigado da aba TidyCal já tem.

O catálogo é emitido **nos dois blocos**. Fonte única na ferramenta; cada bloco continua autossuficiente.

## 5. As três saídas

Reduziram de quatro para três ao medir: **nenhum dos dois blocos precisa de Tag Head**. O manual do Prosite proíbe at-rules no campo *CSS Customizado* do componente, não num `<style>` dentro do HTML do componente — e é assim que o Checkout e a Mini loja já fazem.

| Saída | Onde colar |
|---|---|
| **1. Componente HTML da vitrine** | um componente na página de agendamento |
| **2. Os N endereços de redirecionamento** | um em cada tipo de agendamento, **no TidyCal** — fora do Prosite |
| **3. Componente HTML da página de obrigado** | um componente na página de obrigado |

A saída 2 é uma lista numerada, um endereço por pacote:

```
https://…/obrigado?pac=ensaio-2h&nome={{contact.name}}&data={{booking.date}}&hora={{booking.time}}&quando={{booking.starts_at}}
```

O `{{booking_type.title}}` **não entra**: quem identifica o pacote é o código, e é justamente por isso que renomear um tipo no TidyCal não quebra nada. O e-mail também não, pela mesma razão já registrada na página de obrigado atual — menos dado pessoal circulando por menos lugares.

## 6. A página de agendamento

**Passo 1 — os cartões.** Nome, duração, o que inclui e o preço, lado a lado (três por linha no computador, empilhados no celular). Escolher recolhe os cartões para uma linha de resumo com "trocar pacote".

**O preço no cartão mostra as duas formas de pagar, e o desconto na frente** (pedido do dono, 02/09):

> **R$ 399,00**  `−5% no Pix`
> ou R$ 420,00 em até 6x no cartão

O desconto deixa de ser surpresa da última tela e vira argumento na primeira. A linha de resumo do passo 1 repete as duas formas, para o cliente não perder o número de vista ao passar para o calendário.

**A palavra "PayPal" não aparece em texto nosso** — nem no cartão, nem no resumo, nem na página de obrigado. O cliente lê "no cartão", que é o que ele vai fazer.

### 6.1 Dois limites desta escolha, declarados

**1. O número de parcelas é uma afirmação que a ferramenta não pode conferir.** "Em até 6x no cartão" é uma promessa sobre o que o cliente vai encontrar na hora de pagar, e quem decide isso é a operadora, não este código. A aba **diz isso ao lado do campo**, e o padrão nasce em 1x — o valor que é verdade sem configuração nenhuma. Prometer parcela que não existe é a mesma família de defeito que este projeto já corrigiu quatro vezes: texto que promete mais do que o sistema entrega.

**2. O valor da parcela entra, e ele traz uma conta com direção.** O dono aprovou mostrá-lo: *"pode incluir o valor da parcela, que será calculado de acordo com a quantidade de parcelas que eu informar"*. Com isso a linha fica **"ou R$ 700,00 no cartão, em até 6x de R$ 116,67"**.

**A parcela arredonda para CIMA, e a direção não é detalhe.** R$ 700,00 em 6 vezes dá R$ 116,6667, que não existe em dinheiro. Arredondando para baixo (R$ 116,66) a soma das seis daria R$ 699,96, e **uma das parcelas teria de ser maior do que o cliente leu**. Para cima (R$ 116,67) a soma dá R$ 700,02, e o cliente **nunca paga por mês mais do que estava escrito na tela**.

É a mesma lição que custou uma rodada nesta ferramenta em ago/2026, quando o Pix cobrava um centavo a mais do que a tela mostrava em 3 % das combinações: quando o arredondamento tem duas saídas, escolhe-se a que erra a favor de quem lê. `Math.ceil(preco / parcelas * 100) / 100`.

Continua valendo o que a nota 1 diz: mostrar o valor da parcela afirma **parcelamento sem juros**. O dono declarou que garante isso à mão no PayPal, e é dele a garantia.

**3. Nos botões de pagamento, "PayPal" aparece — e não há como evitar.** Os dois botões da página de obrigado são desenhados pelo **SDK do PayPal**, não por nós: o texto, a marca e as cores são deles. O que está sob nosso controle é todo o resto da página, e nele a palavra não entra. Isso precisa estar dito na aba, para o pedido não parecer atendido pela metade.

**Passo 2 — o calendário.** Acende ao escolher.

**Um calendário por vez, criado só quando escolhido.** Não existem N iframes escondidos: existe **um**, e trocar de pacote troca o endereço dele. Três embeds do TidyCal carregando juntos é exatamente o peso que o dono quer evitar — o problema estético viraria um problema de velocidade.

**A altura do modal** usa os sinais e as medidas herdadas (§3). Quando o iframe é recriado, o ouvinte continua valendo: ele escuta `window`, não o iframe.

## 7. A página de obrigado (v2)

Um componente só, e ele faz quatro coisas:

1. **Lê `?pac=`** e acha o pacote no catálogo embutido nele.
2. **Troca os marcadores** no texto que o dono escrever na página, com os textos reserva que ele configurou.
3. **Monta o pedido**: o pacote agendado como item fixo, os **opcionais** daquele pacote para o cliente marcar, e o campo de **cupom**.
4. **Cobra**: total, linha do desconto no Pix, botões do cartão e botão do Pix.

### 7.0 O que a volta do carrinho traz junto

Com opcionais e cupom, o bloco deixa de ser "valor fechado" e passa a ter a **conta de dinheiro completa** — e ela **não é reescrita**: vem de `FC_CARRINHO_SRC`, a mesma fonte que o Checkout e a Mini loja usam, com o contrato por nome que ela exige:

| A fonte chama | O bloco declara |
|---|---|
| `subtotal()` | pacote + opcionais marcados |
| `somaProdutos()` | só o pacote (é o que um cupom `pct_produto` desconta) |
| `cupomAtivo` | o cupom em vigor, ou `null` |
| `DESCONTO_PIX` | o desconto configurado |

**O que continua de fora:** `SINAL_TIPO`/`SINAL_VALOR` e as três funções de sinal. Cobrança de sinal não foi pedida aqui, e emiti-las sem interruptor seria carregar código morto no bloco do cliente.

**A decisão 2 do diário está revertida**, e a razão dela deixou de valer: ela dizia que as peças de `FC_CARRINHO_SRC` pressupõem carrinho e cupom, *que este bloco não tem*. Com a revisão, ele tem.

### 7.1 Sem `pac`, ou com código desconhecido

Nenhum pagamento na tela. Um recado cordial e o WhatsApp — mesma família das recusas da `/pagar`.

### 7.1 O prazo da reserva, e o problema que ele esconde

A página **não sabe quando o agendamento foi feito**. Ela só sabe quando o ensaio é.

A saída: o prazo é **a primeira visita mais um número de horas que o dono configura na aba** (campo próprio, padrão 24), guardado no navegador daquele aparelho, e **limitado ao início do ensaio** — ninguém paga depois da sessão. Como o cliente cai nesta página imediatamente depois de agendar, "a primeira visita" é o momento do agendamento com erro de segundos.

Se a data do ensaio **não** for legível, o limite pelo início do ensaio simplesmente não se aplica e vale só a contagem de horas. O prazo nunca é calculado a partir de uma data que a página não conseguiu ler — mesma disciplina do identificador.

**A solução para o dia em que isto virar data de calendário — registrada por pedido do dono (decisão 3 da revisão), para não ser redescoberta.** Hoje o prazo é uma **duração**, e por isso não há fuso para errar. Se um dia ele virar uma data marcada — *"vale até 20/12 às 23h59"*, igual para todo visitante —, a técnica correta já existe neste projeto e é a da aba Contagem regressiva: **resolver o fuso na hora de GERAR** e congelar uma string ISO com o deslocamento explícito (`2026-12-20T23:59:00-03:00`), que o bloco só entrega a `Date.parse`. O bloco nunca recalcula fuso no aparelho do visitante. A alternativa — somar 3 horas em tempo de execução, como `prazoFim` faz na `/pagar` para fechar o dia em Brasília — serve quando o alvo é "o fim do dia", e não um instante marcado.

O que acontece se ele abrir noutro aparelho: a contagem recomeça, e ele ganha mais tempo. **A falha é generosa, nunca punitiva** — e essa direção é escolhida, não acidental.

E o texto diz a regra de verdade: quem libera o horário é o dono, à mão. O relógio é recado, não tranca — a mesma honestidade já registrada para a validade do link de cobrança.

### 7.2 O identificador de conciliação

`prefixo + código do pacote + dia e hora do ensaio`, passado pela limpeza que o Pix exige (só letras e números, 25 no máximo). Vai no **txid do Pix** e no **`custom_id` do PayPal**, como os três geradores já fazem desde 27/08.

**Ele não inventa data.** O formato que o TidyCal manda não é conhecido daqui; se a data não for legível, o identificador cai num sufixo aleatório. Melhor um código que não diz o dia do que um código que diz o dia errado.

**Dois pacotes cujos códigos só diferem por hífen colidiriam** depois da limpeza (`mini-1h` e `mini1h` viram `MINI1H`). A aba **recusa** cadastrar o segundo, nomeando o primeiro.

## 8. As recusas

Seguindo a regra do projeto — recusar em vez de assumir:

- Nenhum pacote cadastrado.
- Pacote com preço vazio ou zero (promete desconto de nada e entrega uma cobrança de R$ 0,00).
- Código vazio, com caractere fora de `[A-Za-z0-9-]`, ou repetido depois da limpeza.
- Link do TidyCal vazio ou com esquema fora de `http(s)` — a mesma trava que a aba atual já tem.
- Endereço da página de obrigado vazio ou inválido.
- Identidade vazia (chave Pix, nome, cidade, Client ID, WhatsApp) — via `fciRecusa`, que abre o painel e leva o foco ao campo.

## 9. Fonte única — e as duas unificações que a revisão pediu (v2)

Da fonte compartilhada vêm, sem uma linha reescrita: a maquinaria do Pix (`FC_PIX_SRC`), **a conta do dinheiro (`FC_CARRINHO_SRC`)**, o desconto (`fcTotalPixSrc`), a moeda (`fcMoedaFmtGer`), o leitor de parâmetros (`FC_PARAM_SRC`), o shim das prévias (`fcPvShim`), os escapes e o embed do TidyCal.

### 9.1 O pedido do PayPal vira fonte única (decisão 8 → opção a)

**Medido:** `actions.order.create` está escrito **à mão em três geradores** — Checkout, `/pagar` e Mini loja — e nenhuma função compartilhada o escreve. A v1 ia acrescentar a quarta cópia. O dono decidiu extrair agora.

**O que se extrai, e o que provavelmente não se extrai.** Os três não são iguais: o Checkout e a Mini loja montam o nome do item a partir do carrinho e do cupom; a `/pagar` monta de um item único vindo do link. O que é idêntico nos três é o **esqueleto**: carregar o SDK, os `style` dos botões, a guarda de total zero no `onClick`, a forma do `purchase_units` com `amount`/`breakdown`/`items`/`custom_id`, o `onApprove` com `capture()`, e o `onError`.

**A prova manda na extração, e não o contrário:** as saídas `u-out`, `p-out1` e `m-out` têm de sair **byte a byte idênticas** depois. Se um byte mudar, a extração está errada — não o teste. É explicitamente permitido, e preferível, entregar uma **extração parcial com a medida do que ficou de fora**, em vez de forçar a completa e frágil: o projeto já tem esse precedente registrado na Mini loja.

**Por que agora vale a pena, e antes eu disse que não:** eu argumentei que misturar a extração com a aba nova destruiria a capacidade de dizer o que quebrou. O argumento tinha um furo — ele vale para fazer as duas coisas **no mesmo commit**, não na mesma rodada. Como tarefa própria, com a fotografia tirada antes e depois, a extração é isolável e a resposta continua nítida.

### 9.2 O desenho do QR Code vira fonte única, e conserta dois defeitos do Checkout

Pedido novo do dono. Ver o §0.1 para os dois defeitos reais — e para a correção da afirmação errada que eu fiz sobre eles.

O desenho passa a ser **um só**, no molde da `/pagar`:

- **carrega a biblioteca sob demanda**, no momento de desenhar, com `onerror` tratado — em vez de depender de um `qrPronto` que pode ainda ser falso quando o cliente clica;
- **envolve `new QRCode(...)` em `try/catch`** — hoje, no Checkout, uma exceção ali derruba o resto de `gerarPix`, e o cliente fica sem o copia-e-cola, sem o valor e sem a área do Pix;
- **esconde a caixa** quando não dá para desenhar, e a cobrança segue inteira pelo copia-e-cola.

Consumidores: Checkout, Mini loja, `/pagar` e a aba nova.

**Esta unificação MUDA `u-out` e `m-out` de propósito** — é uma correção de comportamento, não uma refatoração. O diff tem de ser enumerado linha a linha, e o da `/pagar` (`p-out1`) tem de sair **idêntico**, porque é dela que o desenho vem.

### 9.3 O que NÃO se reaproveita, com a razão

O embed do TidyCal da aba atual carrega dois modos e uma página intermediária que aqui não existem. O que atravessa é a **medida** (os sinais e as alturas calibradas), não o texto.

## 10. Painel consolidado, preset e backup

Pedido explícito do dono, e regra do projeto desde 23/08.

- As duas saídas de componente entram no mapa `fccDaAba`, cada uma com **a página a que pertence** — a de agendamento e a de obrigado.
- **Os N endereços de redirecionamento** entram na lista "fora do Prosite", com o lugar exato: *o campo de redirecionamento de cada tipo, dentro do TidyCal*. Declarados em `FCC_FORA` com o motivo.
- **O aviso de colisão — e ele não é o que parecia.** Na conversa que originou esta spec eu descrevi as duas abas disputando o **mesmo campo**. Está errado, e a revisão pegou: a aba TidyCal entrega uma **Tag Body** e esta entrega um **componente**, que são campos diferentes e não se sobrescrevem. A colisão real é de **comportamento**: os dois scripts trocam os mesmos marcadores (`{{nome}}`, `{{data}}`, `{{hora}}`) na mesma página, e quem rodar primeiro vence — inclusive nos **textos reserva**, que são configuráveis em cada aba e podem discordar. O visitante veria o texto reserva de uma aba onde o dono configurou o da outra, sem erro nenhum. O painel avisa **em vermelho**, nomeando as duas abas e dizendo qual marcador está em disputa. Ele não escolhe por conta própria.
- A aba declara `pref`, `fora`, `resumo`, `redesenhar` e `antesDeSalvar` em `ABAS`, e ganha preset próprio pela mecânica existente. O catálogo entra no preset; a identidade não, como em todas as outras.
- Rodar a varredura `fccOrfas` antes de fechar a rodada.

## 11. As prévias, e um problema real nelas

Regra do projeto: **a prévia executa o gerador, nunca o imita**. Duas prévias, cada uma num `<iframe>` de mesma origem, com o shim de armazenamento (`fcPvShim`) e a conferência de que o shim pegou.

**O problema:** a página de obrigado só faz sentido com `?pac=` na URL, e um iframe escrito por `document.write` herda a URL da ferramenta — sem consulta nenhuma. A prévia mostraria a tela de recusa, sempre.

**A saída proposta:** um arquivo mínimo ao lado do `index.html` (`previa.html`, poucos bytes) que existe só para ser um endereço de mesma origem que aceita consulta. A prévia navega o iframe para `previa.html?pac=<escolhido>` e escreve o bloco no documento carregado, preservando `location.search`. A aba ganha um seletor "prever como: [pacote]".

É um arquivo novo no repositório, e por isso está declarado aqui em vez de aparecer na implementação.

## 12. Riscos e incógnitas

1. **O modal do TidyCal dentro do nosso bloco.** Tenho evidência forte (é o mesmo mecanismo da aba atual, sem a ponte da intermediária), mas **só uma colagem numa página publicada responde**. Caminho B declarado: altura fixa por aparelho, exatamente como a aba atual faz hoje.
2. **O formato da data do TidyCal.** Já é incógnita conhecida da página de obrigado atual. Tratada por não inventar: identificador cai no aleatório, `{{quando}}` sai como veio.
3. **Preço mudado entre agendar e pagar.** Quem agendou ontem e paga hoje vê o preço que estiver no bloco publicado. Não há como ser diferente sem o preço viajar na URL — que é justamente o que foi recusado. Fica dito na aba.
4. **Trocar de pacote recria o iframe**, e o TidyCal recarrega. É o preço de não ter três embeds vivos, e é o certo — mas o cliente vê um instante de carregamento.

## 13. Verificação

- **Regressão byte a byte:** as **21 saídas** das nove abas existentes **idênticas**. Aba nova não pode mudar um byte de nenhuma delas.
- **Os dois blocos executando** numa página que imita o Prosite (`scripts/verificar/pagina.mjs`): a vitrine desenha os cartões, escolher acende o passo 2 e cria **um** iframe (nunca dois), trocar de pacote troca o `src` e não acumula iframes.
- **A página de obrigado com `?pac=` de cada pacote:** valor certo, marcadores trocados, contagem correndo, e o **payload Pix relido por leitor TLV independente** — estrutura fecha, CRC confere, campo 54 igual ao da tela, e o txid dentro do formato.
- **Sem `pac`, com `pac` inexistente, e com `pac` hostil** (`<script>`, `../`, acentos): recusa cordial, zero pagamento na tela, nada interpretado como marcação.
- **O identificador**: com data legível, com data ilegível (cai no aleatório), e dois códigos que colidiriam depois da limpeza (recusa no cadastro).
- **A palavra "PayPal" não aparece em nenhum texto nosso** nas duas saídas — varredura sobre o texto gerado. O que sobrar tem de ser só o que o SDK deles desenha em tempo de execução.
- **As parcelas**: com 1x (padrão) a linha some; com N>1 ela aparece nos cartões, no resumo e na página de obrigado.
- **O arredondamento da parcela**, com os casos que separam as duas direções: preço que divide exato (R$ 420,00 em 6x = R$ 70,00), preço que não divide (R$ 700,00 em 6x = R$ 116,67, e **nunca** R$ 116,66), preço com centavos (R$ 419,90) e parcelas de 1 a 12. Em toda combinação, `parcela × N ≥ preço`.
- **As N URLs**: uma por pacote, com o código certo em cada.
- **Painel:** as três saídas aparecem; o aviso de colisão dispara com as duas abas ligadas; `fccOrfas` sem órfãs.
- **Celular** em 360, 390 e 430 px, sem rolagem horizontal.
- Varredura de IDs, ES5, IIFE única, e a norma de acentuação de 01/09 (texto que uma pessoa lê, com acento; código, sem).

## 14. Estimativa, e a sugestão de partir em duas

| Parte | Estimativa |
|---|---|
| Aba nova, catálogo e recusas | 2h – 3h |
| Gerador da vitrine (passos, cartões, embed, altura do modal) | 2h – 3h |
| Gerador da página de obrigado (pagamento, marcadores, prazo, identificador) | 3h – 4h |
| Os N endereços de redirecionamento | 30min – 45min |
| As duas prévias, com o `previa.html` | 1h – 1h30 |
| Preset, backup, painel consolidado | 1h – 1h30 |
| Verificação | 1h30 – 2h |
| **Total** | **11h – 15h** |

**É a maior rodada desde a Mini loja.** Vale considerar partir em duas entregas:

- **Entrega 1 — a vitrine** (aba, catálogo, saída 1, saída 2, prévia, painel): resolve sozinha o problema estético que originou o pedido, e pode ir ao ar antes.
- **Entrega 2 — a página de obrigado** (saída 3, pagamento, prazo, identificador).

A ordem importa: a entrega 2 depende do catálogo que a 1 constrói, e não o contrário. Partir assim também tira do caminho crítico a incógnita 1 (o modal), que aparece na entrega 1 e pode ser resolvida antes de qualquer código de dinheiro ser escrito.
