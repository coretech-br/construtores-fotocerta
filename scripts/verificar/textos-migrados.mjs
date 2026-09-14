/* ============================================================================
   OS TEXTOS QUE ENTRARAM NAS TABELAS -- as provas que a regressao NAO da
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. Em 11/09/2026 (leva 2) os campos de texto que o
   cliente le e que viviam FORA das *_TXT_DEFS passaram para dentro delas. Isso
   e refatoracao: nenhuma saida pode mudar um byte, e quem prova isso e
   'regressao.sh'. So que a regressao passaria por cima de tres defeitos que
   esta migracao podia introduzir, e nenhum deles aparece na fotografia:

     1. O ESCAPE QUE MUDOU DE LUGAR. Na Captacao de leads o escJs acontecia ao
        LER o campo (lCfg) e a emissao saia crua. fcTxtLer devolve CRU, entao o
        escJs desceu para as linhas de emissao. Com os valores de FABRICA a
        saida e identica com ou sem esse escape -- nenhum padrao tem apostrofa,
        barra invertida ou '</script'. A regressao byte a byte NAO denuncia um
        esquecimento. So um valor hostil denuncia.

     2. O FORMATO DO QUE FICA GRAVADO. A chave de cada campo tinha de continuar
        a MESMA, letra por letra, senao os arquivos de backup que o dono ja tem
        deixariam de ser lidos. A regressao olha o codigo GERADO, nunca o
        localStorage.

     3. "RESTAURAR PADROES" QUE NAO REPOE. Os quatro botoes de reposicao da
        ferramenta repunham campo a campo, a mao, e nao alcancavam os campos das
        tabelas -- a aba voltava pela metade, em silencio. Defeito de interface:
        nao muda saida nenhuma.

   AS SEIS PROVAS:

     1. A TABELA ALCANCA os campos migrados -- e NAO alcanca os que ficaram de
        fora de proposito (os nove textos reserva dos marcadores, que gravam
        juntos numa chave so, e o 'm-cod', que e identificador com regex e
        teto). Exclusao declarada, para que o dia em que alguem os migrar este
        teste fale.
     2. O ECO NO ROTULO mostra o texto atual de cada um deles.
     3. fcTxtFabricaDiverge ALCANCA cada um: uma fabrica divergente plantada de
        proposito e denunciada, e some quando desplantada.
     4. "RESTAURAR PADROES" repoe de verdade, nas abas que tem o botao -- e as
        que nao tem estao MEDIDAS aqui, nao supostas.
     5. O FORMATO GRAVADO e identico ao da referencia (main por padrao), chave
        por chave, valor por valor -- as duas arvores servidas em portas
        separadas, preenchidas do mesmo jeito.
     6. A PROVA DA APOSTROFA: todos os campos migrados recebem um valor com
        apostrofa, aspas, barra invertida e '</script', os blocos sao gerados e
        EXECUTADOS numa pagina, e o texto tem de chegar inteiro -- inclusive a
        mensagem do WhatsApp, que nunca aparece na tela e por isso e colhida
        interceptando o window.open do proprio bloco.

   Roda com:  node scripts/verificar/textos-migrados.mjs [referencia]
   ============================================================================ */
import { navegador, servir, abrir, set, ler, clicar } from './lib.mjs';
import { comBlocoNaPagina, gerarNaFerramenta, textoSemScripts, chk, resumo } from './pagina.mjs';
import { preparar, conteudo, cobranca, gerarTodas } from './cenario.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';

/* OS CAMPOS QUE ENTRARAM, por aba. A chave e a segunda coluna: ela e o nome que o estado
   ja gravava ANTES da migracao, e e isso que esta prova existe para nao deixar mudar. */
const MIGRADOS = {
  leads: [['l-m1','m1'],['l-m2','m2'],['l-m3','m3'],['l-m4','m4'],
          ['l-t1','t1'],['l-t2','t2'],['l-t3','t3'],['l-t4','t4'],['l-t5','t5'],
          ['l-t6','t6'],['l-t7','t7'],
          ['l-horaviso','horaviso'],['l-qlabel','qlabel'],['l-qdica','qdica'],['l-qmsg','qmsg']],
  uni:   [['u-t1','t1'],['u-t2','t2'],['u-t3','t3'],['u-t4','t4'],['u-t5','t5'],
          ['u-t6','t6'],['u-t7','t7'],['u-t8','t8'],['u-t9','t9'],['u-t10','t10']],
  bor:   [['b-selo-txt','selotxt']],
  cnt:   [['c-fimtxt','fimtxt'],['c-rd','rd'],['c-rh','rh'],['c-rm','rm'],['c-rs','rs'],
          ['c-ctatxt','ctatxt']],
  cob:   [['p-t1','t1'],['p-t2','t2'],['p-t3','t3'],['p-t4','t4'],['p-t5','t5'],
          ['p-t6','t6'],['p-t7','t7'],['p-t8','t8'],['p-t9','t9']],
  loja:  [['m-t1','t1'],['m-t2','t2'],['m-t3','t3'],['m-t4','t4'],['m-t5','t5'],['m-t6','t6'],
          ['m-t7','t7'],['m-t8','t8'],['m-t9','t9'],['m-t10','t10'],['m-t11','t11'],['m-t12','t12']],
  pac:   [['a-t1','t1'],['a-t2','t2'],['a-t3','t3'],['a-t4','t4'],['a-t5','t5'],
          /* os QUATRO textos reserva dos marcadores, migrados em 11/09/2026 -- eles nao estao
             escritos em A_TXT_DEFS: entram nela por fcObFbDefs(A_OB_VARS,'a'), e e por isso
             que tabelasDoArquivo sabe expandir o .concat. A migracao do formato gravado (a
             chave antiga 'obfb', colada) tem prova propria: textos-reserva.mjs. */
          ['a-ob-fb-nome','obfbNome'],['a-ob-fb-data','obfbData'],
          ['a-ob-fb-hora','obfbHora'],['a-ob-fb-quando','obfbQuando']],
  tidy:  [['t-ob-fb-nome','obfbNome'],['t-ob-fb-tipo','obfbTipo'],['t-ob-fb-data','obfbData'],
          ['t-ob-fb-hora','obfbHora'],['t-ob-fb-quando','obfbQuando']]
};
const IDS = Object.keys(MIGRADOS).reduce((a,k)=>a.concat(MIGRADOS[k].map(p=>p[0])),[]);

/* OS QUE FICARAM DE FORA, e o motivo medido. Nao e lista de "ainda nao deu tempo": e
   contrato. Se um deles aparecer numa tabela, esta prova falha e obriga a decisao a ser
   consciente.
   ATE 11/09/2026 os NOVE textos reserva dos marcadores estavam aqui, com o motivo "grava
   junto em obfb" -- eles mudavam o FORMATO do que fica gravado, que e a classe que este
   projeto nao muda sem a palavra do dono. O dono autorizou, e eles migraram: agora estao em
   MIGRADOS, e a migracao (backup antigo, preset antigo, a ordem, o caractere de controle)
   tem prova propria em textos-reserva.mjs. E assim que uma exclusao declarada morre -- por
   decisao, com a prova que ela exigia, e nao por alguem apagar a linha. */
const FORA = {
  'm-cod': 'identificador com regex e teto, nao frase que o cliente le'
};

/* Os botoes de reposicao QUE EXISTEM, medidos varrendo o HTML -- e as abas que nao tem
   nenhum, declaradas para que "nao consertei" nunca seja confundido com "esqueci". */
const REPOSICAO = [['s-limparbtn','slide',['s-txt-aria-galeria','s-txt-alt-padrao']],
                   ['l-padroes','leads',['l-t1','l-qmsg','l-txt-aria-botao']],
                   ['c-limpar','cnt',['c-fimtxt','c-rd','c-ctatxt','c-txt-suf-d']],
                   ['p-limpar','cob',['p-t1','p-t9','p-txt-zapmsg']]];
const SEM_BOTAO = ['tidy','uni','bor','loja','pac','efe'];

const HOSTIL = i => 'Zz'+String(i).padStart(2,'0')+" d'A \\ \"b\" </script>";
const valorHostil = id => HOSTIL(IDS.indexOf(id)) + ((id==='p-t8'||id==='p-t9') ? ' {data}' : '');
const RUIDO = [/Failed to load resource/i, /net::ERR/i, /ERR_FAILED/i, /favicon/i];
const soDoBloco = e => e.filter(x => !RUIDO.some(re => re.test(x)));

/* A FERRAMENTA RODA DENTRO DE UMA IIFE (escopo isolado, por desenho -- ver o topo do
   <script> do index.html), entao nenhuma funcao dela e alcancavel por pg.evaluate. As tabelas
   sao lidas do PROPRIO ARQUIVO, que e onde elas moram; o resto se mede pelo DOM e pelo
   comportamento, que e o que o operador ve. */
/* AS TABELAS NEM SEMPRE TERMINAM EM '];', e o parser tem de conhecer cada final.
   Desde 11/09/2026 T_TXT_DEFS e A_TXT_DEFS fecham com
   '].concat(fcObFbDefs(X_OB_VARS,'p'))', porque os textos reserva dos marcadores nao sao
   digitados de novo ali -- o id e o padrao de cada um ja estao em X_OB_VARS. E desde
   13/09/2026 (rodada E) as QUATRO tabelas das abas de pagamento fecham tambem com
   '.concat(fcSinalTxtDefs('x'))': os tres textos que explicam o sinal saem de FC_SINAL_TXT,
   uma tabela so para as quatro abas.

   LER SO O QUE ESTA ENTRE COLCHETES NAO BASTA, e o preco de nao saber disso foi medido: com
   o final novo desconhecido, o '[\s\S]*?' nao parava no ']' daquela tabela -- ia ate o
   proximo '];' do arquivo e ENGOLIA as tabelas seguintes, e a prova 1 passou a dizer que
   'c-fimtxt' pertencia a aba A. Trinta e dois campos acusados de estarem na aba errada por
   uma tabela ter ganhado um sufixo. Entao os dois concats sao OPCIONAIS na expressao e os
   dois sao EXPANDIDOS, cada um montando as mesmas linhas que a funcao dele monta. */
const SINAL_TXT = [['garante','txtSinalGarante'],['desistir','txtSinalDesistir'],
                   ['saldo','txtSinalSaldo']];

/* AS DEZ LINHAS DO WHATSAPP saem de fcZapTxtDefs desde 13/09/2026 (leva 4) -- eram trinta
   linhas manuscritas em tres tabelas. O concat delas fica NO MEIO da tabela, e nao no fim:
   '].concat(fcZapTxtDefs('u')).concat([', exatamente onde as dez estavam, para a ordem da busca
   "Achar um texto" nao mudar. Isso quebra o parser do mesmo jeito que o comentario acima
   registra: o '[\s\S]*?' para no ']' do meio, a tabela e lida pela metade, e os campos que vem
   DEPOIS dele passam a ser atribuidos a tabela seguinte -- foram 22 campos acusados de estar na
   aba errada na primeira execucao depois da leva 4.
   O conserto e o mesmo que o arquivo ja usava para os outros dois concats: EXPANDIR a chamada
   nas mesmas linhas que a funcao monta, antes de parsear. Aqui a expansao e literal, e nao
   opcional na expressao, porque este concat fica no meio e nao no fim. Os dois pontos em que a
   aba pac diverge sao parametro da funcao, e por isso sao lidos da propria chamada. */
const ZAP_SUF = ['abertura','abertura-sinal','pedido','cupom','descpix','total','sinal','saldo','valor'];
const ZAP_CHAVE = ['txtZapAbertura','txtZapAberturaSinal','txtZapPedido','txtZapCupom',
                   'txtZapDescPix','txtZapTotal','txtZapSinal','txtZapSaldo','txtZapValor'];
function expandirZap(html){
  /* O concat do meio ABRE um parentese que so fecha no FIM da tabela ('  ]).concat(fcSinal...').
     Expandir so o comeco deixaria esse ')' orfao no final, e o parser -- que espera '\n]' seguido
     dos concats conhecidos -- nao reconheceria o fim da tabela: ele seguiria ate o fim da tabela
     SEGUINTE e atribuiria os campos dela a esta. Foi exatamente o que aconteceu na primeira
     tentativa desta correcao. Entao a expansao desfaz os DOIS lados. */
  return html.replace(/\n\]\)\.concat\(/g, '\n].concat(')
    .replace(/\]\.concat\(fcZapTxtDefs\('([a-z])'(?:,\{([^}]*)\})?\)\)\.concat\(\[/g,
    (todo, pref, opts) => {
      const o = opts || '';
      const chaveBt = (/botaoChave:'([^']+)'/.exec(o)||[,'txtZapBotao'])[1];
      const sufBt   = (/botaoSuf:'([^']+)'/.exec(o)||[,'botao'])[1];
      let linhas = "  ['"+chaveBt+"','"+pref+"-txt-zap-"+sufBt+"',0],\n";
      for(let i=0;i<ZAP_SUF.length;i++)
        linhas += "  ['"+ZAP_CHAVE[i]+"','"+pref+"-txt-zap-"+ZAP_SUF[i]+"',0],\n";
      return linhas;
    });
}

function tabelasDoArquivo(html){
  const m = {};
  html = expandirZap(html);
  const obVars = nome => {
    const b = new RegExp('var '+nome+'_OB_VARS=\\[([\\s\\S]*?)\\n\\];').exec(html);
    return b ? Array.from(b[1].matchAll(/\{id:'([^']+)'/g)).map(x => x[1]) : [];
  };
  for(const nome of ['S','L','T','U','B','C','P','M','A']){
    const fim = "(?:\\.concat\\(fcObFbDefs\\("+nome+"_OB_VARS,'([a-z])'\\)\\))?"
              + "(?:\\.concat\\(fcSinalTxtDefs\\('([a-z])'\\)\\))?;";
    const bloco = new RegExp('var '+nome+'_TXT_DEFS=\\[([\\s\\S]*?)\\n\\]'+fim).exec(html);
    if(!bloco) continue;
    for(const par of bloco[1].matchAll(/\['([^']+)','([^']+)',/g)) m[par[2]] = nome+'/'+par[1];
    if(bloco[2]) for(const id of obVars(nome))
      m[bloco[2]+'-ob-fb-'+id] = nome+'/obfb'+id.charAt(0).toUpperCase()+id.substring(1);
    if(bloco[3]) for(const [id, chave] of SINAL_TXT)
      m[bloco[3]+'-txt-sinal-'+id] = nome+'/'+chave;
  }
  return m;
}
const HTML = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const ABA_DA_TABELA = {S:'slide',L:'leads',T:'tidy',U:'uni',B:'bor',C:'cnt',P:'cob',M:'loja',A:'pac'};

/* ===================== 1 a 4: tudo dentro da ferramenta ===================== */
console.log('\n--- a ferramenta: tabela, eco, fabrica divergente e reposicao ---');
{
  /* 1. a tabela alcanca */
  const naTabela = tabelasDoArquivo(HTML);
  for(const aba of Object.keys(MIGRADOS))
    for(const [id, chave] of MIGRADOS[aba]){
      const achado = naTabela[id] || '';
      chk('tabela: '+id+' -> '+aba+'/'+chave,
          ABA_DA_TABELA[achado.split('/')[0]] === aba && achado.split('/')[1] === chave, achado);
    }
  for(const id of Object.keys(FORA))
    chk('fora da tabela, de proposito: '+id+' ('+FORA[id]+')', !naTabela[id], naTabela[id]);

  const srv = await servir(RAIZ, 8861);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8861');

    /* 2. o eco no rotulo */
    const semEco = await pg.evaluate(ids => ids.filter(id => {
      const lab = document.querySelector('label[for="'+id+'"]');
      return !lab || !lab.querySelector('.fcs-eco');
    }), IDS);
    chk('eco: todos os campos migrados ganharam <small class="fcs-eco"> no rotulo',
        semEco.length === 0, semEco.join(', '));
    const ecoErrado = [];
    for(let i = 0; i < IDS.length; i++){
      const alvo = 'Zq'+String(i).padStart(2,'0')+' texto do eco';
      await set(pg, IDS[i], alvo);
      const visto = await pg.evaluate(id => {
        const e = document.querySelector('label[for="'+id+'"] .fcs-eco');
        return e ? e.textContent : null;
      }, IDS[i]);
      if(!visto || visto.indexOf(alvo) < 0) ecoErrado.push(IDS[i]+'='+visto);
    }
    chk('eco: cada rotulo passou a mostrar o texto atual do campo',
        ecoErrado.length === 0, ecoErrado.slice(0,3).join(' | '));

    /* 4. "Restaurar padroes" repoe DE VERDADE */
    /* O padrao de fabrica sai do value= do <input>, e nao da tabela: os dois tem de
       concordar, e quem prova isso e a prova 3 logo abaixo. Usar a tabela aqui seria medir
       a reposicao contra a mesma fonte que a reposicao usa. */
    const valorDeFabrica = id => {
      const m = new RegExp('<input[^>]*id="'+id+'"[^>]*>').exec(HTML);
      const v = m && /value="([^"]*)"/.exec(m[0]);
      return v ? v[1] : null;
    };
    for(const [botao, aba, amostra] of REPOSICAO){
      for(const id of amostra) await set(pg, id, 'sujo '+id);
      await clicar(pg, botao);
      const ruins = [];
      for(const id of amostra){
        const v = await ler(pg, id);
        if(v !== valorDeFabrica(id)) ruins.push(id+'='+JSON.stringify(v));
      }
      chk('reposicao: '+botao+' devolveu os textos da aba '+aba+' a fabrica',
          ruins.length === 0, ruins.join(' | '));
    }
    const botoesQueExistem = await pg.evaluate(() =>
      ['s-limparbtn','l-padroes','c-limpar','p-limpar','t-limpar','u-limpar','b-limpar',
       'm-limpar','a-limpar','e-limpar','t-padroes','u-padroes','m-padroes','a-padroes']
        .filter(id => !!document.getElementById(id)));
    chk('reposicao: as abas '+SEM_BOTAO.join('/')+' continuam SEM botao de reposicao '+
        '(nada a consertar la -- e o que falta, nao o que esta errado)',
        botoesQueExistem.length === REPOSICAO.length, botoesQueExistem.join(', '));

    chk('a ferramenta nao acusou erro de console em nada disso', pg.erros.length === 0,
        pg.erros.slice(0,2).join(' | '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

/* ===== 3. a fabrica divergente plantada e denunciada =====
   Nao da para plantar pelo DOM: fcTxtFabricaDiverge roda UMA vez, na partida, dentro da IIFE.
   Entao a planta e no ARQUIVO -- uma copia da arvore com o value= de CADA campo migrado
   alterado --, servida num servidor proprio. O que se mede e o que o operador veria: a barra
   vermelha acesa, com o passo dos textos nomeado, e a lista dos campos no console. */
console.log('\n--- a fabrica divergente plantada em todos eles, e denunciada ---');
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-fab-'));
  try{
    let sujo = HTML, plantados = 0;
    for(const id of IDS){
      const m = new RegExp('(<input[^>]*id="'+id+'"[^>]*value=")([^"]*)(")').exec(sujo);
      if(!m) continue;
      sujo = sujo.replace(m[0], m[1] + m[2] + ' ZZ' + m[3]);
      plantados++;
    }
    chk('planta: o value= de todos os campos migrados foi alterado no arquivo',
        plantados === IDS.length, plantados + ' de ' + IDS.length);
    fs.writeFileSync(path.join(tmp, 'index.html'), sujo);
    for(const extra of ['fc-compartilhado.js'])
      fs.copyFileSync(path.join(RAIZ, extra), path.join(tmp, extra));
    const srv = await servir(tmp, 8865);
    const br = await navegador();
    try{
      const pg = await br.newPage();
      const doConsole = [];
      /* console.error do fcFalha leva a mensagem numa string e o Error num segundo argumento:
         Playwright serializa o segundo como handle. A mensagem util e a do Error -- colhida
         por um gancho posto ANTES do primeiro script rodar. */
      await pg.addInitScript(() => {
        window.__erros = [];
        const orig = console.error;
        console.error = function(){
          try{
            window.__erros.push(Array.prototype.map.call(arguments,
              a => (a && a.message) ? a.message : String(a)).join(' '));
          }catch(e){}
          return orig.apply(console, arguments);
        };
      });
      await pg.goto('http://127.0.0.1:8865/index.html');
      const barra = await pg.$eval('#fc-falhas', el => el.textContent).catch(() => '');
      doConsole.push(...await pg.evaluate(() => window.__erros.slice()));
      const msg = doConsole.join(' | ');
      chk('fabrica: a barra vermelha acendeu e nomeou o passo dos textos',
          barra.indexOf('Textos configuraveis') >= 0, barra.slice(0, 200));
      const naoDenunciados = IDS.filter(id => msg.indexOf('/'+id) < 0);
      chk('fabrica: os campos migrados foram TODOS nomeados na denuncia',
          naoDenunciados.length === 0, naoDenunciados.slice(0, 6).join(', '));
      await pg.close();
    } finally { await br.close(); srv.close(); }
  } finally { fs.rmSync(tmp, {recursive:true, force:true}); }
}

/* ===================== 5: o formato do que fica gravado ===================== */
console.log('\n--- o formato gravado, contra '+REF+' ---');
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-txt-'));
  try{
    fs.mkdirSync(path.join(tmp, 'ref'));
    execFileSync('sh', ['-c', 'git -C "'+RAIZ+'" archive '+REF+' | tar -x -C "'+tmp+'/ref"']);
    const colher = async (raiz, porta) => {
      const srv = await servir(raiz, porta);
      const br = await navegador();
      try{
        const pg = await abrir(br, 'http://127.0.0.1:'+porta);
        for(let i = 0; i < IDS.length; i++) await set(pg, IDS[i], 'Zk'+String(i).padStart(2,'0')+' valor');
        const bruto = await pg.evaluate(() => localStorage.getItem('fcConstrutores'));
        await pg.close();
        return JSON.parse(bruto);
      } finally { await br.close(); srv.close(); }
    };
    const antes = await colher(path.join(tmp, 'ref'), 8862);
    const depois = await colher(RAIZ, 8863);
    const canon = v => {
      if(v === null || typeof v !== 'object') return JSON.stringify(v);
      if(Array.isArray(v)) return '['+v.map(canon).join(',')+']';
      return '{'+Object.keys(v).sort().map(k => JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
    };
    /* CHAVE NOVA DE UMA RODADA e a unica diferenca esperada contra a referencia, e sai da
       comparacao DEPOIS de ser cobrada aqui, uma a uma, com o valor que cada campo tinha.
       Tirar sem cobrar seria varrer a mudanca para baixo do tapete; cobrar e depois tirar e
       o que permite o resto do objeto continuar sendo exigido IDENTICO.

       QUANDO A RODADA JA CHEGOU A REFERENCIA, a chave deixa de ser diferenca: ela passa a
       ser exigida IGUAL dos dois lados. Escrever "esta chave nao existe na referencia" como
       verdade eterna foi o que fez este teste falhar em 12/09/2026 sem nenhum defeito por
       tras -- a rodada dos nove textos reserva tinha entrado na main, e o teste continuava
       afirmando que main nao a tinha. Assercao com prazo de validade e defeito adiado.

       A chave antiga 'obfb' continua nos dois lados e continua na comparacao: ela e projecao
       das novas, entao tem de sair igual a da referencia caractere por caractere -- e e ela
       que segura o molde da importacao de arquivo (ver textos-reserva.mjs). */
    const RODADAS = [
      {nome:'os nove textos reserva dos marcadores (11/09/2026)',
       chaves:{t:['obfbNome','obfbTipo','obfbData','obfbHora','obfbQuando'],
               a:['obfbNome','obfbData','obfbHora','obfbQuando']},
       esperado:(aba,ch) => 'Zk'+String(IDS.indexOf(aba.charAt(0)+'-ob-fb-'+ch.substring(4).toLowerCase())).padStart(2,'0')+' valor'},
      {nome:'o meio prioritario (12/09/2026)',
       chaves:{u:['prio'], m:['prio'], p:['prio','txtCartaoLinha'], a:['prio']},
       esperado:(aba,ch) => ch === 'prio' ? 'pix' : 'ou {valor} no cartão'},
      /* A linha do SALDO na mensagem de WhatsApp era o unico texto do conjunto do sinal que
         nao era campo: o gerador emitia TXT_SALDO mais um ': *...*' cravado. Virou campo em
         13/09/2026 ('*-txt-zap-saldo'), e por isso o estado ganhou a chave nos dois lados.
         O campo NAO esta em IDS (a lista dos migrados da leva 2), entao o que fica gravado e
         o padrao de fabrica dele -- que repete letra por letra o que o bloco ja emitia. */
      {nome:'a linha do saldo no WhatsApp virou campo (13/09/2026)',
       chaves:{u:['txtZapSaldo'], m:['txtZapSaldo']},
       esperado:() => 'Restante na entrega: *{valor}*'},
      /* A COBRANCA DE SINAL CHEGOU A ABA AGENDAMENTO POR PACOTE (13/09/2026, rodada C).
         Oito chaves novas no estado da aba 'a' -- quatro do interruptor e da conta, quatro
         de texto --, todas gravadas com o PADRAO DE FABRICA do campo, porque o cenario nao
         mexe em nenhuma delas. Nenhuma chave que ja existia mudou de valor, e e por isso que
         o resto do objeto continua sendo exigido identico logo abaixo.
         'txtSinalRecusado' NAO aparece aqui, e a ausencia e deliberada: ele so serve ao resumo
         copiavel, e esta aba nao tem um (medido em sinal.mjs, secao "a ausencia declarada").
         'txtZapSaldo' TAMBEM NAO aparecia, pela mesma razao -- nao havia mensagem de WhatsApp
         que citasse valor --, e deixou de nao aparecer em 13/09/2026, quando o botao "Ja paguei"
         chegou a esta aba: ele esta na rodada propria dele, logo abaixo. */
      {nome:'o sinal na aba Agendamento por pacote (13/09/2026)',
       chaves:{a:['sinal','sinaltipo','sinalpct','sinalfixo','t8','t9','txtSinalMaior','txtSinalZero']},
       esperado:(aba,ch) => ({
         sinal:'nao', sinaltipo:'pct', sinalpct:'30', sinalfixo:'100',
         t8:'Sinal agora', t9:'Restante no dia do ensaio',
         txtSinalMaior:'O sinal desta reserva é maior que o total. Remova o cupom ou marque mais itens opcionais.',
         txtSinalZero:'O sinal desta reserva arredonda para zero. Remova o cupom ou marque mais itens opcionais.'
       })[ch]},
      /* A COBRANCA DE SINAL CHEGOU AO LINK DE COBRANCA (13/09/2026, rodada D). Sete chaves
         novas no estado da aba 'p' -- quatro do interruptor e da conta, tres de texto.
         AQUI O SINAL E POR COBRANCA, e nao da pagina: as quatro primeiras viajam no LINK e
         nao mudam um byte do bloco (por isso entraram na 'naoEmite' da aba), e as tres de
         texto sao do bloco, emitidas SEMPRE. Todas gravadas no padrao de fabrica, porque o
         cenario nao mexe em nenhuma delas.
         'txtSinalMaior'/'txtSinalZero' NAO aparecem aqui, e a ausencia e deliberada: nesta
         aba as recusas do sinal acontecem na GERACAO do link, com frase da ferramenta, e nao
         dentro do bloco -- nao ha carrinho que mude depois que o link sai. */
      /* O BOTAO "JA PAGUEI" CHEGOU A ABA AGENDAMENTO POR PACOTE (13/09/2026). Dez chaves novas
         no estado da aba 'a', todas gravadas com o PADRAO DE FABRICA do campo, porque o cenario
         nao mexe em nenhuma delas. Ate esta rodada a aba mostrava o Pix ao cliente e nao tinha
         o botao que as tres irmas tem dentro da area do Pix -- o cliente copiava o codigo,
         pagava no banco e nao tinha como avisar o dono.
         NOVE DOS DEZ PADROES SAEM DE FC_TXT_FABRICA, iguais aos do Checkout e da Mini loja.
         'txtZapSaldo' e o unico que diverge, e por um fato da aba: o padrao das irmas e
         "Restante na entrega", e aqui nao ha entrega -- ha um ensaio marcado.
         'txtZapPago' e um campo NOVO, e nao o 'txtZapBotao' que ja existia: aquele rotula os
         dois recados de recusa desta aba, em que ninguem pagou nada. */
      {nome:'o botao "Ja paguei" na aba Agendamento por pacote (13/09/2026)',
       chaves:{a:['txtZapPago','txtZapAbertura','txtZapAberturaSinal','txtZapPedido','txtZapCupom',
                  'txtZapDescPix','txtZapTotal','txtZapSinal','txtZapSaldo','txtZapValor']},
       esperado:(aba,ch) => ({
         txtZapPago:'Já paguei - avisar no WhatsApp',
         txtZapAbertura:'Olá! Acabei de pagar via Pix.',
         txtZapAberturaSinal:'Olá! Acabei de pagar o SINAL via Pix.',
         txtZapPedido:'Pedido cod: *{cod}*',
         txtZapCupom:'Cupom: {codigo}',
         txtZapDescPix:'Desconto Pix: -{pct}%',
         txtZapTotal:'Total do pedido: {valor}',
         txtZapSinal:'Sinal pago agora: *{valor}*',
         txtZapSaldo:'Restante no dia do ensaio: *{valor}*',
         txtZapValor:'Valor pago: *{valor}*'
       })[ch]},
      {nome:'o sinal no Link de cobranca (13/09/2026)',
       chaves:{p:['sinal','sinaltipo','sinalpct','sinalfixo','txtSinal','txtSaldo','txtZapSinal']},
       esperado:(aba,ch) => ({
         sinal:'nao', sinaltipo:'pct', sinalpct:'30', sinalfixo:'100',
         txtSinal:'Sinal agora: {valor}', txtSaldo:'Saldo a pagar: {valor}',
         txtZapSinal:'(sinal de {sinal}; saldo de {saldo})'
       })[ch]},
      /* OS TRES TEXTOS QUE EXPLICAM O SINAL (13/09/2026, rodada E). Doze chaves novas -- tres
         em cada aba de pagamento --, e o valor esperado de TODAS e a STRING VAZIA. Nao e
         descuido de quem escreveu o teste: e o contrato da rodada. Os tres sao declaracoes de
         POLITICA COMERCIAL ("o que o sinal garante", "e se eu desistir", "o que fazer com o
         saldo"), e um padrao de fabrica afirmaria, para um cliente prestes a pagar, uma
         politica que o dono pode nao ter.
         E POR ISSO QUE ESTA LINHA IMPORTA MAIS QUE AS OUTRAS DAQUI: ela e o unico lugar do
         arnes que cobra que o VAZIO CHEGA AO ESTADO GRAVADO. Se algum caminho passar a tratar
         '' como "campo ausente" -- a guarda de fcTxtRestaura e '!=null' e nao "e verdade", e o
         comentario de uRestaura registra o defeito que a outra forma ja custou --, a chave
         some do objeto e esta comparacao cai. */
      {nome:'os tres textos que explicam o sinal (13/09/2026)',
       chaves:{u:['txtSinalGarante','txtSinalDesistir','txtSinalSaldo'],
               m:['txtSinalGarante','txtSinalDesistir','txtSinalSaldo'],
               a:['txtSinalGarante','txtSinalDesistir','txtSinalSaldo'],
               p:['txtSinalGarante','txtSinalDesistir','txtSinalSaldo']},
       esperado:() => ''},
      /* O UPSELL (13/09/2026, rodada F). Duas chaves novas em cada aba de pagamento: o
         ENDERECO da pagina para onde levar o cliente depois do pagamento, e o INTERRUPTOR.
         A fabrica e endereco VAZIO e interruptor DESLIGADO, e com ela o bloco sai byte a byte
         como saia antes da rodada -- e o mesmo criterio dos tres textos do sinal, logo acima.
         O interruptor nasce 'nao' (e nao ausente): a ferramenta o restaura com ||'nao', e
         gravar o valor e o que impede um estado antigo de abrir a aba com o radio em branco. */
      {nome:'o upsell depois do pagamento (13/09/2026)',
       chaves:{u:['upsell','upsellon'], m:['upsell','upsellon'],
               a:['upsell','upsellon'], p:['upsell','upsellon']},
       esperado:(aba,ch) => ch==='upsell' ? '' : 'nao'}
    ];
    /* FABRICA TROCADA e outra coisa de CHAVE NOVA, e a diferenca importa: a chave ja existia
       nos dois lados e o que mudou foi o PADRAO dela. Entao os dois valores sao declarados, e
       os dois sao cobrados -- o antigo na referencia, o novo aqui. Quando a rodada ja chegou a
       referencia, os dois lados trazem o novo, e isso tambem passa. O que NAO passa e um
       terceiro valor aparecer de qualquer um dos lados. */
    /* A TERCEIRA COLUNA E UMA LISTA desde 13/09/2026, e nao um valor: uma chave pode ter tido
       MAIS DE UMA fabrica antes desta arvore, e ai o lado da referencia depende de QUAL commit
       foi passado. Os quatro separadores sao o caso: 'ou pague com Pix' ate 12/09, 'ou pague com
       cartao' ate 13/09, e 'OU' de agora em diante. Com um valor so, este arquivo passaria
       contra uma referencia e falharia contra a outra -- sem nenhum defeito por tras. */
    const TROCADAS = [
      /* O SEPARADOR NEUTRO (13/09/2026, decisao 24 do dono): as quatro abas de pagamento passaram
         a usar o mesmo 'OU' que o Link de cobranca e a Agendamento por pacote ja usavam. Quem ja
         tinha a fabrica anterior gravada e levado ate 'OU' por fcSepNeutro -- as duas fabricas
         antigas estao declaradas abaixo porque as duas existiram, e o que se cobra e que NENHUM
         terceiro valor apareca. */
      ['u','txtOu',        ['ou pague com Pix','ou pague com cartão'], 'OU'],
      ['u','txtOuDesc',    ['ou pague com Pix com {pct}% de desconto','ou pague com cartão, sem o desconto de {pct}%'], 'OU'],
      ['m','txtOu',        ['ou pague com Pix','ou pague com cartão'], 'OU'],
      ['m','txtOuDesc',    ['ou pague com Pix com {pct}% de desconto','ou pague com cartão, sem o desconto de {pct}%'], 'OU'],
      /* O DESCONTO DO PIX DE FABRICA (13/09/2026, decisao 18): 5% nas tres abas de catalogo, que
         era o numero da Agendamento por pacote. AQUI NAO HA MIGRACAO, e e deliberado: o numero
         gravado e DINHEIRO -- e o que a loja do dono cobra hoje --, e reescreve-lo em silencio
         seria mudar preco sem ninguem pedir. Por isso a referencia traz 10 e a arvore de hoje
         traz 5 numa ferramenta de armazenamento LIMPO, que e como este arquivo mede. */
      ['u','descpix',      ['10'], '5'],
      ['m','descpix',      ['10'], '5'],
      /* O RESUMO COPIAVEL (13/09/2026, decisao 8): nasce LIGADO no Checkout, como ja nascia na
         Mini loja. Idem: sem migracao -- quem desligou o recurso pode ter desligado de proposito. */
      ['u','resumo',       ['nao'], 'sim'],
      /* O AVISO DE QUE O PIX NAO CONFIRMA SOZINHO, na aba Agendamento por pacote (13/09/2026).
         Ate esta rodada ele NAO saia de FC_TXT_FABRICA.pixManual, e o motivo estava escrito na
         tabela da aba: "esta pagina nao tem botao Ja paguei". Com o botao passando a existir,
         mandar "me avise" em vez de mandar tocar nele virou registro descrevendo como desenho
         o que era falta -- e a fabrica voltou a ser a unica, a mesma das outras tres abas.
         A chave ja existia nos dois lados: o que mudou foi o PADRAO, e e por isso que ela entra
         AQUI e nao em RODADAS. */
      ['a','txtPixManual',
       ['O Pix não avisa a gente automaticamente. Assim que você pagar, me avise para eu conferir e confirmar a sua reserva.'],
       'O Pix não avisa a gente automaticamente. Assim que você pagar, toque em "Já paguei" para eu conferir e confirmar.']
    ];
    const mau = [];
    for(const [aba,ch,velhos,novoV] of TROCADAS){
      const aq=(depois[aba]||{})[ch], re=(antes[aba]||{})[ch];
      const aceitos = velhos.concat([novoV]);
      if(aq !== novoV) mau.push('aqui '+aba+'.'+ch+'='+JSON.stringify(aq));
      if(aceitos.indexOf(re) < 0) mau.push(REF+' '+aba+'.'+ch+'='+JSON.stringify(re));
      if(depois[aba]) delete depois[aba][ch];
      if(antes[aba]) delete antes[aba][ch];
    }
    chk('gravado: as fabricas TROCADAS por rodada declarada, nos dois lados',
        mau.length === 0, mau.join(' | '));
    for(const rodada of RODADAS){
      const faltando = [];
      for(const [aba, chaves] of Object.entries(rodada.chaves))
        for(const ch of chaves){
          const esperado = rodada.esperado(aba, ch);
          if((depois[aba]||{})[ch] !== esperado)
            faltando.push(aba+'.'+ch+'='+JSON.stringify((depois[aba]||{})[ch])+' (esperava '+JSON.stringify(esperado)+')');
          /* A referencia ja tem a chave? Entao ela nao e diferenca -- e igualdade exigida. */
          if((antes[aba]||{})[ch] !== undefined && (antes[aba]||{})[ch] !== (depois[aba]||{})[ch])
            faltando.push(REF+' tem '+aba+'.'+ch+'='+JSON.stringify(antes[aba][ch])+', diferente daqui');
          if(depois[aba]) delete depois[aba][ch];
          if(antes[aba]) delete antes[aba][ch];
        }
      chk('gravado: as chaves de "'+rodada.nome+'" existem aqui com o texto do seu campo'+
          ' (e batem com '+REF+', se ele ja as tiver)', faltando.length === 0, faltando.join(' | '));
    }
    const divergem = [];
    for(const aba of new Set([...Object.keys(antes), ...Object.keys(depois)]))
      if(canon(antes[aba]) !== canon(depois[aba])) divergem.push(aba);
    chk('gravado: fora as chaves das rodadas declaradas, o objeto inteiro e identico ao de '+REF+', chave por chave',
        divergem.length === 0, 'divergem: '+divergem.join(', '));
    /* As chaves que a migracao poderia ter ANINHADO sem querer -- no cfg elas eram
       cfg.rotulos.d/h/m/s, cfg.cta.txt, cfg.hor.aviso e cfg.q.label/dica/msg. O que fica
       gravado sempre foi PLANO, e continua. */
    const planas = [['c','rd'],['c','rh'],['c','rm'],['c','rs'],['c','ctatxt'],['c','fimtxt'],
                    ['l','horaviso'],['l','qlabel'],['l','qdica'],['l','qmsg'],['b','selotxt']];
    const erradas = planas.filter(([a,k]) => typeof (depois[a]||{})[k] !== 'string');
    chk('gravado: as chaves que o cfg aninhava continuam PLANAS no estado',
        erradas.length === 0, erradas.map(p => p.join('.')).join(', '));
    /* 'c.cta' e 'l.hor' JA existiam no estado, como TEXTO (a escolha do radio). O que nao
       pode ter aparecido e um OBJETO com o texto dentro -- que e o que teria acontecido se a
       chave da tabela fosse a do cfg. */
    const virouObjeto = [['c','rotulos'],['c','cta'],['l','hor'],['l','q']]
      .filter(([a,k]) => (depois[a]||{})[k] !== null && typeof (depois[a]||{})[k] === 'object');
    chk('gravado: nenhuma chave do estado virou objeto (rotulos/cta/hor/q)',
        virouObjeto.length === 0, virouObjeto.map(p => p.join('.')).join(', '));
  } finally { fs.rmSync(tmp, {recursive:true, force:true}); }
}

/* ===================== 6: a prova da apostrofa ===================== */
console.log('\n--- a prova da apostrofa: os blocos com valor hostil, executando ---');
const SAIDAS = ['l-out','u-out','c-out1','p-out1','p-out2','m-out','a-out1','a-out2','a-out3'];
const guardado = {};
const { valores, alertas: al, erros: errGer } = await gerarNaFerramenta(async pg => {
  await preparar(pg); await conteudo(pg); await cobranca(pg, {});
  /* A PERGUNTA DE QUALIFICACAO ENTRA NO CENARIO. Sem uma opcao cadastrada, 'q.ativo' e falso
     e o bloco nao emite PERGUNTA_ROTULO nem PERGUNTA_DICA -- l-qlabel, l-qdica e l-qmsg
     ficariam fora de toda medicao de execucao, e um escJs esquecido neles passaria. E a mesma
     armadilha que cenario.mjs ja registra para t-out4/t-out5: saida que so aparece as vezes e
     onde o defeito se esconde. */
  await set(pg, 'l-qop', 'Ensaio gestante');
  await clicar(pg, 'l-q-add');
  /* UM OPCIONAL NA MINI LOJA, pelo mesmo motivo: o rotulo dos opcionais (m-t2) so aparece na
     ficha de um produto QUE TENHA opcional, e o cenario da fotografia nao cadastra nenhum --
     ele exercita de proposito o caminho sem opcional. Aqui o produto precisa de um. */
  await clicar(pg, 'aba-loja');
  await set(pg, 'm-pnome', 'Caixa com brinde'); await set(pg, 'm-ppreco', '300');
  await set(pg, 'm-pimg', 'https://storage.alboom.ninja/caixa.jpg');
  await set(pg, 'm-op-nome', 'Caixa de presente'); await set(pg, 'm-op-preco', '80');
  await clicar(pg, 'm-op-add');
  await clicar(pg, 'm-prod-salvar');
  for(const id of IDS){
    await set(pg, id, valorHostil(id));
    guardado[id] = await ler(pg, id);   /* o que o campo GUARDOU: maxlength pode cortar */
  }
  await gerarTodas(pg);
}, SAIDAS, {porta: 8864});
chk('gerou os blocos hostis sem alerta', al.length === 0, JSON.stringify(al).slice(0,300));
chk('gerou os blocos hostis sem erro de console', errGer.length === 0, errGer.slice(0,2).join(' | '));
{
  /* Campo que CORTA o valor hostil mediria outra coisa que nao o escape. So o selo das
     Bordas tem teto (maxlength=40), e o valor cabe -- mas a conferencia fica, para o dia em
     que um teto novo aparecer sem ninguem perceber. */
  const cortados = IDS.filter(id => guardado[id] !== valorHostil(id));
  chk('nenhum campo cortou o valor hostil (senao o teste mediria outro texto)',
      cortados.length === 0, cortados.map(id => id+'='+JSON.stringify(guardado[id])).join(' | '));
}

const CASOS = [
  {saida:'l-out',  raiz:'.fcw-botao', porta:8871},
  {saida:'u-out',  raiz:'.fcuni',     porta:8872},
  {saida:'c-out1', raiz:'body',       porta:8873},
  {saida:'m-out',  raiz:'.fcmloja',   porta:8874},
  {saida:'a-out1', raiz:'.fca-raiz',  porta:8875},
  {saida:'p-out1', raiz:'body',       porta:8876,
   busca: '?' + String(valores['p-out2']).split('?')[1]}
];
const visto = {};
for(const caso of CASOS){
  const bloco = valores[caso.saida];
  chk(caso.saida+': a ferramenta produziu o bloco', !!bloco && bloco.length > 100);
  if(!bloco) continue;
  const r = await comBlocoNaPagina({
    bloco, busca: caso.busca || '', porta: caso.porta,
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => ({
      marco: await pg.$eval('#fim-do-documento', el => el.textContent).catch(() => null),
      desenhou: await pg.$(caso.raiz).then(el => !!el),
      corpo: await textoSemScripts(pg),
      /* SO NA MINI LOJA: o rotulo dos opcionais e o botao de adicionar so existem na FICHA do
         produto, e a pagina abre na vitrine. Sem o clique, m-t2 e m-t7 ficariam fora da
         medicao de execucao. */
      ficha: caso.saida !== 'm-out' ? null : await (async () => {
        /* A ficha do produto QUE TEM opcional -- e nao "o primeiro card": qual deles fica
           em primeiro depende da ordem do catalogo, e medir o card errado daria "o texto nao
           chegou" sobre um produto que nunca teve o que mostrar. */
        await pg.getByText('Caixa com brinde').first().click();
        await pg.waitForTimeout(120);
        return await textoSemScripts(pg);
      })(),
      /* SO NA CAPTACAO: a mensagem do WhatsApp nunca aparece na tela -- ela vai para o
         window.open. Sem interceptar, m1..m4 (quatro dos quinze cujo escJs mudou de lugar)
         ficariam fora de toda medicao de execucao. */
      zap: caso.saida !== 'l-out' ? null : await (async () => {
        await pg.evaluate(() => {
          window.__aberto = [];
          window.open = u => { window.__aberto.push(String(u)); return null; };
        });
        await pg.click('.fcw-botao');
        await pg.fill('#fcw-nome', 'Ana');
        await pg.fill('#fcw-recado', 'oi');
        /* A opcao ESCOLHIDA e o que faz a linha do 'qmsg' entrar na mensagem: sem escolher,
           ela nao existe, e o texto de l-qmsg nao chegaria a lugar nenhum. */
        await pg.selectOption('#fcw-interesse', {index: 1}).catch(() => {});
        await pg.click('.fcw-enviar');
        return await pg.evaluate(() => window.__aberto.slice());
      })()
    })
  });
  visto[caso.saida] = r;
  chk(caso.saida+': o documento nao foi engolido por um </script', r.marco === 'fim', String(r.marco));
  chk(caso.saida+': o bloco DESENHOU com os textos hostis ('+caso.raiz+')', r.desenhou === true);
  const p = soDoBloco(r.erros);
  chk(caso.saida+': sem erro de console -- apostrofa e barra sobreviveram ao literal JS',
      p.length === 0, p.slice(0,2).join(' | '));
}

/* O texto chegou INTEIRO a tela, e nao so "o bloco nao quebrou". */
const naTela = (caso, ids, pref) => {
  const corpo = (visto[caso] || {}).corpo || '';
  for(const id of ids)
    chk(pref+': o texto hostil de '+id+' chegou inteiro a tela',
        corpo.indexOf(guardado[id]) >= 0, corpo.slice(0,160));
};
naTela('l-out', ['l-t1','l-t2','l-t4','l-t6','l-qlabel','l-qdica'], 'l');
naTela('u-out', ['u-t1','u-t3','u-t4'], 'u');
naTela('m-out', ['m-t1'], 'm');
{
  const ficha = (visto['m-out'] || {}).ficha || '';
  for(const id of ['m-t2','m-t7'])
    chk('m: o texto hostil de '+id+' chegou inteiro a FICHA do produto',
        ficha.indexOf(guardado[id]) >= 0, ficha.slice(0, 200));
}
naTela('a-out1', ['a-t1','a-t2'], 'a');
naTela('p-out1', ['p-t1','p-t3'], 'p');

const zapUrl = decodeURIComponent((((visto['l-out'] || {}).zap || [])[0]) || '');
chk('l: o botao enviar do bloco abriu o WhatsApp', zapUrl.indexOf('wa.me/') >= 0, zapUrl.slice(0,80));
for(const id of ['l-m1','l-m2','l-m3','l-m4','l-qmsg'])
  chk('l: o texto hostil de '+id+' chegou inteiro a mensagem do WhatsApp',
      zapUrl.indexOf(guardado[id]) >= 0, zapUrl.slice(0,200));

process.exit(resumo());
