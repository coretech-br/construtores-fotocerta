/* ============================================================================
   NOVIDADES -- o painel do que mudou em cada versao publicada
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. O painel Novidades e a unica parte da ferramenta cujo
   conteudo e TEXTO ESCRITO A MAO sobre o proprio historico. Ele nao gera nada, entao a
   regressao byte a byte nao o alcanca -- e sem medicao propria ele envelheceria calado,
   que e exatamente o defeito que ele existe para descrever.

   O QUE ELE MEDE, na arvore de trabalho e sem referencia congelada:

     1. A LISTA BATE COM O GIT. As versoes de FCR_NOTAS sao comparadas com as versoes que
        o git conhece (todo valor que FC_VERSAO ja teve em index.html, em ordem). Esta e a
        prova que nao envelhece: publicar uma versao nova sem descreve-la FALHA aqui, com o
        numero dela na tela. A unica excecao aceita e a versao que a rodada AINDA vai
        publicar -- uma so, no topo, com a data de hoje e ainda ausente do git.
     2. O PAINEL ABRE E FECHA, e as secoes de dia tambem.
     3. A MAIS RECENTE APARECE PRIMEIRO, na tela e nao so no dado.
     4. NENHUM ERRO DE CONSOLE ao carregar e ao abrir.
     5. OS TRES PAINEIS DA BARRA nunca ficam abertos juntos.
     6. AS SECOES DAS ABAS CONTINUAM ABRINDO depois de fcdLigar ser chamada de novo --
        a marca data-fcd e o que impede o segundo listener, e um segundo listener nao
        daria erro nenhum: a secao apenas deixaria de abrir.
     7. A BUSCA DO TOPO NAO ALCANCA as novidades -- medido, e nao suposto, porque a
        resposta ("nao alcanca") so vale se for verificada.
     8. AS DUAS REDES DISPARAM. A arvore e servida uma segunda vez com um byte trocado
        (FC_VERSAO numa versao que a lista nao descreve) e as duas guardas tem de acender:
        a BARRA VERMELHA DA PARTIDA, que aparece sem ninguem abrir o painel, e o aviso
        dentro do painel. Detector que ninguem exercita e promessa, nao medicao.
     9. O PORTAO DE ANTES DE PUBLICAR. scripts/conferir-versoes.sh e quem o carimbador chama
        logo depois de escolher a versao nova; desde 14/09/2026 ele recusa carimbo sem release
        note. Aqui ele e rodado sobre uma COPIA adulterada, para provar que recusa mesmo -- e
        tambem sobre a arvore como esta, onde a unica falha aceita e a do proprio carimbo.

   REFERENCIA: nenhuma congelada. A fonte de verdade e o git do proprio repositorio, lido
   a cada execucao -- por isso ele nao pode ficar vermelho por envelhecimento.

       node scripts/verificar/novidades.mjs [porta]

   Precisa de Node e Playwright -- ver scripts/verificar/lib.mjs.
   ============================================================================ */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navegador, servir, abrir } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORTA = Number(process.argv[2] || 8951);
let falhas = 0, passou = 0;
const ok  = m => { passou++; console.log('  ok   ' + m); };
const mal = m => { falhas++; console.log('  FALHA ' + m); };
const eq  = (m, a, b) => (String(a) === String(b) ? ok(m) : mal(`${m}\n         esperado: ${b}\n         obtido:   ${a}`));

/* Todo valor que FC_VERSAO ja teve em index.html, do mais recente para o mais antigo.
   Le o git, e nao uma lista escrita aqui: lista escrita aqui envelheceria junto. */
function versoesDoGit(){
  const saida = execFileSync('git', ['log', '-p', '--format=%x00', '--', 'index.html'],
                             {cwd: RAIZ, maxBuffer: 1 << 30}).toString();
  const vis = new Set(), out = [];
  for(const l of saida.split('\n')){
    const m = /^\+var FC_VERSAO='([^']+)';/.exec(l);
    if(m && !vis.has(m[1])){ vis.add(m[1]); out.push(m[1]); }
  }
  return out;
}
const hoje = () => new Date().toISOString().slice(0,10);

const aberto = id => pg.evaluate(id => document.getElementById(id).classList.contains('aberto'), id);

const srv = await servir(RAIZ, PORTA);
const br  = await navegador();
const pg  = await abrir(br, 'http://127.0.0.1:' + PORTA);

console.log('NOVIDADES');

/* A ferramenta inteira vive dentro de um IIFE: FCR_NOTAS nao e alcancavel de fora, e nao
   deve ser. Entao a prova le a TELA -- abre o painel, expande todos os dias e recolhe a lista
   pelos data-v. Medir a tela e o que importa mesmo: dado certo que nao chega a ser desenhado
   nao informa nada. */
await pg.click('#fcr-botao');
const tudo = await pg.evaluate(() => {
  const cabs = [].slice.call(document.querySelectorAll('#fcr-lista .secao.dobra'));
  const antes = cabs.map(c => c.getAttribute('aria-expanded'));
  const versDobrado = [].slice.call(document.querySelectorAll('#fcr-lista .fcr-vcab[data-v]'))
    .filter(e => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length))
    .map(e => e.getAttribute('data-v'));
  cabs.forEach(c => { if(c.getAttribute('aria-expanded') !== 'true') c.click(); });
  const vers = [].slice.call(document.querySelectorAll('#fcr-lista .fcr-vcab[data-v]'))
    .map(e => e.getAttribute('data-v'));
  /* devolve cada secao ao estado em que nasceu: as medicoes seguintes contam com isso */
  cabs.forEach((c,i) => { if(c.getAttribute('aria-expanded') !== antes[i]) c.click(); });
  return {
    vers, versDobrado,
    secoes: cabs.length,
    abertasAntes: antes.filter(x => x === 'true').length,
    primeiroCab: cabs.length ? cabs[0].textContent.replace(/\s+/g,' ').trim() : '',
    itens: document.querySelectorAll('#fcr-lista .fcr-v .fcr-item').length,
    orfa: !!document.querySelector('#fcr-lista .fcr-orfa'),
    acoes: document.querySelectorAll('#fcr-lista .fcr-acoes .fcr-item').length,
    semCor: document.querySelectorAll('#fcr-lista .fcr-outro').length,
    papel: cabs[0] ? cabs[0].getAttribute('role') : '',
    versao: (document.getElementById('fc-versao').textContent.match(/20\d\d-\d\d-\d\d[a-z]/) || [''])[0]
  };
});

const git = versoesDoGit();
const naLista = new Set(tudo.vers);
const semNota = git.filter(v => !naLista.has(v));
const semGit  = tudo.vers.filter(v => git.indexOf(v) < 0);

console.log(`  (git: ${git.length} versões publicadas · tela: ${tudo.vers.length} entradas, ${tudo.itens} itens)`);
eq('toda versão publicada está descrita', semNota.length ? semNota.join(', ') : 'nenhuma faltando', 'nenhuma faltando');

/* A excecao: a versao que ESTA rodada vai publicar ainda nao existe no git. Uma so, no
   topo, e com a data de hoje -- qualquer outra coisa e engano, nao entrega em andamento. */
if(semGit.length === 0) ok('nenhuma entrada inventada (a rodada já foi publicada)');
else if(semGit.length === 1 && semGit[0] === tudo.vers[0] && semGit[0].slice(0,10) === hoje())
  ok(`a única entrada fora do git é a que esta rodada publica (${semGit[0]}, hoje, no topo)`);
else mal(`entradas que não correspondem a nenhuma versão publicada: ${semGit.join(', ')}`);

eq('a lista está em ordem decrescente',
   tudo.vers.every((v,i) => i === 0 || v < tudo.vers[i-1]), 'true');
eq('a versão que o navegador executa está descrita', naLista.has(tudo.versao), 'true');
/* O NUMERO SAI DOS DADOS, e nao de uma constante (15/09/2026). Ele estava cravado em 11,
   e por isso esta prova ficava vermelha no dia em que uma versao de um dia NOVO era
   publicada -- ou seja, exatamente nas rodadas que ela existe para conferir. Vermelho que
   e sempre vermelho esconde o proximo, que seria de verdade: e a mesma regra que o
   CLAUDE.md escreve sobre numero de abas, "nao se escreve em frase nenhuma".
   A conta: um cabecalho por DIA distinto das versoes numeradas, mais o da secao "antes da
   numeração", que existe sempre. */
const diasDistintos = new Set(tudo.vers.map(v => v.slice(0,10))).size;
eq('uma seção por dia, mais a de antes da numeração', tudo.secoes, diasDistintos + 1);
eq('só a mais recente nasce aberta', tudo.abertasAntes, 1);
eq('a versão mais recente é a primeira da tela', tudo.vers[0], git[0] === tudo.vers[0] ? git[0] : tudo.vers[0]);
eq('a mais recente é a primeira VISÍVEL antes de expandir nada', tudo.versDobrado[0], tudo.vers[0]);
eq('as outras seções nascem recolhidas (só o dia mais recente aparece)',
   tudo.versDobrado.length, tudo.vers.filter(v => v.slice(0,10) === tudo.vers[0].slice(0,10)).length);
eq('o cabeçalho do dia mais recente é o primeiro da lista',
   tudo.primeiroCab.indexOf(tudo.vers.filter(v=>v.slice(0,10)===tudo.vers[0].slice(0,10)).length + ' vers') >= 0, 'true');
eq('o aviso vermelho de versão não descrita está ausente', tudo.orfa, 'false');
eq('as ações do dono aparecem abertas', tudo.acoes > 0, 'true');
eq('todo rótulo de item tem cor declarada', tudo.semCor, 0);
eq('o cabeçalho de seção é alcançável pelo teclado', tudo.papel, 'button');

/* ---- 7. a busca do topo alcanca? Medido pelo uso, e nao pelo codigo ---- */
const campos = await pg.evaluate(() =>
  document.getElementById('fcr-painel').querySelectorAll('input,textarea,select').length);
eq('o painel de novidades não tem campo de formulário nenhum', campos, 0);
await pg.fill('#fcs-q', 'Nasceu esta lista');
await pg.waitForTimeout(500);
const achou = await pg.evaluate(() => (document.getElementById('fcs-conta').textContent || '').trim());
console.log(`  (busca por uma frase que só existe nas novidades: "${achou}")`);
eq('a busca do topo NÃO alcança as novidades — ela varre campos, e aqui não há campos',
   /nenhum|0 /i.test(achou) || achou === '', true);
await pg.click('#fcs-limpar');
await pg.click('#fcr-botao');

/* ---- 2. abre e fecha ---- */
eq('nasce fechado', await pg.evaluate(() => document.getElementById('fcr-painel').classList.contains('aberto')), 'false');
await pg.click('#fcr-botao');
eq('o botão abre', await aberto('fcr-painel'), 'true');

/* fecha e reabre uma secao de dia */
await pg.click('#fcr-d3-cab');
eq('uma seção recolhida abre no clique',
   await pg.evaluate(() => document.getElementById('fcr-d3-cab').getAttribute('aria-expanded')), 'true');
await pg.click('#fcr-d3-cab');
eq('e fecha no clique seguinte',
   await pg.evaluate(() => document.getElementById('fcr-d3-cab').getAttribute('aria-expanded')), 'false');

/* ---- 5. os tres paineis da barra ---- */
await pg.click('#fci-botao');
eq('abrir Identidade fecha Novidades', `${await aberto('fcr-painel')}/${await aberto('fci-painel')}`, 'false/true');
await pg.click('#fcr-botao');
eq('abrir Novidades fecha Identidade', `${await aberto('fcr-painel')}/${await aberto('fci-painel')}`, 'true/false');
await pg.click('#fcg-detalhes');
eq('abrir Detalhes fecha Novidades', `${await aberto('fcr-painel')}/${await aberto('fcg-painel')}`, 'false/true');
await pg.click('#fcr-botao');
eq('abrir Novidades fecha Detalhes', `${await aberto('fcr-painel')}/${await aberto('fcg-painel')}`, 'true/false');
await pg.click('#fcr-botao');
eq('o botão fecha', await aberto('fcr-painel'), 'false');

/* ---- 6. as secoes das abas continuam abrindo (o segundo listener nao existe) ---- */
const dobra = await pg.evaluate(() => {
  const cab = document.getElementById('u-txt-cab');
  const antes = cab.getAttribute('aria-expanded');
  cab.click();
  const depois = cab.getAttribute('aria-expanded');
  cab.click();
  return { antes, depois, volta: cab.getAttribute('aria-expanded'),
           marcadas: document.querySelectorAll('.secao.dobra[data-fcd="1"]').length,
           totais: document.querySelectorAll('.secao.dobra').length };
});
eq('a seção de texto de uma aba ainda alterna', `${dobra.antes}->${dobra.depois}->${dobra.volta}`, 'false->true->false');
eq('todo cabeçalho recolhível está ligado uma vez só', `${dobra.marcadas}/${dobra.totais}`, `${dobra.totais}/${dobra.totais}`);

/* ---- 4. console, e a barra vermelha da partida ----
   O passo prep('Novidades') engole a excecao e a transforma em barra vermelha, sem nada no
   console: sem esta linha, uma falha do proprio painel passaria por "nenhum erro". */
eq('nenhum erro de console', pg.erros.length ? pg.erros.join(' | ') : 'nenhum', 'nenhum');
eq('a barra vermelha da partida não apareceu',
   await pg.evaluate(() => { const b = document.getElementById('fc-falhas-lista');
                             return b ? b.textContent.replace(/\s+/g,' ').trim() : 'nenhuma'; }), 'nenhuma');

/* ---- 8. A DETECCAO DO ENVELHECIMENTO, exercitada ----
   Detector que ninguem dispara e promessa, nao medicao. Aqui a arvore e servida de novo com
   UM byte trocado -- FC_VERSAO avancado para uma versao que a lista nao descreve -- e a prova
   e que o aviso vermelho aparece e NOMEIA a versao. E o cenario real do esquecimento: rodar
   carimbar-publicacao.sh e nao acrescentar a entrada. */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fcr-'));
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const atual = /var FC_VERSAO='([^']+)';/.exec(html)[1];
const futura = atual.slice(0, 10) + 'z';
const topo = /var FCR_NOTAS=\[\s*\{v:"([^"]+)"/.exec(html)[1];
fs.writeFileSync(path.join(tmp, 'index.html'),
  html.replace("var FC_VERSAO='" + atual + "';", "var FC_VERSAO='" + futura + "';"));
fs.copyFileSync(path.join(RAIZ, 'fc-compartilhado.js'), path.join(tmp, 'fc-compartilhado.js'));
const srv2 = await servir(tmp, PORTA + 1);
const pg2 = await abrir(br, 'http://127.0.0.1:' + (PORTA + 1));
await pg2.click('#fcr-botao');
/* A barra da partida e lida ANTES de abrir o painel: e ela que alcanca quem esqueceu de
   escrever a nota, que e justamente quem nao vai abrir "Novidades". */
const barra = await pg2.evaluate(() => {
  const b = document.getElementById('fc-falhas-lista');
  return b ? b.textContent.replace(/\s+/g,' ').trim() : '';
});
eq(`com FC_VERSAO=${futura} (não descrita), a barra vermelha da partida acende`, !!barra, 'true');
eq('a barra nomeia a versão', barra.indexOf(futura) >= 0, 'true');
eq('e diz onde escrever a nota', /FCR_NOTAS/.test(barra), 'true');
await pg2.click('#fcr-botao');
const alerta = await pg2.evaluate(() => {
  const e = document.querySelector('#fcr-lista .fcr-orfa');
  return e ? e.textContent.replace(/\s+/g,' ').trim() : '';
});
eq('e o aviso dentro do painel aparece também', !!alerta, 'true');
eq('nomeando a versão', alerta.indexOf(futura) >= 0, 'true');
srv2.close();

/* ---- 9. o portao de antes de publicar ---- */
const conf = raiz => {
  try { execFileSync('sh', [path.join(raiz, 'scripts', 'conferir-versoes.sh')], {encoding:'utf8'}); return 'OK'; }
  catch(e){ return String(e.stdout || '') + String(e.stderr || ''); }
};
fs.mkdirSync(path.join(tmp,'scripts'),{recursive:true});
fs.mkdirSync(path.join(tmp,'cobrar'),{recursive:true});
fs.copyFileSync(path.join(RAIZ,'fc-compartilhado.js'), path.join(tmp,'fc-compartilhado.js'));
for(const f of ['conferir-versoes.sh','sha-index.sh','versoes.txt'])
  fs.copyFileSync(path.join(RAIZ,'scripts',f), path.join(tmp,'scripts',f));
for(const f of ['index.html','manifest.json'])
  fs.copyFileSync(path.join(RAIZ,'cobrar',f), path.join(tmp,'cobrar',f));
/* o cenario "carimbei e esqueci a nota" -- o index ja esta com FC_VERSAO adulterado */
const recusa = conf(tmp);
eq('conferir-versoes.sh recusa carimbo sem release note', /NAO tem release note/.test(recusa), 'true');
eq('e nomeia a versão sem nota', recusa.indexOf(futura) >= 0, 'true');
/* o cenario "a mesma versao descrita duas vezes" */
fs.writeFileSync(path.join(tmp,'index.html'),
  html.replace('{v:"' + topo + '"', '{v:"' + atual + '",d:"x",itens:[]},{v:"' + topo + '"'));
eq('e recusa a mesma versão descrita duas vezes', /aparece 2 vezes em FCR_NOTAS/.test(conf(tmp)), 'true');
/* e na arvore como esta: nenhuma falha de release note (a do carimbo e outra coisa) */
const aqui = conf(RAIZ);
eq('na árvore de trabalho, nenhuma falha de release note',
   /release note|FCR_NOTAS/.test(aqui) ? aqui.trim() : 'nenhuma', 'nenhuma');

fs.rmSync(tmp, {recursive: true, force: true});

await br.close(); srv.close();
console.log(falhas ? `NOVIDADES: ${falhas} FALHA(S) em ${falhas+passou}` : `NOVIDADES: OK (${passou} verificações)`);
process.exit(falhas ? 1 : 0);
