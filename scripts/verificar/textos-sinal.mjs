/* ============================================================================
   OS TRES TEXTOS QUE EXPLICAM O SINAL  (rodada E, 13/09/2026)
   Checkout, Mini loja, Agendamento por pacote e Link de cobranca
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. A rodada E acrescenta doze campos -- tres por aba
   de pagamento -- que respondem tres perguntas do cliente ANTES de ele pagar o
   sinal: o que o sinal garante, e se ele desistir, o que fazer com o saldo. Eles
   NASCEM VAZIOS de proposito (sao declaracoes de politica comercial: um padrao de
   fabrica afirmaria, para um cliente pagante, uma politica que o dono pode nao
   ter), e linha vazia nao aparece.

   ESSE DESENHO TORNA A REGRESSAO BYTE A BYTE CEGA PARA ELE. Com a fabrica -- os
   tres vazios -- a saida dos geradores e IDENTICA a de antes da rodada, e e por
   isso que regressao.sh da zero: ela prova que nada quebrou, e nao consegue
   provar que algo passou a funcionar. Esta suite e o outro lado.

   ---------------------------------------------------------------------------
   O QUE ELE PROVA
   ---------------------------------------------------------------------------
     1. OS TRES ESTADOS, com o bloco EXECUTANDO numa pagina de verdade:
        tres vazios -> nada no DOM; um preenchido -> so ele; os tres -> os tres,
        NA ORDEM das perguntas.
     2. A POSICAO, conferida pelo DOM e nao pela aparencia: depois das linhas de
        sinal e saldo, ANTES do primeiro controle de pagamento. "Antes" e uma
        afirmacao sobre ordem de documento, e compareDocumentPosition e quem
        responde -- medir por coordenada na tela mediria o CSS, nao a estrutura.
     3. SO COM SINAL LIGADO: com o sinal desligado e os tres preenchidos, nada e
        emitido -- nem a regra de CSS, nem a div, nem uma linha de JS.
     4. O AVISO AMBAR nas quatro abas, medido por VISIBILIDADE REAL DA CAIXA
        (offsetWidth/offsetHeight/getClientRects) e nunca por getComputedStyle: o
        display computado de um elemento dentro de um ancestral display:none
        continua sendo o DELE, e mediria errado exatamente no caso em que quem
        esconde e o pai. Esta armadilha esta registrada em sinal.mjs e custou um
        falso positivo neste projeto.
     5. TEXTO HOSTIL nos doze -- apostrofa (o literal do bloco e de aspas
        simples), aspas duplas, barra invertida, acento, & e "</script", que o
        Manual do Prosite manda blindar. A medida do "</script" e o DOCUMENTO
        INTEIRO: se ele nao foi blindado, a marcacao fecha o <script> do bloco no
        meio e o marcador do fim da pagina some junto.
     6. A BUSCA acha os doze -- com o campo VAZIO (pelo rotulo e pelo id) e depois
        de preenchido (pelo valor) -- e o ECO do rotulo mostra o valor atual.
     7. O CONTRATO DO CAMPO: os doze nascem com value="" escrito no HTML (sem o
        atributo, fcTxtFabricaDiverge acenderia a barra vermelha, porque
        getAttribute('value') devolveria null e null !== '') e com o exemplo do
        dono no placeholder.

   ---------------------------------------------------------------------------
   O LINK DE COBRANCA E DIFERENTE, E A DIFERENCA FOI MEDIDA
   ---------------------------------------------------------------------------
   Naquela aba o sinal e POR COBRANCA: ele viaja no endereco e entra no selo. Os
   tres textos NAO: eles sao da PAGINA, ficam dentro do codigo 1 como todo TXT_*
   daquele bloco, e nenhum deles toca o link. Duas provas aqui embaixo fixam isso
   -- o link gerado nao cresce um caractere quando os tres estao preenchidos, e o
   bloco sai IDENTICO com a cobranca aberta com e sem sinal.

   Roda com:  node scripts/verificar/textos-sinal.mjs
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, radio, clicar, navegador, servir, abrir, ler, alertas } from './lib.mjs';
import { IDENT, preparar, cobranca } from './cenario.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* ===========================================================================
   A TABELA -- a MESMA de FC_SINAL_TXT no index.html. Escrita de novo aqui de
   proposito: um teste que importasse a tabela do projeto nao teria opiniao
   nenhuma sobre o rotulo e o exemplo, e e justamente a divergencia entre as
   quatro copias do HTML e a tabela que a guarda da partida existe para achar.
   =========================================================================== */
const CAMPOS = [
  {id:'garante',  rot:'O que o sinal garante',  ex:'ex.: O sinal garante o seu horário agendado'},
  {id:'desistir', rot:'E se o cliente desistir', ex:'ex.: Cancelamento não há devolução do sinal'},
  {id:'saldo',    rot:'O que fazer com o saldo', ex:'ex.: O saldo deve ser pago até 1 dia antes do seu ensaio'}
];
const PREFS = ['u','a','p','m'];
const campoId = (p,i) => p+'-txt-sinal-'+CAMPOS[i].id;

/* OS TEXTOS HOSTIS, um por pergunta e todos distintos: cada assercao aponta para
   UM campo. Cada um traz apostrofa, aspas duplas, barra invertida, acento e o
   "</script" -- e o & e o <b>, que so podem chegar a tela como TEXTO. */
const HOSTIL = [
  'GARANTE: o \'seu\' horário "reservado" \\ & <b> </script>',
  'DESISTIR: não há devolução — \'nenhuma\' "mesmo" \\ </script>',
  'SALDO: pague até 1 dia antes \'do\' ensaio "à" noite \\ </script>'
];
/* O caso "um preenchido" usa o do MEIO. Se ele saisse na primeira posicao por
   engano -- porque o gerador contasse indice em vez de conteudo -- a prova de
   ordem passaria com um so preenchido, que e o caso em que ela nao ve nada. */
const SO_O_MEIO = ['', 'SO O DO MEIO: não há devolução', ''];

const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|alboom\.ninja|storage\.|ERR_FAILED|Failed to load resource|net::ERR/i;
const errosReais = e => (e||[]).filter(x => !EXTERNO.test(x));

/* A sonda do SDK do PayPal e os ganchos de alert: o bloco pendura o script do
   SDK no carregamento, entao isto vai no <head>, antes dele. */
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
  + 'window.__alertas=[];\n'
  + 'window.alert=function(m){window.__alertas.push(String(m));};\n'
  + 'window.open=function(){return null;};\n'
  + '})();</scr'+'ipt>';

/* ===========================================================================
   AS QUATRO ABAS, do ponto de vista desta suite
   ===========================================================================
   'linha' e a classe de cada resposta no bloco entregue; 'antes' sao as linhas
   do sinal que tem de vir ANTES delas; 'pagar' sao os controles de pagamento que
   tem de vir DEPOIS. A lista de 'pagar' e propositalmente mais de um seletor por
   aba: qual deles existe depende do meio de pagamento, e a prova usa o PRIMEIRO
   que o documento tiver.
   =========================================================================== */
const ABAS = {
  u: {nome:'Checkout',  saida:'u-out',  linha:'.fcu-sinal-txt-l',
      antes:['.fcu-sinal','.fcu-saldo'], pagar:['.fcu-botoes','.fcu-gerar','.fcu-sep']},
  m: {nome:'Mini loja', saida:'m-out',  linha:'.fcm-sinal-txt-l',
      antes:['.fcm-sinal','.fcm-saldo'], pagar:['.fcm-botoes','.fcm-gerar','.fcm-sep']},
  a: {nome:'Pacote',    saida:'a-out3', linha:'.fca-ob-sinal-txt-l',
      /* '.fca-ob-bloco' NAO serve de marco de pagamento: MEDIDO, existe um antes do cartao de
         preco (a secao do topo), e a prova de ordem mediria a secao errada. Os dois abaixo so
         existem depois do cartao. */
      antes:['.fca-ob-sinal','.fca-ob-saldo'], pagar:['.fca-ob-botoes','.fca-ob-pixarea']},
  p: {nome:'Cobrança',  saida:'p-out1', linha:'.fcpg-sinal-txt-l',
      antes:['.fcpg-sinal','.fcpg-saldo'], pagar:['.fcpg-bloco','.fcpg-sep']}
};

/* ===========================================================================
   O CATALOGO MINIMO de cada aba -- so o bastante para o bloco ter o que cobrar
   =========================================================================== */
const PRECO = '400.00';
const A_PAC = {cod:'ENS', nome:'Ensaio A', dur:'2 horas', preco:PRECO};
const A_BUSCA = '?pac=ENS&data='+encodeURIComponent('10/05/2030')
  +'&hora='+encodeURIComponent('14:00')+'&quando='+encodeURIComponent('2030-05-10T14:00:00Z');

/* UMA passagem pela ferramenta configura as QUATRO abas e colhe as quatro
   saidas mais o link da cobranca. 'txt' sao os tres textos (vazios = fabrica) e
   'sinal' diz se o sinal esta ligado. */
async function gerar(rot, {txt, sinal, porta}){
  console.log('\ngerando as quatro saidas  ['+rot+'] ...');
  const r = await gerarNaFerramenta(async pg => {
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
    const tres = async p => { for(let i=0;i<3;i++) await set(pg, campoId(p,i), txt[i]); };

    /* ---------- Checkout ---------- */
    await clicar(pg,'aba-uni');
    await set(pg,'u-pnome','Ensaio A'); await set(pg,'u-ppreco',PRECO);
    await clicar(pg,'u-prod-salvar');
    await radio(pg,'u-sinal',sinal?'sim':'nao');
    if(sinal){ await radio(pg,'u-sinaltipo','pct'); await set(pg,'u-sinalpct','30'); }
    await tres('u');
    await clicar(pg,'u-gerar');

    /* ---------- Mini loja ---------- */
    await clicar(pg,'aba-loja');
    await set(pg,'m-pnome','Ensaio A'); await set(pg,'m-ppreco',PRECO);
    await set(pg,'m-pcat','Ensaios');
    await set(pg,'m-pimg','https://storage.alboom.ninja/ensaioA.jpg');
    await clicar(pg,'m-prod-salvar');
    await radio(pg,'m-sinal',sinal?'sim':'nao');
    if(sinal){ await radio(pg,'m-sinaltipo','pct'); await set(pg,'m-sinalpct','30'); }
    await tres('m');
    await clicar(pg,'m-gerar');

    /* ---------- Agendamento por pacote ---------- */
    await clicar(pg,'aba-pac');
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-prefixo','FC');
    await radio(pg,'a-metodo','ambos');
    await set(pg,'a-pcod',A_PAC.cod); await set(pg,'a-pnome',A_PAC.nome);
    await set(pg,'a-pdur',A_PAC.dur); await set(pg,'a-ppreco',A_PAC.preco);
    await set(pg,'a-pinclui','20 fotos'); await set(pg,'a-ppath','fotocerta/ens');
    await clicar(pg,'a-pac-salvar');
    await radio(pg,'a-sinal',sinal?'sim':'nao');
    if(sinal){ await radio(pg,'a-sinaltipo','pct'); await set(pg,'a-sinalpct','30'); }
    await tres('a');
    await clicar(pg,'a-gerar');

    /* ---------- Link de cobranca ----------
       Aqui o sinal e DA COBRANCA (viaja no link) e os tres textos sao DA PAGINA
       (ficam no bloco). Por isso o bloco e gerado sempre, e o link so leva sinal
       quando esta passagem pede. */
    await preparar(pg);
    await clicar(pg,'aba-cob');
    await cobranca(pg,{valor:'1200,50'});
    await radio(pg,'p-sinal',sinal?'sim':'nao');
    if(sinal){ await radio(pg,'p-sinaltipo','pct'); await set(pg,'p-sinalpct','30'); }
    await tres('p');
    await clicar(pg,'p-gerar');
    await pg.waitForTimeout(60);
    await clicar(pg,'p-gerarlink');
    await pg.waitForTimeout(120);
  }, ['u-out','m-out','a-out3','p-out1','p-out2'], {porta});

  chk('['+rot+'] a ferramenta gerou sem alerta', r.alertas.length===0, JSON.stringify(r.alertas));
  chk('['+rot+'] a ferramenta gerou sem erro de console', r.erros.length===0, r.erros.slice(0,2).join(' | '));
  for(const p of PREFS)
    chk('['+rot+'] '+ABAS[p].nome+': a saida nao veio vazia', (r.valores[ABAS[p].saida]||'').length>800);
  return r.valores;
}

/* ===========================================================================
   A ORDEM NO DOCUMENTO. Devolve os nomes dos marcos achados, ORDENADOS por
   ordem de documento -- e nao por posicao na tela. "Antes dos botoes" e uma
   afirmacao sobre a ESTRUTURA; medir por coordenada mediria o CSS.
   =========================================================================== */
const ordemNoDom = (pg, marcos) => pg.evaluate(marcos => {
  const achados = [];
  for(const [nome, sel] of marcos)
    document.querySelectorAll(sel).forEach(el => achados.push([nome, el]));
  achados.sort((a,b) => {
    if(a[1]===b[1]) return 0;
    const p = a[1].compareDocumentPosition(b[1]);
    /* 4 = o outro vem DEPOIS; 2 = vem antes. 20 (contido) nao acontece entre
       marcos irmaos, mas se acontecer o pai vem primeiro, que e 4 tambem. */
    return (p & 4) ? -1 : 1;
  });
  return achados.map(x => x[0]);
}, marcos);

const textoDasLinhas = (pg, sel) => pg.evaluate(
  sel => Array.prototype.map.call(document.querySelectorAll(sel), e => e.textContent), sel);

/* ===========================================================================
   COMO SE POE CADA BLOCO EM ESTADO DE PAGAR
   ===========================================================================
   As linhas do sinal so existem quando ha o que pagar (regra da rodada F), e as
   tres respostas acompanham o grupo. Entao cada aba precisa de um pedido montado
   antes de a medicao valer -- medir com o carrinho vazio leria "nao apareceu"
   sobre um bloco que esta certo.
   =========================================================================== */
async function prepararBloco(pg, pref){
  if(pref==='u'){
    /* Com UM produto so o carrinho ja nasce com ele marcado; o clique no label
       (e nao no input -- o marcador e desenhado, Manual do Prosite) so acontece
       se por algum motivo ele vier desmarcado. */
    const sel = 'input[name="fcu-prod"]';
    if(await pg.$(sel)){
      const marcado = await pg.$eval(sel, el => el.checked);
      if(!marcado) await pg.click('label:has('+sel+')');
    }
  }else if(pref==='m'){
    await pg.locator('.fcm-card').first().click();
    await pg.waitForTimeout(80);
    await pg.click('.fcm-add');
    await pg.waitForTimeout(80);
  }
  /* 'a' e 'p' ja nascem com o valor: o pacote e fixo, e a cobranca vem no link. */
  await pg.waitForTimeout(120);
}

/* ===========================================================================
   UMA MEDICAO: o bloco de uma aba rodando, num estado de texto
   =========================================================================== */
let PORTA = 8700;
async function medirBloco(rot, pref, bloco, esperadas){
  const a = ABAS[pref];
  const marcos = []
    .concat(a.antes.map((s,i) => ['antes'+i, s]))
    .concat([['linha', a.linha]])
    .concat(a.pagar.map((s,i) => ['pagar'+i, s]));
  const tag = '['+rot+'/'+a.nome+'] ';
  const r = await comBlocoNaPagina({
    bloco, cabeca: CABECA, porta: ++PORTA,
    busca: pref==='a' ? A_BUSCA : (pref==='p' ? LINK_BUSCA : ''),
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await prepararBloco(pg, pref);
      return {
        fim:   await pg.$('#fim-do-documento') !== null,
        ordem: await ordemNoDom(pg, marcos),
        linhas: await textoDasLinhas(pg, a.linha)
      };
    }
  });
  /* O DOCUMENTO INTEIRO e a medida do "</script": sem blindagem a marcacao fecha
     o <script> do bloco no meio e o que vem depois vira texto solto. */
  chk(tag+'o documento nao foi cortado pelo "</script"', r.fim);
  chk(tag+'o bloco carregou sem erro de console proprio',
      errosReais(r.erros).length===0, (r.erros||[]).slice(0,2).join(' | '));

  const esperado = esperadas.filter(x => x !== '');
  chk(tag+'quantas respostas no DOM: '+esperado.length,
      r.linhas.length===esperado.length, 'achou '+r.linhas.length+': '+JSON.stringify(r.linhas));
  chk(tag+'o texto de cada uma chega INTEIRO e NA ORDEM das perguntas',
      JSON.stringify(r.linhas)===JSON.stringify(esperado),
      JSON.stringify(r.linhas));

  if(esperado.length){
    const iLinha = r.ordem.indexOf('linha');
    const iAntes = Math.max(...a.antes.map((s,i) => r.ordem.lastIndexOf('antes'+i)));
    const iPagar = Math.min(...r.ordem.map((n,k) => /^pagar/.test(n) ? k : Infinity));
    chk(tag+'as respostas vem DEPOIS das linhas de sinal e saldo',
        iAntes>=0 && iLinha>iAntes, JSON.stringify(r.ordem));
    chk(tag+'as respostas vem ANTES do primeiro controle de pagamento',
        isFinite(iPagar) && r.ordem.lastIndexOf('linha')<iPagar, JSON.stringify(r.ordem));
  }
  return r;
}

/* ============================ a bateria ============================ */
console.log('========== O CONTRATO DOS DOZE CAMPOS, NA FERRAMENTA ==========');
let LINK_BUSCA = '';

{
  const srv = await servir(RAIZ, 8691);
  const br  = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8691');
    /* visivel pela CAIXA, nunca por getComputedStyle -- ver o cabecalho. */
    const olhar = (pref) => pg.evaluate(p => {
      const vis = el => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
      return { avisoVis: vis(document.getElementById(p+'-sinal-txt-aviso')) };
    }, pref);
    const contrato = () => pg.evaluate(() => {
      const fora = [];
      ['u','a','p','m'].forEach(p => ['garante','desistir','saldo'].forEach(id => {
        const el = document.getElementById(p+'-txt-sinal-'+id);
        if(!el){ fora.push([p+'-'+id, 'SEM CAMPO']); return; }
        const lab = el.labels && el.labels[0];
        fora.push([p+'-'+id, {
          attr: el.getAttribute('value'),
          valor: el.value,
          ph: el.getAttribute('placeholder'),
          rot: lab ? String(lab.textContent||'').replace(/\s+/g,' ').trim() : null
        }]);
      }));
      return fora;
    });

    /* 7. O contrato do campo. O rotulo e lido DEPOIS de fcsEcoMontar ter rodado
       (a ferramenta ja abriu), entao o eco vazio pode estar la -- por isso a
       comparacao e do COMECO do rotulo, e nao de igualdade. */
    const c = await contrato();
    chk('7. os doze campos existem', c.length===12 && c.every(x => x[1]!=='SEM CAMPO'),
        JSON.stringify(c.filter(x=>x[1]==='SEM CAMPO')));
    for(let k=0;k<c.length;k++){
      const [nome, d] = c[k];
      if(d==='SEM CAMPO') continue;
      const i = k % 3;
      chk('7. '+nome+': nasce com value="" escrito no HTML (sem o atributo a barra vermelha acenderia)',
          d.attr==='' && d.valor==='', 'attr='+JSON.stringify(d.attr)+' valor='+JSON.stringify(d.valor));
      chk('7. '+nome+': o exemplo do dono esta no placeholder', d.ph===CAMPOS[i].ex, 'leu '+JSON.stringify(d.ph));
      chk('7. '+nome+': o rotulo e a pergunta que ele responde',
          String(d.rot||'').indexOf(CAMPOS[i].rot)===0, 'leu '+JSON.stringify(d.rot));
    }

    /* 4. O AVISO AMBAR, aba por aba, nos quatro estados. */
    const abaDe = {u:'aba-uni', a:'aba-pac', p:'aba-cob', m:'aba-loja'};
    for(const p of PREFS){
      await clicar(pg, abaDe[p]); await pg.waitForTimeout(60);
      const semSinal = await olhar(p);
      await radio(pg, p+'-sinal', 'sim'); await pg.waitForTimeout(80);
      const comSinalVazio = await olhar(p);
      await set(pg, campoId(p,1), 'qualquer coisa'); await pg.waitForTimeout(80);
      const comUm = await olhar(p);
      await set(pg, campoId(p,1), '   '); await pg.waitForTimeout(80);
      const soEspaco = await olhar(p);
      await set(pg, campoId(p,1), ''); await pg.waitForTimeout(80);
      await radio(pg, p+'-sinal', 'nao'); await pg.waitForTimeout(80);
      const voltouSemSinal = await olhar(p);

      chk('4. '+ABAS[p].nome+': sem sinal, o aviso nao aparece', semSinal.avisoVis===false);
      chk('4. '+ABAS[p].nome+': sinal ligado com os tres vazios, o aviso APARECE',
          comSinalVazio.avisoVis===true);
      chk('4. '+ABAS[p].nome+': basta UM preenchido para o aviso sumir -- na tecla, sem clicar fora',
          comUm.avisoVis===false);
      chk('4. '+ABAS[p].nome+': texto so de espaco NAO conta como preenchido',
          soEspaco.avisoVis===true);
      chk('4. '+ABAS[p].nome+': desligando o sinal o aviso some de novo',
          voltouSemSinal.avisoVis===false);
    }

    /* 6. A BUSCA e o ECO. */
    const procurar = async (texto) => {
      await pg.evaluate(t => {
        const e = document.getElementById('fcs-q');
        e.value = t; e.dispatchEvent(new Event('input', {bubbles:true}));
      }, texto);
      await pg.waitForTimeout(80);
      return await pg.evaluate(() => Array.prototype.map.call(
        document.querySelectorAll('#fcs-res .fcs-item'), e => e.getAttribute('data-id')));
    };
    /* Com os campos VAZIOS a unica superficie e o rotulo e o id -- e e assim que
       o dono vai procurar por eles na primeira vez, que e o caso do defeito de
       DESCOBERTA que a busca existe para consertar. */
    for(let i=0;i<CAMPOS.length;i++){
      const achados = await procurar(CAMPOS[i].rot);
      const faltam = PREFS.map(p => campoId(p,i)).filter(id => achados.indexOf(id)<0);
      chk('6. a busca por "'+CAMPOS[i].rot+'" acha os quatro campos, com eles VAZIOS',
          faltam.length===0, 'faltaram: '+faltam.join(', '));
    }
    const porId = await procurar('txt-sinal-desistir');
    chk('6. a busca pelo id acha os quatro',
        PREFS.every(p => porId.indexOf(campoId(p,1))>=0), JSON.stringify(porId));

    /* O ECO mostra o valor ATUAL: vazio nao ecoa nada, preenchido ecoa. */
    const eco = () => pg.evaluate(id => {
      const el = document.getElementById(id), lab = el.labels && el.labels[0];
      const e = lab && lab.querySelector('.fcs-eco');
      return e ? e.textContent : null;
    }, campoId('u',0));
    await clicar(pg,'aba-uni'); await pg.waitForTimeout(60);
    const ecoVazio = await eco();
    await set(pg, campoId('u',0), 'Garante o seu horário');
    await pg.waitForTimeout(120);
    const ecoCheio = await eco();
    const achadoPeloValor = await procurar('Garante o seu horário');
    await set(pg, campoId('u',0), ''); await pg.waitForTimeout(80);
    chk('6. o eco do rotulo nasce vazio com o campo vazio', ecoVazio==='', JSON.stringify(ecoVazio));
    chk('6. o eco mostra o valor atual depois de preencher',
        String(ecoCheio||'').indexOf('Garante o seu horário')>=0, JSON.stringify(ecoCheio));
    chk('6. e a busca passa a achar o campo pelo VALOR',
        achadoPeloValor.indexOf(campoId('u',0))>=0, JSON.stringify(achadoPeloValor));

    chk('a ferramenta nao alertou nada nesta passagem', (await alertas(pg)).length===0);
    chk('sem erro de console na ferramenta', pg.erros.length===0, pg.erros.slice(0,2).join(' | '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

/* ===========================================================================
   AS QUATRO PASSAGENS DE GERACAO
   =========================================================================== */
console.log('\n\n========== OS BLOCOS ==========');
const G = {};
G.vazios   = await gerar('tres vazios',  {txt:['','',''],  sinal:true,  porta:8781});
G.semSinal = await gerar('sem sinal',    {txt:HOSTIL,      sinal:false, porta:8782});
G.umSo     = await gerar('um preenchido',{txt:SO_O_MEIO,   sinal:true,  porta:8783});
G.tres     = await gerar('os tres',      {txt:HOSTIL,      sinal:true,  porta:8784});

/* ---- 1 e 3: o que NAO sai, medido no TEXTO do bloco entregue ----
   Texto, e nao DOM: a afirmacao e "nem a regra de CSS, nem a div, nem uma linha
   de JS", e um DOM vazio nao distingue "nao foi emitido" de "foi emitido e nao
   apareceu". As duas coisas tem consequencias diferentes no bloco colado. */
for(const p of PREFS){
  const a = ABAS[p], cls = a.linha.slice(1);
  chk('1. '+a.nome+': com os tres VAZIOS o bloco nao traz uma letra de "'+cls+'"',
      (G.vazios[a.saida]||'').indexOf(cls)<0);
  /* A COBRANCA E MEDIDA DE OUTRO JEITO, e a diferenca nao e um caso especial do teste: e o
     desenho daquela aba. La o sinal e DE CADA COBRANCA e viaja no link, entao a maquinaria --
     e os textos que a explicam -- entra no bloco SEMPRE, com ou sem sinal na cobranca aberta
     no dia em que o codigo 1 foi gerado. Quem decide se as linhas aparecem e o parametro do
     endereco, em tempo de execucao. Exigir ausencia no TEXTO do bloco seria exigir o contrario
     do que a aba promete -- e quebraria a propriedade que sustenta o 'naoEmite' dela: ligar e
     desligar o sinal nao pode mudar o codigo 1. A prova equivalente esta logo abaixo, com o
     bloco rodando sobre um link SEM sinal. */
  if(p!=='p'){
    chk('3. '+a.nome+': com o SINAL DESLIGADO e os tres preenchidos, idem',
        (G.semSinal[a.saida]||'').indexOf(cls)<0);
    chk('3. '+a.nome+': e nenhum pedaco do texto preenchido vaza para o bloco sem sinal',
        (G.semSinal[a.saida]||'').indexOf('DESISTIR: n')<0);
  }
  chk('1. '+a.nome+': com os tres preenchidos o bloco traz as tres',
      (G.tres[a.saida]||'').split(cls).length-1 >= 3,
      'achou '+((G.tres[a.saida]||'').split(cls).length-1));
}

/* ---- O LINK DE COBRANCA: os textos sao DA PAGINA, e nao da cobranca ----
   A prova de que eles nao entraram no selo e de que o link nao mudou. Se um dia
   alguem os fizer viajar, o link cresce e esta linha cai -- que e o aviso que se
   quer, porque link novo com parametro novo e recusado por toda /pagar com
   codigo 1 antigo. */
chk('p. os tres textos NAO entram no link: com e sem eles, o link e o MESMO',
    G.umSo['p-out2'] === G.tres['p-out2'],
    'com um: '+String(G.umSo['p-out2']).length+' bytes; com tres: '+String(G.tres['p-out2']).length);
chk('p. o link da cobranca com sinal continua sendo gerado',
    /[?&]n=/.test(String(G.tres['p-out2']||'')), String(G.tres['p-out2']||'').slice(0,90));
chk('p. o BLOCO, ao contrario, muda -- e onde os textos moram',
    G.vazios['p-out1'] !== G.tres['p-out1']);

/* O endereco que os blocos da cobranca vao receber. Vem da passagem 'tres', que
   e a que tem sinal e texto -- e o mesmo link serve as duas medicoes, porque o
   sinal viaja nele e os textos nao. */
LINK_BUSCA = (() => {
  const s = String(G.tres['p-out2']||'');
  if(s.indexOf('?')<0) throw new Error('link de cobranca vazio: '+JSON.stringify(s.slice(0,80)));
  return s.slice(s.indexOf('?'));
})();

/* ---- 3, na cobranca: o bloco TRAZ os textos, e mesmo assim nao desenha linha nenhuma
   quando o link nao tem sinal. E a prova que corresponde, naquela aba, ao "so sai com o sinal
   ligado" -- e ela e mais forte que a das outras tres, porque ali o texto ESTA no bloco. ---- */
{
  const semSinal = String(G.semSinal['p-out2']||'');
  chk('3. Cobrança: o bloco sem sinal na cobranca TRAZ os textos (eles sao da pagina)',
      (G.semSinal['p-out1']||'').indexOf('DESISTIR: n')>=0);
  chk('3. Cobrança: e o link daquela cobranca nao leva sinal', !/[?&]n=/.test(semSinal),
      semSinal.slice(0,90));
  LINK_BUSCA = semSinal.slice(semSinal.indexOf('?'));
  await medirBloco('link sem sinal', 'p', G.semSinal['p-out1'], ['','','']);
}

/* ---- 1, 2 e 5: os blocos EXECUTANDO ---- */
LINK_BUSCA = (() => {
  const s = String(G.tres['p-out2']||'');
  return s.slice(s.indexOf('?'));
})();
for(const p of PREFS){
  await medirBloco('um preenchido', p, G.umSo[ABAS[p].saida], SO_O_MEIO);
  await medirBloco('os tres',       p, G.tres[ABAS[p].saida], HOSTIL);
}

process.exit(resumo());
