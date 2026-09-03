/* ============================================================================
   O EDITOR EM LINHA DA LISTA DE CUPONS -- nas TRES abas que tem cupom
   ============================================================================
   POR QUE ISTO EXISTE. A regressao byte a byte (regressao.sh) compara o TEXTO que
   os geradores produzem, e nunca toca na interface da ferramenta. A lista de cupons
   e interface: os campos de cada linha sao criados por JavaScript, nao tem id nem
   name, e por isso escapam de TODOS os ouvintes delegados que as abas usam
   (`document.addEventListener('input', ...)` filtrando por id/name com o prefixo da
   aba). Um campo dessa lista que esqueca de chamar salvarEstado()/xPreview() nao
   quebra nada, nao acusa erro de console e passa pela regressao com folga.

   FOI O QUE ACONTECEU. Medido em 03/09/2026 na Mini loja: editar o valor de um cupom
   ja cadastrado gravava o novo valor (o evento 'input' sobe ate document, e la ha um
   salvarEstado geral), mas NAO remontava a previa -- o quadro seguia mostrando o
   desconto velho enquanto o codigo gerado ja levava o novo. Numero errado a vista,
   sem erro nenhum. A mesma lista tambem nao mostrava a VALIDADE, que o cadastro
   sempre gravou: cupom que esconde a propria regra e cupom aplicado errado.

   O QUE ESTE ARQUIVO COBRE, nas tres abas (Checkout, Mini loja, Agendamento por
   pacote), para cada um dos CINCO campos da linha (codigo, tipo, valor, validade,
   minimo):
     1. o campo APARECE na linha  -- a irma que esconde um campo e o defeito (c);
     2. editar o campo GRAVA      -- le o localStorage, nao a variavel;
     3. editar o campo REMONTA A PREVIA -- le a lista CUPONS DENTRO do iframe da
        previa, que e onde a divergencia aparecia;
     4. o valor sobrevive a RECARGA.

   NAO E CODIGO DO SITE. Utilitario de linha de comando, roda em Node.
   Uso:  node scripts/verificar/lista-cupons.mjs  [raiz]
   ============================================================================ */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navegador, servir, abrir, set, clicar } from './lib.mjs';
import { IDENT } from './cenario.mjs';
import { chk, resumo } from './pagina.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(AQUI, '..', '..');
const PORTA = 8817;

/* O minimo que cada aba precisa ter cadastrado para a previa montar o carrinho. Menos que
   isto e a previa cai no quadro de recusa, e a lista CUPONS nem chega a ser emitida. */
const ABAS = [
  {pref:'u', nome:'Checkout',   botao:'aba-uni',  preparar: async pg => {
    await set(pg,'u-pnome','Ensaio de Natal'); await set(pg,'u-ppreco','420');
    await clicar(pg,'u-prod-salvar');
  }},
  {pref:'m', nome:'Mini loja',  botao:'aba-loja', preparar: async pg => {
    await set(pg,'m-pnome','Album 30x30'); await set(pg,'m-ppreco','890');
    await set(pg,'m-pimg','https://storage.alboom.ninja/album.jpg');
    await clicar(pg,'m-prod-salvar');
  }},
  {pref:'a', nome:'Agendamento por pacote', botao:'aba-pac', preparar: async pg => {
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-pcod','MINI'); await set(pg,'a-pnome','Mini ensaio');
    await set(pg,'a-pdur','1 hora'); await set(pg,'a-ppreco','420');
    await set(pg,'a-pinclui','10 fotos tratadas'); await set(pg,'a-ppath','fotocerta/mini');
    await clicar(pg,'a-pac-salvar');
  }}
];

/* Os cinco campos da linha, na ordem em que o teste os edita. O SELETOR e por tipo, e nunca
   por posicao: as tres abas colocam os campos em ordens diferentes (a Mini loja poe o tipo
   antes do valor), e um teste por indice mediria o campo errado sem falhar. */
const CAMPOS = [
  {chave:'codigo',   rotulo:'codigo',   sel:'input[type=text]',   valor:'PASCOA',    evento:'input',  espera:'PASCOA'},
  {chave:'tipo',     rotulo:'tipo',     sel:'select',             valor:'fixo',      evento:'change', espera:'fixo'},
  {chave:'valor',    rotulo:'valor',    sel:null,                 valor:'77',        evento:'input',  espera:'77'},
  {chave:'validade', rotulo:'validade', sel:'input[type=date]',   valor:'2028-01-31',evento:'change', espera:'2028-01-31'},
  {chave:'minimo',   rotulo:'minimo',   sel:null,                 valor:'300',       evento:'input',  espera:'300'}
];

const espera = ms => new Promise(r => setTimeout(r, ms));

/* A previa e remontada com debounce de ~400 ms nas tres abas; 1200 ms da folga sem tornar o
   teste lento. Ler cedo demais mediria o quadro anterior e acusaria falha falsa. */
const PAUSA_PREVIA = 1200;

/* O que esta GRAVADO -- localStorage, e nao a variavel da pagina: o que sobrevive a recarga e
   o que o operador tem a perder. */
const gravado = (pg, pref) => pg.evaluate(p => {
  const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
  const cps = st[p] && st[p].cps;
  return cps && cps[0] ? JSON.stringify(cps[0]) : null;
}, pref);

/* O que a PREVIA esta mostrando: a lista CUPONS de dentro do iframe. E o bloco gerado
   rodando, nao o texto da caixa de saida -- e onde a divergencia de 03/09/2026 aparecia. */
const previaCupom = pg => pg.evaluate(() => {
  for (const f of document.querySelectorAll('iframe')) {
    try {
      const h = f.contentDocument.documentElement.innerHTML;
      const m = /CUPONS\s*=\s*\[\s*(\{[\s\S]{0,400}?\})/.exec(h);
      if (m) return m[1].replace(/\s+/g, ' ');
    } catch (e) { /* iframe de outra origem: nao e o da previa */ }
  }
  return '(a previa nao emitiu CUPONS)';
});

/* Edita um campo da PRIMEIRA linha da lista disparando o mesmo evento do teclado. Os campos
   de valor e minimo sao os dois input[type=number] da linha, na ordem em que aparecem --
   valor primeiro, minimo por ultimo, igual nas tres abas. */
const editar = (pg, pref, sel, indiceNum, valor, evento) => pg.evaluate(([pref, sel, indiceNum, valor, evento]) => {
  const li = document.querySelector('#' + pref + '-cp-lista li');
  if (!li) throw new Error('a lista de ' + pref + ' esta vazia');
  const el = sel ? li.querySelector(sel)
                 : li.querySelectorAll('input[type=number]')[indiceNum];
  if (!el) return false;
  el.value = valor;
  el.dispatchEvent(new Event(evento, {bubbles:true}));
  if (evento === 'change') el.dispatchEvent(new Event('blur', {bubbles:true}));
  return true;
}, [pref, sel, indiceNum, valor, evento]);

const servidor = await servir(RAIZ, PORTA);
const browser = await navegador();

for (const aba of ABAS) {
  const pg = await abrir(browser, 'http://127.0.0.1:' + PORTA);
  console.log('\n' + aba.nome);
  if (!(await pg.$('#' + aba.botao))) {
    chk(aba.nome + ': a aba existe nesta arvore', false, 'sem #' + aba.botao);
    await pg.close();
    continue;
  }
  for (const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
  await clicar(pg, aba.botao);
  await aba.preparar(pg);

  /* um cupom com os CINCO campos preenchidos */
  await set(pg, aba.pref + '-cp-cod', 'NATAL10');
  await set(pg, aba.pref + '-cp-valor', '10');
  await set(pg, aba.pref + '-cp-val', '2027-12-25');
  await set(pg, aba.pref + '-cp-min', '200');
  await clicar(pg, aba.pref + '-cp-add');
  await espera(PAUSA_PREVIA);

  /* (c) os cinco campos APARECEM na linha */
  const tipos = await pg.evaluate(p => {
    const li = document.querySelector('#' + p + '-cp-lista li');
    if (!li) return [];
    return Array.from(li.querySelectorAll('.info > input, .info > select'))
      .map(e => e.tagName === 'SELECT' ? 'select' : e.type);
  }, aba.pref);
  for (const t of ['text', 'select', 'number', 'date']) {
    chk(aba.nome + ': a linha mostra o campo ' + t, tipos.indexOf(t) >= 0, tipos.join(','));
  }
  chk(aba.nome + ': a linha mostra os DOIS campos numericos (valor e minimo)',
      tipos.filter(t => t === 'number').length === 2, tipos.join(','));

  /* (b) editar cada campo GRAVA e REMONTA A PREVIA */
  let numero = 0;
  for (const c of CAMPOS) {
    const indiceNum = c.sel ? -1 : (numero++);
    const achou = await editar(pg, aba.pref, c.sel, indiceNum, c.valor, c.evento);
    if (!achou) { chk(aba.nome + ': o campo ' + c.rotulo + ' existe na linha', false); continue; }
    await espera(PAUSA_PREVIA);
    const st = await gravado(pg, aba.pref);
    chk(aba.nome + ': editar ' + c.rotulo + ' na lista GRAVA',
        !!st && JSON.parse(st)[c.chave] == c.espera, c.rotulo + ' -> ' + st);
    const pv = await previaCupom(pg);
    chk(aba.nome + ': editar ' + c.rotulo + ' na lista REMONTA A PREVIA',
        pv.indexOf(String(c.espera)) >= 0, c.rotulo + ' -> previa: ' + pv);
  }

  /* e o que foi gravado sobrevive a recarga */
  const antes = await gravado(pg, aba.pref);
  await pg.reload();
  await espera(400);
  const depois = await gravado(pg, aba.pref);
  chk(aba.nome + ': o cupom editado sobrevive a recarga', antes === depois,
      'antes: ' + antes + ' | depois: ' + depois);
  chk(aba.nome + ': sem erro de console', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();
}

await browser.close();
servidor.close();
process.exit(resumo());
