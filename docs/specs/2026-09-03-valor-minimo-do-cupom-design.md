# Valor minimo do pedido para o cupom valer

Pedido do dono em 03/09/2026: *"nos construtores que tem cupom de desconto, queria criar
mais uma regra de desconto a partir de um determinado valor. O cupom so conseguira ser
aplicado se no total do pedido atingir um valor que eu configure no cupom."*

## Onde incide

Medido: **tres abas** tem cupom, e as tres declaram o mesmo formato
(`{codigo, tipo, valor, validade}`) no molde do "Exportar tudo":

| Aba | Prefixo | Molde |
|---|---|---|
| Checkout | `u` | `['u.cps',{codigo,tipo,valor,validade},'codigo']` |
| Mini loja | `m` | `['m.cps',…]` |
| Agendamento por pacote | `a` | `['a.cps',…]` |

A validacao de validade ja e **fonte unica** (`FC_CARRINHO_SRC.cupomVigente`), consumida
pelas tres. O minimo entra no mesmo lugar, pelo mesmo motivo: tres copias divergem.

## As decisoes, e por que

### D1 — o minimo compara com o SUBTOTAL, antes do proprio cupom e antes do desconto Pix

Comparar com o total **depois** do desconto seria circular: aplicar o cupom baixaria o total,
que cairia abaixo do minimo, que tiraria o cupom, que subiria o total de novo. Nao existe
resposta estavel para isso, e a implementacao ficaria dependendo da ordem em que as contas
rodam — que e defeito silencioso do tipo que este projeto ja mediu.

O desconto do Pix tambem fica de fora, por outra razao: ele depende da forma de pagamento
que o cliente escolhe **depois**, entao o mesmo carrinho valeria ou nao valeria o cupom
conforme o botao clicado. O minimo e uma regra sobre o **pedido**, nao sobre a forma de pagar.

O mesmo vale para o **sinal**: o minimo olha o valor do pedido, nao o valor cobrado agora.

### D2 — o cupom CAI SOZINHO quando o carrinho desce abaixo do minimo

Esta e a parte que faz a funcionalidade valer, e a que custa dinheiro se for esquecida.

Hoje `aplicarCupom()` so roda quando o cliente clica no botao. Se a conferencia do minimo
acontecesse so ali, o caminho seria: cliente monta R$ 350, aplica o cupom de minimo R$ 300,
**tira um item**, fica em R$ 200 — e o desconto continua aplicado, porque ninguem reconferiu.
O dono pagaria o desconto de uma regra que o pedido nao cumpre mais, sem erro na tela.

Entao a conferencia entra tambem no recalculo (`atualizar()`), e quando o pedido desce abaixo
do minimo o cupom e **removido**, com mensagem visivel dizendo por que. Nunca em silencio:
desconto que some sem explicacao e o cliente achando que o site errou.

### D3 — minimo vazio ou zero = SEM minimo

Cupom ja cadastrado nao tem o campo. Ele continua valendo como sempre valeu, e a saida dos
geradores com cupom sem minimo sai **byte a byte identica** — e a regressao prova isso.

### D4 — a recusa e configuravel, e diz o valor que falta atingir

Texto novo em `FC_TXT_FABRICA`, um campo por aba, no molde da rodada de 03/09. Padrao de
fabrica com marcador:

> `Este cupom vale a partir de {valor}.`

`{valor}` e trocado pelo minimo, ja formatado na moeda da aba. Sem o marcador, o texto sai
como o dono escreveu — a mesma regra dos outros 162.

**Duas mensagens, nao uma**, porque sao dois fatos diferentes e o cliente esta em momentos
diferentes: uma para a recusa ao aplicar ("nao deu para aplicar"), outra para a queda
automatica ("o cupom saiu porque o pedido mudou").

### D5 — o campo na aba

Entra no cadastro de cupom das tres abas, ao lado da validade, e aparece na **lista** de
cupons cadastrados — porque cupom cadastrado que nao mostra a propria regra e cupom que o
dono aplica errado. Campo numerico, em moeda, vazio = sem minimo.

### D6 — moldes acompanham

`['*.cps',{codigo,tipo,valor,validade,**minimo**},'codigo']` nas tres abas, senao o "Exportar
tudo" novo perde o minimo caladamente. O `guarda` do preset ja diz "cupons"; nao muda.

## O que a regressao deve mostrar

**Nao pode mudar:** nada, na passagem de fabrica — o cenario cadastra cupom **sem** minimo,
e cupom sem minimo tem de sair identico. Os 9 links de cobranca tambem nao mudam (a aba
`cob` nao tem cupom).

**Muda de proposito:** so quando o cenario passar a cadastrar um cupom **com** minimo — e
isso e a segunda etapa, feita depois de a primeira provar o invariante. A passagem
configurada ganha o texto novo.

## O que precisa ser provado com o bloco RODANDO

Fotografia nao pega comportamento. Exigir:

1. Cupom com minimo **aplicado acima do minimo**: desconto entra.
2. Cupom com minimo **recusado abaixo**: mensagem certa, com o valor.
3. **A queda automatica (D2)**: aplicar acima, tirar item, ficar abaixo — o desconto sai, a
   mensagem aparece, e o total volta ao valor sem desconto.
4. **Voltar a subir**: recolocar o item NAO reaplica o cupom sozinho (o cliente aplica de
   novo) — ou reaplica, se for essa a decisao; o que nao pode e ficar indefinido.
5. Cupom **sem** minimo: comportamento de hoje, intacto.

O item 4 e decisao: **escolhido NAO reaplicar sozinho.** Cupom que volta sozinho depois de
ter caido e magica que o cliente nao pediu, e esconde do dono que a regra chegou a falhar.
