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

   A SEGUNDA SECAO (03/09/2026) cobre a IDENTIDADE DO CODIGO -- que dois cadastros
   nao possam ser o mesmo cupom para o cliente. Ela existe porque a recusa do cadastro
   e o carrinho entregue faziam perguntas DIFERENTES: o cadastro comparava as cadeias
   cruas com '===', e o bloco casa o que o cliente digita por trim()+toUpperCase(). Um
   codigo gravado com espaco nas pontas ou em minusculas -- o editor em linha nao
   aparava, e backup/preset devolve o que guardou -- entrava como distinto e o carrinho
   o casaria com o outro. Medido na main de 03/09/2026, nas TRES abas.
   O que ela verifica, em cada aba:
     5. o cadastro recusa o codigo IDENTICO;
     6. a edicao em linha APARA -- tela, gravado e codigo gerado dizem o mesmo;
     7. um codigo ja gravado sem normalizar RECUSA o cadastro do equivalente;
     8. e o BLOCO casaria os dois -- o CUPONS emitido do codigo sujo e o mesmo texto
        que o cadastro recusou (e o que amarra a recusa a comparacao do carrinho);
     9. NEGATIVO: editar um cupom sem mexer no codigo nao e recusado, e reescrever o
        codigo com ele mesmo tambem nao (o proprio item e ignorado na comparacao);
    10. a edicao em linha que CRIA duplicata avisa e marca a linha -- sem reverter o
        que o dono digitou, que e dado dele.

   NAO E CODIGO DO SITE. Utilitario de linha de comando, roda em Node.
   Uso:  node scripts/verificar/lista-cupons.mjs  [raiz]
   ============================================================================ */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navegador, servir, abrir, set, clicar, alertas, zerarAlertas } from './lib.mjs';
import { IDENT } from './cenario.mjs';
import { chk, resumo } from './pagina.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(AQUI, '..', '..');
const PORTA = 8817;

/* O minimo que cada aba precisa ter cadastrado para a previa montar o carrinho. Menos que
   isto e a previa cai no quadro de recusa, e a lista CUPONS nem chega a ser emitida. */
const ABAS = [
  {pref:'u', nome:'Checkout',   botao:'aba-uni',  gerar:'u-gerar', preparar: async pg => {
    await set(pg,'u-pnome','Ensaio de Natal'); await set(pg,'u-ppreco','420');
    await clicar(pg,'u-prod-salvar');
  }},
  {pref:'m', nome:'Mini loja',  botao:'aba-loja', gerar:'m-gerar', preparar: async pg => {
    await set(pg,'m-pnome','Album 30x30'); await set(pg,'m-ppreco','890');
    await set(pg,'m-pimg','https://storage.alboom.ninja/album.jpg');
    await clicar(pg,'m-prod-salvar');
  }},
  {pref:'a', nome:'Agendamento por pacote', botao:'aba-pac', gerar:'a-gerar', preparar: async pg => {
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

/* ============================================================================
   SECAO 2 -- A IDENTIDADE DO CODIGO DO CUPOM
   ============================================================================ */

/* A recarga devolve o window.alert original: quem quiser ler alerta depois dela precisa
   re-neutralizar, como abrir() faz. Sem isto o alerta abriria de verdade e travaria o teste. */
const neutralizar = pg => pg.evaluate(() => {
  window.__alertas = [];
  window.alert = m => { window.__alertas.push(String(m)); };
  window.confirm = () => true;
  window.open = () => null;
});

/* O que esta GRAVADO, os codigos na ordem da lista. */
const codigos = (pg, pref) => pg.evaluate(p => {
  const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
  const cps = st[p] && st[p].cps;
  return cps ? cps.map(c => c.codigo) : null;
}, pref);

/* Escreve no ESTADO GRAVADO um codigo fora do padrao e recarrega -- e o que um backup, um
   preset antigo ou o editor em linha de antes de 03/09/2026 deixam para tras. Nao ha como
   chegar nesse estado pela interface de hoje, e e exatamente por isso que ele precisa ser
   testado: a recusa nova tem de valer para o que JA ESTAVA la, e nao so para o que ela
   mesma deixou entrar. */
const sujarGravado = (pg, pref, cod) => pg.evaluate(([p, cod]) => {
  const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
  if (!st[p] || !st[p].cps || !st[p].cps[0]) throw new Error('sem cupom gravado em ' + p);
  st[p].cps[0].codigo = cod;
  localStorage.setItem('fcConstrutores', JSON.stringify(st));
}, [pref, cod]);

/* Edita o campo de codigo de UMA linha da lista disparando os eventos do teclado. 'change'
   e o que significa "terminou de editar E o valor mudou" -- e o unico que avisa. */
const editarCodigo = (pg, pref, linha, valor, comChange) => pg.evaluate(([p, linha, valor, comChange]) => {
  const li = document.querySelectorAll('#' + p + '-cp-lista li')[linha];
  if (!li) throw new Error('a lista de ' + p + ' nao tem a linha ' + linha);
  const el = li.querySelector('input[type=text]');
  el.value = valor;
  el.dispatchEvent(new Event('input', {bubbles:true}));
  if (comChange) el.dispatchEvent(new Event('change', {bubbles:true}));
  el.dispatchEvent(new Event('blur', {bubbles:true}));
  return {tela: el.value, marcado: !!el.style.borderColor};
}, [pref, linha, valor, comChange]);

for (const aba of ABAS) {
  console.log('\n' + aba.nome + ' -- identidade do codigo');
  /* ---------- (5) a (8): a recusa faz a MESMA pergunta que o bloco ---------- */
  let pg = await abrir(browser, 'http://127.0.0.1:' + PORTA);
  for (const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
  await clicar(pg, aba.botao);
  await aba.preparar(pg);
  await set(pg, aba.pref + '-cp-cod', 'NATAL10');
  await set(pg, aba.pref + '-cp-valor', '10');
  await clicar(pg, aba.pref + '-cp-add');
  await espera(200);

  /* (5) codigo IDENTICO */
  await zerarAlertas(pg);
  await set(pg, aba.pref + '-cp-cod', 'NATAL10');
  await set(pg, aba.pref + '-cp-valor', '20');
  await clicar(pg, aba.pref + '-cp-add');
  let al = await alertas(pg), cs = await codigos(pg, aba.pref);
  chk(aba.nome + ': o cadastro RECUSA o codigo identico',
      cs.length === 1 && (al[0] || '').indexOf('Já existe um cupom') === 0, JSON.stringify(cs) + ' | ' + al.join(' | '));

  /* (6) a edicao em linha APARA -- tela e gravado dizem o mesmo que o codigo gerado */
  await zerarAlertas(pg);
  let r = await editarCodigo(pg, aba.pref, 0, '  natal10  ', true);
  await espera(PAUSA_PREVIA);
  cs = await codigos(pg, aba.pref);
  chk(aba.nome + ': a edicao em linha APARA o codigo na tela', r.tela === 'NATAL10', JSON.stringify(r.tela));
  chk(aba.nome + ': a edicao em linha APARA o codigo gravado', cs[0] === 'NATAL10', JSON.stringify(cs));
  chk(aba.nome + ': e a previa emite o mesmo codigo',
      (await previaCupom(pg)).indexOf("codigo:'NATAL10'") >= 0, await previaCupom(pg));

  /* (7) um codigo JA GRAVADO fora do padrao recusa o cadastro do equivalente */
  await sujarGravado(pg, aba.pref, '  natal10  ');
  await pg.reload();
  await espera(400);
  await neutralizar(pg);
  await clicar(pg, aba.botao);
  await espera(200);
  cs = await codigos(pg, aba.pref);
  chk(aba.nome + ': o estado sujo foi mesmo restaurado (a medida vale)',
      cs.length === 1 && cs[0] === '  natal10  ', JSON.stringify(cs));
  await set(pg, aba.pref + '-cp-cod', 'NATAL10');
  await set(pg, aba.pref + '-cp-valor', '30');
  await clicar(pg, aba.pref + '-cp-add');
  al = await alertas(pg); cs = await codigos(pg, aba.pref);
  chk(aba.nome + ': o cadastro RECUSA o equivalente de um codigo ja gravado sem normalizar',
      cs.length === 1 && (al[0] || '').indexOf('Já existe um cupom') === 0,
      JSON.stringify(cs) + ' | ' + al.join(' | '));

  /* (8) e o BLOCO casaria os dois: o codigo sujo vira, no CUPONS entregue, o MESMO texto
     que o cadastro acabou de recusar. E o que amarra a recusa a comparacao do carrinho --
     se ela usasse outra pergunta, deixaria passar justamente este par. */
  await espera(PAUSA_PREVIA);
  const emitido = await previaCupom(pg);
  chk(aba.nome + ': o BLOCO emite "  natal10  " como NATAL10 -- o codigo recusado',
      emitido.indexOf("codigo:'NATAL10'") >= 0, emitido);
  chk(aba.nome + ': sem erro de console (identidade)', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();

  /* ---------- (9) e (10): a edicao em linha ---------- */
  pg = await abrir(browser, 'http://127.0.0.1:' + PORTA);
  for (const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
  await clicar(pg, aba.botao);
  await aba.preparar(pg);
  for (const c of ['NATAL10', 'PASCOA']) {
    await set(pg, aba.pref + '-cp-cod', c);
    await set(pg, aba.pref + '-cp-valor', '10');
    await clicar(pg, aba.pref + '-cp-add');
  }
  await espera(200);
  chk(aba.nome + ': os dois cupons distintos entraram',
      JSON.stringify(await codigos(pg, aba.pref)) === '["NATAL10","PASCOA"]', JSON.stringify(await codigos(pg, aba.pref)));

  /* (9a) editar o VALOR nao e recusado */
  await zerarAlertas(pg);
  await pg.evaluate(p => {
    const el = document.querySelector('#' + p + '-cp-lista li input[type=number]');
    el.value = '77';
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
    el.dispatchEvent(new Event('blur', {bubbles:true}));
  }, aba.pref);
  chk(aba.nome + ': editar o VALOR de um cupom nao e recusado', (await alertas(pg)).length === 0,
      (await alertas(pg)).join(' | '));

  /* (9b) reescrever o codigo COM ELE MESMO nao e recusado -- o proprio item e ignorado */
  await zerarAlertas(pg);
  await editarCodigo(pg, aba.pref, 0, 'NATAL10', true);
  chk(aba.nome + ': reescrever o codigo com ELE MESMO nao e recusado', (await alertas(pg)).length === 0,
      (await alertas(pg)).join(' | '));

  /* (10) editar o codigo de um cupom para bater com OUTRO avisa, marca e MANTEM o valor */
  await zerarAlertas(pg);
  r = await editarCodigo(pg, aba.pref, 1, 'natal10', true);
  al = await alertas(pg);
  chk(aba.nome + ': a edicao em linha que CRIA duplicata avisa',
      al.length === 1 && al[0].indexOf('Agora existem dois cupons') === 0, al.join(' | '));
  chk(aba.nome + ': e marca a linha repetida', r.marcado === true, JSON.stringify(r));
  chk(aba.nome + ': e MANTEM o que o dono digitou (nada e revertido nem apagado)',
      JSON.stringify(await codigos(pg, aba.pref)) === '["NATAL10","NATAL10"]',
      JSON.stringify(await codigos(pg, aba.pref)));

  /* e o Gerar continua recusando enquanto os dois existirem */
  await zerarAlertas(pg);
  await clicar(pg, aba.gerar);
  await espera(300);
  al = await alertas(pg);
  chk(aba.nome + ': e o Gerar recusa enquanto os dois existirem',
      al.some(m => m.indexOf('têm o mesmo código') > 0), al.join(' | '));
  chk(aba.nome + ': sem erro de console (edicao em linha)', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();
}

await browser.close();
servidor.close();
process.exit(resumo());
