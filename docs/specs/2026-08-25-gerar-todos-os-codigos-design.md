# "Gerar todos os códigos" no painel consolidado

**Data:** 25/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (painel consolidado e o registro `ABAS`)
**Pedido do dono:** *"um botão de Gerar Todos os Códigos… percorrerá as abas vinculadas ao preset e vai criar todos os códigos. Caso o preset tenha carregado e algum parâmetro modificado, tais parâmetros deverão estar refletidos nos códigos gerados."*

---

## 1. O que ele faz

Um botão no topo do painel percorre as abas **ligadas naquela página** e clica o *Gerar código* de cada uma. É o passo que o operador fazia a pé, aba por aba, e onde ele esquecia uma — colando a página com um bloco a menos.

O botão **não monta código nenhum**. Quem gera é a própria aba.

## 2. Sobre "parâmetros modificados", que era o centro do pedido

Não foi preciso fazer nada de especial, e isso é a resposta certa: cada gerador lê **os campos da tela** na hora (`bCfgDom`, `cCfg`, `eCfgDom`…). O que estiver na tela é o que sai — inclusive o que foi mudado depois de aplicar o preset.

Se este botão lesse o preset guardado em vez de chamar o gerador, ele seria uma **segunda implementação da geração** — e duas implementações divergem. É a mesma regra que fez a prévia executar o gerador em vez de imitá-lo.

Medido: preset aplicado, `e-qtd` alterado de 60 para 25 na tela, botão clicado → o código saiu com **25** elementos.

## 3. As recusas são juntadas, não empilhadas

Cada gerador recusa com `alert`. Sete abas recusando dariam **sete alertas em fila**, e o operador fecharia os primeiros sem ler.

Durante a volta, o `alert` é trocado por um coletor e devolvido no fim — com `try/finally`, para não ficar trocado se um gerador lançar. Sai **uma** mensagem com o nome de cada aba e o **texto exato** da recusa dela: as palavras são as da aba, não uma tradução do botão.

Nenhum gerador usa `confirm` — conferido nos nove antes de escolher esta técnica.

Abas em só-leitura (que falharam ao restaurar) são **relatadas à parte**, não como recusa: mandar "clique em Gerar" numa aba que não grava nada até recarregar seria mandar dar um passo que não resolve.

## 4. O registro ganhou `gerar`

Cada entrada de `ABAS` passou a declarar a própria função de geração. Antes, a única lista aba→gerador vivia no arnês de verificação — uma lista fechada fora do registro é onde a aba seguinte quebra em silêncio, que é o que este projeto já corrigiu em `trocarAba`.

## 5. Verificação

1. **Regressão byte a byte**: as **21** saídas e as 9 cobranças **idênticas**. O botão não muda o que os geradores escrevem.
2. **O botão só existe quando faz sentido**: não aparece sem preset geral, nem com nenhuma aba ligada.
3. **Uma recusa**: três abas ligadas, a Contagem sem código de campanha → **um** alerta só, nomeando as duas que geraram e a que recusou, com a **palavra exata** da recusa. E a aba que recusou **não escreveu** na caixa.
4. **Sem recusa**: consertada a Contagem, o alerta lista as três e a caixa dela é preenchida.
5. **Parâmetro alterado depois do preset**: 25 elementos, como estava na tela.
6. **Aba desligada não entra** na geração.
7. **O `alert` volta ao normal** depois da volta — medido injetando um substituto e conferindo que ele é chamado.

## 6. O botão nasceu invisível, e por que o teste não pegou

Publicado, o botão **não apareceu** para o dono. A caixa dele reaproveitava a classe `.fcc-atalho` — que é `display:none` por padrão e só ganha estilo dentro de `@media (max-width:1399px)`. Ela existe para um aviso que só faz sentido em tela estreita. Aparência parecida não é classe reaproveitável.

**E o teste passou assim mesmo, por dois motivos somados:**

1. Ele conferia se o botão **existia no DOM** (`querySelector`), e ele existia — invisível, mas presente. Existir não é aparecer.
2. Ele rodava na janela padrão do arnês, de **1280 px** — dentro da faixa em que aquela classe fica visível. Medir numa largura só escondeu o defeito justamente na largura em que o dono estava.

As duas coisas foram corrigidas: a caixa tem classe própria (`.fcc-gerar`), e o roteiro passou a exigir **visibilidade** (`offsetParent` e largura maior que zero) em **1280 px e 1600 px**.
