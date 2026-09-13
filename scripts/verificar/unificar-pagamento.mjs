/* ============================================================================
   AS QUATRO ABAS DE PAGAMENTO, SOB A MESMA REGRA (leva 2 -- 13/09/2026)
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. O dono pediu que "todos os construtores que tem pagamento
   tenham as mesmas regras, mesmas configuracoes". Uma varredura catalogou 41 divergencias
   entre Checkout (u), Mini loja (m), Agendamento por pacote (a) e Link de cobranca (p).
   Esta leva fechou as que afetam DINHEIRO, RECUSA ou LINK, mais cinco decisoes do dono.

   O que ele mede, em cinco partes:

     1. A RECUSA DO SINAL FIXO ALTO na Agendamento por pacote. Ela nao existia: aTotalMaximo
        nao existia, e um sinal fixo acima do maior pedido possivel gerava sem uma palavra --
        e TODA reserva travava depois, na pagina de obrigado. Aqui se mede a CONTA (o teto
        soma os opcionais e a quantidade, e e o MAIOR pacote e nao a soma deles), a recusa, o
        limite exato, e o bloco EXECUTANDO com o sinal no teto.

     2. O CODIGO DO PEDIDO do Checkout, que entrava inteiro na tela e chegava diferente ao
        extrato. Medido: o campo JA tinha maxlength 25, entao o defeito nunca foi o
        comprimento pelo teclado -- era o CARACTERE. Aqui se mede a recusa nova (a mesma da
        Mini loja), o teto para estado importado (onde maxlength nao age), e o bloco
        EXECUTANDO: o que a tela mostra e o campo 62>05 do payload sao o MESMO identificador,
        lido por um leitor TLV escrito dentro deste teste.

     3. O ENDERECO DA PAGINA DE OBRIGADO. A guarda aceitava '/obrigado' enquanto a frase ao
        lado jurava "precisa comecar com https:// e ter o dominio". Medido qual dos dois lados
        estava certo -- o unico consumidor e aEnderecos(), a lista que o dono cola DENTRO do
        TidyCal, e o TidyCal redireciona de fora do site --, a guarda mudou, nao a mensagem.

     4. A LISTA DO WHATSAPP do Checkout, que era montada por DOIS caminhos: itensEscolhidos()
        com o resumo ligado, e um segundo laco com regra propria sem ele. Aqui os dois blocos
        (com e sem resumo) sao EXECUTADOS e a mensagem que cada um monta e comparada texto a
        texto, com um opcional de quantidade ZERO no carrinho -- que e exatamente onde os dois
        lacos poderiam discordar.

     5. AS CINCO DECISOES DO DONO, uma medicao cada: preco zero recusado nas quatro; resumo
        copiavel ligado de fabrica; desconto do Pix de fabrica em 5% nas tres de catalogo;
        separador NEUTRO ("OU") nas quatro, com a migracao do que ja estava gravado; passo de
        0,5 no percentual do sinal nas quatro.

   REFERENCIA. So a parte 5.4 (a migracao do separador) compara com uma referencia, e ela e
   PRESA no argumento (padrao: 'main'). Como toda migracao, ela so significa alguma coisa
   contra uma referencia ANTERIOR a rodada: contra uma que ja tenha o separador neutro ela diz
   NAO MEDIU, com o comando para medir de verdade, em vez de fingir verde -- a regra da casa,
   escrita depois de seis ocorrencias de assercao com prazo de validade. Tudo o mais mede
   PROPRIEDADES da arvore de hoje e nao envelhece.

   Roda com:  node scripts/verificar/unificar-pagamento.mjs [commit-de-referencia]
   Nao precisa de internet.
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, radio, clicar, marcar } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';

let PORTA = 8760;   /* paginas do molde (o bloco executando) */
let FER = 9320;     /* aberturas da ferramenta */

const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};
async function ident(pg){ for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v); }

/* Erro de console que e da REDE do molde, e nao do bloco: o molde barra tudo que nao seja a
   propria origem, de proposito (ver pagina.mjs). */
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|alboom\.ninja|storage\.|tidycal|wa\.me|whatsapp|ERR_FAILED|Failed to load resource|net::ERR/i;
const errosReais = e => e.filter(x => !EXTERNO.test(x));

/* ---------------------------------------------------------------------------
   O LEITOR TLV DO BR CODE, escrito AQUI e nao importado do gerador.
   De proposito: se ele saisse da mesma fonte que escreve o payload, um defeito nos dois lados
   se cancelaria e o teste passaria verde sobre um payload errado. Este leitor so conhece o
   formato publico (ID de 2 digitos, tamanho de 2 digitos, valor), que e o que o aplicativo do
   banco tambem conhece.
   --------------------------------------------------------------------------- */
function tlv(s){
  const o = {};
  let i = 0;
  while(i + 4 <= s.length){
    const id = s.substr(i,2);
    const n = parseInt(s.substr(i+2,2),10);
    if(isNaN(n)) break;
    o[id] = s.substr(i+4,n);
    i += 4 + n;
  }
  return o;
}
/* O identificador de conciliacao mora em 62 > 05. */
function txidDoPayload(p){
  const raiz = tlv(p);
  if(!raiz['62']) return null;
  return tlv(raiz['62'])['05'] ?? null;
}
/* A MESMA limpeza que o payload aplica (pTxidLimpo, em fc-compartilhado.js), reescrita aqui
   pelo mesmo motivo do leitor: comparar duas copias da mesma funcao nao prova nada. */
const soAlnum = t => String(t).replace(/[^A-Za-z0-9]/g,'').substring(0,25);

/* ============================================================================
   PARTE 1 -- O SINAL FIXO ALTO NA AGENDAMENTO POR PACOTE
   ============================================================================ */
console.log('\n== 1. Agendamento por pacote: a recusa do sinal fixo acima do teto ==');

/* Catalogo de teste. 'ops' e uma lista de [nome, preco, porQuantidade]. */
async function abaPacote(pg, {pacotes, sinal, qtdmax='10', urlobrigado='https://www.fotocerta.com.br/obrigado'}){
  await ident(pg);
  await clicar(pg,'aba-pac');
  await set(pg,'a-urlobrigado',urlobrigado);
  await set(pg,'a-prefixo','FC');
  for(const p of pacotes){
    await set(pg,'a-pcod',p.cod); await set(pg,'a-pnome',p.nome);
    await set(pg,'a-pdur','1 hora'); await set(pg,'a-ppreco',p.preco);
    await set(pg,'a-pinclui','10 fotos tratadas');
    await set(pg,'a-ppath','https://tidycal.com/fotocerta/'+p.cod.toLowerCase());
    for(const [nome,preco,porQtd] of (p.ops||[])){
      await set(pg,'a-op-nome',nome); await set(pg,'a-op-preco',preco);
      await marcar(pg,'a-op-qtd',!!porQtd);
      await clicar(pg,'a-op-add');
    }
    await clicar(pg,'a-pac-salvar');
  }
  if(sinal){
    await radio(pg,'a-sinal','sim');
    await radio(pg,'a-sinaltipo',sinal.tipo);
    if(sinal.tipo==='fixo') await set(pg,'a-sinalfixo',sinal.valor);
    else await set(pg,'a-sinalpct',sinal.valor);
  }
  await set(pg,'a-qtdmax',qtdmax);
  await clicar(pg,'a-gerar');
}

/* UM pacote de 300 com um opcional de 50 vendido POR QUANTIDADE, teto de quantidade 10.
   Teto real = 300 + 50*10 = 800. Tres numeros medem tres coisas diferentes:
     400  -> passa. Sem os opcionais na conta o teto seria 300, e 400 seria recusado.
     800  -> passa. E o limite exato: "maior que" recusa, "igual" nao.
     801  -> recusa. */
const UM = [{cod:'MINI', nome:'Mini ensaio', preco:'300', ops:[['Foto extra','50',true]]}];
for(const [valor, deveGerar] of [['400',true], ['800',true], ['801',false]]){
  const r = await gerarNaFerramenta(pg => abaPacote(pg,{pacotes:UM, sinal:{tipo:'fixo',valor}}),
    ['a-out1','a-out3'], {porta: FER++});
  const tag = 'sinal fixo R$ '+valor+' (teto real 800): ';
  if(deveGerar){
    chk(tag+'GEROU', r.alertas.length===0 && (r.valores['a-out3']||'').length>0,
      'alertas='+JSON.stringify(r.alertas).slice(0,180));
  }else{
    chk(tag+'RECUSOU', r.alertas.length===1 && (r.valores['a-out3']||'')==='',
      'alertas='+r.alertas.length+' bytes='+(r.valores['a-out3']||'').length);
    const m = r.alertas[0]||'';
    chk(tag+'e a frase nomeia os DOIS numeros', m.indexOf('801,00')>=0 && m.indexOf('800,00')>=0, m.slice(0,200));
    chk(tag+'e explica que o teto ja conta os opcionais e a quantidade',
      m.indexOf('todos os opcionais')>=0 && m.indexOf('teto da quantidade')>=0, m.slice(0,240));
  }
}

/* DOIS pacotes, 300 e 500, sem opcionais. O teto e o MAIOR (500), nunca a soma (800): a
   vitrine leva a UM pacote, e somar daria um teto que nenhum cliente alcanca. */
const DOIS = [{cod:'MINI', nome:'Mini ensaio', preco:'300'},
              {cod:'CHEIO', nome:'Ensaio completo', preco:'500'}];
for(const [valor, deveGerar, porque] of [['500',true,'o maior pacote passa'],
                                         ['501',false,'um centavo acima do maior pacote recusa'],
                                         ['800',false,'a SOMA dos dois nao e o teto']]){
  const r = await gerarNaFerramenta(pg => abaPacote(pg,{pacotes:DOIS, sinal:{tipo:'fixo',valor}}),
    ['a-out3'], {porta: FER++});
  const gerou = r.alertas.length===0 && (r.valores['a-out3']||'').length>0;
  chk('dois pacotes (300 e 500), sinal fixo R$ '+valor+': '+porque, gerou===deveGerar,
    'gerou='+gerou+' alertas='+JSON.stringify(r.alertas).slice(0,160));
}

/* O sinal PERCENTUAL nunca cai nesta recusa -- ele e uma fracao do proprio total. */
{
  const r = await gerarNaFerramenta(pg => abaPacote(pg,{pacotes:UM, sinal:{tipo:'pct',valor:'99'}}),
    ['a-out3'], {porta: FER++});
  chk('sinal PERCENTUAL de 99% nao e tocado pela recusa do sinal fixo',
    r.alertas.length===0 && (r.valores['a-out3']||'').length>0, JSON.stringify(r.alertas).slice(0,160));
}

/* O BLOCO EXECUTANDO: com o sinal fixo no teto (800), o carrinho MAXIMO paga -- nenhuma
   recusa na tela. E com o carrinho minimo (so o pacote, 300) a pagina recusa, que e o
   comportamento legitimo e deliberado (piso de venda) registrado em uTotalMaximo. */
{
  const g = await gerarNaFerramenta(pg => abaPacote(pg,{pacotes:UM, sinal:{tipo:'fixo',valor:'800'}}),
    ['a-out3'], {porta: FER++});
  const bloco = g.valores['a-out3']||'';
  const r = await comBlocoNaPagina({
    bloco, porta: PORTA++, busca:'?pac=MINI&data=2027-01-10&hora=10:00',
    medir: async pg => {
      const aviso = () => pg.evaluate(()=>{
        const e=document.querySelector('.fca-ob-sinal-aviso');
        return e ? e.textContent.trim() : '(sem elemento)';
      });
      const minimo = await aviso();
      /* ARMADILHA 2 do molde (ver pagina.mjs): a marcacao de selecao e DESENHADA -- o
         <input> nativo fica escondido atras de um <span class="fca-ob-mark">, e clicar no
         input e interceptado. O caminho do dedo e o ROTULO, e e nele que se clica. */
      await pg.locator('.fca-ob-op label').first().click();
      const mais = pg.locator('.fca-ob-qtd .fca-ob-qtd-b').nth(1);
      for(let i=0;i<9;i++) await mais.click();
      const qtd = await pg.evaluate(()=>{
        const v=document.querySelector('.fca-ob-qtd-v'); return v?v.textContent:'(sem)';
      });
      return {minimo, maximo: await aviso(), qtd};
    }
  });
  chk('o bloco: com o carrinho MAXIMO o sinal de 800 nao e recusado', r.maximo==='', 'aviso: '+r.maximo);
  chk('o bloco: a quantidade do opcional chegou ao teto', r.qtd==='10', 'qtd='+r.qtd);
  chk('o bloco: com o carrinho MINIMO (300) a pagina recusa -- piso de venda, deliberado',
    r.minimo!=='', 'aviso: '+JSON.stringify(r.minimo));
  chk('o bloco rodou sem erro proprio', errosReais(r.erros).length===0, r.erros.slice(0,2).join(' | '));
  console.log('    -> minimo: '+JSON.stringify(r.minimo.slice(0,80))+'  |  maximo: '+JSON.stringify(r.maximo));
}

/* ============================================================================
   PARTE 2 -- O CODIGO DO PEDIDO DO CHECKOUT
   ============================================================================ */
console.log('\n== 2. Checkout: o codigo do pedido, na tela e no extrato ==');

async function abaCheckout(pg, {cod, prods=[{nome:'Ensaio de Natal', preco:'420'}], resumo=null, zap='sim', ops=[]}){
  await ident(pg);
  await clicar(pg,'aba-uni');
  for(const p of prods){
    await set(pg,'u-pnome',p.nome); await set(pg,'u-ppreco',p.preco);
    if(p.qtd) await radio(pg,'u-pqtd','sim');
    for(const [nome,preco,porQtd] of (p.ops||[])){
      await set(pg,'u-op-nome',nome); await set(pg,'u-op-preco',preco);
      await marcar(pg,'u-op-qtd',!!porQtd);
      await clicar(pg,'u-op-add');
    }
    await clicar(pg,'u-prod-salvar');
  }
  if(cod!=null) await set(pg,'u-cod',cod);
  if(resumo) await radio(pg,'u-resumo',resumo);
  await radio(pg,'u-zap',zap);
  await clicar(pg,'u-gerar');
}

/* O campo TEM maxlength: digitar nunca estoura. E o que esta medido aqui, e e por isso que a
   recusa nova nao e sobre comprimento digitado. */
{
  const r = await gerarNaFerramenta(async pg => {
    await clicar(pg,'aba-uni');
    globalThis.__max = await pg.evaluate(()=>document.getElementById('u-cod').getAttribute('maxlength'));
    await pg.locator('#u-cod').pressSequentially('A'.repeat(40),{delay:0});
    globalThis.__digitado = await pg.evaluate(()=>document.getElementById('u-cod').value);
  }, [], {porta: FER++});
  chk('o campo u-cod declara maxlength (FC_LIM_CAMPOS o aplica na partida)', globalThis.__max==='25', 'maxlength='+globalThis.__max);
  chk('digitar 40 caracteres para em 25 -- o comprimento NUNCA foi o defeito pelo teclado',
    (globalThis.__digitado||'').length===25, 'ficaram '+(globalThis.__digitado||'').length);
}

const CODIGOS = [
  {cod:'CAMPANHA-2026', gera:true,  porque:'letras, numeros e hifen passam (a regra da Mini loja)'},
  {cod:'CAMPANHA_2026', gera:true,  porque:'sublinhado tambem'},
  {cod:'',              gera:true,  porque:'vazio continua valendo -- o bloco anuncia PEDIDO, padrao a vista'},
  {cod:'Pedido No 1',   gera:false, porque:'espaco'},
  {cod:'Natal/2026',    gera:false, porque:'barra'},
  {cod:'Promoção',      gera:false, porque:'acento'}
];
for(const c of CODIGOS){
  const r = await gerarNaFerramenta(pg => abaCheckout(pg,{cod:c.cod}), ['u-out'], {porta: FER++});
  const gerou = r.alertas.length===0 && (r.valores['u-out']||'').length>0;
  chk('codigo '+JSON.stringify(c.cod)+': '+(c.gera?'GERA':'RECUSA')+' -- '+c.porque, gerou===c.gera,
    'gerou='+gerou+' alertas='+JSON.stringify(r.alertas).slice(0,160));
  if(!c.gera){
    const m = r.alertas[0]||'';
    chk('  e a frase MOSTRA o que chegaria ao extrato', m.indexOf(soAlnum(c.cod))>=0, m.slice(0,220));
  }
}
/* O TETO, pelo caminho em que maxlength NAO age: estado gravado / importado. */
{
  const longo = 'A'.repeat(30);
  const r = await gerarNaFerramenta(async pg => {
    await clicar(pg,'aba-uni');
    await set(pg,'u-pnome','Ensaio'); await set(pg,'u-ppreco','420'); await clicar(pg,'u-prod-salvar');
    await ident(pg);
    /* atribuicao direta: e o que restaurarEstado faz, e maxlength nao alcanca */
    await pg.evaluate(v=>{const e=document.getElementById('u-cod');e.value=v;
      e.dispatchEvent(new Event('input',{bubbles:true}));}, longo);
    await clicar(pg,'u-gerar');
  }, ['u-out'], {porta: FER++});
  chk('codigo de 30 caracteres posto por ESTADO (onde maxlength nao age): RECUSA',
    r.alertas.length===1 && (r.valores['u-out']||'')==='', 'alertas='+JSON.stringify(r.alertas).slice(0,160));
  chk('  e a frase diz quantos cabem', (r.alertas[0]||'').indexOf('máximo 25')>=0, (r.alertas[0]||'').slice(0,200));
}

/* O BLOCO EXECUTANDO: a tela e o campo 62>05 do payload carregam o MESMO identificador. */
{
  const COD = 'CAMPANHA-2026';
  const g = await gerarNaFerramenta(pg => abaCheckout(pg,{cod:COD, resumo:'sim'}), ['u-out'], {porta: FER++});
  const r = await comBlocoNaPagina({
    bloco: g.valores['u-out']||'', porta: PORTA++,
    medir: async pg => {
      await pg.locator('.fcu-gerar').first().click();
      return {
        payload: await pg.evaluate(()=>document.querySelector('.fcu-cola').value),
        resumo: await pg.evaluate(()=>document.querySelector('.fcu-resumo').value)
      };
    }
  });
  const naTela = (r.resumo||'').split('\n')[0].replace(/^Pedido\s+/,'');
  const noPayload = txidDoPayload(r.payload||'');
  chk('o bloco: a tela mostra o codigo INTEIRO, como foi digitado', naTela===COD, JSON.stringify(naTela));
  chk('o bloco: o leitor TLV achou o campo 62>05 do payload', noPayload!==null, 'payload='+String(r.payload).slice(0,60));
  chk('o bloco: o que chega ao extrato e o mesmo codigo, a menos do hifen que o Pix descarta',
    noPayload===soAlnum(naTela), 'tela='+JSON.stringify(naTela)+' payload='+JSON.stringify(noPayload));
  chk('o bloco: e nada mais sumiu -- so o hifen', noPayload==='CAMPANHA2026', JSON.stringify(noPayload));
  chk('o bloco rodou sem erro proprio', errosReais(r.erros).length===0, r.erros.slice(0,2).join(' | '));
  console.log('    -> tela: '+JSON.stringify(naTela)+'   62>05: '+JSON.stringify(noPayload));
}

/* ============================================================================
   PARTE 3 -- O ENDERECO DA PAGINA DE OBRIGADO
   ============================================================================ */
console.log('\n== 3. Agendamento por pacote: o endereco relativo ==');
for(const [url, gera, porque] of [
  ['https://www.fotocerta.com.br/obrigado', true,  'endereco inteiro'],
  ['http://www.fotocerta.com.br/obrigado',  true,  'http tambem -- a exigencia e a autoridade'],
  ['/obrigado',                              false, 'caminho do proprio site: o TidyCal redireciona de FORA'],
  ['//outro-host.com/obrigado',              false, 'protocol-relative: resolve para outro host'],
  ['https://',                               false, 'esquema sem dominio']
]){
  const r = await gerarNaFerramenta(pg => abaPacote(pg,{pacotes:UM, sinal:null, urlobrigado:url}),
    ['a-out1','a-out2','a-out3'], {porta: FER++});
  const gerou = r.alertas.length===0 && (r.valores['a-out3']||'').length>0;
  chk('endereco '+JSON.stringify(url)+': '+(gera?'GERA':'RECUSA')+' -- '+porque, gerou===gera,
    'gerou='+gerou+' alertas='+JSON.stringify(r.alertas).slice(0,200));
  if(gera){
    chk('  e a lista de enderecos do TidyCal sai com o endereco INTEIRO',
      (r.valores['a-out2']||'').indexOf(url+'?pac=MINI')>=0, (r.valores['a-out2']||'').slice(0,160));
  }else if(url==='/obrigado'){
    const m = r.alertas[0]||'';
    chk('  e a recusa tem NOME PROPRIO para o caminho relativo (nao cai no "nao entendi")',
      m.indexOf('caminho do próprio site')>=0 && m.indexOf('TidyCal')>=0, m.slice(0,240));
    chk('  e as TRES saidas ficaram vazias', ['a-out1','a-out2','a-out3'].every(k=>(r.valores[k]||'')===''));
  }
}

/* ============================================================================
   PARTE 4 -- A LISTA DO WHATSAPP, COM E SEM O RESUMO
   ============================================================================ */
console.log('\n== 4. Checkout: a mensagem do WhatsApp e a MESMA com e sem o resumo ==');
/* A sonda registra o window.open no armazenamento -- ver o cabecalho de SONDA_OPEN em
   upsell.mjs, e a razao la registrada: o clique pode navegar, e variavel de pagina morre. */
const SONDA_OPEN = '<scr'+'ipt>(function(){\n'
  + 'var orig=window.open;\n'
  + 'window.open=function(u,a){\n'
  + '  var w=null;try{w=orig.call(window,u,a);}catch(e){}\n'
  + "  try{var l=JSON.parse(localStorage.getItem('__abriu')||'[]');l.push(String(u));\n"
  + "    localStorage.setItem('__abriu',JSON.stringify(l));}catch(e2){}\n"
  + '  return w;};\n'
  + '})();</scr'+'ipt>';

/* Um produto vendido por quantidade, com DOIS opcionais tambem por quantidade. No carrinho
   um deles fica marcado com quantidade ZERO -- que e exatamente onde os dois lacos poderiam
   discordar, e o que a documentacao registra como o motivo de haver um so. */
const PRODS_Q = [{nome:'Ensaio de Natal', preco:'420', qtd:true,
                  ops:[['Foto extra','35',true], ['Album 20x30','150',true]]}];

async function msgDoZap(usaResumo){
  const g = await gerarNaFerramenta(pg => abaCheckout(pg,{cod:'NATAL26', prods:PRODS_Q, resumo:usaResumo}),
    ['u-out'], {porta: FER++});
  const bloco = g.valores['u-out']||'';
  const r = await comBlocoNaPagina({
    bloco, cabeca: SONDA_OPEN, porta: PORTA++,
    medir: async pg => {
      /* marca os DOIS opcionais (radio: sao 'unico', entao marca-se um; com dois produtos
         seria outra medida -- aqui o que interessa e o opcional de quantidade zero). */
      const caixas = pg.locator('.fcu-ops input');
      const n = await caixas.count();
      for(let i=0;i<n;i++) await caixas.nth(i).check().catch(()=>{});
      /* zera a quantidade do ULTIMO seletor visivel: e o do opcional marcado */
      const menos = pg.locator('.fcu-qtd .fcu-qtd-b:first-child');
      const q = await menos.count();
      if(q>1) await menos.nth(q-1).click();
      const vistos = await pg.evaluate(()=>Array.from(document.querySelectorAll('.fcu-qtd-v')).map(e=>e.textContent));
      await pg.locator('.fcu-gerar').first().click();
      await pg.evaluate(()=>{try{localStorage.removeItem('__abriu');}catch(e){}});
      await pg.locator('.fcu-zap').first().click().catch(()=>{});
      await new Promise(x=>setTimeout(x,250));
      const reg = await pg.evaluate(()=>{try{return JSON.parse(localStorage.getItem('__abriu')||'[]');}catch(e){return [];}});
      return {vistos, url: reg[0]||null,
        temItens: await pg.evaluate(()=>!!document.querySelector('.fcu-resumo'))};
    }
  });
  const u = r.url||'';
  const texto = u.indexOf('?text=')>=0 ? decodeURIComponent(u.split('?text=')[1]) : null;
  return {texto, vistos:r.vistos, temResumo:r.temItens, erros:r.erros, bloco};
}

const comR = await msgDoZap('sim');
const semR = await msgDoZap('nao');
chk('COM resumo: o bloco tem a caixa do resumo', comR.temResumo===true);
chk('SEM resumo: o bloco NAO tem a caixa do resumo', semR.temResumo===false);
chk('COM resumo: o WhatsApp foi pedido', !!comR.texto, 'url='+String(comR.texto).slice(0,60));
chk('SEM resumo: o WhatsApp foi pedido', !!semR.texto, 'url='+String(semR.texto).slice(0,60));
chk('um opcional ficou com quantidade ZERO nos dois',
  (comR.vistos||[]).indexOf('0')>=0 && (semR.vistos||[]).indexOf('0')>=0,
  'com='+JSON.stringify(comR.vistos)+' sem='+JSON.stringify(semR.vistos));
chk('A MENSAGEM E IDENTICA, caractere por caractere', comR.texto===semR.texto,
  '\n      com resumo: '+JSON.stringify(comR.texto)+'\n      sem resumo: '+JSON.stringify(semR.texto));
chk('e o opcional de quantidade zero nao aparece em nenhuma das duas',
  String(comR.texto).indexOf('x0')<0 && String(semR.texto).indexOf('x0')<0,
  JSON.stringify(comR.texto));
chk('o segundo laco sumiu do TEXTO gerado sem resumo (so resta itensEscolhidos)',
  semR.bloco.indexOf('function itensEscolhidos()')>=0 &&
  semR.bloco.indexOf("partes.push('- *'+p.nome+'*")<0,
  'itensEscolhidos='+(semR.bloco.indexOf('function itensEscolhidos()')>=0));
console.log('    -> mensagem: '+JSON.stringify(String(comR.texto).slice(0,140)));

/* ============================================================================
   PARTE 5 -- AS CINCO DECISOES DO DONO
   ============================================================================ */
console.log('\n== 5. As cinco decisoes, uma medicao cada ==');

/* ---- 5.1 preco zero recusado nas QUATRO ---- */
{
  /* Checkout e Mini loja: recusa no CADASTRO. */
  const rU = await gerarNaFerramenta(async pg => {
    await clicar(pg,'aba-uni');
    await set(pg,'u-pnome','Brinde'); await set(pg,'u-ppreco','0');
    await clicar(pg,'u-prod-salvar');
    globalThis.__n = await pg.evaluate(()=>document.querySelectorAll('#u-prod-lista li').length);
  }, [], {porta: FER++});
  chk('5.1 Checkout: produto a preco ZERO nao entra no catalogo', globalThis.__n===0 && rU.alertas.length===1,
    'itens='+globalThis.__n+' alertas='+JSON.stringify(rU.alertas).slice(0,140));

  const rM = await gerarNaFerramenta(async pg => {
    await clicar(pg,'aba-loja');
    await set(pg,'m-pnome','Brinde'); await set(pg,'m-ppreco','0');
    await set(pg,'m-pimg','https://storage.alboom.ninja/x.jpg');
    await clicar(pg,'m-prod-salvar');
    globalThis.__n = await pg.evaluate(()=>document.querySelectorAll('#m-prod-lista li').length);
  }, [], {porta: FER++});
  chk('5.1 Mini loja: produto a preco ZERO nao entra no catalogo', globalThis.__n===0 && rM.alertas.length===1,
    'itens='+globalThis.__n+' alertas='+JSON.stringify(rM.alertas).slice(0,140));

  const rA = await gerarNaFerramenta(async pg => {
    await clicar(pg,'aba-pac');
    await set(pg,'a-pcod','ZERO'); await set(pg,'a-pnome','Brinde');
    await set(pg,'a-pdur','1h'); await set(pg,'a-ppreco','0');
    await set(pg,'a-ppath','https://tidycal.com/fotocerta/x');
    await clicar(pg,'a-pac-salvar');
    globalThis.__n = await pg.evaluate(()=>document.querySelectorAll('#a-pac-lista li').length);
  }, [], {porta: FER++});
  chk('5.1 Agendamento por pacote: pacote a preco ZERO nao entra (ja era assim)',
    globalThis.__n===0 && rA.alertas.length===1, 'itens='+globalThis.__n);

  const rP = await gerarNaFerramenta(async pg => {
    await ident(pg); await clicar(pg,'aba-cob');
    await set(pg,'p-url','https://www.fotocerta.com.br/pagar');
    await set(pg,'p-desc','Ensaio'); await set(pg,'p-valor','0');
    /* Quem recusa o valor e pRecusaCobranca, do "Gerar link" -- e nao pRecusaBloco, do
       "Gerar": o BLOCO da /pagar nao carrega valor nenhum, quem carrega e o link. Medido nesta
       bateria, na primeira passagem: pedir o bloco com valor zero gera sem uma palavra, e esta
       e a pergunta certa. */
    await clicar(pg,'p-gerarlink');
  }, ['p-out2'], {porta: FER++});
  chk('5.1 Link de cobranca: valor ZERO recusa o LINK (ja era assim)',
    rP.alertas.length>0 && (rP.valores['p-out2']||'')==='', JSON.stringify(rP.alertas).slice(0,140));

  /* E a recusa de GERACAO, para estado importado que nao passa pelo formulario. */
  const rG = await gerarNaFerramenta(async pg => {
    await ident(pg); await clicar(pg,'aba-uni');
    await set(pg,'u-pnome','Ensaio'); await set(pg,'u-ppreco','420'); await clicar(pg,'u-prod-salvar');
    /* PELO ESTADO, que e o caminho que nao passa pelo formulario -- e o unico por onde um
       preco zero ainda chega ao catalogo. Reescreve o armazenamento e RECARREGA: e a recarga
       que faz restaurarEstado rodar (mesma razao registrada em meio-prio-migracao). */
    await pg.evaluate(()=>{
      const st=JSON.parse(localStorage.getItem('fcConstrutores'));
      st.u.prods[0].preco=0;
      localStorage.setItem('fcConstrutores',JSON.stringify(st));
    });
    await pg.reload();
    await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                              window.confirm = () => true; window.open = () => null; });
    await clicar(pg,'aba-uni');
    await clicar(pg,'u-gerar');
  }, ['u-out'], {porta: FER++});
  chk('5.1 Checkout: preco zerado POR ESTADO tambem recusa ao gerar',
    rG.alertas.length===1 && (rG.valores['u-out']||'')==='', JSON.stringify(rG.alertas).slice(0,180));
  /* O OPCIONAL a zero continua valendo -- e a metade da decisao que nao se ve sozinha. */
  const rO = await gerarNaFerramenta(async pg => {
    await ident(pg); await clicar(pg,'aba-uni');
    await set(pg,'u-pnome','Ensaio'); await set(pg,'u-ppreco','420');
    await set(pg,'u-op-nome','Brinde'); await set(pg,'u-op-preco','0'); await clicar(pg,'u-op-add');
    await clicar(pg,'u-prod-salvar');
    await clicar(pg,'u-gerar');
  }, ['u-out'], {porta: FER++});
  chk('5.1 e o OPCIONAL a R$ 0,00 continua valendo -- a recusa e do item de catalogo',
    rO.alertas.length===0 && (rO.valores['u-out']||'').indexOf("preco:0.00")>=0,
    'alertas='+JSON.stringify(rO.alertas).slice(0,140));
}

/* ---- 5.2, 5.3 e 5.5: o que a ferramenta recem-aberta mostra ---- */
{
  const r = await gerarNaFerramenta(async pg => {
    for(const aba of ['aba-uni','aba-loja','aba-pac','aba-cob']){ await clicar(pg,aba); await pg.waitForTimeout(40); }
    globalThis.__f = await pg.evaluate(()=>({
      resumo: ['u','m'].map(p=>p+'='+((document.querySelector('input[name="'+p+'-resumo"]:checked')||{}).value)),
      descpix: ['u','m','a','p'].map(p=>p+'='+document.getElementById(p+'-descpix').value),
      ou: ['u','m','a','p'].map(p=>p+'='+document.getElementById(p+'-txt-ou').value),
      ouDesc: ['u','m'].map(p=>p+'='+document.getElementById(p+'-txt-ou-desc').value),
      passo: ['u','m','a','p'].map(p=>p+'='+document.getElementById(p+'-sinalpct').step),
      barra: (document.getElementById('fc-falhas')||{textContent:''}).textContent.trim()
    }));
  }, [], {porta: FER++});
  const f = globalThis.__f;
  chk('5.2 o resumo copiavel nasce LIGADO nas duas que o tem',
    JSON.stringify(f.resumo)===JSON.stringify(['u=sim','m=sim']), JSON.stringify(f.resumo));
  chk('5.3 o desconto do Pix de fabrica e 5% nas tres de catalogo, e 0 no Link de cobranca',
    JSON.stringify(f.descpix)===JSON.stringify(['u=5','m=5','a=5','p=0']), JSON.stringify(f.descpix));
  chk('5.4 o separador de fabrica e NEUTRO ("OU") nas quatro',
    JSON.stringify(f.ou)===JSON.stringify(['u=OU','m=OU','a=OU','p=OU']), JSON.stringify(f.ou));
  chk('5.4 e o segundo separador (com desconto) tambem e neutro',
    JSON.stringify(f.ouDesc)===JSON.stringify(['u=OU','m=OU']), JSON.stringify(f.ouDesc));
  chk('5.5 o passo do percentual do sinal e 0,5 nas quatro',
    JSON.stringify(f.passo)===JSON.stringify(['u=0.5','m=0.5','a=0.5','p=0.5']), JSON.stringify(f.passo));
  chk('e a barra vermelha da fabrica divergente NAO acende', f.barra==='', JSON.stringify(f.barra));
  chk('sem alerta e sem erro de console ao abrir', r.alertas.length===0 && r.erros.length===0,
    JSON.stringify(r.alertas).slice(0,120)+' '+r.erros.slice(0,2).join(' | '));
}

/* ---- 5.4 (segunda metade): a MIGRACAO do separador ja gravado ----
   Trocar o padrao de fabrica nao chega a quem ja usou a ferramenta: os campos de texto sao
   gravados a cada tecla, entao o estado dele ja contem a frase antiga e valor gravado vence
   padrao. O estado e COLHIDO DA PROPRIA REFERENCIA -- nunca escrito a mao aqui --, e a regra
   e a de fcOrdVirar: so migra o que for, caractere por caractere, uma fabrica anterior. */
console.log('\n== 5.4b a migracao do separador que ja estava gravado ==');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-unifpag-'));
process.on('exit', () => { try{ fs.rmSync(tmp, {recursive:true, force:true}); }catch(e){} });
const dirRef = path.join(tmp, 'ref');
fs.mkdirSync(dirRef, {recursive:true});
let refOk = true;
try{
  execFileSync('/bin/sh', ['-c',
    'git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(dirRef)]);
}catch(e){ refOk = false; }
console.log('referencia presa: ' + REF);

const MEU = 'Prefiro que voce pague no Pix, por favor';
async function colherDaRef(personalizar){
  const r = await gerarNaFerramenta(async pg => {
    await clicar(pg,'aba-uni'); await pg.waitForTimeout(40);
    await clicar(pg,'aba-loja'); await pg.waitForTimeout(40);
    if(personalizar) await set(pg, 'u-txt-ou', MEU);
    globalThis.__naRef = await pg.evaluate(()=>({
      u: document.getElementById('u-txt-ou').value,
      uD: document.getElementById('u-txt-ou-desc').value,
      m: document.getElementById('m-txt-ou').value,
      mD: document.getElementById('m-txt-ou-desc').value
    }));
    globalThis.__estado = await pg.evaluate(()=>localStorage.getItem('fcConstrutores'));
  }, [], {raiz: dirRef, porta: FER++});
  return {naRef: globalThis.__naRef, estado: globalThis.__estado, alertas:r.alertas};
}
async function restaurarAqui(estado){
  const r = await gerarNaFerramenta(async pg => {
    await pg.evaluate(s => localStorage.setItem('fcConstrutores', s), estado);
    await pg.reload();
    await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                              window.confirm = () => true; window.open = () => null; });
    await pg.waitForTimeout(200);
    await clicar(pg,'aba-uni'); await pg.waitForTimeout(40);
    await clicar(pg,'aba-loja'); await pg.waitForTimeout(40);
    globalThis.__agora = await pg.evaluate(()=>({
      u: document.getElementById('u-txt-ou').value,
      uD: document.getElementById('u-txt-ou-desc').value,
      m: document.getElementById('m-txt-ou').value,
      mD: document.getElementById('m-txt-ou-desc').value,
      barra: (document.getElementById('fc-falhas')||{textContent:''}).textContent.trim()
    }));
  }, [], {porta: FER++});
  return {agora: globalThis.__agora, alertas:r.alertas, erros:r.erros};
}

if(!refOk){
  console.log('  ..    NAO MEDIU -- a referencia "'+REF+'" nao existe neste repositorio.');
}else{
  const colhido = await colherDaRef(false);
  const refAnterior = colhido.naRef.u !== 'OU';
  if(!refAnterior){
    console.log('  ..    NAO MEDIU -- a referencia "'+REF+'" JA TEM o separador neutro (colhido: '+
                JSON.stringify(colhido.naRef.u)+').');
    console.log('  ..    Migrar so tem sentido a partir da fabrica ANTERIOR. Para medir de verdade,');
    console.log('  ..    passe um commit de antes de 13/09/2026:');
    console.log('  ..      node scripts/verificar/unificar-pagamento.mjs <commit>');
  }else{
    chk('a referencia gravou a fabrica ANTIGA nos quatro campos',
      colhido.naRef.u!=='OU' && colhido.naRef.uD!=='OU' && colhido.naRef.m!=='OU' && colhido.naRef.mD!=='OU',
      JSON.stringify(colhido.naRef));
    const dep = await restaurarAqui(colhido.estado);
    chk('MIGROU os quatro para o separador neutro',
      dep.agora.u==='OU' && dep.agora.uD==='OU' && dep.agora.m==='OU' && dep.agora.mD==='OU',
      JSON.stringify(dep.agora));
    chk('e a barra vermelha nao acendeu depois de migrar', dep.agora.barra==='', JSON.stringify(dep.agora.barra));
    chk('sem alerta e sem erro ao restaurar', dep.alertas.length===0 && dep.erros.length===0,
      JSON.stringify(dep.alertas).slice(0,140));

    const meu = await colherDaRef(true);
    chk('a referencia gravou o texto do DONO', meu.naRef.u===MEU, JSON.stringify(meu.naRef.u));
    const dep2 = await restaurarAqui(meu.estado);
    chk('o texto do dono ficou INTOCADO -- a ferramenta nunca sobrescreve o que ele escreveu',
      dep2.agora.u===MEU, JSON.stringify(dep2.agora.u));
    chk('e o campo ao lado, que estava na fabrica antiga, migrou na mesma passagem',
      dep2.agora.uD==='OU', JSON.stringify(dep2.agora.uD));
  }
}

process.exit(resumo());
