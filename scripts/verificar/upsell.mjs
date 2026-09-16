/* ============================================================================
   O UPSELL: LEVAR O CLIENTE A OUTRA PAGINA DEPOIS DO PAGAMENTO
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. A rodada de 13/09/2026 acrescentou dois controles em cada uma
   das QUATRO abas de pagamento -- o endereco da pagina de upsell e um interruptor
   ligado/desligado -- e a regra de emissao deles nao e "o interruptor manda". Ela e:

      endereco vazio   + desligado  ->  nada e emitido (byte a byte como antes)
      endereco escrito + ligado     ->  as duas variaveis, UPSELL_ATIVO=true
      endereco escrito + desligado  ->  as duas variaveis, UPSELL_ATIVO=false (inerte)
      endereco vazio   + ligado     ->  a ferramenta RECUSA gerar

   A TERCEIRA LINHA E O PEDIDO DO DONO, e e ela que a regressao byte a byte NAO alcanca. Com o
   campo vazio -- a fabrica -- a saida e identica a de antes da rodada, entao `regressao.sh`
   prova que nada quebrou e nao consegue provar que algo passou a funcionar. Este arquivo e o
   outro lado, e a verificacao que o representa e uma so: gerar com o interruptor DESLIGADO,
   trocar `false` por `true` NO TEXTO JA GERADO, sem voltar a ferramenta, e medir que o bloco
   passa a levar. Sem ela, "editar direto no codigo" e promessa nao medida.

   O QUE ELE MEDE, em oito partes:
     1. Os QUATRO ESTADOS no texto das quatro saidas (u-out, m-out, a-out3, p-out1).
     2. A RECUSA do estado incoerente, com a frase exata que ela mostra.
     3. O ESQUEMA recusado na geracao (javascript:, data:, //outro-host, caminho sem barra),
        pela MESMA regra do botao de acao da Contagem regressiva (cUrlOk/urlLimpa).
     4. O BLOCO EXECUTANDO, com o PayPal aprovado: ligado leva, desligado carrega as variaveis
        e NAO leva, e o desligado com um `true` escrito a mao passa a levar.
     5. A ORDEM do gancho na Mini loja: a cesta e esvaziada ANTES da saida -- medida DEPOIS da
        navegacao, lendo o armazenamento na pagina de destino, que e onde o defeito apareceria
        ("o cliente volta com a cesta cheia depois de ter pago").
     6. O CAMINHO C: o botao "Ja paguei", nos dois cenarios (com e sem WhatsApp configurado) e
        em duas larguras de tela. Ele existe de DUAS formas, e as duas sao medidas: window.open
        no Checkout e na Mini loja; ANCORA com target=_blank na /pagar e -- desde 13/09/2026 --
        na Agendamento por pacote, que ate entao nao tinha o botao.
     7. O LINK de cobranca: nenhum byte muda com o upsell DA PAGINA configurado -- e o CODIGO 1
        muda, que e o outro lado da mesma medida (sem ele, "o link nao mudou" poderia ser "nada
        mudou"). Desde 14/09/2026 existe um SEGUNDO campo de upsell naquela aba, o DESTA
        COBRANCA, e esse VIAJA no link de proposito; ele e medido em itens-upsell.mjs, e o que
        esta parte continua cobrando e que o campo da PAGINA nao vaza para o endereco.
     8. O endereco INVALIDO escrito a mao no codigo publicado: MEDICAO, nao assercao. O bloco
        nao reconfere de proposito, e o que se quer saber e se ele quebra feio.

   COMO SE SIMULA O PAGAMENTO APROVADO, SEM PAYPAL. O molde bloqueia a rede externa, entao o
   SDK nunca carrega. A pagina de teste intercepta o document.head.appendChild do proprio bloco
   -- o MESMO caminho da sonda da previa da ferramenta (fcPvSondaPP), e o mesmo que
   pac-quantidade.mjs ja usa --, instala um window.paypal falso que guarda a configuracao dos
   Buttons e dispara o onload. Dai o onApprove DO PROPRIO BLOCO e chamado com um
   actions.order.capture() que apenas resolve. O que se mede e o bloco, nao uma imitacao dele.

   COMO SE MEDE A NAVEGACAO. O endereco de upsell aponta para a PROPRIA rota do molde
   (http://127.0.0.1:<porta>/pagina?foi=upsell). O servidor do molde responde /pagina para
   qualquer consulta, entao a navegacao ACONTECE de verdade e a medida e pg.url(). Apontar para
   fora seria abortado pela guarda de rede do molde, e "nao navegou" se confundiria com "a rede
   barrou".

   ESTE ARQUIVO NAO COMPARA COM REFERENCIA NENHUMA. Ele mede PROPRIEDADES da arvore de hoje
   (quatro estados, recusa, ordem, o link que nao muda), e as compara entre si -- nao com um
   commit congelado. Por isso a regra da casa sobre prender o commit e dizer NAO MEDIU nao se
   aplica aqui: nao ha lado "antes" para envelhecer. Quem faz a comparacao com referencia e
   scripts/verificar/regressao.sh, chamado a parte.

   Roda com:  node scripts/verificar/upsell.mjs
   Nao precisa de internet.
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, radio, clicar, alertas, ligar, lerLigado } from './lib.mjs';

const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};

/* A porta do molde entra no proprio endereco de upsell -- ver o cabecalho. Uma por execucao
   de bloco, para duas passagens nunca disputarem a mesma. */
let PORTA = 8840;          /* paginas do molde (o bloco executando) */
let FER = 9200;            /* aberturas da ferramenta (gerarNaFerramenta) */
const alvoDe = p => 'http://127.0.0.1:' + p + '/pagina?foi=upsell';

/* ---------------------------------------------------------------------------
   O CENARIO MINIMO de cada aba. Minimo de proposito: o que esta sob teste e o upsell, e
   catalogo grande so faria a falha demorar mais a aparecer. Cada funcao recebe a pagina da
   ferramenta e o par {url, ligado} do upsell daquela passagem.
   --------------------------------------------------------------------------- */
async function ident(pg){
  for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
}
async function upsellCampos(pg, pref, up){
  await set(pg, pref+'-upsell', up.url || '');
  /* 'ligar' em vez de 'radio': a Calculadora de album desenha este interruptor como caixa de
     marcar, e as outras quatro como par de radios. Ver o comentario de lib.mjs. */
  await ligar(pg, pref+'-upsellon', up.ligado);
}
async function abaCheckout(pg, up){
  await ident(pg);
  await clicar(pg,'aba-uni');
  await set(pg,'u-pnome','Ensaio de Natal'); await set(pg,'u-ppreco','420');
  await clicar(pg,'u-prod-salvar');
  await upsellCampos(pg,'u',up);
  await clicar(pg,'u-gerar');
}
async function abaLoja(pg, up){
  await ident(pg);
  await clicar(pg,'aba-loja');
  await set(pg,'m-cod','LOJA1');
  await set(pg,'m-pnome','Album 30x30'); await set(pg,'m-ppreco','890');
  await set(pg,'m-pimg','https://storage.alboom.ninja/album-30x30.jpg');
  await clicar(pg,'m-prod-salvar');
  await upsellCampos(pg,'m',up);
  await clicar(pg,'m-gerar');
}
async function abaPacote(pg, up){
  await ident(pg);
  await clicar(pg,'aba-pac');
  await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
  await set(pg,'a-prefixo','FC');
  await set(pg,'a-pcod','MINI'); await set(pg,'a-pnome','Mini ensaio');
  await set(pg,'a-pdur','1 hora'); await set(pg,'a-ppreco','420');
  await set(pg,'a-pinclui','10 fotos tratadas');
  await set(pg,'a-ppath','https://tidycal.com/fotocerta/mini');
  await clicar(pg,'a-pac-salvar');
  await upsellCampos(pg,'a',up);
  await clicar(pg,'a-gerar');
}
async function abaCobranca(pg, up){
  await ident(pg);
  await clicar(pg,'aba-cob');
  await set(pg,'p-url','https://www.fotocerta.com.br/pagar');
  await set(pg,'p-desc','Ensaio de familia');
  await set(pg,'p-valor','1200,50');
  await radio(pg,'p-usapp','sim'); await radio(pg,'p-zap','sim');
  await upsellCampos(pg,'p',up);
  await clicar(pg,'p-gerar');
  await clicar(pg,'p-gerarlink');
}

/* A CALCULADORA DE ALBUM (16/09/2026). Ela ja nasce com tamanhos de fabrica, entao aqui so
   entram o codigo da campanha e os dois campos do upsell -- o resto e o padrao, que e
   exatamente o que se quer medir. O SINAL E DESLIGADO de proposito: ligado, o bloco cobra
   sinal e o caminho do cartao na parte 4 passa a aprovar a ENTRADA, nao o pedido; o upsell
   nao muda com isso, mas o teste passaria a medir outra coisa sem dizer. */
async function abaAlbum(pg, up){
  await ident(pg);
  await clicar(pg,'aba-alb');
  await set(pg,'v-cod','ALB26');
  await radio(pg,'v-sinal','nao');
  await upsellCampos(pg,'v',up);
  await clicar(pg,'v-gerar');
}

const ABAS = [
  {nome:'Checkout',              pref:'u', saida:'u-out',   cfg:abaCheckout},
  {nome:'Mini loja',             pref:'m', saida:'m-out',   cfg:abaLoja},
  {nome:'Agendamento por pacote',pref:'a', saida:'a-out3',  cfg:abaPacote},
  {nome:'Link de cobranca',      pref:'p', saida:'p-out1',  cfg:abaCobranca},
  {nome:'Calculadora de album',  pref:'v', saida:'v-out',   cfg:abaAlbum}
];

const URL_TESTE = 'https://www.fotocerta.com.br/oferta-especial';

/* ============================================================================
   PARTE 1 -- OS QUATRO ESTADOS, no TEXTO das quatro saidas
   ============================================================================ */
console.log('\n== 1. Os quatro estados da tabela, no texto gerado ==');

const ESTADOS = [
  {rot:'vazio + desligado',     url:'',        ligado:false, emite:false, ativo:null,  recusa:false},
  {rot:'preenchido + ligado',   url:URL_TESTE, ligado:true,  emite:true,  ativo:'true',recusa:false},
  {rot:'preenchido + DESLIGADO',url:URL_TESTE, ligado:false, emite:true,  ativo:'false',recusa:false},
  {rot:'vazio + LIGADO',        url:'',        ligado:true,  emite:false, ativo:null,  recusa:true}
];

/* A ABA LINK DE COBRANCA DEIXOU DE SEGUIR A TABELA ACIMA em 14/09/2026 (leva 10), e SO ELA.
   Nas outras tres o endereco do upsell so pode vir da aba, e por isso "endereco vazio" ainda
   quer dizer "nao ha upsell nenhum": nada e emitido, e ligar o interruptor sem destino e um
   estado que nao faz nada e parece que faz -- recusa.
   Na /pagar passou a existir uma segunda fonte de endereco: o LINK de cada cobranca (parametro
   u). Dai as duas consequencias que esta funcao declara:
     - as duas variaveis saem SEMPRE, mesmo com o campo da aba vazio, porque o bloco nao pode
       depender do que estava configurado no dia em que foi gerado (a mesma regra que o
       desconto e o sinal ja seguem nesta aba, e pela mesma razao medida);
     - "ligado com o endereco da pagina vazio" deixou de ser incoerente: ele significa "o
       endereco vem de cada cobranca", e por isso deixou de ser recusado.
   O que NAO mudou, e continua cobrado logo abaixo: UPSELL_ATIVO segue o interruptor, as
   variaveis ficam no topo, e ligado x desligado diferem so no valor do interruptor.
   A precedencia em si (link vence pagina, mestre desliga os dois) e medida EXECUTANDO em
   scripts/verificar/itens-upsell.mjs, parte 5 -- aqui se mede o TEXTO. */
const esperadoDe = (aba, e) => aba.pref !== 'p'
  ? {emite:e.emite, ativo:e.ativo, recusa:e.recusa, temUrl:e.emite}
  : {emite:true, ativo:e.ligado?'true':'false', recusa:false, temUrl:!!e.url};

/* A saida de cada [aba][estado], guardada para as partes seguintes nao regerarem. */
const saidas = {};
for(const aba of ABAS){
  saidas[aba.pref] = {};
  for(const e of ESTADOS){
    const r = await gerarNaFerramenta(pg => aba.cfg(pg,{url:e.url,ligado:e.ligado}),
      [aba.saida,'p-out2'], {porta: FER++});
    const t = r.valores[aba.saida] || '';
    saidas[aba.pref][e.rot] = {texto:t, link:r.valores['p-out2']||'', alertas:r.alertas, erros:r.erros};
    const tag = aba.nome + ' / ' + e.rot + ': ';
    const esp = esperadoDe(aba, e);

    if(esp.recusa){
      chk(tag+'a ferramenta RECUSOU gerar', r.alertas.length>0 && t==='', 'alertas='+r.alertas.length+' bytes='+t.length);
      continue;
    }
    chk(tag+'gerou sem alerta', r.alertas.length===0, r.alertas.join(' | '));
    chk(tag+'gerou sem erro de console', r.erros.length===0, r.erros.join(' | '));
    const temVars = /var UPSELL_ATIVO=/.test(t) && /var UPSELL_URL=/.test(t);
    const temFn = /function upsellIr\(\)/.test(t);
    const temChamada = /upsellIr\(\);/.test(t);
    if(esp.emite){
      chk(tag+'as DUAS variaveis sairam', temVars, 'ATIVO='+/var UPSELL_ATIVO=/.test(t)+' URL='+/var UPSELL_URL=/.test(t));
      chk(tag+'UPSELL_ATIVO='+esp.ativo, new RegExp('var UPSELL_ATIVO='+esp.ativo+';').test(t),
        (t.match(/var UPSELL_ATIVO=\w+;/)||['(nenhuma)'])[0]);
      chk(tag+(esp.temUrl?'o endereco saiu inteiro':'o endereco saiu VAZIO (o da cobranca vem no link)'),
        t.indexOf("var UPSELL_URL='"+(esp.temUrl?URL_TESTE:'')+"'")>=0,
        (t.match(/var UPSELL_URL='[^']*';/)||['(nenhuma)'])[0]);
      chk(tag+'a funcao upsellIr saiu junto', temFn);
      chk(tag+'alguem CHAMA upsellIr', temChamada);
      chk(tag+'as variaveis estao ANTES da funcao (topo do bloco)',
        t.indexOf('var UPSELL_ATIVO=') < t.indexOf('function upsellIr()'));
      chk(tag+'o comentario diz os valores aceitos', /UPSELL_ATIVO=\w+;\s+\/\* true = leva \| false = nao leva/.test(t));
    }else{
      chk(tag+'NADA de upsell foi emitido', !temVars && !temFn && !temChamada,
        'vars='+temVars+' fn='+temFn+' chamada='+temChamada);
    }
  }
  /* A prova que separa "nao emitiu" de "emitiu igual": o texto do estado vazio e o do estado
     preenchido tem de DIFERIR, e a diferenca tem de ser so o upsell. */
  const vazio = saidas[aba.pref]['vazio + desligado'].texto;
  const ligado = saidas[aba.pref]['preenchido + ligado'].texto;
  const desligado = saidas[aba.pref]['preenchido + DESLIGADO'].texto;
  chk(aba.nome+': o estado vazio difere do preenchido', vazio!==ligado && vazio.length<ligado.length);
  /* SO NA /pagar: o quarto estado deixou de ser recusa e virou um estado legitimo -- e ele
     tem de emitir o interruptor LIGADO com o endereco VAZIO, esperando o do link. Sem esta
     linha, a mudanca de regra sumiria da suite em vez de ser medida. */
  if(aba.pref === 'p'){
    const vl = saidas['p']['vazio + LIGADO'].texto;
    chk(aba.nome+': "vazio + LIGADO" deixou de ser recusa e emite ATIVO=true com URL vazia',
      /var UPSELL_ATIVO=true;/.test(vl) && vl.indexOf("var UPSELL_URL='';")>=0,
      (vl.match(/var UPSELL_(ATIVO|URL)=[^;]*;/g)||['(nenhuma)']).join(' '));
    chk(aba.nome+': e ele difere do "vazio + desligado" SO no valor do interruptor',
      vl.replace('var UPSELL_ATIVO=true;','var UPSELL_ATIVO=false;')===vazio,
      'ligado='+vl.length+'B  desligado='+vazio.length+'B');
  }
  /* ligado x desligado: UMA palavra de diferenca, e ela e o valor do interruptor. */
  chk(aba.nome+': ligado e desligado diferem SO no valor do interruptor',
    ligado.replace('var UPSELL_ATIVO=true;','var UPSELL_ATIVO=false;')===desligado,
    'bytes: ligado='+ligado.length+' desligado='+desligado.length);
}

/* ============================================================================
   PARTE 2 -- A RECUSA, e a frase dela
   ============================================================================ */
console.log('\n== 2. A recusa do estado incoerente (ligado sem destino) ==');
for(const aba of ABAS){
  /* A /pagar SAIU desta parte em 14/09/2026, e a razao esta na parte 1: la o endereco pode vir
     do link, entao "ligado sem endereco da pagina" e um estado que FAZ alguma coisa. Deixar a
     assercao rodando produziria tres falhas por dia sem defeito nenhum por tras, e vermelho
     que e sempre vermelho esconde o proximo. O estado dela e medido na parte 1, positivamente. */
  if(aba.pref === 'p'){
    console.log('    -> '+aba.nome+': NAO SE APLICA -- desde a leva 10 o endereco pode vir no link.');
    continue;
  }
  const al = saidas[aba.pref]['vazio + LIGADO'].alertas;
  const frase = al.join(' | ');
  chk(aba.nome+': a recusa aconteceu', al.length>0);
  chk(aba.nome+': a frase diz que esta LIGADO e o endereco esta VAZIO',
    /est(á|a) ligado/i.test(frase) && /vazio/i.test(frase), frase);
  chk(aba.nome+': a frase diz O QUE FAZER (preencher ou desligar)',
    /[Pp]reencha/.test(frase) && /desligue/i.test(frase), frase);
  if(aba.pref==='u') console.log('    -> a frase: '+frase);
}

/* ============================================================================
   PARTE 3 -- O ESQUEMA recusado na geracao
   ============================================================================ */
console.log('\n== 3. O endereco que a ferramenta recusa (mesma regra do cUrlOk) ==');
const MAUS = [
  ['javascript:alert(1)',              'esquema javascript:'],
  ['data:text/html,<b>x</b>',          'esquema data:'],
  ['java\tscript:alert(1)',            'javascript: com tabulacao no meio (urlLimpa)'],
  ['/\\evil.exemplo.com/x',            'barra invertida que o navegador resolve para outro host'],
  ['//evil.exemplo.com/x',             'protocol-relative: resolve para OUTRO host'],
  ['oferta-especial',                  'caminho sem barra inicial']
];
const BONS = [
  ['#oferta',                          'ancora'],
  ['/oferta-especial',                 'caminho do proprio site'],
  ['https://www.fotocerta.com.br/x',   'https inteiro'],
  ['http://www.fotocerta.com.br/x',    'http inteiro']
];
for(const [u,rot] of MAUS){
  const r = await gerarNaFerramenta(pg => abaCheckout(pg,{url:u,ligado:true}), ['u-out'], {porta: FER++});
  chk('recusa: '+rot, r.alertas.length>0 && (r.valores['u-out']||'')==='',
    'alertas='+r.alertas.join(' | ')+' bytes='+(r.valores['u-out']||'').length);
  if(r.alertas.length) chk('recusa: '+rot+' -- a frase nomeia o que e aceito',
    /âncora|ancora/i.test(r.alertas[0]) && /http/i.test(r.alertas[0]), r.alertas[0]);
}
for(const [u,rot] of BONS){
  const r = await gerarNaFerramenta(pg => abaCheckout(pg,{url:u,ligado:true}), ['u-out'], {porta: FER++});
  const t = r.valores['u-out']||'';
  chk('aceita: '+rot, r.alertas.length===0 && t.indexOf("var UPSELL_URL='"+u+"'")>=0,
    'alertas='+r.alertas.join(' | '));
}
/* O ENDERECO COM ASPA, para o escape: o bloco tem de continuar sendo JavaScript valido. */
{
  const u = "https://exemplo.com/x'y\\z?a=<b>&c=1";
  const r = await gerarNaFerramenta(pg => abaCheckout(pg,{url:u,ligado:true}), ['u-out'], {porta: FER++});
  const t = r.valores['u-out']||'';
  chk('endereco hostil: gerou sem alerta', r.alertas.length===0, r.alertas.join(' | '));
  const rr = await comBlocoNaPagina({
    bloco:t, porta: PORTA++,
    medir: async pg => ({el: await pg.$('#fcuni') ? 1 : 0})
  });
  chk('endereco hostil: o bloco desenhou (o escape segurou)', rr.el===1);
}

/* ============================================================================
   PARTE 4 -- O BLOCO EXECUTANDO: o PayPal aprovado
   ============================================================================ */
console.log('\n== 4. O bloco executando: PayPal aprovado ==');

/* A sonda: mesmo caminho de pac-quantidade.mjs e da previa da ferramenta. */
const SONDA = '<scr'+'ipt>(function(){\n'
  + 'var ins=document.head.appendChild;\n'
  + 'document.head.appendChild=function(n){\n'
  + '  if(n&&n.tagName==="SCRIPT"&&/paypal\\.com/.test(String(n.src||""))){\n'
  + '    window.paypal={Buttons:function(bt){window.__pp=bt;return {render:function(){}};}};\n'
  + '    setTimeout(function(){if(n.onload)n.onload();},0);\n'
  + '    return n;\n'
  + '  }\n'
  + '  return ins.call(document.head,n);\n'
  + '};\n'
  + '})();</scr'+'ipt>';

/* SONDA DO window.open. Ela REGISTRA e deixa passar -- nao neutraliza. Existe porque a guarda
   de rede do molde barra wa.me, e uma aba cujo destino nunca carrega pode nao chegar a emitir
   o evento 'page' do Playwright: medido nesta bateria, 0 eventos, com o window.open tendo sido
   chamado e devolvido janela nas quatro passagens. A pergunta "a aba sobrevive a navegacao
   imediata da pagina de tras?" e outra, e ela e respondida com destino que CARREGA, em
   scripts/verificar/upsell-janela.mjs (cinco ordens, duas larguras, tres passagens cada:
   a aba nunca e perdida). Aqui a pergunta e "o bloco ainda pede a aba do WhatsApp, e depois
   leva a pagina ao upsell?". */
/* O REGISTRO VAI PARA O localStorage, e nao para uma variavel da pagina: o clique navega, e
   uma variavel morre com o documento. A primeira passagem desta bateria mediu exatamente esse
   tropeco -- lista vazia porque a leitura caia na pagina JA NOVA. O armazenamento e de mesma
   origem, entao ele atravessa a navegacao e e lido no destino, que e onde a resposta importa. */
const SONDA_OPEN = '<scr'+'ipt>(function(){\n'
  + 'var orig=window.open;\n'
  + 'window.open=function(u,a){\n'
  + '  var w=null;try{w=orig.call(window,u,a);}catch(e){}\n'
  + "  try{var l=JSON.parse(localStorage.getItem('__abriu')||'[]');l.push({u:String(u),ref:!!w});\n"
  + "    localStorage.setItem('__abriu',JSON.stringify(l));}catch(e2){}\n"
  + '  return w;};\n'
  + '})();</scr'+'ipt>';

const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|alboom\.ninja|storage\.|tidycal|wa\.me|whatsapp|ERR_FAILED|Failed to load resource|net::ERR/i;
const errosReais = e => e.filter(x => !EXTERNO.test(x));

async function esperarUrl(pg, pedaco, ms=2500){
  const t = Date.now();
  while(Date.now()-t < ms){
    let u=''; try{ u = pg.url(); }catch(e){}
    if(u.indexOf(pedaco)>=0) return true;
    await new Promise(r=>setTimeout(r,50));
  }
  return false;
}
/* Chama o onApprove DO BLOCO. Se ele navegar, o contexto de execucao morre no meio -- e isso
   e o resultado que se quer, nao um erro: a promessa e engolida de proposito. */
async function aprovar(pg){
  try{
    await pg.evaluate(()=>{
      window.__pp.onApprove(null,{order:{capture:function(){return Promise.resolve({});}}});
    });
  }catch(e){ /* execution context destroyed = navegou */ }
}

const BUSCA = {u:'', m:'', a:'?pac=MINI&data=2027-01-10&hora=10:00', p:'', v:''};

/* Para a /pagar o bloco so monta com uma cobranca no endereco. Ela vem do proprio link que a
   aba gerou na passagem correspondente -- assim o que se executa e o par real. */
function buscaDoLink(link){
  const i = String(link).indexOf('?');
  return i<0 ? '' : String(link).substring(i);
}

for(const aba of ABAS){
  const porta = PORTA++;
  const alvo = alvoDe(porta);
  /* --- 4a. LIGADO: leva --- */
  let busca = BUSCA[aba.pref];
  const gerado = await gerarNaFerramenta(pg => aba.cfg(pg,{url:alvo,ligado:true}),
    [aba.saida,'p-out2'], {porta: FER++});
  const bloco = gerado.valores[aba.saida]||'';
  if(aba.pref==='p') busca = buscaDoLink(gerado.valores['p-out2']);
  chk(aba.nome+': gerou o bloco com o alvo local', bloco.indexOf(alvo)>=0, alvo);

  const rLig = await comBlocoNaPagina({
    bloco, cabeca:SONDA, porta, busca,
    medir: async pg => {
      try{ await pg.waitForFunction(()=>!!window.__pp, null, {timeout:4000}); }
      catch(e){ return {semSdk:true, url:pg.url()}; }
      await aprovar(pg);
      const foi = await esperarUrl(pg,'foi=upsell');
      return {semSdk:false, foi, url:pg.url()};
    }
  });
  chk(aba.nome+': o SDK do pagamento foi pedido pelo bloco', !rLig.semSdk, 'url='+rLig.url);
  chk(aba.nome+': LIGADO -- o pagamento aprovado LEVOU ao upsell', rLig.foi===true, 'url='+rLig.url);
  chk(aba.nome+': LIGADO -- sem erro proprio do bloco', errosReais(rLig.erros).length===0, errosReais(rLig.erros).join(' | '));

  /* --- 4b. DESLIGADO: carrega as variaveis e NAO leva --- */
  const porta2 = PORTA++;
  const alvo2 = alvoDe(porta2);
  const gerado2 = await gerarNaFerramenta(pg => aba.cfg(pg,{url:alvo2,ligado:false}),
    [aba.saida,'p-out2'], {porta: FER++});
  const bloco2 = gerado2.valores[aba.saida]||'';
  const busca2 = aba.pref==='p' ? buscaDoLink(gerado2.valores['p-out2']) : BUSCA[aba.pref];
  const rDes = await comBlocoNaPagina({
    bloco: bloco2, cabeca:SONDA, porta: porta2, busca: busca2,
    medir: async pg => {
      try{ await pg.waitForFunction(()=>!!window.__pp, null, {timeout:4000}); }catch(e){ return {semSdk:true}; }
      await aprovar(pg);
      /* prazo CURTO de proposito: aqui a resposta certa e "nada aconteceu", e esperar 2,5s por
         uma navegacao que nao deve vir so faria a bateria demorar. */
      const foi = await esperarUrl(pg,'foi=upsell',1200);
      return {semSdk:false, foi, url:pg.url()};
    }
  });
  chk(aba.nome+': DESLIGADO -- o bloco carrega as variaveis',
    /var UPSELL_ATIVO=false;/.test(bloco2) && bloco2.indexOf(alvo2)>=0);
  chk(aba.nome+': DESLIGADO -- o pagamento aprovado NAO leva', rDes.foi===false, 'url='+rDes.url);
  chk(aba.nome+': DESLIGADO -- sem erro proprio do bloco', errosReais(rDes.erros).length===0, errosReais(rDes.erros).join(' | '));

  /* --- 4c. A PROVA QUE REPRESENTA O PEDIDO: trocar false por true NO CODIGO, sem regerar --- */
  const antes = (bloco2.match(/var UPSELL_ATIVO=\w+;/g)||[]).length;
  const editado = bloco2.replace('var UPSELL_ATIVO=false;','var UPSELL_ATIVO=true;');
  chk(aba.nome+': ha UMA declaracao de UPSELL_ATIVO para o dono editar', antes===1, 'achei '+antes);
  chk(aba.nome+': a edicao a mao mudou exatamente um byte-grupo',
    editado.length===bloco2.length-1 && editado!==bloco2);
  /* o endereco gravado no bloco continua sendo o da passagem 4b: o molde precisa daquela porta */
  const rEdit = await comBlocoNaPagina({
    bloco: editado, cabeca:SONDA, porta: porta2, busca: busca2,
    medir: async pg => {
      try{ await pg.waitForFunction(()=>!!window.__pp, null, {timeout:4000}); }catch(e){ return {semSdk:true}; }
      await aprovar(pg);
      const foi = await esperarUrl(pg,'foi=upsell');
      return {semSdk:false, foi, url:pg.url()};
    }
  });
  chk(aba.nome+': EDITADO A MAO (false -> true) -- passou a levar, SEM regerar', rEdit.foi===true, 'url='+rEdit.url);
}

/* ============================================================================
   PARTE 5 -- A ORDEM do gancho na Mini loja
   ============================================================================ */
console.log('\n== 5. Mini loja: a cesta e esvaziada ANTES de sair ==');
{
  const aba = ABAS[1];
  const porta = PORTA++;
  const alvo = alvoDe(porta);
  const gerado = await gerarNaFerramenta(pg => aba.cfg(pg,{url:alvo,ligado:true}), ['m-out'], {porta: FER++});
  const bloco = gerado.valores['m-out']||'';
  chk('Mini loja: no TEXTO, cestaLimpar() vem antes de upsellIr()',
    bloco.indexOf('cestaLimpar();upsellIr();')>=0 ||
    (bloco.indexOf('cestaLimpar();')>=0 && bloco.indexOf('cestaLimpar();')<bloco.lastIndexOf('upsellIr();')));

  const r = await comBlocoNaPagina({
    bloco, cabeca:SONDA, porta,
    medir: async pg => {
      await pg.waitForFunction(()=>!!window.__pp, null, {timeout:5000});
      /* poe um item na cesta pelo caminho do dedo: abre o cartao e clica em "adicionar" */
      await pg.locator('.fcm-card').first().click();
      await pg.locator('.fcm-add').first().click();
      const antes = await pg.evaluate(()=>{
        let v=null; try{ v=localStorage.getItem('fcmloja:LOJA1'); }catch(e){}
        return v;
      });
      await aprovar(pg);
      const foi = await esperarUrl(pg,'foi=upsell');
      /* MEDIDO NA PAGINA DE DESTINO: e la que o defeito apareceria. */
      const depois = await pg.evaluate(()=>{
        let v=null; try{ v=localStorage.getItem('fcmloja:LOJA1'); }catch(e){}
        return v;
      }).catch(()=>'(nao deu para ler)');
      return {antes, depois, foi, url:pg.url()};
    }
  });
  chk('Mini loja: a cesta tinha item antes de aprovar', !!r.antes && r.antes.indexOf('Album')>=0 || !!r.antes,
    String(r.antes).substring(0,120));
  chk('Mini loja: levou ao upsell', r.foi===true, 'url='+r.url);
  chk('Mini loja: NA PAGINA DE DESTINO a cesta esta vazia (esvaziou ANTES de sair)',
    r.depois===null || r.depois==='', 'sobrou: '+String(r.depois).substring(0,160));
  console.log('    -> cesta antes: '+String(r.antes).substring(0,90));
  console.log('    -> cesta depois da navegacao: '+String(r.depois));
}

/* ============================================================================
   PARTE 6 -- O CAMINHO C: o botao "Ja paguei"
   ============================================================================ */
console.log('\n== 6. O caminho C: o botao "Ja paguei" ==');
/* Duas larguras, e os dois cenarios (com e sem WhatsApp). A largura e trocada DENTRO do medir,
   antes de o clique acontecer; a emulacao de aparelho movel nao muda o resultado -- medido em
   scripts/verificar/upsell-janela.mjs, nos cinco cenarios de ordem entre window.open e a
   navegacao, com resultado identico em desktop e em celular. */
const LARGURAS = [['computador',1280,800],['celular',390,844]];
const C_ABAS = [
  {nome:'Checkout',  pref:'u', saida:'u-out',  cfg:abaCheckout, botao:'.fcu-zap',
   /* o "Ja paguei" so aparece depois de o Pix ser gerado -- .fcu-gerar e esse botao */
   preparar: async pg => { await pg.locator('.fcu-gerar').first().click(); }},
  {nome:'Mini loja', pref:'m', saida:'m-out',  cfg:abaLoja,     botao:'.fcm-zap',
   preparar: async pg => {
     await pg.locator('.fcm-card').first().click();
     await pg.locator('.fcm-add').first().click();
     await pg.locator('.fcm-gerar').first().click();
   }}
];

for(const ca of C_ABAS){
  for(const [rotL,w,h] of LARGURAS){
    const porta = PORTA++;
    const alvo = alvoDe(porta);
    const g = await gerarNaFerramenta(pg => ca.cfg(pg,{url:alvo,ligado:true}), [ca.saida], {porta: FER++});
    const bloco = g.valores[ca.saida]||'';
    const r = await comBlocoNaPagina({
      bloco, cabeca:SONDA+SONDA_OPEN, porta,
      medir: async pg => {
        await pg.setViewportSize({width:w,height:h});
        const abertas = [];
        pg.context().on('page', p => abertas.push(p));
        pg.on('popup', p => abertas.push(p));
        await ca.preparar(pg);
        const bt = pg.locator(ca.botao).first();
        const existe = await bt.count() > 0;
        if(!existe) return {existe:false};
        await pg.evaluate(()=>{try{localStorage.removeItem('__abriu');}catch(e){}});
        await bt.click().catch(()=>{});
        const foi = await esperarUrl(pg,'foi=upsell');
        await new Promise(x=>setTimeout(x,300));
        /* lido NO DESTINO: mesma origem, o registro atravessou a navegacao */
        let reg = [];
        try{ reg = await pg.evaluate(()=>{try{return JSON.parse(localStorage.getItem('__abriu')||'[]');}catch(e){return [];}}); }catch(e){}
        return {existe:true, foi, abas:abertas.length, url:pg.url(),
          pedidas: reg.map(x=>x.u), ref: reg.length ? reg[0].ref : null};
      }
    });
    const tag = ca.nome+' / '+rotL+' / COM WhatsApp: ';
    chk(tag+'o botao "Ja paguei" existe', r.existe===true);
    if(r.existe){
      chk(tag+'o bloco PEDIU a aba do WhatsApp (window.open com wa.me)',
        (r.pedidas||[]).length===1 && /^https:\/\/wa\.me\//.test(r.pedidas[0]), JSON.stringify(r.pedidas));
      chk(tag+'e o window.open devolveu janela (nenhum bloqueio de popup)', r.ref===true, 'ref='+r.ref);
      chk(tag+'e a pagina foi levada ao upsell DEPOIS disso', r.foi===true, 'url='+r.url);
      console.log('    -> '+tag+'window.open='+((r.pedidas||[])[0]||'(nenhum)').substring(0,40)
        +'  ref='+r.ref+'  eventos page/popup='+r.abas+'  navegou='+r.foi);
    }
  }
}
/* A /pagar e a Agendamento por pacote tem o caminho C de OUTRA FORMA: nelas o "Ja paguei" e
   uma ANCORA com target=_blank (e nao um window.open), entao o upsell entra num ouvinte de
   clique. A pergunta que so esta passagem responde e se a navegacao da pagina de tras CANCELA
   a acao padrao da ancora -- a aba nova. Medida pelo evento 'popup' do proprio Playwright, que
   e o que a ancora dispara.
   A PAC ENTROU EM 13/09/2026, e a medicao NAO foi herdada da /pagar: o mecanismo e o mesmo,
   mas o bloco e outro, o botao nasce dentro de uma area escondida (so aparece depois de
   "Gerar Pix") e o ouvinte e pendurado noutro lugar do gerador. Herdar a conclusao seria
   exatamente o tipo de suposicao que este arnes existe para recusar. */
const C_ANCORA = [
  {nome:'Link de cobranca', cfg:abaCobranca, saidas:['p-out1','p-out2'], saida:'p-out1',
   botao:'a.fcpg-bt2', busca:g => buscaDoLink(g.valores['p-out2']||''), abrir:null},
  {nome:'Agendamento por pacote', cfg:abaPacote, saidas:['a-out3'], saida:'a-out3',
   botao:'a.fca-ob-zap', busca:() => BUSCA.a,
   /* O botao so existe visivel depois do Pix gerado -- e o '>' separa o "Gerar Pix" (filho
      direto do bloco) do "Copiar", que carrega a mesma classe dentro da area. */
   abrir: async pg => { await pg.locator('.fca-ob-bloco:has(.fca-ob-pixarea) > button.fca-ob-bt').first().click(); }}
];
for(const ca of C_ANCORA)
for(const [rotL,w,h] of LARGURAS){
  const porta = PORTA++;
  const alvo = alvoDe(porta);
  const g = await gerarNaFerramenta(pg => ca.cfg(pg,{url:alvo,ligado:true}),
    ca.saidas, {porta: FER++});
  const bloco = g.valores[ca.saida]||'';
  const busca = ca.busca(g);
  const r = await comBlocoNaPagina({
    bloco, cabeca:SONDA, porta, busca,
    medir: async pg => {
      await pg.setViewportSize({width:w,height:h});
      const pops = [];
      pg.on('popup', p => pops.push(p));
      if(ca.abrir) await ca.abrir(pg);
      const bt = pg.locator(ca.botao).first();
      const existe = await bt.count() > 0;
      if(!existe) return {existe:false};
      const destino = await bt.getAttribute('href');
      /* O DESTINO DA ANCORA E TROCADO PARA UMA ROTA DO PROPRIO MOLDE, e a razao esta medida:
         com o destino barrado pela guarda de rede, a aba nova nao chega a emitir evento algum
         do Playwright -- entao "popups=0" nao distinguiria "a navegacao cancelou a acao padrao"
         de "a aba abriu e o destino nao carregou". O que esta sob teste e o MECANISMO (ancora
         com target=_blank + um ouvinte de clique que navega a pagina de tras), e ele nao muda
         com o endereco. O href de verdade ja foi conferido na linha acima. */
      await bt.evaluate((el,u)=>{el.setAttribute('href',u);}, 'http://127.0.0.1:'+porta+'/pagina?foi=whats');
      await bt.click().catch(()=>{});
      const foi = await esperarUrl(pg,'foi=upsell');
      await new Promise(x=>setTimeout(x,500));
      let popUrl = '';
      if(pops.length){ try{ popUrl = pops[0].url(); }catch(e){ popUrl='(fechou)'; } }
      return {existe:true, foi, pops:pops.length, destino, popUrl, url:pg.url()};
    }
  });
  const tag = ca.nome+' / '+rotL+' / COM WhatsApp: ';
  chk(tag+'o "Ja paguei" existe e e uma ancora para o WhatsApp',
    r.existe===true && /^https:\/\/wa\.me\//.test(r.destino||''), 'href='+r.destino);
  chk(tag+'a ancora abriu a aba nova (a navegacao NAO cancelou a acao padrao)',
    r.pops>=1 && String(r.popUrl).indexOf('foi=whats')>=0, 'popups='+r.pops+' url da aba='+r.popUrl);
  chk(tag+'e a pagina foi levada ao upsell', r.foi===true, 'url='+r.url);
  console.log('    -> '+tag+'popups='+r.pops+' ('+r.popUrl+')  navegou='+r.foi);
}

/* ===========================================================================
   OS QUATRO ESTADOS DO UPSELL, MEDIDOS PELO CLIQUE NO "JA PAGUEI" DA aba pac
   ===========================================================================
   A parte 4 ja mede os quatro estados nas quatro abas, mas SEMPRE pelo caminho do CARTAO
   aprovado. Nesta aba o "Ja paguei" nasceu em 13/09/2026 e pendura o proprio ouvinte, num
   lugar diferente do gerador -- entao "o cartao leva" nao responde por ele. Aqui os mesmos
   quatro estados sao medidos pelo CLIQUE no botao, inclusive o que representa o pedido do
   dono: gerar DESLIGADO e trocar false por true no codigo publicado, sem voltar a ferramenta.
   O estado "vazio + LIGADO" nao entra: ele nao produz bloco nenhum (a ferramenta recusa), e a
   frase da recusa ja e medida na parte 2. */
console.log('\n== 6b. Agendamento por pacote: os quatro estados, pelo clique no "Ja paguei" ==');
{
  const abrirPix = async pg => {
    await pg.locator('.fca-ob-bloco:has(.fca-ob-pixarea) > button.fca-ob-bt').first().click();
  };
  const ESTADOS_C = [
    {rot:'vazio + desligado',      url:'',    ligado:false, editar:false, leva:false},
    {rot:'preenchido + ligado',    url:'ALVO',ligado:true,  editar:false, leva:true},
    {rot:'preenchido + DESLIGADO', url:'ALVO',ligado:false, editar:false, leva:false},
    {rot:'DESLIGADO, editado a mao para true', url:'ALVO', ligado:false, editar:true, leva:true}
  ];
  for(const e of ESTADOS_C){
    const porta = PORTA++;
    const alvo = alvoDe(porta);
    const g = await gerarNaFerramenta(pg => abaPacote(pg,{url:(e.url?alvo:''), ligado:e.ligado}),
      ['a-out3'], {porta: FER++});
    let bloco = g.valores['a-out3']||'';
    const tag = 'pac / '+e.rot+': ';
    if(e.editar){
      const antes = bloco;
      bloco = bloco.replace('var UPSELL_ATIVO=false;','var UPSELL_ATIVO=true;');
      chk(tag+'a edicao a mao mudou exatamente um byte-grupo',
        bloco!==antes && bloco.length===antes.length-1);
    }
    const r = await comBlocoNaPagina({
      bloco, cabeca:SONDA, porta, busca: BUSCA.a,
      medir: async pg => {
        await abrirPix(pg);
        const bt = pg.locator('a.fca-ob-zap').first();
        if(await bt.count() === 0) return {existe:false};
        const href = await bt.getAttribute('href');
        /* Mesmo motivo da troca no laco acima: com o destino real barrado pela guarda de rede
           a aba nova nao emite evento, e "nao navegou" se confundiria com "a rede barrou". */
        await bt.evaluate((el,u)=>{el.setAttribute('href',u);}, 'http://127.0.0.1:'+porta+'/pagina?foi=whats');
        await bt.click().catch(()=>{});
        /* prazo curto quando a resposta certa e "nada acontece" -- esperar 2,5s por uma
           navegacao que nao deve vir so faria a bateria demorar. */
        const foi = await esperarUrl(pg,'foi=upsell', e.leva ? 2500 : 1200);
        return {existe:true, href, foi, url:pg.url()};
      }
    });
    chk(tag+'o "Ja paguei" existe depois de gerar o Pix', r.existe===true);
    chk(tag+'e aponta para o WhatsApp', /^https:\/\/wa\.me\//.test(r.href||''), 'href='+String(r.href).slice(0,50));
    chk(tag+(e.leva?'o clique LEVA ao upsell':'o clique NAO leva a lugar nenhum'),
      r.foi===e.leva, 'url='+r.url);
    chk(tag+'sem erro proprio do bloco', errosReais(r.erros||[]).length===0,
      errosReais(r.erros||[]).join(' | '));
  }
}

/* SEM WhatsApp configurado: nao existe botao "Ja paguei", e portanto nao existe caminho C.
   Isto e medicao, e nao um caso que se possa deduzir: o botao e emitido sob condicao. */
for(const ca of C_ABAS){
  const porta = PORTA++;
  const alvo = alvoDe(porta);
  const g = await gerarNaFerramenta(async pg => {
    await ca.cfg(pg,{url:alvo,ligado:true});
    await radio(pg, ca.pref+'-zap','nao');
    await clicar(pg, ca.pref+'-gerar');
  }, [ca.saida], {porta: FER++});
  const bloco = g.valores[ca.saida]||'';
  chk(ca.nome+' / SEM WhatsApp: o bloco nao tem botao "Ja paguei"',
    bloco.indexOf(ca.botao.substring(1))<0, 'achou a classe '+ca.botao);
  chk(ca.nome+' / SEM WhatsApp: o upsell continua emitido (o caminho do cartao permanece)',
    /var UPSELL_ATIVO=true;/.test(bloco) && /upsellIr\(\);/.test(bloco));
}
/* ATE 13/09/2026 ESTE BLOCO DIZIA O CONTRARIO: "a aba Agendamento por pacote NAO TEM Ja
   paguei, o caminho C nao se aplica a ela". Era verdade, e era uma FALTA -- a aba mostrava o
   Pix ao cliente e nao tinha como ele avisar que pagou. Com o botao existindo, o que se cobra
   e o oposto: DOIS caminhos de upsell, o do cartao aprovado e o do "Ja paguei".
   E O ESTADO SEM WHATSAPP e medido do jeito que ele existe de verdade nesta aba: a ferramenta
   RECUSA gerar sem WhatsApp (aRecusa), entao ele so aparece editando o bloco publicado a mao --
   o mesmo caminho ja medido para UPSELL_ATIVO na parte 4c. */
{
  const g = await gerarNaFerramenta(pg => abaPacote(pg,{url:URL_TESTE,ligado:true}), ['a-out3'], {porta: FER++});
  const t = g.valores['a-out3']||'';
  chk('Agendamento por pacote: o botao "Ja paguei" esta no bloco',
    t.indexOf('fca-ob-zap')>=0 && t.indexOf('function zapMsgPago()')>=0);
  chk('Agendamento por pacote: o upsell entra pelos DOIS caminhos (cartao e "Ja paguei")',
    (t.match(/upsellIr\(\);/g)||[]).length===2, 'chamadas='+(t.match(/upsellIr\(\);/g)||[]).length);
  chk('Agendamento por pacote: o do "Ja paguei" e um ouvinte de clique na ancora',
    t.indexOf('zapPg.addEventListener("click",function(){upsellIr();});')>=0);
  /* SEM WHATSAPP, botaoZap devolve null: nao ha botao, e portanto nao ha caminho C aqui --
     exatamente como nas irmas com o "Ja paguei" desligado. Medido com o bloco RODANDO,
     porque "o texto continua la" e "o botao nao aparece" sao coisas diferentes. */
  const semZap = t.replace(/var WHATSAPP='[^']*';/, "var WHATSAPP='';");
  chk('Agendamento por pacote / SEM WhatsApp: a troca a mao pegou',
    semZap!==t && semZap.indexOf("var WHATSAPP='';")>=0);
  const rs = await comBlocoNaPagina({
    bloco: semZap, cabeca:SONDA, porta: PORTA++, busca: BUSCA.a,
    medir: async pg => {
      await pg.locator('.fca-ob-bloco:has(.fca-ob-pixarea) > button.fca-ob-bt').first().click();
      await new Promise(x=>setTimeout(x,200));
      return {zaps: await pg.locator('.fca-ob-zap').count(),
              ancoras: await pg.locator('.fca-ob-pixarea a').count(),
              area: await pg.locator('.fca-ob-pixarea.on').count()};
    }
  });
  chk('Agendamento por pacote / SEM WhatsApp: nenhum botao "Ja paguei" na pagina',
    rs.zaps===0 && rs.ancoras===0, 'zaps='+rs.zaps+' ancoras='+rs.ancoras);
  chk('Agendamento por pacote / SEM WhatsApp: a area do Pix abre do mesmo jeito',
    rs.area===1, 'areas abertas='+rs.area);
  chk('Agendamento por pacote / SEM WhatsApp: o upsell do CARTAO continua emitido',
    /var UPSELL_ATIVO=true;/.test(semZap) && (semZap.match(/upsellIr\(\);/g)||[]).length===2);
}

/* ============================================================================
   PARTE 7 -- O LINK de cobranca nao muda um byte
   ============================================================================ */
console.log('\n== 7. O link de cobranca: o upsell DA PAGINA nao muda um byte dele ==');
{
  const semU = saidas['p']['vazio + desligado'];
  const comU = saidas['p']['preenchido + ligado'];
  const desU = saidas['p']['preenchido + DESLIGADO'];
  chk('o link saiu (nao esta vazio)', semU.link.length>50, 'bytes='+semU.link.length);
  chk('LINK identico com o upsell LIGADO', semU.link===comU.link,
    'sem='+semU.link.length+'B  com='+comU.link.length+'B');
  chk('LINK identico com o upsell DESLIGADO', semU.link===desU.link);
  /* O outro lado da medida: o CODIGO 1 muda. Sem esta linha, "o link nao mudou" nao distingue
     "o upsell nao viaja no link" de "o upsell nao foi configurado". */
  chk('e o CODIGO 1 MUDA (a medida acima nao e vacuidade)', semU.texto!==comU.texto,
    'cod1 sem='+semU.texto.length+'B  com='+comU.texto.length+'B');
  console.log('    -> link: '+semU.link.length+' bytes nos tres estados');
  console.log('    -> codigo 1: '+semU.texto.length+' -> '+comU.texto.length+' bytes');
}

/* ============================================================================
   PARTE 8 -- O endereco INVALIDO escrito a mao no codigo publicado
   ============================================================================
   MEDICAO, NAO ASSERCAO. O bloco nao reconfere o endereco de proposito (ver fcUpsellFnSrc): a
   conferencia acontece na hora de gerar, e um bloco que recusasse o proprio UPSELL_URL depois
   de editado a mao deixaria o dono sem entender por que nada acontece. O que se quer saber e
   se ele QUEBRA FEIO -- e, no caso do endereco apagado, se a guarda de vazio segura. */
console.log('\n== 8. Endereco invalido editado A MAO no codigo publicado (medicao) ==');
{
  const porta = PORTA++;
  const alvo = alvoDe(porta);
  const g = await gerarNaFerramenta(pg => abaCheckout(pg,{url:alvo,ligado:true}), ['u-out'], {porta: FER++});
  const base = g.valores['u-out']||'';
  const CASOS = [
    ['UPSELL_URL apagado a mao', base.replace(/var UPSELL_URL='[^']*';/, "var UPSELL_URL='';")],
    ['UPSELL_URL trocado por javascript:', base.replace(/var UPSELL_URL='[^']*';/, "var UPSELL_URL='javascript:window.__jsUri=1;';")],
    ['UPSELL_URL trocado por um caminho sem barra', base.replace(/var UPSELL_URL='[^']*';/, "var UPSELL_URL='oferta-especial';")]
  ];
  for(const [rot,b] of CASOS){
    const r = await comBlocoNaPagina({
      bloco:b, cabeca:SONDA, porta,
      medir: async pg => {
        await pg.waitForFunction(()=>!!window.__pp, null, {timeout:5000});
        const url0 = pg.url();
        await aprovar(pg);
        await new Promise(x=>setTimeout(x,600));
        let url1='(perdeu o contexto)', jsUri=null, desenhou=null;
        try{ url1 = pg.url(); }catch(e){}
        try{ jsUri = await pg.evaluate(()=>window.__jsUri||null); }catch(e){}
        try{ desenhou = await pg.$('#fcuni') ? 'sim' : 'nao'; }catch(e){ desenhou='(nao deu para ler)'; }
        return {url0,url1,jsUri,desenhou};
      }
    });
    console.log('    -> '+rot);
    console.log('       endereco depois: '+r.url1);
    console.log('       o bloco continua na tela: '+r.desenhou);
    console.log('       javascript: executou? '+(r.jsUri?'SIM':'nao'));
    console.log('       erros proprios: '+(errosReais(r.erros).join(' | ')||'nenhum'));
    if(rot.indexOf('apagado')>=0){
      chk('endereco APAGADO a mao: a guarda de vazio segura -- a pagina nao recarrega',
        r.url1===r.url0, r.url0+' -> '+r.url1);
      chk('endereco APAGADO a mao: o bloco continua na tela', r.desenhou==='sim');
    }
  }
}

/* ============================================================================
   PARTE 9 -- O QUE FICA GRAVADO: recarga, estado ANTIGO e preset de aba
   ============================================================================
   Os dois campos entram no que a ferramenta grava, e isso e mudanca de FORMATO do estado --
   a classe que atinge backups que o dono ja tem em arquivo. O acrescimo e aditivo (estado
   gravado por versao anterior simplesmente nao tem as chaves), mas "e aditivo" e uma
   afirmacao sobre o codigo de restauracao, e ela se mede: apagar as duas chaves do
   armazenamento e exatamente o que um backup anterior a esta rodada tem. */
console.log('\n== 9. O que fica gravado: recarga, estado antigo e preset ==');
/* 'lerLigado' e nao um leitor de radios: a Calculadora de album desenha este interruptor como
   caixa de marcar, e um leitor so de radios devolvia "(nenhum marcado)" para ela em toda
   leitura -- tres vermelhos que nao eram defeito da ferramenta, e sim da prova. */
const leRadio = (pg,nome) => lerLigado(pg,nome);
const leCampo = (pg,id) => pg.evaluate(i=>{const e=document.getElementById(i);return e?e.value:null;}, id);

for(const aba of ABAS){
  const res = {};
  await gerarNaFerramenta(async pg => {
    /* 9a. RECARGA: o que foi digitado volta */
    await aba.cfg(pg,{url:URL_TESTE,ligado:true});
    await pg.reload();
    res.urlDepois = await leCampo(pg, aba.pref+'-upsell');
    res.onDepois  = await leRadio(pg, aba.pref+'-upsellon');

    /* 9b. ESTADO ANTIGO: as duas chaves apagadas do armazenamento, como num backup anterior */
    await pg.evaluate(p=>{
      let st={}; try{ st=JSON.parse(localStorage.getItem('fcConstrutores')||'{}'); }catch(e){}
      const alvo = (p==='p') ? st.p : (st[p]||{});
      if(alvo){ delete alvo.upsell; delete alvo.upsellon; }
      try{ localStorage.setItem('fcConstrutores',JSON.stringify(st)); }catch(e){}
    }, aba.pref);
    await pg.reload();
    await pg.evaluate(()=>{ window.__alertas=[]; window.alert=m=>{window.__alertas.push(String(m));}; window.confirm=()=>true; window.open=()=>null; });
    res.urlAntigo = await leCampo(pg, aba.pref+'-upsell');
    res.onAntigo  = await leRadio(pg, aba.pref+'-upsellon');
    res.errosAntigo = pg.erros.slice();

    /* 9c. PRESET DE ABA: salvar com um endereco, trocar na tela, aplicar o preset */
    await set(pg, aba.pref+'-upsell', 'https://www.fotocerta.com.br/oferta-A');
    await ligar(pg, aba.pref+'-upsellon', true);
    await set(pg, 'fcp-'+aba.pref+'-nome', 'upsell A');
    await clicar(pg, 'fcp-'+aba.pref+'-salvar');
    await set(pg, aba.pref+'-upsell', 'https://www.fotocerta.com.br/oferta-B');
    await ligar(pg, aba.pref+'-upsellon', false);
    await pg.evaluate(p=>{
      const bs=document.querySelectorAll('#fcp-'+p+'-lista [data-fc-aplicar]');
      if(!bs.length) throw new Error('sem preset na biblioteca de '+p);
      bs[0].click();
    }, aba.pref);
    res.urlPreset = await leCampo(pg, aba.pref+'-upsell');
    res.onPreset  = await leRadio(pg, aba.pref+'-upsellon');
  }, [], {porta: FER++});

  chk(aba.nome+': a RECARGA devolve o endereco', res.urlDepois===URL_TESTE, 'voltou: '+res.urlDepois);
  chk(aba.nome+': a RECARGA devolve o interruptor', res.onDepois==='sim', 'voltou: '+res.onDepois);
  chk(aba.nome+': estado ANTIGO (sem as chaves) abre com o campo VAZIO', res.urlAntigo==='', 'veio: '+JSON.stringify(res.urlAntigo));
  chk(aba.nome+': estado ANTIGO abre com o interruptor DESLIGADO (e nao em branco)',
    res.onAntigo==='nao', 'veio: '+res.onAntigo);
  chk(aba.nome+': estado ANTIGO nao acende erro de console', (res.errosAntigo||[]).length===0, (res.errosAntigo||[]).join(' | '));
  chk(aba.nome+': o PRESET da aba carrega o endereco',
    res.urlPreset==='https://www.fotocerta.com.br/oferta-A', 'veio: '+res.urlPreset);
  chk(aba.nome+': o PRESET da aba carrega o interruptor', res.onPreset==='sim', 'veio: '+res.onPreset);
}

process.exit(resumo());
