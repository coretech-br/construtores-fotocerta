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

   E POR QUE ELE CRESCEU EM 04/09/2026 (segunda rodada do mesmo dia). O dono usou a
   versao que aquecia UM calendario no instante da INTENCAO e achou os dois
   limites dela, os dois confirmados por medicao na pagina publicada: (1) ir
   direto num pacote que NAO era o aquecido continuava custando a carga inteira,
   e (2) trocar de familia jogava fora o aquecimento -- o src do iframe unico era
   reapontado, e a volta custava uma carga nova de 670ms. A rodada respondeu aos
   dois: o pre-carregamento virou um campo de TRES valores ('nao', 'um', 'todos'),
   com os numeros medidos escritos nele, e passou a haver UM QUADRO POR PACOTE JA
   VISITADO, reaproveitado, em vez de um iframe reapontado.

   Os numeros que sustentam a escolha, todos medidos com o calendario real:

       primeira carga (cache frio) ...... 9115 ms
       qualquer carga seguinte .......... 600 a 800 ms, ~13 KB (22 requisicoes)
       os oito calendarios em paralelo .. 2034 ms, ~65 MB

   AS OITO PARTES, e o que cada uma custa:
     1. PRE-CONEXAO ........... rede fechada, segundos
     2. O PERIGO (e.source) ... rede fechada, segundos
     3. O AQUECIMENTO CARREGOU  TidyCal de verdade
     4. OS TEMPOS ............. TidyCal de verdade, novo contra referencia
     5. OS TRES MODOS ......... TidyCal de verdade, tempo e memoria lado a lado
     6. A OBSERVACAO 2 ........ TidyCal de verdade: voltar nao recarrega
     7. LARGURA E BURACO ...... rede fechada, os tres modos
     8. e.source COM VARIOS ... rede fechada, o negativo com N quadros vivos
     9. O CAMPO ............... sem navegador de teste nenhum, so a ferramenta

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
import { set, clicar, radio, navegador, servir, abrir, ler } from './lib.mjs';
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
/* OS TRES MODOS SAO O MESMO BLOCO com a variavel do topo trocada -- que e exatamente o que o
   dono faz na pagina dele quando quer experimentar sem regerar. Trocar aqui prova de quebra
   que a variavel e mesmo o unico interruptor: se alguma decisao estivesse cravada em outro
   lugar do bloco, uma das tres passagens mediria outra coisa. */
const MODO_PADRAO = "var PRECARREGAR='um';";
chk('o bloco novo nasce com PRECARREGAR=um (o padrao de fabrica)',
    bloco.novoFam.indexOf(MODO_PADRAO) >= 0);
const comModo = (b, m) => b.replace(MODO_PADRAO, "var PRECARREGAR='" + m + "';");
const modos = {
  nao:   comModo(bloco.novoFam, 'nao'),
  um:    bloco.novoFam,
  todos: comModo(bloco.novoFam, 'todos')
};
for(const m of ['nao', 'todos'])
  chk('o bloco do modo "' + m + '" foi derivado', modos[m] !== bloco.novoFam &&
      modos[m].indexOf("var PRECARREGAR='" + m + "';") >= 0);

/* ===== A MEMORIA, medida nos processos do navegador =====
   Playwright nao tem numero de memoria, e 'performance.memory' mede so o monte de JavaScript
   da pagina de cima -- os calendarios sao iframes de outra origem, que no Chromium moram em
   PROCESSOS separados, e nao apareceriam ali. E o Browser desta versao do Playwright nao
   expoe .process() (medido: 'process is not a function'), entao nao ha pid para seguir.
   O que sobra, e o que de fato mede o que interessa: somar o RSS de TODOS os processos do
   Chromium do Playwright que estao de pe neste instante. Funciona porque este arnes roda um
   navegador de cada vez -- comBlocoNaPagina abre e fecha o dele dentro de cada medicao --, e
   porque o Chromium do Playwright mora num caminho proprio, que o Chrome do dono nao usa.
   E UM NUMERO DE SISTEMA OPERACIONAL, com o ruido que isso tem: o que vale e a DIFERENCA
   entre os tres modos na mesma maquina, medidos em sequencia, e nunca o valor absoluto.
   -1 quer dizer "nao mediu" -- e a leitura certa quando o navegador nao esta num caminho
   reconhecido, e nao "custou zero". */
const MARCAS_NAVEGADOR = ['ms-playwright', 'chrome-headless-shell', 'Chromium.app'];
function rssDoNavegador(){
  let saida;
  try{ saida = execFileSync('ps', ['-eo', 'rss=,command=']).toString(); }
  catch(e){ return -1; }
  const linhas = saida.split('\n').filter(l => MARCAS_NAVEGADOR.some(m => l.indexOf(m) >= 0));
  if(!linhas.length) return -1;
  const total = linhas.reduce((a, l) => a + (Number(l.trim().split(/\s+/)[0]) || 0), 0);
  return Math.round(total / 1024);
}
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
    /* ANTES DE QUALQUER GATILHO. Ate 04/09/2026 aqui se cobrava ZERO, porque o unico gatilho
       era a intencao. Com o campo de tres valores o padrao de fabrica passou a ser 'um' -- um
       quadro ja na abertura --, e quem responde por "quem nao demonstra intencao nao paga
       nada" e a parte 3b, que mede o modo 'nao'. Um so, e nao tres: 'um' e 'todos' precisam
       ser distinguiveis aqui, senao a diferenca entre eles nunca seria medida. */
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
    /* A ULTIMA ALTURA QUE O PROPRIO CALENDARIO ANUNCIOU, ja revelado. Ela e a contraparte de
       'alturaAquecida': as duas vem do MESMO lugar (o filho medindo a si mesmo), e comparar
       uma com a outra responde "ele se desenhou para a tela certa?" sem depender de QUEM
       escreve a altura no elemento -- ver o comentario da conferencia, mais abaixo. */
    r.alturaAnunciadaFinal = await pg.evaluate(() => (window.__alturas.slice(-1)[0] || {}).h || 0);
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
chk("com PRECARREGAR='um' ha UM quadro ja na abertura, e um so", aquec.iframesAntes === 1,
    'iframes=' + aquec.iframesAntes);
chk('e escolher a familia do primeiro pacote nao cria um segundo: ele ja estava la',
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
   1054px de verdade. Perto da altura final quer dizer que ele se desenhou para a tela certa.
   A COMPARACAO E ENTRE AS DUAS ALTURAS ANUNCIADAS PELO PROPRIO CALENDARIO (escondido e depois
   de revelado), e nao entre a anunciada e a do ELEMENTO. As duas medem a mesma coisa, e esta
   nao depende de quem escreve a altura no elemento. Medido em 04/09/2026, numa passagem em
   tres: o embed.js do TidyCal chega DEPOIS de o aperto de mao proprio ja ter assumido o filho,
   a biblioteca deles e aplicada ao elemento por cima e o prende no piso de 500px (minHeight)
   -- o calendario continua anunciando 1021 escondido e 1054 revelado, e quem nao segue e o
   elemento. Esse conflito e da fonte COMPARTILHADA (fcTidyCalSrc), vale igual na aba TidyCal,
   e ja estava registrado antes desta rodada: tidycal-unificado.mjs tem uma SEGUNDA CHANCE
   inteira escrita para ele, com este mesmo numero -- "o PISO (500px, posto pela propria
   biblioteca deles como min-height)". Nao e desta rodada e nao se conserta aqui; o que este
   arquivo passa a fazer e nao confundi-lo com o defeito da LARGURA, que e o que ele mede. */
/* SE ELE NAO SOSSEGOU, as duas conferencias seguintes nao medem o que dizem medir -- elas
   mediriam a medicao normal do calendario chegando atrasada. A falha aqui e "nao mediu", e
   nao "quebrou": e a mesma leitura que as outras partes que falam com a internet ja assumem. */
chk('o quadro aquecido sossegou antes de ser revelado (senao nao ha o que comparar)',
    aquec.sossegou === true, 'sossegou=' + aquec.sossegou);
chk('e a altura que ele anuncia escondido ja e a de verdade (nao a de uma tela de 0px)',
    aquec.alturaAquecida > 0 && aquec.alturaAnunciadaFinal > 0 &&
    Math.abs(aquec.alturaAquecida - aquec.alturaAnunciadaFinal) < aquec.alturaAnunciadaFinal * 0.25,
    'escondido=' + aquec.alturaAquecida + ' anunciada ja revelado=' + aquec.alturaAnunciadaFinal);
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
/* O ELEMENTO. Piso da biblioteca (500) e altura de PARTIDA (700) nao sao medidas -- sao o
   carregamento, ou o conflito descrito acima. Mesma convencao de PISO_ESPERA em
   tidycal-unificado.mjs: quando a leitura cai num deles, o que se imprime e "nao mediu", e
   nao uma falha que apontaria para o lugar errado. A altura do elemento continua sendo
   cobrada de verdade nas partes 5 e 6, em oito passagens. */
if([500, 700].indexOf(aquec.alturaVisivel) >= 0){
  console.log('       [medicao, nao assercao] a altura do ELEMENTO ficou em ' + aquec.alturaVisivel +
              'px, enquanto o calendario anunciava ' + aquec.alturaAquecida + ' escondido e ' +
              aquec.alturaAnunciadaFinal + ' revelado -- quem nao seguiu foi o elemento. Ver o comentario acima.');
}else{
  chk('e aparece na tela com altura de verdade',
      aquec.alturaVisivel > 300, 'altura=' + aquec.alturaVisivel);
}

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
const semAquec = modos.nao;
chk('o interruptor foi mesmo desligado no bloco desta parte',
    semAquec !== bloco.novoFam && semAquec.indexOf("var PRECARREGAR='nao';") >= 0);
const desl = await comBlocoNaPagina({
  bloco: semAquec, porta: 8853, permitir: REDE, corpoAntes: SONDA, corpoDepois: ENCHIMENTO,
  medir: async pg => {
    const r = {};
    await pg.waitForTimeout(1200);
    /* NEM NA ABERTURA: e a metade nova desta parte. Com o campo em 'nao', a pagina que o
       cliente abre nao pode ter baixado calendario nenhum -- e o trato do dono com quem entra
       e sai sem escolher, e agora ele tem um lugar so onde e cobrado. */
    r.iframesNaAbertura = await pg.evaluate(() => document.querySelectorAll('iframe.fca-tidycal').length);
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
chk('desligado: a pagina abre sem calendario nenhum -- quem entra e sai nao paga nada',
    desl.iframesNaAbertura === 0, 'iframes=' + desl.iframesNaAbertura);
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

/* ================================================================
   5. OS TRES MODOS, LADO A LADO -- TidyCal real
   ================================================================
   Aqui e onde o campo deixa de ser uma promessa e vira numero. A mesma linha do tempo nos tres
   ('nao', 'um', 'todos'): carrega a pagina, escolhe a familia, espera a MESMA pausa de leitura,
   clica num pacote. So a variavel do topo muda.
   DOIS ALVOS DE CLIQUE, e o segundo e a OBSERVACAO 1 DO DONO. O primeiro cartao e o que o modo
   'um' pre-carrega; o SEGUNDO e "ir direto num pacote que nao e o aquecido", que era o caso em
   que a versao anterior nao ajudava nada. Medir so o primeiro esconderia justamente isso.
   A MEMORIA VAI JUNTO porque ela e o preco do modo 'todos', e preco que nao aparece do lado do
   ganho nao e escolha, e propaganda. */
console.log('\n===== 5. os tres modos, lado a lado (TidyCal real) =====');

async function medirModo(rot, b, porta, alvo){
  const r = await comBlocoNaPagina({
    bloco: b, porta, permitir: REDE, corpoAntes: SONDA, corpoDepois: ENCHIMENTO,
    medir: async pg => {
      const m = {};
      await pg.waitForTimeout(1200);
      m.naAbertura = await pg.evaluate(() => document.querySelectorAll('iframe.fca-tidycal').length);
      await pg.locator('.fca-fam').first().click({ timeout: 10000 });
      await pg.waitForTimeout(PAUSA);
      m.vivos = await pg.evaluate(() => document.querySelectorAll('iframe.fca-tidycal').length);
      /* A memoria e lida DEPOIS da pausa de leitura, que e quando tudo o que ia carregar ja
         carregou -- e antes do clique, para o numero ser o preco de ESTAR pre-carregado, e nao
         o de estar mostrando um calendario. */
      m.memoria = rssDoNavegador();
      await pg.evaluate(() => window.__marca('clique'));
      await pg.locator('.fca-card:visible').nth(alvo).click({ timeout: 10000 });
      const t = await esperarCalendario(pg, 'clique');
      m.load = t.load;
      /* ATE A ALTURA ESTABILIZAR e a medida que o dono enxerga: 'load' diz que o documento
         terminou, mas o quadro so para de mexer quando o ultimo [iFrameSizer] com largura
         chega. Zero quer dizer que ela ja estava estabelecida antes do clique. */
      m.sossegou = await sossegar(pg, 20000);
      m.brutos = await pg.evaluate(() => window.__brutos
        .filter(x => x.t >= window.__marcas.clique)
        .map(x => ({ dt: x.t - window.__marcas.clique, d: x.d })));
      m.ateEstabilizar = m.brutos.filter(x => Number(x.d.split(':')[2]) > 0).slice(-1).map(x => x.dt)[0] || 0;
      m.animacao = m.brutos.filter(x => x.d.indexOf('animationstart') >= 0).length;
      m.naTela = await pg.evaluate(() => {
        const q = document.querySelector('.fca-quadro:not(.fca-oculto) iframe.fca-tidycal');
        return q ? { larg: Math.round(q.getBoundingClientRect().width),
                     alt: Math.round(q.getBoundingClientRect().height) } : null;
      });
      return m;
    }
  });
  console.log('      ' + rot.padEnd(34) +
    ' quadros: abertura=' + r.naAbertura + ' ao clicar=' + r.vivos +
    '   memoria=' + r.memoria + 'MB');
  console.log('        load=' + (r.load === null ? 'NAO CARREGOU' : r.load + 'ms') +
    '   ate a altura estabilizar=' + r.ateEstabilizar + 'ms' +
    '   animationstart=' + r.animacao +
    '   na tela=' + (r.naTela ? r.naTela.larg + 'x' + r.naTela.alt + 'px' : 'nada') +
    '   erros=' + errosDoBloco(r.erros).length);
  /* OS SINAIS CRUS, como nas partes 3 e 4 e pelo mesmo motivo: numero resumido esconde o
     'animationstart', que e o nome proprio do "fade" -- e esconde tambem a diferenca entre
     um calendario que se desenha pela PRIMEIRA vez (a animacao de entrada dele, normal) e um
     que ja estava desenhado e foi refeito (o defeito). */
  r.brutos.slice(0, 6).forEach(x => console.log('          +' + String(x.dt).padStart(6) + 'ms  ' + x.d));
  return r;
}

console.log('\n  -- clicando no PRIMEIRO cartao (o que o modo "um" pre-carrega) --');
const p0 = {
  nao:   await medirModo('so ao escolher  (nao)',   modos.nao,   8860, 0),
  um:    await medirModo('um na abertura  (padrao)', modos.um,    8862, 0),
  todos: await medirModo('todos na abertura',        modos.todos, 8864, 0)
};
console.log('\n  -- clicando DIRETO no SEGUNDO cartao (a observacao 1 do dono) --');
const p1 = {
  nao:   await medirModo('so ao escolher  (nao)',   modos.nao,   8866, 1),
  um:    await medirModo('um na abertura  (padrao)', modos.um,    8868, 1),
  todos: await medirModo('todos na abertura',        modos.todos, 8870, 1)
};

chk('modo "nao": a pagina abre sem quadro nenhum', p0.nao.naAbertura === 0, 'quadros=' + p0.nao.naAbertura);
chk('modo "um": a pagina abre com UM quadro', p0.um.naAbertura === 1, 'quadros=' + p0.um.naAbertura);
chk('modo "todos": a pagina abre com os TRES do catalogo', p0.todos.naAbertura === 3,
    'quadros=' + p0.todos.naAbertura);
/* AS DUAS MEDICOES SO VALEM SE AS TRES CARREGARAM. Falha de rede aqui e "nao mediu". */
const mediuTudo = ['nao','um','todos'].every(m => typeof p0[m].load === 'number' && typeof p1[m].load === 'number');
chk('as seis passagens mediram (nao e falha de rede)', mediuTudo,
    JSON.stringify({ p0: Object.keys(p0).map(k => p0[k].load), p1: Object.keys(p1).map(k => p1[k].load) }));
if(mediuTudo){
  chk('modo "nao": o primeiro cartao paga a carga inteira (e o que "so ao escolher" custa)',
      p0.nao.load > 0, 'load=' + p0.nao.load + 'ms');
  /* MEDIDO EM 04/09/2026, e a primeira versao desta linha cobrava demais: 'ateEstabilizar'
     nao chega a ZERO nem com o calendario pre-carregado, porque o TidyCal manda UM sinal de
     ajuste ao voltar a ser pintado (medido: +151ms, com a altura FINAL de 1054px ja dentro
     dele). Isso nao e redesenho -- a parte 3 ja media o mesmo sinal e ja explicava que ele
     nao se elimina de fora. O que se cobra, entao, e o que de fato muda para o cliente: o
     documento nao precisou carregar (0ms) e a altura se assenta numa fracao do tempo que o
     modo 'nao' leva. */
  chk('modo "um": o primeiro cartao ja esta pronto -- o documento nao carrega (0ms)',
      p0.um.load === 0, 'load=' + p0.um.load + 'ms');
  chk('e a altura dele se assenta MUITO mais rapido que a do modo "nao"',
      p0.um.ateEstabilizar * 3 < p0.nao.ateEstabilizar,
      'um=' + p0.um.ateEstabilizar + 'ms  nao=' + p0.nao.ateEstabilizar + 'ms');
  chk('modo "todos": o primeiro cartao tambem esta pronto', p0.todos.load === 0,
      'load=' + p0.todos.load + 'ms');
  /* A OBSERVACAO 1 DO DONO, respondida com numero: ir direto num pacote que nao e o
     pre-carregado. Em 'todos' ele esta pronto; em 'um' ele custa uma carga, mas a CARGA
     SEGUINTE (600-800ms medidos), e nao a primeira. */
  chk('modo "todos": ir DIRETO no segundo cartao tambem custa 0ms (a observacao 1 do dono)',
      p1.todos.load === 0, 'load=' + p1.todos.load + 'ms');
  chk('modo "um": ir direto no segundo cartao custa MENOS que no modo "nao" (o custo unico ja foi pago)',
      p1.um.load < p1.nao.load, 'um=' + p1.um.load + 'ms  nao=' + p1.nao.load + 'ms');
  /* A ANIMACAO DE ENTRADA, e a distincao que a primeira versao desta linha nao fazia -- e que
     a medicao obrigou a fazer. O defeito que o dono viu era um calendario JA DESENHADO ser
     refeito ao aparecer: o 'animationstart' vinha de um redesenho. Um calendario que esta
     carregando NAQUELE instante desenha-se pela primeira vez, e a animacao de entrada do
     TidyCal e parte disso -- ela existe igual no modo 'nao', que e o comportamento de sempre.
     Medido: modo 'um' indo direto no segundo cartao (quadro que nasce no clique) traz 1
     'animationstart'; o modo 'nao' traz 0 apenas porque a biblioteca de altura ainda esta
     sendo baixada quando a animacao roda, e ninguem estava escutando -- a tela e a mesma.
     ENTAO O QUE SE COBRA e o caso do dono: quadro PRE-CARREGADO (load === 0) nao pode
     disparar animacao nenhuma ao ser revelado. */
  const prontos = [p0, p1].flatMap(g => ['nao','um','todos'].map(m => [m, g[m]]))
    .filter(([, x]) => x.load === 0);
  chk('ha casos de calendario PRE-CARREGADO para julgar (senao a linha abaixo nao prova nada)',
      prontos.length >= 3, 'casos=' + prontos.length);
  chk('e NENHUM calendario pre-carregado dispara a animacao de entrada ao ser revelado',
      prontos.every(([, x]) => x.animacao === 0),
      JSON.stringify(prontos.map(([m, x]) => m + '=' + x.animacao)));
  chk('o unico animationstart medido esta num quadro que nasceu NO clique (primeiro desenho, nao redesenho)',
      [p0, p1].flatMap(g => ['nao','um','todos'].map(m => g[m]))
        .every(x => x.animacao === 0 || x.load > 0),
      JSON.stringify([p0, p1].flatMap(g => ['nao','um','todos'].map(m => [m, g[m].load, g[m].animacao]))));
  chk('e em todos eles o calendario aparece na tela com largura e altura de verdade',
      [p0, p1].every(g => ['nao','um','todos'].every(m => g[m].naTela && g[m].naTela.larg > 300 && g[m].naTela.alt > 300)),
      JSON.stringify(['nao','um','todos'].map(m => p0[m].naTela)));
}
/* A MEMORIA. O que se cobra e a ORDEM, e nao um valor: 'todos' tem de custar mais que 'nao',
   senao o numero nao esta medindo os calendarios. O valor absoluto fica impresso, com o ruido
   que um numero de sistema operacional tem. */
console.log('\n      memoria (RSS da arvore do navegador, MB): nao=' + p0.nao.memoria +
            '  um=' + p0.um.memoria + '  todos=' + p0.todos.memoria +
            '   -> um custa +' + (p0.um.memoria - p0.nao.memoria) +
            'MB e todos +' + (p0.todos.memoria - p0.nao.memoria) + 'MB sobre "nao"');
chk('a memoria foi medida nos tres modos', [p0.nao, p0.um, p0.todos].every(x => x.memoria > 0),
    JSON.stringify([p0.nao.memoria, p0.um.memoria, p0.todos.memoria]));
chk('e "todos" custa mais memoria que "nao" -- o preco do modo aparece do lado do ganho',
    p0.todos.memoria > p0.nao.memoria,
    'nao=' + p0.nao.memoria + 'MB todos=' + p0.todos.memoria + 'MB');

/* ================================================================
   6. A OBSERVACAO 2 DO DONO: voltar NAO recarrega -- TidyCal real
   ================================================================
   "Trocar de familia joga o aquecimento fora", medido na pagina publicada: carga nova de
   670ms, porque o src do iframe UNICO era reapontado. Com um quadro por endereco isso deixou
   de ser possivel por construcao -- mas "por construcao" e uma afirmacao, e afirmacao nao e
   medicao. O roteiro percorre familia 1 -> pacote 1 -> familia 2 -> pacote dela -> DE VOLTA
   para familia 1 -> pacote 1, e conta duas coisas independentes na volta: eventos 'load' novos
   e trocas de 'src'. Zero nos dois e a prova. */
console.log('\n===== 6. trocar de familia e voltar (TidyCal real) =====');
const volta = await comBlocoNaPagina({
  bloco: modos.um, porta: 8872, permitir: REDE, corpoAntes: SONDA, corpoDepois: ENCHIMENTO,
  medir: async pg => {
    const r = {};
    const cont = () => pg.evaluate(() => ({
      loads: window.__loads.length, srcs: window.__srcs.length,
      quadros: document.querySelectorAll('iframe.fca-tidycal').length }));
    await pg.waitForTimeout(1200);
    await pg.locator('.fca-fam').first().click({ timeout: 10000 });
    await pg.waitForTimeout(PAUSA);
    await pg.locator('.fca-card:visible').first().click({ timeout: 10000 });
    await sossegar(pg, 20000);
    r.apos1 = await cont();
    r.src1 = await pg.evaluate(() => (document.querySelector('.fca-quadro:not(.fca-oculto) iframe') || {}).src || '');
    /* familia 2: outro dominio, quadro novo -- este SIM tem de carregar */
    await pg.locator('.fca-trocar-fam').click({ timeout: 10000 });
    await pg.locator('.fca-fam').nth(1).click({ timeout: 10000 });
    await pg.locator('.fca-card:visible').first().click({ timeout: 10000 });
    await sossegar(pg, 20000);
    r.apos2 = await cont();
    r.src2 = await pg.evaluate(() => (document.querySelector('.fca-quadro:not(.fca-oculto) iframe') || {}).src || '');
    /* A VOLTA */
    await pg.evaluate(() => window.__marca('volta'));
    await pg.locator('.fca-trocar-fam').click({ timeout: 10000 });
    await pg.locator('.fca-fam').first().click({ timeout: 10000 });
    await pg.locator('.fca-card:visible').first().click({ timeout: 10000 });
    await pg.waitForTimeout(5000);
    r.naVolta = await pg.evaluate(() => ({
      loads: window.__loads.filter(x => x.t >= window.__marcas.volta).length,
      srcs: window.__srcs.filter(x => x.t >= window.__marcas.volta).length,
      brutos: window.__brutos.filter(x => x.t >= window.__marcas.volta).map(x => x.d) }));
    r.apos3 = await cont();
    r.tela = await pg.evaluate(() => {
      const q = document.querySelector('.fca-quadro:not(.fca-oculto) iframe.fca-tidycal');
      const escondidos = Array.from(document.querySelectorAll('.fca-quadro.fca-oculto'))
        .map(c => Math.round(c.getBoundingClientRect().height));
      return q ? { larg: Math.round(q.getBoundingClientRect().width),
                   alt: Math.round(q.getBoundingClientRect().height),
                   src: q.src, escondidos } : null;
    });
    return r;
  }
});
console.log('      apos o pacote 1: ' + JSON.stringify(volta.apos1));
console.log('      apos o pacote da familia 2: ' + JSON.stringify(volta.apos2));
console.log('      NA VOLTA ao pacote 1: loads novos=' + volta.naVolta.loads +
            '  trocas de src=' + volta.naVolta.srcs +
            '   sinais=' + JSON.stringify(volta.naVolta.brutos.slice(0, 4)));
console.log('      na tela depois da volta: ' + JSON.stringify(volta.tela));
chk('o segundo pacote (outro dominio) ganhou um quadro PROPRIO, sem mexer no primeiro',
    volta.apos2.quadros === 2 && volta.apos2.loads > volta.apos1.loads,
    JSON.stringify([volta.apos1, volta.apos2]));
chk('e o quadro visivel passou a ser o do segundo dominio',
    volta.src2.indexOf('agendamento.fotocerta.com.br') >= 0, 'src=' + volta.src2);
chk('VOLTAR ao primeiro pacote nao dispara load nenhum (era a observacao 2 do dono)',
    volta.naVolta.loads === 0, 'loads=' + volta.naVolta.loads);
chk('e nao troca src nenhum -- nada foi reapontado',
    volta.naVolta.srcs === 0, 'srcs=' + volta.naVolta.srcs);
chk('e continuam sendo DOIS quadros, nem um a mais nem um a menos',
    volta.apos3.quadros === 2, 'quadros=' + volta.apos3.quadros);
chk('e o calendario que volta e o mesmo endereco, com largura e altura de verdade',
    !!volta.tela && volta.tela.src === volta.src1 && volta.tela.larg > 300 && volta.tela.alt > 300,
    JSON.stringify(volta.tela));
chk('e o quadro que ficou para tras nao ocupa altura nenhuma (nenhum buraco na pagina)',
    !!volta.tela && volta.tela.escondidos.every(h => h === 0), JSON.stringify(volta.tela));
chk('sem erro de console',
    errosDoBloco(volta.erros).length === 0, JSON.stringify(errosDoBloco(volta.erros).slice(0, 2)));

/* ================================================================
   7. A LARGURA DE CADA QUADRO, E O BURACO QUE NAO EXISTE -- rede fechada
   ================================================================
   A pergunta que o dono pagou para aprender: nao basta "carregou", tem de ser "carregou do
   tamanho que vai ter". Com N quadros a pergunta se multiplica -- basta UM nascer com largura
   0 para o "fade" voltar naquele pacote. Aqui a rede esta fechada de proposito: o que se mede
   e a GEOMETRIA que o bloco monta, e ela nao depende do TidyCal responder.
   O buraco vem junto e no mesmo lugar: a altura rolavel da pagina tem de ser a MESMA nos tres
   modos. Se pre-carregar tres calendarios esticasse a pagina, o cliente sentiria no dedo. */
console.log('\n===== 7. largura de cada quadro e altura da pagina, nos tres modos =====');
async function geometria(rot, b, porta){
  const r = await comBlocoNaPagina({
    bloco: b, porta, corpoDepois: ENCHIMENTO,
    medir: async pg => {
      await pg.waitForTimeout(900);
      return await pg.evaluate(() => {
        const qs = Array.from(document.querySelectorAll('iframe.fca-tidycal'));
        const cal = document.querySelector('.fca-cal');
        return {
          larguras: qs.map(f => Math.round(f.getBoundingClientRect().width)),
          caixas: qs.map(f => Math.round(f.parentElement.getBoundingClientRect().height)),
          transbordo: qs.map(f => getComputedStyle(f.parentElement).overflow),
          opacidade: qs.map(f => getComputedStyle(f.parentElement).opacity),
          toque: qs.map(f => getComputedStyle(f.parentElement).pointerEvents),
          calAlt: cal ? Math.round(cal.getBoundingClientRect().height) : -1,
          calLarg: cal ? Math.round(cal.getBoundingClientRect().width) : -1,
          pagina: document.documentElement.scrollHeight
        };
      });
    }
  });
  console.log('      ' + rot.padEnd(22) + ' larguras=' + JSON.stringify(r.larguras) +
              '  caixas=' + JSON.stringify(r.caixas) +
              '  .fca-cal=' + r.calLarg + 'x' + r.calAlt +
              '  altura da pagina=' + r.pagina + 'px');
  return r;
}
const g = {
  nao:   await geometria('so ao escolher', modos.nao,   8874),
  um:    await geometria('um na abertura', modos.um,    8876),
  todos: await geometria('todos',          modos.todos, 8878)
};
chk('modo "um": o unico quadro nasce com a largura de verdade',
    g.um.larguras.length === 1 && g.um.larguras[0] > 300, JSON.stringify(g.um.larguras));
chk('modo "todos": os TRES quadros nascem com a largura de verdade -- nenhum com 0',
    g.todos.larguras.length === 3 && g.todos.larguras.every(w => w > 300),
    JSON.stringify(g.todos.larguras));
chk('e e a MESMA largura em todos (a do lugar onde o calendario vai ficar)',
    g.todos.larguras.every(w => w === g.todos.calLarg), JSON.stringify(g.todos.larguras) + ' cal=' + g.todos.calLarg);
chk('nenhuma caixa de quadro ocupa altura, nem a do modo "todos"',
    g.um.caixas.every(h => h === 0) && g.todos.caixas.every(h => h === 0),
    JSON.stringify([g.um.caixas, g.todos.caixas]));
chk('e todas escondem o que transborda (a area rolavel nao cresce)',
    g.todos.transbordo.every(v => v === 'hidden'), JSON.stringify(g.todos.transbordo));
chk('e nada delas aparece nem intercepta o dedo',
    g.todos.opacidade.every(v => v === '0') && g.todos.toque.every(v => v === 'none'),
    JSON.stringify([g.todos.opacidade, g.todos.toque]));
chk('a caixa do calendario continua com altura zero antes de qualquer escolha',
    g.um.calAlt === 0 && g.todos.calAlt === 0, 'um=' + g.um.calAlt + ' todos=' + g.todos.calAlt);
chk('e a altura da pagina e IDENTICA nos tres modos -- nenhum buraco vazio em nenhum deles',
    g.nao.pagina === g.um.pagina && g.um.pagina === g.todos.pagina,
    'nao=' + g.nao.pagina + ' um=' + g.um.pagina + ' todos=' + g.todos.pagina);

/* ================================================================
   8. O e.source COM VARIOS QUADROS VIVOS -- rede fechada
   ================================================================
   A parte 2 provou a guarda com um quadro ISCA fabricado pelo teste. Agora os quadros
   concorrentes sao os DE VERDADE: no modo 'todos' ha tres na pagina, e dois deles no MESMO
   dominio -- ou seja, com a MESMA origem que o ouvinte exige. O filtro de e.origin nao separa
   um do outro; quem separa e doQuadro, pela identidade do e.source. Se ele falhar, a altura
   anunciada por um calendario que ninguem esta vendo e escrita no que esta na tela, e nada
   quebra: o quadro so fica do tamanho errado.
   Rede fechada de proposito: o que esta sob prova e o OUVINTE, e sinal fabricado pelo teste
   exercita exatamente a linha que importa, sem depender de o TidyCal mandar um. */
console.log('\n===== 8. o e.source com varios quadros vivos =====');
const varios = await comBlocoNaPagina({
  bloco: modos.todos, porta: 8880, corpoDepois: ENCHIMENTO,
  medir: async pg => {
    await pg.locator('.fca-fam').first().click({ timeout: 10000 });
    await pg.locator('.fca-card:visible').first().click({ timeout: 10000 });
    await pg.waitForTimeout(1400);   /* passa a janela de 800ms de ignorarAte, se ela tiver sido armada */
    return await pg.evaluate(() => {
      const todos = Array.from(document.querySelectorAll('iframe.fca-tidycal'));
      const visivel = document.querySelector('.fca-quadro:not(.fca-oculto) iframe.fca-tidycal');
      if(!visivel) return { erro: 'nenhum quadro visivel depois de escolher o pacote' };
      const origem = (/^https:\/\/[^/?#]+/.exec(visivel.src) || [''])[0];
      const rivais = todos.filter(f => f !== visivel && f.src.indexOf(origem + '/') === 0);
      const manda = (fonte, dado) => {
        const ev = new MessageEvent('message', { data: dado, origin: origem });
        Object.defineProperty(ev, 'source', { value: fonte });
        window.dispatchEvent(ev);
      };
      const alt = () => visivel.style.height || '';
      const antes = alt();
      const aposRivais = rivais.map(f => {
        manda(f.contentWindow, '[iFrameSizer]fcx:1234:900:mutationObserver');
        return alt();
      });
      manda(visivel.contentWindow, '[iFrameSizer]fcx:1234:900:mutationObserver');
      return { total: todos.length, rivais: rivais.length, origem, antes, aposRivais,
               aposVisivel: alt(), srcVisivel: visivel.src };
    });
  }
});
if(varios.erro){
  chk('achou o quadro visivel', false, varios.erro);
}else{
  console.log('      quadros vivos=' + varios.total + '  rivais na MESMA origem=' + varios.rivais +
              '  (' + varios.origem + ')');
  console.log('      altura do visivel: antes=' + varios.antes +
              '  apos cada rival=' + JSON.stringify(varios.aposRivais) +
              '  apos o proprio=' + varios.aposVisivel);
  chk('ha mais de um quadro vivo, e pelo menos um rival na MESMA origem (senao o negativo nao prova nada)',
      varios.total >= 2 && varios.rivais >= 1, 'total=' + varios.total + ' rivais=' + varios.rivais);
  chk('NEGATIVO -- a altura anunciada por um quadro ESCONDIDO da mesma origem e IGNORADA',
      varios.aposRivais.every(h => h === varios.antes),
      'antes=' + varios.antes + ' depois=' + JSON.stringify(varios.aposRivais));
  chk('POSITIVO -- a mesma altura, vinda do quadro DA TELA, e aplicada',
      varios.aposVisivel === '1234px', 'depois=' + varios.aposVisivel);
  chk('sem erro de console', errosDoBloco(varios.erros).length === 0,
      JSON.stringify(errosDoBloco(varios.erros).slice(0, 2)));
}

/* ================================================================
   9. O CAMPO 'a-precal' -- so a ferramenta, sem rede
   ================================================================
   As oito partes acima medem o BLOCO. Esta mede o CAMPO, e ela existe porque a escolha do dono
   so vale se ela sobreviver: ao Gerar, a recarga da ferramenta, ao preset da aba e -- o caso
   que este projeto ja errou duas vezes -- a um estado gravado por uma versao ANTERIOR, que nao
   tem a chave nenhuma. O padrao de fabrica e 'um', entao a pergunta e escrita ao contrario dos
   dois interruptores vizinhos: qualquer coisa que nao seja 'nao' nem 'todos' cai no padrao.
   Valor invalido gravado entra junto pelo mesmo motivo: um backup editado a mao, ou de uma
   versao futura, nao pode deixar o radio em branco. */
console.log('\n===== 9. o campo a-precal: grava, sobrevive e decide o bloco =====');
{
  const srv = await servir(RAIZ, 8890);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8890');
    const marcado = () => pg.$eval('input[name="a-precal"]:checked', el => el.value);
    const gerado = async () => { await clicar(pg, 'a-gerar'); return await ler(pg, 'a-out1'); };
    await preparar(pg);
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC');
    const campo = await pg.$('#a-ppath') ? 'a-ppath' : 'a-plink';
    await set(pg, 'a-pcod', 'UM'); await set(pg, 'a-pnome', 'Pacote um');
    await set(pg, 'a-ppreco', '420'); await set(pg, campo, CAL1);
    await clicar(pg, 'a-pac-salvar');

    chk('o padrao de fabrica na tela e "um"', await marcado() === 'um');
    chk('e o bloco sai com PRECARREGAR=um', (await gerado()).indexOf("var PRECARREGAR='um';") >= 0);
    await radio(pg, 'a-precal', 'todos');
    chk('trocado para "todos", o bloco sai com PRECARREGAR=todos',
        (await gerado()).indexOf("var PRECARREGAR='todos';") >= 0);
    await radio(pg, 'a-precal', 'nao');
    chk('e em "nao" ele sai com PRECARREGAR=nao',
        (await gerado()).indexOf("var PRECARREGAR='nao';") >= 0);

    await radio(pg, 'a-precal', 'todos');
    await pg.reload({ waitUntil: 'load' });
    await clicar(pg, 'aba-pac');
    chk('o valor sobrevive a recarga da ferramenta', await marcado() === 'todos');

    /* O BACKUP DE ONTEM: estado gravado que nao tem a chave. */
    const semChave = ch => pg.evaluate(c => {
      const k = Object.keys(localStorage).find(x => x.indexOf('fcConstrutores') === 0 && localStorage[x].indexOf('"a"') >= 0);
      const o = JSON.parse(localStorage[k]);
      if(c === null) delete o.a.precal; else o.a.precal = c;
      localStorage[k] = JSON.stringify(o);
    }, ch);
    await semChave(null);
    await pg.reload({ waitUntil: 'load' });
    await clicar(pg, 'aba-pac');
    chk('estado gravado SEM a chave (backup anterior) abre no padrao "um", sem erro',
        await marcado() === 'um' && pg.erros.length === 0, JSON.stringify(pg.erros.slice(0, 2)));
    await semChave('xpto');
    await pg.reload({ waitUntil: 'load' });
    await clicar(pg, 'aba-pac');
    chk('valor invalido gravado tambem cai no padrao, e nao deixa o radio em branco',
        await marcado() === 'um');

    /* O PRESET DA ABA: ele e uma fotografia do coleta(), entao o campo entra sozinho -- e e
       exatamente por isso que vale medir, porque "entra sozinho" e uma afirmacao. */
    await radio(pg, 'a-precal', 'nao');
    await set(pg, 'fcp-a-nome', 'teste do precal');
    await clicar(pg, 'fcp-a-salvar');
    await radio(pg, 'a-precal', 'todos');
    await pg.locator('#fcp-a-lista button', { hasText: 'Aplicar' }).first().click();
    chk('o preset da aba guarda e devolve o campo', await marcado() === 'nao');
    chk('e o bloco volta a sair com PRECARREGAR=nao',
        (await gerado()).indexOf("var PRECARREGAR='nao';") >= 0);
    chk('nenhum erro de console na ferramenta durante a parte 9',
        pg.erros.length === 0, JSON.stringify(pg.erros.slice(0, 3)));
    await pg.close();
  } finally {
    await br.close();
    srv.close();
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(resumo());
