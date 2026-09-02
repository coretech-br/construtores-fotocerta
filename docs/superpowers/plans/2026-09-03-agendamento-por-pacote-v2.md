# Agendamento por pacote v2 — plano de implementação

> **Para quem executa:** um subagente por tarefa, com revisão entre elas. Os passos usam `- [ ]` para marcação.

**Goal:** aplicar a revisão do dono sobre a décima aba já publicada — o bloco de pagamento passa a espelhar o Checkout (com opcionais e cupom), o link do TidyCal vira caminho, os marcadores da página de obrigado viram configuráveis, e duas fontes únicas são extraídas (o pedido do PayPal e o desenho do QR Code), corrigindo dois defeitos do Checkout no caminho.

**Ponto de partida:** a v1 está **publicada e funcionando** (`main`, versão `2026-09-02a`). Isto é uma evolução dela, não uma reescrita: o que a revisão não tocou permanece.

**Spec:** `docs/specs/2026-09-02-agendamento-por-pacote-design.md` — **revisão 2**. Leia o §0 primeiro: ele lista o que mudou e por quê.

**Diário de decisões:** `docs/decisoes-2026-09-02-agendamento-por-pacote.md` — doze decisões, **oito ainda valendo, quatro revisadas**. As revisadas estão no §0 da spec.

---

## Global Constraints

Valem para **toda** tarefa; quebrar qualquer uma reprova a tarefa.

**No código gerado:** `addEventListener` nunca inline · tags blindadas por concatenação (`'<scr'+'ipt>'`) · só `<div>` · IIFE única · marcadores de seleção desenhados · `text-align:left` forçado · at-rules só em `<style>` do componente · **ES5** · **texto que uma pessoa lê sai acentuado, código não** · **a palavra "PayPal" não entra em texto nosso** (os botões do SDK são deles).

**No `index.html`:** sem acento em comentário nem identificador · texto de interface com acento · prefixos `a-` / `a-out1..3` / `fca-` · dados operacionais só no painel Identidade, lidos com `fciVal` · **a prévia executa o gerador, nunca o imita** · nada é reescrito.

**Os dois invariantes desta rodada.** Eles são diferentes entre si, e confundi-los é o erro mais provável:

> **A.** Nas tarefas 1 e 2 (as extrações), **as saídas dos geradores existentes têm de sair byte a byte idênticas** — `u-out`, `m-out`, `p-out1`, e as 21 antigas. Extração que muda um byte está errada; o teste não.
>
> **B.** Na tarefa 3 (a correção do QR), `u-out` e `m-out` **mudam de propósito** — é correção de comportamento. O `p-out1` continua idêntico, porque é dele que o desenho vem. **Diff enumerado linha a linha, obrigatório.**

---

## Ordem, e por que ela não é negociável

As unificações vêm **antes** da aba nova, e não depois:

1. Enquanto a aba nova ainda não consome as fontes, cada extração pode ser provada **isoladamente** — a fotografia antes/depois só tem uma variável.
2. Se a aba nova mudasse junto, uma divergência não diria qual das duas causas a produziu. Foi exatamente o argumento que usei para adiar a extração; ele vale para o **commit**, não para a rodada — e é por isso que a ordem resolve.

---

## Contrato de integração

Já medido e registrado no plano da v1 (`docs/superpowers/plans/2026-09-02-agendamento-por-pacote.md`) — **leia a seção "Contrato de integração" de lá**. O que mudou desde então: `index.html` tem ~19.400 linhas, a aba `pac` existe, e `geradores.mjs` já fotografa `a-out1`, `a-out2` e `a-out3`.

**Onde estão as três cópias do pedido do PayPal** (medido em 02/09): Checkout ~11303, `/pagar` ~14746, Mini loja ~16860 — procure por `actions.order.create`.

**Onde está o desenho do QR:** Checkout ~11433 e Mini loja ~18098 (`if(qrPronto&&window.QRCode)`), `/pagar` ~14505 (`function desenharQr`, a boa).

---

### Task 1: O pedido do PayPal vira fonte única

**Files:** Modify: `index.html` (os três geradores) ou `fc-compartilhado.js` se a `/pagar` também precisar — decida lendo, e justifique.

**Interfaces:** Produces: uma função que **devolve texto** (padrão `fcTotalPixSrc`/`fcMoedaFmtGer`), consumida pelos três geradores.

- [ ] **Passo 1: A fotografia ANTES.** Sem isto a tarefa não tem como ser provada.

```bash
FC_DUMP=/tmp/pp-antes node scripts/verificar/geradores.mjs "$PWD" 8931 /tmp/pp-antes.json
```

- [ ] **Passo 2: Ler as três cópias inteiras** e escrever, **em comentário no código**, o que é idêntico e o que difere. Este passo produz a decisão do passo 3; pulá-lo leva a forçar uma unificação que não cabe.

- [ ] **Passo 3: Extrair o que é comum.** O esqueleto (SDK, `style` dos botões, guarda de total zero, forma do `purchase_units`, `onApprove`, `onError`) vira texto compartilhado, parametrizado pelo que difere (o prefixo das classes, como o nome do item é montado, se há sinal).

**Extração parcial bem justificada é melhor que completa e frágil.** Se um pedaço não couber sem mudar bytes, deixe-o em cada gerador e **escreva no comentário a medida** do que ficou de fora e por quê. O projeto já tem esse precedente na Mini loja.

- [ ] **Passo 4: A fotografia DEPOIS, e a comparação.**

```bash
FC_DUMP=/tmp/pp-depois node scripts/verificar/geradores.mjs "$PWD" 8931 /tmp/pp-depois.json
for f in /tmp/pp-antes/*.txt; do cmp "$f" "/tmp/pp-depois/$(basename $f)" || echo "DIFERE: $(basename $f)"; done
```
**Esperado: nenhuma linha de saída.** Uma só divergência reprova a tarefa — inclusive nas saídas que nada têm a ver com PayPal.

- [ ] **Passo 5:** `scripts/verificar/regressao.sh` → as 21 antigas idênticas. Commit.

---

### Task 2: O desenho do QR Code vira fonte única

**Files:** Modify: `index.html`

- [ ] **Passo 1: A fotografia ANTES** (mesmo comando da Task 1, pasta `/tmp/qr-antes`).

- [ ] **Passo 2: Extrair o desenho da `/pagar`** (`desenharQr`, ~14505) como texto compartilhado. Ele é a versão correta: carrega a biblioteca **sob demanda** com `onerror`, envolve `new QRCode(...)` em `try/catch`, e esconde a caixa quando não dá para desenhar.

- [ ] **Passo 3: A `/pagar` passa a consumir a fonte.** Prove que `p-out1` sai **byte a byte idêntico** — é dele que o texto veio, então qualquer diferença é erro de extração.

- [ ] **Passo 4: Commit desta parte**, antes de tocar no Checkout. A partir daqui as saídas mudam de propósito, e separar os dois commits é o que mantém a resposta nítida.

---

### Task 3: O Checkout e a Mini loja passam a usar o desenho novo

**Este é o invariante B: `u-out` e `m-out` MUDAM, de propósito.**

- [ ] **Passo 1:** trocar o desenho do QR dos dois pela fonte única.

- [ ] **Passo 2: Enumerar o diff, linha a linha**, com `FC_DUMP` dos dois lados e `diff`. O relatório tem de dizer **quantas linhas** mudaram em `u-out` e em `m-out`, e que **nenhuma outra saída** mudou. `p-out1` e as demais: idênticas.

- [ ] **Passo 3: Provar os dois defeitos consertados**, com o bloco executando (`scripts/verificar/pagina.mjs`):
  - **a biblioteca falha ao carregar** (bloqueie a rota do cdnjs): a caixa do QR some, **e o copia-e-cola aparece preenchido, com o valor certo**. Este segundo pedaço é o que prova a correção do `try/catch` — hoje uma exceção ali derruba o resto de `gerarPix`.
  - **a biblioteca chega atrasada**: clicar em "Gerar Pix" antes de ela carregar tem de acabar com o QR desenhado assim que ela chega.

- [ ] **Passo 4:** regressão + commit.

---

### Task 4: O catálogo vira produto do molde do Checkout

**Files:** Modify: `index.html` (aba `pac`)

- [ ] **Passo 1: O caminho do TidyCal.** O campo de link vira **caminho** (`usuario/tipo`), com a mesma validação e o mesmo botão "abrir para conferir" da aba TidyCal (procure por `t-path`). O bloco monta `https://tidycal.com/` + caminho.

**Migração:** quem já tiver URL inteira gravada — o dono, se tiver testado a v1 — não pode perder o valor. Ao restaurar, um valor que começa com `https://tidycal.com/` vira caminho automaticamente, e **isso é dito na tela uma vez**. Nunca descarte calado.

- [ ] **Passo 2: Os opcionais.** Cada pacote ganha lista própria: nome, preço, e se aceita quantidade. Molde e editor em linha copiados do Checkout (`u-prods`/`ops`), inclusive as recusas já existentes lá — nome vazio se corrige à vista, preço zero é aceito (opcional grátis é legítimo), e a lista entra em `listas` no registro `ABAS`.

- [ ] **Passo 3: Os cupons.** Cadastro igual ao do Checkout (`u-cps`): código, tipo, valor, validade — com as recusas de valor zerado, percentual acima de 100 e código repetido.

- [ ] **Passo 4: A ordem das seções**, espelhando o Checkout: **1** Formas de pagamento e identificação · **2** Pacotes e itens opcionais · **3** Página de obrigado e marcadores · **4** Textos e aparência · **5** Biblioteca de presets · **6** Prévia e códigos gerados.

- [ ] **Passo 5: Os marcadores configuráveis.** Quais variáveis do TidyCal viajam, e o **texto reserva** de cada uma — a mesma mecânica da página de obrigado da aba TidyCal (`t-ob-*`). Isso paga a dívida registrada na v1.

- [ ] **Passo 6:** regressão (as 21 antigas idênticas; `a-out*` mudam de propósito) + commit.

---

### Task 5: A página de obrigado ganha opcionais e cupom

**Files:** Modify: `index.html`

- [ ] **Passo 1: A conta do dinheiro vem de `FC_CARRINHO_SRC`**, não reescrita. O bloco declara o contrato por nome: `subtotal()` = pacote + opcionais marcados; `somaProdutos()` = só o pacote; `cupomAtivo`; `DESCONTO_PIX`. **Não** emita `SINAL_*` nem as funções de sinal — não há cobrança de sinal aqui, e emiti-las seria código morto no bloco do cliente.

- [ ] **Passo 2: A tela.** O pacote agendado como item fixo (não desmarcável), os opcionais daquele pacote para marcar, o campo de cupom com a linha de desconto — **e a validade do cupom nela**, como as outras duas abas fazem desde 01/09.

- [ ] **Passo 3: O identificador continua estável.** Ele não pode passar a depender dos opcionais escolhidos: o cliente que marca um álbum depois de já ter visto o Pix não pode ganhar um identificador novo. Ele sai do pacote + data/hora, como já está.

- [ ] **Passo 4: Provar, com o bloco executando:**
  - o total muda ao marcar um opcional, e o **payload Pix acompanha** — relido por leitor TLV independente, campo 54 igual ao da tela;
  - cupom aplicado desconta certo nos três tipos (`pct_produto`, `pct_total`, `fixo`), e `pct_produto` desconta **só o pacote**, não os opcionais;
  - cupom vencido é recusado, e a linha do desconto some;
  - o identificador é **idêntico** antes e depois de marcar um opcional.

- [ ] **Passo 5:** regressão + commit.

---

### Task 5b: Cupom repetido passa a ser recusado no Checkout e na Mini loja

**Decisão do dono, 03/09** — ver a decisão 13 do diário. Medido: a recusa não existe nas duas abas, e o efeito é silencioso — o segundo cupom de código repetido **nunca é encontrado**, e o operador não descobre.

- [ ] **Passo 1:** a mesma recusa que a aba `pac` ganhou na Task 4, com a mesma mensagem, no Checkout (`uRecusa`) e na Mini loja (`mRecusa`). Comparação **sem diferenciar maiúsculas e sem espaços das pontas**, como o resto do projeto faz.
- [ ] **Passo 2:** a recusa também no **cadastro**, não só na geração — o operador tem de saber na hora de adicionar, não só ao gerar. Veja como a aba `pac` faz.
- [ ] **Passo 3: invariante B — `u-out` e `m-out` mudam de propósito**, e o diff é enumerado. Nesta tarefa a mudança é de **recusa**, não de saída: com configuração válida, as duas saídas têm de sair **byte a byte idênticas**. Se mudarem, você mexeu em algo que não devia.
- [ ] **Passo 4: provar as duas recusas** como operador, nas duas abas, e provar que um preset com código repetido é recusado ao gerar, com a mensagem nomeando o código.
- [ ] **Passo 5:** regressão + commit.

---

### Task 5c: A quantidade dos opcionais passa a funcionar

**Decisão do dono, 03/09** — ver a decisão 14 do diário. Hoje a marcação "aceita quantidade" existe no cadastro e o pagamento a ignora: o controle mente.

**Nada se escreve do zero — a peça é compartilhada e está medida:**

| Peça | Onde | Quem já consome |
|---|---|---|
| `fcFazQtdSrc(pref)` — o seletor | `index.html:3799` | Checkout `11341`, Mini loja `18272` |
| `fcQtdCssGer(raiz,pref,destaque)` — o CSS dele | `index.html:3820` | Checkout `11068`, Mini loja `17800` |
| `QUANTIDADE_MAXIMA` — o teto emitido | `11155` / `17946` | os dois, sob `if(usaQtd)` |
| O campo do teto na aba | `u-qtdmax` (1579), `m-qtdmax` (2713) | molde a copiar |

- [ ] **Passo 1:** a aba `pac` ganha `a-qtdmax` no molde de `u-qtdmax` (número, 2 a 99, padrão 10), entra em `A_NUMS`, em `aColeta`/`aRestaura` e no preset.
- [ ] **Passo 2:** `aBlocoObrigado` emite `QUANTIDADE_MAXIMA`, `fcQtdCssGer` e `fcFazQtdSrc`, **só quando algum opcional do catálogo tiver a marcação ligada** — o mesmo `if(usaQtd)` que as outras duas abas usam. Sem isso, o bloco carrega código morto para quem não usa quantidade.
- [ ] **Passo 3:** `subtotal()` passa a multiplicar o preço do opcional pela quantidade escolhida. `somaProdutos()` **não muda** — ele é só o pacote, e é o que `pct_produto` desconta.
- [ ] **Passo 4: A prova que importa, e ela tem uma dimensão a mais que a da Task 5.** A multiplicação tem de chegar inteira ao **campo 54 do payload Pix**, lido por leitor TLV independente: opcional de R$ 80 com quantidade 3 são R$ 240 na tela **e** R$ 240 no Pix. Varra combinações de preço × opcional × **quantidade** × cupom × desconto Pix, comparando tela e campo 54. Zero divergências.
- [ ] **Passo 5:** o identificador continua **estável** ao mudar a quantidade — mesma exigência da Task 5, e pelo mesmo motivo.
- [ ] **Passo 6:** regressão (só `a-out3` diverge) + commit.

---

### Task 6: A prévia acompanha

- [ ] **Passo 1:** a prévia da página de obrigado passa a mostrar opcionais e cupom, executando o gerador. O seletor "prever como" continua com os pacotes mais "sem pacote (recusa)".
- [ ] **Passo 2:** provar que marcar opcional e aplicar cupom funcionam **dentro da prévia**, com o shim de armazenamento pegando.
- [ ] **Passo 3:** regressão + commit.

---

### Task 7: Documentação, verificação final e publicação

- [ ] **Passo 1: O cenário da regressão exercita o que é novo.** Em `geradores.mjs`, a aba `pac` passa a ter **um opcional e um cupom** cadastrados. Sem isso, os dois caminhos novos ficam fora da fotografia — a armadilha que já aconteceu duas vezes neste projeto.
- [ ] **Passo 2:** a documentação registra as quatro decisões revisadas, as duas unificações e os dois defeitos do Checkout corrigidos. A `docs/pendencias.md` perde as dívidas pagas (o pedido do PayPal, os textos reserva) e ganha o que sobrar da extração parcial.
- [ ] **Passo 3:** a bateria completa — regressão, as varreduras do Manual do Prosite nas três saídas, ES5, acentuação, IDs repetidos.
- [ ] **Passo 4:** carimbo (`scripts/carimbar-publicacao.sh`), merge e publicação. **O dono autorizou.**

---

## Self-review deste plano

**Cobertura da revisão do dono:** decisão 1 → Tasks 4 e 5; decisão 2 → Task 5; decisão 3 → só spec, já escrita; decisão 8 → Task 1; o pedido novo do QR → Tasks 2 e 3; a dívida dos textos reserva → Task 4 passo 5.

**O risco que este plano corre, e onde ele está declarado:** a Task 1 pode descobrir que a unificação completa do pedido do PayPal muda bytes. O plano **já autoriza a extração parcial com a medida**, em vez de forçar — mas se ela sair pequena demais para valer a pena, isso é um achado a relatar, não a esconder.

**A confusão mais provável:** trocar o invariante A pelo B. As Tasks 1 e 2 exigem **igualdade byte a byte**; a Task 3 exige **diff enumerado**. Um executor que aplique o A na Task 3 vai concluir que quebrou tudo; um que aplique o B na Task 1 vai deixar passar uma extração errada.
