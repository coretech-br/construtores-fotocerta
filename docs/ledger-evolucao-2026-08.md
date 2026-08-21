# Ledger da evolução — preset geral, backup e painel

Acompanhamento de **estimado versus real** das cinco fases aprovadas em 20/08/2026.
Spec: `docs/specs/2026-08-20-preset-geral-e-painel-design.md`.

O tempo real é medido pelo **relógio dos commits**: do início do trabalho da fase até o merge dela na `main`. Inclui as rodadas de revisão e correção, que é onde as estimativas erraram nas seis fases anteriores.

## Tabela — FINAL

| # | Fase | Estimado | Real | Situação |
|---|---|---|---|---|
| 1 | Importador de galeria | 2–3h | **56 min** | ✅ mesclada |
| 2 | Presets de aba nas seis abas | 2–3h | **85 min** | ✅ mesclada |
| 2.5 | Interface da lista de imagens | 45–75 min | **81 min** | ✅ mesclada |
| 3 | Preset geral | 4–5h | **127 min** | ✅ mesclada |
| 4 | Exportar e importar JSON | 2–3h | **126 min** | ✅ mesclada |
| 5 | Painel consolidado e largura | 3–4h | **115 min** | ✅ mesclada |
| | **Total** | **13h45 – 19h15** | **9h50** | **abaixo do piso** |

Início 20/08/2026 às 11:07, fim às 20:57. Tempo medido pelo relógio dos commits, do início de cada fase ao merge dela — inclui as rodadas de revisão e correção.

### Por que fechou abaixo do piso, e o que isso ensina

As estimativas traziam 40% somados por causa da lição das seis fases anteriores (subestimar o tempo de *corrigir o que a revisão acha*). Nesta rodada essa margem **não foi consumida**, por três razões medidas:

1. **A fase 2 construiu a costura certa e as fases 3, 4 e 5 consumiram em vez de reconstruir.** O carimbo de versão, a comparação canônica e o registro `ABAS` estavam prontos e testados. A fase 3, a maior estimada (4–5h), fechou em 2h07.
2. **A regra de regressão byte a byte transformou "acho que não quebrou" em prova**, seis vezes seguidas. Nenhuma rodada de correção precisou reabrir uma fase anterior.
3. **Medir antes de despachar.** A galeria foi medida antes da fase 1 existir; as incógnitas foram mandadas medir explicitamente. Duas decisões do plano caíram por medição — e cair cedo é barato.

### Placar das revisões

| Fase | Critical | Important | Minor |
|---|---|---|---|
| 1 | 0 | 1 | 5 |
| 2 | **1** | 1 | 2 |
| 2.5 | 0 | 2 | 5 |
| 3 | 0 | 4 | 4 |
| 4 | 0 | 0 | 4 |
| 5 | 0 | 2 | 4 |
| **Total** | **1** | **10** | **24** |

**35 achados, todos fechados antes do merge.** Nenhuma fase foi mesclada com achado aberto.

O único Critical: na fase 2, o campo de nome do preset colidiu com o *Nome do produto* do Checkout. Salvar um preset com o formulário de produto preenchido nomeava o preset com o nome do produto e **apagava o campo, sem aviso**.

### A lição de método desta rodada

**Verificação que simula o operador acha o que verificação por dentro não acha.** O roteiro automatizado da revisão da fase 2 *passou* no Critical, porque escrevia via `getElementById` e acertava o mesmo campo que o código lia. A falha só apareceu ao digitar no campo da tela. A partir dali, toda fase exigiu prova como operador — e os quatro Important da fase 3 e os dois da fase 5 vieram por esse caminho.

**Corolário operacional:** `alert()` nativo congela o protocolo do navegador. Neutralizar `window.alert` a partir da página é o que torna a verificação automatizada viável — e deixa as mensagens legíveis para conferência.

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

### Fase 3 — Preset geral

- **Início:** 20/08/2026, 14:49. **Branch pronta para revisão:** 20/08/2026, 15:32 (**43 min**; o real da tabela só fecha no merge).
- **Base:** `main` = `a77c16a` (fases 1, 2 e 2.5 mescladas). **Branch:** `evolucao/3-preset-geral`. **Não mesclada.**
- **O que foi construído:** R1 (campanha + página, nome derivado, seletor agrupado, aviso de divergência de campo operacional), R2 (aba ativa/fora com os valores preservados, barra de abas mostrando o estado, interruptor no topo de cada aba, padrão "todas fora" ao criar), R3 (cópia com marca de origem e os quatro estados dela), R5 parcial (os dois campos de "Outros códigos meus" guardados, sem consumidor — é a fase 5 que os usa) e R6 (barra sempre visível, troca bloqueada com as três saídas).
- **O que a fase 2 deixou e foi consumido, sem nada refeito:** `coleta()`/`restaura()` por aba (via `fcPresetCapturar` e o `restaura` da própria aba — não existe segundo caminho de leitura ou escrita de campos), `pref`/`fora`/`operacionais`/`redesenhar` do registro `ABAS`, o `carimbo` por preset (é ele que distingue "a origem mudou" de "a cópia foi editada", sem guardar uma segunda cópia dos valores) e `fcCanon`/`fcValoresIguais`.
- **Chave própria, migração de risco zero.** `fcConstrutoresGerais`; `fcConstrutores` não é tocada **pela contabilidade da camada nova** — adotar um preset reescreve a tela, e a tela é o rascunho, então `fcgAdotar` sobrescreve a chave antiga por definição; o que separa isso de perda de trabalho é a pergunta de três saídas, que sempre vem antes e nomeia o que se perde (registrado por inteiro na documentação). Provado nos dois sentidos: estado gravado pela **própria `main`** (inclusive com biblioteca de presets nas seis abas) abre na branch sem uma linha de aviso, e a chave nova com JSON inválido derruba só a barra do preset geral — as seis abas e as seis bibliotecas voltam inteiras.
- **Regressão:** as **9 saídas** dos seis geradores byte a byte idênticas às de `main` (SHA-256 completo de cada uma) para a mesma configuração, com as duas versões servidas pelo mesmo `localhost` e o mesmo `localStorage` semeado. **Três cenários:** Rascunho, preset geral com as seis abas ligadas e os códigos manuais preenchidos, e preset geral com uma aba fora. O `fcConstrutores` gravado sai com o **mesmo hash** nos três — a prova de que a camada nova não encosta na antiga. Varredura de IDs repetidos: `[]`, com 401 IDs (369 antes; os 32 novos são todos `fcg-…`).

#### Os dois defeitos que a verificação como operador achou

- **O aviso de origem mentia depois de um clique.** Ligar o redesenho da barra aos eventos `input`/`change` de `document` cobre o que se digita e **não** cobre o que se clica: adicionar foto, reordenar lista, remover produto, salvar ou remover preset de aba mudam o estado por botão. Medido: removida da biblioteca a origem de onde a aba tinha vindo, o aviso seguia dizendo *"veio de 'X', e continua igual a ele"* sobre um preset que já não existia. A correção não foi acrescentar mais um listener, foi mudar o ponto de escuta: quem acorda a barra passou a ser o `salvarEstado`, por onde toda mudança de valor desta ferramenta passa. De quebra, os dois listeners de `document` saíram.
- **A barra grudada comia meia janela.** O painel de detalhes estava dentro do elemento `sticky`: aberto, 607 px pinados no topo. Separar a linha (55 px) do painel não bastou — `sticky` gruda dentro do bloco que a **contém**, e com a linha ainda dentro de uma caixa de 605 px ela ia embora junto (medido: `top:-547` com a página em 1200 px). A linha virou filha direta do `<body>`.

#### Decisões tomadas dentro do escopo

- **Renomear não conta como "alterado".** Os campos de campanha e página descrevem tanto o preset ativo quanto um que ainda vai ser criado. Se mexer neles marcasse "alterado", flipar o rádio para *Embutida* — o gesto natural de quem vai criar a segunda página — faria a pergunta de troca oferecer "salvar antes", e salvar **renomearia** a Hospedeira para Embutida. Renomear ficou sendo um passo declarado, com confirmação que mostra o nome velho e o novo.
- **Renomear para uma combinação que já existe é recusado, não fundido.** Fundir apagaria o outro preset. Entre destruir e preservar, preserva.
- **Aba em só-leitura entra no preset pelo último fragmento bom (`fcFrag`), e não é escrita ao aplicar.** Recusar salvar o preset geral inteiro por causa de uma aba quebrada custaria ao operador o trabalho das outras cinco. Ao aplicar, a aba é pulada e nomeada num aviso. Medido com `cmsgs` gravado como objeto: o código da campanha da Contagem (`NATAL26BARRA`) sobrevive dentro do preset geral.
- **O selo é adiado (250 ms, timer único); a decisão nunca é.** `fcgTrocarPara` recalcula sincronamente e não lê o selo.
- **O rótulo da aba Captação de leads passou a levar acento** (`ABAS[].nome` e os dois `prep()` da aba, na mesma grafia). `nome` é texto de interface — aparece na barra vermelha de falhas e agora também nas perguntas do preset geral e no interruptor de cada aba.

#### Rodada de correção da fase 3 (revisão de 20/08/2026)

Zero Critical — a revisão não construiu nenhum caminho em que valores sumam sem serem nomeados antes. Quatro Important, dois Minor e uma nuance de documentação.

- **O botão que prometia um nome fazia o oposto.** Em *Natal 2026 · Hospedeira*, flipar o rádio para Embutida (o gesto documentado para criar a página 2), ter edição não salva e clicar **Salvar como preset geral**: o botão *"Salvar em 'Natal 2026 · Hospedeira' antes"* lia os campos do painel, **renomeava** a Hospedeira para Embutida e então recusava criar, por colidir com o preset que acabara de renomear — a campanha terminava com uma página só, e a confirmação de renomear aconselhava justamente a ação em andamento. A decisão de base ("renomear não conta como alterado") não foi reaberta; a composição foi consertada separando `fcgSalvarComoEsta` (grava no preset ativo com o nome dele) de `fcgSalvarNoAtivo` (lê os campos e pode renomear, com confirmação), sobre o mesmo miolo `fcgGravarNoPreset`. Medido depois: a campanha termina com **as duas páginas**; o caminho irmão ("Salvar em X e trocar") também deixou de renomear; renomear de verdade e a recusa de colisão continuam de pé.
- **A caixa de seleção nascia vazia.** Guarda de assinatura inicializada com `''`, que é a assinatura de "nenhum preset geral": a primeira montagem era pulada e a caixa ficava **sem nenhuma opção**, nem "Rascunho — sem preset geral". Atingia todo operador de primeira viagem. Medido com `localStorage.clear()` + recarga: antes, 0 opções; agora, 1.
- **"Veio de X, que mudou depois" era falso no gesto mais comum.** Aplicar X → ajustar um campo → regravar X. `fcgOrigemRecarimbar` acompanha o carimbo novo, e só quando a origem já aponta para aquele preset. Medido: o aviso âmbar sumiu no ciclo de rotina e continua aparecendo — com campos diferentes de verdade — na página cuja cópia é realmente anterior.
- **"Outros códigos meus" era carregado entre campanhas.** `fcgCriar` copiava `codigos` adiante e sair para o Rascunho não limpava: com o Tag Head da Hospedeira do Natal na tela, `Pascoa 2027 · Hospedeira` nascia carregando-o, invisível com o painel recolhido. Como estes dois campos não têm interruptor, a proteção equivalente à das abas é **não copiar**: nascem vazios quando o preset vem de outro preset (dito no aviso de criação), e o Rascunho os esvazia. Do Rascunho eles vão junto — ali foram digitados para esta página.
- **Minor.** Par (campanha, página) repetido no armazenamento — hoje inalcançável pela interface, mas produzível pelo "importar como cópia" que o R4 promete — deixava o segundo preset invisível e indelével; na leitura ele passa a ser renomeado (`Natal 2026 (2)`), aparece na lista e pode ser apagado, com o renome dito na barra. Medido: injetado o par, o segundo aparece, é selecionável (mostra o conteúdo que era dele) e some ao ser apagado. Gramática do aviso de divergência: *"tem outro valor **para** o número do WhatsApp"*, porque o rótulo de `operacionais` já traz o artigo. E os cinco `·`/`•` literais em strings JS viraram `\u00B7`/`\u2022`, na norma que a `main` cumpre 100% (os que restam no arquivo estão em texto HTML, como na `main`).
- **Regressão da rodada:** **27 de 27** saídas byte a byte idênticas às de `main` (`a77c16a`) — as 9 dos seis geradores em três cenários (Rascunho, preset com as seis abas ligadas e códigos manuais preenchidos, preset com uma aba fora), cada cenário com marcadores próprios para que os três sejam distintos, as duas versões servidas pelo mesmo `localhost` e o `fcConstrutores` de cada cenário semeado na `main`. O estado volta idêntico da `main` nos três. A **ida-e-volta das seis abas** (adotar o mesmo preset duas vezes; e `Descartar`) devolve `fcConstrutores` byte a byte idêntica. Chave nova corrompida: a barra vermelha diz, cai para Rascunho, as seis abas e as seis bibliotecas voltam inteiras — e agora a caixa de seleção ainda mostra a opção Rascunho. ES5 confirmado por AST (`acorn --ecma5`), `<script>` único, IIFE única, varredura de IDs repetidos `[]` (398 IDs no DOM com o armazenamento limpo; 362 escritos no HTML).

#### O que a fase não fez, de propósito

Exportar/importar JSON (fase 4) e o painel consolidado (fase 5). Os campos de "Outros códigos meus" são **guardados e não consumidos**, e o texto de ajuda ao lado deles diz isso — campo que parece fazer algo que ainda não faz é a mesma mentira de tela que este projeto vem desfazendo.

### Fase 4 — Exportar e importar JSON

- **Início:** 20/08/2026, 15:38. **Branch pronta para revisão:** 20/08/2026, 16:30 (**52 min**; o real da tabela só fecha no merge).
- **Base:** `main` = `6d5db6a` (fases 1, 2, 2.5 e 3 mescladas). **Branch:** `evolucao/4-exportar-importar`. **Não mesclada.**
- **O que foi construído:** o R4 literal — dois botões de exportar (tudo / este preset geral), escolha *com dados* ou *sem dados* na hora, com o nome do arquivo dizendo qual é; e a importação com as cinco garantias. Espaço de nomes `fcx-`, cinco IDs novos, uma seção de largura inteira no painel de detalhes da barra do preset geral.
- **O que a fase consumiu, sem nada refeito:** `ABAS.operacionais` (é a fonte única do que o "sem dados" limpa — não existe segunda lista), `fcPresetCapturar` como molde da conferência, `fcgLerPreset`/`fcgLerOrigem`/`fcPresetConverter` como leitura defensiva, `fcgCampanhaLivre` e `fcgPerguntar` (a pergunta de três saídas da fase 3, aqui com duas e três botões), `fcgMotivos` para nomear o que se perde ao substituir a tela, e as travas `corValida`/`fcAjustarTodos`/`corSegura`/`urlLimpa`/`escJs` onde elas já estavam.
- **Duas peças novas na base compartilhada, as duas por recusa a duplicar:** `fcEstadoAtual()` foi **extraída** de `salvarEstado` (montar o estado por fora para exportar seria uma segunda montagem, e a divergência apareceria como *"o backup não traz o que a ferramenta tem"*); e `fcPresetCapturar` ganhou o sinalizador `manterFora`, com **um** chamador — o molde do rascunho, onde `b.consol` faz parte do que estava gravado.
- **Risco tratado como o principal:** o arquivo importado é entrada não confiável, e o que ele vira é código publicado. Três camadas na entrada, `__proto__`/`constructor`/`prototype` fora antes de tudo, e o molde do que se conhece vindo do `coleta()` de cada aba. Arquivo hostil de 342 KB — `javascript:` na lista de fotos, `<img onerror>` no nome da campanha, poluição de protótipo, lista de 5000 itens, texto de 24 000 caracteres, aninhamento de 40 níveis, chaves desconhecidas, tipos trocados, itens `null` — produziu **zero** execução, **zero** poluição, **zero** `<img>` injetado no DOM, **24 descartes contados à vista** e a ferramenta inteira de pé (nenhuma linha na barra vermelha). Nove arquivos de recusa (não-JSON, truncado, vazio, de outra ferramenta, sem versão, versão futura, versão 0, array, marca certa e miolo vazio) recusam com explicação e deixam os dois armazenamentos **byte a byte** intactos. Arquivo de 9 MB é recusado pelo tamanho antes de ser lido.
- **Colisão "importar como cópia" não recria o defeito da fase 3:** a cópia troca a **campanha** por `fcgCampanhaLivre` (`Natal 2026 (2)`) antes de entrar, então o par `(campanha, página)` continua único por construção — o preset invisível e indelével que a fase 3 fechou não pode nascer daqui. Preset de aba colidente ganha o mesmo tratamento no nome (`fcxNomeLivre`).
- **Garantia 5 provada com o campo que muda ao lado:** preset geral substituído por um arquivo *sem dados*, com um campo **não** operacional alterado dentro do arquivo para provar que a substituição realmente aconteceu — os **seis** campos de contato e pagamento ficaram como estavam, e a mensagem final disse quantos herdaram.
- **Regressão:** as **9 saídas** dos seis geradores byte a byte idênticas às de `main` (`6d5db6a`) pelo SHA-256 de cada uma, nos dois cenários pedidos (Rascunho e preset geral com as seis abas ligadas), com as duas versões servidas pelo mesmo `localhost` e o mesmo `localStorage`. O `fcConstrutores` sai com o **mesmo hash** depois de a `main` gerar por cima dele. **Ida-e-volta:** exportar tudo → `localStorage.clear()` → importar de volta → as **9** saídas idênticas e o `fcConstrutores` com o **mesmo hash** (`a0b43ee1…`), com o preset geral selecionado de novo, 6 de 6 abas ligadas, selo *salvo* e os dois "Outros códigos meus" no lugar. `b.consol` sobrevive à ida-e-volta (é o que o `manterFora` existe para garantir). ES5 confirmado por AST (`acorn --ecma5`), `<script>` único, IIFE única, varredura de IDs repetidos `[]` com 403 IDs no armazenamento limpo (398 antes; os cinco novos são todos `fcx-`). A 700 px de largura a página não ganha rolagem horizontal (`scrollWidth` = 700) e os três botões cabem numa linha.

#### Os dois defeitos que a verificação como operador achou

- **A data do arquivo é ecoada na confirmação, e podia mentir.** `geradoEm` é texto do arquivo aparecendo dentro da caixa que o operador está lendo **para decidir**. Vai por nó de texto, então marcação não passa — mas frase passa: com `geradoEm: "ATENCAO: nenhum preset sera substituido, pode confirmar"`, a confirmação exibia essa frase no meio dos números verdadeiros. O campo passou a ser aceito só na forma de data ISO; qualquer outra coisa vira *"em data desconhecida"*. **O arquivo pode escolher a data, nunca o texto.**
- **A mesma mensagem dizia que o rascunho foi aplicado E que não foi.** As duas linhas são um par `se`/`senão`, e a linha nova do "caiu no Rascunho" foi inserida **entre** elas: o `senão` passou a pertencer à linha nova. Só apareceu clicando — o caso exige um arquivo cujo `rascunhoGeral.ativo` aponte para um preset que não veio junto, e ainda mandar aplicar o rascunho. O acréscimo independente foi para depois do par.

#### Decisões tomadas dentro do escopo

- **O que "sem dados" NÃO tira está dito na própria pergunta.** As caixas "Outros códigos meus" são texto livre e viajam como estão nos dois casos. Prometer "sem dados" e deixar passar um número de WhatsApp que o operador tenha colado ali seria a mentira mais cara que este recurso pode contar, então a pergunta nomeia o limite antes da escolha — e a confirmação da importação diz quantos caracteres de código manual o arquivo traz, com o aviso de ler antes se ele veio de outra pessoa.
- **A biblioteca de presets não viaja duas vezes.** Ela é retirada do `rascunho` porque vai em `presetsDeAba`. Duas cópias da mesma coisa no mesmo arquivo divergem no dia em que uma delas for filtrada.
- **`rascunhoGeral` anda junto do rascunho, e só é restaurado com ele.** Qual preset está selecionado, quais abas estão ligadas e os códigos manuais são *a tela*, não a biblioteca. Quem responde "não mexer na tela" não tem a barra mexida.
- **Aba em só-leitura: ao substituir um preset, o que ela já tinha guardado dentro dele fica.** Escrever o vazio por cima apagaria a configuração dela por causa de um defeito de outra aba, sem ninguém nomear.
- **Cache de molde por leitura (`fcxTpl`).** Sem ele, um backup com dezenas de presets gerais mandaria fazer um `coleta()` clonado das seis abas por preset — com 46 fotos na lista, o tipo de custo que trava a ferramenta na hora em que ela mais precisa parecer confiável. O arquivo hostil de 342 KB é lido em menos de meio segundo.

#### O que a fase não fez, de propósito

O painel consolidado (fase 5). Os dois campos de "Outros códigos meus" continuam **guardados e não consumidos** — agora eles também viajam no arquivo, e o texto de ajuda continua dizendo que quem vai juntá-los aos blocos gerados é a próxima etapa.

### Fase 5 — Painel consolidado, e a largura da ferramenta

- **Início:** 20/08/2026, 18:37. **Branch pronta para revisão:** 20/08/2026, 19:40 (**63 min**; o real da tabela só fecha no merge).
- **Base:** `main` = `0b62f25` (fases 1, 2, 2.5, 3 e 4 mescladas). **Branch:** `evolucao/5-painel-consolidado`. **Não mesclada.**
- **O que foi construído:** o painel consolidado (R5, R6 e a seção 4 da spec) na faixa à direita das abas, e o achado D do dono — largura, número de colunas e a lista de imagens em largura inteira. Espaço de nomes `fcc-`, **um** ID novo escrito no HTML (`fcc-corpo`); o resto do painel é desenhado por `fccRender`.
- **O que a fase consumiu, sem nada refeito:** `FCG.ativas` (só aba ligada contribui — é o R2 pagando o preço dele), `FCG.codigos` (os dois "Outros códigos meus", que a fase 3 guardou e declarou **sem consumidor**), `fcgValoresDaAba`/`fcgValoresDaAbaLer` (é dali que saem os dois radios que mudam destino, e não do DOM: aba em só-leitura entrega o que estava gravado), `fcCanon` (a assinatura de "gerado antes de a aba mudar"), `copiar`/`fcAvisoCopia` (os botões do painel são os mesmos das abas) e `fcFalha`/`prep`.
- **O painel não formata código.** Ele lê as nove caixas que os geradores escreveram e as junta. O único acréscimo dentro dos geradores são **sete linhas** de `fccMarcar(abaId)`, nos caminhos em que a caixa foi escrita — anotação ao lado, que não muda um byte do que sai.
- **Regressão:** as **9 saídas** dos seis geradores byte a byte idênticas às de `main` (`0b62f25`) pelo **SHA-256 completo** de cada uma, em **dois cenários** (preset geral *Natal 2026 · Hospedeira* com as seis abas ligadas e os dois códigos manuais preenchidos; e Rascunho), com as duas versões servidas pelo **mesmo `localhost`** e o mesmo `localStorage` (SHA-256 do estado semeado igual dos dois lados, `3eb0d1db…`). **18 de 18.** O `fcConstrutores` sai com o **mesmo hash** depois de a `main` gerar por cima dele. ES5 confirmado por AST (`acorn --ecma5`), `<script>` único, IIFE única. Varredura de IDs repetidos: `[]` — 424 no DOM com o painel montado e os dois presets gerais, 368 escritos no HTML (367 antes; o único novo é `fcc-corpo`).

#### O que a verificação como operador provou

- **Aba fora não contribui.** Com o Checkout **fora** e 22 107 caracteres na caixa dele, o painel não o menciona; ligado o interruptor, ele aparece na lista de componentes. É o R2 pagando o preço dele.
- **Contagem regressiva nos dois lados.** No modo *fixa no topo*, o bloco entra na Tag Body (24 241 caracteres montados); trocado para *no fluxo* e regerado, ele sai da Tag Body (15 514) e aparece em "Saídas por componente".
- **TidyCal embutido é de duas páginas.** Em *Hospedeira*: saída 3 na lista de componentes, saídas 1 e 2 em "É de outra página desta campanha". Criada a *Embutida* e ligada só a aba TidyCal: a saída 2 vira a Tag Body dela (`pagina EMBUTIDA` na linha de identificação), a 1 vira componente e a 3 é que passa a ser "de outra página".
- **Falta gerar, não monta.** Recarregada a página com as seis abas ligadas, o painel recusa montar os dois campos e nomeia o que falta ("Falta gerar o código de 2 abas: Captação de leads, Contagem regressiva"). Mudado o código da página na aba Leads sem regerar, o campo **é** montado e o aviso âmbar diz que o código é anterior à mudança.
- **Sem preset geral, o painel diz o que falta.** E volta a dizê-lo ao sair de um preset para o Rascunho.
- **Colisão de bordas visível.** `fc-borda-giro` colado à mão contra `fc-borda-brilho` gerado: nenhum aviso, corretamente. Trocado o colado para `fc-borda-brilho`: caixa vermelha nomeando a animação e os dois blocos onde ela aparece.
- **Copiar funciona do painel**, tanto no campo montado quanto numa saída por componente — e o texto da saída por componente é **idêntico** ao da caixa da aba.
- **O nome da campanha não escapa do comentário.** Renomeada para `Páscoa --> <b>x</b> -- 2027`, a linha sai `<!-- Construtores Foto Certa -- Pascoa - bx/b - 2027 -- pagina HOSPEDEIRA -- Tag Head -->` e o analisador do navegador devolve **um** comentário seguido só de espaço e dos `<style>`.

#### Os dois defeitos que a verificação achou

- **A linha de fronteira prometia conteúdo inexistente.** Com código manual e nenhuma aba ligada, o campo terminava em *"daqui para baixo, gerado pelos Construtores Foto Certa"* com nada embaixo. A fronteira passou a sair só quando existe bloco depois dela.
- **A lista do que falta dizia o nome duas vezes.** "Bordas com efeito — Bordas com efeito — código 1": o rótulo já nomeia a aba. Ficou só o rótulo.

#### A decisão que a spec pediu de um jeito e a medição mandou de outro

A spec escreveu a linha de identificação e a de fronteira como comentário de **CSS** (`/* … */`). Os campos Tag Head e Tag Body do Prosite recebem **HTML**. Medido com o analisador do navegador: `/* Construtores Foto Certa -- … */` no começo de um corpo vira **nó de texto** (`nodeType` 3) — sairia **impresso na página publicada**. Na forma `<!-- … -->` vira comentário (`nodeType` 8). As duas linhas foram para comentário de HTML, e o nome da campanha entra por `fccSeguro` (sem `<`, sem `>`, sem hifens repetidos, sem acento) para que nenhuma sequência de fechamento possa se formar dentro dele.

#### A largura, e a restrição do dono

*"O ajuste já passará a contar com o painel consolidado usando parte da área à direita das abas."* Foi assim:

- Faixa `.app` de até **1980 px**, painel de **380 px**, abas com o que sobra (**1536 px** em 2000 e em 2560). A margem lateral num monitor 2K cai de **732 px de cada lado para 290**.
- Abaixo de **1400 px** a faixa deixa de ser dividida e o painel cai **abaixo** das abas. O painel é o segundo filho de `.app` para que isso não precise de regra de reordenação.
- **O número de colunas virou conta do container**, não da janela: `repeat(auto-fit, minmax(min(360px,100%),1fr))`. A `@media (max-width:840px)` saiu — ela media a janela, e com o painel à direita a janela deixou de ser a largura da aba.
- **Continuam duas colunas, e está medido por quê.** Toda `.grade` das abas tem exatamente dois filhos, então `auto-fit` nunca abre uma terceira. Reagrupar os fieldsets das seis abas para caber três daria **~470 px** por coluna contra os **735** de duas — mais estreito que os **507** de antes. O espaço foi para o painel e para a lista de imagens.
- **Colunas medidas nas quatro larguras, nas seis abas:** 580 px a 1280 (empilhado), 538 a 1600, 735 a 2000 e a 2560. Zero vazamento (nenhum elemento pintado além da borda do painel) e `scrollWidth` = `clientWidth` em todas — e também a 700, 685 e 380 px.
- **A lista de imagens em largura inteira**, fora de qualquer `.grade`. O teto de 520 px sobreviveu **com a justificativa refeita, não copiada**: com a lista em 1460 px o cartão continua com **96 px** (a altura vem da miniatura de 64×44, não da quebra do texto), então 520 continua sendo 5 cartões inteiros, e da contagem até a base do botão *Limpar lista* vão os mesmos **596 px** = 520 + 76 de moldura.
- **Texto corrido ganhou teto de 1100 px** (`.descricao`, `.instrucoes`): a 1536 px a linha passaria de 250 caracteres.

#### O estouro de 11 px: já estava fechado, e a prova ficou

Reproduzido no commit da fase 2.5 (`a77c16a`): a 685 px de largura útil, `aba-cnt` terminava em **696** e o `scrollWidth` ia a 696 contra 685. Quem fechou foi o `flex-wrap:wrap` que a **fase 3** acrescentou a `.abas` por causa dos selos "fora" — a fase 2.5 mediu antes disso. Em `main` e na fase 5, a 700 e a 685 px, com e sem selos: `scrollWidth` = `clientWidth`, e o último botão termina dentro da caixa (620 de 680; 610 de 665 com cinco selos e três linhas).

#### Um defeito pré-existente que a fase trouxe para largura de uso

A largura das quatro molduras de prévia é escrita em pixels na montagem, e a prévia só é remontada ao abrir a aba. Encolher a janela depois disso deixava a moldura maior que a coluna e a **página inteira** ganhava rolagem horizontal — medido em `main`: prévia montada a 2560 px, janela levada a 400, `scrollWidth` 513 contra `clientWidth` 400. Alcançável em `main` só em janela muito estreita; com as colunas mais largas da fase 5 passou a acontecer a **700 px**. `max-width:100%` nas quatro molduras: a moldura encolhe junto e o excesso é cortado pelo `overflow:hidden` que já estava lá.

#### O que a fase não fez, de propósito

Não reagrupou os fieldsets das seis abas para abrir uma terceira coluna (a medição acima diz por quê), e não mexeu em nenhum gerador além das sete linhas de `fccMarcar`.

#### Rodada de correção da fase 5 (revisão de 20/08/2026)

Seis correções. Zero Critical na revisão; as duas Important eram uma omissão de aviso e uma decisão de layout mal fundamentada.

- **O campo `fora` mudava o código sem envelhecer a caixa (Important).** `ABAS` declara `bor: fora:['consol']` e `fcgValoresDaAbaLer` apagava esse campo antes de assinar — mas `b.consol` é quem manda o código 1 das Bordas carregar também o `@keyframes` do outro componente. Reproduzido do zero: preset *Natal 2026 · Hospedeira*, só Bordas ligada, preset de aba salvo com efeito *gradiente*, tela de volta em *brilho*, **Gerar código** → `b-out1` = 563, Tag Head montada = 645. Escolher o preset na caixa de consolidação deixava os dois números onde estavam **sem uma palavra**; clicar Gerar de novo levava a 850 e 932. São **287 bytes** — a animação inteira do outro componente — oferecidos como "conteúdo completo da Tag Head". `fccAssinar` acrescenta os campos `fora` à assinatura de frescor, por `fcPresetCapturar(a,true)`, sem mexer no que o **preset** enxerga (que é a razão de `consol` ser `fora`: ele descreve outro componente e tem de conservar o que está na tela). Verificado: depois da correção, o mesmo gesto acende o aviso âmbar imediatamente, e regerar o apaga — 850 / 932.
- **A terceira coluna: medida e recusada, com números (Important).** A justificativa anterior estava presa ao envelope que eu mesmo escolhera (`--larg:1980px`) e descrevia a regra como "conta do container", o que sugeria uma flexibilidade que não existe. Contagem real: **30** `.grade`, todas com **dois** filhos, guardando de **2 a 7** fieldsets (pior caso: 4+3 na primeira seção do Checkout). Com `display:contents` nos cartões a 2545 px sem teto, a coluna cai de 1017 para **670 px** e as abas encolhem **5 a 14 %** — mas o número de colunas passa a variar dentro da mesma aba (Contagem: 3, 2, 4, 5, 2, 3; de 392 a 1017 px) e a seção *Prévia e código gerado* do TidyCal desaba para **uma** coluna de 2059 px, com a prévia deixando de ficar ao lado do código. Conclusão mantida em duas colunas, agora dita na regra exata: **1 abaixo de ~744 px de container, 2 acima, nunca 3**.
- **A areia dos 283 px, que era o pedido original do dono, foi resolvida.** O teto saiu da faixa e foi para a **coluna**: `--abas:1536px` (as mesmas duas colunas de 735 px) e o painel consolidado recebendo a sobra, `clamp(380px, calc(100% - 1536px - 24px), 900px)`. Medido a 2560: areia de **283 → 23 px** de cada lado, abas 1536, colunas 735 (iguais), painel **380 → 900 px** — que é a caixa de onde se copia, e onde a largura vira ~140 caracteres por linha em vez de ~54. A 1400 px nada mudou (941 / 380 / 437,5).
- **`1080px` cravado no painel "Detalhes" (Minor).** Virou `max-width:var(--larg)` com a mesma folga de 20 px da `.fcg-linha`: a 2560 px o conteúdo vai de 43 a 2503, exatamente onde a barra e o painel consolidado começam e terminam. Com media query própria de duas colunas, porque essa grade tem **três** filhos e o `auto-fit` abriria uma faixa vazia.
- **O banner de código velho se contradizia (Minor).** Mexer na lista de fotos esvazia a caixa do Slideshow (`sSaidaVence`), e a mesma tela dizia *"o que está abaixo é o código antigo"* e *"Ainda não gerado"*. `fccTemCodigo` tira do aviso a aba de caixa vazia. Verificado: gerado o Slideshow (6 741 caracteres), acrescentada uma foto → a caixa zera, o aviso âmbar **não** nomeia o Slideshow e o campo dele diz "Ainda não gerado".
- **Aba em só-leitura (Minor).** `fccAssinar` devolve `null` (o gerador leu o DOM, `fcgValoresDaAbaLer` devolve o fragmento guardado — dois lados que nunca foram feitos para bater) e o painel passa a **repassar** o aviso da aba: *não grava nada até a página ser recarregada*. Estado alcançado corrompendo `imgs:[null]` no `fcConstrutores` e recarregando.
- **A 1280 px o painel ficava 3753 px abaixo do topo, sem aviso (Minor).** Faixa `.fcc-atalho` no alto de `.app-esq`, visível só na largura empilhada, com o botão *Ir para o painel*.
- **Regressão refeita:** as **9 saídas** dos seis geradores, em **dois cenários** (padrões de fábrica com o mínimo que cada gerador exige; e uma configuração mexida nas seis abas, com TidyCal *embutida* — que é o cenário em que `t-out2` e `t-out3` saem com conteúdo), comparadas por **SHA-256** com as de `main` (`0b62f25`) servida pelo mesmo `localhost`: **18 de 18 idênticas**. Sem rolagem horizontal de 360 a 2560 px; console limpo.

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

---

## Sétima aba — link de cobrança

Ideia nova do dono, validada e aprovada em 20/08/2026 depois da rodada de cinco fases. Spec em `docs/specs/2026-08-20-link-de-cobranca-design.md`.

| | Estimado | Real |
|---|---|---|
| Link de cobrança | 3h30 – 5h | **2h05** (21:51 → 23:56) |

**Abaixo do piso de novo**, e pela mesma razão das cinco fases: a integração — que eu apontei como o risco de estouro — foi barata porque as engrenagens estavam prontas e testadas. A sétima aba entrou no registro `ABAS`, na biblioteca de presets, no preset geral, no backup e no painel, e o que ela quebrou foi só o que estava **cravado em número**: `trocarAba` com seis, e a palavra "seis" em catorze mensagens.

### O que foi medido antes de projetar

Testado na página publicada de verdade (`fotocerta.com.br/natal-2026`): o Prosite **preserva a consulta inteira**. Endereço de 259 caracteres, payload Pix de 154 no meio, acento e travessão na descrição — tudo intacto, sem redirecionamento e sem normalização. É o que confirmou o caminho B como viável antes de uma linha ser escrita.

**Uma armadilha encontrada montando o próprio teste**, que virou requisito: escrevi à mão um campo 54 declarando comprimento 7 para um valor de 5 caracteres. O leitor obedeceu ao comprimento declarado e devolveu `75.0058` — invadindo o campo seguinte. Valor errado, sem erro nenhum, num número que é dinheiro. Virou a primeira das três conferências.

### O limite, declarado

A chave Pix é **pública** — está no próprio link. Então dá para forjar um link legítimo com valor diferente (**para menos ou para mais**) e com outro identificador. O que **não** dá é mentir sobre quanto se pagou: tela, Pix e PayPal leem o mesmo lugar e não têm como divergir.

Esse texto foi reescrito **duas vezes** durante a rodada, as duas por prometer mais do que a página entrega. A primeira versão dizia que alterar não adiantava; a segunda falava só em "valor menor" e não citava o identificador. Fica como exemplo: **texto que promete demais é pior que nenhum texto**, porque o operador confia nele.

### Placar da revisão

Zero Critical. Quatro Important, **três delas visíveis para o cliente do dono** — link do PayPal sumindo da página por um caractere invisível colado de PDF, falha do SDK deixando a seção vazia, e acentuação misturada no cartão. Mais dez de acabamento.

A revisão provou a coerência **por medição**, não por leitura: `Function.prototype.toString` de cada função que a ferramenta executa bate caractere por caractere com o texto que vai no bloco. E provou a autossuficiência **por execução**: o bloco salvo num arquivo avulso, sem a ferramenta em lugar nenhum, atendeu a cobrança inteira.

### Total do dia

**11h55** de trabalho medido, das 11:07 às 23:56 — cinco fases mais a sétima aba.

---

## Oitava aba — mini loja

| | Estimado | Real |
|---|---|---|
| Mini loja (escopo cheio) | 5h30 – 8h | **4h30** (22:38 → 03:08) |

**Abaixo do piso pela terceira vez seguida**, e pela mesma razão: o motor de pagamento já existia, testado e unificado, e a loja consumiu em vez de reconstruir.

### O que ela consertou fora do próprio escopo

**Um defeito de dinheiro que estava no ar.** Em ~2% das combinações de preço com cupom, o Pix cobrava **um centavo a mais** do que a tela mostrava (R$ 10,50 com 5%: tela R$ 9,97, campo 54 do Pix `9.98`). Varredura de 2 milhões de combinações: **37.536 divergiam, sempre para mais**. Herdado do Checkout — o carrinho publicado tinha o mesmo defeito.

A correção arredonda o total em centavos **num lugar só** e **muda a saída do Checkout de propósito**. A regra do byte a byte existe para pegar mudança *não intencional*; esta é intencional e conserta dinheiro. A prova mudou de forma: em vez do hash, **o diff** — e ele mostra só o arredondamento, nos 30 cenários. Depois: 2.002.000 combinações, **zero divergências**.

### Três lições de método, todas caras

**1. Medir com números redondos esconde a classe de erro que os números feios revelam.** A documentação registrava a coerência com R$ 500 e 10% — combinação que nunca expõe o meio centavo.

**2. Regressão por texto não vê bloco que não executa.** Um Critical apareceu na rodada de correção: a loja em "somente Pix" morria com `MOEDA is not defined` — nenhum produto, nenhum aviso. O bloco estava **bem escrito** e não rodava. A bateria ganhou um passo que **executa** os 55 blocos gerados.

**3. Texto que promete demais atravessa gerações.** A prévia afirmava que o botão "Já paguei" não abre o WhatsApp — e abria, com o número do dono. A frase **já era falsa no Checkout** antes desta aba; a loja copiou uma declaração que não valia mais. Corrigido neutralizando `window.open` no shim, que é ambiente, em vez de reescrever o texto.

### Placar

Zero Critical na revisão; **um Critical achado pela própria rodada de correção**. Cinco Important e cinco Minor, todas fechadas.

## Total acumulado

| Rodada | Estimado | Real |
|---|---|---|
| Cinco fases (preset geral e painel) | 13h45 – 19h15 | 9h50 |
| Sétima aba (link de cobrança) | 3h30 – 5h | 2h05 |
| Oitava aba (mini loja) | 5h30 – 8h | 4h30 |
| **Total** | **22h45 – 32h15** | **16h25** |
