/* ============================================================================
   OS NOVE TEXTOS RESERVA DOS MARCADORES -- a migracao do formato gravado
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. Em 11/09/2026 os nove textos reserva dos
   marcadores da pagina de obrigado (cinco na aba TidyCal, quatro na aba
   Agendamento por pacote) entraram nas tabelas de texto. Eles eram os unicos
   que faltavam, e faltavam por um motivo so: os nove dividiam UMA chave de
   estado ('obfb'), com os valores colados por um caractere de controle. Agora
   cada campo tem a propria chave -- e isso MUDA O FORMATO DO QUE FICA GRAVADO.

   O que a regressao byte a byte prova: que nenhuma saida mudou. O que ela NAO
   alcanca, e por isso este arquivo existe:

     1. BACKUP ANTIGO TEM DE CONTINUAR ABRINDO, com os nove textos intactos --
        e cada um no SEU campo, e nao "algo chegou".
     2. PRESET ANTIGO tambem: preset e fotografia do coleta() da aba, entao
        preset salvo antes desta rodada carrega 'obfb'.
     3. AS DUAS ABAS TRATAVAM TEXTO VAZIO DE FORMA DIFERENTE. Medido, nao
        suposto: o laco da TidyCal testava fb[i]!==undefined (vazio gravado era
        um valor); o da Agendamento por pacote testava !=null && !=='' (vazio
        valia ausente, e o campo voltava a fabrica). Uniformizar mudaria, em
        silencio, o bloco que um estado ja gravado produz.
     4. A ORDEM. O endereco do TidyCal e montado na ordem de T_OB_VARS, e a
        chave antiga foi colada nessa mesma ordem. Chave por campo nao pode
        deixar a ordem depender de ordem de chave de objeto.
     5. O CARACTERE DE CONTROLE. Se ele couber num texto, o formato ANTIGO e
        ambiguo. Aqui ele e MEDIDO pelos quatro caminhos de entrada, e nao
        suposto.

   O METODO DAS PROVAS 1 a 3: o estado antigo NAO e escrito a mao aqui. Ele e
   colhido da propria arvore de referencia (main, por padrao), servida numa
   porta separada -- e o que a versao anterior de fato gravava, e nao a ideia
   que este arquivo faz dela. Depois o mesmo JSON e semeado na arvore de
   trabalho, e o que se compara e o valor de CADA UM DOS NOVE CAMPOS nos dois
   lados. Divergiu num, falhou.

   Roda com:  node scripts/verificar/textos-reserva.mjs [referencia]
   ============================================================================ */
import { navegador, servir, abrir, set, ler, clicar, radio, alertas } from './lib.mjs';
import { comBlocoNaPagina, gerarNaFerramenta, textoSemScripts, chk, resumo } from './pagina.mjs';
import { preparar, conteudo, cobranca } from './cenario.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';
const HTML = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

/* O separador da chave ANTIGA, escrito por codigo e nunca colado no arquivo: um caractere de
   controle dentro do fonte e invisivel em revisao, que e o oposto do que um teste precisa. */
const SEP = String.fromCharCode(1);

/* Os nove, na ORDEM DE T_OB_VARS/A_OB_VARS -- a mesma em que a chave antiga foi colada.
   Escrita aqui a mao de proposito: se a ordem da ferramenta mudar, este arquivo tem de
   discordar dela em voz alta, e nao acompanhar em silencio. */
const MARCAS = { t: ['nome','tipo','data','hora','quando'], a: ['nome','data','hora','quando'] };
const NOVE = [].concat(MARCAS.t.map(v => ['t', v]), MARCAS.a.map(v => ['a', v]));
const ID = (p, v) => p + '-ob-fb-' + v;
const CHAVE = v => 'obfb' + v.charAt(0).toUpperCase() + v.substring(1);
const IDS = NOVE.map(([p, v]) => ID(p, v));

/* O padrao de fabrica sai do value= do <input>, nunca da tabela: medir a reposicao contra a
   mesma fonte que a reposicao usa nao mede nada. */
const fabricaDe = id => {
  const m = new RegExp('<input[^>]*id="' + id + '"[^>]*>').exec(HTML);
  const v = m && /value="([^"]*)"/.exec(m[0]);
  return v ? v[1] : null;
};
const FABRICA = {};
for(const id of IDS) FABRICA[id] = fabricaDe(id);

const cod = s => Array.from(String(s)).map(c => c.codePointAt(0) < 32 ? '<' + c.codePointAt(0) + '>' : c).join('');
const RUIDO = [/Failed to load resource/i, /net::ERR/i, /ERR_FAILED/i, /favicon/i];
const soDoBloco = e => e.filter(x => !RUIDO.some(re => re.test(x)));

/* Abre as duas abas e liga a pagina de obrigado da TidyCal -- sem isso a secao inteira fica
   escondida, e um campo escondido ainda e lido e gravado, mas nao da para medir o que o
   operador ve nele. */
async function prepararAbas(pg){
  await clicar(pg, 'aba-tidy');
  await radio(pg, 't-ob-usar', 'sim');
  await clicar(pg, 'aba-pac');
}
const lerNove = async pg => {
  const r = {};
  for(const id of IDS) r[id] = await ler(pg, id);
  return r;
};
const escreverNove = async (pg, valor) => {
  for(const [p, v] of NOVE) await set(pg, ID(p, v), valor(p, v));
};
/* O alert neutralizado por abrir() MORRE na primeira recarga -- e estas provas recarregam
   sempre (e o unico jeito de exercitar a restauracao). addInitScript reinstala o gancho ANTES
   de qualquer script da pagina, em toda navegacao seguinte: sem isso um alerta da migracao
   seria engolido pelo descarte automatico do Playwright, e a prova diria "sem alerta" sobre
   uma medicao que nao existiu. */
const armar = pg => pg.addInitScript(() => {
  window.__alertas = [];
  window.alert = m => { window.__alertas.push(String(m)); };
  window.confirm = () => true;
  window.open = () => null;
});
const estado = pg => pg.evaluate(() => localStorage.getItem('fcConstrutores'));
const semear = (pg, json) => pg.evaluate(j => { localStorage.setItem('fcConstrutores', j); }, json);

/* OS CENARIOS DO ESTADO ANTIGO. Cada um responde a uma pergunta diferente, e todos passam
   pelo mesmo caminho: gravado pela arvore de referencia, lido pela arvore de trabalho. */
const CENARIOS = [
  {n:'distintos', v:(p,m)=>'Reserva '+p+'/'+m+' unica'},
  {n:'vazios',    v:()=>''},
  {n:'hostil',    v:(p,m)=>"Res "+p+"/"+m+" d'A \\ \"b\" </script>"},
  {n:'controle',  v:(p,m)=> m==='hora' ? ('Res '+p+' antes'+SEP+'depois') : ('Res '+p+'/'+m)}
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-res-'));
const REFDIR = path.join(tmp, 'ref');
fs.mkdirSync(REFDIR);
execFileSync('sh', ['-c', 'git -C "' + RAIZ + '" archive ' + REF + ' | tar -x -C "' + REFDIR + '"']);

/* ============================================================================
   FASE 1 -- a arvore de REFERENCIA grava o formato antigo, e diz como ela o le
   ============================================================================ */
console.log('\n--- a arvore de referencia ('+REF+') grava o formato antigo ---');
const ANTIGO = {};      /* cenario -> JSON do estado como a referencia o gravou */
const REFLEU = {};      /* cenario -> o que a referencia mostra nos nove ao reabrir */
let PRESET_JSON = null; /* estado com um preset de cada aba, salvo pela referencia */
{
  const srv = await servir(REFDIR, 8941);
  const br = await navegador();
  try{
    for(const c of CENARIOS){
      const pg = await abrir(br, 'http://127.0.0.1:8941');
      await armar(pg);
      await prepararAbas(pg);
      await escreverNove(pg, c.v);
      ANTIGO[c.n] = await estado(pg);
      await pg.reload();
      await prepararAbas(pg);
      REFLEU[c.n] = await lerNove(pg);
      await pg.close();
    }
    /* O PRESET, salvo pela referencia: e a fotografia do coleta() dela, entao ele carrega
       'obfb' e nao carrega chave nenhuma das novas. */
    const pg = await abrir(br, 'http://127.0.0.1:8941');
    await prepararAbas(pg);
    await escreverNove(pg, (p, m) => 'Preset '+p+'/'+m+' guardado');
    await set(pg, 'fcp-t-nome', 'Reserva antiga');
    await clicar(pg, 'fcp-t-salvar');
    await set(pg, 'fcp-a-nome', 'Reserva antiga');
    await clicar(pg, 'fcp-a-salvar');
    PRESET_JSON = await estado(pg);
    chk('referencia: salvou o preset das duas abas sem alerta', (await alertas(pg)).length === 0);
    await pg.close();
  } finally { await br.close(); srv.close(); }
}
{
  const st = JSON.parse(ANTIGO.distintos);
  chk('referencia: gravou a chave ANTIGA t.obfb, colada', typeof st.t.obfb === 'string' && st.t.obfb.indexOf(SEP) > 0, cod(st.t.obfb));
  chk('referencia: gravou a chave ANTIGA a.obfb, colada', typeof st.a.obfb === 'string' && st.a.obfb.indexOf(SEP) > 0, cod(st.a.obfb));
  const novasNaRef = NOVE.filter(([p, v]) => st[p][CHAVE(v)] !== undefined);
  chk('referencia: NAO gravou nenhuma das nove chaves novas (e mesmo o formato antigo)',
      novasNaRef.length === 0, novasNaRef.map(x => x.join('.')).join(', '));
  const p = JSON.parse(PRESET_JSON);
  chk('referencia: o preset da TidyCal guardou obfb e nenhuma chave nova',
      typeof p.t.presets[0].valores.t.obfb === 'string' &&
      MARCAS.t.every(v => p.t.presets[0].valores.t[CHAVE(v)] === undefined),
      cod((p.t.presets[0].valores.t || {}).obfb));
  chk('referencia: o preset do Agendamento por pacote guardou obfb e nenhuma chave nova',
      typeof p.a.presets[0].valores.a.obfb === 'string' &&
      MARCAS.a.every(v => p.a.presets[0].valores.a[CHAVE(v)] === undefined),
      cod((p.a.presets[0].valores.a || {}).obfb));
}

/* ============================================================================
   FASE 2 -- a arvore de TRABALHO le o mesmo estado antigo
   ============================================================================ */
console.log('\n--- a arvore de trabalho le o backup antigo, campo por campo ---');
{
  const srv = await servir(RAIZ, 8942);
  const br = await navegador();
  try{
    for(const c of CENARIOS){
      const pg = await abrir(br, 'http://127.0.0.1:8942');
      await armar(pg);
      await semear(pg, ANTIGO[c.n]);
      await pg.reload();
      await prepararAbas(pg);
      const agora = await lerNove(pg);
      /* 1. cada um dos nove chegou ao SEU campo -- e nao "algo chegou" */
      if(c.n === 'distintos'){
        for(const [p, v] of NOVE)
          chk('antigo/distintos: ' + ID(p, v) + ' recebeu o SEU texto',
              agora[ID(p, v)] === c.v(p, v), JSON.stringify(agora[ID(p, v)]));
      }
      /* 2. e, em todos os cenarios, exatamente o que a referencia mostrava */
      const difs = IDS.filter(id => agora[id] !== REFLEU[c.n][id]);
      chk('antigo/' + c.n + ': os nove campos ficaram identicos aos de ' + REF,
          difs.length === 0,
          difs.map(id => id + ': ' + REF + '=' + JSON.stringify(cod(REFLEU[c.n][id])) +
                         ' aqui=' + JSON.stringify(cod(agora[id]))).join(' | '));
      chk('antigo/' + c.n + ': sem erro de console ao migrar', soDoBloco(pg.erros).length === 0,
          soDoBloco(pg.erros).slice(0, 2).join(' | '));
      /* A MIGRACAO DOS NOVE E CALADA de proposito, e isso e diferente das outras migracoes
         deste arquivo (path->cal, link->path, familias), que avisam porque CONVERTERAM um
         valor. Aqui nada foi convertido: os nove textos sao os mesmos, so mudou onde cada um
         mora dentro do estado. Alerta sem nada a dizer e ruido, e ruido gasta a confianca do
         proximo alerta, que pode ter. */
      chk('antigo/' + c.n + ': a migracao nao mostrou alerta (nada foi convertido)',
          (await alertas(pg)).length === 0, JSON.stringify(await alertas(pg)).slice(0, 200));
      await pg.close();
    }
    /* 3. OS DOIS TRATAMENTOS DO VAZIO, ditos por extenso -- e nao so "igual a referencia" */
    {
      const vaz = REFLEU.vazios;
      chk('vazio/TidyCal: os cinco continuam VAZIOS (esta aba sempre aceitou vazio gravado)',
          MARCAS.t.every(v => vaz[ID('t', v)] === ''),
          MARCAS.t.map(v => v + '=' + JSON.stringify(vaz[ID('t', v)])).join(' '));
      chk('vazio/Agendamento por pacote: os quatro voltaram a FABRICA (nesta aba vazio vale ausente)',
          MARCAS.a.every(v => vaz[ID('a', v)] === FABRICA[ID('a', v)]),
          MARCAS.a.map(v => v + '=' + JSON.stringify(vaz[ID('a', v)])).join(' '));
    }
    /* 4. ESTADO SEM A CHAVE ANTIGA E SEM AS NOVAS -- anterior ao proprio recurso. Os nove tem
       de cair no padrao de fabrica, que e a terceira coluna da tabela. */
    {
      const st = JSON.parse(ANTIGO.distintos);
      delete st.t.obfb; delete st.a.obfb;
      const pg = await abrir(br, 'http://127.0.0.1:8942');
      await armar(pg);
      await semear(pg, JSON.stringify(st));
      await pg.reload();
      await prepararAbas(pg);
      const agora = await lerNove(pg);
      const ruins = IDS.filter(id => agora[id] !== FABRICA[id]);
      chk('estado sem obfb nenhum: os nove caem no padrao de fabrica da tabela',
          ruins.length === 0, ruins.map(id => id + '=' + JSON.stringify(agora[id])).join(' | '));
      await pg.close();
    }
    /* 5. CHAVE ANTIGA MAIS CURTA que a tabela: o que falta cai na fabrica, o que existe entra. */
    {
      const st = JSON.parse(ANTIGO.distintos);
      st.t.obfb = 'So o primeiro';
      const pg = await abrir(br, 'http://127.0.0.1:8942');
      await armar(pg);
      await semear(pg, JSON.stringify(st));
      await pg.reload();
      await prepararAbas(pg);
      const agora = await lerNove(pg);
      chk('obfb mais curta: o primeiro entra', agora[ID('t','nome')] === 'So o primeiro', agora[ID('t','nome')]);
      chk('obfb mais curta: os outros quatro caem na fabrica',
          MARCAS.t.slice(1).every(v => agora[ID('t', v)] === FABRICA[ID('t', v)]),
          MARCAS.t.slice(1).map(v => v + '=' + JSON.stringify(agora[ID('t', v)])).join(' '));
      await pg.close();
    }
  } finally { await br.close(); srv.close(); }
}

/* ============================================================================
   FASE 3 -- o PRESET antigo, aplicado pelo botao da propria lista
   ============================================================================ */
console.log('\n--- o preset salvo no formato antigo, aplicado na arvore de trabalho ---');
{
  const srv = await servir(RAIZ, 8943);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8943');
    await armar(pg);
    await semear(pg, PRESET_JSON);
    await pg.reload();
    await prepararAbas(pg);
    /* suja os nove ANTES de aplicar: sem isso, "o preset trouxe o texto" e indistinguivel de
       "o campo nunca mudou" */
    await escreverNove(pg, (p, v) => 'SUJO ' + p + '/' + v);
    for(const pref of ['t', 'a']){
      const clicou = await pg.evaluate(p => {
        const b = document.querySelector('#fcp-' + p + '-lista [data-fc-aplicar]');
        if(!b) return false;
        b.click(); return true;
      }, pref);
      chk('preset/' + pref + ': o botao Aplicar existe na lista e foi clicado', clicou === true);
    }
    const agora = await lerNove(pg);
    for(const [p, v] of NOVE)
      chk('preset antigo: ' + ID(p, v) + ' voltou ao SEU texto guardado',
          agora[ID(p, v)] === 'Preset ' + p + '/' + v + ' guardado', JSON.stringify(agora[ID(p, v)]));
    chk('preset antigo: aplicado sem alerta', (await alertas(pg)).length === 0,
        JSON.stringify(await alertas(pg)).slice(0, 200));
    chk('preset antigo: aplicado sem erro de console', soDoBloco(pg.erros).length === 0,
        soDoBloco(pg.erros).slice(0, 2).join(' | '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

/* ============================================================================
   FASE 4 -- o formato NOVO: chave por campo, ida e volta, e a projecao da antiga
   ============================================================================ */
console.log('\n--- o formato novo: uma chave por campo, ida e volta ---');
{
  const srv = await servir(RAIZ, 8944);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8944');
    await armar(pg);
    await prepararAbas(pg);
    const val = (p, v) => 'Novo ' + p + '/' + v + (v === 'hora' ? (' com' + SEP + 'controle') : '');
    await escreverNove(pg, val);
    const st = JSON.parse(await estado(pg));
    for(const [p, v] of NOVE)
      chk('novo: ' + p + '.' + CHAVE(v) + ' guarda o texto do seu campo, sozinho',
          st[p][CHAVE(v)] === val(p, v), JSON.stringify(cod(st[p][CHAVE(v)])));
    /* A CHAVE ANTIGA CONTINUA GRAVADA, e e PROJECAO das novas -- na ordem da tabela. Ela
       continua porque o molde da importacao de arquivo e o que o coleta() devolve agora
       (fcxConformar descarta chave que nao esta no molde): sem ela, um backup anterior
       perderia os nove textos ANTES de a migracao poder ve-los. */
    for(const p of ['t', 'a'])
      chk('novo: ' + p + '.obfb continua gravada, e e a juncao das novas NA ORDEM',
          st[p].obfb === MARCAS[p].map(v => val(p, v)).join(SEP), cod(st[p].obfb));
    /* ida e volta */
    await pg.reload();
    await prepararAbas(pg);
    const volta = await lerNove(pg);
    const perdidos = NOVE.filter(([p, v]) => volta[ID(p, v)] !== val(p, v));
    chk('novo: os nove voltaram inteiros depois de recarregar -- inclusive o que leva o '+
        'caractere de controle, que no formato novo nao parte nada',
        perdidos.length === 0,
        perdidos.map(([p, v]) => ID(p, v) + '=' + JSON.stringify(cod(volta[ID(p, v)]))).join(' | '));
    chk('novo: sem erro de console', soDoBloco(pg.erros).length === 0, soDoBloco(pg.erros).slice(0, 2).join(' | '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

/* ============================================================================
   FASE 5 -- o eco no rotulo, e o endereco gerado na ordem de T_OB_VARS
   ============================================================================ */
console.log('\n--- o eco no rotulo, e a ordem do endereco gerado ---');
const ENDERECO = {};
for(const [nome, raiz, porta] of [['trabalho', RAIZ, 8945], ['referencia', REFDIR, 8946]]){
  const srv = await servir(raiz, porta);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:' + porta);
    await prepararAbas(pg);
    if(nome === 'trabalho'){
      const semEco = await pg.evaluate(ids => ids.filter(id => {
        const lab = document.querySelector('label[for="' + id + '"]');
        return !lab || !lab.querySelector('.fcs-eco');
      }), IDS);
      chk('eco: os nove ganharam <small class="fcs-eco"> no rotulo', semEco.length === 0, semEco.join(', '));
      const ecoErrado = [];
      for(const id of IDS){
        const alvo = 'Zr texto do eco de ' + id;
        await set(pg, id, alvo);
        const visto = await pg.evaluate(i => {
          const e = document.querySelector('label[for="' + i + '"] .fcs-eco');
          return e ? e.textContent : null;
        }, id);
        if(!visto || visto.indexOf(alvo) < 0) ecoErrado.push(id + '=' + visto);
      }
      chk('eco: cada rotulo passou a mostrar o texto ATUAL do campo', ecoErrado.length === 0,
          ecoErrado.slice(0, 3).join(' | '));
    }
    /* A ORDEM. Os cinco marcadores sao LIGADOS AO CONTRARIO de proposito: o comentario de
       tObMarcadas promete que "a ordem em que o operador clicou nao pode mudar o endereco
       gerado", e chave por campo nao pode ter deixado a ordem depender de ordem de objeto. */
    await clicar(pg, 'aba-tidy');
    await set(pg, 't-path', 'fotocerta/natal-2026');
    await set(pg, 't-ob-url', 'https://www.fotocerta.com.br/obrigado');
    for(const v of ['quando', 'hora', 'data', 'tipo', 'nome'])
      await pg.evaluate(m => { const e = document.getElementById('t-ob-' + m);
        e.checked = true; e.dispatchEvent(new Event('change', {bubbles:true})); }, v);
    await clicar(pg, 't-gerar');
    await pg.waitForTimeout(80);
    ENDERECO[nome] = await ler(pg, 't-out4');
    await pg.close();
  } finally { await br.close(); srv.close(); }
}
{
  const esperado = 'https://www.fotocerta.com.br/obrigado?nome={{contact.name}}&tipo={{booking_type.title}}'+
                   '&data={{booking.date}}&hora={{booking.time}}&quando={{booking.starts_at}}';
  chk('ordem: o endereco sai na ordem de T_OB_VARS mesmo clicando ao contrario',
      String(ENDERECO.trabalho).trim() === esperado, String(ENDERECO.trabalho).trim());
  chk('ordem: e e o MESMO endereco que ' + REF + ' produz, caractere por caractere',
      String(ENDERECO.trabalho) === String(ENDERECO.referencia),
      REF + '=' + String(ENDERECO.referencia).trim());
}

/* ============================================================================
   FASE 6 -- a fabrica divergente plantada nos nove, e denunciada
   ============================================================================ */
console.log('\n--- a fabrica divergente plantada nos nove ---');
{
  const dir = path.join(tmp, 'fab');
  fs.mkdirSync(dir);
  let sujo = HTML, plantados = 0;
  for(const id of IDS){
    const m = new RegExp('(<input[^>]*id="' + id + '"[^>]*value=")([^"]*)(")').exec(sujo);
    if(!m) continue;
    sujo = sujo.replace(m[0], m[1] + m[2] + ' ZZ' + m[3]);
    plantados++;
  }
  chk('planta: o value= dos nove foi alterado no arquivo', plantados === IDS.length, plantados + ' de ' + IDS.length);
  fs.writeFileSync(path.join(dir, 'index.html'), sujo);
  fs.copyFileSync(path.join(RAIZ, 'fc-compartilhado.js'), path.join(dir, 'fc-compartilhado.js'));
  const srv = await servir(dir, 8947);
  const br = await navegador();
  try{
    const pg = await br.newPage();
    await pg.addInitScript(() => {
      window.__erros = [];
      const orig = console.error;
      console.error = function(){
        try{ window.__erros.push(Array.prototype.map.call(arguments,
          a => (a && a.message) ? a.message : String(a)).join(' ')); }catch(e){}
        return orig.apply(console, arguments);
      };
    });
    await pg.goto('http://127.0.0.1:8947/index.html');
    const barra = await pg.$eval('#fc-falhas', el => el.textContent).catch(() => '');
    const msg = (await pg.evaluate(() => window.__erros.slice())).join(' | ');
    chk('fabrica: a barra vermelha acendeu e nomeou o passo dos textos',
        barra.indexOf('Textos configuraveis') >= 0, barra.slice(0, 200));
    const mudos = IDS.filter(id => msg.indexOf('/' + id) < 0);
    chk('fabrica: os NOVE foram nomeados na denuncia (fcTxtFabricaDiverge os alcanca)',
        mudos.length === 0, mudos.join(', '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

/* ============================================================================
   FASE 7 -- o caractere de controle: MEDIDO pelos quatro caminhos de entrada
   ============================================================================
   A pergunta e se o formato ANTIGO podia ser ambiguo -- um texto com o proprio
   separador dentro dele parte o estado em pedacos errados. A resposta nao se
   supoe: mede-se se o caractere chega ao campo por teclado, por insercao de
   texto (o caminho de IME), por preenchimento e por COLAGEM DE VERDADE, com a
   area de transferencia da plataforma. O resultado medido fica escrito no
   proprio teste: o dia em que um navegador passar a filtrar o caractere, esta
   prova fala em vez de continuar concordando por inercia.
   ============================================================================ */
console.log('\n--- o caractere de controle chega ao campo? (medicao) ---');
const ENTRADA = {};
{
  const srv = await servir(RAIZ, 8948);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8948');
    await prepararAbas(pg);
    await clicar(pg, 'aba-tidy');
    /* abre toda secao recolhida: o campo precisa estar VISIVEL para o teclado alcanca-lo */
    await pg.evaluate(() => {
      document.querySelectorAll('.secao.dobra').forEach(c => {
        const b = document.getElementById(c.getAttribute('aria-controls'));
        if(b && b.className.indexOf('fcd-oculto') >= 0) c.click();
      });
    });
    const alvo = 'A' + SEP + 'B';
    const loc = pg.locator('#t-ob-fb-nome');
    await loc.scrollIntoViewIfNeeded();
    await loc.fill(''); await loc.click(); await pg.keyboard.type(alvo);
    ENTRADA.teclado = await ler(pg, 't-ob-fb-nome');
    await loc.fill(''); await loc.click(); await pg.keyboard.insertText(alvo);
    ENTRADA.insercao = await ler(pg, 't-ob-fb-nome');
    await loc.fill(alvo);
    ENTRADA.preenchimento = await ler(pg, 't-ob-fb-nome');
    try{
      await pg.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await pg.evaluate(t => navigator.clipboard.writeText(t), alvo);
      await loc.fill(''); await loc.click();
      await pg.keyboard.press('ControlOrMeta+V');
      await pg.waitForTimeout(200);
      ENTRADA.colagem = await ler(pg, 't-ob-fb-nome');
    }catch(e){ ENTRADA.colagem = '(nao medivel: ' + String(e.message).slice(0, 60) + ')'; }
    for(const k of Object.keys(ENTRADA)) console.log('    ' + k.padEnd(15) + ' -> ' + JSON.stringify(cod(ENTRADA[k])));
    /* O RESULTADO MEDIDO EM 11/09/2026: os quatro caminhos entregam o caractere INTACTO.
       Nao e impossivel de digitar -- entao o formato antigo E ambiguo, e a prova disso e a
       linha abaixo. O que o teste cobra e que a arvore de trabalho se comporte, diante de um
       estado antigo assim, EXATAMENTE como a referencia se comportava (cenario 'controle' da
       fase 2): a ambiguidade e herdada do formato antigo, e nao criada por esta rodada. E o
       formato NOVO acaba com ela, porque cada texto tem a propria chave (fase 4). */
    chk('medido: o caractere de controle CHEGA ao campo pelos quatro caminhos '+
        '(logo, o formato antigo e ambiguo -- o novo nao)',
        ['teclado','insercao','preenchimento','colagem'].every(k => String(ENTRADA[k]) === alvo),
        Object.keys(ENTRADA).map(k => k + '=' + JSON.stringify(cod(ENTRADA[k]))).join(' '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

/* ============================================================================
   FASE 8 -- os nove com texto hostil, com o BLOCO EXECUTANDO numa pagina
   ============================================================================
   Sem query nenhuma no endereco (TidyCal) e com so o '?pac=' (Agendamento por
   pacote): e assim que o texto RESERVA e o que aparece -- que e a unica
   circunstancia em que estes nove campos sao lidos pelo cliente.
   ============================================================================ */
console.log('\n--- os nove hostis, com o bloco executando ---');
const hostil = (p, v) => "Zr " + p + "/" + v + " d'A \\ \"b\" </script>";
const MARCADORES = NOVE.map(([p, v]) => '<div>' + p + ': {{' + v + '}}</div>').join('\n');
const { valores, alertas: alGer, erros: errGer } = await gerarNaFerramenta(async pg => {
  await preparar(pg); await conteudo(pg); await cobranca(pg, {});
  await prepararAbas(pg);
  for(const [p, v] of NOVE) await set(pg, ID(p, v), hostil(p, v));
  await clicar(pg, 'aba-tidy'); await clicar(pg, 't-gerar');
  await clicar(pg, 'aba-pac');  await clicar(pg, 'a-gerar');
  await pg.waitForTimeout(120);
}, ['t-out5', 'a-out3'], {porta: 8949});
chk('hostil: gerou os dois blocos sem alerta', alGer.length === 0, JSON.stringify(alGer).slice(0, 300));
chk('hostil: gerou os dois blocos sem erro de console', errGer.length === 0, errGer.slice(0, 2).join(' | '));

for(const [saida, marcas, busca, porta] of [
      /* t-out5, e nao t-out1: a saida 1 e o bloco do CALENDARIO -- a Tag Body da pagina de
         obrigado da TidyCal e a saida 5. Medido depois de a primeira versao deste teste rodar
         o bloco errado e acusar "o texto nao chegou" sobre um bloco que nunca teve o que
         trocar: o codigo executou limpo e os marcadores ficaram crus na tela, que e a marca
         dessa confusao. */
      ['t-out5', MARCAS.t.map(v => ['t', v]), '', 8950],
      ['a-out3', MARCAS.a.map(v => ['a', v]), '?pac=MINI', 8951]]){
  const bloco = valores[saida];
  chk(saida + ': a ferramenta produziu o bloco', !!bloco && bloco.length > 100);
  if(!bloco) continue;
  const r = await comBlocoNaPagina({
    bloco, busca, porta,
    corpoAntes: '<div id="fca-ob-raiz"></div>\n' + MARCADORES,
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(200);
      return { marco: await pg.$eval('#fim-do-documento', el => el.textContent).catch(() => null),
               corpo: await textoSemScripts(pg) };
    }
  });
  chk(saida + ': o documento nao foi engolido por um </script', r.marco === 'fim', String(r.marco));
  const p = soDoBloco(r.erros);
  chk(saida + ': sem erro de console -- apostrofa e barra sobreviveram ao literal JS',
      p.length === 0, p.slice(0, 2).join(' | '));
  for(const [pref, v] of marcas)
    chk(saida + ': o texto reserva hostil de ' + ID(pref, v) + ' chegou INTEIRO a tela',
        String(r.corpo).indexOf(hostil(pref, v)) >= 0, String(r.corpo).slice(0, 240));
}

fs.rmSync(tmp, {recursive: true, force: true});
process.exit(resumo());
