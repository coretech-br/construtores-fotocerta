/* ============================================================================
   A MIGRACAO DO MEIO PRIORITARIO, E O OUTRO LADO DA REGRESSAO
   ============================================================================
   POR QUE ISTO EXISTE. A rodada de 12/09/2026 trocou o PADRAO DE FABRICA de duas
   frases do Checkout e da Mini loja ('ou pague com Pix' -> 'ou pague com cartao',
   porque o Pix passou a vir em cima). Trocar o padrao NAO CHEGA a quem ja usou a
   ferramenta: os campos de texto sao gravados a cada tecla, entao o estado do dono
   ja contem a frase antiga, e valor gravado vence padrao. Sem migracao, o bloco
   dele sairia dizendo "ou pague com Pix" logo ACIMA do Pix.
   A migracao e de uma vez so, e so mexe no que for, caractere por caractere, a
   fabrica ANTERIOR -- nesse caso o dono nunca personalizou. Texto dele fica.

   O QUE ELE PROVA:
     1. Estado colhido da PROPRIA referencia (git archive + a ferramenta de la
        gravando de verdade) -- nunca um JSON escrito a mao aqui, que envelheceria
        no dia em que o formato mudasse.
     2. Valor igual a fabrica antiga -> MIGRA.
     3. Valor personalizado -> INTOCADO (o teste escreve um texto proprio na
        referencia e confere que ele atravessa inteiro).
     4. fcTxtFabricaDiverge NAO ACENDE numa ferramenta recem-aberta, nas duas
        escolhas -- a barra vermelha existe para denunciar fabrica divergente, e
        uma que acende sozinha nao denuncia mais nada.
     5. O OUTRO LADO DA REGRESSAO: com o meio prioritario em 'cartao', o Checkout e
        a Mini loja voltam a ser BYTE A BYTE identicos aos da referencia. Se nao
        voltarem, a mudanca levou junto algo que nao era a ordem.
        E, com 'Pix' (a fabrica), a VITRINE da aba Agendamento por pacote tambem e
        byte a byte identica -- aquela aba ja era Pix-primeiro.

   Uso:  node scripts/verificar/meio-prio-migracao.mjs [ref]     (padrao: main)
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { preparar, conteudo, cobranca, gerarTodas } from './cenario.mjs';
import { radio, clicar } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';

/* A REFERENCIA sai de 'git archive' para uma pasta temporaria -- nao mexe na arvore de
   trabalho e nao precisa de checkout. Mesmo caminho de regressao.sh. */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-meioprio-'));
process.on('exit', () => { try{ fs.rmSync(tmp, {recursive:true, force:true}); }catch(e){} });
const dirRef = path.join(tmp, 'ref');
fs.mkdirSync(dirRef, {recursive:true});
execFileSync('/bin/sh', ['-c',
  'git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(dirRef)]);
console.log('referencia: ' + REF);

const CAMPOS = [['u','u-txt-ou','u-txt-ou-desc'], ['m','m-txt-ou','m-txt-ou-desc']];
const FABRICA_ANTIGA = {
  'u-txt-ou':'ou pague com Pix', 'u-txt-ou-desc':'ou pague com Pix com {pct}% de desconto',
  'm-txt-ou':'ou pague com Pix', 'm-txt-ou-desc':'ou pague com Pix com {pct}% de desconto'
};
const FABRICA_NOVA = {
  'u-txt-ou':'ou pague com cartão', 'u-txt-ou-desc':'ou pague com cartão, sem o desconto de {pct}%',
  'm-txt-ou':'ou pague com cartão', 'm-txt-ou-desc':'ou pague com cartão, sem o desconto de {pct}%'
};
const MEU = 'Prefiro que voce pague no Pix, por favor';

/* ===== 1. o estado COLHIDO da referencia ===== */
/* 'personalizar' escreve um texto do dono em u-txt-ou antes de colher -- e o unico caso
   em que a migracao NAO pode tocar em nada. */
async function colherDaRef(personalizar){
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg); await cobranca(pg,{descpix:'10', valor:'450,00'});
    if(personalizar){
      const { set } = await import('./lib.mjs');
      await set(pg, 'u-txt-ou', MEU);
    }
    /* Colhe o que a ferramenta DA REFERENCIA gravou sozinha, e nao um objeto montado aqui. */
    globalThis.__colhido = await pg.evaluate(() => localStorage.getItem('fcConstrutores'));
    globalThis.__naRef = await pg.evaluate(ids => {
      const o = {}; ids.forEach(i => { const e = document.getElementById(i); o[i] = e ? e.value : null; });
      return o;
    }, Object.keys(FABRICA_ANTIGA));
  }, [], {raiz: dirRef, porta: 8895});
  chk('a referencia gerou sem alerta ao colher', r.alertas.length === 0, JSON.stringify(r.alertas));
  return { estado: globalThis.__colhido, naRef: globalThis.__naRef };
}

/* ===== 2. o estado colhido, restaurado na arvore de HOJE ===== */
async function restaurarAqui(estado){
  const r = await gerarNaFerramenta(async pg => {
    /* Grava o estado da referencia e RECARREGA: e a recarga que faz o restaura() rodar --
       escrever no armazenamento com a pagina ja aberta nao restaura nada. */
    await pg.evaluate(s => localStorage.setItem('fcConstrutores', s), estado);
    await pg.reload();
    /* A recarga devolve o alert original -- re-injetar e obrigatorio, senao alertas() logo
       abaixo le um __alertas que nao existe mais (mesma razao registrada em lib.abrir). */
    await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                              window.confirm = () => true; window.open = () => null; });
    await pg.waitForTimeout(200);
    globalThis.__agora = await pg.evaluate(ids => {
      const o = {}; ids.forEach(i => { const e = document.getElementById(i); o[i] = e ? e.value : null; });
      o.__prioU = (document.querySelector('input[name="u-prio"]:checked')||{}).value;
      o.__prioM = (document.querySelector('input[name="m-prio"]:checked')||{}).value;
      o.__diverge = (typeof fcTxtFabricaDiverge === 'function') ? fcTxtFabricaDiverge() : ['sem a funcao'];
      return o;
    }, Object.keys(FABRICA_ANTIGA));
  }, [], {porta: 8896});
  chk('a arvore de hoje restaurou sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('a arvore de hoje restaurou sem erro de console', r.erros.length === 0, r.erros.slice(0,2).join(' | '));
  return globalThis.__agora;
}

console.log('\n== 1. estado de fabrica colhido da referencia ==');
const colhido = await colherDaRef(false);
for(const id of Object.keys(FABRICA_ANTIGA)){
  chk('a referencia gravou a fabrica ANTIGA em '+id, colhido.naRef[id] === FABRICA_ANTIGA[id],
      JSON.stringify(colhido.naRef[id]));
}
chk('o estado colhido NAO tem a chave do meio prioritario',
    !/"prio"/.test(colhido.estado), 'ele ja tem -- a referencia nao e anterior a rodada');

const migrado = await restaurarAqui(colhido.estado);
for(const id of Object.keys(FABRICA_NOVA)){
  chk('MIGROU para a fabrica da ordem nova: '+id, migrado[id] === FABRICA_NOVA[id],
      JSON.stringify(migrado[id]));
}
chk('o meio prioritario caiu no padrao de fabrica (Pix) no Checkout', migrado.__prioU === 'pix', migrado.__prioU);
chk('o meio prioritario caiu no padrao de fabrica (Pix) na Mini loja', migrado.__prioM === 'pix', migrado.__prioM);

console.log('\n== 2. estado com texto do DONO, colhido da referencia ==');
const meu = await colherDaRef(true);
chk('a referencia gravou o texto do dono', meu.naRef['u-txt-ou'] === MEU, JSON.stringify(meu.naRef['u-txt-ou']));
const apos = await restaurarAqui(meu.estado);
chk('o texto do dono ficou INTOCADO', apos['u-txt-ou'] === MEU, JSON.stringify(apos['u-txt-ou']));
chk('e o campo ao lado, que estava na fabrica antiga, migrou do mesmo jeito',
    apos['u-txt-ou-desc'] === FABRICA_NOVA['u-txt-ou-desc'], JSON.stringify(apos['u-txt-ou-desc']));

/* ===== 3. a fabrica divergente numa ferramenta recem-aberta =====
   fcTxtFabricaDiverge vive dentro da IIFE da ferramenta e nao e alcancavel de fora -- e nao
   e para ser. O que se mede e o que o DONO veria: a barra vermelha (#fc-falhas), que e o
   unico efeito dela. O passo que a chama roda NO CARREGAMENTO, entao "nas duas escolhas"
   quer dizer: com o estado de fabrica, e com o estado ja gravado em 'cartao' -- este ultimo
   por recarga, que e como o dono abriria a ferramenta no dia seguinte. */
async function barraApos(prio){
  const r = await gerarNaFerramenta(async pg => {
    if(prio){
      for(const [pref] of CAMPOS) await radio(pg, pref+'-prio', prio);
      await pg.reload();
      await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                                window.confirm = () => true; window.open = () => null; });
      await pg.waitForTimeout(200);
    }
    globalThis.__barra = await pg.evaluate(() => {
      const b = document.getElementById('fc-falhas');
      return b ? b.textContent.trim() : '';
    });
  }, [], {porta: 8897});
  chk('sem alerta ('+(prio||'recem-aberta')+')', r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('sem erro de console ('+(prio||'recem-aberta')+')',
      r.erros.filter(e => !/Failed to load resource|net::ERR|favicon/i.test(e)).length === 0,
      r.erros.slice(0,2).join(' | '));
  return globalThis.__barra;
}
console.log('\n== 3. a barra vermelha da fabrica divergente ==');
const b0 = await barraApos(null);
chk('ferramenta recem-aberta: a barra vermelha NAO acende', b0 === '', b0);
for(const prio of ['pix','pp']){
  const b = await barraApos(prio);
  chk('depois de gravar o meio prioritario em "'+prio+'" e recarregar: a barra NAO acende', b === '', b);
}

/* ===== 4. o OUTRO LADO da regressao ===== */
console.log('\n== 4. byte a byte contra a referencia ==');
async function saidasCom(raiz, porta, prio){
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg); await cobranca(pg,{descpix:'10', valor:'450,00'});
    if(prio) for(const [aba,pref] of [['aba-uni','u'],['aba-loja','m'],['aba-pac','a']]){
      if(!(await pg.$('#'+aba))) continue;
      await clicar(pg,aba); await pg.waitForTimeout(40);
      await radio(pg, pref+'-prio', prio);
    }
    await gerarTodas(pg);
  }, ['u-out','m-out','a-out1'], {raiz, porta});
  return r.valores;
}
const daRef  = await saidasCom(dirRef, 8898, null);
const comPP  = await saidasCom(RAIZ,   8899, 'pp');
const comPix = await saidasCom(RAIZ,   8900, 'pix');
chk('Checkout com o CARTAO prioritario == referencia, byte a byte',
    comPP['u-out'] === daRef['u-out'],
    'tamanhos '+comPP['u-out'].length+' x '+daRef['u-out'].length);
chk('Mini loja com o CARTAO prioritario == referencia, byte a byte',
    comPP['m-out'] === daRef['m-out'],
    'tamanhos '+comPP['m-out'].length+' x '+daRef['m-out'].length);
chk('vitrine da Agendamento por pacote com o PIX prioritario == referencia, byte a byte',
    comPix['a-out1'] === daRef['a-out1'],
    'tamanhos '+comPix['a-out1'].length+' x '+daRef['a-out1'].length);
/* E a prova do contrario: se a escolha NAO mudasse nada, tudo isto seria vacuo. */
chk('e a outra escolha REALMENTE muda o Checkout', comPix['u-out'] !== daRef['u-out']);
chk('e a outra escolha REALMENTE muda a Mini loja', comPix['m-out'] !== daRef['m-out']);

/* ===== 5. COM UM MEIO SO, a escolha nao muda um byte =====
   A ferramenta desliga o campo nesse caso (fcOrdSo1), mas o valor gravado continua indo ao
   gerador -- de proposito: forcar o padrao em uCfg/mCfg esconderia um defeito em vez de
   impedi-lo. Esta e a prova de que nao ha o que esconder. */
console.log('\n== 5. com um meio so, a escolha nao muda a saida ==');
async function umMeioSo(metodo, prio, porta){
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg); await cobranca(pg,{descpix:'10', valor:'450,00'});
    for(const [aba,pref] of [['aba-uni','u'],['aba-loja','m'],['aba-pac','a']]){
      await clicar(pg,aba); await pg.waitForTimeout(40);
      await radio(pg, pref+'-prio', prio);
      await radio(pg, pref+'-metodo', metodo);
    }
    /* O Link de cobranca nao tem tres formas: ou oferece PayPal, ou so Pix. */
    await clicar(pg,'aba-cob'); await pg.waitForTimeout(40);
    await radio(pg,'p-prio',prio); await radio(pg,'p-usapp','nao');
    await gerarTodas(pg);
    globalThis.__off = await pg.evaluate(() => {
      const o = {};
      for(const pref of ['u','m','a','p']){
        o[pref] = {
          desligado: !!(document.querySelector('input[name="'+pref+'-prio"]')||{}).disabled,
          aviso: ((document.getElementById(pref+'-prio-so1')||{}).style||{}).display
        };
      }
      return o;
    });
  }, ['u-out','m-out','a-out1','a-out3','p-out1'], {porta});
  return {v:r.valores, off:globalThis.__off};
}
for(const metodo of ['pix','paypal']){
  const a = await umMeioSo(metodo, 'pix', 8901);
  const b = await umMeioSo(metodo, 'pp',  8902);
  for(const saida of ['u-out','m-out','a-out1','a-out3','p-out1'])
    chk('"somente '+metodo+'": '+saida+' sai igual nas duas escolhas', a.v[saida] === b.v[saida],
        'tamanhos '+a.v[saida].length+' x '+b.v[saida].length);
  for(const pref of ['u','m','a','p'])
    chk('"somente '+metodo+'": o campo de '+pref+' fica DESLIGADO e com o porque na tela',
        a.off[pref].desligado === true && a.off[pref].aviso === 'block', JSON.stringify(a.off[pref]));
}

process.exit(resumo());
