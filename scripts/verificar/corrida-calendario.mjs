/* ============================================================================
   A CORRIDA: O embed.js DO TIDYCAL CONTRA O NOSSO APERTO DE MAO
   ============================================================================
   O QUE ESTE ARQUIVO MEDE, E POR QUE NENHUM OUTRO MEDIA. O bloco do calendario
   tem DOIS mecanismos que sabem cuidar da altura do iframe: a biblioteca do
   proprio TidyCal (embed.js) e um aperto de mao proprio, que existe para o dia
   em que ela nao carregar. A intencao do desenho esta escrita na fonte:
   "Nunca os dois juntos: o filho aceita um init so (medido), e o perdedor
   ficaria achando que esta no comando."

   Ate 04/09/2026 essa intencao era VIOLADA numa ordem de chegada: se o embed.js
   demorasse mais que os 2,5s do prazo, o aperto de mao proprio assumia e, quando
   a biblioteca finalmente chegava, ela era aplicada AO MESMO ELEMENTO por cima --
   e o prendia no piso de 500px dela, enquanto o calendario continuava anunciando
   a altura de verdade para um mecanismo que tinha acabado de ser calado.

   POR QUE UM ARQUIVO NOVO, E NAO uma verificacao dentro de tidycal-unificado.mjs:
   aquele arquivo mede o RESULTADO (a altura final acompanha o conteudo?), e o
   resultado e intermitente por natureza -- ele depende de quem ganhou a corrida
   naquela carga. Este aqui mede a CORRIDA em si: quem assumiu, quando, e se o
   perdedor ainda assim tocou o elemento. Sao perguntas diferentes, e misturar as
   duas foi o que fez esta divida passar meses sem nome.

   COMO ELE OBSERVA, sem tocar no bloco. Uma sonda no <head> da pagina, que roda
   antes do bloco:
     - embrulha window.setTimeout  -> o prazo de 2500ms e o comeco do calendario;
                                      o de 400ms e o comeco do aperto de mao
                                      proprio (comecarHandshake e o unico lugar
                                      que agenda 400/1200/3000). E OBSERVACAO
                                      DIRETA do instante em que cada mecanismo
                                      assume, e nao deducao a partir do relogio.
     - embrulha window.iFrameResize -> quando a biblioteca deles foi DEFINIDA
                                      (o script executou) e quando o bloco a
                                      APLICOU ao elemento.
     - escuta 'message'            -> as alturas que o calendario ANUNCIA.
     - amostra a altura do quadro  -> as alturas que alguem de fato APLICOU.
   A diferenca entre as duas ultimas e o defeito inteiro: anunciar 1021 e ficar
   em 500.

   E COMO ELE FORCA A CORRIDA, em vez de esperar a sorte. Com `retardar` (ver
   pagina.mjs) o embed.js chega depois do prazo TODA VEZ. Esperar a rede decidir
   mede a frequencia do defeito, nunca o defeito -- e frequencia foi exatamente o
   que fez esta divida ser lida como "acontece as vezes" durante meses. As duas
   coisas estao aqui: a corrida forcada (parte 1, deterministica) e as passagens
   naturais (parte 2, que mede a frequencia).

   REDE DE VERDADE. Como tidycal-unificado.mjs, este arquivo fala com o TidyCal
   real -- e a unica forma de saber o que a biblioteca deles faz. Ele PODE falhar
   por rede, e essa falha se le como "nao mediu", nunca como "quebrou".

   NAO RODE DUAS COISAS DESTAS AO MESMO TEMPO: as passagens sao cargas de verdade
   no servidor deles, e passagens concorrentes se atrapalham.

   Rodar: node scripts/verificar/corrida-calendario.mjs
          node scripts/verificar/corrida-calendario.mjs <ref>      (outra referencia)
          FC_PASSAGENS=8 node scripts/verificar/corrida-calendario.mjs
============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, clicar, radio } from './lib.mjs';
import { preparar } from './cenario.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';
const PASSAGENS = Number(process.env.FC_PASSAGENS || 6);
const FORCADAS  = Number(process.env.FC_FORCADAS  || 3);
/* FC_PARTES limita a rodada a algumas das tres partes (ex.: FC_PARTES=2). Existe para
   reinvestigar UM achado sem repetir 25 minutos de passagens que ja sairam. A rodada
   completa e a sem esta variavel. */
const PARTES = String(process.env.FC_PARTES || '1,2,3').split(',');
const faz = n => PARTES.indexOf(String(n)) >= 0;

const TIDY = 'https://tidycal.com/fotocerta/natal-2026';
const PROP = 'https://agendamento.fotocerta.com.br/estudio-905-seg-a-sex-1-hora';
const REDE = ['tidycal.com', 'agendamento.fotocerta.com.br', 'asset-tidycal.b-cdn.net'];
const ENCHIMENTO = '<div style="height:1200px;background:#eee"></div>';
/* Quanto o embed.js e atrasado na corrida forcada. O prazo do bloco e 2500ms, mas 2500
   NAO e o instante em que o aperto de mao assume: comecarCalendario recomeca a cada "load"
   do iframe, e o prazo recomeca com ele -- medido, o "load" do calendario chega entre 2000
   e 2500ms, entao o aperto de mao pode so assumir perto dos 5000ms. Com 5000 de atraso a
   biblioteca ainda ganhava 1 passagem em 3; 8000 poe a ordem escolhida fora de duvida. */
const ATRASO = 8000;
/* Quanto se observa cada passagem. Medido: o desfile de alturas do TidyCal termina
   entre 3s e 8s; 22s cobre o desfile mais o atraso forcado com folga. */
const JANELA = 22000;

/* ===== a sonda ===== */
/* Vai no <head>, entao roda antes do bloco. Nao toca em nada do bloco: so embrulha
   duas funcoes do navegador e escuta. */
const SONDA = `<script>
window.__fc = { timers: [], libDef: null, libAplic: [], msgs: [], alturas: [], atrib: null, clique: null };
(function(){
  var st = window.setTimeout;
  window.setTimeout = function(fn, d){
    if(d === 400 || d === 1200 || d === 2500 || d === 3000)
      window.__fc.timers.push([Math.round(performance.now()), d]);
    return st.apply(window, arguments);
  };
  var guardada;
  Object.defineProperty(window, 'iFrameResize', {
    configurable: true,
    get: function(){ return guardada; },
    set: function(nv){
      if(typeof nv === 'function'){
        window.__fc.libDef = Math.round(performance.now());
        guardada = function(){
          window.__fc.libAplic.push(Math.round(performance.now()));
          return nv.apply(this, arguments);
        };
      } else { guardada = nv; }
    }
  });
  window.addEventListener('message', function(e){
    if(typeof e.data !== 'string') return;
    if(e.data.indexOf('[iFrameSizer]') === 0){
      var p = e.data.split(':');
      window.__fc.msgs.push([Math.round(performance.now()), parseInt(p[1], 10) || 0, p[p.length-1]]);
    } else if(e.data.indexOf('[iFrameResizerChild]') === 0){
      window.__fc.msgs.push([Math.round(performance.now()), -1, 'ready']);
    }
  });
  function quadro(){
    return document.querySelector('.fca-quadro:not(.fca-oculto) iframe.fca-tidycal')
        || document.querySelector('iframe.tidycal-embed, iframe.fca-tidycal');
  }
  setInterval(function(){
    var f = quadro(); if(!f) return;
    var h = Math.round(f.getBoundingClientRect().height), a = window.__fc.alturas;
    if(!a.length || a[a.length-1][1] !== h) a.push([Math.round(performance.now()), h]);
    if(window.__fc.atrib === null && f.getAttribute('data-fc-lib')) window.__fc.atrib = Math.round(performance.now());
  }, 100);
})();
</script>`;

/* ===== gerar ===== */
async function gerarTidy(raiz, url, porta, medir){
  const { valores } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-tidy');
    await set(pg, 't-path', url);
    await radio(pg, 't-medir', medir ? 'sim' : 'nao');
    await clicar(pg, 't-gerar');
  }, ['t-out1'], { raiz, porta });
  return valores['t-out1'];
}
async function gerarPac(raiz, porta, medir){
  const { valores } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-pac');
    await radio(pg, 'a-medir', medir ? 'sim' : 'nao');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC');
    for(const p of [['UM', 'Pacote um', '45 minutos', '420', '10 fotos', TIDY],
                    ['DOIS', 'Pacote dois', '1 hora', '700', '20 fotos', PROP]]){
      await set(pg, 'a-pcod', p[0]); await set(pg, 'a-pnome', p[1]); await set(pg, 'a-pdur', p[2]);
      await set(pg, 'a-ppreco', p[3]); await set(pg, 'a-pinclui', p[4]); await set(pg, 'a-ppath', p[5]);
      await clicar(pg, 'a-pac-salvar');
    }
    await clicar(pg, 'a-gerar');
  }, ['a-out1'], { raiz, porta });
  return valores['a-out1'];
}

/* ===== uma passagem ===== */
const RUIDO = ['Failed to load resource', 'net::ERR_', 'Failed to load Stripe.js'];
const errosDoBloco = e => e.filter(x => !RUIDO.some(r => x.indexOf(r) >= 0));

async function passagem({ bloco, porta, atraso = 0, vitrine = false, janela = JANELA }){
  const r = await comBlocoNaPagina({
    bloco, porta, permitir: REDE, cabeca: SONDA, corpoDepois: ENCHIMENTO,
    retardar: atraso ? [{ padrao: '/js/embed.js', ms: atraso }] : [],
    medir: async pg => {
      if(vitrine){
        await pg.locator('.fca-card').first().click({ timeout: 20000 });
        await pg.evaluate(() => { window.__fc.clique = Math.round(performance.now()); });
      }
      await pg.waitForTimeout(janela);
      return await pg.evaluate(() => window.__fc);
    }
  });
  return ler(r);
}

/* A LEITURA CRUA VIRA AS QUATRO PERGUNTAS que a divida fez. Nenhuma delas e deduzida
   do relogio: cada uma sai de um evento observado. */
function ler(r){
  const t2500 = (r.timers.find(t => t[1] === 2500) || [null])[0];   /* comecarCalendario */
  const t400  = (r.timers.find(t => t[1] === 400)  || [null])[0];   /* comecarHandshake */
  const tAplic = r.libAplic.length ? r.libAplic[0] : null;
  const anunc = r.msgs.filter(m => m[1] > 0).map(m => m[1]);
  const alturas = r.alturas.map(a => a[1]);
  return {
    inicio: t2500, handshake: t400, libDef: r.libDef, libAplic: tAplic, atrib: r.atrib,
    /* QUEM ASSUMIU PRIMEIRO. So um dos dois pode ter sido o primeiro; o outro, se
       tambem agiu, agiu por cima. */
    quem: (t400 === null && tAplic === null) ? 'ninguem'
        : (tAplic !== null && (t400 === null || tAplic < t400)) ? 'biblioteca' : 'aperto de mao',
    /* O PERDEDOR TOCOU O ELEMENTO? E a pergunta da divida. So a biblioteca pode
       "tocar por cima" -- o aperto de mao perdedor nao escreve altura nenhuma
       (aplicarAltura volta cedo quando a biblioteca esta no comando). */
    libPorCima: (t400 !== null && tAplic !== null && tAplic > t400),
    anunciadaMax: anunc.length ? Math.max.apply(null, anunc) : null,
    anunciadas: anunc,
    /* AS MENSAGENS CRUAS, com o instante de cada uma. Sem elas nao da para separar "o
       calendario nao anunciou" de "anunciou e ninguem escreveu" -- que sao defeitos
       diferentes e moram em lados diferentes da corrida. */
    sinais: r.msgs.filter(m => m[1] !== 0),
    alturas: r.alturas,
    final: alturas.length ? alturas[alturas.length - 1] : null,
    partida: alturas.length ? alturas[0] : null,
    erros: errosDoBloco(r.erros || [])
  };
}

const linha = p => 'inicio=' + p.inicio + ' handshake=' + p.handshake +
  ' libDef=' + p.libDef + ' libAplic=' + p.libAplic +
  '  quem=' + p.quem + (p.libPorCima ? '  <<< A BIBLIOTECA FOI APLICADA POR CIMA' : '') +
  '\n         anunciada(max)=' + p.anunciadaMax + '  altura final=' + p.final +
  '\n         sinais=' + JSON.stringify(p.sinais.slice(0, 8)) +
  '\n         alturas=' + JSON.stringify(p.alturas.slice(-6)) +
  (p.erros.length ? '  erros=' + p.erros.length : '');

/* A PERGUNTA CENTRAL: a altura que o calendario ANUNCIOU chegou ao elemento?
   Tolerancia de 8px, a mesma folga que tidycal-unificado.mjs ja usa entre arvores. */
const aplicou = p => p.anunciadaMax !== null && p.final !== null &&
  Math.abs(p.final - p.anunciadaMax) <= 8;

/* ===== main ===== */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-corrida-'));
try{
  execFileSync('sh', ['-c', 'git -C "' + RAIZ + '" archive ' + REF + ' | tar -x -C "' + tmp + '"']);
}catch(e){
  console.log('Nao consegui extrair a referencia "' + REF + '": ' + (e.message || e));
  process.exit(1);
}
console.log('referencia: ' + REF + '   passagens: ' + FORCADAS + ' forcadas + ' + PASSAGENS + ' naturais, por lado' +
            '\nhosts liberados: ' + REDE.join(', ') + '\n');

console.log('gerando os blocos...');
const bloco = {
  novoCal:   await gerarTidy(RAIZ, TIDY, 8861, false),
  novoMed:   await gerarTidy(RAIZ, TIDY, 8862, true),
  novoPac:   await gerarPac(RAIZ, 8863, true),
  novoPrp:   await gerarTidy(RAIZ, PROP, 8867, true),
  atualPrp:  await gerarTidy(tmp,  PROP, 8868, true),
  atualCal:  await gerarTidy(tmp, TIDY, 8864, false),
  atualMed:  await gerarTidy(tmp, TIDY, 8865, true),
  atualPac:  await gerarPac(tmp, 8866, true)
};
for(const k of Object.keys(bloco))
  chk('bloco ' + k + ' foi gerado', (bloco[k] || '').length > 200, 'tamanho=' + (bloco[k] || '').length);

/* ===== 1. A CORRIDA FORCADA ===== */
if(faz(1)){
  console.log('\n===== 1. a corrida FORCADA (embed.js atrasado ' + ATRASO + 'ms; o prazo do bloco e 2500ms) =====');
  console.log('   O aperto de mao proprio assume ANTES, toda vez. A pergunta e o que a');
  console.log('   biblioteca faz quando chega depois.\n');
}
/* VARIAS PASSAGENS POR LADO, e nao uma. A corrida e forcada, mas o que o calendario
   anuncia (e quando) continua sendo do TidyCal: uma passagem so mediria uma sorte. */
async function forcar(rot, chave, porta, vitrine){
  const lados = {};
  for(const lado of ['atual', 'novo']){
    const ps = [];
    for(let i = 0; i < FORCADAS; i++){
      const p = await passagem({ bloco: bloco[lado + chave],
        porta: porta + (lado === 'novo' ? 50 : 0) + i * 5, atraso: ATRASO, vitrine });
      ps.push(p);
      console.log('  ' + rot + ' -- ' + lado + ' #' + (i + 1) + ': ' + linha(p));
    }
    lados[lado] = ps;
  }
  const conta = ps => ({
    assumiu: ps.filter(p => p.quem === 'aperto de mao').length,
    porCima: ps.filter(p => p.libPorCima).length,
    aplicou: ps.filter(aplicou).length
  });
  const a = conta(lados.atual), n = conta(lados.novo);
  console.log('  --> ' + rot + '  (em ' + FORCADAS + ' passagens cada)');
  console.log('        atual: aperto de mao assumiu ' + a.assumiu + '   biblioteca por cima ' +
              a.porCima + '   altura anunciada aplicada ' + a.aplicou);
  console.log('        novo : aperto de mao assumiu ' + n.assumiu + '   biblioteca por cima ' +
              n.porCima + '   altura anunciada aplicada ' + n.aplicou);
  /* MEDICAO, E NAO ASSERCAO: quem assume depende do "load" do iframe, que e do TidyCal.
     O que se cobra e que a ordem escolhida tenha acontecido ao menos uma vez -- sem isso a
     corrida nao foi forcada e as duas verificacoes seguintes nao dizem nada. Cobrar "sempre"
     faria a suite falhar por causa de um "load" rapido do lado deles, que nao e defeito
     nenhum: nessas passagens a biblioteca ganha limpo, que e o caminho preferido. */
  chk(rot + ': a corrida forcada aconteceu -- o aperto de mao assumiu antes ao menos uma vez',
      n.assumiu >= 1, 'assumiu em ' + n.assumiu + ' de ' + FORCADAS);
  chk(rot + ': e a biblioteca NUNCA e aplicada por cima de quem ja assumiu',
      n.porCima === 0, 'por cima em ' + n.porCima + ' de ' + FORCADAS);
  chk(rot + ': a altura anunciada pelo calendario chega ao elemento em toda passagem',
      n.aplicou === FORCADAS, 'aplicou em ' + n.aplicou + ' de ' + FORCADAS);
  chk(rot + ': e nao piorou o que o atual ja fazia',
      n.aplicou >= a.aplicou, 'novo=' + n.aplicou + ' atual=' + a.aplicou);
  chk(rot + ': sem erro de console',
      lados.novo.every(p => p.erros.length === 0),
      JSON.stringify((lados.novo.find(p => p.erros.length) || { erros: [] }).erros.slice(0, 2)));
  return { a, n };
}
if(faz(1)){
  await forcar('aba TidyCal [calibrado]', 'Cal', 8871, false);
  await forcar('aba TidyCal [medindo]',   'Med', 8891, false);
  await forcar('vitrine de pacotes',      'Pac', 8911, true);
}

/* ===== 2. AS PASSAGENS NATURAIS ===== */
async function parte2(){
console.log('\n===== 2. passagens NATURAIS (sem atraso): com que frequencia a corrida acontece =====');
async function serie(rotulo, blocoTxt, porta, vitrine){
  const ps = [];
  for(let i = 0; i < PASSAGENS; i++){
    const p = await passagem({ bloco: blocoTxt, porta: porta + i * 10, vitrine });
    ps.push(p);
    console.log('  ' + rotulo + ' #' + (i + 1) + ': ' + linha(p));
  }
  const corridas = ps.filter(p => p.libPorCima).length;
  const aplicaram = ps.filter(aplicou).length;
  console.log('  --> ' + rotulo + ': biblioteca por cima em ' + corridas + '/' + ps.length +
              '   altura anunciada aplicada em ' + aplicaram + '/' + ps.length);
  return { ps, corridas, aplicaram };
}
/* OS DOIS ENDERECOS, e nao so um. Eles nao se comportam igual, e isso foi medido em
   04/09/2026: em tidycal.com o calendario anuncia 764 em repouso; no dominio proprio ele
   nao anuncia nada em repouso que passe do piso, e o quadro fica na altura de partida --
   nos DOIS lados, arvore de trabalho e referencia. Medir so um faria a diferenca entre
   endereco e arvore virar uma conclusao sobre a arvore. */
console.log('\n  --- tidycal.com ---');
const natAtual = await serie('atual [medindo] tidycal', bloco.atualMed, 8601, false);
const natNovo  = await serie('novo  [medindo] tidycal', bloco.novoMed,  8701, false);
console.log('\n  --- dominio proprio ---');
const prpAtual = await serie('atual [medindo] proprio', bloco.atualPrp, 8621, false);
const prpNovo  = await serie('novo  [medindo] proprio', bloco.novoPrp,  8721, false);
chk('dominio proprio: o novo aplica a altura anunciada pelo menos tanto quanto o atual',
    prpNovo.aplicaram >= prpAtual.aplicaram,
    'novo=' + prpNovo.aplicaram + ' atual=' + prpAtual.aplicaram);
chk('dominio proprio: a biblioteca nunca e aplicada por cima do aperto de mao',
    prpNovo.corridas === 0, 'por cima em ' + prpNovo.corridas);

console.log('\n  A HIPOTESE DA INTERMITENCIA (registrada em 03/09/2026: no modo "medindo" a');
console.log('  altura medida so era aplicada em cerca de uma carga de quatro). Se ela vinha');
console.log('  desta corrida, o numero de baixo sobe quando o de cima cai.');
console.log('    atual: por cima ' + natAtual.corridas + '/' + PASSAGENS +
            '   aplicou ' + natAtual.aplicaram + '/' + PASSAGENS);
console.log('    novo : por cima ' + natNovo.corridas + '/' + PASSAGENS +
            '   aplicou ' + natNovo.aplicaram + '/' + PASSAGENS);
chk('nas passagens naturais, a biblioteca nunca e aplicada por cima do aperto de mao',
    natNovo.corridas === 0, 'por cima em ' + natNovo.corridas + ' de ' + PASSAGENS);
chk('nas passagens naturais, o novo aplica a altura anunciada pelo menos tanto quanto o atual',
    natNovo.aplicaram >= natAtual.aplicaram,
    'novo=' + natNovo.aplicaram + ' atual=' + natAtual.aplicaram);
}
if(faz(2)) await parte2();

/* ===== 3. AS TRES DEGRADACOES ===== */
async function parte3(){
console.log('\n===== 3. as tres degradacoes, com a corrida a vista =====');
/* a) a biblioteca carrega: e ela quem assume, e o aperto de mao nao entra. */
const degA = await passagem({ bloco: bloco.novoCal, porta: 8941 });
console.log('  a) biblioteca carrega: ' + linha(degA));
chk('degradacao a) a biblioteca assume', degA.quem === 'biblioteca', 'quem=' + degA.quem);
chk('degradacao a) e a altura acompanha o conteudo', degA.final > 0 && degA.final !== 700, 'final=' + degA.final);

/* b) o embed.js nao chega: o aperto de mao proprio assume, como sempre. */
const degB = await comBlocoNaPagina({
  bloco: bloco.novoCal, porta: 8942, permitir: REDE, cabeca: SONDA, corpoDepois: ENCHIMENTO,
  bloquear: ['/js/embed.js'],
  medir: async pg => { await pg.waitForTimeout(JANELA); return await pg.evaluate(() => window.__fc); }
}).then(ler);
console.log('  b) embed.js bloqueado: ' + linha(degB));
chk('degradacao b) sem a biblioteca, o aperto de mao proprio assume', degB.quem === 'aperto de mao', 'quem=' + degB.quem);
chk('degradacao b) e a altura acompanha o conteudo', degB.final > 0 && degB.final !== 700, 'final=' + degB.final);

/* c) a biblioteca carrega e o calendario fica mudo: nada quebra, nada zera. */
const degC = await comBlocoNaPagina({
  bloco: bloco.novoCal, porta: 8943, permitir: ['asset-tidycal.b-cdn.net'], cabeca: SONDA, corpoDepois: ENCHIMENTO,
  medir: async pg => { await pg.waitForTimeout(JANELA); return await pg.evaluate(() => window.__fc); }
}).then(ler);
console.log('  c) calendario mudo: ' + linha(degC));
chk('degradacao c) sinal nenhum: a altura fica na de partida (700), e nao zera',
    degC.final === 700, 'final=' + degC.final);
chk('degradacao c) sem erro de console', degC.erros.length === 0, JSON.stringify(degC.erros.slice(0, 2)));
}
if(faz(3)) await parte3();

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(resumo());
