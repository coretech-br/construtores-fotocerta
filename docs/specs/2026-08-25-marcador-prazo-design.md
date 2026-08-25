# O marcador `{prazo}` na barra de contagem

**Data:** 25/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba **Contagem regressiva**)
**Pedido do dono:** *"gostaria de colocar uma tag de `{prazo}` para quando a contagem for com data marcada… na mesma campanha, posso criar mensagens com o tempo que falta e também com a data limite"* — e, em seguida: *"que o `{prazo}` ficasse destacado também como o `{contador}`, reaproveitando a mesma configuração da seção 3"*.

---

## 1. O que passou a existir

Ao lado de `{contador}` (o **tempo que falta**), as mensagens aceitam `{prazo}` (a **data limite**). Na mesma barra, uma mensagem pode dizer *"faltam 3 dias"* e outra *"reserve até 21 de dezembro"*.

Quatro formatos, escolhidos na aba: `21/12`, `21/12/2026`, `21 de dezembro`, `21 de dezembro às 23:59`.

## 2. Ele é resolvido na GERAÇÃO, não no navegador

A data é fixa, então o bloco entregue recebe o texto **já pronto**: ele não carrega tabela de meses nem leitor de data. Duas consequências, as duas desejadas:

- o bloco não engorda com maquinaria de formatação;
- a data mostrada é **a que o operador digitou**, e não a mesma data convertida para o fuso de quem está lendo — que é o que um `Date` no cliente produziria. Um prazo comercial é do negócio, não do relógio de quem visita.

## 3. O destaque é o do contador, não uma cópia dele

O prazo sai dentro das **mesmas duas classes** do relógio:

```html
<span class="fcb-rel"><span class="fcb-num">21 de dezembro</span></span>
```

Ou seja, ele herda a **cor de destaque e o peso** configurados na seção 3. Não existe uma segunda configuração de aparência para o prazo — e por isso não existe como as duas divergirem. Medido na tela: `rgb(255, 201, 74)`, peso 700, exatamente o que a seção 3 define.

Duas consequências que precisaram de cuidado:

- **As regras `.fcb-num` e `.fcb-rel` passaram a sair também quando só o prazo as usa**, com o contador desligado — antes elas eram emitidas apenas com o contador ligado, e o prazo sairia sem destaque nenhum.
- **O span do prazo NÃO leva `data-fcb-rel`.** Esse atributo é o alvo que o tick reescreve a cada segundo: com ele, o prazo seria apagado no primeiro tique. Medido: depois de 4,5 s a data continua na tela.

## 4. Só no modo "data marcada"

No modo **abertura** o prazo é de cada visitante (primeira visita mais a duração). Ele existe, mas seria um instante diferente para cada pessoa — *"até as 23:07"* —, data que parece arbitrária e não ajuda ninguém a decidir. Ali o marcador é **removido** do texto, do mesmo jeito que o `{contador}` some quando o contador está desligado.

**E a aba avisa**, em âmbar, só quando isso de fato vai acontecer: modo abertura **e** alguma mensagem pedindo o marcador. Avisar sempre seria ruído; não avisar deixaria o marcador sumir em silêncio.

## 5. Aditivo por construção

A maquinaria do prazo só é emitida quando **alguma mensagem pede o marcador**. Quem não o usa não carrega uma linha a mais — e a saída dessas configurações não muda um byte.

A ordem das três regras de CSS foi preservada de propósito: reordená-las não mudaria nada na tela (são seletores diferentes, sem conflito), mas mudaria os **bytes** da saída de quem já usa o contador.

## 6. Verificação

1. **Regressão byte a byte**: as **21** saídas e as 9 cobranças **idênticas**. Nenhuma divergência — a prova de que a mudança é aditiva.
2. **Os quatro formatos**, lidos de volta do código gerado: `21/12`, `21/12/2026`, `21 de dezembro`, `21 de dezembro às 23:59`.
3. **O bloco entregue executando numa página**: o prazo aparece na barra, dentro de `.fcb-num`, com a cor e o peso do destaque; e **continua lá depois de 4,5 s**, ou seja, o tick não o apaga.
4. **Contador desligado** com o prazo em uso: o destaque continua sendo emitido.
5. **Modo abertura**: a variável não é emitida, o marcador é removido, a palavra `{prazo}` não aparece na barra, e o aviso âmbar aparece na aba — e some ao voltar para data marcada.
6. **Prévia**, persistência pela recarga, e estado gravado **antes** do campo caindo no padrão. 702 ids, nenhum duplicado, zero erro de console.
