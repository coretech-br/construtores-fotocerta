/* ============================================================================
   DUPLICAR PACOTE E DUPLICAR OPCIONAL -- e o que NUNCA pode ser sobrescrito
   ============================================================================
   POR QUE ISTO EXISTE. O botao de duplicar (03/09/2026, pedido do dono) carrega uma
   COPIA do pacote no formulario "Cadastrar pacote". O formulario dessa aba tem um
   estado que SOBREVIVE A RECARGA -- `aEditIdx` (qual pacote esta em edicao) e
   `aEditOps` (os opcionais digitados) --, e um caminho que deixe `aEditIdx` apontando
   para o pacote de ORIGEM transforma o clique seguinte em "Salvar alterações": a copia
   e gravada POR CIMA do original, sem erro de console, sem alerta e sem nada na tela
   dizendo que um pacote deixou de existir. Foi exatamente esse o defeito corrigido em
   03/09/2026 no caminho do preset (fcPresetZerarForm); duplicar e uma porta nova para
   ele, e este arquivo e a fechadura.

   A REGRESSAO BYTE A BYTE NAO ALCANCA NADA DISTO. Ela compara o texto que os geradores
   produzem, e duplicar e interface: o catalogo pode perder um pacote inteiro sem que
   uma linha do bloco gerado mude de forma -- ela muda de CONTEUDO, que e o que ninguem
   percebe olhando um diff de 24 mil bytes.

   O QUE ELE COBRE (aba Agendamento por pacote):
     1. DUPLICAR COM OPCIONAIS -- o formulario vem completo (os sete campos e os
        opcionais, com a marca "vende por quantidade" de cada um), em modo CRIAR
        ("Adicionar pacote", editidx = -1), e salvar cria um SEGUNDO pacote sem tocar
        no original. O original e comparado campo a campo, antes e depois.
     2. DUPLICAR ENQUANTO EDITA OUTRO PACOTE -- o formulario troca para a copia em modo
        criar, e o pacote que estava sendo editado fica intacto depois do salvamento.
     3. DUPLICAR E RECARREGAR SEM SALVAR -- o estado persistido devolve a copia ainda em
        modo criar; o catalogo continua com os pacotes que tinha.
     4. DUPLICAR UM OPCIONAL -- a copia entra LOGO ABAIXO da original, com preco e
        "vende por quantidade" iguais e o nome marcado, e salvar grava as duas.
     5. A RECUSA DE CODIGO REPETIDO -- no cadastro (nova) e na geracao (a que ja
        existia), inclusive o caso que so o Pix enxerga ("MINI-1H" x "MINI1H"), e o
        negativo que importa: salvar um pacote em EDICAO sem mexer no codigo dele nao
        pode ser recusado por colidir consigo mesmo.
     6. O ARRANJO DOS BOTOES -- a faixa fica ABAIXO do item, com os cinco botoes, e o
        simbolo do duplicar nao e um retangulo vazio na fonte do sistema.
     7. O AVISO DE OPCIONAIS PENDENTES cita o rotulo do botao que esta na tela -- o
        defeito de ordem achado nesta rodada (fcOpPendente lia o rotulo ANTES da troca).

   NAO E CODIGO DO SITE. Utilitario de linha de comando, roda em Node.
   Uso:  node scripts/verificar/duplicar-itens.mjs  [raiz]
   (a raiz aponta outra arvore -- por exemplo um `git worktree` da `main` -- para ver os
   casos falharem la. Cada caso corre dentro de um try proprio: numa arvore que ainda nao
   tem o botao de duplicar, o caso ACUSA e o roteiro segue, em vez de o primeiro clique
   derrubar os outros seis e esconder o que eles tinham a dizer -- foi assim que o caso 7,
   que e um defeito da propria `main`, pode ser visto falhando la.)
   ============================================================================ */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navegador, servir, abrir, set, clicar, alertas, zerarAlertas } from './lib.mjs';
import { IDENT } from './cenario.mjs';
import { chk, resumo } from './pagina.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(AQUI, '..', '..');
const PORTA = 8823;

const espera = ms => new Promise(r => setTimeout(r, ms));
/* A aba remonta a previa com debounce de ~400 ms. Ler o localStorage no meio de um
   debounce ja produziu falso negativo neste projeto. */
const PAUSA = 900;

/* ---------- o que esta GRAVADO (localStorage), nao a variavel da pagina ---------- */
const gravado = pg => pg.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
  const o = st.a || {};
  return {
    pacotes: o.pacotes || [],
    edops: o.edops || [],
    editidx: (typeof o.editidx === 'number') ? o.editidx : null
  };
});

/* ---------- o que a TELA diz ---------- */
const tela = pg => pg.evaluate(() => {
  const g = id => document.getElementById(id);
  const v = id => (g(id) ? g(id).value : null);
  const cp = g('a-pac-copia');
  const pd = g('a-op-pendente');
  return {
    cod: v('a-pcod'), nome: v('a-pnome'), dur: v('a-pdur'), preco: v('a-ppreco'),
    inclui: v('a-pinclui'), path: v('a-ppath'), fam: v('a-pfam'),
    botao: g('a-pac-salvar') ? g('a-pac-salvar').textContent : null,
    cancelar: g('a-pac-cancelar') ? g('a-pac-cancelar').textContent : null,
    cancelarVisivel: !!(g('a-pac-cancelar') && g('a-pac-cancelar').style.display !== 'none'),
    copiaVisivel: !!(cp && cp.style.display !== 'none'),
    copiaTexto: cp ? cp.textContent : '',
    pendenteVisivel: !!(pd && pd.style.display !== 'none'),
    pendenteTexto: pd ? pd.textContent : ''
  };
});

/* Os opcionais como a LISTA DA TELA os mostra -- nome, preco e a caixa "vende por
   quantidade" --, e nao como a variavel os guarda: e o que o dono ve antes de salvar. */
const opsNaTela = pg => pg.evaluate(() => {
  const lis = document.querySelectorAll('#a-op-lista li');
  return Array.prototype.map.call(lis, li => {
    const t = li.querySelector('input[type=text]');
    const n = li.querySelector('input[type=number]');
    const c = li.querySelector('input[type=checkbox]');
    return { nome: t ? t.value : null, preco: n ? n.value : null, qtd: !!(c && c.checked) };
  });
});

/* Clica um botao da linha `i` de uma lista, escolhido pelo TITULO. Por titulo e nao por
   posicao: a faixa mudou de ordem nesta rodada, e um seletor por indice mediria o botao
   errado sem falhar. */
const botaoDaLinha = (pg, lista, titulo, i) => pg.evaluate(([lista, titulo, i]) => {
  const bs = document.querySelectorAll('#' + lista + ' button[title="' + titulo + '"]');
  if (!bs[i]) throw new Error('sem botao "' + titulo + '" na linha ' + i + ' de ' + lista);
  bs[i].click();
  return true;
}, [lista, titulo, i]);

/* Compara um pacote gravado campo a campo, inclusive os opcionais. E o que responde
   "o original foi tocado?" sem depender de olhar a tela. */
const foto = p => JSON.stringify({
  cod: p.cod, nome: p.nome, dur: p.dur, preco: p.preco, inclui: p.inclui,
  cal: p.cal, fam: p.fam,
  ops: (p.ops || []).map(o => [o.nome, o.preco, !!o.qtd])
});

const URLOK = 'https://www.fotocerta.com.br/obrigado';

async function novoPacote(pg, cod, nome, preco) {
  await set(pg, 'a-pcod', cod);
  await set(pg, 'a-pnome', nome);
  await set(pg, 'a-pdur', '1 hora');
  await set(pg, 'a-ppreco', preco);
  await set(pg, 'a-pinclui', '10 fotos tratadas');
  await set(pg, 'a-ppath', 'fotocerta/' + cod.toLowerCase());
  await clicar(pg, 'a-pac-salvar');
}
async function novoOpcional(pg, nome, preco, qtd) {
  await set(pg, 'a-op-nome', nome);
  await set(pg, 'a-op-preco', preco);
  await pg.evaluate(q => {
    const el = document.getElementById('a-op-qtd');
    el.checked = !!q;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, !!qtd);
  await clicar(pg, 'a-op-add');
}

/* O cenario: dois pacotes, o primeiro com dois opcionais (um deles "vende por
   quantidade"). O que se duplica e sempre o primeiro. */
async function cenario(pg) {
  for (const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
  await clicar(pg, 'aba-pac');
  await set(pg, 'a-urlobrigado', URLOK);
  await novoOpcional(pg, 'Album impresso', '300', true);
  await novoOpcional(pg, 'Making of', '150', false);
  await novoPacote(pg, 'E905-DU-1H', 'Ensaio 1 hora', '420');
  await novoPacote(pg, 'E905-DU-2H', 'Ensaio 2 horas', '760');
  await espera(PAUSA);
}

const servidor = await servir(RAIZ, PORTA);
const browser = await navegador();
console.log('arvore sob teste: ' + RAIZ);
const base = 'http://127.0.0.1:' + PORTA;

/* =====================================================================
   1. DUPLICAR UM PACOTE COM OPCIONAIS
   ===================================================================== */
try {
  console.log('\n1. duplicar um pacote com opcionais');
  const pg = await abrir(browser, base);
  await cenario(pg);

  const antes = await gravado(pg);
  chk('o cenario montou dois pacotes', antes.pacotes.length === 2, antes.pacotes.length);
  const fotoOriginal = foto(antes.pacotes[0]);
  chk('o pacote original tem os dois opcionais, um com quantidade',
    (antes.pacotes[0].ops || []).length === 2 && antes.pacotes[0].ops[0].qtd === true && antes.pacotes[0].ops[1].qtd === false,
    JSON.stringify(antes.pacotes[0].ops));

  await botaoDaLinha(pg, 'a-pac-lista', 'Duplicar este pacote', 0);
  await espera(PAUSA);
  const t = await tela(pg);
  const g = await gravado(pg);

  chk('o formulario ficou em MODO CRIAR (rotulo do botao)', t.botao === 'Adicionar pacote', t.botao);
  chk('editidx voltou a -1 NO QUE ESTA GRAVADO', g.editidx === -1, g.editidx);
  chk('o catalogo NAO ganhou item nenhum ao duplicar', g.pacotes.length === 2, g.pacotes.length);
  chk('o codigo veio derivado e nao colide', t.cod === 'E905-DU-1H-COPIA', t.cod);
  chk('o nome veio marcado como copia', t.nome === 'Ensaio 1 hora (cópia)', t.nome);
  chk('a duracao veio junto', t.dur === '1 hora', t.dur);
  chk('o preco veio junto', String(t.preco) === '420', t.preco);
  chk('o que inclui veio junto', t.inclui === '10 fotos tratadas', t.inclui);
  chk('o endereco do TidyCal veio junto', t.path === 'https://tidycal.com/fotocerta/e905-du-1h', t.path);
  chk('o aviso de copia aparece e nomeia o pacote de origem',
    t.copiaVisivel && t.copiaTexto.indexOf('Ensaio 1 hora') > 0 && t.copiaTexto.indexOf('E905-DU-1H') > 0, t.copiaTexto);
  chk('o botao de cancelar aparece dizendo que descarta a copia',
    t.cancelarVisivel && t.cancelar === 'Descartar cópia', t.cancelar + ' / ' + t.cancelarVisivel);

  const ops = await opsNaTela(pg);
  chk('os dois opcionais vieram para o formulario', ops.length === 2, JSON.stringify(ops));
  chk('o primeiro opcional manteve nome, preco e "vende por quantidade"',
    ops[0] && ops[0].nome === 'Album impresso' && String(ops[0].preco) === '300' && ops[0].qtd === true, JSON.stringify(ops[0]));
  chk('o segundo opcional manteve nome, preco e a AUSENCIA de quantidade',
    ops[1] && ops[1].nome === 'Making of' && String(ops[1].preco) === '150' && ops[1].qtd === false, JSON.stringify(ops[1]));
  chk('o buffer gravado tem os dois opcionais da copia', g.edops.length === 2, JSON.stringify(g.edops));

  /* salvar: e aqui que a main sobrescreveria, se o modo fosse "editar" */
  await clicar(pg, 'a-pac-salvar');
  await espera(PAUSA);
  const dep = await gravado(pg);
  chk('salvar criou um TERCEIRO pacote', dep.pacotes.length === 3, dep.pacotes.length);
  chk('O PACOTE ORIGINAL NAO FOI ALTERADO (campo a campo, com os opcionais)',
    foto(dep.pacotes[0]) === fotoOriginal, foto(dep.pacotes[0]) + ' != ' + fotoOriginal);
  chk('o segundo pacote do cenario continua intacto', dep.pacotes[1].cod === 'E905-DU-2H', dep.pacotes[1].cod);
  chk('a copia entrou com o codigo derivado', dep.pacotes[2].cod === 'E905-DU-1H-COPIA', dep.pacotes[2].cod);
  chk('a copia levou os dois opcionais, com a marca de quantidade',
    JSON.stringify((dep.pacotes[2].ops || []).map(o => [o.nome, o.preco, !!o.qtd])) ===
    JSON.stringify((dep.pacotes[0].ops || []).map(o => [o.nome, o.preco, !!o.qtd])),
    JSON.stringify(dep.pacotes[2].ops));
  chk('o formulario voltou a zero depois de salvar', (await tela(pg)).cod === '', (await tela(pg)).cod);
  chk('o aviso de copia sumiu depois de salvar', !(await tela(pg)).copiaVisivel);

  chk('sem erro de console', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   2. DUPLICAR ENQUANTO EDITA OUTRO PACOTE
   ===================================================================== */
try {
  console.log('\n2. duplicar enquanto edita outro pacote');
  const pg = await abrir(browser, base);
  await cenario(pg);
  const antes = await gravado(pg);
  const fotoBeta = foto(antes.pacotes[1]);

  /* abre o SEGUNDO pacote no lapis: o formulario fica em modo editar, apontando para 1 */
  await botaoDaLinha(pg, 'a-pac-lista', 'Editar', 1);
  await espera(PAUSA);
  let g = await gravado(pg);
  let t = await tela(pg);
  chk('o cenario de risco esta montado: editando o pacote de indice 1',
    g.editidx === 1 && t.botao === 'Salvar alterações', g.editidx + ' / ' + t.botao);

  /* e agora duplica o PRIMEIRO */
  await botaoDaLinha(pg, 'a-pac-lista', 'Duplicar este pacote', 0);
  await espera(PAUSA);
  g = await gravado(pg);
  t = await tela(pg);
  chk('duplicar TIROU o formulario do modo edicao', t.botao === 'Adicionar pacote', t.botao);
  chk('editidx deixou de apontar para o pacote que estava em edicao', g.editidx === -1, g.editidx);
  chk('o formulario passou a mostrar a copia', t.cod === 'E905-DU-1H-COPIA', t.cod);

  await clicar(pg, 'a-pac-salvar');
  await espera(PAUSA);
  const dep = await gravado(pg);
  chk('salvar acrescentou, e nao sobrescreveu', dep.pacotes.length === 3, dep.pacotes.length);
  chk('O PACOTE QUE ESTAVA SENDO EDITADO FICOU INTACTO', foto(dep.pacotes[1]) === fotoBeta,
    foto(dep.pacotes[1]) + ' != ' + fotoBeta);
  chk('o pacote de origem tambem ficou intacto', foto(dep.pacotes[0]) === foto(antes.pacotes[0]));
  chk('sem erro de console', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   3. DUPLICAR E RECARREGAR SEM SALVAR
   ===================================================================== */
try {
  console.log('\n3. duplicar e recarregar sem salvar');
  const pg = await abrir(browser, base);
  await cenario(pg);
  const antes = await gravado(pg);

  await botaoDaLinha(pg, 'a-pac-lista', 'Duplicar este pacote', 0);
  await espera(PAUSA);

  await pg.reload();
  await pg.evaluate(() => { window.__alertas = []; window.alert = m => window.__alertas.push(String(m)); });
  await clicar(pg, 'aba-pac');
  await espera(PAUSA);
  const g = await gravado(pg);
  const t = await tela(pg);
  chk('depois da recarga o formulario continua em MODO CRIAR', t.botao === 'Adicionar pacote', t.botao);
  chk('depois da recarga editidx continua -1 (nao virou edicao do original)', g.editidx === -1, g.editidx);
  chk('o catalogo continua com os dois pacotes do cenario', g.pacotes.length === 2, g.pacotes.length);
  chk('o pacote de origem continua intacto', foto(g.pacotes[0]) === foto(antes.pacotes[0]));
  const ops = await opsNaTela(pg);
  chk('os opcionais da copia voltaram da recarga', ops.length === 2, JSON.stringify(ops));
  chk('e o aviso diz que eles nao estao salvos em pacote nenhum',
    t.pendenteVisivel && t.pendenteTexto.indexOf('pacote nenhum') > 0, t.pendenteTexto);
  chk('o aviso manda apertar o botao que ESTA na tela',
    t.pendenteTexto.indexOf(t.botao) > 0, t.botao + ' / ' + t.pendenteTexto);
  chk('sem erro de console', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   4. DUPLICAR UM OPCIONAL
   ===================================================================== */
try {
  console.log('\n4. duplicar um item opcional');
  const pg = await abrir(browser, base);
  await cenario(pg);

  await botaoDaLinha(pg, 'a-pac-lista', 'Editar', 0);
  await espera(PAUSA);
  await botaoDaLinha(pg, 'a-op-lista', 'Duplicar este opcional', 0);
  await espera(PAUSA);

  const ops = await opsNaTela(pg);
  chk('a lista de opcionais passou de dois para tres', ops.length === 3, JSON.stringify(ops));
  chk('a copia entrou LOGO ABAIXO da original', ops[1] && ops[1].nome === 'Album impresso (cópia)', JSON.stringify(ops[1]));
  chk('a copia manteve o preco', ops[1] && String(ops[1].preco) === '300', ops[1] && ops[1].preco);
  chk('a copia manteve "vende por quantidade"', ops[1] && ops[1].qtd === true, ops[1] && ops[1].qtd);
  chk('a original ficou onde estava, sem marca', ops[0] && ops[0].nome === 'Album impresso', JSON.stringify(ops[0]));
  chk('o opcional que vinha depois nao se moveu para o lugar errado',
    ops[2] && ops[2].nome === 'Making of', JSON.stringify(ops[2]));

  await clicar(pg, 'a-pac-salvar');
  await espera(PAUSA);
  const g = await gravado(pg);
  chk('salvar gravou os tres opcionais no pacote', (g.pacotes[0].ops || []).length === 3,
    JSON.stringify(g.pacotes[0].ops));
  chk('e nao criou pacote nenhum', g.pacotes.length === 2, g.pacotes.length);
  chk('a copia gravada tem preco e quantidade iguais aos da original',
    g.pacotes[0].ops[1].preco === g.pacotes[0].ops[0].preco && g.pacotes[0].ops[1].qtd === true,
    JSON.stringify(g.pacotes[0].ops[1]));

  /* duplicar a COPIA numera, em vez de empilhar "(cópia) (cópia)" */
  await botaoDaLinha(pg, 'a-pac-lista', 'Editar', 0);
  await espera(PAUSA);
  await botaoDaLinha(pg, 'a-op-lista', 'Duplicar este opcional', 1);
  await espera(PAUSA);
  const ops2 = await opsNaTela(pg);
  chk('duplicar a copia numera a marca em vez de empilha-la',
    ops2[2] && ops2[2].nome === 'Album impresso (cópia 2)', JSON.stringify(ops2[2]));

  chk('sem erro de console', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   5. A RECUSA DE CODIGO REPETIDO
   ===================================================================== */
try {
  console.log('\n5. a recusa de codigo repetido');
  const pg = await abrir(browser, base);
  await cenario(pg);

  /* 5a. no CADASTRO: codigo identico ao de um pacote que ja existe */
  await zerarAlertas(pg);
  await set(pg, 'a-pcod', 'E905-DU-2H');
  await set(pg, 'a-pnome', 'Tentativa');
  await set(pg, 'a-ppreco', '500');
  await set(pg, 'a-ppath', 'fotocerta/tentativa');
  await clicar(pg, 'a-pac-salvar');
  await espera(PAUSA);
  let al = await alertas(pg);
  let g = await gravado(pg);
  chk('cadastrar com codigo ja usado e RECUSADO', al.length === 1 && al[0].indexOf('E905-DU-2H') > 0, JSON.stringify(al));
  chk('e o catalogo nao ganhou o pacote recusado', g.pacotes.length === 2, g.pacotes.length);

  /* 5b. o caso que so o Pix enxerga: mesmo codigo sem o hifen */
  await zerarAlertas(pg);
  await set(pg, 'a-pcod', 'E905DU2H');
  await clicar(pg, 'a-pac-salvar');
  await espera(PAUSA);
  al = await alertas(pg);
  g = await gravado(pg);
  chk('codigo que so difere no hifen tambem e recusado (mesmo identificador no Pix)',
    al.length === 1 && al[0].indexOf('E905DU2H') > 0, JSON.stringify(al));
  chk('e ele tambem nao entrou no catalogo', g.pacotes.length === 2, g.pacotes.length);

  /* 5c. um codigo livre passa */
  await zerarAlertas(pg);
  await set(pg, 'a-pcod', 'E905-DU-3H');
  await clicar(pg, 'a-pac-salvar');
  await espera(PAUSA);
  al = await alertas(pg);
  g = await gravado(pg);
  chk('codigo livre continua entrando sem alerta', al.length === 0 && g.pacotes.length === 3,
    JSON.stringify(al) + ' / ' + g.pacotes.length);

  /* 5d. O NEGATIVO QUE IMPORTA: editar um pacote e salvar SEM mexer no codigo dele nao
         pode ser recusado por colidir consigo mesmo. */
  await zerarAlertas(pg);
  await botaoDaLinha(pg, 'a-pac-lista', 'Editar', 0);
  await espera(PAUSA);
  await set(pg, 'a-ppreco', '450');
  await clicar(pg, 'a-pac-salvar');
  await espera(PAUSA);
  al = await alertas(pg);
  g = await gravado(pg);
  chk('salvar uma EDICAO sem trocar o codigo nao e recusado', al.length === 0, JSON.stringify(al));
  chk('e a edicao valeu (preco novo gravado, catalogo do mesmo tamanho)',
    g.pacotes.length === 3 && String(g.pacotes[0].preco) === '450', g.pacotes.length + ' / ' + g.pacotes[0].preco);

  /* 5e. a recusa da GERACAO continua de pe. Aqui a colisao chega pelo caminho que o
         cadastro nao cobre e que aRecusa existe para pegar: um ESTADO GRAVADO com dois
         codigos colididos -- o que um arquivo de "Exportar tudo" de outra origem, ou uma
         versao anterior da ferramenta, pode trazer. Escrito direto no localStorage e
         recarregado, porque o script da ferramenta roda dentro de uma IIFE e nada dele e
         alcancavel de fora. */
  await pg.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
    st.a.pacotes[2].cod = 'E905DU1H';
    localStorage.setItem('fcConstrutores', JSON.stringify(st));
  });
  await pg.reload();
  await pg.evaluate(() => { window.__alertas = []; window.alert = m => window.__alertas.push(String(m)); });
  await clicar(pg, 'aba-pac');
  await espera(PAUSA);
  await zerarAlertas(pg);
  await clicar(pg, 'a-gerar');
  await espera(PAUSA);
  al = await alertas(pg);
  chk('a recusa da geracao continua barrando o codigo colidido vindo do estado gravado',
    al.length === 1 && al[0].indexOf('Pix') > 0, JSON.stringify(al));
  chk('e nada foi gerado', (await pg.evaluate(() => document.getElementById('a-out1').value)) === '');

  chk('sem erro de console', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   6. O ARRANJO DOS BOTOES
   ===================================================================== */
try {
  console.log('\n6. os botoes abaixo do item');
  const pg = await abrir(browser, base);
  await cenario(pg);
  await botaoDaLinha(pg, 'a-pac-lista', 'Editar', 0);
  await espera(PAUSA);

  const med = await pg.evaluate(() => {
    function medir(seletor) {
      const li = document.querySelector(seletor + ' li');
      const ctrl = li.querySelector('.ctrl');
      const info = li.querySelector('.info');
      const rc = ctrl.getBoundingClientRect(), ri = info.getBoundingClientRect(), rl = li.getBoundingClientRect();
      return {
        abaixoNaClasse: li.className.indexOf('acoes-abaixo') >= 0 && ctrl.className.indexOf('abaixo') >= 0,
        botoes: ctrl.querySelectorAll('button').length,
        titulos: Array.prototype.map.call(ctrl.querySelectorAll('button'), b => b.title),
        abaixoNaTela: rc.top >= ri.bottom - 1,
        larguraQuaseCheia: rc.width > rl.width * 0.85,
        infoLarga: ri.width > rl.width * 0.85
      };
    }
    /* o simbolo do duplicar existe na fonte? Comparado com um ponto de codigo de uso
       privado, que NENHUMA fonte tem: se as duas larguras forem iguais, o que aparece na
       tela e o retangulo de caractere ausente, e nao o simbolo. */
    const bt = document.querySelector('#a-pac-lista button[title="Duplicar este pacote"]');
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = getComputedStyle(bt).font || '13px system-ui';
    const glifo = cv.measureText('⧉').width;
    const ausente = cv.measureText('\u{10FFFD}').width;
    return { pac: medir('#a-pac-lista'), op: medir('#a-op-lista'), glifo, ausente };
  });

  chk('a lista de pacotes marca a faixa como "abaixo"', med.pac.abaixoNaClasse, JSON.stringify(med.pac));
  chk('a lista de pacotes tem os cinco botoes', med.pac.botoes === 5, med.pac.titulos.join(','));
  chk('e o duplicar esta entre eles', med.pac.titulos.indexOf('Duplicar este pacote') >= 0, med.pac.titulos.join(','));
  chk('NA TELA a faixa fica abaixo do resumo do pacote', med.pac.abaixoNaTela, JSON.stringify(med.pac));
  chk('a faixa ocupa a largura do cartao', med.pac.larguraQuaseCheia, JSON.stringify(med.pac));
  chk('e o resumo do pacote deixou de ser espremido numa coluna', med.pac.infoLarga, JSON.stringify(med.pac));

  chk('a lista de opcionais tem os quatro botoes, com o duplicar',
    med.op.botoes === 4 && med.op.titulos.indexOf('Duplicar este opcional') >= 0, med.op.titulos.join(','));
  chk('e a faixa dela tambem fica abaixo', med.op.abaixoNaClasse && med.op.abaixoNaTela, JSON.stringify(med.op));

  chk('o simbolo do duplicar nao e um retangulo de caractere ausente',
    med.glifo > 0 && Math.abs(med.glifo - med.ausente) > 0.5, med.glifo + ' x ' + med.ausente);

  chk('sem erro de console', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   7. O AVISO DE OPCIONAIS PENDENTES CITA O ROTULO QUE ESTA NA TELA
   ---------------------------------------------------------------------
   Defeito achado nesta rodada: fcOpPendente LE o rotulo do botao de salvar, e as tres
   abas com catalogo chamavam o *OpRender ANTES de trocar o rotulo. Vindo do modo
   "criar", abrir um item no lapis desenhava o aviso citando "Adicionar pacote"
   enquanto o botao ao lado ja dizia "Salvar alterações" -- o aviso mandava apertar um
   botao que nao existia mais na tela.
   ===================================================================== */
try {
  console.log('\n7. o aviso de pendentes cita o rotulo que esta na tela');
  const pg = await abrir(browser, base);
  await cenario(pg);
  await botaoDaLinha(pg, 'a-pac-lista', 'Editar', 0);
  await espera(PAUSA);
  const t = await tela(pg);
  chk('o botao esta em "Salvar alterações"', t.botao === 'Salvar alterações', t.botao);
  chk('o aviso de pendentes aparece', t.pendenteVisivel, t.pendenteTexto);
  chk('e cita o rotulo que ESTA no botao', t.pendenteTexto.indexOf(t.botao) > 0, t.pendenteTexto);
  chk('e nomeia o pacote em edicao', t.pendenteTexto.indexOf('Ensaio 1 hora') > 0, t.pendenteTexto);
  chk('sem erro de console', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

await browser.close();
servidor.close();
process.exit(resumo());
