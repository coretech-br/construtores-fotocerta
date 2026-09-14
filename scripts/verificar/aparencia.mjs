/* ============================================================================
   A APARENCIA DAS QUATRO ABAS DE PAGAMENTO, MEDIDA NO DOM (13/09/2026)
   ============================================================================
   POR QUE ISTO EXISTE. A leva 5 da unificacao e a da APARENCIA -- a categoria
   de menor gravidade, e por isso a ultima. Ler o CSS emitido NAO responde a
   pergunta desta leva: uma regra pode existir e nao alcancar o elemento, outra
   pode ser vencida por uma irma de mesma especificidade escrita depois, e
   'text-align' pode chegar por HERANCA de um seletor curinga que nem cita a
   classe (e o caso de .fca-ob-raiz *). Quem responde e getComputedStyle sobre
   o bloco RODANDO.

   O QUE ELE MEDE. Para cada aspecto desta leva, o valor COMPUTADO no elemento
   que o cliente ve, nas quatro abas, em duas larguras -- 1024 px e 375 px, a
   largura do aparelho do dono, onde ele viu o ultimo problema de layout.

   AS TRES ARMADILHAS DE MEDICAO, todas ja pagas neste projeto:

   1. getComputedStyle().display de um elemento DENTRO de um ancestral
      display:none devolve o dele proprio, nunca 'none'. Perguntar "esta
      visivel?" assim responde sempre "sim". Aqui a visibilidade e medida pela
      CAIXA (getBoundingClientRect: largura e altura maiores que zero), que e a
      unica leitura que atravessa o ancestral.

   2. Altura de caixa em item de flex ESTICA sozinha (align-items:stretch), e
      ja disse "quebrou" sobre um numero inteiro numa linha so -- ver o
      cabecalho de linha-de-dinheiro.mjs. Quebra de linha aqui e medida por
      FRAGMENTOS de linha (Range.getClientRects().length), nunca por altura.

   3. O marcador de selecao e DESENHADO (Manual do Prosite), entao o radio
      nativo por baixo pode nem estar no caminho do dedo. Clica-se no LABEL.

   AS TRES SECOES QUE NAO SEGUEM A REGRA GERAL, cada uma dita aqui para nao
   parecer descuido de quem ler:

   - ITEM 6 (a chapa branca do QR) ABRE A REDE para um host so, o cdnjs. A
     pergunta e se a chapa e decoracao ou se e a unica zona quieta do codigo, e
     so a qrcodejs de verdade responde -- transcrever o que uma biblioteca de
     terceiro faz seria opiniao, nao medicao. O preco esta aceito: essa secao
     pode falhar por rede. As outras nao tocam a rede.
   - ITEM 14 (a moldura da previa) nao olha bloco gerado nenhum: olha a
     FERRAMENTA, porque a duplicacao que a leva 5 desfez vivia no CSS dela.
   - A PROVA DO CONTRARIO compara com uma referencia PRESA em 6eabd1f, e diz
     NAO MEDIU (sem falhar) quando aquela arvore ja tiver a leva 5 dentro.
     O resto do arquivo mede PROPRIEDADE ("as quatro concordam"), que e a forma
     que nao envelhece no dia em que a rodada for mesclada.

   Uso:  node scripts/verificar/aparencia.mjs          # mede e confere
         node scripts/verificar/aparencia.mjs <ref>    # outra referencia
         FC_DUMP=1 node scripts/verificar/aparencia.mjs  # imprime a tabela crua
   ============================================================================ */
import { gerarNaFerramenta, comBlocoNaPagina, chk, resumo } from './pagina.mjs';
import { set, radio, clicar, servir, navegador, abrir } from './lib.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DUMP = !!process.env.FC_DUMP;
const RAIZ_FERRAMENTA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* A SONDA DO SDK DO PAYPAL e os ganchos de alert/window.open, no <head> e antes do bloco:
   os blocos penduram o script do SDK ja no carregamento, e instalar isto depois chegaria
   tarde. Mesmo texto de sinal.mjs, pelo mesmo motivo. */
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
  + 'window.alert=function(){};\n'
  + 'window.open=function(){return null;};\n'
  + '})();</scr'+'ipt>';

const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};

/* O ENDERECO DA RESERVA da pagina de obrigado. 'quando' no FUTURO de proposito: prazoFim()
   limita o prazo ao inicio do ensaio, e um horario passado cairia no cartao de "prazo
   vencido", que nao tem secao de pagamento nenhuma -- mediria uma tela que nao e esta. */
const A_DATA = '10/05/2030', A_HORA = '14:00', A_QUANDO = '2030-05-10T14:00:00Z';
const BUSCA_PAC = '?pac=ENS&data='+encodeURIComponent(A_DATA)
  + '&hora='+encodeURIComponent(A_HORA)+'&quando='+encodeURIComponent(A_QUANDO);

/* AS TRES RESPOSTAS DO SINAL precisam estar PREENCHIDAS: com os tres vazios nem a regra de
   CSS nem a div sao emitidas (e a fabrica), e medir o vazio nao diria nada sobre a aparencia
   delas. */
const R1 = 'O sinal garante o seu horario agendado';
const R2 = 'Cancelamento nao ha devolucao do sinal';
const R3 = 'O saldo deve ser pago ate 1 dia antes do seu ensaio';

/* ===========================================================================
   A PASSAGEM PELA FERRAMENTA -- uma so, com as quatro abas configuradas
   ===========================================================================
   DUAS CONFIGURACOES, e nao uma: o desconto do Pix e ZERADO pelo sinal (seria
   desconto dobrado, e a aba avisa em ambar), entao a linha do Pix com desconto
   e as tres linhas do sinal NAO cabem na mesma passagem. Quem tentar medir as
   duas de uma vez mede uma delas ausente e chama isso de "nao achei". */
async function gerar(cfg){
  console.log('\ngerando os quatro blocos  ['+cfg.id+'] ...');
  const r = await gerarNaFerramenta(async pg => {
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);

    /* ---------- Checkout ---------- */
    await clicar(pg,'aba-uni');
    /* DOIS produtos de proposito: com UM so, o Checkout desenha o item sem marcador nenhum
       (medido) -- "multiplo" so faz nascer caixa de selecao a partir do segundo, e o carrinho
       de um item unico ja nasce cheio. Medir a aba sem o caminho de escolha do cliente seria
       medir uma tela que o cliente nao ve. */
    await set(pg,'u-pnome','Ensaio de familia'); await set(pg,'u-ppreco','1200');
    await clicar(pg,'u-prod-salvar');
    await set(pg,'u-pnome','Ensaio de gestante'); await set(pg,'u-ppreco','900');
    await clicar(pg,'u-prod-salvar');
    /* O MODO DE ESCOLHA FICA NO PADRAO ('unico', marcador redondo) -- o mesmo que
       cenario.mjs usa. Medido: em 'multiplo' o clique no label nao marca a caixa, e a area do
       Pix nunca abre; a medicao inteira do Checkout passava a ler estilo computado de
       elemento escondido, que e a armadilha 1 do cabecalho deste arquivo. */
    await radio(pg,'u-zap','sim');
    await set(pg,'u-descpix', cfg.sinal ? '0' : '10');
    await radio(pg,'u-sinal', cfg.sinal ? 'sim' : 'nao');
    if(cfg.sinal){
      await radio(pg,'u-sinaltipo','pct'); await set(pg,'u-sinalpct','50');
      await set(pg,'u-txt-sinal-garante',R1);
      await set(pg,'u-txt-sinal-desistir',R2);
      await set(pg,'u-txt-sinal-saldo',R3);
    }
    await clicar(pg,'u-gerar');

    /* ---------- Mini loja ---------- */
    await clicar(pg,'aba-loja');
    await set(pg,'m-pnome','Ensaio de familia'); await set(pg,'m-ppreco','1200');
    await set(pg,'m-pcat','Ensaios');
    /* A VITRINE RECUSA PRODUTO SEM FOTO -- "a vitrine e feita de imagens: um produto sem foto
       sai como um retangulo vazio no meio da grade". Sem este campo a aba nao gera nada, e a
       medicao inteira da Mini loja seria feita sobre uma saida vazia. */
    await set(pg,'m-pimg','https://storage.alboom.ninja/ensaio-familia.jpg');
    await clicar(pg,'m-prod-salvar');
    await radio(pg,'m-zap','sim');
    await set(pg,'m-descpix', cfg.sinal ? '0' : '10');
    await radio(pg,'m-sinal', cfg.sinal ? 'sim' : 'nao');
    if(cfg.sinal){
      await radio(pg,'m-sinaltipo','pct'); await set(pg,'m-sinalpct','50');
      await set(pg,'m-txt-sinal-garante',R1);
      await set(pg,'m-txt-sinal-desistir',R2);
      await set(pg,'m-txt-sinal-saldo',R3);
    }
    await clicar(pg,'m-gerar');

    /* ---------- Link de cobranca ---------- */
    await clicar(pg,'aba-cob');
    await set(pg,'p-url','https://fotocerta.com.br/pagar');
    await set(pg,'p-desc','Ensaio de familia - pacote completo');
    await set(pg,'p-valor','1200,50');
    await radio(pg,'p-zap','sim');
    await radio(pg,'p-usapp','sim'); await radio(pg,'p-ppmodo','sdk');
    await set(pg,'p-descpix', cfg.sinal ? '0' : '10');
    await radio(pg,'p-sinal', cfg.sinal ? 'sim' : 'nao');
    if(cfg.sinal){
      await radio(pg,'p-sinaltipo','pct'); await set(pg,'p-sinalpct','50');
      await set(pg,'p-txt-sinal-garante',R1);
      await set(pg,'p-txt-sinal-desistir',R2);
      await set(pg,'p-txt-sinal-saldo',R3);
    }
    await clicar(pg,'p-gerar');
    await clicar(pg,'p-gerarlink');

    /* ---------- Agendamento por pacote ---------- */
    await clicar(pg,'aba-pac');
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-prefixo','FC');
    await radio(pg,'a-metodo','ambos');
    await set(pg,'a-pcod','ENS'); await set(pg,'a-pnome','Ensaio de familia');
    await set(pg,'a-pdur','1h'); await set(pg,'a-ppreco','1200');
    await set(pg,'a-pinclui','20 fotos'); await set(pg,'a-ppath','fotocerta/ens');
    await clicar(pg,'a-pac-salvar');
    await set(pg,'a-descpix', cfg.sinal ? '0' : '10');
    await radio(pg,'a-sinal', cfg.sinal ? 'sim' : 'nao');
    if(cfg.sinal){
      await radio(pg,'a-sinaltipo','pct'); await set(pg,'a-sinalpct','50');
      await set(pg,'a-txt-sinal-garante',R1);
      await set(pg,'a-txt-sinal-desistir',R2);
      await set(pg,'a-txt-sinal-saldo',R3);
    }
    await clicar(pg,'a-gerar');
  }, ['u-out','m-out','p-out1','p-out2','a-out3'], {porta: cfg.porta, raiz: cfg.raiz});

  chk('['+cfg.id+'] a ferramenta gerou sem alerta', r.alertas.length===0, JSON.stringify(r.alertas));
  chk('['+cfg.id+'] a ferramenta gerou sem erro de console', r.erros.length===0, r.erros.slice(0,2).join(' | '));
  for(const s of ['u-out','m-out','p-out1','a-out3'])
    chk('['+cfg.id+'] '+s+' saiu', (r.valores[s]||'').length > 1000);
  return r.valores;
}

/* ===========================================================================
   ABRIR A AREA DO PIX EM CADA ABA -- e a unica coisa diferente entre elas
   =========================================================================== */
async function abrirPix(pg, aba){
  if(aba === 'u'){
    /* Clica no LABEL, e nao no input: o marcador e DESENHADO (Manual do Prosite). E so quando
       ele EXISTE: com um produto unico a aba nao desenha marcador nenhum, e esperar por ele
       derrubava a medicao inteira com "timeout" -- que nao tem nada a ver com aparencia. */
    const lb = pg.locator('label:has(input[name="fcu-prod"][value="0"])');
    if(await lb.count()) { await lb.click(); await pg.waitForTimeout(150); }
    await pg.click('.fcu-gerar');
  }else if(aba === 'm'){
    /* A loja e uma VITRINE: o cartao abre primeiro, e so entao existe o botao de adicionar. */
    await pg.locator('.fcm-card').first().click();
    await pg.waitForTimeout(150);
    await pg.click('.fcm-add');
    await pg.waitForTimeout(150);
    await pg.click('.fcm-gerar');
  }else if(aba === 'a'){
    await pg.locator('.fca-ob-bt', {hasText:/Pix|Gerar/i}).first().click();
  }else{
    await pg.locator('.fcpg-bt').first().click();
  }
  await pg.waitForTimeout(450);
}

/* ===========================================================================
   O QUE SE LE DE CADA ELEMENTO
   ===========================================================================
   VISIBILIDADE PELA CAIXA, e nunca por getComputedStyle().display: o display
   computado de um filho de um ancestral display:none e o DELE, nao 'none'
   (armadilha 1 do cabecalho). rect.width/height zeradas e a unica leitura que
   atravessa o ancestral.
   FRAGMENTOS por Range, e nunca altura: item de flex estica (armadilha 2). */
const LER = (sel) => {
  const el = document.querySelector(sel);
  if(!el) return null;
  const s = getComputedStyle(el), r = el.getBoundingClientRect();
  const rg = document.createRange(); rg.selectNodeContents(el);
  return {
    existe:true,
    visivel: r.width > 0 && r.height > 0,
    caixa: {w: Math.round(r.width*10)/10, h: Math.round(r.height*10)/10},
    fragmentos: rg.getClientRects().length,
    fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color,
    background: s.backgroundColor, textAlign: s.textAlign,
    padding: s.paddingTop+' '+s.paddingRight+' '+s.paddingBottom+' '+s.paddingLeft,
    margin: s.marginTop+' '+s.marginRight+' '+s.marginBottom+' '+s.marginLeft,
    border: s.borderTopWidth+' '+s.borderTopStyle+' '+s.borderTopColor,
    radius: s.borderTopLeftRadius,
    gap: s.columnGap, alignItems: s.alignItems, resize: s.resize,
    height: s.height, opacity: s.opacity,
    scrollH: el.scrollHeight, clientH: el.clientHeight
  };
};

/* OS ASPECTOS DESTA LEVA, por aba. Chave = o item da lista do dono. */
const ASPECTOS = {
  u: {sinalAviso:'.fcu-sinal-aviso', pixManual:'.fcu-pixmanual', pixLinha:'.fcu-pixlinha',
      zap:'.fcu-zap', cola:'.fcu-cola', qr:'.fcu-qr', instrucao:'.fcu-instrucao',
      nota:'.fcu-nota', copiado:'.fcu-copiado', pixArea:'.fcu-pixarea',
      saldo:'.fcu-saldo', sinalTxt:'.fcu-sinal-txt-l', total:'.fcu-total'},
  m: {sinalAviso:'.fcm-sinal-aviso', pixManual:'.fcm-pixmanual', pixLinha:'.fcm-pixlinha',
      zap:'.fcm-zap', cola:'.fcm-cola', qr:'.fcm-qr', instrucao:'.fcm-instrucao',
      nota:'.fcm-nota', copiado:'.fcm-copiado', pixArea:'.fcm-pixarea',
      saldo:'.fcm-saldo', sinalTxt:'.fcm-sinal-txt-l', total:'.fcm-total'},
  a: {sinalAviso:'.fca-ob-sinal-aviso', pixManual:'.fca-ob-pixmanual', pixLinha:null,
      zap:'.fca-ob-zap', cola:'.fca-ob-cod', qr:'.fca-ob-qr', instrucao:null,
      nota:null, copiado:null, pixArea:'.fca-ob-pixarea',
      saldo:'.fca-ob-saldo', sinalTxt:'.fca-ob-sinal-txt-l', total:null},
  p: {sinalAviso:null, pixManual:'.fcpg-pixmanual', pixLinha:'.fcpg-pixlinha',
      zap:null, cola:'.fcpg-cod', qr:'.fcpg-qr', instrucao:null,
      nota:null, copiado:null, pixArea:null,
      saldo:'.fcpg-saldo', sinalTxt:'.fcpg-sinal-txt-l', total:null}
};

async function medir(bloco, aba, largura, porta){
  const mapa = ASPECTOS[aba];
  return await comBlocoNaPagina({
    bloco, cabeca: CABECA, porta,
    busca: aba === 'a' ? BUSCA_PAC : (aba === 'p' ? LINK_P : ''),
    medir: async pg => {
      await pg.setViewportSize({width: largura, height: 1400});
      await pg.waitForTimeout(300);
      try{ await abrirPix(pg, aba); }catch(e){ /* sem area de Pix nesta passagem */ }
      const out = {};
      for(const [k, sel] of Object.entries(mapa)){
        out[k] = sel ? await pg.evaluate(LER, sel) : undefined;
      }
      return {lido: out};
    }
  });
}

/* O LINK da cobranca: o bloco da /pagar le a cobranca da CONSULTA do endereco, e sem ela
   desenha o cartao de "nenhuma cobranca aberta" -- que nao tem area de Pix nenhuma. */
let LINK_P = '';

/* ============================ a bateria ============================ */
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|alboom\.ninja|ERR_FAILED|Failed to load|net::ERR/i;

const passagens = {};
passagens.sinal   = await gerar({id:'sinal',   sinal:true,  porta:8951});
passagens.descpix = await gerar({id:'descpix', sinal:false, porta:8952});

const tabela = {};
let porta = 8960;
for(const [nomePass, blocos] of Object.entries(passagens)){
  /* O link sai do p-out2 daquela mesma passagem: e a consulta que a /pagar le. */
  LINK_P = '?' + ((blocos['p-out2']||'').split('?')[1] || '');
  for(const largura of [1024, 375]){
    for(const [aba, saida] of [['u','u-out'],['m','m-out'],['a','a-out3'],['p','p-out1']]){
      const r = await medir(blocos[saida], aba, largura, porta++);
      const reais = (r.erros||[]).filter(e => !EXTERNO.test(e));
      chk('['+nomePass+'/'+largura+'] '+aba+': o bloco rodou sem erro proprio',
          reais.length === 0, reais.slice(0,2).join(' | '));
      tabela[nomePass+'/'+largura+'/'+aba] = r.lido;
      /* A AREA DO PIX TEM DE TER ABERTO DE VERDADE. Sem isto, tudo o que se le la dentro e
         estilo computado de elemento escondido -- a armadilha 1 do cabecalho deste arquivo,
         medindo a si mesma e dando "ok" com folga. Mede-se pela CAIXA da caixa de copiar. */
      const cola = (r.lido||{}).cola;
      if(cola) chk('['+nomePass+'/'+largura+'] '+aba+': a area do Pix abriu de verdade',
          cola.visivel, 'a caixa do Copia e Cola mediu '+JSON.stringify(cola.caixa));
    }
  }
}

if(DUMP){
  console.log('\n===== TABELA CRUA =====');
  console.log(JSON.stringify(tabela, null, 1));
}

/* ===========================================================================
   AS ASSERCOES -- a aparencia que esta leva deixou alinhada
   ===========================================================================
   Cada bloco abaixo nomeia o item da lista do dono. O que ficou DECLARADO em
   vez de alinhado (e por que) esta no relatorio da rodada e no comentario ao
   lado da regra, no index.html -- aqui so entra o que a leva de fato alinhou,
   porque assercao sobre o que nao mudou e assercao que passa para sempre e
   nao mede nada. */
const q = (p,l,a,k) => (tabela[p+'/'+l+'/'+a]||{})[k];

console.log('\n=== item 2: o aviso "o Pix nao confirma sozinho", uma aparencia so ===');
for(const l of [1024,375]){
  const vs = ['u','m','a','p'].map(a => q('descpix',l,a,'pixManual')).filter(Boolean);
  chk('['+l+'] as quatro abas emitem o aviso', vs.length === 4, 'achei '+vs.length);
  if(vs.length === 4){
    chk('['+l+'] as quatro caixas tem o MESMO veu de fundo',
        new Set(vs.map(v=>v.background)).size === 1,
        vs.map(v=>v.background).join(' | '));
    chk('['+l+'] nenhuma delas fixa a cor do texto por cima da cor configuravel',
        new Set(vs.map(v=>v.color)).size === 1, vs.map(v=>v.color).join(' | '));
  }
}

console.log('\n=== item 5: a caixa do Copia e Cola ===');
for(const l of [1024,375]){
  const vs = ['u','m','a','p'].map(a => [a, q('descpix',l,a,'cola')]).filter(x=>x[1]);
  chk('['+l+'] as quatro abas tem a caixa', vs.length === 4, 'achei '+vs.length);
  chk('['+l+'] a mesma altura nas quatro',
      new Set(vs.map(x=>x[1].height)).size === 1, vs.map(x=>x[0]+'='+x[1].height).join(' '));
  chk('['+l+'] o mesmo tamanho de fonte nas quatro',
      new Set(vs.map(x=>x[1].fontSize)).size === 1, vs.map(x=>x[0]+'='+x[1].fontSize).join(' '));
  chk('['+l+'] nenhuma delas e redimensionavel (ninguem le esse texto, so copia)',
      vs.every(x=>x[1].resize === 'none'), vs.map(x=>x[0]+'='+x[1].resize).join(' '));
}

console.log('\n=== item 9: a area do Pix a esquerda nas quatro (manual do Prosite, item 8) ===');
for(const l of [1024,375]){
  for(const a of ['u','m']){
    const v = q('descpix',l,a,'pixArea');
    chk('['+l+'] '+a+': a area do Pix alinha a esquerda', v && v.textAlign === 'left',
        v ? v.textAlign : 'nao achei');
  }
  for(const [a,k] of [['u','instrucao'],['u','nota'],['m','instrucao'],['m','nota']]){
    const v = q('descpix',l,a,k);
    chk('['+l+'] '+a+'/'+k+': a esquerda', v && v.textAlign === 'left', v ? v.textAlign : 'nao achei');
  }
}

console.log('\n=== item 10: o saldo sem negrito nas quatro ===');
for(const l of [1024,375]){
  const vs = ['u','m','a','p'].map(a => [a, q('sinal',l,a,'saldo')]).filter(x=>x[1]);
  chk('['+l+'] as quatro abas mostram o saldo', vs.length === 4, 'achei '+vs.length);
  chk('['+l+'] nenhuma delas poe o saldo em negrito',
      vs.every(x => Number(x[1].fontWeight) < 700),
      vs.map(x=>x[0]+'='+x[1].fontWeight).join(' '));
}

console.log('\n=== item 11: as tres respostas do sinal, o mesmo respiro ===');
for(const l of [1024,375]){
  for(const a of ['u','m','a']){
    const v = q('sinal',l,a,'sinalTxt');
    chk('['+l+'] '+a+': a resposta usa margem, e nao enchimento',
        v && v.padding === '0px 0px 0px 0px' && v.margin.startsWith('4px'),
        v ? ('padding='+v.padding+' margin='+v.margin) : 'nao achei');
  }
}

console.log('\n=== o que o cliente ve: nada sumiu nem quebrou, nas duas larguras ===');
for(const p of ['sinal','descpix']){
  for(const l of [1024,375]){
    for(const a of ['u','m','a','p']){
      for(const k of ['cola','pixManual']){
        const v = q(p,l,a,k);
        if(!v) continue;
        chk('['+p+'/'+l+'] '+a+'/'+k+': a caixa tem area na tela', v.visivel,
            'rect '+JSON.stringify(v.caixa));
      }
      /* O QR E O CONTRARIO, e de proposito: aqui a rede externa esta bloqueada, entao a
         biblioteca nao chega e desenharQr() chama some(). O bloco foi ESCRITO para isso --
         "sem QR a cobranca continua inteira: o copia e cola e a instrucao ficam onde estavam".
         Exigir que a caixa apareca seria exigir o contrario do desenho. O que se cobra e que
         as QUATRO se comportem igual: sem biblioteca, nenhuma delas deixa um retangulo vazio
         na tela do cliente. A chapa branca do item 6 tem prova propria, mais abaixo, com a
         biblioteca de verdade. */
      const vqr = q(p,l,a,'qr');
      if(vqr) chk('['+p+'/'+l+'] '+a+': sem a biblioteca, a caixa do QR some (nao sobra retangulo vazio)',
          !vqr.visivel, 'a caixa mediu '+JSON.stringify(vqr.caixa));
    }
  }
}

/* ===========================================================================
   ITEM 6: A CHAPA BRANCA DO QR -- com a biblioteca DE VERDADE
   ===========================================================================
   A REDE EXTERNA E ABERTA PARA UM HOST SO (cdnjs), e o motivo esta escrito como o molde
   exige: a pergunta e se a chapa e decoracao ou se e a unica zona quieta do codigo, e so
   a qrcodejs responde -- transcrever o que uma biblioteca de terceiro faz seria opiniao,
   nao medicao. O preco esta aceito: esta secao pode falhar por rede, e a falha nao teria a
   ver com o bloco. As outras 128 verificacoes acima continuam sem rede nenhuma. */
console.log('\n=== item 6: a chapa branca do QR, com a biblioteca de verdade (usa a rede) ===');
{
  const blocos = passagens.descpix;
  /* A FAIXA COMECA EM 9040, e nao logo depois das anteriores: a 8999 estava ocupada por outro
     programa desta maquina quando este arquivo foi escrito, e EADDRINUSE e colisao de porta, nao
     defeito -- mas uma colisao derruba a bateria inteira e a falha nao teria nada a ver com
     aparencia. Oito portas seguidas (duas larguras x quatro abas), longe das outras secoes. */
  let pt = 9040;
  /* AS DUAS LARGURAS, e a de 375 e a que importa: a chapa acrescenta 20px de enchimento e 2px
     de borda em volta de um QR de 200, e num celular isso e largura que alguem tem de ter
     medido. O que se cobra e o que o dono reportou da ultima vez -- a PAGINA nao pode ganhar
     rolagem horizontal. */
  for(const larg of [1024, 375])
  for(const [aba, saida, sel] of [['u','u-out','.fcu-qr'], ['m','m-out','.fcm-qr'],
                                  ['a','a-out3','.fca-ob-qr'], ['p','p-out1','.fcpg-qr']]){
    LINK_P = '?' + ((blocos['p-out2']||'').split('?')[1] || '');
    const r = await comBlocoNaPagina({
      bloco: blocos[saida], cabeca: CABECA, porta: pt++,
      busca: aba === 'a' ? BUSCA_PAC : (aba === 'p' ? LINK_P : ''),
      permitir: ['cdnjs.cloudflare.com'],
      medir: async pg => {
        await pg.setViewportSize({width: larg, height: 1400});
        try{ await abrirPix(pg, aba); }catch(e){}
        await pg.waitForTimeout(3000);
        return await pg.evaluate(sl => {
          const cx = document.querySelector(sl);
          if(!cx) return null;
          const st = getComputedStyle(cx), cv = cx.querySelector('canvas');
          const o = {fundo: st.backgroundColor, padding: st.paddingTop,
                     borda: st.borderTopWidth, display: st.display,
                     temCanvas: !!cv, larguraCaixa: Math.round(cx.getBoundingClientRect().width),
                     rolagemH: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1};
          if(cv){
            /* A LEITURA E DE TODAS AS LINHAS, e o numero e o MENOR -- nao o da linha do meio.
               ZONA QUIETA e branco em VOLTA da imagem inteira: se existe, TODA linha comeca com
               ela. Uma linha so responde outra pergunta -- 'o primeiro modulo DESTA linha e
               claro?' --, e a resposta muda com o conteudo do codigo. Medido em 14/09/2026: o
               codigo do pedido da Mini loja e CODIGO_LOJA + Date.now() em base 36 (novoPedido),
               entao o payload -- e o desenho -- mudam a CADA execucao, e esta linha acusava
               '8px de branco na borda' de vez em quando, sem defeito nenhum por tras. Vermelho
               intermitente e pior que vermelho nenhum: ele ensina a ignorar o proximo.
               Pelo minimo entre as linhas a medida volta a ser do DESENHO e nao do conteudo. */
            const g = cv.getContext('2d'), w = cv.width, h = cv.height;
            const d = g.getImageData(0, 0, w, h).data;
            let menor = w;
            for(let y=0;y<h;y++){
              let b = 0;
              for(let x=0;x<w;x++){const i=(y*w+x)*4; if(d[i]>200&&d[i+1]>200&&d[i+2]>200) b++; else break;}
              if(b < menor) menor = b;
              if(menor === 0) break;
            }
            o.canvas = w; o.brancoNaBordaDoCanvas = menor;
          }
          return o;
        }, sel);
      }});
    const v = r.lido !== undefined ? r.lido : r;
    const m = (v && v.fundo !== undefined) ? v : null;
    chk('['+larg+'] '+aba+': o QR desenhou de verdade (a biblioteca chegou)', !!(m && m.temCanvas),
        m ? JSON.stringify(m) : 'nao achei a caixa');
    if(!m || !m.temCanvas) continue;
    chk('['+larg+'] '+aba+': a caixa do QR tem chapa BRANCA', m.fundo === 'rgb(255, 255, 255)', m.fundo);
    chk('['+larg+'] '+aba+': a chapa tem 10px de zona quieta em volta', m.padding === '10px', m.padding);
    chk('['+larg+'] '+aba+': a chapa encolhe no QR (inline-block), e nao ocupa a linha toda',
        m.display === 'inline-block', m.display);
    /* A MEDIDA QUE JUSTIFICA A CHAPA: a propria imagem do QR NAO tem zona quieta. Se um dia
       a biblioteca passar a desenhar uma, esta linha falha -- e ai a chapa vira decoracao e
       o item 6 se reabre com medicao nova, em vez de continuar por inercia. */
    chk('['+larg+'] '+aba+': a imagem do QR continua sem zona quieta propria (e por isso a chapa existe)',
        m.brancoNaBordaDoCanvas < 8,
        'toda linha do canvas de '+m.canvas+'px comeca com pelo menos '+m.brancoNaBordaDoCanvas+'px de branco');
    chk('['+larg+'] '+aba+': com a chapa desenhada, a pagina NAO ganha rolagem horizontal',
        m.rolagemH === false, 'a caixa do QR mediu '+m.larguraCaixa+'px de largura');
  }
}

/* ===========================================================================
   ITEM 14: A MOLDURA DA PREVIA -- uma classe so, e as nove previas desenhando
   ===========================================================================
   Esta secao nao olha bloco gerado nenhum: olha a FERRAMENTA. Eram seis declaracoes byte a
   byte iguais (.c-, .s-, .l-, .u-, .m- e .a-pv-moldura) para NOVE previas em oito abas (a
   Agendamento por pacote tem duas), com a Link de
   cobranca e a Efeitos de pagina usando emprestada a da Contagem regressiva. Viraram uma
   regra so, .pv-moldura. O que se cobra aqui e que a troca nao deixou previa sem moldura --
   e que nenhuma copia com prefixo voltou a nascer, que e como a duplicacao se reinstalaria. */
console.log('\n=== item 14: a moldura da previa, uma classe so nas oito abas ===');
{
  const srv = await servir(RAIZ_FERRAMENTA, 9021);
  const br = await navegador();
  try{
    const pg = await abrir(br, 'http://127.0.0.1:9021');
    for(const [aba, nome] of [['aba-leads','captacao'],['aba-uni','checkout'],
        ['aba-cnt','contagem'],['aba-cob','cobranca'],['aba-loja','mini loja'],
        ['aba-efe','efeitos'],['aba-pac','pacote']]){
      await clicar(pg, aba); await pg.waitForTimeout(1400);
      const r = await pg.evaluate(() => {
        const vis = [...document.querySelectorAll('.painel')].find(p => p.classList.contains('ativo'));
        const ms = [...(vis ? vis.querySelectorAll('.pv-moldura') : [])];
        return {n: ms.length,
          antigas: [...(vis ? vis.querySelectorAll('[class*="-pv-moldura"]') : [])].length,
          inteiras: ms.filter(m => m.getBoundingClientRect().width > 20
            && getComputedStyle(m).borderTopWidth === '1px' && m.querySelector('iframe')).length};
      });
      chk(nome+': a previa desenhou dentro da moldura unica (caixa, borda e iframe)',
          r.n > 0 && r.inteiras === r.n, JSON.stringify(r));
      chk(nome+': nenhuma copia com prefixo de aba sobrou', r.antigas === 0, JSON.stringify(r));
    }
    await pg.close();
  } finally { await br.close(); srv.close(); }
}

/* ===========================================================================
   A PROVA DO CONTRARIO -- sem ela, os "ok" acima nao valem nada
   ===========================================================================
   Uma suite que passa nao prova que pega o defeito: ela pode estar medindo a coisa errada e
   passar sempre. A unica forma de saber que ela tem dentes e aponta-la para a versao que TEM
   as divergencias -- a de antes da leva 5 -- e exigir que la elas APARECAM.

   A REFERENCIA ESTA PRESA NUM COMMIT, e nao em "o que estiver em main hoje": no dia em que
   esta rodada for mesclada, 'main' passaria a medir a si mesma e este bloco falharia sem
   defeito nenhum por tras. E o tropeco que este arnes ja pagou seis vezes (id-orcamento,
   textos-reserva, meio-prio-migracao duas vezes, sinal-cobranca, linha-de-dinheiro). Quando a
   referencia deixar de servir, isto diz NAO MEDIU e a linha de comando que mediria -- nunca
   falha por envelhecimento. O sinal e lido do PROPRIO arquivo da referencia: se 'fcPixManualCss'
   ja existe la, aquela arvore ja tem a leva 5 dentro e nao e mais o lado "antes". */
console.log('\n=== a prova do contrario: a versao ANTES da leva 5 tinha as divergencias ===');
{
  const REF = process.argv[2] || '6eabd1f';
  console.log('referencia (o lado "antes"): ' + REF);
  const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-aparencia-'));
  process.on('exit', () => { try{ fs.rmSync(tmp, {recursive:true, force:true}); }catch(e){} });
  execFileSync('/bin/sh', ['-c', 'git -C ' + JSON.stringify(RAIZ) + ' archive '
    + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(tmp)]);

  const refJaTem = fs.readFileSync(path.join(tmp,'index.html'),'utf8').indexOf('fcPixManualCss') >= 0;
  if(refJaTem){
    console.log('  -- NAO MEDIU: a referencia ja tem a leva 5 dentro.');
    console.log('     Para medir de verdade: node scripts/verificar/aparencia.mjs 6eabd1f');
  }else{
    const antes = await gerar({id:'antes', sinal:false, porta:9010, raiz: tmp});
    const r = await medir(antes['u-out'], 'u', 1024, 9011);
    const pm = (r.lido||{}).pixManual, pa = (r.lido||{}).pixArea, cl = (r.lido||{}).cola;
    chk('ANTES: o aviso do Pix do Checkout fixava a cor por cima da cor do dono',
        !!pm && pm.color === 'rgb(68, 68, 68)', pm ? pm.color : 'nao achei');
    chk('ANTES: o aviso do Pix do Checkout usava o veu .045, e nao o .05',
        !!pm && pm.background === 'rgba(0, 0, 0, 0.043)', pm ? pm.background : 'nao achei');
    chk('ANTES: a area do Pix do Checkout vinha centralizada',
        !!pa && pa.textAlign === 'center', pa ? pa.textAlign : 'nao achei');
    chk('ANTES: o Copia e Cola do Checkout tinha 84px, e nao 74',
        !!cl && cl.height === '84px', cl ? cl.height : 'nao achei');
    const rm = await medir(antes['m-out'], 'm', 1024, 9012);
    const zp = (rm.lido||{}).zap;
    chk('ANTES: o botao "Ja paguei" da Mini loja saia em Arial 400 (o atalho font: era descartado)',
        !!zp && zp.fontWeight === '400', zp ? (zp.fontWeight+' / '+zp.fontSize) : 'nao achei');
  }
}

process.exit(resumo());
