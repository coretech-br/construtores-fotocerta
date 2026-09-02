# Agendamento por pacote — plano de implementação

> **Para quem executa:** use `superpowers:subagent-driven-development` — um subagente por tarefa, com revisão entre elas. Os passos usam `- [ ]` para marcação.

**Goal:** uma décima aba na ferramenta, que agrupa N tipos de agendamento do TidyCal por duração/preço numa vitrine de dois passos, e gera a página de obrigado que cobra o pacote agendado por Pix ou cartão.

**Architecture:** três saídas de texto. (1) um componente HTML autossuficiente com os cartões e **um** iframe do TidyCal criado sob demanda; (2) uma lista de N endereços de redirecionamento para colar no TidyCal, cada um com o código fixo do pacote; (3) um componente HTML para a página de obrigado, que lê `?pac=` da URL, acha o pacote no catálogo embutido nele, troca marcadores no texto da página e monta o pagamento. O catálogo é digitado uma vez na aba e emitido nos dois blocos.

**Tech Stack:** ES5 puro dentro dos blocos gerados (o Prosite não transpila nada). Sem framework. Bibliotecas externas só as que já são usadas: `qrcodejs 1.0.0` do cdnjs (QR do Pix), o SDK do PayPal, e o `embed.js` do TidyCal.

**Spec:** `docs/specs/2026-09-02-agendamento-por-pacote-design.md` — **leia antes de qualquer tarefa.**

**Decisões já tomadas:** `docs/decisoes-2026-09-02-agendamento-por-pacote.md` — **dez**, todas com a razão. Não as reabra sem motivo novo.

---

## Global Constraints

Estas valem para **toda** tarefa. São as regras do projeto (`CLAUDE.md` e a documentação); quebrar qualquer uma reprova a tarefa.

**No código GERADO (o que vai para o Prosite):**

1. **`addEventListener`, nunca `onclick`** ou qualquer manipulador embutido no HTML.
2. **Tags blindadas por concatenação** dentro de strings JS: `'<scr'+'ipt>'`, `'</sty'+'le>'`, `'<ifr'+'ame'`. Nenhuma das cinco sequências (`<script`, `</script`, `<style`, `</style`, `<iframe`) pode aparecer inteira dentro de uma string.
3. **Só `<div>` na estrutura.** Nada de `<section>`, `<header>`, `<main>`, `<article>`, `<nav>`, `<footer>` — o tema do Prosite não os trata.
4. **Todo script numa IIFE única.**
5. **Marcadores de seleção desenhados** — radio/checkbox nativos são ocultados pelo tema.
6. **`text-align:left` forçado** nos cartões: o tema centraliza texto.
7. **At-rules (`@media`, `@keyframes`) só dentro de `<style>`** no HTML do componente. Nunca no campo *CSS Customizado*.
8. **ES5.** Sem `let`, `const`, arrow, template literal, `Array.from`, `Object.assign`, `URLSearchParams`, `classList.toggle` com segundo argumento.
9. **Acentuação (regra de 01/09/2026):** **texto que uma pessoa lê sai acentuado** — na tela do cliente e na mensagem do WhatsApp. **Código não leva acento**: comentário, identificador, CSS, e o payload Pix. Não existe faixa intermediária.
10. **A palavra "PayPal" não entra em texto nosso.** O cliente lê "no cartão". Os botões que o SDK do PayPal desenha são deles — esses não contam e não há como mudá-los.

**No código da FERRAMENTA (`index.html`):**

11. **Sem acento em comentário nem identificador**; texto de interface **com** acento literal.
12. **Prefixos:** campos da aba `a-`, saídas `a-out1`/`a-out2`/`a-out3`, classes do bloco gerado `fca-`. O `id` da aba em `ABAS` é `pac`.
13. **Dados operacionais nunca são versionados.** Campo que receba chave Pix, WhatsApp, Client ID nasce `value=""` com `placeholder`. **Nem esses campos existem nesta aba** — eles moram no painel Identidade e se lê com `fciVal(...)`.
14. **A prévia executa o gerador, nunca o imita.**
15. **Nada é reescrito.** Se algo que você vai escrever já existe como fonte compartilhada, use a fonte.

**Invariante da rodada, e ele reprova qualquer tarefa que o quebre:**

> **As 21 saídas das nove abas existentes têm de sair byte a byte idênticas.** Comando: `scripts/verificar/regressao.sh`. Uma aba nova não pode mudar um byte do que as outras produzem.

---

## Contrato de integração (medido em 02/09/2026, `index.html` com 17.985 linhas)

Você **não precisa** procurar nada disto — está tudo aqui com o número de linha. Leia o trecho real antes de editar.

| O que | Onde | Precisa de ação manual? |
|---|---|---|
| Registro `ABAS` | linha **3964** | **Sim** — entrada nova |
| Botões da barra de abas | linhas **720–730** | **Sim** — `<button id="aba-pac">` |
| Painéis das abas | `painel-*`, o último em **2901** | **Sim** — `<div class="painel" id="painel-pac">` |
| Wiring de clique da barra | **17548–17570**, dentro de `prep('Barra de abas',...)` | **Sim** — `liga('aba-pac',function(){trocarAba('pac');aPreview(true);});` |
| `fccDaAba` (painel consolidado) | linha **17122**, cadeia `if/else if` por `a.id` | **Sim** — ramo `else if(a.id==='pac')` |
| `FCC_FORA` (saída fora do Prosite) | linhas **17241–17243** | **Sim** — declarar `a-out2` |
| `trocarAba`, `fcAbasIds`, `fcAbasTxt` | 3805, 3787, 3788 | **Não** — derivam de `ABAS` |
| `FC_NUM_EXTENSO` | 3788 | **Não** — já tem 11 posições, cobre "dez" |
| Presets por aba | `fcPresetsMontar` 5059; loop em **17805–17809** | **Não**, além de declarar as chaves e o `<div id="fcp-a-box">` |
| Exportar/importar tudo | percorre `ABAS` | **Não**, além de `chaves`/`coleta`/`listas` |
| Botão "Gerar todos os códigos" | `fccGerarTodos` 17453 | **Não**, além de declarar `gerar` |
| `fccOrfas` (rede de saída esquecida) | **17249–17264** | **Não** — varre `/^[a-z]-out[0-9]*$/` sozinha |

**Forma de uma entrada de `ABAS`** (copiada da do Checkout, 3985–3991):

```js
{id:'uni',  nome:'Checkout',            chaves:['u'],         coleta:uColeta,restaura:uRestaura,gerar:uGerar,
 pref:'u',fora:[],resumo:uPresetResumo,redesenhar:uPresetDepois,antesDeSalvar:uPresetAntes,
 listas:[['u.prods',{...molde de UM item...},'nome'],
         ['u.cps',{codigo:'',tipo:'pct_total',valor:0,validade:''},'codigo']],
 exemplo:'ex.: Natal 2026 - pacotes',
 guarda:'tudo o que está configurado nesta aba — ...'},
```

**`fccItem`** (17117–17121) — o construtor de item do plano do painel:

```js
function fccItem(a,idOut,rotulo,destino,nota){
  var el=$(idOut),txt=el?el.value:'';
  return {aba:a,id:idOut,rotulo:rotulo,destino:destino,nota:nota||'',
    texto:txt,vazio:!txt,alvo:'fcc-o-'+idOut};
}
```
As quatro listas de destino são `plano.head`, `plano.body`, `plano.comps`, `plano.outra`.

**Campos numéricos** — declare `A_NUMS` no formato `[id, padrão, mínimo, máximo, arredondaParaInteiro]` (modelo em 10130) e ligue com `fcLigarFaixa(A_NUMS,function(){aPreview(true);});`. Em `aGerar`, `if(fcAjustarTodos(A_NUMS))salvarEstado();` **antes** de montar a configuração.

**Identidade** — `fciVal('chave'|'nomer'|'cidade'|'client'|'zapnum')` (4263–4267). Recusa com `fciRecusa(texto)` e, depois do `alert`, `fciApontarSe(recusa)`.

**Padrão do `aGerar`** (copiado de `uGerar`, 10641–10651). **Ele NÃO nasce pronto: cada tarefa acrescenta a sua linha.** Escrevê-lo completo na Tarefa 1 referenciaria funções que só existem na Entrega 2, e o botão "Gerar código" da aba inteira quebraria — inclusive a vitrine, que a Entrega 1 promete entregar funcionando sozinha.

Forma na **Tarefa 1** (esqueleto que já roda):

```js
function aGerar(){
  if(fcPixChaveAjustar('fci-chave'))fciGravar();
  if(fcAjustarTodos(A_NUMS))salvarEstado();
  var cfg=aCfg();
  var recusa=aRecusa(cfg);
  if(recusa){alert(recusa);fciApontarSe(recusa);return;}
  aPreview(true);
  fccMarcar('pac');
}
```

Quem acrescenta o quê, e **em que tarefa**:

| Tarefa | Linha que ela acrescenta, antes do `aPreview(true)` |
|---|---|
| 2 | (nenhuma — ela escreve `aRecusa`, que o esqueleto já chama) |
| 3 | `$('a-out1').value=aBlocoVitrine(cfg);` |
| 5 | `$('a-out2').value=aEnderecos(cfg);` |
| 7 | `$('a-out3').value=aBlocoObrigado(cfg);` |

Na Tarefa 1, `aRecusa` ainda não existe — declare-a como `function aRecusa(){return '';}` e deixe a Tarefa 2 substituí-la. **Nenhuma função pode ficar indefinida em nenhum momento**, senão o wiring lança ao carregar a ferramenta.

**Fontes compartilhadas a consumir** (não reescreva nenhuma):

| Fonte | Onde | Contrato por nome |
|---|---|---|
| `FC_PIX_SRC` (`.semAcento`, `.tlv`, `.crc16`, `.montarPayload`) | `fc-compartilhado.js:84+` | o bloco declara `CHAVE_PIX`, `NOME_RECEBEDOR`, `CIDADE`, `CODIGO_PEDIDO` |
| `fcTotalPixSrc(descpix,usaPix,usaSinal)` | `fc-compartilhado.js:450` | o bloco declara `total()` e `DESCONTO_PIX`. **Chame com `usaSinal=false`.** |
| `fcMoedaFmtGer(true)` | `index.html:3334` | só reais, com separador de milhar |
| `FC_PARAM_SRC` | `index.html:11454` | o leitor `param(nome)` da URL |
| `escHtml` / `escAttr` / `escJs` / `esc` | `index.html:3234–3262` | ver a regra de destino na linha 3244 |
| `fcPvShim(o)` | `index.html:3534` | shim de armazenamento da prévia |

**O pedido do PayPal NÃO é fonte compartilhada — a spec §9 está errada nesse ponto.** Medido em 02/09: `actions.order.create` aparece **três vezes**, escrito à mão em cada gerador (Checkout 11303, `/pagar` 14746, Mini loja 16860), e **nenhuma função compartilhada o escreve**. A Tarefa 8 escreve a quarta cópia, espelhada na da `/pagar` (item único), e a dívida fica registrada em `docs/pendencias.md`. Ver a decisão 8 do diário: extrair fonte única agora exigiria provar a igualdade byte a byte de três saídas existentes no meio de outra rodada, e isso destrói a capacidade de dizer o que quebrou quando a regressão acusar.

**Modelo do bloco de pagamento: a aba Link de cobrança, não o Checkout** (decisão 1 do diário). O QR com tratamento de falha está em `index.html:14505–14520` — copie **aquele** desenho: se a biblioteca não carregar, a caixa do QR **some** em vez de deixar um retângulo branco.

**Modelo do embed do TidyCal:** `index.html:9973–10003`. Os dois sinais e as medidas calibradas em produção:

```
origem:  https://tidycal.com    prefixo: [iFrameSizer]
scrollToOffset  -> modal ABRIU  -> min-height = 2350px (desktop) / 2700px (mobile, ate 700px de largura)
mutationObserver -> modal FECHOU -> remove min-height   (ignorar nos 800ms seguintes a abertura)
```

---

## File Structure

| Arquivo | O que muda |
|---|---|
| `index.html` | tudo: o painel da aba, os geradores, a prévia, e os cinco pontos de integração da tabela acima |
| `previa.html` | **novo**, poucos bytes. Existe só para ser um endereço de mesma origem que aceita `?pac=` — ver Tarefa 10 |
| `scripts/verificar/geradores.mjs` | o cenário ganha a décima aba, para as saídas dela entrarem na fotografia |
| `docs/documentacao-fotocerta.md` | a décima aba, e a correção das 17.985 linhas |
| `docs/pendencias.md` | o que ficou para o dono |
| `CLAUDE.md` | o inventário ganha `previa.html` |

Nenhum arquivo novo além de `previa.html`. **Não crie arquivo de teste versionado** sem que o plano peça: a convenção do projeto é arnês reutilizável em `scripts/verificar/` e roteiros concretos descartáveis.

---

# ENTREGA 1 — A VITRINE

---

### Task 1: O esqueleto da aba

**Files:**
- Modify: `index.html` — barra de abas (720–730), painel novo depois de `painel-efe` (2901+), `ABAS` (3964), wiring (17548–17570)

**Interfaces:**
- Produces: `aColeta()`, `aRestaura(st)`, `aCfg()`, `A_NUMS`, e o fragmento `st.a`. As tarefas seguintes consomem `aCfg()`.

O fragmento `st.a` tem esta forma exata (as tarefas seguintes dependem destes nomes):

```js
{a:{
  pacotes:[],                  /* Tarefa 2 preenche */
  urlobrigado:'',              /* endereco da pagina de obrigado */
  prefixo:'',                  /* prefixo do identificador de conciliacao */
  prazoh:24,                   /* horas de reserva */
  descpix:5,                   /* desconto no Pix, em % */
  parcelas:1,                  /* parcelas no cartao */
  altdesk:2350, altmob:2700, largmob:700,   /* alturas do modal do TidyCal */
  c1:'#0F3A30', c2:'#ffffff', c3:'#333333', /* destaque, fundo do cartao, texto */
  t1:'Agende seu ensaio',      /* titulo da vitrine */
  t2:'Escolha o pacote',       /* rotulo do passo 1 */
  t3:'Escolha o dia e o horário',
  t4:'Trocar pacote',
  t5:'Tudo certo!'             /* titulo da pagina de obrigado */
}}
```

**Não declare `presets` aqui.** Quem o acrescenta é o próprio arcabouço, em `fcEstadoAtual` (`if(frag&&frag[a.pref])frag[a.pref].presets=fcPresets[a.id]||[];`). `uColeta` não o tem, e esta também não deve ter.

- [ ] **Passo 1: Ler o contrato.** Leia, no arquivo real: `index.html:720–730`, `index.html:2901` (o começo do último painel, como modelo de estrutura), `index.html:3964–4012` (o registro `ABAS` inteiro), `index.html:17548–17570`. Não edite nada ainda.

- [ ] **Passo 2: O botão da barra.** Em `index.html:730`, depois do botão `aba-efe`, acrescente:

```html
      <button class="aba" id="aba-pac" role="tab" aria-selected="false">Agendamento por pacote</button>
```

- [ ] **Passo 3: O painel vazio, com a estrutura obrigatória.** Depois do fechamento do `painel-efe`, acrescente o painel novo. Estrutura mínima desta tarefa (as seções ganham conteúdo nas tarefas seguintes):

```html
<div class="painel" id="painel-pac" role="tabpanel">
  <p class="descricao"><b>Agendamento por pacote</b> — agrupa vários tipos de agendamento do TidyCal numa página só. O cliente escolhe o pacote pelo preço e vê apenas o calendário daquela duração. Gera também a página de obrigado, que cobra o pacote agendado por Pix ou cartão.</p>

  <div class="secao primeira"><span class="secao-n">1</span> Pacotes</div>
  <div class="grade"><div><fieldset><legend>Cadastro</legend></fieldset></div></div>

  <div class="secao"><span class="secao-n">2</span> Página de obrigado e pagamento</div>
  <div class="grade"><div><fieldset><legend>Configuração</legend></fieldset></div></div>

  <div class="secao"><span class="secao-n">3</span> Aparência e textos</div>
  <div class="grade"><div><fieldset><legend>Cores</legend></fieldset></div></div>

  <div class="secao"><span class="secao-n">4</span> Biblioteca de presets</div>
  <div class="grade" id="fcp-a-box"></div>

  <div class="secao"><span class="secao-n">5</span> Prévia e códigos gerados</div>
  <div class="acoes" style="margin-bottom:14px">
    <button class="botao" id="a-gerar">Gerar código</button>
    <button class="botao claro" id="a-atualizar">Atualizar prévia</button>
  </div>
  <div class="grade">
    <div><div class="pv-area"><div id="a-pv-box"></div></div></div>
    <div>
      <div class="saida">
        <h3>1. Componente HTML da vitrine
          <button class="botao mini" id="a-copy1" style="margin-left:8px">Copiar</button>
          <span class="aviso-copiado" id="a-cop1">Copiado!</span></h3>
        <textarea id="a-out1" readonly spellcheck="false" style="height:220px" placeholder="O código gerado aparece aqui."></textarea>
      </div>
      <div class="saida">
        <h3>2. Endereços de redirecionamento (cole no TidyCal)
          <button class="botao mini" id="a-copy2" style="margin-left:8px">Copiar</button>
          <span class="aviso-copiado" id="a-cop2">Copiado!</span></h3>
        <textarea id="a-out2" readonly spellcheck="false" style="height:150px" placeholder="Um endereço por pacote."></textarea>
      </div>
      <div class="saida">
        <h3>3. Componente HTML da página de obrigado
          <button class="botao mini" id="a-copy3" style="margin-left:8px">Copiar</button>
          <span class="aviso-copiado" id="a-cop3">Copiado!</span></h3>
        <textarea id="a-out3" readonly spellcheck="false" style="height:220px" placeholder="O código gerado aparece aqui."></textarea>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Passo 3b: Os campos de configuração das seções 2 e 3.** *(Este passo foi acrescentado depois da revisão do plano: sem ele, `A_NUMS` referencia `a-prazoh`, `a-descpix` e `a-parcelas`, que não existiriam no DOM, e a tarefa é literalmente inexecutável.)*

**Seção 2 — Página de obrigado e pagamento.** Duas caixas na `.grade`:

- Caixa 1, *Página de obrigado*: `a-urlobrigado` (texto, `placeholder="https://www.fotocerta.com.br/obrigado"`), `a-prefixo` (texto, `placeholder="ex.: FC"`), `a-prazoh` (número).
- Caixa 2, *Pagamento*: `a-descpix` (número), `a-parcelas` (número).

**Três avisos de interface que a spec pede por nome, e que precisam sair escritos** (§6.1 notas 1, 2 e 3, e §12 risco 3). Cada um é um `<p class="ajuda">` logo abaixo do campo a que se refere:

- Ao lado de `a-parcelas`: *"Este número é uma promessa sobre o que o cliente vai encontrar no cartão, e quem decide isso é a operadora — a ferramenta não tem como conferir. Deixe em 1 até confirmar no PayPal quantas parcelas a sua conta oferece. O valor da parcela é calculado dividindo o preço, e afirma parcelamento sem juros."*
- Ainda na caixa de pagamento: *"Os dois botões de cartão são desenhados pelo PayPal, e o texto e a marca deles são do PayPal — isso não dá para mudar. Em todo o resto da página, o cliente lê apenas 'no cartão'."*
- Ao lado de `a-urlobrigado`: *"Se você mudar o preço de um pacote, quem agendou antes e pagar depois verá o preço novo. O preço mora no código da página, não no endereço — foi assim que se evitou que o cliente pudesse editá-lo na barra de endereço."*

**Seção 3 — Aparência e textos.** Caixa 1, *Cores*: `a-c1` (destaque), `a-c2` (fundo do cartão), `a-c3` (texto), no padrão `.cor-linha` das outras abas (`<input type="color">` + `<input type="text">` espelhado). Caixa 2, *Textos*: `a-t1` a `a-t5`, mais `a-altdesk`, `a-altmob`, `a-largmob` num fieldset *Altura do calendário* com a ajuda explicando que são as medidas calibradas em produção.

- [ ] **Passo 4: `A_NUMS`, `aColeta`, `aRestaura`.** Num bloco novo de script, junto dos outros geradores. `A_NUMS` (formato `[id,padrão,min,max,inteiro]`):

```js
var A_NUMS=[['a-prazoh',24,1,720,true],['a-descpix',5,0,90,false],['a-parcelas',1,1,12,true],
  ['a-altdesk',2350,800,6000,true],['a-altmob',2700,800,6000,true],['a-largmob',700,320,1024,true]];
function aPreso(id){return fcPreso(A_NUMS,id);}
```

`aColeta` devolve `{a:{...}}` com a forma declarada em **Interfaces** acima, lendo cada campo do DOM. `aRestaura(st)` faz o caminho inverso, com `|| ''` / `|| padrão` em todo campo (estado de versão anterior não tem as chaves novas). Cor inválida passa por `corValida` como as outras abas fazem.

- [ ] **Passo 5: A entrada em `ABAS`.** Depois da entrada `efe`:

```js
  {id:'pac', nome:'Agendamento por pacote', chaves:['a'],       coleta:aColeta,restaura:aRestaura,gerar:aGerar,
   pref:'a',fora:[],resumo:aPresetResumo,redesenhar:aPresetDepois,antesDeSalvar:aPresetAntes,
   listas:[['a.pacotes',{cod:'',nome:'',dur:'',preco:0,inclui:'',link:''},'cod']],
   exemplo:'ex.: Ensaios 2026 - pacotes',
   guarda:'tudo o que está configurado nesta aba — os pacotes (código, nome, duração, preço, o que inclui e o link do TidyCal de cada um), o endereço da página de obrigado, o prefixo do identificador, o prazo da reserva, o desconto no Pix, as parcelas, as alturas do calendário, textos e cores.'},
```

`aPresetResumo`, `aPresetDepois` e `aPresetAntes` seguem o modelo de `mPresetResumo`/`mPresetDepois`/`mPresetAntes` (15098–15113). O resumo **nunca mostra dado operacional** — diga só a contagem de pacotes e a faixa de preço.

- [ ] **Passo 6: O wiring.** Em `prep('Barra de abas',...)`, junto das outras:

```js
  liga('aba-pac',function(){trocarAba('pac');aPreview(true);});
```

E, num `prep` próprio da aba: `liga('a-gerar',aGerar);`, `liga('a-atualizar',function(){aPreview(true);});`, os três `liga('a-copyN',function(){copiar('a-outN','a-copN');});`, e `fcLigarFaixa(A_NUMS,function(){aPreview(true);});`.

Nesta tarefa, `aGerar` e `aPreview` podem ser esqueletos que não fazem nada (`function aGerar(){} function aPreview(){}`) — as tarefas seguintes os preenchem. **Não deixe função indefinida**, senão o wiring lança.

- [ ] **Passo 7: Provar que a aba existe e que nada quebrou.** Sirva a ferramenta e confira, **como operador**: a décima aba aparece na barra; clicar nela troca o painel; recarregar a página mantém o painel certo. Depois:

```bash
scripts/verificar/regressao.sh
```
Esperado: **REGRESSAO: OK**, zero divergências. Se alguma das 21 saídas mudou, você quebrou uma aba existente — conserte antes de commitar.

- [ ] **Passo 8: Commit.**

```bash
git add index.html
git commit -m "A decima aba nasce: esqueleto, registro e wiring"
```

---

### Task 2: O catálogo de pacotes

**Files:** Modify: `index.html` — seção 1 do painel `pac`, e o bloco de script da aba

**Interfaces:**
- Consumes: `aColeta`/`aRestaura` da Tarefa 1
- Produces: `aPacRender()`, `aPacAdd()`, **`aRecusa(cfg)`** (substitui o esqueleto da Tarefa 1), `aUrlOk(v)`, e `cfg.pacotes` com a forma `{cod,nome,dur,preco,inclui,link}`

- [ ] **Passo 1: O formulário e a lista.** A seção 1 ganha duas caixas na `.grade`: à esquerda o cadastro, à direita a lista. Campos do cadastro: `a-pcod`, `a-pnome`, `a-pdur`, `a-ppreco`, `a-pinclui`, `a-plink`, e o botão `a-pac-salvar`. A lista `a-pac-lista` é um `<ul class="lista-imgs">`, com o vazio em `a-pac-vazio`.

Modelo de lista editável em linha: `uCpRender` (10296+) ou `mProdRender`. Cada item tem os seis campos editáveis, botões de subir/descer e remover, e **redesenha a prévia** a cada alteração (`aPreview()`), não só ao gravar.

- [ ] **Passo 2: A correção à vista do código.** O código do pacote aceita `[A-Za-z0-9-]`. No `change`/`blur` (**nunca** no `input`, que mexeria com o cursor), o campo se corrige sozinho: remove o que não é permitido e passa a maiúsculas. Modelo: `uCpCodAjustar` (10309–10311).

- [ ] **Passo 2b: `aUrlOk`, e por que ela não pode ser escrita de memória.** *(Acrescentado depois da revisão: a versão anterior deste plano chamava `aUrlOk` sem nunca defini-la.)*

O padrão do projeto é cada aba ter a sua (`sUrlOk` 7100, `tUrlOk` 9827, `cUrlOk` 13236). **Copie `tUrlOk` (linha 9827)**, que é a mais completa, e leia o comentário dela antes:

```js
function aUrlOk(v){
  var limpo=urlLimpa(v);
  if(!limpo)return false;
  if(/^https?:\/\//i.test(limpo))return true;
  /* caminho do proprio site: UMA barra. Com duas o endereco e protocol-relative --
     "//evil.com/x" resolve para OUTRO host, herdando so o esquema da pagina. */
  if(limpo.charAt(0)==='/'&&limpo.charAt(1)!=='/')return true;
  return false;
}
```

A recusa do endereço protocol-relative **não é detalhe**: sem ela, `//evil.com/x` passa como "caminho do próprio site" e o TidyCal redirecionaria o cliente para outro host. Está registrado na documentação como correção de uma rodada anterior.

- [ ] **Passo 3: As recusas.** `aRecusa(cfg)` devolve texto ou `''`. Na ordem:

```js
function aRecusa(cfg){
  var i,j,p,q,vistos={},limpo;
  if(!cfg.pacotes.length)return 'Cadastre ao menos um pacote.';
  if(!cfg.urlobrigado)return 'Informe o endereço da página de obrigado.';
  if(!aUrlOk(cfg.urlobrigado))return 'O endereço da página de obrigado precisa começar com https:// e ter o domínio.';
  for(i=0;i<cfg.pacotes.length;i++){
    p=cfg.pacotes[i];
    if(!p.cod)return 'O pacote "'+(p.nome||('#'+(i+1)))+'" está sem código. O código é o que o TidyCal guarda para identificar o pacote.';
    if(!/^[A-Za-z0-9-]+$/.test(p.cod))return 'O código "'+p.cod+'" tem caractere que não pode ir na URL. Use apenas letras, números e hífen.';
    limpo=p.cod.replace(/[^A-Za-z0-9]/g,'').toUpperCase();
    if(vistos[limpo])return 'Os códigos "'+vistos[limpo]+'" e "'+p.cod+'" viram o mesmo identificador no Pix ('+limpo+'), porque o Pix aceita apenas letras e números. Troque um dos dois.';
    vistos[limpo]=p.cod;
    if(!p.nome)return 'O pacote "'+p.cod+'" está sem nome.';
    if(!(parseFloat(p.preco)>0))return 'O pacote "'+p.cod+'" está com o preço vazio ou zerado. Ele seria entregue como uma cobrança de R$ 0,00.';
    if(!p.link)return 'O pacote "'+p.cod+'" está sem o link do TidyCal.';
    if(!aUrlOk(p.link))return 'O link do TidyCal do pacote "'+p.cod+'" não é um endereço válido.';
  }
  if(!fciVal('chave')||!fciVal('nomer')||!fciVal('cidade'))return fciRecusa('Preencha a chave Pix, o nome do recebedor e a cidade.');
  if(!fciVal('client'))return fciRecusa('Informe o Client ID do PayPal.');
  if(!fciVal('zapnum'))return fciRecusa('Informe o WhatsApp de destino.');
  return '';
}
```

A recusa do WhatsApp é **incondicional** aqui, ao contrário das outras abas, e a razão é estrutural: esta aba não tem interruptor "usar WhatsApp?", e a **recusa cordial da página de obrigado** (Tarefa 7) sempre oferece o WhatsApp. Sem número, aquela tela ofereceria um botão que não leva a lugar nenhum — justo na tela de quem não conseguiu ser identificado.

**A recusa de código colidido é a mais importante das seis** — ela existe porque o Pix descarta hífen, e dois pacotes `mini-1h` e `mini1h` gerariam o mesmo identificador de conciliação.

- [ ] **Passo 4: Provar as recusas, uma a uma.** Como operador, na ferramenta servida: cada uma das nove recusas tem de aparecer com a mensagem certa, e a de identidade tem de **abrir o painel Identidade** e levar o foco ao campo. Nenhuma pode passar batido.

- [ ] **Passo 5: Regressão + commit.** `scripts/verificar/regressao.sh` → OK. `git commit -m "O catalogo de pacotes, com as seis recusas"`

---

### Task 3: O gerador da vitrine

**Files:** Modify: `index.html`

**Interfaces:**
- Consumes: `aCfg()` (Tarefa 1), `cfg.pacotes` (Tarefa 2)
- Produces: `aBlocoVitrine(cfg)` → string com o componente HTML completo

- [ ] **Passo 1: Ler os dois modelos.** `index.html:9973–10003` (o embed do TidyCal com o tratamento de altura do modal) e `uBloco` (10700+) como modelo de estrutura de um bloco (variáveis de customização no topo, comentário "Daqui para baixo nao precisa mexer", `<style>`, IIFE única).

- [ ] **Passo 2: O topo do bloco — as variáveis de customização.** Comentadas, com os valores permitidos, no padrão das outras abas. Inclui `PACOTES` (o catálogo), `DESCONTO_PIX`, `PARCELAS`, as três alturas, as cores e os textos.

O catálogo sai assim (um objeto por pacote, `escJs` em todo campo de texto):

```js
c+='var PACOTES=[\n'+pacs+'\n];\n';
```
onde cada linha de `pacs` é
```
  {cod:'MINI-1H', nome:'Mini ensaio', dur:'1 hora', preco:420, inclui:'10 fotos tratadas', link:'https://tidycal.com/fotocerta/mini-1h'},
```

- [ ] **Passo 2b: A blindagem das tags, e este é o ponto do plano onde ela mais se esquece.** Esta tarefa é a única que escreve `<style>` e cria um `<iframe>` como texto dentro de strings JS. As três sequências têm de sair concatenadas, **sempre**:

```js
c+='<sty'+'le>\n';           /* nunca '<style>' inteiro dentro de uma string */
c+='</sty'+'le>\n';
c+="var ifr=document.createElement('ifr'+'ame');";
```

O motivo não é superstição: o validador do Prosite corta o componente ao encontrar a sequência crua, e o corte é **silencioso** — o operador cola, salva, e metade do bloco não está lá.

- [ ] **Passo 3: O CSS.** Num `<style>` dentro do componente (nunca no campo *CSS Customizado*). Classes com prefixo `fca-`. Obrigatórios: `text-align:left` na raiz e nos cartões; `@media` para empilhar os cartões no celular; `prefers-reduced-motion` desligando transições.

- [ ] **Passo 4: A marcação dos dois passos.** Estrutura só com `<div>`:

```
.fca-raiz
  .fca-titulo
  .fca-passo (n=1)  -> .fca-passo-n + .fca-passo-t
  .fca-cards        -> N x .fca-card  (nome, duracao/inclui, preco Pix + selo, linha do cartao)
  .fca-resumo       (escondido ate escolher: nome, linha de precos, botao .fca-trocar)
  .fca-passo (n=2)
  .fca-cal          (vazio ate escolher; o iframe do TidyCal nasce aqui)
```

- [ ] **Passo 5: O preço no cartão — as duas formas, com o desconto na frente.**

```js
c+='function precoPix(p){return Math.round(p*(1-DESCONTO_PIX/100)*100)/100;}\n';
/* A PARCELA ARREDONDA PARA CIMA, e a direcao e escolhida: 700/6 = 116,6667. Para baixo
   (116,66) uma das parcelas seria MAIOR do que o cliente leu. Para cima (116,67) ele nunca
   paga por mes mais do que estava escrito. Mesma licao do centavo do Pix, de ago/2026. */
c+='function parcelaDe(p){return Math.ceil(p/PARCELAS*100)/100;}\n';
```

Regras do texto: com `DESCONTO_PIX===0` o selo some e o preço grande é o cheio. Com `PARCELAS===1` a linha do cartão diz apenas `ou R$ X no cartão`, **sem** "em até 1x". Com `PARCELAS>1`, `ou R$ X no cartão, em até Nx de R$ Y`.

- [ ] **Passo 6: O calendário sob demanda — e este é o passo delicado.**

```js
/* UM iframe, criado so quando o pacote e escolhido, e o mesmo elemento e reaproveitado ao
   trocar de pacote. Nao existem N iframes escondidos: cada embed do TidyCal e um aplicativo
   inteiro, e tres carregando juntos e exatamente o peso que esta aba existe para evitar. */
```
Ao escolher um pacote: se o `<div class="fca-cal">` ainda não tem iframe, crie um; senão, só troque o `src`. O ouvinte de `message` é ligado **uma vez**, em `window`, nunca no iframe — assim ele sobrevive à troca.

O tratamento de altura é **cópia fiel** do que está em 9973–10003: origem `https://tidycal.com`, prefixo `[iFrameSizer]`, `scrollToOffset` expande, `mutationObserver` recolhe, 800 ms de carência.

**Mais a corrida que o modelo original não tem, porque lá não se troca de iframe** (decisão 9 do diário). O ouvinte confere a origem, mas não sabe de qual iframe veio a mensagem. Um sinal atrasado do iframe **anterior** pode chegar depois da troca e ser lido como se fosse do novo — o cliente veria a página crescer 2.350 px sem ter clicado em nada. Ao trocar de pacote:

```js
c+='modalAberto=false;recolher();ignorarAte=Date.now()+800;\n';
```
e todo tratamento de sinal começa com `if(Date.now()<ignorarAte)return;`.

**Caminho B declarado:** se numa página publicada os sinais não chegarem, o bloco tem de continuar utilizável. Emita a altura fixa (`altdesk`/`altmob`) como `min-height` **inicial** do iframe, e trate o sinal como melhoria. Assim, sem sinal nenhum, o calendário ainda aparece inteiro.

- [ ] **Passo 7: Provar o bloco executando.** Escreva um roteiro descartável usando `scripts/verificar/pagina.mjs` que: gera o bloco na ferramenta, executa numa página, e confere — (a) os N cartões desenhados; (b) escolher acende o passo 2; (c) **existe exatamente um** `iframe` depois de escolher; (d) trocar de pacote **continua com exatamente um** iframe e o `src` mudou; (e) zero erro de console.

O item (d) é o que prova que não vazamos iframe. Sem ele, o defeito só apareceria no celular de um cliente.

- [ ] **Passo 8: Regressão + commit.**

---

### Task 4: A prévia da vitrine

**Files:** Modify: `index.html`

- [ ] **Passo 1: `aPvShim`, `aPvDoc`, `aPvMontar`, `aPreview`.** Modelo literal: `mPvShim`/`mPvDoc`/`mPvMontar`/`mPreview` (16820–16895). Obrigações: shim de armazenamento com **conferência de que pegou**; enchimento cinzento abaixo para haver o que rolar; debounce de 400 ms com **timer único cancelado antes de reagendar**; montar **só quando a aba é aberta**, nunca no carregamento da ferramenta.

- [ ] **Passo 2: A rede externa da prévia.** O embed do TidyCal **não vai carregar** dentro da prévia (é outro domínio, e a prévia não deve depender de rede). No lugar do iframe, a prévia desenha um retângulo com a frase *"Aqui entra o calendário do TidyCal deste pacote."* — e o `<p class="ajuda">` embaixo **declara essa diferença**, em vez de listar o que falta.

- [ ] **Passo 3: A prévia com recusa.** Configuração que o gerador recusaria não pode ser desenhada pela prévia — senão a prévia deixa de ser prova do código e vira outro código. Modelo: `mPvRecusaDoc`.

- [ ] **Passo 4: Provar** como operador: a prévia acompanha a edição de um pacote; trocar o desconto muda o preço na hora; a prévia com zero pacotes mostra a recusa.

- [ ] **Passo 5: Regressão + commit.**

---

### Task 5: Os N endereços de redirecionamento

**Files:** Modify: `index.html`

**Interfaces:** Produces: `aEnderecos(cfg)` → texto com uma linha por pacote

- [ ] **Passo 1: A função.**

```js
function aEnderecos(cfg){
  var i,p,base=cfg.urlobrigado,sep,t='';
  for(i=0;i<cfg.pacotes.length;i++){
    p=cfg.pacotes[i];
    sep=(base.indexOf('?')<0)?'?':'&';
    t+=p.nome+' ('+p.cod+'):\n';
    t+=base+sep+'pac='+encodeURIComponent(p.cod)+
       '&nome={{contact.name}}&data={{booking.date}}&hora={{booking.time}}&quando={{booking.starts_at}}\n\n';
  }
  return t;
}
```

**O `{{booking_type.title}}` não entra**, e o e-mail também não. O primeiro porque quem identifica o pacote é o código — é isso que faz renomear um tipo no TidyCal não quebrar nada. O segundo pela razão já registrada na página de obrigado atual: menos dado pessoal circulando por menos lugares.

- [ ] **Passo 2: Provar** que há uma linha por pacote, com o código certo em cada, e que um endereço que já tem `?` recebe `&`.

- [ ] **Passo 3: Regressão + commit.**

---

### Task 6: Painel consolidado, preset e backup

**Files:** Modify: `index.html` — `fccDaAba` (17122), `FCC_FORA` (17241)

- [ ] **Passo 1: O ramo do painel.** Em `fccDaAba`, antes do `else` final:

```js
  }else if(a.id==='pac'){
    plano.comps.push(fccItem(a,'a-out1','Agendamento por pacote — vitrine','Componente HTML desta página'));
```

**A `a-out3` NÃO entra aqui.** Ela é consolidada na Tarefa 7, junto com o gerador que a produz. *(Correção vinda da revisão do plano: consolidá-la aqui faria a Tarefa 6 — da Entrega 1 — depender de `aBlocoObrigado`, que só existe na Entrega 2. O passo de prova desta tarefa seria inexecutável, e a Entrega 1 deixaria de ser entregável sozinha, contra a decisão 5 do diário.)*

- [ ] **Passo 2: A saída que não é campo do Prosite.** Em `FCC_FORA`:

```js
  'a-out2':'cada endereco vai no campo de redirecionamento de UM tipo de agendamento, dentro do TidyCal: nao e campo do Prosite'
```

- [ ] **Passo 3: O aviso de colisão, com o contrato de como detectá-la.** *(A versão anterior deste passo dizia "avise" sem dizer como — corrigido depois da revisão.)*

**Quando avisar:** as duas abas ativas na campanha **e** a da aba `tidy` com a página de obrigado ligada. O estado de "ativa" é `FCG.ativas[a.id]` — o mesmo que `fccOrfas` já consulta (linha 17260). A aba `tidy` liga a página de obrigado no campo `t-ob-usar` (radio, valor `'sim'`), lido do fragmento `st.t`.

**Por que avisar, e o texto tem de dizer isto:** não é disputa de campo — a `tidy` entrega uma **Tag Body** e esta entrega um **componente**, que não se sobrescrevem. O que colide é o **comportamento**: os dois scripts trocam os mesmos marcadores (`{{nome}}`, `{{data}}`, `{{hora}}`) na mesma página, e quem rodar primeiro vence, **inclusive nos textos reserva**, que são configuráveis em cada aba e podem discordar. O visitante veria o texto reserva de uma aba onde o dono configurou o da outra, sem erro nenhum.

O painel avisa em vermelho, nomeando as duas abas e os marcadores em disputa. Não escolhe por conta própria.

- [ ] **Passo 4: Provar.** Gerar as **duas** saídas que existem nesta entrega e conferir no painel: a `a-out1` aparece como componente da página de agendamento; a `a-out2` aparece na lista de "fora do Prosite" com o motivo; **`fccOrfas` não acusa nenhuma órfã** (a `a-out3` ainda está vazia, e saída vazia não é órfã); o aviso de colisão aparece com as duas abas ligadas e some com uma só. Provar também que o preset salva/aplica e que "Exportar tudo" leva a aba nova.

- [ ] **Passo 5: Regressão + commit.**

---

# ENTREGA 2 — A PÁGINA DE OBRIGADO

---

### Task 7: O bloco da página de obrigado — estrutura e recusa

**Files:** Modify: `index.html`

**Interfaces:** Produces: `aBlocoObrigado(cfg)`

- [ ] **Passo 1: A leitura do pacote.** O bloco emite `FC_PARAM_SRC` (o `param(nome)`), lê `param('pac')`, e procura no `PACOTES` embutido. Comparação **sem diferenciar maiúsculas**.

- [ ] **Passo 2: A recusa cordial.** Sem `pac`, ou com código desconhecido: **nenhum pagamento na tela**. Um recado e o WhatsApp. Texto configurável, padrão:

> Não encontramos seu agendamento nesta página. Se você acabou de agendar, use o link que aparece no e-mail de confirmação — ou fale com a gente que resolvemos na hora.

- [ ] **Passo 3: Os marcadores.** Cópia fiel do mecanismo de `tObBloco` (9683–9741): `TreeWalker` sobre nós de texto, pulando `SCRIPT/STYLE/TEXTAREA/INPUT/SELECT/NOSCRIPT`, `nodeValue` e **nunca** `innerHTML`, mais o `MutationObserver` de 5 s para conteúdo que o tema montar tarde.

Marcadores: `{{nome}}`, `{{data}}`, `{{hora}}`, `{{quando}}` (da URL) e `{{pacote}}`, `{{duracao}}`, `{{valor}}` (do catálogo). Cada um com texto reserva configurável.

- [ ] **Passo 4: Provar** com `?pac=` de cada pacote, sem `pac`, com `pac` inexistente, e com `pac` hostil (`<script>`, `../`, acentos, `%00`). Em nenhum caso pode haver marcação interpretada nem pagamento na tela indevido.

- [ ] **Passo 5: Regressão + commit.**

---

### Task 8: O pagamento

**Files:** Modify: `index.html`

- [ ] **Passo 1: O identificador de conciliação.**

```js
/* prefixo + codigo do pacote + dia e hora do ensaio, limpo para o que o Pix aceita
   (so letras e numeros, 25 no maximo). NAO INVENTA DATA: se a data nao for legivel,
   cai num sufixo aleatorio -- melhor um codigo que nao diz o dia do que um que diz o
   dia errado. */
```
A limpeza é a mesma de `pTxidLimpo`: `String(t).replace(/[^A-Za-z0-9]/g,'').substring(0,25)`.

**O identificador tem de sobreviver a um F5, e este passo é o mais importante da tarefa** (decisão 7 do diário; achado da revisão do plano). Escrito do jeito natural, o sufixo aleatório seria sorteado a cada carregamento — e daí saem dois defeitos, os dois silenciosos:

1. **O prazo reiniciaria a cada recarga**, porque a chave que guarda a primeira visita incluiria o identificador.
2. **Cobranças fantasma**: o mesmo identificador vai no `txid` do Pix e no `custom_id` do PayPal. Recarregar antes de pagar geraria um identificador novo por carregamento, e o dono veria várias cobranças diferentes para uma reserva só.

**A saída, e ela é compartilhada com a Tarefa 9:** existe **um** registro por reserva no `localStorage`, guardando as duas coisas — o instante da primeira visita e o sufixo sorteado. A chave **não depende do identificador**:

```
fcapac:<cod do pacote>:<o valor de "quando" COMO CHEGOU na URL, mesmo ilegivel>
```

`quando` cru é texto estável e é o que distingue dois agendamentos do mesmo pacote. Sem `quando` nenhum, a chave cai para `fcapac:<cod>` e dois agendamentos do mesmo pacote compartilham o registro — **limite declarado**, e o comentário do código tem de dizê-lo.

Ao carregar: lê o registro; se não existir, cria com `Date.now()` e o sufixo sorteado, e grava. O identificador sai sempre do registro, nunca de um sorteio novo.

- [ ] **Passo 2: O Pix.** `total()` devolve o preço do pacote. `fcTotalPixSrc(cfg.descpix,true,false)` emite o `totalPix()`. `FC_PIX_SRC.montarPayload` monta o payload, com `CHAVE_PIX`/`NOME_RECEBEDOR`/`CIDADE`/`CODIGO_PEDIDO` declarados antes. O QR usa **o desenho da `/pagar`** (14505–14520), com a caixa sumindo se a biblioteca não carregar.

- [ ] **Passo 3: O cartão.** SDK do PayPal, `createOrder` com um item (nome = nome do pacote + identificador), `custom_id` = identificador. **Sem `invoice_id`** (é único por conta; a segunda cobrança com o mesmo seria recusada). A linha de parcelas abaixo do botão.

- [ ] **Passo 4: A conferência que separa esta tarefa de uma troca de texto.** O roteiro tem de reler o payload gerado com um **leitor TLV escrito só a partir da norma** — se ele copiasse a implementação do bloco, os dois errariam junto. Confira: 100 % ASCII, estrutura fecha, CRC bate, campo 54 igual ao da tela, txid dentro do formato.

- [ ] **Passo 5: Regressão + commit.**

---

### Task 9: O prazo da reserva

**Files:** Modify: `index.html`

- [ ] **Passo 1: A conta.**

```js
/* O PRAZO E UMA DURACAO, e nao uma data de calendario -- por isso nao ha fuso para errar
   aqui. A pagina nao sabe quando o agendamento foi feito; ela sabe que o cliente cai aqui
   logo depois de agendar. Entao o prazo e a PRIMEIRA VISITA + N horas, guardado neste
   navegador. Abrir noutro aparelho reinicia a contagem, e o cliente ganha mais tempo: a
   falha e generosa, nunca punitiva, e essa direcao e escolhida. */
```
Guardado em `localStorage`, chave `fcapac:<codigo do pacote>:<identificador>`.

- [ ] **Passo 2: O limite pelo início do ensaio.** `Date.parse` sobre `quando`. Se não der para ler, **o limite não se aplica** e vale só a contagem — o prazo nunca sai de uma data que a página não conseguiu ler.

- [ ] **Passo 3: O texto diz a regra de verdade.** Quem libera o horário é o dono, à mão. O relógio é recado, não tranca.

- [ ] **Passo 4: Provar** com relógio falso (`scripts/verificar/pagina.mjs` aceita `relogio`): dentro do prazo, no limite, vencido, e com `quando` ilegível.

- [ ] **Passo 4b: Provar o que o passo 4 NÃO prova — a recarga.** *(Este passo existe porque a revisão do plano mostrou que o passo 4 passaria com bandeiras verdes sobre um defeito real.)* Com `quando` **ilegível**, carregue a página, leia o identificador e o prazo; **recarregue**; leia de novo. **Os dois têm de ser idênticos.** Se o identificador mudar, o prazo reiniciou e a conciliação quebrou — e nenhum teste de relógio falso teria percebido.

Repita com `quando` legível e com dois agendamentos do mesmo pacote em datas diferentes (identificadores têm de ser **diferentes** entre si e estáveis cada um).

- [ ] **Passo 5: Regressão + commit.**

---

### Task 10: A prévia da página de obrigado

**Files:** Create: `previa.html`. Modify: `index.html`, `CLAUDE.md`

- [ ] **Passo 1: O arquivo.** `previa.html` na raiz, com o mínimo:

```html
<!doctype html><meta charset="utf-8"><title>Previa</title>
```

Ele existe por um motivo só, e o comentário do commit tem de dizê-lo: **a prévia da página de obrigado só faz sentido com `?pac=` na URL, e um iframe escrito por `document.write` herda a URL da ferramenta, sem consulta nenhuma.** A prévia navega o iframe para `previa.html?pac=<escolhido>` e escreve o bloco no documento carregado, preservando `location.search`.

- [ ] **Passo 2: O seletor "prever como".** A aba ganha um seletor com os pacotes cadastrados, mais a opção **"sem pacote (recusa)"** — o estado de recusa é o mais fácil de esquecer e o mais visível para o cliente.

- [ ] **Passo 3: Provar** que a prévia mostra o pacote escolhido, que trocar o seletor troca a tela, e que "sem pacote" mostra a recusa.

- [ ] **Passo 4: Regressão + commit.**

---

### Task 11: A verificação final e a documentação

**Files:** Modify: `scripts/verificar/geradores.mjs`, `docs/documentacao-fotocerta.md`, `docs/pendencias.md`, `CLAUDE.md`

- [ ] **Passo 1: A décima aba entra na fotografia.** Em `geradores.mjs`: `ABAS` ganha `['aba-pac','a-gerar']`, `SAIDAS` ganha `'a-out1','a-out2','a-out3'`, e `conteudo(pg)` cadastra **dois** pacotes e preenche os campos da aba.

Sem isso, todo o caminho da aba nova fica fora da regressão — a mesma armadilha que já aconteceu em 01/09 com o cupom da Mini loja, e que está registrada no próprio arquivo.

- [ ] **Passo 1b: Os testes que a spec §13 pede e que nenhuma tarefa tinha assumido.** *(Lacuna achada na revisão do plano.)*

- **A matriz do arredondamento da parcela:** preço que divide exato (R$ 420,00 em 6x = R$ 70,00), preço que não divide (R$ 700,00 em 6x = **R$ 116,67**, e nunca R$ 116,66), preço com centavos (R$ 419,90), e parcelas de 1 a 12. **Invariante em toda combinação: `parcela × N ≥ preco`.**
- **A varredura da palavra "PayPal"**: ela não pode aparecer em nenhum texto que a ferramenta escreva nas três saídas. O que sobrar tem de ser só o que o SDK desenha em tempo de execução, e o SDK não está no texto gerado.
- **O identificador**, com data legível e ilegível, e a prova de estabilidade da Tarefa 9 passo 4b.
- **Celular** em 360, 390 e 430 px de largura, nas duas telas, sem rolagem horizontal.

- [ ] **Passo 2: A bateria completa.** Rode tudo e leia o resultado:

```bash
scripts/verificar/regressao.sh
```
Esperado: as **21 saídas antigas idênticas**, e as três novas aparecendo (a fotografia da referência não as tem — a divergência delas é esperada e tem de ser declarada).

- [ ] **Passo 3: A documentação.** A décima aba entra na `docs/documentacao-fotocerta.md` (o inventário de abas, e a seção própria com as decisões). A `CLAUDE.md` ganha `previa.html` no inventário de arquivos e **a contagem de linhas do `index.html` corrigida**.

- [ ] **Passo 4: O que fica para o dono.** Em `docs/pendencias.md`: colar os três códigos, criar os tipos de agendamento no TidyCal com os endereços gerados, e — o item que importa — **confirmar como o modal do TidyCal se comporta dentro do bloco novo numa página publicada**, que é a única incógnita que não se responde daqui.

- [ ] **Passo 5: O carimbo e a publicação.**

```bash
scripts/carimbar-publicacao.sh
```
Depois: commit, merge na `main`, `git push`. **O dono autorizou a publicação desta rodada** — está na conversa de 02/09.

---

## Self-review deste plano

**Cobertura da spec.** Percorrida seção por seção: §4 catálogo → Tarefa 2; §4.1 campos da aba → Tarefa 1; §5 as três saídas → Tarefas 3, 5, 7; §6 vitrine e os dois passos → Tarefa 3; §6.1 os três limites (parcelas, valor da parcela, PayPal nos botões) → Tarefa 3 passo 5; §7 página de obrigado → Tarefas 7 e 8; §7.1 prazo → Tarefa 9; §7.2 identificador → Tarefa 8; §8 recusas → Tarefa 2; §9 fonte única → Global Constraints e o contrato; §10 painel/preset/backup → Tarefa 6; §11 prévias → Tarefas 4 e 10; §12 riscos → Tarefa 3 passo 6 (caminho B) e Tarefa 11 passo 4; §13 verificação → distribuída, mais Tarefa 11.

**Lacuna encontrada e corrigida na releitura:** a spec pede que a página de obrigado troque os marcadores **e** monte o pagamento, mas não dizia o que acontece quando o dono não escreve marcador nenhum na página. Resposta, que a Tarefa 7 tem de honrar: nada — a troca não encontra marcador e não faz nada, e o pagamento aparece do mesmo jeito. Os dois trabalhos são independentes por construção.

**Consistência de nomes:** `aColeta`, `aRestaura`, `aCfg`, `aRecusa`, `aGerar`, `aPreview`, `aPvMontar`, `aBlocoVitrine`, `aEnderecos`, `aBlocoObrigado`, `aPacRender`, `A_NUMS`, `aPreso`, `aPresetResumo`, `aPresetDepois`, `aPresetAntes`. Saídas `a-out1/2/3`. Classes `fca-`. Conferidos contra cada uso no plano.
