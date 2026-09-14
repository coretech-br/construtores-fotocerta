/* ============================================================================
   A COBRANCA DE SINAL, COM OS BLOCOS RODANDO
   Checkout, Mini loja e Agendamento por pacote
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

   A ABA AGENDAMENTO POR PACOTE entrou em 13/09/2026 (rodada C) e tem uma secao
   propria, no fim deste arquivo -- as seis provas acima mais tres que so existem
   la: o IDENTIFICADOR DE CONCILIACAO imune ao sinal, o ENCONTRO COM O MEIO
   PRIORITARIO (nenhuma segunda linha repetindo o numero de cima, nenhum selo
   dizendo -0%) e o PARCELAMENTO SOBRE O SINAL. O porque de cada uma esta escrito
   no cabecalho daquela secao. Ela REUSA daqui a segunda opiniao da conta
   (esperado), o leitor TLV independente e o catalogo do meio centavo: repeti-los
   noutro arquivo criaria a terceira implementacao de cada um, que e justamente o
   que este arnes existe para impedir.

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
   dissessem a mesma coisa por lerem o mesmo codigo, o teste nao teria opiniao nenhuma.

   O DESCONTO EM CENTAVOS INTEIROS (13/09/2026). Ate esta data esta transcricao fazia
   r2(sub*pct/100) -- multiplicar em ponto flutuante e arredondar depois --, que e exatamente a
   forma que o gerador tinha e que cobrava um centavo a mais do cliente. As duas concordavam, e
   por isso a suite passava: transcricao que repete o erro do original nao e segunda opiniao,
   e eco.
   Medido no caso B+D desta familia: subtotal 371,05 com cupom de 10%. A forma antiga da
   desconto 37,10 e total 333,95; a conta exata em centavos da 37,11 e 333,94 -- e o gerador
   corrigido concorda com a exata. A transcricao passou a fazer a conta EXATA, que e o que uma
   segunda opiniao deve fazer: dizer qual e o numero certo, nao repetir o que o outro lado faz. */
const r2 = x => Math.round(x*100)/100;
const cent = x => Math.round(x*100);
function esperado(itens, comCupom, tipo, valor){
  const sub   = r2(itens.reduce((s,i)=>s+CAT[i].v,0));
  const desc  = comCupom ? Math.round(cent(sub)*CUPOM.pct/100)/100 : 0;
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
  /* Os sete campos que SO a aba Agendamento por pacote ganhou em 13/09/2026, junto do botao
     "Ja paguei" (ate entao ela mostrava o Pix e nao tinha como o cliente avisar). Distintos
     como os de cima e pelo mesmo motivo: cada assercao aponta para UM campo, e um texto que
     vazasse do lugar errado apareceria com o rotulo do outro. */
  zapPago:'ZAPBOTAO ja paguei',
  zapAbertura:'ZAPABRE sem sinal',
  zapAberturaSinal:'ZAPABRESINAL com sinal',
  zapPedido:'ZAPPEDIDO: *{cod}*',
  zapCupom:'ZAPCUPOM: {codigo}',
  zapDescPix:'ZAPDESC: -{pct}%',
  zapValor:'ZAPVALOR: *{valor}*',
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
  /* O TXID mora no campo 62, sub-campo 05 -- lido pelo MESMO leitor escrito aqui, e nunca
     pelo do projeto (ver o cabecalho). Acrescentado em 13/09/2026: a mensagem do "Ja paguei"
     da aba pac cita o identificador de conciliacao, e a pergunta "e o MESMO que foi cobrado?"
     so se responde lendo o identificador de dentro do proprio payload. */
  const c62 = itens.filter(x => x[0]==='62');
  let txid = null;
  if(c62.length === 1){
    const dentro = tlvRaiz(c62[0][1]);
    if(dentro){ const c05 = dentro.filter(x => x[0]==='05'); if(c05.length===1) txid = c05[0][1]; }
  }
  return {valor: c54[0][1], crcOk, txid};
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
  const vis = el => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
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
    /* VISIVEL e medido pela caixa (offsetParent + altura), e nao por getComputedStyle: o
       display computado de um elemento dentro de um ancestral display:none continua sendo o
       DELE, e mediria errado exatamente no caso em que quem esconde e outro. */
    sinalVis: vis(q('sinal')),
    saldoVis: vis(q('saldo')),
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
    /* B+D SAIU da familia quando o desconto passou a ser calculado em centavos inteiros
       (13/09/2026): o total foi de 333,95 para 333,94, e metade disso deixou de cair em meio
       centavo. Trocado por A+B+D, que a mesma varredura mostra AINDA na familia -- total
       436,27, sinal cru 218,135, com Math.round dando 218,14 e toFixed dando 218,13.
       Trocar o caso e o certo aqui: o que este teste protege e o COMPORTAMENTO no meio
       centavo, nao aquele subconjunto em particular. Manter B+D so faria a assercao 3
       falhar para sempre dizendo a verdade -- que ele nao serve mais para isso. */
    {n:'A+B+D (meio centavo)',    itens:[0,1,3],   cupom:true},
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
          /* ===== O PEDIDO EM ZERO, AGORA COM REGRA ===== (13/09/2026)
             Ate esta data o estado era apenas IMPRESSO: com o pedido em zero sinalRecusa() devolve
             vazio (primeira guarda, de proposito -- quem avisa e a recusa de total zero, e dois
             avisos se esconderiam), e as linhas continuavam desenhadas. O cliente lia tres numeros
             que nao fecham, sem aviso. Nunca foi defeito de cobranca -- as duas pontas recusam, o
             que as assercoes acima verificam -- e sim de LEITURA. O dono autorizou a correcao: as
             linhas do sinal e do saldo so existem quando ha o que pagar. Conserto de TELA, que nao
             toca a conta. */
          chk(tag+'5. a linha do SINAL nao aparece com o pedido em zero',
              d.sinalVis===false, 'sinal="'+d.sinalTxt+'" visivel='+d.sinalVis);
          chk(tag+'5. a linha do SALDO nao aparece com o pedido em zero',
              d.saldoVis===false, 'saldo="'+d.saldoTxt+'" visivel='+d.saldoVis);
          chk(tag+'5. o TOTAL continua aparecendo -- o que some e o numero falso, nao o aviso',
              /0,00/.test(String(d.totalTxt)), String(d.totalTxt));
          chk(tag+'5. o resumo copiavel nao imprime sinal nem saldo',
              !d.resumo || (d.resumo.indexOf(TXT.sinal)<0 && d.resumo.indexOf(TXT.saldo)<0),
              JSON.stringify((d.resumo||'').split('\n').slice(-3)));
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

/* ============================================================================
   A ABA AGENDAMENTO POR PACOTE (rodada C, 13/09/2026)
   ============================================================================
   POR QUE ELA ENTRA AQUI, e nao num arquivo proprio. A CONTA e a mesma fonte
   (FC_CARRINHO_SRC.sinal) e o criterio dos casos de arredondamento e o mesmo
   catalogo medido para as duas irmas -- repetir a segunda opiniao da conta e o
   leitor TLV noutro arquivo seria criar uma terceira implementacao de cada um,
   que e exatamente o que este arnes existe para impedir. O que muda e so como
   se monta o carrinho e onde se le a tela, e isso mora nas funcoes abaixo.

   O QUE ESTA ABA TEM QUE AS IRMAS NAO TEM, e por isso ganha prova propria:

     a) O IDENTIFICADOR DE CONCILIACAO. Ele e calculado a partir SO do pacote e
        do horario, antes de o carrinho existir, e essa independencia e a
        correcao do defeito mais caro daquela rodada (um extrato com varias
        cobrancas diferentes para uma reserva so). Sinal que entrasse nele
        reabriria o defeito. Aqui ele e lido de onde o cliente de fato o manda
        -- o custom_id do pedido ao SDK do cartao (o 'sku' deixou de carrega-lo
        na leva 7; ver a prova do identificador) -- e comparado com sinal
        LIGADO e DESLIGADO, depois de recarregar a pagina e depois de mexer no
        carrinho.

     b) O ENCONTRO COM O MEIO PRIORITARIO. Com sinal o desconto do Pix e zerado
        na origem, entao "preco do Pix" e "preco cheio" viram o mesmo numero.
        Esta aba tem duas pecas que as irmas nao tem -- a SEGUNDA LINHA
        ("ou {valor} no cartao") e o SELO "-{pct}% no Pix" --, e duas linhas com
        o mesmo numero, ou um selo dizendo -0%, nao podem chegar ao cliente. As
        quatro combinacoes de (meio prioritario x sinal) sao medidas no DOM.

     c) O PARCELAMENTO E SOBRE O SINAL (decisao do dono): a parcela mostrada tem
        de ser sinalAgora()/PARCELAS, e nao total()/PARCELAS.

   O QUE ELA NAO TEM, e a ausencia e MEDIDA e nao suposta:

     - NAO HA RESUMO COPIAVEL. As irmas tem quatro consumidores de sinalRecusa()
       (linha vermelha, clique do cartao, botao do Pix e resumo); aqui sao TRES,
       porque montarResumo() desta pagina desenha o nome e a duracao do pacote,
       nao um <textarea>. Por isso 'txtSinalRecusado' nao nasce nesta aba: campo
       de texto sem consumidor e pior que campo faltando.
     - A MENSAGEM DE WHATSAPP NAO CITA VALOR. As duas unicas desta pagina
       (recusa e prazo vencido) sao recados fixos, entao nao ha linha de saldo
       para migrar e 'txtZapSaldo' tambem nao nasce aqui.
     Os dois testes abaixo ('a ausencia declarada') medem isso no TEXTO do bloco,
     para a ausencia deixar de ser uma frase e passar a ser uma medida.

   O CARRINHO DESTA ABA: o pacote e FIXO (nao desmarcavel) e os opcionais sao os
   que somam. Por isso todo subconjunto medido aqui contem o pacote -- e por isso
   os quatro casos do meio centavo foram RE-ESCOLHIDOS entre os que o contem
   (varredura de 13/09/2026: dos oito subconjuntos com o pacote, SEIS caem na
   familia com cupom de 10% e sinal de 50%; quatro entram na medicao).
   ============================================================================ */
console.log('\n\n========== AGENDAMENTO POR PACOTE ==========');

/* O catalogo desta aba: um pacote com tres opcionais (os mesmos valores de CAT,
   para a segunda opiniao da conta continuar valendo) e dois pacotes curtos, que
   existem so para alcancar as duas recusas -- um total ABAIXO do sinal fixo, e um
   total tao pequeno que 1% dele arredonda para zero. */
const A_PAC_ENS   = {cod:'ENS',   nome:'Ensaio A',  dur:'2 horas', preco:CAT[0].preco};
const A_PAC_CURTO = {cod:'CURTO', nome:'Ensaio B',  dur:'1 hora',  preco:CAT[1].preco};
const A_PAC_MINI  = {cod:'MINI',  nome:'Ensaio E',  dur:'15 min',  preco:CAT[4].preco};
/* Os opcionais de ENS sao CAT[1..3], na ordem -- o indice do opcional na tela e
   o indice em CAT menos um, e e assim que 'itens' abaixo se le. */
const A_OPS = [CAT[1], CAT[2], CAT[3]];
/* Achar o pacote pelo codigo que a URL leva -- a lista de itens da mensagem do "Ja paguei"
   comeca por ele, e comparar contra "algum dos tres" seria assercao que passa por acidente. */
const A_PACS = {ENS:A_PAC_ENS, CURTO:A_PAC_CURTO, MINI:A_PAC_MINI};
/* O cupom de 100% e a UNICA forma de zerar o pedido nesta aba (o pacote e fixo,
   e o proprio texto de fabrica da aba diz isso: "O cupom aplicado zera o valor
   deste pedido"). E o espelho do "carrinho VAZIO" das irmas. */
const A_CUPOM_ZERA = 'ZERA';
const A_PARCELAS = 6;

/* O endereco da reserva. 'quando' tem de estar no FUTURO: prazoFim() limita o prazo
   ao inicio do ensaio, e um horario passado cairia no cartao de "prazo vencido",
   que nao tem secao de pagamento nenhuma -- o teste mediria uma tela que nao e a
   que ele quer medir. 'data' e 'hora' sao as strings que o TidyCal mostra ao dono,
   e sao elas que entram no identificador. */
const A_QUANDO = '2030-05-10T14:00:00Z';
const A_DATA = '10/05/2030';
const A_HORA = '14:00';
const buscaDe = cod => '?pac='+cod+'&data='+encodeURIComponent(A_DATA)
  +'&hora='+encodeURIComponent(A_HORA)+'&quando='+encodeURIComponent(A_QUANDO);
/* O identificador esperado de UM pacote, escrito por extenso: PREFIXO + codigo + os digitos de
   'data' e 'hora' como chegaram na URL (diaHoraId). Escrito a mao de proposito -- se ele passar
   a sair de uma funcao do projeto, o teste deixa de ter opiniao propria sobre ele.
   Mora AQUI, e nao mais junto da matriz do meio prioritario, porque desde 13/09/2026 ele tambem
   e cobrado dentro da mensagem do "Ja paguei", que e medida bem antes daquela secao. */
const idDe = cod => 'FC' + cod + A_DATA.replace(/\D/g,'') + A_HORA.replace(/\D/g,'');
/* A mensagem que o "Ja paguei" carrega, lida da URL do wa.me exatamente como o WhatsApp a
   receberia. Decodificar aqui, e nao comparar a URL crua, e o que faz a assercao falar da
   MENSAGEM em vez de falar do escape de URL. */
const zapMsg = href => href ? decodeURIComponent(String(href).split('?text=')[1] || '') : '';

/* OS QUATRO CAMPOS NOVOS COM TEXTO HOSTIL. Eles nao estao (ainda) na tabela TEXTOS de
   cenario.mjs -- nao existem em 'main', e poe-los la faria a passagem configurada deixar de
   ser comparavel contra a referencia (ver o README). Entao o escape deles e medido AQUI, com
   o bloco rodando: apostrofa (o literal do bloco e de aspas simples), barra invertida, aspas
   duplas, acento e a sequencia '</script', que o Manual do Prosite manda blindar -- se um
   deles escapar, o literal fecha no meio e o bloco inteiro nao carrega. */
const A_HOSTIL = {
  t8:   'Sinal \'agora\' "já" \\ </script> & <b>',
  t9:   'Saldo — \'depois\' "no dia" \\ </script>',
  maior:'O sinal desta \'reserva\' é maior \\ que o total "todo" </script>',
  zero: 'O sinal \'arredonda\' para zero \\ "mesmo" </script>',
  /* OS SETE DO "JA PAGUEI" (13/09/2026). O rotulo do botao e a abertura passam por escJsD
     direto; as outras cinco passam por aTplJs, que parte o texto nos marcadores e escapa cada
     pedaco -- dois caminhos diferentes, e por isso os dois precisam de texto hostil. Se um
     escape faltar, o literal de aspas DUPLAS do bloco fecha no meio e nada carrega. */
  zapPago:  'Já \'paguei\' — "avisar" \\ </script>',
  zapAbre:  'Olá! \'Paguei\' "mesmo" \\ </script> & <b>',
  zapAbreS: 'Olá! Paguei o \'SINAL\' "todo" \\ </script>',
  zapPedido:'Reserva \'cod\' "n" \\ </script>: *{cod}*',
  zapCupom: 'Cupom \'aplicado\' "ok" \\ </script>: {codigo}',
  zapSaldo: 'Resta \'pagar\' "depois" \\ </script>: *{valor}*',
  zapValor: 'Paguei \'agora\' "tudo" \\ </script>: *{valor}*'
};

/* ===========================================================================
   A PASSAGEM PELA FERRAMENTA -- uma configuracao, uma saida (a-out3)
   =========================================================================== */
async function gerarPac(cfg){
  console.log('\ngerando a pagina de obrigado  ['+cfg.id+'] ...');
  const r = await gerarNaFerramenta(async pg => {
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
    await clicar(pg,'aba-pac');
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-prefixo','FC');
    await radio(pg,'a-metodo','ambos');
    await radio(pg,'a-prio',cfg.prio);
    await set(pg,'a-parcelas',String(A_PARCELAS));
    /* Desconto do Pix em 5 (a fabrica) DE PROPOSITO, inclusive nas configuracoes com
       sinal: e assim que se prova que quem o zera e o sinal, e nao o teste. */
    await set(pg,'a-descpix','5');

    await set(pg,'a-pcod',A_PAC_ENS.cod); await set(pg,'a-pnome',A_PAC_ENS.nome);
    await set(pg,'a-pdur',A_PAC_ENS.dur); await set(pg,'a-ppreco',A_PAC_ENS.preco);
    await set(pg,'a-pinclui','20 fotos'); await set(pg,'a-ppath','fotocerta/ens');
    for(const op of A_OPS){
      await set(pg,'a-op-nome',op.nome); await set(pg,'a-op-preco',op.preco);
      await clicar(pg,'a-op-add');
    }
    await clicar(pg,'a-pac-salvar');
    for(const p of [A_PAC_CURTO, A_PAC_MINI]){
      await set(pg,'a-pcod',p.cod); await set(pg,'a-pnome',p.nome);
      await set(pg,'a-pdur',p.dur); await set(pg,'a-ppreco',p.preco);
      await set(pg,'a-pinclui','10 fotos'); await set(pg,'a-ppath','fotocerta/'+p.cod.toLowerCase());
      await clicar(pg,'a-pac-salvar');
    }
    await set(pg,'a-cp-cod',CUPOM.cod);
    await radio(pg,'a-cp-tipo','pct_total');
    await set(pg,'a-cp-valor',String(CUPOM.pct));
    await clicar(pg,'a-cp-add');
    await set(pg,'a-cp-cod',A_CUPOM_ZERA);
    await radio(pg,'a-cp-tipo','pct_total');
    await set(pg,'a-cp-valor','100');
    await clicar(pg,'a-cp-add');

    await radio(pg,'a-sinal',cfg.sinal?'sim':'nao');
    if(cfg.sinal){
      await radio(pg,'a-sinaltipo',cfg.tipo);
      await set(pg, cfg.tipo==='fixo'?'a-sinalfixo':'a-sinalpct', String(cfg.valor));
      const T = cfg.hostil ? A_HOSTIL : TXT;
      await set(pg,'a-t8',T.t8); await set(pg,'a-t9',T.t9);
      await set(pg,'a-txt-sinal-maior',T.maior);
      await set(pg,'a-txt-sinal-zero',T.zero);
    }
    /* OS CAMPOS DO "JA PAGUEI" (13/09/2026) ENTRAM SEMPRE, com sinal ou sem -- a mensagem tem
       DOIS ramos (as tres linhas do sinal, ou a linha unica do valor pago) e so as duas
       passagens juntas alcancam os dois. Escrever so no ramo do sinal deixaria 'zapValor'
       emitido e nunca lido, que e a cobertura fantasma que este arnes existe para recusar. */
    {
      const Z = cfg.hostil ? A_HOSTIL : TXT;
      await set(pg,'a-txt-zap-pago',           cfg.hostil ? Z.zapPago   : TXT.zapPago);
      await set(pg,'a-txt-zap-abertura',       cfg.hostil ? Z.zapAbre   : TXT.zapAbertura);
      await set(pg,'a-txt-zap-abertura-sinal', cfg.hostil ? Z.zapAbreS  : TXT.zapAberturaSinal);
      await set(pg,'a-txt-zap-pedido',         cfg.hostil ? Z.zapPedido : TXT.zapPedido);
      await set(pg,'a-txt-zap-cupom',          cfg.hostil ? Z.zapCupom  : TXT.zapCupom);
      await set(pg,'a-txt-zap-descpix',        TXT.zapDescPix);
      await set(pg,'a-txt-zap-total',          TXT.zapTotal);
      await set(pg,'a-txt-zap-sinal',          TXT.zapSinal);
      await set(pg,'a-txt-zap-saldo',          cfg.hostil ? Z.zapSaldo  : TXT.zapSaldo);
      await set(pg,'a-txt-zap-valor',          cfg.hostil ? Z.zapValor  : TXT.zapValor);
    }
    await clicar(pg,'a-gerar');
  }, ['a-out3'], {porta: cfg.porta});

  chk('['+cfg.id+'] a ferramenta gerou sem alerta', r.alertas.length===0, JSON.stringify(r.alertas));
  chk('['+cfg.id+'] a ferramenta gerou sem erro de console', r.erros.length===0, r.erros.slice(0,2).join(' | '));
  const t = r.valores['a-out3']||'';
  chk('['+cfg.id+'] a-out3 saiu', t.length>1000);
  chk('['+cfg.id+'] o motor de sinal esta '+(cfg.sinal?'DENTRO':'FORA')+' do bloco',
      (t.indexOf('function sinalAgora()')>=0)===!!cfg.sinal);
  return t;
}

/* ===========================================================================
   O QUE SE MEDE DENTRO DA PAGINA DE OBRIGADO
   =========================================================================== */
const lerPac = pg => pg.evaluate(() => {
  const q = s => document.querySelector(s);
  const txt = s => { const e=q(s); return e ? e.textContent.trim() : null; };
  const vis = el => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  const filho = (s,i) => { const e=q(s); return (e && e.children[i]) ? e.children[i].textContent.trim() : null; };
  function ppClique(){
    if(!window.__pp || !window.__pp.onClick) return null;
    try{ return window.__pp.onClick(null,{reject:()=>'REJEITADO', resolve:()=>'SEGUIU'}); }
    catch(e){ return 'ERRO: '+(e && e.message || e); }
  }
  function ppPedido(){
    if(!window.__pp || !window.__pp.createOrder) return null;
    try{
      const u = window.__pp.createOrder(null,{order:{create:x=>x}}).purchase_units[0];
      /* 'temSku' e 'sku' sao coisas DIFERENTES desde a leva 7 (14/09/2026), e as duas viajam:
         "a chave nao existe" e "a chave existe valendo undefined" dao a mesma leitura num
         '=== undefined' e produzem JSON diferente no pedido que vai ao PayPal. */
      return {valor:u.amount.value, custom:u.custom_id, nome:u.items[0].name,
              sku:u.items[0].sku,
              temSku:Object.prototype.hasOwnProperty.call(u.items[0],'sku')};
    }catch(e){ return {erro:'ERRO: '+(e && e.message || e)}; }
  }
  /* O CLIQUE ANTES da mensagem que ele escreve: num literal de objeto as propriedades
     sao avaliadas na ordem escrita, e ler 'msg' antes mediria o caso ANTERIOR. */
  const clique = ppClique();
  const cola = q('.fca-ob-cod'), bot = q('.fca-ob-botoes'), av = q('.fca-ob-sinal-aviso');
  /* O "JA PAGUEI" (13/09/2026). Tudo o que se quer saber dele sai daqui: se existe, o que
     diz, PARA ONDE aponta, se esta DENTRO da area do Pix e se esta VISIVEL. A posicao no DOM
     e medida, e nao deduzida da folha de estilo: "dentro da area" e uma afirmacao sobre o
     parentesco dos elementos, e e assim que ela tem de ser lida. */
  const zp = q('.fca-ob-zap');
  const anteriorZp = zp && zp.previousElementSibling;
  return {
    zapTem:    !!zp,
    zapTexto:  zp ? zp.textContent : null,
    zapHref:   zp ? zp.getAttribute('href') : null,
    zapAlvo:   zp ? zp.getAttribute('target') : null,
    zapTag:    zp ? zp.tagName : null,
    zapNaArea: !!(zp && zp.parentElement && /fca-ob-pixarea/.test(zp.parentElement.className)),
    zapDepoisDoAviso: !!(anteriorZp && /fca-ob-pixmanual/.test(anteriorZp.className)),
    zapVis:    vis(zp),
    /* Quantos elementos carregam a classe: o estado "sem WhatsApp" tem de dar ZERO. */
    zapQuantos: document.querySelectorAll('.fca-ob-zap').length,
    totalTxt: txt('.fca-ob-preco-valor'),
    linha2:   txt('.fca-ob-preco-linha2'),
    temLinha2: !!q('.fca-ob-preco-linha2'),
    nSelos:   document.querySelectorAll('.fca-ob-selo').length,
    sinalRot: filho('.fca-ob-sinal',0), sinalTxt: filho('.fca-ob-sinal',1),
    saldoRot: filho('.fca-ob-saldo',0), saldoTxt: filho('.fca-ob-saldo',1),
    temSinal: !!q('.fca-ob-sinal'), temSaldo: !!q('.fca-ob-saldo'),
    sinalVis: vis(q('.fca-ob-sinal')), saldoVis: vis(q('.fca-ob-saldo')),
    aviso:    av ? av.textContent.trim() : null,
    avisoOn:  !!(av && /\bon\b/.test(av.className)),
    /* A LINHA DA PARCELA e o irmao seguinte da caixa dos botoes do cartao -- e assim
       que secaoCartao a monta. Procura-la por classe pegaria qualquer '.fca-ob-ajuda'
       da pagina (a do prazo, a do Pix), e o teste mediria outra linha. */
    parcela:  (bot && bot.nextElementSibling) ? bot.nextElementSibling.textContent.trim() : null,
    payload:  cola ? cola.value : '',
    pixArea:  !!(q('.fca-ob-pixarea') && /\bon\b/.test(q('.fca-ob-pixarea').className)),
    msgPP:    txt('.fca-ob-msg'),
    ppClique: clique,
    pedido:   ppPedido(),
    alertas:  window.__alertas.slice()
  };
});

/* O botao "Gerar Pix" e o filho DIRETO do bloco do Pix; o "Copiar" carrega a mesma
   classe mas mora dentro da area, entao o '>' e o que separa os dois sem depender
   do texto configurado. */
const A_BT_PIX = '.fca-ob-bloco:has(.fca-ob-pixarea) > button.fca-ob-bt';

async function carrinhoPac(pg, opcionaisQueridos){
  const estados = await pg.$$eval('.fca-ob-op input[type="checkbox"]', els => els.map(e => e.checked));
  for(let j=0;j<estados.length;j++){
    const quer = opcionaisQueridos.indexOf(j) >= 0;
    /* Clica no LABEL: o marcador e DESENHADO (Manual do Prosite) e o input nativo por
       baixo pode nem estar no caminho do dedo do operador. */
    if(estados[j] !== quer) await pg.locator('.fca-ob-op').nth(j).locator('label').click();
  }
}

async function umCasoPac(pg, caso){
  await pg.evaluate(()=>{window.__alertas.length=0;});
  await carrinhoPac(pg, caso.ops||[]);
  await pg.waitForTimeout(60);
  await aplicarCupom(pg,'fca-ob', caso.cupom||'');
  await pg.click(A_BT_PIX);
  await pg.waitForTimeout(150);
  return await lerPac(pg);
}

/* ===========================================================================
   AS CONFIGURACOES E OS CASOS
   ===========================================================================
   'itens' e a lista de indices de CAT que estao no carrinho -- o pacote sempre,
   os opcionais marcados por cima --, e e o que a segunda opiniao da conta recebe.
   'ops' e a mesma coisa escrita como indice de opcional na tela (itens menos um).
   =========================================================================== */
const A_CFGS = {
  'pct50':   {id:'pac/pct50',   sinal:true,  tipo:'pct',  valor:50,  prio:'pix', porta:8951},
  'fixo100': {id:'pac/fixo100', sinal:true,  tipo:'fixo', valor:100, prio:'pix', porta:8952},
  'pct1':    {id:'pac/pct1',    sinal:true,  tipo:'pct',  valor:1,   prio:'pix', porta:8953},
  'pct50pp': {id:'pac/pct50pp', sinal:true,  tipo:'pct',  valor:50,  prio:'pp',  porta:8954},
  'offpix':  {id:'pac/sem-pix', sinal:false, tipo:'pct',  valor:50,  prio:'pix', porta:8955},
  'offpp':   {id:'pac/sem-pp',  sinal:false, tipo:'pct',  valor:50,  prio:'pp',  porta:8956},
  /* DUAS configuracoes hostis, e nao uma, porque as duas recusas nao cabem na mesma: 'maior'
     so e alcancavel com sinal FIXO acima do total, e 'zero' so com PERCENTUAL sobre um total
     minusculo. Uma configuracao so deixaria um dos dois textos emitido e nunca lido. */
  'hostilM': {id:'pac/hostil-maior', sinal:true, tipo:'fixo', valor:100, prio:'pix', porta:8957, hostil:true},
  'hostilZ': {id:'pac/hostil-zero',  sinal:true, tipo:'pct',  valor:1,   prio:'pix', porta:8958, hostil:true}
};

/* Os quatro do meio centavo saem da varredura de 13/09/2026 sobre os OITO subconjuntos
   que contem o pacote; a prova 3 confere, caso a caso, que ele esta mesmo na familia --
   entao um erro de escolha aqui aparece como falha, nunca como cobertura fantasma. */
const A_RODADAS = [
  {cfg:'pct50', pac:'ENS', porta:8961, casos:[
    {n:'so o pacote (meio centavo)',       itens:[0],       ops:[],      cupom:CUPOM.cod},
    {n:'pacote+B (meio centavo)',          itens:[0,1],     ops:[0],     cupom:CUPOM.cod},
    {n:'pacote+D (meio centavo)',          itens:[0,3],     ops:[2],     cupom:CUPOM.cod},
    {n:'pacote+B+C+D (meio centavo)',      itens:[0,1,2,3], ops:[0,1,2], cupom:CUPOM.cod},
    {n:'pacote+B SEM cupom',               itens:[0,1],     ops:[0],     cupom:''},
    {n:'pacote+C (controle, fora da familia)', itens:[0,2], ops:[1],     cupom:CUPOM.cod}
  ]},
  {cfg:'fixo100', pac:'ENS', porta:8962, casos:[
    {n:'pacote+C com cupom',               itens:[0,2],     ops:[1],     cupom:CUPOM.cod},
    {n:'cupom de 100% (pedido em ZERO)',   itens:[0],       ops:[],      cupom:A_CUPOM_ZERA, recusa:'vazio'}
  ]},
  {cfg:'fixo100', pac:'CURTO', porta:8963, casos:[
    {n:'pacote curto (sinal MAIOR que o total)', itens:[1], ops:[],      cupom:CUPOM.cod, recusa:'maior'}
  ]},
  {cfg:'pct1', pac:'MINI', porta:8964, casos:[
    {n:'pacote minimo (sinal arredonda para ZERO)', itens:[4], ops:[],   cupom:'', recusa:'zero'}
  ]},
  {cfg:'pct1', pac:'ENS', porta:8965, casos:[
    {n:'pacote+C com 1% (sem arredondar para zero)', itens:[0,2], ops:[1], cupom:CUPOM.cod}
  ]}
];

/* ============================ os blocos ============================ */
const aBlocos = {};
for(const k of Object.keys(A_CFGS)) aBlocos[k] = await gerarPac(A_CFGS[k]);

/* ===========================================================================
   A AUSENCIA DECLARADA -- medida no TEXTO do bloco entregue
   ===========================================================================
   As duas irmas tem QUATRO consumidores de sinalRecusa(); esta tem TRES, porque
   nao ha resumo copiavel. Se um dia aparecer um resumo aqui, ele nasce sem
   respeitar a recusa (foi o que aconteceu nas irmas, e foi corrigido uma vez) --
   entao a ausencia fica escrita como medida, e nao como comentario.
   =========================================================================== */
{
  const t = aBlocos['pct50'];
  chk('pac/ausencia. o bloco NAO tem resumo copiavel (nenhum TXT_SINAL_RECUSADO)',
      t.indexOf('TXT_SINAL_RECUSADO') < 0);
  chk('pac/ausencia. e nenhum <textarea> de resumo (so o do Copia e Cola do Pix)',
      (t.split('createElement("textarea")').length-1) === 1);
  /* ATE 13/09/2026 ESTA LINHA DIZIA O CONTRARIO. Ela afirmava que "a mensagem de WhatsApp nao
     cita valor nenhum", e isso era verdade porque o botao "Ja paguei" nao existia nesta aba:
     as duas unicas mensagens eram recados de recusa. Com o botao existindo, o que se cobra e o
     oposto -- a mensagem dele CITA valor e identificador, como nas tres irmas.
     O QUE CONTINUA VALENDO E botaoZap NAO SABER DE DINHEIRO: ela recebe a frase PRONTA, e quem
     a monta e zapMsgPago. Se um moedaFmt aparecer dentro dela, a montagem da mensagem passou a
     ter dois donos -- que e o defeito que esta linha vigia desde sempre, so que agora com o
     alvo certo. */
  chk('pac/ausencia. botaoZap continua sem saber de dinheiro (recebe a frase pronta)',
      /function botaoZap\(msg,rot\)\{[\s\S]*?\n\}/.test(t) &&
      t.match(/function botaoZap\(msg,rot\)\{[\s\S]*?\n\}/)[0].indexOf('moedaFmt') < 0);
  chk('pac/ausencia. e a mensagem do "Ja paguei" MONTA os valores num lugar so (zapMsgPago)',
      (t.split('function zapMsgPago(').length-1) === 1 &&
      (t.split('zapMsgPago()').length-1) === 3,
      'declaracoes='+(t.split('function zapMsgPago(').length-1)+
      ' ocorrencias de chamada+declaracao='+(t.split('zapMsgPago()').length-1));
  chk('pac/ausencia. a URL do WhatsApp e montada num lugar so (zapHref)',
      (t.split('function zapHref(').length-1) === 1 &&
      (t.split('https://wa.me/').length-1) === 1,
      'ocorrencias de wa.me no bloco: '+(t.split('https://wa.me/').length-1));
  /* Conta as CHAMADAS, e nao as ocorrencias do nome: a declaracao da funcao e os
     comentarios do bloco tambem trazem "sinalRecusa()" e fariam o numero mentir. Toda
     chamada deste projeto guarda o motivo numa variavel, entao '=sinalRecusa();' e
     exatamente o conjunto dos consumidores. */
  chk('pac/ausencia. os TRES consumidores de sinalRecusa() estao la, e sao TRES',
      (t.split('=sinalRecusa();').length-1) === 3,
      'contei '+(t.split('=sinalRecusa();').length-1));
  chk('pac/ausencia. o quarto consumidor das irmas (o do resumo) nao existe aqui',
      t.indexOf('recR=sinalRecusa();') < 0);
}

/* ============================ os casos ============================ */
for(const rod of A_RODADAS){
  const cfg = A_CFGS[rod.cfg], rot = '['+cfg.id+'/'+rod.pac+'] ';
  console.log('\n== '+rot.trim()+' ==');
  const r = await comBlocoNaPagina({
    bloco: aBlocos[rod.cfg], cabeca: CABECA, porta: rod.porta, busca: buscaDe(rod.pac),
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(300);
      const fora = {};
      for(const caso of rod.casos) fora[caso.n] = await umCasoPac(pg, caso);
      return {fora, fim: await pg.$('#fim-do-documento') !== null};
    }
  });
  chk(rot+'o documento nao foi engolido pelo bloco', r.fim);
  chk(rot+'sem erro de console proprio do bloco',
      errosReais(r.erros||[]).length===0, (r.erros||[]).slice(0,2).join(' | '));

  /* ===== 5. O DESCONTO DO PIX ZERADO, no TEXTO do bloco ===== */
  const txt = aBlocos[rod.cfg];
  chk(rot+'5. totalPix() devolve o SINAL (ramo do meio de fcTotalPixSrc)',
      txt.indexOf('function totalPix(){return sinalAgora();}') >= 0);
  chk(rot+'5. nenhuma outra forma de totalPix foi emitida',
      (txt.split('function totalPix(').length-1) === 1);
  chk(rot+'5. DESCONTO_PIX foi zerado na ORIGEM, mesmo com 5 digitado na aba',
      txt.indexOf('var DESCONTO_PIX=0;') >= 0,
      (txt.match(/var DESCONTO_PIX=[^;]*/)||[''])[0]);

  for(const caso of rod.casos){
    const d = r.fora[caso.n], tag = rot+caso.n+': ';

    /* ===== 2b (encontro com o meio prioritario): nunca duas linhas iguais, nunca selo ===== */
    chk(tag+'a SEGUNDA LINHA de preco nao existe (os dois meios cobram o mesmo sinal)',
        d.temLinha2===false, 'linha2="'+d.linha2+'"');
    chk(tag+'nenhum SELO de desconto no Pix na tela', d.nSelos===0, 'selos='+d.nSelos);
    chk(tag+'as duas linhas do sinal existem', d.temSinal && d.temSaldo);

    /* ---------- os casos de RECUSA ---------- */
    if(caso.recusa){
      const frase = caso.recusa==='maior' ? TXT.maior : (caso.recusa==='zero' ? TXT.zero : null);
      if(caso.recusa === 'vazio'){
        /* PEDIDO ZERADO: sinalRecusa() devolve VAZIO de proposito (primeira guarda) --
           quem avisa e a recusa de total zero, e dois avisos ao mesmo tempo se
           esconderiam. Nesta aba o caminho ate aqui e o CUPOM DE 100%, o unico que
           existe: o pacote e fixo e nao ha o que desmarcar. */
        chk(tag+'4. o botao do Pix recusa (alerta de pedido zerado)',
            d.alertas.length===1 && /zera/i.test(d.alertas[0]), JSON.stringify(d.alertas));
        chk(tag+'4. a area do Pix fica FECHADA', d.pixArea===false);
        chk(tag+'4. o clique do cartao e REJEITADO', d.ppClique==='REJEITADO', String(d.ppClique));
        chk(tag+'4. a linha vermelha do sinal fica APAGADA (decisao registrada na fonte)',
            d.avisoOn===false, 'aviso="'+d.aviso+'"');
        /* ===== O PEDIDO EM ZERO, AGORA COM REGRA ===== (13/09/2026)
           Ate esta data o estado era apenas IMPRESSO: com o pedido em zero sinalRecusa() devolve
           vazio (primeira guarda, de proposito -- quem avisa e a recusa de total zero, e dois
           avisos se esconderiam), e as linhas continuavam desenhadas. O cliente lia tres numeros
           que nao fecham, sem aviso. Nunca foi defeito de cobranca -- as duas pontas recusam, o
           que as assercoes acima verificam -- e sim de LEITURA. O dono autorizou a correcao: as
           linhas do sinal e do saldo so existem quando ha o que pagar. Conserto de TELA, que nao
           toca a conta. */
        /* A FRONTEIRA (total() >= 0.01) NAO TEM TESTE PROPRIO, e a ausencia e medida, nao
           esquecimento: total() ja vem arredondado em centavos (Math.round(x*100)/100), entao
           nao existe valor entre zero e um centavo, e '>0' e '>=0.01' sao indistinguiveis na
           pratica. Um teste na fronteira nao provaria nada que estes dois casos nao provem --
           o carrinho VAZIO (total exatamente 0) esconde, e o caso de R$ 0,49 mostra, o que ja
           derruba qualquer limiar acima de um centavo. */
        chk(tag+'5. a linha do SINAL nao aparece com o pedido em zero',
            d.sinalVis===false, 'sinal="'+d.sinalTxt+'" visivel='+d.sinalVis);
        chk(tag+'5. a linha do SALDO nao aparece com o pedido em zero',
            d.saldoVis===false, 'saldo="'+d.saldoTxt+'" visivel='+d.saldoVis);
        chk(tag+'5. o TOTAL continua aparecendo',
            /0,00/.test(String(d.totalTxt)), String(d.totalTxt));
      }else{
        chk(tag+'4. a linha vermelha acende com a frase certa',
            d.avisoOn===true && d.aviso===frase, 'aviso="'+d.aviso+'" on='+d.avisoOn);
        chk(tag+'4. o botao do Pix recusa com a MESMA frase',
            d.alertas.length===1 && d.alertas[0]===frase, JSON.stringify(d.alertas));
        chk(tag+'4. a area do Pix fica FECHADA', d.pixArea===false);
        chk(tag+'4. o clique do cartao e REJEITADO', d.ppClique==='REJEITADO', String(d.ppClique));
        chk(tag+'4. o cartao mostra a MESMA frase', d.msgPP===frase, 'msg="'+d.msgPP+'"');
      }
      /* O "JA PAGUEI" ESTA NO DOM, mas ESCONDIDO: a area do Pix nao abriu, e o botao mora
         dentro dela. Sem isto, um cliente com o pagamento recusado teria como avisar que
         pagou um codigo que nunca chegou a existir. */
      chk(tag+'C. o "Ja paguei" existe mas fica ESCONDIDO junto com a area do Pix',
          d.zapTem===true && d.zapNaArea===true && d.zapVis===false,
          'tem='+d.zapTem+' naArea='+d.zapNaArea+' visivel='+d.zapVis);
      continue;
    }

    /* ---------- os casos que PASSAM ---------- */
    const e = esperado(caso.itens, caso.cupom===CUPOM.cod, cfg.tipo, cfg.valor);
    const tela = {total:moeda(d.totalTxt), sinal:moeda(d.sinalTxt), saldo:moeda(d.saldoTxt)};

    /* 1. A CONTA, sobre o total ja com cupom. */
    chk(tag+'1. o TOTAL na tela e o subtotal ja com cupom  ('+e.total.toFixed(2)+')',
        tela.total===e.total, 'leu '+d.totalTxt);
    chk(tag+'1. o SINAL na tela sai do total com cupom  ('+e.sinal.toFixed(2)+')',
        tela.sinal===e.sinal, 'leu '+d.sinalTxt);
    chk(tag+'1. o SALDO na tela e total menos sinal  ('+e.saldo.toFixed(2)+')',
        tela.saldo===e.saldo, 'leu '+d.saldoTxt);
    chk(tag+'1. sinal + saldo fecham com o total',
        r2(tela.sinal+tela.saldo)===tela.total, JSON.stringify(tela));

    /* 6. AS LINHAS NA TELA e os rotulos configurados na aba. */
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
        d.pedido && d.pedido.valor===e.sinal.toFixed(2), 'cartao = '+JSON.stringify(d.pedido));
    chk(tag+'2. Pix e cartao cobram o MESMO numero',
        !pix.erro && d.pedido && pix.valor===d.pedido.valor,
        'pix='+(pix.valor||pix.erro)+' cartao='+(d.pedido&&d.pedido.valor));
    chk(tag+'4. sem recusa, o clique do cartao SEGUE', d.ppClique==='SEGUIU', String(d.ppClique));

    /* 3. O ARREDONDAMENTO: o numero cobrado e o do Math.round, e nao o do toFixed. */
    if(caso.n.indexOf('meio centavo') >= 0){
      const bruto = e.total*cfg.valor/100;
      const porFixed = Number(bruto.toFixed(2));
      chk(tag+'3. este caso ESTA mesmo na familia do meio centavo (round '+e.sinal.toFixed(2)+
          ' != toFixed '+porFixed.toFixed(2)+')', e.sinal !== porFixed);
      chk(tag+'3. as tres leituras ficaram com o valor do Math.round',
          tela.sinal===e.sinal && d.pedido.valor===e.sinal.toFixed(2) &&
          (!pix.erro && pix.valor===e.sinal.toFixed(2)));
    }

    /* ===== 3b. O PARCELAMENTO E SOBRE O SINAL (decisao do dono) ===== */
    const parcelaEsperada = Math.ceil(e.sinal/A_PARCELAS*100)/100;
    const parcelaDoTotal  = Math.ceil(e.total/A_PARCELAS*100)/100;
    chk(tag+'3b. a linha da parcela existe (PARCELAS='+A_PARCELAS+')', d.parcela!=null && d.parcela!=='');
    chk(tag+'3b. a parcela e o SINAL dividido  ('+parcelaEsperada.toFixed(2)+')',
        moeda(d.parcela)===parcelaEsperada, 'leu "'+d.parcela+'"');
    chk(tag+'3b. e NAO o total dividido  ('+parcelaDoTotal.toFixed(2)+')',
        parcelaEsperada===parcelaDoTotal || moeda(d.parcela)!==parcelaDoTotal,
        'leu "'+d.parcela+'"');

    /* ===== 6. O "JA PAGUEI" E AS TRES LINHAS DA MENSAGEM (13/09/2026) =====
       Lida da URL do wa.me que o PROPRIO botao carrega -- e nao de uma variavel do bloco.
       Aqui o botao e uma ANCORA (target=_blank), e nao um window.open como nas duas irmas:
       o que o cliente manda e literalmente o que esta no href. */
    const msg = zapMsg(d.zapHref), idPac = idDe(rod.pac);
    chk(tag+'6. o "Ja paguei" existe, dentro da area do Pix e logo depois do aviso',
        d.zapTem && d.zapNaArea && d.zapDepoisDoAviso,
        'tem='+d.zapTem+' naArea='+d.zapNaArea+' depoisDoAviso='+d.zapDepoisDoAviso);
    chk(tag+'6. com o Pix gerado ele esta VISIVEL', d.zapVis===true);
    chk(tag+'6. o rotulo e o campo da aba', d.zapTexto===TXT.zapPago, 'leu "'+d.zapTexto+'"');
    chk(tag+'6. a abertura e a do SINAL (e nao a de pagamento inteiro)',
        msg.indexOf(TXT.zapAberturaSinal)===0, msg.split('\n')[0]);
    chk(tag+'6. a mensagem traz o IDENTIFICADOR da reserva ('+idPac+')',
        msg.indexOf('ZAPPEDIDO: *'+idPac+'*')>=0, msg.split('\n')[1]);
    chk(tag+'6. e e o MESMO identificador que foi para o codigo Pix (campo 62/05)',
        !pix.erro && pix.txid===idPac, 'txid do payload = '+(pix.txid||pix.erro));
    chk(tag+'6. e o MESMO que o pedido ao cartao leva',
        d.pedido && d.pedido.custom===idPac, 'custom_id='+(d.pedido&&d.pedido.custom));
    chk(tag+'6. linha do TOTAL na mensagem, com o numero da TELA',
        msg.indexOf('ZAPTOTAL: '+d.totalTxt)>=0, 'procurava "ZAPTOTAL: '+d.totalTxt+'"');
    chk(tag+'6. linha do SINAL na mensagem, com o numero da TELA',
        msg.indexOf('ZAPSINAL: *'+d.sinalTxt+'*')>=0, 'procurava "ZAPSINAL: *'+d.sinalTxt+'*"');
    chk(tag+'6. linha do SALDO na mensagem, com o numero da TELA',
        msg.indexOf('ZAPSALDO: *'+d.saldoTxt+'*')>=0, 'procurava "ZAPSALDO: *'+d.saldoTxt+'*"');
    chk(tag+'6. as tres saem nesta ordem: total, sinal, saldo',
        msg.indexOf('ZAPTOTAL') < msg.indexOf('ZAPSINAL') &&
        msg.indexOf('ZAPSINAL') < msg.indexOf('ZAPSALDO'));
    chk(tag+'6. o ramo SEM sinal (linha do valor pago) nao aparece junto',
        msg.indexOf('ZAPVALOR')<0);
    /* O rotulo da TELA nao pode vazar para a mensagem: sao campos diferentes de proposito. */
    chk(tag+'6. o rotulo da tela nao vaza para a mensagem',
        msg.indexOf(TXT.t9+':')<0 && msg.indexOf(TXT.t8+':')<0);
    /* A terceira linha e o pacote: o NOME exato dele, e o preco CHEIO (o do catalogo), nao o
       do carrinho -- os opcionais e o cupom entram nas linhas seguintes e no total. O numero
       e comparado ja lido de volta (moeda()), para a assercao nao depender do formato da
       moeda que o bloco escolheu escrever. */
    const linhaPac = msg.split('\n')[2] || '';
    chk(tag+'6. a terceira linha e o PACOTE desta reserva, pelo nome exato',
        linhaPac.indexOf('- *'+A_PACS[rod.pac].nome+'* ')===0, 'leu "'+linhaPac+'"');
    chk(tag+'6. e com o preco CHEIO do catalogo ('+A_PACS[rod.pac].preco+')',
        moeda(linhaPac)===parseFloat(A_PACS[rod.pac].preco), 'leu "'+linhaPac+'"');
    chk(tag+'6. os opcionais marcados aparecem, e so eles',
        (msg.split('\n   + ').length-1) === (caso.ops||[]).length,
        'marcados='+(caso.ops||[]).length+' na mensagem='+(msg.split('\n   + ').length-1));
    chk(tag+'6. a linha do CUPOM aparece exatamente quando ha cupom',
        (msg.indexOf('ZAPCUPOM: '+caso.cupom)>=0) === !!caso.cupom, msg);
    /* Com sinal ligado aCfg zera o desconto do Pix NA ORIGEM -- entao a linha dele nao pode
       existir nem no bloco nem na mensagem. */
    chk(tag+'6. NENHUMA linha de desconto do Pix (o sinal o zerou na origem)',
        msg.indexOf('ZAPDESC')<0 && txt.indexOf('ZAPDESC')<0);
  }
}

/* ===========================================================================
   O ENCONTRO COM O MEIO PRIORITARIO, e o IDENTIFICADOR IMUNE AO SINAL
   ===========================================================================
   As QUATRO combinacoes de (meio prioritario x sinal), medidas no DOM da mesma
   reserva -- mesmo pacote, mesmo horario, mesmo endereco.

   O QUE SE MEDE, e por que cada coisa:

     - SEM sinal: existem DOIS numeros a vista (o do Pix e o cheio) e UM selo, e
       os dois numeros sao DIFERENTES. E o estado que a rodada do meio prioritario
       entregou, e ele nao pode ter sido desfeito por esta.
     - COM sinal: existe UM numero so, NENHUM selo e NENHUMA segunda linha. Duas
       linhas com o mesmo numero, ou um selo dizendo -0%, nao podem chegar ao
       cliente -- e com o desconto zerado as duas pecas passariam a dizer
       exatamente isso.
     - O IDENTIFICADOR DE CONCILIACAO e o MESMO nas quatro, e continua o mesmo
       depois de RECARREGAR a pagina e depois de MEXER no carrinho. Ele e lido de
       onde o cliente de fato o manda (o custom_id do pedido ao SDK), e nao de
       uma variavel interna do bloco -- a variavel poderia estar certa e o pedido
       sair errado.
   =========================================================================== */
console.log('\n== pac: meio prioritario x sinal, e o identificador ==');

/* O identificador esperado, escrito por extenso: PREFIXO + codigo do pacote +
   os digitos de 'data' e 'hora' como chegaram na URL (diaHoraId). Escrito a mao
   de proposito -- se ele passar a sair de uma funcao do projeto, o teste deixa de
   ter opiniao propria sobre ele. */
const A_ID_ESPERADO = 'FC' + A_PAC_ENS.cod + A_DATA.replace(/\D/g,'') + A_HORA.replace(/\D/g,'');

const A_MATRIZ = [
  {k:'offpix',  rot:'Pix primeiro / SEM sinal',   sinal:false, prio:'pix', porta:8971},
  {k:'pct50',   rot:'Pix primeiro / COM sinal',   sinal:true,  prio:'pix', porta:8972},
  {k:'offpp',   rot:'cartao primeiro / SEM sinal',sinal:false, prio:'pp',  porta:8973},
  {k:'pct50pp', rot:'cartao primeiro / COM sinal',sinal:true,  prio:'pp',  porta:8974}
];

const idsDaMatriz = [];
for(const m of A_MATRIZ){
  const tag = 'pac['+m.rot+'] ';
  const r = await comBlocoNaPagina({
    bloco: aBlocos[m.k], cabeca: CABECA, porta: m.porta, busca: buscaDe(A_PAC_ENS.cod),
    medir: async pg => {
      await pg.waitForTimeout(300);
      const inicial = await lerPac(pg);
      /* RECARREGAR: o identificador nao pode depender de quantas vezes a pagina abriu.
         Foi o defeito mais caro daquela rodada -- um sufixo sorteado por carregamento
         enchia o extrato de cobrancas fantasma. */
      await pg.reload({waitUntil:'load'});
      await pg.waitForTimeout(300);
      const recarregado = await lerPac(pg);
      /* MEXER NO CARRINHO: marcar um opcional e aplicar cupom muda o dinheiro, e nao
         pode mudar o identificador -- ele foi calculado antes de o carrinho existir. */
      await carrinhoPac(pg,[0]);
      await pg.waitForTimeout(60);
      await aplicarCupom(pg,'fca-ob',CUPOM.cod);
      await pg.waitForTimeout(100);
      const mexido = await lerPac(pg);
      return {inicial, recarregado, mexido};
    }
  });
  chk(tag+'sem erro de console proprio do bloco',
      errosReais(r.erros||[]).length===0, (r.erros||[]).slice(0,2).join(' | '));

  const d = r.inicial;
  if(m.sinal){
    chk(tag+'2b. NENHUMA segunda linha de preco', d.temLinha2===false, 'linha2="'+d.linha2+'"');
    chk(tag+'2b. NENHUM selo de desconto no Pix', d.nSelos===0, 'selos='+d.nSelos);
    chk(tag+'2b. as duas linhas do sinal estao la', d.temSinal===true && d.temSaldo===true);
    chk(tag+'2b. o numero grande e o TOTAL (nao ha preco de Pix separado)',
        moeda(d.totalTxt)===CAT[0].v, 'leu '+d.totalTxt);
  }else{
    chk(tag+'2b. a segunda linha de preco existe', d.temLinha2===true);
    chk(tag+'2b. UM selo de desconto no Pix', d.nSelos===1, 'selos='+d.nSelos);
    chk(tag+'2b. os DOIS numeros estao a vista, e sao diferentes',
        moeda(d.totalTxt)!=null && moeda(d.linha2)!=null && moeda(d.totalTxt)!==moeda(d.linha2),
        'linha1='+d.totalTxt+'  linha2="'+d.linha2+'"');
    chk(tag+'2b. nenhuma linha do sinal', d.temSinal===false && d.temSaldo===false);
    chk(tag+'2b. o selo nao diz "-0%"', String(d.linha2||'').indexOf('-0%')<0 &&
        String(d.totalTxt||'').indexOf('-0%')<0);
  }

  /* ===== 4. O IDENTIFICADOR ===== */
  chk(tag+'ID. o pedido ao cartao leva o identificador esperado ('+A_ID_ESPERADO+')',
      d.pedido && d.pedido.custom===A_ID_ESPERADO, 'custom_id='+(d.pedido&&d.pedido.custom));
  /* O 'sku' DEIXOU DE CARREGAR O IDENTIFICADOR em 14/09/2026 (leva 7), e a mudanca e a
     correcao de um defeito que o dono relatou: ate ali TODA linha do pedido levava o mesmo
     'sku' -- o codigo do pedido --, e a coluna "ID do produto" do relatorio repetia o mesmo
     texto em toda linha. Agora o 'sku' e o SKU DAQUELE item, cadastrado pelo operador, e este
     cenario nao cadastra nenhum: a linha tem de sair SEM O CAMPO.
     O QUE ESTA PROVA CONTINUA DIZENDO e o que ela sempre disse -- que o identificador de
     conciliacao chega ao pedido --, so que agora por UM caminho, o custom_id (a linha acima),
     que e o campo que existe para isso. O caminho COM SKU cadastrado tem prova propria em
     sku-por-item.mjs. */
  chk(tag+'ID. e a linha NAO leva sku (sem SKU cadastrado, ela sai sem o campo)',
      d.pedido && d.pedido.temSku===false, 'sku='+JSON.stringify(d.pedido&&d.pedido.sku));
  chk(tag+'ID. RECARREGAR a pagina nao muda o identificador',
      r.recarregado.pedido && r.recarregado.pedido.custom===A_ID_ESPERADO,
      'depois da recarga: '+(r.recarregado.pedido&&r.recarregado.pedido.custom));
  chk(tag+'ID. mexer no carrinho (opcional + cupom) nao muda o identificador',
      r.mexido.pedido && r.mexido.pedido.custom===A_ID_ESPERADO,
      'depois de mexer: '+(r.mexido.pedido&&r.mexido.pedido.custom));
  chk(tag+'ID. e o dinheiro MUDOU nessa mesma passagem (senao a prova acima nao mediu nada)',
      r.mexido.pedido && d.pedido && r.mexido.pedido.valor!==d.pedido.valor,
      'antes='+(d.pedido&&d.pedido.valor)+'  depois='+(r.mexido.pedido&&r.mexido.pedido.valor));
  idsDaMatriz.push(d.pedido && d.pedido.custom);

  /* O identificador nao pode sequer CONTER o sinal: nem o valor, nem a marca. */
  const txt = aBlocos[m.k];
  chk(tag+'ID. idConciliacao nao le nada do carrinho nem do sinal',
      /function idConciliacao\(pac,dataCru,horaCru,reserva\)\{[\s\S]*?\n\}/.test(txt) &&
      (function(){
        const corpo = txt.match(/function idConciliacao\(pac,dataCru,horaCru,reserva\)\{[\s\S]*?\n\}/)[0];
        return corpo.indexOf('sinal')<0 && corpo.indexOf('total')<0 && corpo.indexOf('cupom')<0;
      })());
}
chk('pac/ID. as QUATRO combinacoes (meio prioritario x sinal) dao o MESMO identificador',
    idsDaMatriz.length===4 && idsDaMatriz.every(x => x===A_ID_ESPERADO),
    JSON.stringify(idsDaMatriz));


/* ===========================================================================
   O "JA PAGUEI": A POSICAO, A MENSAGEM SEM SINAL, O CUPOM E O WHATSAPP VAZIO
   ===========================================================================
   Ate 13/09/2026 esta aba mostrava o Pix ao cliente e NAO tinha o botao que as tres
   irmas tem dentro da area do Pix. Nao era decisao -- era omissao, herdada de quando
   a aba foi construida espelhando o Checkout. Esta secao mede o que a correcao
   entregou, no ramo que o laco de casos acima nao alcanca (aquele so roda com sinal).

   O QUE SO SE MEDE AQUI, e por que:

     - A POSICAO NO DOM. "Dentro da area do Pix" e uma afirmacao sobre o parentesco dos
       elementos, e nao sobre a folha de estilo -- e a consequencia dela e a que importa:
       ANTES de "Gerar Pix" nao existe botao visivel para avisar pagamento nenhum.
       Medida nos dois instantes, e nao so depois.
     - O RAMO SEM SINAL da mensagem (a linha unica do valor pago, mais a linha do
       desconto do Pix, que com sinal ligado nao existe).
     - O CUPOM entrando e o dinheiro MUDANDO enquanto o identificador NAO muda. Sem o
       lado "o dinheiro mudou", "o identificador continuou igual" nao mede nada.
     - O IDENTIFICADOR lido de TRES lugares na mesma passagem -- a mensagem, o campo
       62/05 do payload Pix e o custom_id do pedido ao cartao. Os tres tem de dizer a
       mesma coisa: e ele que o dono usa para achar a cobranca no extrato, e o defeito
       mais caro da rodada daquela aba foi exatamente um identificador que variava.
     - O ESTADO SEM WHATSAPP. A aba RECUSA gerar sem WhatsApp (aRecusa), entao esse
       estado so existe editando o bloco publicado a mao -- que e o mesmo caminho ja
       medido para UPSELL_ATIVO. Sem WHATSAPP, botaoZap devolve null e NENHUM dos tres
       botoes existe; a prova aqui e que nenhum elemento carrega a classe.
   =========================================================================== */
console.log('\n== pac: o "Ja paguei" -- posicao, mensagem sem sinal, cupom e WhatsApp vazio ==');
{
  const idPac = idDe(A_PAC_ENS.cod);
  const r = await comBlocoNaPagina({
    bloco: aBlocos['offpix'], cabeca: CABECA, porta: 8981, busca: buscaDe(A_PAC_ENS.cod),
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(300);
      const antes = await lerPac(pg);                   /* ANTES de gerar o Pix */
      await pg.click(A_BT_PIX);
      await pg.waitForTimeout(150);
      const limpo = await lerPac(pg);                   /* gerado: so o pacote */
      await carrinhoPac(pg,[0]);                        /* marca um opcional */
      await pg.waitForTimeout(60);
      await aplicarCupom(pg,'fca-ob',CUPOM.cod);
      await pg.waitForTimeout(100);
      const mexido = await lerPac(pg);                  /* mexer fecha a area de novo */
      await pg.click(A_BT_PIX);
      await pg.waitForTimeout(150);
      const comCupom = await lerPac(pg);
      return {antes, limpo, mexido, comCupom, fim: await pg.$('#fim-do-documento') !== null};
    }
  });
  const tag = 'pac[C] ';
  chk(tag+'o documento nao foi engolido pelo bloco', r.fim);
  chk(tag+'sem erro de console proprio do bloco',
      errosReais(r.erros||[]).length===0, (r.erros||[]).slice(0,2).join(' | '));

  /* ---- a posicao, nos dois instantes ---- */
  chk(tag+'o botao existe no DOM', r.antes.zapTem===true);
  chk(tag+'e e uma ANCORA com target=_blank (e nao um window.open como nas duas irmas)',
      r.antes.zapTag==='A' && r.antes.zapAlvo==='_blank',
      'tag='+r.antes.zapTag+' target='+r.antes.zapAlvo);
  chk(tag+'mora DENTRO da area do Pix', r.antes.zapNaArea===true);
  chk(tag+'logo depois do aviso de que o Pix nao confirma sozinho',
      r.antes.zapDepoisDoAviso===true);
  chk(tag+'ANTES de "Gerar Pix" ele NAO esta visivel', r.antes.zapVis===false);
  chk(tag+'DEPOIS de "Gerar Pix" ele esta visivel', r.limpo.zapVis===true);
  chk(tag+'mexer no carrinho esconde a area, e o botao junto',
      r.mexido.zapVis===false, 'visivel='+r.mexido.zapVis);
  chk(tag+'ha UM so botao com a classe', r.limpo.zapQuantos===1, 'achei '+r.limpo.zapQuantos);
  chk(tag+'o rotulo e o campo da aba', r.limpo.zapTexto===TXT.zapPago, 'leu "'+r.limpo.zapTexto+'"');

  /* ---- a mensagem SEM sinal, sem cupom ---- */
  const m1 = zapMsg(r.limpo.zapHref), l1 = m1.split('\n');
  const pix1 = lerPayload(r.limpo.payload);
  chk(tag+'a abertura e a do pagamento inteiro (e nao a do sinal)',
      l1[0]===TXT.zapAbertura, 'leu "'+l1[0]+'"');
  chk(tag+'a segunda linha e o IDENTIFICADOR da reserva ('+idPac+')',
      l1[1]==='ZAPPEDIDO: *'+idPac+'*', 'leu "'+l1[1]+'"');
  chk(tag+'a terceira e o PACOTE, com o preco cheio',
      l1[2].indexOf('- *'+A_PAC_ENS.nome+'* ')===0 && moeda(l1[2])===parseFloat(A_PAC_ENS.preco),
      'leu "'+l1[2]+'"');
  chk(tag+'nenhum opcional na mensagem (nenhum foi marcado)',
      m1.indexOf('\n   + ')<0, m1);
  chk(tag+'nenhuma linha de CUPOM (nenhum foi aplicado)', m1.indexOf('ZAPCUPOM')<0, m1);
  chk(tag+'a linha do DESCONTO DO PIX aparece (descpix=5, sem sinal)',
      m1.indexOf('ZAPDESC: -5%')>=0, m1);
  chk(tag+'a linha do VALOR PAGO traz o numero da TELA',
      m1.indexOf('ZAPVALOR: *'+r.limpo.totalTxt+'*')>=0,
      'procurava "ZAPVALOR: *'+r.limpo.totalTxt+'*" em '+JSON.stringify(l1));
  chk(tag+'e NENHUMA das tres linhas do sinal (esta passagem nao cobra sinal)',
      m1.indexOf('ZAPTOTAL')<0 && m1.indexOf('ZAPSINAL')<0 && m1.indexOf('ZAPSALDO')<0, m1);
  chk(tag+'o identificador da mensagem e o do codigo Pix (campo 62/05)',
      !pix1.erro && pix1.txid===idPac, 'txid='+(pix1.txid||pix1.erro));
  chk(tag+'e o do pedido ao cartao (custom_id)',
      r.limpo.pedido && r.limpo.pedido.custom===idPac,
      'custom_id='+(r.limpo.pedido&&r.limpo.pedido.custom));

  /* ---- a mensagem COM cupom e com um opcional ---- */
  const m2 = zapMsg(r.comCupom.zapHref);
  const pix2 = lerPayload(r.comCupom.payload);
  chk(tag+'com cupom: a linha do cupom aparece, com o codigo',
      m2.indexOf('ZAPCUPOM: '+CUPOM.cod)>=0, m2);
  chk(tag+'com cupom: o opcional marcado aparece na lista, e e UM so',
      (m2.split('\n   + ').length-1)===1 && m2.indexOf('   + '+A_OPS[0].nome+' ')>=0, m2);
  chk(tag+'com cupom: a linha do valor pago acompanha a TELA',
      m2.indexOf('ZAPVALOR: *'+r.comCupom.totalTxt+'*')>=0,
      'procurava "ZAPVALOR: *'+r.comCupom.totalTxt+'*"');
  chk(tag+'o DINHEIRO mudou entre as duas passagens (senao a prova seguinte nao mede nada)',
      r.limpo.totalTxt!==r.comCupom.totalTxt && !pix1.erro && !pix2.erro &&
      pix1.valor!==pix2.valor,
      'tela '+r.limpo.totalTxt+' -> '+r.comCupom.totalTxt+
      '  |  campo 54 '+pix1.valor+' -> '+pix2.valor);
  chk(tag+'e o IDENTIFICADOR NAO mudou, nos tres lugares',
      m2.indexOf('ZAPPEDIDO: *'+idPac+'*')>=0 && pix2.txid===idPac &&
      r.comCupom.pedido && r.comCupom.pedido.custom===idPac,
      'mensagem/'+(m2.split('\n')[1])+'  payload/'+pix2.txid+
      '  cartao/'+(r.comCupom.pedido&&r.comCupom.pedido.custom));
}

/* ---- O ESTADO SEM WHATSAPP, editado A MAO no bloco publicado ---- */
{
  const tag = 'pac[C/sem WhatsApp] ';
  const base = aBlocos['offpix'];
  const semZap = base.replace(/var WHATSAPP='[^']*';/, "var WHATSAPP='';");
  chk(tag+'a troca a mao pegou (uma declaracao de WHATSAPP, e ela ficou vazia)',
      (base.split("var WHATSAPP='").length-1)===1 && semZap.indexOf("var WHATSAPP='';")>=0 &&
      semZap!==base);
  const r = await comBlocoNaPagina({
    bloco: semZap, cabeca: CABECA, porta: 8982, busca: buscaDe(A_PAC_ENS.cod),
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(300);
      await pg.click(A_BT_PIX);
      await pg.waitForTimeout(150);
      const d = await lerPac(pg);
      /* Nenhuma ancora sobrando na area do Pix -- nem com a classe, nem sem ela. */
      const ancoras = await pg.$$eval('.fca-ob-pixarea a', els => els.length);
      return {d, ancoras, fim: await pg.$('#fim-do-documento') !== null};
    }
  });
  chk(tag+'o bloco continua carregando e desenhando', r.fim && r.d.pixArea===true);
  chk(tag+'sem erro de console proprio do bloco',
      errosReais(r.erros||[]).length===0, (r.erros||[]).slice(0,2).join(' | '));
  chk(tag+'NENHUM elemento carrega a classe do "Ja paguei"',
      r.d.zapQuantos===0 && r.d.zapTem===false, 'achei '+r.d.zapQuantos);
  chk(tag+'e nenhuma ancora sobrou dentro da area do Pix', r.ancoras===0, 'achei '+r.ancoras);
  chk(tag+'o Pix continua sendo gerado normalmente (a falta do botao nao trava nada)',
      r.d.payload.length>40 && !lerPayload(r.d.payload).erro);
  /* A REGRA DE CSS CONTINUA NO BLOCO, e isto e limite DECLARADO e nao defeito: quem decide
     se ha botao e o WHATSAPP em tempo de EXECUCAO, e a ferramenta recusa gerar sem ele
     (aRecusa) -- entao no caminho que a ferramenta produz a classe nunca fica orfa. O bloco
     editado a mao e o unico estado em que ela fica, e vale o mesmo para as classes dos dois
     recados de recusa, que ja eram assim antes desta rodada. */
  chk(tag+'a regra de CSS continua emitida (limite declarado: quem decide e o WHATSAPP, em execucao)',
      semZap.indexOf('.fca-ob-zap{')>=0);
}

/* ===========================================================================
   O TEXTO HOSTIL nos campos do sinal e nos do "Ja paguei", com o bloco RODANDO
   ===========================================================================
   A regressao byte a byte nao alcanca isto: com os padroes de fabrica -- que nao tem
   apostrofa, barra invertida nem '</script' -- a saida e identica com ou sem o escape.
   So um valor hostil denuncia um escJs esquecido, e a denuncia e barulhenta: o literal
   fecha no meio e o bloco inteiro deixa de carregar (o 'fim-do-documento' some junto).
   =========================================================================== */
console.log('\n== pac: texto hostil nos campos do sinal e nos do "Ja paguei" ==');
for(const h of [{k:'hostilM', pac:A_PAC_CURTO.cod, recusa:'maior', porta:8975},
                {k:'hostilZ', pac:A_PAC_MINI.cod,  recusa:'zero',  porta:8976}]){
  const cfg = A_CFGS[h.k], tag = '['+cfg.id+'] ';
  const frase = h.recusa==='maior' ? A_HOSTIL.maior : A_HOSTIL.zero;
  const r = await comBlocoNaPagina({
    bloco: aBlocos[h.k], cabeca: CABECA, porta: h.porta, busca: buscaDe(h.pac),
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(300);
      await pg.click(A_BT_PIX);
      await pg.waitForTimeout(150);
      return {d: await lerPac(pg), fim: await pg.$('#fim-do-documento') !== null};
    }
  });
  /* O DOCUMENTO INTEIRO e a medida do '</script': se ele nao foi blindado, a marcacao
     fecha o <script> do bloco no meio e o que vem depois vira texto solto. */
  chk(tag+'o documento nao foi cortado pelo "</script" dentro do texto', r.fim);
  chk(tag+'o bloco carregou sem erro de console', errosReais(r.erros||[]).length===0,
      (r.erros||[]).slice(0,2).join(' | '));
  const d = r.d;
  chk(tag+'o rotulo do sinal chega INTEIRO a tela',
      d.sinalRot === A_HOSTIL.t8 + (cfg.tipo==='pct' ? ' ('+cfg.valor+'%)' : ''),
      'leu "'+d.sinalRot+'"');
  chk(tag+'o rotulo do saldo chega INTEIRO a tela', d.saldoRot === A_HOSTIL.t9,
      'leu "'+d.saldoRot+'"');
  chk(tag+'a linha vermelha traz a frase hostil INTEIRA',
      d.avisoOn===true && d.aviso===frase, 'leu "'+d.aviso+'"');
  chk(tag+'o botao do Pix recusa com a MESMA frase hostil',
      d.alertas.length===1 && d.alertas[0]===frase, JSON.stringify(d.alertas));
  chk(tag+'o cartao mostra a MESMA frase hostil', d.msgPP===frase, 'msg="'+d.msgPP+'"');
  chk(tag+'e o pagamento fica travado nas duas pontas',
      d.pixArea===false && d.ppClique==='REJEITADO', String(d.ppClique));

  /* ===== OS CAMPOS DO "JA PAGUEI" (13/09/2026), pelos DOIS caminhos de escape =====
     O rotulo e a abertura passam por escJsD direto; a linha do identificador passa por
     aTplJs, que PARTE o texto no marcador e escapa cada pedaco -- um esquecimento em
     qualquer dos dois fecha o literal de aspas duplas no meio e nada carrega (e por isso a
     medida do 'fim-do-documento', acima, tambem cobre estes).
     A AREA DO PIX NAO ABRE nestas duas configuracoes (as duas terminam em recusa), entao o
     endereco lido e o que pix() montou ao desenhar -- que e justamente o estado em que o
     texto configurado chega ao bloco. O VALOR do saldo nao e comparado aqui de proposito:
     quem o compara e o laco de casos, com a tela ao lado; o que se mede aqui e o TEXTO. */
  const msgH = zapMsg(d.zapHref);
  chk(tag+'o rotulo do "Ja paguei" chega INTEIRO', d.zapTexto===A_HOSTIL.zapPago,
      'leu "'+d.zapTexto+'"');
  chk(tag+'a abertura hostil (com sinal) abre a mensagem, INTEIRA',
      msgH.indexOf(A_HOSTIL.zapAbreS)===0, 'leu "'+msgH.split('\n')[0]+'"');
  chk(tag+'a linha do identificador, PARTIDA por aTplJs, chega INTEIRA',
      msgH.indexOf(A_HOSTIL.zapPedido.replace('{cod}', idDe(h.pac)))>=0,
      'leu "'+msgH.split('\n')[1]+'"');
  chk(tag+'a linha do saldo hostil chega INTEIRA ate o marcador',
      msgH.indexOf(A_HOSTIL.zapSaldo.split('{valor}')[0])>=0, msgH);
  chk(tag+'e o "</script" nao vazou para a mensagem cru (o bloco inteiro carregou)',
      msgH.indexOf('</script')>=0 && r.fim===true);
}

process.exit(resumo());
