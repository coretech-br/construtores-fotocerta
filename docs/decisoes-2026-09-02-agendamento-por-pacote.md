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
