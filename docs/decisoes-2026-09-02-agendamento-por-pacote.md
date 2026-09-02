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
