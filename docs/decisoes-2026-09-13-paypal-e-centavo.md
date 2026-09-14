# Decisões tomadas por delegação do dono — 13/09/2026, noite

Autorização: *"Se precisar de alguma decisão, decida e documente, como fizemos ontem."*

## 1. O centavo do desconto — CONSERTAR (decisão dele)

Medido por mim, de forma independente, em **4.999.010** combinações de subtotal × percentual:
**37.905 divergem (0,758%)**, e em **todas** o cliente paga **a mais**. Em nenhuma paga a menos.
Não é ruído: é viés sistemático contra o cliente.

A causa: `descontoAtual()` faz `s*cupomAtivo.valor/100` em ponto flutuante. Com subtotal 10,35 e
cupom de 10%, o exato é 1,035 → 1,04; o binário guarda 1,0349999… → 1,03. Desconto um centavo
menor, total um centavo maior.

**O que NÃO era:** incoerência entre tela e cobrança. Tela, Pix e PayPal mostram e cobram o mesmo
número — só que esse número está alto. Ninguém é enganado; a conta é que erra, igual nos três.

**Correção ao relatório do executor:** o exemplo que ele deu (163,30 com 25%) **não reproduz** —
conferido. O defeito existe, mas não naquele caso.

## 2. Item de R$ 0,00 fora da itemização do PayPal — ACEITO (decisão dele)

A spec do PayPal **permite** `unit_amount` "0.00" (o único limite escrito é "can not be a negative
number"), mas a lista de erros 422 traz `CANNOT_BE_ZERO_OR_NEGATIVE` **sem dizer a que campos se
aplica**. Não há como medir sem um pedido real.

Apostar em comportamento não documentado custaria o **pedido inteiro recusado** — o cliente sem
botão para pagar. Deixar de fora não muda centavo nenhum: só não aparece a linha de R$ 0,00 no
relatório. Reverter é apagar um `continue`.

## 3. Ordem de publicação — decidida por mim

Leva 3 publicada **antes** do conserto do centavo, em versões separadas, mesmo que as duas estejam
prontas. Motivo: as duas mudam as mesmas saídas (`u-out`, `m-out`, `a-out3`), e juntas produziriam
uma lista de divergências em que "isso deve ser da outra mudança" vira explicação plausível para
qualquer coisa. Separadas, cada lista é curta e cada linha tem um dono.

## 4. `description` da ordem do PayPal continua divergente — registrado, não mexido

Checkout e Mini loja listam só produtos na `description`; o Agendamento lista pacote + opcionais.
Não foi pedido e não afeta a conta. Entra na leva 4 como item de unificação, não como defeito.
