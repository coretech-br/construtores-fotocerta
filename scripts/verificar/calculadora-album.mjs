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
chk('[4] as duas variaveis do upsell entram mesmo desligado',
    /UPSELL_URL/.test(blocoPag) && /UPSELL_ATIVO=false/.test(blocoPag));
chk('[4] com sinal, o Pix cobra o SINAL e nao o total',
    blocoPag.indexOf('function totalPix(){return sinalAgora();}') >= 0);

resumo();
