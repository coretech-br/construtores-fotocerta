# O meio de pagamento prioritário: um controle por aba

Pedido do dono em 12/09/2026: *"Na página de Agendamento de Pacotes o PIX é prioritário — aparece
antes do PayPal e o preço em destaque é o valor via PIX. Gostaria que todos os construtores de
pagamento tivessem a mesma prioridade."* E, depois de eu propor inverter no código: *"seria uma boa
opção eu escolher qual é a ordem. Para algumas campanhas pode fazer sentido eu escolher por
configuração qual é a ordem mais adequada para cada caso."*

## A premissa do pedido estava parcialmente errada, e a medição corrigiu

Não eram três abas com PayPal primeiro. **O Link de cobrança já mostrava o Pix antes do PayPal** —
o que ele tinha de diferente era o preço em destaque. São **dois eixos**, não um:

| Aba | Ordem, antes | Preço em destaque, antes |
|---|---|---|
| Agendamento por pacote | **Pix** | **do Pix** |
| Link de cobrança | **Pix** | do PayPal (cheio) — **híbrida** |
| Checkout | PayPal | do PayPal (cheio) |
| Mini loja | PayPal | do PayPal (cheio) |

## As duas decisões do dono

1. **Um controle, não dois.** O campo decide ordem **e** destaque juntos. Com dois campos existiria
   "Pix em cima com o preço do cartão grande" — o estado incoerente que ninguém publica de
   propósito, e que ninguém percebe depois de publicado.
2. **Padrão de fábrica: Pix.** Configuração gravada antes da rodada não tem a chave, cai no padrão,
   e por isso um bloco antigo **regerado** sai na ordem nova. Efeito pretendido, declarado a ele.

## O desenho: os dois números sempre à vista

Replicado da aba `pac`, que já o resolvia: o preço do meio prioritário grande, **mais** a linha
menor com o valor do outro meio, **mais** o selo do desconto. O cliente que vê `R$ 450` grande e
clica no cartão não é surpreendido — o `R$ 500` está logo abaixo. **O número que o PayPal
efetivamente cobra continua sendo o cheio**, lido do `createOrder` do próprio bloco pela prova.

## Frase que aponta para o outro meio tem DOIS padrões de fábrica

`FC_ORD_PARES` guarda cada frase nas duas versões. O comentário do código diz o porquê melhor do
que uma spec: *"Escrever um só é escolher em qual das duas ordens a ferramenta vai mentir."*

| Chave | Pix prioritário | Cartão prioritário |
|---|---|---|
| `ou` | `ou pague com cartão` | `ou pague com Pix` |
| `ouDesc` | `ou pague com cartão, sem o desconto de {pct}%` | `ou pague com Pix com {pct}% de desconto` |
| `cartaoLinha` | `ou {valor} no cartão` | `ou {valor} no Pix` |
| `erroComPix` / `paypalFora` | `…Use o Pix acima…` | `…Use o Pix abaixo…` |

A terceira coluna das tabelas de texto continua sendo **uma** string (a da ordem de fábrica), e por
isso `fcTxtFabricaDiverge` não mudou. `FC_ORD_TXT` é o **único** lugar que diz qual frase depende da
ordem em qual aba — os três usos (virar na tela, migrar o estado, e a prova) leem de lá.

## A migração, sem a qual a mudança não chegaria ao dono

Os campos de texto são gravados **a cada tecla**, então o estado do dono já continha a frase antiga.
Trocar o padrão de fábrica não o alcançaria: valor gravado vence padrão. `fcOrdMigrar` roda no
`restaura()`, **só** quando a chave `prio` está ausente, e troca **só** o valor que for, caractere
por caractere, a fábrica da ordem anterior. Texto que o dono escreveu nunca é tocado — provado dos
dois lados, com estado colhido da própria `main`, nunca escrito à mão.

## Com um meio só

O campo fica **visível e desligado**, com a ajuda dizendo por quê e que a escolha fica guardada.
Esconder faria o dono procurar a opção que viu ontem; ignorar em silêncio é o que este projeto já
recusou em outros lugares. Provado que nesse estado a escolha não muda um byte em aba nenhuma.

## A prova que não existia

Antes desta rodada, `grep -E "fcu-sep|fcm-sep|fcpg-sep|pixlinha|fcu-botoes" scripts/` devolvia
**zero**: a ordem era efeito de concatenação de string, e nada a fixava. `meio-prioritario.mjs` (104
verificações) roda os blocos numa página de verdade e mede, nas quatro abas e nas duas escolhas, a
ordem **pelo índice dos filhos no DOM**, o separador entre os dois, os dois números à vista, o
destaque por `getComputedStyle().fontSize`, o valor que o PayPal cobra, e as frases.

## As 17 divergências da regressão — e por que divergir era o correto

Mudança de comportamento, não refatoração. 21 das 25 saídas idênticas, **os nove links idênticos**.

- **`u-out` e `m-out`** — a ordem das três linhas de emissão, `.fcu-pixlinha`/`.fcm-pixlinha`
  virando o número grande, `margin-top` no botão do Pix (que passou a ser o primeiro), e as duas
  frases do separador.
- **`p-out1`** (e as nove cobranças, que são o mesmo bloco contado nove vezes) — `fcpg-valor` passou
  a escolher entre Pix e total conforme `DESCONTO_PIX>0`, `fcpg-pixlinha` passou a trazer o valor
  cheio, e `paypal()` passou a devolver `true`/`false`: aqui a presença do PayPal é decidida em
  **tempo de execução** (o parâmetro `pp` do link), então o separador só pode entrar depois de
  `paypal()` dizer se desenhou — senão sobraria um "OU" solto numa cobrança sem PayPal.
- **`a-out3`** — **só um comentário** dentro do bloco entregue. O código gerado da `pac` com Pix
  prioritário é **byte a byte idêntico** ao de `main`, e essa identidade é a prova de que o padrão
  de fábrica reproduz exatamente o que já está no ar.

**A prova do outro lado:** com o campo em cartão, `u-out` e `m-out` voltam a ser byte a byte
idênticos aos de `main` — o que mostra que a mudança levou só a ordem, e nada mais.

## O achado do sinal: medido, e o gerador já o impedia

Levantei que, com sinal ligado, o desconto do Pix é zerado — e que então "preço do Pix" e "preço
cheio" virariam o mesmo número, com a tela mostrando duas linhas idênticas e um selo de `-0%`.

**Não acontece.** A linha do Pix — o elemento **e** a regra de CSS — só é emitida com `descpix>0`, e
o zeramento acontece **antes** disso. Não existe segunda linha para repetir o número. Em vez de
inventar tratamento para um estado que o gerador impede, o comportamento foi **fixado em teste**
(seção 6, +32 verificações): com sinal ligado, a linha do Pix não existe no DOM, não há `-0%` em
lugar nenhum, e a diferença entre as duas escolhas se resume à ordem e ao separador. Se um dia o
sinal chegar às outras abas, ou alguém tirar o zeramento, este teste fala.

## O que ficou de fora, com o motivo

- **`fc-compartilhado.js` e `cobrar/index.html`**: nenhum dos dois contém ordem nem destaque. A
  disciplina de versão em três lugares continua intacta.
- **O rodapé de limites da Mini loja** (`txtLimitePix`/`txtLimitePaypal`, o segundo começando com
  "também"): depende de uma ordem, mas é uma **enumeração de limitações no rodapé**, não a ordem dos
  meios. Amarrá-lo ao campo faria uma frase sobre conferência de extrato mudar quando o dono
  trocasse a ordem dos botões.
