/* ============================================================================
   A PREVIA DO RELATORIO DO PAYPAL MENTE?
   ============================================================================
   O QUE ELA PROMETE. Desde 13/09/2026 as quatro abas com PayPal mostram, dentro
   do quadro da previa, os campos que de fato vao para o pedido: a lista de itens
   com nome, SKU, quantidade e preco unitario, o item_total, o desconto, o valor
   cobrado, a descricao e o custom_id. Ela promete que aquilo e o que o
   PayPal vai registrar.

   O SKU E POR LINHA desde 14/09/2026, e por isso ele e uma COLUNA da tabela em vez de uma linha
   de campo la embaixo. Este cenario cadastra SKU em UM produto e no opcional e deixa o OUTRO
   produto sem nenhum: assim a mesma passagem cobre os dois casos -- o valor escrito e o traco
   que anuncia a ausencia do campo.

   POR QUE ISSO PRECISA SER MEDIDO. Previa que redesenha o resultado com codigo
   proprio e uma segunda implementacao, e duas implementacoes divergem -- e regra
   deste projeto, escrita na CLAUDE.md, e ja custou duas divergencias na aba
   Contagem regressiva. A previa nova le tudo do objeto que o createOrder do
   proprio bloco devolveu, e nao remonta nada. Este arquivo e a PROVA disso.

   COMO A PROVA E FEITA, e por que ela vale. Nao da para chamar o createOrder de
   dentro da previa (ele vive dentro do IIFE do bloco, sem nome global). Entao a
   comparacao e entre DOIS caminhos independentes para o mesmo bloco:

     lado A  a previa da ferramenta, com o bloco rodando dentro do iframe, e o
             relatorio LIDO DA TELA -- exatamente o que o dono enxerga;
     lado B  o MESMO bloco (o texto da caixa de saida, byte a byte) executado
             numa pagina do molde comum, com o createOrder chamado direto.

   Os dois recebem a MESMA configuracao e o MESMO carrinho. Se o que a previa
   escreve na tela nao for, campo a campo, o que o createOrder devolve, a previa
   esta mentindo -- e e isso que as verificacoes abaixo cobram.

   AS DUAS FORMAS DA SONDA entram aqui de proposito, porque desde 13/09/2026 ela
   e UMA para as quatro abas e as duas pontas precisam continuar cobertas:
     Checkout      render(elemento), COM onClick, e reagindo a cada clique;
     Link de cobranca  render('#fcpg-pp') -- SELETOR EM TEXTO --, SEM onClick e
                   sem raiz a que reagir. Era ali que morava a copia manuscrita.

   ROTEIRO: node scripts/verificar/paypal-previa.mjs
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { navegador, servir, abrir, set, radio, clicar, ler } from './lib.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};
const PROD = [
  /* o ponto e o hifen entram de proposito: o 'sku' NAO passa pela regra estreita do txid */
  {nome:'Ensaio "A" \\ é',  preco:'113.70', sku:'ENS-A.2026'},
  {nome:'Ensaio B',        preco:'29.60',  sku:''}
];
const OP = {nome:'Álbum 20x30', preco:'20.00', sku:'ALB-20x30'};
const CUPOM = {cod:'MEIO', valor:'25'};

/* ===========================================================================
   O QUE SE LE DA TELA DA PREVIA -- e so o que esta DESENHADO
   ===========================================================================
   O quadro da sonda e uma pilha de linhas. Cada linha de item tem tres celulas
   (nome, quantidade, unit_amount) e cada linha de total tem duas (o nome do
   campo do PayPal e o valor). Isto le o texto, como o dono leria, e nunca o
   objeto por tras -- senao a prova estaria comparando o objeto consigo mesmo.
   =========================================================================== */
function lerQuadro(escopo, caixaId){
  return escopo.evaluate(id => {
    const cx = document.getElementById(id);
    if(!cx) return {faltou:'o quadro '+id+' nao existe'};
    const linhas = [];
    cx.querySelectorAll('div').forEach(d => {
      const filhos = Array.prototype.slice.call(d.children);
      if(!filhos.length) return;
      if(filhos.some(f => f.children.length)) return;      /* so as folhas */
      linhas.push(filhos.map(f => f.textContent.trim()));
    });
    return {linhas, texto: cx.textContent};
  }, caixaId);
}
/* Do quadro lido, extrai o que a prova compara: a lista de itens e os campos
   de valor. A linha de item e a que tem TRES celulas; a de campo, DUAS, e a
   primeira celula e o nome do campo do PayPal. */
function interpretar(q){
  const itens = [], campos = {};
  for(const l of (q.linhas||[])){
    if(l.length === 4){
      if(l[0] === 'items[].name') continue;                 /* o cabecalho */
      itens.push({nome:l[0], sku:l[1], qtd:l[2], unit:l[3]});
    }else if(l.length === 2){
      campos[l[0]] = l[1];
    }
  }
  return {itens, campos};
}
/* O mesmo pedido, visto do lado B: o objeto que o createOrder devolveu, escrito
   nas MESMAS palavras que a previa usa na tela. Escrito aqui, e nao lido de
   nenhuma funcao compartilhada com a previa -- se os dois lados formatassem pelo
   mesmo codigo, a prova nao teria opiniao nenhuma. */
function comoATelaEscreveria(pu){
  const din = o => o ? (String(o.value)+' '+String(o.currency_code)) : null;
  const its = pu.items || [], br = (pu.amount||{}).breakdown || {};
  const campos = {
    'amount.breakdown.item_total': din(br.item_total),
    'amount.value':                din(pu.amount),
    'description':                 pu.description,
    'custom_id':                   pu.custom_id
  };
  if(br.discount) campos['amount.breakdown.discount'] = '- '+din(br.discount);
  /* O TRACO e como a tela escreve a AUSENCIA do campo. Escrito aqui, e nao lido da previa:
     se os dois lados formatassem pelo mesmo codigo, a prova nao teria opiniao nenhuma. */
  return {
    itens: its.map(it => ({nome:String(it.name),
      sku: (it.sku==null ? '\u2014' : String(it.sku)),
      qtd:String(it.quantity), unit:din(it.unit_amount)})),
    campos
  };
}
function comparar(rot, tela, pedido){
  chk(rot+'a previa mostra o MESMO numero de itens que o pedido tem',
      tela.itens.length === pedido.itens.length,
      'previa '+tela.itens.length+' x pedido '+pedido.itens.length);
  const n = Math.min(tela.itens.length, pedido.itens.length);
  for(let z=0;z<n;z++){
    const a = tela.itens[z], b = pedido.itens[z];
    chk(rot+'item '+(z+1)+': nome, SKU, quantidade e unit_amount iguais aos do pedido',
        a.nome===b.nome && a.sku===b.sku && a.qtd===b.qtd && a.unit===b.unit,
        'previa '+JSON.stringify(a)+' x pedido '+JSON.stringify(b));
  }
  for(const k of Object.keys(pedido.campos)){
    const esperado = pedido.campos[k];
    if(esperado == null) continue;
    chk(rot+'campo "'+k+'" iguais',
        tela.campos[k] === String(esperado),
        'previa '+JSON.stringify(tela.campos[k])+' x pedido '+JSON.stringify(String(esperado)));
  }
  /* e o contrario: a previa nao pode INVENTAR um campo que o pedido nao tem */
  if(!pedido.campos['amount.breakdown.discount'])
    chk(rot+'sem desconto no pedido, a previa nao inventa a linha de desconto',
        tela.campos['amount.breakdown.discount'] === undefined,
        JSON.stringify(tela.campos['amount.breakdown.discount']));
}

/* A sonda do SDK para o LADO B (a previa tem a sua propria, por dentro). */
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
/* Marca (ou desmarca) uma caixa DENTRO de um frame, clicando no LABEL e so quando o
   estado precisa mudar -- clicar sempre inverteria o que ja estava certo, e foi assim
   que a primeira passagem deste arquivo desmarcou o produto e deixou os opcionais
   escondidos (eles so aparecem com o produto escolhido). */
async function marcar(frame, seletor, ligado){
  const el = await frame.$(seletor);
  if(!el) return;
  if(await el.evaluate(e => e.checked) === ligado) return;
  await frame.click('label:has('+seletor+')');
}
const pedidoDoBloco = pg => pg.evaluate(() => {
  if(!window.__pp || !window.__pp.createOrder) return {erro:'sem createOrder'};
  try{ return {pu: window.__pp.createOrder(null,{order:{create:x=>x}}).purchase_units[0]}; }
  catch(e){ return {erro:String(e&&e.message||e)}; }
});

/* ===========================================================================
   1) CHECKOUT -- render(elemento), com onClick, reagindo ao clique
   =========================================================================== */
console.log('\n== Checkout: a previa contra o proprio createOrder ==');
{
  const srv = await servir(RAIZ, 8801);
  const br  = await navegador();
  let saida = '', telaCheckout = null;
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8801');
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
    await clicar(pg,'aba-uni');
    for(let i=0;i<PROD.length;i++){
      await set(pg,'u-pnome',PROD[i].nome); await set(pg,'u-ppreco',PROD[i].preco);
      if(PROD[i].sku) await set(pg,'u-psku',PROD[i].sku);
      if(i===0){
        await set(pg,'u-op-nome',OP.nome); await set(pg,'u-op-preco',OP.preco);
        await set(pg,'u-op-sku',OP.sku);
        await clicar(pg,'u-op-add');
        await radio(pg,'u-opsel','multiplo');
      }
      await clicar(pg,'u-prod-salvar');
    }
    await radio(pg,'u-selprod','multiplo');
    await set(pg,'u-cp-cod',CUPOM.cod); await radio(pg,'u-cp-tipo','pct_total');
    await set(pg,'u-cp-valor',CUPOM.valor); await clicar(pg,'u-cp-add');
    await clicar(pg,'u-gerar');
    saida = (await ler(pg,'u-out')) || '';
    chk('[Checkout] a ferramenta gerou o bloco', saida.length > 1000);

    /* --- o lado A: mexer DENTRO da previa, como o dono mexeria --- */
    await pg.waitForTimeout(900);
    let alvo = null;
    for(const f of pg.frames()){ if(f !== pg.mainFrame() && await f.$('.fcuni')){ alvo = f; break; } }
    chk('[Checkout] a previa desenhou o bloco dentro do iframe', !!alvo);
    if(alvo) await marcar(alvo, 'input[name="fcu-prod"][value="0"]', true);
    await pg.waitForTimeout(200);
    /* o produto SEM sku entra no carrinho de proposito: e ele que produz a linha do traco */
    if(alvo) await marcar(alvo, 'input[name="fcu-prod"][value="1"]', true);
    await pg.waitForTimeout(200);
    if(alvo) await marcar(alvo, 'input[name="fcu-op-0"][value="0"]', true);
    await pg.waitForTimeout(200);
    if(alvo){
      await alvo.fill('.fcu-cupom-l input', CUPOM.cod);
      await alvo.click('.fcu-cupom-l button');
      await pg.waitForTimeout(350);
    }
    chk('[Checkout] o quadro do PayPal existe dentro da previa',
        !!(alvo && await alvo.$('#u-pv-pp')));
    if(alvo){
      telaCheckout = interpretar(await lerQuadro(alvo, 'u-pv-pp'));
      chk('[Checkout] a previa declara que item de R$ 0,00 fica de fora',
          /R\$ 0,00 não entra na lista/.test((await lerQuadro(alvo,'u-pv-pp')).texto||''));
      chk('[Checkout] e declara que a conta fecha ao centavo',
          /Confere ao centavo/.test((await lerQuadro(alvo,'u-pv-pp')).texto||''));
      /* A FRASE VELHA NAO PODE SOBREVIVER AO CAMPO. Ate 14/09/2026 a previa dizia, em cinza,
         que o sku era "igual em todas as linhas" -- uma descricao honesta de um defeito. Com o
         SKU por linha ela viraria mentira, e mentira em cinza e a que ninguem confere. */
      const txtQ = (await lerQuadro(alvo,'u-pv-pp')).texto||'';
      chk('[Checkout] a previa NAO diz mais que o sku e "igual em todas as linhas"',
          !/igual em todas as linhas/.test(txtQ));
      chk('[Checkout] e explica que o SKU e daquele item, e nunca o codigo do pedido',
          /SKU DAQUELE item/.test(txtQ) && /nunca com o código do pedido/.test(txtQ),
          txtQ.slice(0,200));
    }
    await pg.close();
  } finally { await br.close(); srv.close(); }

  /* --- o lado B: o mesmo bloco, o mesmo carrinho, o createOrder direto --- */
  const b = await comBlocoNaPagina({
    bloco: saida, cabeca: CABECA, porta: 8802,
    medir: async pg => {
      await pg.waitForTimeout(250);
      await marcar(pg, 'input[name="fcu-prod"][value="0"]', true);
      await pg.waitForTimeout(120);
      await marcar(pg, 'input[name="fcu-prod"][value="1"]', true);
      await pg.waitForTimeout(120);
      await marcar(pg, 'input[name="fcu-op-0"][value="0"]', true);
      await pg.waitForTimeout(120);
      await pg.fill('.fcu-cupom-l input', CUPOM.cod);
      await pg.click('.fcu-cupom-l button');
      await pg.waitForTimeout(120);
      return {ped: await pedidoDoBloco(pg)};
    }
  });
  chk('[Checkout] o bloco montou o pedido no lado B', !b.ped.erro, b.ped.erro);
  if(telaCheckout && b.ped.pu) comparar('[Checkout] ', telaCheckout, comoATelaEscreveria(b.ped.pu));
}

/* ===========================================================================
   2) LINK DE COBRANCA -- render('#fcpg-pp'), sem onClick, sem raiz
   ===========================================================================
   Esta e a ponta que ate 13/09/2026 tinha uma sonda SO DELA, manuscrita. Se a
   unificacao tivesse quebrado alguma das duas diferencas (o seletor em texto, a
   marca fcPvSemPayPal que o shim confere), a previa desta aba nem desenharia --
   e e por isso que ela entra aqui, e nao por completude.
   =========================================================================== */
console.log('\n== Link de cobranca: a previa contra o proprio createOrder ==');
{
  const srv = await servir(RAIZ, 8803);
  const br  = await navegador();
  let bloco = '', link = '', telaCob = null;
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8803');
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
    await clicar(pg,'aba-cob');
    await radio(pg,'p-usapp','sim'); await radio(pg,'p-ppmodo','sdk');
    /* o endereco da /pagar: sem ele o LINK nao e montado (e a previa cai no quadro de
       recusa, sem desenhar o botao) -- a recusa da aba, funcionando */
    await set(pg,'p-url','https://www.fotocerta.com.br/pagar');
    await set(pg,'p-desc','Ensaio "A" \\ é <b>o teste</b>');
    await set(pg,'p-valor','113.70');
    await set(pg,'p-txid','FC-TESTE-1');
    await clicar(pg,'p-gerar');
    /* SAO DOIS BOTOES nesta aba: 'p-gerar' escreve o BLOCO (p-out1) e 'p-gerarlink'
       escreve o LINK daquela cobranca (p-out2). O lado B precisa dos dois -- o bloco
       para rodar e a consulta do link para ele ter o que cobrar. */
    await clicar(pg,'p-gerarlink');
    await pg.waitForTimeout(150);
    bloco = (await ler(pg,'p-out1')) || '';
    link  = (await ler(pg,'p-out2')) || '';
    chk('[Cobranca] a ferramenta gerou o bloco e o link', bloco.length>1000 && link.length>20);
    await pg.waitForTimeout(900);
    let alvo = null;
    for(const f of pg.frames()){ if(f !== pg.mainFrame() && await f.$('#p-pv-pp')){ alvo = f; break; } }
    chk('[Cobranca] o quadro do PayPal existe dentro da previa (a sonda unificada desenhou)', !!alvo);
    if(alvo){
      const q = await lerQuadro(alvo,'p-pv-pp');
      telaCob = interpretar(q);
      chk('[Cobranca] a previa NAO mostra a linha do clique (este bloco nao tem onClick)',
          !/Ao clicar em pagar/.test(q.texto||''));
      chk('[Cobranca] o aviso do shim NAO acusou o SDK do PayPal (a marca continua la)',
          !/não foi possível isolar[\s\S]*SDK do PayPal/.test(await alvo.evaluate(()=>document.body.textContent)));
    }
    await pg.close();
  } finally { await br.close(); srv.close(); }

  const busca = link.indexOf('?')>=0 ? link.slice(link.indexOf('?')) : '';
  const b = await comBlocoNaPagina({
    bloco, cabeca: CABECA, porta: 8804, busca,
    medir: async pg => { await pg.waitForTimeout(400); return {ped: await pedidoDoBloco(pg)}; }
  });
  chk('[Cobranca] o bloco montou o pedido no lado B', !b.ped.erro, b.ped.erro);
  if(telaCob && b.ped.pu) comparar('[Cobranca] ', telaCob, comoATelaEscreveria(b.ped.pu));
}

/* ===========================================================================
   3) CALCULADORA DE ALBUM -- a terceira forma da sonda (16/09/2026)
   ===========================================================================
   POR QUE ELA ENTRA. As duas pontas acima cobrem o render(elemento) com onClick e o
   render(seletor em texto) sem onClick. A calculadora traz uma terceira diferenca, e
   nao e de sonda: o CARRINHO DELA NAO E UMA ESCOLHA, E UMA CONTA. Nas outras abas o
   item entra no pedido porque alguem marcou uma caixa; aqui ele e calculado a partir
   do tamanho, do numero de fotos e dos acabamentos, e o preco unitario do album muda
   a cada movimento da barra. Uma previa que remontasse esse numero por conta propria
   divergiria no primeiro arredondamento -- e e exatamente esse o risco que este
   arquivo existe para vigiar.

   O SINAL FICA DESLIGADO: com sinal o PayPal cobra em linha unica (o formato nao tem
   campo para entrada), e nao haveria lista de itens para comparar. A outra metade --
   que com sinal a lista NAO sai -- ja e medida em calculadora-album.mjs.
   =========================================================================== */
console.log('\n== Calculadora de album: a previa contra o proprio createOrder ==');
{
  const srv = await servir(RAIZ, 8805);
  const br  = await navegador();
  let saida = '', telaAlbum = null;

  /* O MESMO carrinho dos dois lados, num lugar so: se as duas montagens divergirem, a
     comparacao acusaria uma diferenca que e do roteiro, e nao da previa. */
  const montarCarrinho = async alvo => {
    await alvo.locator('.fcal-tam').first().click();
    await alvo.evaluate(() => {
      const r = document.querySelector('.fcal-range');
      r.value = String(Math.round((parseInt(r.max,10) + parseInt(r.min,10)) / 2));
      r.dispatchEvent(new Event('input', {bubbles:true}));
    });
    const cx = alvo.locator('.fcal-acab').first();
    if(await cx.count()) await cx.click();
  };

  try{
    const pg = await abrir(br, 'http://127.0.0.1:8805');
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
    await clicar(pg,'aba-alb');
    await set(pg,'v-cod','ALB26');
    await radio(pg,'v-sinal','nao');
    /* um tamanho com SKU e um acabamento com SKU: as duas linhas que o relatorio mostra */
    await set(pg,'v-tam-cm','50'); await set(pg,'v-tam-media','5');
    await set(pg,'v-tam-minfotos','50'); await set(pg,'v-tam-sku','ALB-50');
    await clicar(pg,'v-tam-add');
    await set(pg,'v-ac-nome','Mini-réplica'); await set(pg,'v-ac-valor','390');
    await set(pg,'v-ac-sku','MINI-REP');
    await clicar(pg,'v-ac-add');
    await clicar(pg,'v-gerar');
    saida = (await ler(pg,'v-out')) || '';
    chk('[Album] a ferramenta gerou o bloco', saida.length > 1000);

    await pg.waitForTimeout(900);
    let alvo = null;
    for(const f of pg.frames()){ if(f !== pg.mainFrame() && await f.$('.fcal-raiz')){ alvo = f; break; } }
    chk('[Album] a previa desenhou o bloco dentro do iframe', !!alvo);
    if(alvo){
      await montarCarrinho(alvo);
      await pg.waitForTimeout(400);
      chk('[Album] o quadro do PayPal existe dentro da previa', !!(await alvo.$('#v-pv-pp')));
      telaAlbum = interpretar(await lerQuadro(alvo, 'v-pv-pp'));
    }
    await pg.close();
  } finally { await br.close(); srv.close(); }

  const b = await comBlocoNaPagina({
    bloco: saida, cabeca: CABECA, porta: 8806,
    medir: async pg => {
      await pg.waitForTimeout(400);
      await montarCarrinho(pg);
      await pg.waitForTimeout(250);
      return {ped: await pedidoDoBloco(pg)};
    }
  });
  chk('[Album] o bloco montou o pedido no lado B', !b.ped.erro, b.ped.erro);
  if(telaAlbum && b.ped.pu) comparar('[Album] ', telaAlbum, comoATelaEscreveria(b.ped.pu));
}

process.exit(resumo());
