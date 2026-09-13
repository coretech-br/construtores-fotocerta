/* ============================================================================
   O NUMERO DE DINHEIRO NAO QUEBRA AO MEIO (13/09/2026)
   ============================================================================
   O DEFEITO, relatado pelo dono com dois prints: no carrinho do Checkout, a
   linha do Pix saia com o rotulo em duas linhas E o valor partido -- "R$" numa
   linha e "332,50" na outra. Ele encurtou o texto de fabrica por conta propria e
   NAO resolveu, o que ja dizia onde estava a causa: quem quebrava era o VALOR, e
   rotulo menor nao muda isso.

   ONDE ACONTECE: tela estreita. Ele reportou no celular, e os prints vieram da
   previa, que e uma coluna estreita dentro da ferramenta. Por isso TODA medicao
   deste arquivo e feita a 375 CSS px -- a largura do iPhone que ele usa. Medir
   num quadro largo seria a armadilha ja registrada neste projeto: pergunta
   errada, resposta correta, defeito de pe.

   A CAUSA: as linhas "rotulo a esquerda, valor a direita" sao flex com dois
   <span> e nenhuma regra dizendo quem cede. Item de flex tem min-width:auto, e
   os dois disputam a largura ate os dois quebrarem.

   A REGRA, em fcLinhaValorCss: o valor nunca quebra e nunca encolhe
   (white-space:nowrap + flex:none); o rotulo pode encolher (min-width:0) e, se
   precisar, quebra em duas linhas. Rotulo em duas linhas e legivel; numero
   partido nao e.

   O QUE ESTE ARQUIVO MEDE: a altura de cada <span> do valor, comparada com a
   altura de UMA linha daquela fonte. Duas linhas = quebrou. E a unica medida que
   responde a pergunta do dono; contar caracteres ou ler o CSS nao responde.

   Uso:  node scripts/verificar/linha-de-dinheiro.mjs
   ============================================================================ */
import { gerarNaFerramenta, comBlocoNaPagina, chk, resumo } from './pagina.mjs';
import { preparar, conteudo, gerarTodas } from './cenario.mjs';
import { set } from './lib.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const LARGURA = 375;   /* iPhone XS, o aparelho do dono */

/* Um rotulo LONGO de proposito em todas as linhas: o defeito so aparece quando o
   rotulo disputa a largura com o valor. Rotulo curto esconderia a regressao. */
const ROTULO = 'Pagando no Pix com desconto de ({pct}%)';

const blocos = await gerarNaFerramenta(async pg => {
  await preparar(pg); await conteudo(pg);
  /* O rotulo LONGO e o que cria a disputa por largura. O preco vem do cenario -- nao
     se mexe nele aqui: o cenario e a fonte unica do que as suites geram. */
  await set(pg,'u-descpix','5');
  await set(pg,'u-txt-pix-rotulo',ROTULO);
  await set(pg,'m-descpix','5');
  await set(pg,'m-txt-pix-rotulo',ROTULO);
  return await gerarTodas(pg);
}, ['u-out','m-out'], {porta: 8981}).then(r => r.valores);

/* ===== a medicao: a altura do valor contra a altura de uma linha =====
   O bloco e JS que MONTA o DOM ao rodar -- escrever innerHTML nao o executa. Por
   isso vai pelo molde da casa (comBlocoNaPagina), que o serve numa pagina de
   verdade com a rede externa bloqueada. A largura vem do viewport, nao de um
   wrapper: media query e layout leem o viewport, e um wrapper estreito dentro de
   uma janela larga mediria outra coisa. */
async function medir(bloco, escopo, linhas, porta){
  return await comBlocoNaPagina({
    bloco, porta,
    medir: async pg => {
      await pg.setViewportSize({width: LARGURA, height: 900});
      await pg.waitForTimeout(400);
      /* O carrinho nasce VAZIO: sem item escolhido nao existe linha de total nem de Pix, e
         medir um carrinho vazio responderia a pergunta errada. Clica no LABEL e nao no input,
         porque o marcador de selecao e desenhado (Manual do Prosite). */
      if(escopo === '.fcuni'){
        await pg.click('label:has(input[name="fcu-prod"][value="0"])');
      }else{
        /* O cartao abre primeiro; so entao existe o botao de adicionar. Mesmo caminho de
           sinal.mjs, e pelo mesmo motivo: a loja e uma vitrine, nao uma lista de marcar. */
        await pg.locator('.fcm-card').first().click();
        await pg.waitForTimeout(120);
        await pg.click('.fcm-add');
      }
      await pg.waitForTimeout(250);
      return await pg.evaluate(args => {
        const [esc, cls] = args, out = {};
        cls.forEach(c => {
          const el = document.querySelector((esc?esc+' ':'')+'.'+c);
          if(!el){ out[c] = null; return; }
          const v = el.children[el.children.length-1];
          if(!v){ out[c] = null; return; }
          /* MEDIR A ALTURA DA CAIXA NAO RESPONDE A PERGUNTA -- e foi o primeiro erro deste
             arquivo. Item de flex estica por padrao (align-items:stretch), entao a caixa do
             valor fica com a altura da LINHA INTEIRA quando o rotulo quebra em duas, mesmo
             com o texto do valor inteiro numa linha so. A altura dizia "quebrou" sobre um
             valor que nao tinha quebrado.
             A medida certa e quantos FRAGMENTOS DE LINHA o texto ocupa: um Range sobre o
             conteudo devolve um retangulo por linha. Dois retangulos = o numero partiu. */
          const r = document.createRange();
          r.selectNodeContents(v);
          const fragmentos = r.getClientRects().length;
          return out[c] = { fragmentos, texto: v.textContent.trim(),
                            transbordou: el.scrollWidth > el.clientWidth + 1 };
        });
        return out;
      }, [escopo, linhas]);
    }
  });
}

console.log('medindo a '+LARGURA+'px -- a largura do aparelho do dono\n');

for(const alvo of [
  {nome:'Checkout',  saida:'u-out', escopo:'.fcuni',   linhas:['fcu-total','fcu-pixlinha'], porta:8983},
  {nome:'Mini loja', saida:'m-out', escopo:'.fcmloja', linhas:['fcm-total','fcm-pixlinha'], porta:8984}
]){
  const m = await medir(blocos[alvo.saida], alvo.escopo, alvo.linhas, alvo.porta);
  for(const c of alvo.linhas){
    const d = m[c];
    chk(alvo.nome+' / '+c+': a linha existe no bloco', !!d, 'nao achei o elemento');
    if(!d) continue;
    chk(alvo.nome+' / '+c+': o VALOR cabe em UMA linha ("'+d.texto+'")',
        d.fragmentos === 1, 'o texto ocupou '+d.fragmentos+' fragmentos de linha');
    chk(alvo.nome+' / '+c+': a linha nao transborda a caixa',
        d.transbordou === false, 'scrollWidth maior que clientWidth');
  }
}

/* ===========================================================================
   A PROVA DO CONTRARIO -- sem ela, os doze "ok" acima nao valem nada
   ===========================================================================
   Um teste que passa nao prova que pega o defeito: ele pode estar medindo a
   coisa errada e passar sempre. Este arquivo ja errou uma vez exatamente assim
   (media a ALTURA DA CAIXA, que estica por conta do flex, e acusava quebra onde
   nao havia). A unica forma de saber que ele tem dentes e aponta-lo para a
   versao que TEM o defeito -- a que o dono fotografou -- e exigir que falhe.
   =========================================================================== */
console.log('\n=== a prova do contrario: a versao SEM o conserto QUEBRA o numero ===');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-linha-'));
process.on('exit', () => { try{ fs.rmSync(tmp, {recursive:true, force:true}); }catch(e){} });
const REF = process.argv[2] || 'main';
console.log('referencia (o lado "antes"): ' + REF);
execFileSync('/bin/sh', ['-c',
  'git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(tmp)]);

const antes = await gerarNaFerramenta(async pg => {
  await preparar(pg); await conteudo(pg);
  await set(pg,'u-descpix','5');
  await set(pg,'u-txt-pix-rotulo',ROTULO);
  return await gerarTodas(pg);
}, ['u-out'], {porta: 8985, raiz: tmp}).then(r => r.valores);

/* A REFERENCIA JA TEM O CONSERTO? Decidido antes de medir.
   Este arquivo nasceu em 13/09/2026 com 'main' como o lado "antes" -- e no MESMO dia a rodada foi
   mesclada, entao o "antes" passou a medir a si mesmo e a prova do contrario falhava sem defeito
   nenhum por tras. E a SEXTA vez que o arnes tropeca nisto (id-orcamento, textos-reserva,
   meio-prio-migracao, sinal-cobranca, a parte 4 de meio-prio-migracao, e esta) -- e a segunda que
   eu mesmo escrevo o tropeco depois de ja ter consertado os outros.
   A regra da casa, escrita mais uma vez para quem vier: "antes" e estado historico, nao "o que
   estiver em main hoje". Toda comparacao com referencia se prende a um commit E detecta quando a
   referencia deixou de servir, dizendo NAO MEDIU em vez de falhar. */
const refTemConserto = fs.readFileSync(path.join(tmp,'index.html'),'utf8').indexOf('fcLinhaValorCss') >= 0;
if(refTemConserto){
  console.log('  -- NAO MEDIU: a referencia ja tem o conserto.');
  console.log('     Para medir de verdade: node scripts/verificar/linha-de-dinheiro.mjs 6e0a3e8');
}else{
  const mAntes = await medir(antes['u-out'], '.fcuni', ['fcu-pixlinha'], 8986);
  const dA = mAntes['fcu-pixlinha'];
  chk('a versao SEM o conserto parte o numero em duas linhas (o defeito do print)',
      !!dA && dA.fragmentos > 1,
      dA ? ('fragmentos='+dA.fragmentos+' texto="'+dA.texto+'"') : 'nao achei a linha');
}

resumo();
