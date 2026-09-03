/* ============================================================================
   O FILTRO DE ORIGEM DAS MENSAGENS DO TIDYCAL, COM OS BLOCOS RODANDO
   ============================================================================
   POR QUE ISTO EXISTE. Os dois blocos que embutem o TidyCal (aba Agendamento
   TidyCal e aba Agendamento por pacote) escutam as mensagens que a pagina do
   TidyCal manda de dentro do iframe -- os sinais '[iFrameSizer]', que dizem
   quando o formulario de reserva abriu e fechou -- e FILTRAM POR ORIGEM. Ate
   03/09/2026 a origem era um literal: 'https://tidycal.com'.

   O dono tem DOMINIO PROPRIO no TidyCal. Com ele, a origem das mensagens passa
   a ser https://agendamento.fotocerta.com.br, e o filtro cravado descartaria
   TODO sinal: o calendario apareceria e a expansao do formulario simplesmente
   nao aconteceria -- sem erro no console, sem nada na tela. E a classe de
   defeito que este projeto persegue, e ela NAO E ALCANCADA pela regressao byte
   a byte: um filtro cravado e texto gerado perfeitamente coerente.

   OS TRES CASOS, e o terceiro e o que da sentido aos outros dois:
     1. dominio proprio  -> sinal vindo DELE e aceito;
     2. tidycal.com      -> continua funcionando como sempre;
     3. NEGATIVO         -> sinal vindo de outra origem e DESCARTADO.
   Sem o caso 3 o filtro poderia ter sido simplesmente REMOVIDO e os casos 1 e
   2 passariam iguais. O negativo do caso 1 e, de proposito, a propria
   'https://tidycal.com' -- a origem que estava cravada antes desta rodada:
   se alguem devolver o literal, este caso acusa.

   E A QUARTA PARTE: dois pacotes em DOMINIOS DIFERENTES na mesma pagina. Ha um
   iframe por vez, mas o endereco muda quando o cliente troca de pacote -- entao
   a origem conferida tem de ser a do endereco CARREGADO AGORA, e nao uma
   decidida na hora de gerar. O teste escolhe o pacote em tidycal.com, mede os
   dois sentidos, troca para o do dominio proprio e mede os dois de novo.

   E A QUINTA: A MIGRACAO. O campo guardava o CAMINHO ('path', e antes disso a
   URL inteira em 'link'); agora guarda o ENDERECO COMPLETO ('cal'). Estado
   gravado no formato antigo tem de abrir, converter, avisar UMA VEZ e nao
   repetir na recarga -- nas duas abas.

   COMO SE SIMULA UM SINAL DE OUTRA ORIGEM. window.postMessage sempre carimba a
   origem da propria pagina, entao ele nao serve. O construtor de MessageEvent
   aceita 'origin' como opcao, e um dispatchEvent com ele chega ao ouvinte
   exatamente como chegaria o sinal de verdade -- e o unico jeito de exercitar
   o ramo do filtro sem uma pagina real do TidyCal no ar.

   O QUE ESTE ARQUIVO ADMITE QUE FINGE. No caminho tidycal.com a aba TidyCal
   entrega '<div class="tidycal-embed">' mais o embed.js do proprio TidyCal, que
   e quem cria o <iframe>. A pagina de teste bloqueia a rede externa (de
   proposito -- ver pagina.mjs), entao o embed.js nao carrega e o iframe nao
   nasce. O teste poe UM <iframe class="tidycal-embed"> no corpo, no lugar
   exato onde o embed.js poria o dele, para 'frame()' achar o mesmo elemento
   que acharia em producao. E o unico faz-de-conta aqui, e ele nao toca no
   codigo sob teste: o ouvinte, o filtro e o expandir() sao os do bloco.

   Uso:  node scripts/verificar/tidycal-origem.mjs
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { navegador, servir, abrir, set, clicar, ler, alertas, zerarAlertas } from './lib.mjs';
import { preparar } from './cenario.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const PROPRIO      = 'https://agendamento.fotocerta.com.br/estudio-905-seg-a-sex-1-hora';
const PROPRIO_ORIG = 'https://agendamento.fotocerta.com.br';
const TIDY         = 'https://tidycal.com/fotocerta/natal-2026';
const TIDY_ORIG    = 'https://tidycal.com';
const ALTURA       = '2350px';   /* ALTURA_DESKTOP de fabrica das duas abas */

/* O sinal, do jeito que o TidyCal manda: prefixo, id, altura, largura e o tipo no fim --
   'scrollToOffset' e o que abre o formulario de reserva, e o unico que expande. */
const sinal = (pg, origem, tipo = 'scrollToOffset') => pg.evaluate(
  ([o, t]) => window.dispatchEvent(new MessageEvent('message', {
    data: '[iFrameSizer]fc:900:1200:' + t, origin: o
  })), [origem, tipo]);

const minAltura = (pg, sel) => pg.$eval(sel, el => el.style.minHeight || '');
const soPageError = erros => erros.filter(e => e.indexOf('pageerror:') === 0);

/* ---------------------------------------------------------------- aba TidyCal */
async function abaTidycal(endereco, origemCerta, origemErrada, rotulo, porta){
  const { valores, alertas } = await gerarNaFerramenta(async pg => {
    await clicar(pg, 'aba-tidy');
    await set(pg, 't-path', endereco);
    await clicar(pg, 't-gerar');
  }, ['t-out1'], { porta });

  const bloco = valores['t-out1'];
  chk(rotulo + ': gerou sem recusa', !alertas.length && bloco.length > 500, alertas.join(' | '));
  chk(rotulo + ': a origem embutida no bloco e a do endereco configurado',
      bloco.indexOf("e.origin !== '" + origemCerta + "'") >= 0);
  chk(rotulo + ': nao sobrou origem cravada de outro dominio',
      bloco.indexOf("e.origin !== '" + origemErrada + "'") < 0);

  /* No caminho tidycal.com quem cria o iframe e o embed.js, que a pagina de teste nao deixa
     carregar -- ver o cabecalho. No dominio proprio o proprio bloco cria o iframe, e nao ha
     nada a fingir. */
  const nossoIframe = bloco.indexOf('<div class="tidycal-embed"') >= 0;
  const r = await comBlocoNaPagina({
    bloco,
    corpoAntes: nossoIframe
      ? '<iframe class="tidycal-embed" title="Agenda" style="border:none;width:1px;min-width:100%;height:700px;display:block"></iframe>'
      : '',
    porta: porta + 1,
    medir: async pg => {
      const src = await pg.$eval('iframe.tidycal-embed', el => el.getAttribute('src') || '');
      const inicial = await minAltura(pg, 'iframe.tidycal-embed');
      await sinal(pg, origemErrada);
      const depoisErrada = await minAltura(pg, 'iframe.tidycal-embed');
      await sinal(pg, origemCerta);
      const depoisCerta = await minAltura(pg, 'iframe.tidycal-embed');
      return { src, inicial, depoisErrada, depoisCerta };
    }
  });

  if(!nossoIframe){
    chk(rotulo + ': o iframe aponta para o endereco configurado',
        r.src.indexOf(endereco) === 0, r.src);
  }else{
    chk(rotulo + ': o data-path e o caminho do endereco configurado',
        bloco.indexOf('data-path="' + endereco.slice(TIDY_ORIG.length + 1) + '"') >= 0);
  }
  chk(rotulo + ': comeca sem altura forcada', r.inicial === '', r.inicial);
  chk(rotulo + ': NEGATIVO -- sinal de ' + origemErrada + ' e descartado',
      r.depoisErrada === '', r.depoisErrada);
  chk(rotulo + ': sinal de ' + origemCerta + ' e ACEITO e expande',
      r.depoisCerta === ALTURA, r.depoisCerta);
  chk(rotulo + ': sem erro de script na pagina', soPageError(r.erros).length === 0,
      soPageError(r.erros).join(' | '));
}

/* ------------------------------------------------- aba Agendamento por pacote */
async function abaPacote(porta){
  const { valores, alertas } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC');
    for(const [cod, nome, preco, end] of [
      ['MINI', 'Mini ensaio',      '420', TIDY],
      ['PROP', 'Ensaio no estudio','905', PROPRIO]
    ]){
      await set(pg, 'a-pcod', cod); await set(pg, 'a-pnome', nome);
      await set(pg, 'a-ppreco', preco); await set(pg, 'a-ppath', end);
      await clicar(pg, 'a-pac-salvar');
    }
    await clicar(pg, 'a-gerar');
  }, ['a-out1'], { porta });

  const bloco = valores['a-out1'];
  chk('pac: gerou sem recusa', !alertas.length && bloco.length > 5000, alertas.join(' | '));
  chk('pac: os DOIS enderecos viajam inteiros no catalogo',
      bloco.indexOf("link:'" + TIDY + "'") >= 0 && bloco.indexOf("link:'" + PROPRIO + "'") >= 0);
  /* Desde a unificacao do calendario (03/09/2026) a origem do endereco novo e calculada uma
     vez, em 'nova' -- porque ela e usada DUAS vezes na mesma funcao: para decidir se o iframe
     precisa ser recriado (dominio diferente) e para virar a origemCal. O que este teste cobra
     continua sendo o mesmo: que ela venha do endereco, e nao de um literal. */
  chk('pac: a origem NAO e um literal no bloco',
      bloco.indexOf("e.origin!=='https://tidycal.com'") < 0 &&
      bloco.indexOf('nova=origemDe(link)') >= 0 &&
      bloco.indexOf('origemCal=nova') >= 0);

  const r = await comBlocoNaPagina({
    bloco, porta: porta + 1,
    medir: async pg => {
      const cartao = async i => {
        const cs = await pg.$$('.fca-card');
        await cs[i].click();
        /* escolher() zera o estado do modal e IGNORA qualquer sinal por 800ms (a corrida da
           mensagem atrasada do iframe anterior). Medir antes disso mediria essa guarda, e nao
           o filtro de origem -- que e o que este arquivo existe para medir. */
        await pg.waitForTimeout(900);
      };
      const trocar = async () => {
        await pg.click('.fca-trocar');
        await pg.waitForTimeout(50);
      };
      const medida = async (errada, certa) => {
        await sinal(pg, errada);
        const naoDeve = await minAltura(pg, 'iframe.fca-tidycal');
        await sinal(pg, certa);
        const deve = await minAltura(pg, 'iframe.fca-tidycal');
        return { naoDeve, deve };
      };
      await cartao(0);
      const src1 = await pg.$eval('iframe.fca-tidycal', el => el.getAttribute('src') || '');
      const p1 = await medida(PROPRIO_ORIG, TIDY_ORIG);
      await trocar();
      await cartao(1);
      const src2 = await pg.$eval('iframe.fca-tidycal', el => el.getAttribute('src') || '');
      const p2 = await medida(TIDY_ORIG, PROPRIO_ORIG);
      const quantos = await pg.$$eval('iframe.fca-tidycal', els => els.length);
      return { src1, src2, p1, p2, quantos };
    }
  });

  chk('pac: o iframe do 1o pacote aponta para tidycal.com', r.src1 === TIDY, r.src1);
  chk('pac: NEGATIVO -- com tidycal.com carregado, sinal do dominio proprio e descartado',
      r.p1.naoDeve === '', r.p1.naoDeve);
  chk('pac: com tidycal.com carregado, sinal de tidycal.com e ACEITO', r.p1.deve === ALTURA, r.p1.deve);
  chk('pac: trocar de pacote reaproveita o MESMO iframe (nunca um segundo)', r.quantos === 1, String(r.quantos));
  chk('pac: o iframe do 2o pacote aponta para o dominio proprio', r.src2 === PROPRIO, r.src2);
  chk('pac: NEGATIVO -- com o dominio proprio carregado, sinal de tidycal.com e descartado',
      r.p2.naoDeve === '', r.p2.naoDeve);
  chk('pac: com o dominio proprio carregado, sinal do dominio proprio e ACEITO',
      r.p2.deve === ALTURA, r.p2.deve);
  chk('pac: sem erro de script na pagina', soPageError(r.erros).length === 0,
      soPageError(r.erros).join(' | '));
}

/* -------------------------------------------------------------------- guarda */
/* A GUARDA MUDOU DE NATUREZA nesta rodada, e por isso ela e medida item a item. Enquanto o
   host era cravado pelo gerador, um caminho torto no maximo apontava para uma pagina que nao
   existe DENTRO do TidyCal; agora o host vem do campo, e endereco torto e endereco para outro
   site. A tabela e a declaracao do que passa e do que nao passa -- e o lugar onde uma
   frouxidao futura aparece como linha vermelha, em vez de como surpresa na pagina publicada. */
const CASOS = [
  /* [o que se digita, aceita?, o endereco que sai (ou null quando nao importa)] */
  ['https://tidycal.com/usuario/nome-do-agendamento',        true,  'https://tidycal.com/usuario/nome-do-agendamento'],
  [PROPRIO,                                                  true,  PROPRIO],
  ['usuario/nome-do-agendamento',                            true,  'https://tidycal.com/usuario/nome-do-agendamento'],
  ['/usuario/nome-do-agendamento',                           true,  'https://tidycal.com/usuario/nome-do-agendamento'],
  ['  usuario/nome  ',                                       true,  'https://tidycal.com/usuario/nome'],
  ['https://tidycal.com/a/b?nome=x#y',                       true,  null],
  ['https://agenda.exemplo.com.br:8443/ensaio',              true,  null],
  ['',                                                       false, ''],
  ['http://tidycal.com/usuario/nome',                        false, null],
  ['javascript:alert(1)',                                    false, 'javascript:alert(1)'],
  ['https://tidycal.com',                                    false, null],
  ['https://tidycal.com/',                                   false, null],
  ['https://tidycal.com@evil.com/x',                         false, null],
  ['https://localhost/x',                                    false, null],
  ['https://tidycal.com/../evil',                            false, null],
  ['https://tidycal.com/usuario nome',                       false, null],
  ['https://tidycal.com/usuario"nome',                       false, null],
  ['https://tidycal.com/usuario\\nome',                      false, null],
  /* Os dois casos do endereco SEM ESQUEMA que tenta trocar de host: nos dois o prefixo entra
     na frente e o host continua sendo tidycal.com -- e o segundo ainda cai no segmento '..'. */
  ['//agendamento.fotocerta.com.br/x',                       true,  'https://tidycal.com/agendamento.fotocerta.com.br/x'],
  ['..//evil.com/x',                                         false, 'https://tidycal.com/..//evil.com/x']
];
/* A guarda e exercitada PELA INTERFACE, e nao chamando a funcao: o script da ferramenta roda
   dentro de uma IIFE (escopo isolado, para nao conflitar com o jQuery da Alboom), entao nao ha
   fcTidyUrlOk em window -- e mesmo que houvesse, medir a funcao provaria a funcao, e nao o
   caminho que o dedo do operador percorre. O botao "Abrir a pagina de teste" e o probe ideal:
   com window.open neutralizado (lib.abrir), o endereco ACEITO volta dentro do aviso de
   "pop-up bloqueado", e o RECUSADO volta como o texto da recusa. */
async function guarda(porta){
  const srv = await servir(RAIZ, porta);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:' + porta);
    await clicar(pg, 'aba-tidy');
    for(const [entrada, aceita, saida] of CASOS){
      await zerarAlertas(pg);
      await set(pg, 't-path', entrada);
      await clicar(pg, 't-testar');
      const av = (await alertas(pg))[0] || '';
      const campo = await ler(pg, 't-path');
      const passou = av.indexOf('O endereço montado é: ') >= 0;
      chk('guarda: ' + (aceita ? 'ACEITA  ' : 'RECUSA  ') + JSON.stringify(entrada),
          passou === aceita, 'aviso: ' + av.slice(0, 90));
      if(saida !== null){
        chk('guarda: o campo se corrige para ' + JSON.stringify(saida), campo === saida, campo);
      }
      if(aceita){
        chk('guarda: o botao abre exatamente o endereco do campo',
            av.slice(av.indexOf('O endereço montado é: ') + 22) === campo, av.slice(-90));
      }
    }
    await pg.close();
  } finally {
    await br.close(); srv.close();
  }
}

/* ------------------------------------------------------------------ migracao */
/* Monta o estado com a ferramenta de VERDADE (nada de JSON escrito a mao, que envelhece
   sozinho), depois REESCREVE so a chave do endereco para o formato antigo e recarrega. */
async function migracao(porta){
  const srv = await servir(RAIZ, porta);
  const br = await navegador();
  const base = 'http://127.0.0.1:' + porta;
  try{
    const pg = await br.newPage();
    /* addInitScript, e nao evaluate depois do load: o aviso da aba 'pac' sai DENTRO do
       restaurarEstado, que roda no carregamento -- um gancho instalado depois chegaria tarde e
       o alerta seria engolido pelo proprio Playwright, sem o teste ver nada. */
    await pg.addInitScript(() => {
      window.__alertas = [];
      window.alert = m => { window.__alertas.push(String(m)); };
      window.confirm = () => true;
      window.open = () => null;
    });
    await pg.goto(base + '/index.html');
    await pg.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await pg.goto(base + '/index.html');

    await clicar(pg, 'aba-tidy');
    await set(pg, 't-path', TIDY);
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-pcod', 'MINI'); await set(pg, 'a-pnome', 'Mini ensaio');
    await set(pg, 'a-ppreco', '420'); await set(pg, 'a-ppath', TIDY);
    await clicar(pg, 'a-pac-salvar');

    const gravado = await pg.evaluate(() => localStorage.getItem('fcConstrutores'));
    const st = JSON.parse(gravado);
    chk('migracao: a ferramenta grava o endereco COMPLETO (chave nova)',
        st.t.cal === TIDY && st.a.pacotes[0].cal === TIDY,
        JSON.stringify([st.t.cal, st.a.pacotes[0].cal]));

    /* --- v2: so o caminho, em 'path' (as duas abas) --- */
    const v2 = JSON.parse(gravado);
    v2.t.path = v2.t.cal.slice(TIDY_ORIG.length + 1); delete v2.t.cal;
    v2.a.pacotes[0].path = v2.a.pacotes[0].cal.slice(TIDY_ORIG.length + 1);
    delete v2.a.pacotes[0].cal;
    const depois = await recarregarCom(pg, base, v2);
    chk('migracao v2: avisou -- e uma vez por aba, nao mais',
        depois.alertas.length === 2, JSON.stringify(depois.alertas.length));
    chk('migracao v2: o aviso da aba TidyCal diz o que aconteceu',
        depois.alertas.some(a => a.indexOf('CAMINHO') >= 0 && a.indexOf('Nada foi perdido') >= 0));
    chk('migracao v2: o campo da aba TidyCal abriu com o endereco completo',
        depois.tPath === TIDY, depois.tPath);
    chk('migracao v2: o pacote abriu com o endereco completo',
        depois.st.a.pacotes[0].cal === TIDY, JSON.stringify(depois.st.a.pacotes[0]));
    chk('migracao v2: gravou a conversao (senao o aviso voltaria toda recarga)',
        depois.st.t.cal === TIDY && depois.st.t.path === undefined,
        JSON.stringify(depois.st.t.cal));

    const denovo = await recarregarCom(pg, base, null);
    chk('migracao v2: NAO repete na recarga seguinte',
        denovo.alertas.length === 0, JSON.stringify(denovo.alertas));
    chk('migracao v2: e o valor continua la', denovo.tPath === TIDY, denovo.tPath);

    /* --- v1: a URL inteira, em 'link' (so a aba de pacotes tinha essa forma) --- */
    const v1 = JSON.parse(gravado);
    v1.a.pacotes[0].link = v1.a.pacotes[0].cal; delete v1.a.pacotes[0].cal;
    const r1 = await recarregarCom(pg, base, v1);
    chk('migracao v1: avisou uma vez (so a aba de pacotes muda de forma)',
        r1.alertas.length === 1, JSON.stringify(r1.alertas.length));
    chk('migracao v1: o endereco antigo, que ja era completo, chegou intacto',
        r1.st.a.pacotes[0].cal === TIDY, JSON.stringify(r1.st.a.pacotes[0]));

    await pg.close();
  } finally {
    await br.close(); srv.close();
  }
}

/* Grava o estado (quando vier um), recarrega e devolve o que a ferramenta fez com ele. */
async function recarregarCom(pg, base, estado){
  if(estado) await pg.evaluate(e => localStorage.setItem('fcConstrutores', JSON.stringify(e)), estado);
  await pg.goto(base + '/index.html');
  /* O aviso da aba TidyCal sai num setTimeout de zero -- 'tidy' nao e a ultima aba de ABAS, e
     um salvarEstado() no meio do laco de restauracao gravaria por cima das abas que ainda nao
     restauraram. Esperar aqui e esperar exatamente isso acontecer. */
  await pg.waitForTimeout(250);
  return {
    alertas: await pg.evaluate(() => window.__alertas.slice()),
    tPath: await ler(pg, 't-path'),
    st: JSON.parse(await pg.evaluate(() => localStorage.getItem('fcConstrutores')))
  };
}

console.log('ORIGEM DAS MENSAGENS DO TIDYCAL -- os blocos rodando de verdade\n');
console.log(' aba Agendamento TidyCal -- DOMINIO PROPRIO');
await abaTidycal(PROPRIO, PROPRIO_ORIG, TIDY_ORIG, 'tidy/proprio', 8811);
console.log('\n aba Agendamento TidyCal -- tidycal.com (o caso de hoje)');
await abaTidycal(TIDY, TIDY_ORIG, PROPRIO_ORIG, 'tidy/tidycal', 8813);
console.log('\n aba Agendamento por pacote -- os dois dominios na mesma pagina');
await abaPacote(8815);
console.log('\n a guarda do que se digita no campo');
await guarda(8819);
console.log('\n a migracao do que ja estava gravado');
await migracao(8817);
process.exit(resumo());
