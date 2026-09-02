# A consolidação passa a entregar o CSS do outro componente

**Data:** 24/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba **Bordas com efeito** e painel consolidado), `scripts/verificar/geradores.mjs`
**Aprovado pelo dono:** "pode fazer também a consolidação entregando o código 2, quando houver"

---

## 1. O buraco

A consolidação juntava as **animações** de dois componentes num código 1 só — e parava aí. O CSS do segundo componente ficava por conta do operador: ele teria de voltar à aba, aplicar aquele preset, gerar de novo e copiar o código 2 antes de reaplicar o preset do primeiro. Ninguém faz isso, e o desfecho provável é levar a animação para a Tag Head **sem** levar o CSS que a usa. O segundo componente fica **parado**, sem erro nenhum na tela — a falha silenciosa que este projeto persegue.

Depois do batismo por assinatura, o buraco ficou pior: o nome da animação do outro componente é `fc-borda-brilho-c657`, e não há como digitá-lo à mão.

## 2. A saída nova

**Código 3 — "CSS Customizado do OUTRO componente"**, uma terceira caixa que aparece **só** quando há um preset consolidado, e some junto com ele.

Ele sai do **mesmo `bMontar`** que escreveu a animação consolidada (`m2.props`), então o CSS e o `@keyframes` do segundo componente não têm como discordar: um erra ou acerta com o outro.

**Ele sai nos dois desfechos**, e não só quando as animações diferem. Quando os dois componentes têm a **mesma** animação, o segundo continua tendo cores, fundo e **velocidade** próprios — medido: código 2 com `4s` e código 3 com `12s`, um `@keyframes` só servindo aos dois.

## 3. Três decisões

**A escolha invalida o código 3 na hora.** Trocar o preset na caixa de consolidação limpa a caixa 3 imediatamente. Deixá-la na tela seria oferecer o CSS de um componente com o rótulo de outro — e colar CSS no componente errado **não dá erro**, só estraga os dois. Some daqui, e o painel volta a cobrar "Gerar código" enquanto não for regerado.

**O painel entra pela ESCOLHA, não pelo conteúdo.** O item só é empurrado para o plano quando a caixa de consolidação tem um preset. Se ele fosse empurrado por a caixa ter texto, o painel montaria uma página completa **faltando** justamente o CSS do segundo componente, sem dizer nada. Empurrando pela escolha, a caixa vazia vira "Ainda não gerado" — que é o que o operador precisa ler.

**A escolha é lida do campo, e não do preset geral.** `consol` descreve **outro** componente e por isso está declarada em `fora`; `fcgValoresDaAbaLer` a apaga de propósito. O painel lê `$('b-consol').value`, no mesmo padrão que a Contagem já usa para `c-fixa`.

## 4. O que continua fora

A caixa aceita **um** preset, então uma página comporta dois componentes com efeito de borda. Não há limite técnico para mais — nem no CSS, nem nos `@keyframes` — só a caixa de seleção. Passar para uma lista de N exige seleção múltipla, N saídas com identificadores estáveis (a varredura de órfãs casa `[a-z]-out[0-9]*`) e N itens no painel. Fica registrado como o próximo passo possível, não como esquecimento.

> **Dívida paga na mesma sessão, dez minutos depois.** `docs/specs/2026-08-24-consolidacao-de-n-componentes-design.md` trocou a caixa por uma lista de marcação, com teto de cinco outros componentes (`B_CONSOL_MAX`) e uma saída numerada para cada.

## 5. Verificação

1. **Regressão byte a byte**: 13 saídas (o `b-out3` entrou na fotografia) e 9 cobranças, idênticas. Sem consolidação o `b-out3` **tem de sair vazio**, e agora a fotografia cobra isso — saída que só aparece às vezes é onde o lixo de uma passagem anterior se esconde.
2. **Os três casos da aba**: corpos diferentes (código 3 = CSS do preset, apontando para a segunda animação, que está no código 1); mesma animação (um `@keyframes`, e ainda assim o código 3 com a velocidade própria do outro componente); borda fixa (sem código 1, logo sem código 3, caixa limpa e escondida).
3. **O painel, nos quatro estados**: sem consolidação não cita nada e não acusa órfã; preset escolhido e não gerado → cobra a geração; gerado → repassa o CSS **idêntico** ao da aba, com o nome do preset no destino; voltando a "não incluir" → some da tela e do painel sem virar órfã.
4. As 24 combinações do selo, os seis casos do batismo por assinatura, a trava de colisão e a interface — todos intactos. Zero erro de console.
