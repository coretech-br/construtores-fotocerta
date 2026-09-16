/* ============================================================================
   A ORDEM DOS MEIOS DE PAGAMENTO, CONFERIDA NO DOM -- nas duas escolhas
   ============================================================================
   POR QUE ISTO EXISTE. Ate 12/09/2026 nao havia NENHUMA prova, em lugar nenhum
   do arnes, de que o Pix aparece antes do PayPal (ou depois). A ordem era um
   efeito de concatenacao de string em quatro geradores, e um `grep` por
   'fcu-sep|fcm-sep|fcpg-sep|pixlinha|fcu-botoes' em scripts/ devolvia zero.
   Quer dizer: a proxima rodada podia desfazer esta em silencio, e a regressao
   byte a byte nao acusaria nada -- ela compara a arvore com a REFERENCIA, e
   se as duas mudassem juntas nao ha o que divergir.

   O QUE ELE PROVA, e nao e o texto gerado:
     1. A ORDEM, pelo INDICE DOS FILHOS no pai comum -- nao por "aparece antes
        no texto do bloco", que e outra coisa. Quatro abas, duas escolhas.
     2. O SEPARADOR fica ENTRE os dois, sempre, e nunca sobra fora.
     3. OS DOIS NUMEROS ficam a vista, e o que esta em DESTAQUE e o do meio
        prioritario -- destaque medido por getComputedStyle, nao por classe.
     4. O NUMERO QUE O PAYPAL COBRA e o CHEIO, nas duas escolhas. Este e o
        defeito que a rodada do meio prioritario podia criar: preco do Pix
        grande na tela e cobranca cheia no cartao, sem aviso.
     5. AS FRASES que apontam para o outro meio leem certo nas duas ordens --
        nenhum "ou pague com Pix" ANTES do Pix, nenhum "Use o Pix acima"
        apontando para baixo.

   COMO. O molde de pagina.mjs (rede bloqueada, servidor de uma rota) mais o
   cenario de cenario.mjs -- o mesmo da regressao, para nao existir um segundo
   cenario que divirja do primeiro. O SDK do PayPal e interceptado pelo mesmo
   caminho que a sonda da previa da ferramenta usa (fcPvSondaPP) e que
   pac-quantidade.mjs ja usava: troca-se document.head.appendChild, reconhece-se
   o script pelo src e guarda-se a configuracao dos Buttons em window.__pp.
   Assim createOrder e o DO BLOCO, e o valor lido e o de verdade.

   Uso:  node scripts/verificar/meio-prioritario.mjs
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { preparar, conteudo, cobranca, gerarTodas } from './cenario.mjs';
import { radio, clicar, set } from './lib.mjs';

const SAIDAS = ['u-out','m-out','p-out1','p-out2','a-out1','a-out2','a-out3','v-out'];

/* Erro de rede nao e erro do bloco -- mesma lista curta das outras suites. */
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|alboom\.ninja|tidycal|ERR_FAILED|Failed to load resource|net::ERR/i;
const errosReais = e => e.filter(x => !EXTERNO.test(x));

/* A INTERCEPCAO DO SDK. No <head>, antes do bloco: os blocos penduram o script ja no
   carregamento, e instalar isto depois chegaria tarde. */
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

/* ===== a ferramenta, uma passagem por escolha ===== */
async function gerarCom(prio, porta){
  console.log('gerando os quatro blocos com meio prioritario = '+prio+'...');
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg);
    /* Cobranca COM desconto: sem desconto nao existem dois numeros, e a metade
       interessante desta prova deixaria de ser exercitada. */
    await cobranca(pg,{descpix:'10', valor:'450,00'});
    for(const [aba,pref] of [['aba-uni','u'],['aba-loja','m'],['aba-cob','p'],['aba-pac','a']]){
      await clicar(pg,aba); await pg.waitForTimeout(40);
      await radio(pg,pref+'-prio',prio);
    }
    /* A CALCULADORA DE ALBUM entra como QUINTA aba (16/09/2026). Ela chega aqui com duas
       diferencas de NASCENCA em relacao as outras quatro: o sinal nasce LIGADO e o desconto
       no Pix nasce zerado. Sinal ligado zera o desconto na origem (o mesmo 'if(sinalOn)' das
       irmas), e sem desconto nao existem os DOIS numeros que a parte 3 mede -- entao aqui ela
       e posta no mesmo estado das outras: sinal desligado e 10% no Pix. O estado de fabrica
       dela, com o sinal ligado, e medido na parte 6, junto com as irmas. */
    chk('['+prio+'] a aba da calculadora de album existe', !!(await pg.$('#aba-alb')));
    if(await pg.$('#aba-alb')){
      await clicar(pg,'aba-alb'); await pg.waitForTimeout(40);
      await radio(pg,'v-sinal','nao'); await pg.waitForTimeout(40);
      await set(pg,'v-descpix','10');
      await radio(pg,'v-prio',prio);
    }
    await gerarTodas(pg);
  }, SAIDAS, {porta});
  chk('['+prio+'] a ferramenta gerou sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('['+prio+'] a ferramenta gerou sem erro de console', r.erros.length === 0, r.erros.slice(0,2).join(' | '));
  return r.valores;
}

/* ===== o que se mede dentro da pagina =====
   A ORDEM PELO INDICE DOS FILHOS: sobe de cada marcador ate o filho direto do PAI COMUM
   e compara os dois indices. E a pergunta literal "quem e o filho de numero menor", e nao
   "quem aparece antes no texto do bloco", que responderia outra coisa.
   Tudo mora DENTRO do evaluate: passar codigo como string e dar eval() no navegador ja
   custou caro neste projeto, e aqui nao ha nada que exija isso. */
const medir = sel => pg => pg.evaluate(sel => {
  function caminho(el){var r=[];while(el){r.unshift(el);el=el.parentElement;}return r;}
  function ordem(selA,selB){
    var a=document.querySelector(selA),b=document.querySelector(selB);
    if(!a||!b)return {erro:'faltou '+(a?selB:selA)};
    var ca=caminho(a),cb=caminho(b),i=0;
    while(ca[i]&&cb[i]&&ca[i]===cb[i])i++;
    var pai=ca[i-1];if(!pai)return {erro:'sem pai comum'};
    var f=Array.prototype.slice.call(pai.children);
    return {ia:f.indexOf(ca[i]),ib:f.indexOf(cb[i]),n:f.length};
  }
  /* "R$ 1.234,56" e "1234.56" -- os dois formatos que aparecem nestes blocos. */
  function num(t){
    if(t==null)return null;
    var m=String(t).match(/[0-9][0-9.]*,[0-9]{2}|[0-9]+\.[0-9]{2}/);
    if(!m)return null;
    return parseFloat(m[0].indexOf(',')>=0 ? m[0].replace(/\./g,'').replace(',','.') : m[0]);
  }
  function txt(s){var e=s?document.querySelector(s):null;return e?e.textContent.trim():null;}
  function fonte(s){var e=s?document.querySelector(s):null;return e?parseFloat(getComputedStyle(e).fontSize):null;}
  /* createOrder e DO BLOCO; o actions.order.create so devolve o objeto em vez de mandar
     para fora -- e por isso o valor lido aqui e o que o PayPal receberia. */
  function pedido(){
    if(!window.__pp||!window.__pp.createOrder)return null;
    try{
      var p=window.__pp.createOrder(null,{order:{create:function(o){return o;}}});
      return p.purchase_units[0].amount.value;
    }catch(e){return 'ERRO: '+(e&&e.message||e);}
  }
  return {
    fim: !!document.getElementById('fim-do-documento'),
    ordem: ordem(sel.selPix, sel.selPP),
    ordemSepPix: ordem(sel.selSep, sel.selPix),
    ordemSepPP: ordem(sel.selSep, sel.selPP),
    cheio: num(txt(sel.selCheio)), pixVal: num(txt(sel.selPixVal)),
    grande: num(txt(sel.selGrande)), segundo: num(txt(sel.selSegundo)),
    segundoTxt: txt(sel.selSegundo), rotulo: txt(sel.selRotulo), sepTxt: txt(sel.selSepTxt),
    fonteCheio: fonte(sel.fonteCheio), fontePixVal: fonte(sel.fontePixVal),
    pp: pedido()
  };
}, sel);

/* ===== os quatro casos ===== */
const CASOS = [
  {aba:'Checkout', saida:'u-out', porta:8871, busca:'',
   selPix:'.fcu-gerar', selPP:'.fcu-botoes', selSep:'.fcu-sep',
   /* no carrinho os dois numeros sao linhas do proprio carrinho: o total e a linha do Pix */
   selCheio:'.fcu-total-v', selPixVal:'.fcu-pixlinha-v',
   fonteCheio:'.fcu-total', fontePixVal:'.fcu-pixlinha', selSepTxt:'.fcu-sep-t'},

  {aba:'Mini loja', saida:'m-out', porta:8872, busca:'',
   selPix:'.fcm-gerar', selPP:'.fcm-botoes', selSep:'.fcm-sep',
   selCheio:'.fcm-total-v', selPixVal:'.fcm-pixlinha-v',
   fonteCheio:'.fcm-total', fontePixVal:'.fcm-pixlinha', selSepTxt:'.fcm-sep-t',
   /* a vitrine abre sem carrinho: e preciso por um produto dentro antes de medir */
   antes: async pg => { await pg.locator('.fcm-card').first().click();
                        await pg.locator('.fcm-add').first().click(); }},

  {aba:'Agendamento por pacote', saida:'a-out3', porta:8873, buscaDe:'a-out2',
   selPix:'.fca-ob-cod', selPP:'.fca-ob-botoes', selSep:'.fca-ob-sep',
   /* aqui os dois numeros sao o preco grande e a linha 2 -- o desenho de referencia */
   selGrande:'.fca-ob-preco-valor', selSegundo:'.fca-ob-preco-linha2'},

  /* A CALCULADORA DE ALBUM mede como o Checkout: os dois numeros sao linhas do proprio
     orcamento. A diferenca e ONDE a fonte e declarada -- nas irmas o tamanho esta no
     CONTAINER da linha, e aqui esta no SPAN do valor ('.fcal-final .fcal-linha-v'). Medir o
     container devolveria 14,5px dos dois lados e a prova passaria sempre, sem olhar nada. */
  {aba:'Calculadora de álbum', saida:'v-out', porta:8875, busca:'',
   selPix:'.fcal-gerar', selPP:'.fcal-botoes', selSep:'.fcal-sep',
   selCheio:'.fcal-total-v', selPixVal:'.fcal-pixlinha-v',
   fonteCheio:'.fcal-total-v', fontePixVal:'.fcal-pixlinha-v', selSepTxt:'.fcal-sep-t',
   /* a calculadora abre com um tamanho escolhido e um numero de fotos; mexer nos dois deixa
      a medicao independente do que for o padrao de fabrica amanha */
   antes: async pg => {
     await pg.locator('.fcal-tam').first().click();
     await pg.evaluate(() => {
       const r = document.querySelector('.fcal-range');
       r.value = String(Math.round((parseInt(r.max,10) + parseInt(r.min,10)) / 2));
       r.dispatchEvent(new Event('input', {bubbles:true}));
     });
   }},

  {aba:'Link de cobrança', saida:'p-out1', porta:8874, buscaDe:'p-out2',
   selPix:'.fcpg-cod', selPP:'#fcpg-pp', selSep:'.fcpg-sep',
   selGrande:'.fcpg-valor', selSegundo:'.fcpg-pixlinha', selRotulo:'.fcpg-valor-rot'}
];

/* A CONSULTA de cada pagina sai da PROPRIA saida da ferramenta -- nunca escrita a mao aqui
   (mesma regra de textos-escape.mjs: valor copiado envelhece no dia em que o formato mudar). */
function buscaDa(caso, v){
  if(caso.busca !== undefined && !caso.buscaDe) return caso.busca;
  if(caso.buscaDe === 'p-out2') return '?' + String(v['p-out2']).split('?')[1];
  return String(v['a-out2']).split('\n').find(l => l.indexOf('http') === 0)
    .replace(/^[^?]*\?/, '?')
    .replace('{{contact.name}}','Ana Souza')
    .replace('{{booking.date}}','2026-10-12')
    .replace('{{booking.time}}','15:00')
    .replace('{{booking.starts_at}}','2026-10-12T15:00:00-03:00');
}

async function medirCaso(caso, prio, v){
  /* SO os seletores atravessam para a pagina: 'antes' e uma funcao e nao e serializavel. */
  const sel = {};
  for(const [k,x] of Object.entries(caso)) if(typeof x === 'string') sel[k] = x;
  const r = await comBlocoNaPagina({
    bloco: v[caso.saida], cabeca: SONDA, busca: buscaDa(caso, v), porta: caso.porta,
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    medir: async pg => {
      await pg.waitForTimeout(400);
      if(caso.antes) await caso.antes(pg);
      await pg.waitForTimeout(300);
      return await medir(sel)(pg);
    }
  });
  chk('['+prio+'] '+caso.aba+': o documento nao foi engolido', r.fim);
  chk('['+prio+'] '+caso.aba+': sem erro de console no bloco',
      errosReais(r.erros||[]).length === 0, (r.erros||[]).slice(0,2).join(' | '));
  return r;
}

/* ============================ a bateria ============================ */
const vPix = await gerarCom('pix', 8881);
const vPP  = await gerarCom('pp',  8882);

for(const caso of CASOS){
  for(const [prio, v] of [['pix', vPix], ['pp', vPP]]){
    const r = await medirCaso(caso, prio, v);
    const o = r.ordem || {};

    /* 1. A ORDEM, pelo indice dos filhos. */
    if(o.erro){
      chk('['+prio+'] '+caso.aba+': os dois meios existem na pagina', false, o.erro);
    }else{
      const pixPrimeiro = o.ia < o.ib;
      chk('['+prio+'] '+caso.aba+': ordem no DOM (filhos '+o.ia+' e '+o.ib+')',
          pixPrimeiro === (prio === 'pix'),
          'esperava '+(prio==='pix'?'Pix antes':'PayPal antes'));
    }

    /* 2. O SEPARADOR entre os dois, e nunca fora. */
    const sp = r.ordemSepPix || {}, sq = r.ordemSepPP || {};
    if(!sp.erro && !sq.erro){
      const entre = (prio === 'pix') ? (sp.ia > sp.ib && sq.ia < sq.ib)
                                     : (sp.ia < sp.ib && sq.ia > sq.ib);
      chk('['+prio+'] '+caso.aba+': o separador fica ENTRE os dois', entre,
          JSON.stringify({sepXpix:sp, sepXpp:sq}));
    }else{
      chk('['+prio+'] '+caso.aba+': o separador existe', false, sp.erro || sq.erro);
    }

    /* 3. OS DOIS NUMEROS, e qual esta em destaque. */
    if(caso.selCheio){
      chk('['+prio+'] '+caso.aba+': os dois numeros a vista',
          r.cheio != null && r.pixVal != null && r.pixVal < r.cheio,
          JSON.stringify({cheio:r.cheio, pix:r.pixVal}));
      const maiorEhPix = r.fontePixVal > r.fonteCheio;
      chk('['+prio+'] '+caso.aba+': o numero em destaque e o do meio prioritario',
          maiorEhPix === (prio === 'pix'),
          JSON.stringify({fonteTotal:r.fonteCheio, fontePix:r.fontePixVal}));
    }
    if(caso.selGrande){
      chk('['+prio+'] '+caso.aba+': os dois numeros a vista',
          r.grande != null && r.segundo != null && r.grande !== r.segundo,
          JSON.stringify({grande:r.grande, segundo:r.segundo}));
      chk('['+prio+'] '+caso.aba+': o numero grande e o do meio prioritario',
          (prio === 'pix') ? (r.grande < r.segundo) : (r.grande > r.segundo),
          JSON.stringify({grande:r.grande, segundo:r.segundo}));
    }

    /* 4. O QUE O PAYPAL COBRA e sempre o CHEIO -- o defeito que esta rodada podia criar. */
    const cheio = (caso.selCheio ? r.cheio : Math.max(r.grande, r.segundo));
    chk('['+prio+'] '+caso.aba+': o PayPal cobra o valor CHEIO',
        r.pp != null && Math.abs(parseFloat(r.pp) - cheio) < 0.005,
        JSON.stringify({paypal:r.pp, cheio}));

    /* 5. AS FRASES que apontam para o outro meio -- e o SEPARADOR, que deixou de apontar.
       ATE 13/09/2026 esta parte cobrava que o separador do Checkout e da Mini loja nomeasse o
       meio de BAIXO ("ou pague com cartao"), virando junto com a escolha. A decisao 24 do dono
       acabou com isso: o separador passou a ser NEUTRO ("OU") nas QUATRO abas, como o Link de
       cobranca e o Agendamento por pacote ja eram, e frase neutra nao aponta para lado nenhum.
       Manter a pergunta antiga seria quatro vermelhos todo dia sem nenhum defeito por tras --
       e vermelho que e sempre vermelho esconde o proximo, que seria de verdade.
       A PERGUNTA TROCOU, e a nova diz mais: o separador de FABRICA nao nomeia nem o Pix nem o
       cartao, nas duas ordens. Um separador que nao nomeia meio nenhum nao tem como apontar
       para o lado errado -- que era exatamente o risco que a pergunta antiga vigiava. Texto que
       o DONO escreva ali pode voltar a apontar, e a ferramenta avisa na tela em vez de
       sobrescrever (ver a ajuda dos campos 'u-txt-ou'/'m-txt-ou'); isso e escolha dele, e nao
       e o que esta bateria mede.
       O QUE CONTINUA APONTANDO e medido logo abaixo: a linha 2 do Agendamento por pacote nomeia
       o meio secundario, e ela nao virou neutra. */
    if(r.sepTxt != null){
      const apontaPix = /pix/i.test(r.sepTxt), apontaCartao = /cart/i.test(r.sepTxt);
      chk('['+prio+'] '+caso.aba+': o separador e NEUTRO -- nao nomeia meio nenhum ("'+r.sepTxt+'")',
          !apontaPix && !apontaCartao,
          'separador: '+JSON.stringify(r.sepTxt));
    }
    if(r.segundoTxt != null && caso.selSegundo === '.fca-ob-preco-linha2'){
      const apontaPix = /pix/i.test(r.segundoTxt), apontaCartao = /cart/i.test(r.segundoTxt);
      chk('['+prio+'] '+caso.aba+': a linha 2 nomeia o meio SECUNDARIO ("'+r.segundoTxt+'")',
          (prio === 'pix') ? (apontaCartao && !apontaPix) : (apontaPix && !apontaCartao));
    }
    if(caso.selRotulo){
      chk('['+prio+'] '+caso.aba+': o rotulo do valor descreve o numero grande ("'+r.rotulo+'")',
          (prio === 'pix') ? /pix/i.test(r.rotulo) : !/pix/i.test(r.rotulo));
    }
  }
}

/* ===== 5b. as frases de ERRO, lidas no TEXTO do bloco entregue =====
   Elas so aparecem na tela quando o SDK do cartao falha, e forcar essa falha em cada uma
   das oito combinacoes custaria mais do que vale: o que importa provar e que a frase que
   VIAJA no bloco e a da ordem daquele bloco. */
/* A CALCULADORA DE ALBUM NAO ENTRA AQUI, e isso e medido e nao suposto: ela tem UMA frase de
   erro ('v-txt-erro-pagamento'), neutra, em vez do par acima/abaixo que o Agendamento por
   pacote e o Link de cobranca carregam. Frase que nao aponta para lado nenhum nao tem como
   apontar para o lado errado -- que e o que esta parte vigia. A asserção logo abaixo prende
   esse motivo: no dia em que a aba ganhar o par, ela falha e manda incluir a aba aqui. */
chk('[5b] a calculadora de álbum tem frase de erro NEUTRA, e por isso fica fora desta parte',
    vPix['v-out'].indexOf('Use o Pix acima') < 0 && vPix['v-out'].indexOf('Use o Pix abaixo') < 0
    && vPP['v-out'].indexOf('Use o Pix acima') < 0 && vPP['v-out'].indexOf('Use o Pix abaixo') < 0);

for(const [prio, v] of [['pix', vPix], ['pp', vPP]]){
  const acima = (prio === 'pix');
  chk('['+prio+'] pac: "Use o Pix '+(acima?'acima':'abaixo')+'" no bloco entregue',
      v['a-out3'].indexOf('Use o Pix '+(acima?'acima':'abaixo')) >= 0 &&
      v['a-out3'].indexOf('Use o Pix '+(acima?'abaixo':'acima')) < 0);
  chk('['+prio+'] cobranca: "Use o Pix '+(acima?'acima':'abaixo')+'" no bloco entregue',
      v['p-out1'].indexOf('Use o Pix '+(acima?'acima':'abaixo')) >= 0 &&
      v['p-out1'].indexOf('Use o Pix '+(acima?'abaixo':'acima')) < 0);
}

/* ===== 6. SINAL LIGADO: o desconto do Pix e ZERADO na origem =====
   Achado no encontro desta rodada com a cobranca de sinal (12/09/2026). Sinal e desconto no
   Pix nao convivem -- 'if(sinalOn)descpix=0' em uCfg e mCfg --, porque o desconto sobre o
   sinal seria desconto dobrado (o sinal ja sai de um total que pode ter cupom). O medo era:
   com o Pix prioritario, "preco do Pix" e "preco cheio" virarem o MESMO numero, duas linhas
   identicas na tela e um selo dizendo "-0%".

   MEDIDO: nao acontece, e a razao esta no gerador. A linha do Pix -- o elemento E a regra de
   CSS -- so e emitida com 'descpix>0'. Com sinal ligado o desconto e zero ANTES disso, entao
   nao existe segunda linha nenhuma para repetir o numero, e o selo de percentual nem sequer
   e um recurso destas duas abas (ele e da Agendamento por pacote, que nao tem sinal --
   'a-sinal' e 'p-sinal' nao existem; medido).
   O que a escolha do meio prioritario continua fazendo com sinal ligado e a ORDEM, e so ela.
   Este bloco prova as tres coisas: a linha nao existe no texto, nao existe no DOM, e a
   diferenca entre as duas escolhas se resume a ordem e ao separador. */
console.log('\n== 6. com sinal ligado (desconto do Pix zerado na origem) ==');
async function comSinal(prio, porta){
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg); await cobranca(pg,{descpix:'10', valor:'450,00'});
    for(const [aba,pref] of [['aba-uni','u'],['aba-loja','m'],['aba-alb','v']]){
      await clicar(pg,aba); await pg.waitForTimeout(40);
      await radio(pg, pref+'-prio', prio);
      /* A CALCULADORA DE ALBUM nasce com desconto no Pix (5%) e com o sinal LIGADO -- e o
         unico jeito de provar que o zeramento acontece na ORIGEM e por um desconto la e
         ligar o sinal por cima dele. Deixar o campo como veio provaria menos. */
      await set(pg, pref+'-descpix', '10');
      await radio(pg, pref+'-sinal', 'sim');
    }
    await gerarTodas(pg);
  }, ['u-out','m-out','v-out'], {porta});
  chk('[sinal/'+prio+'] a ferramenta gerou sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  return r.valores;
}
const sinalPix = await comSinal('pix', 8883);
const sinalPP  = await comSinal('pp',  8884);
for(const [saida, pref] of [['u-out','fcu'],['m-out','fcm'],['v-out','fcal']]){
  for(const [prio, v] of [['pix', sinalPix], ['pp', sinalPP]]){
    chk('[sinal/'+prio+'] '+saida+': a linha do Pix nao e emitida', v[saida].indexOf(pref+'-pixlinha') < 0);
    chk('[sinal/'+prio+'] '+saida+': nenhum "-0%" no bloco', v[saida].indexOf('-0%') < 0);
    chk('[sinal/'+prio+'] '+saida+': a linha do sinal continua la', v[saida].indexOf(pref+'-sinal') >= 0);
  }
  /* A DIFERENCA ENTRE AS DUAS ESCOLHAS, com sinal ligado, e SO a ordem e o separador.
     Qualquer outra linha divergindo aqui e mudanca que nao era a ordem. */
  const a = sinalPix[saida].split('\n'), b = sinalPP[saida].split('\n');
  const so = x => x.filter(l => !new Set(x === a ? b : a).has(l));
  const diferentes = [...so(a), ...so(b)];
  const declarado = /-sep|-botoes|-gerar|TXT_OU/;
  const fora = diferentes.filter(l => !declarado.test(l));
  chk('[sinal] '+saida+': a diferenca entre as duas escolhas e SO a ordem e o separador',
      fora.length === 0, fora.slice(0,3).join(' // '));
}
/* E no DOM, com o bloco rodando: a ordem obedece, e a linha do Pix realmente nao existe. */
for(const [prio, v] of [['pix', sinalPix], ['pp', sinalPP]]){
  for(const caso of CASOS.filter(c => ['u-out','m-out','v-out'].indexOf(c.saida) >= 0)){
    const r = await medirCaso(caso, 'sinal/'+prio, v);
    const o = r.ordem || {};
    chk('[sinal/'+prio+'] '+caso.aba+': ordem no DOM (filhos '+o.ia+' e '+o.ib+')',
        !o.erro && ((o.ia < o.ib) === (prio === 'pix')), o.erro || '');
    chk('[sinal/'+prio+'] '+caso.aba+': a linha do Pix nao esta no DOM', r.pixVal === null);
  }
}

process.exit(resumo());
