/* ============================================================================
   A ABA DO WHATSAPP SOBREVIVE A UMA NAVEGACAO IMEDIATA DA PROPRIA PAGINA?
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. O bloco do Checkout (e o da Mini loja) fazem, no
   mesmo clique, duas coisas que disputam o navegador: abrem a conversa do
   WhatsApp com window.open(url,'_blank') e, logo em seguida, mandam a PROPRIA
   pagina para outro endereco com location.href. Quem navega e a pagina que
   ABRIU a aba nova -- e a duvida, que ninguem media, e se a aba recem-aberta
   sobrevive a isso ou se o navegador a descarta junto com o documento que a
   pediu. Se ela for perdida, o cliente clica, ve a pagina trocar e o WhatsApp
   NUNCA abre: um pedido que se perde sem erro nenhum na tela, que e exatamente
   a classe de defeito silencioso que este projeto ja pagou caro para achar.
   Medir e barato; supor custa um pedido por vez.

   O QUE ELE MEDE. Seis cenarios, cada um numa passagem propria, em DUAS
   larguras (desktop 1280x800 e celular 390x844 com user agent de Android
   Chrome, isMobile e hasTouch -- o comportamento de aba nova nao e igual nos
   dois, e o cliente da Foto Certa compra no celular):

     1. so window.open (linha de base -- prova que o arnes mede o que diz)
     2. window.open + location.href IMEDIATO (a mesma volta do event loop)
     3. window.open + location.href dentro de setTimeout(...,0)
     4. window.open + location.href dentro de setTimeout(...,300)
     5. window.open + location.href dentro de setTimeout(...,1200)
     6. SEM window.open (nenhum zap configurado) + location.href imediato

   De cada passagem colhe: quantas abas o contexto tem no fim, a URL de cada
   aba nova, se a aba do "zap" chegou mesmo a CARREGAR (espera pelo load com
   prazo curto, e a falha da espera entra como DADO, nao como excecao), se a
   pagina original de fato navegou para o upsell, se o window.open devolveu
   referencia ou null, e qualquer erro de console/pageerror. Cada cenario roda
   TRES vezes: intermitencia aqui e dado, nao ruido -- corrida entre navegar e
   abrir pode dar resultados diferentes na mesma maquina.

   O QUE ELE NAO E. Nao usa o molde (pagina.mjs): o molde serve uma rota so
   (/pagina), e medir navegacao exige TRES enderecos de verdade na mesma
   origem. Entao este arquivo escreve index.html, zap.html e upsell.html numa
   pasta temporaria e sobe o servidor estatico de lib.mjs sobre ela. O bloco
   nao e gerado pela ferramenta: e uma imitacao minima e deliberada do que o
   bloco do Checkout faz hoje no clique -- o que esta sob medicao e o
   NAVEGADOR, nao o gerador.

   ESTE ARQUIVO NAO COMPARA COM REFERENCIA NENHUMA. Ele nao mede a arvore
   contra main, entao a regra do "prenda o commit / NAO MEDIU" da regressao
   byte a byte nao se aplica aqui -- nao procure por ela.

   Roda com:  node scripts/verificar/upsell-janela.mjs
   A pasta temporaria sai de FC_TMP, se estiver definida, senao de os.tmpdir().
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { navegador, servir } from './lib.mjs';
import { chk, resumo } from './pagina.mjs';

const PORTA0 = 8860;
const REPETICOES = 3;
const MARGEM_MS = 1500;   /* espera depois do clique, alem do atraso do cenario */
const PRAZO_LOAD = 2000;  /* espera pelo load da aba nova -- curto de proposito */

/* ---------------------------------------------------------------- as paginas */

const PAGINA_ZAP = '<!doctype html><html lang="pt-br"><head><meta charset="utf-8">'
  + '<title>Zap</title></head><body><div id="fcz-zap">ZAP CARREGOU</div></body></html>';

const PAGINA_UPSELL = '<!doctype html><html lang="pt-br"><head><meta charset="utf-8">'
  + '<title>Upsell</title></head><body><div id="fcz-upsell">UPSELL CARREGOU</div></body></html>';

/* A imitacao do que o bloco do Checkout faz no clique. De proposito minima: um
   div, um botao e um script em IIFE com addEventListener -- nada mais, para que
   o que se meca seja a decisao do navegador e nao um efeito colateral do bloco
   de verdade. O modo vem da consulta na URL, entao a MESMA pagina serve os seis
   cenarios e nenhum deles pode divergir do outro por um detalhe de montagem. */
const PAGINA_INDEX = [
'<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>Teste</title></head><body>',
'<div id="fcz-caixa">',
'  <div>Pagina que imita o clique do bloco do Checkout</div>',
'  <button type="button" id="fcz-botao">Confirmar pedido</button>',
'</div>',
'<scr'+'ipt>',
'(function(){',
'  var q = new URLSearchParams(location.search);',
'  var modo = q.get("modo") || "base";',
'  var ZAP = "zap.html";',
'  var UP  = "upsell.html";',
'  var bt = document.getElementById("fcz-botao");',
'  bt.addEventListener("click", function(){',
'    var ref = null;',
'    if(modo !== "sozinho") ref = window.open(ZAP, "_blank");',
'    console.log("FCZ ref=" + (ref ? "obj" : "null") + " modo=" + modo);',
'    if(modo === "base") return;',
'    if(modo === "imediato" || modo === "sozinho"){ location.href = UP; return; }',
'    var ms = Number(String(modo).replace("t","")) || 0;',
'    setTimeout(function(){ location.href = UP; }, ms);',
'  });',
'})();',
'</scr'+'ipt>',
'</body></html>'].join('\n');

/* ------------------------------------------------------------- os cenarios */

const CENARIOS = [
  {n:1, modo:'base',     rotulo:'so window.open (linha de base)',            atraso:0},
  {n:2, modo:'imediato', rotulo:'open + location.href imediato',             atraso:0},
  {n:3, modo:'t0',       rotulo:'open + location.href em setTimeout 0',      atraso:0},
  {n:4, modo:'t300',     rotulo:'open + location.href em setTimeout 300',    atraso:300},
  {n:5, modo:'t1200',    rotulo:'open + location.href em setTimeout 1200',   atraso:1200},
  {n:6, modo:'sozinho',  rotulo:'sem window.open + location.href imediato',  atraso:0}
];

const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const LARGURAS = [
  {id:'desktop', descr:'1280x800, sem emulacao de toque',
   ctx:{viewport:{width:1280, height:800}}},
  {id:'celular', descr:'390x844, isMobile+hasTouch, UA de Android Chrome',
   ctx:{viewport:{width:390, height:844}, isMobile:true, hasTouch:true, userAgent:UA_ANDROID}}
];

/* -------------------------------------------------------------- utilidades */

async function portaLivre(p0){
  for(let p = p0; p < p0 + 40; p++){
    const ok = await new Promise(r => {
      const s = http.createServer();
      s.once('error', () => r(false));
      s.once('listening', () => s.close(() => r(true)));
      s.listen(p);
    });
    if(ok) return p;
  }
  throw new Error('sem porta livre a partir de ' + p0);
}

const pad = (t, n) => { t = String(t); return t.length >= n ? t.slice(0, n) : t + ' '.repeat(n - t.length); };
const primeiraLinha = e => String((e && e.message) || e).split('\n')[0];

/* ------------------------------------------------------- uma passagem unica */

/* Cada passagem tem contexto PROPRIO. Nao e zelo: contexto reaproveitado
   carrega as abas da passagem anterior, e "quantas abas ficaram no fim" -- que
   e justamente o que se quer medir -- viraria a soma de todas as passagens. */
async function medirUma(br, base, cen, larg){
  const contexto = await br.newContext(larg.ctx);
  const vistas = [];
  contexto.on('page', p => vistas.push(p));
  const pg = await contexto.newPage();

  const erros = [], logs = [];
  pg.on('pageerror', e => erros.push('pageerror: ' + e.message));
  pg.on('console', m => {
    const t = m.text();
    if(m.type() === 'error') erros.push('console: ' + t);
    else if(t.indexOf('FCZ') === 0) logs.push(t);
  });

  let falhaClique = '';
  try{
    await pg.goto(base + '/index.html?modo=' + cen.modo, {waitUntil:'load'});
    /* Clique de VERDADE (mouse), nunca dispatchEvent: sem gesto do usuario o
       proprio navegador barraria o window.open como popup, e o que se mediria
       seria o bloqueador, nao a corrida. noWaitAfter porque o clique pode, ele
       proprio, iniciar a navegacao -- esperar por ela aqui transformaria o
       comportamento sob teste em erro do arnes. */
    await pg.click('#fcz-botao', {timeout:5000, noWaitAfter:true});
  }catch(e){ falhaClique = primeiraLinha(e); }

  try{ await pg.waitForTimeout(cen.atraso + MARGEM_MS); }catch(e){}

  const popups = vistas.filter(p => p !== pg);
  const dados = [];
  for(const p of popups){
    let url = '', carregou = false, motivo = '';
    try{
      await p.waitForLoadState('load', {timeout:PRAZO_LOAD});
      carregou = await p.evaluate(() => !!document.getElementById('fcz-zap')).catch(() => false);
    }catch(e){ motivo = primeiraLinha(e); }
    try{ url = p.url(); }catch(e){ url = '(url indisponivel)'; }
    dados.push({url, carregou, fechada:p.isClosed(), motivo});
  }

  let urlFinal = '';
  try{ urlFinal = pg.url(); }catch(e){ urlFinal = '(url indisponivel)'; }
  const abasFim = contexto.pages().length;
  await contexto.close();

  return {
    abasFim, popups:dados, urlFinal,
    navegou: urlFinal.indexOf('upsell.html') >= 0,
    refAberta: logs.join(' ').indexOf('ref=obj') >= 0,
    logs, erros, falhaClique
  };
}

/* A ASSINATURA e o que define "estavel": duas passagens sao o mesmo resultado
   quando batem em tudo que este teste afirma. Comparar objeto inteiro acusaria
   diferenca em detalhe irrelevante (o texto de um prazo estourado); comparar
   so a contagem de abas esconderia uma aba que abriu e nao carregou. */
const curto = (u, base) => String(u).replace(base + '/', '').replace(base, '') || '(vazia)';
function assinar(r, base){
  return [
    'abas=' + r.abasFim,
    'novas=[' + r.popups.map(d => curto(d.url, base) + (d.carregou ? ':carregou' : ':nao') + (d.fechada ? ':fechada' : '')).join(' ') + ']',
    r.navegou ? 'original=upsell' : 'original=ficou',
    r.refAberta ? 'ref=obj' : 'ref=null'
  ].join(' ');
}

/* ------------------------------------------------------------------ o corpo */

const RAIZ_TMP = path.resolve(process.env.FC_TMP || path.join(os.tmpdir(), 'fc-upsell-janela'));
fs.mkdirSync(RAIZ_TMP, {recursive:true});
fs.writeFileSync(path.join(RAIZ_TMP, 'index.html'), PAGINA_INDEX);
fs.writeFileSync(path.join(RAIZ_TMP, 'zap.html'), PAGINA_ZAP);
fs.writeFileSync(path.join(RAIZ_TMP, 'upsell.html'), PAGINA_UPSELL);

const PORTA = await portaLivre(PORTA0);
const base = 'http://127.0.0.1:' + PORTA;

console.log('Pasta das paginas de teste: ' + RAIZ_TMP);
console.log('Servidor: ' + base + '   (index.html / zap.html / upsell.html)');
console.log('Repeticoes por cenario: ' + REPETICOES + '\n');

const srv = await servir(RAIZ_TMP, PORTA);
const br = await navegador();
const linhas = [];
let saida = 0;

try{
  for(const larg of LARGURAS){
    console.log('=============================================================');
    console.log('LARGURA: ' + larg.id + '  (' + larg.descr + ')');
    console.log('=============================================================');
    for(const cen of CENARIOS){
      const rs = [];
      for(let i = 0; i < REPETICOES; i++) rs.push(await medirUma(br, base, cen, larg));
      const ass = rs.map(r => assinar(r, base));
      const estavel = ass.every(a => a === ass[0]);
      const r0 = rs[0];

      console.log('\n  Cenario ' + cen.n + ': ' + cen.rotulo);
      for(let i = 0; i < rs.length; i++) console.log('    passagem ' + (i+1) + ': ' + ass[i]);
      if(!estavel) console.log('    >>> INTERMITENTE: as passagens nao bateram entre si.');
      for(const r of rs){
        if(r.falhaClique) console.log('    (clique) ' + r.falhaClique);
        for(const d of r.popups) if(d.motivo) console.log('    (aba nova) espera pelo load falhou: ' + d.motivo);
        for(const e of r.erros) console.log('    (erro) ' + e);
      }

      const todasCarregaram = rs.every(r => r.popups.length > 0 && r.popups.every(d => d.carregou));
      const nenhumaAba = rs.every(r => r.popups.length === 0);
      linhas.push({
        cen, largura:larg.id,
        abas: rs.map(r => r.abasFim).join('/'),
        url: r0.popups.length ? curto(r0.popups[0].url, base) : '(nenhuma)',
        zap: nenhumaAba ? '-' : (todasCarregaram ? 'sim' : (rs.some(r => r.popups.some(d => d.carregou)) ? 'as vezes' : 'nao')),
        navegou: rs.every(r => r.navegou) ? 'sim' : (rs.some(r => r.navegou) ? 'as vezes' : 'nao'),
        estavel: estavel ? 'sim' : 'NAO',
        erros: rs.reduce((a,r) => a + r.erros.length, 0)
      });

      /* SANIDADE DO ARNES -- e so isso que vira falha. Aba perdida num cenario e
         RESULTADO, nao defeito do teste; quem decide o que fazer com ela e quem
         le a tabela. O que nao pode e o arnes nao medir o que diz que mede. */
      if(cen.modo === 'base'){
        chk(larg.id + ' / linha de base: a aba nova abriu nas ' + REPETICOES + ' passagens',
          rs.every(r => r.popups.length === 1), ass.join(' || '));
        chk(larg.id + ' / linha de base: a aba nova carregou o zap.html',
          todasCarregaram, ass.join(' || '));
        chk(larg.id + ' / linha de base: a original NAO navegou',
          rs.every(r => !r.navegou), ass.join(' || '));
      }
      if(cen.modo === 'sozinho'){
        chk(larg.id + ' / sem window.open: nenhuma aba nova',
          nenhumaAba, ass.join(' || '));
        chk(larg.id + ' / sem window.open: a original navegou para o upsell',
          rs.every(r => r.navegou), ass.join(' || '));
      }
      chk(larg.id + ' / cenario ' + cen.n + ': sem erro de console ou pageerror',
        rs.every(r => r.erros.length === 0), rs.map(r => r.erros.join(' | ')).join(' || '));
    }
    console.log('');
  }

  /* ------------------------------------------------------------- a tabela */
  console.log('\n=============================================================');
  console.log('TABELA FINAL');
  console.log('=============================================================');
  const cab = pad('Cenario', 47) + pad('Largura', 9) + pad('Abas fim', 10)
    + pad('URL da aba nova', 18) + pad('Zap carregou', 14) + pad('Original navegou', 18) + 'Estavel';
  console.log(cab);
  console.log('-'.repeat(cab.length));
  for(const l of linhas){
    console.log(pad(l.cen.n + '. ' + l.cen.rotulo, 47) + pad(l.largura, 9) + pad(l.abas, 10)
      + pad(l.url, 18) + pad(l.zap, 14) + pad(l.navegou, 18) + l.estavel);
  }
  console.log('\nAbas fim: uma contagem por passagem (as ' + REPETICOES + '), separadas por barra.');
  console.log('Zap carregou: "-" quando o cenario nem tenta abrir aba.');

  const instaveis = linhas.filter(l => l.estavel === 'NAO');
  console.log('\nIntermitencia: ' + (instaveis.length === 0 ? 'nenhuma -- os '
    + linhas.length + ' pares cenario/largura deram o mesmo resultado nas ' + REPETICOES + ' passagens.'
    : instaveis.map(l => 'cenario ' + l.cen.n + ' / ' + l.largura).join(', ')));

  saida = resumo();
} finally {
  await br.close();
  await new Promise(r => srv.close(r));
}
process.exit(saida);
