/* ============================================================================
   A PREVIA DA /cobrar MENTE? -- a leva 11
   ============================================================================
   O QUE ELA PROMETE, nas duas metades:

     1. "COMO VAI FICAR" -- um quadro com a /pagar PUBLICADA do dono, carregada com o link
        recem-gerado. Fiel por construcao: e a pagina de verdade, com o bloco que ele colou.
        Promessas mensuraveis: o quadro CARREGA, ele NAO E CLICAVEL, e a falta de rede vira
        RECADO e nunca quadro branco. E a quarta, que e a maior vantagem da metade 1: bloco
        colado desatualizado faz a previa mostrar A RECUSA -- o aviso que o dono precisa, na
        hora em que ele precisa.

     2. "O QUE VAI PARA O PAYPAL" -- a tabela com os campos do pedido. Ela promete que aquilo
        e o que o PayPal vai registrar. Recalcular na /cobrar seria a segunda implementacao de
        dinheiro, entao o pedido sai do MESMO TEXTO que o bloco leva dentro (P_PP_PEDIDO_SRC e
        fcPpItensSrc, em fc-compartilhado.js), avaliado por pPpPedidoApi.

   COMO A PROVA E FEITA, e por que ela vale. A comparacao e entre TRES caminhos independentes
   para a mesma cobranca:

     lado A   a tabela da /cobrar, LIDA DA TELA -- exatamente o que o dono enxerga;
     lado B   o MESMO bloco da /pagar (o texto da caixa de saida, byte a byte) executado numa
              pagina do molde comum, com o createOrder chamado direto e o link de verdade no
              endereco. Este e o arbitro: e o codigo que vai para o site do dono;
     lado C   a tabela da PREVIA DA FERRAMENTA, tambem lida da tela -- o pedido explicito da
              spec e "os mesmos campos que a da ferramenta".

   Nenhum dos tres formata pelo codigo do outro: o lado B e reescrito aqui, nas palavras que a
   tela usa. Se os tres lados formatassem pela mesma funcao, a prova nao teria opiniao nenhuma.

   A REFERENCIA HISTORICA E PRESA A UM COMMIT (regra de 13/09/2026), e serve a UMA parte so --
   a do bloco desatualizado. 6136504 e o ultimo commit antes da leva 10 (itens e upsell no
   link): um bloco gerado ali conta SETE parametros no selo e nao conhece o i, entao ele RECUSA
   um link com itens. E isso que a previa tem de mostrar. A suite DETECTA o envelhecimento --
   le do proprio fc-compartilhado.js da referencia se ele ja conhece os itens -- e diz NAO
   MEDIU, com a linha de comando que mediria de verdade, em vez de falhar.

   Roda com:  node scripts/verificar/previa-cobrar.mjs [referencia]
   ============================================================================ */
import { comBlocoNaPagina, chk, resumo } from './pagina.mjs';
import { navegador, servir, abrir, set, radio, clicar, ler } from './lib.mjs';
import { preparar, cobranca } from './cenario.mjs';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF  = process.argv[2] || '6136504';

/* ===========================================================================
   UM SERVIDOR SO, COM PAGINAS DE MENTIRA PENDURADAS
   ===========================================================================
   A previa e um <iframe>. Para o teste poder LER o que ha dentro dele, a pagina de pagamento
   de mentira precisa vir da MESMA ORIGEM que a /cobrar -- em portas separadas o navegador
   (com razao) fecha a porta, e a parte do bloco desatualizado nao teria como medir nada.
   Dai este servidor: ele serve a arvore do repositorio e mais as rotas de memoria. */
const TIPOS = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
  '.json':'application/json','.png':'image/png','.md':'text/plain; charset=utf-8'};
function servirCom(raiz, porta, extras){
  const s = http.createServer((req,res)=>{
    const rota = decodeURIComponent(req.url.split('?')[0]);
    if(Object.prototype.hasOwnProperty.call(extras, rota)){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      res.end(extras[rota]);
      return;
    }
    let p = rota;
    if(p.endsWith('/')) p += 'index.html';
    const f = path.join(raiz, p);
    if(!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){res.writeHead(404);res.end('nao');return;}
    res.writeHead(200,{'Content-Type':TIPOS[path.extname(f)]||'application/octet-stream'});
    res.end(fs.readFileSync(f));
  });
  return new Promise(r=>s.listen(porta,()=>r(s)));
}
/* O TEXTO QUE O DONO LE dentro do quadro. <style> e <script> saem antes: body.textContent traz
   o codigo-fonte do bloco junto (armadilha 1 de pagina.mjs), e procurar "1.200,50" no meio do
   JS gerado responderia a outra pergunta. Vale so para quadro de MESMA ORIGEM -- e e por isso
   que as paginas de mentira sao servidas pelo mesmo servidor da /cobrar. */
const textoDoQuadro = pg => pg.evaluate(() => {
  const f = document.querySelector('#cb-pv-quadro iframe');
  if(!f) return {ok:false, txt:'nao ha quadro'};
  try{
    const d = f.contentDocument;
    if(!d||!d.body) return {ok:false, txt:'quadro em branco'};
    const c = d.body.cloneNode(true);
    c.querySelectorAll('script,style').forEach(e=>e.remove());
    return {ok:true, txt:c.textContent.replace(/\s+/g,' ').trim()};
  }catch(e){ return {ok:false, txt:'outra origem: '+String(e&&e.message||e)}; }
});
/* Espera o quadro TERMINAR: a linha de "carregando" some quando o iframe dispara load. */
async function esperarQuadro(pg, ms){
  const ate = Date.now()+ms;
  while(Date.now() < ate){
    const pronto = await pg.evaluate(() => !document.querySelector('#cb-pv-quadro .cb-pv-esperando'));
    if(pronto) return true;
    await pg.waitForTimeout(150);
  }
  return false;
}
/* Abre a previa SE ela estiver fechada. Clicar sempre inverteria o que ja estava certo: numa
   janela larga ela nasce aberta, e o clique a fecharia -- medido, e foi assim que a primeira
   passagem desta suite mediu um quadro de altura zero. */
async function abrirPrevia(pg){
  await pg.evaluate(() => {
    const c=document.getElementById('cb-previa-corpo');
    if(c && c.style.display==='none') document.getElementById('cb-previa-bt').click();
  });
}
const paginaComBloco = bloco =>
  '<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>Pagar</title></head><body>'
  + bloco + '</body></html>';

/* ===========================================================================
   O QUE SE LE DE UMA TABELA DE PEDIDO -- e so o que esta DESENHADO
   ===========================================================================
   Serve para as DUAS tabelas (a da ferramenta e a da /cobrar), porque as duas sao a mesma
   forma: linhas de celulas-folha. Linha de item tem QUATRO celulas; linha de campo, DUAS. */
const lerTabela = (escopo, caixaId) => escopo.evaluate(id => {
  const cx = document.getElementById(id);
  if(!cx) return {faltou:'a caixa '+id+' nao existe'};
  const linhas = [];
  cx.querySelectorAll('div').forEach(d => {
    const filhos = Array.prototype.slice.call(d.children);
    if(!filhos.length) return;
    if(filhos.some(f => f.children.length)) return;
    linhas.push(filhos.map(f => f.textContent.trim()));
  });
  return {linhas, texto: cx.textContent};
}, caixaId);
const NOMES_DE_CAMPO = ['items[].name','items[].sku','quantity','unit_amount',
  'amount.breakdown.item_total','amount.breakdown.discount','amount.value','description','custom_id'];
/* So os NOVE nomes de campo do PayPal. A previa da FERRAMENTA desenha o botao de mentira dentro
   da MESMA caixa, e o desenho tem uma linha de duas celulas ("PayPal" / "Cartao de debito ou
   credito") que nao e campo de pedido nenhum -- ela entraria na leitura e faria as duas telas
   parecerem diferentes por causa do desenho, e nao do pedido. */
function soCampos(campos){
  const o={};
  for(const k of Object.keys(campos)) if(NOMES_DE_CAMPO.indexOf(k)>=0) o[k]=campos[k];
  return o;
}
function interpretar(q){
  const itens = [], campos = {};
  for(const l of (q.linhas||[])){
    if(l.length === 4){
      if(l[0] === 'items[].name') continue;               /* o cabecalho */
      itens.push({nome:l[0], sku:l[1], qtd:l[2], unit:l[3]});
    }else if(l.length === 2){
      campos[l[0]] = l[1];
    }
  }
  return {itens, campos};
}
/* O MESMO pedido, visto do lado B: o objeto que o createOrder devolveu, escrito nas mesmas
   palavras que a tela usa. Escrito AQUI, e nao lido de nenhuma funcao do projeto. */
function comoATelaEscreveria(pu){
  const din = o => o ? (String(o.value)+' '+String(o.currency_code)) : null;
  const its = pu.items || [], br = (pu.amount||{}).breakdown || {};
  const campos = {
    'amount.breakdown.item_total': din(br.item_total),
    'amount.value':                din(pu.amount),
    'description':                 pu.description,
    'custom_id':                   pu.custom_id
  };
  if(br.discount) campos['amount.breakdown.discount'] = '- '+din(br.discount);
  return {
    itens: its.map(it => ({nome:String(it.name),
      sku: (it.sku==null ? '—' : String(it.sku)),
      qtd:String(it.quantity), unit:din(it.unit_amount)})),
    campos
  };
}
function comparar(rot, tela, pedido){
  chk(rot+'o mesmo numero de itens que o pedido tem',
      tela.itens.length === pedido.itens.length,
      'tela '+tela.itens.length+' x pedido '+pedido.itens.length);
  const n = Math.min(tela.itens.length, pedido.itens.length);
  for(let z=0;z<n;z++){
    const a = tela.itens[z], b = pedido.itens[z];
    chk(rot+'item '+(z+1)+': nome, SKU, quantidade e unit_amount iguais aos do pedido',
        a.nome===b.nome && a.sku===b.sku && a.qtd===b.qtd && a.unit===b.unit,
        'tela '+JSON.stringify(a)+' x pedido '+JSON.stringify(b));
  }
  for(const k of Object.keys(pedido.campos)){
    const esperado = pedido.campos[k];
    if(esperado == null) continue;
    chk(rot+'campo "'+k+'" igual', tela.campos[k] === String(esperado),
        'tela '+JSON.stringify(tela.campos[k])+' x pedido '+JSON.stringify(String(esperado)));
  }
  if(!pedido.campos['amount.breakdown.discount'])
    chk(rot+'sem desconto no pedido, a tela nao inventa a linha de desconto',
        tela.campos['amount.breakdown.discount'] === undefined,
        JSON.stringify(tela.campos['amount.breakdown.discount']));
}
/* A sonda do SDK para o LADO B (as duas previas tem a sua propria, por dentro). */
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
const pedidoDoBloco = pg => pg.evaluate(() => {
  if(!window.__pp || !window.__pp.createOrder) return {erro:'sem createOrder'};
  try{ return {pu: window.__pp.createOrder(null,{order:{create:x=>x}}).purchase_units[0]}; }
  catch(e){ return {erro:String(e&&e.message||e)}; }
});

/* ---- preencher a /cobrar com a MESMA cobranca que a aba recebeu ---- */
async function cobrarNaPagina(pg, base, cen){
  await pg.goto(base + '/cobrar/index.html');
  await pg.evaluate(() => { window.__alertas = []; window.alert = m => window.__alertas.push(String(m)); });
  await set(pg,'cb-desc', cen.c.desc ?? 'Ensaio de familia — pacote completo');
  await set(pg,'cb-valor', cen.c.valor ?? '1200,50');
  await set(pg,'cb-txid', cen.c.txid ?? '');
  await set(pg,'cb-validade', cen.c.validade ?? '');
  await set(pg,'cb-descpix', cen.c.descpix ?? '0');
  await radio(pg,'cb-ppmodo', cen.c.ppmodo ?? 'sdk');
  if(cen.c.pplink) await set(pg,'cb-pplink', cen.c.pplink);
  await set(pg,'cb-itens', cen.itens ?? '');
  await clicar(pg,'cb-gerar');
  await pg.waitForTimeout(160);
  return (await ler(pg,'cb-out')) || '';
}

/* ===========================================================================
   CENARIOS -- com itens e sem itens, que e o que a spec exige dos dois lados
   =========================================================================== */
const CENARIOS = [
  { n:'sem itens', c:{ valor:'1200,50', txid:'FCTESTE1', desc:'Ensaio "A" \\ é <b>o teste</b>' } },
  { n:'com itens', c:{ valor:'1200,50', txid:'FCTESTE1', desc:'Ensaio de familia' },
    itens:'Ensaio de gestante | ENS-01.A | 900,00\nÁlbum 20x20 |  | 300,50' },
  { n:'sem identificador', c:{ valor:'420,00', txid:'', desc:'Ensaio simples' } }
];

console.log('=== PARTE 1 -- a extracao: o bloco continua levando o MESMO texto dentro ===');
/* A regressao byte a byte (scripts/verificar/regressao.sh) e quem prova que a saida nao mudou.
   Aqui mede-se a outra metade da mesma afirmacao: que o texto que o bloco leva e LITERALMENTE o
   que a /cobrar avalia -- se um dia alguem reescrever um dos dois, isto fica vermelho. */
{
  const srv = await servirCom(RAIZ, 8841, {});
  const br  = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8841');
    await preparar(pg); await clicar(pg,'aba-cob');
    await cobranca(pg, CENARIOS[0].c);
    await clicar(pg,'p-gerar'); await pg.waitForTimeout(140);
    const bloco = (await ler(pg,'p-out1')) || '';
    const r = await pg.evaluate(() => ({
      ped: (window.FCCOMPART||{}).P_PP_PEDIDO_SRC || '',
      itens: (window.FCCOMPART||{}).fcPpItensSrc ? window.FCCOMPART.fcPpItensSrc(true) : '',
      campos: (window.FCCOMPART||{}).FC_PP_CAMPOS || null,
      lim: (window.FCCOMPART||{}).FC_LIM_PP
    }));
    chk('o arquivo compartilhado exporta o texto do pedido e o dos itens',
        r.ped.length > 200 && r.itens.length > 500, 'ped='+r.ped.length+' itens='+r.itens.length);
    chk('o BLOCO da /pagar leva o texto do pedido dentro, caractere por caractere',
        bloco.indexOf(r.ped) >= 0, 'nao achei P_PP_PEDIDO_SRC dentro de p-out1');
    /* o bloco recebe ppDetalhar indentado (pInd), entao a comparacao e linha a linha sem a margem */
    const semMargem = t => t.split('\n').map(l=>l.replace(/^\s+/,'')).join('\n');
    chk('o BLOCO da /pagar leva o texto de ppDetalhar dentro (a menos da indentacao)',
        semMargem(bloco).indexOf(semMargem(r.itens).replace(/\n+$/,'')) >= 0,
        'nao achei fcPpItensSrc dentro de p-out1');
    chk('os nove nomes de campo do PayPal saem de FC_PP_CAMPOS', !!r.campos && r.campos.nome==='items[].name'
        && r.campos.conciliacao==='custom_id' && Object.keys(r.campos).length===9,
        JSON.stringify(r.campos));
    chk('FC_LIM_PP virou numero do arquivo compartilhado', r.lim === 127, String(r.lim));
    chk('nenhum erro de console na ferramenta', pg.erros.length===0, pg.erros.slice(0,2).join(' | '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
  const idx = fs.readFileSync(path.join(RAIZ,'index.html'),'utf8');
  chk('o index.html nao declara mais fcPpItensSrc por conta propria',
      idx.indexOf('function fcPpItensSrc(temSku){') < 0);
  chk('o index.html nao declara mais o numero 127 por conta propria',
      idx.indexOf('var FC_LIM_PP=127;') < 0);
}

console.log('\n=== PARTE 2 -- a tabela da /cobrar contra o createOrder do bloco DE VERDADE ===');
for(const cen of CENARIOS){
  const srv = await servirCom(RAIZ, 8842, {});
  const br  = await navegador();
  let bloco='', link='', telaCobrar=null, telaFerramenta=null, linkCobrar='';
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8842');
    await preparar(pg); await clicar(pg,'aba-cob');
    await cobranca(pg, cen.c);
    if(cen.itens) await set(pg,'p-itens', cen.itens);
    await clicar(pg,'p-gerar');
    await clicar(pg,'p-gerarlink');
    await pg.waitForTimeout(200);
    bloco = (await ler(pg,'p-out1')) || '';
    link  = (await ler(pg,'p-out2')) || '';
    chk('['+cen.n+'] a ferramenta gerou o bloco e o link', bloco.length>1000 && link.indexOf('?c=')>0,
        'bloco='+bloco.length+' link='+link.slice(0,60));
    /* lado C: a tabela da PREVIA DA FERRAMENTA */
    await pg.waitForTimeout(900);
    let alvo = null;
    for(const f of pg.frames()){ if(f !== pg.mainFrame() && await f.$('#p-pv-pp')){ alvo = f; break; } }
    if(alvo) telaFerramenta = interpretar(await lerTabela(alvo,'p-pv-pp'));
    chk('['+cen.n+'] a previa da ferramenta desenhou a tabela do PayPal', !!telaFerramenta);
    /* lado A: a tabela da /cobrar */
    linkCobrar = await cobrarNaPagina(pg, 'http://127.0.0.1:8842', cen);
    chk('['+cen.n+'] O INVARIANTE: a /cobrar gerou o MESMO link, caractere por caractere',
        linkCobrar === link, 'aba    = '+link.slice(-70)+'\n                cobrar = '+linkCobrar.slice(-70));
    telaCobrar = interpretar(await lerTabela(pg,'cb-pv-pp'));
    await pg.close();
  } finally { await br.close(); srv.close(); }

  /* lado B: o bloco de verdade, com o link de verdade no endereco */
  const busca = link.indexOf('?')>=0 ? link.slice(link.indexOf('?')) : '';
  const b = await comBlocoNaPagina({
    bloco, cabeca: CABECA, porta: 8843, busca,
    medir: async pg => { await pg.waitForTimeout(400); return {ped: await pedidoDoBloco(pg)}; }
  });
  chk('['+cen.n+'] o bloco da /pagar montou o pedido', !b.ped.erro, b.ped.erro);
  if(b.ped.pu){
    const doBloco = comoATelaEscreveria(b.ped.pu);
    if(telaCobrar)     comparar('['+cen.n+'] /cobrar: ', telaCobrar, doBloco);
    if(telaFerramenta) comparar('['+cen.n+'] ferramenta: ', telaFerramenta, doBloco);
    /* e, explicitamente, o pedido da spec: as duas telas mostram os MESMOS campos */
    if(telaCobrar && telaFerramenta){
      const ca=soCampos(telaCobrar.campos), cf=soCampos(telaFerramenta.campos);
      chk('['+cen.n+'] as duas telas mostram os mesmos nomes de campo',
          JSON.stringify(Object.keys(ca).sort()) === JSON.stringify(Object.keys(cf).sort()),
          'cobrar='+Object.keys(ca).sort().join(',')+'  ferramenta='+Object.keys(cf).sort().join(','));
      chk('['+cen.n+'] as duas telas mostram os mesmos valores de campo',
          Object.keys(cf).every(k => ca[k] === cf[k]),
          JSON.stringify(ca)+'\n                x '+JSON.stringify(cf));
      chk('['+cen.n+'] as duas telas mostram os mesmos itens',
          JSON.stringify(telaCobrar.itens) === JSON.stringify(telaFerramenta.itens),
          JSON.stringify(telaCobrar.itens)+'\n                x '+JSON.stringify(telaFerramenta.itens));
    }
  }
}

console.log('\n=== PARTE 3 -- o quadro carrega a pagina de verdade, e NAO e clicavel ===');
{
  const cen = CENARIOS[1];
  const srvGera = await servirCom(RAIZ, 8844, {});
  const br = await navegador();
  let bloco='';
  try{
    const pg = await abrir(br,'http://127.0.0.1:8844');
    await preparar(pg); await clicar(pg,'aba-cob');
    await cobranca(pg, cen.c);
    await set(pg,'p-itens', cen.itens);
    await clicar(pg,'p-gerar'); await pg.waitForTimeout(160);
    bloco = (await ler(pg,'p-out1')) || '';
    await pg.close();
  } finally { srvGera.close(); }
  const srv = await servirCom(RAIZ, 8845, {'/pagar-atual': paginaComBloco(bloco)});
  try{
    const base='http://127.0.0.1:8845';
    const pg = await abrir(br, base);
    await preparar(pg); await clicar(pg,'aba-cob');
    await cobranca(pg, {...cen.c, url: base+'/pagar-atual'});
    const l = await cobrarNaPagina(pg, base, cen);
    chk('a /cobrar gerou o link para a pagina de mentira', l.indexOf(base+'/pagar-atual?c=')===0, l.slice(0,80));
    await abrirPrevia(pg);
    const carregou = await esperarQuadro(pg, 20000);
    chk('o quadro terminou de carregar (o aviso de "carregando" saiu da caixa)', carregou);
    const est = await pg.evaluate(() => {
      const f = document.querySelector('#cb-pv-quadro iframe');
      if(!f) return {sem:'nao ha quadro'};
      const cs = getComputedStyle(f);
      return {src:f.getAttribute('src'), cliques:cs.pointerEvents, altura:f.getBoundingClientRect().height,
              estado:(document.getElementById('cb-pv-estado')||{}).textContent||'',
              abrir:(document.getElementById('cb-pv-abrir')||{}).getAttribute('href')};
    });
    chk('o quadro existe e aponta para o link recem-gerado', est.src === l, JSON.stringify(est).slice(0,160));
    chk('o quadro NAO e clicavel (pointer-events desligado)', est.cliques === 'none', String(est.cliques));
    chk('o quadro tem altura de verdade na tela', est.altura > 200, String(est.altura));
    chk('o botao "abrir em outra aba" leva ao MESMO link', est.abrir === l, String(est.abrir));
    chk('nao sobrou linha de estado vermelha na tela', !est.estado, JSON.stringify(est.estado));
    const dentro = await textoDoQuadro(pg);
    chk('o quadro mostrou o CARTAO da cobranca (o bloco atual aceita o link)',
        dentro.ok && dentro.txt.indexOf('1.200,50') >= 0 && dentro.txt.indexOf('Ensaio de gestante') >= 0,
        dentro.txt.slice(0,240));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

console.log('\n=== PARTE 4 -- BLOCO DESATUALIZADO: a previa mostra a recusa ===');
/* Este e o efeito colateral que virou a maior vantagem da metade 1. Ele e provado servindo um
   bloco ANTIGO de proposito -- gerado na arvore da referencia, que nao conhece o parametro i. */
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'fc-previa-'));
  let envelheceu = false, bloco = '';
  try{
    execSync('git -C "'+RAIZ+'" archive '+REF+' | tar -x -C "'+tmp+'"', {shell:'/bin/sh'});
    const comp = fs.readFileSync(path.join(tmp,'fc-compartilhado.js'),'utf8');
    /* A DETECCAO DE ENVELHECIMENTO, lida do proprio arquivo da referencia: se ela ja conhece os
       itens no link, ela NAO e mais "o bloco antigo" e esta parte nao mede nada. */
    envelheceu = comp.indexOf('pItensCod') >= 0;
  }catch(e){
    console.log('  NAO MEDIU  nao consegui extrair a referencia '+REF+': '+String(e.message||e));
    envelheceu = true;
  }
  if(envelheceu){
    console.log('  NAO MEDIU  a referencia '+REF+' ja conhece os itens no link, entao o bloco dela');
    console.log('             nao e mais "o bloco desatualizado". Escolha um commit anterior a leva 10:');
    console.log('             node scripts/verificar/previa-cobrar.mjs <commit anterior a cbacd8c>');
  }else{
    const br = await navegador();
    const cen = CENARIOS[1];
    const srvVelho = await servirCom(tmp, 8846, {});
    try{
      const pg = await abrir(br,'http://127.0.0.1:8846');
      await preparar(pg); await clicar(pg,'aba-cob');
      await cobranca(pg, cen.c);
      await clicar(pg,'p-gerar'); await pg.waitForTimeout(160);
      bloco = (await ler(pg,'p-out1')) || '';
      await pg.close();
    } finally { srvVelho.close(); }
    chk('a referencia '+REF+' gerou um codigo 1 (o bloco "de antes")', bloco.length>1000, String(bloco.length));
    const srv = await servirCom(RAIZ, 8847, {'/pagar-velha': paginaComBloco(bloco)});
    try{
      const base='http://127.0.0.1:8847';
      const pg = await abrir(br, base);
      await preparar(pg); await clicar(pg,'aba-cob');
      await cobranca(pg, {...cen.c, url: base+'/pagar-velha'});
      await cobrarNaPagina(pg, base, cen);
      await abrirPrevia(pg);
      await esperarQuadro(pg, 20000);
      const dentro = await textoDoQuadro(pg);
      chk('bloco desatualizado: o quadro carregou a pagina (ela existe e responde)', dentro.ok, dentro.txt);
      chk('bloco desatualizado: a previa mostra A RECUSA, e nao o cartao',
          dentro.ok && /não foi possível ler esta cobrança|link|cobran/i.test(dentro.txt),
          dentro.txt.slice(0,240));
      chk('bloco desatualizado: a previa NAO mostra o valor da cobranca',
          dentro.ok && dentro.txt.indexOf('1.200,50') < 0, dentro.txt.slice(0,240));
      chk('bloco desatualizado: a previa NAO mostra o codigo Pix',
          dentro.ok && dentro.txt.indexOf('Copiar') < 0, dentro.txt.slice(0,240));
      await pg.close();
    } finally { await br.close(); srv.close(); }
  }
  fs.rmSync(tmp,{recursive:true,force:true});
}

console.log('\n=== PARTE 5 -- sem rede: RECADO, nunca quadro branco ===');
{
  const cen = CENARIOS[0];
  const srv = await servirCom(RAIZ, 8848, {});
  const br = await navegador();
  try{
    const base='http://127.0.0.1:8848';
    const pg = await abrir(br, base);
    await preparar(pg); await clicar(pg,'aba-cob');
    await cobranca(pg, cen.c);
    await pg.goto(base + '/cobrar/index.html');
    /* navigator.onLine falso = certeza de que nao ha rede, que e o unico caso em que a pagina
       pode afirmar isso antes de tentar */
    await pg.evaluate(() => { Object.defineProperty(window.navigator,'onLine',{get:()=>false,configurable:true}); });
    await set(pg,'cb-desc', cen.c.desc); await set(pg,'cb-valor', cen.c.valor);
    await set(pg,'cb-txid', cen.c.txid);
    await clicar(pg,'cb-gerar'); await pg.waitForTimeout(200);
    await clicar(pg,'cb-previa-bt'); await pg.waitForTimeout(200);
    const r = await pg.evaluate(() => ({
      link: (document.getElementById('cb-out')||{}).value||'',
      temQuadro: !!document.querySelector('#cb-pv-quadro iframe'),
      recado: (document.querySelector('.cb-pv-recado')||{}).textContent||'',
      temTabela: ((document.getElementById('cb-pv-pp')||{}).textContent||'').length
    }));
    chk('sem rede, o LINK sai do mesmo jeito (ele nao depende de internet)', r.link.indexOf('?c=')>0, r.link.slice(0,60));
    chk('sem rede, NAO ha quadro branco', !r.temQuadro);
    chk('sem rede, ha um recado dizendo que e a conexao', /conex/i.test(r.recado), r.recado.slice(0,160));
    chk('sem rede, o recado diz que o link esta inteiro na caixa', /copiar|caixa acima/i.test(r.recado), r.recado.slice(0,160));
    chk('sem rede, a tabela do PayPal continua aparecendo (ela nao depende de rede)', r.temTabela > 80, String(r.temTabela));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

console.log('\n=== PARTE 6 -- a 375px a previa nao empurra o botao de gerar para fora ===');
{
  const cen = CENARIOS[0];
  const srv = await servirCom(RAIZ, 8849, {});
  const br = await navegador();
  try{
    const base='http://127.0.0.1:8849';
    const pg = await abrir(br, base);
    await pg.setViewportSize({width:375,height:812});
    await preparar(pg); await clicar(pg,'aba-cob');
    await cobranca(pg, cen.c);
    await pg.goto(base + '/cobrar/index.html');
    await set(pg,'cb-desc', cen.c.desc); await set(pg,'cb-valor', cen.c.valor);
    const antes = await pg.evaluate(() => {
      const b=document.getElementById('cb-gerar').getBoundingClientRect();
      return {topo:b.top+window.scrollY, largura:document.documentElement.scrollWidth};
    });
    await clicar(pg,'cb-gerar'); await pg.waitForTimeout(300);
    const depois = await pg.evaluate(() => {
      const b=document.getElementById('cb-gerar').getBoundingClientRect();
      const pv=document.getElementById('cb-previa').getBoundingClientRect();
      const sa=document.getElementById('cb-saida').getBoundingClientRect();
      return {topo:b.top+window.scrollY, previaTopo:pv.top+window.scrollY, saidaTopo:sa.top+window.scrollY,
              corpo:(document.getElementById('cb-previa-corpo')||{}).style.display,
              largura:document.documentElement.scrollWidth, janela:window.innerWidth};
    });
    chk('a previa nao moveu o botao "Gerar link" um pixel', antes.topo === depois.topo,
        antes.topo+' -> '+depois.topo);
    chk('a previa fica ABAIXO do botao e ABAIXO do link', depois.previaTopo > depois.topo
        && depois.previaTopo > depois.saidaTopo,
        'gerar='+depois.topo+' saida='+depois.saidaTopo+' previa='+depois.previaTopo);
    chk('a 375px a previa nasce RECOLHIDA', depois.corpo === 'none', String(depois.corpo));
    chk('a 375px a pagina continua sem rolagem lateral', depois.largura <= depois.janela,
        depois.largura+' > '+depois.janela);
    /* A TABELA DO PAYPAL CABE, e isto e medida e nao estimativa: as quatro colunas foram
       dimensionadas pelo nome de campo mais longo de cada uma, e o nome NAO pode quebrar --
       'quantit / y' deixa de ser o nome que o dono vai procurar no relatorio. */
    await pg.evaluate(() => { const c=document.getElementById('cb-previa-corpo');
      if(c && c.style.display==='none') document.getElementById('cb-previa-bt').click(); });
    await pg.waitForTimeout(200);
    const tab = await pg.evaluate(() => {
      const cx=document.getElementById('cb-pv-pp');
      const linhas=[...cx.querySelectorAll('.cb-pp-lin')];
      return {caixa:cx.clientWidth, maior:Math.max(...linhas.map(l=>l.scrollWidth)),
              celulas:linhas.reduce((m,l)=>Math.max(m,...[...l.children].map(c=>c.scrollWidth-c.clientWidth)),0)};
    });
    chk('a 375px a tabela do PayPal cabe na caixa, sem rolagem lateral',
        tab.maior <= tab.caixa, 'linha='+tab.maior+' caixa='+tab.caixa);
    chk('a 375px nenhum nome de campo fica cortado dentro da celula', tab.celulas <= 0, String(tab.celulas));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

console.log('\n=== PARTE 6b -- a 1440px a previa e uma COLUNA AO LADO, e nasce aberta ===');
{
  const cen = CENARIOS[0];
  const srv = await servirCom(RAIZ, 8850, {});
  const br = await navegador();
  try{
    const base='http://127.0.0.1:8850';
    const pg = await abrir(br, base);
    await pg.setViewportSize({width:1440,height:1000});
    await preparar(pg); await clicar(pg,'aba-cob');
    await cobranca(pg, cen.c);
    await pg.goto(base + '/cobrar/index.html');
    await set(pg,'cb-desc', cen.c.desc); await set(pg,'cb-valor', cen.c.valor);
    await clicar(pg,'cb-gerar'); await pg.waitForTimeout(300);
    const m = await pg.evaluate(() => {
      const f=document.getElementById('cb-form').getBoundingClientRect();
      const p=document.getElementById('cb-previa').getBoundingClientRect();
      return {formDir:f.right, previaEsq:p.left, previaLarg:p.width,
              corpo:(document.getElementById('cb-previa-corpo')||{}).style.display,
              grude:getComputedStyle(document.querySelector('.cb-col-v')).position,
              largura:document.documentElement.scrollWidth, janela:window.innerWidth};
    });
    chk('a previa fica A DIREITA do formulario, e nao embaixo', m.previaEsq >= m.formDir,
        'form termina em '+Math.round(m.formDir)+', previa comeca em '+Math.round(m.previaEsq));
    chk('a coluna da previa tem largura de verdade', m.previaLarg > 380, String(Math.round(m.previaLarg)));
    chk('na tela larga a previa nasce ABERTA (e para isso que a coluna existe)',
        m.corpo === 'block', String(m.corpo));
    chk('a coluna acompanha a rolagem (position:sticky)', m.grude === 'sticky', String(m.grude));
    chk('a 1440px a pagina continua sem rolagem lateral', m.largura <= m.janela, m.largura+' > '+m.janela);
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

console.log('\n=== PARTE 7 -- a entrada das Novidades desta rodada ===');
{
  const idx = fs.readFileSync(path.join(RAIZ,'index.html'),'utf8');
  const linha = (idx.split('\n').find(l => l.indexOf('{v:"2026-09-14g",') >= 0)) || '';
  chk('a versao 2026-09-14g tem entrada em FCR_NOTAS', !!linha);
  chk('a entrada fala da previa e do PayPal', /prévia/.test(linha) && /PayPal/.test(linha), linha.slice(0,120));
  chk('a entrada avisa que so este quadro precisa de internet', /internet/.test(linha));
  chk('a entrada avisa o que fazer com o bloco desatualizado', /Código 1/.test(linha));
}

process.exit(resumo());
