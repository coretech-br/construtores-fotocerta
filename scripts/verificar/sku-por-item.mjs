/* ============================================================================
   O SKU DE CADA LINHA -- um por produto, um por opcional (14/09/2026)
   ============================================================================
   O DEFEITO QUE ESTA RODADA FECHA, e ele e pior que "faltar": ate aqui TODAS as
   linhas do pedido do PayPal levavam o MESMO 'sku' -- o codigo do pedido. A coluna
   "ID do produto" do relatorio repetia o mesmo texto em toda linha. Nao era ausencia
   de informacao: era informacao que nao distingue nada, com cara de que distingue --
   e por isso ela enganava, em vez de so faltar.

   O QUE PASSOU A EXISTIR, e o que este arquivo mede, uma coisa por vez:
     1. seis campos de SKU (produto/pacote e opcional, nas tres abas com catalogo);
     2. SKU vazio -> a linha sai SEM a chave 'sku'. Nao volta ao codigo do pedido;
     3. 'custom_id' continua sendo o codigo do pedido -- papeis diferentes;
     4. SKU repetido dentro da mesma aba RECUSA gerar, nomeando os DOIS itens;
     5. a regra de caractere e LARGA: apara as pontas e corta em 127, e nada mais;
     6. duplicar leva o SKU DERIVADO ('-COPIA'), para a copia nao nascer recusada;
     7. backup antigo abre com o campo vazio, sem perder nada do que ja tinha.

   A SEGUNDA OPINIAO E O METODO, como em paypal-itens.mjs e em sinal.mjs: este
   arquivo nao chama funcao nenhuma do bloco para conferir o bloco. Ele pede ao
   createOrder do PROPRIO bloco o pedido pronto e refaz por fora a unica conta que
   interessa aqui -- "este SKU e o daquele item?" --, com a limpeza reescrita a mao
   (skuEsperado, abaixo). Se os dois lados limpassem pelo mesmo caminho, o teste nao
   teria opiniao nenhuma.

   POR QUE 'hasOwnProperty' E NAO 'sku === undefined'. A regra 2 diz que a linha sai
   SEM O CAMPO. Um 'sku: undefined' passaria numa comparacao com undefined e viraria
   'null' no JSON que vai ao PayPal -- que e justamente a diferenca entre omitir e
   mandar lixo. A prova cobra a AUSENCIA DA CHAVE.

   A REFERENCIA DA PARTE 7 ESTA PRESA a 66b1cb9 (o commit anterior a esta rodada), e
   NAO pode ser 'main': no dia em que esta rodada for mesclada, o lado "antes" passaria
   a medir a si mesmo e a prova viraria uma tautologia verde. O envelhecimento e
   DETECTADO lendo do index.html da referencia o id 'u-psku' -- se ele ja estiver la, a
   parte 7 diz NAO MEDIU e imprime a linha de comando que mediria de verdade. Nunca
   falha por envelhecer: falha por envelhecimento e vermelho permanente, e vermelho
   permanente esconde o proximo vermelho de verdade.

   PORTAS: faixa 8601-8699, reservada a este arquivo.

   ROTEIRO:  node scripts/verificar/sku-por-item.mjs [ref]     (padrao: 66b1cb9)
   Precisa de Node e Playwright -- ver lib.mjs, que diz o que instalar.
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { navegador, servir, abrir, set, radio, clicar, ler, alertas, zerarAlertas } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || '66b1cb9';

/* ===========================================================================
   O CATALOGO -- alguns itens COM SKU e outros SEM, de proposito
   ===========================================================================
   A mistura e o ponto: um catalogo todo com SKU nunca exercitaria a regra 2, e um
   catalogo todo sem SKU nunca chegaria a emitir o campo. Os tres casos da regra de
   caractere (espacos nas pontas, hifen e ponto, e o corte em 127) moram nos
   opcionais, para atravessarem as tres abas junto com o resto.
   =========================================================================== */
const LIM = 127;                                  /* FC_LIM_PP, da especificacao do PayPal */
const SKU_LONGO = 'LONGO-' + 'x'.repeat(140);     /* 146 caracteres: passa do teto de proposito */

const CAT = [
  {nome:'Ensaio A', preco:'113.70', v:113.70, sku:'ENS-A.01'},
  {nome:'Ensaio B', preco:'29.60',  v:29.60,  sku:''}          /* SEM SKU, de proposito */
];
const OPS = [
  {nome:'Album 20x30', preco:'20.00', v:20.00, qtd:true,  sku:'ALB-20x30.V2'},
  {nome:'Moldura',     preco:'29.60', v:29.60, qtd:false, sku:''},              /* SEM SKU */
  {nome:'Espacado',    preco:'15.00', v:15.00, qtd:false, sku:'   ESP-BORDA   '},
  {nome:'Comprido',    preco:'12.00', v:12.00, qtd:false, sku:SKU_LONGO}
];

/* O TEXTO HOSTIL vai no SKU, e nao no nome (o nome ja tem arnes proprio em
   paypal-itens.mjs). Sao os quatro caracteres que quebram os caminhos de escape desta
   ferramenta: apostrofo, aspas duplas, barra invertida e '</script'. Um escape que
   falte fecha o literal ou o <script> no meio, e o bloco inteiro nao carrega. */
const HOSTIL_SKU_P = 'SKU "A" \\ o\'melhor <\/script> & cia';
const HOSTIL_SKU_O = 'OP \\ "x" <\/script> o\'outro';

const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};

/* A LIMPEZA, REESCRITA A MAO -- a segunda opiniao sobre fcSkuLimpo. Apara as pontas e
   corta em 127, e nada mais: nada e filtrado, hifen e ponto continuam inteiros. */
const skuEsperado = s => String(s == null ? '' : s).replace(/^\s+|\s+$/g, '').substring(0, LIM);

/* ===========================================================================
   A SONDA DO SDK e a leitura do pedido -- moldes de paypal-itens.mjs
   =========================================================================== */
const CABECA = '<scr'+'ipt>(function(){\n'
  + 'var ins=document.head.appendChild;\n'
  + 'document.head.appendChild=function(n){\n'
  + '  if(n&&n.tagName==="SCRIPT"&&/paypal\\.com/.test(String(n.src||""))){\n'
  + '    window.paypal={Buttons:function(bt){window.__pp=bt;return {render:function(){}};}};\n'
  + '    setTimeout(function(){if(n.onload)n.onload();},0);\n'
  + '    return n;\n'
  + '  }\n'
  + '  return ins.call(document.head,n);\n'
  + '};\n'
  + 'window.__alertas=[];window.alert=function(m){window.__alertas.push(String(m));};\n'
  + 'window.open=function(){return null;};\n'
  + '})();</scr'+'ipt>';
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|alboom\.ninja|storage\.|ERR_FAILED|Failed to load resource|net::ERR/i;
const errosReais = e => (e || []).filter(x => !EXTERNO.test(x));

/* O pedido, lido do createOrder do PROPRIO bloco -- nunca remontado aqui. A leitura
   devolve, para cada item, se a CHAVE 'sku' existe e qual e o valor dela: as duas
   coisas separadas, porque "sem a chave" e "com a chave valendo undefined" sao
   respostas diferentes e so uma delas esta certa. */
const pedidoDoBloco = pg => pg.evaluate(() => {
  if(!window.__pp || !window.__pp.createOrder) return {erro:'sem createOrder'};
  let pu;
  try{ pu = window.__pp.createOrder(null, {order:{create:x=>x}}).purchase_units[0]; }
  catch(e){ return {erro:String(e && e.message || e)}; }
  return {
    custom_id: pu.custom_id,
    itens: (pu.items || []).map(it => ({
      nome: String(it.name),
      temSku: Object.prototype.hasOwnProperty.call(it, 'sku'),
      sku: it.sku,
      qtd: String(it.quantity),
      unit: String((it.unit_amount || {}).value)
    }))
  };
});

/* ===========================================================================
   O CADASTRO EM CADA ABA -- uma fonte so para todas as partes deste arquivo
   ===========================================================================
   'cat' e 'ops' entram como parametro para a parte 8 (texto hostil) reusar
   exatamente o mesmo roteiro trocando so os SKUs: cadastro escrito duas vezes e a
   duplicacao que esta ferramenta ja nomeou -- as duas copias concordam hoje e
   divergem amanha, sem erro e sem aviso.
   =========================================================================== */
async function identidade(pg){
  for(const [k,v] of Object.entries(IDENT)) await set(pg, 'fci-'+k, v);
}
async function cadastrarCheckout(pg, cat, ops){
  await clicar(pg, 'aba-uni');
  for(let i=0;i<cat.length;i++){
    await set(pg,'u-pnome',cat[i].nome);
    await set(pg,'u-ppreco',cat[i].preco);
    await set(pg,'u-psku',cat[i].sku);
    await radio(pg,'u-pqtd','nao');
    if(i===0){
      for(const op of ops){
        await set(pg,'u-op-nome',op.nome); await set(pg,'u-op-preco',op.preco);
        await set(pg,'u-op-qtd',!!op.qtd); await set(pg,'u-op-sku',op.sku);
        await clicar(pg,'u-op-add');
      }
      await radio(pg,'u-opsel','multiplo');
    }
    await clicar(pg,'u-prod-salvar');
  }
  await radio(pg,'u-selprod','multiplo');
}
async function cadastrarLoja(pg, cat, ops){
  await clicar(pg, 'aba-loja');
  for(let i=0;i<cat.length;i++){
    await set(pg,'m-pnome',cat[i].nome);
    await set(pg,'m-ppreco',cat[i].preco);
    await set(pg,'m-psku',cat[i].sku);
    await set(pg,'m-pcat','Ensaios');
    await set(pg,'m-pimg','https://storage.alboom.ninja/e'+i+'.jpg');
    await radio(pg,'m-pqtd','nao');
    if(i===0){
      for(const op of ops){
        await set(pg,'m-op-nome',op.nome); await set(pg,'m-op-preco',op.preco);
        await set(pg,'m-op-qtd',!!op.qtd); await set(pg,'m-op-sku',op.sku);
        await clicar(pg,'m-op-add');
      }
      await radio(pg,'m-opsel','multiplo');
    }
    await clicar(pg,'m-prod-salvar');
  }
}
/* Na pagina de obrigado o item de catalogo e o PACOTE, e a pagina mostra UM de cada
   vez (o que o endereco pedir em '?pac='). O segundo pacote existe para a parte 4 ter
   dois itens em que repetir um SKU; nas partes 1 a 3 ele nao chega ao pedido. */
async function cadastrarPac(pg, cat, ops){
  await clicar(pg,'aba-pac');
  await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
  await set(pg,'a-prefixo','FC');
  await radio(pg,'a-metodo','ambos');
  /* CARTAO PRIORITARIO: com o Pix em cima o numero grande da pagina seria o preco com o
     desconto do Pix. Aqui nada se le da tela, mas a configuracao fica igual a de
     paypal-itens.mjs de proposito -- duas abas medindo o mesmo bloco em configuracoes
     diferentes escondem qual das duas mudou quando uma delas passa a falhar. */
  await radio(pg,'a-prio','pp');
  for(let i=0;i<cat.length;i++){
    await set(pg,'a-pcod', i===0 ? 'ENS' : ('ENS'+i));
    await set(pg,'a-pnome',cat[i].nome);
    await set(pg,'a-pdur','2 horas');
    await set(pg,'a-ppreco',cat[i].preco);
    await set(pg,'a-psku',cat[i].sku);
    await set(pg,'a-pinclui','20 fotos');
    await set(pg,'a-ppath','https://tidycal.com/fotocerta/ens'+i);
    if(i===0){
      for(const op of ops){
        await set(pg,'a-op-nome',op.nome); await set(pg,'a-op-preco',op.preco);
        await set(pg,'a-op-qtd',!!op.qtd); await set(pg,'a-op-sku',op.sku);
        await clicar(pg,'a-op-add');
      }
    }
    await clicar(pg,'a-pac-salvar');
  }
}

/* ===========================================================================
   COMO SE MONTA O CARRINHO -- molde de paypal-itens.mjs
   ===========================================================================
   Clica sempre no LABEL, nunca no input: o marcador de selecao e DESENHADO (Manual do
   Prosite), e o input nativo por baixo pode nem estar no caminho que o dedo do cliente
   percorre.
   =========================================================================== */
async function qtdPor(pg, caixa, pref, alvo){
  if(await pg.locator(caixa).count() === 0) return;
  const cx = pg.locator(caixa).first();
  for(let k=0;k<40;k++){
    const v = parseInt(await cx.locator('.'+pref+'-qtd-v').first().textContent(), 10);
    if(!(v>0)) break;
    await cx.locator('button').first().click();
  }
  for(let k=0;k<alvo;k++) await cx.locator('button').last().click();
}
async function carrinhoCheckout(pg, caso){
  for(let i=0;i<CAT.length;i++){
    const sel = 'input[name="fcu-prod"][value="'+i+'"]';
    if(await pg.locator(sel).count() === 0) continue;
    const marcado = await pg.$eval(sel, el => el.checked);
    const quer = (caso.itens||[]).indexOf(i) >= 0;
    if(marcado !== quer) await pg.click('label:has('+sel+')');
  }
  await pg.waitForTimeout(60);
  for(let j=0;j<OPS.length;j++){
    const sel = 'input[name="fcu-op-0"][value="'+j+'"]';
    if(await pg.locator(sel).count() === 0) continue;
    const marcado = await pg.$eval(sel, el => el.checked);
    const quer = (caso.ops||[]).indexOf(j) >= 0;
    if(marcado !== quer) await pg.click('label:has('+sel+')');
  }
  await pg.waitForTimeout(60);
  await qtdPor(pg, '.fcu-op .fcu-qtd', 'fcu', 1);
  await pg.waitForTimeout(60);
}
async function carrinhoLoja(pg, caso){
  for(let g=0; g<40; g++){
    const n = await pg.locator('.fcm-item .fcm-tirar').count();
    if(!n) break;
    await pg.locator('.fcm-item .fcm-tirar').first().click();
    await pg.waitForTimeout(20);
  }
  for(const i of (caso.itens||[])){
    /* o cartao e achado pelo NOME, nunca por posicao: medir o cartao errado diria "o SKU
       esta errado" sobre um pedido que nunca existiu */
    await pg.locator('.fcm-card', {hasText: CAT[i].nome}).first().click();
    await pg.waitForTimeout(90);
    if(i===0){
      for(let j=0;j<OPS.length;j++){
        const sel = '.fcm-detalhe input[name="fcm-op"][value="'+j+'"]';
        if(await pg.locator(sel).count() === 0) continue;
        const quer = (caso.ops||[]).indexOf(j) >= 0;
        const marcado = await pg.$eval(sel, el => el.checked);
        if(marcado !== quer) await pg.locator('.fcm-detalhe .fcm-op').nth(j).locator('label').first().click();
      }
      await pg.waitForTimeout(60);
      await qtdPor(pg, '.fcm-detalhe .fcm-op .fcm-qtd', 'fcm', 1);
    }
    await pg.waitForTimeout(60);
    await pg.click('.fcm-add');
    await pg.waitForTimeout(90);
  }
}
async function carrinhoPac(pg, caso){
  const n = await pg.locator('.fca-ob-op input[type="checkbox"]').count();
  for(let j=0;j<n;j++){
    const marcado = await pg.locator('.fca-ob-op input[type="checkbox"]').nth(j).evaluate(e=>e.checked);
    const quer = (caso.ops||[]).indexOf(j) >= 0;
    if(marcado !== quer) await pg.locator('.fca-ob-op').nth(j).locator('label').first().click();
  }
  await pg.waitForTimeout(60);
  await qtdPor(pg, '.fca-ob-op .fca-ob-qtd', 'fca-ob', 1);
  await pg.waitForTimeout(60);
}

/* Clica um botao da linha `i` de uma lista, escolhido pelo TITULO -- e nao por
   posicao, que mediria o botao errado sem falhar se a faixa mudar de ordem.
   (molde: duplicar-itens.mjs) */
const botaoDaLinha = (pg, lista, titulo, i) => pg.evaluate(([lista, titulo, i]) => {
  const bs = document.querySelectorAll('#' + lista + ' button[title="' + titulo + '"]');
  if(!bs[i]) throw new Error('sem botao "' + titulo + '" na linha ' + i + ' de ' + lista);
  bs[i].click();
  return true;
}, [lista, titulo, i]);

/* O que os campos de SKU da LISTA de opcionais mostram, na ordem da lista. */
const skusDaLista = (pg, lista) => pg.evaluate(id => Array.prototype.map.call(
  document.querySelectorAll('#'+id+' li input[placeholder="SKU (opcional)"]'), e => e.value), lista);

/* ===========================================================================
   PARTES 1, 2 e 3 -- cada linha leva O SEU SKU
   =========================================================================== */
console.log('\n=== gerando os tres blocos do catalogo misto ===');
const blocos = {};
{
  const r = await gerarNaFerramenta(async pg => {
    await identidade(pg);
    await cadastrarCheckout(pg, CAT, OPS);
    await clicar(pg,'u-gerar');
    await cadastrarLoja(pg, CAT, OPS);
    await clicar(pg,'m-gerar');
  }, ['u-out','m-out'], {porta: 8601});
  chk('[gerar] Checkout e Mini loja saem sem alerta', r.alertas.length===0, JSON.stringify(r.alertas));
  chk('[gerar] e sem erro de console', r.erros.length===0, r.erros.slice(0,2).join(' | '));
  blocos['u-out'] = r.valores['u-out'] || '';
  blocos['m-out'] = r.valores['m-out'] || '';

  const rp = await gerarNaFerramenta(async pg => {
    await identidade(pg);
    await cadastrarPac(pg, CAT, OPS);
    await clicar(pg,'a-gerar');
  }, ['a-out3'], {porta: 8602});
  chk('[gerar] a pagina de obrigado sai sem alerta', rp.alertas.length===0, JSON.stringify(rp.alertas));
  chk('[gerar] e sem erro de console', rp.erros.length===0, rp.erros.slice(0,2).join(' | '));
  blocos['a-out3'] = rp.valores['a-out3'] || '';
}

/* A lista que o TESTE espera, do ponto de vista do cliente: [{nome, sku}] na mesma
   ordem em que itensEscolhidos() monta (o item de catalogo e depois os opcionais). */
function esperadosDe(caso, itensCat){
  const L = [];
  for(const i of (caso.itens||[])) L.push({nome: itensCat[i].nome, sku: itensCat[i].sku});
  for(const j of (caso.ops||[]))   L.push({nome: OPS[j].nome,      sku: OPS[j].sku});
  return L;
}
/* A prova comum das partes 1, 2 e 3. */
function provarSkus(rot, leitura, esperados){
  if(leitura.erro){ chk(rot+'o bloco montou o pedido', false, leitura.erro); return; }
  const its = leitura.itens;
  chk(rot+'1. o pedido tem uma linha por item escolhido',
      its.length === esperados.length,
      'mandou '+its.length+' ['+its.map(i=>i.nome).join(' | ')+'], esperava '+esperados.length);

  for(const e of esperados){
    const it = its.filter(x => x.nome === e.nome)[0];
    if(!it){ chk(rot+'1. a linha de "'+e.nome+'" existe', false, its.map(i=>i.nome).join(' | ')); continue; }
    const quer = skuEsperado(e.sku);
    if(quer){
      chk(rot+'1. "'+e.nome+'" leva O SEU SKU',
          it.temSku && it.sku === quer,
          'sku '+JSON.stringify(it.sku)+', esperava '+JSON.stringify(quer));
    }else{
      /* A AUSENCIA DA CHAVE, e nao 'undefined': ver o cabecalho deste arquivo. */
      chk(rot+'2. "'+e.nome+'" nao tem SKU cadastrado -> a linha sai SEM a chave',
          it.temSku === false,
          'hasOwnProperty(sku)='+it.temSku+' valor '+JSON.stringify(it.sku));
    }
  }
  /* Nenhuma linha leva o codigo do pedido. Nenhum SKU deste catalogo e igual ao
     custom_id (que e sorteado), entao qualquer igualdade aqui seria o fallback antigo
     voltando. */
  chk(rot+'2. custom_id existe e e o codigo do pedido', !!leitura.custom_id,
      JSON.stringify(leitura.custom_id));
  chk(rot+'2. NENHUMA linha leva o codigo do pedido no sku',
      its.every(it => it.sku !== leitura.custom_id),
      'custom_id '+leitura.custom_id+' skus ['+its.map(i=>String(i.sku)).join(' | ')+']');
}
/* A parte 3, medida nas linhas que tem os tres casos de caractere. */
function provarCaracteres(rot, leitura){
  if(leitura.erro) return;
  const por = n => leitura.itens.filter(x => x.nome === n)[0] || {};
  chk(rot+'3. o SKU cadastrado com espacos nas pontas chega APARADO',
      por('Espacado').sku === 'ESP-BORDA', JSON.stringify(por('Espacado').sku));
  chk(rot+'3. o SKU com hifen e ponto chega INTEIRO (a regra nao e a do txid)',
      por('Album 20x30').sku === 'ALB-20x30.V2', JSON.stringify(por('Album 20x30').sku));
  const c = por('Comprido').sku;
  chk(rot+'3. o SKU de '+SKU_LONGO.length+' caracteres chega cortado em '+LIM,
      typeof c === 'string' && c.length === LIM && c === SKU_LONGO.substring(0, LIM),
      'saiu com '+(c==null?'nada':c.length)+' caracteres');
}

const CASO = {itens:[0,1], ops:[0,1,2,3]};
for(const aba of [
  {nome:'Checkout',  bloco:blocos['u-out'],  porta:8611, carrinho:carrinhoCheckout, busca:'', cat:CAT},
  {nome:'Mini loja', bloco:blocos['m-out'],  porta:8612, carrinho:carrinhoLoja,     busca:'', cat:CAT}
]){
  console.log('\n=== ['+aba.nome+'] cada linha leva o seu SKU ===');
  const r = await comBlocoNaPagina({
    bloco: aba.bloco, cabeca: CABECA, porta: aba.porta, busca: aba.busca,
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(250);
      await aba.carrinho(pg, CASO);
      return {leitura: await pedidoDoBloco(pg), fim: await pg.$('#fim-do-documento') !== null};
    }
  });
  chk('['+aba.nome+'] o documento nao foi engolido pelo bloco', r.fim);
  chk('['+aba.nome+'] sem erro de console proprio do bloco',
      errosReais(r.erros).length===0, (r.erros||[]).slice(0,2).join(' | '));
  provarSkus('['+aba.nome+'] ', r.leitura, esperadosDe(CASO, aba.cat));
  provarCaracteres('['+aba.nome+'] ', r.leitura);
}
{
  console.log('\n=== [Pagina de obrigado] cada linha leva o seu SKU ===');
  const casoPac = {itens:[0], ops:[0,1,2,3]};
  const r = await comBlocoNaPagina({
    bloco: blocos['a-out3'], cabeca: CABECA, porta: 8613, busca: '?pac=ENS',
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(350);
      await carrinhoPac(pg, casoPac);
      return {leitura: await pedidoDoBloco(pg), fim: await pg.$('#fim-do-documento') !== null};
    }
  });
  chk('[pac] o documento nao foi engolido pelo bloco', r.fim);
  chk('[pac] sem erro de console proprio do bloco',
      errosReais(r.erros).length===0, (r.erros||[]).slice(0,2).join(' | '));
  provarSkus('[pac] ', r.leitura, esperadosDe(casoPac, CAT));
  provarCaracteres('[pac] ', r.leitura);
}

/* ===========================================================================
   PARTE 4 -- SKU repetido RECUSA, nos dois sentidos
   ===========================================================================
   NAO BASTA "houve alerta": a saida tem de FICAR COMO ESTAVA. Recusa que alerta e
   grava mesmo assim e pior que nenhuma recusa -- o operador le o aviso, fecha, e cola
   um bloco que ele acredita ter sido barrado. Por isso cada caso gera ANTES com SKUs
   distintos, guarda a saida, e depois compara.
   E a comparacao de caixa ('ALB20' contra 'alb20') esta aqui como caso POSITIVO: a
   comparacao e LITERAL de proposito (o sku chega ao relatorio byte a byte, ao
   contrario do codigo do pacote, que o Pix normaliza), e uma recusa ali seria a
   ferramenta inventando uma colisao que nao existe.
   =========================================================================== */
const ASPA_E = '“', ASPA_D = '”';
function provarRecusa(rot, msg, quemA, quemB, sku){
  chk(rot+'a mensagem comeca nomeando o SKU repetido',
      msg.indexOf('O SKU "'+sku+'" está em dois itens:') === 0, JSON.stringify(msg.slice(0,90)));
  chk(rot+'e nomeia os DOIS itens ('+quemA+' / '+quemB+')',
      msg.indexOf(quemA) > 0 && msg.indexOf(quemB) > 0, JSON.stringify(msg.slice(0,220)));
}

/* Uma passagem por aba. Cada `cfg` diz como cadastrar, como editar e onde esta a saida. */
async function bateriaRecusa(cfg){
  console.log('\n=== ['+cfg.nome+'] SKU repetido recusa ===');
  const rot = '['+cfg.nome+'] ';
  const fora = {};
  await gerarNaFerramenta(async pg => {
    await identidade(pg);
    await cfg.cadastrar(pg);

    /* --- distintos: gera, e sem alerta nenhum --- */
    await zerarAlertas(pg);
    await clicar(pg, cfg.gerar);
    await pg.waitForTimeout(120);
    fora.alertaDistinto = await alertas(pg);
    fora.saidaBoa = await ler(pg, cfg.saida);

    /* --- dois itens de catalogo com o MESMO SKU --- */
    await cfg.trocarSkuDoSegundo(pg, 'DUP-1');
    await zerarAlertas(pg);
    await clicar(pg, cfg.gerar);
    await pg.waitForTimeout(120);
    fora.alertaItens = await alertas(pg);
    fora.saidaAposItens = await ler(pg, cfg.saida);

    /* --- so a CAIXA difere: tem de gerar --- */
    await cfg.trocarSkuDoSegundo(pg, 'dup-1');
    await zerarAlertas(pg);
    await clicar(pg, cfg.gerar);
    await pg.waitForTimeout(120);
    fora.alertaCaixa = await alertas(pg);
    fora.saidaCaixa = await ler(pg, cfg.saida);

    /* --- um item de catalogo e um OPCIONAL com o mesmo SKU --- */
    await cfg.trocarSkuDoSegundo(pg, '');
    await cfg.opcionalColidindo(pg, 'DUP-1');
    await zerarAlertas(pg);
    await clicar(pg, cfg.gerar);
    await pg.waitForTimeout(120);
    fora.alertaOp = await alertas(pg);
    fora.saidaAposOp = await ler(pg, cfg.saida);
  }, [], {porta: cfg.porta});

  chk(rot+'SKUs todos distintos: gera SEM alerta nenhum',
      fora.alertaDistinto.length===0, JSON.stringify(fora.alertaDistinto));
  chk(rot+'e a saida foi escrita', String(fora.saidaBoa||'').length > 1000,
      'saiu com '+String(fora.saidaBoa||'').length+' caracteres');

  chk(rot+'dois '+cfg.plural+' com o mesmo SKU: RECUSA com alerta',
      fora.alertaItens.length===1, JSON.stringify(fora.alertaItens));
  if(fora.alertaItens.length) provarRecusa(rot+'itens: ', fora.alertaItens[0],
      'o '+cfg.singular+' '+ASPA_E+CAT[0].nome+ASPA_D,
      'o '+cfg.singular+' '+ASPA_E+CAT[1].nome+ASPA_D, 'DUP-1');
  chk(rot+'e a caixa de saida NAO mudou', fora.saidaAposItens === fora.saidaBoa,
      'antes '+String(fora.saidaBoa||'').length+' depois '+String(fora.saidaAposItens||'').length);

  chk(rot+'"DUP-1" e "dup-1" (so a caixa difere): GERA, sem alerta',
      fora.alertaCaixa.length===0, JSON.stringify(fora.alertaCaixa));
  chk(rot+'e a saida mudou (prova que ela foi mesmo regerada)',
      fora.saidaCaixa !== fora.saidaBoa && String(fora.saidaCaixa||'').length > 1000);

  chk(rot+'um '+cfg.singular+' e um opcional com o mesmo SKU: RECUSA com alerta',
      fora.alertaOp.length===1, JSON.stringify(fora.alertaOp));
  if(fora.alertaOp.length) provarRecusa(rot+'item x opcional: ', fora.alertaOp[0],
      'o '+cfg.singular+' '+ASPA_E+CAT[0].nome+ASPA_D,
      'o opcional '+ASPA_E+'Moldura'+ASPA_D+' de '+ASPA_E+CAT[0].nome+ASPA_D, 'DUP-1');
  chk(rot+'e a caixa de saida NAO mudou', fora.saidaAposOp === fora.saidaCaixa,
      'mudou de '+String(fora.saidaCaixa||'').length+' para '+String(fora.saidaAposOp||'').length);
}

/* Os dois SKUs de partida da parte 4: o primeiro item fica com 'DUP-1' e o segundo com
   'OUTRO'. A colisao e criada depois, trocando o segundo. */
const CAT_R = [
  {nome:CAT[0].nome, preco:CAT[0].preco, sku:'DUP-1'},
  {nome:CAT[1].nome, preco:CAT[1].preco, sku:'OUTRO'}
];

await bateriaRecusa({
  nome:'Checkout', porta:8621, gerar:'u-gerar', saida:'u-out',
  singular:'produto', plural:'produtos',
  cadastrar: pg => cadastrarCheckout(pg, CAT_R, []),
  trocarSkuDoSegundo: async (pg, sku) => {
    await botaoDaLinha(pg, 'u-prod-lista', 'Editar', 1);
    await set(pg, 'u-psku', sku);
    await clicar(pg, 'u-prod-salvar');
  },
  opcionalColidindo: async (pg, sku) => {
    await botaoDaLinha(pg, 'u-prod-lista', 'Editar', 0);
    await set(pg,'u-op-nome','Moldura'); await set(pg,'u-op-preco','29.60');
    await set(pg,'u-op-sku',sku); await clicar(pg,'u-op-add');
    await clicar(pg,'u-prod-salvar');
  }
});
await bateriaRecusa({
  nome:'Mini loja', porta:8622, gerar:'m-gerar', saida:'m-out',
  singular:'produto', plural:'produtos',
  cadastrar: pg => cadastrarLoja(pg, CAT_R, []),
  trocarSkuDoSegundo: async (pg, sku) => {
    await botaoDaLinha(pg, 'm-prod-lista', 'Editar', 1);
    await set(pg, 'm-psku', sku);
    await clicar(pg, 'm-prod-salvar');
  },
  opcionalColidindo: async (pg, sku) => {
    await botaoDaLinha(pg, 'm-prod-lista', 'Editar', 0);
    await set(pg,'m-op-nome','Moldura'); await set(pg,'m-op-preco','29.60');
    await set(pg,'m-op-sku',sku); await clicar(pg,'m-op-add');
    await clicar(pg,'m-prod-salvar');
  }
});
await bateriaRecusa({
  nome:'Pagina de obrigado', porta:8623, gerar:'a-gerar', saida:'a-out3',
  singular:'pacote', plural:'pacotes',
  cadastrar: pg => cadastrarPac(pg, CAT_R, []),
  trocarSkuDoSegundo: async (pg, sku) => {
    await botaoDaLinha(pg, 'a-pac-lista', 'Editar', 1);
    await set(pg, 'a-psku', sku);
    await clicar(pg, 'a-pac-salvar');
  },
  opcionalColidindo: async (pg, sku) => {
    await botaoDaLinha(pg, 'a-pac-lista', 'Editar', 0);
    await set(pg,'a-op-nome','Moldura'); await set(pg,'a-op-preco','29.60');
    await set(pg,'a-op-sku',sku); await clicar(pg,'a-op-add');
    await clicar(pg,'a-pac-salvar');
  }
});

/* ===========================================================================
   PARTE 5 -- a PREVIA mostra o SKU por linha, e bate com o createOrder
   ===========================================================================
   Molde: paypal-previa.mjs. Dois caminhos independentes para o MESMO bloco:
     lado A  a previa da ferramenta, com o bloco rodando dentro do iframe, e o quadro
             LIDO DA TELA -- exatamente o que o dono enxerga;
     lado B  o MESMO bloco (byte a byte) executado no molde comum, com o createOrder
             chamado direto.
   A linha de item ganhou uma QUARTA celula (o sku), e a explicacao que dizia "igual em
   todas as linhas" tinha de sumir junto: ela era honesta sobre o defeito antigo, e
   mante-la seria a previa descrevendo um comportamento que nao existe mais.
   =========================================================================== */
function lerQuadro(escopo, caixaId){
  return escopo.evaluate(id => {
    const cx = document.getElementById(id);
    if(!cx) return {faltou:'o quadro '+id+' nao existe'};
    const linhas = [];
    cx.querySelectorAll('div').forEach(d => {
      const filhos = Array.prototype.slice.call(d.children);
      if(!filhos.length) return;
      if(filhos.some(f => f.children.length)) return;      /* so as folhas */
      linhas.push(filhos.map(f => f.textContent.trim()));
    });
    return {linhas, texto: cx.textContent};
  }, caixaId);
}
/* Do quadro lido: a lista de itens (as linhas de QUATRO celulas, tirando o cabecalho) e
   os campos de valor (as de DUAS). */
function interpretar(q){
  const itens = [], campos = {};
  let cabecalho = null;
  for(const l of (q.linhas||[])){
    if(l.length === 4){
      if(l[0] === 'items[].name'){ cabecalho = l; continue; }
      itens.push({nome:l[0], sku:l[1], qtd:l[2], unit:l[3]});
    }else if(l.length === 2){
      campos[l[0]] = l[1];
    }
  }
  return {itens, campos, cabecalho, texto:q.texto||''};
}
/* O mesmo pedido, visto do lado B, escrito nas MESMAS palavras que a previa usa na
   tela -- escrito AQUI, e nao lido de nenhuma funcao compartilhada com a previa. */
function comoATelaEscreveria(p){
  const campos = {
    'amount.breakdown.item_total': p.itemTotal,
    'amount.value':                p.amount,
    'description':                 p.description,
    'custom_id':                   p.custom_id
  };
  if(p.discount) campos['amount.breakdown.discount'] = '- '+p.discount;
  return {
    itens: p.itens.map(it => ({nome:it.nome, sku:(it.temSku?String(it.sku):'—'),
                               qtd:it.qtd, unit:it.unit})),
    campos
  };
}
/* O lado B precisa de mais campos que pedidoDoBloco devolve, entao le o seu proprio. */
const pedidoRico = pg => pg.evaluate(() => {
  if(!window.__pp || !window.__pp.createOrder) return {erro:'sem createOrder'};
  let pu;
  try{ pu = window.__pp.createOrder(null, {order:{create:x=>x}}).purchase_units[0]; }
  catch(e){ return {erro:String(e && e.message || e)}; }
  const din = o => o ? (String(o.value)+' '+String(o.currency_code)) : null;
  const br = (pu.amount||{}).breakdown || {};
  return {
    custom_id: pu.custom_id, description: pu.description,
    itemTotal: din(br.item_total), discount: br.discount ? din(br.discount) : null,
    amount: din(pu.amount),
    itens: (pu.items||[]).map(it => ({
      nome:String(it.name),
      temSku: Object.prototype.hasOwnProperty.call(it,'sku'),
      sku: it.sku, qtd:String(it.quantity), unit: din(it.unit_amount)
    }))
  };
});
/* Marca (ou desmarca) uma caixa DENTRO de um frame, clicando no LABEL e so quando o
   estado precisa mudar -- clicar sempre inverteria o que ja estava certo. */
async function marcarNo(frame, seletor, ligado){
  const el = await frame.$(seletor);
  if(!el) return;
  if(await el.evaluate(e => e.checked) === ligado) return;
  await frame.click('label:has('+seletor+')');
}
/* O CARRINHO DA PARTE 5 e o mesmo dos dois lados, e monta-lo e um gesto so: o produto 0
   (COM sku) mais dois opcionais -- o primeiro COM sku e o segundo SEM. E o minimo que faz
   o traco aparecer ao lado de um sku de verdade, que e a diferenca que a previa passou a
   ter de mostrar. Os dois lados o repetem em linha porque o lado A mexe num FRAME e o lado
   B numa PAGINA, e as esperas de cada um sao diferentes. */

console.log('\n=== [Previa] o quadro do PayPal mostra o SKU de cada linha ===');
{
  const srv = await servir(RAIZ, 8631);
  const br = await navegador();
  let saida = '', tela = null;
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8631');
    await identidade(pg);
    await cadastrarCheckout(pg, CAT, [OPS[0], OPS[1]]);
    await clicar(pg,'u-gerar');
    saida = (await ler(pg,'u-out')) || '';
    chk('[Previa] a ferramenta gerou o bloco', saida.length > 1000);

    await pg.waitForTimeout(900);
    let alvo = null;
    for(const f of pg.frames()){ if(f !== pg.mainFrame() && await f.$('.fcuni')){ alvo = f; break; } }
    chk('[Previa] a previa desenhou o bloco dentro do iframe', !!alvo);
    if(alvo){
      await marcarNo(alvo, 'input[name="fcu-prod"][value="0"]', true);
      await pg.waitForTimeout(250);
      await marcarNo(alvo, 'input[name="fcu-op-0"][value="0"]', true);
      await pg.waitForTimeout(200);
      await marcarNo(alvo, 'input[name="fcu-op-0"][value="1"]', true);
      await pg.waitForTimeout(350);
      chk('[Previa] o quadro do PayPal existe dentro da previa', !!(await alvo.$('#u-pv-pp')));
      tela = interpretar(await lerQuadro(alvo, 'u-pv-pp'));
    }
    await pg.close();
  } finally { await br.close(); srv.close(); }

  if(tela){
    chk('[Previa] o cabecalho da tabela tem as QUATRO colunas, com o sku no lugar novo',
        JSON.stringify(tela.cabecalho) ===
        JSON.stringify(['items[].name','items[].sku','quantity','unit_amount']),
        JSON.stringify(tela.cabecalho));
    /* A frase antiga descrevia o defeito. Ela nao pode ter sobrevivido a correcao. */
    chk('[Previa] a explicacao em cinza NAO diz mais "igual em todas as linhas"',
        !/igual em todas as linhas/.test(tela.texto), tela.texto.slice(0,160));
    chk('[Previa] e ela explica que o sku e o DAQUELE item',
        /um por produto e um por opcional/.test(tela.texto));
    const semSku = tela.itens.filter(i => i.sku === '—');
    chk('[Previa] o item sem SKU aparece como o traco (e nao em branco)',
        semSku.length === 1 && semSku[0].nome === 'Moldura',
        JSON.stringify(tela.itens));
  }

  const b = await comBlocoNaPagina({
    bloco: saida, cabeca: CABECA, porta: 8632,
    medir: async pg => {
      await pg.waitForTimeout(250);
      await marcarNo(pg, 'input[name="fcu-prod"][value="0"]', true);
      await pg.waitForTimeout(150);
      await marcarNo(pg, 'input[name="fcu-op-0"][value="0"]', true);
      await pg.waitForTimeout(150);
      await marcarNo(pg, 'input[name="fcu-op-0"][value="1"]', true);
      await pg.waitForTimeout(150);
      return {ped: await pedidoRico(pg)};
    }
  });
  chk('[Previa] o bloco montou o pedido no lado B', !b.ped.erro, b.ped.erro);
  if(tela && !b.ped.erro){
    const pedido = comoATelaEscreveria(b.ped);
    chk('[Previa] a previa mostra o MESMO numero de itens que o pedido tem',
        tela.itens.length === pedido.itens.length,
        'previa '+tela.itens.length+' x pedido '+pedido.itens.length);
    const n = Math.min(tela.itens.length, pedido.itens.length);
    for(let z=0;z<n;z++){
      const a = tela.itens[z], c = pedido.itens[z];
      chk('[Previa] item '+(z+1)+': nome, SKU, quantidade e unit_amount iguais aos do pedido',
          a.nome===c.nome && a.sku===c.sku && a.qtd===c.qtd && a.unit===c.unit,
          'previa '+JSON.stringify(a)+' x pedido '+JSON.stringify(c));
    }
    for(const k of Object.keys(pedido.campos)){
      const esperado = pedido.campos[k];
      if(esperado == null) continue;
      chk('[Previa] campo "'+k+'" iguais', tela.campos[k] === String(esperado),
          'previa '+JSON.stringify(tela.campos[k])+' x pedido '+JSON.stringify(String(esperado)));
    }
    /* E o contrario: a previa nao pode ter ficado com uma linha "items[].sku" entre os
       campos de baixo, que e onde ela morava quando o sku era um so. */
    chk('[Previa] "items[].sku" saiu da lista de campos de baixo (ele mora na tabela agora)',
        tela.campos['items[].sku'] === undefined,
        JSON.stringify(tela.campos['items[].sku']));
  }
}

/* ===========================================================================
   PARTE 6 -- duplicar leva o SKU, e leva DERIVADO
   ===========================================================================
   Copia que nasce com o SKU intacto nasce RECUSADA: o clique seguinte em Gerar
   encontraria dois itens com o mesmo SKU. Copia que nasce com o campo VAZIO perde uma
   informacao que o dono cadastrou, em silencio. A derivacao ('-COPIA', a mesma regra
   que o codigo do pacote ja usava) e o unico caminho que nao faz nenhuma das duas.
   =========================================================================== */
async function bateriaDuplicar(cfg){
  console.log('\n=== ['+cfg.nome+'] duplicar leva o SKU derivado ===');
  const rot = '['+cfg.nome+'] ';
  const fora = {};
  await gerarNaFerramenta(async pg => {
    await identidade(pg);
    await cfg.cadastrar(pg);
    /* --- duplicar o item de catalogo --- */
    await botaoDaLinha(pg, cfg.lista, cfg.tituloDup, 0);
    await pg.waitForTimeout(150);
    fora.skuForm = await ler(pg, cfg.campoSku);
    fora.skusOps = await skusDaLista(pg, cfg.listaOps);
    /* --- duplicar um opcional DENTRO do formulario --- */
    await botaoDaLinha(pg, cfg.listaOps, 'Duplicar este opcional', 0);
    await pg.waitForTimeout(150);
    fora.skusAposOp = await skusDaLista(pg, cfg.listaOps);
    /* --- salvar a copia e gerar: nao pode disparar a recusa de SKU repetido --- */
    await clicar(pg, cfg.salvar);
    await pg.waitForTimeout(150);
    await zerarAlertas(pg);
    await clicar(pg, cfg.gerar);
    await pg.waitForTimeout(150);
    fora.alertas = await alertas(pg);
    fora.saida = await ler(pg, cfg.saida);
  }, [], {porta: cfg.porta});

  const orig = CAT[0].sku;
  chk(rot+'o SKU do item copiado veio DERIVADO (nunca vazio, nunca igual ao original)',
      !!fora.skuForm && fora.skuForm !== orig && fora.skuForm.indexOf('-COPIA') >= 0,
      JSON.stringify(fora.skuForm));
  chk(rot+'o opcional COM SKU veio derivado tambem',
      !!fora.skusOps[0] && fora.skusOps[0] !== OPS[0].sku && fora.skusOps[0].indexOf('-COPIA') >= 0,
      JSON.stringify(fora.skusOps));
  chk(rot+'o opcional SEM SKU continua sem SKU (copia de vazio nasce vazia)',
      fora.skusOps[1] === '', JSON.stringify(fora.skusOps));
  chk(rot+'duplicar um OPCIONAL no formulario tambem deriva, e nao repete o irmao',
      fora.skusAposOp.length === fora.skusOps.length + 1 &&
      !!fora.skusAposOp[1] && fora.skusAposOp[1] !== fora.skusAposOp[0] &&
      fora.skusAposOp[1].indexOf('-COPIA') >= 0,
      JSON.stringify(fora.skusAposOp));
  chk(rot+'salvar a copia e gerar NAO dispara a recusa de SKU repetido',
      fora.alertas.length === 0, JSON.stringify(fora.alertas));
  chk(rot+'e a saida foi escrita', String(fora.saida||'').length > 1000);
}

const OPS_D = [OPS[0], OPS[1]];        /* um COM sku e um SEM -- os dois caminhos da copia */
await bateriaDuplicar({
  nome:'Checkout', porta:8641, lista:'u-prod-lista', tituloDup:'Duplicar este produto',
  listaOps:'u-op-lista', campoSku:'u-psku', salvar:'u-prod-salvar', gerar:'u-gerar', saida:'u-out',
  cadastrar: pg => cadastrarCheckout(pg, [CAT[0]], OPS_D)
});
await bateriaDuplicar({
  nome:'Mini loja', porta:8642, lista:'m-prod-lista', tituloDup:'Duplicar este produto',
  listaOps:'m-op-lista', campoSku:'m-psku', salvar:'m-prod-salvar', gerar:'m-gerar', saida:'m-out',
  cadastrar: pg => cadastrarLoja(pg, [CAT[0]], OPS_D)
});
await bateriaDuplicar({
  nome:'Pagina de obrigado', porta:8643, lista:'a-pac-lista', tituloDup:'Duplicar este pacote',
  listaOps:'a-op-lista', campoSku:'a-psku', salvar:'a-pac-salvar', gerar:'a-gerar', saida:'a-out3',
  cadastrar: pg => cadastrarPac(pg, [CAT[0]], OPS_D)
});

/* ===========================================================================
   PARTE 7 -- backup antigo abre com o campo vazio, sem perder nada
   ===========================================================================
   O ESTADO E COLHIDO DA PROPRIA REFERENCIA, gravado pela ferramenta DE LA -- nunca um
   JSON escrito a mao aqui: objeto a mao envelhece no dia em que o formato mudar, e
   passaria a provar o passado. (molde: chaves-renomeadas.mjs)
   O QUE SE COBRA: a ferramenta de hoje abre aquele estado sem alerta e sem erro, os
   itens continuam todos la com o que tinham, os seis campos de SKU abrem VAZIOS, e o
   bloco gerado dali nao tem 'sku' em linha nenhuma -- que e a promessa de que uma
   rodada nova nao mexe no que o dono ja tem guardado.
   =========================================================================== */
console.log('\n=== [7] backup anterior a esta rodada ('+REF+') ===');
{
  let dirRef = null, motivo = '';
  try{
    execFileSync('git', ['-C', RAIZ, 'rev-parse', '--verify', REF], {stdio:'ignore'});
    dirRef = fs.mkdtempSync(path.join(os.tmpdir(), 'sku-ref-'));
    execFileSync('/bin/sh', ['-c',
      'git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) +
      ' | tar -x -C ' + JSON.stringify(dirRef)]);
  }catch(e){ dirRef = null; motivo = String(e && e.message || e); }

  /* A DETECCAO DE ENVELHECIMENTO: se a referencia JA tem os campos de SKU, ela nao e o
     "antes" de nada -- e a prova diria "o campo abre vazio" sobre uma arvore que ja
     grava o campo. NAO FALHA: diz NAO MEDIU, com o comando que mediria de verdade. */
  const idxRef = dirRef ? fs.readFileSync(path.join(dirRef, 'index.html'), 'utf8') : '';
  const refEnvelheceu = idxRef.indexOf("'u-psku'") >= 0 || idxRef.indexOf('id="u-psku"') >= 0;

  if(!dirRef){
    console.log('  NAO MEDIU  a referencia "'+REF+'" nao esta neste repositorio ('+
                String(motivo).slice(0,90)+').');
    console.log('             node scripts/verificar/sku-por-item.mjs <commit anterior a esta rodada>');
  }else if(refEnvelheceu){
    console.log('  NAO MEDIU  a referencia "'+REF+'" JA tem os campos de SKU -- ela deixou de ser');
    console.log('             o "antes" desta rodada. Para medir de verdade, passe um commit anterior:');
    console.log('             node scripts/verificar/sku-por-item.mjs <commit anterior a esta rodada>');
    console.log('             Esta parte NAO rodou -- nao conte com ela.');
  }else{
    /* --- colhe o estado NA REFERENCIA --- */
    let estado = null;
    try{
      await gerarNaFerramenta(async pg => {
        await identidade(pg);
        await clicar(pg,'aba-uni');
        await set(pg,'u-pnome','Ensaio de Natal');
        await set(pg,'u-pdesc','30 minutos, 10 fotos tratadas');
        await set(pg,'u-ppreco','420');
        await radio(pg,'u-pqtd','sim');
        await set(pg,'u-op-nome','Foto extra'); await set(pg,'u-op-preco','35');
        await set(pg,'u-op-desc','Tratada uma a uma'); await set(pg,'u-op-qtd',true);
        await clicar(pg,'u-op-add');
        await clicar(pg,'u-prod-salvar');
        await clicar(pg,'aba-loja');
        await set(pg,'m-pnome','Album 30x30'); await set(pg,'m-pdesc','Capa dura, 20 paginas');
        await set(pg,'m-ppreco','890'); await set(pg,'m-pcat','Albuns');
        await set(pg,'m-pimg','https://storage.alboom.ninja/album.jpg');
        await set(pg,'m-op-nome','Caixa'); await set(pg,'m-op-preco','60');
        await set(pg,'m-op-desc','Caixa de presente'); await clicar(pg,'m-op-add');
        await clicar(pg,'m-prod-salvar');
        await clicar(pg,'aba-pac');
        await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
        await set(pg,'a-prefixo','FC');
        await radio(pg,'a-metodo','ambos');
        await set(pg,'a-pcod','MINI'); await set(pg,'a-pnome','Mini ensaio');
        await set(pg,'a-pdur','1 hora'); await set(pg,'a-ppreco','420');
        await set(pg,'a-pinclui','10 fotos tratadas');
        await set(pg,'a-ppath','https://tidycal.com/fotocerta/mini');
        await set(pg,'a-op-nome','Album extra'); await set(pg,'a-op-preco','80');
        await set(pg,'a-op-desc','Vinte paginas'); await set(pg,'a-op-qtd',true);
        await clicar(pg,'a-op-add');
        await clicar(pg,'a-pac-salvar');
        globalThis.__estado = await pg.evaluate(() => ({
          abas: localStorage.getItem('fcConstrutores'),
          ident: localStorage.getItem('fcConstrutoresIdentidade')
        }));
      }, [], {raiz: dirRef, porta: 8651});
      estado = globalThis.__estado;
    }catch(e){ estado = null; motivo = String(e && e.message || e); }

    if(!estado || !estado.abas){
      console.log('  NAO MEDIU  a referencia "'+REF+'" nao aceitou este roteiro de cadastro ('+
                  String(motivo).slice(0,90)+').');
      console.log('             node scripts/verificar/sku-por-item.mjs <commit anterior a esta rodada>');
    }else{
      const r = await gerarNaFerramenta(async pg => {
        await pg.evaluate(e => {
          if(e.abas) localStorage.setItem('fcConstrutores', e.abas);
          if(e.ident) localStorage.setItem('fcConstrutoresIdentidade', e.ident);
        }, estado);
        await pg.reload();
        await pg.evaluate(() => {
          window.__alertas = [];
          window.alert = m => { window.__alertas.push(String(m)); };
          window.confirm = () => true; window.open = () => null;
        });
        await pg.waitForTimeout(300);
        globalThis.__abriu = await pg.evaluate(() => {
          const v = i => { const e = document.getElementById(i); return e ? e.value : null; };
          const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
          return {
            skus: ['u-psku','u-op-sku','m-psku','m-op-sku','a-psku','a-op-sku'].map(v),
            u: (st.u || {}).prods || [], m: (st.m || {}).prods || [], a: (st.a || {}).pacotes || [],
            falhas: (document.getElementById('fc-falhas') || {}).textContent || ''
          };
        });
        await clicar(pg,'aba-uni'); await pg.waitForTimeout(60); await clicar(pg,'u-gerar');
        await clicar(pg,'aba-loja'); await pg.waitForTimeout(60); await clicar(pg,'m-gerar');
        await clicar(pg,'aba-pac'); await pg.waitForTimeout(60); await clicar(pg,'a-gerar');
        await pg.waitForTimeout(200);
      }, ['u-out','m-out','a-out3'], {porta: 8652});

      const ab = globalThis.__abriu;
      chk('[7] a ferramenta de hoje restaurou o backup SEM alerta',
          r.alertas.length===0, JSON.stringify(r.alertas));
      chk('[7] e sem erro de console', r.erros.length===0, r.erros.slice(0,2).join(' | '));
      chk('[7] a barra vermelha de fabrica divergente nao acendeu',
          String(ab.falhas).trim()==='', String(ab.falhas).slice(0,120));

      /* --- nada se perdeu --- */
      const p = ab.u[0] || {}, op = (p.ops||[])[0] || {};
      chk('[7] o produto do Checkout continua la, com nome, preco e descricao',
          p.nome==='Ensaio de Natal' && String(p.preco)==='420' &&
          p.desc==='30 minutos, 10 fotos tratadas',
          JSON.stringify([p.nome,p.preco,p.desc]));
      chk('[7] e com o "vende por quantidade" ligado', p.qtd===true, JSON.stringify(p.qtd));
      chk('[7] o opcional dele continua la, com nome, preco, descricao e quantidade',
          op.nome==='Foto extra' && String(op.preco)==='35' &&
          op.desc==='Tratada uma a uma' && op.qtd===true,
          JSON.stringify([op.nome,op.preco,op.desc,op.qtd]));
      const pm = ab.m[0] || {}, opm = (pm.ops||[])[0] || {};
      chk('[7] o produto da Mini loja continua la, com o opcional dele',
          pm.nome==='Album 30x30' && String(pm.preco)==='890' && opm.nome==='Caixa' &&
          opm.desc==='Caixa de presente',
          JSON.stringify([pm.nome,pm.preco,opm.nome,opm.desc]));
      const pa = ab.a[0] || {}, opa = (pa.ops||[])[0] || {};
      chk('[7] o pacote continua la, com o opcional dele',
          pa.cod==='MINI' && pa.nome==='Mini ensaio' && String(pa.preco)==='420' &&
          opa.nome==='Album extra' && opa.qtd===true,
          JSON.stringify([pa.cod,pa.nome,pa.preco,opa.nome,opa.qtd]));

      /* --- os seis campos novos abrem VAZIOS --- */
      chk('[7] os SEIS campos de SKU abrem vazios (e nao com "undefined")',
          ab.skus.length===6 && ab.skus.every(v => v===''), JSON.stringify(ab.skus));

      /* --- e o bloco gerado dali nao tem 'sku' em linha nenhuma --- */
      for(const id of ['u-out','m-out','a-out3']){
        const t = r.valores[id] || '';
        chk('[7] o bloco gerado de '+id+' nao emite sku em linha nenhuma',
            t.length>1000 && t.indexOf(", sku:'")<0 && t.indexOf('novo.sku=')<0,
            'tamanho '+t.length);
      }
      /* A prova acima e no TEXTO; esta e com o bloco RODANDO, que e a unica que
         responde pelo objeto que o PayPal receberia. */
      const rb = await comBlocoNaPagina({
        bloco: r.valores['u-out'] || '', cabeca: CABECA, porta: 8653,
        medir: async pg => {
          await pg.waitForTimeout(250);
          const sel = 'input[name="fcu-prod"][value="0"]';
          if(await pg.locator(sel).count()){
            if(!(await pg.$eval(sel, el => el.checked))) await pg.click('label:has('+sel+')');
          }
          await pg.waitForTimeout(150);
          return {leitura: await pedidoDoBloco(pg)};
        }
      });
      const its = (rb.leitura||{}).itens || [];
      chk('[7] BLOCO RODANDO: o pedido tem itens', its.length > 0, JSON.stringify(rb.leitura));
      chk('[7] BLOCO RODANDO: NENHUMA linha tem a chave sku',
          its.length>0 && its.every(it => it.temSku === false),
          JSON.stringify(its.map(i => [i.nome, i.temSku, i.sku])));
    }
  }
  if(dirRef){ try{ fs.rmSync(dirRef, {recursive:true, force:true}); }catch(e){} }
}

/* ===========================================================================
   PARTE 8 -- texto hostil no SKU, com o bloco EXECUTANDO
   ===========================================================================
   Os quatro caracteres que quebram os caminhos de escape desta ferramenta, agora num
   campo que nunca os tinha recebido. Um escape que falte nao da erro visivel: ele
   fecha o literal JS ou o <script> no meio, e o bloco inteiro deixa de carregar --
   com o resto da pagina do Prosite indo junto. E por isso que a prova nao olha so o
   valor: ela cobra que exista um elemento DEPOIS do bloco e que o bloco continue no
   DOM, que e como se ve "o documento nao foi engolido".
   =========================================================================== */
console.log('\n=== [8] texto hostil no SKU ===');
{
  const CAT_H = [{nome:CAT[0].nome, preco:CAT[0].preco, sku:HOSTIL_SKU_P}];
  const OPS_H = [{nome:OPS[0].nome, preco:OPS[0].preco, qtd:false, sku:HOSTIL_SKU_O}];
  const r = await gerarNaFerramenta(async pg => {
    await identidade(pg);
    await cadastrarCheckout(pg, CAT_H, OPS_H);
    await clicar(pg,'u-gerar');
  }, ['u-out'], {porta: 8661});
  chk('[8] a ferramenta gerou sem alerta', r.alertas.length===0, JSON.stringify(r.alertas));
  chk('[8] e sem erro de console', r.erros.length===0, r.erros.slice(0,2).join(' | '));

  const b = await comBlocoNaPagina({
    bloco: r.valores['u-out'] || '', cabeca: CABECA, porta: 8662,
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(250);
      const sel = 'input[name="fcu-prod"][value="0"]';
      if(await pg.locator(sel).count()){
        if(!(await pg.$eval(sel, el => el.checked))) await pg.click('label:has('+sel+')');
      }
      await pg.waitForTimeout(150);
      const so = 'input[name="fcu-op-0"][value="0"]';
      if(await pg.locator(so).count()){
        if(!(await pg.$eval(so, el => el.checked))) await pg.click('label:has('+so+')');
      }
      await pg.waitForTimeout(150);
      return {
        leitura: await pedidoDoBloco(pg),
        fim: await pg.$('#fim-do-documento') !== null,
        vivo: await pg.$('.fcuni') !== null
      };
    }
  });
  chk('[8] o documento nao foi engolido: ha um elemento DEPOIS do bloco', b.fim);
  chk('[8] e o proprio bloco continua no DOM', b.vivo);
  chk('[8] sem erro de console proprio do bloco',
      errosReais(b.erros).length===0, (b.erros||[]).slice(0,2).join(' | '));
  const its = (b.leitura||{}).itens || [];
  const porNome = n => its.filter(x => x.nome === n)[0] || {};
  chk('[8] o SKU hostil do PRODUTO chega ao createOrder byte a byte',
      porNome(CAT[0].nome).sku === skuEsperado(HOSTIL_SKU_P),
      JSON.stringify(porNome(CAT[0].nome).sku));
  chk('[8] o SKU hostil do OPCIONAL tambem',
      porNome(OPS[0].nome).sku === skuEsperado(HOSTIL_SKU_O),
      JSON.stringify(porNome(OPS[0].nome).sku));
}

/* ===========================================================================
   PARTE 9 -- A CALCULADORA DE ALBUM, a quinta aba que cobra (16/09/2026)
   ===========================================================================
   POR QUE ELA ENTRA EM SEPARADO, e nao dentro das partes acima. As tres abas de
   catalogo tem a mesma forma -- um PRODUTO com seus OPCIONAIS --, e as partes 1 a 8
   sao escritas em cima dessa forma. A calculadora tem outra: os itens que carregam SKU
   sao os TAMANHOS do album e os ACABAMENTOS, e nao ha produto nenhum no meio. Forcar a
   forma antiga sobre ela produziria um roteiro torto e assercoes que so parecem medir.

   O QUE IMPORTA AQUI E TRANSVERSAL, e e isto: ela usa a MESMA maquinaria das irmas
   (fcSkuLimpo, fcSkuRecusa) ou reimplementou a propria? Reimplementacao e o defeito que
   este projeto ja nomeou -- duas copias que concordam hoje e divergem amanha. A prova
   nao le o codigo para responder: ela exercita a aba e cobra o MESMO comportamento
   observavel que as tres irmas entregam.
   =========================================================================== */
console.log('\n=== PARTE 9 -- a Calculadora de album ===');
{
  const foraA = {};
  await gerarNaFerramenta(async pg => {
    await identidade(pg);
    await clicar(pg,'aba-alb');
    await set(pg,'v-cod','ALB26');

    /* --- 9a. SKUs distintos: gera, sem alerta, e os dois chegam ao bloco --- */
    await set(pg,'v-tam-cm','50'); await set(pg,'v-tam-media','5');
    await set(pg,'v-tam-minfotos','50'); await set(pg,'v-tam-sku','ALB-50');
    await clicar(pg,'v-tam-add');
    await set(pg,'v-ac-nome','Mini-replica'); await set(pg,'v-ac-valor','390');
    await set(pg,'v-ac-sku','MINI-REP');
    await clicar(pg,'v-ac-add');
    await zerarAlertas(pg);
    await clicar(pg,'v-gerar');
    foraA.alertasOk = await alertas(pg);
    foraA.blocoOk = await ler(pg,'v-out');

    /* --- 9b. SKU REPETIDO entre um tamanho e um acabamento --- */
    await set(pg,'v-ac-nome','Caixa de madeira'); await set(pg,'v-ac-valor','250');
    await set(pg,'v-ac-sku','ALB-50');
    await clicar(pg,'v-ac-add');
    await zerarAlertas(pg);
    await clicar(pg,'v-gerar');
    foraA.alertasRep = await alertas(pg);
    foraA.blocoRep = await ler(pg,'v-out');

    /* --- 9c. SKU com espaco nas pontas: a limpeza e a MESMA das irmas ---
       'fcSkuLimpo' apara as pontas e corta no limite do PayPal; ela NAO poe em maiuscula
       nem tira espaco do meio, e nem o campo se corrige sozinho na tela -- nas tres irmas
       tambem nao. O que se cobra aqui e o que de fato acontece nelas: o que ENTRA NA LISTA
       ja vai aparado. Medir o campo na tela mediria uma limpeza que esta ferramenta nunca
       fez, em aba nenhuma. */
    await set(pg,'v-ac-nome','Estojo'); await set(pg,'v-ac-valor','120');
    await set(pg,'v-ac-sku','   EST-01   ');
    await clicar(pg,'v-ac-add');
    foraA.naLista = await pg.evaluate(() => {
      const t = document.getElementById('v-ac-lista');
      return t ? t.textContent : '';
    });
  }, [], {porta: 8661});

  chk('[album] com SKUs distintos, gera sem alerta nenhum',
      (foraA.alertasOk||[]).length === 0, JSON.stringify(foraA.alertasOk));
  chk('[album] e os dois SKUs chegam ao bloco entregue',
      (foraA.blocoOk||'').indexOf('ALB-50') >= 0 && (foraA.blocoOk||'').indexOf('MINI-REP') >= 0);

  const msg = (foraA.alertasRep||[])[0] || '';
  chk('[album] SKU repetido entre um tamanho e um acabamento RECUSA',
      (foraA.alertasRep||[]).length === 1, JSON.stringify(foraA.alertasRep));
  /* A MESMA FRASE das irmas, e nao uma parecida: frase propria aqui seria o sinal de
     que a recusa foi reimplementada nesta aba. */
  provarRecusa('[album] ', msg, '50 cm', 'Caixa de madeira', 'ALB-50');
  /* E o mais importante: a saida FICOU COMO ESTAVA. Recusa que alerta e grava mesmo
     assim e pior que nenhuma -- o operador le o aviso, fecha, e cola o bloco recusado. */
  chk('[album] e a saida NAO foi reescrita pela geracao recusada',
      foraA.blocoRep === foraA.blocoOk,
      'antes ' + (foraA.blocoOk||'').length + ' · depois ' + (foraA.blocoRep||'').length);
  chk('[album] o SKU entra na lista APARADO, como nas tres irmas',
      (foraA.naLista||'').indexOf('SKU EST-01') >= 0
      && (foraA.naLista||'').indexOf('SKU    EST-01') < 0,
      JSON.stringify(String(foraA.naLista||'').slice(0,200)));
}

process.exit(resumo());
