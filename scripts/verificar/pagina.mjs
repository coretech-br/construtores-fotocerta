/* ============================================================================
   O MOLDE: EXECUTAR UM BLOCO GERADO NUMA PAGINA QUE IMITA O PROSITE
   ============================================================================
   POR QUE ISTO EXISTE. A regressao (geradores.mjs) so compara TEXTO gerado --
   ela nunca cola o bloco numa pagina e roda de verdade. Quem precisa disso (o
   selo do Pix anima? o botao de "ja paguei" aparece? a borda com efeito herda
   o nome certo de animacao?) ate 22/08/2026 escrevia, a cada rodada, um script
   novo que sobe servidor, abre Playwright, monta um HTML minimo e mede. Isso
   foi reescrito tres vezes -- e uma delas mediu errado e deu falso alarme
   (ver a armadilha do textContent, abaixo). Um script de teste desaparece
   quando a rodada termina; um MOLDE fica, e o proximo teste nao reinventa a
   parte que ja se sabe fazer certo.

   O QUE ESTE ARQUIVO NAO E. Nao e o teste de nenhuma aba especifica. Ele nao
   sabe o que e "borda", "contagem" ou "Pix" -- so sabe pegar um bloco (HTML/
   CSS/JS, exatamente como a ferramenta entrega) e o outro pedaco (a "pagina"
   que o hospeda), grudar os dois, servir por HTTP e devolver o que a funcao
   de medicao de cada teste quis olhar. Quem sabe o que medir e o CHAMADOR.

   AS DUAS ARMADILHAS QUE JA CUSTARAM CARO NESTE PROJETO:

   1. `document.body.textContent` inclui o TEXTO-FONTE do proprio <script> do
      bloco. Uma checagem ingenua de "sumiu a palavra X do corpo da pagina"
      da falso negativo sempre que X aparece dentro do codigo JS gerado (um
      nome de variavel, um comentario, uma string) -- a palavra "sumiu" da
      tela, mas continua la dentro do <script>, e o textContent nao distingue
      as duas coisas. O jeito certo: clonar o body, tirar os <script> do
      CLONE, e so entao ler o texto. E o que `textoSemScripts` faz.

   2. Trocar o valor de um <select> com `el.value = ...` mais um evento
      sintetico NAO E CONFIAVEL em controles que a ferramenta redesenha por
      cima (a marcacao de selecao e desenhada -- ver o Manual do Prosite --,
      entao o <select>/radio nativo por baixo pode nao estar mais no caminho
      que o clique do operador de fato percorre). Interacao real do
      Playwright (`locator.selectOption(...)`, `locator.click()`) passa pelo
      mesmo caminho que o dedo do operador passaria; disparar eventos a mao
      nao passa, e ja produziu medicao de um estado que a interface nunca
      alcanca sozinha.

   USO MINIMO:

     import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';

     const { valores } = await gerarNaFerramenta(async pg => { ... }, ['x-out']);
     const r = await comBlocoNaPagina({
       bloco: valores['x-out'],
       medir: async pg => ({ animacao: await pg.$eval('#alvo', el => getComputedStyle(el).animationName) })
     });
     chk('anima', r.animacao !== 'none');
     process.exit(resumo());
   ============================================================================ */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navegador, servir, abrir, ler, alertas } from './lib.mjs';

const RAIZ_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* Monta o documento minimo que hospeda o bloco. Fica de fora de qualquer
   funcao maior porque o formato em si (doctype + lang pt-br + charset utf-8)
   e o unico pedaco que TODO teste desta familia precisa igual -- e por isso
   vale testar essa montagem sozinha, se um dia surgir duvida sobre ela. */
function montarHtml({ cabeca, corpoAntes, bloco, corpoDepois }){
  return '<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>Pagina</title>'
    + (cabeca || '')
    + '</head><body>'
    + (corpoAntes || '')
    + (bloco || '')
    + (corpoDepois || '')
    + '</body></html>';
}

/* O RELOGIO FALSO. Precisa estar de pe ANTES do primeiro script da pagina
   rodar -- por isso via addInitScript, e nao via evaluate() depois do load,
   que chegaria tarde demais para qualquer codigo que leia a data no
   carregamento (e o bloco da contagem regressiva le). `new Date()` sem
   argumento devolve a data fixada; `new Date(o que for)` continua se
   comportando normal, porque contas de data dentro do bloco (formatar um
   prazo, por exemplo) precisam do construtor de verdade. Isto NAO mexe em
   setTimeout/setInterval: e um relogio parado, nao um relogio que corre
   rapido -- suficiente para testar "o que a pagina mostra neste instante",
   que e o caso de uso deste projeto ate agora. */
function instalarRelogioFalso(pg, quando){
  const fixo = quando instanceof Date ? quando.getTime() : Number(quando);
  return pg.addInitScript(ms => {
    const OrigDate = Date;
    class DataFalsa extends OrigDate{
      constructor(...args){
        if(args.length === 0) return new OrigDate(ms);
        return new OrigDate(...args);
      }
      static now(){ return ms; }
    }
    window.Date = DataFalsa;
  }, fixo);
}

/* O MOLDE. Sobe um servidor de UMA rota so (/pagina), abre a rota num
   contexto Playwright isolado, bloqueia tudo que nao seja o proprio
   servidor (o teste nao pode depender de CDN, fonte ou SDK externo estarem
   no ar), e devolve o que `medir(pg)` disser mais os erros capturados.
   Fecha tudo -- contexto, navegador e servidor -- mesmo se `medir` lancar:
   um teste que vaza servidor derruba o proximo teste da bateria com "porta
   em uso", e esse erro nao teria nada a ver com o que de fato quebrou. */
export async function comBlocoNaPagina({
  bloco = '', cabeca = '', corpoAntes = '', corpoDepois = '',
  busca = '', porta = 8790, reducedMotion = false, relogio = null, permitir = [], bloquear = [], medir
}){
  if(typeof medir !== 'function'){
    throw new Error('comBlocoNaPagina precisa de uma funcao medir(pg) -- e ela quem sabe o que este teste esta verificando.');
  }
  const html = montarHtml({ cabeca, corpoAntes, bloco, corpoDepois });
  const origemPropria = '127.0.0.1:' + porta;
  const srv = http.createServer((req, res) => {
    const rota = req.url.split('?')[0];
    if(rota !== '/pagina'){ res.writeHead(404); res.end('nao'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  await new Promise(r => srv.listen(porta, r));

  const br = await navegador();
  try{
    const contexto = await br.newContext(
      reducedMotion ? { reducedMotion: 'reduce' } : {}
    );
    try{
      const pg = await contexto.newPage();
      const erros = [];
      pg.on('pageerror', e => erros.push('pageerror: ' + e.message));
      pg.on('console', m => { if(m.type() === 'error') erros.push('console: ' + m.text()); });

      /* So a origem do proprio servidor passa. Qualquer outra requisicao --
         CDN, fonte, SDK, telemetria -- e abortada, para o teste falhar por
         falta de rede nunca ser confundido com o bloco estar quebrado.

         A EXCECAO E `permitir`, e ela e para um caso so: quando o que esta
         sob teste E a conversa com um servico de fora. O calendario do TidyCal
         e esse caso -- so o TidyCal de verdade sabe se a altura acompanha o
         conteudo, e transcrever sinais (o que tidycal-altura.mjs faz, de
         proposito) nao alcanca uma biblioteca que pode mudar amanha. Quem usar
         isto assume o preco: o teste passa a poder falhar por rede, e a falha
         nao teria nada a ver com o bloco. Cada host liberado tem de estar
         escrito no teste, com o motivo. */
      /* `bloquear` e o oposto de `permitir`, e existe porque host nao e
         granularidade suficiente: para medir "o bloco quando o embed.js do
         TidyCal nao carrega" nao serve fechar o host inteiro do CDN deles --
         medido, o proprio calendario tambem e servido de la, e o que se
         mediria seria uma pagina em branco. Cada padrao e um PEDACO de URL. */
      const liberados = permitir.slice(), barrados = bloquear.slice();
      await pg.route('**/*', route => {
        const u = route.request().url();
        for(let i = 0; i < barrados.length; i++)
          if(u.indexOf(barrados[i]) >= 0){ route.abort(); return; }
        let deixaPassar = false;
        try{
          const h = new URL(u).host;
          deixaPassar = (h === origemPropria) || liberados.indexOf(h) >= 0;
        }catch(e){}
        if(deixaPassar) route.continue(); else route.abort();
      });

      if(relogio !== null) await instalarRelogioFalso(pg, relogio);

      await pg.goto('http://' + origemPropria + '/pagina' + (busca || ''), { waitUntil: 'load' });

      const resultado = await medir(pg);
      return Object.assign({}, resultado, { erros });
    } finally {
      await contexto.close();
    }
  } finally {
    await br.close();
    await new Promise(r => srv.close(r));
  }
}

/* GERAR O BLOCO ANTES DE EXECUTA-LO. Abre a propria ferramenta (index.html
   da raiz do repositorio) com armazenamento limpo -- exatamente a garantia
   que `abrir()` da em lib.mjs, e pela mesma razao registrada la: sem limpar
   E recarregar, sobra configuracao da passagem anterior e a medicao passa
   sobre um estado que o operador nunca teria na primeira abertura. `saidas`
   e a lista de ids de textarea a colher (ex.: ['b-out1','b-out2']).
   `opcoes.porta`/`opcoes.raiz` tem default proprio para nao colidir com a
   porta que `comBlocoNaPagina` (ou outro script da bateria) esteja usando
   ao mesmo tempo. */
export async function gerarNaFerramenta(configurar, saidas, opcoes = {}){
  const raiz = opcoes.raiz || RAIZ_REPO;
  const porta = opcoes.porta || 8793;
  const srv = await servir(raiz, porta);
  const br = await navegador();
  try{
    const base = 'http://127.0.0.1:' + porta;
    const pg = await abrir(br, base);
    try{
      await configurar(pg);
      const valores = {};
      for(const id of saidas) valores[id] = (await ler(pg, id)) ?? '';
      return { valores, alertas: await alertas(pg), erros: pg.erros.slice() };
    } finally {
      await pg.close();
    }
  } finally {
    await br.close();
    srv.close();
  }
}

/* A ARMADILHA 1 (ver cabecalho): textContent do body inclui o texto-fonte do
   <script> do proprio bloco. Clona o body, tira os <script> do CLONE (nunca
   do documento real -- apagar do documento real derrubaria o bloco sob
   teste) e so entao le. */
export const textoSemScripts = pg => pg.evaluate(() => {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll('script').forEach(s => s.remove());
  return clone.textContent;
});

/* O CONTADOR, no mesmo espirito visual dos outros scripts deste diretorio:
   uma linha por verificacao, "ok" ou "XX", e um total no final que vira o
   codigo de saida do processo -- 0 quando tudo bateu, senao a contagem de
   falhas (para `set -e` num script .sh parar sozinho). */
let _total = 0, _falhas = 0;
export function chk(rotulo, condicao, extra){
  _total++;
  if(condicao){
    console.log('  ok    ' + rotulo);
  }else{
    _falhas++;
    console.log('  XX    ' + rotulo + (extra ? '  -- ' + extra : ''));
  }
}
export function resumo(){
  if(_falhas === 0){
    console.log('\nTUDO OK  (' + _total + ' verificacoes)');
    return 0;
  }
  console.log('\n' + _falhas + ' FALHA(S) de ' + _total + ' verificacoes.');
  return _falhas;
}
