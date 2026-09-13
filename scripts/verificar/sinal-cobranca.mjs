/* ============================================================================
   O SINAL NO LINK DE COBRANCA -- e a prova que manda em tudo
   ============================================================================
   POR QUE ESTE ARQUIVO E DIFERENTE DE TODOS OS OUTROS DESTE DIRETORIO. As
   outras suites medem o que a ferramenta PRODUZ. Esta mede tambem o que ja
   SAIU: existem links de cobranca no WhatsApp de clientes, gerados por versoes
   anteriores, e existe um bloco /pagar colado no site do dono que NAO e
   versionado -- ele confere do jeito que estava no dia em que foi colado.

   A rodada de 13/09/2026 poe o sinal dentro do SELO do link (parametro n).
   Selo e contagem: acrescentar um item a conta de TODO link derrubaria, de uma
   vez, todas as cobrancas ja enviadas. A regra adotada e a mesma que o desconto
   ja usava -- o parametro entra na conta SO QUANDO VEM PREENCHIDO, e depois de
   t/x --, e dela saem duas consequencias de sinais opostos:

     1. link SEM sinal (todos os ja enviados) sela exatamente como antes, e o
        bloco novo os aceita. ESTA E A PROVA QUE MANDA: se ela falhar, a rodada
        nao entrega, nao importa o que mais funcione.
     2. link COM sinal e RECUSADO pelo bloco antigo, que conta seis e ignora o
        n. Isso e comportamento correto e esperado, e esta suite o MEDE em vez
        de supor -- o aviso ao dono ("regere e recole o codigo 1, uma vez so")
        precisa ser verdade medida.

   O QUE "SINAL" SIGNIFICA NESTA ABA, e por que nao e o das outras tres. Aqui
   nao ha carrinho: o valor e um numero digitado pelo operador e nada muda
   depois que o link sai. Entao o sinal NAO e uma formula que o bloco carrega
   (FC_CARRINHO_SRC.sinal): ele e calculado UMA vez, na geracao do link, e o
   resultado vai para DENTRO do codigo Pix, no campo 54 -- onde todo valor
   cobrado desta pagina mora. O que viaja no endereco e o TOTAL (parametro n),
   que so a TELA usa (o numero em destaque e o saldo). Ninguem cobra o total
   numa cobranca com sinal: o Pix cobra o sinal e o PayPal cobra o sinal.

   A SEGUNDA OPINIAO E ESCRITA AQUI DENTRO, sempre. O leitor TLV, o CRC16 (do
   polinomio) e a propria conta do SELO sao reescritos neste arquivo, a partir
   da especificacao e da regra -- nunca importados do projeto. Um teste que
   confere o projeto com uma funcao do projeto nao tem opiniao nenhuma. E e
   essa segunda opiniao do selo que permite FORJAR links que o gerador se
   recusa a produzir (n=0.00, sinal maior que o total, n junto de t/x) e provar
   que as guardas do bloco sao alcancaveis -- o selo nao e segredo, a regra
   esta escrita no proprio codigo da pagina.

   O CRITERIO DOS CASOS DE ARREDONDAMENTO (nao e sorteio). Varredura feita para
   esta aba em 13/09/2026 -- totais de R$ 10,00 a R$ 2.000,00 e percentual de
   1% a 99% de meio em meio: 39.203.197 combinacoes, 774.110 com o sinal cru
   caindo em meio centavo exato e 317.363 (0,810%) em que Math.round e
   toFixed(2) devolvem centavos diferentes, SEMPRE com o Math.round por cima --
   nenhum caso na direcao oposta. O catalogo abaixo sao quatro desses, com
   totais realistas de cobranca. E a mesma familia do defeito de ago/2026.

   Roda com:  node scripts/verificar/sinal-cobranca.mjs [referencia]
   (a referencia e o que faz o papel de "a versao de hoje" -- por padrao main)
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
const REF = process.argv[2] || 'main';

/* ===========================================================================
   A SEGUNDA OPINIAO: TLV, CRC16 e o SELO, escritos aqui
   =========================================================================== */
/* CRC-16/CCITT-FALSE, do polinomio. E o mesmo que o BR Code exige e o mesmo que
   o selo do link usa -- duas coisas diferentes sobre a MESMA aritmetica. */
function crc16Teste(bytes){
  let crc = 0xFFFF;
  for(let i = 0; i < bytes.length; i++){
    crc ^= (bytes.charCodeAt(i) & 0xFF) << 8;
    for(let b = 0; b < 8; b++)
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
  }
  return ('000' + crc.toString(16).toUpperCase()).slice(-4);
}
/* O selo serializa CARACTERES em dois bytes (alto e baixo) antes do CRC -- sem
   isso um acento trocado por outro do mesmo byte baixo passaria. */
function seloBytesTeste(s){
  let o = '';
  for(let i = 0; i < s.length; i++){
    const c = s.charCodeAt(i);
    o += String.fromCharCode((c >> 8) & 255, c & 255);
  }
  return o;
}
/* A REGRA DA CONTA, transcrita: os quatro de sempre; t e x juntos, so se um dos
   dois vier; n por ultimo, so se vier. */
function seloTeste(c, d, pp, v, t, x, n){
  const ps = [c, d, pp, v];
  const a = String(t == null ? '' : t), b = String(x == null ? '' : x), g = String(n == null ? '' : n);
  if(a !== '' || b !== ''){ ps.push(a); ps.push(b); }
  if(g !== '') ps.push(g);
  let s = '';
  for(let i = 0; i < ps.length; i++){
    const e = String(ps[i] == null ? '' : ps[i]);
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

/* ===========================================================================
   O CATALOGO
   =========================================================================== */
const r2 = x => Math.round(x * 100) / 100;

/* Os oito formatos de link que o dono JA MANDOU -- com e sem t/x, com e sem
   PayPal, com e sem validade, com e sem identificador, e o de acentos. */
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

/* As cobrancas COM SINAL. Os quatro primeiros sao o catalogo do meio centavo
   (ver o cabecalho); os outros exercitam valor fixo, PayPal desligado, prazo e
   texto hostil. */
const COM_SINAL = [
  { n:'S1 300,65 @ 30%',  c:{ valor:'300,65' }, s:{ tipo:'pct', pct:'30' },   meio:true },
  { n:'S2 300,01 @ 50%',  c:{ valor:'300,01' }, s:{ tipo:'pct', pct:'50' },   meio:true },
  { n:'S3 300,02 @ 25%',  c:{ valor:'300,02' }, s:{ tipo:'pct', pct:'25' },   meio:true },
  { n:'S4 300,20 @ 12,5%',c:{ valor:'300,20' }, s:{ tipo:'pct', pct:'12.5' }, meio:true },
  { n:'S5 fixo 100,00',   c:{ valor:'1200,50' }, s:{ tipo:'fixo', fixo:'100' } },
  { n:'S6 sem PayPal',    c:{ valor:'1200,50', ppmodo:'nao' }, s:{ tipo:'pct', pct:'30' } },
  { n:'S7 com prazo',     c:{ valor:'1200,50', validade:'2099-12-30', txid:'ENSAIO2026' }, s:{ tipo:'pct', pct:'30' } },
  { n:'S8 texto hostil',  c:{ valor:'1200,50', desc:'Ensaio \'de\' "família" \\ 50% </script>' }, s:{ tipo:'pct', pct:'30' } },
  /* A FRONTEIRA da regra da rodada F, aplicada ao caso que ESTA aba alcanca: sinal
     fixo IGUAL ao valor da cobranca deixa o saldo em zero. Um teste que so olhasse
     "com sinal" e "sem sinal" nao diria onde fica o corte -- por isso o par. */
  { n:'S9 saldo ZERO',    c:{ valor:'1200,50' }, s:{ tipo:'fixo', fixo:'1200.50' }, saldoZero:true },
  { n:'S10 saldo de UM CENTAVO', c:{ valor:'1200,50' }, s:{ tipo:'fixo', fixo:'1200.49' } }
];

/* A CONTA, transcrita de novo: sinal = total x pct / 100 (ou o fixo), UM
   Math.round; saldo = total - sinal. */
function esperado(cen){
  const total = r2(parseFloat(String(cen.c.valor).replace(',', '.')));
  const sinal = cen.s.tipo === 'fixo'
    ? r2(parseFloat(cen.s.fixo))
    : r2(total * parseFloat(cen.s.pct) / 100);
  return { total, sinal, saldo: r2(total - sinal) };
}
const brl = v => 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* ===========================================================================
   COLHER: os links e o bloco de uma arvore
   =========================================================================== */
async function ligarSinal(pg, s){
  await radio(pg, 'p-sinal', 'sim');
  await radio(pg, 'p-sinaltipo', s.tipo);
  if(s.tipo === 'fixo') await set(pg, 'p-sinalfixo', s.fixo);
  else await set(pg, 'p-sinalpct', s.pct);
}

async function colher(raiz, porta, cenarios, temSinal){
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
      if(cen.s){
        if(!temSinal){ await pg.close(); continue; }
        await ligarSinal(pg, cen.s);
      }
      await clicar(pg, 'p-gerarlink');
      await pg.waitForTimeout(120);
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
    await pg.waitForTimeout(80);
    out.bloco = (await ler(pg, 'p-out1')) || '';
    out.alertasBloco = await alertas(pg);
    /* O MESMO bloco, agora com o sinal LIGADO na aba. Ele tem de sair identico:
       o sinal e desta COBRANCA, e a maquinaria entra sempre. E o que sustenta o
       'naoEmite' desta aba -- se o bloco mudasse, o painel consolidado passaria a
       avisar "o codigo e mais velho que a aba" a cada troca de sinal, sobre um
       codigo que nao mudou. */
    if(temSinal){
      await ligarSinal(pg, { tipo:'fixo', fixo:'250' });
      await clicar(pg, 'p-gerar');
      await pg.waitForTimeout(80);
      out.blocoComSinal = (await ler(pg, 'p-out1')) || '';
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
/* A SONDA DO PAYPAL, escrita aqui e sem rede. O bloco cria um <script> do SDK e
   so chama window.paypal.Buttons no onload dele. Com a rede fechada esse onload
   nunca chega, e o createOrder -- que e onde mora o numero que o cartao debita
   -- nunca seria medido. Entao a sonda instala um window.paypal falso ANTES do
   bloco e faz o appendChild daquele <script> disparar o onload sem baixar nada:
   nenhum Client ID sai daqui, e quem responde e o createOrder do proprio bloco. */
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

let PORTA_PAGINA = 8880;
async function rodar(bloco, q){
  PORTA_PAGINA = PORTA_PAGINA + 1 > 8960 ? 8881 : PORTA_PAGINA + 1;
  return await comBlocoNaPagina({
    bloco, busca: q, corpoAntes: SONDA_PP, porta: PORTA_PAGINA,
    medir: async pg => {
      await pg.waitForTimeout(60);
      return await pg.evaluate(() => {
        const q1 = s => document.querySelector(s);
        const t = e => (e ? e.textContent : null);
        const cartao = q1('.fcpg-cartao');
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
          saldo: t(q1('.fcpg-saldo')),
          prazo: t(q1('.fcpg-prazo')),
          refTxt: t(q1('.fcpg-ref')),
          codigo: q1('.fcpg-cod') ? q1('.fcpg-cod').value : null,
          zapHref: zap ? zap.getAttribute('href') : null,
          nSinal: document.querySelectorAll('.fcpg-sinal').length,
          nSaldo: document.querySelectorAll('.fcpg-saldo').length,
          nPixlinha: document.querySelectorAll('.fcpg-pixlinha').length,
          ordem: cartao ? Array.prototype.map.call(cartao.children, e => e.className) : [],
          ppValor: pp && pp.amount ? pp.amount.value : (pp && pp.erro ? pp.erro : null),
          ppItem: pp && pp.items ? pp.items[0].unit_amount.value : null,
          ppBreak: pp && pp.amount && pp.amount.breakdown ? pp.amount.breakdown.item_total.value : null,
          ppCustom: pp ? (pp.custom_id || '') : null
        };
      });
    }
  });
}
/* A rede esta fechada de proposito; o que ela derruba (o QR do cdnjs) nao e
   defeito do bloco e nao pode ser contado como um. */
const errosReais = e => (e || []).filter(x => !/cdnjs|ERR_FAILED|Failed to load resource/i.test(x));
/* RECUSA E O RECADO, e nao a ausencia de cartao. Um bloco vazio nao desenha
   nada -- e "nada" passaria por recusa numa medida ingenua, e por aceitacao na
   medida oposta. As duas leituras erradas ficam fechadas aqui. */
const recusou = d => !!d.recado && !d.valor;
const aceitou = d => !d.recado && !!d.valor;

/* ===========================================================================
   A BATERIA
   =========================================================================== */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-sinal-cob-'));
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

const refTemSinal = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8').indexOf('p-sinalpct') >= 0;
if(refTemSinal){
  console.log('\nAVISO: a referencia JA tem o sinal nesta aba. As partes 1 e 2 medem a');
  console.log('       travessia de versoes e so significam algo contra uma referencia ANTERIOR.');
  console.log('       A recusa da parte 2 diz NAO MEDIU em vez de falhar -- ver o comentario la.');
}

console.log('\ncolhendo da REFERENCIA (os links que o dono ja mandou)...');
const ref = await colher(tmp, 8801, FORMATOS, false);
console.log('colhendo da ARVORE DE TRABALHO...');
const novo = await colher(RAIZ, 8802, FORMATOS.concat(COM_SINAL), true);

/* PORTEIRO: uma arvore que nao gera nada faria TODAS as verificacoes abaixo
   passarem por vacuidade -- bloco vazio nao desenha nada, e "nao desenhou nada"
   nao e "nao recusou". Isto ja aconteceu uma vez nesta rodada (a guarda de
   versao do index.html parou a ferramenta inteira, em silencio), entao ele fica. */
console.log('');
chk('  a REFERENCIA gerou o bloco', (ref.bloco || '').length > 1000, 'bytes=' + (ref.bloco || '').length);
chk('  a ARVORE gerou o bloco', (novo.bloco || '').length > 1000, 'bytes=' + (novo.bloco || '').length);
for(const cen of FORMATOS){
  chk('  a REFERENCIA gerou o link ' + cen.n, (ref.links[cen.n] || '').indexOf('?c=') > 0,
      (ref.alertas[cen.n] || []).join(' | ').slice(0, 90));
}
for(const cen of FORMATOS.concat(COM_SINAL)){
  chk('  a ARVORE gerou o link ' + cen.n, (novo.links[cen.n] || '').indexOf('?c=') > 0,
      (novo.alertas[cen.n] || []).join(' | ').slice(0, 90));
}
if((novo.bloco || '').length < 1000 || (ref.bloco || '').length < 1000 ||
   FORMATOS.some(c => (novo.links[c.n] || '').indexOf('?c=') < 0)){
  console.log('\nPAROU: sem bloco ou sem link nao ha o que medir, e medir assim mesmo daria verde falso.');
  process.exit(resumo() || 1);
}

console.log('\n=== PARTE 1 -- A PROVA QUE MANDA: o bloco NOVO aceita os links de HOJE ===');
for(const f of FORMATOS){
  const tag = '  [' + f.n + '] ';
  const linkRef = ref.links[f.n] || '';
  chk(tag + 'a referencia gerou o link', linkRef.indexOf('?c=') > 0, linkRef.slice(0, 60));
  if(linkRef.indexOf('?c=') < 0) continue;
  const q = busca(linkRef);
  chk(tag + 'o link de hoje NAO tem o parametro do sinal', !temChave(q, 'n'));
  const dNovo = await rodar(novo.bloco, q);
  const dRef  = await rodar(ref.bloco, q);
  chk(tag + 'o bloco NOVO aceita e desenha o cartao', aceitou(dNovo), 'recado=' + String(dNovo.recado).slice(0, 50));
  chk(tag + 'o bloco de hoje tambem aceita (controle)', aceitou(dRef), 'recado=' + String(dRef.recado).slice(0, 50));
  chk(tag + 'MESMO valor na tela, nos dois blocos', dNovo.valor === dRef.valor,
      'novo=' + dNovo.valor + ' ref=' + dRef.valor);
  chk(tag + 'MESMO rotulo e MESMA linha do Pix', dNovo.valorRot === dRef.valorRot && dNovo.pixlinha === dRef.pixlinha,
      'novo=' + dNovo.valorRot + '/' + dNovo.pixlinha + ' ref=' + dRef.valorRot + '/' + dRef.pixlinha);
  /* O campo 54, relido pelo leitor TLV deste arquivo -- e nao pelo do projeto. */
  const pix = pixTeste(dec(pegar(q, 'c')));
  chk(tag + 'o codigo Pix fecha o proprio CRC', pix.ok, pix.crcDito + ' != ' + pix.crcFeito);
  chk(tag + 'o campo 54 e o mesmo que o bloco novo copia na tela',
      dNovo.codigo === dec(pegar(q, 'c')), 'campo 54 = ' + pix.valor);
  chk(tag + 'nenhuma linha de sinal apareceu num link sem sinal',
      dNovo.nSinal === 0 && dNovo.nSaldo === 0, 'sinal=' + dNovo.nSinal + ' saldo=' + dNovo.nSaldo);
  chk(tag + 'sem erro de console no bloco novo', errosReais(dNovo.erros).length === 0,
      errosReais(dNovo.erros).slice(0, 1).join(''));
  /* A conta do selo, refeita aqui: link sem sinal conta os de sempre. */
  chk(tag + 'o selo do link de hoje bate com a conta transcrita neste teste',
      seloTeste(dec(pegar(q, 'c')), dec(pegar(q, 'd')), dec(pegar(q, 'pp') || ''), dec(pegar(q, 'v') || ''),
                dec(pegar(q, 't') || ''), dec(pegar(q, 'x') || ''), '') === pegar(q, 's'),
      'selo no link = ' + pegar(q, 's'));
}

console.log('\n=== PARTE 2 -- o caminho inverso, declarado: link COM sinal e recusado pelo bloco de hoje ===');
for(const cen of COM_SINAL.slice(0, 3)){
  const tag = '  [' + cen.n + '] ';
  const q = busca(novo.links[cen.n] || '');
  /* A RECUSA SO SIGNIFICA ALGO CONTRA UMA REFERENCIA ANTERIOR AO SINAL. Desde que a rodada D
     chegou a 'main', a referencia padrao passou a CONHECER o parametro -- e o bloco dela aceita
     o link, corretamente. Deixar a assercao rodando produzia tres falhas todo dia sem defeito
     nenhum por tras, e vermelho que e sempre vermelho esconde o proximo, que seria de verdade.
     E a QUARTA vez que este padrao aparece no arnes (id-orcamento, textos-reserva,
     meio-prio-migracao). A regra da casa ja esta escrita: "antes" e estado historico, nao "o
     que estiver em main hoje". Para medir a travessia de verdade, passe um commit anterior a
     rodada D: node scripts/verificar/sinal-cobranca.mjs 69e5fa2 */
  if(refTemSinal){
    console.log(tag + 'NAO MEDIU a recusa: a referencia ja conhece o sinal.');
  }else{
    const dRef = await rodar(ref.bloco, q);
    chk(tag + 'o bloco de HOJE recusa o link com sinal', recusou(dRef),
        'mostrou valor=' + dRef.valor);
  }
  const dNovo = await rodar(novo.bloco, q);
  chk(tag + 'o bloco NOVO aceita o mesmo link', aceitou(dNovo), 'recado=' + String(dNovo.recado).slice(0, 50));
}

console.log('\n=== PARTE 3 -- as adulteracoes, com e sem o parametro do sinal ===');
/* As oito de sempre, sobre um link COM DESCONTO (t e x presentes). */
{
  const q = busca(novo.links['F7 tudo junto'] || '');
  const codigo = dec(pegar(q, 'c'));
  const torcido = codigo.replace(/[0-9](?=[^0-9]*$)/, d => (d === '9' ? '8' : String(Number(d) + 1)));
  const oito = [
    ['descricao trocada',    trocarP(q, 'd', encodeURIComponent('Outro ensaio'))],
    ['t trocado',            trocarP(q, 't', '4500.00')],
    ['x trocado',            trocarP(q, 'x', '90')],
    ['selo apagado',         apagarP(q, 's')],
    ['selo trocado',         trocarP(q, 's', pegar(q, 's') === 'AAAA' ? 'BBBB' : 'AAAA')],
    ['t apagado',            apagarP(q, 't')],
    ['x apagado',            apagarP(q, 'x')],
    ['digito do codigo Pix', trocarP(q, 'c', encodeURIComponent(torcido))]
  ];
  for(const [nome, qa] of oito){
    const d = await rodar(novo.bloco, qa);
    chk('  [desconto] ' + nome + ' -> RECUSADO', recusou(d), 'mostrou ' + d.valor);
  }
}
/* As mesmas oito, agora sobre um link COM SINAL -- mais a nona, que so existe
   por causa desta rodada: n e t/x nunca convivem, e o bloco recusa quem os
   traga juntos. */
{
  const q = busca(novo.links['S7 com prazo'] || '');
  const codigo = dec(pegar(q, 'c'));
  const torcido = codigo.replace(/[0-9](?=[^0-9]*$)/, d => (d === '9' ? '8' : String(Number(d) + 1)));
  const oito = [
    ['descricao trocada',    trocarP(q, 'd', encodeURIComponent('Outro ensaio'))],
    ['n trocado',            trocarP(q, 'n', '99999.00')],
    ['n apagado',            apagarP(q, 'n')],
    ['selo apagado',         apagarP(q, 's')],
    ['selo trocado',         trocarP(q, 's', pegar(q, 's') === 'AAAA' ? 'BBBB' : 'AAAA')],
    ['v apagado',            apagarP(q, 'v')],
    ['pp acrescentado',      porAntesDoSelo(q, 'pp', 'nao')],
    ['digito do codigo Pix', trocarP(q, 'c', encodeURIComponent(torcido))],
    ['t e x acrescentados',  porAntesDoSelo(porAntesDoSelo(q, 't', '1200.50'), 'x', '10')]
  ];
  for(const [nome, qa] of oito){
    const d = await rodar(novo.bloco, qa);
    chk('  [sinal] ' + nome + ' -> RECUSADO', recusou(d), 'mostrou ' + d.valor);
  }
}
/* FORJADOS: links que o gerador se recusa a produzir, selados pela conta
   transcrita neste arquivo. Sem eles as guardas do bloco seriam inalcancaveis e
   ninguem saberia se elas funcionam. */
{
  const q = busca(novo.links['S5 fixo 100,00'] || '');
  const c = dec(pegar(q, 'c')), d0 = dec(pegar(q, 'd'));
  const forjar = n => {
    const ps = pares(q).filter(x => x[0] !== 's');
    const p = ps.find(x => x[0] === 'n'); p[1] = encodeURIComponent(n);
    return monta(ps) + '&s=' + seloTeste(c, d0, '', '', '', '', n);
  };
  chk('  [forjado] o selo transcrito reproduz o selo do link real',
      seloTeste(c, d0, '', '', '', '', dec(pegar(q, 'n'))) === pegar(q, 's'),
      'transcrito=' + seloTeste(c, d0, '', '', '', '', dec(pegar(q, 'n'))) + ' real=' + pegar(q, 's'));
  const dOk = await rodar(novo.bloco, forjar(dec(pegar(q, 'n'))));
  chk('  [forjado] controle: forjado com o MESMO n e aceito', aceitou(dOk),
      'se este falhar, os forjados abaixo nao provam nada');
  for(const [nome, n] of [['total zero', '0.00'], ['total menor que o sinal', '50.00'],
                          ['total ilegivel', '12,50'], ['total com tres casas', '1200.555']]){
    const d = await rodar(novo.bloco, forjar(n));
    chk('  [forjado] ' + nome + ' (n=' + n + ') -> RECUSADO', recusou(d), 'mostrou ' + d.valor);
  }
}

console.log('\n=== PARTE 4 -- as seis provas do sinal, nesta aba ===');
for(const cen of COM_SINAL){
  const tag = '  [' + cen.n + '] ';
  const link = novo.links[cen.n] || '';
  const e = esperado(cen);
  chk(tag + 'a ferramenta gerou o link, sem recusa', link.indexOf('?c=') > 0,
      (novo.alertas[cen.n] || []).join(' | ').slice(0, 90));
  if(link.indexOf('?c=') < 0) continue;
  const q = busca(link);
  const codigo = dec(pegar(q, 'c'));
  const pix = pixTeste(codigo);

  /* 1. A CONTA e 2. O NUMERO QUE O CLIENTE LE E O QUE AS DUAS PONTAS COBRAM */
  chk(tag + '1. o campo 54 do Pix e o SINAL (' + e.sinal.toFixed(2) + ')',
      pix.ok && pix.valor === e.sinal.toFixed(2), 'campo 54 = ' + pix.valor);
  chk(tag + '1. o parametro n e o TOTAL (' + e.total.toFixed(2) + ')',
      pegar(q, 'n') === e.total.toFixed(2), 'n = ' + pegar(q, 'n'));
  chk(tag + '5. o link com sinal NAO tem t nem x (desconto do Pix zerado na origem)',
      !temChave(q, 't') && !temChave(q, 'x'));
  chk(tag + '1. o selo contou o n (conta transcrita neste teste)',
      seloTeste(codigo, dec(pegar(q, 'd')), dec(pegar(q, 'pp') || ''), dec(pegar(q, 'v') || ''),
                '', '', dec(pegar(q, 'n'))) === pegar(q, 's'));

  const d = await rodar(novo.bloco, q);
  chk(tag + 'o bloco aceita e desenha o cartao', aceitou(d), 'recado=' + String(d.recado).slice(0, 50));
  if(!aceitou(d)) continue;

  /* 6. AS TRES LINHAS NA TELA -- e a regra da rodada F: elas so existem quando ha
     o que pagar depois. Com o saldo em zero as duas somem (conferido pelo DOM, nao
     pela aparencia), e o total em destaque continua sozinho dizendo a verdade. */
  chk(tag + '6. o numero em DESTAQUE e o total', d.valor === brl(e.total), 'tela = ' + d.valor);
  if(cen.saldoZero){
    chk(tag + 'F. saldo em zero: o saldo calculado E zero (senao este caso nao mede nada)',
        e.saldo === 0, 'saldo = ' + e.saldo);
    chk(tag + 'F. saldo em zero: NAO existe linha de sinal nem de saldo, pelo DOM',
        d.nSinal === 0 && d.nSaldo === 0, d.ordem.join(' > '));
    chk(tag + 'F. saldo em zero: nenhuma linha repete o numero do destaque',
        d.ordem.filter(cl => cl === 'fcpg-sinal' || cl === 'fcpg-saldo').length === 0);
  }else{
    chk(tag + '6. a linha do SINAL traz o sinal', d.sinal === 'Sinal agora: ' + brl(e.sinal), 'tela = ' + d.sinal);
    chk(tag + '6. a linha do SALDO traz o saldo', d.saldo === 'Saldo a pagar: ' + brl(e.saldo), 'tela = ' + d.saldo);
    chk(tag + '6. as duas linhas vem DEPOIS do valor e ANTES do prazo, pelo DOM',
        d.ordem.indexOf('fcpg-sinal') > d.ordem.indexOf('fcpg-valor') &&
        d.ordem.indexOf('fcpg-saldo') === d.ordem.indexOf('fcpg-sinal') + 1 &&
        (d.ordem.indexOf('fcpg-prazo') < 0 || d.ordem.indexOf('fcpg-prazo') > d.ordem.indexOf('fcpg-saldo')),
        d.ordem.join(' > '));
  }
  chk(tag + '5. nenhuma linha de desconto do Pix, e nenhum "-0%"',
      d.nPixlinha === 0 && String(d.valorRot).indexOf('%') < 0, 'rot=' + d.valorRot);

  /* 2. O PAYPAL COBRA O MESMO NUMERO */
  if(cen.c.ppmodo === 'nao'){
    chk(tag + '2. sem PayPal nesta cobranca, nenhum pedido foi criado', d.ppValor === null,
        String(d.ppValor));
  }else{
    chk(tag + '2. o createOrder do proprio bloco cobra o SINAL',
        d.ppValor === e.sinal.toFixed(2), 'amount.value = ' + d.ppValor);
    chk(tag + '2. os tres numeros do pedido sao o MESMO (armadilha do breakdown)',
        d.ppValor === d.ppItem && d.ppValor === d.ppBreak,
        d.ppValor + ' / ' + d.ppItem + ' / ' + d.ppBreak);
    chk(tag + '2. Pix e PayPal cobram o mesmo numero', d.ppValor === pix.valor,
        'pp=' + d.ppValor + ' pix=' + pix.valor);
  }

  /* 3. O ARREDONDAMENTO */
  if(cen.meio){
    const bruto = e.total * parseFloat(cen.s.pct) / 100;
    const porFixed = Number(bruto.toFixed(2));
    chk(tag + '3. este caso ESTA na familia do meio centavo (round ' + e.sinal.toFixed(2) +
        ' != toFixed ' + porFixed.toFixed(2) + ')', e.sinal !== porFixed);
    chk(tag + '3. as tres leituras ficaram com o valor do Math.round',
        pix.valor === e.sinal.toFixed(2) && d.sinal === 'Sinal agora: ' + brl(e.sinal) &&
        (cen.c.ppmodo === 'nao' || d.ppValor === e.sinal.toFixed(2)));
  }

  /* 6. A LINHA DO WHATSAPP, lida do href que o proprio bloco montou */
  const msg = dec((d.zapHref || '').split('text=')[1] || '');
  chk(tag + '6. o "Ja paguei" aponta para o WhatsApp', String(d.zapHref).indexOf('wa.me/') > 0);
  if(cen.saldoZero){
    chk(tag + 'F. saldo em zero: a mensagem NAO cita saldo nenhum',
        msg.indexOf('saldo de') < 0 && msg.indexOf(brl(e.total)) >= 0, 'mensagem = ' + msg);
  }else{
    chk(tag + '6. a mensagem cita o SINAL e o SALDO',
        msg.indexOf('(sinal de ' + brl(e.sinal) + '; saldo de ' + brl(e.saldo) + ')') >= 0,
        'mensagem = ' + msg);
  }
  chk(tag + '6. e o texto do dono chegou inteiro na mensagem',
      msg.indexOf(String(cen.c.desc || 'Ensaio de familia — pacote completo')) >= 0 ||
      msg.indexOf(dec(pegar(q, 'd'))) >= 0, 'mensagem = ' + msg.slice(0, 80));
  chk(tag + 'sem erro de console', errosReais(d.erros).length === 0, errosReais(d.erros).slice(0, 1).join(''));
}

console.log('\n=== PARTE 5 -- as recusas da GERACAO (e o pedido em zero, que aqui nao existe) ===');
/* NAO HA CARRINHO NESTA ABA, entao nao existe o estado "pedido em zero" que a
   rodada F consertou nas outras tres: o valor e digitado e a geracao o recusa
   em zero. O equivalente aqui e o conjunto de recusas abaixo -- e elas
   acontecem ANTES de o link existir, em vez de na tela do cliente. */
{
  const srv = await servir(RAIZ, 8803);
  const br = await navegador();
  const base = 'http://127.0.0.1:8803';
  const casos = [
    { n:'valor em zero, com sinal',   c:{ valor:'0' },        s:{ tipo:'pct', pct:'30' },  espera:'arredonda para zero' },
    { n:'sinal MAIOR que o valor',    c:{ valor:'50,00' },    s:{ tipo:'fixo', fixo:'100' }, espera:'maior que o valor da cobranca' },
    { n:'sinal que arredonda a zero', c:{ valor:'0,49' },     s:{ tipo:'pct', pct:'1' },   espera:'sinal desta cobranca arredonda para zero' },
    { n:'percentual apagado',         c:{ valor:'1200,50' },  s:{ tipo:'pct', pct:'' },    espera:'Informe o percentual do sinal' },
    { n:'valor fixo apagado',         c:{ valor:'1200,50' },  s:{ tipo:'fixo', fixo:'' },  espera:'Informe o valor fixo do sinal' }
  ];
  try{
    for(const caso of casos){
      const pg = await abrir(br, base);
      await preparar(pg); await clicar(pg, 'aba-cob');
      await cobranca(pg, caso.c); await ligarSinal(pg, caso.s);
      await clicar(pg, 'p-gerarlink'); await pg.waitForTimeout(80);
      const av = (await alertas(pg)).join(' | ');
      const link = (await ler(pg, 'p-out2')) || '';
      chk('  [recusa] ' + caso.n + ' -> recusado, com a frase certa',
          av.indexOf(caso.espera) >= 0 && !link, av.slice(0, 110) || 'SEM RECUSA, link=' + link.slice(0, 40));
      await pg.close();
    }
    /* O campo do desconto do Pix, na interface: desabilitado e com o aviso a
       vista -- a mesma correcao que a divida D2 fez na Mini loja. */
    const pg = await abrir(br, base);
    await preparar(pg); await clicar(pg, 'aba-cob'); await cobranca(pg, { descpix:'10' });
    const antes = await pg.evaluate(() => ({
      desab: document.getElementById('p-descpix').disabled,
      aviso: document.getElementById('p-descpix-aviso').getBoundingClientRect().height > 0
    }));
    chk('  [D2] sem sinal: o campo do desconto do Pix esta LIVRE e sem aviso',
        antes.desab === false && antes.aviso === false, JSON.stringify(antes));
    await ligarSinal(pg, { tipo:'pct', pct:'30' });
    const depois = await pg.evaluate(() => ({
      desab: document.getElementById('p-descpix').disabled,
      aviso: document.getElementById('p-descpix-aviso').getBoundingClientRect().height > 0,
      valor: document.getElementById('p-descpix').value
    }));
    chk('  [D2] com sinal: desabilitado, aviso a vista e o numero PRESERVADO',
        depois.desab === true && depois.aviso === true && depois.valor === '10', JSON.stringify(depois));
    await pg.close();
  } finally {
    await br.close(); srv.close();
  }
}

console.log('\n=== PARTE 6 -- a /cobrar gera o MESMO link, caractere por caractere ===');
/* A /cobrar e o TERCEIRO gerador do mesmo endereco. Se ela divergir num
   caractere, o selo nao fecha e a /pagar recusa o link do dono -- com o cliente
   na frente. Esta parte e o invariante byte a byte da rodada. */
{
  const srv = await servir(RAIZ, 8804);
  const br = await navegador();
  const base = 'http://127.0.0.1:8804';
  const casos = [COM_SINAL[0], COM_SINAL[4], COM_SINAL[6], FORMATOS[0], FORMATOS[5]];
  try{
    for(const cen of casos){
      const pg = await abrir(br, base);
      await preparar(pg); await clicar(pg, 'aba-cob');
      await cobranca(pg, cen.c);
      if(cen.s) await ligarSinal(pg, cen.s);
      await clicar(pg, 'p-gerarlink'); await pg.waitForTimeout(100);
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
      await radio(pg, 'cb-sinal', cen.s ? 'sim' : 'nao');
      if(cen.s){
        await radio(pg, 'cb-sinaltipo', cen.s.tipo);
        if(cen.s.tipo === 'fixo') await set(pg, 'cb-sinalfixo', cen.s.fixo);
        else await set(pg, 'cb-sinalpct', cen.s.pct);
      }
      await clicar(pg, 'cb-gerar'); await pg.waitForTimeout(100);
      const daCobrar = (await ler(pg, 'cb-out')) || '';
      chk('  [' + cen.n + '] a /cobrar gerou o link', daCobrar.indexOf('?c=') > 0,
          (await pg.evaluate(() => window.__alertas.join(' | '))).slice(0, 90) ||
          (await pg.evaluate(() => { const e = document.getElementById('cb-recusa'); return e ? e.textContent.slice(0, 120) : ''; })));
      chk('  [' + cen.n + '] identico ao da aba, caractere por caractere', daAba === daCobrar,
          'aba  = ' + daAba.slice(-70) + '\n                cobrar = ' + daCobrar.slice(-70));
      await pg.close();
    }
  } finally {
    await br.close(); srv.close();
  }
}

console.log('\n=== PARTE 7 -- a maquinaria entra SEMPRE no bloco, com ou sem sinal na cobranca aberta ===');
/* Mesma regra que o desconto ja segue, e pela mesma razao medida: o bloco nao
   pode depender do que estava configurado no dia em que foi gerado, senao o
   dono liga o sinal no computador e o celular gera um link que a pagina nao
   sabe exibir. O bloco colhido acima foi gerado com a cobranca padrao -- SEM
   sinal --, e ele tem de saber ler um link com sinal assim mesmo. */
{
  const b = novo.bloco;
  chk('  o bloco declara SINAL_AGORA', b.indexOf('var SINAL_AGORA=0;') >= 0);
  chk('  o bloco tem saldoAgora()', b.indexOf('function saldoAgora()') >= 0);
  chk('  a seloDe do bloco tem os SETE parametros', b.indexOf('function seloDe(pc,pd,pp,pv,pt,px,pn)') >= 0);
  chk('  a chamada do selo passa o n', b.indexOf("param('x'),param('n'))") >= 0);
  chk('  existe UMA e so uma definicao de totalPix', (b.match(/function totalPix\(/g) || []).length === 1,
      'achei ' + (b.match(/function totalPix\(/g) || []).length);
  chk('  totalPix NAO foi alterada: ela continua sendo a conta do desconto',
      b.indexOf('if(DESCONTO_PIX>0)t=t*(1-DESCONTO_PIX/100);') >= 0);
  /* NENHUM uso de totalPix() alcanca o caminho do sinal. Sao duas formas de estar
     protegido, e as duas contam: o DESCONTO_PIX>0 na propria linha, e a conferencia 4b,
     que mora DENTRO do ramo "if(pt||px){" -- e por isso ela e medida pela POSICAO, entre
     a leitura do t e a leitura do n, e nao por uma palavra na linha. */
  {
    const linhas = b.split('\n');
    /* COMENTARIO NAO E USO, e distinguir os dois exige acompanhar o estado do
       parser -- uma linha do MEIO de um /* ... *\/ nao comeca por '*' nem contem
       '/*', e foi assim que esta prova acusou sozinha na primeira passagem. */
    const codigo = [];
    let dentro = false;
    linhas.forEach((l, i) => {
      const abre = l.indexOf('/*'), fecha = l.indexOf('*' + '/');
      const eraComentario = dentro;
      if(!dentro && abre >= 0 && fecha < 0) dentro = true;
      else if(dentro && fecha >= 0) dentro = false;
      const soComentario = eraComentario || (abre >= 0 && abre < (l.indexOf('totalPix()') + 1 || 1e9));
      if(!soComentario) codigo.push([l, i]);
    });
    const usos = codigo.filter(([l]) => l.indexOf('totalPix()') >= 0 && l.indexOf('function totalPix') < 0);
    const iT = linhas.findIndex(l => l.indexOf("var pt=param('t')") >= 0);
    const iN = linhas.findIndex(l => l.indexOf("var pn=param('n')") >= 0);
    chk('  o ramo do desconto vem ANTES do ramo do sinal', iT > 0 && iN > iT, 't=' + iT + ' n=' + iN);
    chk('  ha usos de totalPix a medir (senao esta prova nao diz nada)', usos.length >= 2,
        'usos=' + usos.length);
    chk('  nenhum uso de totalPix alcanca o caminho do sinal',
        usos.every(([l, i]) => l.indexOf('DESCONTO_PIX>0') >= 0 || (i > iT && i < iN)),
        usos.filter(([l, i]) => l.indexOf('DESCONTO_PIX>0') < 0 && !(i > iT && i < iN))
            .map(([l]) => l.trim()).join(' // '));
  }
  chk('  o bloco recusa n junto de t/x', b.indexOf('if(pt||px){recado(TXT_CODIGO_RUIM);return;}') >= 0);
  chk('  o bloco sai IDENTICO com o sinal ligado na aba (e o que sustenta o naoEmite)',
      novo.blocoComSinal === b,
      'com sinal=' + (novo.blocoComSinal || '').length + ' sem=' + b.length);
  chk('  sem erro nem recusa ao gerar o bloco', (novo.alertasBloco || []).length === 0,
      (novo.alertasBloco || []).join(' | '));
}

console.log('\n=== PARTE 8 -- texto HOSTIL nos tres campos novos, com o bloco executando ===');
/* Os tres campos desta rodada (p-txt-sinal, p-txt-saldo, p-txt-zap-sinal) ainda
   NAO estao na tabela TEXTOS de cenario.mjs, entao a passagem configurada da
   regressao nao os alcanca: este e o unico lugar que mede o escape deles. E a
   medida e o DOCUMENTO INTEIRO SOBREVIVER -- um '</script' nao blindado corta o
   <script> do bloco no meio, e o que se ve nao e um texto errado, e sim uma
   pagina que nao roda. */
{
  const HOSTIL = {
    'p-txt-sinal':    "Sinal 'agora' \\ \"ja\" </script> {valor}",
    'p-txt-saldo':    "Saldo & 50% <ok> </script> {valor}",
    'p-txt-zap-sinal':"(sinal 'de' {sinal} \\ \"saldo\" de {saldo} </script>)"
  };
  const srv = await servir(RAIZ, 8805);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8805');
    await preparar(pg); await clicar(pg, 'aba-cob');
    await cobranca(pg, { valor:'1200,50' });
    for(const [id, v] of Object.entries(HOSTIL)) await set(pg, id, v);
    await ligarSinal(pg, { tipo:'pct', pct:'30' });
    await clicar(pg, 'p-gerar');
    await clicar(pg, 'p-gerarlink');
    await pg.waitForTimeout(120);
    const bloco = (await ler(pg, 'p-out1')) || '';
    const link = (await ler(pg, 'p-out2')) || '';
    await pg.close();
    chk('  [hostil] a ferramenta gerou bloco e link', bloco.length > 1000 && link.indexOf('?c=') > 0);
    chk('  [hostil] o </script> saiu BLINDADO no bloco (nenhum fechamento cru)',
        bloco.indexOf('</scr' + 'ipt>') === bloco.lastIndexOf('</scr' + 'ipt>'),
        'fechamentos = ' + (bloco.split('</scr' + 'ipt>').length - 1));
    const d = await rodar(bloco, busca(link));
    chk('  [hostil] o bloco INTEIRO sobreviveu e desenhou o cartao', aceitou(d),
        'recado=' + String(d.recado).slice(0, 50));
    const e = { total:1200.50, sinal:r2(1200.50 * 30 / 100), saldo:r2(1200.50 - r2(1200.50 * 30 / 100)) };
    chk('  [hostil] a linha do sinal chegou inteira, com o numero no lugar do marcador',
        d.sinal === HOSTIL['p-txt-sinal'].replace('{valor}', brl(e.sinal)), 'tela = ' + d.sinal);
    chk('  [hostil] a linha do saldo chegou inteira',
        d.saldo === HOSTIL['p-txt-saldo'].replace('{valor}', brl(e.saldo)), 'tela = ' + d.saldo);
    const msg = dec((d.zapHref || '').split('text=')[1] || '');
    chk('  [hostil] a linha do WhatsApp chegou inteira, com os dois marcadores trocados',
        msg.indexOf(HOSTIL['p-txt-zap-sinal'].replace('{sinal}', brl(e.sinal)).replace('{saldo}', brl(e.saldo))) >= 0,
        'mensagem = ' + msg);
    /* O '<ok>' do texto do saldo tem de chegar LITERAL ao textContent. Se ele
       tivesse virado marcacao, o parser o consumiria como tag e o textContent
       voltaria SEM ele -- e a diferenca entre "texto por no de texto" e "texto
       por innerHTML" apareceria exatamente aqui. */
    chk('  [hostil] o "<ok>" chegou LITERAL ao texto (foi por no de texto, nao por innerHTML)',
        String(d.saldo || '').indexOf('<ok>') >= 0, 'tela = ' + d.saldo);
    chk('  [hostil] sem erro de console', errosReais(d.erros).length === 0,
        errosReais(d.erros).slice(0, 1).join(''));
  } finally {
    await br.close(); srv.close();
  }
}

console.log('\nerros de console na ferramenta: ' + (errosReais(novo.erros).slice(0, 3).join(' | ') || 'nenhum'));
process.exit(resumo());
