# A mensagem do WhatsApp acentuada, e a frase da loja com uma fonte só — design

**Data:** 01/09/2026
**Estado:** implementado
**Alcance:** Captação de leads, Checkout, Mini loja e Link de cobrança

---

## 1. Os dois pedidos

O dono, depois da rodada de acentuação: *"Pode corrigir a mini loja também e unificar. Sobre a mensagem do WhatsApp que ficou sem acento 'Ola! Acabei de pagar via Pix.', também podemos corrigir se não for causar algum problema."*

São duas coisas independentes, e a segunda vinha com uma condição — *se não for causar algum problema* — que exigia medir antes de mudar.

## 2. A mensagem do WhatsApp: por que era sem acento, e por que pode deixar de ser

A convenção estava registrada desde a primeira rodada da aba Leads, mas **registrada sem a razão**: a documentação dizia "com o acento removido de propósito" e não dizia de que propósito se tratava. Decisão sem motivo escrito é decisão que ninguém consegue revisar — só repetir.

Os riscos possíveis, e o que a medição disse de cada um:

| Risco levantado | Medida |
|---|---|
| A URL do `wa.me` não aceitar acento | **Não se aplica.** `encodeURIComponent` transforma `á` em `%C3%A1`: a URL sai **100 % ASCII**, e decodificar devolve o texto idêntico. Medido no `href` gerado pelo bloco em execução. |
| A URL ficar longa demais | Medido: **154 caracteres** para uma mensagem de 68, já com `Álbum`, `—` e `família` dentro. Longe de qualquer limite. |
| A página do Prosite servir o bloco com outra codificação | **Já estava exercitado.** A mensagem da cobrança sempre carregou a **descrição digitada pelo dono**, que é texto livre e pode ter acento desde sempre; e a mensagem do pop-up de leads carrega o **nome e o recado do visitante**. O caminho acentuado é o caminho normal desde que a aba existe — o que estava sem acento eram só as quatro palavras fixas ao redor. |

Ou seja: não havia problema a evitar. Havia uma frase escrita errado no meio de um texto que sempre teve acento no resto.

**O que mudou:** `Olá Foto Certa`, `meu nome é`, `Estava olhando a página`, `Tenho um pedido para você` (os quatro trechos editáveis da aba Leads), `Olá! Acabei de pagar via Pix.` e `Olá! Acabei de pagar o SINAL via Pix.` (Checkout e Mini loja), e `Olá! Acabei de pagar:` (Link de cobrança).

**Com isso a fronteira da acentuação fica com duas faixas, e não três** — texto que uma pessoa lê leva acento, código não leva. A faixa do meio deixou de existir, e as notas da ferramenta que a descreviam foram reescritas.

## 3. A Mini loja: uma frase, uma fonte

`Escolha ao menos um item: o pedido está em zero.` estava escrita **três vezes**: uma como `TXT_TOTAL_ZERO` e duas cruas, dentro de dois `alert()` do caminho Pix. As três concordavam — e era por isso que o defeito era invisível. Ele apareceria no dia em que o dono trocasse `TXT_TOTAL_ZERO` no bloco publicado e dois avisos continuassem com o texto antigo, sem erro nenhum.

**O que impedia a unificação, e como foi resolvido.** `TXT_TOTAL_ZERO` só era emitido dentro de `if(usaPP)`. Usá-lo no caminho Pix sem mais nada produziria, em "somente Pix", uma referência a variável não declarada — que é **exatamente** o defeito que já matou esta aba uma vez (`MOEDA is not defined`: vitrine sem produtos, sem aviso, e a regressão de texto não enxergava porque o bloco nem chegava a executar).

A declaração passou a sair em `usaPP || usaPix`, e os dois `alert()` passaram a usar a variável.

## 4. O que foi medido

**Regressão byte a byte contra a `main`: 13 divergências, todas intencionais** — `l-out`, `u-out`, `m-out`, `p-out1` e os **9 blocos de cobrança** (cada um carrega a mesma linha da mensagem). Inalteradas: `s-out`, `t-out1..5`, `b-out1..7`, `c-out1`, `e-out1/2` e — o que mais importa — **os 9 links de cobrança, byte a byte idênticos**. A mensagem é montada dentro do bloco, no aparelho do cliente; ela não toca o link, o selo nem o payload, e a regressão prova isso em vez de afirmar.

**O diff enumerado**, com `FC_DUMP` nos dois lados: 4 linhas em `l-out`, 1 em `u-out`, 1 em `p-out1`, 2 em `m-out`. Nenhuma outra linha, em nenhum dos quatro.

**A Mini loja executada nos três modos de pagamento** — "somente Pix", "somente PayPal" e "os dois" — **19 verificações, 19 ok**: o bloco declara `TXT_TOTAL_ZERO` nos três, a frase crua sumiu dos três, a vitrine desenha o produto nos três, e nos dois modos com Pix o carrinho vazio recusa com **exatamente** a frase da variável, lida do `alert` capturado. Sem essa bateria a unificação seria uma aposta: é justamente em "somente Pix" que o erro apareceria, e é o modo que a fotografia da regressão não cobre.

**A mensagem lida da URL de verdade**, nos dois blocos que a montam:

- **Cobrança:** `href` 100 % ASCII, e ao decodificar volta `Olá! Acabei de pagar: Álbum 30x30 — ensaio de família -- R$ 1.200,50`.
- **Leads:** pop-up preenchido como visitante (`José Antônio`, "Quero informação sobre o ensaio de família"), `window.open` interceptado, URL 100 % ASCII, e a mensagem volta inteira:

```
Olá Foto Certa, meu nome é *José Antônio*.
Estava olhando a página *…*.
Tenho um pedido para você (cod: *NATAL26*)
Quero informação sobre o ensaio de família
```

## 5. Resíduo declarado

No **Checkout**, o caminho Pix recusa o pedido zerado com uma frase **diferente** da do PayPal: `O valor do pedido precisa ser maior que zero.` contra `Escolha ao menos um item: o pedido está em zero.` Não é duplicação (são frases distintas, cada uma num lugar só), mas é incoerência: a do PayPal é customizável e a do Pix não. Uniformizar mudaria texto que o cliente lê sem o dono ter pedido — fica registrado em `docs/pendencias.md`, para ser decisão dele.

## 6. Tempo

Estimado: 30–45 min. Real: **~55 min**, com a bateria dos três modos de pagamento sendo a maior parte — e a que justificava a rodada.
