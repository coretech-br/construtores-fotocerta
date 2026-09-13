/* ============================================================================
   A MIGRACAO DA LINHA DO SALDO NO WHATSAPP (divida D1, 13/09/2026)
   ============================================================================
   POR QUE ISTO EXISTE. Ate 13/09/2026 a linha do saldo na mensagem do WhatsApp
   NAO era campo: o gerador montava TXT_SALDO + ': *{valor}*', e TXT_SALDO e o
   rotulo da TELA (t9). Agora ela tem campo proprio (txtZapSaldo), como todas as
   outras linhas da mesma mensagem -- a divida D1, "metade configuravel e
   armadilha".

   O RISCO QUE ESTE ARQUIVO MEDE. Dar campo proprio a uma frase que era derivada
   de outra QUEBRA quem personalizou a origem, e quebra em SILENCIO: quem trocou o
   rotulo da tela para "Falta pagar" via a mensagem dizer "Falta pagar: *R$ 200*",
   e passaria a ver "Restante na entrega" -- o padrao de fabrica do campo novo --
   sem nada na tela avisando. A regressao byte a byte NAO pega isso: com os textos
   de fabrica as duas formas produzem o mesmo texto.

   fcZapSaldoMigrar so age quando a chave nova esta AUSENTE (estado anterior a esta
   rodada) E o rotulo da tela foi personalizado. Estado que ja tem a chave nova e
   escolha do dono, e nao se toca.

   Uso:  node scripts/verificar/zap-saldo-migracao.mjs [ref]     (padrao: main)
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { preparar, conteudo } from './cenario.mjs';
import { set } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-zapsaldo-'));
process.on('exit', () => { try{ fs.rmSync(tmp, {recursive:true, force:true}); }catch(e){} });
const dirRef = path.join(tmp, 'ref');
fs.mkdirSync(dirRef, {recursive:true});
execFileSync('/bin/sh', ['-c',
  'git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(dirRef)]);
console.log('referencia: ' + REF);

const FABRICA_T9 = 'Restante na entrega';
const FABRICA_ZAP = 'Restante na entrega: *{valor}*';
const MEU_T9 = 'Falta pagar';

/* A REFERENCIA JA TEM A RODADA? Decidido UMA vez, antes de qualquer prova. Sem isso este
   arquivo viraria o que meio-prio-migracao.mjs e id-orcamento.mjs ja foram: vermelho todo dia
   sem defeito por tras, escondendo o vermelho seguinte. */
let refJaTem = false;
{
  const idx = fs.readFileSync(path.join(dirRef, 'index.html'), 'utf8');
  refJaTem = idx.indexOf('u-txt-zap-saldo') >= 0;
}
if (refJaTem) console.log('AVISO: a referencia ' + REF + ' JA TEM o campo novo -- as partes 1 e 2 nao medem nada.');

/* Colhe o estado que a ferramenta DA REFERENCIA grava sozinha, com o rotulo da tela
   personalizado nas duas abas. Nunca um JSON escrito a mao aqui: ele envelheceria no dia em
   que o formato mudasse, e passaria a provar o passado. */
async function colherDaRef(personalizar){
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg);
    if (personalizar) { await set(pg, 'u-t9', MEU_T9); await set(pg, 'm-t9', MEU_T9); }
    globalThis.__colhido = await pg.evaluate(() => localStorage.getItem('fcConstrutores'));
  }, [], {raiz: dirRef, porta: 8897});
  chk('a referencia colheu sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  return globalThis.__colhido;
}

async function restaurarAqui(estado){
  const r = await gerarNaFerramenta(async pg => {
    await pg.evaluate(s => localStorage.setItem('fcConstrutores', s), estado);
    await pg.reload();
    await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                              window.confirm = () => true; window.open = () => null; });
    await pg.waitForTimeout(200);
    globalThis.__agora = await pg.evaluate(() => {
      const v = i => { const e = document.getElementById(i); return e ? e.value : null; };
      return { ut9:v('u-t9'), mt9:v('m-t9'), uzap:v('u-txt-zap-saldo'), mzap:v('m-txt-zap-saldo'),
               falhas:(document.getElementById('fc-falhas')||{}).textContent||'' };
    });
  }, [], {porta: 8898});
  chk('a arvore de hoje restaurou sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('a arvore de hoje restaurou sem erro de console', r.erros.length === 0, r.erros.slice(0,2).join(' | '));
  return globalThis.__agora;
}

console.log('\n[1] rotulo da tela PERSONALIZADO na referencia -> a linha do WhatsApp acompanha');
if (refJaTem) {
  console.log('  -- NAO MEDIU: a referencia ja tem o campo novo. Passe um commit anterior a 13/09/2026.');
} else {
  const est = await colherDaRef(true);
  const a = await restaurarAqui(est);
  chk('o rotulo da tela atravessou inteiro (u)', a.ut9 === MEU_T9, String(a.ut9));
  chk('o rotulo da tela atravessou inteiro (m)', a.mt9 === MEU_T9, String(a.mt9));
  chk('a linha do WhatsApp nasceu do rotulo personalizado (u)', a.uzap === MEU_T9 + ': *{valor}*', String(a.uzap));
  chk('a linha do WhatsApp nasceu do rotulo personalizado (m)', a.mzap === MEU_T9 + ': *{valor}*', String(a.mzap));
  chk('e NAO caiu no padrao de fabrica, que era o defeito silencioso', a.uzap !== FABRICA_ZAP, String(a.uzap));
}

console.log('\n[2] rotulo da tela NA FABRICA -> a linha do WhatsApp fica na fabrica dela');
if (refJaTem) {
  console.log('  -- NAO MEDIU: a referencia ja tem o campo novo.');
} else {
  const est = await colherDaRef(false);
  const a = await restaurarAqui(est);
  chk('o rotulo da tela continua o de fabrica (u)', a.ut9 === FABRICA_T9, String(a.ut9));
  chk('a linha do WhatsApp ficou na fabrica (u)', a.uzap === FABRICA_ZAP, String(a.uzap));
  chk('a linha do WhatsApp ficou na fabrica (m)', a.mzap === FABRICA_ZAP, String(a.mzap));
  chk('a barra vermelha de fabrica divergente nao acendeu', a.falhas.trim() === '', a.falhas.slice(0,120));
  /* A guarda de fabrica divergente NAO e conferida aqui: fcTxtFabricaDiverge vive dentro do
     IIFE da ferramenta e nao e alcancavel do escopo da pagina -- medido, devolve 'sem a
     funcao'. Uma assercao que nao alcanca o estado nao prova nada sobre ele, entao ela sai em
     vez de virar um verde que mente. Quem cobre a barra vermelha e a passagem do arnes que le
     #fc-falhas na propria tela. */
}

console.log('\n[3] a migracao NAO mexe em estado que ja tem a chave nova');
{
  /* Este caso nao precisa da referencia: ele descreve o estado de DEPOIS desta rodada, e o que
     se cobra e que uma segunda restauracao nao reescreva a escolha do dono. */
  const r = await gerarNaFerramenta(async pg => {
    await pg.evaluate(() => {
      const st = {u:{t9:'Falta pagar', txtZapSaldo:'Combinado: *{valor}*'},
                  m:{t9:'Falta pagar', txtZapSaldo:'Combinado: *{valor}*'}};
      localStorage.setItem('fcConstrutores', JSON.stringify(st));
    });
    await pg.reload();
    await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                              window.confirm = () => true; window.open = () => null; });
    await pg.waitForTimeout(200);
    globalThis.__dep = await pg.evaluate(() => {
      const v = i => { const e = document.getElementById(i); return e ? e.value : null; };
      return { uzap:v('u-txt-zap-saldo'), mzap:v('m-txt-zap-saldo') };
    });
  }, [], {porta: 8899});
  chk('restaurou sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('a escolha do dono ficou intocada (u)', globalThis.__dep.uzap === 'Combinado: *{valor}*', String(globalThis.__dep.uzap));
  chk('a escolha do dono ficou intocada (m)', globalThis.__dep.mzap === 'Combinado: *{valor}*', String(globalThis.__dep.mzap));
}

resumo();
