# A nona aba: efeitos de página

**Data:** 24/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba nova), `scripts/verificar/geradores.mjs`
**Aprovado pelo dono:** "vamos criar a nona aba de efeitos de página, com esse primeiro efeito de neve caindo"

---

## 1. De onde ela veio

O dono trouxe um efeito de neve em CSS publicado por um desenvolvedor e perguntou se dava para usar. Dava — mas não do jeito que estava. O que a medição mostrou, e que virou o desenho desta aba:

- **O código original é SCSS**, não CSS: precisa ser compilado. Compilado, dá **103 KB** e 250 `@keyframes`.
- **Ele anima `left` e `top`**, que obrigam o navegador a refazer o **layout** a cada quadro. Medido com a CPU freada em 6x, numa janela de 3 s: **1,14 s de estilo+layout, 38 % da linha principal**. A mesma cena animando `transform`: **0,00 s**. Não é a quantidade de flocos — são 250 nos dois casos.
- **Ele não tem `pointer-events: none`.** A camada cobre o container e engole todos os cliques embaixo dela.
- **Ele não tem regra de movimento reduzido.**
- **Uma animação por floco é desperdício:** só a deriva lateral varia dentro dos quadros. Seis animações compartilhadas e uma regra curta por floco levam 60 flocos a **5,9 KB**.

A aba nasce com essas cinco correções embutidas, para que ninguém precise lembrar delas.

## 2. O que a aba gera

Duas saídas, as duas obrigatórias no painel consolidado:

1. **Tag Head da página** — um `<style>` com a base, as seis animações compartilhadas, uma regra por floco e o `@media (prefers-reduced-motion: reduce)`.
2. **Componente HTML** — `<div class="fcef-neve">` com N `<div></div>` dentro. Só `<div>`, como manda o Manual do Prosite.

O caractere do floco entra como **`\2744`**, a fuga CSS: o bloco inteiro sai **100 % ASCII** e atravessa o sanitizador sem risco.

## 3. Os campos

| Campo | Id | Padrão |
|---|---|---|
| Efeito | `e-efeito` | `neve` (único por enquanto) |
| Alcance: página inteira / dentro de um bloco | `e-alcance` | `pagina` |
| Altura do bloco (px) | `e-altura` | `420` — só vale no alcance "bloco" |
| Quantidade de flocos | `e-qtd` | `60` (20 a 200) |
| Cor do floco | `e-cor` | `#FFFFFF` |
| Tamanho do maior floco (px) | `e-tam` | `24` (8 a 60) |
| Duração da queda (s) | `e-vel` | `12` (4 a 40) |
| Deriva lateral (px) | `e-deriva` | `46` (0 a 140) |
| Opacidade | `e-opac` | `1` (0,1 a 1) |

**Um campo de tamanho, não dois.** O gerador varia de 40 % a 100 % do valor. Dois campos (mínimo e máximo) criariam a combinação inválida "máximo menor que o mínimo", que precisaria de recusa — superfície nova para um ganho que ninguém pediu.

**A opacidade vale para a CAMADA, não para o floco.** Os quadros já animam `opacity` para o floco surgir e sumir; um segundo controle de opacidade no mesmo elemento brigaria com a animação e valeria só até o primeiro quadro. Aplicada no container, ela multiplica o conjunto e a animação de cada floco continua intacta.

**"Zerado na origem" na altura:** no alcance "página inteira" o campo fica **à vista, desabilitado, com aviso âmbar**, e o gerador não emite altura nenhuma.

## 4. Os dois alcances, e por que existem os dois

- **Página inteira** (`position: fixed`): a neve cobre a janela e acompanha a rolagem. É o que o dono quer na landing de Natal.
- **Dentro de um bloco** (`position: relative` com altura e `overflow: hidden`): a neve fica presa ao componente.

O segundo não é enfeite: **`position: fixed` quebra** quando qualquer elemento acima na árvore tem `transform`, `filter` ou `perspective` — ele passa a se comportar como `absolute`. Isso é comum em temas, e não dá para saber daqui. O alcance "bloco" é a saída pronta para quando acontecer, dita na ajuda do campo.

A distância da queda muda com o alcance: `112vh` na página inteira, `(altura + 40)px` no bloco. **Percentagem não serve** em `translate3d`: ali ela se refere ao tamanho do próprio floco, não ao do container.

## 5. Determinismo

O sorteio das posições, tamanhos, durações e atrasos sai de um gerador com **semente fixa**, e não de `Math.random`. Duas razões: a mesma configuração precisa produzir os mesmos bytes (é o que a regressão byte a byte mede), e mudar a quantidade de 60 para 61 muda **uma regra**, não sessenta.

O gerador toma os **bits altos** do número sorteado. Com os bits baixos — que num gerador linear são fracos — os flocos saíram em faixas horizontais visíveis na tela. Medido, não deduzido.

**Atraso negativo:** cada floco entra já no meio do percurso, então a página nasce com neve espalhada em vez de todos alinhados no topo esperando a vez.

## 6. Prévia

A prévia **executa o que o gerador escreve**, num `<iframe>` de mesma origem — e aqui o iframe não é convenção, é necessidade: o bloco usa `position: fixed`, e sem o iframe ele cobriria a ferramenta inteira. Junto vêm as quatro obrigações do padrão: o shim de armazenamento (o bloco não tem JavaScript nenhum, mas o shim é do ambiente e custa nada), enchimento para haver o que rolar, debounce de 400 ms com timer único, e montagem só quando a aba é aberta.

## 7. Verificação

1. **Regressão byte a byte** das saídas anteriores: as **17** saídas e as 9 cobranças saíram idênticas. As duas divergências apontadas — `e-out1` e `e-out2` — são as saídas **novas**, e a divergência é intencional: na referência elas não existem. É o que o próprio script pede que se declare.
2. **O arnês passou a pular aba que não existe na árvore.** Sem isso, acrescentar uma aba quebrava a regressão **inteira**: a referência não tem o botão, o clique lança, e nenhuma das outras saídas chegava a ser comparada. A saída da aba ausente fica vazia daquele lado, que é exatamente o que ela é.
3. **O bloco entregue executando numa página que imita o Prosite** (`scripts/verificar/pagina.mjs`): a neve aparece, o custo de estilo+layout fica em zero com a CPU freada em 6x, e um clique atravessa a camada.
4. **Os dois alcances** medidos: fixa cobrindo a janela, bloco presa à altura pedida.
5. **Correção à vista** dos seis campos numéricos (999 → 200, 1 → 20), ida e volta pelo armazenamento, estado gravado antes da aba caindo nos padrões, e o painel consolidado com as duas saídas — cobrando a geração enquanto não gerada, e repassando o código 2 idêntico ao da aba.
6. **Medido na página:** alcance "página inteira" fixo cobrindo a janela (800px) e "bloco" preso à altura pedida (300px); 60 flocos animando nos dois; custo de estilo+layout **0,000 s em 3 s** com a CPU freada em 6x; e o **clique atravessando** a camada nos dois alcances.
7. **Determinismo:** duas gerações seguidas produzem os mesmos bytes, e mudar a quantidade de 60 para 61 preserva as 60 regras anteriores.
8. Nove abas, 665 ids, nenhum duplicado, zero erro de console.

## 8. Uma armadilha de medição registrada

A primeira fotografia do alcance "bloco" mostrou uma página **sem neve**, e isso parecia defeito. Não era: no alcance "bloco" o componente fica no **fim** da página, abaixo da dobra, e a fotografia pegava só a primeira tela. O roteiro passou a **rolar até o bloco** e a contar quantos flocos estão dentro da janela — 58 de 60. Fotografia de tela única não prova ausência: ela prova que naquele recorte não havia nada.
