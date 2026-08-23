# Página de obrigado do TidyCal — plano de implementação

> **Para quem executa:** tarefas sequenciais, cada uma terminando num estado conferível. Este projeto não tem framework de teste: a verificação é `scripts/verificar/regressao.sh` mais um arnês de navegador por rodada.

**Objetivo:** na aba Agendamento TidyCal, gerar (a) o endereço de redirecionamento para o TidyCal e (b) o script de Tag Body que troca marcadores no texto da página de confirmação pelos dados do agendamento.

**Arquitetura:** o script lê a consulta do endereço e percorre **nós de texto** do documento, trocando `{{marcador}}` pelo valor ou pelo texto reserva. Nunca `innerHTML`. Roda ao carregar e reobserva por um instante, para alcançar componente que o tema renderize tarde.

**Pilha:** JavaScript ES5 no `index.html`; o bloco entregue é ES5 puro, sem dependência.

## Restrições globais

- **ES5**, sem acento em código, prefixo `t-ob-` nos campos novos.
- Manual do Prosite: IIFE, `addEventListener`, só `<div>`, `<script>` blindado por concatenação em string.
- **Invariante:** `scripts/verificar/regressao.sh` tem de dar OK — inclusive o `p-out1`, que a extração do `param()` não pode mexer.
- `t-ob-usar` nasce em `nao`: sem ele ligado, a aba gera exatamente o que gerava antes.

---

### Tarefa 1: `FC_PARAM_SRC`, a fonte única do leitor

**Arquivos:** modificar `index.html` (bloco de utilidades compartilhadas; `pJs`).

- [ ] **Passo 1** — criar `FC_PARAM_SRC` como texto literal, com o corpo exato que hoje está dentro de `pJs` (incluindo `replace(/\+/g,' ')` e o `try/catch` do `decodeURIComponent`).
- [ ] **Passo 2** — em `pJs`, trocar as linhas escritas à mão por `j+=pInd(FC_PARAM_SRC);`, ajustando a indentação para o resultado ser idêntico.
- [ ] **Passo 3** — rodar `scripts/verificar/regressao.sh`. **Tem de dar OK.** Se o `p-out1` mudar um byte, a extração está errada.

---

### Tarefa 2: os campos na aba

**Arquivos:** modificar `index.html` (painel `painel-tidy`).

- [ ] **Passo 1** — seção nova "Página de obrigado", com `t-ob-usar` (`sim`|`nao`, padrão `nao`) e o container `t-ob-campos` escondido.
- [ ] **Passo 2** — dentro dele: `t-ob-url`; as cinco caixas `t-ob-nome`, `t-ob-data`, `t-ob-hora`, `t-ob-quando`, `t-ob-tipo`; os cinco textos reserva `t-ob-fb-*`; e `t-ob-fmt` (`comoveio`|`bonito`).
- [ ] **Passo 3** — a tabela de marcadores na ajuda, dizendo o que escrever no texto do Prosite.
- [ ] **Passo 4** — duas saídas novas: `t-out4` (endereço para o TidyCal) e `t-out5` (Tag Body), em caixas que só aparecem com `t-ob-usar=sim`.

---

### Tarefa 3: estado, preset e toggles

- [ ] **Passo 1** — `tCampos`/`tAplicarCampos` (ou equivalentes da aba) passam a guardar e devolver os treze campos novos; ausente = padrão.
- [ ] **Passo 2** — `tToggles`: mostra `t-ob-campos` e as duas saídas só com `t-ob-usar=sim`.
- [ ] **Passo 3** — o resumo do preset da aba menciona a página de obrigado quando ligada.

---

### Tarefa 4: os dois geradores

- [ ] **Passo 1** — `tObEndereco(cfg)`: monta `<url>?nome={{contact.name}}&...` só com as marcadas. Recusa se a URL estiver vazia ou não for `http(s)`, reaproveitando a validação de endereço que a aba já tem.
- [ ] **Passo 2** — `tObBloco(cfg)`: emite a Tag Body — `FC_PARAM_SRC`, a tabela marcador→valor, o caminho de troca em nós de texto (pulando `script`, `style`, `textarea`, `input`, `select`), o texto reserva, a reformatação condicional do `{{quando}}` e o reobservar por um instante.
- [ ] **Passo 3** — recusa se nenhuma variável estiver marcada.

---

### Tarefa 5: verificação e fechamento

- [ ] **Passo 1** — `scripts/verificar/regressao.sh` → OK.
- [ ] **Passo 2** — o arnês `scratchpad/obrigado.mjs`: os oito cenários, incluindo hostil, acentos, sem parâmetros e conteúdo tardio.
- [ ] **Passo 3** — varredura: IDs sem repetição, ES5, zero erro de console.
- [ ] **Passo 4** — documentação, pendências, ledger.
- [ ] **Passo 5** — commit, merge, `conferir-versoes.sh`, push.
