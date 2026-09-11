# Limites visiveis nos campos que alimentam API

Pedido do dono em 11/09/2026:

> *"Em varios deles, tem campos que eu digito informacoes e que elas sao utilizadas em API's
> que tem limite de tamanho. Para que nao aconteca problema em producao de texto cortado ou
> falha de processamento, preciso que voce coloque ao lado de tais campos o tamanho maximo
> permitido e a contagem em tempo real. Alem disso nao deve permitir digitar mais do que o
> maximo. Da mesma forma, campos que nao devem permitir caracteres especiais, ifens, espacos,
> devem ter a regra implementada em tempo de digitacao."*

## O que esta em jogo

Hoje **o gerador trunca e limpa em silencio**. O operador digita, o bloco sai cortado, e ele
so descobre na tela do cliente ou na conciliacao do extrato. E exatamente a classe de defeito
que este projeto persegue: **defeito invisivel no lugar de defeito visivel**.

Medido: **so tres campos** tem `maxlength` hoje (`fci-nomer` 25, `fci-cidade` 15,
`b-selo-txt` 40). Todo o resto e cortado depois, sem aviso.

## Os limites REAIS, medidos no codigo

### Pix — BR Code EMV

| Campo | Limite | Regra de caractere | Onde e aplicado hoje |
|---|---|---|---|
| Chave Pix | **77** | por tipo de chave | `PIX_CHAVE_MAX` (fc-compartilhado.js:226) |
| Nome do recebedor | **25** | acento removido no payload | `FC_NOMER_MAX` (541) |
| Cidade | **15** | acento removido no payload | `FC_CIDADE_MAX` (541) |
| Codigo do pedido (txid) | **25** | **so `[A-Za-z0-9]`** | `replace(/[^A-Za-z0-9]/g,'').substring(0,25)` — em **tres** lugares |

### PayPal

| Campo | Limite | Onde |
|---|---|---|
| `name` / `description` do item | **127** | `substring(0,127)` em `fcPpBotoesSrc` (4465/4466) e nos blocos (20002/20003/20009) |
| Valor da cobranca | **999999** | `P_VALOR_MAX` (422) |
| Descricao da cobranca | **200** | `P_DESC_MAX` (429) |

## As decisoes

### D1 — Tamanho: contador ao lado + `maxlength` nativo

O contador mostra `N de MAX`. O `maxlength` impede passar.

**Isto nao viola a regra do projeto de "nunca corrigir no `input`"** — e a distincao importa.
Aquela regra existe porque *corrigir o valor* a cada tecla impede digitar (o clamp numerico
que reescreve "9" enquanto a pessoa ainda ia digitar "95"). `maxlength` nao reescreve nada:
ele recusa o excesso, que seria descartado pelo gerador de qualquer forma. Trocar corte
silencioso por recusa visivel e o proprio objetivo.

### D2 — O contador conta o que SOBRA, nao o que esta na tela

Armadilha medida: o nome do recebedor e truncado em 25 **depois** de `semAcento`, que troca
caractere fora de `[A-Za-z0-9 .,-]` por espaco e colapsa espacos. Um contador que conte a
tela diria "23 de 25" enquanto o payload leva outra coisa.

**O contador aplica a mesma funcao que o gerador aplica**, e conta o resultado. Quando os dois
numeros diferem, o campo diz os dois — a tela e o que vai de verdade.

### D3 — Filtro de caractere: so onde o caractere e RECUSADO, nunca onde e convertido

Esta e a decisao que separa ajuda de estorvo, e ela tem dois lados:

- **Filtra no `input`**: o **codigo do pedido (txid)**. Ali `[^A-Za-z0-9]` e simplesmente
  jogado fora pelo gerador — hifen, espaco e acento nao chegam ao payload. Deixar digitar o
  que nunca vai existir e enganar.
- **NAO filtra**: **nome do recebedor** e **cidade**. Ali o acento e *convertido*, nao
  recusado: o payload leva "Vitoria", e a tela deve continuar aceitando **"Vitória"**, que e
  como se escreve o nome da cidade. Filtrar acento nesses campos impediria o operador de
  escrever certo para consertar um problema que nao existe.

### D4 — Filtrar no `input` preservando a posicao do cursor

Filtro ingenuo reescreve `el.value` e **o cursor salta para o fim** a cada tecla — editar o
meio do texto vira impossivel. Funciona no teste automatico (que digita do inicio ao fim) e
falha no uso real. E obrigatorio preservar `selectionStart`, descontando o que foi removido
antes do cursor. **Isto precisa de prova no navegador editando o MEIO do texto**, nao so o fim.

## O que NAO muda

**Nenhuma saida de gerador.** Isto e interface da ferramenta: a regressao byte a byte tem de
dar **zero divergencia**. O gerador continua truncando e limpando — a mudanca e o operador
passar a ver isso antes, nao o bloco passar a sair diferente.

As correcoes existentes em `change`/`blur` (`fcCampoAjustar`, `pTxidAjustar`, `pValorAjustar`,
`pDescAjustar`, `fcPixChaveAjustar`) **continuam**: elas pegam o caso do texto colado, que nao
passa tecla por tecla.
