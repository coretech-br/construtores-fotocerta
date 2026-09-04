/* ============================================================================
   O CALENDARIO AQUECIDO: A PRE-CONEXAO, O AQUECIMENTO E O PERIGO QUE VEM JUNTO
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. Em 04/09/2026 o dono mediu, na pagina publicada
   (fotocerta.com.br/estudio-905-locacao), o tempo entre clicar num pacote e o
   calendario aparecer:

       primeira vez ............ 9115 ms
       trocando de pacote .........787 ms      (doze vezes mais rapido)

   Decomposto na mesma medicao: 0 ms para o bloco criar o iframe, ~413 ms para
   abrir a conexao com o dominio do calendario (687 ms na primeira requisicao
   contra 274 ms na segunda) e o resto e a pagina do TidyCal baixando os
   proprios arquivos. Ou seja: quase tudo e CUSTO DE PRIMEIRA VEZ. A rodada
   atacou os dois: preconnect/dns-prefetch no carregamento da pagina, e o
   calendario comecando a baixar no instante em que o cliente demonstra
   INTENCAO -- nunca no carregamento da pagina, porque quem entra e sai sem
   escolher nada nao pode pagar por isso.

   E POR QUE A REGRESSAO NAO SERVE AQUI. Ela compara TEXTO gerado, e diz apenas
   que t-out1 e a-out1 mudaram -- o que se sabia. As tres perguntas que importam
   nao tem resposta em texto nenhum:

     1. o aquecimento CARREGOU MESMO? Iframe dentro de container display:none
        pode nao carregar, ou carregar com prioridade baixa, dependendo do
        navegador. Supor que carregou e entregar uma melhoria ilusoria.
     2. o clique ficou mais rapido? So o TidyCal de verdade do outro lado
        responde isso, e so com o ANTES e o DEPOIS medidos lado a lado.
     3. a altura anunciada por um quadro que NAO esta na tela e ignorada? Este
        e o perigo que o aquecimento cria: um segundo iframe na mesma origem
        passa pelo filtro de e.origin, e a altura dele seria escrita no
        calendario visivel. Defeito mudo -- nada quebra, o quadro so fica do
        tamanho errado.

   AS QUATRO PARTES, e o que cada uma custa:
     1. PRE-CONEXAO ........... rede fechada, segundos
     2. O PERIGO (e.source) ... rede fechada, segundos
     3. O AQUECIMENTO CARREGOU  TidyCal de verdade
     4. OS TEMPOS ............. TidyCal de verdade, novo contra referencia

   As partes 3 e 4 falam com a internet, pelo mesmo motivo (e com o mesmo preco)
   ja assumido em tidycal-unificado.mjs: quando elas falharem por rede, a leitura
   certa e "nao mediu", nao "quebrou".

   Rodar: node scripts/verificar/calendario-aquecido.mjs
          node scripts/verificar/calendario-aquecido.mjs <ref>   (outra referencia)
============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, clicar } from './lib.mjs';
import { preparar } from './cenario.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';

/* OS DOIS PACOTES DA MESMA FAMILIA MORAM NO MESMO DOMINIO, e o segundo e o primeiro com uma
   consulta a mais. Nao e economia de digitacao: e a unica forma de reproduzir exatamente o
   caso que o dono mediu -- trocar de pacote DENTRO do mesmo dominio, que e onde os 787 ms
   aparecem (documento novo, arquivos ja em cache). Dominios diferentes ja tem prova propria em
   tidycal-unificado.mjs. */
const CAL1 = 'https://tidycal.com/fotocerta/natal-2026';
const CAL2 = 'https://tidycal.com/fotocerta/natal-2026?fc=2';
const CAL3 = 'https://agendamento.fotocerta.com.br/estudio-905-seg-a-sex-1-hora';
const CDN = 'https://asset-tidycal.b-cdn.net';
const REDE = ['tidycal.com', 'agendamento.fotocerta.com.br', 'asset-tidycal.b-cdn.net'];

/* QUANTO TEMPO O CLIENTE PASSA LENDO A LISTA antes de clicar num pacote. E o unico numero
   arbitrado deste arquivo, e ele esta a vista de proposito: o ganho do aquecimento e, por
   construcao, no maximo esta pausa. Oito segundos e o que o dono descreveu como "passam
   segundos, ele esta lendo a lista"; com uma pausa menor o ganho seria menor, e com pausa
   zero (clique imediato) nao haveria ganho nenhum -- e isso NAO e um defeito, e a definicao. */
const PAUSA = 8000;
/* Ate quanto se espera o calendario carregar depois do clique, antes de desistir. */
const LIMITE = 40000;

const RUIDO = ['Failed to load resource', 'net::ERR_', 'Failed to load Stripe.js'];
const errosDoBloco = e => e.filter(x => !RUIDO.some(r => x.indexOf(r) >= 0));

/* ===== a sonda de tempo =====
   Vai em corpoAntes, antes do bloco, e nao toca em uma linha dele: so observa. Anota o
   instante de cada 'load' de iframe (inclusive os que nascem depois, e inclusive o segundo
   'load' do MESMO elemento quando o src troca) e o instante de cada sinal de altura vindo do
   calendario. `__marca` e chamada pelo teste imediatamente antes de cada clique.
   POR QUE DUAS MEDIDAS. 'load' e o documento do calendario pronto; 'primeira altura' e o
   instante em que ele anuncia o proprio tamanho, que e quando o quadro para de ser um
   retangulo vazio. As duas contam a mesma historia por caminhos independentes -- se so uma
   melhorasse, a melhoria seria suspeita. */
const SONDA = '<scr'+'ipt>(function(){\n'
  + '  window.__loads=[];window.__alturas=[];window.__srcs=[];window.__marcas={};\n'
  + '  window.__marca=function(n){window.__marcas[n]=Date.now();};\n'
  + '  function vigiar(f){\n'
  + '    if(f.__fcv)return;f.__fcv=1;\n'
  + "    f.addEventListener('load',function(){window.__loads.push({t:Date.now(),src:f.src||''});});\n"
  + '  }\n'
  + '  new MutationObserver(function(ms){\n'
  + '    for(var i=0;i<ms.length;i++){\n'
  + "      if(ms[i].type==='attributes'){\n"
  + "        if(ms[i].target.tagName==='IFRAME')window.__srcs.push({t:Date.now(),src:ms[i].target.src||''});\n"
  + '        continue;\n'
  + '      }\n'
  + '      for(var j=0;j<ms[i].addedNodes.length;j++){\n'
  + '        var n=ms[i].addedNodes[j];\n'
  + '        if(!n||n.nodeType!==1)continue;\n'
  + "        if(n.tagName==='IFRAME')vigiar(n);\n"
  + "        if(n.querySelectorAll)Array.prototype.forEach.call(n.querySelectorAll('iframe'),vigiar);\n"
  + '      }\n'
  + '    }\n'
  + "  }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});\n"
  + "  window.addEventListener('message',function(e){\n"
  + "    if(typeof e.data==='string'&&e.data.indexOf('[iFrameSizer]')===0){\n"
  + "      var h=parseInt(e.data.split(':')[1],10);\n"
  + '      if(h>0)window.__alturas.push({t:Date.now(),h:h});\n'
  + '    }\n'
  + '  },true);\n'
  + '})();</scr'+'ipt>';

const ENCHIMENTO = '<div style="height:1200px;background:#eee"></div>';

/* O TEMPO DO CLIQUE ATE O CALENDARIO.
   Tres desfechos, e a diferenca entre os dois ultimos e o que uma versao anterior deste
   arquivo errava: "ja havia um documento carregado antes do clique" NAO significa que o
   clique nao precisou de nada. Trocar de pacote tambem parte de um documento carregado, e
   ali comeca uma navegacao nova. Quem separa os dois casos e o 'src' do iframe: se ele mudou
   depois da marca, houve navegacao e o que vale e o 'load' que vier: se nao mudou -- porque
   abrirCalendario reconheceu o endereco ja carregado --, o calendario estava pronto, e a
   resposta e 0 ms. Que e exatamente o que o aquecimento existe para produzir. */
async function esperarCalendario(pg, marca){
  const inicio = Date.now(), fim = inicio + LIMITE;
  let houveSrc = false;
  while(Date.now() < fim){
    const r = await pg.evaluate(m => {
      const t0 = window.__marcas[m];
      const dep = window.__loads.filter(x => x.t >= t0 && x.src);
      const antes = window.__loads.filter(x => x.t < t0 && x.src);
      const alt = window.__alturas.filter(x => x.t >= t0);
      return { dep: dep.length ? dep[dep.length - 1].t - t0 : null,
               srcs: window.__srcs.filter(x => x.t >= t0).length,
               jaTinha: antes.length > 0, alt: alt.length ? alt[0].t - t0 : null };
    }, marca);
    if(r.srcs) houveSrc = true;
    if(r.dep !== null) return { load: r.dep, altura: r.alt, prontoAntes: false };
    /* O clique roda de forma sincrona: se ele fosse trocar o src, ja teria trocado. Passado
       esse instante sem troca nenhuma e com um documento ja carregado, nao ha o que esperar. */
    if(!houveSrc && r.jaTinha && Date.now() - inicio > 1200)
      return { load: 0, altura: 0, prontoAntes: true };
    await pg.waitForTimeout(300);
  }
  return { load: null, altura: null, prontoAntes: false };
}

/* ===== gerar ===== */
async function gerarPac(raiz, porta, comFam){
  const pacotes = comFam
    ? [['UM', 'Pacote um', '45 minutos', '420', '10 fotos', CAL1, 'F1'],
       ['DOIS', 'Pacote dois', '1 hora', '700', '20 fotos', CAL2, 'F1'],
       ['TRES', 'Pacote tres', '2 horas', '900', '40 fotos', CAL3, 'F2']]
    : [['UM', 'Pacote um', '45 minutos', '420', '10 fotos', CAL1, ''],
       ['DOIS', 'Pacote dois', '1 hora', '700', '20 fotos', CAL2, '']];
  const { valores, alertas } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC');
    if(comFam && await pg.$('#a-fam-nome')){
      await set(pg, 'a-fam-nome', 'Fins de semana');
      await clicar(pg, 'a-fam-add');
    }
    const campo = await pg.$('#a-ppath') ? 'a-ppath' : 'a-plink';
    for(const p of pacotes){
      await set(pg, 'a-pcod', p[0]); await set(pg, 'a-pnome', p[1]); await set(pg, 'a-pdur', p[2]);
      await set(pg, 'a-ppreco', p[3]); await set(pg, 'a-pinclui', p[4]); await set(pg, campo, p[5]);
      if(comFam && await pg.$('#a-pfam')) await set(pg, 'a-pfam', p[6]);
      await clicar(pg, 'a-pac-salvar');
    }
    await clicar(pg, 'a-gerar');
  }, ['a-out1'], { raiz, porta });
  if(alertas.length) console.log('      (alerta ao gerar: ' + alertas[0].slice(0, 70) + ')');
  return valores['a-out1'];
}

async function gerarTidy(raiz, porta){
  const { valores } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-tidy');
    await set(pg, 't-path', CAL1);
    await clicar(pg, 't-gerar');
  }, ['t-out1'], { raiz, porta });
  return valores['t-out1'];
}

/* ===== main ===== */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-aquec-'));
try{
  execFileSync('sh', ['-c', 'git -C "' + RAIZ + '" archive ' + REF + ' | tar -x -C "' + tmp + '"']);
}catch(e){
  console.log('Nao consegui extrair a referencia "' + REF + '": ' + (e.message || e));
  process.exit(1);
}
console.log('referencia: ' + REF + '\npausa de leitura simulada: ' + PAUSA + 'ms\n');

console.log('gerando os blocos...');
const bloco = {
  novoFam:  await gerarPac(RAIZ, 8841, true),
  novoSem:  await gerarPac(RAIZ, 8842, false),
  novoTidy: await gerarTidy(RAIZ, 8843),
  refFam:   await gerarPac(tmp, 8844, true),
  refSem:   await gerarPac(tmp, 8845, false)
};
for(const k of Object.keys(bloco))
  chk('bloco ' + k + ' foi gerado', (bloco[k] || '').length > 500, 'tamanho=' + (bloco[k] || '').length);
/* Sem isto, todas as comparacoes abaixo poderiam estar medindo o mesmo bloco duas vezes. */
chk('o bloco novo tem o aquecimento e a referencia nao',
    bloco.novoFam.indexOf('function aquecer(') >= 0 && bloco.refFam.indexOf('function aquecer(') < 0);

/* ================================================================
   1. PRE-CONEXAO -- rede fechada
   ================================================================ */
console.log('\n===== 1. pre-conexao no carregamento da pagina =====');
const lerPre = pg => pg.evaluate(() => Array.from(document.querySelectorAll('link[data-fc-pre]'))
  .map(l => l.rel + ' ' + l.getAttribute('data-fc-pre')));

for(const [rot, b] of [['vitrine de pacotes', bloco.novoFam], ['aba TidyCal', bloco.novoTidy]]){
  const r = await comBlocoNaPagina({
    bloco: b, porta: 8846, corpoDepois: ENCHIMENTO,
    /* rede fechada de proposito: o que se mede aqui e o que o bloco DECLARA, e nao se a
       conexao chegou a ser aberta -- isso e a parte 4. */
    medir: async pg => ({ pre: await lerPre(pg) })
  });
  console.log('      ' + rot + ': ' + JSON.stringify(r.pre));
  chk(rot + ': preconnect para o dominio do calendario, antes de qualquer clique',
      r.pre.indexOf('preconnect https://tidycal.com') >= 0, JSON.stringify(r.pre));
  chk(rot + ': dns-prefetch para o dominio do calendario (o degrau que sobra)',
      r.pre.indexOf('dns-prefetch https://tidycal.com') >= 0, JSON.stringify(r.pre));
  chk(rot + ': preconnect para o CDN do embed.js',
      r.pre.indexOf('preconnect ' + CDN) >= 0, JSON.stringify(r.pre));
  chk(rot + ': sem erro de console', errosDoBloco(r.erros).length === 0,
      JSON.stringify(errosDoBloco(r.erros).slice(0, 2)));
}

/* A vitrine com pacotes em DOIS dominios avisa os dois -- e um so quando sao iguais. */
const preFam = await comBlocoNaPagina({
  bloco: bloco.novoFam, porta: 8847, corpoDepois: ENCHIMENTO,
  medir: async pg => ({ pre: await lerPre(pg) })
});
chk('vitrine: avisa TAMBEM o dominio proprio do segundo grupo de pacotes',
    preFam.pre.indexOf('preconnect https://agendamento.fotocerta.com.br') >= 0, JSON.stringify(preFam.pre));
chk('vitrine: os dois pacotes de tidycal.com produzem UM aviso, e nao dois',
    preFam.pre.filter(x => x === 'preconnect https://tidycal.com').length === 1, JSON.stringify(preFam.pre));

/* DOIS BLOCOS NA MESMA PAGINA nao podem pedir a mesma conexao duas vezes -- e o mesmo cuidado
   que a tag do embed.js ja tinha (data-fc-tidycal). */
const doisPre = await comBlocoNaPagina({
  bloco: bloco.novoTidy, corpoDepois: bloco.novoFam + ENCHIMENTO, porta: 8848,
  medir: async pg => ({ pre: await lerPre(pg) })
});
chk('dois blocos na mesma pagina: um aviso por origem, sem repetir',
    doisPre.pre.filter(x => x === 'preconnect https://tidycal.com').length === 1 &&
    doisPre.pre.filter(x => x === 'preconnect ' + CDN).length === 1, JSON.stringify(doisPre.pre));

/* ================================================================
   2. O PERIGO: a altura anunciada por um quadro que nao esta na tela
   ================================================================
   O ISCA e um iframe DE MESMA ORIGEM do calendario -- exatamente o que um aquecimento feito
   com um segundo quadro criaria. O sinal e montado com e.origin CERTO (senao ele morreria no
   filtro anterior, e este teste nao diria nada sobre o novo) e com e.source do ISCA.
   O 'source' vai por Object.defineProperty porque MessageEventInit.source so aceita
   WindowProxy e aqui o valor precisa ser escolhido pelo teste.
   O POSITIVO VEM JUNTO, e nao e enfeite: sem ele, um bloco que ignorasse TODA mensagem
   passaria neste arquivo com louvor. */
console.log('\n===== 2. o perigo: altura vinda de outro quadro =====');
const ALTURA_ISCA = '[iFrameSizer]fcx:1234:900:mutationObserver';

async function perigo(rot, b, porta, antesDoSinal){
  const r = await comBlocoNaPagina({
    bloco: b, porta, corpoDepois: ENCHIMENTO,
    medir: async pg => {
      if(antesDoSinal) await antesDoSinal(pg);
      await pg.waitForTimeout(600);
      return await pg.evaluate(a => {
        const sel = 'iframe.tidycal-embed, iframe.fca-tidycal';
        const f = document.querySelector(sel);
        if(!f) return { erro: 'sem iframe do calendario na pagina' };
        /* o isca: mesma origem do calendario, criado agora */
        const isca = document.createElement('iframe');
        isca.style.cssText = 'width:1px;height:1px;border:0';
        isca.src = f.src;
        document.body.appendChild(isca);
        const origem = (/^https:\/\/[^/?#]+/.exec(f.src) || [''])[0];
        const manda = (fonte, dado) => {
          const ev = new MessageEvent('message', { data: dado, origin: origem });
          Object.defineProperty(ev, 'source', { value: fonte });
          window.dispatchEvent(ev);
        };
        const altura = () => document.querySelector(sel).style.height || '';
        const antes = altura();
        manda(isca.contentWindow, a);
        const depoisIsca = altura();
        manda(f.contentWindow, a);
        const depoisReal = altura();
        return { antes, depoisIsca, depoisReal, origem };
      }, ALTURA_ISCA);
    }
  });
  if(r.erro){ chk(rot + ': achou o iframe do calendario', false, r.erro); return; }
  console.log('      ' + rot + ': antes=' + r.antes + '  apos o ISCA=' + r.depoisIsca +
              '  apos o quadro real=' + r.depoisReal);
  chk(rot + ': NEGATIVO -- altura anunciada por OUTRO quadro (mesma origem) e IGNORADA',
      r.depoisIsca === r.antes, 'antes=' + r.antes + ' depois=' + r.depoisIsca);
  chk(rot + ': POSITIVO -- a mesma altura, vinda do quadro DA TELA, e aplicada',
      r.depoisReal === '1234px', 'depois=' + r.depoisReal);
}

await perigo('aba TidyCal', bloco.novoTidy, 8849);
await perigo('vitrine de pacotes', bloco.novoFam, 8850, async pg => {
  await pg.locator('.fca-fam').first().click({ timeout: 10000 });
  await pg.locator('.fca-card:visible').first().click({ timeout: 10000 });
  await pg.waitForTimeout(1200);   /* passa a janela de 800ms de 'ignorarAte' */
});

/* ================================================================
   3. O AQUECIMENTO CARREGOU DE VERDADE -- TidyCal real
   ================================================================
   A ARMADILHA que esta parte existe para nao supor: iframe dentro de container display:none
   pode nao carregar, ou carregar com prioridade baixa. Aqui nao se pergunta ao codigo, e sim
   ao navegador -- o quadro respondeu? o documento dele terminou? Junto vem o outro lado do
   trato com o dono: quem NAO demonstra intencao nao paga nada. */
console.log('\n===== 3. o aquecimento carregou (TidyCal real) =====');
const aquec = await comBlocoNaPagina({
  bloco: bloco.novoFam, porta: 8851, permitir: REDE,
  corpoAntes: SONDA, corpoDepois: ENCHIMENTO,
  medir: async pg => {
    const r = {};
    /* A PROVA MAIS DIRETA DE QUE ALGO FOI BAIXADO nao esta na pagina, e sim na rede: quantas
       requisicoes sairam para o dominio do calendario ANTES de o cliente clicar em pacote
       nenhum. Zero aqui significaria melhoria ilusoria. */
    let pedidos = 0;
    pg.on('request', q => { if(q.url().indexOf('tidycal.com') >= 0) pedidos++; });
    await pg.waitForTimeout(1500);
    /* antes de qualquer gatilho: nada de calendario */
    r.iframesAntes = await pg.evaluate(() => document.querySelectorAll('iframe.fca-tidycal').length);
    await pg.evaluate(() => window.__marca('familia'));
    await pg.locator('.fca-fam').first().click({ timeout: 10000 });
    await pg.waitForTimeout(1000);
    r.iframesApos = await pg.evaluate(() => document.querySelectorAll('iframe.fca-tidycal').length);
    /* ESCONDIDO DE VERDADE? Se o quadro estivesse visivel, esta parte nao mediria a armadilha
       -- mediria um iframe normal. offsetParent nulo mais display:none no ancestral e o que
       prova que ele esta na subarvore escondida. */
    r.escondido = await pg.evaluate(() => {
      const f = document.querySelector('iframe.fca-tidycal');
      if(!f) return null;
      let n = f.parentElement, achou = '';
      while(n){
        if(getComputedStyle(n).display === 'none'){ achou = n.className; break; }
        n = n.parentElement;
      }
      return { offsetParent: f.offsetParent === null, ancestral: achou, rect: f.getBoundingClientRect().height };
    });
    /* CARREGOU? Tres provas independentes, e nenhuma delas e "o codigo diz que sim": sairam
       requisicoes para o dominio do calendario, o documento disparou 'load', e -- depois de
       revelado -- o quadro aquecido funciona como qualquer outro. */
    const t = await esperarCalendario(pg, 'familia');
    r.load = t.load;
    r.pedidos = pedidos;
    /* O QUADRO AQUECIDO NAO E UM ZUMBI. Enquanto escondido ele nao anuncia altura -- medido, e
       era de esperar: sem layout, o iframe-resizer de dentro nao tem o que medir. O que
       importa e que, ao ser revelado (o cliente escolhe justamente o pacote aquecido, que e o
       caso em que abrirCalendario NAO recarrega nada), ele passe a anunciar e o quadro ganhe
       altura de verdade. Sem esta medida, "carregou" poderia significar "baixou e travou". */
    await pg.evaluate(() => window.__marca('revelar'));
    await pg.locator('.fca-card:visible').first().click({ timeout: 10000 });
    await pg.waitForTimeout(9000);
    r.recarregou = await pg.evaluate(() => window.__srcs.filter(x => x.t >= window.__marcas.revelar).length);
    r.sinaisAposRevelar = await pg.evaluate(() => window.__alturas.filter(x => x.t >= window.__marcas.revelar).length);
    r.alturaVisivel = await pg.evaluate(() => {
      const f = document.querySelector('iframe.fca-tidycal');
      return f ? Math.round(f.getBoundingClientRect().height) : 0;
    });
    return r;
  }
});
console.log('      iframes antes do gatilho=' + aquec.iframesAntes +
            '  depois=' + aquec.iframesApos +
            '  requisicoes ao TidyCal antes de qualquer clique em pacote=' + aquec.pedidos +
            '  load=' + aquec.load + 'ms' +
            '  escondido=' + JSON.stringify(aquec.escondido));
console.log('      ao revelar: trocas de src=' + aquec.recarregou +
            '  sinais de altura=' + aquec.sinaisAposRevelar +
            '  altura na tela=' + aquec.alturaVisivel + 'px');
chk('quem NAO demonstra intencao nao baixa calendario nenhum', aquec.iframesAntes === 0,
    'iframes=' + aquec.iframesAntes);
chk('escolher a familia cria o iframe do calendario, antes de qualquer clique em pacote',
    aquec.iframesApos === 1, 'iframes=' + aquec.iframesApos);
/* O ancestral com display:none e a propria .fca-cal (a regra e '.fca-passo3 .fca-cal'), e nao
   o passo -- por isso a conferencia nomeia .fca-cal. Se um dia o esconderijo mudar de
   elemento, esta linha e a que avisa. */
chk('e ele esta mesmo ESCONDIDO -- a armadilha esta sendo enfrentada, e nao contornada',
    !!aquec.escondido && aquec.escondido.offsetParent === true &&
    aquec.escondido.ancestral.indexOf('fca-cal') >= 0 && aquec.escondido.rect === 0,
    JSON.stringify(aquec.escondido));
chk('display:none NAO impediu o carregamento: sairam requisicoes ao dominio do calendario',
    aquec.pedidos > 0, 'requisicoes=' + aquec.pedidos);
chk('e o documento do calendario terminou de carregar, escondido',
    typeof aquec.load === 'number', 'load=' + aquec.load);
chk('escolher o pacote AQUECIDO nao recarrega o iframe (era o risco do f.src=mesmo valor)',
    aquec.recarregou === 0, 'trocas de src=' + aquec.recarregou);
chk('e o quadro aquecido nao e um zumbi: revelado, ele anuncia altura',
    aquec.sinaisAposRevelar > 0, 'sinais=' + aquec.sinaisAposRevelar);
chk('e aparece na tela com altura de verdade',
    aquec.alturaVisivel > 300, 'altura=' + aquec.alturaVisivel);

/* ================================================================
   4. OS TEMPOS: antes e depois, lado a lado -- TidyCal real
   ================================================================
   A LINHA DO TEMPO E IDENTICA NOS DOIS LADOS, e e o que torna a comparacao honesta: carrega a
   pagina, dispara o gatilho (que na referencia nao faz nada), espera a MESMA pausa, clica no
   pacote. A unica diferenca entre as duas colunas e o bloco. */
console.log('\n===== 4. do clique ate o calendario: hoje contra agora =====');

async function medirTempos(rot, b, comFam, porta){
  const r = await comBlocoNaPagina({
    bloco: b, porta, permitir: REDE, corpoAntes: SONDA, corpoDepois: ENCHIMENTO,
    medir: async pg => {
      await pg.waitForTimeout(1200);
      /* O GATILHO. Com familias e o clique na familia; sem familias e o primeiro
         pointerover num cartao -- que e um movimento de mouse de verdade, e nao um evento
         sintetico (ver a armadilha 2 no cabecalho de pagina.mjs). */
      if(comFam) await pg.locator('.fca-fam').first().click({ timeout: 10000 });
      else await pg.locator('.fca-card').first().hover({ timeout: 10000 });
      await pg.waitForTimeout(PAUSA);

      await pg.evaluate(() => window.__marca('primeiro'));
      await pg.locator('.fca-card:visible').first().click({ timeout: 10000 });
      const a = await esperarCalendario(pg, 'primeiro');

      /* a troca: mesmo dominio, documento novo -- e o caminho de 787ms que o dono mediu.
         O SELETOR DO BOTAO PRECISA SER O DO PACOTE, e nao qualquer '.fca-trocar': no ramo de
         tres passos o botao "trocar familia" TAMBEM leva a classe fca-trocar (ele e
         'fca-trocar fca-trocar-fam'), vem antes no documento, e clicar nele voltaria ao passo
         1 em vez de trocar de pacote -- a medicao entao seria de outra coisa. */
      await pg.waitForTimeout(2500);
      await pg.locator((comFam ? '.fca-resumo-pac .fca-trocar' : '.fca-trocar') + ':visible')
        .first().click({ timeout: 10000 });
      await pg.evaluate(() => window.__marca('troca'));
      await pg.locator('.fca-card:visible').nth(1).click({ timeout: 10000 });
      const t = await esperarCalendario(pg, 'troca');
      return { a, t };
    }
  });
  console.log('      ' + rot.padEnd(26) +
              ' primeiro pacote=' + (r.a.load === null ? 'nao carregou' : r.a.load + 'ms') +
              (r.a.prontoAntes ? ' (ja estava pronto)' : '') +
              '   troca=' + (r.t.load === null ? 'nao carregou' : r.t.load + 'ms') +
              '   erros=' + errosDoBloco(r.erros).length);
  return r;
}

for(const [rot, comFam, novo, ref, porta] of [
  ['com familias', true, bloco.novoFam, bloco.refFam, 8852],
  ['sem familias', false, bloco.novoSem, bloco.refSem, 8856]
]){
  console.log('\n  -- vitrine ' + rot + ' --');
  const antes  = await medirTempos('HOJE   (' + REF + ')', ref, comFam, porta);
  const depois = await medirTempos('AGORA  (aquecido)', novo, comFam, porta + 2);
  chk(rot + ': as duas passagens mediram (nao e falha de rede)',
      typeof antes.a.load === 'number' && typeof depois.a.load === 'number',
      'hoje=' + antes.a.load + ' agora=' + depois.a.load);
  /* A ASSERCAO QUE JUSTIFICA A RODADA. Se ela falhar, a mudanca nao se justifica -- e o
     relatorio tem de dizer isso, em vez de entregar. */
  chk(rot + ': o PRIMEIRO pacote ficou mais rapido com o aquecimento',
      typeof antes.a.load === 'number' && typeof depois.a.load === 'number' &&
      depois.a.load < antes.a.load,
      'hoje=' + antes.a.load + 'ms  agora=' + depois.a.load + 'ms');
  /* A TROCA nao deveria mudar: ela ja era o caminho rapido, e o aquecimento nao a toca.
     Cobrar que ela nao PIOROU e o que denunciaria o aquecimento atrapalhando o caso que ja
     estava bom. A folga e larga porque este numero depende do servidor do TidyCal. */
  chk(rot + ': e a TROCA de pacote nao piorou',
      typeof antes.t.load === 'number' && typeof depois.t.load === 'number' &&
      depois.t.load <= antes.t.load + 1500,
      'hoje=' + antes.t.load + 'ms  agora=' + depois.t.load + 'ms');
  chk(rot + ': sem erro de console no bloco novo',
      errosDoBloco(depois.erros).length === 0, JSON.stringify(errosDoBloco(depois.erros).slice(0, 2)));
}

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(resumo());
