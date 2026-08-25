# Efeitos de página: proporção no celular, prévia de celular e mais três efeitos

**Data:** 24/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba **Efeitos de página**)
**Pedido do dono:** prévia de celular, "calcular uma proporção e não o tamanho exato" no celular, e mais três efeitos

---

## 1. O que o uso revelou

O dono publicou a neve e voltou com duas observações, as duas certas:

1. **Faltava a prévia de celular** — as outras abas têm, esta não tinha. Ele teve de colar na landing para ver.
2. **No celular os flocos ficaram visualmente maiores.** Não era impressão: um floco de 24 px ocupa **2 %** da largura num computador de 1200 px e **6 %** num celular de 390 px. Mesmo tamanho, três vezes mais presença.

## 2. A proporção: por que não é um `@media`

Um `@media (max-width: 640px)` que reduzisse o tamanho resolveria o caso do celular, mas com um **degrau**: um tablet de 700 px continuaria com o tamanho de computador, e a 639 px o floco encolheria de uma vez. O que o dono descreveu — *"calcular uma proporção"* — é outra coisa, e é melhor.

O tamanho passou a ser **proporcional à largura da tela, com piso e teto**:

```
clamp(<piso>px, <k>vw, <teto>px)
```

- **teto** = o tamanho pedido, que vale de 1200 px para cima;
- **k** = `teto / 1200 * 100`, então numa tela de 1200 px o valor é exatamente o teto;
- **piso** = a porcentagem que o operador escolher (campo novo **"Tamanho no celular"**, padrão 45 %).

Com 100 % piso e teto coincidem e o `clamp` **não é emitido** — o número sai puro, como antes. Medido: num quadro de 1000 px o floco sai com 10 px; a 390 px, com 5,4 px.

**Por que os três números são escritos prontos, e não calculados com `var()`:** multiplicar duas medidas (px por vw) não existe em CSS. `calc(var(--t) * 100vw / 1200)` é inválido. Então quem calcula é o gerador.

A mesma escala vale para a **deriva lateral**, o **desfoque** da aurora e o **tamanho das lâmpadas** — tudo que é uma medida em pixels e deveria encolher junto.

## 3. A prévia de celular

Dois botões, no mesmo padrão da Contagem regressiva: o `<iframe>` passa a ter **390 px** de largura lógica no modo Celular e 1000 px no de Computador, reduzido por `transform: scale` do lado de fora.

O iframe aqui não é convenção — é o que torna a medida **honesta**. A proporção depende de `vw`, e `vw` dentro de um iframe é a largura **do iframe**. Sem ele, o modo Celular mostraria o tamanho de computador com a moldura de celular, que é pior do que não mostrar.

## 4. Os três efeitos novos

**Confete caindo** — a **mesma máquina** da neve: o que muda é a peça desenhada (um retângulo colorido em vez do caractere de neve) e o giro, que passa a ser `rotate3d(1,1,0,900deg)` para o papel "virar" enquanto cai. Quatro cores que se alternam. Como a engrenagem é a mesma, ele compartilha os campos de quantidade, tamanho e deriva — não por coincidência, mas porque é a mesma configuração.

**Fundo animado (aurora)** — três manchas desfocadas que se movem devagar. Duas decisões vieram da medição: elas são **translúcidas** (`opacity: .5`) e de **tamanhos diferentes**; na primeira versão eram opacas e iguais, e o resultado na tela foi **uma cobrindo o bloco inteiro** — fundo chapado, não aurora. Translúcidas elas se somam onde se cruzam, que é o efeito.

O alcance "página inteira" usa `z-index: -1` e vem com **aviso âmbar**: um fundo precisa ficar atrás do conteúdo, e de um componente do Prosite não dá para garantir isso — se o tema pintar o fundo das seções, a aurora some atrás dele. No alcance "bloco" ela **é** a seção, e sempre aparece.

**Luzes piscando** — um cordão de lâmpadas no topo. O fio é a própria `border-top` da camada; as lâmpadas se distribuem com `justify-content: space-around`. Quatro animações compartilhadas (uma por cor) e um **atraso escalonado** por lâmpada, que é o que faz o cordão piscar em **onda** e não em bloco.

## 5. O que cada efeito não faz

Cada um declara os próprios limites, na tela, num quadro ao lado dos campos. Não é enfeite: é onde fica registrado que o confete não "estoura" num clique (sem JavaScript não há como), que a aurora pode sumir atrás do fundo do tema, e que as lâmpadas não podem ter espaçamento irregular sem uma regra por lâmpada.

## 6. Verificação

1. **Regressão byte a byte:** as **17** saídas anteriores e as 9 cobranças **idênticas**. A única divergência é `e-out1` — a Tag Head desta própria aba, que mudou por causa da proporção. Intencional, e é o que o script pede que se declare.
2. **Os quatro efeitos**: geram sem recusa, com a classe própria, o número certo de elementos e de animações, a marca própria de cada um (`\2744`, `rotate3d`, `filter: blur`, `border-top`), `pointer-events: none`, regra de movimento reduzido, **100 % ASCII** e sem `<` ou `>` no CSS.
3. **Os grupos de campos**: cada efeito mostra os seus e esconde os dos outros — as dezesseis combinações conferidas.
4. **A proporção**: o `clamp` lido de volta do código gerado tem piso = 45 % do teto e `vw` = teto/12 (a largura de referência de 1200 px). Com 100 %, o `clamp` **não aparece**.
5. **A prévia**: viewport de 1000 px no modo Computador e **390 px** no de Celular, com o floco medido encolhendo de 10 px para 5,4 px.
6. **Determinismo**, ida e volta pelo armazenamento, e estado gravado **antes** do campo de proporção caindo no padrão (45), não em vazio.
7. **O bloco entregue numa página**, com CPU freada em 6x: os dois alcances corretos, 60 flocos animando, **0,000 s** de estilo+layout em 3 s, e o clique atravessando a camada.
8. 701 ids, nenhum duplicado, zero erro de console.
