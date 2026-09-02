# Decisões tomadas na madrugada de 02→03/09/2026

O dono aprovou a spec e autorizou execução de ponta a ponta, com uma instrução
explícita: *"se aparecer alguma decisão, não pare. Registre o que precisa ser
decidido, as opções, decida por mim a melhor alternativa que vc recomenda e
amanhã eu reviso. Se precisar, refazemos algo que eu reprove."*

Este arquivo é esse registro. Cada entrada tem: **o que apareceu**, **as opções
reais**, **o que eu decidi** e **o que custa desfazer**. A última coluna é a que
importa na revisão — decisão cara de desfazer merece mais atenção dele.

Spec: `docs/specs/2026-09-02-agendamento-por-pacote-design.md`
Plano: `docs/superpowers/plans/2026-09-02-agendamento-por-pacote.md`

---

## Índice

1. [O bloco de pagamento se espelha na `/pagar`, não no Checkout](#1)
2. [`FC_CARRINHO_SRC` fica de fora, e a medida que decidiu](#2)
3. [A contagem do prazo não tem problema de fuso — e por que isso não é sorte](#3)
4. [O prefixo da aba é uma letra só, e não por estética](#4)
5. [A rodada é partida em duas entregas](#5)
6. [A `CLAUDE.md` está desatualizada em 3.500 linhas](#6)
7. [O identificador tem de sobreviver a um F5 — e este é o achado mais caro da noite](#7)
8. [O pedido do PayPal **não** é fonte compartilhada, e a spec estava errada](#8)
9. [A corrida da mensagem atrasada do iframe anterior](#9)
10. [`previa.html` e o cache: declarado como não-problema, com a razão](#10)
11. [O caminho B virou interruptor — e o defeito era do meu plano](#11)

---

<a id="1"></a>
## 1. O bloco de pagamento se espelha na `/pagar`, não no Checkout

**O que apareceu.** A spec diz "reaproveita o Checkout sem as partes de escolha". Ao medir, apareceu um terceiro candidato melhor: o bloco da aba **Link de cobrança** (a página `/pagar`), que já cobra **um item de valor fixo**, sem carrinho, sem cupom e sem opcionais — exatamente a forma que esta rodada precisa.

**As opções.**

- **(a) Espelhar o Checkout**, como a spec dizia. Custo: ele monta o valor a partir de um carrinho (`subtotal()`, `somaProdutos()`, `cupomAtivo`), e tudo isso teria de ser desmontado. Mais código para tirar do que para escrever.
- **(b) Espelhar a `/pagar`.** Ela já é item único. E tem uma coisa que o Checkout **não** tem, medida no arquivo: se a biblioteca do QR Code não carregar (bloqueador de anúncios, rede ruim), a `/pagar` **esconde a caixa do QR** e segue com o copia-e-cola inteiro; o Checkout deixaria um retângulo branco de 220 px sem explicação nenhuma na tela do cliente.

**Decidi (b).** Não é só menos trabalho: é herdar um tratamento de falha que o outro modelo não tem, numa tela onde o cliente está pagando.

**Custo de desfazer:** baixo enquanto o gerador não existir; médio depois. É estrutural, então está no topo da lista de revisão.

---

<a id="2"></a>
## 2. `FC_CARRINHO_SRC` fica de fora, e a medida que decidiu

**O que apareceu.** A spec listava as fontes compartilhadas a reusar. `FC_CARRINHO_SRC` é a "conta do dinheiro" que o Checkout e a Mini loja dividem — parecia candidata óbvia.

**A medida.** Todas as cinco peças dela pressupõem, por nome, coisas que este bloco não tem: `cupomAtivo`, `subtotal()`, `somaProdutos()`, `SINAL_TIPO`, `SINAL_VALOR`. Um bloco de **um item de preço fixo** não tem carrinho nem cupom para alimentá-las.

**Decidi não usá-la**, e em vez disso declarar `total()` devolvendo o preço do pacote — que é o único nome de que as peças realmente reaproveitadas precisam (`fcTotalPixSrc` e o Pix).

**O que se aproveita dela mesmo assim é o PADRÃO, não o texto:** arredondar em centavos num lugar só (`Math.round(v*100)/100`), que é a correção que custou uma rodada em ago/2026.

**Custo de desfazer:** baixo. Se um dia esta aba ganhar cupom, ela volta.

---

<a id="3"></a>
## 3. A contagem do prazo não tem problema de fuso — e por que isso não é sorte

**O que apareceu.** A aba Contagem regressiva resolve fuso de um jeito específico: o instante-alvo é calculado **na hora de gerar** e congelado numa string ISO com `-03:00` embutido, porque o bloco não pode recalcular fuso no aparelho do visitante. Perguntei-me se o prazo desta rodada precisa do mesmo cuidado.

**A resposta, e ela é estrutural.** Não precisa, porque **o prazo daqui é uma duração, não uma data de calendário**: "primeira visita + 24 horas" é aritmética de milissegundos, e milissegundo não tem fuso. O relógio do aparelho pode estar em qualquer lugar do mundo que a conta fecha.

**Onde o fuso volta a existir**, e aí sim com cuidado: o limite "nunca depois do início do ensaio" precisa ler a data que o TidyCal manda. Essa **é** uma data de calendário. Decisão: usar `Date.parse` sobre o valor de `quando` (que o TidyCal envia em ISO, com offset) e, **se não der para ler, simplesmente não aplicar o limite** — vale só a contagem de horas. O prazo nunca sai de uma data que a página não conseguiu ler, que é a mesma regra já escrita na spec para o identificador.

**Custo de desfazer:** baixo.

---

<a id="4"></a>
## 4. O prefixo da aba é uma letra só, e não por estética

**O que apareceu.** A spec não fixou o prefixo da aba nova. Ao levantar o contrato, apareceu uma restrição que não estava em lugar nenhum da documentação: `fccOrfas` — a rede que denuncia saída gerada e esquecida do painel — varre as `<textarea>` do documento com a expressão `/^[a-z]-out[0-9]*$/`. **Uma letra minúscula, hífen, `out`.**

Prefixo de duas letras passaria despercebido por essa rede: a aba nova geraria código, esqueceria de consolidá-lo, e **o aviso vermelho nunca apareceria** — exatamente o defeito que a rede existe para pegar, e que já aconteceu uma vez em 23/08.

**Decidi:**

| Coisa | Valor | Por quê |
|---|---|---|
| `id` da aba (em `ABAS`, `aba-*`, `painel-*`) | `pac` | livre, e diz o que é |
| `pref` dos campos e da chave do fragmento | **`a`** | única letra livre boa; `s l t u b c p m e` estão tomadas |
| Saídas | `a-out1`, `a-out2`, `a-out3` | casam com a varredura |
| Classes do bloco gerado | **`fca-`** | não colide com `fc- fcw- fcu- fcb- fcpg- fcm-` nem com os prefixos internos da ferramenta (`fcp- fcg- fcx- fcc- fci-`) |

**Custo de desfazer:** alto depois de o gerador existir — o prefixo aparece em centenas de lugares. Por isso está registrado agora, antes da primeira linha de código.

---

<a id="5"></a>
## 5. A rodada é partida em duas entregas

**O que apareceu.** A spec estimou 11h–15h e sugeriu partir, sem decidir. Como o dono foi dormir e pediu decisão, decido.

**Decidi partir**, nesta ordem:

- **Entrega 1 — a vitrine.** Aba, catálogo, saída 1 (componente), saída 2 (os N endereços), prévia, painel. Resolve sozinha o problema estético que originou o pedido.
- **Entrega 2 — a página de obrigado.** Saída 3, pagamento, prazo, identificador.

**As razões, e a segunda vale mais que a primeira.** A ordem é obrigatória (a entrega 2 consome o catálogo que a 1 constrói, não o contrário). E partir **tira do caminho crítico a única incógnita real da rodada**: como o modal do TidyCal se comporta dentro do nosso bloco. Ela aparece na entrega 1 e pode ser respondida pelo dono **antes** de qualquer linha de código que mexa com dinheiro ser escrita.

**As duas vão ao ar juntas**, porque o dono pediu o resultado publicado. A partição é do trabalho e da verificação, não da publicação.

**Custo de desfazer:** nenhum. É organização.

---

<a id="6"></a>
## 6. A `CLAUDE.md` está desatualizada em 3.500 linhas

**Medido.** A `CLAUDE.md` descreve o `index.html` como tendo ~14.400 linhas. Ele tem **17.985**. A diferença é o crescimento desde ago/2026 (nona aba, consolidação de N componentes, selo de destaque, e as rodadas de 01/09).

Não é grave, mas é a categoria de texto que este projeto persegue: **documentação que envelhece calada**. Um número errado ali faz quem lê subestimar o arquivo.

**Decidi corrigir** ao fim da rodada, junto com a entrada da décima aba na documentação — e **não agora**, para não misturar com o commit da implementação.

---

<a id="7"></a>
## 7. O identificador tem de sobreviver a um F5 — e este é o achado mais caro da noite

**Quem achou:** a revisão adversarial do plano, na categoria "verificação que não prova o que diz provar". Eu não tinha visto.

**O defeito, encadeado.** O identificador de conciliação é `prefixo + pacote + dia e hora`. Quando a data do TidyCal **não** é legível, ele cai num sufixo aleatório — regra boa, já decidida. Mas o plano não dizia que esse sufixo é gerado **uma vez**. Escrito do jeito natural, ele seria recalculado a cada carregamento da página, e daí saem **dois** defeitos, os dois silenciosos:

1. **O prazo reiniciaria a cada F5.** A chave que guarda "a primeira visita" inclui o identificador. Identificador novo, chave nova, contagem do zero. O cliente recarrega a página e ganha 24 horas de novo, para sempre.
2. **Cobranças fantasma no extrato.** O mesmo identificador vai no `txid` do Pix e no `custom_id` do PayPal. Recarregar antes de pagar produziria **um identificador novo por carregamento** — o dono veria várias cobranças diferentes no painel para uma reserva só.

E o pior: o teste que o plano mandava fazer **passaria**. Ele exercitava o relógio falso, não a recarga.

**Decidi:** o registro guardado no navegador passa a ter **as duas coisas** — o instante da primeira visita **e** o sufixo sorteado — e a chave dele **não depende do identificador**. A chave é `fcapac:<pac>:<quando cru>`, usando o valor de `quando` **como ele chegou na URL**, mesmo ilegível: ele é texto estável, e é o que distingue dois agendamentos do mesmo pacote. Sem `quando` nenhum, a chave cai para `fcapac:<pac>` e dois agendamentos do mesmo pacote compartilhariam o registro — **limite declarado**, não escondido.

**Custo de desfazer:** médio. Mexe na chave de armazenamento, e trocá-la depois de publicado faz o prazo reiniciar uma vez para quem já estava com a página aberta. Aceitável.

---

<a id="8"></a>
## 8. O pedido do PayPal **não** é fonte compartilhada, e a spec estava errada

**O que apareceu.** A spec §9 lista "o pedido do PayPal com item e conciliação" entre as fontes compartilhadas a reusar. A revisão duvidou; eu medi. **`actions.order.create` aparece três vezes no `index.html`**, escrito à mão em cada gerador (Checkout 11303, `/pagar` 14746, Mini loja 16860), e **não existe nenhuma função compartilhada que o escreva**.

A spec estava errada. Erro meu, ao escrevê-la.

**As opções.**

- **(a) Extrair agora** a fonte única e fazer os três geradores consumirem-na. É o que a regra do projeto manda. Custo: mexe em três geradores numa rodada que já é a maior desde a Mini loja, e a prova exigida é que as saídas dos três saiam **byte a byte idênticas** depois da extração. É factível, e é exatamente o tipo de coisa que não se faz às três da manhã no meio de outra rodada.
- **(b) Escrever a quarta cópia** e registrar a dívida com a medida.

**Decidi (b)**, e registro a dívida em `docs/pendencias.md`. A razão não é preguiça: extrair fonte única é uma refatoração cuja prova é a igualdade byte a byte de três saídas existentes, e misturá-la com a implementação de uma aba nova **destrói a capacidade de dizer o que quebrou** quando a regressão acusar. As duas coisas precisam de rodadas separadas.

A quarta cópia se espelha na da `/pagar` (item único), não na do Checkout — coerente com a decisão 1.

**Correção na spec:** a linha de §9 que afirma isso está errada e vai ser corrigida junto com o resto da documentação, ao fim da rodada.

**Custo de desfazer:** baixo. A extração continua possível depois, com uma cópia a mais para unificar.

---

<a id="9"></a>
## 9. A corrida da mensagem atrasada do iframe anterior

**Quem achou:** a revisão adversarial, em "risco não declarado". Também não estava na minha spec.

**O risco.** O ouvinte dos sinais do TidyCal fica em `window` — por desenho, para sobreviver à troca de iframe. Ele confere a origem (`https://tidycal.com`), mas **não tem como saber de qual iframe veio a mensagem**. Ao trocar de pacote, uma mensagem atrasada do iframe **anterior** pode chegar depois da troca e ser lida como se fosse do novo: o `min-height` do modal abriria (ou fecharia) no calendário errado, e o cliente veria um salto de 2.350 px sem ter clicado em nada.

**Decidi:** ao trocar de pacote, o bloco zera `modalAberto` e **ignora sinais por 800 ms** — a mesma carência que o código atual já usa entre a abertura do modal e as mutações, e pelo mesmo motivo. Custa três linhas.

**Custo de desfazer:** nenhum.

---

<a id="10"></a>
## 10. `previa.html` e o cache: declarado como não-problema, com a razão

**O que apareceu.** A revisão notou que o projeto versiona `fc-compartilhado.js` com rigor (três lugares, conferência ao carregar) e que `previa.html` nasceria sem versão nenhuma.

**Por que aqui não é problema, e a razão é o conteúdo.** `previa.html` tem três linhas e **nenhum comportamento**: um doctype, um charset e um título. Ele existe só para ser um endereço de mesma origem que aceita `?pac=` — quem escreve o conteúdo é a ferramenta, por `document.write`, a cada montagem da prévia. Uma cópia velha em cache é **idêntica** à nova, porque o arquivo não muda.

O contraste com `fc-compartilhado.js` é justamente esse: lá o arquivo **carrega comportamento**, e uma cópia velha produz link que a própria `/pagar` recusa.

**Decidi não versionar**, e registrar aqui a razão — para ninguém "consertar" isso depois achando que foi esquecimento.

**Custo de desfazer:** nenhum.

---

<a id="11"></a>
## 11. O caminho B virou interruptor — e o defeito era do meu plano

**O que apareceu.** Ao revisar o bloco gerado (não o relatório do executor), rastreei a lógica de altura do calendário e achei um defeito. Ele **não** é do subagente: meu plano dizia, com estas palavras, *"emita a altura fixa como `min-height` inicial do iframe, e trate o sinal como melhoria"*. Ele seguiu à risca. A instrução é que estava errada.

**O efeito, medido no código gerado.** `abrirCalendario` chamava `expandir()` sempre; `recolher()` só roda quando `modalAberto` já era verdadeiro; e na **primeira** abertura ele é falso. Resultado: o calendário ficaria travado em **2.350 px para sempre**, com cerca de 1.500 px de vazio embaixo — exatamente a página poluída que esta aba existe para eliminar. O pedido do dono era estético; a implementação entregaria o problema de volta, maior.

**Por que passou pelas 29 verificações do executor.** Nenhuma delas olhava a **altura**. Elas contavam iframes, conferiam preços e classes. É a lição já registrada duas vezes neste projeto: teste que não alcança o estado não prova nada sobre ele.

**Decidi:** o padrão volta a ser o comportamento **provado em produção** na aba TidyCal — altura natural, e o sinal expande. O caminho B vira uma variável no topo do bloco:

```js
var ALTURA_SEMPRE=false;   /* true = o calendario fica sempre na altura maxima. Ligue APENAS
                              se, na sua pagina publicada, o modal do TidyCal aparecer
                              cortado -- o preco de ligar e um vao vazio embaixo. */
```

Isso mantém a rede de segurança que o caminho B queria dar, **e** paga por ela só quem precisar. E deixa a escolha com quem tem a informação: só o dono, colando numa página publicada, descobre se os sinais chegam.

**A prova, que agora existe.** Um roteiro forja os sinais do TidyCal (dá para fazer: `MessageEvent` aceita `origin` no construtor) e exercita a máquina de estados inteira — **6 verificações, 6 ok**: altura natural ao abrir; sinal **dentro** da carência de 800 ms ignorado (a defesa da corrida); sinal fora da carência expande para 2.350 px; sinal de fechamento volta ao natural; sinal de outra origem ignorado; e um iframe só, antes e depois de trocar de pacote.

**Custo de desfazer:** baixo.

---
