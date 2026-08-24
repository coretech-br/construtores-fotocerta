# O nome da animação passa a sair do conteúdo dela

**Data:** 24/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba **Bordas com efeito**) — nenhum arquivo compartilhado
**Aprovado pelo dono:** alternativa B, com publicação ao final

---

## 1. O defeito que o dono encontrou, e o que a medição acrescentou

Ele quis dois componentes com **brilho giratório** na mesma página, um deles com o selo "MAIS ESCOLHIDO". A ferramenta recusou consolidar, dizendo que os dois usam o mesmo efeito. O diagnóstico dele estava certo: **o selo muda o conteúdo da animação** — a lista de `background-position` cresce junto com a lista de camadas — mas o nome continua sendo `fc-borda-brilho`.

Medido, quatro corpos diferentes com um nome só:

| configuração | primeiro quadro | nome |
|---|---|---|
| brilho sem selo | `0 0, 0% 0%` | `fc-borda-brilho` |
| brilho + selo circular | `top 10px right 10px, 0 0, 0% 0%` | `fc-borda-brilho` |
| brilho + faixa | `top center, top left, 0 0, 0% 0%` | `fc-borda-brilho` |
| brilho + fita | `top right, 0 0, 0% 0%` | `fc-borda-brilho` |

**E a doença é mais velha que o selo.** Medido sem selo nenhum:

- **listras** com espessura 10 × 22 → corpos **diferentes**, mesmo nome. Colidiam.
- **halo pulsante** com halo 26/0,35 × 60/0,8 → corpos **diferentes**, mesmo nome. Colidiam.
- **brilho** com velocidade 4 × 12 → corpo **idêntico**. Funcionariam juntos sem problema — e a ferramenta **recusava assim mesmo**.

A regra antiga errava nas duas direções: recusava o que funcionaria e não protegia o que colidia. Ela olhava o **tipo do efeito**; o que importa é o **conteúdo da animação**.

## 2. A correção

O nome deixa de ser o tipo do efeito e passa a ser o tipo **mais uma assinatura curta do próprio `@keyframes`**:

```
fc-borda-brilho  ->  fc-borda-brilho-a3f2
```

A assinatura é um FNV-1a de 32 bits sobre o texto dos dois blocos (o `@keyframes` e o de movimento reduzido), reduzido a quatro dígitos hexadecimais.

**A propriedade que faz isso funcionar: o nome é função pura da configuração.** Os dois códigos do mesmo componente — a Tag Head e o CSS do componente — são gerados da mesma configuração, então eles **sempre concordam**, mesmo tendo sido gerados em momentos diferentes. Um esquema que numerasse ("-2") na hora de consolidar não teria essa propriedade: o código 2 do outro componente já estava colado com o nome antigo.

**Consequências, todas na direção certa:**

- Configurações **diferentes** → nomes diferentes → convivem no mesmo campo, sem que uma apague a outra.
- Configurações **iguais** → nome igual → um `@keyframes` só serve aos dois. A ferramenta passa a dizer isso, em vez de recusar.
- Vale para **listras, halo pulsante e guirlanda** também, e para qualquer efeito futuro cujo `@keyframes` dependa de parâmetro — sem precisar lembrar de nada.

## 3. A recusa muda de papel

Ela não some: passa a ser o que deveria ser desde o começo — uma trava contra **colisão de assinatura**. Ela compara os corpos, não os tipos:

- nomes iguais **e** corpos iguais → não há o que consolidar; o código 1 sai com um bloco só e uma linha dizendo por quê.
- nomes iguais **e** corpos diferentes → só pode ser colisão de hash (uma em ~65 mil por par). Recusa, nomeando o preset.

## 4. O custo, dito por inteiro

O nome muda em tudo que for **regerado**. O que já está colado no site continua funcionando — nada quebra sozinho. Mas ao regerar um componente, **os dois códigos dele precisam ser recolados, em par**: o código 2 novo aponta para um nome que só existe no código 1 novo. Colar só um deles deixa o componente **sem animação** — parado e sem erro na tela, que é justamente o tipo de falha silenciosa que este projeto persegue. Por isso o aviso vai **na tela**, ao lado do código 1, e não só nesta spec.

## 5. Verificação

1. **A diferença é só o nome.** As 12 saídas dos oito geradores comparadas com as de `main`, com o sufixo `-xxxx` removido por regex: têm de ficar **byte a byte idênticas**. É o que separa "renomear" de "mudar o gerador".
2. **Nomes diferentes para corpos diferentes**, nos casos medidos acima: brilho com cada uma das três formas de selo e sem selo (quatro nomes distintos), listras 10 × 22, pulso 26/0,35 × 60/0,8.
3. **Nome igual para corpo igual**: brilho velocidade 4 × 12.
4. **A consolidação**, nos três desfechos: dois corpos diferentes → dois `@keyframes` no bloco; dois corpos iguais → um bloco e a linha explicando; e a trava de colisão exercitada por injeção.
5. **O nome usado no `animation:` do código 2 existe no código 1** — a conferência que prova que os dois lados concordam.
6. Prévia continua desenhando, zero erro de console.
