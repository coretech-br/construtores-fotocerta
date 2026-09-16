/* ============================================================================
   "EXPORTAR TUDO -- SEM OS DADOS" NAO PODE LEVAR CREDENCIAL EMBORA
   ============================================================================
   POR QUE ISTO EXISTE. A ferramenta oferece duas exportacoes do mesmo backup, e a
   diferenca entre elas e a unica coisa que separa um arquivo que pode ser enviado a
   outra pessoa de um arquivo que nao pode. O "sem os dados" existe para o dono
   repassar a configuracao dele -- ou guarda-la num lugar menos protegido -- sem levar
   junto a chave Pix, o Client ID do PayPal e o WhatsApp, que sao exatamente o que a
   regra deste repositorio publico nunca versiona nem compartilha.

   O QUE ELE IMPEDE. Ate hoje nada media isso. O desenho atual e simples -- a
   identidade e UM bloco no envelope do arquivo (fcxIdentidadeParaArquivo), e o "sem
   os dados" nao o inclui --, e e justamente por ser simples que ele e facil de
   quebrar sem ninguem perceber: basta um campo de identidade voltar a ser gravado
   dentro de uma aba (era assim ate ago/2026), ou o rascunho passar a carregar uma
   copia de alguma coisa que o gerador ja calculou. Nenhuma dessas mudancas da erro,
   nenhuma muda um byte de codigo gerado, e portanto regressao.sh e cego para todas.
   O defeito so apareceria no dia em que o arquivo ja estivesse no computador de
   outra pessoa.

   AS DUAS METADES, E POR QUE AS DUAS. Uma prova que so dissesse "nao achei a chave
   Pix no arquivo" ficaria VERDE se a exportacao estivesse quebrada e produzindo
   arquivo vazio -- o pior resultado possivel passando pelo melhor teste possivel.
   Por isso a metade complementar e obrigatoria aqui: o arquivo "COM os dados" tem de
   conter os mesmos tres valores, e o "sem os dados" tem de continuar trazendo a
   configuracao das abas. As duas metades juntas dizem o que interessa -- a unica
   coisa que o "sem os dados" perde e a identidade.

   O COMPARADOR DO MEIO E A MEDIDA MAIS FORTE DESTE ARQUIVO. Em vez de conferir uma
   lista escrita a mao do que deveria sobreviver -- lista que envelhece a cada chave
   nova do formato --, ele tira dos DOIS arquivos o envelope de identidade e o
   carimbo de hora e exige que o RESTO seja identico caractere por caractere. Assim,
   chave nova do formato entra na prova sozinha: se ela viajar diferente entre os
   dois arquivos, esta linha fala.

   OS VALORES SAO RECONHECIVEIS DE PROPOSITO ('zzz-...', 'ZZZ...'). Procurar por
   'Foto Certa' ou por um numero de telefone plausivel encontraria acerto por acaso
   dentro de texto de aba, e um teste que encontra por acaso tambem deixa de
   encontrar por acaso. Nenhum deles e dado real: este arquivo e versionado num
   repositorio publico.

   O WHATSAPP E PROCURADO EM DUAS FORMAS. O campo 'fci-zapnum' filtra tudo o que nao
   for digito enquanto se digita (FC_LIM_CAMPOS), entao o que o dono digitou e o que
   fica guardado podem ser strings diferentes -- e vazamento nao precisa sair na
   forma em que entrou. O teste digita com pontuacao, LE de volta o que o campo
   guardou e procura as duas, mais a versao so de digitos.

   A VOLTA TAMBEM E MEDIDA. Importar um arquivo "sem os dados" nao pode apagar nem
   sujar a identidade que ja esta no navegador de quem importa -- perder a chave Pix
   ao receber a configuracao de outra pessoa seria um estrago tao grande quanto
   vazar a dela. A passagem 2 usa valores de identidade DIFERENTES dos da passagem 1,
   entao "ficou como estava" e "foi sobrescrito pelo arquivo" nao podem ser
   confundidos, e escolhe o caminho MAIS destrutivo da importacao (substituir a tela
   pelo rascunho do arquivo).

   NAO HA REFERENCIA CONGELADA AQUI, e nao e descuido: a pergunta deste arquivo nao e
   "isto mudou desde o commit X", e sim "o arquivo de hoje leva credencial?". A
   resposta e uma propriedade da arvore de hoje, medida nela, e por isso nada aqui
   envelhece quando a rodada for mesclada.

   Nao precisa de internet.

   Roda com:  node scripts/verificar/exportar-sem-dados.mjs [caminho de outra arvore]
   ============================================================================ */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navegador, servir, abrir, set, ler, clicar } from './lib.mjs';
import { chk, resumo } from './pagina.mjs';
import { conteudo } from './cenario.mjs';

/* Um caminho como argumento aponta OUTRA arvore -- e assim que se ve a prova FALHAR
   numa copia adulterada de proposito, que e a unica forma de saber que ela mede mesmo.
   Sem argumento, mede a arvore deste repositorio. */
const RAIZ = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORTA = 8797;

/* A identidade da passagem 1: o que NAO pode aparecer no arquivo "sem os dados".
   'digitado' e o que se digita; o campo pode guardar outra coisa (ver o cabecalho). */
const SEGREDO = {
  chave:  'zzz-chave-secreta@exemplo.com',
  nomer:  'ZZZRECEBEDOR',
  cidade: 'ZZZCIDADE',
  client: 'ZZZCLIENTIDSECRETO123',
  zapnum: '(27) 9 9999-0000'
};
/* Pedacos que tambem nao podem aparecer: vazamento parcial e vazamento. */
const PEDACOS = ['zzz-chave-secreta', 'ZZZCLIENTIDSECRETO', '27999990000', '999990000'];

/* A identidade da passagem 2: DIFERENTE da primeira em todos os cinco campos, para
   "nao foi tocada" nao poder ser confundido com "foi sobrescrita por um valor igual". */
const OUTRA = {
  chave:  'yyy-outra-chave@exemplo.com',
  nomer:  'YYYRECEBEDOR',
  cidade: 'YYYCIDADE',
  client: 'YYYCLIENTIDOUTRO456',
  zapnum: '27988887777'
};

/* Coisas que o arquivo "sem os dados" TEM de continuar levando -- a metade que prova
   que ele ainda serve para alguma coisa. Cada uma vem do cenario compartilhado. */
const UTEIS = [
  ['o produto do Checkout',        'Ensaio de Natal'],
  ['o produto da Mini loja',       'Album 30x30'],
  ['a foto do Slideshow',          'storage.alboom.ninja/exemplo-1.jpg'],
  ['o codigo da Captacao de leads','NATAL26']
];

const chaves = o => Object.keys(o).sort().join(',');

async function preencherIdentidade(pg, ident){
  for(const k of Object.keys(ident)) await set(pg, 'fci-' + k, ident[k]);
}
const lerIdentidade = pg => pg.evaluate(() => {
  const o = {};
  ['chave','nomer','cidade','client','zapnum'].forEach(k => {
    const el = document.getElementById('fci-' + k);
    o[k] = el ? el.value : '(sem campo)';
  });
  return o;
});

/* O texto do modal que esta na tela agora -- e ele que o operador le para decidir. */
const lerModal = pg => pg.evaluate(() => {
  const cx = document.querySelector('.fcg-modal .fcg-cx');
  return cx ? cx.textContent : '';
});
async function clicarNoModal(pg, rotulo){
  await pg.waitForSelector('.fcg-modal .acoes button', {timeout: 15000});
  await pg.evaluate(rot => {
    const bs = Array.prototype.slice.call(document.querySelectorAll('.fcg-modal .acoes button'));
    const b = bs.filter(x => x.textContent.trim() === rot)[0];
    if(!b) throw new Error('sem o botao "' + rot + '" no modal; ha: ' +
      bs.map(x => x.textContent.trim()).join(' | '));
    b.click();
  }, rotulo);
}

/* A EXPORTACAO E CAPTURADA NA SAIDA REAL, e nao remontada aqui. fcxBaixar entrega o
   arquivo por Blob + URL.createObjectURL + <a download>; o gancho fica no
   createObjectURL, entao o que este teste le e exatamente a sequencia de bytes que
   iria para o disco do dono. Reescrever a montagem do JSON no teste seria medir uma
   segunda implementacao, que concorda hoje e diverge amanha. */
async function exportar(pg, comDados){
  await pg.evaluate(() => {
    window.__fcxCapturado = [];
    if(!window.__fcxGancho){
      window.__fcxGancho = true;
      const orig = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function(b){
        try{ window.__fcxCapturado.push(b); }catch(e){}
        return orig(b);
      };
    }
  });
  await clicar(pg, 'fcx-tudo');
  await clicarNoModal(pg, comDados ? 'Com os dados' : 'Sem os dados');
  await pg.waitForFunction(() => window.__fcxCapturado.length > 0, null, {timeout: 15000});
  const texto = await pg.evaluate(async () =>
    await window.__fcxCapturado[window.__fcxCapturado.length - 1].text());
  const aviso = await pg.evaluate(() => {
    const el = document.getElementById('fcx-aviso');
    return el ? el.textContent : '';
  });
  const m = /Arquivo gerado:\s*(\S+\.json)/.exec(aviso);
  return {texto, aviso, nome: m ? m[1] : ''};
}

/* A volta. O arquivo entra pela mesma porta do operador -- o <input type="file"> --,
   e nao por uma chamada direta a fcxImportarTexto: a conferencia de tamanho e a
   leitura do FileReader fazem parte do caminho, e pular o inicio dele mediria outro
   caminho que nao existe na ferramenta. */
async function importar(pg, texto, nome){
  await pg.setInputFiles('#fcx-arquivo', {
    name: nome || 'backup.json', mimeType: 'application/json', buffer: Buffer.from(texto, 'utf8')
  });
  await pg.waitForSelector('.fcg-modal .acoes button', {timeout: 15000});
  const confirmacao = await lerModal(pg);
  await clicarNoModal(pg, 'Importar');
  /* Segundo degrau: o rascunho. Escolhido o caminho MAIS destrutivo de proposito. */
  await pg.waitForSelector('.fcg-modal .acoes button', {timeout: 15000});
  const perguntaRascunho = await lerModal(pg);
  await clicarNoModal(pg, 'Substituir a tela pelo rascunho do arquivo');
  await pg.waitForFunction(() => {
    const el = document.getElementById('fcx-aviso');
    return el && el.textContent.indexOf('Importação concluída') >= 0;
  }, null, {timeout: 15000});
  const final = await pg.evaluate(() => document.getElementById('fcx-aviso').textContent);
  return {confirmacao, perguntaRascunho, final};
}

async function tudo(){
  const srv = await servir(RAIZ, PORTA);
  const br = await navegador();
  const base = 'http://127.0.0.1:' + PORTA;
  try{
    /* ===== PASSAGEM 1: configurar, exportar dos dois jeitos ===== */
    const pg = await abrir(br, base);
    let semDados, comDados, zapGuardado;
    try{
      await conteudo(pg);
      await preencherIdentidade(pg, SEGREDO);
      zapGuardado = await ler(pg, 'fci-zapnum');
      /* Os dois arquivos saem da MESMA tela, um logo depois do outro e sem nada ser
         tocado no meio: qualquer diferenca entre eles so pode vir da escolha. */
      semDados = await exportar(pg, false);
      comDados = await exportar(pg, true);
    } finally { await pg.close(); }

    console.log('\n--- 0. a captura aconteceu ---');
    chk('o WhatsApp foi guardado pelo campo', /^[0-9]+$/.test(zapGuardado || ''),
      'fci-zapnum guardou "' + zapGuardado + '"');
    chk('o arquivo "sem os dados" tem conteudo', (semDados.texto || '').length > 500,
      semDados.texto.length + ' bytes');
    chk('o arquivo "com os dados" tem conteudo', (comDados.texto || '').length > 500,
      comDados.texto.length + ' bytes');

    let sem = null, com = null;
    try{ sem = JSON.parse(semDados.texto); }catch(e){}
    try{ com = JSON.parse(comDados.texto); }catch(e){}
    chk('o "sem os dados" e JSON valido', !!sem);
    chk('o "com os dados" e JSON valido', !!com);
    if(!sem || !com) return;

    console.log('\n--- 1. o "sem os dados" nao leva credencial ---');
    chk('o nome do arquivo diz "-sem-dados"', /-sem-dados\.json$/.test(semDados.nome),
      'nome: "' + semDados.nome + '"');
    chk('o envelope marca dados:false', sem.dados === false, 'dados=' + JSON.stringify(sem.dados));
    chk('nao ha bloco "identidade"', sem.identidade === undefined,
      'identidade=' + JSON.stringify(sem.identidade));
    chk('nao ha bloco "identidadePendente"', sem.identidadePendente === undefined,
      'identidadePendente=' + JSON.stringify(sem.identidadePendente));

    /* A busca e no TEXTO INTEIRO do arquivo, e nao nas chaves que se espera: vazamento
       aparece onde ninguem pensou em olhar, e uma busca por chave conhecida so acha o
       vazamento que ja se sabia possivel. */
    const ondeEsta = (txt, agulha) => {
      const i = txt.indexOf(agulha);
      if(i < 0) return '';
      return 'achado na posicao ' + i + ': ...' +
        txt.substring(Math.max(0, i - 60), i + agulha.length + 60).replace(/\s+/g, ' ') + '...';
    };
    for(const k of Object.keys(SEGREDO)){
      chk('o valor digitado em "' + k + '" nao esta no arquivo',
        semDados.texto.indexOf(SEGREDO[k]) < 0, ondeEsta(semDados.texto, SEGREDO[k]));
    }
    chk('o WhatsApp como o campo o guardou nao esta no arquivo',
      semDados.texto.indexOf(zapGuardado) < 0, ondeEsta(semDados.texto, zapGuardado));
    for(const p of PEDACOS){
      chk('o pedaco "' + p + '" nao esta no arquivo',
        semDados.texto.indexOf(p) < 0, ondeEsta(semDados.texto, p));
    }

    console.log('\n--- 2. a metade complementar: o "com os dados" LEVA ---');
    chk('o nome do arquivo diz "-com-dados"', /-com-dados\.json$/.test(comDados.nome),
      'nome: "' + comDados.nome + '"');
    chk('o envelope marca dados:true', com.dados === true, 'dados=' + JSON.stringify(com.dados));
    chk('ha bloco "identidade"', !!com.identidade && typeof com.identidade === 'object',
      'identidade=' + JSON.stringify(com.identidade));
    chk('a chave Pix esta no arquivo', comDados.texto.indexOf(SEGREDO.chave) >= 0);
    chk('o Client ID esta no arquivo', comDados.texto.indexOf(SEGREDO.client) >= 0);
    chk('o WhatsApp esta no arquivo', comDados.texto.indexOf(zapGuardado) >= 0);
    chk('o nome do recebedor esta no arquivo', comDados.texto.indexOf(SEGREDO.nomer) >= 0);
    chk('a cidade do recebedor esta no arquivo', comDados.texto.indexOf(SEGREDO.cidade) >= 0);
    chk('o recado depois do download avisa que a identidade FICOU FORA',
      semDados.aviso.indexOf('ficou FORA deste arquivo') >= 0, 'aviso: ' + semDados.aviso);
    chk('o recado depois do download avisa que a identidade FOI JUNTO',
      comDados.aviso.indexOf('foi junto') >= 0, 'aviso: ' + comDados.aviso);

    console.log('\n--- 3. o "sem os dados" continua sendo util ---');
    chk('ele traz o rascunho', !!sem.rascunho && typeof sem.rascunho === 'object');
    chk('ele traz as bibliotecas de presets de aba',
      !!sem.presetsDeAba && typeof sem.presetsDeAba === 'object');
    chk('ele traz a paleta (cor nao e credencial)',
      !!sem.paleta && typeof sem.paleta === 'object', 'paleta=' + JSON.stringify(sem.paleta));
    for(const [rot, agulha] of UTEIS){
      chk(rot + ' sobreviveu', semDados.texto.indexOf(agulha) >= 0, 'procurei "' + agulha + '"');
    }

    /* A MEDIDA MAIS FORTE: tirados o envelope de identidade e o carimbo de hora, os
       dois arquivos tem de ser identicos. Assim nenhuma lista escrita a mao precisa
       ser mantida aqui -- chave nova do formato entra na prova sozinha. */
    const semEnvelope = o => {
      const c = JSON.parse(JSON.stringify(o));
      delete c.identidade; delete c.identidadePendente; delete c.geradoEm; delete c.dados;
      return JSON.stringify(c);
    };
    const a = semEnvelope(sem), b = semEnvelope(com);
    let primeiraDif = -1;
    for(let i = 0; i < Math.max(a.length, b.length); i++){ if(a[i] !== b[i]){ primeiraDif = i; break; } }
    chk('fora a identidade, os dois arquivos sao identicos', a === b,
      primeiraDif < 0 ? '' : ('primeira diferenca na posicao ' + primeiraDif + ': sem="' +
        a.substring(primeiraDif, primeiraDif + 90) + '" / com="' +
        b.substring(primeiraDif, primeiraDif + 90) + '"'));
    chk('as chaves do envelope diferem SO no bloco de identidade',
      chaves(sem) === chaves(com).split(',').filter(k => k !== 'identidade' && k !== 'identidadePendente').join(','),
      'sem=[' + chaves(sem) + '] com=[' + chaves(com) + ']');

    /* ===== PASSAGEM 2: a volta ===== */
    console.log('\n--- 4. importar o "sem os dados" nao mexe na identidade de quem importa ---');
    const pg2 = await abrir(br, base);
    try{
      await preencherIdentidade(pg2, OUTRA);
      const antes = await lerIdentidade(pg2);
      const zapAntes = antes.zapnum;
      const r = await importar(pg2, semDados.texto, semDados.nome);
      const depois = await lerIdentidade(pg2);

      chk('a confirmacao DIZ que o arquivo nao traz identidade',
        r.confirmacao.indexOf('NÃO traz a identidade') >= 0,
        'confirmacao: ' + r.confirmacao.substring(0, 400));
      chk('a importacao terminou', r.final.indexOf('Importação concluída') >= 0, 'final: ' + r.final);
      chk('o recado final DIZ que a identidade nao foi tocada',
        r.final.indexOf('não foi tocada') >= 0, 'final: ' + r.final);
      chk('o rascunho do arquivo foi aplicado na tela',
        r.final.indexOf('rascunho do arquivo foi aplicado') >= 0, 'final: ' + r.final);

      for(const k of Object.keys(OUTRA)){
        const esperado = (k === 'zapnum') ? zapAntes : OUTRA[k];
        chk('"' + k + '" continua o de quem importou',
          depois[k] === esperado, 'antes="' + esperado + '" depois="' + depois[k] + '"');
      }
      for(const k of Object.keys(SEGREDO)){
        chk('"' + k + '" nao virou o valor de quem exportou',
          depois[k] !== SEGREDO[k], 'depois="' + depois[k] + '"');
      }
      chk('nenhum campo de identidade ficou vazio', Object.keys(depois).every(k => depois[k] !== ''),
        JSON.stringify(depois));

      const guardado = await pg2.evaluate(() => localStorage.getItem('fcConstrutoresIdentidade') || '');
      chk('o armazenamento da identidade guarda a de quem importou',
        guardado.indexOf(OUTRA.chave) >= 0 && guardado.indexOf(OUTRA.client) >= 0,
        'fcConstrutoresIdentidade=' + guardado.substring(0, 300));
      chk('o armazenamento da identidade nao guarda nada de quem exportou',
        PEDACOS.concat([SEGREDO.chave, SEGREDO.client]).every(p => guardado.indexOf(p) < 0),
        'fcConstrutoresIdentidade=' + guardado.substring(0, 300));

      /* A configuracao chegou MESMO: sem isto, uma importacao que nao fizesse nada
         passaria em todas as linhas acima com louvor. */
      chk('a configuracao do arquivo chegou a tela', (await ler(pg2, 'l-cod')) === 'NATAL26',
        'l-cod="' + (await ler(pg2, 'l-cod')) + '"');
      const estado = await pg2.evaluate(() => localStorage.getItem('fcConstrutores') || '');
      chk('a configuracao do arquivo foi gravada', estado.indexOf('Ensaio de Natal') >= 0,
        estado.length + ' bytes gravados');

      chk('nenhum erro de console na passagem da volta', pg2.erros.length === 0,
        pg2.erros.join(' | '));
    } finally { await pg2.close(); }
  } finally {
    await br.close();
    srv.close();
  }
}

try{ await tudo(); }
catch(e){ chk('a passagem inteira rodou ate o fim', false, String((e && e.message) || e)); }
process.exit(resumo());
