# Pendências — o que ficou combinado e ainda não foi feito

Atualizado em 22/08/2026. Este arquivo é a lista viva; o histórico do que já foi entregue está no `docs/ledger-evolucao-2026-08.md` e nas specs.

---

## Próxima rodada — três itens, um arquivo só

Os três mexem no gerador do bloco da aba **Link de cobrança**, então cabem numa rodada com **uma revisão só**.

### 1. O bloco sempre carrega a matemática do desconto

**O problema, medido em 22/08/2026.** O campo de desconto da `/cobrar` só aparece quando `blo.descpix > 0`, lido da configuração salva **naquele navegador**. Consequência real que o dono encontrou: configurou o desconto no computador, e no celular o campo não apareceu — nem no Safari, nem no Chrome, nem no PWA.

**Não era cache.** A guarda de versão teria parado a página com aviso vermelho se o arquivo compartilhado estivesse velho. Era o armazenamento, que é **por aparelho** — a mesma ressalva já registrada para a identidade, que também alcança as escolhas do bloco.

**A causa de fundo:** `fcTotalPixSrc(descpix,…)` só emite a versão com desconto quando `descpix > 0` na hora de gerar. Isso amarra uma decisão **por cobrança** a uma configuração **do bloco**.

**A correção:** o bloco da cobrança passa a emitir **sempre** a versão capaz de desconto. O `x` do endereço continua mandando em cada cobrança; ausente ou zero = sem desconto. Aí o campo aparece sempre na `/cobrar`, e **some uma classe inteira de "num aparelho aparece, no outro não"**.

**Invariante obrigatório:** link sem desconto tem de continuar byte a byte idêntico. O bloco muda (ganha as linhas da conta); o **link** não pode mudar.

### 2. O "Já paguei" está no lugar errado

Hoje ele fica **no fim da página, depois da seção do PayPal**. Mas é um botão **exclusivo do Pix** — quem paga por PayPal recebe notificação e recibo por e-mail, do próprio PayPal.

**Mover para logo depois do texto de orientação do Pix** (*"Abra o aplicativo do seu banco…"*), que é onde ele faz sentido para quem acabou de copiar o código.

### 3. Deixar claro que são duas formas alternativas

O layout não diz que Pix **ou** PayPal são caminhos alternativos — parecem etapas. Incluir um **"OU"** entre as duas seções.

### Estimativa

| | |
|---|---|
| Abordagem | Um agente em **Sonnet**, escopo fechado nos três itens |
| Verificação mínima | O invariante do link sem desconto; a regressão dos outros sete geradores; e conferir na tela que o "Já paguei" e o "OU" estão onde devem |
| **Estimativa** | **1h15 – 2h** |

Haiku não: mexe no bloco que cobra dinheiro, e o histórico desta semana mostra que é onde os defeitos silenciosos aparecem.

---

## O que depende só do dono

1. **Colar o código 1 na landing page `/pagar`** — ela precisa ser *Landing Page* no Prosite, não *Página*, porque Páginas sempre carregam o menu.
2. **Cobrança de teste de R$ 0,01** para si mesmo, indo até o app do banco. É o único trecho do caminho que não é verificável daqui.
3. **Levar a configuração para o celular** — *Exportar tudo → Com os dados* no computador, *Importar* no celular. Leva desconto, identidade e endereço de uma vez.
4. **Regerar e recolar** os blocos de **captação de leads** e **slideshow** na landing de Natal: os dois ainda se mexem com "Reduzir movimento" ligado, e a correção já está publicada na ferramenta.

---

## Em observação, sem ação por enquanto

**Janela voltando a tela cheia.** O dono relatou em 22/08/2026 que a `/cobrar` no computador voltava a ocupar a tela inteira alguns segundos depois de ele redimensionar a janela. Descartado no código: **nenhuma chamada a `resizeTo`, `moveTo` ou `requestFullscreen`** em `index.html`, `cobrar/index.html` ou `fc-compartilhado.js`; o manifesto pede `standalone`, não `fullscreen`; e a `.faixa` tem `max-width:560px` centralizada. Não voltou a acontecer. Ele avisa se repetir.
