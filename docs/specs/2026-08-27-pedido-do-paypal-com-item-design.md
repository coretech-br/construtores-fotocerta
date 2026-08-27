# O pedido que chega ao painel do PayPal

**Data:** 27/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` — os **três** geradores que falam com o PayPal: Link de cobrança, Checkout e Mini loja
**Pedido do dono:** *"o ideal seria preencher o ID do produto e a descrição nesses campos, que já temos na tela"* — e, em seguida: *"essa alteração deve ser feita nos outros construtores que usam o PayPal também"*

---

## 1. O que ele viu

No painel do PayPal, a tabela **Detalhes do pedido** mostrava:

| ID do produto | Nome do produto | Quantidade | Preço |
|---|---|---|---|
| – | Pagamento | 1 | R$ 10,00 |

Medido no código: os três blocos mandavam **valor e descrição**, e nenhum mandava `items`. Sem `items`, o PayPal preenche a linha com um rótulo genérico e deixa o ID vazio — não havia como conciliar um pagamento com a cobrança que o gerou.

O identificador da aba de cobrança, aliás, ia para **três** lugares — o código Pix, o texto da página e a mensagem do WhatsApp — e para o PayPal, nenhum. A ajuda do campo prometia "ajuda a conciliar no extrato": para o Pix cumpria, para o PayPal não, e não avisava.

## 2. O que passou a ir

Um **item de verdade** no pedido, com os campos lidos da especificação OpenAPI do PayPal (`checkout_orders_v2`), e não de memória:

| campo | o que preenche | limite |
|---|---|---|
| `items[].name` | a coluna **Nome do produto** — obrigatório | 127 |
| `items[].sku` | a coluna **ID do produto** | 127 |
| `items[].quantity` | sempre `"1"` | — |
| `items[].unit_amount` | o valor cobrado | — |
| `custom_id` | *"Used to reconcile client transactions with PayPal transactions. Appears in transaction and settlement reports but is not visible to the payer."* | 255 |

## 3. A armadilha, que recusa o pedido inteiro

A especificação é taxativa:

> "If you specify `amount.breakdown`, the amount equals `item_total` plus `tax_total` plus `shipping` plus `handling` plus `insurance` minus `shipping_discount` minus discount."

Ou seja: **com `items`, o `item_total` tem de bater com o total, ao centavo.** Um centavo fora e o pedido **não é criado** — o cliente fica sem meio de pagamento na hora de pagar.

Por isso o valor é calculado **uma vez**, numa variável, e usado nos três lugares (total, `item_total`, `unit_amount`). Dois `toFixed` em separado poderiam divergir.

## 4. Um item só, e não o carrinho itemizado

No Checkout e na Mini loja o valor cobrado **nem sempre é a soma dos produtos**: existe **sinal** (cobra uma parte) e existe **cupom** (desconta). Itemizar de verdade obrigaria a montar `breakdown.discount` e fechar a conta ao centavo em todas as combinações — e o preço do erro é o pedido não ser criado.

Com **um item igual ao valor cobrado**, a conta fecha por construção. O nome do item é a mesma descrição que esses blocos já montavam (com o código do pedido e o cupom dentro), e o carrinho detalhado continua no resumo copiável e no Pix.

## 5. O `invoice_id` ficou de fora, de propósito

A especificação diz que ele *"Appears in both the payer's transaction history and the emails that the payer receives"* — o que seria bom. Mas diz também:

> "invoice_id values are required to be unique within each merchant account by default."

Numa página de cobrança e numa loja, isso viraria **recusa na segunda vez** que o mesmo identificador fosse cobrado. É uma decisão do dono, não deste bloco. Fica registrado como opção.

## 6. Verificação

O `createOrder` dos **três** blocos foi exercitado **sem tocar no PayPal**: o script do SDK é interceptado no `appendChild` e um `paypal.Buttons` de mentira chama o `createOrder` com um `actions.order.create` que apenas devolve o objeto — a mesma técnica que a prévia do Checkout já usava.

Medido, com carrinho de verdade:

| bloco | valor | nome do produto | ID do produto | conta fecha? |
|---|---|---|---|---|
| Link de cobrança | 8400.00 | Ensaio de Natal - pacote completo | ENSAIO2026 | sim |
| Checkout | 420.00 | Ensaio de Natal (cod: PEDIDO) | PEDIDO | sim |
| Mini loja | 890.00 | Album 30x30 (cod: LOJA-…) | LOJA-… | sim |

**Regressão:** 12 divergências, **todas** nos três geradores que falam com o PayPal (`u-out`, `p-out1`, `m-out` e os nove cenários de cobrança). Intencionais. E o que mais importa: **nenhum link mudou** — zero divergências nos links das nove cobranças, ou seja, o selo continua fechando.

**As prévias** do Checkout e da Mini loja continuam lendo o pedido: a sonda mostra "valor que iria na ordem: 420.00 BRL".

## 7. Dois erros meus, registrados

1. **`var it` dentro do objeto do pedido.** A primeira edição inseriu a declaração da variável no meio do literal do `purchase_unit`, e o bloco quebrou com `SyntaxError`. Pego pelo roteiro, que executa o bloco de verdade — não por leitura.
2. **Um roteiro que passou sobre nada.** A primeira versão da verificação do Checkout e da Mini loja não conseguiu gerar os blocos (as abas precisavam de produto cadastrado), **pulou os dois** e imprimiu "OK" — porque a lista de conferências ficou vazia. Corrigido: bloco ausente agora é **falha**, e o preparo passou a usar a mesma captura do arnês, que preenche as abas.
