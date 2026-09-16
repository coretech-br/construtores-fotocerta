/* ============================================================================
   A FRASE DO "CODIGO COPIADO", UMA SO NAS QUATRO ABAS (leva 6, 14/09/2026)
   ============================================================================
   A DECISAO DO DONO: as quatro abas de pagamento passam a dizer, de fabrica,
   "Código copiado! Cole no aplicativo do seu banco." Razao dele, e e a certa: e o
   momento em que o cliente esta prestes a SAIR DA PAGINA -- para o aplicativo do
   banco --, e a frase diz o que fazer em seguida. A Agendamento por pacote e o Link
   de cobranca ja diziam isso; o Checkout e a Mini loja diziam so "Código copiado!".

   POR QUE ISTO MERECE UM ARQUIVO, se e "trocar um valor". Porque a confirmacao de
   copia so existe DEPOIS de um clique, e em duas das quatro abas ela e escrita
   dentro do ouvinte -- nenhuma varredura de texto prova que o cliente a le. Aqui os
   QUATRO blocos sao EXECUTADOS: nas duas que escrevem no carregamento le-se o
   elemento; nas duas que escrevem no clique, clica-se (o bloco usa
   document.execCommand('copy'), que responde a um clique de verdade) e le-se o que
   apareceu na tela.

   E PORQUE ESTA TROCA NAO TEM MIGRACAO, ao contrario do separador "OU" do mesmo mes,
   e a diferenca precisa ficar medida e nao so escrita. Os campos de texto sao
   gravados a cada tecla: o estado de quem ja usou a ferramenta contem a frase curta,
   e valor gravado vence padrao de fabrica. Aqui isso e o DESEJADO -- a frase curta
   continua CERTA, so mais curta --, enquanto o separador antigo ("ou pague com
   cartão") ficaria ERRADO depois da decisao do meio prioritario e por isso precisou
   de fcSepNeutro. A parte [3] mede exatamente essa diferenca, com estado colhido da
   propria referencia.

   A REFERENCIA E PRESA a 7e2baec, e o envelhecimento e DETECTADO lendo do index.html
   dela a fabrica curta. Sem ela, a parte [3] diz "NAO MEDIU".

   Roda com:  node scripts/verificar/frase-copiado.mjs [ref]   (padrao: 7e2baec)
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { preparar, conteudo, cobranca } from './cenario.mjs';
import { clicar } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || '7e2baec';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-copiado-'));
process.on('exit', () => { try{ fs.rmSync(tmp, {recursive:true, force:true}); }catch(e){} });
const dirRef = path.join(tmp, 'ref');
fs.mkdirSync(dirRef, {recursive:true});
execFileSync('/bin/sh', ['-c',
  'git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(dirRef)]);
console.log('referencia: ' + REF);

const CURTA = 'Código copiado!';
const LONGA = 'Código copiado! Cole no aplicativo do seu banco.';
const idxRef = fs.readFileSync(path.join(dirRef, 'index.html'), 'utf8');
const refTemACurta = idxRef.indexOf("pixCopiado:'" + CURTA + "'") >= 0;
if(!refTemACurta)
  console.log('AVISO: a referencia ' + REF + ' ja tem a frase longa -- a parte 3 nao mede nada.');

const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|ERR_FAILED|Failed to load resource/;

async function gerarAsQuatro(raiz, porta){
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg);
    await clicar(pg, 'aba-cob'); await cobranca(pg, {});
    for(const [aba, bt] of [['aba-uni','u-gerar'], ['aba-loja','m-gerar'],
                            ['aba-pac','a-gerar'], ['aba-cob','p-gerar']]){
      await clicar(pg, aba); await pg.waitForTimeout(60); await clicar(pg, bt);
    }
    await clicar(pg, 'p-gerarlink'); await pg.waitForTimeout(200);
    globalThis.__campos = await pg.evaluate(() => {
      const v = i => { const e = document.getElementById(i); return e ? e.value : null; };
      return {u: v('u-txt-pix-copiado'), m: v('m-txt-pix-copiado'),
              a: v('a-txt-pix-copiado'), p: v('p-txt-copiado'),
              falhas: (document.getElementById('fc-falhas') || {}).textContent || ''};
    });
    globalThis.__estado = await pg.evaluate(() => ({
      abas: localStorage.getItem('fcConstrutores'),
      ident: localStorage.getItem('fcConstrutoresIdentidade')
    }));
  }, ['u-out', 'm-out', 'a-out3', 'p-out1', 'p-out2'], {raiz, porta});
  return {saidas: r.valores, campos: globalThis.__campos, estado: globalThis.__estado,
          alertas: r.alertas, erros: r.erros};
}

/* ===== AS QUATRO MANEIRAS DE CHEGAR A MESMA FRASE, com o bloco rodando =====
   No Checkout e na Mini loja o texto e escrito no CARREGAMENTO, dentro de um elemento
   proprio que so aparece depois da copia -- le-se o elemento. Na Agendamento por pacote e no
   Link de cobranca ele e escrito DENTRO do ouvinte do clique -- clica-se, e o clique de
   verdade e o que faz document.execCommand('copy') responder. */
async function noCheckoutOuLoja(bloco, pref, porta){
  const r = await comBlocoNaPagina({
    bloco, porta,
    medir: async pg => {
      const el = pg.locator('.' + pref + '-copiado').first();
      await el.waitFor({state:'attached', timeout:8000});
      return {txt: await el.textContent()};
    }
  });
  return {txt: r.txt, erros: r.erros.filter(x => !EXTERNO.test(x))};
}
async function naPac(bloco, porta){
  const r = await comBlocoNaPagina({
    bloco, porta, busca:'?pac=MINI',
    medir: async pg => {
      await pg.locator('.fca-ob-bloco:has(.fca-ob-pixarea) .fca-ob-bt').first().click();
      await pg.locator('.fca-ob-pixarea.on').waitFor({timeout:8000});
      await pg.locator('.fca-ob-pixarea .fca-ob-bt2').first().click();
      return {txt: await pg.locator('.fca-ob-pixarea .fca-ob-ajuda').first().textContent()};
    }
  });
  return {txt: r.txt, erros: r.erros.filter(x => !EXTERNO.test(x))};
}
async function naCobranca(bloco, link, porta){
  const r = await comBlocoNaPagina({
    bloco, porta, busca: '?' + String(link).split('?')[1],
    medir: async pg => {
      const bloq = pg.locator('.fcpg-bloco:has(.fcpg-cod)').first();
      await bloq.locator('.fcpg-bt').first().click();
      return {txt: await bloq.locator('.fcpg-ajuda').first().textContent()};
    }
  });
  return {txt: r.txt, erros: r.erros.filter(x => !EXTERNO.test(x))};
}

/* ============================================================================ */
console.log('\n[1] a ferramenta de hoje, com armazenamento limpo: os quatro campos ja nascem na frase longa');
const hoje = await gerarAsQuatro(RAIZ, 8891);
chk('gerou sem alerta', hoje.alertas.length === 0, JSON.stringify(hoje.alertas));
chk('gerou sem erro de console', hoje.erros.length === 0, hoje.erros.slice(0,2).join(' | '));
for(const k of ['u','m','a','p'])
  chk('campo da aba ' + k + ' = a frase longa', hoje.campos[k] === LONGA, JSON.stringify(hoje.campos[k]));
/* O atributo value= do <input> e a SEGUNDA copia da fabrica, e fcTxtFabricaDiverge compara as
   duas. Trocar a tabela e esquecer o HTML acenderia a barra vermelha -- esta linha e quem
   cobra que as duas metades andaram juntas. */
chk('a barra vermelha de fabrica divergente nao acendeu', hoje.campos.falhas.trim() === '',
    hoje.campos.falhas.slice(0,160));

console.log('\n[2] os QUATRO blocos EXECUTANDO: a frase que o cliente le depois de copiar');
{
  const u = await noCheckoutOuLoja(hoje.saidas['u-out'], 'fcu', 8892);
  chk('Checkout: o cliente le a frase longa', String(u.txt).trim() === LONGA, JSON.stringify(u.txt));
  chk('Checkout: sem erro proprio', u.erros.length === 0, u.erros.join(' | '));
  const m = await noCheckoutOuLoja(hoje.saidas['m-out'], 'fcm', 8893);
  chk('Mini loja: o cliente le a frase longa', String(m.txt).trim() === LONGA, JSON.stringify(m.txt));
  chk('Mini loja: sem erro proprio', m.erros.length === 0, m.erros.join(' | '));
  const a = await naPac(hoje.saidas['a-out3'], 8894);
  chk('Agendamento por pacote: o cliente le a frase longa (depois do clique)',
      String(a.txt).trim() === LONGA, JSON.stringify(a.txt));
  chk('Agendamento por pacote: sem erro proprio', a.erros.length === 0, a.erros.join(' | '));
  const p = await naCobranca(hoje.saidas['p-out1'], hoje.saidas['p-out2'], 8895);
  chk('Link de cobranca: o cliente le a frase longa (depois do clique)',
      String(p.txt).trim() === LONGA, JSON.stringify(p.txt));
  chk('Link de cobranca: sem erro proprio', p.erros.length === 0, p.erros.join(' | '));
}

console.log('\n[3] quem JA usou a ferramenta continua com a frase curta -- e isso e o desejado');
if(!refTemACurta){
  console.log('  -- NAO MEDIU: a referencia ' + REF + ' ja traz a frase longa.');
  console.log('     Para medir de verdade, passe um commit anterior a esta rodada:');
  console.log('     node scripts/verificar/frase-copiado.mjs 7e2baec');
}else{
  /* O estado vem da FERRAMENTA DA REFERENCIA, gravado por ela: e o estado que o dono tem
     hoje no navegador dele, com a frase curta em u e m porque era a fabrica de la. */
  const ref = await gerarAsQuatro(dirRef, 8896);
  chk('[ref] o Checkout da referencia gravou a frase CURTA', ref.campos.u === CURTA,
      JSON.stringify(ref.campos.u));
  chk('[ref] a Mini loja da referencia gravou a frase CURTA', ref.campos.m === CURTA,
      JSON.stringify(ref.campos.m));

  const r = await gerarNaFerramenta(async pg => {
    await pg.evaluate(e => {
      if(e.abas) localStorage.setItem('fcConstrutores', e.abas);
      if(e.ident) localStorage.setItem('fcConstrutoresIdentidade', e.ident);
    }, ref.estado);
    await pg.reload();
    await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                              window.confirm = () => true; window.open = () => null; });
    await pg.waitForTimeout(200);
    globalThis.__dep = await pg.evaluate(() => {
      const v = i => { const e = document.getElementById(i); return e ? e.value : null; };
      return {u: v('u-txt-pix-copiado'), m: v('m-txt-pix-copiado'),
              a: v('a-txt-pix-copiado'), p: v('p-txt-copiado')};
    });
  }, [], {porta: 8897});
  chk('restaurou sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('o valor GRAVADO vence a fabrica nova: o Checkout dele continua na frase curta',
      globalThis.__dep.u === CURTA, JSON.stringify(globalThis.__dep.u));
  chk('idem na Mini loja', globalThis.__dep.m === CURTA, JSON.stringify(globalThis.__dep.m));
  /* As duas que JA diziam a frase longa atravessam sem novidade -- e o controle do
     experimento: se elas mudassem, o que se estaria medindo seria outra coisa. */
  chk('as duas que ja diziam a longa continuam nela', globalThis.__dep.a === LONGA &&
      globalThis.__dep.p === LONGA, JSON.stringify([globalThis.__dep.a, globalThis.__dep.p]));
}

console.log('\n[4] o fonte de hoje: UMA entrada de fabrica, e nao duas');
{
  const idx = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  chk('FC_TXT_FABRICA.pixCopiado e a frase longa', idx.indexOf("pixCopiado:'" + LONGA + "'") >= 0);
  chk("a segunda entrada ('pixCopiadoCola') deixou de existir", idx.indexOf('pixCopiadoCola') < 0);
  /* O NUMERO SAI DOS DADOS, e nao de um 4 cravado (16/09/2026). Ele era 4 quando havia quatro
     abas de pagamento; a quinta chegou em 15/09 e esta assertiva ficou vermelha sem nenhum
     defeito por tras -- vermelho permanente esconde o proximo, que seria de verdade. E e a
     mesma regra que o CLAUDE.md impoe ao codigo da ferramenta: numero de abas nao se escreve
     em frase nenhuma. A fonte e FC_PAG_PREFS, a lista unica das abas que cobram. */
  const nPag = (/var FC_PAG_PREFS=\[([^\]]*)\]/.exec(idx) || [,''])[1]
    .split(',').filter(x => x.trim()).length;
  chk('a lista das abas que cobram foi lida do fonte', nPag > 0, String(nPag));
  const usos = (idx.match(/FC_TXT_FABRICA\.pixCopiado\b/g) || []).length;
  chk('toda tabela de texto de aba que cobra le essa unica entrada', usos === nPag,
      usos + ' usos para ' + nPag + ' abas que cobram');
  const html = (idx.match(/value="Código copiado! Cole no aplicativo do seu banco\."/g) || []).length;
  chk('e o <input> de cada uma traz o mesmo value=', html === nPag,
      html + ' campos para ' + nPag + ' abas que cobram');
}

resumo();
