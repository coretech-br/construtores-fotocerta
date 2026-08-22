# Pendências — o que ficou combinado e ainda não foi feito

Atualizado em 22/08/2026. Este arquivo é a lista viva; o histórico do que já foi entregue está no `docs/ledger-evolucao-2026-08.md` e nas specs.

---

## Nada em fila para a próxima rodada

Entregues em 22/08/2026: os três itens que estavam aqui — o bloco sempre carregar a matemática do desconto, o "Já paguei" no lugar certo e o "OU" entre as duas formas (`docs/specs/2026-08-22-bloco-sempre-com-desconto-design.md`) — e mais a **conferência do formato da chave Pix**, que saiu do primeiro pagamento real (`docs/specs/2026-08-22-formato-da-chave-pix-design.md`).

A próxima sai do que o dono encontrar no uso.

---

## O que depende só do dono

1. **Regerar e recolar o código 1 na `/pagar` — é o que destrava tudo.** O bloco que está lá foi gerado quando a Identidade tinha `contato` no lugar do e-mail inteiro; por isso a página recusa os links novos. Corrija a chave no painel Identidade, clique em **Gerar código da página**, e cole. Essa única colagem resolve as três coisas: a chave certa, a conferência do desconto e o layout novo ("Já paguei" no Pix e o "OU"). A página precisa ser *Landing Page* no Prosite, não *Página*, porque Páginas sempre carregam o menu.
2. **Recolar o código 1 antes do primeiro link com desconto.** Um código 1 gerado antes de 22/08/2026 não sabe conferir a conta do desconto e **recusa** links com desconto. É **uma vez só**: depois disso, ligar, desligar ou trocar o percentual não pede nada — nem colar, nem regerar o bloco. Links **sem** desconto não são afetados, e o bloco novo aceita os já enviados.
3. **Cobrança de teste de R$ 0,01** para si mesmo, indo até o app do banco. É o único trecho do caminho que não é verificável daqui. Vale fazer uma segunda, **com desconto**, para ver os dois valores no cartão e conferir no extrato qual chegou.
4. **Levar a configuração para o celular** — *Exportar tudo → Com os dados* no computador, *Importar* no celular. Leva desconto, identidade e endereço de uma vez. Continua valendo, mas **deixou de ser necessário para o campo de desconto aparecer**: ele agora aparece em qualquer aparelho, mesmo sem nada configurado.
5. **Regerar e recolar** os blocos de **captação de leads** e **slideshow** na landing de Natal: os dois ainda se mexem com "Reduzir movimento" ligado, e a correção já está publicada na ferramenta.
6. **A `/cobrar` na tela de início do iPhone** — instalar é gesto de aparelho, e o manifesto só foi conferido pelo servidor e pelo navegador. Confirmar que o ícone da coruja aparece e que a página abre em tela cheia.

---

## Em observação, sem ação por enquanto

**Janela voltando a tela cheia.** O dono relatou em 22/08/2026 que a `/cobrar` no computador voltava a ocupar a tela inteira alguns segundos depois de ele redimensionar a janela. Descartado no código: **nenhuma chamada a `resizeTo`, `moveTo` ou `requestFullscreen`** em `index.html`, `cobrar/index.html` ou `fc-compartilhado.js`; o manifesto pede `standalone`, não `fullscreen`; e a `.faixa` tem `max-width:560px` centralizada. Não voltou a acontecer. Ele avisa se repetir.

---

## Dívidas registradas, pequenas, sem dono

Nenhuma destas atrapalha o uso; ficam anotadas para não serem redescobertas.

1. **A recusa de formato da chave não abre o painel Identidade.** Ela devolve texto simples, como já faziam as recusas de charset e de tamanho. As recusas de campo *vazio* abrem o painel (via `FCI_APONTA`), mas a frase daquele sufixo diz "preencha", que não serve para um campo preenchido errado. Mudar o sufixo mexeria em cinco mensagens cobertas pelo invariante "as recusas dizem as mesmas palavras nos dois lados", e nenhuma medição pediu isso ainda.
2. **`.fcpg-pp` e `.fcpg-sep` saem no CSS mesmo quando o bloco não tem PayPal** (cerca de 250 bytes de regra que nada usa). É consistente entre si — `.fcpg-pp` já era assim —, e condicionar as duas mexeria no código 1 sem que nenhum recurso peça.
3. **O nome de um item opcional pode ser esvaziado pelo editor em linha** do Checkout e da Mini loja, e sai como `{nome:''}`. Registrado desde a rodada 3 da oitava aba.
4. **`prosite/natal-2026/bordas-css-componentes.md`** ainda espelha a regra antiga de movimento reduzido no bloco do head (item 5 acima resolve os dois de uma vez).
