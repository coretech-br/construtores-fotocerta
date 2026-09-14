/* ============================================================================
   A LISTA DO PAYPAL EM TELA ESTREITA: MUDA A FORMA, NAO O CONTEUDO
   ============================================================================
   O QUE ESTA RODADA PROMETE. A lista "O que o PayPal vai registrar" passou a ter
   DUAS formas, nas duas telas que a mostram:

     EM COLUNA     cabecalho com os quatro nomes de campo, e uma linha de quatro
                   celulas por item -- o que existia ate 14/09/2026;
     EMPILHADA     sem cabecalho, um BLOCO por item, cada campo numa linha de duas
                   celulas (o nome do campo do PayPal a esquerda, o valor a direita),
                   os blocos separados por uma linha tracejada.

   Quem escolhe entre as duas: na ferramenta, a largura do proprio quadro, medida no
   pai (>=308 e coluna; abaixo disso, empilhada), com um ouvinte de resize que refaz o
   desenho; na /cobrar, uma @media (max-width:374px) -- CSS puro, o mesmo DOM.

   POR QUE ISSO PRECISA SER MEDIDO. Duas formas para a mesma informacao sao duas
   chances de uma delas mentir. A forma estreita e a que o dono ve no celular, e ela
   nasceu porque "Ensaio de Natal" saia quase uma letra por linha -- se o conserto do
   amassado perder um item, trocar um SKU de lugar ou comer o traco que anuncia o SKU
   ausente, o defeito e PIOR que o amassado: ali ele estava ilegivel, aqui ele fica
   legivel e errado. E a forma estreita e justamente a que ninguem confere num monitor.

   COMO A PROVA E FEITA, e por que ela nao envelhece. A regra de 13/09/2026 manda
   preferir medir a PROPRIEDADE a comparar com um congelado. Aqui nao ha commit de
   referencia nenhum: a prova compara AS DUAS FORMAS DA ARVORE DE HOJE ENTRE SI. A
   mesma previa, a mesma cobranca, os mesmos itens -- estreita-se o quadro, dispara-se
   o resize, e o que se cobra e que o conteudo lido da tela seja identico, campo a
   campo. Se a forma mudar o conteudo, e defeito; se um dia a forma estreita deixar de
   existir, isto fica vermelho por si, sem depender de nenhuma arvore antiga.

   O LIMIAR entra explicitamente (307 empilha, 320 nao) porque ele e um numero medido
   -- 80+52+82+76 mais tres vaos de 6 --, e numero medido que ninguem confere volta a
   ser numero escolhido na primeira vez que alguem mexer nas larguras.

   ROTEIRO: node scripts/verificar/previa-estreita.mjs
   ============================================================================ */
import { chk, resumo } from './pagina.mjs';
import { navegador, servir, abrir, set, radio, clicar, ler } from './lib.mjs';
import { preparar, cobranca } from './cenario.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* Os quatro nomes de campo de ITEM, na ordem em que as duas telas os mostram. Escritos
   aqui, e nao lidos de FC_PP_CAMPOS: se a prova lesse a mesma fonte que o desenho, ela
   nao teria opiniao nenhuma sobre o que deveria estar escrito na tela. */
const CAMPOS_ITEM = ['items[].name', 'items[].sku', 'quantity', 'unit_amount'];
/* Os cinco de TOTAL. O desconto so aparece quando ha cupom -- por isso o cenario tem um. */
const CAMPOS_TOTAL = ['amount.breakdown.item_total', 'amount.breakdown.discount',
  'amount.value', 'description', 'custom_id'];

/* O cenario do Checkout: nome longo de proposito (e ele que amassava), um produto COM
   SKU e outro SEM (o traco), mais um opcional com SKU e um cupom (a linha de desconto). */
const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};
const PROD = [
  {nome:'Ensaio de Natal — família Silva', preco:'420.00', sku:'ENS-NAT.2026'},
  {nome:'Foto extra',                      preco:'35.00',  sku:''}
];
const OP = {nome:'Álbum 20x30', preco:'120.00', sku:'ALB-20x30'};
const CUPOM = {cod:'MEIO', valor:'10'};
/* A cobranca da /cobrar, com os mesmos dois casos: item com SKU e item sem. */
const ITENS_COBRAR = 'Ensaio de Natal — família Silva | ENS-NAT.2026 | 900,00\nÁlbum 20x20 |  | 300,50';

/* ===========================================================================
   LER O RELATORIO DA FERRAMENTA -- e so o que esta DESENHADO
   ===========================================================================
   A leitura e do `pai` (o bloco do relatorio dentro do quadro), e nunca do quadro
   inteiro: o quadro tambem carrega o DESENHO do botao do PayPal, que tem uma linha de
   duas celulas ("PayPal" / "Cartao de debito ou credito") -- ela entraria na conta e
   faria as duas formas parecerem diferentes por causa do desenho, e nao do pedido.
   (A mesma armadilha ja esta registrada em previa-cobrar.mjs.) */
const lerRelatorio = (escopo, caixaId) => escopo.evaluate(id => {
  const cx = document.getElementById(id);
  if(!cx) return {faltou:'o quadro '+id+' nao existe'};
  const pai = Array.prototype.slice.call(cx.children)
    .filter(c => /O que o PayPal vai registrar/.test(c.textContent))[0];
  if(!pai) return {faltou:'o bloco do relatorio nao esta dentro de '+id};
  const linhas = [];
  pai.querySelectorAll('div').forEach(d => {
    const filhos = Array.prototype.slice.call(d.children);
    if(!filhos.length) return;
    if(filhos.some(f => f.children.length)) return;        /* so as folhas */
    linhas.push(filhos.map(f => f.textContent.trim()));
  });
  /* Os separadores tracejados ENTRE os blocos de item: divs vazios (sem filhos e sem
     texto) com borda tracejada. O `pai` e a linha da decisao do clique tambem tem borda
     tracejada, mas os dois tem filhos -- por isso o filtro pede folha vazia. */
  const tracos = Array.prototype.slice.call(pai.children).filter(c =>
    !c.children.length && !c.textContent.trim() &&
    /border-top:1px dashed/.test(c.getAttribute('style')||'')).length;
  return {linhas, tracos, largura: pai.clientWidth, texto: pai.textContent};
}, caixaId);

/* A MESMA LEITURA PARA AS DUAS FORMAS. Coluna: linha de item tem QUATRO celulas (e a
   primeira delas, quando diz items[].name, e o cabecalho). Empilhada: cada item vira
   QUATRO linhas de duas celulas, e a primeira celula e o nome do campo. O resultado sai
   no MESMO formato nos dois casos -- e por isso o invariante e uma comparacao direta. */
function extrair(q){
  const itens = [], campos = {}, ordemCampoItem = [];
  let cabecalho = false, linhas4 = 0, paresDeItem = 0, atual = null;
  for(const l of (q.linhas||[])){
    if(l.length === 4){
      linhas4++;
      if(l[0] === CAMPOS_ITEM[0] && l[1] === CAMPOS_ITEM[1]){ cabecalho = true; continue; }
      itens.push({nome:l[0], sku:l[1], qtd:l[2], unit:l[3]});
    }else if(l.length === 2){
      const k = l[0], v = l[1];
      if(CAMPOS_ITEM.indexOf(k) >= 0){
        paresDeItem++;
        if(itens.length <= 1) ordemCampoItem.push(k);   /* a ordem do PRIMEIRO item */
        if(k === CAMPOS_ITEM[0]){ atual = {nome:v, sku:'', qtd:'', unit:''}; itens.push(atual); }
        else if(atual){
          if(k === CAMPOS_ITEM[1]) atual.sku = v;
          else if(k === CAMPOS_ITEM[2]) atual.qtd = v;
          else atual.unit = v;
        }
      }else if(CAMPOS_TOTAL.indexOf(k) >= 0){
        campos[k] = v;
      }
    }
  }
  return {itens, campos, cabecalho, linhas4, paresDeItem,
          ordemCampoItem: ordemCampoItem.slice(0,4), tracos:q.tracos, largura:q.largura};
}

/* ESTREITAR O QUADRO ATE O PAI MEDIR EXATAMENTE O ALVO. A largura pedida e a do `pai`,
   que e quem a sonda le -- e entre ele e a caixa ha borda e recuo, cuja soma depende do
   box-sizing que o bloco hospedeiro tiver. Em vez de supor, mede e corrige: duas voltas
   bastam, e a terceira existe so para nao depender de "bastam". Ao final dispara o
   resize DENTRO do iframe e espera o timer de 150ms da sonda passar. */
async function estreitar(frame, caixaId, alvoPai){
  let pedida = alvoPai, medida = -1;
  for(let volta = 0; volta < 4; volta++){
    medida = await frame.evaluate(([id, w]) => {
      const cx = document.getElementById(id);
      if(!cx) return -1;
      cx.style.width = w + 'px';
      cx.style.maxWidth = w + 'px';
      const pai = Array.prototype.slice.call(cx.children)
        .filter(c => /O que o PayPal vai registrar/.test(c.textContent))[0];
      return pai ? pai.clientWidth : -1;
    }, [caixaId, pedida]);
    if(medida === alvoPai || medida < 0) break;
    pedida += (alvoPai - medida);
  }
  await frame.evaluate(() => window.dispatchEvent(new Event('resize')));
  await frame.waitForTimeout(280);
  return medida;
}

/* Marca (ou desmarca) uma caixa DENTRO de um frame, clicando no LABEL e so quando o
   estado precisa mudar -- clicar sempre inverteria o que ja estava certo. Mesma peca de
   paypal-previa.mjs, e pelo mesmo motivo registrado la. */
async function marcarNoFrame(frame, seletor, ligado){
  const el = await frame.$(seletor);
  if(!el) return;
  if(await el.evaluate(e => e.checked) === ligado) return;
  await frame.click('label:has('+seletor+')');
}

const mesmoConteudo = (a, b) =>
  JSON.stringify(a.itens) === JSON.stringify(b.itens) &&
  JSON.stringify(a.campos) === JSON.stringify(b.campos);

/* ===========================================================================
   BLOCO A -- A PREVIA DA FERRAMENTA (Checkout): a mesma previa, duas formas
   =========================================================================== */
console.log('== BLOCO A -- a previa da ferramenta: coluna, empilhada, e o limiar ==');
let telaFerramentaEmpilhada = null;
{
  const srv = await servir(RAIZ, 8901);
  const br  = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:8901');
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
    chk('[A] a ferramenta gerou o bloco do Checkout', ((await ler(pg,'u-out'))||'').length > 1000);

    await pg.waitForTimeout(900);
    let alvo = null;
    for(const f of pg.frames()){ if(f !== pg.mainFrame() && await f.$('.fcuni')){ alvo = f; break; } }
    chk('[A] a previa desenhou o bloco dentro do iframe', !!alvo);
    if(alvo){
      /* o carrinho: os dois produtos (um sem SKU, de proposito) mais o opcional, e o
         cupom, que e quem faz nascer a linha de desconto */
      await marcarNoFrame(alvo, 'input[name="fcu-prod"][value="0"]', true);
      await pg.waitForTimeout(200);
      await marcarNoFrame(alvo, 'input[name="fcu-prod"][value="1"]', true);
      await pg.waitForTimeout(200);
      await marcarNoFrame(alvo, 'input[name="fcu-op-0"][value="0"]', true);
      await pg.waitForTimeout(200);
      await alvo.fill('.fcu-cupom-l input', CUPOM.cod);
      await alvo.click('.fcu-cupom-l button');
      await pg.waitForTimeout(350);

      /* ---- 1. a largura natural: EM COLUNA ---- */
      const coluna = extrair(await lerRelatorio(alvo,'u-pv-pp'));
      chk('[A] na largura natural o quadro e mais largo que o limiar de 308px',
          coluna.largura >= 308, 'o quadro mede '+coluna.largura+'px');
      chk('[A] na largura natural existe o cabecalho com os quatro nomes de campo',
          coluna.cabecalho, JSON.stringify(coluna.linhas4));
      chk('[A] na largura natural ha uma linha de quatro celulas por item',
          coluna.itens.length === 3 && coluna.linhas4 === 4,
          coluna.itens.length+' itens, '+coluna.linhas4+' linhas de quatro celulas');
      chk('[A] na largura natural nao ha par empilhado nenhum',
          coluna.paresDeItem === 0, String(coluna.paresDeItem));
      chk('[A] o cenario produziu o item SEM SKU (o traco) e os dois COM',
          coluna.itens.length === 3 && coluna.itens.filter(i=>i.sku==='—').length === 1,
          JSON.stringify(coluna.itens.map(i=>i.sku)));
      chk('[A] o cenario produziu a linha de desconto (o cupom entrou)',
          !!coluna.campos['amount.breakdown.discount'],
          JSON.stringify(Object.keys(coluna.campos)));

      /* ---- 2. a MESMA previa, estreitada: EMPILHADA ---- */
      const medida = await estreitar(alvo, 'u-pv-pp', 280);
      const empilhada = extrair(await lerRelatorio(alvo,'u-pv-pp'));
      telaFerramentaEmpilhada = empilhada;
      chk('[A] o quadro de fato estreitou para abaixo de 308px',
          medida === 280 && empilhada.largura === 280, 'pedi 280, o pai mede '+empilhada.largura);
      chk('[A] estreitado, NAO ha mais nenhuma linha de quatro celulas',
          empilhada.linhas4 === 0, String(empilhada.linhas4));
      chk('[A] estreitado, o cabecalho sumiu', !empilhada.cabecalho);
      chk('[A] estreitado, cada item virou quatro linhas de duas celulas',
          empilhada.itens.length === 3 && empilhada.paresDeItem === 12,
          empilhada.itens.length+' itens, '+empilhada.paresDeItem+' pares');
      chk('[A] estreitado, os quatro nomes de campo aparecem em cada bloco',
          JSON.stringify(empilhada.ordemCampoItem) === JSON.stringify(CAMPOS_ITEM),
          JSON.stringify(empilhada.ordemCampoItem));
      chk('[A] estreitado, os blocos ficam separados por linha tracejada',
          empilhada.tracos === empilhada.itens.length - 1,
          empilhada.tracos+' tracos para '+empilhada.itens.length+' itens');

      /* ---- 3. O INVARIANTE: a forma mudou, o conteudo nao ---- */
      chk('[A] O INVARIANTE: as duas formas mostram o MESMO numero de itens',
          coluna.itens.length === empilhada.itens.length,
          'coluna '+coluna.itens.length+' x empilhada '+empilhada.itens.length);
      for(let z=0; z<Math.min(coluna.itens.length, empilhada.itens.length); z++){
        chk('[A] O INVARIANTE: item '+(z+1)+' -- nome, SKU, quantidade e preco unitario iguais nas duas formas',
            JSON.stringify(coluna.itens[z]) === JSON.stringify(empilhada.itens[z]),
            JSON.stringify(coluna.itens[z])+'\n                x '+JSON.stringify(empilhada.itens[z]));
      }
      chk('[A] O INVARIANTE: os campos de total sao os mesmos, nome a nome',
          JSON.stringify(Object.keys(coluna.campos).sort()) === JSON.stringify(Object.keys(empilhada.campos).sort()),
          Object.keys(coluna.campos).sort().join(',')+'\n                x '+Object.keys(empilhada.campos).sort().join(','));
      chk('[A] O INVARIANTE: os campos de total tem os mesmos valores',
          Object.keys(coluna.campos).every(k => coluna.campos[k] === empilhada.campos[k]),
          JSON.stringify(coluna.campos)+'\n                x '+JSON.stringify(empilhada.campos));
      chk('[A] O INVARIANTE: nada mais mudou -- itens e campos identicos',
          mesmoConteudo(coluna, empilhada));

      /* ---- 4. o limiar, que e numero MEDIDO e por isso entra explicito ---- */
      const m307 = await estreitar(alvo, 'u-pv-pp', 307);
      const e307 = extrair(await lerRelatorio(alvo,'u-pv-pp'));
      chk('[A] o limiar: a 307px a lista EMPILHA',
          m307 === 307 && e307.linhas4 === 0 && !e307.cabecalho && e307.paresDeItem === 12,
          'largura='+e307.largura+' linhas4='+e307.linhas4+' cabecalho='+e307.cabecalho);
      const m320 = await estreitar(alvo, 'u-pv-pp', 320);
      const e320 = extrair(await lerRelatorio(alvo,'u-pv-pp'));
      chk('[A] o limiar: a 320px a lista continua EM COLUNA',
          m320 === 320 && e320.cabecalho && e320.linhas4 === 4 && e320.paresDeItem === 0,
          'largura='+e320.largura+' linhas4='+e320.linhas4+' cabecalho='+e320.cabecalho);
      chk('[A] o limiar: voltando a 320px o conteudo continua o mesmo',
          mesmoConteudo(e320, e307),
          JSON.stringify(e320.itens)+'\n                x '+JSON.stringify(e307.itens));
      chk('[A] o ouvinte de resize refez o desenho -- as quatro medidas mudaram de forma sozinhas',
          coluna.cabecalho && !empilhada.cabecalho && !e307.cabecalho && e320.cabecalho);
    }
    chk('[A] nenhum erro de console na ferramenta', pg.erros.length === 0, pg.erros.slice(0,2).join(' | '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

/* ===========================================================================
   BLOCO B -- A /cobrar: a mesma tabela, duas larguras de janela
   ===========================================================================
   Aqui o DOM e UM so: quem muda a forma e a @media. Entao a leitura tem de olhar para
   o que o CSS fez -- o cabecalho sumiu? a linha de item virou bloco? o nome do campo
   aparece? --, e o nome do campo, na forma empilhada, nao esta no texto: ele e um
   pseudo-elemento alimentado pelo data-campo. Ler o atributo provaria so que ele foi
   escrito; e o content computado do ::before que prova que ele esta NA TELA. */
console.log('\n== BLOCO B -- a /cobrar: 420px em coluna, 360px empilhada ==');
const lerCobrar = pg => pg.evaluate(() => {
  const cx = document.getElementById('cb-pv-pp');
  if(!cx) return {faltou:'a caixa cb-pv-pp nao existe'};
  const antes = el => {
    const c = getComputedStyle(el, '::before').content;
    return (!c || c === 'none' || c === 'normal') ? '' : c.replace(/^"|"$/g, '');
  };
  const cab = cx.querySelector('.cb-pp-cab');
  const itens = Array.prototype.slice.call(cx.querySelectorAll('.cb-pp-lin-item')).map(l => {
    const cel = Array.prototype.slice.call(l.children);
    return {
      valores: cel.map(c => c.textContent.trim()),
      atributos: cel.map(c => c.getAttribute('data-campo') || ''),
      naTela: cel.map(antes),
      forma: getComputedStyle(l).display
    };
  });
  const campos = {};
  cx.querySelectorAll('.cb-pp-lin-campo').forEach(l => {
    const c = Array.prototype.slice.call(l.children);
    if(c.length === 2) campos[c[0].textContent.trim()] = c[1].textContent.trim();
  });
  return {itens, campos,
    temCab: !!cab,
    cabVisivel: cab ? getComputedStyle(cab).display !== 'none' : false,
    cabTextos: cab ? Array.prototype.slice.call(cab.children).map(c => c.textContent.trim()) : [],
    pagina: document.documentElement.scrollWidth, janela: window.innerWidth};
});
const soValores = r => JSON.stringify(r.itens.map(i => i.valores));

let telaCobrarEmpilhada = null;
{
  const srv = await servir(RAIZ, 8902);
  const br  = await navegador();
  try{
    const base = 'http://127.0.0.1:8902';
    const pg = await abrir(br, base);
    /* A /cobrar le a identidade e a configuracao do bloco do localStorage da MESMA origem,
       entao o caminho e o mesmo de previa-cobrar.mjs: configurar na ferramenta primeiro.
       O endereco da /pagar aponta para previa.html -- pagina inerte do proprio repositorio --
       para o quadro da previa nao depender de internet nenhuma. */
    await preparar(pg); await clicar(pg,'aba-cob');
    await cobranca(pg, {url: base+'/previa.html', valor:'1200,50', txid:'FCTESTE1',
                        desc:'Ensaio de Natal — família Silva'});

    const leituras = {};
    for(const largura of [420, 360]){
      await pg.setViewportSize({width:largura, height:820});
      await pg.goto(base + '/cobrar/index.html');
      await pg.evaluate(() => { window.__alertas = []; window.alert = m => window.__alertas.push(String(m)); });
      await set(pg,'cb-desc','Ensaio de Natal — família Silva');
      await set(pg,'cb-valor','1200,50');
      await set(pg,'cb-txid','FCTESTE1');
      await radio(pg,'cb-ppmodo','sdk');
      await set(pg,'cb-itens', ITENS_COBRAR);
      await clicar(pg,'cb-gerar');
      await pg.waitForTimeout(250);
      /* abrir a previa SE estiver fechada -- clicar sempre a fecharia quando ela nasce aberta */
      await pg.evaluate(() => { const c=document.getElementById('cb-previa-corpo');
        if(c && c.style.display==='none') document.getElementById('cb-previa-bt').click(); });
      await pg.waitForTimeout(200);
      leituras[largura] = await lerCobrar(pg);
    }
    const larga = leituras[420], estreita = leituras[360];
    telaCobrarEmpilhada = estreita;

    chk('[B] a /cobrar montou a tabela com os dois itens nas duas larguras',
        larga.itens.length === 2 && estreita.itens.length === 2,
        '420px='+larga.itens.length+' 360px='+estreita.itens.length);
    /* --- 420px: em coluna --- */
    chk('[B] a 420px o cabecalho esta visivel', larga.temCab && larga.cabVisivel);
    chk('[B] a 420px o cabecalho traz os quatro nomes de campo',
        JSON.stringify(larga.cabTextos) === JSON.stringify(CAMPOS_ITEM),
        JSON.stringify(larga.cabTextos));
    chk('[B] a 420px a linha de item continua sendo uma linha (flex), e nao um bloco',
        larga.itens.every(i => i.forma === 'flex'),
        JSON.stringify(larga.itens.map(i => i.forma)));
    chk('[B] a 420px o nome do campo NAO se repete dentro de cada celula',
        larga.itens.every(i => i.naTela.every(t => !t)),
        JSON.stringify(larga.itens.map(i => i.naTela)));
    /* --- 360px: empilhada --- */
    chk('[B] a 360px o cabecalho existe no DOM mas esta escondido (display:none)',
        estreita.temCab && !estreita.cabVisivel, String(estreita.cabVisivel));
    chk('[B] a 360px cada linha de item virou um bloco (display:block)',
        estreita.itens.every(i => i.forma === 'block'),
        JSON.stringify(estreita.itens.map(i => i.forma)));
    chk('[B] a 360px cada celula carrega o data-campo com o nome do campo',
        estreita.itens.every(i => JSON.stringify(i.atributos) === JSON.stringify(CAMPOS_ITEM)),
        JSON.stringify(estreita.itens.map(i => i.atributos)));
    chk('[B] a 360px o nome do campo esta NA TELA -- o ::before esta ativo com o data-campo',
        estreita.itens.every(i => JSON.stringify(i.naTela) === JSON.stringify(CAMPOS_ITEM)),
        JSON.stringify(estreita.itens.map(i => i.naTela)));
    /* --- o invariante --- */
    chk('[B] O INVARIANTE: os itens lidos sao iguais nas duas larguras',
        soValores(larga) === soValores(estreita),
        soValores(larga)+'\n                x '+soValores(estreita));
    chk('[B] O INVARIANTE: o item sem SKU mostra o traco nas duas larguras',
        larga.itens.some(i => i.valores[1] === '—') &&
        estreita.itens.some(i => i.valores[1] === '—'),
        soValores(estreita));
    chk('[B] O INVARIANTE: os campos de total sao os mesmos, nome a nome',
        JSON.stringify(Object.keys(larga.campos).sort()) === JSON.stringify(Object.keys(estreita.campos).sort()),
        Object.keys(larga.campos).sort().join(',')+'\n                x '+Object.keys(estreita.campos).sort().join(','));
    chk('[B] O INVARIANTE: os campos de total tem os mesmos valores',
        Object.keys(larga.campos).every(k => larga.campos[k] === estreita.campos[k]),
        JSON.stringify(larga.campos)+'\n                x '+JSON.stringify(estreita.campos));
    /* --- e a razao de tudo isto: a 360px a pagina nao pode rolar de lado --- */
    chk('[B] a 360px a pagina continua sem rolagem lateral',
        estreita.pagina <= estreita.janela, estreita.pagina+' > '+estreita.janela);
    chk('[B] nenhum erro de console na /cobrar', pg.erros.length === 0, pg.erros.slice(0,2).join(' | '));
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

/* ===========================================================================
   BLOCO C -- AS DUAS TELAS CONCORDAM NA FORMA ESTREITA
   ===========================================================================
   Duas telas que mostram os mesmos nove campos nao podem discordar de COMO mostra-los.
   Esta e a unica verificacao que cruza as duas: os nomes de campo que a forma empilhada
   exibe, e a ordem deles. Os VALORES sao de cobrancas diferentes de proposito -- cada
   tela ja foi comparada consigo mesma acima, e uma cobranca comum nao acrescentaria
   nada a pergunta que este bloco faz. */
console.log('\n== BLOCO C -- empilhadas, as duas telas mostram os mesmos nomes, na mesma ordem ==');
{
  const daFerramenta = telaFerramentaEmpilhada ? telaFerramentaEmpilhada.ordemCampoItem : null;
  const daCobrar = (telaCobrarEmpilhada && telaCobrarEmpilhada.itens[0])
    ? telaCobrarEmpilhada.itens[0].naTela : null;
  chk('[C] as duas leituras chegaram ate aqui', !!daFerramenta && !!daCobrar,
      'ferramenta='+JSON.stringify(daFerramenta)+' cobrar='+JSON.stringify(daCobrar));
  chk('[C] empilhada, a ferramenta mostra os quatro nomes na ordem esperada',
      JSON.stringify(daFerramenta) === JSON.stringify(CAMPOS_ITEM), JSON.stringify(daFerramenta));
  chk('[C] empilhada, a /cobrar mostra os quatro nomes na ordem esperada',
      JSON.stringify(daCobrar) === JSON.stringify(CAMPOS_ITEM), JSON.stringify(daCobrar));
  chk('[C] e, portanto, as duas telas concordam entre si',
      JSON.stringify(daFerramenta) === JSON.stringify(daCobrar),
      JSON.stringify(daFerramenta)+' x '+JSON.stringify(daCobrar));
}

process.exit(resumo());
