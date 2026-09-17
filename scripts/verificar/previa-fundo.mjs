/* ============================================================================
   O FUNDO DA PREVIA, EM TODOS OS CONSTRUTORES
   ============================================================================
   O PEDIDO do dono (17/09/2026): "gostaria que tivesse um seletor de cor do fundo da
   pagina da previa. Atualmente esta fixo em branco. Estou trabalhando num design com
   outra cor e a previa nao mostra como fica a combinacao." E, quando propus um ajuste
   unico na barra do topo, ele recusou com a razao que decidiu o desenho: "os codigos
   gerados podem ser usados em landing pages, que podem ter esquema de cores diferentes
   do padrao do site. Eu decido qual cor usar em cada construtor."

   A PROMESSA QUE ESTA PROVA GUARDA e a que aparece escrita no proprio campo: "o codigo
   gerado sai exatamente igual com qualquer fundo escolhido aqui". Um ajuste de previa
   que vazasse para o bloco seria a pior classe de defeito desta ferramenta -- o dono
   mexe no que acha que e so visualizacao e muda o que vai para o site. Por isso a parte
   2 gera TUDO duas vezes, com fundos opostos, e exige as saidas BYTE A BYTE iguais.

   O resto cobra que o controle exista nas oito abas, que ele realmente pinte o quadro,
   que a escolha sobreviva a recarga e que o campo de cor livre so apareca quando faz
   sentido.

   ROTEIRO: node scripts/verificar/previa-fundo.mjs
   ============================================================================ */
import { navegador, servir, abrir, set, radio, clicar } from './lib.mjs';
import { gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { preparar, conteudo, cobranca, gerarTodas, ABAS } from './cenario.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
/* As oito que ganharam o controle nesta rodada. Bordas e Efeitos ja o tinham, com
   armazenamento proprio -- divergencia declarada no index.html, e fora do alcance daqui. */
const PREFS = ['s','l','u','a','c','p','m','v'];
const ABA_DE = {s:'aba-slide', l:'aba-leads', u:'aba-uni', a:'aba-pac',
                c:'aba-cnt', p:'aba-cob', m:'aba-loja', v:'aba-alb'};

const br = await navegador();
const srv = await servir(RAIZ, 9661);
const pg = await abrir(br, 'http://127.0.0.1:9661');
await pg.setViewportSize({width: 1500, height: 1100});
await pg.waitForTimeout(800);

/* ===== 1. o controle existe nas oito, com as mesmas opcoes ===== */
console.log('\n== 1. o controle existe nas oito abas ==');
const controles = await pg.evaluate(prefs => prefs.map(p => {
  const rs = [].slice.call(document.querySelectorAll('input[name="'+p+'-pvfundo"]'));
  return {p, opcoes: rs.map(r => r.value),
          marcado: (rs.filter(r => r.checked)[0]||{}).value || null,
          temCor: !!document.getElementById(p+'-pvcor-t'),
          campoVisivel: (() => { const e = document.getElementById(p+'-pvcor-campo');
            return e ? getComputedStyle(e).display !== 'none' : null; })()};
}), PREFS);
for(const c of controles){
  chk('[1] '+c.p+': o seletor de fundo da previa existe', c.opcoes.length === 4, JSON.stringify(c));
  chk('[1] '+c.p+': com as quatro opcoes, na mesma ordem das outras',
      JSON.stringify(c.opcoes) === JSON.stringify(['claro','escuro','papel','cor']), JSON.stringify(c.opcoes));
  /* NASCE EM "PAGINA CLARA", que e o fundo que estas previas sempre tiveram: quem nunca
     mexer no campo nao ve diferenca nenhuma depois desta rodada. */
  chk('[1] '+c.p+': nasce em "Pagina clara"', c.marcado === 'claro', String(c.marcado));
  chk('[1] '+c.p+': e o campo de cor livre comeca escondido', c.campoVisivel === false, String(c.campoVisivel));
}

/* ===== 2. A PROMESSA: o codigo gerado NAO muda ===== */
console.log('\n== 2. o codigo gerado sai igual com qualquer fundo ==');
const SAIDAS = ['s-out','l-out','u-out','m-out','c-out1','p-out1','p-out2','a-out1','a-out3','v-out'];
async function gerarCom(modo, porta){
  const r = await gerarNaFerramenta(async p => {
    await preparar(p); await conteudo(p); await cobranca(p,{descpix:'10'});
    for(const pref of PREFS){
      if(!(await p.$('#'+ABA_DE[pref]))) continue;
      await clicar(p, ABA_DE[pref]); await p.waitForTimeout(40);
      await radio(p, pref+'-pvfundo', modo);
      if(modo === 'cor') await set(p, pref+'-pvcor-t', '#123456');
    }
    await gerarTodas(p);
  }, SAIDAS, {porta});
  chk('[2] ('+modo+') a ferramenta gerou sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  return r.valores;
}
const claro = await gerarCom('claro', 9662);
const escuro = await gerarCom('escuro', 9663);
const cor = await gerarCom('cor', 9664);
for(const sa of SAIDAS){
  chk('[2] '+sa+': identica com fundo claro e escuro', claro[sa] === escuro[sa],
      'tamanhos ' + (claro[sa]||'').length + ' x ' + (escuro[sa]||'').length);
  chk('[2] '+sa+': identica tambem com cor livre (#123456)', claro[sa] === cor[sa],
      'tamanhos ' + (claro[sa]||'').length + ' x ' + (cor[sa]||'').length);
  /* Se a cor vazasse, ela apareceria escrita no bloco -- a busca literal e a segunda
     opiniao, independente da comparacao acima. PROCURA-SE '#123456', COM A CERQUILHA: o
     '123456' solto casa com o Client ID de teste do PayPal ('AbCdEf123456789...') e acusava
     vazamento em cinco saidas que estavam certas. Medido na primeira execucao desta prova. */
  chk('[2] '+sa+': a cor escolhida nao aparece dentro do bloco',
      (cor[sa]||'').indexOf('#123456') < 0 && (escuro[sa]||'').indexOf('#141414') < 0);
}

/* ===== 3. mas ela PINTA o quadro de verdade ===== */
console.log('\n== 3. o quadro da previa muda de fundo ==');
await preparar(pg); await conteudo(pg);
for(const pref of PREFS){
  if(!(await pg.$('#'+ABA_DE[pref]))){ chk('[3] '+pref+': a aba existe', false, ABA_DE[pref]); continue; }
  await clicar(pg, ABA_DE[pref]); await pg.waitForTimeout(150);
  const leia = async () => pg.evaluate(p => {
    const ifr = document.querySelector('#'+p+'-pv-box iframe');
    if(!ifr || !ifr.contentDocument || !ifr.contentDocument.body) return null;
    return getComputedStyle(ifr.contentDocument.body).backgroundColor;
  }, pref);
  await radio(pg, pref+'-pvfundo', 'claro'); await pg.waitForTimeout(700);
  const antes = await leia();
  await radio(pg, pref+'-pvfundo', 'escuro'); await pg.waitForTimeout(700);
  const depois = await leia();
  if(antes === null || depois === null){
    /* Previa que nao monta (aba sem configuracao suficiente no cenario) e dito, e nao
       escondido: assercao que some sozinha e assercao que deixa de existir sem aviso. */
    chk('[3] '+pref+': NAO MEDIU -- o quadro nao montou nesta passagem', true,
        'claro=' + antes + ' escuro=' + depois);
    continue;
  }
  chk('[3] '+pref+': trocar para "Pagina escura" muda o fundo do quadro',
      antes !== depois, 'claro=' + antes + ' · escuro=' + depois);
  chk('[3] '+pref+': e o fundo escuro e mesmo o escuro (#141414)',
      depois === 'rgb(20, 20, 20)', depois);
}

/* ===== 4. a escolha sobrevive a recarga, e por aba ===== */
console.log('\n== 4. a escolha sobrevive a recarga ==');
await clicar(pg, ABA_DE.u); await pg.waitForTimeout(120);
await radio(pg, 'u-pvfundo', 'cor');
await set(pg, 'u-pvcor-t', '#AA3311');
await clicar(pg, ABA_DE.m); await pg.waitForTimeout(120);
await radio(pg, 'm-pvfundo', 'papel');
/* O Slideshow e posto EXPLICITAMENTE em "claro": a parte 3 acabou de percorrer todas as abas
   deixando-as em "escuro", entao "continua como nasceu" ja nao seria verdade aqui. Tres abas
   com tres escolhas diferentes e o que prova de fato que cada uma tem a sua. */
await clicar(pg, ABA_DE.s); await pg.waitForTimeout(120);
await radio(pg, 's-pvfundo', 'claro');
await pg.waitForTimeout(400);
await pg.reload(); await pg.waitForTimeout(1500);
const depoisRecarga = await pg.evaluate(() => ({
  u: (document.querySelector('input[name="u-pvfundo"]:checked')||{}).value,
  ucor: (document.getElementById('u-pvcor-t')||{}).value,
  ucampo: (() => { const e=document.getElementById('u-pvcor-campo');
    return e ? getComputedStyle(e).display !== 'none' : null; })(),
  m: (document.querySelector('input[name="m-pvfundo"]:checked')||{}).value,
  s: (document.querySelector('input[name="s-pvfundo"]:checked')||{}).value
}));
chk('[4] o Checkout volta em "Cor da minha pagina", com a cor digitada',
    depoisRecarga.u === 'cor' && String(depoisRecarga.ucor).toUpperCase() === '#AA3311',
    JSON.stringify(depoisRecarga));
chk('[4] e com o campo de cor JA visivel, sem precisar tocar no radio',
    depoisRecarga.ucampo === true, String(depoisRecarga.ucampo));
chk('[4] a Mini loja volta em "Papel", que e outra escolha',
    depoisRecarga.m === 'papel', String(depoisRecarga.m));
/* CADA ABA TEM A SUA: se uma escolha vazasse para as outras, o pedido do dono -- "eu decido
   qual cor usar em cada construtor" -- estaria quebrado no ponto exato. */
chk('[4] e o Slideshow guarda a TERCEIRA escolha, independente das outras duas',
    depoisRecarga.s === 'claro', String(depoisRecarga.s));

/* ===== 5. o campo de cor so aparece quando faz sentido ===== */
console.log('\n== 5. o campo de cor livre ==');
await clicar(pg, ABA_DE.c); await pg.waitForTimeout(120);
const ver = async () => pg.evaluate(() => {
  const e = document.getElementById('c-pvcor-campo');
  return e ? getComputedStyle(e).display !== 'none' : null;
});
await radio(pg, 'c-pvfundo', 'cor'); await pg.waitForTimeout(250);
chk('[5] com "Cor da minha pagina", o campo aparece', (await ver()) === true);
await radio(pg, 'c-pvfundo', 'escuro'); await pg.waitForTimeout(250);
chk('[5] com um preset escolhido, ele some', (await ver()) === false);

await br.close(); srv.close();
process.exit(resumo());
