# Selo de destaque na borda: marcar o pacote do meio

**Data:** 24/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba **Bordas com efeito**) — nenhum arquivo compartilhado, nenhum outro gerador
**Aprovado pelo dono:** as três formas à escolha, a ênfase entra, o pulsante fica de fora

---

## 1. O que o dono pediu, e por que a resposta não foi só "sim"

O pedido: *"uma opção para colocar na área superior da borda um texto customizado (ex.: 'O preferido', 'Mais escolhido') como destaque"*, para marcar o pacote do meio numa página de três. Cor de fundo e cor do texto configuráveis.

Ele pediu junto uma coisa que este projeto costuma fazer e que aqui valeu a pena: *"se tiver alguma ideia de design melhor que a minha, me apresente"*. Foram desenhadas as três formas praticadas no mercado e medidas numa página real de três cartões. O que a medição mostrou:

- **A faixa no topo** é a única que **nunca encosta no texto**, porque ela empurra o conteúdo para baixo.
- **O selo circular** — sugestão do próprio dono — é o que mais parece um carimbo, e é o clássico de "mais vendido". Fica sobre a área de conteúdo e precisa de um respiro.
- **A fita diagonal** cabe pouco texto e é a mais frágil das três.
- **A ênfase (escala e sombra) faz mais do que o selo sozinho**: no mockup o olho vai ao cartão antes de ler a palavra. O selo diz *por quê*; a elevação é o que faz **olhar**.

As três entram, à escolha, mais a ênfase como interruptor separado.

## 2. O pulsante ficou de fora, e a razão é técnica antes de ser estética

O selo é uma **camada de fundo**. Pulsar seria animar o tamanho/posição dessa camada — e **brilho giratório, degradê contínuo, listras e guirlanda já animam `background-position`**. Um elemento tem uma `animation` e uma lista de `background-position`: a segunda animação apagaria a primeira. O pulso só conviveria com **borda fixa** e **halo pulsante**, e nos outros quatro precisaria do tratamento "zerado na origem".

Some-se a isso o que a medição do mockup mostrou sobre ênfase: num cartão de preço a elevação entrega mais atenção que o pulso, sem o custo de credibilidade de um anúncio piscando. O dono decidiu deixar fora.

## 3. As três descobertas que o mockup entregou, e que mudam o desenho

**a) Borda sólida é pintada POR CIMA do fundo.** A primeira versão da faixa punha a cor no `border-color` e desenhava a pílula como `background-image` com `background-origin: border-box`. O SVG não aparecia — o `border-color` cobria tudo. A faixa **não pode vir da borda**: ela vem de uma camada do próprio fundo, e o respiro que impede a sobreposição vem de `padding-top`, não de `border-width`. Como bônus, isso a torna compatível com **todos os seis efeitos**, inclusive os que usam a borda para desenhar.

**b) Texto de SVG estoura o desenho em silêncio.** "ESCOLHIDO" saía para fora do selo e "DESTAQUE" para fora da fita. O desenho passa a **medir o texto** e, quando ele não cabe, aplicar `textLength`/`lengthAdjust` — o texto encolhe dentro do desenho em vez de vazar. Isto é ajuste do desenho, não reescrita do campo do operador: o que ele digitou continua lá.

**c) Aspas.** Dentro de `url("...")` o SVG usa aspas simples (é o que `bDataUri` já faz). O selo não pode introduzir aspas duplas nem simples cruas em atributo nenhum.

## 4. O que aparece na aba

Fieldset novo **"Selo de destaque (opcional)"**, na coluna direita da seção 2:

| Campo | Id | Padrão |
|---|---|---|
| Forma: Não usar / Faixa no topo / Selo circular / Fita diagonal | `b-selo` | `nao` |
| Texto do selo | `b-selo-txt` | `MAIS ESCOLHIDO` |
| Cor de fundo do selo | `b-selo-f` | `#9C5638` |
| Cor do texto do selo | `b-selo-c` | `#FFF6D8` |
| Tamanho | `b-selo-tam` | `28` (faixa 18–160) |
| Destacar o cartão (escala + sombra) | `b-selo-eleva` | `nao` |

**Um campo de tamanho só, com significado por forma** — altura da faixa, diâmetro do selo, lado da fita —, dito na ajuda. Dois ou três campos numéricos para a mesma ideia é mais superfície para divergir, e trocar o número do operador ao mudar de forma é exatamente o que este projeto recusa em outro lugar (o limiar de urgência).

**Nenhuma cor nova entra na `FCI_PALETA`.** Fundo e texto do selo são cores **deste componente**, como já são `b-c1` e `b-c2` — não significam "destaque da campanha".

## 5. Como cada forma é montada

Todas: uma ou duas camadas de `background`, com origem no **padding box**, e um `padding-top` que garante o respiro.

- **Faixa** — duas camadas: a pílula (SVG, `auto <tam>px`, `top center`) sobre uma tira lisa (`linear-gradient`, `100% <tam>px`, `top left`). Respiro `tam + 16`.
- **Selo** — uma camada: roseta serrilhada de 28 pontas com até duas linhas de texto, `<tam>px <tam>px`, no canto superior direito com folga de 10 % do tamanho. Respiro `round(tam/2) + 12`. O texto quebra em duas linhas no espaço mais próximo do meio, e cada linha se ajusta se não couber.
- **Fita** — uma camada: triângulo no canto com o texto girado 45°, `<tam>px <tam>px`, `top right`. Sem respiro: ela ocupa canto, não topo.

## 6. As três colisões de CSS, e como cada uma é resolvida

Esta é a parte que faz a diferença entre funcionar e falhar em silêncio.

**a) A lista de camadas.** Nos efeitos **brilho, degradê, listras e guirlanda** o `background` já é uma lista de camadas com `background-size` e `background-position` paralelos. O selo **entra nessas mesmas listas, na frente** — nunca como uma segunda regra de `background`, que apagaria a primeira por inteiro (a regra de CSS gerado deste projeto).

**b) Os `@keyframes` que animam `background-position`.** Se a lista de camadas cresce e a lista dentro do `@keyframes` não, o navegador cicla os valores e a animação anda na camada errada. As posições do selo são **prefixadas nos dois quadros** (`keys` e `keysRm`), com o mesmo valor nos dois — o selo fica parado enquanto a borda gira.

**c) `box-shadow`.** O halo já emite `box-shadow`, e a sombra da elevação é uma segunda. As duas se **acumulam numa declaração só**. No **halo pulsante** é diferente: ali o `box-shadow` é animado por inteiro nos `@keyframes`, e uma declaração estática seria sobreposta 100 % do tempo — então a sombra da elevação entra **dentro dos quadros**, nos três pontos do `keys` e no ponto do `keysRm`.

Nos efeitos **borda fixa** e **halo pulsante** o `background` não é lista: ali o selo sai como `background-image` mais os três longhands, **depois** das declarações de fundo — assim ele convive inclusive com "não mexer no fundo".

## 7. Recusas

- Forma escolhida e **texto vazio** → recusa nomeando o campo. Selo sem texto é um borrão colorido.
- Nada mais. Texto longo demais **não é recusa**: ele encolhe dentro do desenho, e a prévia mostra.

## 8. Verificação

1. **Regressão byte a byte** das 12 saídas e das 9 cobranças — com o selo em "não usar" (o padrão de fábrica), nenhuma saída pode mudar **um byte**. É a prova de que a mudança é aditiva.
2. **As seis combinações efeito × selo** medidas numa página que imita o Prosite (`scripts/verificar/pagina.mjs`): o selo aparece, a animação da borda continua correndo, e a lista de `background-position` do `@keyframes` tem o mesmo comprimento da lista de camadas.
3. **Elevação com halo** (uma declaração, duas sombras) e **elevação com pulso** (sombra dentro dos quadros), lidas no CSS emitido.
4. **Recusa do texto vazio** na interface.
5. **Peso**: o SVG do selo entra no `bPeso` como qualquer outra camada.
