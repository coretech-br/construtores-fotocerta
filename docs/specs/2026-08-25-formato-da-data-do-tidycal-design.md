# O formato da data da página de obrigado

**Data:** 25/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba **Agendamento TidyCal**), `scripts/verificar/geradores.mjs`
**Pedido do dono:** "quero o formato selecionável no construtor"

---

## 1. O que aconteceu

O dono publicou a página de obrigado e a data chegou **em inglês**: `Monday, October 12, 2026`.

Medido, com o bloco rodando: o TidyCal manda a data em **dois formatos diferentes**, conforme a variável.

| variável do TidyCal | marcador | o que chega |
|---|---|---|
| `{{booking.date}}` | `{{data}}` | `Monday, October 12, 2026` — **inglês por extenso** |
| `{{booking.starts_at}}` | `{{quando}}` | `2026-10-12T15:00:00-03:00` — **técnico** |

A opção que existia, *"Reescrever em português"*, só conhecia o formato **técnico**, e só era aplicada ao `{{quando}}`. O dono estava usando `{{data}}` e `{{hora}}` — então a reescrita, ligada, **não fazia nada**, e a ferramenta **não dizia**. Limite conhecido e não contado é o que este projeto trata como defeito.

## 2. O que passou a existir

**Formato selecionável**, quatro opções, valendo para `{{data}}` **e** para `{{quando}}`:

- Como o TidyCal mandar
- `12/10/2026`
- `12 de outubro de 2026`
- `segunda-feira, 12 de outubro de 2026`

**Reconhece os dois formatos de entrada** — o técnico e o inglês por extenso, este com o mês por nome inteiro ou abreviado em três letras. **O que não casar com nenhum sai exatamente como veio:** a página nunca inventa data. É a mesma regra de antes, agora com o alcance certo.

**O horário entra só onde ele existe:** o `{{quando}}` traz data e hora, e ganha o `às 15:00`; o `{{data}}` é data seca e não ganha.

**O dia da semana é CALCULADO**, e não lido do texto em inglês. Assim ele sai igual venha o valor no formato técnico (que não tem dia da semana) ou no inglês (que tem). Conferência cruzada na medição: o TidyCal diz `Monday` e o cálculo independente diz `segunda-feira`.

**Zerado na origem:** em "como o TidyCal mandar" as tabelas de meses e dias e o leitor de data **não são emitidos** — o bloco entregue não carrega maquinaria que não vai usar. Medido no diff: o bloco perde treze linhas e ganha quatro.

## 3. Compatibilidade

O valor `bonito`, nome da única opção de reescrita até esta rodada, é lido como `curto` — que é exatamente o que ele produzia. Estado gravado antes não perde a escolha.

## 4. Uma lacuna do arnês, fechada junto

As saídas **4** (endereço de redirecionamento) e **5** (Tag Body da página de obrigado) existiam desde 23/08/2026 e **nunca tinham sido fotografadas**. Entraram agora — e com o recurso **ligado** no cenário, porque acrescentá-las desligado deixaria as duas vazias nas duas árvores e a comparação passaria com folga sobre nada.

O cenário mantém o formato no padrão, de propósito: os valores novos não existem na árvore de referência, e pedi-los derrubaria a captura inteira. Os quatro formatos são cobertos pelo roteiro próprio da rodada.

## 5. Verificação

1. **Os quatro formatos × os quatro casos de entrada** (inglês por extenso, técnico, mês abreviado, formato desconhecido), com o bloco executando numa página: 16 combinações, todas corretas, zero erro. O **formato desconhecido sai intacto** nos quatro formatos.
2. **Regressão**: as **20** outras saídas e as 9 cobranças idênticas. A única divergência é a `t-out5`, intencional.
3. **A saída 4 não mudou** — provado byte a byte. O endereço colado no TidyCal **não precisa ser refeito** por causa do formato.
4. O diff da `t-out5` no modo "como veio" mostra exatamente a troca do leitor técnico pelo trecho de quatro linhas.
