# Guirlanda de Natal: o sexto efeito da aba Bordas

**Data:** 22/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba Bordas com efeito). **Nenhum arquivo compartilhado** — sem troca de versão.

---

## 1. O pedido

Uma borda com elementos de Natal, com **escolha de um ou mais motivos** (bolas, pisca-pisca, renas, gingerbread, estrelas…) e a opção de **girar ou ficar parado**. Campanha de Natal 2026.

## 2. A restrição que define o desenho

A aba produz duas saídas: o **código 1** vai para a Tag Head do site e só pode conter `@keyframes`; o **código 2** vai para o campo **CSS Customizado do componente** e são **propriedades soltas**, aplicadas direto no elemento raiz — sem seletor, portanto **sem `::before`/`::after` e sem elementos filhos**.

Consequência: cada enfeite tem de ser um `background-image`. É o mesmo mecanismo dos efeitos que já existem — o "listras em movimento" pinta a moldura com um `repeating-linear-gradient` na camada `border-box` e anima o `background-position`. Aqui trocam-se os gradientes por **motivos SVG embutidos como data URI**.

## 3. O que é possível, e o que não é

| | |
|---|---|
| ✅ A guirlanda **circula** pela moldura | `background-position` animado nas quatro tiras: topo para a direita, direita para baixo, base para a esquerda, esquerda para cima |
| ✅ **Parado** | Sem `animation` e sem código 1, como o efeito "borda fixa" |
| ✅ **Multicolorido** | O SVG é um documento completo: quantas cores quiser |
| ❌ Cada enfeite **girando no próprio eixo** | SVG usado como `background-image` é renderizado em modo estático — o navegador não executa animação dentro dele — e não há como criar um elemento por enfeite. Declarado na interface. |

## 4. As decisões

**Paleta híbrida, e ela é o padrão.** Cada motivo tem cores naturais próprias, escritas em hexadecimal no desenho (gingerbread marrom, rena marrom, bengala vermelha e branca), mais dois pontos que seguem a campanha: `{A}` (destaque) e `{B}` (secundária). Um interruptor `b-nt-paleta` escolhe de onde vêm os dois:

- `campanha` (padrão): `{A}`=`b-c1`, `{B}`=`b-c2` — os motivos combinam com o resto da página.
- `natural`: `{A}`=`#C62828`, `{B}`=`#F4C430` — vermelho e dourado de Natal, independente das cores da aba.

`currentColor` **não funciona** dentro de SVG-como-fundo: o documento não enxerga o `color` do componente. Por isso as cores são gravadas pelo gerador no momento de gerar — e trocar as cores exige gerar e colar o código 2 de novo, que é o que esta aba já pede a cada mudança.

**Duas tiras, não uma.** O topo e a base usam um ladrilho **horizontal** (`repeat-x`); as laterais usam um ladrilho **vertical** (`repeat-y`) com os mesmos motivos empilhados, para eles ficarem em pé nos quatro lados. Dois data URIs; é o preço de não poder rotacionar uma camada de fundo.

**Cantos opcionais, e ligados por padrão.** Quatro camadas `no-repeat` com o primeiro motivo escolhido, uma em cada canto, **acima** das tiras. É o que faz o resultado ler como moldura em vez de borda listrada.

**A espessura da borda é o tamanho do motivo.** Um desenho reconhecível pede 24–48 px, e o campo `b-esp` da aba vai só até 20. Em vez de mexer na faixa de um campo compartilhado com os outros cinco efeitos, este efeito usa o seu próprio `b-nt-tam` (16–64, padrão 34) como largura da borda, e o `b-esp` fica **à vista, desabilitado, com aviso âmbar** — o padrão que a ferramenta já usa em cinco lugares.

**A base da faixa é o `b-c3`.** A cor atrás dos motivos reaproveita um campo que já existe (hoje usado só pelo brilho giratório), em vez de criar um sétimo campo de cor.

**Nenhum motivo escolhido é recusa, não silêncio.** Sem motivo não há guirlanda, e o gerador recusa nomeando o campo — mesmo critério da recusa "marque pelo menos uma unidade" da Contagem.

## 5. A ordem das camadas, que é o efeito

Da frente para trás:

1. o miolo, `padding-box` — cobre o meio e é o que confina os motivos à faixa
2. os quatro cantos, `no-repeat`, `border-box`
3. as quatro tiras: topo e base (`repeat-x`), esquerda e direita (`repeat-y`), `border-box`
4. a cor de base da faixa, `border-box`

`background-position` é uma lista por camada, e é ela que a animação move — só as quatro tiras andam; miolo, cantos e base ficam parados.

## 6. Acessibilidade

A aba já redefine a própria animação com um único quadro dentro de `@media (prefers-reduced-motion: reduce)`, em vez de matar as animações do site inteiro. A `fc-borda-natal` entra na mesma disciplina: a guirlanda **para e continua à vista**.

## 7. O invariante desta rodada

Os **cinco efeitos que já existem** têm de sair byte a byte idênticos, e as **12 saídas** dos oito geradores também. Nada aqui muda o que a ferramenta já produzia.

## 8. O limite que só o dono fecha

Se o campo **CSS Customizado do Prosite** aceita alguns KB de CSS com data URI. O SVG vai **URL-codificado** (`%3Csvg`), então nenhum `<` chega ao sanitizador — mas isso é raciocínio, não medida. Uma colagem na página real resolve. Por isso a interface mostra o **tamanho em bytes** do código 2.


---

## 9. O que a implementação acrescentou ao desenho

**Os desenhos aparecem três vezes no texto, e não oito.** Escrito direto, o ladrilho horizontal saía duas vezes (topo e base), o vertical duas (esquerda e direita) e o canto **quatro**. Guardando cada um numa **propriedade customizada** (`--fcn-h`, `--fcn-v`, `--fcn-c`) e referenciando por `var()`, cada desenho aparece uma vez só. Propriedade customizada é uma declaração solta como qualquer outra, então cabe no campo do componente do mesmo jeito que `border` cabe.

**A codificação não é `encodeURIComponent`.** A primeira versão usava, e o desenho **inflava 4,5 vezes**: ela escapa a aspa dupla e o espaço, que são os dois caracteres mais frequentes num SVG, e cada um vira três bytes. O que precisa mesmo de fuga dentro de `url("…")` é `%`, `#`, `<` e `>` — e é o `<` que também tira o sanitizador do Prosite do caminho. A aspa dupla é **trocada** por aspa simples dentro do SVG (XML aceita as duas) e o espaço fica literal.

**As duas medidas juntas, com os sete enfeites: de 68 KB para 22 KB.**

| Configuração | Código 2 |
|---|---|
| um enfeite | 2,5 KB |
| três enfeites | 5,1 KB |
| dois enfeites, 64 px, sem espaço | 4,2 KB |
| **os sete** | **22 KB** |

**Os sete motivos foram desenhados e conferidos** a 32 px e 64 px, sobre fundo claro e escuro: bola, estrela, pisca-pisca, rena, gingerbread, bengala doce e floco de neve. Entre três e cinco áreas de cor chapada cada, mais o contorno `#2B2118`. Todos usam `{A}`; seis usam `{B}`.

## 10. Verificação

- **O invariante:** as **12 saídas** dos oito geradores e as **9 cobranças** (bloco e link) saíram byte a byte idênticas à `main` (`465d65b`). Os cinco efeitos que já existiam não mudaram um caractere.
- **O CSS gerado, aplicado num elemento de verdade** — servido numa página à parte, com o código 1 no `<head>` e o código 2 no atributo `style`, exatamente como o Prosite aplica, e toda a rede externa abortada. Seis cenários: um enfeite, três, os sete na paleta natural, parada sem cantos, girando sem cantos, e 64 px com espaço zero. Em cada um: o número de camadas confere (4 tiras + 4 cantos, ou 4 sem cantos), o SVG chega **URL-codificado sem nenhum `<` literal**, a borda tem a espessura do enfeite, a animação é `fc-borda-natal` quando gira e `none` quando parada, e o `background-position` **muda** girando e **não muda** parada. Zero erro de JS.
- **Movimento reduzido:** a guirlanda **para** e as oito camadas continuam lá.
- **A recusa:** sem nenhum enfeite marcado, o gerador recusa nomeando o campo e não escreve nada.
- **Na interface:** os campos aparecem só neste efeito, a espessura desabilita com aviso âmbar, o campo de ciclo some com a guirlanda parada, a **prévia** desenha as oito camadas e anima a `fc-borda-natal`, e o preset de aba guarda e devolve os enfeites e o tamanho, com o resumo nomeando-os. **582 IDs, nenhum repetido**, zero erro de console.
- **Norma:** ES5, zero acento no código dos motivos, nenhuma at-rule no código 2.
