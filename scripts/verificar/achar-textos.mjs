/* ============================================================================
   ACHAR UM TEXTO -- a busca da ferramenta e o eco do texto nos rotulos
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. A regressao (regressao.sh) prova que o TEXTO
   gerado nao mudou -- e nesta rodada ele nao podia mudar mesmo, por contrato:
   isto e interface. O que ela nao alcanca e justamente o que a rodada entregou.

   E o que a rodada entregou conserta um defeito de DESCOBERTA, nao de geracao:
   em 11/09/2026 o dono quis mudar o texto "Sem opcional" que o cliente le,
   procurou na ferramenta, NAO ACHOU, e pediu que o texto virasse configuravel
   -- sendo que ele ja era (u-txt-semopcional) e funcionava. Defeito assim nao
   aparece em nenhuma saida de gerador: a ferramenta estava certa e o operador
   nao conseguia chegar nela.

   AS SETE PROVAS:

     1. O CASO DO DONO, PONTA A PONTA. Da aba Slideshow, com a secao de textos
        do Checkout RECOLHIDA, procurar "Sem opcional" e chegar ao campo
        visivel, destacado e FORA de baixo da barra grudada no topo. Sem esta
        prova a rodada nao entrega.

     2. A NEGATIVA FALSA, PROVADA QUE NAO ACONTECE. 68 campos de texto que o
        cliente le estao FORA das tabelas *_TXT_DEFS. Uma busca apoiada nas
        tabelas diria "nao encontrado" sobre coisa que existe -- e negativa
        falsa e pior que nao ter busca, porque o operador acredita nela. Esta
        prova procura texto de varios desses campos.

     3. ACENTO E CAIXA. "sem opcional", "SEM OPCIONAL" e "Sem Opcional" acham o
        mesmo campo; e texto COM acento no valor e achado por busca SEM acento.

     4. A BUSCA NAO ALTERA NADA. O estado gravado depois de usa-la e igual,
        caractere por caractere, ao de antes.

     5. O ECO MOSTRA O VALOR ATUAL. Mudar o texto muda o rotulo -- e o
        qualificador que o rotulo ja tinha continua la, depois do texto.

     6. A FORMA DO ECO. Frase longa entra cortada na ultima palavra inteira,
        com reticencia; rotulo que ja diz o texto inteiro nao o repete.

     7. OS CAMPOS QUE NAO TINHAM ROTULO PROPRIO agora tem.

   Roda com:  node scripts/verificar/achar-textos.mjs
   ============================================================================ */
import { navegador, servir, abrir, set, radio, clicar, ler } from './lib.mjs';
import { chk, resumo } from './pagina.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORTA = 8847;

/* Digita na busca do jeito que o teclado digita: input dispara a procura. */
async function procurar(pg, texto){
  await pg.evaluate(t => {
    const e = document.getElementById('fcs-q');
    e.value = t;
    e.dispatchEvent(new Event('input', {bubbles:true}));
  }, texto);
  return await achados(pg);
}
const achados = pg => pg.evaluate(() => {
  const its = Array.prototype.slice.call(document.querySelectorAll('#fcs-res .fcs-item'));
  return {
    conta: document.getElementById('fcs-conta').textContent,
    aberta: document.getElementById('fcs-res').className.indexOf('aberta') >= 0,
    vazio: !!document.querySelector('#fcs-res .fcs-vazio'),
    itens: its.map(b => ({
      id: b.getAttribute('data-id'),
      rot: b.querySelector('.fcs-rot').textContent,
      val: b.querySelector('.fcs-val').textContent,
      onde: b.querySelector('.fcs-onde').textContent
    }))
  };
});
const ids = r => r.itens.map(i => i.id);
/* Clica no resultado daquele campo -- pelo id, e nao pela posicao: a ordem e
   parte do que esta sendo medido e nao pode ser tambem o modo de chegar la. */
const escolher = (pg, id) => pg.evaluate(i => {
  const b = document.querySelector('#fcs-res .fcs-item[data-id="' + i + '"]');
  if(!b) throw new Error('sem resultado para ' + i);
  b.click();
}, id);

/* O que interessa saber sobre o campo DEPOIS de a busca levar ate ele. */
const situacao = (pg, id) => pg.evaluate(i => {
  const e = document.getElementById(i);
  const barra = document.querySelector('.fcg-fixa');
  const r = e.getBoundingClientRect();
  let painel = e, secao = null;
  while(painel && painel !== document.body && !(painel.className || '').split(' ').includes('painel')) painel = painel.parentNode;
  let no = e;
  while(no && no.nodeType === 1){ if(String(no.className || '').indexOf('fcd-oculto') >= 0){ secao = no.id; break; } no = no.parentNode; }
  return {
    visivel: e.offsetParent !== null,
    destacado: e.classList.contains('fcs-alvo'),
    focado: document.activeElement === e,
    abaAtiva: painel ? (painel.className || '').split(' ').includes('ativo') : false,
    aba: painel ? painel.id : null,
    dentroDeSecaoRecolhida: secao,
    topo: Math.round(r.top),
    alturaBarra: barra ? Math.round(barra.offsetHeight) : 0,
    dentroDaJanela: r.top >= 0 && r.bottom <= window.innerHeight,
    listaFechada: document.getElementById('fcs-res').className.indexOf('aberta') < 0
  };
}, id);

const recolhida = (pg, id) => pg.evaluate(i => {
  const e = document.getElementById(i);
  return !!e && String(e.className).indexOf('fcd-oculto') >= 0;
}, id);
const estado = pg => pg.evaluate(() => localStorage.getItem('fcConstrutores'));
const rotuloDe = (pg, id) => pg.evaluate(i => {
  const e = document.getElementById(i);
  const l = (e && e.labels && e.labels[0]) || null;
  return l ? String(l.textContent).replace(/\s+/g, ' ').trim() : null;
}, id);
/* Quantos campos de texto existem nas abas -- CONTADOS AQUI, pelo DOM, e nao
   perguntando a ferramenta. O script dela vive dentro de uma IIFE e nada seu e
   alcancavel de fora; e ainda que fosse, quem monta a lista nao pode ser tambem
   a testemunha de que a lista esta completa.
   O corte "nas tabelas" e por id (as oito *_TXT_DEFS usam '-txt-' no id de cada
   campo); e uma aproximacao declarada, e serve so para dimensionar o achado que
   originou a rodada: quantos campos de texto ficam FORA delas. */
const TIPOS = ['text', 'url', 'tel', 'email', 'search', 'number', 'date', 'time', 'textarea'];
const inventario = pg => pg.evaluate(tipos => {
  const out = [];
  document.querySelectorAll('.painel').forEach(p => {
    p.querySelectorAll('input,textarea').forEach(e => {
      if(tipos.indexOf(e.type) < 0) return;
      if(e.readOnly) return;
      if(e.getAttribute('data-fcs') === 'nao') return;
      out.push(e.id || '(sem id)');
    });
  });
  return {
    total: out.length,
    nasTabelas: out.filter(i => i.indexOf('-txt-') >= 0).length,
    foraDasTabelas: out.filter(i => i.indexOf('-txt-') < 0).length
  };
}, TIPOS);

const srv = await servir(RAIZ, PORTA);
const br = await navegador();
const pg = await abrir(br, 'http://127.0.0.1:' + PORTA);
try{
  /* AQUECIMENTO: passa por todas as abas uma vez e volta. Abrir uma aba corrige
     numeros fora da faixa e remonta previa -- coisas que gravam estado. Sem
     isto, a prova 4 mediria a conta dessas correcoes e a atribuiria a busca. */
  const abas = await pg.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.abas .aba'), b => b.id.replace(/^aba-/, '')));
  for(const a of abas) await clicar(pg, 'aba-' + a);
  await clicar(pg, 'aba-slide');
  await pg.waitForTimeout(300);

  const inv = await inventario(pg);
  console.log('\ncampos de texto nas abas: ' + inv.total +
    '  (com "-txt-" no id, das oito tabelas: ' + inv.nasTabelas +
    ' | fora delas: ' + inv.foraDasTabelas + ')');

  /* =======================================================================
     PROVA 1 -- o caso do dono, ponta a ponta
     ======================================================================= */
  console.log('\n[1] o caso do dono: de outra aba, com a secao recolhida');
  chk('partida: a aba aberta e a Slideshow, e nao a do campo procurado',
    (await pg.evaluate(() => document.getElementById('painel-slide').className.indexOf('ativo') >= 0)), 'aba errada na partida');
  chk('partida: a secao de textos do Checkout esta RECOLHIDA (display:none)',
    await recolhida(pg, 'u-txt-corpo'), 'a secao ja estava aberta -- a prova nao mediria nada');
  chk('partida: o campo esta invisivel para o Ctrl+F do navegador',
    (await pg.evaluate(() => document.getElementById('u-txt-semopcional').offsetParent === null)), 'o campo estava visivel');

  const r1 = await procurar(pg, 'Sem opcional');
  chk('a busca achou o campo do Checkout', ids(r1).includes('u-txt-semopcional'), 'achou: ' + ids(r1).join(', '));
  chk('e achou tambem o gemeo da Mini loja (mesmo texto, outra aba)',
    ids(r1).includes('m-txt-semopcional'), 'achou: ' + ids(r1).join(', '));
  const it1 = r1.itens.find(i => i.id === 'u-txt-semopcional');
  chk('o resultado diz ONDE esta: aba e secao', /Checkout.*Textos que o cliente l/.test(it1.onde), 'onde: ' + it1.onde);
  chk('o resultado mostra o valor atual entre aspas', /Sem opcional/.test(it1.val), 'valor: ' + it1.val);

  await escolher(pg, 'u-txt-semopcional');
  await pg.waitForTimeout(150);
  const s1 = await situacao(pg, 'u-txt-semopcional');
  chk('levou a aba certa', s1.aba === 'painel-uni' && s1.abaAtiva, JSON.stringify(s1));
  chk('EXPANDIU a secao recolhida', s1.dentroDeSecaoRecolhida === null, 'ainda dentro de: ' + s1.dentroDeSecaoRecolhida);
  chk('o campo esta VISIVEL', s1.visivel, JSON.stringify(s1));
  chk('o campo esta DESTACADO', s1.destacado, JSON.stringify(s1));
  chk('o campo recebeu o foco (da para digitar sem clicar)', s1.focado, JSON.stringify(s1));
  chk('e nao ficou debaixo da barra grudada no topo', s1.topo > s1.alturaBarra,
    'topo do campo: ' + s1.topo + ' | altura da barra: ' + s1.alturaBarra);
  chk('o campo esta dentro da janela', s1.dentroDaJanela, JSON.stringify(s1));
  chk('a lista de resultados se fechou ao escolher', s1.listaFechada, JSON.stringify(s1));
  chk('o cabecalho da secao passou a dizer "esconder"',
    (await pg.evaluate(() => document.querySelector('#u-txt-cab .secao-dobra-seta').textContent)) === 'esconder',
    'seta: ' + (await pg.evaluate(() => document.querySelector('#u-txt-cab .secao-dobra-seta').textContent)));
  chk('e o aria-expanded acompanhou',
    (await pg.evaluate(() => document.getElementById('u-txt-cab').getAttribute('aria-expanded'))) === 'true', 'aria errado');
  chk('o VALOR do campo nao foi tocado', (await ler(pg, 'u-txt-semopcional')) === 'Sem opcional',
    'campo: ' + (await ler(pg, 'u-txt-semopcional')));

  /* =======================================================================
     PROVA 2 -- os 68 campos FORA das tabelas
     ======================================================================= */
  console.log('\n[2] os campos fora das tabelas *_TXT_DEFS (a negativa falsa)');
  const fora = [
    ['Restante na entrega', 'u-t9',       'Checkout'],
    ['MAIS ESCOLHIDO',      'b-selo-txt', 'Bordas com efeito'],
    ['Estava olhando a p',  'l-m3',       'Capta'],
    ['nenhuma cobran',      'p-t5',       'Link de cobran'],
    ['Quero garantir',      'c-ctatxt',   'Contagem regressiva'],
    ['Voltar para a vitrine','m-t11',     'Mini loja'],
    ['a data e o hor',      'a-ob-fb-quando', 'Agendamento por pacote'],
    ['seu agendamento',     't-ob-fb-tipo',  'Agendamento TidyCal']
  ];
  for(const [texto, id, aba] of fora){
    const r = await procurar(pg, texto);
    const ok = ids(r).includes(id);
    const it = r.itens.find(i => i.id === id);
    chk('"' + texto + '" acha ' + id + ' (fora das tabelas)', ok, 'achou: ' + ids(r).join(', ') || 'nada');
    if(ok) chk('  ... e diz que ele esta na aba certa', it.onde.indexOf(aba) === 0, 'onde: ' + it.onde);
  }
  /* E o pior caso dos que nao tinham rotulo proprio: agora e achavel pelos dois lados. */
  const rH = await procurar(pg, 'Sufixo das horas');
  chk('campo sem rotulo proprio ate hoje e achado pelo ROTULO novo (c-txt-suf-h)',
    ids(rH).includes('c-txt-suf-h'), 'achou: ' + ids(rH).join(', '));

  /* A saida gerada NAO entra na busca -- ela e resultado, nao destino. */
  await clicar(pg, 'aba-uni');
  await clicar(pg, 'u-gerar');
  await pg.waitForTimeout(200);
  const rOut = await procurar(pg, 'Sem opcional');
  chk('o codigo gerado (readonly) fica FORA da busca', !ids(rOut).includes('u-out'), 'achou: ' + ids(rOut).join(', '));
  chk('e o campo de verdade continua la', ids(rOut).includes('u-txt-semopcional'), 'achou: ' + ids(rOut).join(', '));

  /* =======================================================================
     PROVA 3 -- acento e caixa
     ======================================================================= */
  console.log('\n[3] acento e caixa nao atrapalham');
  const a1 = ids(await procurar(pg, 'sem opcional'));
  const a2 = ids(await procurar(pg, 'SEM OPCIONAL'));
  const a3 = ids(await procurar(pg, 'Sem Opcional'));
  chk('"sem opcional" e "SEM OPCIONAL" dao o mesmo conjunto', JSON.stringify(a1) === JSON.stringify(a2), a1 + ' | ' + a2);
  chk('"Sem Opcional" da o mesmo conjunto', JSON.stringify(a1) === JSON.stringify(a3), a1 + ' | ' + a3);
  chk('e os tres incluem o campo do dono', a1.includes('u-txt-semopcional'), a1.join(', '));

  const ac1 = ids(await procurar(pg, 'codigo copiado'));
  chk('busca SEM acento acha valor COM acento ("Código copiado!")',
    ac1.includes('p-txt-copiado'), 'achou: ' + ac1.join(', '));
  const ac2 = ids(await procurar(pg, 'CÓDIGO COPIADO'));
  chk('e busca COM acento e caixa alta acha o mesmo', ac2.includes('p-txt-copiado'), 'achou: ' + ac2.join(', '));
  const ac3 = ids(await procurar(pg, 'promocao encerrada'));
  chk('sem cedilha acha "Promoção encerrada" (c-fimtxt)', ac3.includes('c-fimtxt'), 'achou: ' + ac3.join(', '));

  /* Nada que nao existe: a negativa, quando e verdadeira, e dita como negativa. */
  const nada = await procurar(pg, 'zzqqxx nao existe em lugar nenhum');
  chk('texto que nao existe: a busca diz que nao achou', nada.vazio && nada.itens.length === 0, 'itens: ' + nada.itens.length);
  chk('e o contador diz "nenhum resultado"', nada.conta === 'nenhum resultado', 'conta: ' + nada.conta);

  /* O teclado: quem digita nao devia precisar do mouse para escolher. */
  console.log('\n[3b] o teclado: setas, Enter e Escape');
  await clicar(pg, 'aba-slide');
  const rEnter = await procurar(pg, 'Nossa loja');
  const primeiro = ids(rEnter)[0];
  await pg.focus('#fcs-q');
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(150);
  const sEnter = await situacao(pg, primeiro);
  chk('Enter sem seta nenhuma leva ao PRIMEIRO resultado (' + primeiro + ')',
    sEnter.visivel && sEnter.destacado && sEnter.abaAtiva && sEnter.focado, JSON.stringify(sEnter));

  await clicar(pg, 'aba-slide');
  await procurar(pg, 'Copiar codigo Pix');
  await pg.focus('#fcs-q');
  await pg.keyboard.press('ArrowDown');
  await pg.keyboard.press('ArrowDown');
  const segundo = await pg.evaluate(() => {
    const its = document.querySelectorAll('#fcs-res .fcs-item');
    return {sel: document.querySelector('#fcs-res .fcs-item.sel').getAttribute('data-id'),
            esperado: its[1].getAttribute('data-id')};
  });
  chk('duas setas para baixo marcam o segundo resultado', segundo.sel === segundo.esperado,
    'marcado: ' + segundo.sel + ' | segundo da lista: ' + segundo.esperado);
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(150);
  const sSeta = await situacao(pg, segundo.esperado);
  chk('e o Enter leva ao que estava marcado', sSeta.visivel && sSeta.destacado, JSON.stringify(sSeta));

  await procurar(pg, 'Copiar codigo Pix');
  await pg.focus('#fcs-q');
  await pg.keyboard.press('Escape');
  chk('Escape fecha a lista sem sair do lugar',
    await pg.evaluate(() => document.getElementById('fcs-res').className.indexOf('aberta') < 0), 'a lista continuou aberta');

  /* =======================================================================
     PROVA 3c -- o campo que outra OPCAO da aba esconde
     -----------------------------------------------------------------------
     Achado ao escrever este arquivo: "Quero garantir" (c-ctatxt) vive dentro de
     #c-cta-campos, que o cToggles esconde com style.display quando o botao de
     acao esta desligado. Abrir a aba e expandir a secao nao bastam -- e a busca
     estava entregando o operador num campo invisivel dizendo que tinha chegado,
     que e a mesma mentira silenciosa que ela veio consertar.
     ======================================================================= */
  console.log('\n[3c] o campo que outra opcao da aba esconde');
  await clicar(pg, 'aba-slide');
  const rCta = await procurar(pg, 'Quero garantir');
  chk('a busca ACHA o campo mesmo com a opcao desligada', ids(rCta).includes('c-ctatxt'),
    'achou: ' + ids(rCta).join(', '));
  await escolher(pg, 'c-ctatxt');
  await pg.waitForTimeout(150);
  const sCta = await situacao(pg, 'c-ctatxt');
  chk('levou a aba certa mesmo assim', sCta.aba === 'painel-cnt' && sCta.abaAtiva, JSON.stringify(sCta));
  chk('NAO diz que chegou: o campo escondido nao fica destacado', !sCta.destacado, JSON.stringify(sCta));
  const recado = await pg.evaluate(() => ({
    txt: document.getElementById('fcs-conta').textContent,
    alerta: document.getElementById('fcs-conta').className.indexOf('alerta') >= 0
  }));
  chk('e DIZ por que, em destaque', recado.alerta && /outra op..o desta aba o est. escondendo/.test(recado.txt),
    'recado: ' + JSON.stringify(recado));
  const perto = await pg.evaluate(() => {
    const a = document.querySelector('.fcs-alvo');
    return a ? {id: a.id, visivel: a.offsetParent !== null, contemOCampo: a.contains(document.getElementById('c-ctatxt'))} : null;
  });
  chk('o destaque parou no container VISIVEL que contem o campo',
    !!perto && perto.visivel && perto.contemOCampo, JSON.stringify(perto));
  /* Ligando a opcao, a busca leva ate o campo como em qualquer outro. */
  await radio(pg, 'c-cta', 'sim');
  await pg.waitForTimeout(100);
  await clicar(pg, 'aba-slide');
  await procurar(pg, 'Quero garantir');
  await escolher(pg, 'c-ctatxt');
  await pg.waitForTimeout(150);
  const sCta2 = await situacao(pg, 'c-ctatxt');
  chk('com a opcao ligada, chega ao campo visivel e destacado',
    sCta2.visivel && sCta2.destacado && sCta2.focado, JSON.stringify(sCta2));
  await radio(pg, 'c-cta', 'nao');
  await pg.waitForTimeout(100);

  /* =======================================================================
     PROVA 4 -- a busca nao altera nada
     ======================================================================= */
  console.log('\n[4] a busca nao altera valor nenhum');
  await pg.evaluate(() => { document.getElementById('fcs-q').value = ''; document.getElementById('fcs-q').dispatchEvent(new Event('input', {bubbles:true})); });
  await clicar(pg, 'aba-slide');
  await pg.waitForTimeout(200);
  const st0 = await estado(pg);

  await procurar(pg, 'Sem opcional');
  await escolher(pg, 'm-txt-semopcional');
  await pg.waitForTimeout(150);
  await procurar(pg, 'nenhuma cobran');
  await escolher(pg, 'p-t5');
  await pg.waitForTimeout(150);
  await procurar(pg, 'Restante na entrega');
  await escolher(pg, 'u-t9');
  await pg.waitForTimeout(150);
  await clicar(pg, 'fcs-limpar');
  await clicar(pg, 'aba-slide');
  await pg.waitForTimeout(300);
  const st1 = await estado(pg);
  chk('o estado gravado e identico, caractere por caractere', st0 === st1,
    st0 === st1 ? '' : 'antes ' + String(st0).length + ' caracteres, depois ' + String(st1).length);

  /* =======================================================================
     PROVA 5 -- o eco mostra o VALOR ATUAL
     ======================================================================= */
  console.log('\n[5] o rotulo mostra o texto que o campo controla, e acompanha');
  const rot0 = await rotuloDe(pg, 'u-txt-semopcional');
  chk('o rotulo de fabrica traz o texto entre aspas', /“Sem opcional”/.test(rot0), 'rotulo: ' + rot0);
  chk('e o qualificador que ele ja tinha continua la, depois do texto',
    /“Sem opcional” · s[oó] no modo/.test(rot0), 'rotulo: ' + rot0);
  chk('num <small> so, e nao em dois', (await pg.evaluate(() =>
    document.querySelector('label[for="u-txt-semopcional"]').getElementsByTagName('small').length)) === 1, 'small demais');

  await set(pg, 'u-txt-semopcional', 'Prefiro sem nenhum extra');
  const rot1 = await rotuloDe(pg, 'u-txt-semopcional');
  chk('mudou o texto: o rotulo passou a mostrar o novo', /“Prefiro sem nenhum extra”/.test(rot1), 'rotulo: ' + rot1);
  chk('e nao mostra mais o antigo', rot1.indexOf('Sem opcional') < 0, 'rotulo: ' + rot1);
  const novoAchado = ids(await procurar(pg, 'Prefiro sem nenhum extra'));
  chk('e a busca acha o campo pelo texto NOVO', novoAchado.includes('u-txt-semopcional'), 'achou: ' + novoAchado.join(', '));
  await set(pg, 'u-txt-semopcional', 'Sem opcional');
  chk('voltando ao texto de fabrica, o rotulo volta junto',
    /“Sem opcional”/.test(await rotuloDe(pg, 'u-txt-semopcional')), 'rotulo: ' + (await rotuloDe(pg, 'u-txt-semopcional')));

  /* =======================================================================
     PROVA 6 -- a forma do eco
     ======================================================================= */
  console.log('\n[6] a forma do eco: corte, reticencia e o que nao se repete');
  const longo = await rotuloDe(pg, 'u-txt-pix-instrucao');
  const valLongo = await ler(pg, 'u-txt-pix-instrucao');
  const trecho = /“([^”]*)”/.exec(longo);
  chk('frase longa (' + valLongo.length + ' caracteres) entra CORTADA no rotulo',
    !!trecho && trecho[1].length <= 46, 'no rotulo: ' + JSON.stringify(trecho && trecho[1]));
  chk('  ... com reticencia no fim', !!trecho && /…$/.test(trecho[1]), 'no rotulo: ' + JSON.stringify(trecho && trecho[1]));
  chk('  ... cortada em palavra inteira (o comeco da frase esta la)',
    !!trecho && valLongo.indexOf(trecho[1].replace(/…$/, '')) === 0, 'no rotulo: ' + JSON.stringify(trecho && trecho[1]));

  const curto = await rotuloDe(pg, 'u-txt-cupom-botao');
  chk('rotulo que JA diz o texto inteiro nao o repete (u-txt-cupom-botao = "Aplicar")',
    curto.indexOf('“') < 0, 'rotulo: ' + curto);
  const sufD = await rotuloDe(pg, 'c-txt-suf-d');
  chk('e uma letra solta NAO e dada como ja presente por causa de "dias"',
    /“d”/.test(sufD), 'rotulo: ' + sufD);
  const conector = await rotuloDe(pg, 't-txt-ob-conector-data');
  chk('texto que e so espaco e uma palavra sai sem os espacos das pontas',
    /“de”/.test(conector), 'rotulo: ' + conector);

  /* =======================================================================
     PROVA 7 -- os campos que nao tinham rotulo proprio
     ======================================================================= */
  console.log('\n[7] os campos que nao tinham rotulo proprio');
  for(const id of ['c-txt-suf-h', 'c-txt-suf-m', 'c-txt-suf-s', 'c-rh', 'c-rm', 'c-rs']){
    const r = await pg.evaluate(i => {
      const l = document.querySelector('label[for="' + i + '"]');
      return l ? String(l.textContent).replace(/\s+/g, ' ').trim() : null;
    }, id);
    chk(id + ' tem rotulo proprio', !!r, 'rotulo: ' + r);
  }

  chk('nenhum erro de console na passagem inteira', pg.erros.length === 0, pg.erros.join(' | '));
} finally {
  await pg.close();
  await br.close();
  srv.close();
}
process.exit(resumo());
