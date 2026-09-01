# A validade do cupom aparece na linha do desconto — design

**Data:** 01/09/2026
**Estado:** implementado
**Alcance:** os dois construtores que têm cupom — **Checkout** (`u-`) e **Mini loja** (`m-`)

---

## 1. O pedido

O dono: *"ao aplicar o cupom, aparecesse a mensagem de até quando ele é válido. Talvez o melhor local seja na linha que aparece 'Desconto (CUPOM)', com um texto adicional 'Válido até: dd/mm/aa'. Se um cupom não tiver validade, não deve ser apresentado esse texto adicional."*

O prazo já existia: o cadastro de cupom tem campo de validade desde a criação da aba, ele viaja para dentro do bloco (`CUPONS[i].validade`) e `cupomVigente()` já recusa cupom vencido. O que faltava era **contar ao cliente** o prazo do cupom que ele acabou de aplicar. Antes disso o prazo só se manifestava no dia em que deixava de funcionar.

## 2. Onde exatamente, e por que ali

**Dois construtores, não três.** Só Checkout e Mini loja têm cupom. O Link de cobrança tem validade da *cobrança*, que é outra coisa e já aparece na página de pagamento.

**A linha do desconto tem DOIS filhos, e continua tendo.** A linha é `display:flex` com `justify-content:space-between`: rótulo à esquerda, valor à direita. Pendurar a validade como **terceiro** filho a jogaria para o meio da linha, longe do cupom a que se refere e colada no valor. Então o rótulo e a validade passaram a viver juntos numa célula da esquerda (`.fcu-desconto-e` / `.fcm-desconto-e`), e a célula da direita não mudou.

A validade sai menor e mais leve que o rótulo, com `white-space:nowrap` — em tela estreita ela desce inteira para a linha de baixo, em vez de partir "Valido" de "ate 25/12/27".

**Continua tudo por `textContent`.** O código do cupom e a data nunca passam por `innerHTML`, então não há porta nova para texto hostil.

## 3. A decisão que evita repetir um erro já pago

A peça nova é emitida **sempre que o bloco tem cupons** — não "quando algum cupom tiver data no momento de gerar".

Amarrar a um estado do momento da geração seria repetir exatamente o defeito que custou uma rodada em 22/08/2026: a matemática do desconto do Pix só entrava no bloco se o desconto estivesse ligado na hora de gerar, e o dono não podia mais ligá-lo editando o bloco publicado. **A lista `CUPONS` fica dentro do bloco e é editável ali** — acrescentar uma data a um cupom já publicado tem de funcionar sem regerar.

O custo dessa escolha é 141 bytes por bloco. O custo da outra escolha seria um campo que o dono preenche e que não faz nada.

## 4. A data escrita para a tela NÃO usa `Date`

`validadeBr(v)` recorta a data por posição: `AAAA-MM-DD` vira `DD/MM/AA`.

**Usar `Date` aqui seria um defeito silencioso e diário.** `new Date('2026-12-25')` é meia-noite **UTC**, que no fuso de Brasília ainda é dia 24 — o cupom apareceria vencendo um dia antes do que o dono cadastrou, todos os dias, sem erro nenhum na tela. É a mesma armadilha que já apareceu na prévia do link de cobrança.

`cupomVigente()`, logo acima dela na mesma fonte, **precisa** de `Date`, porque compara com o agora. Escrever a data não precisa.

**A conferência do formato não é paranoia.** Como a lista `CUPONS` é editável dentro do bloco publicado, uma data fora de `AAAA-MM-DD` é possível. Nesse caso `validadeBr` devolve vazio e a linha simplesmente não aparece — em vez de imprimir pedaços de um texto qualquer ao lado do desconto.

## 5. O que mudou no código

**Fonte única** (`FC_CARRINHO_SRC`, ao lado de `cupomVigente`): `validadeBr` — 4 linhas, 141 bytes, idêntica nos dois blocos. Unifica-se a fonte que escreve; cada bloco continua levando a própria cópia dentro de si.

Em cada um dos dois geradores:

1. **Duas regras de CSS** para o pedaço novo (`-p`), escondido por padrão.
2. **Um filho a mais no HTML** da linha do desconto — a célula da esquerda (`-e`) embrulhando rótulo e validade.
3. **`var TXT_CUPOM_VALIDADE='Valido ate:'`**, junto dos outros textos customizáveis do bloco. Sem acento, como todo o resto do bloco entregue (item 10 do manual do Prosite).
4. **Três linhas em `linhaDesconto()`**: lê a validade do cupom ativo, escreve, e liga ou desliga o pedaço.
5. **`c+=FC_CARRINHO_SRC.validadeBr;`** ao lado de `cupomVigente`.

## 6. O que NÃO mudou, de propósito

- **O resumo copiável.** Ele existe para o dono conferir um pedido já feito; o prazo do cupom não tem função ali.
- **A recusa do cupom vencido.** Continua igual: "Cupom expirado.", e a linha do desconto nem aparece.
- **A lista de cupons da aba.** O campo de validade já estava lá, visível e editável por cupom.
- **A `/cobrar` e o Link de cobrança.** Não têm cupom.

## 7. O que foi medido

**Regressão byte a byte contra a `main`** (`scripts/verificar/regressao.sh`): **2 divergências, as duas intencionais** — `u-out` (Checkout, +675 bytes) e `m-out` (Mini loja, +663 bytes). As outras **19 saídas** e as **9 cobranças** (link e bloco de cada uma) saíram idênticas.

**O cenário da regressão ganhou cupons — e isso fechou um buraco real.** Na primeira execução a Mini loja saiu **idêntica**, porque o roteiro nunca cadastrava cupom e na loja o campo de cupom só existe quando há cupom (`usaCupom = cfg.cps.length > 0`). Ou seja: **todo o caminho do cupom da loja estava fora da fotografia**, e uma mudança nele acabara de passar pela regressão sem ser exercitada. `geradores.mjs` passou a cadastrar dois cupons por aba — um **com** prazo e um **sem**, porque a linha se comporta diferente nos dois casos. É a mesma armadilha que o arquivo já registrava para `t-out4`/`t-out5`.

**Os dois blocos executados de verdade**, cada um numa página que imita o Prosite (molde `scripts/verificar/pagina.mjs`, rede externa bloqueada), com três cupons cadastrados — um com prazo, um sem, um vencido. **22 verificações, 22 ok:**

| | Checkout | Mini loja |
|---|---|---|
| Cupom **com** prazo → rótulo | `Desconto (NATAL10)` | `Desconto (NATAL10)` |
| Cupom **com** prazo → texto novo | `Valido ate: 25/12/27`, visível | `Valido ate: 25/12/27`, visível |
| Cupom **com** prazo → valor | `- R$ 42,00` (inalterado) | inalterado |
| Cupom **sem** prazo | texto vazio e escondido | texto vazio e escondido |
| Cupom **vencido** | `Cupom expirado.`, linha some | `Cupom expirado.`, linha some |
| Erro de console | nenhum | nenhum |

`validadeBr` também foi executada isolada contra 10 entradas: as três datas válidas, vazio, `undefined`, `null`, `2026-12`, `abcd-ef-gh`, `2026-12-25T00:00` e `26-12-25`. As sete inválidas devolvem vazio.

**Um defeito meu, pego pela regressão.** A primeira versão abria a string com aspas duplas e fechava com aspas simples. A ferramenta inteira parou de carregar, e a regressão o denunciou do jeito mais claro possível: **as 21 saídas em zero byte**, com `Invalid or unexpected token` no console. Vale o registro porque é o argumento a favor da regressão rodar antes de qualquer conferência visual — na tela, uma ferramenta que não carrega e uma ferramenta que carrega errado são parecidas demais.

## 8. Tempo

Estimado no início: 45min – 1h15. Real: **~50 min**, incluindo a correção da aspa, o buraco do cenário da loja e esta spec.
