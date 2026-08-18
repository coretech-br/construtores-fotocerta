# Barra de contagem regressiva — Plano de implementação

> **Para executores agênticos:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Adicionar a 6ª aba "Contagem regressiva" ao `index.html`, gerando o código de uma barra de contagem regressiva para o topo de landing pages do Alboom Prosite.

**Arquitetura:** Aba nova seguindo o padrão das cinco existentes (descrição → seções numeradas → prévia e código → instruções). Um motor de contagem escrito uma vez alimenta tanto a prévia da ferramenta quanto o código gerado. A saída é um bloco autocontido (`<style>` + `<div>` + `<script>`) cujo destino — Tag Body ou componente HTML — depende do radio "fixa no topo / no fluxo".

**Stack:** HTML/CSS/JS puros, ES5, sem build, sem dependências, arquivo único.

## Restrições globais

Valem para **todas** as tarefas. Copiadas do spec e do `CLAUDE.md`.

- **Prefixo da aba:** `c-` em todos os IDs de campo e nomes de função. Painel `painel-cnt`, botão `aba-cnt`.
- **Prefixo do código gerado:** classes `fcb-*`, animações `fcb-*`.
- **ES5 apenas.** Nada de `let`, `const`, arrow function, template literal, `classList.toggle` com segundo argumento em navegador antigo. O arquivo inteiro é ES5; mantenha.
- **Manual do Prosite — o código gerado deve obedecer:**
  1. `addEventListener` em todos os eventos, nunca inline.
  2. Ocorrências de `<style`, `</style`, `<script`, `</script`, `<iframe` dentro de strings JS blindadas por concatenação: `'<sty'+'le>'`, `'<scr'+'ipt>'`, `'</scr'+'ipt>'`.
  3. Só `<div>`. Nenhuma tag semântica HTML5.
  4. Todo o script gerado dentro de IIFE `(function(){...})()`.
  5. Sem acentos no código gerado. Acentos apenas em textos visíveis vindos dos campos.
  6. `@keyframes` e `@media` dentro do `<style>` do próprio bloco gerado.
- **Dados operacionais não são versionados.** Campo novo que receba WhatsApp, chave Pix, Client ID e afins nasce `value=""` com `placeholder`, e fallback `|| ''` no `restaurarEstado`.
- **Padrão do código gerado:** variáveis de customização no topo, comentadas com os valores permitidos, seguidas de `/* Daqui para baixo nao precisa mexer */`.
- **Acessibilidade:** todo bloco de animação acompanhado de `@media (prefers-reduced-motion: reduce)` que congela o movimento.
- **Spec de referência:** `docs/specs/2026-08-18-barra-contagem-regressiva-design.md`. Em caso de divergência entre este plano e o spec, o spec vence — pare e avise.
- **Uma adição deliberada ao spec:** a seção 5 do spec descreve o que o *código gerado* faz com duração zero ou data no passado (executa direto o comportamento de fim, e o plano mantém isso — o primeiro `tick()` cai em `encerrar()`). O plano acrescenta, além disso, validação no *construtor*: `cGerar` recusa gerar com duração zero ou data vazia. São camadas diferentes, não conflito.
- **Sobre a lista de animações do spec:** a entrada da barra (`fcb-entra`) e a virada dos dígitos (`fcb-fade` / `fcb-flip`) são implementadas com `transition`, não com `@keyframes` — o efeito é o mesmo, sem animação em laço, e uma transição é o instrumento certo para uma mudança de estado pontual. Os nomes `fcb-entra` e `fcb-fade` portanto não aparecem no CSS gerado; não é omissão.
- **O contador nunca remonta o conteúdo.** A mensagem entra uma vez com marcadores `[data-fcb-rel]` vazios; o tick de cada segundo preenche só esses marcadores. Reescrever o `innerHTML` a cada segundo reiniciaria a animação CSS da rolagem — o marquee tremeria no lugar em vez de rolar. Vale para as Tasks 8, 9 e 10.

## O escopo IIFE — leia antes de escrever qualquer asserção

Todo o `<script>` do arquivo vive dentro de **uma única IIFE** (`index.html:948` … `})();`). Consequência prática: `cCfg`, `cPartes`, `cMsgs`, `salvarEstado` e todas as demais funções internas **não existem no escopo global** e não podem ser chamadas de um console externo — a tentativa levanta `ReferenceError`.

Portanto: **toda asserção é dirigida por DOM.** Você preenche campos, dispara eventos, clica em botões e lê o resultado no DOM, no `localStorage` ou na textarea de saída. Nunca chame função interna direto.

Dois idiomas que você vai usar o tempo todo:

```js
// preencher um campo E disparar o listener que salva/atualiza
$$('c-tam').value = '21';
$$('c-tam').dispatchEvent(new Event('input', {bubbles:true}));

// marcar um radio (o clique já dispara change)
document.querySelector('input[name="c-formato"][value="blocos"]').click();
```

Não exponha nada em `window` para facilitar teste — é poluição de código de produção numa página estática pública.

## Como verificar (não há framework de teste)

O projeto é um HTML único sem build, npm ou runner. A verificação é feita por asserção no console do navegador. **Antes de qualquer tarefa**, abra `index.html` no navegador e cole este helper no console:

```js
function T(nome, cond){ console.log((cond ? 'PASS ' : 'FAIL ') + nome); return !!cond; }
function $$(id){ return document.getElementById(id); }
function V(id){ var e = $$(id); return e ? e.value : null; }
function R(nome){ var r = document.querySelector('input[name="' + nome + '"]:checked'); return r ? r.value : null; }
```

Recarregue a página (F5) depois de cada edição do arquivo e recole o helper. "Rodar o teste" significa colar o bloco de asserção do passo e ler o console.

---

### Task 1: Esqueleto da aba

**Arquivos:**
- Modificar: `index.html` — bloco `.abas` (~linha 154), painéis (após `painel-bor`, ~linha 860), `trocarAba` (~linha 877), bloco `liga(...)` (~linha 2457)

**Interfaces:**
- Consome: `trocarAba(qual)`, `liga(id, fn)` — já existem.
- Produz: painel `#painel-cnt` e botão `#aba-cnt` funcionando; nome curto da aba na lista de `trocarAba` é `'cnt'`.

- [ ] **Passo 1: Escrever a asserção que falha**

Cole no console:

```js
T('botao da aba existe', !!$$('aba-cnt'));
T('painel existe', !!$$('painel-cnt'));
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: `FAIL botao da aba existe`, `FAIL painel existe`.

- [ ] **Passo 3: Adicionar o botão da aba**

Em `index.html`, logo após a linha do `aba-bor`:

```html
  <button class="aba" id="aba-cnt" role="tab" aria-selected="false">Contagem regressiva</button>
```

- [ ] **Passo 4: Adicionar o painel vazio**

Após o fechamento do `</div>` de `painel-bor` e antes de `<p class="rodape">`:

```html
<div class="painel" id="painel-cnt" role="tabpanel">
  <p class="descricao"><b>Contagem regressiva</b> — gera a barra de urgência para o topo de uma landing page, com mensagem, contador em dias/horas/minutos/segundos e efeitos. A contagem não reinicia quando o visitante recarrega a página: o momento da primeira visita fica guardado no navegador dele. Pode contar um prazo a partir da primeira abertura ou até uma data marcada. O código sai pronto para a <b>Tag Body</b> (barra fixa no topo) ou para um <b>componente HTML</b> (barra que rola com a página).</p>
</div>
```

- [ ] **Passo 5: Registrar a aba na troca de painéis**

Em `trocarAba`, trocar a lista por:

```js
  ['slide','leads','tidy','uni','bor','cnt'].forEach(function(n){
```

- [ ] **Passo 6: Ligar o clique**

No bloco de `liga(...)`, após `liga('aba-bor',...)`:

```js
liga('aba-cnt',function(){trocarAba('cnt');});
```

- [ ] **Passo 7: Rodar e confirmar que passa**

Recarregue e cole:

```js
T('botao da aba existe', !!$$('aba-cnt'));
T('painel existe', !!$$('painel-cnt'));
$$('aba-cnt').click();
T('clique ativa o painel', $$('painel-cnt').classList.contains('ativo'));
T('clique desativa o anterior', !$$('painel-bor').classList.contains('ativo'));
T('aria-selected correto', $$('aba-cnt').getAttribute('aria-selected') === 'true');
```

Esperado: 5 × PASS.

- [ ] **Passo 8: Commit**

```bash
git add index.html && git commit -m "feat(contagem): esqueleto da aba de contagem regressiva"
```

---

### Task 2: Seção 1 — Contagem e encerramento

**Arquivos:**
- Modificar: `index.html` — dentro de `#painel-cnt`; função nova `cToggles()` junto às demais funções da aba

**Interfaces:**
- Consome: `radio(nome)`, `$(id)` — já existem.
- Produz: `cToggles()` — mostra/esconde campos conforme os radios da aba. Chamada por listener de `change` e pelo bootstrap.

- [ ] **Passo 1: Escrever a asserção que falha**

```js
['c-modo','c-dias','c-horas','c-mins','c-alvo','c-cod','c-un-d','c-un-h','c-un-m','c-un-s','c-diaszero','c-fim','c-fimtxt']
  .forEach(function(id){ T('campo ' + id, !!$$(id) || !!document.querySelector('[name="' + id + '"]')); });
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: 13 × FAIL.

- [ ] **Passo 3: Adicionar a seção 1**

Dentro de `#painel-cnt`, após a `<p class="descricao">`:

```html
  <div class="secao primeira"><span class="secao-n">1</span> Contagem e encerramento</div>
  <div class="grade">
    <div>
      <fieldset>
      <legend>Como contar</legend>
      <div class="radios">
      <label><input type="radio" name="c-modo" value="abertura" checked><span>A partir da primeira abertura</span></label>
      <label><input type="radio" name="c-modo" value="data"><span>Até uma data marcada</span></label>
      </div>
      <div id="c-abertura-campos">
      <label for="c-dias">Duração — dias</label>
      <input type="number" id="c-dias" value="0" min="0" max="365" step="1">
      <label for="c-horas">Duração — horas</label>
      <input type="number" id="c-horas" value="48" min="0" max="23" step="1">
      <label for="c-mins">Duração — minutos</label>
      <input type="number" id="c-mins" value="0" min="0" max="59" step="1">
      <p class="ajuda">Cada visitante tem o próprio prazo, contado da primeira vez que abriu a página naquele navegador.</p>
      </div>
      <div id="c-data-campos">
      <label for="c-alvo">Data e hora do encerramento</label>
      <input type="datetime-local" id="c-alvo" value="">
      <p class="ajuda">O instante é gravado no código com o fuso de Brasília (<b>−03:00</b>) fixo, para que todo visitante conte até o mesmo momento, esteja onde estiver.</p>
      </div>
      <label for="c-cod">Código da campanha <small>(identifica esta contagem no navegador do visitante)</small></label>
      <input type="text" id="c-cod" value="" placeholder="ex.: CAMPANHA26">
      <p class="ajuda"><b>Trocar este código zera a contagem de todos os visitantes.</b> É o jeito de recomeçar uma campanha. Duas campanhas com códigos diferentes convivem no mesmo site sem se atrapalhar.</p>
      </fieldset>
    </div>
    <div>
      <fieldset>
      <legend>Unidades exibidas</legend>
      <div class="radios">
      <label><input type="checkbox" id="c-un-d" checked><span>Dias</span></label>
      <label><input type="checkbox" id="c-un-h" checked><span>Horas</span></label>
      <label><input type="checkbox" id="c-un-m" checked><span>Minutos</span></label>
      <label><input type="checkbox" id="c-un-s" checked><span>Segundos</span></label>
      </div>
      <label>Esconder os dias quando chegarem a zero?</label>
      <div class="radios">
      <label><input type="radio" name="c-diaszero" value="sim" checked><span>Sim</span></label>
      <label><input type="radio" name="c-diaszero" value="nao"><span>Não</span></label>
      </div>
      </fieldset>
      <fieldset>
      <legend>Quando a contagem zerar</legend>
      <div class="radios">
      <label><input type="radio" name="c-fim" value="esconder" checked><span>Esconder a barra</span></label>
      <label><input type="radio" name="c-fim" value="mensagem"><span>Mostrar mensagem final</span></label>
      <label><input type="radio" name="c-fim" value="zerado"><span>Manter em 00:00:00</span></label>
      <label><input type="radio" name="c-fim" value="reiniciar"><span>Reiniciar o ciclo</span></label>
      </div>
      <div id="c-fimtxt-campo">
      <label for="c-fimtxt">Mensagem final</label>
      <input type="text" id="c-fimtxt" value="Promoção encerrada">
      </div>
      <p class="ajuda" id="c-reiniciar-aviso"><b>Reiniciar o ciclo</b> só funciona no modo "a partir da primeira abertura": ao zerar, começa outro prazo do mesmo tamanho. Cria urgência permanente que não corresponde a um prazo real — use com consciência.</p>
      </fieldset>
    </div>
  </div>
```

- [ ] **Passo 4: Criar `cToggles`**

Adicione junto às funções da aba (perto de `bToggles`), e ligue os eventos:

```js
/* ============================================================
   CONTAGEM REGRESSIVA
   ============================================================ */
function cToggles(){
  var modo=radio('c-modo'),fim=radio('c-fim'),el;
  el=$('c-abertura-campos');if(el)el.style.display=(modo==='abertura')?'block':'none';
  el=$('c-data-campos');if(el)el.style.display=(modo==='data')?'block':'none';
  el=$('c-fimtxt-campo');if(el)el.style.display=(fim==='mensagem')?'block':'none';
  el=$('c-reiniciar-aviso');if(el)el.style.display=(modo==='abertura')?'block':'none';
  var rr=document.querySelector('input[name="c-fim"][value="reiniciar"]');
  if(rr){
    rr.disabled=(modo!=='abertura');
    if(rr.disabled&&rr.checked)setRadio('c-fim','esconder');
  }
}
```

E no bloco de listeners de `change` existente (onde já está o `t-arq`), acrescente:

```js
document.addEventListener('change',function(e){
  if(e.target&&/^c-/.test(e.target.name||e.target.id||''))cToggles();
});
```

- [ ] **Passo 5: Chamar no bootstrap**

No fim da IIFE, junto de `bToggles();`:

```js
cToggles();
```

- [ ] **Passo 6: Rodar e confirmar que passa**

```js
['c-dias','c-horas','c-mins','c-alvo','c-cod','c-un-d','c-un-h','c-un-m','c-un-s','c-fimtxt']
  .forEach(function(id){ T('campo ' + id, !!$$(id)); });
T('radio modo tem valor', R('c-modo') === 'abertura');
T('radio fim tem valor', R('c-fim') === 'esconder');
T('codigo nasce vazio', V('c-cod') === '');
T('duracao horas tem valor padrao 48', V('c-horas') === '48');
T('campos de duracao visiveis', $$('c-abertura-campos').style.display === 'block');
T('campo de data escondido', $$('c-data-campos').style.display === 'none');
T('mensagem final escondida', $$('c-fimtxt-campo').style.display === 'none');
document.querySelector('input[name="c-modo"][value="data"]').click();
T('trocar p/ data mostra o campo', $$('c-data-campos').style.display === 'block');
T('trocar p/ data esconde duracao', $$('c-abertura-campos').style.display === 'none');
T('reiniciar desabilitado no modo data', document.querySelector('input[name="c-fim"][value="reiniciar"]').disabled === true);
document.querySelector('input[name="c-modo"][value="abertura"]').click();
document.querySelector('input[name="c-fim"][value="mensagem"]').click();
T('mensagem final aparece', $$('c-fimtxt-campo').style.display === 'block');
```

Esperado: 20 × PASS.

- [ ] **Passo 7: Commit**

```bash
git add index.html && git commit -m "feat(contagem): secao 1 - contagem e encerramento"
```

---

### Task 3: Seção 2 — Mensagens

**Arquivos:**
- Modificar: `index.html` — seção 2 dentro de `#painel-cnt`; funções `cMsgAdd`, `cMsgMove`, `cMsgDel`, `cMsgRender`; ligações e bootstrap

**Interfaces:**
- Consome: `salvarEstado()`, `escHtml(s)` — já existem.
- Produz: array global `cMsgs` de `{texto:String, curta:String}`; `cMsgRender()` redesenha a lista.

- [ ] **Passo 1: Escrever a asserção que falha**

```js
T('array cMsgs existe', typeof cMsgs !== 'undefined');
T('campo de texto', !!$$('c-msg'));
T('botao adicionar', !!$$('c-msg-add'));
T('lista', !!$$('c-msg-lista'));
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: 4 × FAIL (o primeiro como `ReferenceError` — envolva em `try` se preferir, o ponto é que não existe).

- [ ] **Passo 3: Adicionar a seção 2**

```html
  <div class="secao"><span class="secao-n">2</span> Mensagens</div>
  <div class="grade">
    <div>
      <fieldset>
      <legend>Adicionar mensagem</legend>
      <label for="c-msg">Texto <small>(use <code>{contador}</code> para marcar onde o relógio entra)</small></label>
      <input type="text" id="c-msg" value="" placeholder="Oferta de Natal termina em {contador}">
      <label for="c-msgcurta">Versão curta para o celular <small>(opcional)</small></label>
      <input type="text" id="c-msgcurta" value="" placeholder="Termina em {contador}">
      <div class="acoes"><button class="botao" id="c-msg-add">Adicionar mensagem</button></div>
      <p class="ajuda">Sem o marcador <code>{contador}</code>, o relógio aparece depois do texto. Com <b>duas ou mais</b> mensagens, os efeitos de alternância da seção 4 passam a fazer sentido; com uma só, a barra fica estática ou rolando.</p>
      </fieldset>
    </div>
    <div>
      <fieldset>
      <legend>Mensagens da barra</legend>
      <p class="vazio" id="c-msg-vazio">Nenhuma mensagem ainda. Sem nenhuma, o código usa "Oferta por tempo limitado {contador}".</p>
      <ul class="lista-imgs" id="c-msg-lista"></ul>
      </fieldset>
    </div>
  </div>
```

- [ ] **Passo 4: Implementar o CRUD**

```js
var cMsgs=[];
function cMsgAdd(){
  var t=$('c-msg').value.trim();
  if(!t){alert('Escreva o texto da mensagem.');return;}
  cMsgs.push({texto:t,curta:$('c-msgcurta').value.trim()});
  $('c-msg').value='';$('c-msgcurta').value='';
  cMsgRender();salvarEstado();
}
function cMsgMove(i,d){
  var j=i+d;if(j<0||j>=cMsgs.length)return;
  var t=cMsgs[i];cMsgs[i]=cMsgs[j];cMsgs[j]=t;
  cMsgRender();salvarEstado();
}
function cMsgDel(i){cMsgs.splice(i,1);cMsgRender();salvarEstado();}
function cMsgRender(){
  var ul=$('c-msg-lista');if(!ul)return;
  ul.innerHTML='';
  $('c-msg-vazio').style.display=cMsgs.length?'none':'block';
  cMsgs.forEach(function(m,i){
    var li=document.createElement('li');
    var info=document.createElement('div');info.className='info';
    var tx=document.createElement('div');tx.className='url';tx.textContent=m.texto;tx.title=m.texto;
    info.appendChild(tx);
    if(m.curta){
      var cu=document.createElement('div');cu.className='url';cu.textContent='celular: '+m.curta;cu.title=m.curta;
      info.appendChild(cu);
    }
    var ctrl=document.createElement('div');ctrl.className='ctrl';
    [['\u2191',function(){cMsgMove(i,-1);},'Subir'],['\u2193',function(){cMsgMove(i,1);},'Descer'],['\u2715',function(){cMsgDel(i);},'Remover']]
      .forEach(function(b){var bt=document.createElement('button');bt.textContent=b[0];bt.title=b[2];bt.setAttribute('aria-label',b[2]);bt.addEventListener('click',b[1]);ctrl.appendChild(bt);});
    li.appendChild(info);li.appendChild(ctrl);
    ul.appendChild(li);
  });
}
```

**Nota:** o CRUD ainda não chama a prévia — `cPreview()` só nasce na Task 7, que acrescenta as chamadas a estas três funções. Não crie stub vazio: nesta tarefa a lista funciona sem prévia, e é assim que ela deve ser revisada.

- [ ] **Passo 5: Ligar e chamar no bootstrap**

```js
liga('c-msg-add',cMsgAdd);
```

e no bootstrap, junto de `cToggles();`:

```js
cMsgRender();
```

- [ ] **Passo 6: Rodar e confirmar que passa**

```js
cMsgs.length = 0; cMsgRender();
T('lista comeca vazia', $$('c-msg-lista').children.length === 0);
T('aviso de vazio visivel', $$('c-msg-vazio').style.display === 'block');
$$('c-msg').value = 'Primeira {contador}'; $$('c-msg-add').click();
$$('c-msg').value = 'Segunda {contador}'; $$('c-msgcurta').value = 'Curta'; $$('c-msg-add').click();
T('duas mensagens na lista', $$('c-msg-lista').children.length === 2);
T('campo limpou apos adicionar', V('c-msg') === '');
T('versao curta guardada', cMsgs[1].curta === 'Curta');
T('aviso de vazio sumiu', $$('c-msg-vazio').style.display === 'none');
cMsgMove(1, -1);
T('mover trocou a ordem', cMsgs[0].texto === 'Segunda {contador}');
cMsgDel(0);
T('remover funcionou', cMsgs.length === 1 && cMsgs[0].texto === 'Primeira {contador}');
```

Esperado: 8 × PASS.

- [ ] **Passo 7: Commit**

```bash
git add index.html && git commit -m "feat(contagem): secao 2 - cadastro de mensagens"
```

---

### Task 4: Seção 3 — Aparência, posição e extras

**Arquivos:**
- Modificar: `index.html` — seção 3 dentro de `#painel-cnt`; `cToggles()` ganha os novos toggles; chamadas de `parearCor`

**Interfaces:**
- Consome: `parearCor(idCor)`, `radio(nome)`.
- Produz: todos os campos de aparência, posição e extras, com os pares cor/texto registrados.

- [ ] **Passo 1: Escrever a asserção que falha**

```js
['c-cfundo','c-ctexto','c-cdestaque','c-tam','c-pad','c-largmax','c-mob','c-z','c-rd','c-rh','c-rm','c-rs',
 'c-ctatxt','c-ctaurl','c-ctafundo','c-ctatexto','c-cprog','c-corujaalt','c-corujagap','c-corujacorpo','c-corujadet','c-cborda']
  .forEach(function(id){ T('campo ' + id, !!$$(id)); });
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: 22 × FAIL.

- [ ] **Passo 3: Adicionar a seção 3**

```html
  <div class="secao"><span class="secao-n">3</span> Aparência, posição e extras</div>
  <div class="grade">
    <div>
      <fieldset>
      <legend>Cores e tipografia</legend>
      <label>Cor de fundo da barra</label>
      <div class="cor-linha"><input type="color" id="c-cfundo" value="#0F3A30"><input type="text" id="c-cfundo-t" value="#0F3A30"></div>
      <label>Cor do texto</label>
      <div class="cor-linha"><input type="color" id="c-ctexto" value="#FDFBF6"><input type="text" id="c-ctexto-t" value="#FDFBF6"></div>
      <label>Cor de destaque dos números</label>
      <div class="cor-linha"><input type="color" id="c-cdestaque" value="#FFC94A"><input type="text" id="c-cdestaque-t" value="#FFC94A"></div>
      <label>Pilha de fonte <small>(sem serifa, todas do sistema — sem download)</small></label>
      <div class="radios">
      <label><input type="radio" name="c-fonte" value="neutra" checked><span>Neutra</span></label>
      <label><input type="radio" name="c-fonte" value="humanista"><span>Humanista</span></label>
      <label><input type="radio" name="c-fonte" value="condensada"><span>Condensada</span></label>
      <label><input type="radio" name="c-fonte" value="mono"><span>Dígitos monoespaçados</span></label>
      </div>
      <label for="c-tam">Tamanho da fonte <small>(px)</small></label>
      <input type="number" id="c-tam" value="15" min="10" max="32" step="1">
      <label>Espessura</label>
      <div class="radios">
      <label><input type="radio" name="c-peso" value="400"><span>Normal</span></label>
      <label><input type="radio" name="c-peso" value="600" checked><span>Semi-negrito</span></label>
      <label><input type="radio" name="c-peso" value="700"><span>Negrito</span></label>
      </div>
      </fieldset>
      <fieldset>
      <legend>Formato e espaço</legend>
      <label>Formato do contador</label>
      <div class="radios">
      <label><input type="radio" name="c-formato" value="compacto" checked><span>Compacto <small>(02d 14h 33m 12s)</small></span></label>
      <label><input type="radio" name="c-formato" value="blocos"><span>Blocos com rótulo</span></label>
      </div>
      <label for="c-rd">Rótulos das unidades <small>(usados por extenso no formato blocos)</small></label>
      <input type="text" id="c-rd" value="dias">
      <input type="text" id="c-rh" value="horas">
      <input type="text" id="c-rm" value="min">
      <input type="text" id="c-rs" value="seg">
      <label for="c-pad">Espaçamento interno vertical <small>(px)</small></label>
      <input type="number" id="c-pad" value="10" min="0" max="40" step="1">
      <label for="c-largmax">Largura máxima do conteúdo <small>(px)</small></label>
      <input type="number" id="c-largmax" value="1100" min="320" max="1920" step="10">
      <label>Alinhamento</label>
      <div class="radios">
      <label><input type="radio" name="c-alinha" value="centro" checked><span>Centro</span></label>
      <label><input type="radio" name="c-alinha" value="esquerda"><span>Esquerda</span></label>
      </div>
      <label>Linha divisória inferior</label>
      <div class="radios">
      <label><input type="radio" name="c-borda" value="nao" checked><span>Não</span></label>
      <label><input type="radio" name="c-borda" value="sim"><span>Sim</span></label>
      </div>
      <div id="c-borda-campo">
      <div class="cor-linha"><input type="color" id="c-cborda" value="#FFC94A"><input type="text" id="c-cborda-t" value="#FFC94A"></div>
      </div>
      <label for="c-mob">Largura de corte do celular <small>(px — abaixo disso usa a versão curta e esconde a coruja)</small></label>
      <input type="number" id="c-mob" value="640" min="320" max="1024" step="10">
      </fieldset>
    </div>
    <div>
      <fieldset>
      <legend>Posição</legend>
      <div class="radios">
      <label><input type="radio" name="c-fixa" value="fixa" checked><span>Fixa no topo</span></label>
      <label><input type="radio" name="c-fixa" value="fluxo"><span>Rola com a página</span></label>
      </div>
      <p class="ajuda">A escolha define <b>onde colar o código</b>: fixa vai na <b>Tag Body</b> da página; rolando com a página vai num <b>componente HTML</b> posicionado no topo pelo editor. O título da saída na seção 5 avisa qual dos dois.</p>
      <div id="c-fixa-campos">
      <label>Espaço para a barra</label>
      <div class="radios">
      <label><input type="radio" name="c-empurrar" value="empurrar" checked><span>Empurrar o conteúdo</span></label>
      <label><input type="radio" name="c-empurrar" value="sobrepor"><span>Sobrepor</span></label>
      </div>
      <label for="c-z">z-index</label>
      <input type="number" id="c-z" value="99980" min="1" max="2147483647" step="10">
      <p class="ajuda">Se o menu do tema também for fixo, os dois disputam o topo. Comece com <b>empurrar</b>; se o menu sumir atrás da barra, aumente o z-index ou troque para sobrepor. Só dá para conferir na página publicada.</p>
      </div>
      </fieldset>
      <fieldset>
      <legend>Extras da barra</legend>
      <label>Botão de ação (CTA)</label>
      <div class="radios">
      <label><input type="radio" name="c-cta" value="nao" checked><span>Não ter</span></label>
      <label><input type="radio" name="c-cta" value="sim"><span>Incluir</span></label>
      </div>
      <div id="c-cta-campos">
      <label for="c-ctatxt">Texto do botão</label>
      <input type="text" id="c-ctatxt" value="Quero garantir">
      <label for="c-ctaurl">Link ou âncora</label>
      <input type="text" id="c-ctaurl" value="#reserva">
      <label>Cor do botão / do texto do botão</label>
      <div class="cor-linha"><input type="color" id="c-ctafundo" value="#FFC94A"><input type="text" id="c-ctafundo-t" value="#FFC94A"></div>
      <div class="cor-linha"><input type="color" id="c-ctatexto" value="#23281F"><input type="text" id="c-ctatexto-t" value="#23281F"></div>
      <p class="ajuda">Se o link for uma âncora como <code>#reserva</code>, a coluna de destino precisa ter esse valor no campo <b>ID Html</b> (aba Avançado do componente).</p>
      </div>
      <label>Botão de fechar</label>
      <div class="radios">
      <label><input type="radio" name="c-fechar" value="nao" checked><span>Não ter</span></label>
      <label><input type="radio" name="c-fechar" value="sessao"><span>Fecha pela sessão</span></label>
      <label><input type="radio" name="c-fechar" value="sempre"><span>Fecha de vez</span></label>
      </div>
      <label>Barra de progresso do tempo decorrido</label>
      <div class="radios">
      <label><input type="radio" name="c-prog" value="nao" checked><span>Não ter</span></label>
      <label><input type="radio" name="c-prog" value="sim"><span>Incluir</span></label>
      </div>
      <div id="c-prog-campo">
      <div class="cor-linha"><input type="color" id="c-cprog" value="#FFC94A"><input type="text" id="c-cprog-t" value="#FFC94A"></div>
      </div>
      <label>Coruja da identidade nas pontas</label>
      <div class="radios">
      <label><input type="radio" name="c-coruja" value="nao" checked><span>Não usar</span></label>
      <label><input type="radio" name="c-coruja" value="sim"><span>Usar</span></label>
      </div>
      <div id="c-coruja-campos">
      <label for="c-corujaalt">Altura <small>(px)</small></label>
      <input type="number" id="c-corujaalt" value="26" min="14" max="60" step="1">
      <label for="c-corujagap">Espaçamento até o conteúdo <small>(px)</small></label>
      <input type="number" id="c-corujagap" value="16" min="0" max="60" step="1">
      <label>Cor do corpo / dos detalhes</label>
      <div class="cor-linha"><input type="color" id="c-corujacorpo" value="#FDFBF6"><input type="text" id="c-corujacorpo-t" value="#FDFBF6"></div>
      <div class="cor-linha"><input type="color" id="c-corujadet" value="#FFC94A"><input type="text" id="c-corujadet-t" value="#FFC94A"></div>
      <label>Esconder no celular?</label>
      <div class="radios">
      <label><input type="radio" name="c-corujamob" value="sim" checked><span>Sim</span></label>
      <label><input type="radio" name="c-corujamob" value="nao"><span>Não</span></label>
      </div>
      <p class="ajuda">A coruja aparece nas duas pontas, ancorada fora da área que rola — ela emoldura a barra em vez de passar junto com o texto.</p>
      </div>
      </fieldset>
    </div>
  </div>
```

- [ ] **Passo 4: Estender `cToggles`**

Acrescente ao final de `cToggles()`, antes do fechamento:

```js
  el=$('c-fixa-campos');if(el)el.style.display=(radio('c-fixa')==='fixa')?'block':'none';
  el=$('c-borda-campo');if(el)el.style.display=(radio('c-borda')==='sim')?'block':'none';
  el=$('c-cta-campos');if(el)el.style.display=(radio('c-cta')==='sim')?'block':'none';
  el=$('c-prog-campo');if(el)el.style.display=(radio('c-prog')==='sim')?'block':'none';
  el=$('c-coruja-campos');if(el)el.style.display=(radio('c-coruja')==='sim')?'block':'none';
```

- [ ] **Passo 5: Registrar os pares de cor**

No bloco de `parearCor(...)`, ao lado dos existentes:

```js
parearCor('c-cfundo');parearCor('c-ctexto');parearCor('c-cdestaque');parearCor('c-cborda');
parearCor('c-ctafundo');parearCor('c-ctatexto');parearCor('c-cprog');
parearCor('c-corujacorpo');parearCor('c-corujadet');
```

**Atenção:** `parearCor` chama `lBtnPreview()` no listener. Isso é inofensivo (a função existe e só redesenha a prévia da aba de leads), mas na Task 7 troque a linha de `parearCor` para também chamar `cPreview()` — instrução detalhada lá.

- [ ] **Passo 6: Rodar e confirmar que passa**

```js
['c-cfundo','c-ctexto','c-cdestaque','c-tam','c-pad','c-largmax','c-mob','c-z','c-rd','c-rh','c-rm','c-rs',
 'c-ctatxt','c-ctaurl','c-ctafundo','c-ctatexto','c-cprog','c-corujaalt','c-corujagap','c-corujacorpo','c-corujadet','c-cborda']
  .forEach(function(id){ T('campo ' + id, !!$$(id)); });
T('par de cor sincroniza', (function(){ $$('c-cfundo').value = '#123456';
  $$('c-cfundo').dispatchEvent(new Event('input')); return V('c-cfundo-t') === '#123456'; })());
T('campos de fixa visiveis', $$('c-fixa-campos').style.display === 'block');
document.querySelector('input[name="c-fixa"][value="fluxo"]').click();
T('fluxo esconde empurrar/z-index', $$('c-fixa-campos').style.display === 'none');
document.querySelector('input[name="c-coruja"][value="sim"]').click();
T('coruja mostra campos', $$('c-coruja-campos').style.display === 'block');
document.querySelector('input[name="c-cta"][value="sim"]').click();
T('cta mostra campos', $$('c-cta-campos').style.display === 'block');
```

Esperado: 27 × PASS.

- [ ] **Passo 7: Commit**

```bash
git add index.html && git commit -m "feat(contagem): secao 3 - aparencia, posicao e extras"
```

---

### Task 5: Seção 4 — Efeitos e movimento

**Arquivos:**
- Modificar: `index.html` — seção 4 dentro de `#painel-cnt`; `cToggles()` ganha os toggles de efeito

**Interfaces:**
- Produz: campos de movimento, destaque, urgência, dígitos e entrada.

- [ ] **Passo 1: Escrever a asserção que falha**

```js
['c-vel','c-alt','c-ef-pulsar','c-ef-brilho','c-ef-degrade','c-ef-piscar','c-ef-tremor','c-urglim','c-curg','c-entradapx']
  .forEach(function(id){ T('campo ' + id, !!$$(id)); });
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: 10 × FAIL.

- [ ] **Passo 3: Adicionar a seção 4**

```html
  <div class="secao"><span class="secao-n">4</span> Efeitos e movimento</div>
  <div class="grade">
    <div>
      <fieldset>
      <legend>Movimento do conteúdo</legend>
      <div class="radios">
      <label><input type="radio" name="c-mov" value="estatico" checked><span>Estático</span></label>
      <label><input type="radio" name="c-mov" value="rolaesq"><span>Rolagem para a esquerda</span></label>
      <label><input type="radio" name="c-mov" value="roladir"><span>Rolagem para a direita</span></label>
      <label><input type="radio" name="c-mov" value="altfade"><span>Alternância com fade</span></label>
      <label><input type="radio" name="c-mov" value="altdesliza"><span>Alternância deslizando</span></label>
      </div>
      <div id="c-vel-campo">
      <label for="c-vel">Duração do ciclo de rolagem <small>(segundos — maior = mais lento)</small></label>
      <input type="number" id="c-vel" value="18" min="2" max="60" step="1">
      </div>
      <div id="c-alt-campo">
      <label for="c-alt">Intervalo entre mensagens <small>(segundos)</small></label>
      <input type="number" id="c-alt" value="5" min="2" max="30" step="1">
      <p class="ajuda">A alternância precisa de <b>duas ou mais</b> mensagens na seção 2. Com uma só, o código gerado cai para estático.</p>
      </div>
      </fieldset>
      <fieldset>
      <legend>Virada dos dígitos</legend>
      <div class="radios">
      <label><input type="radio" name="c-dig" value="nenhuma" checked><span>Nenhuma</span></label>
      <label><input type="radio" name="c-dig" value="fade"><span>Fade</span></label>
      <label><input type="radio" name="c-dig" value="flip"><span>Flip</span></label>
      </div>
      </fieldset>
      <fieldset>
      <legend>Entrada da barra</legend>
      <div class="radios">
      <label><input type="radio" name="c-entrada" value="imediata" checked><span>Imediata</span></label>
      <label><input type="radio" name="c-entrada" value="deslizar"><span>Deslizando do topo</span></label>
      <label><input type="radio" name="c-entrada" value="aposrolar"><span>Depois de rolar</span></label>
      </div>
      <div id="c-entrada-campo">
      <label for="c-entradapx">Aparecer depois de rolar <small>(px)</small></label>
      <input type="number" id="c-entradapx" value="300" min="50" max="3000" step="50">
      </div>
      </fieldset>
    </div>
    <div>
      <fieldset>
      <legend>Destaque contínuo <small>(pode combinar)</small></legend>
      <div class="radios">
      <label><input type="checkbox" id="c-ef-pulsar"><span>Pulsar</span></label>
      <label><input type="checkbox" id="c-ef-brilho"><span>Brilho passante</span></label>
      <label><input type="checkbox" id="c-ef-degrade"><span>Degradê animado</span></label>
      <label><input type="checkbox" id="c-ef-piscar"><span>Separador piscando</span></label>
      <label><input type="checkbox" id="c-ef-tremor"><span>Tremor</span></label>
      </div>
      <p class="ajuda">O <b>separador piscando</b> só aparece no formato compacto (é o <code>:</code> entre os números). Efeitos contínuos chamam atenção o tempo todo e cansam — na dúvida, prefira a urgência progressiva ao lado, que só age quando o prazo aperta.</p>
      </fieldset>
      <fieldset>
      <legend>Urgência progressiva</legend>
      <div class="radios">
      <label><input type="radio" name="c-urg" value="nao" checked><span>Não usar</span></label>
      <label><input type="radio" name="c-urg" value="sim"><span>Usar</span></label>
      </div>
      <div id="c-urg-campos">
      <label for="c-urglim">Entrar em urgência faltando <small>(minutos)</small></label>
      <input type="number" id="c-urglim" value="60" min="1" max="10080" step="1">
      <label>Cor de urgência <small>(substitui o fundo da barra)</small></label>
      <div class="cor-linha"><input type="color" id="c-curg" value="#8C1D18"><input type="text" id="c-curg-t" value="#8C1D18"></div>
      <label>Pulsar ao entrar na urgência?</label>
      <div class="radios">
      <label><input type="radio" name="c-urgpulsar" value="sim" checked><span>Sim</span></label>
      <label><input type="radio" name="c-urgpulsar" value="nao"><span>Não</span></label>
      </div>
      </div>
      </fieldset>
    </div>
  </div>
```

- [ ] **Passo 4: Estender `cToggles`**

Acrescente ao final de `cToggles()`:

```js
  var mov=radio('c-mov');
  el=$('c-vel-campo');if(el)el.style.display=(mov==='rolaesq'||mov==='roladir')?'block':'none';
  el=$('c-alt-campo');if(el)el.style.display=(mov==='altfade'||mov==='altdesliza')?'block':'none';
  el=$('c-entrada-campo');if(el)el.style.display=(radio('c-entrada')==='aposrolar')?'block':'none';
  el=$('c-urg-campos');if(el)el.style.display=(radio('c-urg')==='sim')?'block':'none';
```

- [ ] **Passo 5: Registrar o par de cor**

```js
parearCor('c-curg');
```

- [ ] **Passo 6: Rodar e confirmar que passa**

```js
['c-vel','c-alt','c-ef-pulsar','c-ef-brilho','c-ef-degrade','c-ef-piscar','c-ef-tremor','c-urglim','c-curg','c-entradapx']
  .forEach(function(id){ T('campo ' + id, !!$$(id)); });
T('velocidade escondida no estatico', $$('c-vel-campo').style.display === 'none');
document.querySelector('input[name="c-mov"][value="rolaesq"]').click();
T('rolagem mostra velocidade', $$('c-vel-campo').style.display === 'block');
T('rolagem esconde intervalo', $$('c-alt-campo').style.display === 'none');
document.querySelector('input[name="c-mov"][value="altfade"]').click();
T('alternancia mostra intervalo', $$('c-alt-campo').style.display === 'block');
document.querySelector('input[name="c-urg"][value="sim"]').click();
T('urgencia mostra campos', $$('c-urg-campos').style.display === 'block');
document.querySelector('input[name="c-entrada"][value="aposrolar"]').click();
T('entrada apos rolar mostra px', $$('c-entrada-campo').style.display === 'block');
```

Esperado: 16 × PASS.

- [ ] **Passo 7: Commit**

```bash
git add index.html && git commit -m "feat(contagem): secao 4 - efeitos e movimento"
```

---

### Task 6: Persistência do estado

**Arquivos:**
- Modificar: `index.html` — `salvarEstado()` (~linha 886) e `restaurarEstado()` (~linha 919)

**Interfaces:**
- Consome: chave `fcConstrutores` do `localStorage`, `corValida(v)`, `setRadio(nome,val)`.
- Produz: ramo `c` no objeto de estado e o array `cMsgs` persistido em `cmsgs`.

- [ ] **Passo 1: Escrever a asserção que falha**

```js
$$('c-tam').value = '21';
$$('c-tam').dispatchEvent(new Event('input', {bubbles:true}));
document.querySelector('input[name="c-formato"][value="blocos"]').click();
var st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
T('ramo c gravado', !!st.c);
T('tamanho gravado', !!st.c && st.c.tam === '21');
```

O `dispatchEvent` é o que aciona o listener global de `input` que chama `salvarEstado()` — você não chama a função, provoca o evento que a chama.

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: 2 × FAIL.

- [ ] **Passo 3: Gravar o ramo `c`**

Em `salvarEstado()`, dentro do objeto `st`, após o ramo `b:{...}`, acrescente vírgula e:

```js
      cmsgs:cMsgs,
      c:{modo:radio('c-modo'),dias:$('c-dias').value,horas:$('c-horas').value,mins:$('c-mins').value,
        alvo:$('c-alvo').value,cod:$('c-cod').value,
        und:$('c-un-d').checked,unh:$('c-un-h').checked,unm:$('c-un-m').checked,uns:$('c-un-s').checked,
        diaszero:radio('c-diaszero'),fim:radio('c-fim'),fimtxt:$('c-fimtxt').value,
        cfundo:$('c-cfundo-t').value,ctexto:$('c-ctexto-t').value,cdestaque:$('c-cdestaque-t').value,
        fonte:radio('c-fonte'),tam:$('c-tam').value,peso:radio('c-peso'),
        formato:radio('c-formato'),rd:$('c-rd').value,rh:$('c-rh').value,rm:$('c-rm').value,rs:$('c-rs').value,
        pad:$('c-pad').value,largmax:$('c-largmax').value,alinha:radio('c-alinha'),
        borda:radio('c-borda'),cborda:$('c-cborda-t').value,mob:$('c-mob').value,
        fixa:radio('c-fixa'),empurrar:radio('c-empurrar'),z:$('c-z').value,
        cta:radio('c-cta'),ctatxt:$('c-ctatxt').value,ctaurl:$('c-ctaurl').value,
        ctafundo:$('c-ctafundo-t').value,ctatexto:$('c-ctatexto-t').value,
        fechar:radio('c-fechar'),prog:radio('c-prog'),cprog:$('c-cprog-t').value,
        coruja:radio('c-coruja'),corujaalt:$('c-corujaalt').value,corujagap:$('c-corujagap').value,
        corujacorpo:$('c-corujacorpo-t').value,corujadet:$('c-corujadet-t').value,corujamob:radio('c-corujamob'),
        mov:radio('c-mov'),vel:$('c-vel').value,alt:$('c-alt').value,
        efpulsar:$('c-ef-pulsar').checked,efbrilho:$('c-ef-brilho').checked,efdegrade:$('c-ef-degrade').checked,
        efpiscar:$('c-ef-piscar').checked,eftremor:$('c-ef-tremor').checked,
        urg:radio('c-urg'),urglim:$('c-urglim').value,curg:$('c-curg-t').value,urgpulsar:radio('c-urgpulsar'),
        dig:radio('c-dig'),entrada:radio('c-entrada'),entradapx:$('c-entradapx').value}
```

- [ ] **Passo 4: Restaurar o ramo `c`**

Em `restaurarEstado()`, após o bloco `if(st.b){...}`:

```js
    if(st.cmsgs){cMsgs=st.cmsgs;cMsgRender();}
    if(st.c){var C=st.c;
      setRadio('c-modo',C.modo);setRadio('c-diaszero',C.diaszero);setRadio('c-fim',C.fim);
      $('c-dias').value=C.dias;$('c-horas').value=C.horas;$('c-mins').value=C.mins;
      $('c-alvo').value=C.alvo||'';$('c-cod').value=C.cod||'';$('c-fimtxt').value=C.fimtxt;
      $('c-un-d').checked=!!C.und;$('c-un-h').checked=!!C.unh;$('c-un-m').checked=!!C.unm;$('c-un-s').checked=!!C.uns;
      setRadio('c-fonte',C.fonte);setRadio('c-peso',C.peso);setRadio('c-formato',C.formato);
      setRadio('c-alinha',C.alinha);setRadio('c-borda',C.borda);setRadio('c-fixa',C.fixa);
      setRadio('c-empurrar',C.empurrar);setRadio('c-cta',C.cta);setRadio('c-fechar',C.fechar);
      setRadio('c-prog',C.prog);setRadio('c-coruja',C.coruja);setRadio('c-corujamob',C.corujamob);
      setRadio('c-mov',C.mov);setRadio('c-urg',C.urg);setRadio('c-urgpulsar',C.urgpulsar);
      setRadio('c-dig',C.dig);setRadio('c-entrada',C.entrada);
      $('c-tam').value=C.tam;$('c-pad').value=C.pad;$('c-largmax').value=C.largmax;$('c-mob').value=C.mob;
      $('c-z').value=C.z;$('c-rd').value=C.rd;$('c-rh').value=C.rh;$('c-rm').value=C.rm;$('c-rs').value=C.rs;
      $('c-ctatxt').value=C.ctatxt;$('c-ctaurl').value=C.ctaurl;
      $('c-corujaalt').value=C.corujaalt;$('c-corujagap').value=C.corujagap;
      $('c-vel').value=C.vel;$('c-alt').value=C.alt;$('c-urglim').value=C.urglim;$('c-entradapx').value=C.entradapx;
      $('c-ef-pulsar').checked=!!C.efpulsar;$('c-ef-brilho').checked=!!C.efbrilho;$('c-ef-degrade').checked=!!C.efdegrade;
      $('c-ef-piscar').checked=!!C.efpiscar;$('c-ef-tremor').checked=!!C.eftremor;
      [['c-cfundo',C.cfundo,'#0F3A30'],['c-ctexto',C.ctexto,'#FDFBF6'],['c-cdestaque',C.cdestaque,'#FFC94A'],
       ['c-cborda',C.cborda,'#FFC94A'],['c-ctafundo',C.ctafundo,'#FFC94A'],['c-ctatexto',C.ctatexto,'#23281F'],
       ['c-cprog',C.cprog,'#FFC94A'],['c-corujacorpo',C.corujacorpo,'#FDFBF6'],['c-corujadet',C.corujadet,'#FFC94A'],
       ['c-curg',C.curg,'#8C1D18']].forEach(function(p){
        $(p[0]+'-t').value=p[1];$(p[0]).value=corValida(p[1])?p[1]:p[2];
      });
    }
```

- [ ] **Passo 5: Rodar e confirmar que passa**

**Parte A — gravação.** Cole numa aba recém-carregada:

```js
$$('c-tam').value = '21'; $$('c-tam').dispatchEvent(new Event('input',{bubbles:true}));
$$('c-cod').value = 'TESTE99'; $$('c-cod').dispatchEvent(new Event('input',{bubbles:true}));
document.querySelector('input[name="c-formato"][value="blocos"]').click();
document.querySelector('input[name="c-coruja"][value="sim"]').click();
$$('c-ef-pulsar').checked = true;
$$('c-ef-pulsar').dispatchEvent(new Event('change',{bubbles:true}));
$$('c-msg').value = 'Teste {contador}'; $$('c-msg-add').click();
var st = JSON.parse(localStorage.getItem('fcConstrutores'));
T('ramo c gravado', !!st.c);
T('tamanho gravado', st.c.tam === '21');
T('formato gravado', st.c.formato === 'blocos');
T('coruja gravada', st.c.coruja === 'sim');
T('checkbox gravado', st.c.efpulsar === true);
T('mensagens gravadas', st.cmsgs.length === 1);
```

**Parte B — restauração.** Agora **recarregue a página** (F5) e recole o helper. O recarregamento re-executa o bootstrap, que chama `restaurarEstado()` — é o percurso real, não uma simulação:

```js
$$('aba-cnt').click();
T('tamanho restaurado', V('c-tam') === '21');
T('formato restaurado', R('c-formato') === 'blocos');
T('coruja restaurada', R('c-coruja') === 'sim');
T('checkbox restaurado', $$('c-ef-pulsar').checked === true);
T('codigo restaurado', V('c-cod') === 'TESTE99');
T('mensagem restaurada na lista', $$('c-msg-lista').children.length === 1);
T('texto da mensagem restaurado', $$('c-msg-lista').textContent.indexOf('Teste {contador}') >= 0);
T('campos de coruja visiveis apos restaurar', $$('c-coruja-campos').style.display === 'block');
```

Esperado: 6 × PASS na parte A, 8 × PASS na parte B. A última asserção da parte B verifica algo que só o percurso real revela: que `cToggles()` roda depois de `restaurarEstado()` no bootstrap, senão os campos restaurados ficam com a visibilidade errada.

- [ ] **Passo 6: Commit**

```bash
git add index.html && git commit -m "feat(contagem): persistencia do estado da aba"
```

---

### Task 7: Motor de contagem e prévia ao vivo

**Arquivos:**
- Modificar: `index.html` — seção 5 dentro de `#painel-cnt`; funções `cCfg`, `cPartes`, `cAlvoMs`, `cFormatarHTML`, `cPreview`; bootstrap e `parearCor`

**Interfaces:**
- Consome: todos os campos das Tasks 2–5.
- Produz:
  - `cCfg()` → objeto com toda a configuração lida dos campos. Campos usados adiante: `modo`, `duracaoMs`, `alvoIso`, `cod`, `unidades{d,h,m,s}`, `diaszero`, `fim`, `fimtxt`, `cores{fundo,texto,destaque,borda,urg,ctaFundo,ctaTexto,prog,corujaCorpo,corujaDet}`, `fonte`, `tam`, `peso`, `formato`, `rotulos{d,h,m,s}`, `pad`, `largmax`, `alinha`, `borda`, `mob`, `fixa`, `empurrar`, `z`, `cta{ativo,txt,url}`, `fechar`, `prog`, `coruja{ativo,alt,gap,mob}`, `mov`, `vel`, `alt`, `efeitos{pulsar,brilho,degrade,piscar,tremor}`, `urg{ativo,lim,pulsar}`, `dig`, `entrada`, `entradapx`, `msgs[]`.
  - `cPartes(ms)` → `{d,h,m,s}` inteiros.
  - `cAlvoMs(cfg, inicioMs)` → instante-alvo em ms.
  - `cFormatarHTML(partes, cfg)` → string HTML do relógio.
  - `cPreview()` → redesenha `#c-pv-box`.

- [ ] **Passo 1: Escrever a asserção que falha**

```js
T('caixa de previa existe', !!$$('c-pv-box'));
T('botao atualizar previa existe', !!$$('c-atualizar'));
T('botao gerar existe', !!$$('c-gerar'));
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: 3 × FAIL.

- [ ] **Passo 3: Adicionar a seção 5**

```html
  <div class="secao"><span class="secao-n">5</span> Prévia e código gerado</div>
  <div class="acoes" style="margin-bottom:14px">
    <button class="botao" id="c-gerar">Gerar código</button>
    <button class="botao" id="c-atualizar">Atualizar prévia</button>
  </div>
  <div class="grade">
    <div>
      <div class="pv-area">
      <div id="c-pv-box"></div>
      </div>
    </div>
    <div>
      <div class="saida">
      <h3 id="c-out-titulo">Código gerado
      <button class="botao mini" id="c-copy1" style="margin-left:8px">Copiar</button>
      <span class="aviso-copiado" id="c-cop1">Copiado!</span>
      </h3>
      <textarea id="c-out1" readonly spellcheck="false" style="height:420px" placeholder="O código gerado aparece aqui."></textarea>
      </div>
    </div>
  </div>
```

- [ ] **Passo 4: Implementar o motor**

Acrescente junto às demais funções da aba:

```js
function cNum(id,def){var v=parseInt($(id).value,10);return isNaN(v)?def:v;}
function cCor(id,def){var v=$(id+'-t').value;return corValida(v)?v:def;}
function cCfg(){
  var dias=cNum('c-dias',0),horas=cNum('c-horas',0),mins=cNum('c-mins',0);
  return {
    modo:radio('c-modo'),
    duracaoMs:((dias*24+horas)*60+mins)*60000,
    alvoIso:$('c-alvo').value?($('c-alvo').value+':00-03:00').replace(/(T\d\d:\d\d):00:00/,'$1:00'):'',
    cod:$('c-cod').value.trim()||'padrao',
    unidades:{d:$('c-un-d').checked,h:$('c-un-h').checked,m:$('c-un-m').checked,s:$('c-un-s').checked},
    diaszero:radio('c-diaszero')==='sim',
    fim:radio('c-fim'),fimtxt:$('c-fimtxt').value,
    cores:{fundo:cCor('c-cfundo','#0F3A30'),texto:cCor('c-ctexto','#FDFBF6'),destaque:cCor('c-cdestaque','#FFC94A'),
      borda:cCor('c-cborda','#FFC94A'),urg:cCor('c-curg','#8C1D18'),
      ctaFundo:cCor('c-ctafundo','#FFC94A'),ctaTexto:cCor('c-ctatexto','#23281F'),
      prog:cCor('c-cprog','#FFC94A'),corujaCorpo:cCor('c-corujacorpo','#FDFBF6'),corujaDet:cCor('c-corujadet','#FFC94A')},
    fonte:radio('c-fonte'),tam:cNum('c-tam',15),peso:radio('c-peso'),
    formato:radio('c-formato'),
    rotulos:{d:$('c-rd').value,h:$('c-rh').value,m:$('c-rm').value,s:$('c-rs').value},
    pad:cNum('c-pad',10),largmax:cNum('c-largmax',1100),alinha:radio('c-alinha'),
    borda:radio('c-borda')==='sim',mob:cNum('c-mob',640),
    fixa:radio('c-fixa')==='fixa',empurrar:radio('c-empurrar')==='empurrar',z:cNum('c-z',99980),
    cta:{ativo:radio('c-cta')==='sim',txt:$('c-ctatxt').value,url:$('c-ctaurl').value},
    fechar:radio('c-fechar'),prog:radio('c-prog')==='sim',
    coruja:{ativo:radio('c-coruja')==='sim',alt:cNum('c-corujaalt',26),gap:cNum('c-corujagap',16),mob:radio('c-corujamob')==='sim'},
    mov:radio('c-mov'),vel:cNum('c-vel',18),alt:cNum('c-alt',5),
    efeitos:{pulsar:$('c-ef-pulsar').checked,brilho:$('c-ef-brilho').checked,degrade:$('c-ef-degrade').checked,
      piscar:$('c-ef-piscar').checked,tremor:$('c-ef-tremor').checked},
    urg:{ativo:radio('c-urg')==='sim',lim:cNum('c-urglim',60),pulsar:radio('c-urgpulsar')==='sim'},
    dig:radio('c-dig'),entrada:radio('c-entrada'),entradapx:cNum('c-entradapx',300),
    msgs:cMsgs.length?cMsgs:[{texto:'Oferta por tempo limitado {contador}',curta:''}]
  };
}
function cPartes(ms){
  if(ms<0)ms=0;
  var t=Math.floor(ms/1000);
  return {d:Math.floor(t/86400),h:Math.floor(t%86400/3600),m:Math.floor(t%3600/60),s:t%60};
}
function cAlvoMs(cfg,inicioMs){
  if(cfg.modo==='data'){var v=Date.parse(cfg.alvoIso);return isNaN(v)?inicioMs:v;}
  return inicioMs+cfg.duracaoMs;
}
function cDois(n){return (n<10?'0':'')+n;}
function cFormatarHTML(p,cfg){
  var u=cfg.unidades,mostraD=u.d&&!(cfg.diaszero&&p.d===0);
  var itens=[];
  if(mostraD)itens.push([cDois(p.d),cfg.rotulos.d,'d']);
  if(u.h)itens.push([cDois(p.h),cfg.rotulos.h,'h']);
  if(u.m)itens.push([cDois(p.m),cfg.rotulos.m,'m']);
  if(u.s)itens.push([cDois(p.s),cfg.rotulos.s,'s']);
  if(!itens.length)return '';
  var h='',i;
  if(cfg.formato==='blocos'){
    for(i=0;i<itens.length;i++){
      h+='<span class="fcb-bloco"><span class="fcb-num">'+itens[i][0]+'</span><span class="fcb-rot">'+escHtml(itens[i][1])+'</span></span>';
    }
  }else{
    for(i=0;i<itens.length;i++){
      if(i)h+='<span class="fcb-sep">:</span>';
      h+='<span class="fcb-num">'+itens[i][0]+'</span><span class="fcb-suf">'+itens[i][2]+'</span>';
    }
  }
  return '<span class="fcb-rel">'+h+'</span>';
}
```

- [ ] **Passo 5: Implementar a prévia**

```js
var cPvTimer=null,cPvInicio=null,cPvMsg=0;
function cPreview(){
  var box=$('c-pv-box');if(!box)return;
  if(cPvTimer){clearInterval(cPvTimer);cPvTimer=null;}
  var cfg=cCfg();
  if(cPvInicio===null)cPvInicio=(new Date()).getTime();
  var alvo=cAlvoMs(cfg,cPvInicio);
  var fontes={neutra:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,sans-serif',
    humanista:'"Helvetica Neue",Helvetica,Arial,sans-serif',
    condensada:'"Roboto Condensed","Arial Narrow",Arial,sans-serif',
    mono:'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'};
  box.innerHTML='<div class="c-pv-barra"><div class="c-pv-conteudo"></div></div>'+
    '<p style="font-size:12px;color:var(--tinta-suave);text-align:center;margin:12px 0 0">'+
    (cfg.fixa?'Na pagina real esta barra fica fixa no topo (codigo para a Tag Body).'
             :'Na pagina real esta barra rola com a pagina (codigo para um componente HTML).')+'</p>';
  var barra=box.querySelector('.c-pv-barra');
  barra.style.cssText='background:'+cfg.cores.fundo+';color:'+cfg.cores.texto+';font-family:'+fontes[cfg.fonte]+
    ';font-size:'+cfg.tam+'px;font-weight:'+cfg.peso+';padding:'+cfg.pad+'px 16px;border-radius:6px;'+
    'text-align:'+(cfg.alinha==='centro'?'center':'left')+';font-variant-numeric:tabular-nums;'+
    (cfg.borda?'border-bottom:2px solid '+cfg.cores.borda+';':'');
  var alvoEl=box.querySelector('.c-pv-conteudo');
  function pinta(){
    var restante=alvo-(new Date()).getTime();
    if(restante<=0){
      if(cfg.fim==='esconder'){alvoEl.innerHTML='<i style="opacity:.7">(a barra some quando zera)</i>';return;}
      if(cfg.fim==='mensagem'){alvoEl.textContent=cfg.fimtxt;return;}
      if(cfg.fim==='reiniciar'){cPvInicio=(new Date()).getTime();alvo=cAlvoMs(cfg,cPvInicio);restante=alvo-cPvInicio;}
      else restante=0;
    }
    var msg=cfg.msgs[cPvMsg%cfg.msgs.length];
    var rel=cFormatarHTML(cPartes(restante),cfg);
    var txt=escHtml(msg.texto);
    alvoEl.innerHTML=txt.indexOf('{contador}')>=0?txt.split('{contador}').join(rel):(txt+' '+rel);
    if(cfg.urg.ativo&&restante<=cfg.urg.lim*60000)barra.style.background=cfg.cores.urg;
    else barra.style.background=cfg.cores.fundo;
  }
  pinta();
  cPvTimer=setInterval(pinta,1000);
  if((cfg.mov==='altfade'||cfg.mov==='altdesliza')&&cfg.msgs.length>1){
    setInterval(function(){cPvMsg++;},cfg.alt*1000);
  }
}
```

Adicione o CSS da prévia junto às demais regras no `<style>` do topo do arquivo:

```css
  .c-pv-barra{box-sizing:border-box;width:100%;overflow:hidden}
  .c-pv-barra .fcb-num{font-weight:700}
  .c-pv-barra .fcb-bloco{display:inline-block;text-align:center;margin:0 4px}
  .c-pv-barra .fcb-bloco .fcb-num{display:block;font-size:1.25em;line-height:1.1}
  .c-pv-barra .fcb-bloco .fcb-rot{display:block;font-size:.62em;opacity:.75;text-transform:uppercase;letter-spacing:.04em}
  .c-pv-barra .fcb-sep,.c-pv-barra .fcb-suf{opacity:.65;margin:0 1px}
```

**Importante:** a cor de destaque dos números é aplicada pelo código gerado; na prévia ela entra pelo estilo inline do `pinta()` se você quiser — não é exigida pela asserção desta tarefa.

- [ ] **Passo 6: Ligar botões, `parearCor` e bootstrap**

```js
liga('c-atualizar',cPreview);
liga('c-copy1',function(){copiar('c-out1','c-cop1');});
```

O botão `c-gerar` fica sem ligação nesta tarefa — `cGerar` nasce na Task 8, que acrescenta o `liga('c-gerar',cGerar);`. Não crie stub vazio: referenciar uma função inexistente aqui quebraria o carregamento do arquivo inteiro.

Acrescente também as chamadas de prévia ao CRUD da Task 3, agora que `cPreview` existe — ao final de `cMsgAdd`, `cMsgMove` e `cMsgDel`:

```js
  cPreview();
```

Em `parearCor`, troque o corpo para chamar também a prévia da contagem:

```js
function parearCor(idCor){
  var c=$(idCor),t=$(idCor+'-t');
  c.addEventListener('input',function(){t.value=c.value;salvarEstado();lBtnPreview();if(/^c-/.test(idCor))cPreview();});
  t.addEventListener('input',function(){if(corValida(t.value)){c.value=t.value;lBtnPreview();if(/^c-/.test(idCor))cPreview();}});
}
```

No listener de `change` da aba (Task 2), acrescente `cPreview();` depois de `cToggles();`. No bootstrap, após `cToggles();` e `cMsgRender();`:

```js
cPreview();
```

- [ ] **Passo 7: Rodar e confirmar que passa**

O motor é verificado **através da prévia** — é a superfície observável dele. Numa aba recém-carregada, limpe a lista de mensagens (remova as que existirem clicando no `✕`) e cole:

```js
$$('aba-cnt').click();
$$('c-msg').value = 'Faltam {contador}'; $$('c-msg-add').click();
document.querySelector('input[name="c-modo"][value="abertura"]').click();
document.querySelector('input[name="c-formato"][value="compacto"]').click();
document.querySelector('input[name="c-diaszero"][value="nao"]').click();
['c-un-d','c-un-h','c-un-m','c-un-s'].forEach(function(id){ $$(id).checked = true; });
$$('c-dias').value='2'; $$('c-horas').value='3'; $$('c-mins').value='4';
['c-dias','c-horas','c-mins'].forEach(function(id){
  $$(id).dispatchEvent(new Event('input',{bubbles:true})); });
$$('c-atualizar').click();
var box = $$('c-pv-box'), txt = box.textContent;
T('previa desenhou a barra', !!box.querySelector('.c-pv-barra'));
T('previa usa a mensagem cadastrada', txt.indexOf('Faltam') >= 0);
T('previa mostra 4 unidades', box.querySelectorAll('.fcb-num').length === 4);
T('dias com dois digitos', box.querySelectorAll('.fcb-num')[0].textContent === '02');
T('horas corretas', box.querySelectorAll('.fcb-num')[1].textContent === '03');
T('minutos corretos', box.querySelectorAll('.fcb-num')[2].textContent === '04');
T('formato compacto tem separador', !!box.querySelector('.fcb-sep'));
```

Agora as regras de exibição:

```js
// esconder dias quando zerarem
$$('c-dias').value='0'; $$('c-dias').dispatchEvent(new Event('input',{bubbles:true}));
document.querySelector('input[name="c-diaszero"][value="sim"]').click();
$$('c-atualizar').click();
T('esconde dias zerados', $$('c-pv-box').querySelectorAll('.fcb-num').length === 3);
document.querySelector('input[name="c-diaszero"][value="nao"]').click();
$$('c-atualizar').click();
T('mostra dias zerados quando pedido', $$('c-pv-box').querySelectorAll('.fcb-num').length === 4);
// unidade desmarcada some
$$('c-un-s').checked = false;
$$('c-un-s').dispatchEvent(new Event('change',{bubbles:true}));
$$('c-atualizar').click();
T('unidade desmarcada some', $$('c-pv-box').querySelectorAll('.fcb-num').length === 3);
$$('c-un-s').checked = true; $$('c-un-s').dispatchEvent(new Event('change',{bubbles:true}));
// formato em blocos
document.querySelector('input[name="c-formato"][value="blocos"]').click();
$$('c-atualizar').click();
T('formato blocos usa caixas', $$('c-pv-box').querySelectorAll('.fcb-bloco').length === 4);
T('blocos tem rotulo por extenso', $$('c-pv-box').querySelector('.fcb-rot').textContent.length > 1);
// sem mensagem cadastrada, cai na mensagem padrao
$$('c-msg-lista').querySelector('button[aria-label="Remover"]').click();
$$('c-atualizar').click();
T('sem mensagem usa a padrao', $$('c-pv-box').textContent.indexOf('tempo limitado') >= 0);
```

E o essencial — a contagem tem que andar sozinha:

```js
var antes = $$('c-pv-box').textContent;
setTimeout(function(){
  T('previa anda sozinha', $$('c-pv-box').textContent !== antes);
}, 1500);
```

Esperado: 7 + 6 PASS nos dois primeiros blocos, e `previa anda sozinha` PASS cerca de 1,5s depois.

- [ ] **Passo 8: Commit**

```bash
git add index.html && git commit -m "feat(contagem): motor de contagem e previa ao vivo"
```

---

### Task 8: Gerador — bloco base

**Arquivos:**
- Modificar: `index.html` — função `cGerar` nova, mais a ligação do botão `c-gerar`

**Interfaces:**
- Consome: `cCfg()`, `esc(s)`, `escHtml(s)`.
- Produz: `cGerar()` escreve o bloco completo em `#c-out1` e ajusta `#c-out-titulo`. Funções auxiliares `cCssBase(cfg)` e `cJsBase(cfg)` retornam string.

- [ ] **Passo 1: Escrever a asserção que falha**

```js
document.querySelector('input[name="c-fixa"][value="fixa"]').click();
$$('c-gerar').click();
var out = V('c-out1');
T('gerou codigo', out.length > 200);
T('titulo diz Tag Body', $$('c-out-titulo').textContent.indexOf('Tag Body') >= 0);
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: 2 × FAIL (o botão ainda não tem função ligada).

- [ ] **Passo 3: Implementar `cGerar`**

Acrescente junto às demais funções da aba, e ligue o botão no bloco de `liga(...)` com `liga('c-gerar',cGerar);`:

```js
function cGerar(){
  var cfg=cCfg();
  if(cfg.modo==='data'&&!$('c-alvo').value){alert('Informe a data e hora do encerramento.');return;}
  if(cfg.modo==='abertura'&&cfg.duracaoMs<=0){alert('Informe uma duracao maior que zero.');return;}
  var c='';
  c+='<!-- ============================================================\n';
  c+='     FOTO CERTA - BARRA DE CONTAGEM REGRESSIVA\n';
  c+='     ONDE COLAR: '+(cfg.fixa?'campo Tag Body da pagina':'componente HTML no topo da pagina')+'\n';
  c+='     Gerado pela ferramenta em construtores.fotocerta.com.br\n';
  c+='     ============================================================ -->\n\n';
  c+='<sty'+'le>\n'+cCssBase(cfg)+'</sty'+'le>\n\n';
  c+='<div class="fcb-barra" id="fcb-barra"></div>\n\n';
  c+='<scr'+'ipt>\n(function () {\n'+cJsBase(cfg)+'})();\n</scr'+'ipt>\n';
  $('c-out1').value=c;
  cTitulo();
}
function cTitulo(){
  var t=$('c-out-titulo');if(!t)return;
  var fixa=radio('c-fixa')==='fixa';
  var nome=fixa?'Código para a Tag Body da página':'Código para o componente HTML';
  t.childNodes[0].nodeValue=nome+' ';
}
```

- [ ] **Passo 4: Implementar `cCssBase`**

```js
function cCssBase(cfg){
  var fontes={neutra:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,sans-serif',
    humanista:'"Helvetica Neue",Helvetica,Arial,sans-serif',
    condensada:'"Roboto Condensed","Arial Narrow",Arial,sans-serif',
    mono:'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'};
  var s='';
  s+='.fcb-barra{'+(cfg.fixa?'position:fixed;top:0;left:0;right:0;z-index:'+cfg.z+';':'position:relative;')+
     'box-sizing:border-box;width:100%;background:'+cfg.cores.fundo+';color:'+cfg.cores.texto+';'+
     'font-family:'+fontes[cfg.fonte]+';font-size:'+cfg.tam+'px;font-weight:'+cfg.peso+';'+
     'padding:'+cfg.pad+'px 16px;line-height:1.3;font-variant-numeric:tabular-nums;'+
     'transition:background-color .4s ease;'+
     (cfg.borda?'border-bottom:2px solid '+cfg.cores.borda+';':'')+'}\n';
  s+='.fcb-interno{display:flex;align-items:center;gap:'+cfg.coruja.gap+'px;max-width:'+cfg.largmax+'px;margin:0 auto;'+
     'justify-content:'+(cfg.alinha==='centro'?'center':'flex-start')+'}\n';
  s+='.fcb-conteudo{flex:1 1 auto;min-width:0;overflow:hidden;text-align:'+(cfg.alinha==='centro'?'center':'left')+'}\n';
  s+='.fcb-num{font-weight:700;color:'+cfg.cores.destaque+'}\n';
  s+='.fcb-sep,.fcb-suf{opacity:.65;margin:0 1px}\n';
  s+='.fcb-rel{white-space:nowrap}\n';
  if(cfg.formato==='blocos'){
    s+='.fcb-bloco{display:inline-block;text-align:center;margin:0 5px}\n';
    s+='.fcb-bloco .fcb-num{display:block;font-size:1.3em;line-height:1.1}\n';
    s+='.fcb-bloco .fcb-rot{display:block;font-size:.62em;opacity:.75;text-transform:uppercase;letter-spacing:.04em}\n';
  }
  s+='.fcb-curta{display:none}\n';
  s+='@media (max-width:'+cfg.mob+'px){.fcb-longa{display:none}.fcb-curta{display:inline}}\n';
  return s;
}
```

- [ ] **Passo 5: Implementar `cJsBase`**

```js
function cJsBase(cfg){
  var j='';
  j+='  /* ===== CONFIGURACAO ===== */\n';
  j+="  var MODO='"+cfg.modo+"';                 /* 'abertura' = prazo por visitante | 'data' = ate um instante fixo */\n";
  j+='  var DURACAO_MS='+cfg.duracaoMs+';        /* usado so no modo abertura */\n';
  j+="  var ALVO_ISO='"+esc(cfg.alvoIso)+"';     /* usado so no modo data, com fuso -03:00 */\n";
  j+="  var CODIGO='"+esc(cfg.cod)+"';           /* trocar este codigo zera a contagem de todos os visitantes */\n";
  j+="  var AO_ZERAR='"+cfg.fim+"';              /* 'esconder' | 'mensagem' | 'zerado' | 'reiniciar' */\n";
  j+="  var MSG_FINAL='"+esc(cfg.fimtxt)+"';\n";
  j+='  var MENSAGENS=[\n';
  cfg.msgs.forEach(function(m,i){
    j+="    {texto:'"+esc(m.texto)+"',curta:'"+esc(m.curta||'')+"'}"+(i<cfg.msgs.length-1?',':'')+'\n';
  });
  j+='  ];\n';
  j+='  var UNIDADES={d:'+cfg.unidades.d+',h:'+cfg.unidades.h+',m:'+cfg.unidades.m+',s:'+cfg.unidades.s+'};\n';
  j+="  var ROTULOS={d:'"+esc(cfg.rotulos.d)+"',h:'"+esc(cfg.rotulos.h)+"',m:'"+esc(cfg.rotulos.m)+"',s:'"+esc(cfg.rotulos.s)+"'};\n";
  j+='  var ESCONDE_DIAS_ZERADOS='+cfg.diaszero+';\n';
  j+="  var FORMATO='"+cfg.formato+"';           /* 'compacto' | 'blocos' */\n";
  j+='  var EMPURRA_CONTEUDO='+(cfg.fixa&&cfg.empurrar)+';\n';
  j+='\n  /* Daqui para baixo nao precisa mexer */\n\n';
  j+='  var raiz=document.getElementById(\'fcb-barra\');\n  if(!raiz)return;\n\n';
  j+='  function guardar(k,v){try{localStorage.setItem(k,v);}catch(e){}}\n';
  j+='  function ler(k){try{return localStorage.getItem(k);}catch(e){return null;}}\n\n';
  j+="  var CHAVE='fcbar:'+CODIGO;\n";
  j+='  var agora=(new Date()).getTime();\n';
  j+='  var inicio=parseInt(ler(CHAVE),10);\n';
  j+='  if(!inicio||isNaN(inicio)){inicio=agora;guardar(CHAVE,String(inicio));}\n\n';
  j+="  function alvoMs(){\n";
  j+="    if(MODO==='data'){var v=Date.parse(ALVO_ISO);return isNaN(v)?inicio:v;}\n";
  j+='    return inicio+DURACAO_MS;\n  }\n';
  j+='  var alvo=alvoMs();\n\n';
  j+='  function dois(n){return (n<10?\'0\':\'\')+n;}\n';
  j+='  function partes(ms){\n';
  j+='    if(ms<0)ms=0;\n    var t=Math.floor(ms/1000);\n';
  j+='    return {d:Math.floor(t/86400),h:Math.floor(t%86400/3600),m:Math.floor(t%3600/60),s:t%60};\n  }\n\n';
  j+='  function relogio(p){\n';
  j+='    var itens=[],h=\'\',i;\n';
  j+='    if(UNIDADES.d&&!(ESCONDE_DIAS_ZERADOS&&p.d===0))itens.push([dois(p.d),ROTULOS.d,\'d\']);\n';
  j+='    if(UNIDADES.h)itens.push([dois(p.h),ROTULOS.h,\'h\']);\n';
  j+='    if(UNIDADES.m)itens.push([dois(p.m),ROTULOS.m,\'m\']);\n';
  j+='    if(UNIDADES.s)itens.push([dois(p.s),ROTULOS.s,\'s\']);\n';
  j+='    if(!itens.length)return \'\';\n';
  j+="    if(FORMATO==='blocos'){\n";
  j+='      for(i=0;i<itens.length;i++)h+=\'<span class="fcb-bloco"><span class="fcb-num">\'+itens[i][0]+\'</span><span class="fcb-rot">\'+itens[i][1]+\'</span></span>\';\n';
  j+='    }else{\n';
  j+='      for(i=0;i<itens.length;i++){\n';
  j+='        if(i)h+=\'<span class="fcb-sep">:</span>\';\n';
  j+='        h+=\'<span class="fcb-num">\'+itens[i][0]+\'</span><span class="fcb-suf">\'+itens[i][2]+\'</span>\';\n';
  j+='      }\n    }\n';
  j+="    return '<span class=\"fcb-rel\">'+h+'</span>';\n  }\n\n";
  j+='  /* O relogio NAO e reescrito junto com a mensagem: a mensagem entra uma vez,\n';
  j+='     com marcadores [data-fcb-rel] vazios, e o tick de cada segundo preenche\n';
  j+='     apenas esses marcadores. Reescrever o innerHTML inteiro reiniciaria a\n';
  j+='     animacao CSS da rolagem a cada segundo. */\n';
  j+="  var MARCA='<span data-fcb-rel></span>';\n";
  j+='  function comMarca(t){\n';
  j+="    if(t.indexOf('{contador}')<0)return t+' '+MARCA;\n";
  j+="    return t.split('{contador}').join(MARCA);\n  }\n";
  j+='  function textoCom(msg){\n';
  j+='    var longa=comMarca(msg.texto);\n';
  j+='    if(!msg.curta)return longa;\n';
  j+="    return '<span class=\"fcb-longa\">'+longa+'</span><span class=\"fcb-curta\">'+comMarca(msg.curta)+'</span>';\n  }\n\n";
  j+='  raiz.innerHTML=\'<div class="fcb-interno"><div class="fcb-conteudo"></div></div>\';\n';
  j+="  var conteudo=raiz.querySelector('.fcb-conteudo');\n";
  j+='  var msgAtual=0;\n\n';
  j+='  function espaco(){\n';
  j+='    if(!EMPURRA_CONTEUDO)return;\n';
  j+="    document.body.style.paddingTop=raiz.offsetHeight+'px';\n  }\n";
  j+='  function liberarEspaco(){\n';
  j+="    if(EMPURRA_CONTEUDO)document.body.style.paddingTop='';\n  }\n\n";
  j+='  var timer=null;\n';
  j+='  function encerrar(){\n';
  j+='    if(timer){clearInterval(timer);timer=null;}\n';
  j+="    if(AO_ZERAR==='esconder'){raiz.style.display='none';liberarEspaco();return;}\n";
  j+="    if(AO_ZERAR==='mensagem'){conteudo.textContent=MSG_FINAL;espaco();return;}\n";
  j+='  }\n\n';
  j+='  /* pintarMensagem roda so na montagem e na troca de mensagem */\n';
  j+='  function pintarMensagem(){\n';
  j+='    conteudo.innerHTML=textoCom(MENSAGENS[msgAtual%MENSAGENS.length]);\n';
  j+='  }\n';
  j+='  /* atualizarRelogio roda a cada segundo e toca so nos marcadores */\n';
  j+='  function atualizarRelogio(restante){\n';
  j+="    var els=conteudo.querySelectorAll('[data-fcb-rel]'),h=relogio(partes(restante)),i;\n";
  j+='    for(i=0;i<els.length;i++)els[i].innerHTML=h;\n';
  j+='  }\n\n';
  j+='  function tick(){\n';
  j+='    var restante=alvo-(new Date()).getTime();\n';
  j+='    if(restante<=0){\n';
  j+="      if(AO_ZERAR==='reiniciar'&&MODO==='abertura'){\n";
  j+='        inicio=(new Date()).getTime();guardar(CHAVE,String(inicio));alvo=alvoMs();\n';
  j+='        restante=alvo-inicio;\n';
  j+="      }else if(AO_ZERAR==='zerado'){restante=0;}\n";
  j+='      else{encerrar();return;}\n';
  j+='    }\n';
  j+='    atualizarRelogio(restante);\n';
  j+='  }\n\n';
  j+='  pintarMensagem();\n';
  j+='  tick();\n';
  j+='  timer=setInterval(tick,1000);\n';
  j+='  espaco();\n';
  j+="  window.addEventListener('resize',espaco);\n";
  j+='  if(window.ResizeObserver)new ResizeObserver(espaco).observe(raiz);\n';
  return j;
}
```

- [ ] **Passo 6: Chamar `cTitulo` no toggle**

Ao final de `cToggles()`:

```js
  cTitulo();
```

- [ ] **Passo 7: Rodar e confirmar que passa**

```js
$$('c-msg').value = 'Termina em {contador}'; $$('c-msg-add').click();
$$('c-cod').value = 'TESTE'; $$('c-horas').value = '2';
['c-cod','c-horas'].forEach(function(id){
  $$(id).dispatchEvent(new Event('input',{bubbles:true})); });
document.querySelector('input[name="c-modo"][value="abertura"]').click();
document.querySelector('input[name="c-fixa"][value="fixa"]').click();
$$('c-gerar').click();
var out = V('c-out1');
T('gerou codigo', out.length > 500);
T('titulo diz Tag Body', $$('c-out-titulo').textContent.indexOf('Tag Body') >= 0);
T('script blindado', out.indexOf('<scr' + 'ipt>') >= 0 && out.indexOf('<script>') < 0);
T('style blindado', out.indexOf('<sty' + 'le>') >= 0 && out.indexOf('<style>') < 0);
T('esta em IIFE', out.indexOf('(function () {') >= 0 && out.indexOf('})();') >= 0);
T('sem tag semantica', !/<(section|header|nav|footer|article|aside)[\s>]/.test(out));
T('sem evento inline', !/\son(click|load|change)\s*=/.test(out));
T('position fixed no modo fixa', out.indexOf('position:fixed') >= 0);
T('grava o carimbo', out.indexOf("'fcbar:'+CODIGO") >= 0);
T('recalcula por instante absoluto', out.indexOf('alvo-(new Date()).getTime()') >= 0);
T('usa marcador de relogio', out.indexOf('data-fcb-rel') >= 0);
T('tick nao remonta a mensagem', out.indexOf('atualizarRelogio(restante)') >= 0);
document.querySelector('input[name="c-fixa"][value="fluxo"]').click();
$$('c-gerar').click();
T('titulo muda para componente', $$('c-out-titulo').textContent.indexOf('componente HTML') >= 0);
T('sem position fixed no fluxo', V('c-out1').indexOf('position:fixed') < 0);
```

Esperado: 12 × PASS.

**Verificação funcional adicional:** copie a saída para um arquivo `/tmp/teste-barra.html` envolto em `<!doctype html><html><body>` + código + `</body></html>`, abra no navegador e confirme que a barra aparece, conta, e que ao recarregar **não reinicia**.

- [ ] **Passo 8: Commit**

```bash
git add index.html && git commit -m "feat(contagem): gerador do bloco base"
```

---

### Task 9: Gerador — movimento e efeitos

**Arquivos:**
- Modificar: `index.html` — `cCssBase` ganha `cCssEfeitos(cfg)`; `cJsBase` ganha o laço de alternância e a urgência

**Interfaces:**
- Consome: `cCfg()`.
- Produz: `cCssEfeitos(cfg)` → string CSS com `@keyframes` e classes de efeito, sempre seguida do bloco `prefers-reduced-motion`.

- [ ] **Passo 1: Escrever a asserção que falha**

```js
document.querySelector('input[name="c-mov"][value="rolaesq"]').click();
$$('c-ef-pulsar').checked = true;
$$('c-gerar').click();
var out = V('c-out1');
T('tem keyframes de rolagem', out.indexOf('@keyframes fcb-rola') >= 0);
T('tem keyframes de pulsar', out.indexOf('@keyframes fcb-pulsar') >= 0);
T('tem prefers-reduced-motion', out.indexOf('prefers-reduced-motion') >= 0);
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: 3 × FAIL.

- [ ] **Passo 3: Implementar `cCssEfeitos`**

```js
function cCssEfeitos(cfg){
  var s='',anim=[];
  if(cfg.mov==='rolaesq'||cfg.mov==='roladir'){
    s+='.fcb-trilho{display:inline-flex;white-space:nowrap;will-change:transform;'+
       'animation:fcb-rola '+cfg.vel+'s linear infinite'+(cfg.mov==='roladir'?' reverse':'')+'}\n';
    s+='.fcb-trilho > span{padding-right:3em}\n';
    s+='@keyframes fcb-rola{from{transform:translateX(0)}to{transform:translateX(-50%)}}\n';
    anim.push('.fcb-trilho');
  }
  if(cfg.mov==='altfade'){
    s+='.fcb-conteudo{transition:opacity .4s ease}\n.fcb-conteudo.fcb-saindo{opacity:0}\n';
  }
  if(cfg.mov==='altdesliza'){
    s+='.fcb-conteudo{transition:transform .4s ease,opacity .4s ease}\n';
    s+='.fcb-conteudo.fcb-saindo{transform:translateY(-100%);opacity:0}\n';
  }
  if(cfg.efeitos.pulsar){
    s+='.fcb-conteudo{animation:fcb-pulsar 1.8s ease-in-out infinite}\n';
    s+='@keyframes fcb-pulsar{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}\n';
    anim.push('.fcb-conteudo');
  }
  if(cfg.efeitos.brilho){
    s+='.fcb-barra{background-image:linear-gradient(100deg,rgba(255,255,255,0) 40%,rgba(255,255,255,.28) 50%,rgba(255,255,255,0) 60%);'+
       'background-size:250% 100%;background-repeat:no-repeat;animation:fcb-brilho 5s linear infinite}\n';
    s+='@keyframes fcb-brilho{from{background-position:150% 0}to{background-position:-150% 0}}\n';
    anim.push('.fcb-barra');
  }
  if(cfg.efeitos.degrade){
    s+='.fcb-barra{background-image:linear-gradient(90deg,'+cfg.cores.fundo+','+cfg.cores.destaque+','+cfg.cores.fundo+');'+
       'background-size:200% 100%;animation:fcb-degrade 8s linear infinite}\n';
    s+='@keyframes fcb-degrade{from{background-position:0 0}to{background-position:200% 0}}\n';
    anim.push('.fcb-barra');
  }
  if(cfg.efeitos.piscar&&cfg.formato==='compacto'){
    s+='.fcb-sep{animation:fcb-piscar 1s steps(1) infinite}\n';
    s+='@keyframes fcb-piscar{0%,49%{opacity:.65}50%,100%{opacity:0}}\n';
    anim.push('.fcb-sep');
  }
  if(cfg.efeitos.tremor){
    s+='.fcb-interno{animation:fcb-tremor 6s ease-in-out infinite}\n';
    s+='@keyframes fcb-tremor{0%,90%,100%{transform:translateX(0)}92%{transform:translateX(-3px)}94%{transform:translateX(3px)}96%{transform:translateX(-2px)}98%{transform:translateX(2px)}}\n';
    anim.push('.fcb-interno');
  }
  if(cfg.urg.ativo&&cfg.urg.pulsar){
    s+='.fcb-barra.fcb-urgente .fcb-conteudo{animation:fcb-urgpulsar 1s ease-in-out infinite}\n';
    s+='@keyframes fcb-urgpulsar{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}\n';
    anim.push('.fcb-barra.fcb-urgente .fcb-conteudo');
  }
  if(cfg.dig==='fade'){
    s+='.fcb-num{transition:opacity .25s ease}\n.fcb-num.fcb-virando{opacity:.15}\n';
  }
  if(cfg.dig==='flip'){
    s+='.fcb-num{display:inline-block;transition:transform .25s ease}\n.fcb-num.fcb-virando{transform:rotateX(90deg)}\n';
  }
  if(cfg.entrada==='deslizar'||cfg.entrada==='aposrolar'){
    s+='.fcb-barra{transform:translateY(-100%);transition:transform .45s ease}\n';
    s+='.fcb-barra.fcb-visivel{transform:translateY(0)}\n';
  }
  if(anim.length){
    s+='@media (prefers-reduced-motion: reduce){\n';
    s+='  '+anim.join(',')+'{animation:none}\n';
    s+='  .fcb-barra{transition:none}\n';
    s+='}\n';
  }
  return s;
}
```

- [ ] **Passo 4: Ligar em `cCssBase`**

Na última linha de `cCssBase`, antes do `return s;`:

```js
  s+=cCssEfeitos(cfg);
```

- [ ] **Passo 5: Estender `cJsBase` — trilho, alternância, urgência, entrada**

Em `cJsBase`, substitua a linha que monta o `innerHTML` da raiz por uma versão que envolve o conteúdo num trilho quando há rolagem, e acrescente os laços. Localize:

```js
  j+='  raiz.innerHTML=\'<div class="fcb-interno"><div class="fcb-conteudo"></div></div>\';\n';
```

e troque por:

```js
  j+='  var ROLANDO='+(cfg.mov==='rolaesq'||cfg.mov==='roladir')+';\n';
  j+='  raiz.innerHTML=\'<div class="fcb-interno"><div class="fcb-conteudo"></div></div>\';\n';
```

Depois, troque a função `pintarMensagem` para duplicar o conteúdo no trilho quando houver rolagem — a duplicação é o que dá a emenda invisível do loop:

```js
  j+='  function pintarMensagem(){\n';
  j+='    var html=textoCom(MENSAGENS[msgAtual%MENSAGENS.length]);\n';
  j+="    conteudo.innerHTML=ROLANDO?('<div class=\"fcb-trilho\"><span>'+html+'</span><span>'+html+'</span></div>'):html;\n";
  j+='  }\n';
```

Como `atualizarRelogio` varre **todos** os `[data-fcb-rel]` do conteúdo, os dois clones do trilho recebem o mesmo relógio no mesmo instante — que é exatamente o que a seção 2.4 do spec exige.

E acrescente à função `tick`, logo antes do `atualizarRelogio(restante);`, o teste de urgência:

```js
  if(cfg.urg.ativo){
    j+='    if(restante<=LIMITE_URGENCIA){\n';
    j+="      raiz.classList.add('fcb-urgente');\n";
    j+="      raiz.style.background='"+cfg.cores.urg+"';\n";
    j+='    }\n';
  }
```

Use `classList.add`, nunca `className='...'`: a classe `fcb-visivel` da entrada da barra mora no mesmo elemento, e sobrescrever `className` apagaria ela — a barra sumiria no instante em que entrasse em urgência.

E acrescente, logo após a linha `var msgAtual=0;`:

```js
  if(cfg.urg.ativo)j+='  var LIMITE_URGENCIA='+(cfg.urg.lim*60000)+';\n';
  if((cfg.mov==='altfade'||cfg.mov==='altdesliza')&&cfg.msgs.length>1){
    j+='  setInterval(function(){\n';
    j+="    conteudo.classList.add('fcb-saindo');\n";
    j+='    setTimeout(function(){\n';
    j+='      msgAtual++;pintarMensagem();tick();\n';
    j+="      conteudo.classList.remove('fcb-saindo');\n";
    j+='    },400);\n';
    j+='  },'+(cfg.alt*1000)+');\n\n';
  }
  if(cfg.entrada==='deslizar'){
    j+="  setTimeout(function(){raiz.classList.add('fcb-visivel');},80);\n";
  }
  if(cfg.entrada==='aposrolar'){
    j+='  function verRolagem(){\n';
    j+='    var y=window.pageYOffset||document.documentElement.scrollTop;\n';
    j+="    if(y>"+cfg.entradapx+")raiz.classList.add('fcb-visivel');\n";
    j+="    else raiz.classList.remove('fcb-visivel');\n  }\n";
    j+="  window.addEventListener('scroll',verRolagem);\n  verRolagem();\n";
  }
```

Note que a troca de mensagem chama `pintarMensagem()` (que remonta o conteúdo e o trilho) e só então `tick()` (que repõe o relógio). Fora desse momento, o conteúdo nunca é remontado.

- [ ] **Passo 6: Rodar e confirmar que passa**

```js
document.querySelector('input[name="c-mov"][value="rolaesq"]').click();
$$('c-ef-pulsar').checked = true; $$('c-ef-piscar').checked = true;
document.querySelector('input[name="c-urg"][value="sim"]').click();
document.querySelector('input[name="c-entrada"][value="aposrolar"]').click();
$$('c-gerar').click();
var out = V('c-out1');
T('keyframes de rolagem', out.indexOf('@keyframes fcb-rola') >= 0);
T('keyframes de pulsar', out.indexOf('@keyframes fcb-pulsar') >= 0);
T('keyframes de piscar', out.indexOf('@keyframes fcb-piscar') >= 0);
T('reduced motion presente', out.indexOf('prefers-reduced-motion') >= 0);
T('trilho duplicado', (out.match(/fcb-trilho/g) || []).length >= 2);
T('trilho tem os dois clones', out.indexOf("'<span>'+html+'</span><span>'+html+'</span>'") >= 0
  || out.indexOf('<span>\'+html+\'</span><span>\'+html+\'</span>') >= 0);
T('limite de urgencia em ms', out.indexOf('LIMITE_URGENCIA=' + (60*60000)) >= 0);
T('urgencia usa classList.add', out.indexOf("classList.add('fcb-urgente')") >= 0);
T('entrada nao sobrescreve className', out.indexOf("raiz.className='fcb-barra") < 0);
T('entrada por rolagem', out.indexOf('verRolagem') >= 0);
document.querySelector('input[name="c-mov"][value="estatico"]').click();
$$('c-ef-pulsar').checked = false; $$('c-ef-piscar').checked = false;
document.querySelector('input[name="c-urg"][value="nao"]').click();
document.querySelector('input[name="c-entrada"][value="imediata"]').click();
$$('c-gerar').click();
T('sem efeito nao gera keyframes', V('c-out1').indexOf('@keyframes') < 0);
T('sem efeito nao gera reduced-motion', V('c-out1').indexOf('prefers-reduced-motion') < 0);
```

Esperado: 10 × PASS.

- [ ] **Passo 7: Commit**

```bash
git add index.html && git commit -m "feat(contagem): movimento, efeitos e urgencia no codigo gerado"
```

---

### Task 10: Gerador — extras (CTA, fechar, progresso, coruja)

**Arquivos:**
- Modificar: `index.html` — `cCssBase` e `cJsBase` ganham os extras; função nova `cSvgCorujaGer(cfg)`

**Interfaces:**
- Consome: `cCfg()`, o SVG de `svgCorujaStr` como referência de geometria.
- Produz: `cSvgCorujaGer(cfg)` → string com a função `svgCoruja()` já escrita para o código gerado, com corpo e detalhes parametrizados.

- [ ] **Passo 1: Escrever a asserção que falha**

```js
document.querySelector('input[name="c-coruja"][value="sim"]').click();
document.querySelector('input[name="c-cta"][value="sim"]').click();
document.querySelector('input[name="c-fechar"][value="sessao"]').click();
document.querySelector('input[name="c-prog"][value="sim"]').click();
$$('c-gerar').click();
var out = V('c-out1');
T('tem a coruja', out.indexOf('svgCoruja') >= 0);
T('tem o CTA', out.indexOf('fcb-cta') >= 0);
T('tem o fechar', out.indexOf('fcb-fechar') >= 0);
T('tem o progresso', out.indexOf('fcb-prog') >= 0);
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: 4 × FAIL.

- [ ] **Passo 3: Implementar `cSvgCorujaGer`**

Mesma geometria de `svgCorujaStr`, com o branco fixo trocado por parâmetro:

```js
function cSvgCorujaGer(cfg){
  var j='';
  j+='  function svgCoruja(){\n';
  j+="    var corpo='"+cfg.cores.corujaCorpo+"',det='"+cfg.cores.corujaDet+"';\n";
  j+="    return '<svg viewBox=\"0 0 32 38\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\">'+\n";
  j+="      '<ellipse cx=\"16\" cy=\"25\" rx=\"8.5\" ry=\"11\" fill=\"'+corpo+'\"/>'+\n";
  j+="      '<path fill=\"none\" stroke=\"'+det+'\" stroke-width=\"1.2\" d=\"M9 22 Q11 30 14 35 M23 22 Q21 30 18 35\"/>'+\n";
  j+="      '<path fill=\"'+corpo+'\" d=\"M16 3.8 C13.7 1.6 8 2.3 7.6 8 C7.3 12.9 11 18 16 21 C21 18 24.7 12.9 24.4 8 C24 2.3 18.3 1.6 16 3.8 Z\"/>'+\n";
  j+="      '<circle cx=\"12.6\" cy=\"9.6\" r=\"1.6\" fill=\"'+det+'\"/>'+\n";
  j+="      '<circle cx=\"19.4\" cy=\"9.6\" r=\"1.6\" fill=\"'+det+'\"/>'+\n";
  j+="      '<path fill=\"'+det+'\" d=\"M16 11 L15.2 14.4 Q16 15.5 16.8 14.4 Z\"/>'+\n";
  j+="      '<path stroke=\"'+det+'\" stroke-width=\"1.4\" stroke-linecap=\"round\" fill=\"none\" d=\"M13 35.5 L13 37.2 M16 36 L16 37.8 M19 35.5 L19 37.2\"/>'+\n";
  j+="      '</svg>';\n  }\n\n";
  return j;
}
```

- [ ] **Passo 4: CSS dos extras**

Acrescente em `cCssBase`, antes do `s+=cCssEfeitos(cfg);`:

```js
  if(cfg.coruja.ativo){
    s+='.fcb-coruja{flex:0 0 auto;line-height:0}\n';
    s+='.fcb-coruja svg{height:'+cfg.coruja.alt+'px;width:auto;display:block}\n';
    if(cfg.coruja.mob)s+='@media (max-width:'+cfg.mob+'px){.fcb-coruja{display:none}}\n';
  }
  if(cfg.cta.ativo){
    s+='.fcb-cta{flex:0 0 auto;display:inline-block;text-decoration:none;border-radius:999px;'+
       'background:'+cfg.cores.ctaFundo+';color:'+cfg.cores.ctaTexto+';font-weight:700;'+
       'padding:.45em 1.1em;font-size:.92em;white-space:nowrap}\n';
  }
  if(cfg.fechar!=='nao'){
    s+='.fcb-fechar{flex:0 0 auto;border:none;background:none;color:inherit;cursor:pointer;'+
       'font-size:1.15em;line-height:1;padding:4px 6px;opacity:.7}\n';
    s+='.fcb-fechar:hover{opacity:1}\n';
  }
  if(cfg.prog){
    s+='.fcb-prog{position:absolute;left:0;bottom:0;height:3px;width:0;background:'+cfg.cores.prog+';transition:width 1s linear}\n';
  }
```

- [ ] **Passo 5: JS dos extras**

Em `cJsBase`, troque a linha do `raiz.innerHTML` por uma que monte também os extras:

```js
  var interno='<div class="fcb-interno">';
  if(cfg.coruja.ativo)interno+='<div class="fcb-coruja fcb-coruja-e"></div>';
  interno+='<div class="fcb-conteudo"></div>';
  if(cfg.cta.ativo)interno+='<a class="fcb-cta" href="'+escHtml(cfg.cta.url)+'">'+escHtml(cfg.cta.txt)+'</a>';
  if(cfg.coruja.ativo)interno+='<div class="fcb-coruja fcb-coruja-d"></div>';
  if(cfg.fechar!=='nao')interno+='<button type="button" class="fcb-fechar" aria-label="Fechar">\u2715</button>';
  interno+='</div>';
  if(cfg.prog)interno+='<div class="fcb-prog"></div>';
  j+="  raiz.innerHTML='"+esc(interno)+"';\n";
```

Depois de `var conteudo=...`, acrescente:

```js
  if(cfg.coruja.ativo){
    j+=cSvgCorujaGer(cfg);
    j+="  var corujas=raiz.querySelectorAll('.fcb-coruja');\n";
    j+='  for(var ci=0;ci<corujas.length;ci++)corujas[ci].innerHTML=svgCoruja();\n\n';
  }
  if(cfg.fechar!=='nao'){
    j+="  var CHAVE_FECHADA='fcbar:'+CODIGO+':fechada';\n";
    j+=(cfg.fechar==='sessao')
      ? "  function lerFechada(){try{return sessionStorage.getItem(CHAVE_FECHADA);}catch(e){return null;}}\n"+
        "  function marcarFechada(){try{sessionStorage.setItem(CHAVE_FECHADA,'1');}catch(e){}}\n"
      : "  function lerFechada(){return ler(CHAVE_FECHADA);}\n"+
        "  function marcarFechada(){guardar(CHAVE_FECHADA,'1');}\n";
    j+="  if(lerFechada()==='1'){raiz.style.display='none';return;}\n";
    j+="  raiz.querySelector('.fcb-fechar').addEventListener('click',function(){\n";
    j+="    marcarFechada();raiz.style.display='none';liberarEspaco();\n  });\n\n";
  }
  if(cfg.prog){
    j+="  var barraProg=raiz.querySelector('.fcb-prog');\n";
    j+='  function pintarProgresso(restante){\n';
    j+='    var total=alvo-inicio;if(total<=0){barraProg.style.width=\'100%\';return;}\n';
    j+='    var pct=Math.min(100,Math.max(0,(1-(restante/total))*100));\n';
    j+="    barraProg.style.width=pct.toFixed(2)+'%';\n  }\n\n";
  }
```

E dentro de `tick`, após montar o conteúdo:

```js
  if(cfg.prog)j+='    pintarProgresso(restante);\n';
```

**Nota sobre a barra de progresso:** ela exige `position:relative` na `.fcb-barra` no modo fluxo — já está no CSS base. No modo fixo, `position:fixed` também estabelece contexto de posicionamento, então funciona nos dois.

- [ ] **Passo 6: Rodar e confirmar que passa**

```js
document.querySelector('input[name="c-coruja"][value="sim"]').click();
document.querySelector('input[name="c-cta"][value="sim"]').click();
document.querySelector('input[name="c-fechar"][value="sessao"]').click();
document.querySelector('input[name="c-prog"][value="sim"]').click();
$$('c-gerar').click();
var out = V('c-out1');
T('coruja presente', out.indexOf('svgCoruja') >= 0);
T('duas corujas', (out.match(/fcb-coruja fcb-coruja-/g) || []).length === 2);
T('coruja fora do trilho', out.indexOf('fcb-coruja-e"></div><div class="fcb-conteudo"') >= 0);
T('CTA presente', out.indexOf('fcb-cta') >= 0);
T('fechar usa sessionStorage', out.indexOf('sessionStorage') >= 0);
T('progresso presente', out.indexOf('pintarProgresso') >= 0);
T('sem evento inline', !/\son(click|load|change)\s*=/.test(out));
T('sem acento no codigo gerado', !/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(
  out.replace(/MENSAGENS=\[[\s\S]*?\];/, '').replace(/MSG_FINAL='[^']*'/, '').replace(/ROTULOS=\{[^}]*\}/, '')
   .replace(/fcb-cta" href[^>]*>[^<]*/, '').replace(/<!--[\s\S]*?-->/, '')));
document.querySelector('input[name="c-fechar"][value="sempre"]').click();
$$('c-gerar').click();
T('fechar de vez usa localStorage', V('c-out1').indexOf('sessionStorage') < 0);
```

Esperado: 9 × PASS.

- [ ] **Passo 7: Commit**

```bash
git add index.html && git commit -m "feat(contagem): extras - cta, fechar, progresso e coruja"
```

---

### Task 11: Instruções da aba e documentação

**Arquivos:**
- Modificar: `index.html` — bloco `.instrucoes` no fim de `#painel-cnt`
- Modificar: `docs/documentacao-fotocerta.md` — seções 4 e 6
- Modificar: `CLAUDE.md` — inventário e prefixos
- Modificar: `README.md` — tabela de abas

**Interfaces:**
- Nenhuma nova. Fecha a feature.

- [ ] **Passo 1: Escrever a asserção que falha**

```js
T('bloco de instrucoes existe', !!$$('painel-cnt').querySelector('.instrucoes'));
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Esperado: 1 × FAIL.

- [ ] **Passo 3: Adicionar as instruções**

Ao final de `#painel-cnt`, depois da seção 5:

```html
  <div class="instrucoes">
  <h3>Instrução de uso do código gerado</h3>
  <p class="ajuda"><b>Onde colar:</b> o título da saída avisa. Com <b>fixa no topo</b>, o código vai no campo <b>Tag Body</b> da página (substituindo ou somando ao que já estiver lá). Com <b>rola com a página</b>, vai num <b>componente HTML</b> que você posiciona no topo da landing pelo editor. Não há nada para colar na Tag Head.</p>
  <p class="ajuda"><b>Por que fixa exige a Tag Body:</b> componentes HTML do Prosite vivem dentro de um iframe, e um elemento fixo dentro do iframe gruda no iframe, não na página. A Tag Body é o mesmo lugar onde mora o botão flutuante de WhatsApp, que já funciona fixo.</p>
  <p class="ajuda"><b>A contagem não reinicia:</b> na primeira visita o código grava o horário no navegador do visitante, na chave <code>fcbar:SEU-CODIGO</code>, e todas as visitas seguintes contam a partir dali. <b>Trocar o código da campanha zera a contagem de todos</b> — é assim que se recomeça uma promoção.</p>
  <p class="ajuda"><b>Limites que nenhum código resolve:</b> a contagem usa o relógio do aparelho do visitante, então quem estiver com a hora errada vê o tempo errado. O carimbo é por navegador: o mesmo visitante no celular e no computador começa duas contagens; aba anônima recomeça; limpar dados zera. O Safari pode descartar o registro depois de cerca de 7 dias sem visita — irrelevante para campanhas de dois ou três dias, relevante para campanhas de semanas.</p>
  <p class="ajuda"><b>Fuso da data marcada:</b> o instante é gravado com <b>−03:00</b> fixo. Um visitante em outro fuso vê o tempo restante correto para o mesmo momento.</p>
  <p class="ajuda"><b>Depois de publicar:</b> confira em <b>aba anônima</b> (evita cache) que a barra aparece, que o menu do site não ficou escondido atrás dela e que ao recarregar a contagem continua de onde estava. Se o menu sumir, aumente o z-index ou troque para "sobrepor". Teste também no celular, onde a barra costuma quebrar em duas linhas.</p>
  <p class="ajuda"><b>Conversão:</b> prefira a <b>urgência progressiva</b> aos efeitos contínuos. Uma barra que só muda quando o prazo aperta comunica algo; uma que pisca o tempo todo vira ruído e o visitante para de enxergar.</p>
  </div>
```

- [ ] **Passo 4: Atualizar `docs/documentacao-fotocerta.md`**

Na seção 4, trocar "**5 abas**" por "**6 abas**" e acrescentar ao final da lista numerada:

```markdown
6. **Contagem regressiva** — barra de urgência para o topo da landing: contagem a partir da primeira abertura (carimbo em `localStorage`, chave `fcbar:<CODIGO>`) ou até uma data-alvo com fuso −03:00 fixo; formato compacto ou em blocos; movimento (estático, rolagem nos dois sentidos, alternância com fade ou deslize), destaque contínuo (pulsar, brilho passante, degradê animado, separador piscando, tremor), urgência progressiva por limiar, virada dos dígitos e entrada da barra; extras de CTA, botão fechar com memória, barra de progresso e a coruja da identidade nas pontas. O radio "fixa no topo / no fluxo" decide o destino: Tag Body ou componente HTML — nunca a Tag Head, porque o bloco é autocontido.
```

Na seção 6, mover a aba para "publicado e testado" ou "pendente de teste" conforme o estado real após a validação do usuário.

- [ ] **Passo 5: Atualizar `CLAUDE.md`**

Na linha do `index.html` do inventário, trocar "5 abas" por "6 abas" e acrescentar "contagem regressiva" à lista. Em "Padrão de todo código novo", acrescentar `fcb-` à lista de prefixos e `c-` à lista de prefixos de aba.

- [ ] **Passo 6: Atualizar `README.md`**

Acrescentar a linha na tabela de abas:

```markdown
| Contagem regressiva | Barra de urgência para o topo da página, com contador que não reinicia quando o visitante recarrega, efeitos de movimento e destaque, e opção de barra fixa. |
```

- [ ] **Passo 7: Rodar e confirmar que passa**

```js
T('bloco de instrucoes existe', !!$$('painel-cnt').querySelector('.instrucoes'));
T('instrucoes citam Tag Body', $$('painel-cnt').querySelector('.instrucoes').textContent.indexOf('Tag Body') >= 0);
T('instrucoes citam os limites', $$('painel-cnt').querySelector('.instrucoes').textContent.indexOf('relógio') >= 0);
```

Esperado: 3 × PASS.

Confira também no terminal:

```bash
grep -c "6 abas" CLAUDE.md docs/documentacao-fotocerta.md
grep -c "Contagem regressiva" README.md
```

- [ ] **Passo 8: Commit**

```bash
git add index.html docs/documentacao-fotocerta.md CLAUDE.md README.md
git commit -m "docs(contagem): instrucoes da aba e atualizacao da documentacao"
```

---

## Verificação final da feature

Depois da Task 11, rode a bateria completa numa aba recém-recarregada:

```js
// 1. Todas as 6 abas trocam
['slide','leads','tidy','uni','bor','cnt'].forEach(function(n){
  $$('aba-' + n).click();
  T('aba ' + n + ' ativa', $$('painel-' + n).classList.contains('ativo'));
});
// 2. Gera nas duas posicoes
$$('aba-cnt').click();
$$('c-msg').value = 'Termina em {contador}';
$$('c-msgcurta').value = '{contador}';
$$('c-msg-add').click();
$$('c-cod').value = 'FINAL'; $$('c-horas').value = '3';
['c-cod','c-horas'].forEach(function(id){
  $$(id).dispatchEvent(new Event('input',{bubbles:true})); });
['fixa','fluxo'].forEach(function(p){
  document.querySelector('input[name="c-fixa"][value="' + p + '"]').click();
  $$('c-gerar').click();
  var o = V('c-out1');
  T(p + ': gerou', o.length > 500);
  T(p + ': script blindado', o.indexOf('<script>') < 0);
  T(p + ': style blindado', o.indexOf('<style>') < 0);
  T(p + ': sem tag semantica', !/<(section|header|nav|footer|article|aside)[\s>]/.test(o));
  T(p + ': sem evento inline', !/\son(click|load|change)\s*=/.test(o));
  T(p + ': em IIFE', o.indexOf('(function () {') >= 0);
});
// 3. Estado sobrevive ao recarregamento
T('estado gravado', !!JSON.parse(localStorage.getItem('fcConstrutores')).c);
// recarregue a pagina (F5), recole o helper e confirme:
//   $$('aba-cnt').click();
//   T('codigo sobreviveu', V('c-cod') === 'FINAL');
//   T('mensagem sobreviveu', $$('c-msg-lista').children.length >= 1);
```

**Teste manual obrigatório antes de considerar pronto** (feito pelo usuário, conforme a seção 8 do spec):

1. Colar a saída do modo fixo na Tag Body de uma página de teste do Prosite, publicar e conferir em aba anônima: a barra aparece no topo, o menu do site não fica escondido atrás dela, a contagem anda.
2. Recarregar a página: a contagem **continua de onde estava**, não reinicia.
3. Fechar o navegador, reabrir, voltar à página: a contagem continua correta.
4. Deixar zerar (use uma duração de 2 minutos): o comportamento escolhido acontece.
5. Repetir no celular.
6. Colar a saída do modo fluxo num componente HTML e conferir que a barra aparece no lugar certo e rola com a página.
