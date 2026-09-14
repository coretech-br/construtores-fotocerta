# SKU por item no relatório do PayPal

Pedido do dono em 13/09/2026, olhando a prévia que a leva 3 criou: *"em `items[].sku` está indo o
código do produto, pois não temos código para cada item opcional. Isso é ruim para identificar. O
ideal é que cada produto tenha seu próprio SKU e cada item opcional também."*

**Ele está certo, e o defeito é pior do que "faltar":** hoje **todas as linhas levam o mesmo
valor** — `CODIGO_PEDIDO`. A coluna "ID do produto" do relatório fica com o mesmo texto em todas as
linhas, que é o oposto do que o campo serve. Não é ausência de informação: é informação que não
distingue nada, com cara de que distingue.

## O que existe hoje, medido

| Lista | Campos | Código? |
|---|---|---|
| `u.prods` | nome, desc, preço, opsel, opnenhum, qtd, ops[] | **não** |
| `m.prods` | idem + cat, img | **não** |
| `a.pacotes` | **cod**, nome, dur, preço, inclui, cal, path, link, fam, ops[] | **sim** (é o código do TidyCal) |
| `ops[]` nas três | nome, desc, preço, qtd | **não** |

**SEIS campos novos:** SKU de produto em `u`, `m` e `a` (o pacote), e SKU de opcional nas três.

**O pacote NÃO reaproveita o `cod` que já tem** — decisão do dono, e ela vem da distinção que ele
mesmo fez: *"Código do pedido é uma coisa... SKU de produto e o SKU para cada um dos itens
opcionais é outra."* Pela mesma régua, o `cod` do pacote é o **identificador do agendamento no
TidyCal**, não o SKU do produto vendido. Hoje eles coincidem; no dia em que precisarem divergir,
reaproveitar teria sido uma porta fechada — e o dono só descobriria nesse dia.

**A opção "se vazio, herda o código do TidyCal" foi oferecida e recusada**, pelo motivo certo: cria
confluência silenciosa. Olhando o relatório, não dá para saber se aquele valor foi escolhido como
SKU ou herdado — que é exatamente a família do defeito que ele acabou de achar (uma coluna com cara
de identificar, preenchida por outra coisa).

## As quatro decisões, tomadas por delegação e declaradas

**1. SKU vazio → a linha sai SEM `sku`.** Não volta para o código do pedido. O `sku` é opcional na
especificação do PayPal, e o fallback de hoje **é o defeito relatado**: preencher todas as linhas
com o mesmo valor. Omitir é honesto; repetir é mentir com cara de dado.

**2. `custom_id` continua sendo o código do pedido.** São campos com papéis diferentes — o
`custom_id` é do pedido (conciliação), o `sku` é da linha (identificação do item). A prévia já
explica isso ao dono nessas palavras.

**3. SKU repetido dentro da mesma aba → a ferramenta RECUSA gerar.** Mesma família do código de
pacote repetido e do cupom repetido, que este projeto já recusa. SKU que se repete não identifica —
e um relatório com duas linhas dizendo `ALB20` para coisas diferentes é pior que duas sem SKU.
A recusa nomeia os dois itens em conflito.

**4. Regra de caractere: aparar as pontas e cortar em 127.** O `sku` **não entra no payload do
Pix**, então não herda a regra estreita do `txid` (só letras e números) — cortar `ALB-20x30` para
`ALB20x30` atrapalharia a conciliação do dono em vez de ajudar. O limite é o da especificação do
PayPal, e o contador à vista, como nos outros campos com teto.

## O que isso NÃO é

Não muda o valor cobrado, não entra no código Pix, não toca o selo nem o link. É acréscimo de campo:
**backup antigo abre e os itens antigos ficam com o SKU vazio** — e, pela decisão 1, saem sem `sku`,
que é exatamente o que acontece hoje de útil (hoje sai um valor inútil; passa a sair nenhum).

## Provas obrigatórias

1. `regressao.sh` com os campos **vazios** → **zero divergência**? **Não.** Hoje o bloco emite
   `it.sku=CODIGO_PEDIDO` sempre; com a decisão 1, some. **Uma divergência esperada por aba de
   catálogo** — enumerar e explicar. Se algum **link** mudar, parar.
2. Cada linha do pedido leva **o seu** SKU, lido do `createOrder` do próprio bloco.
3. Produto sem SKU e opcional sem SKU saem **sem o campo**, não com o código do pedido.
4. SKU repetido recusa, nomeando os dois itens; SKU único gera.
5. A **prévia** mostra o SKU por linha — e a explicação em cinza deixa de dizer "igual em todas as
   linhas".
6. **Duplicar** produto, pacote e opcional leva o SKU junto (`fcOpCopia` e as listas).
7. Backup antigo abre com o campo vazio, sem perder nada.
8. Texto hostil no SKU, com o bloco executando.
