/* ============================================================================
   ITENS COM SKU E UPSELL POR COBRANCA, NO LINK -- a leva 10
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE, e por que ele e irmao de sinal-cobranca.mjs. As
   duas partes desta rodada acrescentam PARAMETRO ao link, e tudo que viaja no
   link entra no SELO. Selo e contagem: um item novo na conta de TODO link
   derrubaria, de uma vez, toda cobranca ja enviada.

   O dono informou que nao tem link pendente de pagamento. Isso NAO dispensa o
   padrao condicional -- o motivo dele apenas mudou: deixou de ser "nao quebrar
   o que ja foi enviado" e passou a ser "permitir que o PROXIMO parametro entre
   sem quebrar nada", e no dia do proximo pode haver cobranca em aberto. Entao a
   regra continua: i e u entram na conta SO QUANDO VEM PREENCHIDOS, e depois de
   t/x/n. Dela saem as duas consequencias de sinais opostos que este arquivo
   mede:

     1. link SEM item e SEM upsell (todos os formatos de hoje) sela exatamente
        como antes, e o bloco novo os aceita. ESTA E A PROVA QUE MANDA.
     2. link COM item ou COM upsell e RECUSADO pelo bloco de hoje, que conta ate
        o n e ignora os dois. E comportamento correto, e esta suite o MEDE em
        vez de supor -- o aviso ao dono ("regere e recole o codigo 1, uma vez
        so") precisa ser verdade medida.

   O PAR i/u, e por que ele nao e enfeite. Com serializacao por comprimento,
   empurrar so o que vem preenchido faria "i sem u" e "u sem i" produzirem a
   MESMA lista no selo -- e um link com itens poderia ser re-selado como um link
   com upsell, com a conta fechando. E o mesmo motivo medido que fez t e x
   entrarem juntos. A parte 3 forja exatamente essa troca e exige recusa.

   A SEGUNDA OPINIAO E ESCRITA AQUI DENTRO, sempre: o leitor TLV do BR Code, o
   CRC16 (do polinomio), a conta do SELO e o leitor do parametro i sao
   reescritos neste arquivo, a partir da regra -- nunca importados do projeto.
   Um teste que confere o projeto com uma funcao do projeto nao tem opiniao
   nenhuma. E e essa segunda opiniao que permite FORJAR links que o gerador se
   recusa a produzir (itens que nao somam, i junto de n, i trocado por u) e
   provar que as guardas do bloco sao alcancaveis.

   Roda com:  node scripts/verificar/itens-upsell.mjs [referencia]
   A referencia PADRAO e 6136504 -- o commit em que 'main' estava quando esta
   rodada comecou, que e o estado "a versao de hoje" que o dono tem publicado.
   Ela e PRESA a um commit de proposito (regra de 13/09/2026): "antes" e estado
   historico, nao "o que estiver em main hoje". No dia em que esta rodada for
   mesclada, uma referencia igual a 'main' passaria a medir a si mesma, e as
   partes 1 e 2 acusariam sem defeito nenhum por tras. Por isso a suite DETECTA
   o envelhecimento -- le do proprio index.html da referencia se ele ja conhece
   os campos desta rodada -- e diz NAO MEDIU, com a linha de comando que mediria
   de verdade, em vez de falhar.
   ============================================================================ */
import { comBlocoNaPagina, chk, resumo } from './pagina.mjs';
import { navegador, servir, abrir, set, radio, clicar, ler, alertas } from './lib.mjs';
import { preparar, cobranca } from './cenario.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || '6136504';

/* ===========================================================================
   A SEGUNDA OPINIAO: CRC16, selo, TLV e o leitor do parametro i
   =========================================================================== */
function crc16Teste(bytes){
  let crc = 0xFFFF;
  for(let i = 0; i < bytes.length; i++){
    crc ^= (bytes.charCodeAt(i) & 0xFF) << 8;
    for(let b = 0; b < 8; b++)
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
  }
  return ('000' + crc.toString(16).toUpperCase()).slice(-4);
}
function seloBytesTeste(s){
  let o = '';
  for(let i = 0; i < s.length; i++){
    const c = s.charCodeAt(i);
    o += String.fromCharCode((c >> 8) & 255, c & 255);
  }
  return o;
}
/* A REGRA DA CONTA, transcrita com os NOVE: os quatro de sempre; t e x juntos,
   se um dos dois vier; n sozinho, se vier; i e u JUNTOS, se um dos dois vier. */
function seloTeste(c, d, pp, v, t, x, n, i, u){
  const ps = [c, d, pp, v];
  const a = String(t == null ? '' : t), b = String(x == null ? '' : x), g = String(n == null ? '' : n);
  const h = String(i == null ? '' : i), k = String(u == null ? '' : u);
  if(a !== '' || b !== ''){ ps.push(a); ps.push(b); }
  if(g !== '') ps.push(g);
  if(h !== '' || k !== ''){ ps.push(h); ps.push(k); }
  let s = '';
  for(let j = 0; j < ps.length; j++){
    const e = String(ps[j] == null ? '' : ps[j]);
    s += e.length + ':' + e + '|';
  }
  return crc16Teste(seloBytesTeste(s));
}
/* Leitor TLV do BR Code: id de 2, tamanho de 2, valor. Campo 54 = o valor. */
function pixTeste(codigo){
  const crcDito = codigo.slice(-4);
  const crcFeito = crc16Teste(codigo.slice(0, -4));
  const campos = {};
  let i = 0;
  while(i + 4 <= codigo.length){
    const id = codigo.substr(i, 2);
    const n = parseInt(codigo.substr(i + 2, 2), 10);
    if(!isFinite(n)) return { ok:false, erro:'tamanho ilegivel em ' + i };
    campos[id] = codigo.substr(i + 4, n);
    i += 4 + n;
  }
  return { ok: crcDito === crcFeito, crcDito, crcFeito, valor: campos['54'], txid: campos['62'], campos };
}
/* O leitor do parametro i, transcrito: tamanho, ponto, valor -- tres vezes por
   item. Escrito aqui para a suite poder DISCORDAR do projeto. */
function itensLerTeste(s){
  s = String(s || '');
  const out = [];
  let i = 0;
  if(!s) return out;
  while(i < s.length){
    const campos = [];
    for(let k = 0; k < 3; k++){
      const p = s.indexOf('.', i);
      if(p < 0 || p === i) return null;
      const d = s.substring(i, p);
      if(!/^[0-9]{1,3}$/.test(d)) return null;
      const n = parseInt(d, 10);
      if(p + 1 + n > s.length) return null;
      campos.push(s.substr(p + 1, n));
      i = p + 1 + n;
    }
    if(!campos[0]) return null;
    if(!/^[0-9]{1,10}\.[0-9]{2}$/.test(campos[2])) return null;
    out.push({ nome:campos[0], sku:campos[1], unit:parseFloat(campos[2]) });
  }
  return out;
}
/* O ESCRITOR, tambem transcrito -- e o que permite forjar listas que o gerador
   nunca produziria (soma que nao bate, item de nome vazio, lista longa demais). */
const peca = s => String(s == null ? '' : s).length + '.' + String(s == null ? '' : s);
const itensCodTeste = li => li.map(x => peca(x.nome) + peca(x.sku) + peca(x.unit.toFixed(2))).join('');

/* ===========================================================================
   O ENDERECO: pecas soltas, para adulterar sem reescrever a montagem
   =========================================================================== */
const pares = q => q.replace(/^\?/, '').split('&').map(p => {
  const i = p.indexOf('=');
  return [p.slice(0, i), p.slice(i + 1)];
});
const monta = ps => '?' + ps.map(([k, v]) => k + '=' + v).join('&');
const pegar = (q, k) => { const p = pares(q).find(x => x[0] === k); return p ? p[1] : null; };
const temChave = (q, k) => pares(q).some(x => x[0] === k);
function trocarP(q, k, v){
  const ps = pares(q), p = ps.find(x => x[0] === k);
  if(!p) throw new Error('sem parametro ' + k + ' em ' + q);
  p[1] = v; return monta(ps);
}
const apagarP = (q, k) => monta(pares(q).filter(x => x[0] !== k));
function renomearP(q, de, para){
  const ps = pares(q), p = ps.find(x => x[0] === de);
  if(!p) throw new Error('sem parametro ' + de);
  p[0] = para; return monta(ps);
}
function porAntesDoSelo(q, k, v){
  const ps = pares(q), i = ps.findIndex(x => x[0] === 's');
  ps.splice(i < 0 ? ps.length : i, 0, [k, v]);
  return monta(ps);
}
function busca(link){
  const s = String(link || '');
  if(s.indexOf('?') < 0) throw new Error('link vazio ou sem consulta: ' + JSON.stringify(s));
  return s.slice(s.indexOf('?'));
}
const dec = s => { try{ return decodeURIComponent(String(s).replace(/\+/g, ' ')); }catch(e){ return ''; } };
const brl = v => 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* ===========================================================================
   O CATALOGO
   =========================================================================== */
/* Os formatos que o dono JA MANDA hoje -- nenhum tem item nem upsell. */
const FORMATOS = [
  { n:'F1 simples',        c:{ descpix:'' } },
  { n:'F2 identificador',  c:{ descpix:'0', txid:'ENSAIO2026' } },
  { n:'F3 validade',       c:{ descpix:'0', validade:'2099-12-30' } },
  { n:'F4 PayPal link',    c:{ descpix:'0', ppmodo:'link', pplink:'https://www.paypal.com/ncp/payment/ABC12345' } },
  { n:'F5 sem PayPal',     c:{ descpix:'0', ppmodo:'nao' } },
  { n:'F6 desconto 10%',   c:{ descpix:'10', valor:'450,00' } },
  { n:'F7 tudo junto',     c:{ descpix:'10', valor:'450,00', txid:'ENSAIO2026', validade:'2099-12-30' } },
  { n:'F8 acentos',        c:{ descpix:'0', desc:'Álbum 30x30 & moldura "grande" <ok> 100%', valor:'999999,99' } }
];

/* As cobrancas DESTA RODADA. A soma dos itens bate com o valor em todas -- e
   condicao de geracao, e cada linha diz qual caminho ela exercita. */
const UPS = 'https://www.fotocerta.com.br/oferta-de-natal';
const NOVAS = [
  { n:'I1 dois itens',        c:{ valor:'1200,50' },
    itens:'Ensaio de gestante | ENS01 | 900,00\nÁlbum 20x20 | ALB20 | 300,50' },
  { n:'I2 item sem SKU',      c:{ valor:'420,00' },
    itens:'Ensaio mini | 420,00' },
  { n:'I3 item com acento e simbolo', c:{ valor:'1000,00' },
    itens:'Álbum "grande" & moldura <ok> 100% | ALB-Ç1 | 700,00\nFoto extra | | 300,00' },
  { n:'I4 cinco itens',       c:{ valor:'1500,00' },
    itens:'Item um | A1 | 300,00\nItem dois | A2 | 300,00\nItem tres | A3 | 300,00\nItem quatro | A4 | 300,00\nItem cinco | A5 | 300,00' },
  { n:'I5 itens com desconto no Pix', c:{ valor:'1000,00', descpix:'10' },
    itens:'Ensaio | ENS | 700,00\nAlbum | ALB | 300,00' },
  { n:'U1 so upsell',         c:{ valor:'1200,50' }, ups:UPS },
  { n:'U2 upsell ancora',     c:{ valor:'1200,50' }, ups:'#oferta' },
  { n:'U3 upsell caminho',    c:{ valor:'1200,50' }, ups:'/oferta-especial' },
  { n:'IU1 itens e upsell',   c:{ valor:'1200,50' },
    itens:'Ensaio de gestante | ENS01 | 900,00\nÁlbum 20x20 | ALB20 | 300,50', ups:UPS },
  { n:'IU2 tudo junto',       c:{ valor:'450,00', descpix:'10', txid:'ENSAIO2026', validade:'2099-12-30' },
    itens:'Ensaio | ENS | 300,00\nExtra | EXT | 150,00', ups:UPS }
];

/* ===========================================================================
   COLHER: os links e o bloco de uma arvore
   =========================================================================== */
async function preencherNovos(pg, cen){
  if(cen.itens !== undefined) await set(pg, 'p-itens', cen.itens);
  if(cen.ups !== undefined) await set(pg, 'p-upsellcob', cen.ups);
}
async function colher(raiz, porta, cenarios, temNovos){
  const srv = await servir(raiz, porta);
  const br = await navegador();
  const base = 'http://127.0.0.1:' + porta;
  const out = { links:{}, alertas:{}, erros:[] };
  try{
    for(const cen of cenarios){
      const pg = await abrir(br, base);
      await preparar(pg);
      await clicar(pg, 'aba-cob');
      await cobranca(pg, cen.c);
      if(cen.itens !== undefined || cen.ups !== undefined){
        if(!temNovos){ await pg.close(); continue; }
        await preencherNovos(pg, cen);
      }
      await clicar(pg, 'p-gerarlink');
      await pg.waitForTimeout(140);
      out.links[cen.n] = (await ler(pg, 'p-out2')) || '';
      out.alertas[cen.n] = await alertas(pg);
      out.erros.push(...pg.erros);
      await pg.close();
    }
    const pg = await abrir(br, base);
    await preparar(pg);
    await clicar(pg, 'aba-cob');
    await cobranca(pg, {});
    await clicar(pg, 'p-gerar');
    await pg.waitForTimeout(100);
    out.bloco = (await ler(pg, 'p-out1')) || '';
    out.alertasBloco = await alertas(pg);
    /* O MESMO bloco, agora com itens e upsell preenchidos NA ABA. Ele tem de sair
       IDENTICO: as duas coisas sao desta COBRANCA, e a maquinaria entra sempre. E
       o que sustenta o 'naoEmite' -- se o bloco mudasse, o painel consolidado
       passaria a avisar "o codigo e mais velho que a aba" a cada item digitado. */
    if(temNovos){
      await set(pg, 'p-itens', 'Ensaio | ENS | 1200,50');
      await set(pg, 'p-upsellcob', UPS);
      await clicar(pg, 'p-gerar');
      await pg.waitForTimeout(100);
      out.blocoComNovos = (await ler(pg, 'p-out1')) || '';
    }
    out.erros.push(...pg.erros);
    await pg.close();
  } finally {
    await br.close();
    srv.close();
  }
  return out;
}

/* ===========================================================================
   RODAR UM LINK NUM BLOCO
   =========================================================================== */
const SONDA_PP = '<scr' + 'ipt>(function(){\n' +
  'window.__ppOpts=null;\n' +
  'window.paypal={Buttons:function(o){window.__ppOpts=o;return {render:function(){}};}};\n' +
  'var orig=document.head.appendChild.bind(document.head);\n' +
  'document.head.appendChild=function(el){\n' +
  '  if(el&&el.tagName==="SCRIPT"&&String(el.src||"").indexOf("paypal.com")>=0){\n' +
  '    setTimeout(function(){try{if(el.onload)el.onload();}catch(e){}},0);return el;\n' +
  '  }\n' +
  '  return orig(el);\n' +
  '};\n' +
  '})();</scr' + 'ipt>';

let PORTA_PAGINA = 8870;
function proximaPorta(){
  PORTA_PAGINA = PORTA_PAGINA + 1 > 8960 ? 8871 : PORTA_PAGINA + 1;
  return PORTA_PAGINA;
}
async function rodar(bloco, q, porta){
  return await comBlocoNaPagina({
    bloco, busca: q, corpoAntes: SONDA_PP, porta: porta || proximaPorta(),
    medir: async pg => {
      await pg.waitForTimeout(60);
      return await pg.evaluate(() => {
        const q1 = s => document.querySelector(s);
        const t = e => (e ? e.textContent : null);
        let pp = null;
        try{
          if(window.__ppOpts && window.__ppOpts.createOrder){
            const ped = window.__ppOpts.createOrder(null, { order: { create: o => o } });
            pp = ped.purchase_units[0];
          }
        }catch(e){ pp = { erro: String(e && e.message) }; }
        const zap = q1('#fcpg-caixa a[href*="wa.me"]');
        return {
          recado: t(q1('.fcpg-recado')),
          valorRot: t(q1('.fcpg-valor-rot')),
          valor: t(q1('.fcpg-valor')),
          pixlinha: t(q1('.fcpg-pixlinha')),
          sinal: t(q1('.fcpg-sinal')),
          itens: Array.prototype.map.call(document.querySelectorAll('.fcpg-item'), e => e.textContent),
          nItens: document.querySelectorAll('.fcpg-item').length,
          codigo: q1('.fcpg-cod') ? q1('.fcpg-cod').value : null,
          zapHref: zap ? zap.getAttribute('href') : null,
          ppErro: pp && pp.erro ? pp.erro : null,
          ppValor: pp && pp.amount ? pp.amount.value : null,
          ppBreakItem: pp && pp.amount && pp.amount.breakdown && pp.amount.breakdown.item_total
            ? pp.amount.breakdown.item_total.value : null,
          ppBreakDesc: pp && pp.amount && pp.amount.breakdown && pp.amount.breakdown.discount
            ? pp.amount.breakdown.discount.value : null,
          ppItens: pp && pp.items ? pp.items.map(x => ({ nome:x.name, sku:x.sku || '', qtd:x.quantity, unit:x.unit_amount.value })) : null,
          ppDesc: pp ? pp.description : null
        };
      });
    }
  });
}
const errosReais = e => (e || []).filter(x => !/cdnjs|ERR_FAILED|Failed to load resource/i.test(x));
const recusou = d => !!d.recado && !d.valor;
const aceitou = d => !d.recado && !!d.valor;

async function esperarUrl(pg, marca, ms){
  const t0 = Date.now();
  while(Date.now() - t0 < ms){
    if(pg.url().indexOf(marca) >= 0) return true;
    await pg.waitForTimeout(60);
  }
  return pg.url().indexOf(marca) >= 0;
}

/* ===========================================================================
   A BATERIA
   =========================================================================== */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-itens-upsell-'));
process.on('exit', () => { try{ fs.rmSync(tmp, { recursive:true, force:true }); }catch(e){} });

try{
  execSync('git -C "' + RAIZ + '" rev-parse --verify ' + REF, { stdio:'ignore' });
}catch(e){
  console.log('NAO MEDIU: a referencia "' + REF + '" nao existe neste repositorio.');
  process.exit(2);
}
execSync('git -C "' + RAIZ + '" archive ' + REF + ' | tar -x -C "' + tmp + '"', { shell:'/bin/sh' });
console.log('referencia (a "versao de hoje"): ' + REF + ' ' +
  execSync('git -C "' + RAIZ + '" rev-parse --short ' + REF).toString().trim());

/* A DETECCAO DO ENVELHECIMENTO, lida do PROPRIO arquivo da referencia: o campo
   'p-itens' so existe a partir desta rodada. */
const refTemNovos = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8').indexOf('p-itens') >= 0;
if(refTemNovos){
  console.log('\nAVISO: a referencia JA conhece os itens no link. As partes 1 e 2 medem a');
  console.log('       travessia de versoes e so significam algo contra uma referencia ANTERIOR.');
  console.log('       Elas dizem NAO MEDIU em vez de falhar. Para medir de verdade:');
  console.log('           node scripts/verificar/itens-upsell.mjs 6136504');
}

console.log('\ncolhendo da REFERENCIA (os links que o dono manda hoje)...');
const ref = await colher(tmp, 8821, FORMATOS, false);
console.log('colhendo da ARVORE DE TRABALHO...');
const novo = await colher(RAIZ, 8822, FORMATOS.concat(NOVAS), true);

console.log('');
chk('  a REFERENCIA gerou o bloco', (ref.bloco || '').length > 1000, 'bytes=' + (ref.bloco || '').length);
chk('  a ARVORE gerou o bloco', (novo.bloco || '').length > 1000, 'bytes=' + (novo.bloco || '').length);
for(const cen of FORMATOS)
  chk('  a REFERENCIA gerou o link ' + cen.n, (ref.links[cen.n] || '').indexOf('?c=') > 0,
      (ref.alertas[cen.n] || []).join(' | ').slice(0, 110));
for(const cen of FORMATOS.concat(NOVAS))
  chk('  a ARVORE gerou o link ' + cen.n, (novo.links[cen.n] || '').indexOf('?c=') > 0,
      (novo.alertas[cen.n] || []).join(' | ').slice(0, 110));
if((novo.bloco || '').length < 1000 || (ref.bloco || '').length < 1000 ||
   FORMATOS.concat(NOVAS).some(c => (novo.links[c.n] || '').indexOf('?c=') < 0)){
  console.log('\nPAROU: sem bloco ou sem link nao ha o que medir, e medir assim mesmo daria verde falso.');
  process.exit(resumo() || 1);
}

console.log('\n=== PARTE 1 -- A PROVA QUE MANDA: o bloco NOVO aceita os links de HOJE ===');
for(const f of FORMATOS){
  const tag = '  [' + f.n + '] ';
  const q = busca(ref.links[f.n] || '');
  chk(tag + 'o link de hoje NAO tem i nem u', !temChave(q, 'i') && !temChave(q, 'u'));
  const dNovo = await rodar(novo.bloco, q);
  const dRef  = await rodar(ref.bloco, q);
  chk(tag + 'o bloco NOVO aceita e desenha o cartao', aceitou(dNovo), 'recado=' + String(dNovo.recado).slice(0, 60));
  chk(tag + 'o bloco de hoje tambem aceita (controle)', aceitou(dRef), 'recado=' + String(dRef.recado).slice(0, 60));
  chk(tag + 'MESMO valor na tela, nos dois blocos', dNovo.valor === dRef.valor,
      'novo=' + dNovo.valor + ' ref=' + dRef.valor);
  chk(tag + 'MESMO rotulo e MESMA linha do Pix',
      dNovo.valorRot === dRef.valorRot && dNovo.pixlinha === dRef.pixlinha,
      'novo=' + dNovo.valorRot + '/' + dNovo.pixlinha + ' ref=' + dRef.valorRot + '/' + dRef.pixlinha);
  chk(tag + 'nenhuma linha de item apareceu num link sem itens', dNovo.nItens === 0, 'itens=' + dNovo.nItens);
  const pix = pixTeste(dec(pegar(q, 'c')));
  chk(tag + 'o codigo Pix fecha o proprio CRC', pix.ok, pix.crcDito + ' != ' + pix.crcFeito);
  chk(tag + 'o campo 54 e o mesmo que o bloco novo copia na tela',
      dNovo.codigo === dec(pegar(q, 'c')), 'campo 54 = ' + pix.valor);
  chk(tag + 'o selo do link de hoje bate com a conta transcrita neste teste',
      seloTeste(dec(pegar(q, 'c')), dec(pegar(q, 'd')), dec(pegar(q, 'pp') || ''), dec(pegar(q, 'v') || ''),
                dec(pegar(q, 't') || ''), dec(pegar(q, 'x') || ''), '', '', '') === pegar(q, 's'),
      'selo no link = ' + pegar(q, 's'));
  chk(tag + 'sem erro de console no bloco novo', errosReais(dNovo.erros).length === 0,
      errosReais(dNovo.erros).slice(0, 1).join(''));
}

console.log('\n=== PARTE 2 -- o caminho inverso, declarado: link COM item ou COM upsell e recusado pelo bloco de hoje ===');
for(const cen of [NOVAS[0], NOVAS[5], NOVAS[8]]){
  const tag = '  [' + cen.n + '] ';
  const q = busca(novo.links[cen.n] || '');
  if(refTemNovos){
    console.log(tag + 'NAO MEDIU a recusa: a referencia ja conhece os parametros novos.');
  }else{
    const dRef = await rodar(ref.bloco, q);
    chk(tag + 'o bloco de HOJE recusa o link novo', recusou(dRef), 'mostrou valor=' + dRef.valor);
  }
  const dNovo = await rodar(novo.bloco, q);
  chk(tag + 'o bloco NOVO aceita o mesmo link', aceitou(dNovo), 'recado=' + String(dNovo.recado).slice(0, 60));
}

console.log('\n=== PARTE 3 -- as adulteracoes sobre um link COM itens e COM upsell ===');
{
  const q = busca(novo.links['IU2 tudo junto'] || '');
  const codigo = dec(pegar(q, 'c'));
  const torcido = codigo.replace(/[0-9](?=[^0-9]*$)/, d => (d === '9' ? '8' : String(Number(d) + 1)));
  const iOriginal = dec(pegar(q, 'i'));
  const li = itensLerTeste(iOriginal);
  chk('  o leitor transcrito neste teste entende o i do link', !!li && li.length === 2,
      'i = ' + iOriginal);
  /* FORJADO 1: itens que somam OUTRA coisa, selados pela conta transcrita aqui.
     O gerador nunca produz isto (ele recusa antes), e sem forjar a guarda da soma
     dentro do bloco seria inalcancavel. */
  const iErrado = itensCodTeste([{nome:'Ensaio', sku:'ENS', unit:300}, {nome:'Extra', sku:'EXT', unit:100}]);
  const forjado1 = (() => {
    const ps = pares(trocarP(q, 'i', encodeURIComponent(iErrado)));
    const sel = ps.find(x => x[0] === 's');
    sel[1] = seloTeste(codigo, dec(pegar(q, 'd')), dec(pegar(q, 'pp') || ''), dec(pegar(q, 'v') || ''),
                       dec(pegar(q, 't') || ''), dec(pegar(q, 'x') || ''), '', iErrado, dec(pegar(q, 'u')));
    return monta(ps);
  })();
  const oito = [
    ['i trocado (sem re-selar)',  trocarP(q, 'i', encodeURIComponent(iErrado))],
    ['i apagado',                 apagarP(q, 'i')],
    ['u trocado por outro site',  trocarP(q, 'u', encodeURIComponent('https://evil.exemplo.com/x'))],
    ['u apagado',                 apagarP(q, 'u')],
    ['i renomeado para u',        renomearP(apagarP(q, 'u'), 'i', 'u')],
    ['selo apagado',              apagarP(q, 's')],
    ['digito do codigo Pix',      trocarP(q, 'c', encodeURIComponent(torcido))],
    ['n acrescentado',            porAntesDoSelo(q, 'n', '450.00')],
    ['FORJADO: itens que somam outra coisa, RE-SELADOS', forjado1]
  ];
  for(const [nome, qa] of oito){
    const d = await rodar(novo.bloco, qa);
    chk('  [itens+upsell] ' + nome + ' -> RECUSADO', recusou(d), 'mostrou ' + d.valor + ' / itens=' + d.nItens);
  }
  /* FORJADO 2: i junto de n. Nenhum gerador o produz -- a ferramenta recusa itens
     com sinal --, e o bloco tem de recusar tambem. Montado sobre um link COM SINAL
     de verdade, para o codigo Pix continuar fechando. */
}
{
  const srv = await servir(RAIZ, 8823);
  const br = await navegador();
  let linkSinal = '';
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8823');
    await preparar(pg); await clicar(pg, 'aba-cob');
    await cobranca(pg, { valor:'1200,50' });
    await radio(pg, 'p-sinal', 'sim'); await radio(pg, 'p-sinaltipo', 'pct'); await set(pg, 'p-sinalpct', '30');
    await clicar(pg, 'p-gerarlink'); await pg.waitForTimeout(140);
    linkSinal = (await ler(pg, 'p-out2')) || '';
    await pg.close();
  } finally { await br.close(); srv.close(); }
  chk('  a arvore gerou o link COM SINAL (base do forjado)', linkSinal.indexOf('&n=') > 0, linkSinal.slice(-60));
  if(linkSinal.indexOf('&n=') > 0){
    const q = busca(linkSinal);
    const iF = itensCodTeste([{nome:'Ensaio', sku:'ENS', unit:1200.50}]);
    const ps = pares(porAntesDoSelo(q, 'i', encodeURIComponent(iF)));
    ps.find(x => x[0] === 's')[1] = seloTeste(dec(pegar(q, 'c')), dec(pegar(q, 'd')), dec(pegar(q, 'pp') || ''),
      dec(pegar(q, 'v') || ''), '', '', dec(pegar(q, 'n')), iF, '');
    const d = await rodar(novo.bloco, monta(ps));
    chk('  [forjado] i JUNTO de n -> RECUSADO', recusou(d), 'mostrou ' + d.valor + ' / itens=' + d.nItens);
  }
}

console.log('\n=== PARTE 4 -- a conta do PayPal fecha ao centavo, e o campo 54 continua sendo o valor unico ===');
for(const cen of NOVAS.filter(c => c.itens)){
  const tag = '  [' + cen.n + '] ';
  const q = busca(novo.links[cen.n] || '');
  const d = await rodar(novo.bloco, q);
  chk(tag + 'o bloco aceita', aceitou(d), 'recado=' + String(d.recado).slice(0, 60));
  const esperados = itensLerTeste(dec(pegar(q, 'i')));
  chk(tag + 'o teste conseguiu ler os itens do proprio link', !!esperados && esperados.length > 0);
  if(!esperados) continue;
  chk(tag + 'a TELA mostra uma linha por item, na ordem', d.nItens === esperados.length,
      'tela=' + d.nItens + ' link=' + esperados.length);
  chk(tag + 'cada linha da tela traz o nome e o preco daquele item',
      esperados.every((it, k) => String(d.itens[k] || '').indexOf(it.nome) === 0 &&
                                 String(d.itens[k] || '').indexOf(brl(it.unit)) > 0),
      JSON.stringify(d.itens));
  chk(tag + 'o SKU NAO aparece na tela do cliente',
      esperados.every(it => !it.sku || String(d.itens.join(' ')).indexOf(it.sku) < 0),
      JSON.stringify(d.itens));
  chk(tag + 'o PayPal recebeu uma linha por item', (d.ppItens || []).length === esperados.length,
      'pedido=' + JSON.stringify(d.ppItens));
  chk(tag + 'cada linha do PayPal leva nome, quantidade 1, preco e o SKU daquele item',
      (d.ppItens || []).every((x, k) => x.nome === esperados[k].nome && x.qtd === '1' &&
        x.unit === esperados[k].unit.toFixed(2) && (x.sku || '') === esperados[k].sku),
      JSON.stringify(d.ppItens));
  /* A ARMADILHA DO BREAKDOWN, que recusa o pedido INTEIRO: com items, amount tem
     de ser igual a item_total (sem frete nem imposto aqui). Medida em CENTAVOS. */
  const soma = esperados.reduce((a, it) => a + Math.round(it.unit * 100), 0);
  chk(tag + 'item_total e a soma dos itens, ao centavo',
      Math.round(parseFloat(d.ppBreakItem) * 100) === soma,
      'item_total=' + d.ppBreakItem + ' soma=' + (soma / 100).toFixed(2));
  chk(tag + 'amount e igual a item_total (sem linha de desconto a explicar)',
      d.ppValor === d.ppBreakItem && d.ppBreakDesc === null,
      'amount=' + d.ppValor + ' item_total=' + d.ppBreakItem + ' discount=' + d.ppBreakDesc);
  /* O CAMPO 54, relido pelo leitor TLV DESTE arquivo. Com desconto ele e o valor
     JA DESCONTADO, e o PayPal cobra o total -- a itemizacao nao muda isso. */
  const pix = pixTeste(dec(pegar(q, 'c')));
  chk(tag + 'o codigo Pix fecha o proprio CRC', pix.ok, pix.crcDito + ' != ' + pix.crcFeito);
  const temDesc = !!pegar(q, 'x');
  const valorPix = parseFloat(pix.valor);
  chk(tag + 'o campo 54 continua sendo UM valor so, e e o que o Pix cobra',
      Math.abs(valorPix - (temDesc ? soma / 100 * (1 - parseFloat(dec(pegar(q, 'x'))) / 100) : soma / 100)) < 0.005,
      'campo54=' + pix.valor + ' soma dos itens=' + (soma / 100).toFixed(2) + ' x=' + pegar(q, 'x'));
  chk(tag + 'o PayPal cobra o TOTAL, e nao o valor do Pix',
      Math.round(parseFloat(d.ppValor) * 100) === soma,
      'paypal=' + d.ppValor + ' campo54=' + pix.valor);
  chk(tag + 'sem erro de console', errosReais(d.erros).length === 0, errosReais(d.erros).slice(0, 1).join(''));
}

console.log('\n=== PARTE 5 -- a precedencia do upsell: os quatro estados, e o interruptor mestre ===');
/* Os quatro estados sao medidos EXECUTANDO: o pedido e aprovado pela sonda, o
   bloco chama upsellIr(), e a medida e a pagina TER NAVEGADO. "A variavel esta no
   texto" nao responde por precedencia nenhuma. */
{
  const srv = await servir(RAIZ, 8824);
  const br = await navegador();
  const base = 'http://127.0.0.1:8824';
  /* Gera o bloco com o endereco da PAGINA e o interruptor escolhidos. */
  async function blocoCom(pagUrl, ligado){
    const pg = await abrir(br, base);
    await preparar(pg); await clicar(pg, 'aba-cob');
    await cobranca(pg, { valor:'1200,50' });
    await set(pg, 'p-upsell', pagUrl);
    await radio(pg, 'p-upsellon', ligado ? 'sim' : 'nao');
    await clicar(pg, 'p-gerar'); await pg.waitForTimeout(100);
    const b = (await ler(pg, 'p-out1')) || '';
    const av = await alertas(pg);
    await pg.close();
    return { bloco:b, alertas:av };
  }
  /* Gera o LINK com o endereco desta cobranca. */
  async function linkCom(cobUrl){
    const pg = await abrir(br, base);
    await preparar(pg); await clicar(pg, 'aba-cob');
    await cobranca(pg, { valor:'1200,50' });
    if(cobUrl) await set(pg, 'p-upsellcob', cobUrl);
    await clicar(pg, 'p-gerarlink'); await pg.waitForTimeout(140);
    const l = (await ler(pg, 'p-out2')) || '';
    await pg.close();
    return l;
  }
  const ESTADOS = [
    { rot:'nenhum dos dois',             pag:'',      cob:'',      ligado:true,  leva:null },
    { rot:'so a PAGINA',                 pag:'PAG',   cob:'',      ligado:true,  leva:'PAG' },
    { rot:'so o LINK',                   pag:'',      cob:'LINK',  ligado:true,  leva:'LINK' },
    { rot:'os DOIS -- o do LINK vence',  pag:'PAG',   cob:'LINK',  ligado:true,  leva:'LINK' },
    { rot:'os dois, mestre DESLIGADO',   pag:'PAG',   cob:'LINK',  ligado:false, leva:null },
    { rot:'so o LINK, mestre DESLIGADO', pag:'',      cob:'LINK',  ligado:false, leva:null }
  ];
  try{
    for(const e of ESTADOS){
      const porta = proximaPorta();
      const alvoPag  = 'http://127.0.0.1:' + porta + '/pagina?foi=pagina';
      const alvoLink = 'http://127.0.0.1:' + porta + '/pagina?foi=link';
      const g = await blocoCom(e.pag ? alvoPag : '', e.ligado);
      const link = await linkCom(e.cob ? alvoLink : '');
      const tag = '  [' + e.rot + '] ';
      chk(tag + 'a ferramenta gerou bloco e link sem recusar', g.bloco.length > 1000 && link.indexOf('?c=') > 0,
          (g.alertas || []).join(' | ').slice(0, 110));
      if(g.bloco.length < 1000 || link.indexOf('?c=') < 0) continue;
      chk(tag + 'o bloco declara UPSELL_ATIVO=' + e.ligado,
          new RegExp('var UPSELL_ATIVO=' + (e.ligado ? 'true' : 'false') + ';').test(g.bloco),
          (g.bloco.match(/var UPSELL_ATIVO=\w+;/) || ['(nenhuma)'])[0]);
      const r = await comBlocoNaPagina({
        bloco: g.bloco, busca: busca(link), corpoAntes: SONDA_PP, porta,
        medir: async pg => {
          await pg.waitForTimeout(80);
          const tem = await pg.evaluate(() => !!(window.__ppOpts && window.__ppOpts.onApprove));
          if(!tem) return { tem:false, url:pg.url() };
          await pg.evaluate(() => window.__ppOpts.onApprove(null, { order:{ capture:() => Promise.resolve({}) } }))
                 .catch(() => {});
          const foiPag  = await esperarUrl(pg, 'foi=pagina', e.leva ? 2500 : 1200);
          const foiLink = pg.url().indexOf('foi=link') >= 0;
          return { tem:true, foiPag, foiLink, url:pg.url() };
        }
      });
      chk(tag + 'a sonda alcancou o onApprove do bloco', r.tem === true, 'url=' + r.url);
      const esperaPag = (e.leva === 'PAG'), esperaLink = (e.leva === 'LINK');
      chk(tag + (esperaPag ? 'levou ao endereco da PAGINA' : 'NAO levou ao endereco da pagina'),
          !!r.foiPag === esperaPag, 'url=' + r.url);
      chk(tag + (esperaLink ? 'levou ao endereco do LINK' : 'NAO levou ao endereco do link'),
          !!r.foiLink === esperaLink, 'url=' + r.url);
    }
    /* O PEDIDO ORIGINAL DO DONO, medido: gerar DESLIGADO e ligar EDITANDO o codigo
       ja colado, sem regerar. Aqui com o endereco vindo do LINK, que e o caso novo. */
    {
      const porta = proximaPorta();
      const alvoLink = 'http://127.0.0.1:' + porta + '/pagina?foi=link';
      const g = await blocoCom('', false);
      const link = await linkCom(alvoLink);
      const antes = g.bloco;
      const editado = antes.replace('var UPSELL_ATIVO=false;', 'var UPSELL_ATIVO=true;');
      chk('  [editado a mao] a troca mexeu em exatamente um byte-grupo',
          editado !== antes && editado.length === antes.length - 1);
      const r = await comBlocoNaPagina({
        bloco: editado, busca: busca(link), corpoAntes: SONDA_PP, porta,
        medir: async pg => {
          await pg.waitForTimeout(80);
          await pg.evaluate(() => window.__ppOpts.onApprove(null, { order:{ capture:() => Promise.resolve({}) } }))
                 .catch(() => {});
          return { foi: await esperarUrl(pg, 'foi=link', 2500), url:pg.url() };
        }
      });
      chk('  [editado a mao] ligar UPSELL_ATIVO no codigo publicado passa a levar ao endereco do LINK',
          r.foi === true, 'url=' + r.url);
    }
  } finally { await br.close(); srv.close(); }
}

console.log('\n=== PARTE 6 -- esquema invalido recusado NAS DUAS paginas ===');
{
  const RUINS = [
    ['javascript:', 'javascript:alert(1)'],
    ['data:',       'data:text/html,<b>x'],
    ['//outro host','//evil.exemplo.com/x'],
    ['sem barra',   'oferta-especial']
  ];
  const srv = await servir(RAIZ, 8825);
  const br = await navegador();
  const base = 'http://127.0.0.1:8825';
  try{
    for(const [rot, u] of RUINS){
      /* a aba */
      let pg = await abrir(br, base);
      await preparar(pg); await clicar(pg, 'aba-cob');
      await cobranca(pg, { valor:'1200,50' });
      await set(pg, 'p-upsellcob', u);
      await clicar(pg, 'p-gerarlink'); await pg.waitForTimeout(120);
      const link = (await ler(pg, 'p-out2')) || '';
      const av = (await alertas(pg)).join(' | ');
      await pg.close();
      chk('  [aba / ' + rot + '] recusado, e nenhum link saiu',
          !link && av.indexOf('upsell') >= 0, av.slice(0, 120) || 'link=' + link.slice(0, 50));
      /* a /cobrar. O AQUECIMENTO E OBRIGATORIO e nao e cerimonia: a /cobrar le a
         identidade e o ENDERECO da pagina de pagamento do armazenamento que a
         ferramenta grava, e sem eles ela recusa por outro motivo -- medido, ela
         reclamava do endereco da /pagar e nunca chegava a olhar o upsell, e o teste
         daria verde por um motivo errado (recusou, sim, mas nao por isto). */
      pg = await abrir(br, base);
      await preparar(pg);
      await clicar(pg, 'aba-cob');
      await cobranca(pg, { valor:'1200,50' });
      await pg.goto(base + '/cobrar/index.html');
      await pg.evaluate(() => { window.__alertas = []; window.alert = m => window.__alertas.push(String(m)); });
      await set(pg, 'cb-desc', 'Ensaio');
      await set(pg, 'cb-valor', '1200,50');
      await set(pg, 'cb-upsell', u);
      await clicar(pg, 'cb-gerar'); await pg.waitForTimeout(120);
      const l2 = (await ler(pg, 'cb-out')) || '';
      const r2 = await pg.evaluate(() => { const e = document.getElementById('cb-recusa'); return e ? e.textContent : ''; });
      await pg.close();
      chk('  [cobrar / ' + rot + '] recusado, e nenhum link saiu',
          !l2 && r2.indexOf('upsell') >= 0, r2.slice(0, 120) || 'link=' + l2.slice(0, 50));
    }
  } finally { await br.close(); srv.close(); }
}

console.log('\n=== PARTE 7 -- O INVARIANTE: a /cobrar gera o MESMO link, caractere por caractere ===');
/* A /cobrar e o TERCEIRO gerador do mesmo endereco. Se ela divergir num
   caractere, o selo nao fecha e a /pagar recusa o link do dono -- com o cliente
   na frente. Os casos cobrem os quatro estados: com itens, com upsell, com os
   dois, e sem nenhum. */
{
  const srv = await servir(RAIZ, 8826);
  const br = await navegador();
  const base = 'http://127.0.0.1:8826';
  const casos = [FORMATOS[0], FORMATOS[5], NOVAS[0], NOVAS[2], NOVAS[5], NOVAS[8], NOVAS[9]];
  try{
    for(const cen of casos){
      const pg = await abrir(br, base);
      await preparar(pg); await clicar(pg, 'aba-cob');
      await cobranca(pg, cen.c);
      await preencherNovos(pg, cen);
      await clicar(pg, 'p-gerarlink'); await pg.waitForTimeout(140);
      const daAba = (await ler(pg, 'p-out2')) || '';
      await pg.goto(base + '/cobrar/index.html');
      await pg.evaluate(() => { window.__alertas = []; window.alert = m => window.__alertas.push(String(m)); });
      await set(pg, 'cb-desc', cen.c.desc ?? 'Ensaio de familia — pacote completo');
      await set(pg, 'cb-valor', cen.c.valor ?? '1200,50');
      await set(pg, 'cb-txid', cen.c.txid ?? '');
      await set(pg, 'cb-validade', cen.c.validade ?? '');
      await set(pg, 'cb-descpix', cen.c.descpix ?? '0');
      await radio(pg, 'cb-ppmodo', cen.c.ppmodo ?? 'sdk');
      if(cen.c.pplink) await set(pg, 'cb-pplink', cen.c.pplink);
      await set(pg, 'cb-itens', cen.itens ?? '');
      await set(pg, 'cb-upsell', cen.ups ?? '');
      await clicar(pg, 'cb-gerar'); await pg.waitForTimeout(140);
      const daCobrar = (await ler(pg, 'cb-out')) || '';
      chk('  [' + cen.n + '] a /cobrar gerou o link', daCobrar.indexOf('?c=') > 0,
          (await pg.evaluate(() => window.__alertas.join(' | '))).slice(0, 110) ||
          (await pg.evaluate(() => { const e = document.getElementById('cb-recusa'); return e ? e.textContent.slice(0, 140) : ''; })));
      chk('  [' + cen.n + '] identico ao da aba, caractere por caractere', daAba === daCobrar,
          'aba    = ' + daAba.slice(-80) + '\n                cobrar = ' + daCobrar.slice(-80));
      await pg.close();
    }
  } finally { await br.close(); srv.close(); }
}

console.log('\n=== PARTE 8 -- as recusas da ferramenta, com a frase que elas mostram ===');
{
  const CASOS = [
    { n:'soma nao bate',      c:{ valor:'1200,50' }, itens:'Ensaio | ENS | 900,00', espera:'somam' },
    { n:'itens com sinal',    c:{ valor:'1200,50' }, itens:'Ensaio | ENS | 1200,50',
      sinal:{ tipo:'pct', pct:'30' }, espera:'sinal' },
    { n:'linha fora do formato', c:{ valor:'1200,50' }, itens:'Ensaio de gestante 900,00', espera:'formato' },
    { n:'quatro pedacos',     c:{ valor:'1200,50' }, itens:'Ensaio | A | B | 900,00', espera:'formato' },
    { n:'preco ilegivel',     c:{ valor:'1200,50' }, itens:'Ensaio | ENS | mil reais', espera:'preço' },
    { n:'nome vazio',         c:{ valor:'1200,50' }, itens:' | ENS | 1200,50', espera:'nome' },
    { n:'preco zero',         c:{ valor:'1200,50' }, itens:'Ensaio | ENS | 1200,50\nBrinde | BRI | 0', espera:'zero' },
    { n:'itens demais',       c:{ valor:'2100,00' },
      itens:Array.from({length:21}, (_, k) => 'Item ' + (k + 1) + ' | S' + k + ' | 100,00').join('\n'),
      espera:'20 itens' }
  ];
  const srv = await servir(RAIZ, 8827);
  const br = await navegador();
  const base = 'http://127.0.0.1:8827';
  try{
    for(const caso of CASOS){
      const pg = await abrir(br, base);
      await preparar(pg); await clicar(pg, 'aba-cob');
      await cobranca(pg, caso.c);
      await set(pg, 'p-itens', caso.itens);
      if(caso.sinal){
        await radio(pg, 'p-sinal', 'sim');
        await radio(pg, 'p-sinaltipo', caso.sinal.tipo);
        await set(pg, 'p-sinalpct', caso.sinal.pct);
      }
      await clicar(pg, 'p-gerarlink'); await pg.waitForTimeout(120);
      const link = (await ler(pg, 'p-out2')) || '';
      const av = (await alertas(pg)).join(' | ');
      await pg.close();
      chk('  [recusa] ' + caso.n + ' -> recusado, com a frase certa',
          av.indexOf(caso.espera) >= 0 && !link, av.slice(0, 130) || 'SEM RECUSA, link=' + link.slice(0, 50));
    }
  } finally { await br.close(); srv.close(); }
}

console.log('\n=== PARTE 9 -- a maquinaria entra SEMPRE no bloco, com ou sem itens/upsell na cobranca aberta ===');
{
  const b = novo.bloco;
  chk('  a seloDe do bloco tem os NOVE parametros',
      b.indexOf('function seloDe(pc,pd,pp,pv,pt,px,pn,pi,pu)') >= 0);
  chk('  a chamada do selo passa i e u', b.indexOf("param('n'),param('i'),param('u'))") >= 0);
  chk('  o bloco declara ITENS', b.indexOf('var ITENS=[];') >= 0);
  chk('  o bloco leva o leitor dos itens', b.indexOf('function itensLer(s)') >= 0);
  chk('  o bloco declara itensEscolhidos(), o contrato de ppDetalhar',
      b.indexOf('function itensEscolhidos()') >= 0);
  chk('  o bloco leva ppDetalhar, da fonte unica', b.indexOf('function ppDetalhar(pu,v)') >= 0);
  chk('  ppDetalhar so e chamada SEM sinal', b.indexOf('if(SINAL_AGORA===0)ppDetalhar(pu,v);') >= 0);
  chk('  o bloco recusa i junto de n', b.indexOf('if(pn){recado(TXT_CODIGO_RUIM);return;}') >= 0);
  chk('  as duas variaveis do upsell saem mesmo com o campo da aba VAZIO',
      /var UPSELL_ATIVO=/.test(b) && b.indexOf("var UPSELL_URL='';") >= 0,
      (b.match(/var UPSELL_URL='[^']*';/) || ['(nenhuma)'])[0]);
  chk('  ha UMA declaracao de UPSELL_ATIVO para o dono editar',
      (b.match(/var UPSELL_ATIVO=\w+;/g) || []).length === 1);
  chk('  upsellIr consulta o LINK antes da variavel da pagina',
      b.indexOf("var alvo=param('u')||UPSELL_URL;") >= 0);
  chk('  o bloco sai IDENTICO com itens e upsell preenchidos na aba (e o que sustenta o naoEmite)',
      novo.blocoComNovos === b,
      'com=' + (novo.blocoComNovos || '').length + ' sem=' + b.length);
  chk('  sem erro nem recusa ao gerar o bloco', (novo.alertasBloco || []).length === 0,
      (novo.alertasBloco || []).join(' | '));
}

console.log('\n=== O TAMANHO DO LINK, medido (nao estimado) ===');
for(const cen of FORMATOS.slice(0, 1).concat(NOVAS))
  console.log('  ' + String((novo.links[cen.n] || '').length).padStart(4) + '  ' + cen.n);
console.log('  (o teto pratico de navegador e de aplicativo de mensagem fica muito acima de 2.000)');

console.log('\nerros de console na ferramenta: ' + (errosReais(novo.erros).slice(0, 3).join(' | ') || 'nenhum'));
process.exit(resumo());
