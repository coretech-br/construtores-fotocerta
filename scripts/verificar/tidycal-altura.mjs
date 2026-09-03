/* ============================================================================
   A ALTURA AUTOMATICA DO CALENDARIO, COM OS DOIS BLOCOS RODANDO
   ============================================================================
   O QUE ISTO PROVA, e por que a regressao nao alcanca. `regressao.sh` compara
   TEXTO gerado: um bloco que manda o aperto de mao errado, ou que aceita uma
   altura absurda, e texto perfeitamente coerente. O defeito que este arquivo
   existe para pegar e MUDO -- ate 03/09/2026 os dois blocos escutavam
   '[iFrameSizer]' sem NUNCA ter mandado o aperto de mao, e por isso nao
   recebiam sinal nenhum: o calendario de dominio proprio ficava nos 700px
   fixos e o da aba Agendamento por pacote nos 150px de fabrica do navegador,
   sem erro no console e sem nada na tela.

   A MEDICAO QUE ORIGINOU ISTO (03/09/2026, com o calendario real dentro de um
   iframe, rede liberada de proposito so para medir):

     sem aperto de mao        -> "[iFrameResizerChild]Ready"   e mais nada
     com o aperto de mao      -> "[iFrameSizer]fcm:75:1069:init"
                                 "[iFrameSizer]fcm:507:1069:mutationObserver"
                                 "[iFrameSizer]fcm:553:1069:mutationObserver"
                                 (celular de 375px: 716; janela de 700px: 770)
     formulario de reserva    -> "[iFrameSizer]fcm:0:0:scrollToOffset"
                                 e a altura anunciada NAO muda -- ele e
                                 sobreposicao. Por isso as alturas calibradas
                                 continuam existindo.

   OS SINAIS AQUI SAO TRANSCRICOES DESSA MEDICAO, e nao invencao. Eles chegam
   por `new MessageEvent(..., {origin})` -- `postMessage` sempre carimba a
   origem da propria pagina, e o filtro de origem dos dois blocos recusaria.
   E o mesmo caminho que `tidycal-origem.mjs` ja usa.

   OS TRES CASOS QUE A RODADA PEDIU, nos dois blocos:
     1. a altura ACOMPANHA o conteudo quando o sinal chega;
     2. fica na de partida quando o sinal NAO chega;
     3. valor fora da faixa [ALTURA_MINIMA, ALTURA_MAXIMA] nao passa.

   Rodar: node scripts/verificar/tidycal-altura.mjs
============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, clicar } from './lib.mjs';
import { preparar } from './cenario.mjs';

const PROPRIO      = 'https://agendamento.fotocerta.com.br/estudio-905-seg-a-sex-1-hora';
const PROPRIO_ORIG = 'https://agendamento.fotocerta.com.br';
const TIDY         = 'https://tidycal.com/fotocerta/natal-2026';
const TIDY_ORIG    = 'https://tidycal.com';

const PARTIDA  = '700px';    /* ALTURA_INICIAL / o height do iframe de dominio proprio */
const PISO     = '500px';    /* ALTURA_MINIMA */
const TETO     = '6000px';   /* ALTURA_MAXIMA */
const CALIBRADA= '2350px';   /* ALTURA_DESKTOP de fabrica das duas abas */

/* O aperto de mao, exatamente como foi medido saindo do embed.js do TidyCal. O que muda de
   uma geracao para outra e so o <id>, sorteado dentro do bloco.

   DESDE A UNIFICACAO DO CALENDARIO (03/09/2026) o metodo de calculo da altura deixou de ser
   um literal no meio da linha: ele vem de SIZER_METODO, que o interruptor MEDIR_FORMULARIO
   troca entre 'bodyOffset' (padrao, o que o TidyCal usa) e 'lowestElement' (o unico metodo
   que ENXERGA o formulario de reserva -- medido no mesmo dia, e registrado no cabecalho de
   fcTidyCalSrc, com o preco). Por isso a conferencia do bloco olha as DUAS metades da linha
   em vez de uma string inteira; o que roda dentro da pagina continua sendo a linha montada,
   com 'bodyOffset' no padrao de fabrica. */
const INIT_ANTES = ':8:false:false:32:true:true:null:';
const INIT_DEPOIS = ':null:null:0:false:parent:scroll:true';
const INIT_RESTO = INIT_ANTES + 'bodyOffset' + INIT_DEPOIS;
const temHandshake = bloco =>
  bloco.indexOf("var SIZER_METODO=MEDIR_FORMULARIO?'lowestElement':'bodyOffset';") >= 0 &&
  bloco.indexOf("var SIZER_INIT='" + INIT_ANTES + "'+SIZER_METODO+'" + INIT_DEPOIS + "';") >= 0;

/* A ESPIA DO APERTO DE MAO. O bloco fala com o filho por
   `iframe.contentWindow.postMessage(...)`; aqui o getter de `contentWindow` devolve um objeto
   que so anota o que passaria. E o mesmo espirito da sonda de `pac-quantidade.mjs`, que
   intercepta o `document.head.appendChild` do bloco: observar o que o bloco MANDA, sem mudar
   uma linha dele. Vai em `corpoAntes` porque precisa estar de pe antes de o bloco rodar. */
const ESPIA = '<scr'+'ipt>(function(){\n'
  + '  window.FC_HANDSHAKE = [];\n'
  + "  var d = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');\n"
  + "  Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', { configurable:true, get:function(){\n"
  + '    return { postMessage: function(m, o){ window.FC_HANDSHAKE.push({ m:String(m), o:String(o) }); } };\n'
  + '  }});\n'
  + '})();</scr'+'ipt>';

/* Um sinal do TidyCal, com a origem escolhida. */
const sinal = (pg, origem, texto) => pg.evaluate(
  ([o, t]) => window.dispatchEvent(new MessageEvent('message', { data: t, origin: o })),
  [origem, texto]);

const alturaDe = (pg, sel) => pg.$eval(sel, el => el.style.height || '');
const minAlturaDe = (pg, sel) => pg.$eval(sel, el => el.style.minHeight || '');
const soPageError = erros => erros.filter(e => e.indexOf('pageerror:') === 0);

/* A BATERIA DE ALTURAS, igual para os dois blocos: cada linha e
   [rotulo, texto do sinal, altura esperada DEPOIS dele]. A ordem importa -- os casos que
   nao devem mexer em nada sao conferidos contra a altura que o caso anterior deixou. */
function bateria(partida){
  return [
    ['init de 75px cai no piso',           '[iFrameSizer]fcm:75:1069:init',              PISO],
    ['507px do conteudo real',             '[iFrameSizer]fcm:507:1069:mutationObserver', '507px'],
    ['553px do conteudo real',             '[iFrameSizer]fcm:553:1069:mutationObserver', '553px'],
    ['716px do celular de 375px',          '[iFrameSizer]fcm:716:344:mutationObserver',  '716px'],
    ['50000px e absurdo: cai no teto',     '[iFrameSizer]fcm:50000:1:mutationObserver',  TETO],
    ['negativo nao mexe em nada',          '[iFrameSizer]fcm:-9:1:mutationObserver',     TETO],
    ['nao-numero nao mexe em nada',        '[iFrameSizer]fcm:abc:1:mutationObserver',    TETO],
    ['mouseenter (":0:0:") nao e altura',  '[iFrameSizer]fcm:0:0:mouseenter:186:970',    TETO],
    ['770px da janela de 700px',           '[iFrameSizer]fcm:770:669:mutationObserver',  '770px']
  ];
}

async function correrBateria(pg, sel, origem, rotulo){
  for(const [nome, texto, esperado] of bateria()){
    await sinal(pg, origem, texto);
    const h = await alturaDe(pg, sel);
    chk(rotulo + ': ' + nome, h === esperado, 'ficou ' + h + ', esperado ' + esperado);
  }
  /* O formulario de reserva: a altura anunciada nao muda (medido), mas a expansao calibrada
     precisa continuar acontecendo -- e ela e min-height, nao height. */
  await sinal(pg, origem, '[iFrameSizer]fcm:0:0:scrollToOffset');
  chk(rotulo + ': scrollToOffset nao mexe na altura medida', (await alturaDe(pg, sel)) === '770px');
  chk(rotulo + ': scrollToOffset AINDA expande pela altura calibrada',
      (await minAlturaDe(pg, sel)) === CALIBRADA, await minAlturaDe(pg, sel));
  /* Sinal da origem errada: descartado, inclusive a altura. */
  await sinal(pg, 'https://intruso.example.com', '[iFrameSizer]fcm:1234:1:mutationObserver');
  chk(rotulo + ': NEGATIVO -- altura vinda de outra origem e descartada',
      (await alturaDe(pg, sel)) === '770px', await alturaDe(pg, sel));
}

/* ------------------------------------------------ aba TidyCal, dominio proprio */
async function abaTidycalProprio(porta){
  const { valores, alertas } = await gerarNaFerramenta(async pg => {
    await clicar(pg, 'aba-tidy');
    await set(pg, 't-path', PROPRIO);
    await clicar(pg, 't-gerar');
  }, ['t-out1'], { porta });

  const bloco = valores['t-out1'];
  chk('t proprio: gerou sem recusa', !alertas.length && bloco.length > 500, alertas.join(' | '));
  chk('t proprio: o aperto de mao esta no bloco, com o formato medido', temHandshake(bloco));
  chk('t proprio: a faixa da guarda esta declarada no bloco',
      bloco.indexOf('var ALTURA_MINIMA=500;') >= 0 && bloco.indexOf('var ALTURA_MAXIMA=6000;') >= 0);

  const r = await comBlocoNaPagina({
    bloco, corpoAntes: ESPIA, porta: porta + 1,
    medir: async pg => {
      const sel = 'iframe.tidycal-embed';
      const inicial = await alturaDe(pg, sel);
      await pg.waitForTimeout(120);
      const handshake = await pg.evaluate(() => window.FC_HANDSHAKE.slice());
      /* o "Ready" do filho tambem tem de disparar um pedido */
      const antes = handshake.length;
      await sinal(pg, PROPRIO_ORIG, '[iFrameResizerChild]Ready');
      const depoisReady = (await pg.evaluate(() => window.FC_HANDSHAKE.length)) - antes;
      await correrBateria(pg, sel, PROPRIO_ORIG, 't proprio');
      /* DEPOIS que a primeira altura chegou, o bloco para de insistir: as tentativas
         pendentes conferem 'alturaViva' antes de mandar. Sem isto ele reiniciaria o filho
         para sempre, a cada 400/1200/3000ms. */
      await pg.evaluate(() => { window.FC_HANDSHAKE.length = 0; });
      await pg.waitForTimeout(3400);
      const depoisDaAltura = await pg.evaluate(() => window.FC_HANDSHAKE.length);
      return { inicial, handshake, depoisReady, depoisDaAltura };
    }
  });

  chk('t proprio: comeca na altura de partida (700px)', r.inicial === PARTIDA, r.inicial);
  chk('t proprio: o bloco MANDOU o aperto de mao sozinho', r.handshake.length >= 1,
      JSON.stringify(r.handshake));
  chk('t proprio: mandou para a origem do endereco configurado',
      r.handshake.length >= 1 && r.handshake[0].o === PROPRIO_ORIG,
      r.handshake.length ? r.handshake[0].o : '(nada)');
  chk('t proprio: a mensagem tem o prefixo, um id e o resto medido',
      r.handshake.length >= 1 &&
      /^\[iFrameSizer\]fc[a-z0-9]+$/.test(r.handshake[0].m.slice(0, r.handshake[0].m.indexOf(':'))) &&
      r.handshake[0].m.slice(r.handshake[0].m.indexOf(':')) === INIT_RESTO,
      r.handshake.length ? r.handshake[0].m : '(nada)');
  chk('t proprio: o "Ready" do filho dispara um pedido novo', r.depoisReady >= 1, String(r.depoisReady));
  chk('t proprio: com a altura ja recebida, para de insistir', r.depoisDaAltura === 0,
      String(r.depoisDaAltura));
  chk('t proprio: sem erro de script na pagina', soPageError(r.erros).length === 0,
      soPageError(r.erros).join(' | '));
}

/* O SILENCIO. Nenhum sinal chega -- e o que acontece com o cliente cujo navegador bloqueia o
   iframe, ou no dia em que o TidyCal trocar a biblioteca e o init deixar de ser reconhecido.
   A altura tem de ficar na de partida: a melhoria nao pode transformar "altura razoavel" em
   "altura zero". */
async function silencioTidycal(porta){
  const { valores } = await gerarNaFerramenta(async pg => {
    await clicar(pg, 'aba-tidy');
    await set(pg, 't-path', PROPRIO);
    await clicar(pg, 't-gerar');
  }, ['t-out1'], { porta });

  const r = await comBlocoNaPagina({
    bloco: valores['t-out1'], corpoAntes: ESPIA, porta: porta + 1,
    medir: async pg => {
      await pg.waitForTimeout(3400);   /* passa das tres tentativas: 400, 1200, 3000 */
      return { altura: await alturaDe(pg, 'iframe.tidycal-embed'),
               tentativas: await pg.evaluate(() => window.FC_HANDSHAKE.length) };
    }
  });
  chk('t proprio SEM SINAL: fica na altura de partida, nunca em zero',
      r.altura === PARTIDA, r.altura);
  /* Pelo menos quatro: o pedido inicial mais as tres tentativas. Sao CINCO na pratica --
     o 'load' do iframe reinicia a serie, que e o que se quer quando o filho recarrega. */
  chk('t proprio SEM SINAL: o bloco insistiu, e nao desistiu no primeiro pedido',
      r.tentativas >= 4, String(r.tentativas));
  chk('t proprio SEM SINAL: sem erro de script', soPageError(r.erros).length === 0,
      soPageError(r.erros).join(' | '));
}

/* ------------------------------------------------ aba Agendamento por pacote */
async function abaPacote(porta){
  const { valores, alertas } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC');
    for(const [cod, nome, preco, end] of [
      ['MINI', 'Mini ensaio',       '420', TIDY],
      ['PROP', 'Ensaio no estudio', '905', PROPRIO]
    ]){
      await set(pg, 'a-pcod', cod); await set(pg, 'a-pnome', nome);
      await set(pg, 'a-ppreco', preco); await set(pg, 'a-ppath', end);
      await clicar(pg, 'a-pac-salvar');
    }
    await clicar(pg, 'a-gerar');
  }, ['a-out1'], { porta });

  const bloco = valores['a-out1'];
  chk('pac: gerou sem recusa', !alertas.length && bloco.length > 5000, alertas.join(' | '));
  chk('pac: o aperto de mao esta no bloco, com o formato medido', temHandshake(bloco));
  chk('pac: a altura de partida existe (o iframe e criado por JS e nao tem atributo height)',
      bloco.indexOf('var ALTURA_INICIAL=700;') >= 0 &&
      bloco.indexOf("f.style.height=ALTURA_INICIAL+'px';") >= 0);

  const sel = 'iframe.fca-tidycal';
  const r = await comBlocoNaPagina({
    bloco, corpoAntes: ESPIA, porta: porta + 1,
    medir: async pg => {
      const cartao = async i => {
        const cs = await pg.$$('.fca-card');
        await cs[i].click();
        /* escolher() ignora QUALQUER sinal por 800ms depois de trocar de pacote -- medir
           antes disso mediria essa guarda, e nao a altura. */
        await pg.waitForTimeout(900);
      };
      await pg.evaluate(() => { window.FC_HANDSHAKE.length = 0; });
      await cartao(0);
      const nasceu = await alturaDe(pg, sel);
      const hs1 = await pg.evaluate(() => window.FC_HANDSHAKE.slice());
      await correrBateria(pg, sel, TIDY_ORIG, 'pac');
      const antesTroca = await alturaDe(pg, sel);

      /* TROCAR DE PACOTE: src novo e documento novo -- a altura tem de voltar para a de
         partida e o aperto de mao tem de recomecar, agora para a OUTRA origem. */
      await pg.click('.fca-trocar');
      await pg.waitForTimeout(50);
      await pg.evaluate(() => { window.FC_HANDSHAKE.length = 0; });
      await cartao(1);
      const depoisTroca = await alturaDe(pg, sel);
      const hs2 = await pg.evaluate(() => window.FC_HANDSHAKE.slice());
      /* e a partir daqui quem manda e a origem NOVA */
      await sinal(pg, TIDY_ORIG, '[iFrameSizer]fcm:600:1:mutationObserver');
      const velhaIgnorada = await alturaDe(pg, sel);
      await sinal(pg, PROPRIO_ORIG, '[iFrameSizer]fcm:600:1:mutationObserver');
      const novaAceita = await alturaDe(pg, sel);
      const quantos = await pg.$$eval(sel, els => els.length);
      return { nasceu, hs1, antesTroca, depoisTroca, hs2, velhaIgnorada, novaAceita, quantos };
    }
  });

  chk('pac: o calendario NASCE em 700px (antes desta rodada nascia nos 150px do navegador)',
      r.nasceu === PARTIDA, r.nasceu);
  chk('pac: o bloco mandou o aperto de mao para a origem do 1o pacote',
      r.hs1.length >= 1 && r.hs1[0].o === TIDY_ORIG, JSON.stringify(r.hs1.slice(0, 2)));
  chk('pac: a altura seguiu o conteudo antes da troca', r.antesTroca === '770px', r.antesTroca);
  chk('pac: TROCAR de pacote devolve a altura de partida', r.depoisTroca === PARTIDA, r.depoisTroca);
  chk('pac: TROCAR de pacote refaz o aperto de mao, para a origem NOVA',
      r.hs2.length >= 1 && r.hs2[r.hs2.length - 1].o === PROPRIO_ORIG, JSON.stringify(r.hs2.slice(0, 2)));
  chk('pac: NEGATIVO -- altura do pacote ANTERIOR nao redimensiona o novo',
      r.velhaIgnorada === PARTIDA, r.velhaIgnorada);
  chk('pac: altura da origem carregada AGORA e aceita', r.novaAceita === '600px', r.novaAceita);
  chk('pac: continua existindo UM iframe so', r.quantos === 1, String(r.quantos));
  chk('pac: sem erro de script na pagina', soPageError(r.erros).length === 0,
      soPageError(r.erros).join(' | '));
}

/* O SILENCIO na vitrine: escolher o pacote e nao receber nada. */
async function silencioPacote(porta){
  const { valores } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC');
    await set(pg, 'a-pcod', 'MINI'); await set(pg, 'a-pnome', 'Mini ensaio');
    await set(pg, 'a-ppreco', '420'); await set(pg, 'a-ppath', TIDY);
    await clicar(pg, 'a-pac-salvar');
    await clicar(pg, 'a-gerar');
  }, ['a-out1'], { porta });

  const r = await comBlocoNaPagina({
    bloco: valores['a-out1'], corpoAntes: ESPIA, porta: porta + 1,
    medir: async pg => {
      const cs = await pg.$$('.fca-card');
      await cs[0].click();
      await pg.waitForTimeout(3400);
      return { altura: await alturaDe(pg, 'iframe.fca-tidycal'),
               tentativas: await pg.evaluate(() => window.FC_HANDSHAKE.length) };
    }
  });
  chk('pac SEM SINAL: fica na altura de partida, nunca em zero nem nos 150px',
      r.altura === PARTIDA, r.altura);
  chk('pac SEM SINAL: o bloco insistiu, e nao desistiu no primeiro pedido',
      r.tentativas >= 4, String(r.tentativas));
  chk('pac SEM SINAL: sem erro de script', soPageError(r.erros).length === 0,
      soPageError(r.erros).join(' | '));
}

console.log('ALTURA AUTOMATICA DO CALENDARIO -- os dois blocos rodando\n');
await abaTidycalProprio(8961);
console.log('');
await silencioTidycal(8965);
console.log('');
await abaPacote(8969);
console.log('');
await silencioPacote(8973);
process.exit(resumo());
