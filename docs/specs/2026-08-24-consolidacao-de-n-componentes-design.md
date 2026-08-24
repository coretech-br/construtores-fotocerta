# A consolidação passa a aceitar N componentes na mesma página

**Data:** 24/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba **Bordas com efeito** e painel consolidado), `scripts/verificar/geradores.mjs`
**Aprovado pelo dono:** "vamos fazer a N"

---

## 1. O limite era a caixa, não o CSS

A consolidação aceitava **um** preset — logo, dois componentes com efeito de borda por página. Não havia limite técnico nenhum: a Tag Head aceita quantos `@keyframes` existirem, e desde o batismo por assinatura duas animações só se chamam igual quando **são** iguais. O que limitava era o `<select>`, que escolhe um item.

## 2. O que mudou

**A caixa virou lista de marcação.** Um preset por componente, marcados de uma vez. O `<select id="b-consol">` deu lugar a `<div id="b-consol-lista">` com uma caixa por preset — o mesmo desenho que a guirlanda já usa para os enfeites.

**Cinco outros componentes, mais o desta tela.** O teto é `B_CONSOL_MAX`, declarado num lugar só, e a recusa **diz o número** em vez de a ferramenta parar de escrever sem explicar. Ele não é do CSS: é o número de caixas de saída que existem na tela.

**Uma saída por componente**, numeradas: código 3, 4, 5, 6 e 7 — "CSS Customizado do 1º/2º/3º… outro componente". Cada uma nomeia o preset de onde veio, e diz se a animação dela é nova ou já está no código 1.

**O código 1 traz todas as animações**, com um comentário por bloco que aponta o **número da caixa de saída** daquele componente — é isso que liga cada `@keyframes` ao CSS que o usa. E uma regra de movimento reduzido por animação distinta.

## 3. Três decisões

**A ordem é a da BIBLIOTECA, nunca a dos cliques.** É ela que decide qual componente é o "1º outro". Se dependesse da ordem em que o operador marcou, a mesma seleção produziria códigos em posições diferentes entre duas gerações — e ele colaria o CSS num componente diferente do que colou da vez anterior, sem nada mudar na tela. Mesma razão de `bNatalMarcados`.

**Animação repetida não vira bloco repetido, mas vira CSS.** Se dois componentes têm a mesma animação — o que agora é comum, já que a velocidade não entra nos quadros —, o `@keyframes` sai uma vez e o código 1 **diz** por que não apareceu um bloco novo. O CSS de cada um sai do mesmo jeito: cores, fundo e velocidade continuam sendo deles.

**Nome de preset é texto do operador, e não encosta em marcação nem em comentário CSS.** Na lista ele entra por `textContent`; nas caixas de saída, por `createTextNode`; e no comentário do código 1 ele **não entra** — o que identifica cada bloco ali é o efeito (lista fechada nossa) mais o número da caixa. A busca do preset marcado percorre os campos e compara em JavaScript, em vez de montar um seletor CSS com o nome — uma aspa dentro dele quebraria o seletor.

## 4. Compatibilidade

`consol` era uma string com um nome e passou a ser uma lista. `fcListaDe` aceita as duas formas, então o estado gravado antes desta rodada **não perde** a escolha que já estava lá. Ela continua declarada em `fora`: descreve outros componentes e por isso não entra no preset da aba.

## 5. Verificação

1. **Regressão byte a byte**: 17 saídas (as cinco novas entraram na fotografia, e ali as cinco **têm de sair vazias**) e 9 cobranças, idênticas.
2. **Três marcados, um deles com a animação da tela**: três `@keyframes` distintos, o aviso de que o repetido não se repete, os três CSS na **ordem da biblioteca**, as caixas 6 e 7 vazias e escondidas, e cada CSS apontando para uma animação que **está** no código 1. Seis ocorrências de `@keyframes` — três animações × dois blocos.
3. **O teto**: seis marcados → recusa nomeando o número, e o código 1 **não** é reescrito.
4. **Cinco marcados** cabem, com as cinco caixas preenchidas.
5. **Desmarcar** limpa e esconde na hora.
6. **A escolha sobrevive à recarga**, e o formato antigo (um nome em texto) continua sendo aceito.
7. **O painel**, em quatro estados: nada marcado → não cita nada nem acusa órfã; dois marcados sem gerar → cobra os dois; gerado → repassa os dois CSS **idênticos** aos da aba, nomeando cada preset no destino; desmarcado → some sem virar órfã.
8. As suítes do selo, do batismo por assinatura e da trava de colisão, intactas. Zero erro de console.
