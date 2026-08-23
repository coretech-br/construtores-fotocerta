# Guirlanda de Natal — plano de implementação

> **Para quem executa:** as tarefas são sequenciais e cada uma termina num estado conferível. Este projeto **não tem framework de teste**: a verificação é feita por arnês de navegador em `scratchpad/` (Playwright headless sobre a árvore servida por HTTP). Onde o plano diz "rodar", é um comando de verdade.

**Objetivo:** acrescentar à aba *Bordas com efeito* um sexto efeito, `natal`, que desenha uma guirlanda de motivos de Natal na moldura do componente, com escolha múltipla de motivos, paleta híbrida e movimento opcional.

**Arquitetura:** os motivos são SVG embutidos como data URI em camadas de `background` sobre o elemento raiz — único recurso disponível, porque o código 2 são propriedades soltas sem seletor. Quatro tiras (duas horizontais, duas verticais) mais quatro cantos, com `background-position` animado só nas tiras.

**Pilha:** JavaScript ES5 dentro do `index.html`, CSS gerado como texto. Nenhuma dependência nova, nenhum arquivo compartilhado tocado.

## Restrições globais

- **ES5** em todo o código da ferramenta: `var`, sem arrow, sem template string, sem `let`/`const`.
- **Sem acento em código**; acento só em texto visível de interface (Manual do Prosite, item 10).
- **Prefixo `b-`** em todo campo novo da aba; a animação chama-se `fc-borda-natal`.
- **Nenhuma at-rule no código 2** — `@keyframes` só no código 1.
- **Invariante:** os cinco efeitos existentes e as 12 saídas dos oito geradores saem **byte a byte idênticos**. Referência: `main` em `465d65b`, fotografada em `scratchpad/final3.json` (recapturar se necessário).
- **Campo desabilitado leva aviso âmbar**, nunca some da tela.
- Faixa numérica nova entra em `B_NUMS` **e** no atributo `max` do input — os dois lados, sempre.

---

### Tarefa 1: o registro de motivos e o codificador

**Arquivos:** modificar `index.html` (bloco de utilidades da aba Bordas, junto de `B_NUMS`).

**Produz:** `B_NATAL_PECAS` (lista de `{id,nome,w,corpo}`), `bNatalSvg(pecas,gap,vertical,corA,corB)` → string SVG completa, `bDataUri(svg)` → `url("data:image/svg+xml,...")`.

- [ ] **Passo 1** — colar o `B_NATAL_PECAS` produzido pelo subagente (arquivo `scratchpad/motivos.js`), conferindo antes o contato visual `scratchpad/motivos-contato.png`: os sete motivos têm de ser reconhecíveis a 32 px sobre fundo claro **e** escuro.
- [ ] **Passo 2** — escrever `bNatalSvg`. Horizontal: os motivos lado a lado, cada um em `translate(x,0)`, largura total = soma das larguras mais `gap` entre eles e nas pontas; `viewBox="0 0 TOTAL 100"`. Vertical: os mesmos motivos empilhados, `viewBox="0 0 MAIOR_W ALTURA"`, cada um centrado horizontalmente.
- [ ] **Passo 3** — escrever `bDataUri`. Codificar com `encodeURIComponent` **e** devolver `#` como `%23` (o `encodeURIComponent` não escapa `#`). Envolver em `url("…")`. Nenhum `<` literal pode sobrar — é isso que tira o sanitizador do Prosite do caminho.
- [ ] **Passo 4** — conferir no console do navegador que `bDataUri(bNatalSvg(...))` não contém `<`, `>` nem `#`.

Rodar: `node scratchpad/motivos-conferir.mjs`

---

### Tarefa 2: os campos na interface

**Arquivos:** modificar `index.html` (painel `painel-bor`, fieldset "Efeito da borda" e um fieldset novo).

- [ ] **Passo 1** — acrescentar o rádio `<input type="radio" name="b-efeito" value="natal">` com o rótulo *Guirlanda de Natal (enfeites na moldura)*, depois de "Listras em movimento".
- [ ] **Passo 2** — criar o fieldset `b-natal-campos` (escondido por padrão) com: os sete checkboxes `b-nt-<id>`; `b-nt-mov` (`girar`|`parado`); `b-nt-paleta` (`campanha`|`natural`); `b-nt-cantos` (`sim`|`nao`); `b-nt-tam` (número, 16–64, padrão 34, `max="64"`); `b-nt-gap` (número, 0–60, padrão 18, `max="60"`).
- [ ] **Passo 3** — escrever os textos de ajuda: o que a paleta híbrida faz; que **cada enfeite não gira no próprio eixo** e por quê; e o aviso âmbar `b-esp-aviso` para quando o efeito é `natal`.
- [ ] **Passo 4** — acrescentar `['b-nt-tam',34,16,64,true]` e `['b-nt-gap',18,0,60,true]` a `B_NUMS`.
- [ ] **Passo 5** — atualizar a `<p class="descricao">` do painel: passa de "Cinco efeitos" para seis, nomeando o novo.

Rodar: abrir a ferramenta, escolher o efeito, ver os campos aparecerem. `node scratchpad/rodar.mjs` para confirmar que nada mais mudou.

---

### Tarefa 3: estado, preset e toggles

**Arquivos:** modificar `index.html` (`bColeta`, `bCfgDom`, `bCfgPreset`, `bRestaura`, `bToggles`, `B_EFEITO_NOME`, `bPresetResumo`, restaurar padrões).

**Consome:** os ids da Tarefa 2.

- [ ] **Passo 1** — `bCfgDom` e `bCfgPreset` passam a devolver `ntMotivos` (array de ids na ordem fixa de `B_NATAL_PECAS`), `ntMov`, `ntPaleta`, `ntCantos`, `ntTam`, `ntGap`. Ausente no preset antigo = o padrão.
- [ ] **Passo 2** — `bColeta` guarda os mesmos campos; `bRestaura` os devolve.
- [ ] **Passo 3** — `bToggles`: mostra `b-natal-campos` só no efeito `natal`; desabilita `b-esp` e mostra `b-esp-aviso` nesse efeito; esconde `b-vel-campo` quando `ntMov==='parado'`.
- [ ] **Passo 4** — `B_EFEITO_NOME.natal='guirlanda de Natal'` e `bPresetResumo` cita os motivos escolhidos.
- [ ] **Passo 5** — "Restaurar padrões" marca `bola` e `estrela`, `girar`, `campanha`, `cantos sim`, e zera os dois números para o padrão.

---

### Tarefa 4: o gerador

**Arquivos:** modificar `index.html` (`bMontar`).

**Consome:** `bNatalSvg`, `bDataUri`, a configuração da Tarefa 3.

- [ ] **Passo 1** — recusa: sem nenhum motivo marcado, devolver `{erro:'Escolha pelo menos um enfeite...'}`.
- [ ] **Passo 2** — recusa: no efeito `natal` o fundo interno não pode ser `manter` (a técnica pinta o miolo), reaproveitando a mensagem que os outros efeitos de camadas já usam.
- [ ] **Passo 3** — montar as camadas na ordem: miolo `padding-box`; quatro cantos `no-repeat` `border-box`; tira do topo e da base (`repeat-x`); tiras da esquerda e da direita (`repeat-y`); cor de base `b-c3` `border-box`. Emitir `background`, `background-size`, `background-repeat`, `background-position` como propriedades separadas, na ordem que as camadas foram declaradas.
- [ ] **Passo 4** — `border: <ntTam>px solid transparent;` e `border-radius`.
- [ ] **Passo 5** — com `ntMov==='girar'`: `animation: fc-borda-natal <vel>s linear infinite;` e os `@keyframes` movendo **só** as posições das quatro tiras (topo +larguraTile, base −larguraTile, esquerda −alturaTile, direita +alturaTile), com todas as outras camadas repetidas idênticas nos dois quadros.
- [ ] **Passo 6** — `keysRm`: um quadro só, na posição inicial — a guirlanda para e continua à vista.
- [ ] **Passo 7** — com `ntMov==='parado'`: sem `anim`, sem `keys` — cai no caminho que o efeito `fixa` já usa (código 1 vira só a explicação).

---

### Tarefa 5: o tamanho à vista

**Arquivos:** modificar `index.html` (`bGerar`).

- [ ] **Passo 1** — depois de escrever `b-out2`, atualizar um `<p class="ajuda" id="b-peso">` com o tamanho em KB do código 2, e um aviso âmbar acima de 12 KB dizendo que campos de CSS de painel costumam ter limite e que vale colar e conferir. Só no efeito `natal`; nos outros o parágrafo fica escondido.

---

### Tarefa 6: verificação e fechamento

- [ ] **Passo 1** — `node scratchpad/rodar.mjs …` e comparar com `final3.json`: as 12 saídas, os 14 links e as 12 variações **idênticas**. É o invariante.
- [ ] **Passo 2** — `node scratchpad/natal.mjs`: os sete cenários, incluindo movimento reduzido, e a tabela de bytes.
- [ ] **Passo 3** — olhar os screenshots: a guirlanda tem de ler como moldura, com os motivos em pé nos quatro lados e os cantos fechando.
- [ ] **Passo 4** — varredura: IDs sem repetição, ES5, zero acento em código, zero erro de console.
- [ ] **Passo 5** — atualizar `docs/documentacao-fotocerta.md`, `docs/pendencias.md` e o ledger.
- [ ] **Passo 6** — commit, merge na `main`, `scripts/conferir-versoes.sh`, push.
