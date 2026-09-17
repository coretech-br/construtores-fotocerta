/* ============================================================================
   O VALOR MEDIO DA HORA, NA VITRINE DE PACOTES
   ============================================================================
   O PEDIDO do dono (16/09/2026): "nos pacotes com mais de 1 hora de duracao eu
   sempre faco um valor diferenciado da hora... quero que ele tenha na tela o valor
   medio da hora, calculando o total do pacote dividido pela duracao". Depois,
   completando: "cada um ao lado do seu numero cheio" -- ou seja, um para o preco em
   destaque e outro para a linha do outro meio de pagamento.

   POR QUE ISTO PRECISA DE PROVA PROPRIA, e nao de um grep. Sao duas coisas que este
   projeto ja viu darem errado em silencio:

     1. UM NUMERO QUE NAO FECHA COM O VIZINHO. O valor por hora divide o numero que
        esta AO LADO dele -- o preco com desconto na linha do Pix, o cheio na linha do
        cartao. Dividir sempre o mesmo e exibir ao lado do outro poe, na mesma linha,
        dois numeros que nao fecham entre si. Foi exatamente o defeito do destaque do
        Pix na Calculadora de album, medido na manha do mesmo dia.

     2. UM DIVISOR ADIVINHADO. A Duracao e TEXTO LIVRE ('1 hora', '2 horas', '1h30') e
        vai para a tela como o dono escreveu. O numero de horas sai dali, por leitura --
        e leitura errada de divisor de dinheiro produz um valor errado que ninguem
        percebe. A defesa tem tres camadas, e as tres sao medidas aqui: a leitura
        acontece na FERRAMENTA (nunca no bloco, onde ninguem veria), ela RECUSA em vez
        de chutar quando nao entende, e a lista de pacotes MOSTRA o que ela entendeu.

   O QUE NAO SE MEDE AQUI: o texto do campo e a aparencia dele, que sao da familia ja
   coberta por aparencia.mjs e textos-migrados.mjs.

   SEM REFERENCIA CONGELADA: tudo na arvore de hoje, nos dois estados do meio prioritario.

   ROTEIRO: node scripts/verificar/valor-por-hora.mjs
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { IDENT } from './cenario.mjs';
import { set, radio, clicar } from './lib.mjs';

const EXTERNO = /cdnjs|paypal\.com|alboom|tidycal|ERR_|Failed to load/i;
const reais = e => (e||[]).filter(x => !EXTERNO.test(x));
/* 'R$ 99,00' -> 99 . Escrito aqui, e nao importado do projeto: se os dois lados lessem
   o numero pelo mesmo caminho, esta prova nao teria opiniao nenhuma. */
const num = t => {
  const m = String(t||'').match(/([0-9][0-9.]*),([0-9]{2})/);
  return m ? parseFloat(m[1].replace(/\./g,'') + '.' + m[2]) : null;
};

/* TODA FORMA ACEITA ENTRA AQUI, e nao uma amostra dela. O dono perguntou, em 16/09/2026,
   se o CALCULO funciona em todas as formas que a leitura entende -- e a resposta honesta
   naquele momento era "a leitura foi medida nas seis, o dinheiro na tela em duas". Medir o
   leitor isolado e medir metade: entre ele e o numero que o cliente le existem a emissao do
   'horas', a divisao dentro do bloco e a formatacao. As seis formas agora atravessam o
   caminho inteiro, com o bloco rodando, e com precos DIFERENTES entre si -- precos iguais
   deixariam uma troca de pacote passar despercebida.
   As duas ultimas linhas sao os dois destinos que NAO produzem valor por hora. */
const PACOTES = [
  {cod:'FA', nome:'Forma horas', dur:'2 horas',   preco:'220', horas:2},
  {cod:'FB', nome:'Forma h',     dur:'2h',        preco:'240', horas:2},
  {cod:'FC', nome:'Forma so num',dur:'2',         preco:'260', horas:2},
  {cod:'FD', nome:'Forma hmin',  dur:'1h30',      preco:'300', horas:1.5},
  {cod:'FE', nome:'Forma min',   dur:'90 min',    preco:'330', horas:1.5},
  {cod:'FF', nome:'Forma fracao',dur:'1,5 h',     preco:'360', horas:1.5},
  {cod:'UMA',nome:'Uma hora',    dur:'1 hora',    preco:'120', horas:0},  /* nao passa de 1h */
  {cod:'ABE',nome:'A combinar',  dur:'a combinar',preco:'500', horas:0}   /* nao entendida */
];

async function gerar(prio, texto, porta){
  return await gerarNaFerramenta(async pg => {
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
    await clicar(pg,'aba-pac');
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-prefixo','FC');
    await radio(pg,'a-metodo','ambos');
    await radio(pg,'a-prio',prio);
    await set(pg,'a-descpix','10');
    await set(pg,'a-txt-porhora',texto);
    for(const p of PACOTES){
      await set(pg,'a-pcod',p.cod); await set(pg,'a-pnome',p.nome);
      await set(pg,'a-pdur',p.dur); await set(pg,'a-ppreco',p.preco);
      await set(pg,'a-pinclui','Estudio'); await set(pg,'a-ppath','fotocerta/'+p.cod.toLowerCase());
      await clicar(pg,'a-pac-salvar');
    }
    globalThis.__lista = await pg.evaluate(() =>
      [].slice.call(document.querySelectorAll('#a-pac-lista li .info')).map(e => e.textContent));
    await clicar(pg,'a-gerar');
  }, ['a-out1'], {porta});
}

/* Le da vitrine EXECUTANDO: cada cartao, as duas linhas e os valores por hora dentro delas. */
const naTela = (bloco, porta) => comBlocoNaPagina({bloco, porta, medir: async pg => {
  await pg.waitForTimeout(500);
  return {lido: await pg.evaluate(() =>
    [].slice.call(document.querySelectorAll('.fca-card')).map(c => {
      const ler = sel => { const e = c.querySelector(sel); return e ? e.textContent : null; };
      const horaDe = sel => { const l = c.querySelector(sel);
        const h = l ? l.querySelector('.fca-preco-hora') : null; return h ? h.textContent : null; };
      return {nome: ler('.fca-card-nome'),
              l1: ler('.fca-preco-linha1'), l2: ler('.fca-preco-linha2'),
              lpix: ler('.fca-preco-linhapix'),
              hora1: horaDe('.fca-preco-linha1'), hora2: horaDe('.fca-preco-linha2'),
              horaPix: horaDe('.fca-preco-linhapix'),
              quantos: c.querySelectorAll('.fca-preco-hora').length};
    }))};
}});

/* ===================== 1. a ferramenta diz o que entendeu ===================== */
console.log('\n== 1. a lista de pacotes mostra a leitura da duracao ==');
const gPix = await gerar('pix', '{valor} / hora', 8971);
chk('[1] a ferramenta gerou sem alerta', gPix.alertas.length === 0, JSON.stringify(gPix.alertas));
const lista = globalThis.__lista || [];
chk('[1] a lista traz uma linha por pacote', lista.length === PACOTES.length, String(lista.length));
for(const p of PACOTES){
  const li = lista.find(x => x.indexOf(p.cod) === 0) || '';
  if(p.horas > 1)
    chk('[1] '+p.cod+' ("'+p.dur+'"): a lista anuncia as horas entendidas',
        li.indexOf(String(p.horas).replace('.',',')+' h') >= 0, JSON.stringify(li));
  else if(p.dur === 'a combinar')
    chk('[1] '+p.cod+' ("'+p.dur+'"): a lista AVISA que nao entendeu',
        /não entendida/.test(li), JSON.stringify(li));
  else
    /* O ANUNCIO E UM SUFIXO ' . N h', e a busca tem de ser por ELE. Procurar ' h' solto
       casava com o NOME do pacote ("Uma hora") e acusava um anuncio que nao existia --
       medido na primeira execucao desta prova. */
    chk('[1] '+p.cod+' ("'+p.dur+'"): uma hora nao vira anuncio nenhum',
        !/ · [0-9,]+ h$/.test(li) && !/não entendida/.test(li), JSON.stringify(li));
}

/* ===================== 2. so viaja o que vai ser usado ===================== */
console.log('\n== 2. o bloco leva UM numero por pacote que qualifica, e mais nada ==');
const bPix = gPix.valores['a-out1'] || '';
chk('[2] o bloco saiu', bPix.length > 1000, String(bPix.length));
const horasNoBloco = (bPix.match(/horas:[0-9.]+/g) || []).sort();
const esperadoHoras = PACOTES.filter(p => p.horas).map(p => 'horas:'+p.horas).sort();
chk('[2] exatamente os pacotes acima de uma hora levam "horas", e com o numero certo',
    JSON.stringify(horasNoBloco) === JSON.stringify(esperadoHoras),
    'no bloco ' + JSON.stringify(horasNoBloco) + ' · esperado ' + JSON.stringify(esperadoHoras));

/* ===================== 3. na tela, cada um ao lado do SEU numero ===================== */
console.log('\n== 3. Pix em destaque: um na linha do Pix, outro na do cartao ==');
const tPix = (await naTela(bPix, 8972));
for(const p of PACOTES){
  const c = (tPix.lido||[]).find(x => x.nome === p.nome);
  chk('[3] '+p.cod+': o cartao existe na vitrine', !!c, JSON.stringify(p.nome));
  if(!c) continue;
  if(!p.horas){
    chk('[3] '+p.cod+': NENHUM valor por hora aparece', c.quantos === 0, JSON.stringify(c));
    continue;
  }
  chk('[3] '+p.cod+': aparecem DOIS -- um por numero cheio', c.quantos === 2, String(c.quantos));
  const cheio = parseFloat(p.preco), pix = Math.round(cheio * 90) / 100;
  chk('[3] '+p.cod+': na linha 1, o valor por hora divide o preco do PIX',
      Math.abs(num(c.hora1) - pix / p.horas) < 0.005,
      c.hora1 + ' · esperado ' + (pix / p.horas).toFixed(2) + ' (de ' + pix + '/' + p.horas + ')');
  chk('[3] '+p.cod+': e o numero grande dessa linha e o mesmo divisor',
      Math.abs(num(c.l1) - pix) < 0.005, c.l1);
  chk('[3] '+p.cod+': na linha do cartao, ele divide o preco CHEIO',
      Math.abs(num(c.hora2) - cheio / p.horas) < 0.005,
      c.hora2 + ' · esperado ' + (cheio / p.horas).toFixed(2));
  chk('[3] '+p.cod+': e o valor por hora do Pix e MENOR que o do cartao',
      num(c.hora1) < num(c.hora2), c.hora1 + ' x ' + c.hora2);
}
chk('[3] sem erro proprio do bloco', reais(tPix.erros).length === 0, reais(tPix.erros).slice(0,2).join(' | '));

/* ===================== 4. com o CARTAO em destaque, os dois trocam de linha ===================== */
console.log('\n== 4. cartao em destaque: a linha do Pix ganha o seu ==');
const gPP = await gerar('pp', '{valor} / hora', 8973);
const tPP = await naTela(gPP.valores['a-out1'] || '', 8974);
{
  const c = (tPP.lido||[]).find(x => x.nome === 'Forma horas');
  chk('[4] o cartao existe', !!c, JSON.stringify((tPP.lido||[]).map(x=>x.nome)));
  if(c){
    chk('[4] continuam sendo dois', c.quantos === 2, String(c.quantos));
    chk('[4] o da linha 1 divide o preco CHEIO (que agora e o numero grande)',
        Math.abs(num(c.hora1) - 220 / 2) < 0.005, c.hora1);
    chk('[4] o da linha do Pix divide o preco COM desconto',
        Math.abs(num(c.horaPix) - 198 / 2) < 0.005, c.horaPix);
    chk('[4] e o numero grande dessa linha 1 e mesmo o cheio',
        Math.abs(num(c.l1) - 220) < 0.005, c.l1);
  }
}

/* ===================== 5. TEXTO VAZIO: nada disso existe ===================== */
console.log('\n== 5. com o campo vazio, o recurso inteiro desaparece do bloco ==');
const gVazio = await gerar('pix', '', 8975);
const bVazio = gVazio.valores['a-out1'] || '';
chk('[5] a ferramenta gerou sem alerta', gVazio.alertas.length === 0, JSON.stringify(gVazio.alertas));
for(const [que, achou] of [['a funcao porHora', /function porHora/.test(bVazio)],
                           ['a regra de CSS .fca-preco-hora', /fca-preco-hora/.test(bVazio)],
                           ['a chave horas nos pacotes', /horas:/.test(bVazio)]])
  chk('[5] '+que+' NAO entra no bloco', !achou, String(achou));
const tVazio = await naTela(bVazio, 8976);
{
  const c = (tVazio.lido||[]).find(x => x.nome === 'Forma horas');
  chk('[5] e na tela nao aparece nenhum', !!c && c.quantos === 0, JSON.stringify(c));
  /* A LINHA DO CARTAO CONTINUA INTEIRA. Com o texto configurado ela passou a ter um span
     proprio para caber o valor por hora ao lado; sem ele, ela volta a ser texto solto --
     e o que o cliente le nao pode mudar por causa disso. */
  chk('[5] a linha do cartao continua dizendo o que dizia',
      !!c && /ou R\$ 220,00 no cart/.test(c.l2||''), JSON.stringify(c && c.l2));
}

/* ===================== 6. o texto e do DONO, e o {valor} e o unico marcador ===================== */
console.log('\n== 6. o texto configurado manda ==');
const gTxt = await gerar('pix', 'a hora sai por {valor}', 8977);
const tTxt = await naTela(gTxt.valores['a-out1'] || '', 8978);
{
  const c = (tTxt.lido||[]).find(x => x.nome === 'Forma horas');
  chk('[6] a redacao do dono chega inteira a tela',
      !!c && c.hora1 === 'a hora sai por R$ 99,00', JSON.stringify(c && c.hora1));
}

/* ===========================================================================
   7. O CAMPO 'HORAS', OPCIONAL, VENCE O TEXTO -- a opcao B, escolhida pelo dono
   ===========================================================================
   A PERGUNTA DELE foi exatamente esta: "qual dos dois campos sera usado para o
   calculo, e se nao for informado o campo opcional, como sera calculado?". A resposta
   e uma regra de precedencia, e regra de precedencia que nao e medida vira, com o
   tempo, duas regras. As QUATRO situacoes possiveis entram aqui, e a quarta -- os dois
   preenchidos e discordando -- e a que mais importa: o campo vence, e a ferramenta
   DIZ que venceu, em vez de escolher em silencio.
   =========================================================================== */
console.log('\n== 7. o campo opcional de horas ==');
{
  const CASOS = [
    {cod:'C1', nome:'So texto',      dur:'2 horas',      horas:'',    preco:'220', esperado:2,   fonte:'texto'},
    {cod:'C2', nome:'So campo',      dur:'Meia diária',  horas:'4',   preco:'800', esperado:4,   fonte:'campo'},
    {cod:'C3', nome:'Campo vence',   dur:'1h30',         horas:'2',   preco:'400', esperado:2,   fonte:'campo'},
    {cod:'C4', nome:'Campo de uma',  dur:'3 horas',      horas:'1',   preco:'300', esperado:0,   fonte:'campo'},
    {cod:'C5', nome:'Nem um nem out',dur:'a combinar',   horas:'',    preco:'500', esperado:0,   fonte:''}
  ];
  const g = await gerarNaFerramenta(async pg => {
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
    await clicar(pg,'aba-pac');
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-prefixo','FC');
    await radio(pg,'a-metodo','ambos'); await radio(pg,'a-prio','pix');
    await set(pg,'a-descpix','10'); await set(pg,'a-txt-porhora','{valor} / hora');
    for(const c of CASOS){
      await set(pg,'a-pcod',c.cod); await set(pg,'a-pnome',c.nome);
      await set(pg,'a-pdur',c.dur); await set(pg,'a-phoras',c.horas);
      await set(pg,'a-ppreco',c.preco); await set(pg,'a-pinclui','Estudio');
      await set(pg,'a-ppath','fotocerta/'+c.cod.toLowerCase());
      await clicar(pg,'a-pac-salvar');
    }
    globalThis.__l7 = await pg.evaluate(() =>
      [].slice.call(document.querySelectorAll('#a-pac-lista li .info')).map(e => e.textContent));
    /* O CAMPO VOLTA AO FORMULARIO na edicao -- sem isso, editar um pacote apagaria o numero
       que o dono tinha informado, e o valor por hora mudaria sozinho ao salvar de novo. */
    await pg.evaluate(() => {
      var bts=[].slice.call(document.querySelectorAll('#a-pac-lista button'));
      var ed=bts.filter(function(b){return b.title==='Editar';})[1];  /* o C2 */
      if(ed)ed.click();
    });
    globalThis.__ed = await pg.evaluate(() => ({
      cod:(document.getElementById('a-pcod')||{}).value,
      horas:(document.getElementById('a-phoras')||{}).value}));
    await clicar(pg,'a-gerar');
  }, ['a-out1'], {porta:8979});
  chk('[7] a ferramenta gerou sem alerta', g.alertas.length === 0, JSON.stringify(g.alertas));

  const l7 = globalThis.__l7 || [];
  for(const c of CASOS){
    const li = l7.find(x => x.indexOf(c.cod) === 0) || '';
    if(c.fonte === 'campo')
      chk('[7] '+c.cod+': a lista diz que o numero veio DO CAMPO',
          /\(do campo\)|do campo|uma hora ou menos/.test(li), JSON.stringify(li));
    if(c.cod === 'C3')
      chk('[7] C3: e AVISA que a Duracao diz outra coisa (1h30 contra 2)',
          li.indexOf('⚠') >= 0 && li.indexOf('1,5 h') >= 0, JSON.stringify(li));
    if(c.cod === 'C5')
      chk('[7] C5: sem campo e sem texto entendido, a lista avisa',
          /não entendida/.test(li), JSON.stringify(li));
  }
  chk('[7] editar um pacote devolve o numero informado ao formulario',
      (globalThis.__ed||{}).cod === 'C2' && String((globalThis.__ed||{}).horas) === '4',
      JSON.stringify(globalThis.__ed));

  const b7 = g.valores['a-out1'] || '';
  const esp = CASOS.filter(c => c.esperado > 1).map(c => 'horas:'+c.esperado).sort();
  chk('[7] so os que passam de uma hora viajam, com o numero da precedencia',
      JSON.stringify((b7.match(/horas:[0-9.]+/g)||[]).sort()) === JSON.stringify(esp),
      JSON.stringify((b7.match(/horas:[0-9.]+/g)||[]).sort()) + ' · esperado ' + JSON.stringify(esp));

  const t7 = await naTela(b7, 8980);
  for(const c of CASOS){
    const v = (t7.lido||[]).find(x => x.nome === c.nome);
    if(!v) { chk('[7] '+c.cod+': o cartao existe', false, c.nome); continue; }
    if(!c.esperado || c.esperado <= 1){
      chk('[7] '+c.cod+': nenhum valor por hora na tela', v.quantos === 0, JSON.stringify(v));
      continue;
    }
    const cheio = parseFloat(c.preco), pix = Math.round(cheio*90)/100;
    chk('[7] '+c.cod+': o valor por hora usa '+c.esperado+' h e divide o preco do Pix',
        Math.abs(num(v.hora1) - pix/c.esperado) < 0.005,
        v.hora1 + ' · esperado ' + (pix/c.esperado).toFixed(2));
    chk('[7] '+c.cod+': e a linha do cartao divide o cheio pelo MESMO numero de horas',
        Math.abs(num(v.hora2) - cheio/c.esperado) < 0.005,
        v.hora2 + ' · esperado ' + (cheio/c.esperado).toFixed(2));
  }
  chk('[7] sem erro proprio do bloco', reais(t7.erros).length === 0, reais(t7.erros).slice(0,2).join(' | '));
}

/* ===========================================================================
   8. A ETIQUETA: separada da frase, e com as cores do dono
   ===========================================================================
   O DEFEITO QUE ESTA PARTE FECHA foi visto pelo dono na tela, e nao por prova
   nenhuma: na linha do cartao o valor medio saia COLADO no fim da frase --
   "em ate 12x de R$ 18,34R$ 110,00 / hora". A linha 1 nunca teve o problema porque
   ja era flex com gap; a linha 2 era texto solto. Duas medicoes independentes
   entram aqui, e nenhuma delas e "existe um espaco no texto":

     - a CAIXA da etiqueta nao encosta na caixa do texto ao lado (getBoundingClientRect,
       nos dois lados, nas duas larguras). Medir o texto diria "18,34R$ 110,00" com ou
       sem separacao visual, porque textContent nao tem geometria;
     - as CORES sao as que o dono configurou, lidas por getComputedStyle -- e nao a
       classe, que estaria la mesmo se a regra nao tivesse sido emitida.
   =========================================================================== */
console.log('\n== 8. a etiqueta do valor medio ==');
{
  const FUNDO = '#C8E6FF', TEXTO = '#0B3B5C';  /* distintos do padrao, para nao passar por acaso */
  const g = await gerarNaFerramenta(async pg => {
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
    await clicar(pg,'aba-pac');
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-prefixo','FC');
    await radio(pg,'a-metodo','ambos'); await radio(pg,'a-prio','pix');
    await set(pg,'a-descpix','10'); await set(pg,'a-txt-porhora','{valor} / hora');
    await set(pg,'a-chf-t',FUNDO); await set(pg,'a-cht-t',TEXTO);
    await set(pg,'a-pcod','DIA'); await set(pg,'a-pnome','Dia Util');
    await set(pg,'a-pdur','2 horas'); await set(pg,'a-ppreco','220');
    await set(pg,'a-pinclui','Locacao por 2 horas'); await set(pg,'a-ppath','fotocerta/dia');
    await clicar(pg,'a-pac-salvar');
    await clicar(pg,'a-gerar');
  }, ['a-out1'], {porta:8983});
  chk('[8] a ferramenta gerou sem alerta', g.alertas.length === 0, JSON.stringify(g.alertas));

  for(const largura of [1024, 375]){
    const r = await comBlocoNaPagina({bloco: g.valores['a-out1']||'', porta: 8984 + (largura===375?1:0),
      medir: async pg => {
        await pg.setViewportSize({width: largura, height: 1200});
        await pg.waitForTimeout(500);
        return {lido: await pg.evaluate(() => {
          const c = document.querySelector('.fca-card');
          const cx = s => { const e = c.querySelector(s); if(!e) return null;
            const r = e.getBoundingClientRect(), st = getComputedStyle(e);
            return {x:Math.round(r.left), dir:Math.round(r.right), y:Math.round(r.top),
                    larg:Math.round(r.width), bg:st.backgroundColor, cor:st.color,
                    peso:st.fontWeight, raio:st.borderTopLeftRadius};
          };
          const l2 = c.querySelector('.fca-preco-linha2');
          return {
            hora1: cx('.fca-preco-linha1 .fca-preco-hora'),
            hora2: cx('.fca-preco-linha2 .fca-preco-hora'),
            selo:  cx('.fca-selo'),
            /* a caixa do TEXTO da linha do cartao -- o primeiro filho, que e o span da frase */
            txt2: (() => { const e = l2 && l2.firstElementChild; if(!e) return null;
              const r = e.getBoundingClientRect();
              return {dir:Math.round(r.right), baixo:Math.round(r.bottom), y:Math.round(r.top)}; })()
          };
        })};
      }});
    const d = r.lido || {};
    const tag = '[8/'+largura+'] ';
    chk(tag+'as duas etiquetas existem', !!d.hora1 && !!d.hora2, JSON.stringify(d));
    if(!d.hora1 || !d.hora2) continue;

    chk(tag+'o fundo e o que o dono configurou', d.hora1.bg === 'rgb(200, 230, 255)', d.hora1.bg);
    chk(tag+'e a cor do texto tambem', d.hora1.cor === 'rgb(11, 59, 92)', d.hora1.cor);
    chk(tag+'a etiqueta tem canto arredondado, como o selo', parseFloat(d.hora1.raio) > 8, d.hora1.raio);
    chk(tag+'ela continua SECUNDARIA -- peso normal, e o selo do desconto e que e forte',
        Number(d.hora1.peso) < Number((d.selo||{}).peso || 700),
        'hora=' + d.hora1.peso + ' selo=' + (d.selo||{}).peso);
    /* A MEDIDA QUE IMPORTA: a etiqueta da linha do cartao NAO encosta na frase. Quando as duas
       caixas ficam na mesma altura ha de haver folga horizontal; quando a etiqueta desce para a
       linha de baixo (celular estreito), a separacao e vertical e ja basta. */
    const mesmaLinha = Math.abs(d.hora2.y - (d.txt2||{}).y) < 4;
    if(mesmaLinha)
      chk(tag+'a etiqueta do cartao nao encosta na frase (folga de '+(d.hora2.x-(d.txt2||{}).dir)+'px)',
          d.hora2.x - (d.txt2||{}).dir >= 6, JSON.stringify({txt:d.txt2, hora:d.hora2}));
    else
      chk(tag+'a etiqueta do cartao desceu para a propria linha, e por isso ja esta separada',
          d.hora2.y >= (d.txt2||{}).baixo - 2, JSON.stringify({txt:d.txt2, hora:d.hora2}));
    chk(tag+'e ela nao vaza para fora do cartao',
        d.hora2.dir <= 1024, String(d.hora2.dir));
  }
}

/* ===========================================================================
   9. A ORDEM E A DISTRIBUICAO, depois de o dono ver a tela
   ===========================================================================
   DUAS CORRECOES, as duas pedidas olhando o cartao renderizado:

     1. "A linha do PIX ficou abaixo do valor. Melhor ficar ao lado do desconto."
        A etiqueta nasceu ENTRE o preco e o selo -- foi o pedido original --, e numa
        largura apertada quem sobrava para a linha de baixo era o SELO DO DESCONTO.
        O elemento que move a decisao do cliente indo sozinho para baixo, enquanto o
        informativo ficava ao lado do preco. A ordem passou a ser preco, SELO,
        etiqueta: quem quebra e o ultimo, e o ultimo tem de ser o que pode quebrar.

     2. A linha do cartao virou DUAS, alinhadas a direita:
             ou R$ 220,00 no cartao   [R$ 110,00 / hora]
             Em ate 12x de R$ 18,34
        Numa linha so, a etiqueta caia depois do "18,34" e o cliente lia tres numeros
        seguidos sem hierarquia. O numero cheio fica com a SUA etiqueta; o parcelamento,
        que descreve outra coisa, ganha a propria linha.

   As duas sao medidas por GEOMETRIA, e nao por ordem no texto: quem decide o que o
   cliente ve e a caixa na tela. Nas duas larguras.
   =========================================================================== */
console.log('\n== 9. a ordem dos elementos e as duas linhas do cartao ==');
{
  const g = await gerarNaFerramenta(async pg => {
    for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
    await clicar(pg,'aba-pac');
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-prefixo','FC');
    await radio(pg,'a-metodo','ambos'); await radio(pg,'a-prio','pix');
    await set(pg,'a-descpix','10'); await set(pg,'a-parcelas','12');
    await set(pg,'a-txt-porhora','{valor} / hora');
    await set(pg,'a-pcod','DIA'); await set(pg,'a-pnome','Dia Util');
    await set(pg,'a-pdur','2 horas'); await set(pg,'a-ppreco','220');
    await set(pg,'a-pinclui','Locacao por 2 horas'); await set(pg,'a-ppath','fotocerta/dia');
    await clicar(pg,'a-pac-salvar');
    await clicar(pg,'a-gerar');
  }, ['a-out1'], {porta:8986});
  chk('[9] a ferramenta gerou sem alerta', g.alertas.length === 0, JSON.stringify(g.alertas));

  for(const largura of [1024, 375]){
    const r = await comBlocoNaPagina({bloco: g.valores['a-out1']||'', porta: 8987 + (largura===375?1:0),
      medir: async pg => {
        await pg.setViewportSize({width: largura, height: 1200});
        await pg.waitForTimeout(500);
        return {lido: await pg.evaluate(() => {
          const c = document.querySelector('.fca-card');
          const cx = s => { const e = c.querySelector(s); if(!e) return null;
            const r = e.getBoundingClientRect();
            return {x:Math.round(r.left), dir:Math.round(r.right), y:Math.round(r.top),
                    baixo:Math.round(r.bottom), txt:e.textContent.trim()}; };
          return {caixa: cx('.fca-card-preco'), selo: cx('.fca-selo'),
                  h1: cx('.fca-preco-linha1 .fca-preco-hora'),
                  l2: cx('.fca-preco-linha2'), h2: cx('.fca-preco-linha2 .fca-preco-hora'),
                  parc: cx('.fca-preco-parcela')};
        })};
      }});
    const d = r.lido || {}, tag = '[9/'+largura+'] ';
    chk(tag+'o selo e a etiqueta existem os dois', !!d.selo && !!d.h1, JSON.stringify(d));
    if(!d.selo || !d.h1) continue;

    /* 1. O SELO VEM ANTES. Na mesma linha, "antes" e estar a esquerda; se a etiqueta tiver
       descido de linha, "antes" e o selo estar acima -- e nesse caso quem quebrou foi ela,
       que e exatamente o que esta correcao queria. */
    const mesmaLinha = Math.abs(d.selo.y - d.h1.y) < 4;
    chk(tag+'o selo do desconto vem ANTES da etiqueta do valor medio',
        mesmaLinha ? (d.selo.dir <= d.h1.x) : (d.selo.y < d.h1.y),
        JSON.stringify({selo:d.selo, hora:d.h1}));
    chk(tag+'e o selo NUNCA e o que fica sozinho embaixo',
        d.selo.y <= d.h1.y, 'selo y' + d.selo.y + ' · etiqueta y' + d.h1.y);

    /* 2. O PARCELAMENTO TEM LINHA PROPRIA, abaixo da linha do numero cheio. */
    chk(tag+'o parcelamento ganhou a propria linha', !!d.parc, JSON.stringify(d.parc));
    if(d.parc){
      chk(tag+'e ela fica ABAIXO da linha do cartao',
          d.parc.y >= (d.l2||{}).baixo - 2,
          'parcela y' + d.parc.y + ' · linha do cartao termina em ' + (d.l2||{}).baixo);
      chk(tag+'o texto do parcelamento nao repete o "no cartao"',
          !/no cart/i.test(d.parc.txt) && /12x/.test(d.parc.txt), JSON.stringify(d.parc.txt));
      chk(tag+'e a frase de cima nao leva mais o parcelamento colado',
          !/12x/.test((d.l2||{}).txt||''), JSON.stringify((d.l2||{}).txt));
    }
    /* 3. ALINHADAS A DIREITA, como ele desenhou: as duas terminam na borda da caixa. */
    if(d.h2 && d.caixa)
      chk(tag+'a etiqueta do cartao encosta na borda direita da caixa de preco',
          Math.abs(d.h2.dir - d.caixa.dir) <= 2,
          'etiqueta termina em ' + d.h2.dir + ' · caixa em ' + d.caixa.dir);
  }
}

process.exit(resumo());
