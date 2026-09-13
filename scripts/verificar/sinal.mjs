/* ============================================================================
   A COBRANCA DE SINAL, COM OS BLOCOS RODANDO -- Checkout e Mini loja
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. Ate 13/09/2026 o caminho do sinal tinha ZERO
   verificacao em todo o arnes. Medido: um grep por
   'u-sinal|m-sinal|sinalAgora|saldoDepois|sinalRecusa|SINAL_TIPO|SINAL_VALOR'
   em scripts/ devolvia duas ocorrencias, as duas em COMENTARIO (cenario.mjs,
   declarando o buraco). O padrao de fabrica de 'u-sinal'/'m-sinal' e 'nao', e
   nada no arnes o ligava -- entao, na regressao byte a byte, as ~40 linhas
   condicionais de FC_CARRINHO_SRC.sinal, fcTotalPixSrc, fcPpBotoesSrc, uBloco e
   mBloco* que so existem com sinal saiam ZERO vezes. Quem mexesse na conta do
   sinal mexia sem rede: a regressao diria "OK" mesmo se sinalAgora() mudasse de
   resultado.

   Esta suite fecha esse buraco pelo lado do COMPORTAMENTO (o bloco executando
   numa pagina, pelo molde de pagina.mjs). O outro lado -- a rede byte a byte --
   foi fechado ligando o sinal da Mini loja na passagem CONFIGURADA de
   cenario.mjs; o porque da escolha esta escrito la.

   ---------------------------------------------------------------------------
   O QUE ELE PROVA
   ---------------------------------------------------------------------------
     1. A CONTA, nos dois tipos (percentual e valor fixo), sobre o total JA COM
        CUPOM -- a ordem declarada e: quantidade multiplica, cupom incide sobre
        o total, o sinal sai do total ja com cupom.
     2. O NUMERO QUE O CLIENTE LE E O NUMERO QUE AS DUAS PONTAS COBRAM: o campo
        54 do payload Pix (relido por um leitor TLV INDEPENDENTE, escrito aqui
        dentro) e o amount.value do createOrder (lido do proprio bloco pela
        sonda do SDK) tem de bater, centavo por centavo, com a linha do sinal na
        tela.
     3. O ARREDONDAMENTO, nos casos da familia que ja mordeu este projeto.
     4. AS TRES RECUSAS de sinalRecusa() e os QUATRO consumidores que leem dela
        -- a linha vermelha do carrinho, o clique do PayPal, o botao do Pix e o
        resumo copiavel --, recusando JUNTOS. O resumo era o unico que nao
        respeitava a recusa e foi corrigido uma vez; esta prova e o que impede a
        volta.
     5. O DESCONTO DO PIX ZERADO: com sinal ligado nao existe caminho em que o
        desconto do Pix e o sinal convivam.
     6. AS TRES LINHAS NA TELA (total, sinal, saldo) e AS TRES DO WHATSAPP, com
        a URL capturada do proprio window.open do bloco.

   ---------------------------------------------------------------------------
   O LEITOR TLV E ESCRITO AQUI DENTRO, DE PROPOSITO
   ---------------------------------------------------------------------------
   Regra da casa: nunca conferir o projeto com uma funcao do projeto. Reusar o
   lerTlv de fc-compartilhado.js para ler o payload que o proprio bloco montou
   provaria apenas que a funcao e inversa dela mesma -- um payload com campo 54
   errado passaria pelas duas pontas do mesmo engano. O leitor abaixo foi
   escrito a partir da especificacao (id de 2, tamanho de 2, valor), e o CRC16
   tambem e recalculado aqui, do polinomio, sem olhar o codigo do bloco.

   ---------------------------------------------------------------------------
   O CRITERIO DE ESCOLHA DOS CASOS DE ARREDONDAMENTO (nao e sorteio)
   ---------------------------------------------------------------------------
   O defeito historico deste projeto (ago/2026) foi meio centavo: o total saia
   com a terceira casa intacta e cada consumidor arredondava do seu jeito --
   toFixed(2) num lado, Math.round no outro --, e nos numeros terminados em meio
   centavo os dois discordam. Varredura da epoca: 60.097 divergencias em
   2.002.000 combinacoes. A correcao foi arredondar na ORIGEM, uma vez, e e
   exatamente essa arquitetura que esta suite tem de vigiar no sinal, porque
   sinalAgora() faz o mesmo: UM Math.round, e tres leitores (tela, Pix, PayPal)
   formatando o resultado com toFixed(2).

   Entao os casos NAO sao aleatorios: sao os que caem na familia em que
   Math.round e toFixed DISCORDARIAM sobre o sinal cru. Varredura feita para
   escolher este catalogo (subtotais de R$ 10,00 a R$ 1.000,00, cupom 0% e 10%,
   sinal de 1% a 99% de meio em meio): 39.006.394 combinacoes, 767.882 com o
   sinal cru caindo em meio centavo exato e 313.708 (0,80%) em que Math.round e
   toFixed devolvem centavos diferentes -- SEMPRE com o Math.round por cima,
   nenhum caso na direcao oposta. O catalogo e o percentual abaixo foram
   escolhidos por maximizarem quantos subconjuntos do carrinho caem nessa
   familia: 8 dos 15 possiveis.

   Se um dia alguem tirar o Math.round de sinalAgora(), ou arredondar de novo
   num consumidor, e aqui que aparece.

   Roda com:  node scripts/verificar/sinal.mjs
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, radio, clicar, navegador, servir, abrir, alertas } from './lib.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* ===========================================================================
   O CATALOGO E O CUPOM -- escolhidos pela varredura descrita no cabecalho
   =========================================================================== */
const CAT = [
  {nome:'Ensaio A', preco:'113.70', v:113.70},
  {nome:'Ensaio B', preco:'29.60',  v:29.60},
  {nome:'Ensaio C', preco:'425.55', v:425.55},
  {nome:'Ensaio D', preco:'341.45', v:341.45},
  /* O quinto so existe para o ramo "o sinal arredonda para zero": com percentual de 1%,
     um total de R$ 0,49 da 0,0049, que arredonda para zero e ainda esta acima do piso de
     R$ 0,01 do pedido -- que e a unica janela em que essa recusa e alcancavel. */
  {nome:'Ensaio E', preco:'0.49',   v:0.49}
];
const CUPOM = {cod:'DEZ', pct:10};

/* A CONTA, TRANSCRITA DE NOVO AQUI. Nao e reuso: e a segunda opiniao. Se o bloco e o teste
   dissessem a mesma coisa por lerem o mesmo codigo, o teste nao teria opiniao nenhuma. */
const r2 = x => Math.round(x*100)/100;
function esperado(itens, comCupom, tipo, valor){
  const sub   = r2(itens.reduce((s,i)=>s+CAT[i].v,0));
  const desc  = comCupom ? r2(sub*CUPOM.pct/100) : 0;
  const total = r2(sub-desc);
  const sinal = (tipo==='fixo') ? r2(valor) : r2(total*valor/100);
  const saldo = Math.max(0, r2(total-sinal));
  return {sub,total,sinal,saldo};
}

/* ===========================================================================
   OS TEXTOS, todos distintos -- cada assercao aponta para UM campo da aba
   =========================================================================== */
const TXT = {
  t8:'SINALTELA', t9:'SALDOTELA',
  zapTotal:'ZAPTOTAL: {valor}',
  zapSinal:'ZAPSINAL: *{valor}*',
  zapSaldo:'ZAPSALDO: *{valor}*',
  maior:'MAIOR o sinal passou do total',
  zero:'ZERO o sinal arredonda para zero',
  recusado:'recusado'
};

/* ===========================================================================
   AS TRES CONFIGURACOES. Cada uma e UMA passagem pela ferramenta e sai com os
   DOIS blocos (Checkout e Mini loja) -- a conta e a mesma fonte nos dois
   (FC_CARRINHO_SRC.sinal), e gerar os dois juntos custa uma passagem so.
   =========================================================================== */
const CONFIGS = [
  {id:'pct50',  tipo:'pct',  valor:50,  porta:8901},
  {id:'fixo100',tipo:'fixo', valor:100, porta:8902},
  /* 1% e o piso do campo, e e o unico percentual que alcanca a recusa "arredonda para zero"
     com um total acima do piso do pedido. */
  {id:'pct1',   tipo:'pct',  valor:1,   porta:8903}
];

/* ===========================================================================
   A SONDA DO SDK DO PAYPAL e os ganchos de alert/window.open.
   No <head>, antes do bloco: os blocos penduram o script do SDK ja no
   carregamento, e instalar isto depois chegaria tarde.
   =========================================================================== */
const CABECA = '<scr'+'ipt>(function(){\n'
  + 'var ins=document.head.appendChild;\n'
  + 'document.head.appendChild=function(n){\n'
  + '  if(n&&n.tagName==="SCRIPT"&&/paypal\\.com/.test(String(n.src||""))){\n'
  + '    window.paypal={Buttons:function(bt){window.__pp=bt;return {render:function(){}};}};\n'
  + '    setTimeout(function(){if(n.onload)n.onload();},0);\n'
  + '    return n;\n'
  + '  }\n'
  + '  return ins.call(document.head,n);\n'
  + '};\n'
  + 'window.__alertas=[];\n'
  + 'window.alert=function(m){window.__alertas.push(String(m));};\n'
  + 'window.__aberto=[];\n'
  + 'window.open=function(u){window.__aberto.push(String(u));return null;};\n'
  + '})();</scr'+'ipt>';

const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|alboom\.ninja|storage\.|ERR_FAILED|Failed to load resource|net::ERR/i;
const errosReais = e => e.filter(x => !EXTERNO.test(x));

/* ===========================================================================
   O LEITOR TLV INDEPENDENTE (ver o cabecalho: NAO e o do projeto)
   =========================================================================== */
function tlvRaiz(s){
  const fora = [];
  let i = 0;
  while(i < s.length){
    if(i+4 > s.length) return null;                     /* nao ha nem id nem tamanho */
    const id = s.slice(i, i+2), tam = s.slice(i+2, i+4);
    if(!/^[0-9]{2}$/.test(tam)) return null;
    const n = parseInt(tam, 10);
    const v = s.slice(i+4, i+4+n);
    if(v.length !== n) return null;                      /* valor mais curto que o declarado */
    fora.push([id, v]);
    i += 4 + n;
  }
  return (i === s.length) ? fora : null;                 /* tem de FECHAR exatamente no fim */
}
/* CRC-16/CCITT-FALSE escrito do polinomio, sem olhar o do bloco. */
function crc(s){
  let c = 0xFFFF;
  for(let i=0;i<s.length;i++){
    c ^= s.charCodeAt(i) << 8;
    for(let j=0;j<8;j++) c = (c & 0x8000) ? (((c<<1) ^ 0x1021) & 0xFFFF) : ((c<<1) & 0xFFFF);
  }
  return c.toString(16).toUpperCase().padStart(4,'0');
}
/* Devolve {valor, crcOk} ou {erro}. */
function lerPayload(p){
  if(typeof p !== 'string' || p.length < 20) return {erro:'curto'};
  if(p.slice(-8, -4) !== '6304') return {erro:'sem o campo 63'};
  const corpo = p.slice(0, -4);
  const crcOk = crc(corpo) === p.slice(-4).toUpperCase();
  const itens = tlvRaiz(corpo.slice(0, -4));
  if(!itens) return {erro:'estrutura TLV nao fecha'};
  const c54 = itens.filter(x => x[0]==='54');
  if(c54.length !== 1) return {erro:'campo 54 aparece '+c54.length+' vez(es)'};
  if(!/^[0-9]+\.[0-9]{2}$/.test(c54[0][1])) return {erro:'campo 54 fora do formato: '+c54[0][1]};
  return {valor: c54[0][1], crcOk};
}

/* "R$ 1.234,56" -> 1234.56 */
function moeda(t){
  if(t == null) return null;
  const m = String(t).match(/-?[0-9][0-9.]*,[0-9]{2}/);
  if(!m) return null;
  return parseFloat(m[0].replace(/\./g,'').replace(',','.'));
}

/* ===========================================================================
   A PASSAGEM PELA FERRAMENTA
   =========================================================================== */
const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};

async function gerar(cfg){
  console.log('\ngerando os dois blocos com sinal '+cfg.tipo+' = '+cfg.valor+' ...');
  const r = await gerarNaFerramenta(async pg => {
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);

    /* ---------- Checkout ---------- */
    await clicar(pg,'aba-uni');
    for(const p of CAT){
      await set(pg,'u-pnome',p.nome); await set(pg,'u-ppreco',p.preco);
      await clicar(pg,'u-prod-salvar');
    }
    /* multiplo: e o unico modo em que o cliente escolhe um SUBCONJUNTO, que e como esta
       suite alcanca cada total da varredura com um clique. */
    await radio(pg,'u-selprod','multiplo');
    await radio(pg,'u-resumo','sim');          /* o resumo copiavel e um dos quatro consumidores */
    await set(pg,'u-cp-cod',CUPOM.cod);
    await radio(pg,'u-cp-tipo','pct_total');
    await set(pg,'u-cp-valor',String(CUPOM.pct));
    await clicar(pg,'u-cp-add');
    await radio(pg,'u-sinal','sim');
    await radio(pg,'u-sinaltipo',cfg.tipo);
    await set(pg, cfg.tipo==='fixo'?'u-sinalfixo':'u-sinalpct', String(cfg.valor));
    await set(pg,'u-t8',TXT.t8); await set(pg,'u-t9',TXT.t9);
    await set(pg,'u-txt-zap-total',TXT.zapTotal);
    await set(pg,'u-txt-zap-sinal',TXT.zapSinal);
    await set(pg,'u-txt-zap-saldo',TXT.zapSaldo);
    await set(pg,'u-txt-sinal-maior',TXT.maior);
    await set(pg,'u-txt-sinal-zero',TXT.zero);
    await set(pg,'u-txt-sinal-recusado',TXT.recusado);
    await clicar(pg,'u-gerar');

    /* ---------- Mini loja ---------- */
    await clicar(pg,'aba-loja');
    for(const p of CAT){
      await set(pg,'m-pnome',p.nome); await set(pg,'m-ppreco',p.preco);
      await set(pg,'m-pcat','Ensaios');
      await set(pg,'m-pimg','https://storage.alboom.ninja/'+p.nome.replace(/\s/g,'')+'.jpg');
      await clicar(pg,'m-prod-salvar');
    }
    await set(pg,'m-cp-cod',CUPOM.cod);
    await radio(pg,'m-cp-tipo','pct_total');
    await set(pg,'m-cp-valor',String(CUPOM.pct));
    await clicar(pg,'m-cp-add');
    await radio(pg,'m-sinal','sim');
    await radio(pg,'m-sinaltipo',cfg.tipo);
    await set(pg, cfg.tipo==='fixo'?'m-sinalfixo':'m-sinalpct', String(cfg.valor));
    await set(pg,'m-t8',TXT.t8); await set(pg,'m-t9',TXT.t9);
    await set(pg,'m-txt-zap-total',TXT.zapTotal);
    await set(pg,'m-txt-zap-sinal',TXT.zapSinal);
    await set(pg,'m-txt-zap-saldo',TXT.zapSaldo);
    await set(pg,'m-txt-sinal-maior',TXT.maior);
    await set(pg,'m-txt-sinal-zero',TXT.zero);
    await set(pg,'m-txt-sinal-recusado',TXT.recusado);
    await clicar(pg,'m-gerar');
  }, ['u-out','m-out'], {porta: cfg.porta});

  chk('['+cfg.id+'] a ferramenta gerou sem alerta', r.alertas.length===0, JSON.stringify(r.alertas));
  chk('['+cfg.id+'] a ferramenta gerou sem erro de console', r.erros.length===0, r.erros.slice(0,2).join(' | '));
  chk('['+cfg.id+'] u-out saiu com o motor de sinal dentro', (r.valores['u-out']||'').indexOf('function sinalAgora()')>=0);
  chk('['+cfg.id+'] m-out saiu com o motor de sinal dentro', (r.valores['m-out']||'').indexOf('function sinalAgora()')>=0);
  return r.valores;
}

/* ===========================================================================
   O QUE SE MEDE DENTRO DA PAGINA -- uma leitura completa do estado do carrinho
   Tudo mora dentro do evaluate: passar codigo como string e dar eval no
   navegador ja custou caro neste projeto, e aqui nada exige isso.
   =========================================================================== */
const lerTudo = pref => pg => pg.evaluate(pref => {
  const q = s => document.querySelector('.'+pref+'-'+s);
  const txt = s => { const e=q(s); return e ? e.textContent.trim() : null; };
  function ppClique(){
    if(!window.__pp || !window.__pp.onClick) return null;
    try{ return window.__pp.onClick(null,{reject:()=>'REJEITADO', resolve:()=>'SEGUIU'}); }
    catch(e){ return 'ERRO: '+(e && e.message || e); }
  }
  function ppValor(){
    if(!window.__pp || !window.__pp.createOrder) return null;
    try{
      const o = window.__pp.createOrder(null,{order:{create:x=>x}});
      return o.purchase_units[0].amount.value;
    }catch(e){ return 'ERRO: '+(e && e.message || e); }
  }
  const cola = q('cola'), res = q('resumo');
  /* O CLIQUE DO PAYPAL PRIMEIRO, e so entao a mensagem que ele escreve: num literal de
     objeto as propriedades sao avaliadas na ordem escrita, e ler 'msg' antes de chamar
     onClick mediria a mensagem do caso ANTERIOR. */
  const clique = ppClique();
  return {
    totalTxt: txt('total-v'),
    sinalRot: txt('sinal-t'),
    sinalTxt: txt('sinal-v'),
    saldoRot: txt('saldo-t'),
    saldoTxt: txt('saldo-v'),
    aviso:    txt('sinal-aviso'),
    avisoOn:  !!(q('sinal-aviso') && /\bon\b/.test(q('sinal-aviso').className)),
    resumo:   res ? res.value : null,
    payload:  cola ? cola.value : '',
    pixArea:  !!(q('pixarea') && /\bon\b/.test(q('pixarea').className)),
    temPixLinha: !!q('pixlinha'),
    msgPP:    txt('msg'),
    ppClique: clique,
    ppValor:  ppValor(),
    alertas:  window.__alertas.slice(),
    aberto:   window.__aberto.slice()
  };
}, pref);

const zerarGanchos = pg => pg.evaluate(()=>{window.__alertas.length=0;window.__aberto.length=0;});

/* ===========================================================================
   COMO SE MONTA O CARRINHO EM CADA ABA -- e a unica coisa diferente entre elas
   =========================================================================== */
async function carrinhoCheckout(pg, itens){
  for(let i=0;i<CAT.length;i++){
    const sel = 'input[name="fcu-prod"][value="'+i+'"]';
    const marcado = await pg.$eval(sel, el => el.checked);
    const quer = itens.indexOf(i) >= 0;
    /* Clica no LABEL, e nao no input: o marcador de selecao e DESENHADO (Manual do Prosite),
       e o input nativo por baixo pode nem estar no caminho do dedo do operador. */
    if(marcado !== quer) await pg.click('label:has('+sel+')');
  }
}
async function carrinhoLoja(pg, itens){
  /* esvazia sempre, e so entao poe o subconjunto pedido: o carrinho da loja atravessa
     recarregamentos (localStorage), entao o que sobra de um caso entraria no seguinte. */
  for(let g=0; g<40; g++){
    const n = await pg.locator('.fcm-item .fcm-tirar').count();
    if(!n) break;
    await pg.locator('.fcm-item .fcm-tirar').first().click();
    await pg.waitForTimeout(20);
  }
  for(const i of itens){
    /* O cartao e achado pelo NOME, nunca por posicao: qual cartao fica em primeiro depende
       da ordem do catalogo e do filtro, e medir o cartao errado diria "a conta esta errada"
       sobre um pedido que nunca existiu. */
    await pg.locator('.fcm-card', {hasText: CAT[i].nome}).first().click();
    await pg.waitForTimeout(60);
    await pg.click('.fcm-add');
    await pg.waitForTimeout(60);
  }
}

async function aplicarCupom(pg, pref, codigo){
  await pg.fill('.'+pref+'-cupom-l input', codigo);
  await pg.click('.'+pref+'-cupom-l button');
  await pg.waitForTimeout(60);
}

/* Um caso completo: monta o carrinho, aplica (ou tira) o cupom, aperta o Pix e le tudo. */
async function umCaso(pg, aba, caso){
  const pref = aba.pref;
  await zerarGanchos(pg);
  await aba.carrinho(pg, caso.itens);
  await pg.waitForTimeout(60);
  await aplicarCupom(pg, pref, caso.cupom ? CUPOM.cod : '');
  /* O botao do Pix: com recusa ele nem chega a montar o payload -- solta alert e volta. */
  await pg.click('.'+pref+'-gerar');
  await pg.waitForTimeout(120);
  const r = await lerTudo(pref)(pg);
  /* O "Ja paguei" so existe dentro da area do Pix, que so abre quando o Pix foi gerado. */
  if(r.pixArea){
    await pg.click('.'+pref+'-zap');
    await pg.waitForTimeout(60);
    r.aberto = await pg.evaluate(()=>window.__aberto.slice());
  }
  return r;
}

/* ===========================================================================
   AS ABAS
   =========================================================================== */
const ABAS = [
  {nome:'Checkout',  saida:'u-out', pref:'fcu', porta:8911, carrinho:carrinhoCheckout},
  {nome:'Mini loja', saida:'m-out', pref:'fcm', porta:8912, carrinho:carrinhoLoja}
];

/* ===========================================================================
   OS CASOS DE CADA CONFIGURACAO
   =========================================================================== */
/* Os oito subconjuntos que a varredura apontou como "familia do meio centavo" com cupom de
   10% e sinal de 50%. Quatro entram na medicao (os quatro primeiros da lista), mais um
   controle SEM cupom e um controle fora da familia -- o suficiente para a prova sem pagar
   quinze montagens de carrinho por aba. */
const CASOS = {
  pct50: [
    {n:'A (meio centavo)',        itens:[0],       cupom:true},
    {n:'A+B (meio centavo)',      itens:[0,1],     cupom:true},
    {n:'B+D (meio centavo)',      itens:[1,3],     cupom:true},
    {n:'A+B+C+D (meio centavo)',  itens:[0,1,2,3], cupom:true},
    {n:'A+B SEM cupom',           itens:[0,1],     cupom:false},
    {n:'C sozinho (controle)',    itens:[2],       cupom:true}
  ],
  fixo100: [
    {n:'A+C com cupom',           itens:[0,2],     cupom:true},
    {n:'B sozinho (sinal MAIOR que o total)', itens:[1], cupom:true, recusa:'maior'},
    {n:'carrinho VAZIO',          itens:[],        cupom:false, recusa:'vazio'}
  ],
  pct1: [
    {n:'E sozinho (sinal arredonda para ZERO)', itens:[4], cupom:false, recusa:'zero'},
    {n:'A+C (1% sem arredondar para zero)',     itens:[0,2], cupom:true}
  ]
};

/* ============================ a bateria ============================ */
const blocos = {};
for(const cfg of CONFIGS) blocos[cfg.id] = await gerar(cfg);

for(const cfg of CONFIGS){
  for(const aba of ABAS){
    const rot = '['+cfg.id+'/'+aba.nome+'] ';
    console.log('\n== '+rot.trim()+' ==');
    const r = await comBlocoNaPagina({
      bloco: blocos[cfg.id][aba.saida], cabeca: CABECA,
      porta: aba.porta + CONFIGS.indexOf(cfg)*10,
      corpoDepois: '<div id="fim-do-documento">fim</div>',
      medir: async pg => {
        await pg.waitForTimeout(400);
        const fora = {};
        for(const caso of CASOS[cfg.id]) fora[caso.n] = await umCaso(pg, aba, caso);
        return {fora, fim: await pg.$('#fim-do-documento') !== null};
      }
    });
    chk(rot+'o documento nao foi engolido pelo bloco', r.fim);
    chk(rot+'sem erro de console proprio do bloco',
        errosReais(r.erros||[]).length===0, (r.erros||[]).slice(0,2).join(' | '));

    /* ===== 5. O DESCONTO DO PIX ZERADO, no TEXTO do bloco entregue =====
       Com sinal ligado, uCfg/mCfg zeram descpix ANTES de montar o bloco. A consequencia e
       que a linha do Pix nao chega a ser emitida e o ramo do meio de fcTotalPixSrc entra:
       totalPix() PASSA A SER sinalAgora(). Nao existe caminho em que os dois convivam. */
    const txt = blocos[cfg.id][aba.saida];
    chk(rot+'5. totalPix() devolve o SINAL (ramo do meio de fcTotalPixSrc)',
        txt.indexOf('function totalPix(){return sinalAgora();}') >= 0);
    chk(rot+'5. nenhuma outra forma de totalPix foi emitida',
        (txt.split('function totalPix(').length-1) === 1);
    chk(rot+'5. a linha do desconto do Pix NAO existe no bloco',
        txt.indexOf(aba.pref+'-pixlinha') < 0);
    chk(rot+'5. DESCONTO_PIX, se declarado, e zero',
        txt.indexOf('var DESCONTO_PIX=') < 0 || txt.indexOf('var DESCONTO_PIX=0;') >= 0,
        (txt.match(/var DESCONTO_PIX=[^;]*/)||[''])[0]);

    for(const caso of CASOS[cfg.id]){
      const d = r.fora[caso.n], tag = rot+caso.n+': ';
      chk(tag+'a linha do desconto do Pix nao esta no DOM', d.temPixLinha === false);

      /* ---------- os casos de RECUSA ---------- */
      if(caso.recusa){
        const frase = caso.recusa==='maior' ? TXT.maior : (caso.recusa==='zero' ? TXT.zero : null);

        if(caso.recusa === 'vazio'){
          /* PEDIDO ZERADO: sinalRecusa() devolve VAZIO de proposito (o comentario da fonte
             registra a decisao -- com o pedido em zero quem avisa e a recusa de total zero,
             e dois avisos ao mesmo tempo se esconderiam). O que esta suite mede aqui e o
             ESTADO INTEIRO desse caso, para ele deixar de ser invisivel. */
          chk(tag+'4. o botao do Pix recusa (alerta de pedido zerado)',
              d.alertas.length===1 && /zero/i.test(d.alertas[0]), JSON.stringify(d.alertas));
          chk(tag+'4. a area do Pix fica FECHADA', d.pixArea===false);
          chk(tag+'4. o clique do PayPal e REJEITADO', d.ppClique==='REJEITADO', String(d.ppClique));
          chk(tag+'4. a linha vermelha do sinal fica APAGADA (decisao registrada na fonte)',
              d.avisoOn===false, 'aviso="'+d.aviso+'"');
          /* ===== O QUE A TELA MOSTRA NESSE ESTADO -- impresso, NAO congelado em assercao =====
             Com o pedido em zero e sinal FIXO, sinalRecusa() devolve vazio (primeira guarda),
             entao a linha do sinal continua imprimindo o valor fixo e o resumo copiavel o
             repete: o cliente le "Total R$ 0,00 / sinal R$ 100,00 / saldo R$ 0,00", tres
             numeros que nao fecham entre si, e sem nenhum aviso. As DUAS pontas de pagamento
             recusam (pela recusa de total zero, verificada logo acima), entao ninguem chega a
             pagar esse numero -- o defeito, se for um, e de LEITURA e nao de cobranca.
             Nao vira assercao de proposito: congelar o comportamento de hoje faria a correcao
             futura falhar como se fosse regressao, e mexer na recusa e da classe que precisa
             de uma palavra do dono antes. Fica impresso, para a rodada seguinte decidir. */
          console.log('  ..    ACHADO '+tag+'pedido em zero: total='+d.totalTxt+
                      '  '+d.sinalRot+'='+d.sinalTxt+'  '+d.saldoRot+'='+d.saldoTxt+
                      '  | fim do resumo: '+JSON.stringify((d.resumo||'').split('\n').slice(-3)));
        }else{
          chk(tag+'4. a linha vermelha do carrinho acende com a frase certa',
              d.avisoOn===true && d.aviso===frase, 'aviso="'+d.aviso+'" on='+d.avisoOn);
          chk(tag+'4. o botao do Pix recusa com a MESMA frase',
              d.alertas.length===1 && d.alertas[0]===frase, JSON.stringify(d.alertas));
          /* A AREA DO PIX FECHA, e o que se mede e o fechamento -- nao o conteudo da caixa
             de copiar. MEDIDO nesta rodada: atualizar() chama esconderPix() a cada mudanca
             do carrinho, entao a area some; o TEXTO do ultimo codigo gerado continua dentro
             do <textarea> escondido e na variavel payloadAtual. Como o botao de copiar mora
             dentro da mesma area fechada, o cliente nao tem caminho ate ele -- fica escrito
             aqui para nao ser redescoberto como defeito, e para a prova nao passar a exigir
             uma limpeza que ninguem decidiu fazer. */
          chk(tag+'4. a area do Pix fica FECHADA', d.pixArea===false);
          chk(tag+'4. o clique do PayPal e REJEITADO', d.ppClique==='REJEITADO', String(d.ppClique));
          chk(tag+'4. o PayPal mostra a MESMA frase', d.msgPP===frase, 'msg="'+d.msgPP+'"');
          chk(tag+'4. o resumo copiavel diz RECUSADO com a MESMA frase',
              (d.resumo||'').indexOf(TXT.recusado.toUpperCase()+': '+frase) >= 0,
              JSON.stringify((d.resumo||'').split('\n').slice(-3)));
          chk(tag+'4. o resumo NAO imprime sinal nem saldo como se o pedido valesse',
              (d.resumo||'').indexOf(TXT.t8+':') < 0 && (d.resumo||'').indexOf(TXT.t9+':') < 0);
        }
        continue;
      }

      /* ---------- os casos que PASSAM ---------- */
      const e = esperado(caso.itens, caso.cupom, cfg.tipo, cfg.valor);
      const tela = {total:moeda(d.totalTxt), sinal:moeda(d.sinalTxt), saldo:moeda(d.saldoTxt)};

      /* 1. A CONTA, sobre o total ja com cupom. */
      chk(tag+'1. o TOTAL na tela e o subtotal ja com cupom  ('+e.total.toFixed(2)+')',
          tela.total===e.total, 'leu '+d.totalTxt);
      chk(tag+'1. o SINAL na tela sai do total com cupom  ('+e.sinal.toFixed(2)+')',
          tela.sinal===e.sinal, 'leu '+d.sinalTxt);
      chk(tag+'1. o SALDO na tela e total menos sinal  ('+e.saldo.toFixed(2)+')',
          tela.saldo===e.saldo, 'leu '+d.saldoTxt);
      chk(tag+'1. sinal + saldo fecham com o total',
          r2(tela.sinal+tela.saldo)===tela.total,
          JSON.stringify(tela));

      /* 6. AS TRES LINHAS NA TELA existem e trazem o rotulo configurado. */
      chk(tag+'6. as tres linhas na tela (total, sinal, saldo)',
          d.totalTxt!=null && d.sinalTxt!=null && d.saldoTxt!=null);
      chk(tag+'6. o rotulo do sinal e o campo da aba'+(cfg.tipo==='pct'?' com o percentual':''),
          cfg.tipo==='pct' ? d.sinalRot===TXT.t8+' ('+cfg.valor+'%)' : d.sinalRot===TXT.t8,
          'leu "'+d.sinalRot+'"');
      chk(tag+'6. o rotulo do saldo e o campo da aba', d.saldoRot===TXT.t9, 'leu "'+d.saldoRot+'"');
      chk(tag+'4. sem recusa, a linha vermelha fica apagada e vazia',
          d.avisoOn===false && (d.aviso===''||d.aviso==null), 'aviso="'+d.aviso+'"');

      /* 2. O NUMERO QUE O CLIENTE LE E O QUE AS DUAS PONTAS COBRAM. */
      chk(tag+'2. o Pix foi gerado', d.pixArea===true && d.payload.length>40);
      const pix = lerPayload(d.payload);
      chk(tag+'2. o payload Pix fecha como TLV (leitor independente)', !pix.erro, pix.erro||'');
      if(!pix.erro){
        chk(tag+'2. o CRC do payload confere (recalculado aqui)', pix.crcOk===true);
        chk(tag+'2. CAMPO 54 = o sinal  ('+e.sinal.toFixed(2)+')',
            pix.valor===e.sinal.toFixed(2), 'campo 54 = '+pix.valor);
        chk(tag+'2. campo 54 = o numero na TELA', parseFloat(pix.valor)===tela.sinal);
      }
      chk(tag+'2. amount.value do createOrder = o sinal  ('+e.sinal.toFixed(2)+')',
          d.ppValor===e.sinal.toFixed(2), 'PayPal = '+d.ppValor);
      chk(tag+'2. amount.value = o numero na TELA', parseFloat(d.ppValor)===tela.sinal);
      chk(tag+'2. Pix e PayPal cobram o MESMO numero', !pix.erro && pix.valor===d.ppValor,
          'pix='+(pix.valor||pix.erro)+' pp='+d.ppValor);
      chk(tag+'4. sem recusa, o clique do PayPal SEGUE', d.ppClique==='SEGUIU', String(d.ppClique));

      /* 3. O ARREDONDAMENTO: nos casos da familia, o numero cobrado e o do Math.round --
         e NAO o que um toFixed(2) sobre o valor cru devolveria. E a assinatura da correcao
         de ago/2026, e e o que quebra se alguem mover o arredondamento de lugar. */
      if(caso.n.indexOf('meio centavo') >= 0){
        const bruto = e.total*cfg.valor/100;
        const porFixed = Number(bruto.toFixed(2));
        chk(tag+'3. este caso ESTA mesmo na familia do meio centavo (round '+e.sinal.toFixed(2)+
            ' != toFixed '+porFixed.toFixed(2)+')', e.sinal !== porFixed);
        chk(tag+'3. as tres leituras ficaram com o valor do Math.round',
            tela.sinal===e.sinal && d.ppValor===e.sinal.toFixed(2) &&
            (!pix.erro && pix.valor===e.sinal.toFixed(2)));
      }

      /* 6. AS TRES LINHAS DO WHATSAPP, na URL que o proprio bloco abriu. */
      const url = decodeURIComponent((d.aberto||[])[0] || '');
      chk(tag+'6. o "Ja paguei" abriu o WhatsApp', url.indexOf('wa.me/') >= 0, url.slice(0,60));
      chk(tag+'6. linha do TOTAL na mensagem, com o numero da tela',
          url.indexOf('ZAPTOTAL: '+d.totalTxt) >= 0,
          'procurava "ZAPTOTAL: '+d.totalTxt+'"');
      chk(tag+'6. linha do SINAL na mensagem, com o numero da tela',
          url.indexOf('ZAPSINAL: *'+d.sinalTxt+'*') >= 0,
          'procurava "ZAPSINAL: *'+d.sinalTxt+'*"');
      /* D1: esta linha era a unica do conjunto que NAO era campo -- o ': *...*' vinha cravado
         no gerador. Depois da divida D1 ela passa por aTplJs como todas as outras. */
      chk(tag+'6. linha do SALDO na mensagem, pelo campo NOVO (divida D1)',
          url.indexOf('ZAPSALDO: *'+d.saldoTxt+'*') >= 0,
          'procurava "ZAPSALDO: *'+d.saldoTxt+'*"');
      chk(tag+'D1. o rotulo da TELA nao vaza mais para a mensagem',
          url.indexOf(TXT.t9+': *') < 0,
          'achou o rotulo "'+TXT.t9+': *" na mensagem -- o campo novo nao foi usado');
      chk(tag+'6. as tres linhas saem nesta ordem: total, sinal, saldo',
          url.indexOf('ZAPTOTAL') < url.indexOf('ZAPSINAL') &&
          url.indexOf('ZAPSINAL') < url.indexOf('ZAPSALDO'));

      /* O RESUMO COPIAVEL, quarto consumidor, no caminho feliz. */
      chk(tag+'4. o resumo traz sinal e saldo com os mesmos numeros da tela',
          (d.resumo||'').indexOf(TXT.t8+': '+d.sinalTxt) >= 0 &&
          (d.resumo||'').indexOf(TXT.t9+': '+d.saldoTxt) >= 0,
          JSON.stringify((d.resumo||'').split('\n').slice(-4)));
      chk(tag+'4. o resumo nao traz linha de desconto do Pix',
          (d.resumo||'').indexOf('Pagando via Pix') < 0);
    }
  }
}

/* ===========================================================================
   AS DIVIDAS D2 e D3, na INTERFACE da ferramenta (nao mudam saida nenhuma)
   =========================================================================== */
/* ===========================================================================
   AS DIVIDAS D2 e D3, na INTERFACE da ferramenta
   ===========================================================================
   Nenhuma das duas muda um byte de saida -- sao regras de tela --, e por isso
   nenhuma regressao byte a byte as alcancaria. Sao medidas aqui, na ferramenta
   aberta, com a tela sendo a fonte: getComputedStyle e a propriedade .disabled,
   nunca a leitura da variavel que as decide.

   D2: com o sinal ligado o Checkout ja DESABILITAVA o campo do desconto do Pix
       (com o comentario que explica por que desabilitar e nao esconder: esconder
       um campo que continua guardando 10% troca defeito visivel por invisivel).
       A Mini loja nao tinha a linha equivalente -- o campo ficava editavel e sem
       efeito nenhum.
   D3: o aviso ambar da Mini loja pedia m==='ambos' && sinalOn; o Checkout pede
       so sinalOn. MEDIDO: a condicao extra nao mudava o que se via, porque o
       aviso mora DENTRO de m-descpix-campo, que ja some fora de 'ambos'. O que
       ela criava era divergencia de REGRA entre duas abas que a fonte declara
       gemeas -- e isso e o defeito de amanha, nao o de hoje.
   =========================================================================== */
console.log('\n== D2 e D3: o campo do desconto do Pix nas duas abas ==');
{
  const srv = await servir(RAIZ_REPO, 8341);
  const br  = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8341');
    /* 'visivel' pela CAIXA do elemento, e nao por getComputedStyle: o computed display de um
       elemento dentro de um ancestral display:none continua sendo o dele proprio ('block'),
       porque ninguem consultou layout. Medir "escondido" por ali daria falso alarme
       justamente no caso em que quem esconde e o PAI -- o "Somente Pix". */
    const olhar = (pref) => pg.evaluate(p => {
      const vis = el => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
      const av = document.getElementById(p+'-descpix-aviso');
      const ca = document.getElementById(p+'-descpix-campo');
      return {
        desab: document.getElementById(p+'-descpix').disabled,
        avisoVis: vis(av), campoVis: vis(ca),
        avisoRegra: av.style.display        /* a regra que mToggles/uToggles escreveu */
      };
    }, pref);

    await clicar(pg,'aba-loja'); await pg.waitForTimeout(60);
    const mAntes = await olhar('m');
    await radio(pg,'m-sinal','sim'); await pg.waitForTimeout(60);
    const mDepois = await olhar('m');
    /* e com "Somente Pix": o campo inteiro some, como ja somia -- o que mudou foi a REGRA
       do aviso, nao o que se ve. Medir os dois estados e o que transforma essa frase em
       medicao em vez de opiniao. */
    await radio(pg,'m-metodo','pix'); await pg.waitForTimeout(60);
    const mSoPix = await olhar('m');
    await radio(pg,'m-metodo','ambos'); await pg.waitForTimeout(40);

    await clicar(pg,'aba-uni'); await pg.waitForTimeout(60);
    const uAntes = await olhar('u');
    await radio(pg,'u-sinal','sim'); await pg.waitForTimeout(60);
    const uDepois = await olhar('u');

    chk('D2. Mini loja: o campo do desconto do Pix nasce HABILITADO', mAntes.desab===false);
    chk('D2. Mini loja: com o sinal ligado ele fica DESABILITADO', mDepois.desab===true,
        'disabled='+mDepois.desab);
    chk('D2. Checkout: o mesmo, e ja era assim antes desta rodada',
        uAntes.desab===false && uDepois.desab===true);
    chk('D2. o campo continua A VISTA (desabilitado, nao escondido)',
        mDepois.campoVis && uDepois.campoVis);

    chk('D3. Mini loja: o aviso some com o sinal desligado', mAntes.avisoVis===false);
    chk('D3. Mini loja: o aviso aparece com o sinal ligado', mDepois.avisoVis===true);
    chk('D3. as duas abas concordam nos dois estados',
        mAntes.avisoVis===uAntes.avisoVis && mDepois.avisoVis===uDepois.avisoVis,
        JSON.stringify({mAntes:mAntes.avisoVis,uAntes:uAntes.avisoVis,
                        mDepois:mDepois.avisoVis,uDepois:uDepois.avisoVis}));
    /* A REGRA passou a ser so o sinal (D3); quem esconde o aviso em "Somente Pix" e o PAI,
       que ja somia antes desta rodada. As duas coisas medidas separadas: a regra escrita e o
       que o operador enxerga. */
    chk('D3. a regra do aviso passou a ser SO o sinal', mSoPix.avisoRegra==='block',
        'regra="'+mSoPix.avisoRegra+'"');
    chk('D3. em "Somente Pix" o campo inteiro some, e o aviso vai junto',
        mSoPix.campoVis===false && mSoPix.avisoVis===false);

    chk('D2/D3. a ferramenta nao alertou nada nesta passagem',
        (await alertas(pg)).length===0);
    chk('D2/D3. sem erro de console', pg.erros.length===0, pg.erros.slice(0,2).join(' | '));
    await pg.close();
  } finally {
    await br.close();
    srv.close();
  }
}

process.exit(resumo());
