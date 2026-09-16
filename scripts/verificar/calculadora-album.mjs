/* ============================================================================
   A CALCULADORA NOVA COBRA O MESMO QUE A QUE ESTA NO AR?
   ============================================================================
   O QUE ELA PROMETE. A aba "Calculadora de album" (15/09/2026) substitui a
   calculadora escrita a mao que vive num iframe na pagina fotocerta.com.br/albuns.
   A promessa feita ao dono foi: o bloco novo cobra o MESMO valor que o publicado,
   em TODAS as combinacoes de tamanho x quantidade de fotos x acabamentos -- e nao
   por amostragem.

   COMO A PROVA E FEITA. Dois caminhos independentes para o mesmo numero:

     lado A  a calculadora PUBLICADA, capturada rodando de verdade num navegador,
             com os valores LIDOS DA TELA (o que o cliente enxerga). A captura esta
             congelada em scripts/verificar/referencia-album.tsv -- 2.760 linhas,
             seis tamanhos, cada quantidade de fotos possivel de cada um, as quatro
             combinacoes de acabamento. Ela e uma FOTOGRAFIA de um artefato externo
             (uma pagina publicada), e nao um commit deste repositorio: por isso ela
             NAO envelhece com o codigo, e por isso ela pode ser congelada.

     lado B  o bloco que a aba gera HOJE, executado numa pagina do molde comum, com
             os valores tambem lidos da tela.

   Se os dois discordarem em um centavo, em uma lamina que seja, a promessa esta
   quebrada -- e e isso que as verificacoes abaixo cobram.

   O QUE ESTA PROVA NAO E. Ela nao transcreve a conta da calculadora publicada para
   dentro deste arquivo. Transcricao que repete a forma do original nao e segunda
   opiniao, e eco -- foi o que este projeto ja mediu em 13/09/2026, quando uma prova
   do sinal repetiu a conta errada do original e passou.

   A UNICA DIVERGENCIA PREVISTA, e ela e ZERO hoje. A calculadora publicada calcula
   o desconto em ponto flutuante (base * pct / 100); o bloco novo calcula em centavos
   inteiros, como o cupom do Checkout desde 13/09/2026. Com o preco de hoje (R$ 30,
   inteiro) e faixas multiplas de 5, as duas formas dao exatamente o mesmo numero em
   todas as 2.760 linhas -- medido. A parte 3 mede a diferenca no caso que importa:
   preco por foto COM centavos.

   ROTEIRO: node scripts/verificar/calculadora-album.mjs
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set } from './lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF  = path.join(RAIZ, 'scripts', 'verificar', 'referencia-album.tsv');
const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};

/* ===========================================================================
   O bloco gerado pela aba, com a configuracao de FABRICA -- que e exatamente a
   da calculadora publicada: R$ 30 por foto, 10 a 45 laminas, os seis tamanhos,
   as cinco faixas e os dois acabamentos.
   O SINAL e DESLIGADO aqui de proposito: ele nao muda total(), e desligando-o o
   bloco emite tambem a linha do desconto no Pix -- os dois caminhos que a parte 2
   confere. A parte 4 mede o sinal ligado, que e a fabrica da aba.
   =========================================================================== */
async function blocoDaAba(ajustes, porta) {
  const r = await gerarNaFerramenta(async (p) => {
    for (const [k, v] of Object.entries(IDENT)) await set(p, 'fci-' + k, v);
    await p.click('#aba-alb');
    await p.waitForTimeout(400);
    await set(p, 'v-cod', 'ALBUM');
    if (ajustes) await ajustes(p);
    await p.click('#v-gerar');
    await p.waitForTimeout(600);
  }, ['v-out'], {porta: porta});
  chk('[0] a aba gerou sem recusa (porta ' + porta + ')', r.alertas.length === 0, r.alertas.join(' | '));
  return r.valores['v-out'] || '';
}

/* Le da TELA do bloco, como o cliente leria. */
const LER = () => {
  const q = (s) => document.querySelector(s);
  const t = (s) => { const e = q(s); return e ? e.textContent.trim() : null; };
  return {
    base: t('.fcal-base-v'),
    total: t('.fcal-total-v'),
    laminas: (t('.fcal-laminas') || '').replace(/\D+/g, ' ').trim().split(' ')[0],
    fotos: (q('.fcal-campo') || {}).value,
    sinal: t('.fcal-sinal-v'),
    saldo: t('.fcal-saldo-v'),
    pix: t('.fcal-pixlinha-v')
  };
};

const linhas = fs.readFileSync(REF, 'utf8').trim().split('\n').slice(1)
  .map(l => { const [cm, fotos, e1, e2, lam, base, final] = l.split('\t');
              return {cm:+cm, fotos:+fotos, e1:+e1, e2:+e2, lam:+lam, base, final}; });

/* ---- parte 1: a aba gera, e gera o que se espera ---- */
const bloco = await blocoDaAba(async (p) => {
  await p.evaluate(() => {
    const r = document.querySelector('input[name="v-sinal"][value="nao"]');
    if (r) { r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); }
  });
  await p.waitForTimeout(300);
}, 8951);
chk('[1] a aba gerou o bloco', bloco.length > 1000, 'tamanho ' + bloco.length);
chk('[1] o bloco traz a raiz propria', bloco.indexOf('id="fcal-raiz"') >= 0);
chk('[1] e a virada por CONTAINER, nunca por janela',
    bloco.indexOf('@container') >= 0 && bloco.indexOf('container-type:inline-size') >= 0);
chk('[1] nenhuma @media de largura sobrou no bloco',
    !/@media[^{]*width/.test(bloco), 'o bloco vive numa coluna: quem manda e a largura dele');
/* O bloco tem de FECHAR o proprio script uma vez so, e o resto do texto nao pode
   trazer a sequencia crua -- e a armadilha registrada em escJs. */
chk('[1] o bloco fecha o script uma vez so',
    (bloco.match(/<\/scr'?\+?'?ipt>|<\/script>/g) || []).length === 1);

/* ---- parte 2: o INVARIANTE, linha por linha ---- */
await comBlocoNaPagina({bloco, porta: 8952, medir: async (p) => {
  await p.waitForTimeout(400);
  let difs = [], conferidas = 0;
  let cmAtual = null, acabAtual = null;
  for (const L of linhas) {
    if (cmAtual !== L.cm) {
      const ok = await p.evaluate((cm) => {
        const bs = [].slice.call(document.querySelectorAll('.fcal-tam'));
        const b = bs.filter(x => (x.textContent || '').indexOf(String(cm) + ' ') === 0)[0];
        if (!b) return false;
        b.click();
        return true;
      }, L.cm);
      if (!ok) { difs.push('nao achei o botao de ' + L.cm + ' cm'); break; }
      cmAtual = L.cm; acabAtual = null;
    }
    const chaveAcab = L.e1 + '|' + L.e2;
    if (acabAtual !== chaveAcab) {
      await p.evaluate(([a, b]) => {
        const cx = [].slice.call(document.querySelectorAll('.fcal-acab'));
        [a, b].forEach((quer, i) => {
          if (!cx[i]) return;
          const on = cx[i].getAttribute('aria-checked') === 'true';
          if (on !== !!quer) cx[i].click();
        });
      }, [L.e1, L.e2]);
      acabAtual = chaveAcab;
    }
    const lido = await p.evaluate((n) => {
      const b = document.querySelector('.fcal-range');
      b.value = String(n);
      b.dispatchEvent(new Event('input', {bubbles:true}));
      const q = (s) => { const e = document.querySelector(s); return e ? e.textContent.trim() : null; };
      return {
        base: q('.fcal-base-v'),
        total: q('.fcal-total-v'),
        lam: (q('.fcal-laminas') || '').replace(/[^0-9]+/g, ' ').trim().split(' ')[0],
        fotos: document.querySelector('.fcal-campo').value
      };
    }, L.fotos);
    conferidas++;
    if (String(lido.fotos) !== String(L.fotos)) difs.push(L.cm + 'cm/' + L.fotos + ' fotos: a tela ficou em ' + lido.fotos);
    else if (lido.base !== L.base) difs.push(L.cm + 'cm/' + L.fotos + ' base: ' + lido.base + ' x ' + L.base);
    else if (lido.total !== L.final) difs.push(L.cm + 'cm/' + L.fotos + '/' + L.e1 + L.e2 + ' total: ' + lido.total + ' x ' + L.final);
    else if (String(lido.lam) !== String(L.lam)) difs.push(L.cm + 'cm/' + L.fotos + ' laminas: ' + lido.lam + ' x ' + L.lam);
    if (difs.length > 6) break;
  }
  chk('[2] conferiu as ' + linhas.length + ' combinacoes da referencia', conferidas === linhas.length,
      'conferidas ' + conferidas);
  chk('[2] o bloco novo cobra o MESMO que a calculadora publicada, em todas elas',
      difs.length === 0, difs.slice(0, 6).join(' | '));
}});

/* ---- parte 3: onde as duas contas DE FATO divergem ---- */
/* A forma em centavos inteiros existe para o dia em que o preco por foto tiver centavos.
   Aqui ela e medida contra a forma antiga, no proprio navegador, sem transcricao: as duas
   expressoes sao avaliadas lado a lado. */
await comBlocoNaPagina({bloco, porta: 8953, medir: async (p) => {
  const r = await p.evaluate(() => {
    function jsr(x){ return Math.round(x); }
    let difs = 0, tot = 0, exemplo = null, contra = 0;
    for (let pc = 100; pc <= 6000; pc++) {
      const preco = pc / 100;
      for (const [media, cm] of [[2,20],[2.5,25],[3,30],[3.5,35],[4,40],[4.5,45]]) {
        const lo = cm, hi = jsr(45 * media);
        for (let fotos = lo; fotos <= hi; fotos++) {
          const lam = jsr(fotos / media);
          let pct = 0;
          for (const [l, p2] of [[10,0],[16,5],[21,10],[26,15],[31,20]]) if (lam >= l) pct = p2;
          if (!pct) continue;
          const base = fotos * preco;
          tot++;
          const antigo = jsr(base * pct / 100 * 100) / 100;
          const novo = jsr(jsr(base * 100) * pct / 100) / 100;
          if (antigo !== novo) {
            difs++;
            if (novo > antigo) contra++;
            if (!exemplo) exemplo = {preco, cm, fotos, pct, antigo, novo};
          }
        }
      }
    }
    return {difs, tot, exemplo, contra};
  });
  chk('[3] com preco em centavos, as duas contas DIVERGEM', r.difs > 0,
      r.difs + ' de ' + r.tot + ' (' + (r.difs / r.tot * 100).toFixed(3) + '%)');
  chk('[3] e a forma antiga da SEMPRE desconto menor -- contra o cliente',
      r.contra === r.difs, r.contra + ' de ' + r.difs + ' · ex.: ' + JSON.stringify(r.exemplo));
}});

/* ---- parte 4: o pacote de pagamento chegou inteiro ---- */
const blocoPag = await blocoDaAba(null, 8954);   /* fabrica: sinal ligado em 50% */
chk('[4] o sinal entra de fabrica, em 50%', /SINAL_TIPO='pct'/.test(blocoPag) && /SINAL_VALOR=50/.test(blocoPag));
chk('[4] os tres textos do sinal nascem PREENCHIDOS nesta aba',
    blocoPag.indexOf('fila de produção') >= 0 && blocoPag.indexOf('aprovação do design') >= 0);
chk('[4] o Pix leva a maquinaria do BR Code', blocoPag.indexOf('function montarPayload') >= 0);
/* O PEDIDO ITEM A ITEM SO EXISTE SEM SINAL, e isso e regra da familia, nao descuido:
   com sinal o cliente paga uma fracao, e o formato do PayPal nao tem campo para entrada --
   detalhar ali faria o recibo chamar de "desconto" o saldo que ele ainda deve. As duas
   metades sao medidas, para a ausencia ficar DECLARADA em vez de suposta. */
chk('[4] sem sinal, o PayPal leva o pedido item a item', bloco.indexOf('function ppDetalhar') >= 0);
chk('[4] com sinal, o PayPal cobra em linha unica (o formato nao tem campo para entrada)',
    blocoPag.indexOf('function ppDetalhar') < 0);
chk('[4] o resumo copiavel entra', blocoPag.indexOf('function textoResumo') >= 0);
chk('[4] o botao do WhatsApp entra', blocoPag.indexOf('function avisarZap') >= 0);
/* SEM UPSELL CONFIGURADO, NADA DE UPSELL SAI -- corrigido em 16/09/2026, e a assercao aqui
   estava DEFENDENDO o defeito. Ela vinha de quando esta aba chamava fcUpsellVarsSrc com o
   'sempre', copiado da Link de cobranca; la ele existe porque o endereco do upsell pode vir
   NO LINK da cobranca, e o bloco tem de saber lidar com ele mesmo com o campo da pagina
   vazio. Esta aba nao tem link: o 'sempre' so punha duas variaveis mortas e um comentario
   sobre uma precedencia inexistente em todo bloco entregue. Agora ela segue as tres irmas
   sem link, e a prova mede as DUAS metades -- o que sai quando ha upsell, e o silencio
   quando nao ha. Achado por upsell.mjs, que passou a cobrir esta aba. */
chk('[4] SEM upsell configurado, nenhuma variavel de upsell sai',
    !/UPSELL_URL/.test(blocoPag) && !/UPSELL_ATIVO/.test(blocoPag));
chk('[4] com sinal, o Pix cobra o SINAL e nao o total',
    blocoPag.indexOf('function totalPix(){return sinalAgora();}') >= 0);

/* ===========================================================================
   PARTE 5 -- O PAGAMENTO EXECUTADO, e nao procurado por nome de funcao
   ===========================================================================
   Ate 16/09/2026 as partes acima provavam a CONTA (2.760 combinacoes, zero
   divergencia) e conferiam o pagamento por PRESENCA DE TEXTO: procuravam
   'function montarPayload' dentro do bloco. O bloco chegava a rodar, mas so
   para ler preco na tela. Sinal calculado sobre a base errada, desconto
   aplicado duas vezes ou QR com o valor do total em vez do sinal passariam
   na bateria inteira -- a unica testemunha era uma busca por nome.

   Aqui o bloco RODA e o dinheiro e lido de volta:
     - o BR Code do Pix, relido por um leitor TLV escrito NESTE arquivo, com o
       CRC refeito aqui tambem. Transcrever a conta do original seria eco, e
       nao segunda opiniao -- entao o que se compara e o campo 54 contra o
       numero que o CLIENTE LE NA TELA, que e a promessa de verdade;
     - o pedido do PayPal, pedido ao createOrder do proprio bloco;
     - a mensagem do WhatsApp, lida do endereco que o bloco manda abrir.

   OS DOIS ESTADOS que mudam quem e cobrado: com sinal (o Pix cobra o SINAL) e
   sem sinal com desconto no Pix (o Pix cobra o total DESCONTADO). Sao os dois
   ramos de fcTotalPixSrc, e errar entre eles cobra o valor errado do cliente.
   =========================================================================== */
console.log('\n=== PARTE 5 -- o pagamento executado ===');

/* O leitor TLV e o CRC, escritos aqui: id de 2, tamanho de 2, valor. */
function crcTeste(s){
  let crc = 0xFFFF;
  for (let i = 0; i < s.length; i++) {
    crc ^= (s.charCodeAt(i) & 0xFF) << 8;
    for (let b = 0; b < 8; b++)
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
  }
  return ('000' + crc.toString(16).toUpperCase()).slice(-4);
}
function lerPix(codigo){
  const campos = {};
  let i = 0;
  while (i + 4 <= codigo.length) {
    const id = codigo.substr(i, 2);
    const n = parseInt(codigo.substr(i + 2, 2), 10);
    if (!isFinite(n)) return {erro: 'tamanho ilegível em ' + i};
    campos[id] = codigo.substr(i + 4, n);
    i += 4 + n;
  }
  return {
    crcOk: codigo.slice(-4) === crcTeste(codigo.slice(0, -4)),
    valor: campos['54'], chave: (campos['26'] || ''), campos
  };
}
const soNum = s => String(s || '').replace(/[^0-9,]/g, '').replace(',', '.');

/* A sonda do SDK do PayPal precisa estar de pe ANTES do bloco. */
const CABECA = '<scr' + 'ipt>(function(){\n'
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
  + 'window.__abriu=[];window.open=function(u){window.__abriu.push(String(u));return null;};\n'
  + '})();</scr' + 'ipt>';

/* Monta o carrinho na tela do bloco e devolve tudo o que o cliente LE. */
const MEXER = async (p, cm, fotos, acabs) => p.evaluate(([cm, fotos, acabs]) => {
  const bs = [].slice.call(document.querySelectorAll('.fcal-tam'));
  const b = bs.filter(x => (x.textContent || '').indexOf(String(cm) + ' ') === 0)[0];
  if (b) b.click();
  const cx = [].slice.call(document.querySelectorAll('.fcal-acab'));
  acabs.forEach((quer, i) => {
    if (!cx[i]) return;
    if ((cx[i].getAttribute('aria-checked') === 'true') !== !!quer) cx[i].click();
  });
  const r = document.querySelector('.fcal-range');
  r.value = String(fotos);
  r.dispatchEvent(new Event('input', {bubbles: true}));
  const q = s => { const e = document.querySelector(s); return e ? e.textContent.trim() : null; };
  return {total: q('.fcal-total-v'), sinal: q('.fcal-sinal-v'), saldo: q('.fcal-saldo-v'),
          pix: q('.fcal-pixlinha-v'), fotos: document.querySelector('.fcal-campo').value};
}, [cm, fotos, acabs]);

/* ---- 5a. COM SINAL (a fábrica): o Pix cobra o sinal ---- */
await comBlocoNaPagina({bloco: blocoPag, cabeca: CABECA, porta: 8955, medir: async (p) => {
  await p.waitForTimeout(500);
  const tela = await MEXER(p, 30, 60, [true, false]);
  chk('[5a] a tela montou o pedido', tela.total !== null, JSON.stringify(tela));
  const pix = await p.evaluate(() => {
    document.querySelector('.fcal-gerar').click();
    return {cola: (document.querySelector('.fcal-cola') || {}).value || '',
            mostrado: (document.querySelector('.fcal-pixval-v') || {}).textContent || ''};
  });
  const d = lerPix(pix.cola);
  chk('[5a] o código Pix foi gerado', pix.cola.length > 60, String(pix.cola.length));
  chk('[5a] e o CRC fecha, refeito por este arquivo', d.crcOk === true, JSON.stringify(d).slice(0, 180));
  chk('[5a] o valor DENTRO do código é o SINAL, e não o total',
      d.valor === soNum(tela.sinal),
      'campo54=' + d.valor + ' · sinal na tela=' + tela.sinal + ' · total=' + tela.total);
  chk('[5a] e é o mesmo que o bloco mostra ao lado do QR',
      soNum(pix.mostrado) === d.valor, pix.mostrado + ' x ' + d.valor);
  /* o PayPal, com sinal, cobra o sinal e em LINHA UNICA */
  const ped = await p.evaluate(() => {
    if (!window.__pp || !window.__pp.createOrder) return {erro: 'sem createOrder'};
    try { return {pu: window.__pp.createOrder(null, {order: {create: x => x}}).purchase_units[0]}; }
    catch (e) { return {erro: String(e && e.message || e)}; }
  });
  chk('[5a] o PayPal montou o pedido', !ped.erro, JSON.stringify(ped).slice(0, 160));
  chk('[5a] e o cartão cobra o SINAL, o mesmo do Pix',
      ped.pu && ped.pu.amount.value === soNum(tela.sinal),
      (ped.pu ? ped.pu.amount.value : '?') + ' x ' + tela.sinal);
  chk('[5a] em linha única — o formato do PayPal não tem campo para entrada',
      !!(ped.pu && ped.pu.items && ped.pu.items.length === 1),
      ped.pu ? String((ped.pu.items || []).length) : '?');
  /* o WhatsApp leva os mesmos numeros */
  const zap = await p.evaluate(() => {
    const b = document.querySelector('.fcal-zap');
    if (!b) return {erro: 'sem botão'};
    b.click();
    return {url: (window.__abriu || [])[0] || ''};
  });
  const msg = decodeURIComponent(String(zap.url).split('text=')[1] || '');
  chk('[5a] o WhatsApp abre com a mensagem', msg.length > 20, JSON.stringify(zap).slice(0, 160));
  chk('[5a] e ela leva o sinal e o saldo que estão na tela',
      msg.indexOf(tela.sinal) >= 0 && msg.indexOf(tela.saldo) >= 0,
      'sinal=' + tela.sinal + ' saldo=' + tela.saldo);
  chk('[5a] sem erro de console próprio do bloco',
      (p.erros || []).filter(x => !/paypal\.com|cdnjs|ERR_|Failed to load/i.test(x)).length === 0,
      (p.erros || []).slice(0, 2).join(' | '));
}});

/* ---- 5b. SEM SINAL, COM DESCONTO NO PIX: o Pix cobra o total descontado ---- */
const blocoDesc = await blocoDaAba(async (p) => {
  await p.evaluate(() => {
    const r = document.querySelector('input[name="v-sinal"][value="nao"]');
    if (r) { r.checked = true; r.dispatchEvent(new Event('change', {bubbles: true})); }
  });
  await p.waitForTimeout(300);
  /* UM SKU EM CADA PONTA. A fabrica nasce SEM SKU -- e o bloco, corretamente, nao emite o
     campo quando nao ha nenhum. Cadastrar aqui e o que torna a assercao do SKU possivel;
     sem isso ela mediria a ausencia e passaria por engano (foi o que aconteceu na primeira
     execucao, e a falha era do teste, nao do bloco). */
  await set(p, 'v-tam-cm', '60'); await set(p, 'v-tam-media', '6');
  await set(p, 'v-tam-minfotos', '60'); await set(p, 'v-tam-sku', 'ALB-60');
  await p.click('#v-tam-add');
  await set(p, 'v-ac-nome', 'Luva de linho'); await set(p, 'v-ac-valor', '250');
  await set(p, 'v-ac-sku', 'LUVA-LN');
  await p.click('#v-ac-add');
  await p.waitForTimeout(200);
}, 8956);
await comBlocoNaPagina({bloco: blocoDesc, cabeca: CABECA, porta: 8957, medir: async (p) => {
  await p.waitForTimeout(500);
  const tela = await MEXER(p, 60, 120, [true, false, true]);
  chk('[5b] a linha do desconto no Pix aparece', !!tela.pix, JSON.stringify(tela));
  const cola = await p.evaluate(() => {
    document.querySelector('.fcal-gerar').click();
    return (document.querySelector('.fcal-cola') || {}).value || '';
  });
  const d = lerPix(cola);
  chk('[5b] o CRC fecha', d.crcOk === true, String(d.crcOk));
  chk('[5b] o valor dentro do código é o total DESCONTADO, e não o cheio',
      d.valor === soNum(tela.pix) && d.valor !== soNum(tela.total),
      'campo54=' + d.valor + ' · no Pix=' + tela.pix + ' · total=' + tela.total);
  const ped = await p.evaluate(() => {
    if (!window.__pp || !window.__pp.createOrder) return {erro: 'sem createOrder'};
    try { return {pu: window.__pp.createOrder(null, {order: {create: x => x}}).purchase_units[0]}; }
    catch (e) { return {erro: String(e && e.message || e)}; }
  });
  /* O CARTAO COBRA O CHEIO, e o Pix o descontado -- os dois numeros existem ao mesmo
     tempo na tela de proposito, e trocar um pelo outro cobra errado. */
  chk('[5b] e o cartão cobra o valor CHEIO, não o do Pix',
      ped.pu && ped.pu.amount.value === soNum(tela.total),
      (ped.pu ? ped.pu.amount.value : '?') + ' x total=' + tela.total + ' x pix=' + tela.pix);
  chk('[5b] sem sinal, o pedido do PayPal vai ITEMIZADO',
      !!(ped.pu && ped.pu.items && ped.pu.items.length >= 2),
      ped.pu ? String((ped.pu.items || []).length) : '?');
  chk('[5b] e a soma dos itens bate com o cobrado, ao centavo',
      !!(ped.pu && Math.round(ped.pu.items.reduce((s, it) =>
          s + Math.round(parseFloat(it.unit_amount.value) * 100) * parseInt(it.quantity, 10), 0))
          === Math.round(parseFloat(ped.pu.amount.breakdown.item_total.value) * 100)),
      ped.pu ? JSON.stringify(ped.pu.amount.breakdown) : '?');
  chk('[5b] o álbum leva o SKU do TAMANHO escolhido, e o acabamento o dele',
      !!(ped.pu && ped.pu.items.some(i => i.sku === 'ALB-60')
                && ped.pu.items.some(i => i.sku === 'LUVA-LN')),
      ped.pu ? JSON.stringify(ped.pu.items.map(i => ({n: i.name, sku: i.sku}))) : '?');
  chk('[5b] sem erro de console próprio do bloco',
      (p.erros || []).filter(x => !/paypal\.com|cdnjs|ERR_|Failed to load/i.test(x)).length === 0,
      (p.erros || []).slice(0, 2).join(' | '));
}});

/* O CODIGO DE SAIDA E O RESULTADO, e nao um zero por descuido (16/09/2026). Nove suites
   chamavam resumo() e saiam com 0 aconteca o que acontecesse -- e chave-pix-limpeza
   estava FALHANDO e anunciando sucesso. Qualquer script que rode a bateria e olhe o
   codigo de saida a via verde. E pior que vermelho permanente: vermelho que ninguem
   olha ainda esta la; verde falso apaga o defeito. */
process.exit(resumo());
