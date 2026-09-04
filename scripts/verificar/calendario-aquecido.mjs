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
     4. ele carregou COM O TAMANHO CERTO? Esta pergunta faltava na primeira
        versao deste arquivo, e o dono pagou por isso: em 04/09/2026 ele viu na
        pagina publicada o calendario abrir e "sumir e voltar com um efeito
        tipo fade". Nao eram duas cargas -- o src era atribuido uma vez e o
        elemento era o mesmo. Era o quadro aquecido dentro de um container
        display:none, ou seja, com LARGURA 0: o TidyCal se desenhava para uma
        tela de zero pixel (medido: ele anunciava 3800px de altura) e refazia o
        desenho inteiro ao ser revelado, com a animacao de entrada dele junto.
        Perguntar "carregou?" nao alcanca isso; a pergunta certa e "carregou do
        tamanho que vai ter?", e quem responde e a LARGURA durante o
        aquecimento mais a rajada de sinais depois da revelacao.

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
  + '  window.__loads=[];window.__alturas=[];window.__brutos=[];window.__srcs=[];window.__marcas={};\n'
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
  /* AS MENSAGENS CRUAS, e nao so a altura extraida delas: o que denuncia o REDESENHO nao e o
     numero, e a rajada -- e dentro dela o 'animationstart', que e a animacao de entrada do
     proprio TidyCal rodando de novo. Guardar so a altura apagaria justamente o rastro. */
  + '      window.__brutos.push({t:Date.now(),d:e.data});\n'
  + "      var h=parseInt(e.data.split(':')[1],10);\n"
  + '      if(h>0)window.__alturas.push({t:Date.now(),h:h});\n'
  + '    }\n'
  + '  },true);\n'
  + '})();</scr'+'ipt>';

const ENCHIMENTO = '<div style="height:1200px;background:#eee"></div>';

/* A PAUSA DE LEITURA, medida em vez de arbitrada. A parte 3 revela o quadro para conferir o
   que ele ja tinha pronto -- entao ela precisa dar ao aquecimento a mesma chance que a vida
   real da: os segundos em que o cliente le a lista. Esperar so o 'load' nao basta, e isso deu
   falso alarme: numa passagem o calendario ainda estava se medindo quando o teste revelou, e a
   rajada que apareceu depois era a medicao normal dele, nao um redesenho. Aqui se espera o
   SOSSEGO -- dois segundos sem um unico [iFrameSizer] --, com teto na mesma PAUSA que a parte
   4 usa. Teto atingido tambem e resposta: quer dizer que ele nao sossegou. */
async function sossegar(pg, limite){
  const fim = Date.now() + limite;
  let n = await pg.evaluate(() => window.__brutos.length), quieto = 0;
  while(Date.now() < fim){
    await pg.waitForTimeout(400);
    const m = await pg.evaluate(() => window.__brutos.length);
    if(m === n){ quieto += 400; if(quieto >= 2000) return true; }
    else { n = m; quieto = 0; }
  }
  return false;
}

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
/* Sem isto, todas as comparacoes abaixo poderiam estar medindo o mesmo bloco duas vezes.
   A REFERENCIA PODE JA AQUECER, e desde 04/09/2026 a main aquece: o que esta sob prova mudou
   de "o aquecimento existe?" para "ele aquece do TAMANHO CERTO?". Cravar aqui que a referencia
   nao aquece transformaria a chegada do aquecimento na main em falha deste arquivo -- e foi
   exatamente o que aconteceu no dia seguinte. Entao a pergunta e medida, e a parte 4 se ajusta
   ao que a medida disser. */
chk('o bloco novo tem o aquecimento', bloco.novoFam.indexOf('function aquecer(') >= 0);
const refAquece = bloco.refFam.indexOf('function aquecer(') >= 0;
const refLargura = bloco.refFam.indexOf('fca-aquec') >= 0;
console.log('a referencia "' + REF + '": ' + (refAquece ? 'JA aquece' : 'nao aquece') +
            ', e ' + (refLargura ? 'aquece com a largura real' : 'aquece com largura 0 (display:none)'));

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
    /* ESCONDIDO, MAS COM A LARGURA DE VERDADE -- as duas coisas ao mesmo tempo, que e a
       correcao de 04/09/2026. Ate entao aqui se media so "esta escondido?" (offsetParent nulo,
       ancestral display:none), e um quadro de largura 0 passava com louvor. Agora se mede o
       par: a caixa nao ocupa altura nenhuma (nao ha buraco na pagina) E o iframe tem a largura
       que vai ter depois. Largura 0 aqui e o defeito voltando. */
    r.escondido = await pg.evaluate(() => {
      const f = document.querySelector('iframe.fca-tidycal');
      if(!f) return null;
      const cal = f.parentElement, ec = getComputedStyle(cal);
      return { larg: Math.round(f.getBoundingClientRect().width),
               alt: Math.round(f.getBoundingClientRect().height),
               caixaAlt: Math.round(cal.getBoundingClientRect().height),
               caixaLarg: Math.round(cal.getBoundingClientRect().width),
               display: ec.display, opacidade: ec.opacity, toque: ec.pointerEvents,
               /* OVERFLOW E A PROVA MECANICA DE QUE A PAGINA NAO CRESCEU. Caixa de altura zero
                  que ESCONDE o que transborda nao propaga o tamanho do filho para a area
                  rolavel do documento: o iframe de 700px fica inteiro dentro dela. Sem o
                  overflow, ou com o quadro pendurado por position:absolute, nao haveria buraco
                  visivel -- mas haveria area rolavel vazia no fim da pagina, e o cliente
                  sentiria isso no dedo sem ver nada. */
               transbordo: ec.overflow };
    });
    /* CARREGOU? Tres provas independentes, e nenhuma delas e "o codigo diz que sim": sairam
       requisicoes para o dominio do calendario, o documento disparou 'load', e -- depois de
       revelado -- o quadro aquecido funciona como qualquer outro. */
    const t = await esperarCalendario(pg, 'familia');
    r.load = t.load;
    r.pedidos = pedidos;
    r.sossegou = await sossegar(pg, PAUSA);
    /* A IDENTIDADE DO NO, guardada ANTES de revelar. Re-parentear um <iframe> o recarrega do
       zero; comparar o elemento e o que prova que ninguem o moveu. */
    await pg.evaluate(() => { window.__oQuadro = document.querySelector('iframe.fca-tidycal'); });
    /* a ultima altura anunciada ENQUANTO escondido -- a que o cliente vai encontrar pronta */
    r.alturaAquecida = await pg.evaluate(() => (window.__alturas.slice(-1)[0] || {}).h || 0);
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
    /* AS MENSAGENS CRUAS DOS DOIS LADOS DO INSTANTE DA REVELACAO. Sao elas que separam
       conserto de esperanca: antes do conserto ha uma RAJADA depois de revelar (o redesenho,
       com 'animationstart' dentro); depois dele a altura ja esta estabelecida antes, e revelar
       nao produz rajada nenhuma. Ficam impressas cruas de proposito -- numero resumido esconde
       o 'animationstart', que e o nome proprio do "fade" que o dono viu. */
    r.brutosAntes = await pg.evaluate(() => window.__brutos
      .filter(x => x.t < window.__marcas.revelar).map(x => x.d));
    r.brutosDepois = await pg.evaluate(() => window.__brutos
      .filter(x => x.t >= window.__marcas.revelar)
      .map(x => ({ dt: x.t - window.__marcas.revelar, d: x.d })));
    /* Do clique ate a altura parar de mudar. Zero quer dizer "ja estava estabelecida". */
    r.ateEstabilizar = r.brutosDepois.filter(x => Number(x.d.split(':')[2]) > 0).slice(-1).map(x => x.dt)[0] || 0;
    r.recarregouLoad = await pg.evaluate(() => window.__loads.filter(x => x.t >= window.__marcas.revelar).length);
    r.mesmoElemento = await pg.evaluate(() => window.__oQuadro === document.querySelector('iframe.fca-tidycal'));
    r.alturaVisivel = await pg.evaluate(() => {
      const f = document.querySelector('iframe.fca-tidycal');
      return f ? Math.round(f.getBoundingClientRect().height) : 0;
    });
    r.larguraVisivel = await pg.evaluate(() => {
      const f = document.querySelector('iframe.fca-tidycal');
      return f ? Math.round(f.getBoundingClientRect().width) : 0;
    });
    return r;
  }
});
console.log('      iframes antes do gatilho=' + aquec.iframesAntes +
            '  depois=' + aquec.iframesApos +
            '  requisicoes ao TidyCal antes de qualquer clique em pacote=' + aquec.pedidos +
            '  load=' + aquec.load + 'ms');
console.log('      aquecendo: ' + JSON.stringify(aquec.escondido));
console.log('      altura anunciada enquanto escondido=' + aquec.alturaAquecida + 'px' +
            '   sossegou antes da revelacao=' + aquec.sossegou);
console.log('      -- [iFrameSizer] DURANTE o aquecimento (' + aquec.brutosAntes.length + ') --');
aquec.brutosAntes.slice(-8).forEach(d => console.log('         ' + d));
console.log('      -- [iFrameSizer] APOS a revelacao (' + aquec.brutosDepois.length + ') --');
if(!aquec.brutosDepois.length) console.log('         (nenhuma)');
aquec.brutosDepois.slice(0, 12).forEach(x => console.log('         +' + String(x.dt).padStart(6) + 'ms  ' + x.d));
console.log('      ao revelar: trocas de src=' + aquec.recarregou +
            '  novos load=' + aquec.recarregouLoad +
            '  mesmo elemento=' + aquec.mesmoElemento +
            '  sinais de altura=' + aquec.sinaisAposRevelar +
            '  ate estabilizar=' + aquec.ateEstabilizar + 'ms' +
            '  na tela=' + aquec.larguraVisivel + 'x' + aquec.alturaVisivel + 'px');
chk('quem NAO demonstra intencao nao baixa calendario nenhum', aquec.iframesAntes === 0,
    'iframes=' + aquec.iframesAntes);
chk('escolher a familia cria o iframe do calendario, antes de qualquer clique em pacote',
    aquec.iframesApos === 1, 'iframes=' + aquec.iframesApos);
/* ===== A CORRECAO DE 04/09/2026: aquecer COM A LARGURA REAL =====
   As tres linhas abaixo sao um par indivisivel, e e por nao terem sido pedidas juntas que o
   defeito passou: "escondido" sozinho aceitava largura 0, e largura 0 e o TidyCal se
   desenhando para uma tela que nao existe. */
chk('o quadro aquecido tem LARGURA DE VERDADE -- e nao a largura 0 de um display:none',
    !!aquec.escondido && aquec.escondido.larg > 300, JSON.stringify(aquec.escondido));
chk('e e exatamente a largura que ele vai ter na tela (nada a redesenhar ao revelar)',
    !!aquec.escondido && aquec.escondido.larg === aquec.larguraVisivel,
    'aquecendo=' + (aquec.escondido || {}).larg + ' na tela=' + aquec.larguraVisivel);
chk('mesmo assim ele nao abre buraco: a caixa do calendario nao ocupa altura nenhuma',
    !!aquec.escondido && aquec.escondido.caixaAlt === 0, JSON.stringify(aquec.escondido));
chk('e nada dele aparece: opacidade zero e fora do alcance do toque',
    !!aquec.escondido && aquec.escondido.opacidade === '0' && aquec.escondido.toque === 'none',
    JSON.stringify(aquec.escondido));
/* E O TRANSBORDO E O QUE IMPEDE A PAGINA DE CRESCER. Caixa de altura zero sem overflow
   escondido -- ou quadro pendurado por position:absolute -- nao abriria vao visivel, mas
   penduraria area rolavel vazia no fim da pagina. O cliente sente isso no dedo sem ver nada. */
chk('e o que transborda dela fica escondido: a area rolavel da pagina nao cresce',
    !!aquec.escondido && aquec.escondido.transbordo === 'hidden', JSON.stringify(aquec.escondido));
/* A ALTURA ANUNCIADA ENQUANTO ESCONDIDO E O TERMOMETRO DO DESENHO. Com largura 0 o TidyCal
   empilha tudo numa coluna e anuncia um absurdo -- medido em 04/09/2026: 3800px contra os
   1054px de verdade. Perto da altura final quer dizer que ele se desenhou para a tela certa. */
/* SE ELE NAO SOSSEGOU, as duas conferencias seguintes nao medem o que dizem medir -- elas
   mediriam a medicao normal do calendario chegando atrasada. A falha aqui e "nao mediu", e
   nao "quebrou": e a mesma leitura que as outras partes que falam com a internet ja assumem. */
chk('o quadro aquecido sossegou antes de ser revelado (senao nao ha o que comparar)',
    aquec.sossegou === true, 'sossegou=' + aquec.sossegou);
chk('e a altura que ele anuncia escondido ja e a de verdade (nao a de uma tela de 0px)',
    aquec.alturaAquecida > 0 && aquec.alturaVisivel > 0 &&
    Math.abs(aquec.alturaAquecida - aquec.alturaVisivel) < aquec.alturaVisivel * 0.25,
    'escondido=' + aquec.alturaAquecida + ' na tela=' + aquec.alturaVisivel);
chk('display:none NAO impediu o carregamento: sairam requisicoes ao dominio do calendario',
    aquec.pedidos > 0, 'requisicoes=' + aquec.pedidos);
chk('e o documento do calendario terminou de carregar, escondido',
    typeof aquec.load === 'number', 'load=' + aquec.load);
chk('escolher o pacote AQUECIDO nao recarrega o iframe (era o risco do f.src=mesmo valor)',
    aquec.recarregou === 0, 'trocas de src=' + aquec.recarregou);
/* AS DUAS OUTRAS FORMAS DE UM RECARREGAMENTO APARECER, e nenhuma delas e o src: um evento
   'load' novo, e o no do DOM ter sido trocado por outro. Re-parentear um <iframe> recarrega o
   documento do zero -- por isso revelar e SO tirar uma classe de CSS. */
chk('nem dispara um novo load -- o documento aquecido e o mesmo que o cliente ve',
    aquec.recarregouLoad === 0, 'novos load=' + aquec.recarregouLoad);
chk('e o no do DOM e o MESMO: ninguem moveu o iframe de lugar',
    aquec.mesmoElemento === true, 'mesmo elemento=' + aquec.mesmoElemento);
/* A RAJADA E O SINAL DO REDESENHO, e o 'animationstart' e o nome proprio do "fade". Medido em
   04/09/2026 contra a main: tres sinais depois de revelar (685 animationstart, 718, 1054);
   com a largura real, um so -- um ajuste de 33px que o TidyCal faz ao voltar a ser pintado. */
chk('revelar nao dispara a animacao de entrada do TidyCal de novo (era o "fade" do dono)',
    aquec.brutosDepois.every(x => x.d.indexOf('animationstart') < 0),
    JSON.stringify(aquec.brutosDepois.map(x => x.d)));
chk('e a altura ja estava estabelecida: revelar nao produz rajada de sinais',
    aquec.brutosDepois.length <= 1, JSON.stringify(aquec.brutosDepois.map(x => x.d)));
chk('e o quadro aquecido nao e um zumbi: revelado, ele anuncia altura',
    aquec.sinaisAposRevelar > 0, 'sinais=' + aquec.sinaisAposRevelar);
chk('e aparece na tela com altura de verdade',
    aquec.alturaVisivel > 300, 'altura=' + aquec.alturaVisivel);

/* ================================================================
   3b. O INTERRUPTOR DESLIGADO -- TidyCal real
   ================================================================
   O caminho de quem NAO aquece: AQUECER_CALENDARIO=false, no topo do bloco, e o que o dono
   liga e desliga sem pedir codigo novo. Ele passou a ser medido em 04/09/2026 junto com o
   conserto da largura, e por um motivo mecanico: o esconderijo do aquecimento e uma classe de
   CSS posta por aquecer() e tirada por escolher(). Com o interruptor desligado ninguem poe a
   classe -- e se algum dia alguem a puser fora de aquecer(), ou escolher() deixar de tira-la,
   o calendario ficaria com altura zero e o cliente veria uma faixa vazia no lugar dele. Nada
   quebraria, nada apareceria no console: a classe de defeito mudo que esta pasta persegue. */
console.log('\n===== 3b. com o aquecimento DESLIGADO (TidyCal real) =====');
const semAquec = bloco.novoFam.replace('var AQUECER_CALENDARIO=true;', 'var AQUECER_CALENDARIO=false;');
chk('o interruptor foi mesmo desligado no bloco desta parte',
    semAquec !== bloco.novoFam && semAquec.indexOf('var AQUECER_CALENDARIO=false;') >= 0);
const desl = await comBlocoNaPagina({
  bloco: semAquec, porta: 8853, permitir: REDE, corpoAntes: SONDA, corpoDepois: ENCHIMENTO,
  medir: async pg => {
    const r = {};
    await pg.waitForTimeout(1200);
    await pg.locator('.fca-fam').first().click({ timeout: 10000 });
    await pg.waitForTimeout(3000);
    /* NENHUM QUADRO ANTES DO CLIQUE: e o que "desligado" quer dizer. */
    r.iframesAposFamilia = await pg.evaluate(() => document.querySelectorAll('iframe.fca-tidycal').length);
    await pg.evaluate(() => window.__marca('clique'));
    await pg.locator('.fca-card:visible').first().click({ timeout: 10000 });
    await sossegar(pg, 20000);
    r.classe = await pg.evaluate(() => (document.querySelector('.fca-cal') || {}).className || '');
    r.tela = await pg.evaluate(() => {
      const f = document.querySelector('iframe.fca-tidycal');
      if(!f) return null;
      const c = f.parentElement.getBoundingClientRect();
      return { larg: Math.round(f.getBoundingClientRect().width),
               alt: Math.round(f.getBoundingClientRect().height),
               caixaAlt: Math.round(c.height) };
    });
    return r;
  }
});
console.log('      iframes apos escolher a familia=' + desl.iframesAposFamilia +
            '   classe da caixa depois do clique="' + desl.classe + '"' +
            '   na tela=' + JSON.stringify(desl.tela));
chk('desligado: escolher a familia NAO cria calendario nenhum',
    desl.iframesAposFamilia === 0, 'iframes=' + desl.iframesAposFamilia);
chk('desligado: a caixa do calendario nao fica com a classe do aquecimento',
    desl.classe.indexOf('fca-aquec') < 0, 'classe="' + desl.classe + '"');
chk('desligado: clicar no pacote mostra o calendario com largura e altura de verdade',
    !!desl.tela && desl.tela.larg > 300 && desl.tela.alt > 300 && desl.tela.caixaAlt > 300,
    JSON.stringify(desl.tela));
chk('desligado: sem erro de console',
    errosDoBloco(desl.erros).length === 0, JSON.stringify(errosDoBloco(desl.erros).slice(0, 2)));

/* ================================================================
   4. OS TEMPOS: antes e depois, lado a lado -- TidyCal real
   ================================================================
   A LINHA DO TEMPO E IDENTICA NOS DOIS LADOS, e e o que torna a comparacao honesta: carrega a
   pagina, dispara o gatilho (que na referencia nao faz nada), espera a MESMA pausa, clica no
   pacote. A unica diferenca entre as duas colunas e o bloco. */
console.log('\n===== 4. do clique ate o calendario: hoje contra agora =====');

async function medirTempos(rot, b, comFam, porta){
  const r2 = {};
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
      /* A LARGURA DO QUADRO AQUECIDO, medida no instante ANTERIOR ao clique -- e o numero que
         separa "baixou" de "baixou do tamanho certo". -1 quer dizer que nao ha quadro nenhum
         (referencia sem aquecimento); 0 e o defeito de 04/09/2026. */
      r2.larguraAquec = await pg.evaluate(() => {
        const f = document.querySelector('iframe.fca-tidycal');
        return f ? Math.round(f.getBoundingClientRect().width) : -1;
      });
      await pg.locator('.fca-card:visible').first().click({ timeout: 10000 });
      const a = await esperarCalendario(pg, 'primeiro');

      /* A RAJADA DA REVELACAO, crua. Ela e o sinal medivel do REDESENHO: quando o TidyCal
         descobre uma largura que nao e a que ele usou para se desenhar, ele refaz o layout e
         anuncia altura de novo -- com 'animationstart' junto, que e a animacao de entrada
         dele, o "fade" que o dono descreveu. Os 2500ms de espera abaixo servem as duas coisas
         (deixar a rajada chegar, e dar folga antes de trocar de pacote). */
      await pg.waitForTimeout(2500);
      r2.rajada = await pg.evaluate(() => window.__brutos
        .filter(x => x.t >= window.__marcas.primeiro)
        .map(x => ({ dt: x.t - window.__marcas.primeiro, d: x.d })));

      /* a troca: mesmo dominio, documento novo -- e o caminho de 787ms que o dono mediu.
         O SELETOR DO BOTAO PRECISA SER O DO PACOTE, e nao qualquer '.fca-trocar': no ramo de
         tres passos o botao "trocar familia" TAMBEM leva a classe fca-trocar (ele e
         'fca-trocar fca-trocar-fam'), vem antes no documento, e clicar nele voltaria ao passo
         1 em vez de trocar de pacote -- a medicao entao seria de outra coisa. */
      await pg.locator((comFam ? '.fca-resumo-pac .fca-trocar' : '.fca-trocar') + ':visible')
        .first().click({ timeout: 10000 });
      await pg.evaluate(() => window.__marca('troca'));
      await pg.locator('.fca-card:visible').nth(1).click({ timeout: 10000 });
      const t = await esperarCalendario(pg, 'troca');
      return { a, t, larguraAquec: r2.larguraAquec, rajada: r2.rajada };
    }
  });
  console.log('      ' + rot.padEnd(26) +
              ' primeiro pacote=' + (r.a.load === null ? 'nao carregou' : r.a.load + 'ms') +
              (r.a.prontoAntes ? ' (ja estava pronto)' : '') +
              '   troca=' + (r.t.load === null ? 'nao carregou' : r.t.load + 'ms') +
              '   erros=' + errosDoBloco(r.erros).length);
  console.log('        largura do quadro durante o aquecimento=' +
              (r.larguraAquec < 0 ? 'nao havia quadro' : r.larguraAquec + 'px') +
              '   sinais depois de escolher o pacote=' + (r.rajada || []).length);
  (r.rajada || []).forEach(x => console.log('          +' + String(x.dt).padStart(6) + 'ms  ' + x.d));
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
  /* A ASSERCAO QUE JUSTIFICA A RODADA -- e ela MUDA conforme a referencia.
     Contra uma referencia SEM aquecimento, o que se cobra e o tempo: o primeiro pacote tem de
     ficar mais rapido, senao a mudanca nao se justifica.
     Contra uma referencia que JA aquece (a main desde 04/09/2026), os dois lados chegam em
     0ms -- o quadro ja esta pronto nos dois -- e cobrar "mais rapido" seria cobrar o
     impossivel. O que esta sob prova ali e o TAMANHO, e as duas linhas seguintes sao a
     medicao dele: a largura durante o aquecimento e a rajada depois da revelacao. */
  if(refAquece){
    chk(rot + ': o primeiro pacote nao ficou mais lento',
        typeof antes.a.load === 'number' && typeof depois.a.load === 'number' &&
        depois.a.load <= antes.a.load + 500,
        'hoje=' + antes.a.load + 'ms  agora=' + depois.a.load + 'ms');
  }else{
    chk(rot + ': o PRIMEIRO pacote ficou mais rapido com o aquecimento',
        typeof antes.a.load === 'number' && typeof depois.a.load === 'number' &&
        depois.a.load < antes.a.load,
        'hoje=' + antes.a.load + 'ms  agora=' + depois.a.load + 'ms');
  }
  /* A LARGURA E A RAJADA, lado a lado. Sao elas que dizem se o conserto de 04/09/2026
     consertou: largura 0 durante o aquecimento e o defeito; rajada com 'animationstart'
     depois da revelacao e o redesenho que o dono via como "fade". */
  chk(rot + ': o quadro aquecido tem largura de verdade (a referencia tinha ' +
      (antes.larguraAquec < 0 ? 'nenhum quadro' : antes.larguraAquec + 'px') + ')',
      depois.larguraAquec > 300, 'agora=' + depois.larguraAquec + 'px');
  chk(rot + ': escolher o pacote aquecido nao dispara a animacao de entrada do TidyCal',
      (depois.rajada || []).every(x => x.d.indexOf('animationstart') < 0),
      JSON.stringify((depois.rajada || []).map(x => x.d)));
  chk(rot + ': e produz menos sinais de altura que a referencia (menos redesenho)',
      (depois.rajada || []).length <= (antes.rajada || []).length,
      'hoje=' + (antes.rajada || []).length + '  agora=' + (depois.rajada || []).length);
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
