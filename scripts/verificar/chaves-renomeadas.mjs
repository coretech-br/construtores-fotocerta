/* ============================================================================
   AS CHAVES DE TEXTO QUE TROCARAM DE NOME -- E A CONVERSAO (levas 6 e 7, 14/09/2026)
   ============================================================================
   O QUE MUDOU, e por que precisava de conversao.

     'txtPixRotulo' -> 'txtSecaoPix' na aba Agendamento por pacote. Era a UNICA
     chave da ferramenta com DOIS significados: aqui o TITULO DA SECAO do Pix; no
     Checkout, na Mini loja e no Link de cobranca a LINHA DO PRECO com desconto.
     O nome novo e o que a irma ja usa para o MESMO texto (p-txt-secao-pix), com a
     mesma fabrica (FC_TXT_FABRICA.secaoPix).

     't4' -> 'txtZapBotao' na aba Link de cobranca. E o rotulo do botao "Ja paguei"
     que abre o WhatsApp -- o mesmo papel que 'txtZapBotao' tem no Checkout e na
     Mini loja. Era o unico dos quatro fora da familia 'txtZap*', e 't4' nao diz
     papel nenhum. Nao ha colisao: esta aba nao tinha essa chave.

     LEVA 7, POR ANALOGIA A MESMA AUTORIZACAO (e nao por pedido novo):
     'txtCopiado' -> 'txtPixCopiado' e 'txtNaocopiou' -> 'txtPixNaocopiou', tambem na
     aba Link de cobranca. Era a TERCEIRA divergencia de nome da MESMA familia das duas
     acima: as outras tres abas ja chamam este par de 'txtPixCopiado'/'txtPixNaocopiou',
     com a MESMA fabrica (FC_TXT_FABRICA), para o MESMO texto -- o aviso de que o codigo
     Pix foi (ou nao foi) copiado. Tres de quatro concordavam; a quarta era esta.

   O RISCO QUE ESTE ARQUIVO MEDE, e ele e SILENCIOSO. Renomear a chave sem converter
   ZERA o campo de quem personalizou: fcTxtRestaura cai no padrao de fabrica quando a
   chave nao existe no estado. Quem tivesse escrito "Pagar por Pix aqui" no titulo
   veria "Pix" de volta, sem nada na tela dizendo o que aconteceu -- e isso alcanca
   tambem o backup em arquivo que o dono ja tem guardado. A regressao byte a byte NAO
   pega isto: com os textos de fabrica as duas formas produzem a mesma saida.

   O ESTADO E COLHIDO DA PROPRIA REFERENCIA, gravado pela ferramenta DE LA. Nunca um
   JSON escrito a mao aqui: um objeto a mao envelhece no dia em que o formato mudar, e
   passaria a provar o passado.

   A REFERENCIA E PRESA a 7e2baec (o commit ANTERIOR a esta rodada), e NAO pode ser
   'main': no dia em que esta rodada for mesclada, o lado "antes" mediria a si mesmo.
   O envelhecimento e DETECTADO lendo do index.html da referencia os nomes ANTIGOS das
   duas chaves; sem eles, as partes que dependem dela dizem "NAO MEDIU" -- nunca falham
   por envelhecer.

   Roda com:  node scripts/verificar/chaves-renomeadas.mjs [ref]   (padrao: 7e2baec)
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { preparar, conteudo, cobranca } from './cenario.mjs';
import { set, clicar } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || '7e2baec';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-renome-'));
process.on('exit', () => { try{ fs.rmSync(tmp, {recursive:true, force:true}); }catch(e){} });
const dirRef = path.join(tmp, 'ref');
fs.mkdirSync(dirRef, {recursive:true});
execFileSync('/bin/sh', ['-c',
  'git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(dirRef)]);
console.log('referencia: ' + REF);

const idxRef = fs.readFileSync(path.join(dirRef, 'index.html'), 'utf8');
const refTemNomesAntigos =
  idxRef.indexOf("['txtPixRotulo','a-txt-pix-rotulo'") >= 0 && idxRef.indexOf("['t4','p-t4'") >= 0;
if(!refTemNomesAntigos)
  console.log('AVISO: a referencia ' + REF + ' ja usa os nomes NOVOS -- as partes 1 e 2 nao medem nada.');
/* A DETECCAO DA LEVA 7 e SEPARADA, e tem de ser: a referencia de leva 6 (7e2baec) e anterior as
   duas rodadas, mas uma referencia escolhida entre elas teria os nomes novos de uma e os velhos
   da outra. Cada renome detecta o proprio envelhecimento. */
const refTemCopiadoAntigo = idxRef.indexOf("['txtCopiado','p-txt-copiado'") >= 0;
if(!refTemCopiadoAntigo)
  console.log('AVISO: a referencia ' + REF + ' ja usa \'txtPixCopiado\' -- a parte 5 nao mede nada.');

const FABRICA_TITULO = 'Pix';
const FABRICA_BOTAO  = 'Já paguei';
const MEU_TITULO = 'Pagar por Pix aqui';
const MEU_BOTAO  = 'Já fiz o pagamento';
/* Leva 7. Sem aspas nem barra de proposito: estes dois sao procurados LITERALMENTE dentro do
   bloco gerado (var TXT_COPIADO='...'), e escJs os reescreveria. O escape em si ja e medido em
   textos-escape.mjs, que e onde ele mora. */
const MEU_COPIADO   = 'Copiei o codigo, ja vou colar no banco';
const MEU_NAOCOPIOU = 'Nao deu para copiar sozinho';
const FABRICA_COPIADO = 'Código copiado! Cole no aplicativo do seu banco.';
/* O cenario compartilhado ja escreve 'Já paguei' em p-t4 (BLOCO_FIXO), que por acaso e a
   fabrica: a passagem "de fabrica" abaixo confere exatamente esse valor, e nao o do campo
   em branco -- o que importa e que o texto atravesse igual, nao qual texto e. */

async function colher(personalizar, porta){
  await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg);
    /* A cobranca que esta na tela: sem ela 'Gerar link' recusa por endereco vazio, e o
       bloco da /pagar nasce sem cobranca nenhuma para mostrar. */
    await clicar(pg, 'aba-cob'); await cobranca(pg, {});
    if(personalizar){
      await set(pg, 'a-txt-pix-rotulo', MEU_TITULO);
      await set(pg, 'p-t4', MEU_BOTAO);
      await set(pg, 'p-txt-copiado', MEU_COPIADO);
      await set(pg, 'p-txt-naocopiou', MEU_NAOCOPIOU);
    }
    globalThis.__colhido = await pg.evaluate(() => ({
      abas: localStorage.getItem('fcConstrutores'),
      ident: localStorage.getItem('fcConstrutoresIdentidade')
    }));
  }, [], {raiz: dirRef, porta});
  return globalThis.__colhido;
}

/* Planta o estado da referencia na arvore de HOJE, recarrega, e devolve o que os campos
   mostram, o que ficou gravado e as saidas geradas dali. */
async function restaurarAqui(estado, porta){
  const r = await gerarNaFerramenta(async pg => {
    await pg.evaluate(e => {
      if(e.abas) localStorage.setItem('fcConstrutores', e.abas);
      if(e.ident) localStorage.setItem('fcConstrutoresIdentidade', e.ident);
    }, estado);
    await pg.reload();
    await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                              window.confirm = () => true; window.open = () => null; });
    await pg.waitForTimeout(200);
    globalThis.__tela = await pg.evaluate(() => {
      const v = i => { const e = document.getElementById(i); return e ? e.value : null; };
      const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
      return {titulo: v('a-txt-pix-rotulo'), botao: v('p-t4'),
              copiado: v('p-txt-copiado'), naocopiou: v('p-txt-naocopiou'),
              gravA: (st.a || {}), gravP: (st.p || {}),
              falhas: (document.getElementById('fc-falhas') || {}).textContent || ''};
    });
    await clicar(pg, 'aba-pac'); await pg.waitForTimeout(60); await clicar(pg, 'a-gerar');
    await clicar(pg, 'aba-cob'); await pg.waitForTimeout(60); await clicar(pg, 'p-gerar');
    await clicar(pg, 'p-gerarlink'); await pg.waitForTimeout(200);
    /* FORCA UMA GRAVACAO. O estado so e reescrito quando algo o dispara, e gerar nao
       dispara sozinho: sem isto, o que se leria no localStorage seria o objeto que acabou de
       ser PLANTADO, e nao o que a ferramenta de hoje escreve. Um 'input' num campo qualquer
       com o mesmo valor e o gesto mais barato que passa pelo salvarEstado global. */
    await pg.evaluate(() => {
      for(const id of ['a-txt-pix-rotulo','p-t4','p-txt-copiado','p-txt-naocopiou']){
        const e = document.getElementById(id);
        if(e) e.dispatchEvent(new Event('input', {bubbles:true}));
      }
    });
    await pg.waitForTimeout(300);
    globalThis.__grav = await pg.evaluate(() => {
      const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
      return {a: (st.a || {}), p: (st.p || {})};
    });
  }, ['a-out3', 'p-out1', 'p-out2'], {porta});
  return {tela: globalThis.__tela, grav: globalThis.__grav, saidas: r.valores, alertas: r.alertas, erros: r.erros};
}

/* Os dois blocos EXECUTANDO. O QR pede o cdnjs e o cartao pede o paypal.com; o molde
   bloqueia a rede externa de proposito, e esses sao os unicos erros aceitos. */
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|ERR_FAILED|Failed to load resource/;
async function tituloNoBlocoPac(bloco, porta){
  const r = await comBlocoNaPagina({
    bloco, porta, busca: '?pac=MINI',
    medir: async pg => {
      /* O rotulo DA SECAO DO PIX, e nao o primeiro .fca-ob-rot da pagina: essa classe
         rotula tambem o cupom. O bloco do Pix e o unico que contem a .fca-ob-pixarea. */
      const alvo = pg.locator('.fca-ob-bloco:has(.fca-ob-pixarea) .fca-ob-rot').first();
      await alvo.waitFor({timeout:8000});
      return {txt: await alvo.textContent()};
    }
  });
  return {txt: r.txt, erros: r.erros.filter(x => !EXTERNO.test(x))};
}
async function botaoNoBlocoCob(bloco, link, porta){
  const r = await comBlocoNaPagina({
    bloco, porta, busca: '?' + String(link).split('?')[1],
    medir: async pg => {
      await pg.locator('.fcpg-bt2').first().waitFor({timeout:8000});
      return {txt: await pg.locator('.fcpg-bt2').first().textContent()};
    }
  });
  return {txt: r.txt, erros: r.erros.filter(x => !EXTERNO.test(x))};
}

/* ============================================================================ */
console.log('\n[1] texto PERSONALIZADO na referencia -> atravessa inteiro para os nomes novos');
if(!refTemNomesAntigos){
  console.log('  -- NAO MEDIU: a referencia ' + REF + ' ja usa os nomes novos.');
  console.log('     Para medir de verdade, passe um commit anterior a esta rodada:');
  console.log('     node scripts/verificar/chaves-renomeadas.mjs 7e2baec');
}else{
  const est = await colher(true, 8881);
  const a = await restaurarAqui(est, 8882);
  chk('restaurou sem alerta', a.alertas.length === 0, JSON.stringify(a.alertas));
  chk('restaurou sem erro de console', a.erros.length === 0, a.erros.slice(0,2).join(' | '));
  chk('o estado da referencia tem a chave ANTIGA do titulo', a.tela.gravA.txtPixRotulo === MEU_TITULO,
      JSON.stringify(a.tela.gravA.txtPixRotulo));
  chk('...e NAO tem a nova (e o que torna esta prova possivel)', a.tela.gravA.txtSecaoPix === undefined,
      JSON.stringify(a.tela.gravA.txtSecaoPix));
  chk('o TITULO atravessou inteiro (e NAO caiu na fabrica "Pix")',
      a.tela.titulo === MEU_TITULO, JSON.stringify(a.tela.titulo));
  chk('o BOTAO atravessou inteiro (e NAO caiu na fabrica "Já paguei")',
      a.tela.botao === MEU_BOTAO, JSON.stringify(a.tela.botao));
  chk('o estado regravado ja traz a chave NOVA do titulo', a.grav.a.txtSecaoPix === MEU_TITULO,
      JSON.stringify(a.grav.a.txtSecaoPix));
  chk('o estado regravado ja traz a chave NOVA do botao', a.grav.p.txtZapBotao === MEU_BOTAO,
      JSON.stringify(a.grav.p.txtZapBotao));
  /* O DESTINO DA CHAVE ANTIGA, MEDIDO e nao suposto. fcTxtChaveMigrar so acrescenta -- mas
     coleta() reescreve o fragmento inteiro da aba com as chaves da TABELA, entao na primeira
     gravacao seguinte a velha some. Isto esta aqui como MEDIDA, e nao como desejo: a primeira
     versao deste arquivo afirmava o contrario ("a chave antiga fica"), e a medicao desmentiu.
     O backup em ARQUIVO do dono nao e tocado por nada disto e continua convertendo. */
  chk('a chave ANTIGA some na primeira gravacao (coleta reescreve o fragmento da aba)',
      a.grav.a.txtPixRotulo === undefined && a.grav.p.t4 === undefined,
      JSON.stringify([a.grav.a.txtPixRotulo, a.grav.p.t4]));

  /* ---- LEVA 7, no mesmo estado colhido: o par do "copiado" ---- */
  if(!refTemCopiadoAntigo){
    console.log('  -- leva 7 NAO MEDIU: a referencia ' + REF + ' ja usa os nomes novos do "copiado".');
  }else{
    chk('leva 7: o estado da referencia tem a chave ANTIGA do copiado',
        a.tela.gravP.txtCopiado === MEU_COPIADO, JSON.stringify(a.tela.gravP.txtCopiado));
    chk('leva 7: ...e NAO tem a nova', a.tela.gravP.txtPixCopiado === undefined,
        JSON.stringify(a.tela.gravP.txtPixCopiado));
    chk('leva 7: o COPIADO atravessou inteiro (e NAO caiu na fabrica)',
        a.tela.copiado === MEU_COPIADO, JSON.stringify(a.tela.copiado));
    chk('leva 7: o NAO COPIOU atravessou inteiro',
        a.tela.naocopiou === MEU_NAOCOPIOU, JSON.stringify(a.tela.naocopiou));
    chk('leva 7: o estado regravado ja traz as chaves NOVAS',
        a.grav.p.txtPixCopiado === MEU_COPIADO && a.grav.p.txtPixNaocopiou === MEU_NAOCOPIOU,
        JSON.stringify([a.grav.p.txtPixCopiado, a.grav.p.txtPixNaocopiou]));
    chk('leva 7: e as chaves antigas sumiram na primeira gravacao',
        a.grav.p.txtCopiado === undefined && a.grav.p.txtNaocopiou === undefined,
        JSON.stringify([a.grav.p.txtCopiado, a.grav.p.txtNaocopiou]));
    /* O BLOCO GERADO carrega o texto do dono, e nao a fabrica -- e a ponta que importa: a
       conversao so serve se ela alcancar o que o cliente le. */
    chk('leva 7: o BLOCO gerado leva o texto do dono em TXT_COPIADO',
        String(a.saidas['p-out1']).indexOf("TXT_COPIADO='" + MEU_COPIADO + "'") >= 0);
    chk('leva 7: e em TXT_NAO_COPIOU',
        String(a.saidas['p-out1']).indexOf("TXT_NAO_COPIOU='" + MEU_NAOCOPIOU + "'") >= 0);
  }

  const pac = await tituloNoBlocoPac(a.saidas['a-out3'], 8883);
  chk('BLOCO RODANDO (pac): o titulo da secao Pix na tela do cliente e o texto do dono',
      String(pac.txt).trim() === MEU_TITULO, JSON.stringify(pac.txt));
  chk('BLOCO RODANDO (pac): sem erro proprio', pac.erros.length === 0, pac.erros.join(' | '));
  const cob = await botaoNoBlocoCob(a.saidas['p-out1'], a.saidas['p-out2'], 8884);
  chk('BLOCO RODANDO (cob): o botao "Já paguei" na tela do cliente e o texto do dono',
      String(cob.txt).trim() === MEU_BOTAO, JSON.stringify(cob.txt));
  chk('BLOCO RODANDO (cob): sem erro proprio', cob.erros.length === 0, cob.erros.join(' | '));
}

console.log('\n[2] texto de FABRICA na referencia -> continua de fabrica, sem barra vermelha');
if(!refTemNomesAntigos){
  console.log('  -- NAO MEDIU: a referencia ' + REF + ' ja usa os nomes novos.');
}else{
  const est = await colher(false, 8885);
  const a = await restaurarAqui(est, 8886);
  chk('restaurou sem alerta', a.alertas.length === 0, JSON.stringify(a.alertas));
  chk('o titulo ficou na fabrica', a.tela.titulo === FABRICA_TITULO, JSON.stringify(a.tela.titulo));
  chk('o botao ficou no valor do cenario (que e a fabrica)', a.tela.botao === FABRICA_BOTAO,
      JSON.stringify(a.tela.botao));
  chk('a barra vermelha de fabrica divergente nao acendeu', a.tela.falhas.trim() === '',
      a.tela.falhas.slice(0,140));
  if(refTemCopiadoAntigo)
    chk('leva 7: o copiado ficou na fabrica', a.tela.copiado === FABRICA_COPIADO,
        JSON.stringify(a.tela.copiado));
}

console.log('\n[3] estado que JA tem a chave nova nao e tocado');
{
  /* Nao precisa da referencia: descreve o estado de DEPOIS desta rodada. O que se cobra e
     que a conversao nao reescreva a escolha do dono numa segunda abertura -- ela e
     idempotente por construcao, e isto e a medida disso. */
  const r = await gerarNaFerramenta(async pg => {
    await pg.evaluate(() => {
      localStorage.setItem('fcConstrutores', JSON.stringify({
        a: {txtPixRotulo:'o velho', txtSecaoPix:'o que eu escolhi'},
        p: {t4:'o velho', txtZapBotao:'o que eu escolhi',
            txtCopiado:'o velho', txtPixCopiado:'o que eu escolhi'}
      }));
    });
    await pg.reload();
    await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                              window.confirm = () => true; window.open = () => null; });
    await pg.waitForTimeout(200);
    globalThis.__dep = await pg.evaluate(() => {
      const v = i => { const e = document.getElementById(i); return e ? e.value : null; };
      return {titulo: v('a-txt-pix-rotulo'), botao: v('p-t4'), copiado: v('p-txt-copiado')};
    });
  }, [], {porta: 8887});
  chk('restaurou sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('a escolha do dono ficou intocada (titulo)', globalThis.__dep.titulo === 'o que eu escolhi',
      JSON.stringify(globalThis.__dep.titulo));
  chk('a escolha do dono ficou intocada (botao)', globalThis.__dep.botao === 'o que eu escolhi',
      JSON.stringify(globalThis.__dep.botao));
  chk('a escolha do dono ficou intocada (copiado, leva 7)',
      globalThis.__dep.copiado === 'o que eu escolhi', JSON.stringify(globalThis.__dep.copiado));
}

console.log('\n[4] o fonte de hoje: um nome, um papel');
{
  const idx = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  /* 'txtPixRotulo' continua existindo -- nas TRES abas onde ele significa a linha do preco
     com desconto. O que nao pode mais existir e a linha da tabela da aba pac. */
  chk("A_TXT_DEFS usa 'txtSecaoPix'", idx.indexOf("['txtSecaoPix','a-txt-pix-rotulo'") >= 0);
  chk("A_TXT_DEFS nao usa mais 'txtPixRotulo'", idx.indexOf("['txtPixRotulo','a-txt-pix-rotulo'") < 0);
  chk("P_TXT_DEFS usa 'txtZapBotao'", idx.indexOf("['txtZapBotao','p-t4'") >= 0);
  chk("P_TXT_DEFS nao usa mais 't4'", idx.indexOf("['t4','p-t4'") < 0);
  chk("o gerador da pagina de obrigado le cfg.txtSecaoPix", idx.indexOf('escJsD(cfg.txtSecaoPix)') >= 0);
  chk("o gerador do Link de cobranca le cfg.txtZapBotao para o TXT_ZAP",
      idx.indexOf('TXT_ZAP=\'"+escJs(cfg.txtZapBotao)') >= 0);
  /* As tres abas em que 'txtPixRotulo' continua significando a linha do preco: e a prova de
     que o nome antigo nao foi varrido por engano de onde ele estava CERTO. */
  const linhaPreco = (idx.match(/\['txtPixRotulo','[ump]-txt-pix-?rotulo'/g) || []).length;
  chk("'txtPixRotulo' continua nas tres abas onde significa a linha do preco", linhaPreco === 3,
      String(linhaPreco));
  /* ---- leva 7: o par do "copiado" entrou na familia 'txtPix*' ---- */
  chk("P_TXT_DEFS usa 'txtPixCopiado'", idx.indexOf("['txtPixCopiado','p-txt-copiado'") >= 0);
  chk("P_TXT_DEFS usa 'txtPixNaocopiou'", idx.indexOf("['txtPixNaocopiou','p-txt-naocopiou'") >= 0);
  chk("P_TXT_DEFS nao usa mais 'txtCopiado'", idx.indexOf("['txtCopiado','p-txt-copiado'") < 0);
  chk("P_TXT_DEFS nao usa mais 'txtNaocopiou'", idx.indexOf("['txtNaocopiou','p-txt-naocopiou'") < 0);
  chk('o gerador do Link de cobranca le cfg.txtPixCopiado', idx.indexOf('escJs(cfg.txtPixCopiado)') >= 0);
  chk('o gerador do Link de cobranca le cfg.txtPixNaocopiou', idx.indexOf('escJs(cfg.txtPixNaocopiou)') >= 0);
  /* AS QUATRO ABAS concordam agora: uma chave, um papel. */
  /* Os ids NAO foram renomeados junto (id nao e persistido, e renomea-lo quebraria o cenario
     contra a referencia), entao o 'pix-' do meio e opcional: 'p-txt-copiado' contra
     'u/m/a-txt-pix-copiado'. O que tinha de concordar era a CHAVE, e concorda. */
  chk("'txtPixCopiado' aparece nas QUATRO abas", (idx.match(/\['txtPixCopiado','[umap]-txt-(pix-)?copiado'/g) || []).length === 4,
      String((idx.match(/\['txtPixCopiado','[umap]-txt-(pix-)?copiado'/g) || []).length));
  chk('a conversao existe e e uma so (fcTxtChaveMigrar)',
      (idx.match(/function fcTxtChaveMigrar\(/g) || []).length === 1);
  chk('e as duas abas a chamam, agora com quatro conversoes',
      (idx.match(/fcTxtChaveMigrar\(/g) || []).length === 5,
      String((idx.match(/fcTxtChaveMigrar\(/g) || []).length));
}

resumo();
