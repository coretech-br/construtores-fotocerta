/* ============================================================================
   OS ITENS QUE VAO PARA O RELATORIO DO PAYPAL -- a conta fecha ao centavo?
   ============================================================================
   O QUE ESTA EM JOGO. Ate 13/09/2026 as tres abas com catalogo mandavam ao
   PayPal UM item so, com os nomes concatenados. Agora mandam um item por linha,
   com quantidade e preco unitario. A armadilha esta na especificacao do proprio
   PayPal (checkout_orders_v2, info.version 2.32, lida e nao lembrada):

     AMOUNT_MISMATCH      "Should equal item_total + tax_total + shipping +
                          handling + insurance - shipping_discount - discount."
     ITEM_TOTAL_MISMATCH  "Should equal sum of (unit_amount * quantity) across
                          all items for a given purchase_unit."

   Os dois sao 422 UNPROCESSABLE_ENTITY: o pedido NAO E CRIADO. Nao e um aviso
   no recibo -- e o cliente sem meio de pagamento, na hora de pagar. Por isso
   este arquivo mede as duas igualdades EM CENTAVOS INTEIROS, e mede as duas
   somando os itens AQUI, nunca lendo o campo que o bloco escreveu.

   A SEGUNDA OPINIAO E O METODO. Este teste nao chama nenhuma funcao do bloco
   para conferir o bloco: ele pede ao createOrder do proprio bloco o pedido
   pronto e refaz a aritmetica por fora. Se o teste e o bloco somassem pelo
   mesmo caminho, o teste nao teria opiniao nenhuma -- e esse e o mesmo criterio
   ja escrito em sinal.mjs.

   O CATALOGO E O MESMO DE sinal.mjs, E O CRITERIO ESTA DECLARADO. Os cinco
   precos (113.70 / 29.60 / 425.55 / 341.45 / 0.49) sao os que a varredura de
   ago-set/2026 escolheu: sao eles que produzem a "familia do meio centavo",
   onde toFixed(2) e Math.round discordam em um centavo. Reaproveita-los aqui
   nao e economia -- e medir o desenho novo nos numeros mais hostis que este
   projeto ja encontrou. Mas a familia daquela varredura nasceu do SINAL de 50%
   sobre um total de centavos impares, e com sinal esta rodada NAO itemiza (ver
   a decisao, abaixo). Entao a familia relevante para o caminho itemizado e
   outra, e ela e DERIVADA aqui, com o criterio a vista:

     um cupom percentual de 25% sobre um subtotal de C centavos desconta C/4
     centavos; isso cai em meio centavo exato quando C mod 4 === 2.

   Dos subconjuntos do catalogo, tres caem nessa conta -- {A}, {A,B}, {A,C,D} --
   e o teste CONFERE caso a caso que cada um esta mesmo la (prova "familia"),
   para um erro de escolha aparecer como falha e nunca como cobertura fantasma.
   {A,B,C,D} entra como CONTROLE, fora da familia.

   A DECISAO SOBRE O SINAL, medida e nao presumida. Com sinal o cliente paga uma
   fracao do pedido, e o formato do PayPal nao tem campo para entrada. Itemizar
   obrigaria a jogar a diferenca em 'discount' -- e o recibo que o cliente
   guarda chamaria de DESCONTO o saldo que ele ainda deve, num valor grande e
   visivel. As tres abas continuam mandando a linha unica quando ha sinal, e
   este arquivo prova os dois lados: com sinal, um item so e nenhum desconto.

   ROTEIRO: node scripts/verificar/paypal-itens.mjs
   Precisa de Node e Playwright -- ver lib.mjs, que diz o que instalar.
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, radio, clicar } from './lib.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
/* A REFERENCIA ESTA PRESA, e o envelhecimento tem de APARECER. Commit fixo porque a
   afirmacao e sobre um estado concreto -- "o caminho do sinal sai igual ao que saia
   ANTES desta rodada" --, e uma referencia movel (main) diria coisas diferentes a cada
   semana sem ninguem perceber. Quando ela nao existir mais, ou nao tiver os campos que
   este roteiro preenche, o teste diz NAO MEDIU em vez de passar calado: prova que nao
   mede e pior que prova nenhuma, porque conta como cobertura. */
const REF = process.argv[2] || 'd5c44ed';

/* ===========================================================================
   O CATALOGO
   =========================================================================== */
const CAT = [
  {nome:'Ensaio A', preco:'113.70', v:113.70},
  {nome:'Ensaio B', preco:'29.60',  v:29.60},
  {nome:'Ensaio C', preco:'425.55', v:425.55},
  {nome:'Ensaio D', preco:'341.45', v:341.45}
];
/* O NOME HOSTIL vai no PRIMEIRO produto e no PRIMEIRO opcional, e nao num caso
   separado: assim ele atravessa TODOS os casos deste arquivo em vez de um so.
   Ele carrega os quatro caracteres que quebram os quatro caminhos de escape da
   ferramenta -- apostrofa, aspas duplas, barra invertida e '</script' --, que e
   a mesma lista de textos-escape.mjs. Um escape que falte fecha o literal ou o
   <script> no meio, e o bloco inteiro nao carrega. */
const HOSTIL_P = 'Ensaio "A" \\ é <b>o\'melhor</b> </script> & cia';
const HOSTIL_O = 'Albúm 20x30 "luxo" \\ <\/script> & o\'outro';
const OPS = [
  {nome:HOSTIL_O, preco:'20.00', v:20.00, qtd:true},
  {nome:'Brinde da casa', preco:'0',     v:0.00, qtd:false},
  {nome:'Moldura',        preco:'29.60', v:29.60, qtd:false}
];
const CUPONS = [
  {cod:'DEZ',  tipo:'pct_total', valor:'10', pct:10},
  /* 25% e o percentual que poe o DESCONTO em meio centavo neste catalogo -- ver
     o criterio no cabecalho. Sem ele, o caminho itemizado nunca seria medido
     num numero quebrado, e a prova valeria so para os totais faceis. */
  {cod:'MEIO', tipo:'pct_total', valor:'25', pct:25},
  {cod:'SETE', tipo:'fixo',      valor:'7',  fixo:7},
  /* O CUPOM QUE DESCONTA SO OS PRODUTOS (pct_produto) e o caso que mais castiga
     este desenho: o desconto NAO e um percentual do item_total -- ele ignora os
     opcionais, que estao dentro dele. Um desenho que recalculasse o percentual
     para achar o 'discount' erraria aqui por muito mais que um centavo. Como
     ele sai da DIFERENCA item_total - amount, a conta fecha do mesmo jeito, e e
     isto que esta linha prova. */
  {cod:'PROD', tipo:'pct_produto', valor:'20', pctProd:20}
];
const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};

/* ===========================================================================
   A ARITMETICA DO TESTE -- escrita de novo, de proposito (segunda opiniao)
   =========================================================================== */
const cent = x => Math.round(x*100);
/* Subtotal em centavos, somando as linhas como o cliente as escolheu. */
function subC(linhas){ return linhas.reduce((s,l)=>s+cent(l.unit)*l.qtd, 0); }
function totalC(linhas, cupom){
  const sub = subC(linhas);
  /* somaProdutos(): o que 'pct_produto' desconta -- os produtos, sem os opcionais */
  const prod = linhas.filter(l=>!l.opcional).reduce((s,l)=>s+cent(l.unit)*l.qtd, 0);
  let d = 0;
  if(cupom && cupom.pct!=null) d = Math.round(sub*cupom.pct/100);
  else if(cupom && cupom.pctProd!=null) d = Math.round(prod*cupom.pctProd/100);
  else if(cupom && cupom.fixo!=null) d = cent(cupom.fixo);
  if(d>sub) d = sub;
  return sub - d;
}
/* A familia do meio centavo do caminho ITEMIZADO: o desconto de 25% cai em meio
   centavo exato quando o subtotal em centavos deixa resto 2 na divisao por 4. */
const naFamilia = linhas => (subC(linhas) % 4) === 2;
/* O MESMO, para um cupom qualquer: o desconto CRU cai em meio centavo exato?
   E esta a unica janela em que o bloco pode ficar um centavo longe da aritmetica
   exata -- ver o comentario da prova 5. */
function meioCentavo(linhas, cupom){
  if(!cupom) return false;
  const sub = subC(linhas);
  const prod = linhas.filter(l=>!l.opcional).reduce((s,l)=>s+cent(l.unit)*l.qtd, 0);
  let cru = null;
  if(cupom.pct!=null) cru = sub*cupom.pct/100;
  else if(cupom.pctProd!=null) cru = prod*cupom.pctProd/100;
  else return false;                       /* valor fixo nao tem fracao de centavo */
  return Math.abs(cru - Math.floor(cru) - 0.5) < 1e-9;
}
/* Quantos casos ficaram um centavo longe do exato -- contados para o relatorio da
   rodada, e nao escondidos numa verificacao que passa. */
const divergiu = [];
/* "R$ 1.234,56" -> 123456 centavos */
function moedaC(t){
  if(t==null) return null;
  const m = String(t).match(/-?[0-9][0-9.]*,[0-9]{2}/);
  return m ? cent(parseFloat(m[0].replace(/\./g,'').replace(',','.'))) : null;
}

/* A SONDA DO SDK: o bloco pendura o script do PayPal ja no carregamento, entao
   isto tem de estar de pe antes dele. Guarda a configuracao em window.__pp. */
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
  + 'window.__alertas=[];window.alert=function(m){window.__alertas.push(String(m));};\n'
  + 'window.open=function(){return null;};\n'
  + '})();</scr'+'ipt>';
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|alboom\.ninja|storage\.|ERR_FAILED|Failed to load resource|net::ERR/i;
const errosReais = e => (e||[]).filter(x => !EXTERNO.test(x));

/* O PEDIDO, lido do createOrder do PROPRIO bloco -- nunca remontado aqui. */
const lerPedido = totalSel => pg => pg.evaluate(sel => {
  function pedido(){
    if(!window.__pp || !window.__pp.createOrder) return {erro:'sem createOrder'};
    try{ return {pu: window.__pp.createOrder(null,{order:{create:x=>x}}).purchase_units[0]}; }
    catch(e){ return {erro:String(e&&e.message||e)}; }
  }
  const el = document.querySelector(sel);
  return {ped: pedido(), tela: el ? el.textContent.trim() : null};
}, totalSel);

/* ===========================================================================
   AS PROVAS COMUNS -- as mesmas para as tres abas
   ===========================================================================
   'esperados' e a lista que o CLIENTE escolheu, do ponto de vista do teste:
   [{nome, unit, qtd}]. A prova compara o que o bloco mandou com ela.
   =========================================================================== */
function provarItemizado(rot, r, esperados, cupom){
  const p = r.ped;
  if(p.erro){ chk(rot+'o bloco montou o pedido', false, p.erro); return; }
  const pu = p.pu, its = pu.items || [], br = (pu.amount||{}).breakdown || {};

  /* --- 1. cada item e um item de verdade, dentro do que o PayPal aceita --- */
  let formaOk = its.length>0;
  for(const it of its){
    if(!it.name || String(it.name).length>127) formaOk = false;
    if(!/^[1-9][0-9]{0,9}$/.test(String(it.quantity))) formaOk = false;
    if(!/^[0-9]+\.[0-9]{2}$/.test(String((it.unit_amount||{}).value))) formaOk = false;
    if((it.unit_amount||{}).currency_code !== 'BRL') formaOk = false;
  }
  chk(rot+'1. todo item tem name (<=127), quantity ^[1-9][0-9]{0,9}$ e unit_amount valido',
      formaOk, JSON.stringify(its).slice(0,220));

  /* --- 2. a soma dos itens, feita AQUI, e o item_total que o bloco escreveu --- */
  const soma = its.reduce((s,it)=>s + cent(parseFloat((it.unit_amount||{}).value)) * parseInt(it.quantity,10), 0);
  const itC  = cent(parseFloat((br.item_total||{}).value));
  chk(rot+'2. ITEM_TOTAL_MISMATCH: soma(unit_amount x quantity) === item_total',
      soma === itC, 'somei '+soma+' centavos, o bloco escreveu '+itC);

  /* --- 3. item_total - discount === amount (a conta que recusa o pedido) --- */
  const dsC = br.discount ? cent(parseFloat(br.discount.value)) : 0;
  const amC = cent(parseFloat((pu.amount||{}).value));
  chk(rot+'3. AMOUNT_MISMATCH: item_total - discount === amount, ao centavo',
      (itC - dsC) === amC, 'item_total '+itC+' - desconto '+dsC+' = '+(itC-dsC)+', amount '+amC);
  chk(rot+'3b. o desconto nunca e negativo', dsC >= 0, 'desconto '+dsC);

  /* --- 4. e o que o PayPal cobra e o que a tela mostra --- */
  chk(rot+'4. amount === o total impresso na tela',
      amC === r.telaC, 'amount '+amC+' vs tela '+r.telaC);

  /* --- 5. e a aritmetica exata diz o mesmo, ou difere UM centavo por uma razao
     conhecida e ANTERIOR a esta rodada.
     MEDIDO em 13/09/2026, e nao presumido: descontoAtual() multiplica o subtotal em
     PONTO FLUTUANTE (s*valor/100) antes de arredondar, e o subtotal binario de
     163,30 e um fio MENOR que 163,30 -- entao 25% dele da 40,824999... e arredonda
     para 40,82, enquanto a conta exata da 40,825 e arredonda para 40,83 (meio
     centavo sobe, que e a regra comercial que este projeto adotou). O total sai
     R$ 122,48 onde a aritmetica exata daria R$ 122,47: um centavo A MAIS, cobrado
     do cliente.
     ISSO NAO E DESTA RODADA e nao e mexido aqui: descontoAtual e o motor de dinheiro
     das tres abas, e mudar uma linha dele muda TODO total do meio centavo -- e a
     classe de mudanca que, pela regra do projeto, se avisa ao dono ANTES. O que esta
     rodada garante e o que importa para o pedido: qualquer que seja o total, o
     pedido FECHA (provas 2 e 3) e o PayPal cobra exatamente o que a tela mostra
     (prova 4). Esta prova cerca o resto: no maximo um centavo, e so na janela em que
     o desconto cru cai em meio centavo exato. Fora dessa janela, bate na bala. */
  const esperadoC = totalC(esperados, cupom);
  const dif = amC - esperadoC;
  if(dif!==0) divergiu.push(rot+'bloco '+amC+' vs exato '+esperadoC);
  chk(rot+'5. o valor bate com a aritmetica exata (ou difere 1 centavo, e so no meio centavo)',
      dif===0 || (Math.abs(dif)===1 && meioCentavo(esperados, cupom)),
      'bloco '+amC+' vs exato '+esperadoC+' (diferenca '+dif+' centavo(s); meio centavo: '+meioCentavo(esperados,cupom)+')');

  /* --- 6. os itens sao os que o cliente escolheu (zerados de fora) --- */
  const querem = esperados.filter(e => cent(e.unit) > 0);
  const nomes = its.map(it => String(it.name));
  let listaOk = nomes.length === querem.length;
  for(const e of querem){
    const i = nomes.indexOf(e.nome.substring(0,127));
    if(i < 0){ listaOk = false; continue; }
    if(parseInt(its[i].quantity,10) !== e.qtd) listaOk = false;
    if(cent(parseFloat(its[i].unit_amount.value)) !== cent(e.unit)) listaOk = false;
  }
  chk(rot+'6. a lista e exatamente o que o cliente escolheu (nome, quantidade e preco unitario)',
      listaOk, 'mandou ['+nomes.join(' | ')+']  esperava ['+querem.map(e=>e.nome+' x'+e.qtd).join(' | ')+']');

  /* --- 7. item de R$ 0,00 NAO entra (ver o comentario em ppDetalhar) --- */
  const zerado = esperados.filter(e => cent(e.unit) === 0);
  if(zerado.length){
    chk(rot+'7. o opcional de R$ 0,00 ficou FORA da lista, e sem mexer na conta',
        nomes.indexOf(zerado[0].nome) < 0 && (itC - dsC) === amC,
        'nomes: '+nomes.join(' | '));
  }

  /* --- 8. conciliacao --- */
  chk(rot+'8. custom_id e o codigo do pedido, e todo item leva o mesmo sku',
      !!pu.custom_id && its.every(it => it.sku === String(pu.custom_id).substring(0,127)),
      'custom_id='+pu.custom_id+' skus='+its.map(i=>i.sku).join(','));
}

/* Com sinal: uma linha so, e nenhum desconto inventado. */
function provarLinhaUnica(rot, r, sinalC){
  const p = r.ped;
  if(p.erro){ chk(rot+'o bloco montou o pedido', false, p.erro); return; }
  const pu = p.pu, its = pu.items || [], br = (pu.amount||{}).breakdown || {};
  chk(rot+'S1. com sinal vai UM item so (itemizar chamaria de desconto o saldo a pagar)',
      its.length === 1, 'foram '+its.length);
  chk(rot+'S2. e NENHUM campo discount foi inventado', !br.discount,
      JSON.stringify(br.discount||null));
  const amC = cent(parseFloat((pu.amount||{}).value));
  chk(rot+'S3. item_total === unit_amount === amount === o sinal',
      cent(parseFloat((br.item_total||{}).value)) === amC &&
      cent(parseFloat(its[0].unit_amount.value)) === amC, 'amount '+amC);
  if(sinalC!=null) chk(rot+'S4. e esse valor e o sinal que a tela mostra', amC === sinalC,
      'amount '+amC+' vs tela '+sinalC);
  chk(rot+'S5. o nome do item diz que e sinal', /sinal/i.test(String(its[0].name)),
      String(its[0].name).slice(0,90));
}

/* ===========================================================================
   PASSAGEM PELA FERRAMENTA -- Checkout e Mini loja saem juntos
   =========================================================================== */
async function gerarDuas(cfg){
  console.log('\ngerando Checkout e Mini loja  (sinal: '+(cfg.sinal?cfg.valor+'%':'nao')+') ...');
  const r = await gerarNaFerramenta(async pg => {
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);

    /* ---------- Checkout ---------- */
    await clicar(pg,'aba-uni');
    for(let i=0;i<CAT.length;i++){
      await set(pg,'u-pnome', i===0 ? HOSTIL_P : CAT[i].nome);
      await set(pg,'u-ppreco',CAT[i].preco);
      if(i===0){
        await radio(pg,'u-pqtd','sim');
        for(const op of OPS){
          await set(pg,'u-op-nome',op.nome); await set(pg,'u-op-preco',op.preco);
          await set(pg,'u-op-qtd',!!op.qtd);
          await clicar(pg,'u-op-add');
        }
        /* varios opcionais ao mesmo tempo: e o unico modo em que o cliente
           escolhe um SUBCONJUNTO deles, que e o que esta rodada precisa medir */
        await radio(pg,'u-opsel','multiplo');
      }else{
        await radio(pg,'u-pqtd','nao');
      }
      await clicar(pg,'u-prod-salvar');
    }
    await radio(pg,'u-selprod','multiplo');
    /* O DESCONTO DO PIX LIGADO, de proposito, inclusive aqui: o PayPal cobra total(),
       nunca totalPix(), e e assim que se prova que ligar o desconto do Pix nao move um
       centavo do pedido do cartao. */
    await set(pg,'u-descpix','5');
    for(const cp of CUPONS){
      await set(pg,'u-cp-cod',cp.cod); await radio(pg,'u-cp-tipo',cp.tipo);
      await set(pg,'u-cp-valor',cp.valor); await clicar(pg,'u-cp-add');
    }
    await radio(pg,'u-sinal',cfg.sinal?'sim':'nao');
    if(cfg.sinal){ await radio(pg,'u-sinaltipo','pct'); await set(pg,'u-sinalpct',String(cfg.valor)); }
    await clicar(pg,'u-gerar');

    /* ---------- Mini loja ---------- */
    await clicar(pg,'aba-loja');
    for(let i=0;i<CAT.length;i++){
      await set(pg,'m-pnome', i===0 ? HOSTIL_P : CAT[i].nome);
      await set(pg,'m-ppreco',CAT[i].preco);
      await set(pg,'m-pcat','Ensaios');
      await set(pg,'m-pimg','https://storage.alboom.ninja/e'+i+'.jpg');
      if(i===0){
        await radio(pg,'m-pqtd','sim');
        for(const op of OPS){
          await set(pg,'m-op-nome',op.nome); await set(pg,'m-op-preco',op.preco);
          await set(pg,'m-op-qtd',!!op.qtd);
          await clicar(pg,'m-op-add');
        }
        await radio(pg,'m-opsel','multiplo');
      }else{
        await radio(pg,'m-pqtd','nao');
      }
      await clicar(pg,'m-prod-salvar');
    }
    for(const cp of CUPONS){
      await set(pg,'m-cp-cod',cp.cod); await radio(pg,'m-cp-tipo',cp.tipo);
      await set(pg,'m-cp-valor',cp.valor); await clicar(pg,'m-cp-add');
    }
    await set(pg,'m-descpix','5');   /* mesmo motivo do Checkout, acima */
    await radio(pg,'m-sinal',cfg.sinal?'sim':'nao');
    if(cfg.sinal){ await radio(pg,'m-sinaltipo','pct'); await set(pg,'m-sinalpct',String(cfg.valor)); }
    await clicar(pg,'m-gerar');
  }, ['u-out','m-out'], {porta: cfg.porta, raiz: cfg.raiz});

  if(cfg.calado) return r.valores;
  chk('[gerar '+cfg.id+'] a ferramenta gerou sem alerta', r.alertas.length===0, JSON.stringify(r.alertas));
  chk('[gerar '+cfg.id+'] sem erro de console', r.erros.length===0, r.erros.slice(0,2).join(' | '));
  const temItens = t => t.indexOf('function ppDetalhar(')>=0;
  chk('[gerar '+cfg.id+'] Checkout '+(cfg.sinal?'NAO ':'')+'itemiza',
      temItens(r.valores['u-out']||'') === !cfg.sinal);
  chk('[gerar '+cfg.id+'] Mini loja '+(cfg.sinal?'NAO ':'')+'itemiza',
      temItens(r.valores['m-out']||'') === !cfg.sinal);
  return r.valores;
}

async function gerarPac(cfg){
  console.log('\ngerando a pagina de obrigado  (sinal: '+(cfg.sinal?cfg.valor+'%':'nao')+') ...');
  const r = await gerarNaFerramenta(async pg => {
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
    await clicar(pg,'aba-pac');
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-prefixo','FC');
    await radio(pg,'a-metodo','ambos');
    /* CARTAO PRIORITARIO: com o Pix em cima, o numero grande da pagina e o preco COM o
       desconto do Pix, e a prova 4 (o PayPal cobra o que a tela mostra) estaria lendo o
       elemento errado. Com o cartao em cima, o numero grande e total() -- que e o que o
       PayPal cobra -- e o desconto do Pix continua ligado logo abaixo, provando que ele
       nao move o pedido do cartao. */
    await radio(pg,'a-prio','pp');
    await set(pg,'a-descpix','5');
    await set(pg,'a-pcod','ENS'); await set(pg,'a-pnome',HOSTIL_P);
    await set(pg,'a-pdur','2 horas'); await set(pg,'a-ppreco',CAT[0].preco);
    await set(pg,'a-pinclui','20 fotos'); await set(pg,'a-ppath','fotocerta/ens');
    for(const op of OPS){
      await set(pg,'a-op-nome',op.nome); await set(pg,'a-op-preco',op.preco);
      await set(pg,'a-op-qtd',!!op.qtd);
      await clicar(pg,'a-op-add');
    }
    await clicar(pg,'a-pac-salvar');
    for(const cp of CUPONS){
      await set(pg,'a-cp-cod',cp.cod); await radio(pg,'a-cp-tipo',cp.tipo);
      await set(pg,'a-cp-valor',cp.valor); await clicar(pg,'a-cp-add');
    }
    await radio(pg,'a-sinal',cfg.sinal?'sim':'nao');
    if(cfg.sinal){ await radio(pg,'a-sinaltipo','pct'); await set(pg,'a-sinalpct',String(cfg.valor)); }
    await clicar(pg,'a-gerar');
  }, ['a-out3'], {porta: cfg.porta, raiz: cfg.raiz});
  if(cfg.calado) return r.valores['a-out3']||'';
  chk('[gerar pac/'+cfg.id+'] a ferramenta gerou sem alerta', r.alertas.length===0, JSON.stringify(r.alertas));
  chk('[gerar pac/'+cfg.id+'] sem erro de console', r.erros.length===0, r.erros.slice(0,2).join(' | '));
  chk('[gerar pac/'+cfg.id+'] a pagina de obrigado '+(cfg.sinal?'NAO ':'')+'itemiza',
      ((r.valores['a-out3']||'').indexOf('function ppDetalhar(')>=0) === !cfg.sinal);
  return r.valores['a-out3']||'';
}

/* ===========================================================================
   COMO SE MONTA O CARRINHO EM CADA ABA
   ===========================================================================
   Clica sempre no LABEL, nunca no input: o marcador de selecao e DESENHADO
   (Manual do Prosite), e o input nativo por baixo pode nem estar no caminho que
   o dedo do cliente percorre.
   =========================================================================== */
/* O SELETOR DE QUANTIDADE NAO ACEITA DIGITACAO: sao dois botoes desenhados. Para
   chegar a um numero, zera (clicando '-' ate o piso) e sobe. TODO caso passa por
   aqui, inclusive os que nao pedem quantidade -- sem isso a quantidade de um caso
   sobreviveria no seguinte, e a medicao seria de um carrinho que o caso nunca
   montou (aconteceu na primeira passagem deste arquivo: um "x3" vazou para o caso
   do opcional zerado e o teste acusou o bloco de somar errado). */
async function qtdPor(pg, caixa, pref, alvo){
  const cx = pg.locator(caixa).first();
  if(await pg.locator(caixa).count() === 0) return;
  for(let k=0;k<40;k++){
    const v = parseInt(await cx.locator('.'+pref+'-qtd-v').first().textContent(), 10);
    if(!(v>0)) break;
    await cx.locator('button').first().click();
  }
  for(let k=0;k<alvo;k++) await cx.locator('button').last().click();
}

async function carrinhoCheckout(pg, caso){
  for(let i=0;i<CAT.length;i++){
    const sel = 'input[name="fcu-prod"][value="'+i+'"]';
    const marcado = await pg.$eval(sel, el => el.checked);
    const quer = (caso.itens||[]).indexOf(i) >= 0;
    if(marcado !== quer) await pg.click('label:has('+sel+')');
  }
  await pg.waitForTimeout(60);
  /* os opcionais moram no produto 0 */
  for(let j=0;j<OPS.length;j++){
    const sel = 'input[name="fcu-op-0"][value="'+j+'"]';
    if(await pg.locator(sel).count() === 0) continue;
    const marcado = await pg.$eval(sel, el => el.checked);
    const quer = (caso.ops||[]).indexOf(j) >= 0;
    if(marcado !== quer) await pg.click('label:has('+sel+')');
  }
  await pg.waitForTimeout(60);
  await qtdPor(pg, '.fcu-prod .fcu-qtd', 'fcu', caso.qtdProd!=null?caso.qtdProd:1);
  await qtdPor(pg, '.fcu-op .fcu-qtd',   'fcu', caso.qtdOp!=null?caso.qtdOp:1);
  await pg.waitForTimeout(60);
}

async function carrinhoLoja(pg, caso){
  for(let g=0; g<40; g++){
    const n = await pg.locator('.fcm-item .fcm-tirar').count();
    if(!n) break;
    await pg.locator('.fcm-item .fcm-tirar').first().click();
    await pg.waitForTimeout(20);
  }
  for(const i of (caso.itens||[])){
    /* o cartao e achado pelo NOME, nunca por posicao: qual cartao fica em primeiro
       depende da ordem do catalogo e do filtro, e medir o cartao errado diria "a
       conta esta errada" sobre um pedido que nunca existiu. */
    await pg.locator('.fcm-card', {hasText: i===0 ? 'Ensaio "A"' : CAT[i].nome}).first().click();
    await pg.waitForTimeout(90);
    if(i===0){
      for(let j=0;j<OPS.length;j++){
        const sel = '.fcm-detalhe input[name="fcm-op"][value="'+j+'"]';
        if(await pg.locator(sel).count() === 0) continue;
        const quer = (caso.ops||[]).indexOf(j) >= 0;
        const marcado = await pg.$eval(sel, el => el.checked);
        if(marcado !== quer) await pg.locator('.fcm-detalhe .fcm-op').nth(j).locator('label').first().click();
      }
      await pg.waitForTimeout(60);
      /* no cartao de detalhe a linha "Quantidade" do PRODUTO vem ANTES da caixa de
         opcionais (fcm-linha-p), e a do opcional mora na propria linha dele */
      /* A QUANTIDADE E AJUSTADA NO CARTAO DE DETALHE, antes de adicionar -- e NAO na
         linha do carrinho. Medido: o seletor da linha do carrinho chama tirarDoCarrinho
         quando chega a zero ('if(n<1){tirarDoCarrinho(pos);return;}'), e qtdPor zera antes
         de subir; usa-lo apagaria o item que o caso acabou de montar. O do detalhe so
         existe para produto marcado como "vende por quantidade" (mBloco: 'if(p.quantidade)'),
         e e por isso que o produto 0 deste cenario e cadastrado com m-pqtd = sim. */
      await qtdPor(pg, '.fcm-detalhe .fcm-linha-p .fcm-qtd', 'fcm', caso.qtdProd!=null?caso.qtdProd:1);
      await qtdPor(pg, '.fcm-detalhe .fcm-op .fcm-qtd',      'fcm', caso.qtdOp!=null?caso.qtdOp:1);
    }
    await pg.waitForTimeout(60);
    await pg.click('.fcm-add');
    await pg.waitForTimeout(90);
  }
}

async function carrinhoPac(pg, caso){
  const n = await pg.locator('.fca-ob-op input[type="checkbox"]').count();
  for(let j=0;j<n;j++){
    const marcado = await pg.locator('.fca-ob-op input[type="checkbox"]').nth(j).evaluate(e=>e.checked);
    const quer = (caso.ops||[]).indexOf(j) >= 0;
    if(marcado !== quer) await pg.locator('.fca-ob-op').nth(j).locator('label').first().click();
  }
  await pg.waitForTimeout(60);
  await qtdPor(pg, '.fca-ob-op .fca-ob-qtd', 'fca-ob', caso.qtdOp!=null?caso.qtdOp:1);
  await pg.waitForTimeout(60);
}

async function aplicarCupom(pg, pref, codigo){
  await pg.fill('.'+pref+'-cupom-l input', codigo||'');
  await pg.click('.'+pref+'-cupom-l button');
  await pg.waitForTimeout(80);
}

/* ===========================================================================
   OS CASOS
   ===========================================================================
   'itens' sao indices de CAT; 'ops' sao indices de OPS (so o produto 0 os tem).
   'cupom' e o codigo digitado. 'qtdProd'/'qtdOp' pedem uma quantidade.
   =========================================================================== */
const CASOS = [
  {n:'A + 25%  (meio centavo)',        itens:[0],       ops:[], cupom:'MEIO', familia:true},
  {n:'A+B + 25%  (meio centavo)',      itens:[0,1],     ops:[], cupom:'MEIO', familia:true},
  {n:'A+C+D + 25%  (meio centavo)',    itens:[0,2,3],   ops:[], cupom:'MEIO', familia:true},
  {n:'A+B+C+D + 25%  (meio centavo)',  itens:[0,1,2,3], ops:[], cupom:'MEIO', familia:true},
  /* O CONTROLE tem de estar FORA da familia, senao a prova "familia" nunca falharia por
     escolha errada. {A,C} soma 53925 centavos, resto 1: o desconto de 25% cai em centavo
     exato. Ele estava errado na primeira passagem deste arquivo -- {A,B,C,D} soma 91030,
     resto 2, e ESTA na familia --, e foi a propria prova que denunciou. */
  {n:'A+C + 25%  (controle, fora da familia)', itens:[0,2], ops:[], cupom:'MEIO', familia:false},
  {n:'A+B sem cupom',                  itens:[0,1],     ops:[], cupom:''},
  {n:'A + 10%',                        itens:[0],       ops:[], cupom:'DEZ'},
  {n:'A + cupom de VALOR FIXO (7,00)', itens:[0],       ops:[], cupom:'SETE'},
  /* OS OPCIONAIS -- o que o dono pediu e nao existia: no Checkout e na Mini
     loja eles entravam no valor e nao apareciam em lugar nenhum do relatorio. */
  {n:'A + os TRES opcionais (um deles a R$ 0,00)', itens:[0], ops:[0,1,2], cupom:''},
  {n:'A + os TRES opcionais + 25%',    itens:[0],       ops:[0,1,2], cupom:'MEIO'},
  {n:'A + dois opcionais + cupom SO SOBRE OS PRODUTOS (20%)', itens:[0], ops:[0,2], cupom:'PROD'},
  {n:'A x3 com o opcional x2',         itens:[0],       ops:[0], cupom:'', qtdProd:3, qtdOp:2},
  {n:'A com o opcional em quantidade ZERO', itens:[0],  ops:[0], cupom:'', qtdOp:0}
];

/* O que o teste espera que va, para cada caso -- a lista do ponto de vista do
   CLIENTE, com os zerados incluidos (a prova 7 e quem cobra que eles saiam). */
function esperadosDe(caso, comOps){
  const L = [];
  for(const i of (caso.itens||[])){
    const q = (i===0 && caso.qtdProd!=null) ? caso.qtdProd : 1;
    L.push({nome: i===0?HOSTIL_P:CAT[i].nome, unit: CAT[i].v, qtd: q, opcional:false});
  }
  if(comOps) for(const j of (caso.ops||[])){
    const q = (j===0 && caso.qtdOp!=null) ? caso.qtdOp : 1;
    if(q < 1) continue;                       /* quantidade zero = nao escolhido */
    L.push({nome: OPS[j].nome, unit: OPS[j].v, qtd: q, opcional:true});
  }
  return L;
}
const acharCupom = cod => CUPONS.filter(c=>c.cod===cod)[0] || null;

/* ============================ a bateria ============================ */
const semSinal = await gerarDuas({id:'sem-sinal', sinal:false, porta:8771});
const comSinal = await gerarDuas({id:'sinal50',   sinal:true, valor:50, porta:8772});
const pacSem   = await gerarPac({id:'sem-sinal', sinal:false, porta:8773});
const pacCom   = await gerarPac({id:'sinal50',   sinal:true, valor:50, porta:8774});

/* ---------- Checkout e Mini loja, SEM sinal: a conta itemizada ---------- */
for(const aba of [
  {nome:'Checkout',  bloco:semSinal['u-out'], pref:'fcu', total:'.fcu-total-v', porta:8781, carrinho:carrinhoCheckout, ops:true},
  {nome:'Mini loja', bloco:semSinal['m-out'], pref:'fcm', total:'.fcm-total-v', porta:8782, carrinho:carrinhoLoja,     ops:true}
]){
  console.log('\n== '+aba.nome+' -- pedido itemizado ==');
  const r = await comBlocoNaPagina({
    bloco: aba.bloco, cabeca: CABECA, porta: aba.porta,
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(250);
      const fora = {};
      for(const caso of CASOS){
        await aba.carrinho(pg, caso);
        await aplicarCupom(pg, aba.pref, caso.cupom);
        const leitura = await lerPedido(aba.total)(pg);
        fora[caso.n] = leitura;
      }
      return {fora, fim: await pg.$('#fim-do-documento') !== null};
    }
  });
  chk('['+aba.nome+'] o documento nao foi engolido pelo bloco', r.fim);
  chk('['+aba.nome+'] sem erro de console proprio do bloco',
      errosReais(r.erros).length===0, (r.erros||[]).slice(0,2).join(' | '));
  for(const caso of CASOS){
    const rot = '['+aba.nome+'] '+caso.n+' / ';
    const leitura = r.fora[caso.n];
    leitura.telaC = moedaC(leitura.tela);
    const esperados = esperadosDe(caso, aba.ops);
    if(caso.familia!==undefined){
      chk(rot+'familia. o subtotal esta '+(caso.familia?'':'FORA ')+'da familia do meio centavo (sub%4==2)',
          naFamilia(esperados) === caso.familia,
          'subtotal '+subC(esperados)+' centavos, resto '+(subC(esperados)%4));
    }
    provarItemizado(rot, leitura, esperados, acharCupom(caso.cupom));
  }
}

/* ---------- Checkout e Mini loja, COM sinal: a linha unica ---------- */
for(const aba of [
  {nome:'Checkout/sinal',  bloco:comSinal['u-out'], pref:'fcu', sinal:'.fcu-sinal-v', porta:8783, carrinho:carrinhoCheckout, ops:true},
  {nome:'Mini loja/sinal', bloco:comSinal['m-out'], pref:'fcm', sinal:'.fcm-sinal-v', porta:8784, carrinho:carrinhoLoja,     ops:true}
]){
  console.log('\n== '+aba.nome+' -- linha unica ==');
  const casos = [CASOS[0], CASOS[7]];       /* um simples e um com opcionais */
  const r = await comBlocoNaPagina({
    bloco: aba.bloco, cabeca: CABECA, porta: aba.porta,
    medir: async pg => {
      await pg.waitForTimeout(250);
      const fora = {};
      for(const caso of casos){
        await aba.carrinho(pg, caso);
        await aplicarCupom(pg, aba.pref, caso.cupom);
        fora[caso.n] = await lerPedido(aba.sinal)(pg);
      }
      return {fora};
    }
  });
  for(const caso of casos){
    const leitura = r.fora[caso.n];
    provarLinhaUnica('['+aba.nome+'] '+caso.n+' / ', leitura, moedaC(leitura.tela));
  }
}

/* ---------- A pagina de obrigado ---------- */
const CASOS_PAC = [
  {n:'pacote sozinho + 25%',              ops:[],      cupom:'MEIO', familia:true},
  {n:'pacote + os TRES opcionais',        ops:[0,1,2], cupom:''},
  {n:'pacote + opcional x2 + 10%',        ops:[0],     cupom:'DEZ', qtdOp:2},
  {n:'pacote + opcional em quantidade ZERO', ops:[0],  cupom:'', qtdOp:0},
  {n:'pacote + dois opcionais + cupom SO SOBRE O PACOTE (20%)', ops:[0,2], cupom:'PROD'}
];
function esperadosPac(caso){
  const L = [{nome:HOSTIL_P, unit:CAT[0].v, qtd:1, opcional:false}];
  for(const j of (caso.ops||[])){
    const q = (j===0 && caso.qtdOp!=null) ? caso.qtdOp : 1;
    if(q<1) continue;
    L.push({nome:OPS[j].nome, unit:OPS[j].v, qtd:q, opcional:true});
  }
  return L;
}
{
  console.log('\n== Pagina de obrigado -- pedido itemizado ==');
  const r = await comBlocoNaPagina({
    bloco: pacSem, cabeca: CABECA, porta: 8785, busca: '?pac=ENS',
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(350);
      const fora = {};
      for(const caso of CASOS_PAC){
        await carrinhoPac(pg, caso);
        await aplicarCupom(pg, 'fca-ob', caso.cupom);
        fora[caso.n] = await lerPedido('.fca-ob-preco-valor')(pg);
      }
      return {fora, fim: await pg.$('#fim-do-documento') !== null};
    }
  });
  chk('[pac] o documento nao foi engolido pelo bloco', r.fim);
  chk('[pac] sem erro de console proprio do bloco',
      errosReais(r.erros).length===0, (r.erros||[]).slice(0,2).join(' | '));
  for(const caso of CASOS_PAC){
    const rot = '[pac] '+caso.n+' / ';
    const leitura = r.fora[caso.n];
    leitura.telaC = moedaC(leitura.tela);
    const esperados = esperadosPac(caso);
    if(caso.familia!==undefined)
      chk(rot+'familia. o subtotal esta na familia do meio centavo (sub%4==2)',
          naFamilia(esperados) === caso.familia, 'resto '+(subC(esperados)%4));
    provarItemizado(rot, leitura, esperados, acharCupom(caso.cupom));
  }
}
{
  console.log('\n== Pagina de obrigado -- linha unica (com sinal) ==');
  const r = await comBlocoNaPagina({
    bloco: pacCom, cabeca: CABECA, porta: 8786, busca: '?pac=ENS',
    medir: async pg => {
      await pg.waitForTimeout(350);
      await carrinhoPac(pg, {ops:[0,2]});
      await aplicarCupom(pg,'fca-ob','MEIO');
      return {leitura: await lerPedido('.fca-ob-sinal')(pg)};
    }
  });
  provarLinhaUnica('[pac/sinal] pacote + dois opcionais + 25% / ', r.leitura, null);
}

/* ===========================================================================
   O NOME HOSTIL CHEGOU INTEIRO -- medido no pedido, nao no texto do bloco
   =========================================================================== */
console.log('\n== o texto hostil ==');
{
  const r = await comBlocoNaPagina({
    bloco: semSinal['u-out'], cabeca: CABECA, porta: 8787,
    medir: async pg => {
      await pg.waitForTimeout(250);
      await carrinhoCheckout(pg, {itens:[0], ops:[0]});
      await aplicarCupom(pg,'fcu','');
      return {leitura: await lerPedido('.fcu-total-v')(pg)};
    }
  });
  const its = ((r.leitura.ped||{}).pu||{}).items || [];
  const nomes = its.map(i=>String(i.name));
  chk('hostil. o nome do PRODUTO chega ao pedido byte a byte como foi cadastrado',
      nomes.indexOf(HOSTIL_P) >= 0, JSON.stringify(nomes));
  chk('hostil. o nome do OPCIONAL tambem', nomes.indexOf(HOSTIL_O) >= 0, JSON.stringify(nomes));
  chk('hostil. e a descricao da ordem tambem o carrega',
      String((((r.leitura.ped||{}).pu)||{}).description||'').indexOf(HOSTIL_P) >= 0);
}

/* ===========================================================================
   COM SINAL, O PEDIDO CONTINUA EXATAMENTE O DE ANTES DESTA RODADA
   ===========================================================================
   A DECISAO "com sinal nao se itemiza" so vale se for verificavel. A primeira
   forma tentada foi byte a byte no TEXTO do bloco, e ela FALHOU -- com razao, e
   a falha vale registro: o bloco com sinal MUDOU mesmo, porque itensEscolhidos()
   passou a carregar nome/qtd/unit e nomesSelecionados() passou a sair dela, e
   isso e emitido com sinal ou sem. Afirmar "nada mudou" ali seria falso.

   O que precisa nao ter mudado e O PEDIDO -- o objeto que vai para o PayPal e
   que o cliente paga. Entao e ele que se compara: os dois blocos (o da
   referencia presa e o da arvore de trabalho) rodam no mesmo molde, com o MESMO
   carrinho, e o purchase_unit tem de sair identico campo a campo.

   E O MESMO SE COBRA DO CAMINHO SEM SINAL para a DESCRICAO: os itens mudaram de
   proposito (e a rodada inteira), mas 'description' sai de nomesSelecionados(),
   que foi REESCRITA -- ela deriva da enumeracao em vez de ter laco proprio. Se a
   derivacao mudasse um caractere, o extrato do cliente mudaria sem ninguem ter
   pedido. Aqui isso e medido, e nao presumido.
   =========================================================================== */
console.log('\n== o pedido comparado com a referencia presa ('+REF+') ==');
{
  let refDir = null, motivo = '';
  try{
    execFileSync('git', ['-C', RAIZ_REPO, 'rev-parse', '--verify', REF], {stdio:'ignore'});
    refDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-ref-'));
    const tar = execFileSync('git', ['-C', RAIZ_REPO, 'archive', REF], {maxBuffer: 1<<28});
    fs.writeFileSync(path.join(refDir,'a.tar'), tar);
    execFileSync('tar', ['-x','-f', path.join(refDir,'a.tar'), '-C', refDir]);
  }catch(e){ refDir = null; motivo = String(e && e.message || e); }

  let velhosS = null, velhosN = null;
  if(refDir){
    try{
      velhosS = await gerarDuas({id:'ref/sinal50',   sinal:true, valor:50, porta:8791, raiz:refDir, calado:true});
      velhosN = await gerarDuas({id:'ref/sem-sinal', sinal:false,          porta:8793, raiz:refDir, calado:true});
    }catch(e){ velhosS = null; motivo = String(e && e.message || e); }
  }

  if(!refDir || !velhosS || !velhosN || !velhosS['u-out'] || !velhosN['u-out']){
    console.log('  NAO MEDIU  a referencia "'+REF+'" nao esta neste repositorio, ou nao aceitou');
    console.log('             este roteiro ('+String(motivo).slice(0,110)+').');
    console.log('             Esta prova NAO rodou -- nao conte com ela.');
    chk('a comparacao com a referencia presa RODOU', false,
        'NAO MEDIU: referencia "'+REF+'" ausente ou incompativel');
  }else{
    /* O pedido dos dois blocos, com o MESMO carrinho, medido no mesmo molde. */
    async function pedidoDe(bloco, porta, caso, aba){
      const r = await comBlocoNaPagina({
        bloco, cabeca: CABECA, porta,
        medir: async pg => {
          await pg.waitForTimeout(250);
          await aba(pg, caso);
          await aplicarCupom(pg, caso.pref, caso.cupom);
          return {ped: await pg.evaluate(() => {
            if(!window.__pp || !window.__pp.createOrder) return {erro:'sem createOrder'};
            try{ return {pu: window.__pp.createOrder(null,{order:{create:x=>x}}).purchase_units[0]}; }
            catch(e){ return {erro:String(e&&e.message||e)}; }
          })};
        }
      });
      return r.ped;
    }
    const casoU = {itens:[0], ops:[0,2], cupom:'MEIO', pref:'fcu'};
    const casoM = {itens:[0], ops:[0,2], cupom:'MEIO', pref:'fcm'};

    /* --- com sinal: o pedido INTEIRO tem de ser o mesmo --- */
    for(const [nome, velho, novo, caso, aba, p1, p2] of [
      ['Checkout',  velhosS['u-out'], comSinal['u-out'], casoU, carrinhoCheckout, 8821, 8822],
      ['Mini loja', velhosS['m-out'], comSinal['m-out'], casoM, carrinhoLoja,     8823, 8824]
    ]){
      const a = await pedidoDe(velho, p1, caso, aba);
      const b = await pedidoDe(novo,  p2, caso, aba);
      /* custom_id e sku sao sorteados a cada pedido: a comparacao os NEUTRALIZA, e
         a identidade deles ja e cobrada pela prova 8, caso a caso. */
      const limpar = p => {
        if(!p.pu) return p;
        const c = JSON.parse(JSON.stringify(p.pu));
        const cod = String(c.custom_id||'');
        c.custom_id = '<cod>';
        (c.items||[]).forEach(it => { if(it.sku===cod) it.sku='<cod>';
          if(cod) it.name = String(it.name).split(cod).join('<cod>'); });
        if(cod) c.description = String(c.description).split(cod).join('<cod>');
        return c;
      };
      chk('[sinal/'+nome+'] o pedido e IDENTICO ao da referencia '+REF,
          JSON.stringify(limpar(a)) === JSON.stringify(limpar(b)),
          'ref '+JSON.stringify(limpar(a)).slice(0,200)+'  |  novo '+JSON.stringify(limpar(b)).slice(0,200));
    }

    /* --- sem sinal: os ITENS mudaram de proposito; a DESCRICAO nao pode ter mudado --- */
    for(const [nome, velho, novo, caso, aba, p1, p2] of [
      ['Checkout',  velhosN['u-out'], semSinal['u-out'], casoU, carrinhoCheckout, 8825, 8826],
      ['Mini loja', velhosN['m-out'], semSinal['m-out'], casoM, carrinhoLoja,     8827, 8828]
    ]){
      const a = await pedidoDe(velho, p1, caso, aba);
      const b = await pedidoDe(novo,  p2, caso, aba);
      const semCod = p => {
        if(!p.pu) return null;
        const cod = String(p.pu.custom_id||'');
        return cod ? String(p.pu.description).split(cod).join('<cod>') : String(p.pu.description);
      };
      chk('[sem sinal/'+nome+'] a DESCRICAO da ordem continua a mesma de '+REF,
          semCod(a) === semCod(b), 'ref '+JSON.stringify(semCod(a))+'  |  novo '+JSON.stringify(semCod(b)));
      chk('[sem sinal/'+nome+'] e os ITENS mudaram, que e o objetivo da rodada',
          ((a.pu||{}).items||[]).length === 1 && ((b.pu||{}).items||[]).length > 1,
          'ref '+((a.pu||{}).items||[]).length+' item(ns), arvore '+((b.pu||{}).items||[]).length);
    }
  }
  if(refDir){ try{ fs.rmSync(refDir, {recursive:true, force:true}); }catch(e){} }
}

if(divergiu.length){
  console.log('\n== os '+divergiu.length+' casos que ficaram UM CENTAVO longe da aritmetica exata ==');
  console.log('   (causa medida: descontoAtual multiplica o subtotal em ponto flutuante --');
  console.log('    ver a prova 5. Nenhum deles quebra o pedido: o breakdown fecha e o PayPal');
  console.log('    cobra o mesmo numero que a tela mostra.)');
  for(const d of divergiu) console.log('   '+d);
}

process.exit(resumo());
