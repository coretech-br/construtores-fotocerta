# Ledger da evolução — preset geral, backup e painel

Acompanhamento de **estimado versus real** das cinco fases aprovadas em 20/08/2026.
Spec: `docs/specs/2026-08-20-preset-geral-e-painel-design.md`.

O tempo real é medido pelo **relógio dos commits**: do início do trabalho da fase até o merge dela na `main`. Inclui as rodadas de revisão e correção, que é onde as estimativas erraram nas seis fases anteriores.

## Tabela

| # | Fase | Estimado | Real | Situação |
|---|---|---|---|---|
| 1 | Importador de galeria | 2–3h | **56 min** | ✅ mesclada (`0041655`) |
| 2 | Presets de aba nas seis abas | 2–3h | 42 min até a branch | 🔄 branch `evolucao/2-presets-aba`, aguardando revisão e merge |
| 2.5 | Interface da lista de imagens (A, B, C) + cores livres (D) | 45–75 min | 47 min até a branch | 🔄 branch `evolucao/2.5-interface-lista`, aguardando revisão e merge |
| 3 | Preset geral | 4–5h | — | não iniciada |
| 4 | Exportar e importar JSON | 2–3h | — | não iniciada |
| 5 | Painel consolidado | 3–4h | — | não iniciada |
| | **Total** | **13–18h + 2.5** | **2h21 até aqui** | |

## Registro por fase

### Fase 1 — Importador de galeria — CONCLUÍDA
- **11:07 → 12:03 = 56 min.** Estimado 2–3h. **Fechou abaixo do piso da faixa.**
- Merge `0041655`.
- **Duas decisões do plano revertidas por medição:** os 1400 px (o storage já entrega tudo em 1200; 1400 é ampliação, arquivo maior que o original em 5 de 6 fotos) e a contagem de 59 no portfólio (era a capa contada duas vezes; são 58).
- Revisão independente: **zero Critical**, 1 Important, 5 Minor — todas fechadas antes do merge. A Important: a regra de pasta não restringia o host, e `storage.alboom.ninja@evil.example` era exibido na lista começando por `storage.alboom.ninja`.
- Regressão: 26 saídas byte a byte idênticas.
- **Por que fechou rápido:** escopo pequeno e bem medido antes de despachar. As duas incógnitas ("o endereço de 1400 px funciona?", "o `?t=` atrapalha?") foram mandadas medir explicitamente, em vez de supostas — e uma delas derrubou uma decisão do plano.

### Fase 2 — Presets de aba
- **Início:** 20/08/2026, 12:03. **Branch pronta para revisão:** 20/08/2026, 12:45 (**42 min** de implementação e provas; o real da tabela só fecha no merge).
- **Base:** `main` = `49d9e4a` (o `0041655` mais o commit do ledger, que não toca o `index.html`).
- **Branch:** `evolucao/2-presets-aba`. **Não mesclada.**
- **O que foi construído:** biblioteca de presets nas seis abas, com mecânica única. A das Bordas foi **absorvida** — `bPresets`, `bPresetsLer`, `bPresetIndice`, `bPresetSalvar/Aplicar/Remover/Render` saíram; sobraram só as partes que são daquela aba (resumo, conferência de formato, caixa de consolidação do código 1).
- **Pronto para a fase 3:** `carimbo` por preset (data de modificação; 0 = veio do formato antigo), `fcCanon`/`fcValoresIguais` para comparar dois conjuntos de valores da mesma aba, e `operacionais` declarado por aba (o que a fase 4 vai limpar no arquivo "sem dados").
- **Decisão registrada:** dados operacionais **entram** no preset — é a fotografia da aba, e tirá-los devolveria a aba pela metade em silêncio. Não saem do navegador, e as abas Leads e Checkout dizem isso na tela, nomeando os campos. O resumo da lista nunca os mostra.
- **Regressão:** as **9 saídas** dos seis geradores byte a byte idênticas às de `main` para configuração igual (mesmo `localStorage`, duas versões servidas pelo mesmo `localhost`), rodada duas vezes — a segunda com preset salvo nas seis abas, para provar que preset é entrada e não muda o que sai.
- **Compatibilidade provada com estado antigo montado à mão:** presets de Bordas em `{nome,cfg}` aparecem na lista, e o código 1 **consolidado a partir de um deles** saiu byte a byte igual ao da versão anterior. A tradução é de mão única (versão anterior não lê o formato novo) — registrado de propósito.

### Fase 2.5 — Interface da lista de imagens, e as cores livres que a fase 2 achou

- **Início:** 20/08/2026, 13:28. **Branch pronta para revisão:** 20/08/2026, 14:15 (**47 min**; o real da tabela só fecha no merge).
- **Base:** `main` = `4d8d57d`. **Branch:** `evolucao/2.5-interface-lista`. **Não mesclada.**
- **A — o endereço vazava do cartão.** A causa não era o texto: era que **nada obrigava a caixa a encolher**. Duas regras somadas — o `min-inline-size:min-content` que o navegador dá a todo `<fieldset>` e o `1fr` (sem `minmax(0,…)`) da coluna única abaixo de 840 px. O `text-overflow:ellipsis` já estava lá desde sempre e nunca chegava a agir. Medido com as 46 fotos: **coluna de 507 px contra fieldset de 1253 px** na janela larga, e **faixa de 1299 px numa janela de 700 px**, com barra de rolagem horizontal na página inteira. A segunda metade — identificar a foto — virou corte no **meio** do endereço: a pasta encolhe primeiro e some, o nome do arquivo sobrevive. **46 de 46 textos visíveis ficam distintos**, nas duas larguras.
- **A regra que fica é maior que a lista.** `fieldset{min-width:0}` e `minmax(0,1fr)` valem para a ferramenta inteira: as listas de produtos, cupons e mensagens da Contagem têm a mesma estrutura e o mesmo defeito latente. Estava esperando alguém colar um texto longo o bastante.
- **C — a altura foi escolhida por conta, não por gosto: 520 px = 5 cartões inteiros.** Piso: cinco é o menor número que mantém o item movido e os vizinhos de cada lado à vista. Teto: 520 px mais a moldura do fieldset ainda cabem numa janela de 800 px — área de rolagem mais alta que a janela obriga a rolar a página para ver o fim da própria área de rolagem, que é a segunda metade do incômodo. Seção 1 com 46 fotos: **5563 px → 1413 px**.
- **D era pré-existente em `main`, e a prova está registrada.** Servindo as duas versões pelo mesmo `localhost`: em `4d8d57d`, esvaziar `b-c1-t` e gerar deixa o campo **vazio na tela** com `#9C5638` no código; na branch, o campo se corrige para `#9C5638` e os dois passam a dizer o mesmo. Os **17 campos** (7 nas Bordas, 10 na Contagem) passam nos quatro testes: vazio corrige, inválido corrige, `#075E54` digitado letra a letra não é interrompido, valor válido sobrevive ao `change`/`blur`.
- **Regressão:** as **9 saídas** dos seis geradores byte a byte idênticas às de `main`, com o mesmo `localStorage` (SHA-256 do estado semeado igual dos dois lados) e as duas versões servidas pelo mesmo `localhost`. Varredura de IDs repetidos: `[]`, com 369 IDs (367 antes; os dois novos são `s-conta` e `s-lista-limpar`).
- **O que a fase não fez, de propósito:** largura da ferramenta e número de colunas continuam onde estavam. É o achado D do dono, e ele vai na fase 5 junto com o painel consolidado — decidir o envelope de layout agora seria decidi-lo às cegas e refazê-lo depois.

#### Rodada de correção da fase 2.5 (revisão de 20/08/2026)

Zero Critical, dois Important, cinco Minor. Os dois Important são as duas metades de um mesmo erro: **a correção olhou só para a lista que estava sendo consertada.**

- **A correção do vazamento quebrou as outras três listas.** Mover `white-space/overflow/text-overflow` de `.url` para `.url span` só funciona onde existem `span` — e só `sRender` os cria. Nas opções de Leads e nas duas caixas de mensagem da Contagem o texto vai direto no `<div>`, que virou `display:flex`: o texto passou a **item de flex anônimo**, que não aceita `text-overflow`. Medido a 1280 px com 113 caracteres sem espaço: **672 px de conteúdo em caixa de 417** (255 px pintados fora do cartão) e rolagem horizontal na página (1342 contra 1265); com espaços, quebrava em duas linhas. A correção separa as duas coisas — corte de uma linha no `.url` (as quatro listas), `display:flex` só na variante `.partida` (o slideshow). Depois: as **quatro** listas cortam em **uma linha**, **0 px** pintados fora, fieldset de 507 px e página sem rolagem horizontal, a 1600, 1280 e 700 px. (A 700 px resta 11 px de estouro **da barra de abas**, `aba-cnt` terminando em 696 contra 685 — idêntico em `main`, portanto pré-existente e alheio às listas.)
- **Esconder o host tirou o único lugar onde ele era legível.** A justificativa original — “o cadastro manual já garante o host” — era falsa: `sAdd` chama só `sUrlOk`. Registrado por inteiro na documentação; a decisão foi **avisar em vez de recusar**, e marcar o host **só** quando ele não é esperado.
- **Minor.** O “corte no meio” era nominal (a pasta colapsava a 0 px, sem sinal de que havia texto antes) — `min-width:1.1em` devolve o `…` à esquerda, e o limite dos prefixos longos ficou escrito. Dois comentários descreviam caso inexistente (“dois vizinhos de cada lado”, quando `sListaVer` alinha pela borda; e `sLegEdit` como motivo da guarda de `scrollTop`, quando ela não chama `sRender`) — corrigidos para o que é verdade. Janela baixa: duas `@media` derrubam o teto, e o limite que resta (~388 px) está escrito. Caixa de código vencida: `sSaidaVence` nas cinco portas de mudança da lista.
- **Regressão da rodada:** as **9 saídas** byte a byte idênticas às de `main` (`4d8d57d`), pelo SHA-256 de cada uma, com o mesmo `localStorage` semeado (46 fotos, dois produtos, PayPal e Pix preenchidos) e as duas versões servidas pelo mesmo `localhost`.

---

## Referência: as seis fases anteriores

Concluídas em 20/08/2026 (merge `9aa7a40`), para calibrar as estimativas desta rodada.

| # | Fase | Estimado | Real |
|---|---|---|---|
| 1 | Falhas graves | 45–75 min | 62 |
| 2 | Isolar salvamento | 60–90 min | 84 |
| 3 | Achados médios | 90–150 min | 131 |
| 4 | Atritos de interface | 30–45 min | 100 |
| 5 | Recursos novos | 300–480 min | 391 |
| 6 | Revisão final | 30–45 min | 75 |
| | **Total** | **555–885 min** | **843 min (14h03)** |

**Lição aplicada nesta rodada:** as duas fases que estouraram (4 e 6) estouraram pelo mesmo motivo — eu estimei o tempo de *implementar* e esqueci o de *corrigir o que a revisão acha*. De 13 revisões independentes, 9 geraram rodada de correção. As estimativas de 13–18h já trazem 40% somados por isso.

---

## Achados de interface do dono — 20/08/2026, após testar o importador

Quatro pontos, levantados com a lista já carregada com 46 fotos importadas.

**Os dois primeiros foram criados pela fase 1:** a lista de imagens nunca tinha sido desenhada para dezenas de itens, porque cadastrar dezenas à mão era proibitivo. O importador removeu o limite prático e expôs o layout.

| # | Achado | Onde entra |
|---|---|---|
| A | O endereço da foto **vaza para fora do cartão** — os links do storage são longos demais para a caixa. | Fase 2.5 ✅ |
| B | Falta **"Limpar lista"**. Carregou uma galeria grande e quer refazer? Só removendo uma a uma. | Fase 2.5 ✅ |
| C | Lista grande **empurra todas as demais configurações para baixo**. Provável solução: área de rolagem própria para a lista. | Fase 2.5 ✅ |
| D | A ferramenta é **centralizada e de largura fixa**, sobrando espaço nas laterais (o dono usa monitor 2K). As abas têm duas colunas; poderiam ter mais conforme o espaço, e a lista de imagens poderia ocupar a largura inteira, abaixo dos parâmetros da seção 1. | **Fase 5** |

### Por que A, B e C viram uma fase 2.5, e D não

A, B e C são locais à lista de imagens, pequenos, e a dor é de agora — o importador acabou de tornar comum a lista de 46 itens. Entram logo após a fase 2 mesclar.

**D é acoplado à fase 5 e seria refeito se antecipado.** O painel consolidado foi pedido para ficar *ao lado das abas*, justamente aproveitando o espaço lateral. Decidir a largura e o número de colunas agora significaria decidir o envelope de layout da fase 5 às cegas — e depois refazer quando o painel chegasse. Vai junto, e a fase 5 passa a incluir explicitamente: largura que acompanha a janela, número de colunas conforme o espaço, e a lista de imagens em largura inteira.

Nada foi despachado enquanto a fase 2 corre: ela mexe na estrutura das seis abas, e uma mudança de layout do Slideshow em paralelo colidiria.

**Confirmado pelo dono em 20/08/2026**, com um enunciado mais preciso do acoplamento do que o meu: *"o ajuste já passará a contar com o painel consolidado usando parte da área à direita das abas"*.

Isso vira **restrição de layout da fase 5**: as abas não devem se esticar até a borda da janela: o painel consolidado ocupa parte da faixa à direita, e a largura das abas é o que sobra. O número de colunas dentro da aba se ajusta a essa largura restante, não à janela inteira.
