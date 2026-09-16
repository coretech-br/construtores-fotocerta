/* ============================================================================
   AS EXPLICACOES RECOLHIVEIS ESCONDEM O QUE NAO DEVIAM?
   ============================================================================
   O PEDIDO do dono (16/09/2026): as caixas de orientacao sao excelentes no inicio
   do uso e poluem o dia a dia. A resposta foi um interruptor na barra do topo que
   recolhe cada CORRIDA de caixas numa linha com lampada, aberta por CLIQUE.

   O QUE ESTA PROVA EXISTE PARA IMPEDIR. Recolher e esconder, e esconder a caixa
   errada troca defeito visivel por invisivel -- exatamente o que este projeto ja
   recusou no limiar de urgencia e no desconto do Pix com sinal. Tres familias de
   caixa NUNCA podem ser recolhidas, e cada uma por um motivo proprio:

     - as .ajuda.alerta, que dizem "com o sinal ligado este campo nao vale";
     - as que tem <button> dentro, porque esconder esconderia um controle;
     - as que tem id, porque o codigo ja as mostra e esconde conforme a
       configuracao, e um segundo mecanismo por cima do primeiro e onde a
       divergencia nasce;
     - as que tem campo dentro, porque a busca do topo leva a um campo.

   E o PADRAO tem de ser "mostrar sempre": ao publicar, nada muda na tela do dono
   ate ele virar a chave. Padrao que muda o que esta no ar sem ninguem pedir e o
   que a regressao existe para denunciar.

   SEM REFERENCIA CONGELADA: tudo e medido na arvore de hoje, nos dois estados do
   interruptor.

   ROTEIRO: node scripts/verificar/explicacoes.mjs
   ============================================================================ */
import { navegador, servir, abrir, clicar } from './lib.mjs';
import { chk, resumo } from './pagina.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const br = await navegador();
const srv = await servir(RAIZ, 8993);
const pg = await abrir(br, 'http://127.0.0.1:8993');

/* ---- 1. o agrupamento aconteceu, e nao engoliu o que nao devia ---- */
const g = await pg.evaluate(() => ({
  grupos: document.querySelectorAll('.fcaj-grupo').length,
  linhas: document.querySelectorAll('.fcaj-linha').length,
  dentro: document.querySelectorAll('.fcaj-grupo p.ajuda').length,
  fora: document.querySelectorAll('p.ajuda:not(.fcaj-grupo p)').length,
  alerta: document.querySelectorAll('.fcaj-grupo p.ajuda.alerta').length,
  botao: document.querySelectorAll('.fcaj-grupo p.ajuda button').length,
  campo: document.querySelectorAll('.fcaj-grupo p.ajuda input,.fcaj-grupo p.ajuda select,.fcaj-grupo p.ajuda textarea').length,
  comId: [].slice.call(document.querySelectorAll('.fcaj-grupo p.ajuda')).filter(e => e.id).length,
  linhaPorGrupo: document.querySelectorAll('.fcaj-linha + .fcaj-grupo').length
}));
chk('[1] as explicações foram agrupadas', g.grupos > 100, String(g.grupos));
chk('[1] uma linha-resumo por grupo, e a linha vem ANTES dele',
    g.linhas === g.grupos && g.linhaPorGrupo === g.grupos,
    g.linhas + ' linhas, ' + g.grupos + ' grupos, ' + g.linhaPorGrupo + ' na ordem certa');
chk('[1] NENHUM alerta âmbar foi recolhido', g.alerta === 0, String(g.alerta));
chk('[1] NENHUMA caixa com botão dentro foi recolhida', g.botao === 0, String(g.botao));
chk('[1] NENHUMA caixa com campo dentro foi recolhida', g.campo === 0, String(g.campo));
chk('[1] NENHUMA caixa que o código mostra/esconde foi recolhida', g.comId === 0, String(g.comId));
chk('[1] e sobrou explicação fora dos grupos, que é o esperado', g.fora > 50, String(g.fora));

/* ---- 2. NASCE MOSTRANDO TUDO ---- */
const inicio = await pg.evaluate(() => ({
  off: document.body.className.indexOf('fcaj-off') >= 0,
  visivel: getComputedStyle(document.querySelector('.fcaj-grupo')).display,
  linha: getComputedStyle(document.querySelector('.fcaj-linha')).display,
  rotulo: (document.getElementById('fcaj-botao') || {}).textContent
}));
chk('[2] nasce em "mostrar sempre"', inicio.off === false, String(inicio.off));
chk('[2] com o grupo visível e a linha-resumo escondida',
    inicio.visivel !== 'none' && inicio.linha === 'none',
    'grupo=' + inicio.visivel + ' linha=' + inicio.linha);
chk('[2] e o interruptor diz o estado', /^Explicações$/.test(String(inicio.rotulo).trim()),
    JSON.stringify(inicio.rotulo));

/* ---- 3. o interruptor recolhe ---- */
await clicar(pg, 'fcaj-botao');
await pg.waitForTimeout(200);
const off = await pg.evaluate(() => ({
  off: document.body.className.indexOf('fcaj-off') >= 0,
  grupo: getComputedStyle(document.querySelector('.fcaj-grupo')).display,
  linha: getComputedStyle(document.querySelector('.fcaj-linha')).display,
  /* o alerta continua na tela: ele nunca entrou em grupo nenhum */
  alertaVisivel: (() => {
    const a = document.querySelector('p.ajuda.alerta:not([style*="display: none"])');
    return a ? getComputedStyle(a).display !== 'none' : null;
  })()
}));
chk('[3] o interruptor recolhe', off.off === true);
chk('[3] o grupo some e a linha-resumo aparece',
    off.grupo === 'none' && off.linha !== 'none',
    'grupo=' + off.grupo + ' linha=' + off.linha);
chk('[3] e o alerta âmbar continua na tela', off.alertaVisivel !== false, String(off.alertaVisivel));

/* ---- 4. o clique abre SÓ aquele grupo ---- */
const umSo = await pg.evaluate(() => {
  const bt = document.querySelector('.fcaj-linha .fcaj-bt');
  bt.click();
  return {
    abertos: document.querySelectorAll('.fcaj-grupo.fcaj-aberto').length,
    visivel: getComputedStyle(document.querySelector('.fcaj-grupo.fcaj-aberto')).display,
    aria: bt.getAttribute('aria-expanded')
  };
});
chk('[4] o clique abre um grupo só', umSo.abertos === 1, String(umSo.abertos));
chk('[4] e ele fica visível', umSo.visivel !== 'none', umSo.visivel);
chk('[4] com o estado anunciado para o leitor de tela', umSo.aria === 'true', String(umSo.aria));
const fechou = await pg.evaluate(() => {
  document.querySelector('.fcaj-linha .fcaj-bt').click();
  return document.querySelectorAll('.fcaj-grupo.fcaj-aberto').length;
});
chk('[4] e o segundo clique fecha', fechou === 0, String(fechou));

/* ---- 5. A BUSCA CONTINUA CHEGANDO AO CAMPO com tudo recolhido ---- */
/* A busca procura no valor, no rótulo e no id -- nunca no texto de ajuda. Recolher
   não podia atrapalhá-la, e é isso que se cobra aqui, com o interruptor DESLIGADO. */
const busca = await pg.evaluate(async () => {
  const cx = document.getElementById('fcs-q');
  if (!cx) return {erro: 'sem campo de busca'};
  cx.value = 'Sem opcional';
  cx.dispatchEvent(new Event('input', {bubbles: true}));
  await new Promise(r => setTimeout(r, 400));
  const itens = document.querySelectorAll('#fcs-res [role="option"], #fcs-res button, #fcs-res .fcs-item');
  if (!itens.length) return {achou: 0};
  itens[0].click();
  await new Promise(r => setTimeout(r, 600));
  const alvo = document.getElementById('u-txt-semopcional');
  return {
    achou: itens.length,
    campoExiste: !!alvo,
    visivel: alvo ? getComputedStyle(alvo).display !== 'none' && alvo.offsetParent !== null : false
  };
});
chk('[5] a busca acha o campo com as explicações recolhidas', (busca.achou || 0) > 0,
    JSON.stringify(busca));
chk('[5] e o campo fica alcançável', busca.visivel === true, JSON.stringify(busca));

/* ---- 6. a preferência sobrevive à recarga ---- */
await pg.reload();
await pg.waitForTimeout(1200);
const depois = await pg.evaluate(() => ({
  off: document.body.className.indexOf('fcaj-off') >= 0,
  grupos: document.querySelectorAll('.fcaj-grupo').length,
  /* IDEMPOTENCIA: dois grupos aninhados denunciariam agrupamento em cima de agrupamento */
  aninhados: document.querySelectorAll('.fcaj-grupo .fcaj-grupo').length
}));
chk('[6] a escolha sobrevive à recarga', depois.off === true, String(depois.off));
chk('[6] e o agrupamento não se repete (nenhum grupo dentro de grupo)',
    depois.aninhados === 0, String(depois.aninhados));
chk('[6] com o mesmo número de grupos', depois.grupos === g.grupos,
    depois.grupos + ' contra ' + g.grupos);

/* ---- 7. e volta ao normal ---- */
await clicar(pg, 'fcaj-botao');
await pg.waitForTimeout(200);
const volta = await pg.evaluate(() => document.body.className.indexOf('fcaj-off') >= 0);
chk('[7] o interruptor devolve as explicações', volta === false, String(volta));
chk('[7] sem erro de console em nenhum dos estados', pg_erros().length === 0, pg_erros().slice(0,2).join(' | '));
function pg_erros(){ return pg.erros || []; }

await br.close(); srv.close();
/* O CODIGO DE SAIDA E O RESULTADO, e nao um zero por descuido (16/09/2026). Nove suites
   chamavam resumo() e saiam com 0 aconteca o que acontecesse -- e chave-pix-limpeza
   estava FALHANDO e anunciando sucesso. Qualquer script que rode a bateria e olhe o
   codigo de saida a via verde. E pior que vermelho permanente: vermelho que ninguem
   olha ainda esta la; verde falso apaga o defeito. */
process.exit(resumo());
