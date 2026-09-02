/* ============================================================================
   OS BLOCOS COM OS TEXTOS DE ESCAPE, EXECUTANDO DE VERDADE
   ============================================================================
   POR QUE ISTO EXISTE, E O QUE ELE PROVA QUE A FOTOGRAFIA NAO PROVA.
   'geradores.mjs' compara TEXTO. Ele diz que o texto do dono chegou ao bloco e que o
   escape foi APLICADO -- nao diz que o bloco RODA depois disso. E escape errado nao
   produz saida diferente: produz saida que um navegador se recusa a executar, ou pior,
   uma que ele executa ate a metade. Os tres casos que este projeto tem de temer:

     '  ->  apostrofa nao dobrada fecha o literal JS no meio da frase;
     \\  ->  barra invertida nao dobrada come o caractere seguinte, ou deixa um literal
             sem fim;
     </script  ->  o parser HTML FECHA o <script> ali, sem ligar para o contexto de
             string -- e tudo que vier depois no documento vira texto solto. E o unico
             dos tres que quebra a PAGINA INTEIRA, nao so o bloco (Manual do Prosite).

   A CHECAGEM QUE PEGA O TERCEIRO e a mais barata e a mais importante: um marco
   ('#fim-do-documento') colado DEPOIS do bloco. Se um '</script' escapou de um texto,
   o resto do documento e engolido e o marco desaparece. Nenhuma outra medicao acusa
   isso -- o bloco pode ate parecer funcionar.

   O QUE ELE USA. O MESMO cenario de geradores.mjs (cenario.mjs, incluindo a tabela
   TEXTOS com os selos ZxNN) e o molde de pagina.mjs. Cenario escrito duas vezes seria
   a mesma armadilha do codigo escrito duas vezes.

   REDE BLOQUEADA, DE PROPOSITO (e o molde quem bloqueia). Os blocos pedem imagens,
   fontes, o SDK do PayPal e o iframe do TidyCal, e nada disso sobe aqui. As falhas de
   CARREGAMENTO DE RECURSO sao, portanto, o comportamento esperado, e sao filtradas por
   'soDoBloco' -- filtrar erro de rede e diferente de filtrar erro do bloco, e a lista
   do filtro esta escrita ali, curta, para nao virar um cobertor.

   Uso:  node scripts/verificar/textos-escape.mjs
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, textoSemScripts, chk, resumo } from './pagina.mjs';
import { preparar, conteudo, cobranca, configurarTextos, gerarTodas } from './cenario.mjs';
import { radio, clicar } from './lib.mjs';

/* Erro de rede nao e erro do bloco: o molde aborta TODA requisicao externa de proposito,
   e o Chromium registra cada aborto como erro de console. A lista e curta e literal --
   um filtro largo aqui esconderia justamente o que o teste procura. */
const RUIDO = [/Failed to load resource/i, /net::ERR/i, /ERR_FAILED/i, /favicon/i];
const soDoBloco = erros => erros.filter(e => !RUIDO.some(re => re.test(e)));

const SAIDAS = ['s-out','l-out','t-out3','u-out','c-out1','p-out1','p-out2','m-out','a-out1','a-out2','a-out3'];

console.log('gerando os blocos na ferramenta, com os textos de escape...');
const { valores, alertas, erros } = await gerarNaFerramenta(async pg => {
  await preparar(pg); await conteudo(pg); await cobranca(pg,{});
  const ausentes = await configurarTextos(pg);
  if(ausentes.length) throw new Error('esta arvore nao tem os campos de texto: '+ausentes.join(', '));
  await gerarTodas(pg);
  /* t-out3 (a pagina intermediaria embutida) so existe neste modo -- e e nela que o
     title do iframe, com aspas duplas e '</script', vai parar. */
  await clicar(pg,'aba-tidy'); await radio(pg,'t-arq','embutida'); await clicar(pg,'t-gerar');
  await pg.waitForTimeout(80);
}, SAIDAS);
chk('a ferramenta gerou sem alerta',  alertas.length === 0, JSON.stringify(alertas));
chk('a ferramenta gerou sem erro de console', erros.length === 0, erros.slice(0,2).join(' | '));

/* A CONSULTA de cada pagina sai da propria saida da ferramenta, e nao de um valor escrito
   a mao aqui: a /pagar so mostra a cobranca com o '?c=...&s=...' que ela mesma assinou, e a
   pagina de obrigado so reconhece o pacote com o '?pac=...' que a aba publicou. Valor
   copiado a mao envelhece na primeira vez que o formato do link mudar. */
const buscaPagar = '?' + String(valores['p-out2']).split('?')[1];
const buscaObrigado = String(valores['a-out2']).split('\n')
  .find(l => l.indexOf('http') === 0)
  .replace(/^[^?]*\?/, '?')
  .replace('{{contact.name}}','Ana Souza')
  .replace('{{booking.date}}','2026-10-12')
  .replace('{{booking.time}}','15:00')
  .replace('{{booking.starts_at}}','2026-10-12T15:00:00-03:00');

/* Cada caso: a saida, a consulta na URL, o seletor que prova que o bloco DESENHOU, e uma
   medicao propria com o que aquele bloco tem de especial. */
const CASOS = [
  {saida:'s-out', raiz:'.fc-slideshow', porta:8801, medir: async pg => ({
    /* escAttr: as aspas duplas e o & do aria-label voltam ao valor original quando lidos
       como propriedade -- e o que prova que o atributo nao ficou partido. */
    aria:  await pg.$eval('.fc-slideshow', el => el.getAttribute('aria-label')),
    /* aTplJs com {n}: o marcador tem de ter virado o NUMERO, e a barra invertida tem de
       ter sobrevivido como UMA barra. A terceira foto do cenario e a que nao tem legenda,
       entao e ela que cai no texto padrao. */
    alt3:  await pg.$$eval('.fc-slide img', els => els.length>2 ? els[2].alt : ''),
    dot1:  await pg.$eval('.fc-dots button', el => el.getAttribute('aria-label'))
  })},
  {saida:'l-out', raiz:'.fcw-botao', porta:8802, medir: async pg => ({
    aria: await pg.$eval('.fcw-botao', el => el.getAttribute('aria-label'))
  })},
  {saida:'t-out3', raiz:'iframe', porta:8803, medir: async pg => ({
    titulo: await pg.$eval('iframe', el => el.getAttribute('title'))
  })},
  {saida:'u-out', raiz:'.fcuni', porta:8804, medir: async pg => ({
    corpo: await pg.$eval('.fcuni', el => el.textContent)
  })},
  {saida:'c-out1', raiz:'body', porta:8805, medir: async () => ({})},
  /* textoSemScripts, e nao innerText: as duas secoes de pagamento da /pagar nascem
     ESCONDIDAS (o Pix so abre depois do clique), e innerText nao le o que esta oculto --
     mediria a ausencia do texto e chamaria de defeito. E a armadilha 1 registrada no
     cabecalho de pagina.mjs, so que pelo outro lado: la o textContent inclui demais
     (o fonte do <script>), aqui o innerText inclui de menos. O helper resolve os dois:
     clona o body, tira os <script> do CLONE, e le o textContent do que sobrou. */
  {saida:'p-out1', raiz:'body', porta:8806, busca:buscaPagar, medir: async pg => ({
    corpo: await textoSemScripts(pg)
  })},
  {saida:'m-out', raiz:'.fcmloja', porta:8807, medir: async pg => ({
    corpo: await pg.$eval('.fcmloja', el => el.textContent),
    /* O {n} DA MINI LOJA, medido em vez de suposto. O aviso de item sumido so aparece com
       um carrinho guardado que aponte para item que saiu do catalogo, e montar esse estado
       aqui exigiria forjar a chave e o selo da loja. O que da para medir sem forjar nada e
       a REGRA que o bloco carrega: ela tem de SUBSTITUIR o marcador, nunca concatenar o
       numero na frente. Foi exatamente isso que estava errado ate 03/09/2026. */
    regraN: await pg.evaluate(() => {
      const fontes = [...document.querySelectorAll('script')].map(s => s.textContent).join('\n');
      return {
        substitui: /TXT_SUMIRAM\)\.replace\(\/\\\{n\\\}\/g,sumidos\)/.test(fontes),
        concatena: /sumidos\+' '\+\(sumidos===1/.test(fontes)
      };
    })
  })},
  {saida:'a-out1', raiz:'.fca-raiz', porta:8808, medir: async pg => ({
    corpo: await pg.$eval('.fca-raiz', el => el.textContent),
    sub:   await pg.$eval('.fca-subtitulo', el => el.textContent).catch(() => '(sem subtitulo)')
  })},
  {saida:'a-out3', raiz:'body', porta:8809, busca:buscaObrigado, medir: async pg => ({
    corpo: await textoSemScripts(pg)
  })}
];

const visto = {};
for(const caso of CASOS){
  const bloco = valores[caso.saida];
  chk(caso.saida+': a ferramenta produziu o bloco', !!bloco && bloco.length > 100, 'tamanho '+(bloco||'').length);
  if(!bloco) continue;
  const r = await comBlocoNaPagina({
    bloco,
    /* O MARCO DEPOIS DO BLOCO. E o que denuncia um '</script' que tenha escapado de um
       texto: o parser fecharia o <script> ali e engoliria o resto do documento. */
    corpoDepois: '<div id="fim-do-documento">fim</div>',
    busca: caso.busca || '',
    porta: caso.porta,
    medir: async pg => Object.assign(
      { marco: await pg.$eval('#fim-do-documento', el => el.textContent).catch(() => null),
        desenhou: await pg.$(caso.raiz).then(el => !!el) },
      await caso.medir(pg))
  });
  visto[caso.saida] = r;
  chk(caso.saida+': o documento nao foi engolido por um </script', r.marco === 'fim', String(r.marco));
  chk(caso.saida+': o bloco desenhou ('+caso.raiz+')', r.desenhou === true);
  const proprios = soDoBloco(r.erros);
  chk(caso.saida+': sem erro de console do bloco', proprios.length === 0, proprios.slice(0,2).join(' | '));
}

/* ===== as medicoes especificas: o texto do dono chegou INTEIRO a tela ===== */
const s = visto['s-out'] || {};
chk('s: aspas duplas e & voltam inteiros do atributo',
    s.aria === 'Zx01 Galeria "oficial" & cia', s.aria);
chk('s: a barra invertida sobreviveu como UMA barra, e o {n} virou o numero',
    s.alt3 === 'Zx03 Foto 3 \\ do acervo', JSON.stringify(s.alt3));
chk('s: o {n} do aria-label das bolinhas virou o numero',
    s.dot1 === 'Zx02 Ir para a foto 1 do ensaio da mae', s.dot1);

const l = visto['l-out'] || {};
chk('l: o escape DUPLO (atributo dentro de string JS) devolve as aspas certas',
    l.aria === 'Zx04 Falar "agora" no WhatsApp', l.aria);

const t = visto['t-out3'] || {};
chk('t: o title do iframe traz as aspas e o </script como TEXTO, nao como marcacao',
    t.titulo === 'Zx06 Agenda "oficial" </script> — não é aqui', t.titulo);

const u = visto['u-out'] || {};
chk('u: a apostrofa dentro do literal JS chegou a tela',
    (u.corpo||'').indexOf('Zx08 Desconto') >= 0 || (u.corpo||'').indexOf('Zx09') >= 0,
    (u.corpo||'').slice(0,120));

const m = visto['m-out'] || {};
chk('m: a vitrine desenhou com os produtos do cenario',
    (m.corpo||'').indexOf('Album 30x30') >= 0 || (m.corpo||'').indexOf('Álbum') >= 0 ||
    (m.corpo||'').indexOf('Moldura') >= 0, (m.corpo||'').slice(0,120));
chk('m: o aviso de item sumido SUBSTITUI o {n} (D-5), em vez de concatenar o numero',
    m.regraN && m.regraN.substitui === true && m.regraN.concatena === false,
    JSON.stringify(m.regraN));

const a1 = visto['a-out1'] || {};
chk('a: o subtitulo da vitrine saiu, com o {pct} ja trocado na geracao',
    /^Zx21 Até \d+% de desconto pagando no Pix$/.test(a1.sub || ''), a1.sub);
chk('a: a linha de parcela saiu com {n} e {valor} trocados',
    /Zx23/.test(a1.corpo || '') && /em até 6x de R\$/.test(a1.corpo || ''),
    (a1.corpo||'').slice(0,200));
chk('a: a linha "a partir de" da familia saiu com o {valor} trocado',
    /Zx24 a partir de R\$/.test(a1.corpo || ''), (a1.corpo||'').slice(0,200));

const a3 = visto['a-out3'] || {};
chk('a-obrigado: o aviso do Pix (escJsD: aspas duplas, barra e </script) chegou a tela',
    (a3.corpo||'').indexOf('Zx25 O Pix não avisa: me avise \\ "assim" que pagar </script>') >= 0,
    (a3.corpo||'').slice(0,300));

const p = visto['p-out1'] || {};
/* Zx16 (a linha "Pagando via Pix (-N%)") so aparece com desconto, e a cobranca base do
   cenario nao tem desconto -- entao quem prova o caminho aqui e Zx17, o titulo da secao do
   PayPal, que traz aspas duplas dentro de um literal JS entre aspas simples. */
chk('p: o titulo da secao do PayPal chegou a tela com as aspas duplas inteiras',
    (p.corpo||'').indexOf('Zx17 PayPal, cartão "ou" débito') >= 0,
    (p.corpo||'').slice(0,300));

process.exit(resumo());
