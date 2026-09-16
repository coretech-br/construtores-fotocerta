/* ============================================================================
   O TAMANHO DO QR CODE NAS QUATRO ABAS (leva 9, 14/09/2026)
   ============================================================================
   POR QUE ISTO EXISTE. Ate esta rodada o tamanho do QR era configuravel numa aba
   so (Link de cobranca, 'p-qr', 120 a 320, padrao 180) e FIXO em 200 nas outras
   tres. O dono autorizou estender o campo. Tres coisas precisam de medicao, e
   nenhuma delas e respondida lendo o codigo emitido:

     1. O CAMPO CHEGA AO QR DE VERDADE. Ler o numero no texto gerado prova que a
        string mudou, nao que o desenho mudou -- a biblioteca (qrcodejs) e quem
        decide o tamanho do <canvas>, e ela pode aparar, arredondar ou ignorar.
        Por isso a medida aqui e `canvas.width` do QR DESENHADO, com a biblioteca
        de verdade.
     2. A FAIXA SE CORRIGE A VISTA, e no momento certo. Regra escrita da casa: o
        clamp acontece em 'change'/'blur', NUNCA em 'input' -- corrigir a cada
        tecla impede digitar "320" (o "3" viraria 120 antes do resto chegar), e
        clamp silencioso troca defeito visivel por invisivel. As duas metades sao
        medidas: 'input' sozinho NAO corrige, 'change' corrige.
     3. O ACRESCIMO E PURO. Chave nova no estado e no preset. Backup gravado ANTES
        desta rodada nao tem 'qr' -- e o campo tem de cair nos 200, que e o numero
        que as tres abas ja emitiam fixo. O estado de teste e COLHIDO DA PROPRIA
        REFERENCIA (a arvore daquele commit, exercitada num navegador), e nao
        escrito a mao aqui: JSON escrito a mao descreveria o que eu ACHO que a
        versao anterior gravava.

   A REFERENCIA E PRESA, E O ENVELHECIMENTO E DETECTADO. 46ab2fd e o commit em que
   'main' estava quando esta rodada comecou -- a ultima arvore SEM os tres campos.
   No dia em que esta rodada for mesclada, uma referencia "main" passaria a ter os
   campos dentro e o teste mediria a si mesmo. Por isso o commit esta preso no
   argumento padrao e, se a arvore dele ja tiver 'id="u-qr"', a parte 3 diz
   NAO MEDIU (sem falhar) e imprime a linha de comando que mediria de verdade.

   As partes 1, 2 e 4 medem PROPRIEDADE da arvore de hoje e nao usam referencia
   nenhuma: elas nao envelhecem.

       node scripts/verificar/qr-configuravel.mjs [ref]

   Precisa de Node e Playwright -- ver scripts/verificar/lib.mjs.
   ============================================================================ */
import { gerarNaFerramenta, comBlocoNaPagina, chk, resumo } from './pagina.mjs';
import { set, radio, clicar, servir, navegador, abrir } from './lib.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || '46ab2fd';

/* A sonda do SDK do PayPal e os ganchos de alert/window.open, no <head> e ANTES do bloco:
   os blocos penduram o script do SDK ja no carregamento, e instalar isto depois chegaria
   tarde. Mesmo texto de aparencia.mjs, pelo mesmo motivo. */
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
  + 'window.alert=function(){};\n'
  + 'window.open=function(){return null;};\n'
  + '})();</scr'+'ipt>';

const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};

/* 'quando' no FUTURO de proposito: com horario passado a pagina de obrigado desenha o cartao
   de "prazo vencido", que nao tem secao de pagamento -- mediria uma tela que nao e esta. */
const BUSCA_PAC = '?pac=ENS&data=' + encodeURIComponent('10/05/2030')
  + '&hora=' + encodeURIComponent('14:00') + '&quando=' + encodeURIComponent('2030-05-10T14:00:00Z');

/* O tamanho pedido em cada aba na passagem "trocado". Tres numeros DIFERENTES entre si e
   diferentes do padrao: com um numero so, um bloco lendo o campo da aba errada passaria. */
const TROCADO = {u:'140', m:'260', a:'320', v:'240'};
const PADRAO  = {u:200,   m:200,   a:200,   p:180,  v:200};

/* ===========================================================================
   a passagem pela ferramenta -- as quatro abas, com Pix ligado
   =========================================================================== */
async function gerar(qr, porta){
  console.log('\ngerando os quatro blocos  [' + (qr ? 'trocado' : 'fabrica') + '] ...');
  const r = await gerarNaFerramenta(async pg => {
    for(const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);

    /* ---------- Checkout ---------- */
    await clicar(pg, 'aba-uni');
    await set(pg, 'u-pnome', 'Ensaio de familia'); await set(pg, 'u-ppreco', '1200');
    await clicar(pg, 'u-prod-salvar');
    await set(pg, 'u-pnome', 'Ensaio de gestante'); await set(pg, 'u-ppreco', '900');
    await clicar(pg, 'u-prod-salvar');
    if(qr) await set(pg, 'u-qr', TROCADO.u);
    await clicar(pg, 'u-gerar');

    /* ---------- Mini loja ---------- */
    await clicar(pg, 'aba-loja');
    await set(pg, 'm-pnome', 'Ensaio de familia'); await set(pg, 'm-ppreco', '1200');
    await set(pg, 'm-pcat', 'Ensaios');
    /* A vitrine RECUSA produto sem foto -- sem este campo a aba nao gera nada. */
    await set(pg, 'm-pimg', 'https://storage.alboom.ninja/ensaio-familia.jpg');
    await clicar(pg, 'm-prod-salvar');
    if(qr) await set(pg, 'm-qr', TROCADO.m);
    await clicar(pg, 'm-gerar');

    /* ---------- Link de cobranca (o CONTROLE: nao ganhou campo nenhum) ---------- */
    await clicar(pg, 'aba-cob');
    await set(pg, 'p-url', 'https://fotocerta.com.br/pagar');
    await set(pg, 'p-desc', 'Ensaio de familia - pacote completo');
    await set(pg, 'p-valor', '1200,50');
    await clicar(pg, 'p-gerar');
    await clicar(pg, 'p-gerarlink');

    /* ---------- Agendamento por pacote ---------- */
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC');
    await radio(pg, 'a-metodo', 'ambos');
    await set(pg, 'a-pcod', 'ENS'); await set(pg, 'a-pnome', 'Ensaio de familia');
    await set(pg, 'a-pdur', '1h'); await set(pg, 'a-ppreco', '1200');
    await set(pg, 'a-pinclui', '20 fotos'); await set(pg, 'a-ppath', 'fotocerta/ens');
    await clicar(pg, 'a-pac-salvar');
    if(qr) await set(pg, 'a-qr', TROCADO.a);
    await clicar(pg, 'a-gerar');

    /* ---------- Calculadora de album (a quinta aba que cobra, 16/09/2026) ----------
       O SINAL E DESLIGADO: ligado, o Pix desta aba cobra o sinal, e o QR continua sendo
       desenhado do mesmo jeito -- mas o bloco pede um valor de sinal valido antes, e um
       caminho a mais entre o clique e o canvas so aumentaria a chance de a parte 1 falhar
       por motivo que nao e o tamanho do QR, que e o que ela mede. */
    await clicar(pg, 'aba-alb');
    await set(pg, 'v-cod', 'ALB26');
    await radio(pg, 'v-sinal', 'nao');
    if(qr) await set(pg, 'v-qr', TROCADO.v);
    await clicar(pg, 'v-gerar');
  }, ['u-out', 'm-out', 'p-out1', 'p-out2', 'a-out3', 'v-out'], {porta});

  const id = qr ? 'trocado' : 'fabrica';
  chk('[' + id + '] a ferramenta gerou sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('[' + id + '] a ferramenta gerou sem erro de console', r.erros.length === 0, r.erros.slice(0, 2).join(' | '));
  for(const s of ['u-out', 'm-out', 'p-out1', 'a-out3', 'v-out'])
    chk('[' + id + '] ' + s + ' saiu', (r.valores[s] || '').length > 1000);
  return r.valores;
}

/* Abrir a area do Pix em cada aba -- a unica coisa diferente entre elas. Clica no LABEL, e
   nao no input: o marcador de selecao e DESENHADO (Manual do Prosite). */
async function abrirPix(pg, aba){
  if(aba === 'u'){
    const lb = pg.locator('label:has(input[name="fcu-prod"][value="0"])');
    if(await lb.count()){ await lb.click(); await pg.waitForTimeout(150); }
    await pg.click('.fcu-gerar');
  }else if(aba === 'm'){
    await pg.locator('.fcm-card').first().click();
    await pg.waitForTimeout(150);
    await pg.click('.fcm-add');
    await pg.waitForTimeout(150);
    await pg.click('.fcm-gerar');
  }else if(aba === 'a'){
    await pg.locator('.fca-ob-bt', {hasText: /Pix|Gerar/i}).first().click();
  }else if(aba === 'v'){
    /* A calculadora abre com um tamanho escolhido; clicar em um deles deixa a medicao
       independente do que for o padrao de fabrica amanha. */
    await pg.locator('.fcal-tam').first().click();
    await pg.waitForTimeout(150);
    await pg.click('.fcal-gerar');
  }else{
    await pg.locator('.fcpg-bt').first().click();
  }
  await pg.waitForTimeout(450);
}

const SELETOR = {u: '.fcu-qr', m: '.fcm-qr', a: '.fca-ob-qr', p: '.fcpg-qr', v: '.fcal-qr'};
const SAIDA   = {u: 'u-out',   m: 'm-out',   a: 'a-out3',     p: 'p-out1',  v: 'v-out'};

/* A MEDIDA: o <canvas> que a qrcodejs desenhou. A REDE EXTERNA E ABERTA PARA UM HOST SO
   (cdnjs), e o motivo e o mesmo ja aceito em aparencia.mjs: quem decide o tamanho do canvas
   e a biblioteca, e transcrever o que uma biblioteca de terceiro faz seria opiniao, nao
   medicao. O preco esta aceito -- esta parte pode falhar por rede, e a falha nao teria a ver
   com o bloco. */
async function medirCanvas(blocos, aba, porta){
  const r = await comBlocoNaPagina({
    bloco: blocos[SAIDA[aba]], cabeca: CABECA, porta,
    busca: aba === 'a' ? BUSCA_PAC : (aba === 'p' ? ('?' + ((blocos['p-out2'] || '').split('?')[1] || '')) : ''),
    permitir: ['cdnjs.cloudflare.com'],
    medir: async pg => {
      await pg.setViewportSize({width: 1024, height: 1400});
      try{ await abrirPix(pg, aba); }catch(e){}
      await pg.waitForTimeout(3000);
      return {lido: await pg.evaluate(sl => {
        const cx = document.querySelector(sl);
        if(!cx) return null;
        const cv = cx.querySelector('canvas');
        if(!cv) return {temCanvas: false};
        return {temCanvas: true, largura: cv.width, altura: cv.height,
                /* A caixa na tela, so para a falha dizer se o canvas foi esticado por CSS. */
                caixa: Math.round(cx.getBoundingClientRect().width)};
      }, SELETOR[aba])};
    }});
  return r.lido;
}

/* ============================ 1. o canvas de verdade ============================ */
const blocos = {};
blocos.fabrica = await gerar(false, 9161);
blocos.trocado = await gerar(true,  9162);

console.log('\n=== 1. o campo muda o QR no bloco EXECUTANDO (canvas.width, com a biblioteca de verdade) ===');
{
  let pt = 9170;
  for(const aba of ['u', 'm', 'a', 'p', 'v']){
    const m = await medirCanvas(blocos.fabrica, aba, pt++);
    chk('[fabrica] ' + aba + ': o QR desenhou (a biblioteca chegou)', !!(m && m.temCanvas),
        JSON.stringify(m));
    if(m && m.temCanvas)
      chk('[fabrica] ' + aba + ': o canvas mede ' + PADRAO[aba] + 'px', m.largura === PADRAO[aba],
          'mediu ' + m.largura + 'x' + m.altura + ' (caixa ' + m.caixa + 'px)');
  }
  for(const aba of ['u', 'm', 'a', 'v']){
    const m = await medirCanvas(blocos.trocado, aba, pt++);
    chk('[trocado] ' + aba + ': o QR desenhou', !!(m && m.temCanvas), JSON.stringify(m));
    if(m && m.temCanvas)
      chk('[trocado] ' + aba + ': o canvas seguiu o campo (' + TROCADO[aba] + 'px)',
          m.largura === Number(TROCADO[aba]),
          'mediu ' + m.largura + 'x' + m.altura + ' (caixa ' + m.caixa + 'px)');
  }
  /* O CONTROLE: a Link de cobranca nao ganhou campo nenhum nesta rodada e continua nos 180.
     Com os quatro em 200 a parte 1 inteira passaria mesmo que um bloco lesse o campo de
     outra aba -- e este numero diferente e o que impede isso. */
  const mp = await medirCanvas(blocos.trocado, 'p', pt++);
  if(mp && mp.temCanvas)
    chk('[trocado] p: a Link de cobranca continua nos 180 (nao foi tocada)', mp.largura === 180,
        'mediu ' + mp.largura);
}

/* ============================ 2. a faixa, e QUANDO ela corrige ============================ */
console.log('\n=== 2. a faixa se corrige no change/blur, e NAO no input ===');
{
  const srv = await servir(RAIZ, 9190);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:9190');
    for(const [aba, campo, botao] of [['Checkout','u-qr','aba-uni'], ['Mini loja','m-qr','aba-loja'],
                                      ['Agendamento por pacote','a-qr','aba-pac']]){
      await clicar(pg, botao);
      /* A terceira coluna e o que o campo mostra DEPOIS do 'input' e ANTES do 'change'. Ela
         nao e sempre o que foi digitado: <input type="number"> RECUSA texto que nao e numero
         e devolve '' (medido). Escrever "abc" na coluna faria o teste falhar por causa do
         navegador, e nao por causa do clamp -- que e justamente o que ele mede. */
      for(const [digitado, preso, cru] of [['999', '320', '999'], ['5', '120', '5'],
                                           ['0', '120', '0'], ['abc', '200', '']]){
        /* SO 'input' -- e a tecla sendo digitada. Corrigir aqui impediria digitar "320". */
        const noInput = await pg.evaluate(([id, v]) => {
          const el = document.getElementById(id);
          el.value = v;
          el.dispatchEvent(new Event('input', {bubbles: true}));
          return el.value;
        }, [campo, digitado]);
        chk('[' + aba + '] "' + digitado + '": no input o campo NAO e corrigido',
            noInput === cru && noInput !== preso, 'o campo ficou em "' + noInput + '"');
        /* Agora o gesto que encerra a digitacao. */
        const noChange = await pg.evaluate(([id]) => {
          const el = document.getElementById(id);
          el.dispatchEvent(new Event('change', {bubbles: true}));
          return el.value;
        }, [campo]);
        chk('[' + aba + '] "' + digitado + '": no change o campo se corrige para ' + preso,
            noChange === preso, 'o campo ficou em "' + noChange + '"');
      }
      /* O OUTRO GESTO QUE ENCERRA A DIGITACAO: sair do campo sem 'change'. 'blur' nao
         borbulha, entao ele tem ouvinte proprio em fcLigarFaixa -- e e o ramo que redesenha a
         previa. Medir so o 'change' deixaria metade da regra sem prova. */
      const soInput = await pg.evaluate(([id]) => {
        const el = document.getElementById(id);
        el.value = '400';
        el.dispatchEvent(new Event('input', {bubbles: true}));
        return el.value;
      }, [campo]);
      chk('[' + aba + '] "400": no input o campo NAO e corrigido', soInput === '400',
          'o campo ficou em "' + soInput + '"');
      const noBlur = await pg.evaluate(([id]) => {
        const el = document.getElementById(id);
        el.dispatchEvent(new Event('blur', {bubbles: true}));
        return el.value;
      }, [campo]);
      chk('[' + aba + '] "400": no blur (sem change) o campo se corrige para 320',
          noBlur === '320', 'o campo ficou em "' + noBlur + '"');
      /* Volta ao padrao para nao sujar a aba seguinte. */
      await set(pg, campo, '200');
    }
    chk('a ferramenta nao acusou erro de console durante a parte 2', pg.erros.length === 0,
        pg.erros.slice(0, 2).join(' | '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

/* ============================ 3. backup e preset ANTIGOS ============================ */
console.log('\n=== 3. backup e preset gravados ANTES desta rodada (estado colhido da referencia ' + REF + ') ===');
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-qr-'));
  let curto = REF;
  try{ curto = execFileSync('git', ['rev-parse', '--short', REF], {cwd: RAIZ}).toString().trim(); }catch(e){}
  execFileSync('sh', ['-c', 'git -C "' + RAIZ + '" archive ' + REF + ' | tar -x -C "' + tmp + '"']);
  const refHtml = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
  /* O SINAL DE ENVELHECIMENTO, lido do PROPRIO arquivo da referencia: se a arvore dela ja tem
     os tres campos, ela deixou de ser "antes" e esta parte mediria a si mesma. */
  const envelheceu = refHtml.indexOf('id="u-qr"') >= 0;
  if(envelheceu){
    console.log('  NAO MEDIU  a referencia ' + REF + ' (' + curto + ') JA TEM o campo u-qr dentro:');
    console.log('             ela deixou de ser o "antes" desta rodada, e comparar mediria a si mesma.');
    console.log('             Meça de verdade com o commit anterior a esta rodada, por exemplo:');
    console.log('               node scripts/verificar/qr-configuravel.mjs 46ab2fd');
  }else{
    /* Passo 1: exercitar a REFERENCIA e colher o que ELA grava. */
    const srvR = await servir(tmp, 9191);
    const brR = await navegador();
    let gravado = null;
    try{
      const pg = await abrir(brR, 'http://127.0.0.1:9191');
      for(const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
      for(const [botao, campos, pref] of [
        ['aba-uni',  [['u-pnome','Ensaio de familia'],['u-ppreco','1200']], 'u'],
        ['aba-loja', [['m-pnome','Ensaio de familia'],['m-ppreco','1200'],['m-pcat','Ensaios'],
                      ['m-pimg','https://storage.alboom.ninja/ensaio-familia.jpg']], 'm'],
        ['aba-pac',  [['a-pcod','ENS'],['a-pnome','Ensaio de familia'],['a-pdur','1h'],
                      ['a-ppreco','1200'],['a-pinclui','20 fotos'],['a-ppath','fotocerta/ens']], 'a']]){
        await clicar(pg, botao);
        for(const [id, v] of campos) await set(pg, id, v);
        await clicar(pg, pref + '-' + (pref === 'a' ? 'pac' : 'prod') + '-salvar');
        /* ...e um PRESET salvo naquela versao, que e a outra metade da pergunta. */
        await set(pg, 'fcp-' + pref + '-nome', 'Antes da leva 9');
        await clicar(pg, 'fcp-' + pref + '-salvar');
      }
      gravado = await pg.evaluate(() => localStorage.getItem('fcConstrutores'));
      chk('a referencia gravou um estado para colher', !!gravado && gravado.length > 200,
          'vieram ' + (gravado ? gravado.length : 0) + ' caracteres');
      /* A chave e procurada DENTRO do fragmento de cada aba, e nao no texto inteiro: a Link
         de cobranca ja gravava 'p.qr' antes desta rodada, entao um indexOf('"qr"') no JSON
         cru acusaria uma chave que nao e nenhuma das tres. */
      let frag = null;
      try{ frag = JSON.parse(gravado); }catch(e){}
      chk('o estado colhido e JSON legivel', !!frag);
      for(const pref of ['u', 'm', 'a'])
        chk('o estado colhido nao tem ' + pref + '.qr (e por isso ele serve de backup antigo)',
            !!frag && frag[pref] && frag[pref].qr === undefined,
            'a referencia gravou ' + pref + '.qr = ' + JSON.stringify(frag && frag[pref] && frag[pref].qr));
      await pg.close();
    } finally { await brR.close(); srvR.close(); }

    /* Passo 2: abrir a ARVORE DE HOJE com aquele estado dentro. */
    const srvN = await servir(RAIZ, 9192);
    const brN = await navegador();
    try{
      const pg = await abrir(brN, 'http://127.0.0.1:9192');
      await pg.evaluate(v => localStorage.setItem('fcConstrutores', v), gravado);
      await pg.reload();
      await pg.evaluate(() => { window.__alertas = []; window.alert = m => window.__alertas.push(String(m)); window.confirm = () => true; });
      for(const [aba, pref] of [['Checkout','u'], ['Mini loja','m'], ['Agendamento por pacote','a']]){
        await clicar(pg, 'aba-' + {u:'uni', m:'loja', a:'pac'}[pref]);
        const vBackup = await pg.evaluate(id => document.getElementById(id).value, pref + '-qr');
        chk('[' + aba + '] backup gravado antes da rodada abre com o campo no padrao (200)',
            vBackup === '200', 'o campo veio "' + vBackup + '"');
        /* Sujar o campo, para o "Aplicar" ter o que desfazer: preset antigo que deixasse o
           valor da tela passaria neste teste sem fazer nada. */
        await set(pg, pref + '-qr', '300');
        const temBotao = await pg.evaluate(p =>
          !!document.querySelector('#fcp-' + p + '-lista [data-fc-aplicar="0"]'), pref);
        chk('[' + aba + '] o preset salvo na referencia apareceu na lista de hoje', temBotao);
        if(temBotao){
          await pg.evaluate(p => document.querySelector('#fcp-' + p + '-lista [data-fc-aplicar="0"]').click(), pref);
          const vPreset = await pg.evaluate(id => document.getElementById(id).value, pref + '-qr');
          chk('[' + aba + '] aplicar um preset antigo devolve o campo ao padrao (200)',
              vPreset === '200', 'o campo ficou "' + vPreset + '"');
        }
      }
      const al = await pg.evaluate(() => window.__alertas.slice());
      chk('abrir o backup antigo e aplicar os presets nao gerou alerta', al.length === 0, JSON.stringify(al));
      chk('nem erro de console', pg.erros.length === 0, pg.erros.slice(0, 2).join(' | '));
      await pg.close();
    } finally { await brN.close(); srvN.close(); }
  }
  fs.rmSync(tmp, {recursive: true, force: true});
}

/* ============================ 4. a busca do topo ============================ */
console.log('\n=== 4. a busca do topo acha os tres campos ===');
{
  const srv = await servir(RAIZ, 9193);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:9193');
    /* Pelo ROTULO: o operador procura o que le na tela. As QUATRO abas tem de aparecer. */
    const porRotulo = await pg.evaluate(async () => {
      const c = document.getElementById('fcs-q');
      c.value = 'tamanho do qr';
      c.dispatchEvent(new Event('input', {bubbles: true}));
      await new Promise(r => setTimeout(r, 500));
      return [].slice.call(document.querySelectorAll('#fcs-res .fcs-item')).map(b => b.getAttribute('data-id'));
    });
    for(const id of ['u-qr', 'm-qr', 'a-qr', 'p-qr'])
      chk('busca por "tamanho do qr" acha ' + id, porRotulo.indexOf(id) >= 0, porRotulo.join(', '));
    /* ...e pelo ID, que e como o campo e citado numa conversa sobre a ferramenta. */
    for(const id of ['u-qr', 'm-qr', 'a-qr']){
      const achou = await pg.evaluate(async q => {
        const c = document.getElementById('fcs-q');
        c.value = q;
        c.dispatchEvent(new Event('input', {bubbles: true}));
        await new Promise(r => setTimeout(r, 500));
        return [].slice.call(document.querySelectorAll('#fcs-res .fcs-item')).map(b => b.getAttribute('data-id'));
      }, id);
      chk('busca por "' + id + '" acha o proprio campo', achou.indexOf(id) >= 0, achou.join(', '));
    }
    chk('a busca nao acusou erro de console', pg.erros.length === 0, pg.erros.slice(0, 2).join(' | '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

process.exit(resumo());
