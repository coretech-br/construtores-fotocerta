# Preset geral, presets por aba, backup e painel consolidado — design

**Data:** 20/08/2026
**Estado:** proposta madura, aguardando aprovação do dono
**Origem:** três pedidos do dono (painel consolidado, presets em todas as abas com backup JSON, importador de galeria), mais seis refinamentos que ele pediu para eu decidir.

---

## 1. Contexto e problema

A ferramenta gera oito saídas em seis abas. **Quatro delas disputam campos de página** (Tag Head e Tag Body); as outras quatro vão para componentes individuais, cada um com o campo só dele.

O problema vivido na prática em 20/08/2026: para trocar um bloco na Tag Head, o operador precisa localizar onde aquele bloco começa e termina no meio do campo. Errar apaga o bloco vizinho. Foi o que custou tempo na correção das bordas da landing de Natal.

Um segundo problema, do mesmo dia: a aba Slideshow estava **vazia** — a configuração publicada no site nunca esteve salva em lugar nenhum recuperável. Regerar aquele bloco exigiria recadastrar as fotos uma a uma.

E um terceiro, estrutural: **a ferramenta não sabe para qual página cada bloco vai.** O código 1 das Bordas foi para a página embutida porque é lá que estão os componentes — quem decidiu foi o operador, não a ferramenta.

## 2. A ideia organizadora: o preset geral

Proposta do dono, adotada: um **preset geral** que agrupa a configuração de todas as abas para **uma página de uma campanha**. Selecionado numa barra acima das abas.

Isso responde a "qual página?" **uma vez só**, em vez de seis vezes (uma por aba). Seis chances de inconsistência viram zero.

### Modelo de dados

```
estado {
  presetsGerais: [
    {
      id,
      campanha: "Natal 2026",          // texto, com sugestao das campanhas existentes
      pagina: "hospedeira" | "embutida",
      abas: {
        slideshow: { ativa: true,  valores: {...}, origem: {preset, carimbo} | null },
        leads:     { ativa: true,  valores: {...}, origem: null },
        tidycal:   { ativa: false, valores: {...} },   // valores preservados
        checkout:  { ativa: false, valores: {...} },
        bordas:    { ativa: false, valores: {...} },
        contagem:  { ativa: true,  valores: {...}, origem: {...} }
      },
      codigosManuais: { head: "", body: "" },
      atualizadoEm
    }
  ],
  presetsDeAba: { slideshow: [...], leads: [...], tidycal: [...], checkout: [...], bordas: [...], contagem: [...] },
  rascunho: {...},                  // o estado atual, exatamente como hoje
  presetGeralAtivo: id | null
}
```

O nome exibido é **derivado** (`Natal 2026 · Hospedeira`), nunca digitado à mão. Nome livre impediria a ferramenta de saber que as duas páginas pertencem à mesma campanha.

---

## 3. Os seis refinamentos — decisões

### R1 — Campanha e página são dois campos

**Decisão:** dois campos. `campanha` é texto livre **com sugestão das campanhas já existentes** (evita "Natal 2026" e "Natal26" convivendo por engano). `pagina` é escolha fechada de duas.

**Ganho:** o seletor agrupa por campanha, e a ferramenta pode comparar as duas páginas da mesma campanha.

**Aviso de divergência:** quando as duas páginas da mesma campanha têm a **mesma aba ativa** com valores diferentes num campo operacional (WhatsApp, chave Pix, Client ID do PayPal, nome/cidade do recebedor), mostrar aviso âmbar nomeando o campo. **Não bloqueia** — pode ser intencional. Só dispara quando a aba está ativa nas duas: sem isso não há o que comparar.

### R2 — O preset geral registra quais abas participam da página

**Este é o refinamento que evita um defeito.** Sem ele, selecionar "Natal — Embutida" faria o painel montar uma Tag Body **com o bloco de captação de leads dentro**, numa página que não deveria tê-lo. O painel pareceria funcionar e entregaria errado.

**Decisão:** cada aba, dentro de um preset geral, está `ativa` ou `fora`.

- A barra de abas mostra o estado: aba fora fica esmaecida, com rótulo "fora desta página". Continua clicável — é preciso poder ligá-la.
- No topo de cada aba, um interruptor: "usar esta aba na página HOSPEDEIRA".
- O painel consolidado inclui **apenas abas ativas**.
- Desligar uma aba **preserva os valores**. Religar restaura. Nunca destrói.

**Padrão ao criar preset geral novo: todas as abas FORA.** O operador liga o que usa.

Justificativa do padrão: "fora" falha de forma **visível** (falta um bloco, ele percebe na página); "dentro" falha de forma **invisível** (um bloco a mais numa página publicada). Entre um defeito visível e um invisível, este projeto escolhe o visível — a mesma regra que decidiu o clamp à vista dos campos numéricos e a recusa com aviso no limiar de urgência.

### R3 — Cópia com marca de origem, nunca atalho

**Decisão:** o preset geral guarda **os valores** (cópia), e anota de onde vieram: `origem: {preset, carimbo}`.

Por que não ponteiro: editar um preset de aba mudaria em silêncio todas as campanhas que o usam, e apagá-lo quebraria os presets gerais — problema que a consolidação do código 1 das Bordas já teve de tratar explicitamente.

Por que anotar a origem mesmo assim:

- Se o preset de origem mudou depois da cópia → aviso discreto na aba: *"veio de 'Botão WhatsApp Natal', que mudou depois — ver diferença / atualizar / desvincular"*.
- Se o operador editou os valores direto → origem vira *"modificado a partir de 'X'"*.
- Se o preset de origem foi apagado → **nada quebra**; o aviso passa a dizer que a origem não existe mais.

**Nunca atualiza sozinho.** Divergência visível com oferta de conciliar, em vez de propagação silenciosa. É a regra do projeto.

### R4 — Um arquivo de backup, não um por página

**Decisão:** dois botões com propósitos distintos.

| Botão | Conteúdo | Nome do arquivo |
|---|---|---|
| **Exportar tudo** | todos os presets gerais, todos os presets de aba, o rascunho | `construtores-fotocerta-AAAA-MM-DD-{com\|sem}-dados.json` |
| **Exportar este preset geral** | uma campanha-página, para repassar | `preset-natal-2026-hospedeira-{com\|sem}-dados.json` |

A página **já está dentro** do preset geral; separar em dois arquivos duplicaria uma distinção que o arquivo carrega, e criaria a chance de restaurar um e esquecer o outro. Backup é completo por definição.

**Dados operacionais:** escolha na hora de exportar, e o **nome do arquivo diz qual é** (`-com-dados` / `-sem-dados`). O nome é a salvaguarda: ele decide de relance se aquele arquivo pode ser enviado a alguém.

**Importação:**

1. Aceita as duas formas de arquivo (backup completo ou preset único).
2. **Nunca sobrescreve calado.** Mostra o resumo antes — *"3 presets gerais novos, 2 que já existem (serão substituídos), 7 presets de aba novos"* — e pede confirmação.
3. Colisão de nome: oferece **substituir** ou **importar como cópia**.
4. Valores passam pelas travas que já existem (`fcAjustarTodos`, `corValida`, `urlLimpa`). O que não for reconhecido é **descartado com a contagem à vista**, nunca em silêncio.
5. **Arquivo "sem dados" NÃO apaga os dados atuais.** Se o arquivo não traz WhatsApp e o navegador tem um, o atual permanece. Importar backup seguro não pode esvaziar campo preenchido.

### R5 — O código colado à mão mora no preset geral

**Decisão:** dois campos de texto no preset geral — "Outros códigos meus — Tag Head" e "— Tag Body".

O painel os coloca **primeiro**, antes dos blocos gerados, com uma linha de fronteira:

```
/* --- daqui para baixo, gerado pelos Construtores Foto Certa --- */
```

Como é por página, fica automaticamente certo ao trocar de campanha.

**Aviso no ponto de cópia, não na documentação:** o painel declara, ao lado do botão Copiar — *"Este painel só conhece o que está aqui. Se a sua Tag Body tiver código que você colou à mão e não está na caixa de códigos manuais, colar isto apaga aquilo."*

### R6 — Preset ativo sempre visível, e troca que não engole trabalho

**Decisão, três partes:**

1. **Barra fixa acima das abas** com campanha, página e estado (`salvo` / `alterado`).
2. **Troca com alterações não salvas bloqueia** e oferece: salvar / descartar / cancelar. Nunca em silêncio.
3. **A saída consolidada se identifica.** Primeira linha de cada campo:

```
/* Construtores Foto Certa -- Natal 2026 -- pagina HOSPEDEIRA -- Tag Body */
```

A terceira é a mais valiosa: se o operador colar a Tag Body da embutida na hospedeira, **a prova fica no próprio campo**, legível meses depois. É a mesma ideia dos cabeçalhos de identificação que os blocos de Leads e Contagem ganharam na revisão final.

---

## 4. Decisões adicionais que tomei

### O rascunho continua existindo

Sem preset geral selecionado, a ferramenta se comporta **exatamente como hoje**: restaura os últimos valores usados. Isso é o estado "Rascunho".

Consequência importante: **o recurso é aditivo e a migração tem risco zero.** Quem nunca usar preset geral não perde nada, e o estado salvo hoje no navegador não é tocado. Criar um preset geral a partir do que está na tela é um botão: "Salvar como preset geral".

### Componentes continuam fora da consolidação

Só Tag Head e Tag Body são campos de página. Slideshow, Checkout, TidyCal (saídas 1 e 3) e o código 2 das Bordas vão para **componentes individuais**, cada um com campo próprio — não há o que consolidar. O painel os lista como "saídas por componente", com o botão de copiar cada uma, mas sem juntá-las.

A Contagem regressiva cai nos dois lados: modo *barra fixa* → Tag Body; modo *no fluxo* → componente. O painel acompanha a escolha.

### Colisão de mesmo efeito fica visível

Dois componentes com o mesmo efeito de borda e parâmetros diferentes colidem — limitação já documentada e tratada com recusa na consolidação do código 1. Com o painel, os dois blocos aparecem lado a lado e a colisão **salta aos olhos** em vez de ser descoberta na página publicada.

---

## 5. Importador de galeria

Pedido separado, medido em 20/08/2026.

### O obstáculo, medido

**O navegador impede a ferramenta de ler uma página do fotocerta.com.br.** Testado de uma origem neutra (`http://localhost:8977`): `TypeError: Failed to fetch`. É a política de origem cruzada, não defeito. Só um servidor contornaria, e a ferramenta não tem servidor por decisão de projeto.

### O desenho que funciona

Duas colagens: **o link da galeria** (de onde sai o número) e **o código-fonte da página** (`Cmd ⌥ U` → `Cmd A` → `Cmd C`).

### Os dois tipos de galeria do Prosite

| Tipo | Caminho | Pasta das fotos |
|---|---|---|
| Galeria | `/gallery/121894-estudio-tematico` | `/sites/4555/galleries/121894/` |
| Portfólio | `/portfolio/ensaio-casal/1518588-...` | `/sites/4555/albuns/1518588/` |

O número está no link nos dois casos. O importador conhece as duas pastas.

### Achados que mudam o resultado

1. **A fonte é mais completa que a tela.** Na *Estúdio Temático*, só **10 fotos** estavam carregadas no navegador (o resto carrega ao rolar); a fonte trazia **46**. Colar a fonte não é só o jeito possível — é o que não perde foto.

2. **Cada foto aparece várias vezes, reduzida.** 139 endereços para 46 fotos, em recortes diferentes. O endereço reduzido carrega o original dentro dele, depois de `/url/`. O importador **desembrulha e junta as repetidas**. Sem esse passo, o recurso nasceria entregando foto repetida e borrada — e só se notaria na página publicada.

3. **A descrição das fotos não serve de legenda.** Medido nas duas galerias: todas as fotos compartilham o mesmo texto, escrito para buscadores. As duas opções pedidas pelo dono (sem legenda / uma legenda padrão) são as únicas viáveis.

4. **O título da galeria serve.** "Estúdio Temático". O importador o extrai da fonte e oferece como sugestão de legenda padrão.

### Decisões

- **Tamanho:** importar em **1400 px** por padrão, com opção de trazer o original. O slideshow tem 900 px de largura; originais de vários megabytes deixam a página lenta sem ganho visível.

  > **Corrigido na implementação (20/08/2026): esta decisão partia de uma premissa falsa.** Medidas as 104 fotos das duas galerias, o storage **já entrega tudo com 1200 px de largura** (85 fotos 1200×~800, 19 retratos 1200×~1800), de 150 a 610 KB — não há original de vários megabytes. Pedir 1400 px ao redimensionador funciona (responde 200, devolve 1400×933), mas **estica** a foto de 1200: nenhum detalhe a mais e, em 3 das 5 fotos medidas, arquivo **maior** que o original. O construído oferece **o que a galeria entrega (1200 px, padrão)** e uma redução real para **900 px** — a largura padrão do slideshow, 15% a 55% menos bytes por foto. Medido também que o `?t=` do original não atrapalha ao ser embrulhado no redimensionador.
- **Ordem:** preservada como aparece na fonte.
- **Duplicatas:** removidas após desembrulhar.
- **Conferência antes de aplicar:** mostra quantas fotos encontrou e de qual galeria, e o operador confirma. Se encontrar zero, diz o motivo provável (link e fonte de galerias diferentes).

---

## 6. Ordem de construção e custo

| # | Fase | Estimativa |
|---|---|---|
| 1 | Importador de galeria | 2–3h |
| 2 | Presets de aba nas seis abas | 2–3h |
| 3 | Preset geral (modelo, barra, seletor, abas ativas, origem) | 4–5h |
| 4 | Exportar / importar JSON | 2–3h |
| 5 | Painel consolidado | 3–4h |
| | **Total** | **13–18h** |

Cresceu de 11–15h porque os refinamentos acrescentaram substância real (abas ativas, marca de origem, conferência na importação). A margem de 40% para rodadas de revisão está incluída — é a lição medida nas seis fases: o que se subestima não é construir, é corrigir o que a revisão acha.

**Por que o importador primeiro:** é o menor e destrava hoje. A aba Slideshow está vazia e o bloco publicado precisa ser regerado para fechar a correção de movimento reduzido. Sem o importador, isso é cadastrar foto por foto.

**Por que o painel por último:** ele depende do preset geral para saber a página. Construído antes, precisaria ser refeito.

---

## 7. Riscos assumidos

- **Aumento de conceitos.** Abas, campos, presets de aba, preset geral, campanha, página, códigos manuais, painel. Para campanhas repetidas, paga. Mitigação: o rascunho continua funcionando sem nada disso, então quem não quiser a estrutura não a encontra.
- **O painel entrega o campo inteiro.** Se o operador tiver código manual fora da caixa, colar apaga. Mitigado pelo aviso no ponto de cópia e pela linha de fronteira — mas o risco não é zero e está registrado aqui de propósito.
- **A importação depende do formato do Prosite.** Se a Alboom mudar a estrutura de endereços, o importador para. Mitigação: quando encontrar zero fotos, dizer o motivo provável em vez de falhar mudo.
