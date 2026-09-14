/* ============================================================================
   LEVA 4 DA UNIFICACAO DAS ABAS DE PAGAMENTO -- o que o dono configura
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. A regressao (regressao.sh) prova que o TEXTO
   gerado nao mudou, e nesta rodada quase tudo tinha esse contrato. O que ela
   NAO alcanca e justamente o que a leva entregou:

     - uma regra de caractere num campo (o prefixo de conciliacao) -- ela so
       aparece quando alguem digita errado, e o cenario da regressao digita
       certo;
     - um contador na tela, que nao entra em saida nenhuma;
     - uma guarda de PARTIDA (a faixa dos campos numericos), que nao gera nada;
     - o teto do pedido lido de um preco com virgula, que so chega por estado
       gravado -- o formulario ja converte;
     - e a unica mudanca de saida da rodada, que so se ve no ramo que o cenario
       da regressao nao exercita: a Mini loja SEM cupom cadastrado.

   NAO COMPARA COM REFERENCIA NENHUMA, e isso e deliberado (regra de 13/09/2026
   no CLAUDE.md): mede-se a PROPRIEDADE -- "recusa o que deve, aceita o que
   deve", "os dois contadores somam o mesmo orcamento", "o bloco sem cupom
   cadastrado aceita cupom escrito a mao depois". Propriedade nao envelhece
   quando a rodada e mesclada; igualdade com um commit congelado, sim.

   DUAS METADES, e a divisao esta declarada. A ferramenta roda dentro de um IIFE
   e NAO expõe funcao nenhuma em window -- de proposito, para nao conflitar com
   o jQuery da Alboom. Entao o que e comportamento se mede no NAVEGADOR, pela
   tela; e o que e "esta escrito num lugar so" se mede no ARQUIVO, lendo o
   fonte. A segunda metade e mais fraca e esta rotulada como tal: ela prova
   ausencia de copia, nao prova execucao.

   Roda com:  node scripts/verificar/unificar-config.mjs
   ============================================================================ */
import { navegador, servir, abrir, set, radio, clicar, ler, alertas, zerarAlertas } from './lib.mjs';
import { comBlocoNaPagina, chk, resumo } from './pagina.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORTA = 8846;
const PORTA_BLOCO = 8847;

const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};

const cru = (pg,id,v) => pg.evaluate(([id,v])=>{document.getElementById(id).value=v;},[id,v]);
const contador = (pg,id) => pg.evaluate(id=>{
  const s=document.getElementById('fcl-'+id);
  return s?{texto:s.textContent,classe:s.className}:null;
},id);
const atributo = (pg,id,a) => pg.evaluate(([id,a])=>{
  const el=document.getElementById(id);
  return el?String(el.getAttribute(a)):'SEM CAMPO';
},[id,a]);

async function identidade(pg){
  for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
}
async function pacoteMinimo(pg){
  await clicar(pg,'aba-pac');
  await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
  await set(pg,'a-pcod','MINI');
  await set(pg,'a-pnome','Mini ensaio');
  await set(pg,'a-ppreco','300');
  await set(pg,'a-ppath','fotocerta/mini');
  await clicar(pg,'a-pac-salvar');
}
async function lojaMinima(pg){
  await clicar(pg,'aba-loja');
  await set(pg,'m-cod','LOJA');
  await set(pg,'m-pnome','Album 20x30');
  await set(pg,'m-ppreco','1200.50');
  await set(pg,'m-pimg','https://storage.alboom.ninja/album.jpg');
  await clicar(pg,'m-prod-salvar');
}

/* ===========================================================================
   METADE A -- O ARQUIVO: o que esta escrito um lugar so
   =========================================================================== */
function medirNoArquivo(){
  console.log('\n== A. o que esta escrito UM lugar so (leitura do fonte) ==');
  const src = fs.readFileSync(path.join(RAIZ,'index.html'),'utf8');
  const comp = fs.readFileSync(path.join(RAIZ,'fc-compartilhado.js'),'utf8');

  /* A.1 -- a faixa dos campos numericos: a tabela e o <input> dizem o mesmo.
     E a PROPRIEDADE que a guarda de partida (fcNumConferir) cobra; aqui ela e
     medida de fora, sem depender de a guarda existir. */
  const tabs = {};
  for(const m of src.matchAll(/var ([A-Z])_NUMS=(\[[\s\S]*?\]);\n/g)){
    const corpo = m[2].replace(/\/\*[\s\S]*?\*\//g,'');
    tabs[m[1]] = [...corpo.matchAll(/\['([^']+)',\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*(true|false)\]/g)]
      .map(l=>({id:l[1],pad:l[2].trim(),min:l[3].trim(),max:l[4].trim()}));
  }
  const linhas = Object.values(tabs).flat();
  const ruins = [];
  for(const l of linhas){
    const tag = src.match(new RegExp('<input[^>]*id="'+l.id+'"[^>]*>'));
    if(!tag){ ruins.push(l.id+': sem <input>'); continue; }
    const g = a => { const x = tag[0].match(new RegExp(a+'="([^"]*)"')); return x?x[1]:null; };
    if(g('min')!==l.min) ruins.push(l.id+' min='+g('min')+' tabela='+l.min);
    if(g('max')!==l.max) ruins.push(l.id+' max='+g('max')+' tabela='+l.max);
    if(g('value')!==l.pad) ruins.push(l.id+' value='+g('value')+' tabela='+l.pad);
  }
  chk('as dez tabelas numericas foram encontradas', Object.keys(tabs).length===10, Object.keys(tabs).join(','));
  chk('e elas somam mais de setenta campos', linhas.length>=70, String(linhas.length));
  chk('TODO campo numerico diz a mesma faixa na tabela e no HTML', ruins.length===0, ruins.join(' | '));
  chk('a guarda de partida existe e esta ligada como passo proprio',
      /function fcNumConferir\(\)/.test(src) && /prep\('Faixa dos campos numéricos'/.test(src));

  /* A.2 -- as fabricas de texto que estavam escritas a mao em duas tabelas. */
  for(const [rot,frase] of [
      ['"Cole no aplicativo do seu banco"','Código copiado! Cole no aplicativo do seu banco.'],
      ['"Nao consegui copiar"','Não consegui copiar. Selecione o código acima e copie na mão.'],
      ['"Pagamento aprovado. Obrigado!"','Pagamento aprovado. Obrigado!']]){
    const n = (src.match(new RegExp("'"+frase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+"'",'g'))||[]).length;
    chk('o texto '+rot+' aparece UMA vez no fonte (a fabrica)', n===1, n+' ocorrencias');
  }
  /* A unica ocorrencia que pode sobrar e a da PROPRIA fonte unica: tres copias
     manuscritas viraram uma linha dentro de fcZapTxtDefs. */
  const zap = (src.match(/\['txtZapAberturaSinal',/g)||[]).length;
  chk('as dez linhas do WhatsApp deixaram de ser escritas a mao em tres tabelas',
      zap===1 && /function fcZapTxtDefs\(pref,o\)/.test(src), zap+' ocorrencias (esperado: so a da fonte unica)');
  const chamadas = (src.match(/\.concat\(fcZapTxtDefs\(/g)||[]).length;
  chk('e as tres abas chamam a fonte unica', chamadas===3, String(chamadas));

  /* A.3 -- aRecusa deixou de ler o DOM. A recusa em si e medida no navegador,
     na parte 5; isto aqui mede a AUSENCIA da segunda fonte de leitura. */
  const corpoARecusa = src.slice(src.indexOf('function aRecusa(cfg){'),
                                src.indexOf('function aCfg(){'));
  chk('aRecusa nao chama mais fciVal/fciBruto (le so o cfg)',
      !/fciVal\(|fciBruto\(/.test(corpoARecusa),
      (corpoARecusa.match(/fci(Val|Bruto)\([^)]*\)/g)||[]).join(' '));

  /* A.4 -- as recusas da /cobrar sairem acentuadas. */
  const semAcento = [];
  for(const m of comp.matchAll(/return (fciRecusa\()?'((?:[^'\\]|\\.){30,})'/g)){
    const t = m[2];
    if(/\b(nao|entao|voce|codigo|dominio|numero|digitos|minimo|maximo|pagina|descricao|endereco|cobranca)\b/.test(t))
      semAcento.push(t.slice(0,50));
  }
  chk('nenhuma recusa do arquivo compartilhado ficou sem acento', semAcento.length===0, semAcento.join(' | '));
  const acentos = (comp.match(/[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/g)||[]).length;
  chk('o arquivo compartilhado passou a ter texto acentuado', acentos>100, acentos+' caracteres acentuados');
  const ver = (comp.match(/FC_COMPART_VERSAO='([^']+)'/)||[])[1];
  chk('e a versao dele foi trocada nos QUATRO lugares',
      ver && (src.match(new RegExp('fc-compartilhado\\.js\\?v='+ver,'g'))||[]).length===1 &&
      src.indexOf("FC_COMPART_ESPERADA='"+ver+"'")>=0 &&
      fs.readFileSync(path.join(RAIZ,'cobrar','index.html'),'utf8').indexOf("?v="+ver)>=0 &&
      fs.readFileSync(path.join(RAIZ,'cobrar','index.html'),'utf8').indexOf("FC_COMPART_ESPERADA='"+ver+"'")>=0,
      'versao lida: '+ver);
}

async function main(){
  medirNoArquivo();

  const srv = await servir(RAIZ, PORTA);
  const br = await navegador();
  let blocoSemCupom = '';
  try{
    const base = 'http://127.0.0.1:'+PORTA;
    const pg = await abrir(br, base);

    /* ---- 1. A PARTIDA ---- */
    console.log('\n== 1. a partida ==');
    const barra = await pg.evaluate(()=>{
      const b=document.getElementById('fc-falhas');
      return b?b.textContent:'';
    });
    chk('nenhuma falha de partida (a guarda da faixa e a dos textos passaram)', barra==='', barra);
    chk('nenhum erro de console ao abrir', pg.erros.length===0, pg.erros.join(' | '));
    const maxSinal = [];
    for(const p of ['u','m','a']) maxSinal.push(p+':'+await atributo(pg,p+'-sinalfixo','max'));
    chk('o max do sinal fixo agora esta no HTML das tres abas',
        maxSinal.join(' ')==='u:999999 m:999999 a:999999', maxSinal.join(' '));
    chk('e no Link de cobranca ele e o P_VALOR_MAX da regra compartilhada',
        (await atributo(pg,'p-sinalfixo','max'))==='999999.99');

    /* ---- 2. O PREFIXO DO IDENTIFICADOR (item 1) ---- */
    console.log('\n== 2. o prefixo de conciliacao ==');
    await identidade(pg);
    await pacoteMinimo(pg);

    await set(pg,'a-prefixo','FC Natal/26');
    chk('digitado: o campo se corrige a vista, como o codigo do pacote ja fazia',
        (await ler(pg,'a-prefixo'))==='FCNatal26', await ler(pg,'a-prefixo'));

    await zerarAlertas(pg);
    await cru(pg,'a-prefixo','FC Natal/26');
    await clicar(pg,'a-gerar');
    let al = await alertas(pg);
    chk('vindo de estado/backup: a geracao RECUSA e nomeia o caractere',
        al.length===1 && al[0].indexOf('prefixo do identificador')>=0 && al[0].indexOf('FCNatal26')>=0,
        JSON.stringify(al));
    chk('e nada foi gerado', ((await ler(pg,'a-out3'))||'')==='', 'a-out3 tem conteudo');

    await zerarAlertas(pg);
    await set(pg,'a-prefixo','FC-26');
    await clicar(pg,'a-gerar');
    al = await alertas(pg);
    const saidaOb = (await ler(pg,'a-out3'))||'';
    chk('prefixo valido (letras, numeros e hifen) e ACEITO', al.length===0, JSON.stringify(al));
    chk('e o bloco carrega o prefixo como foi digitado', saidaOb.indexOf("var PREFIXO='FC-26'")>=0);

    /* ---- 3. O CONTADOR DOS TRES CAMPOS QUE FALTAVAM (item 3) ---- */
    console.log('\n== 3. o contador dos campos de identificador ==');
    const cPre = await contador(pg,'a-prefixo');
    const cCod = await contador(pg,'a-pcod');
    chk('o prefixo ganhou contador', !!cPre, 'sem contador');
    chk('o codigo do pacote ganhou contador', !!cCod, 'sem contador');
    chk('o contador do prefixo conta so o que sobrevive ao Pix (hifen vale zero)',
        cPre && /^4 de 13 \(5 digitados\)/.test(cPre.texto), cPre&&cPre.texto);

    await set(pg,'a-pcod','ENSAIO-FAMILIA');
    const cPre2 = await contador(pg,'a-prefixo');
    const cCod2 = await contador(pg,'a-pcod');
    chk('os dois contadores somam o MESMO orcamento compartilhado',
        cPre2 && cCod2 && cPre2.texto.indexOf('17 de 13')===0 && cCod2.texto.indexOf('17 de 13')===0,
        (cPre2&&cPre2.texto)+' / '+(cCod2&&cCod2.texto));
    chk('e os dois ficam vermelhos juntos',
        cPre2 && cCod2 && /fcl-passou/.test(cPre2.classe) && /fcl-passou/.test(cCod2.classe),
        (cPre2&&cPre2.classe)+' / '+(cCod2&&cCod2.classe));
    const cap = [await atributo(pg,'a-pcod','maxlength'), await atributo(pg,'a-prefixo','maxlength')];
    chk('nenhum dos dois ganhou maxlength (o orcamento e compartilhado, e o campo nao pode cortar o que a regra aceita)',
        cap.join(' ')==='null null', cap.join(' '));
    await set(pg,'a-pcod','');

    const cLoja = await contador(pg,'m-cod');
    chk('o codigo da loja tambem ganhou contador', !!cLoja, 'sem contador');
    chk('e ele mostra o teto proprio da Mini loja (sem prefixo a dividir)',
        cLoja && /^4 de 17/.test(cLoja.texto), cLoja&&cLoja.texto);

    /* ---- 4. aRecusa: RECUSA O QUE DEVE, ACEITA O QUE DEVE (item 6) ---- */
    console.log('\n== 4. a recusa da aba pac ==');
    await zerarAlertas(pg);
    await set(pg,'fci-zapnum','');
    await clicar(pg,'a-gerar');
    al = await alertas(pg);
    chk('sem WhatsApp: recusa, e a recusa aponta o painel Identidade',
        al.length===1 && al[0].indexOf('WhatsApp')>=0, JSON.stringify(al));
    await set(pg,'fci-zapnum',IDENT.zapnum);
    await zerarAlertas(pg);
    await clicar(pg,'a-gerar');
    chk('com WhatsApp: aceita', (await alertas(pg)).length===0);
    const identNoBloco = ["var NOME_RECEBEDOR='Foto Certa'","var CIDADE='Vitoria'",
      "var PAYPAL_CLIENT_ID='"+IDENT.client+"'","var WHATSAPP='"+IDENT.zapnum+"'"];
    const ob2 = (await ler(pg,'a-out3'))||'';
    chk('e o bloco continua carregando a identidade do painel, campo a campo',
        identNoBloco.every(t=>ob2.indexOf(t)>=0),
        identNoBloco.filter(t=>ob2.indexOf(t)<0).join(' | '));

    /* ---- 5. AS FABRICAS DE TEXTO, na tela (itens 8 e 11) ---- */
    console.log('\n== 5. as fabricas de texto, na tela ==');
    const pares = [['a-txt-pix-copiado','p-txt-copiado'],
                   ['a-txt-pix-naocopiou','p-txt-naocopiou'],
                   ['a-txt-sucesso','p-txt-sucesso'],
                   ['a-txt-ou','p-txt-ou']];
    for(const [x,y] of pares){
      const vx=await ler(pg,x), vy=await ler(pg,y);
      chk('o campo '+x+' e o '+y+' nascem com o MESMO texto de fabrica', vx===vy, vx+' / '+vy);
    }
    const dez = ['abertura','abertura-sinal','pedido','cupom','descpix','total','sinal','saldo','valor'];
    for(const p of ['u','m','a']){
      const faltam = [];
      for(const s of dez) if((await ler(pg,p+'-txt-zap-'+s))===null) faltam.push(s);
      const botao = (await ler(pg, p==='a' ? 'a-txt-zap-pago' : p+'-txt-zap-botao'));
      chk('as dez linhas do WhatsApp existem na aba '+p, faltam.length===0 && botao!==null,
          faltam.join(',')+' botao='+botao);
    }

    /* ---- 6. O TETO DO PEDIDO LE O PRECO COM VIRGULA (item 4) ---- */
    console.log('\n== 6. o teto do pedido na Mini loja ==');
    await lojaMinima(pg);
    /* O preco com VIRGULA so chega por estado gravado -- mProdSalvar converte.
       Planta-se o estado e recarrega-se, que e o caminho de um backup antigo. */
    await pg.evaluate(()=>{
      const st=JSON.parse(localStorage.getItem('fcConstrutores')||'{}');
      st.m.prods[0].preco='1200,50';
      localStorage.setItem('fcConstrutores',JSON.stringify(st));
    });
    await pg.reload();
    await pg.evaluate(()=>{
      window.__alertas=[];
      window.alert=m=>{window.__alertas.push(String(m));};
      window.confirm=()=>true; window.open=()=>null;
    });
    await clicar(pg,'aba-loja');
    const precoVoltou = await pg.evaluate(()=>
      JSON.parse(localStorage.getItem('fcConstrutores')||'{}').m.prods[0].preco);
    chk('o preco com virgula sobreviveu a recarga (o cenario esta montado)',
        precoVoltou==='1200,50', String(precoVoltou));
    await radio(pg,'m-sinal','sim');
    await radio(pg,'m-sinaltipo','fixo');
    for(const [valor, deveRecusar] of [['1200.30',false],['1200.60',true]]){
      await set(pg,'m-sinalfixo',valor);
      await zerarAlertas(pg);
      await clicar(pg,'m-gerar');
      const a = await alertas(pg);
      const houve = a.some(x=>x.indexOf('maior pedido')>=0);
      chk('sinal fixo de '+valor+' sobre um pedido de R$ 1.200,50: '+(deveRecusar?'recusa':'aceita'),
          houve===deveRecusar, JSON.stringify(a));
    }
    await radio(pg,'m-sinal','nao');

    /* ---- 7. A MINI LOJA SEM CUPOM CADASTRADO (item 12) ---- */
    console.log('\n== 7. a Mini loja sem cupom cadastrado ==');
    await zerarAlertas(pg);
    await clicar(pg,'m-gerar');
    al = await alertas(pg);
    chk('a loja gera sem cupom nenhum cadastrado', al.length===0, JSON.stringify(al));
    blocoSemCupom = (await ler(pg,'m-out'))||'';
    chk('e o bloco carrega a maquina do cupom mesmo assim',
        blocoSemCupom.indexOf('var CUPONS=[')>=0 &&
        blocoSemCupom.indexOf('function aplicarCupom()')>=0 &&
        blocoSemCupom.indexOf('function linhaDesconto()')>=0);
    chk('e a linha que esconde a caixa no carregamento',
        blocoSemCupom.indexOf("if(!CUPONS.length)raiz.querySelector('.fcm-cupom').style.display='none';")>=0);
    chk('a lista de cupons sai VAZIA (nada foi inventado)',
        /var CUPONS=\[\s*\];/.test(blocoSemCupom));

    await pg.close();
  } finally {
    await br.close();
    srv.close();
  }

  /* ---- 8. O BLOCO RODANDO, nos dois estados (item 12) ---- */
  console.log('\n== 8. o bloco da Mini loja executando ==');
  const semCupom = await comBlocoNaPagina({
    bloco: blocoSemCupom, porta: PORTA_BLOCO,
    medir: async pg => pg.evaluate(()=>{
      const c=document.querySelector('.fcm-cupom');
      return {existe:!!c, escondida:c?c.style.display==='none':null};
    })
  });
  /* A rede externa e BLOQUEADA pelo molde de proposito (foto do produto, SDK do
     PayPal): 'net::ERR_FAILED' e o bloqueio funcionando, nao o bloco quebrando.
     O que conta e erro de JAVASCRIPT. */
  const soJs = es => es.filter(e => e.indexOf('net::ERR_FAILED')<0);
  chk('sem cupom: o bloco monta sem erro de JavaScript', soJs(semCupom.erros).length===0, soJs(semCupom.erros).join(' | '));
  chk('sem cupom: a caixa existe no HTML', semCupom.existe===true);
  chk('sem cupom: e nasce ESCONDIDA -- o cliente nao ve nada a mais', semCupom.escondida===true);

  /* O QUE ESTA RODADA DEVOLVEU: cupom escrito A MAO dentro do bloco publicado.
     E a unica prova que separa "emitir sempre" de "emitir quando ha cupom", e e
     o caminho que o dono usa quando quer um cupom sem regerar a loja inteira. */
  const comCupom = blocoSemCupom.replace(/var CUPONS=\[\s*\];/,
    "var CUPONS=[\n  {codigo:'TESTE10', tipo:'pct_total', valor:10, validade:''}\n];");
  chk('o cupom foi escrito a mao no bloco (a edicao pegou)', comCupom!==blocoSemCupom);
  const editado = await comBlocoNaPagina({
    bloco: comCupom, porta: PORTA_BLOCO,
    medir: async pg => {
      const caixa = await pg.evaluate(()=>(document.querySelector('.fcm-cupom')||{}).style?.display);
      /* Pelo caminho do cliente: abre o cartao de detalhe e adiciona a cesta. */
      await pg.evaluate(()=>{
        const f=document.querySelector('.fcm-grade .fcm-foto, .fcm-grade > *');
        if(f) f.click();
      });
      await pg.waitForTimeout(60);
      await pg.evaluate(()=>{
        const bts=[...document.querySelectorAll('.fcm-detalhe button')];
        if(bts.length) bts[bts.length-1].click();
      });
      await pg.waitForTimeout(60);
      const totalAntes = await pg.evaluate(()=>(document.querySelector('.fcm-total-v')||{}).textContent||'');
      await pg.evaluate(()=>{
        const i=document.querySelector('.fcm-cupom-l input');
        if(i) i.value='TESTE10';
        const b=document.querySelector('.fcm-cupom-l button');
        if(b) b.click();
      });
      const depois = await pg.evaluate(()=>({
        msg:(document.querySelector('.fcm-cupom-msg')||{}).textContent||'',
        total:(document.querySelector('.fcm-total-v')||{}).textContent||'',
        desconto:(document.querySelector('.fcm-desconto')||{}).className||''
      }));
      return {caixa, totalAntes, depois};
    }
  });
  chk('com cupom a mao: o bloco monta sem erro de JavaScript', soJs(editado.erros).length===0, soJs(editado.erros).join(' | '));
  chk('com cupom a mao: a caixa do cupom APARECE', editado.caixa!=='none', String(editado.caixa));
  chk('com cupom a mao: o produto entrou na cesta', /[0-9]/.test(editado.totalAntes), editado.totalAntes);
  chk('com cupom a mao: o cupom e aceito', /aplicado/i.test(editado.depois.msg), JSON.stringify(editado.depois));
  chk('com cupom a mao: a linha de desconto acende', /fcm-desconto on/.test(editado.depois.desconto), editado.depois.desconto);
  chk('com cupom a mao: o total baixa', editado.totalAntes!==editado.depois.total,
      editado.totalAntes+' -> '+editado.depois.total);

  process.exit(resumo());
}

main().catch(e=>{console.error(e);process.exit(1);});
