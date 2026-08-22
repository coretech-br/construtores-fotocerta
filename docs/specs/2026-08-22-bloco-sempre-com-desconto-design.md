# O bloco sempre com desconto, e o layout das duas formas de pagamento

**Data:** 22/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba Link de cobrança), `cobrar/index.html`, `fc-compartilhado.js`
**Versão do arquivo compartilhado:** `2026-08-22b` → `2026-08-22c`

---

## 1. Os três itens

### Item 1 — o bloco sempre carrega a matemática do desconto

**O defeito, como o dono o encontrou.** Ele configurou o desconto no computador; no celular o campo de desconto da `/cobrar` não apareceu — nem no Safari, nem no Chrome, nem no aplicativo instalado.

**Não era cache.** A guarda de versão teria parado a página com aviso vermelho se o arquivo compartilhado estivesse velho. Era o armazenamento, que é **por aparelho**.

**A causa de fundo.** `fcTotalPixSrc(descpix,…)` só emitia o ramo com desconto quando `descpix > 0` **na hora de gerar o bloco**, e `pSeloDeSrc(comDesc)` emitia uma `seloDe` de quatro ou de seis parâmetros pelo mesmo critério. Isso amarrava uma decisão **por cobrança** a uma configuração **do bloco** — e a `/cobrar`, que lê essa configuração do armazenamento local, escondia o campo em qualquer aparelho que não fosse aquele em que o desconto foi digitado.

**A correção.** O bloco emite **sempre** a maquinaria do desconto: a regra `.fcpg-pixlinha`, o `TXT_PIX_ROTULO`, o par `TOTAL_COBRADO`/`DESCONTO_PIX`, a `totalPix`, a conferência 4b da relação e a `seloDe` de seis. Quem manda em cada cobrança é o par `t`/`x` do endereço — ausente ou zero = sem desconto, como sempre.

Três consequências:

1. **O campo aparece sempre na `/cobrar`**, em qualquer aparelho — some uma classe inteira de "num aparelho aparece, no outro não".
2. **Trocar o desconto deixou de mexer no código 1.** Por isso `descpix` entrou na lista `naoEmite` do registro `ABAS`: deixá-lo fora faria o painel consolidado anunciar "o código é mais velho que a aba" sobre um código 1 byte a byte idêntico — o mesmo aviso falso que custou a correção do `p-url`.
3. **A parametrização do selo saiu.** `pSeloDeSrc()`, `pSeloSrc()` e `pSeloApi()` não recebem mais `comDesc`, e `pSeloFns` (duas caixas) virou `pSeloFn` (uma). Não é enfeite: o comentário do arquivo declarava que *"o texto avaliado é sempre o que o bloco daquela configuração leva dentro"*, e manter a forma de quatro na ferramenta enquanto o bloco leva a de seis tornaria essa frase falsa. A propriedade que a parametrização parecia proteger — link sem desconto sela exatamente como antes — **nunca dependeu dela**: quem decide contar `t` e `x` é um `if` de tempo de execução dentro da própria `seloDe`.

**O invariante obrigatório, e como ele foi provado.** O link sem desconto continua byte a byte idêntico — 14 cobranças e 12 variações de bloco comparadas caractere por caractere com a `main`, todas iguais (§2).

**Cinco apelidos mortos saíram junto.** `pDescPct` deixou de ser chamado na ferramenta quando o bloco passou a emitir a maquinaria sempre; `fcPixDesc`, `pValorPix`, `pTotCod` e `pDescCod` **já eram** importados sem uso — os quatro só são chamados dentro do arquivo compartilhado. Apelido que ninguém chama não documenta a dependência, só parece documentar. A remoção não muda um byte de nenhuma saída, e isso foi medido.

### Item 2 — o "Já paguei" mudou de lugar

Ele ficava **no fim da página, depois da seção do PayPal**. É um botão **exclusivo do Pix**: quem paga por PayPal recebe notificação e recibo do próprio PayPal. No fim da página ele parecia o último passo de um caminho único.

Agora ele fica **dentro da seção do Pix, logo depois da orientação** (*"Abra o aplicativo do seu banco…"*), que é onde ele faz sentido para quem acabou de copiar o código.

**Como, sem duplicar a mensagem.** `zap(c,…)`, que montava a seção inteira, virou `zapBotao(valor,desc,txid)`, que devolve **só o botão**. Quem o coloca é quem chama: `pix()` na página normal, e `vencido()` num bloco próprio — ali não existe seção do Pix para ele morar dentro. Uma função só para os dois lugares; se ela montasse a seção, o caminho vencido precisaria de uma segunda montagem da mensagem que o dono lê no WhatsApp.

`pix()` passou a receber `valor`, `desc` e `txid` — e **só quando o bloco tem WhatsApp**: sem ele, a assinatura e a chamada saem sem os três, porque o bloco entregue continua carregando apenas a maquinaria escolhida.

### Item 3 — o "OU" entre as duas formas

O layout não dizia que Pix e PayPal são **alternativos**; pareciam etapas. Entrou um separador `OU` entre as duas seções, com o **mesmo desenho** que o Checkout e a Mini loja já usam entre as duas formas de pagamento (`.fcu-sep` / `.fcm-sep`): flex com uma linha de cada lado, feita por `:before`/`:after`.

Duas decisões:

- **O separador entra depois da recusa `modo==='nao'`.** Numa cobrança sem PayPal não existe segunda forma de pagamento, e um "OU" solto embaixo do Pix prometeria uma que não vem. Medido nos dois casos.
- **`.fcpg-semtopo` desliga a linha de cima do `.fcpg-bloco` do PayPal.** Sem isso o cliente veria duas linhas horizontais coladas — a do separador e a do bloco. As duas regras têm a mesma especificidade, então **a ordem em que saem no CSS importa**, e está declarada no comentário do gerador.

O texto é fixo (`TXT_OU='OU'`), declarado na seção de configuração do bloco ao lado dos outros textos fixos, e emitido só quando o bloco tem PayPal.

---

## 2. Verificação

Ambiente: as duas árvores (`main` em `1582345` e esta) servidas por HTTP em portas separadas de `localhost`, `localStorage.clear()` **e** recarga antes de cada configuração, `window.alert` neutralizado e reinjetado a cada carga, campos preenchidos disparando `input`/`change`/`blur` e botões clicados de verdade. Toda leitura sai do DOM. O código 1 é comparado por SHA-256 do texto inteiro; o link, pela string completa.

### Bloco A — o invariante do link, e a regressão dos oito geradores

As oito abas foram preenchidas com o mínimo para **nenhuma recusar** (três imagens no slideshow, código de página, caminho do booking type, dois produtos no Checkout e dois na Mini loja com foto, código de campanha) — sem isso metade das saídas sairia vazia e a regressão não provaria nada. Todos os campos que moldam o bloco da aba de cobrança foram fixados explicitamente, pelo motivo registrado na spec anterior: a comparação só vale com o estado inteiro sob controle.

| O quê | Resultado |
|---|---|
| **11 saídas dos outros sete geradores** (`s-out`, `l-out`, `t-out1/2/3`, `u-out`, `b-out1/2`, `c-out1`, `m-out`) + `t-out1` no modo direto | **byte a byte idênticas** à `main` |
| **O link (`p-out2`) de 14 cobranças** — sem desconto, com identificador, com validade, PayPal por link, sem PayPal, acentos e símbolos, valor no teto, desconto só com espaços, e seis com desconto (10 %, 5,5 %, 12,5 %, 90 % no piso, 33 %, e uma com tudo junto) | **os 14 idênticos** à `main` |
| **O link das 12 variações de bloco** (padrão, sem PayPal, sem WhatsApp, sem os dois, sem coruja, aparência mexida — cada uma com e sem desconto) | **os 12 idênticos** à `main` |
| **O código 1 depende do desconto?** | `main`: **depende** nas 6 variações. Aqui: **independente** nas 6 — mesmo SHA-256 com `descpix=0` e `descpix=10` |
| Erros de console | 0 dos dois lados |

**A medida mais forte do item 1**, tirada antes de os itens 2 e 3 entrarem: o código 1 desta versão era **byte a byte igual** ao código 1 que a `main` produzia **com** desconto, nas 6 variações. O item 1 não acrescentou um byte ao bloco — ele parou de omitir bytes.

Depois dos itens 2 e 3 o código 1 muda, e o `diff` mostra **exatamente** o pretendido e nada mais: três regras de CSS, o `TXT_OU`, a assinatura de `pix`, o `appendChild` do botão, o `.fcpg-sep`, a classe `fcpg-semtopo` e a conversão de `zap` em `zapBotao`.

### Bloco B — o bloco entregue, executado numa página de verdade

Um segundo servidor devolve, em `/pagar`, um documento mínimo contendo **o bloco entregue, cru**. Navegação de verdade, `location.search` de verdade. Todo pedido para fora de `127.0.0.1` é abortado, então nem o QR Code nem o SDK do PayPal chegam — e as duas saídas de falha aparecem, como devem.

- **Cobrança sem desconto:** valor em destaque, sem linha de desconto; **"Já paguei" dentro da seção do Pix e depois da orientação** (conferido pela posição no DOM, não pela aparência); "OU" presente; bloco do PayPal com `fcpg-semtopo`. A ordem dos filhos do cartão é exatamente `topo, desc, valor-rot, valor, ref, bloco(Pix), sep, bloco(PayPal)`.
- **Cobrança com 10 %:** total `R$ 450,00` em destaque, linha `Pagando via Pix (-10%): R$ 405,00`, campo 54 do payload `405.00`, mensagem do WhatsApp citando os dois valores. Com 5,5 % sobre `1.234,56`: `R$ 1.166,66`.
- **Cobrança sem PayPal (`pp=nao`):** sem seção de PayPal e **sem o "OU"**; o "Já paguei" continua na seção do Pix. Com PayPal por link: "OU" e seção presentes.
- **Prazo vencido** (relógio adiantado em três dias): recado de vencimento, descrição à vista, **"Já paguei" continua disponível** em bloco próprio, sem PayPal e sem "OU". No mesmo link, com o relógio real: mostra o pagamento e o prazo.
- **Adulterações, 8 casos, todas recusadas:** descrição trocada, `t` trocado, `x` trocado, selo apagado, selo trocado, `t` apagado, `x` apagado, dígito do código Pix trocado. Endereço sem parâmetros cai no recado cordial.
- **Compatibilidade para trás, medida:** os **8 links sem desconto gerados pela árvore da `main`** foram abertos dentro do **bloco novo** — os 8 aceitos, com valor e sem recusa. É a propriedade "a conta de seis é um superconjunto da de quatro", exercitada em vez de argumentada.
- **Bloco sem WhatsApp:** sem botão; "OU" no lugar; desconto funcionando; e o texto `zapBotao` **não aparece no bloco**.
- **Bloco só com Pix:** sem PayPal e sem "OU"; "Já paguei" na seção do Pix; desconto funcionando.
- Zero erro de JavaScript em todos os casos.

### Bloco C — o invariante da `/cobrar`

Ferramenta e `/cobrar` servidas na **mesma origem**, que é como elas dividem o armazenamento. Dois estados de aparelho: `p.descpix = 0` (o caso que produzia o defeito) e `p.descpix = 10`.

- **Campo de desconto visível na `/cobrar` nas 22 aberturas** — inclusive com `p.descpix = 0`, que é exatamente o que não acontecia. Em **aparelho virgem** (armazenamento vazio) o campo aparece e nasce em zero.
- **22 de 22 links byte a byte idênticos** entre a aba e a `/cobrar`, em 11 cobranças × 2 estados de aparelho: sem desconto, desconto vazio, 10 %, 5,5 % com identificador, 12,5 % com validade, 90 % no piso (`R$ 0,10`), 100 % que se corrige para 90 **nos dois lados**, sem PayPal, PayPal por link, descrição hostil (`</script>`, `<!--`, aspas, `&`, `%`, `#`, `?`), e valor no teto.
- **O campo se corrige igual nos dois lados** nas 22 (`100` → `90` nas duas telas, e o link sai com 90).
- **7 recusas com as mesmas palavras** nos dois lados, e nenhum link gerado em nenhuma: descrição vazia, valor vazio, valor ilegível, valor que arredonda para zero, desconto que derruba o Pix abaixo de um centavo, validade vencida, link do PayPal de outro host.
- Zero erro de console dos dois lados.

### Bloco D — integração e norma

- **Painel consolidado:** com preset geral criado e a aba de cobrança ligada, trocar **só o desconto** não dispara o aviso "Código gerado antes da última mudança"; trocar o **título do cartão** dispara. É a prova de que `descpix` foi para o lugar certo.
- **Preset de aba** guarda e devolve o desconto (`12.5` salvo, campo zerado, "Aplicar" o devolve).
- **A prévia da aba, nos quatro estados:** "cobrança válida" mostra valor, linha do desconto, o "OU" e o "Já paguei" dentro da seção do Pix — a prévia executa o mesmo bloco, então ela também prova o layout; "link editado", "prazo vencido" e "sem parâmetros" caem nos recados certos. Zero erro de console.
- **569 IDs na ferramenta e 33 na `/cobrar`, nenhum repetido** (a `/cobrar` perdeu o `cb-descpix-nota`, que deixou de existir).
- **Norma:** `fc-compartilhado.js` continua **100 % ASCII**; nenhum `let`/`const`/arrow/template nos três arquivos; nenhum evento inline em HTML. No bloco gerado: zero `onclick`, zero tag semântica HTML5, e os únicos caracteres fora do ASCII são **13 linhas de texto visível** — nenhum em identificador ou operador.
- `scripts/conferir-versoes.sh`: **OK**, com `--registrar` rodado depois da troca.
- **A remoção dos cinco apelidos mortos foi medida à parte:** as 12 saídas, os 26 links e os 12 blocos das variações saíram **idênticos** aos de antes dela. Zero diferença.

---

## 3. O que continua verdade, e o que o dono precisa fazer

**Um passo, uma vez só.** Um código 1 gerado **antes** desta versão não conhece a conferência da relação nem a `seloDe` de seis, e recusa links com desconto. Gere o código 1 de novo e cole na `/pagar`. Depois disso, ligar, desligar ou trocar o percentual **não pede nada** — nem colar, nem regerar o bloco.

**Links sem desconto não são afetados por nada disto.** Os já enviados continuam valendo, e o bloco novo os aceita — medido com os 8 links da árvore anterior.
