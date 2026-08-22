# Desconto no Pix e endereço completo no link de cobrança

**Data:** 22/08/2026
**Estado:** implementado; verificação em andamento
**Toca:** `index.html` (aba Link de cobrança), `cobrar/index.html`, `fc-compartilhado.js`

---

## 1. As duas mudanças

### Endereço completo

O campo **Endereço da página de pagamento** passou a exigir o endereço **inteiro** (`https://` mais domínio). Antes ele aceitava também o caminho do próprio site (`/pagar`), e esse era o padrão de fábrica.

O motivo: o link nasce para ser **colado numa conversa de WhatsApp**, fora do site. Ali `/pagar` não abre nada. Na prática o dono montava o prefixo à mão a cada cobrança — o trabalho que a `/cobrar` existe para eliminar.

Três consequências, e as três valem **na aba e na `/cobrar`**:

1. **Relativo recusa com nome próprio.** Quem tem `/pagar` guardado não digitou errado: digitou o que a ferramenta pedia até ontem. A recusa diz isso.
2. **Valor já guardado é migrado com aviso, nunca sobrescrito calado.** A ferramenta **não sabe** qual é o domínio do dono — chutar seria escrever um destino no lugar dele. O campo fica como está, com aviso à vista.
3. **O padrão de fábrica virou vazio**, para o campo não nascer com um valor que a própria geração recusa.

### Desconto no Pix

A cobrança passou a poder ter **dois valores**: o **total** (que o PayPal cobra) e o **valor do Pix** (total menos o desconto). O valor do Pix continua morando **dentro do código Pix**, e de lugar nenhum mais. O total viaja no link, no parâmetro `t`, **coberto pelo selo**, junto do percentual `x`.

**São duas redes, não uma.** O selo pega o parâmetro editado. A **conferência da relação** — feita pela página, com a mesma `fcTotalPixSrc` que o bloco leva dentro — pega o que passar pelo selo: se o valor do Pix não for exatamente o total menos o desconto, a página recusa.

O selo ganhou uma forma parametrizada (`pSeloDeSrc(comDesc)`): os quatro parâmetros de sempre contam **sempre**, na ordem de sempre; `t` e `x` entram **depois** deles e **só quando pelo menos um dos dois vem preenchido**. Disso sai a propriedade que o bloco A abaixo mede: **link sem desconto sela exatamente como antes**.

---

## 2. Verificação

Ambiente: servidor HTTP em `localhost`, servindo lado a lado a árvore do commit `fe7876f` (branch) e a do `e608dd3` (`main`). `localStorage.clear()` e recarga antes de começar; `window.alert` neutralizado e **reinjetado após cada recarga**. Os campos são preenchidos disparando os mesmos eventos do teclado (`input`/`change`/`blur`) e os botões são os botões de verdade, clicados. Toda leitura sai do DOM. O código 1 é comparado por **SHA-256 do texto inteiro**; o link, pela string completa.

### Bloco A — os invariantes

#### Prova 1 — desconto ausente ou zero produz link e bloco idênticos aos de `main`

12 configurações, com **todos** os campos que moldam o bloco fixados explicitamente (largura, QR, três cores, coruja e altura/cores dela, os nove textos, cor do botão PayPal), para o resultado não depender do que ficou no armazenamento da rodada anterior.

| # | Configuração | SHA-256 do código 1 | tamanho |
|---|---|---|---|
| A1 | base, desconto vazio | `384450c8…cefabaf6` | 17184 |
| A2 | base, desconto `0` | `384450c8…cefabaf6` | 17184 |
| A3 | com identificador | `384450c8…cefabaf6` | 17184 |
| A4 | com validade | `384450c8…cefabaf6` | 17184 |
| A5 | PayPal por link | `384450c8…cefabaf6` | 17184 |
| A6 | sem PayPal | `995b971c…609cd8f0` | 14278 |
| A7 | sem WhatsApp | `e1bb6732…d2e8946a` | 16610 |
| A8 | acentos, símbolos e valor grande | `384450c8…cefabaf6` | 17184 |
| A9 | sem PayPal e sem WhatsApp | `40668e46…e581c6d7` | 13704 |
| A10 | aparência e textos mexidos | `6a5d44d0…dead8e04` | 17233 |
| A11 | sem coruja, valor mínimo | `3fc67979…b33ecd96` | 16343 |
| A12 | desconto só com espaços | `384450c8…cefabaf6` | 17184 |

**Resultado: as 12 batem byte a byte com `main`** — os 12 SHA-256 e os 12 links completos. Nenhuma advertência em nenhum dos lados.

Vale registrar o **falso positivo** que apareceu no caminho: numa primeira passagem, A9 divergiu (49 bytes). Não era vazamento da rodada — era o arnês. Como a aba restaura o estado do armazenamento e `localhost` é a **mesma origem** para as duas árvores, a configuração de aparência que uma passagem deixou salva entrou na seguinte. Corrigido fixando todos os campos do bloco em cada configuração, A9 passou a bater. **A comparação só vale com o estado inteiro sob controle.**

#### Prova 2 — a `/cobrar` gera o mesmo link da aba

13 combinações, 6 sem desconto e 7 com, mais 5 recusas. O bloco publicado é configurado na aba; a `/cobrar` lê o mesmo armazenamento.

Sem desconto (`p.descpix = 0`): a `/cobrar` **esconde o campo** e mostra a nota explicando que a página publicada não sabe conferir a conta. As 6 combinações — simples, com identificador, com validade, com acentos e símbolos, valor mínimo, desconto vazio — saíram **idênticas** nas duas páginas.

Com desconto (`p.descpix = 10`): o campo aparece, já preenchido com o percentual do bloco. As 7 combinações saíram idênticas:

| # | Total / desconto | Valor no Pix | Parâmetros novos | Selo |
|---|---|---|---|---|
| D1 | 450,00 / 10% | 405.00 | `t=450.00&x=10` | `45A8` |
| D2 | 450,00 / 5,5% | 425.25 | `t=450.00&x=5.5` | `94CE` |
| D3 | 1.234,56 / 12,5% | 1080.24 | `t=1234.56&x=12.5` | `3078` |
| D4 | 0,10 / 90% | 0.01 | `t=0.10&x=90` | `8B63` |
| D5 | 450,00 / 90% | 45.00 | `t=450.00&x=90` | `04D3` |
| D6 | 333,33 / 33% | 223.33 | `t=333.33&x=33` | `0AB8` |
| D7 | 450,00 / 100% → 90% | 45.00 | `t=450.00&x=90` | `A3DA` |

**D7 é o caso do campo que se corrige na tela:** digitado 100, o campo passou a mostrar **90** nas duas páginas, e o link saiu com 90. O número que o operador lê é o número que foi mandado.

As 5 recusas saíram **com as mesmas palavras** nas duas páginas — descrição vazia, valor zero, valor ilegível, validade vencida, e o desconto que derruba o Pix abaixo de um centavo:

> O desconto de 90% derruba o valor do Pix para menos de um centavo (o total e R$ 0,01). O Pix cobra em centavos, entao o minimo e R$ 0,01: escolha um desconto menor ou um valor maior.

A diferença entre as duas é só o **meio**: a aba usa `alert()`, a `/cobrar` escreve na caixa de recusa. O texto é o mesmo, porque vem da mesma `pRecusaCobranca`.
