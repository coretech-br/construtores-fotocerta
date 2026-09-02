# Agendamento por pacote — design

**Data:** 02/09/2026
**Estado:** proposta, aguardando revisão do dono
**Alcance:** aba nova (a décima), mais o painel consolidado, o preset geral e o backup

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

## 4. O catálogo

Digitado **uma vez**, na aba. Cada pacote tem seis campos:

| Campo | Regra |
|---|---|
| **Código** | letras, números e hífen. Vai na URL (`?pac=…`) e alimenta o identificador do Pix. **Nunca muda** — é o que o TidyCal guarda. |
| **Nome** | o que o cliente lê no cartão |
| **Duração** | texto livre ("2 horas", "1h30") |
| **Preço** | número, maior que zero |
| **O que inclui** | uma linha, opcional ("25 fotos tratadas") |
| **Link do TidyCal** | o caminho do tipo de agendamento |

Fora do catálogo, a aba tem campos que valem para a página inteira: o **endereço da página de obrigado**, o **prefixo do identificador**, o **prazo da reserva em horas**, o **desconto no Pix**, as **cores** e os **textos**.

O catálogo é emitido **nos dois blocos** — a vitrine precisa dele para os cartões, a página de obrigado para saber o preço. Fonte única na ferramenta; cada bloco continua autossuficiente, como manda a regra do projeto.

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

**Passo 1 — os cartões.** Nome, duração, o que inclui e **preço**, lado a lado (três por linha no computador, empilhados no celular). Escolher recolhe os cartões para uma linha de resumo com "trocar pacote".

**Passo 2 — o calendário.** Acende ao escolher.

**Um calendário por vez, criado só quando escolhido.** Não existem N iframes escondidos: existe **um**, e trocar de pacote troca o endereço dele. Três embeds do TidyCal carregando juntos é exatamente o peso que o dono quer evitar — o problema estético viraria um problema de velocidade.

**A altura do modal** usa os sinais e as medidas herdadas (§3). Quando o iframe é recriado, o ouvinte continua valendo: ele escuta `window`, não o iframe.

## 7. A página de obrigado

Um componente só, e ele faz três coisas:

1. **Lê `?pac=`** e acha o pacote no catálogo que veio dentro dele.
2. **Troca os marcadores** no texto que o dono escrever na página — `{{nome}}`, `{{data}}`, `{{hora}}`, `{{quando}}`, e os novos `{{pacote}}`, `{{duracao}}` e `{{valor}}`. Só nós de texto, nunca `innerHTML`, pulando `script`, `style`, `textarea`, `input` e `select` — a mesma disciplina já provada na página de obrigado atual.
3. **Monta o pagamento**: o que foi agendado, a barra de prazo, o total, a linha do desconto no Pix, os botões do PayPal e o botão do Pix.

**Sem `pac`, ou com código desconhecido:** nenhum pagamento na tela. Um recado cordial e o WhatsApp — a mesma família de recusas da `/pagar`.

### 7.1 O prazo da reserva, e o problema que ele esconde

A página **não sabe quando o agendamento foi feito**. Ela só sabe quando o ensaio é.

A saída: o prazo é **a primeira visita mais um número de horas que o dono configura na aba** (campo próprio, padrão 24), guardado no navegador daquele aparelho, e **limitado ao início do ensaio** — ninguém paga depois da sessão. Como o cliente cai nesta página imediatamente depois de agendar, "a primeira visita" é o momento do agendamento com erro de segundos.

Se a data do ensaio **não** for legível, o limite pelo início do ensaio simplesmente não se aplica e vale só a contagem de horas. O prazo nunca é calculado a partir de uma data que a página não conseguiu ler — mesma disciplina do identificador.

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

## 9. O que é fonte única

Nada aqui é reescrito. Da fonte compartilhada vêm: a maquinaria do Pix (`FC_PIX_SRC`), a conta do desconto (`fcTotalPixSrc`), o formato de moeda (`fcMoedaFmtGer`), o leitor de parâmetros da URL (`FC_PARAM_SRC`), o pedido do PayPal com item e conciliação, o shim das prévias (`fcPvShim`) e os escapes.

**O que NÃO se reaproveita, com a razão:** o embed do TidyCal da aba atual. Ele carrega dois modos e uma página intermediária que aqui não existem. O que atravessa é a medida (§3), não o texto.

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
