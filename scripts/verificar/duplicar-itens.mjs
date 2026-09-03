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
        modo criar; o catalogo continua com os pacotes que tinha. Desde 03/09/2026 devolve
        tambem os SETE CAMPOS de texto da copia (chave `form`, ver fcFormLer): sem eles a
        recarga entregava os opcionais da copia num formulario em branco -- o dono via dois
        opcionais soltos e nenhum pacote a que pertencessem. E o caminho fecha onde importa:
        SALVAR depois da recarga cria a copia e deixa o original intacto campo a campo.
        Na `main` de 03/09/2026 os sete campos voltam vazios e o salvamento e recusado
        ("Informe o codigo do pacote").
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

   O QUE ELE PASSOU A COBRIR EM 03/09/2026 (leva 3, as demais listas):
     8. DUPLICAR PRODUTO NO CHECKOUT -- mesma forma do pacote, e os mesmos tres caminhos
        que quebram dados: com opcionais, ENQUANTO EDITA OUTRO, e recarregar-e-salvar. O
        produto de origem e o que estava em edicao sao comparados campo a campo.
     9. DUPLICAR PRODUTO NA MINI LOJA -- o mesmo, mais a decisao medida desta aba: a copia
        HERDA A FOTO E A CATEGORIA. Sem a foto, mProdSalvar recusaria a copia no primeiro
        clique ("a vitrine e feita de imagens"), e o dono teria pedido uma copia para ganhar
        uma recusa.
    10. DUPLICAR UM OPCIONAL nas duas abas -- entra logo abaixo da original, salvar grava as
        duas, e o produto de origem so muda no que era para mudar.
    11. DUPLICAR UMA FAMILIA COM O CONTEUDO DELA -- um clique cria a familia E todos os
        pacotes dela com os opcionais; cada pacote nasce com codigo proprio (fcDupCod pela
        normalizacao do Pix), a familia com nome derivado, e NENHUM original e tocado.
    12. APAGAR UMA FAMILIA COM CONTEUDO -- a confirmacao lista os pacotes PELO NOME; Cancelar
        nao apaga nada; confirmar apaga a familia e SO os pacotes dela, e nenhum pacote de
        outra familia some. A recusa da ultima familia continua de pe.
    13. DUPLICAR UM CUPOM nas TRES abas -- a copia nasce com codigo derivado, entao a recusa
        de codigo repetido (publicada no mesmo dia) NAO acende, e o Gerar nao e barrado.
    14. DUPLICAR MENSAGEM E OPCAO DE QUALIFICACAO -- os dois textos da mensagem ganham a
        marca, e a opcao deriva ate ficar unica (a lista tem recusa de texto repetido).

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
import { navegador, servir, abrir, set, clicar, marcar, alertas, zerarAlertas, ler } from './lib.mjs';
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
    familias: o.familias || [],
    cps: o.cps || [],
    edops: o.edops || [],
    editidx: (typeof o.editidx === 'number') ? o.editidx : null
  };
});

/* O mesmo, para as abas Checkout e Mini loja. Ler o localStorage, e nao a variavel da
   pagina: o script da ferramenta roda dentro de uma IIFE, e o que importa e o que
   SOBREVIVE a recarga. */
const gravadoProd = (pg, chave) => pg.evaluate(chave => {
  const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
  const o = st[chave] || {};
  return {
    prods: o.prods || [],
    cps: o.cps || [],
    edops: o.edops || [],
    editidx: (typeof o.editidx === 'number') ? o.editidx : null
  };
}, chave);

/* Um produto comparado campo a campo, inclusive os opcionais, a foto e a categoria. E o
   que responde "o original foi tocado?" sem depender de olhar a tela. */
const fotoProd = p => JSON.stringify({
  nome: p.nome, desc: p.desc, preco: p.preco, cat: p.cat, img: p.img, larg: p.larg,
  opsel: p.opsel, opnenhum: p.opnenhum, qtd: !!p.qtd,
  ops: (p.ops || []).map(o => [o.nome, o.preco, !!o.qtd])
});

/* O que a lista de familias mostra, com a contagem de pacotes que ela propria escreve. */
const familiasNaTela = pg => pg.evaluate(() => {
  const lis = document.querySelectorAll('#a-fam-lista li');
  return Array.prototype.map.call(lis, li => {
    const ins = li.querySelectorAll('input[type=text]');
    const qt = li.querySelector('.info div:last-child');
    return { nome: ins[0] ? ins[0].value : null, dica: ins[1] ? ins[1].value : null,
      conta: qt ? qt.textContent : '' };
  });
});

/* Os codigos dos cupons como a LISTA mostra, e se a linha esta marcada de vermelho pela
   deteccao de codigo repetido (fcCpDupMarcar pinta a borda). */
const cuponsNaTela = (pg, lista) => pg.evaluate(lista => {
  const lis = document.querySelectorAll('#' + lista + ' li');
  return Array.prototype.map.call(lis, li => {
    const c = li.querySelector('input[type=text]');
    return { codigo: c ? c.value : null, marcado: !!(c && c.style.borderColor) };
  });
}, lista);

/* O confirm() ESPIONADO: guarda o texto e devolve a resposta pedida. lib.mjs deixa um
   confirm que sempre diz "sim"; aqui o texto E a medida (a confirmacao nominal tem de
   listar os pacotes pelo nome), e o "nao" e um caso proprio. */
const espiarConfirm = (pg, resposta) => pg.evaluate(r => {
  window.__confirms = [];
  window.confirm = m => { window.__confirms.push(String(m)); return r; };
}, resposta);
const confirms = pg => pg.evaluate(() => window.__confirms.slice());

/* Erros de console SEM as fotos que nao carregam. A Mini loja aponta para
   storage.alboom.ninja, que nao existe dentro do arnes: a falha de rede vira uma linha de
   erro que nao diz nada sobre o codigo sob teste. */
const errosReais = pg => pg.erros.filter(e => e.indexOf('alboom') < 0);

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

  /* OS SETE CAMPOS DA COPIA. Sem eles a recarga devolvia opcionais sem pacote nenhum. */
  chk('a recarga devolve o codigo derivado da copia', t.cod === 'E905-DU-1H-COPIA', t.cod);
  chk('a recarga devolve o nome marcado como copia', t.nome === 'Ensaio 1 hora (cópia)', t.nome);
  chk('a recarga devolve a duracao', t.dur === '1 hora', t.dur);
  chk('a recarga devolve o preco', String(t.preco) === '420', t.preco);
  chk('a recarga devolve o que inclui', t.inclui === '10 fotos tratadas', t.inclui);
  chk('a recarga devolve o endereco do TidyCal',
    t.path === 'https://tidycal.com/fotocerta/e905-du-1h', t.path);
  chk('a recarga devolve a familia escolhida (nunca em branco)', !!t.fam, JSON.stringify(t.fam));

  /* ---- e o caminho fecha: SALVAR depois da recarga ---- */
  await zerarAlertas(pg);
  await clicar(pg, 'a-pac-salvar');
  await espera(PAUSA);
  const dep = await gravado(pg);
  const av = await alertas(pg);
  chk('salvar depois da recarga nao e recusado', av.length === 0, av.join(' | '));
  chk('salvar depois da recarga CRIA a copia (dois pacotes viram tres)',
    dep.pacotes.length === 3, dep.pacotes.length);
  chk('e o pacote de ORIGEM continua intacto, campo a campo',
    foto(dep.pacotes[0]) === foto(antes.pacotes[0]),
    foto(dep.pacotes[0]) + ' != ' + foto(antes.pacotes[0]));
  chk('o segundo pacote do cenario tambem continua intacto',
    foto(dep.pacotes[1]) === foto(antes.pacotes[1]),
    foto(dep.pacotes[1]) + ' != ' + foto(antes.pacotes[1]));
  const nova = dep.pacotes[2] || {};
  chk('a copia gravada tem o codigo, o nome e o preco da copia',
    nova.cod === 'E905-DU-1H-COPIA' && nova.nome === 'Ensaio 1 hora (cópia)' && String(nova.preco) === '420',
    JSON.stringify(nova));
  chk('a copia gravada levou os dois opcionais, com a marca de quantidade',
    (nova.ops || []).length === 2 && nova.ops[0].qtd === true && nova.ops[1].qtd === false,
    JSON.stringify(nova.ops));
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


/* =====================================================================
   OS CASOS DA LEVA 3 -- as demais listas da ferramenta
   ===================================================================== */

/* Os opcionais de QUALQUER uma das tres listas, como a TELA os mostra. */
const opsDaLista = (pg, lista) => pg.evaluate(lista => {
  const lis = document.querySelectorAll('#' + lista + ' li');
  return Array.prototype.map.call(lis, li => {
    const t = li.querySelector('input[type=text]');
    const n = li.querySelector('input[type=number]');
    const c = li.querySelector('input[type=checkbox]');
    return { nome: t ? t.value : null, preco: n ? n.value : null, qtd: !!(c && c.checked) };
  });
}, lista);

/* O formulario "Cadastrar produto" de uma das duas abas, com os radios. */
const telaProd = (pg, pref) => pg.evaluate(pref => {
  const g = id => document.getElementById(id);
  const v = id => (g(id) ? g(id).value : null);
  const r = n => { const e = document.querySelector('input[name="' + n + '"]:checked'); return e ? e.value : null; };
  const cp = g(pref + '-prod-copia');
  return {
    nome: v(pref + '-pnome'), desc: v(pref + '-pdesc'), preco: v(pref + '-ppreco'),
    cat: v(pref + '-pcat'), img: v(pref + '-pimg'),
    opsel: r(pref + '-opsel'), opnenhum: r(pref + '-opnenhum'), pqtd: r(pref + '-pqtd'),
    botao: g(pref + '-prod-salvar') ? g(pref + '-prod-salvar').textContent : null,
    cancelar: g(pref + '-prod-cancelar') ? g(pref + '-prod-cancelar').textContent : null,
    cancelarVisivel: !!(g(pref + '-prod-cancelar') && g(pref + '-prod-cancelar').style.display !== 'none'),
    copiaVisivel: !!(cp && cp.style.display !== 'none'),
    copiaTexto: cp ? cp.textContent : ''
  };
}, pref);

async function novoOpcionalEm(pg, pref, nome, preco, qtd) {
  await set(pg, pref + '-op-nome', nome);
  await set(pg, pref + '-op-preco', preco);
  await marcar(pg, pref + '-op-qtd', !!qtd);
  await clicar(pg, pref + '-op-add');
}

/* Checkout: dois produtos, o primeiro com dois opcionais (um deles por quantidade). */
async function cenarioU(pg) {
  for (const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
  await clicar(pg, 'aba-uni');
  await novoOpcionalEm(pg, 'u', 'Album impresso', '300', true);
  await novoOpcionalEm(pg, 'u', 'Making of', '150', false);
  await set(pg, 'u-pnome', 'Ensaio de Natal');
  await set(pg, 'u-pdesc', 'Sessao em estudio com cenario');
  await set(pg, 'u-ppreco', '420');
  await clicar(pg, 'u-prod-salvar');
  await set(pg, 'u-pnome', 'Ensaio Gestante');
  await set(pg, 'u-pdesc', 'Externa, fim de tarde');
  await set(pg, 'u-ppreco', '760');
  await clicar(pg, 'u-prod-salvar');
  await espera(PAUSA);
}

/* Mini loja: dois produtos, o primeiro com dois opcionais, categoria e foto. */
async function cenarioM(pg) {
  for (const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
  await clicar(pg, 'aba-loja');
  await novoOpcionalEm(pg, 'm', 'Moldura', '90', true);
  await novoOpcionalEm(pg, 'm', 'Caixa presente', '40', false);
  await set(pg, 'm-pnome', 'Album 20x30');
  await set(pg, 'm-pdesc', 'Capa dura, 30 paginas');
  await set(pg, 'm-ppreco', '420');
  await set(pg, 'm-pcat', 'Albuns');
  await set(pg, 'm-pimg', 'https://storage.alboom.ninja/album-20x30.jpg');
  await clicar(pg, 'm-prod-salvar');
  await set(pg, 'm-pnome', 'Ampliacao 30x45');
  await set(pg, 'm-ppreco', '150');
  await set(pg, 'm-pcat', 'Ampliacoes');
  await set(pg, 'm-pimg', 'https://storage.alboom.ninja/amp-30x45.jpg');
  await clicar(pg, 'm-prod-salvar');
  await espera(PAUSA);
}

/* =====================================================================
   8. DUPLICAR UM PRODUTO NO CHECKOUT
   ===================================================================== */
try {
  console.log('\n8. duplicar um produto no Checkout');
  const pg = await abrir(browser, base);
  await cenarioU(pg);

  const antes = await gravadoProd(pg, 'u');
  chk('o cenario montou dois produtos', antes.prods.length === 2, antes.prods.length);
  const original = fotoProd(antes.prods[0]);
  chk('o primeiro produto tem os dois opcionais, um com quantidade',
    (antes.prods[0].ops || []).length === 2 && antes.prods[0].ops[0].qtd === true && antes.prods[0].ops[1].qtd === false,
    JSON.stringify(antes.prods[0].ops));

  await botaoDaLinha(pg, 'u-prod-lista', 'Duplicar este produto', 0);
  await espera(PAUSA);
  let t = await telaProd(pg, 'u');
  let g = await gravadoProd(pg, 'u');
  chk('o formulario ficou em MODO CRIAR', t.botao === 'Adicionar produto', t.botao);
  chk('editidx voltou a -1 NO QUE ESTA GRAVADO', g.editidx === -1, g.editidx);
  chk('o catalogo NAO ganhou item nenhum ao duplicar', g.prods.length === 2, g.prods.length);
  chk('o nome veio marcado como copia', t.nome === 'Ensaio de Natal (cópia)', t.nome);
  chk('a descricao veio junto', t.desc === 'Sessao em estudio com cenario', t.desc);
  chk('o preco veio junto', String(t.preco) === '420', t.preco);
  chk('o botao de cancelar diz que descarta a copia',
    t.cancelarVisivel && t.cancelar === 'Descartar cópia', t.cancelar + ' / ' + t.cancelarVisivel);
  chk('o aviso de copia aparece e nomeia o produto de origem',
    t.copiaVisivel && t.copiaTexto.indexOf('Ensaio de Natal') > 0, t.copiaTexto);
  let ops = await opsDaLista(pg, 'u-op-lista');
  chk('os dois opcionais vieram para o formulario', ops.length === 2, JSON.stringify(ops));
  chk('com nome, preco e "vende por quantidade" iguais',
    ops[0].nome === 'Album impresso' && String(ops[0].preco) === '300' && ops[0].qtd === true &&
    ops[1].nome === 'Making of' && ops[1].qtd === false, JSON.stringify(ops));

  await clicar(pg, 'u-prod-salvar');
  await espera(PAUSA);
  let dep = await gravadoProd(pg, 'u');
  chk('salvar criou um TERCEIRO produto', dep.prods.length === 3, dep.prods.length);
  chk('O PRODUTO ORIGINAL NAO FOI ALTERADO (campo a campo, com os opcionais)',
    fotoProd(dep.prods[0]) === original, fotoProd(dep.prods[0]) + ' != ' + original);
  chk('o segundo produto do cenario continua intacto',
    fotoProd(dep.prods[1]) === fotoProd(antes.prods[1]));
  chk('a copia levou os dois opcionais',
    JSON.stringify((dep.prods[2].ops || []).map(o => [o.nome, o.preco, !!o.qtd])) ===
    JSON.stringify((dep.prods[0].ops || []).map(o => [o.nome, o.preco, !!o.qtd])),
    JSON.stringify(dep.prods[2].ops));
  chk('o aviso de copia sumiu depois de salvar', !(await telaProd(pg, 'u')).copiaVisivel);
  chk('e o rotulo do cancelar voltou ao normal',
    (await telaProd(pg, 'u')).cancelar === 'Cancelar edição', (await telaProd(pg, 'u')).cancelar);

  /* ---- duplicar ENQUANTO EDITA OUTRO: o caminho que sobrescreveria ---- */
  await botaoDaLinha(pg, 'u-prod-lista', 'Editar', 1);
  await espera(PAUSA);
  g = await gravadoProd(pg, 'u');
  chk('o cenario de risco esta montado: editando o produto de indice 1', g.editidx === 1, g.editidx);
  const beta = fotoProd(dep.prods[1]);
  await botaoDaLinha(pg, 'u-prod-lista', 'Duplicar este produto', 0);
  await espera(PAUSA);
  g = await gravadoProd(pg, 'u');
  chk('duplicar TIROU o formulario do modo edicao', g.editidx === -1, g.editidx);
  await clicar(pg, 'u-prod-salvar');
  await espera(PAUSA);
  dep = await gravadoProd(pg, 'u');
  chk('salvar acrescentou, e nao sobrescreveu', dep.prods.length === 4, dep.prods.length);
  chk('O PRODUTO QUE ESTAVA SENDO EDITADO FICOU INTACTO', fotoProd(dep.prods[1]) === beta,
    fotoProd(dep.prods[1]) + ' != ' + beta);
  chk('o produto de origem tambem ficou intacto', fotoProd(dep.prods[0]) === original);

  chk('sem erro de console', errosReais(pg).length === 0, errosReais(pg).join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   8b. DUPLICAR, RECARREGAR E SALVAR (Checkout)
   ===================================================================== */
try {
  console.log('\n8b. duplicar, recarregar e salvar (Checkout)');
  const pg = await abrir(browser, base);
  await cenarioU(pg);
  const antes = await gravadoProd(pg, 'u');

  await botaoDaLinha(pg, 'u-prod-lista', 'Duplicar este produto', 0);
  await espera(PAUSA);
  await pg.reload();
  await pg.evaluate(() => { window.__alertas = []; window.alert = m => window.__alertas.push(String(m)); });
  await clicar(pg, 'aba-uni');
  await espera(PAUSA);
  const t = await telaProd(pg, 'u');
  let g = await gravadoProd(pg, 'u');
  chk('depois da recarga o formulario continua em MODO CRIAR', t.botao === 'Adicionar produto', t.botao);
  chk('depois da recarga editidx continua -1', g.editidx === -1, g.editidx);
  chk('o catalogo continua com os dois produtos do cenario', g.prods.length === 2, g.prods.length);
  chk('a recarga devolve o nome marcado da copia', t.nome === 'Ensaio de Natal (cópia)', t.nome);
  chk('a recarga devolve a descricao e o preco',
    t.desc === 'Sessao em estudio com cenario' && String(t.preco) === '420', t.desc + ' / ' + t.preco);
  const ops = await opsDaLista(pg, 'u-op-lista');
  chk('os opcionais da copia voltaram da recarga', ops.length === 2, JSON.stringify(ops));

  await zerarAlertas(pg);
  await clicar(pg, 'u-prod-salvar');
  await espera(PAUSA);
  const av = await alertas(pg);
  const dep = await gravadoProd(pg, 'u');
  chk('salvar depois da recarga nao e recusado', av.length === 0, av.join(' | '));
  chk('salvar depois da recarga CRIA a copia', dep.prods.length === 3, dep.prods.length);
  chk('e o produto de ORIGEM continua intacto, campo a campo',
    fotoProd(dep.prods[0]) === fotoProd(antes.prods[0]),
    fotoProd(dep.prods[0]) + ' != ' + fotoProd(antes.prods[0]));
  chk('a copia gravada tem os dois opcionais', (dep.prods[2].ops || []).length === 2,
    JSON.stringify(dep.prods[2].ops));
  chk('sem erro de console', errosReais(pg).length === 0, errosReais(pg).join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   9. DUPLICAR UM PRODUTO NA MINI LOJA -- a foto e a categoria vao junto
   ===================================================================== */
try {
  console.log('\n9. duplicar um produto na Mini loja');
  const pg = await abrir(browser, base);
  await cenarioM(pg);

  const antes = await gravadoProd(pg, 'm');
  chk('o cenario montou dois produtos', antes.prods.length === 2, antes.prods.length);
  const original = fotoProd(antes.prods[0]);

  await botaoDaLinha(pg, 'm-prod-lista', 'Duplicar este produto', 0);
  await espera(PAUSA);
  const t = await telaProd(pg, 'm');
  let g = await gravadoProd(pg, 'm');
  chk('o formulario ficou em MODO CRIAR', t.botao === 'Adicionar produto', t.botao);
  chk('editidx voltou a -1', g.editidx === -1, g.editidx);
  chk('o catalogo NAO ganhou item nenhum ao duplicar', g.prods.length === 2, g.prods.length);
  chk('o nome veio marcado como copia', t.nome === 'Album 20x30 (cópia)', t.nome);
  chk('A CATEGORIA VEIO JUNTO', t.cat === 'Albuns', t.cat);
  chk('A FOTO VEIO JUNTA -- sem ela mProdSalvar recusaria a copia',
    t.img === 'https://storage.alboom.ninja/album-20x30.jpg', t.img);
  chk('o aviso de copia diz que a foto e a categoria vieram junto',
    t.copiaVisivel && t.copiaTexto.indexOf('foto') > 0 && t.copiaTexto.indexOf('categoria') > 0, t.copiaTexto);
  const ops = await opsDaLista(pg, 'm-op-lista');
  chk('os dois opcionais vieram, com a marca de quantidade',
    ops.length === 2 && ops[0].qtd === true && ops[1].qtd === false, JSON.stringify(ops));

  await zerarAlertas(pg);
  await clicar(pg, 'm-prod-salvar');
  await espera(PAUSA);
  const av = await alertas(pg);
  const dep = await gravadoProd(pg, 'm');
  chk('salvar a copia NAO e recusado (a foto ja veio preenchida)', av.length === 0, av.join(' | '));
  chk('salvar criou um TERCEIRO produto', dep.prods.length === 3, dep.prods.length);
  chk('O PRODUTO ORIGINAL NAO FOI ALTERADO (campo a campo)',
    fotoProd(dep.prods[0]) === original, fotoProd(dep.prods[0]) + ' != ' + original);
  chk('o segundo produto do cenario continua intacto',
    fotoProd(dep.prods[1]) === fotoProd(antes.prods[1]));
  chk('a copia gravada tem a mesma foto e a mesma categoria do original',
    dep.prods[2].img === dep.prods[0].img && dep.prods[2].cat === dep.prods[0].cat,
    JSON.stringify([dep.prods[2].img, dep.prods[2].cat]));
  chk('e o nome dela e o unico que difere',
    dep.prods[2].nome === 'Album 20x30 (cópia)' && dep.prods[2].nome !== dep.prods[0].nome,
    dep.prods[2].nome);
  chk('sem erro de console (fora as fotos que nao carregam no arnes)',
    errosReais(pg).length === 0, errosReais(pg).join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   10. DUPLICAR UM OPCIONAL no Checkout e na Mini loja
   ===================================================================== */
for (const cfg of [
  { pref: 'u', nome: 'Checkout', cenario: cenarioU, alvo: 'Album impresso' },
  { pref: 'm', nome: 'Mini loja', cenario: cenarioM, alvo: 'Moldura' }
]) {
  try {
    console.log('\n10. duplicar um opcional -- ' + cfg.nome);
    const pg = await abrir(browser, base);
    await cfg.cenario(pg);
    const antes = await gravadoProd(pg, cfg.pref);

    await botaoDaLinha(pg, cfg.pref + '-prod-lista', 'Editar', 0);
    await espera(PAUSA);
    await botaoDaLinha(pg, cfg.pref + '-op-lista', 'Duplicar este opcional', 0);
    await espera(PAUSA);
    const ops = await opsDaLista(pg, cfg.pref + '-op-lista');
    chk('a lista de opcionais passou de dois para tres', ops.length === 3, JSON.stringify(ops));
    chk('a copia entrou LOGO ABAIXO da original', ops[1].nome === cfg.alvo + ' (cópia)', JSON.stringify(ops[1]));
    chk('a copia manteve preco e "vende por quantidade"',
      ops[1].preco === ops[0].preco && ops[1].qtd === ops[0].qtd, JSON.stringify(ops[1]));
    chk('a original ficou onde estava, sem marca', ops[0].nome === cfg.alvo, JSON.stringify(ops[0]));

    await clicar(pg, cfg.pref + '-prod-salvar');
    await espera(PAUSA);
    const dep = await gravadoProd(pg, cfg.pref);
    chk('salvar gravou os tres opcionais no produto', (dep.prods[0].ops || []).length === 3,
      JSON.stringify(dep.prods[0].ops));
    chk('e nao criou produto nenhum', dep.prods.length === 2, dep.prods.length);
    chk('o SEGUNDO produto nao foi tocado', fotoProd(dep.prods[1]) === fotoProd(antes.prods[1]));

    await botaoDaLinha(pg, cfg.pref + '-prod-lista', 'Editar', 0);
    await espera(PAUSA);
    await botaoDaLinha(pg, cfg.pref + '-op-lista', 'Duplicar este opcional', 1);
    await espera(PAUSA);
    const ops2 = await opsDaLista(pg, cfg.pref + '-op-lista');
    chk('duplicar a copia numera a marca em vez de empilha-la',
      ops2[2].nome === cfg.alvo + ' (cópia 2)', JSON.stringify(ops2[2]));
    chk('sem erro de console', errosReais(pg).length === 0, errosReais(pg).join(' | '));
    await pg.close();
  } catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }
}

/* ---- o cenario das familias: duas familias, dois pacotes na primeira e um na segunda ---- */
async function cenarioFam(pg) {
  await cenario(pg);
  await set(pg, 'a-fam-nome', 'Fim de semana');
  await set(pg, 'a-fam-dica', 'Sabado e domingo');
  await clicar(pg, 'a-fam-add');
  await espera(200);
  await set(pg, 'a-pcod', 'E905-DU-3H');
  await set(pg, 'a-pnome', 'Ensaio 3 horas');
  await set(pg, 'a-pdur', '3 horas');
  await set(pg, 'a-ppreco', '990');
  await set(pg, 'a-pinclui', '30 fotos tratadas');
  await set(pg, 'a-ppath', 'fotocerta/e905-du-3h');
  await pg.evaluate(() => {
    const sel = document.getElementById('a-pfam');
    sel.value = sel.options[1].value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await clicar(pg, 'a-pac-salvar');
  await espera(PAUSA);
}

/* =====================================================================
   11. DUPLICAR UMA FAMILIA COM O CONTEUDO DELA
   ===================================================================== */
try {
  console.log('\n11. duplicar uma familia com os pacotes dela');
  const pg = await abrir(browser, base);
  await cenarioFam(pg);

  const antes = await gravado(pg);
  chk('o cenario montou duas familias', antes.familias.length === 2, JSON.stringify(antes.familias));
  chk('e tres pacotes, dois na primeira familia e um na segunda',
    antes.pacotes.length === 3 &&
    antes.pacotes.filter(p => p.fam === antes.familias[0].id).length === 2 &&
    antes.pacotes.filter(p => p.fam === antes.familias[1].id).length === 1,
    JSON.stringify(antes.pacotes.map(p => [p.cod, p.fam])));
  const originais = antes.pacotes.map(foto);

  await zerarAlertas(pg);
  await botaoDaLinha(pg, 'a-fam-lista', 'Duplicar esta família com os pacotes dela', 0);
  await espera(PAUSA);
  const dep = await gravado(pg);
  const av = await alertas(pg);

  chk('duplicar a familia nao pede nada nem avisa erro', av.length === 0, av.join(' | '));
  chk('a familia nova entrou LOGO ABAIXO da original',
    dep.familias.length === 3 && dep.familias[1].nome === 'Pacotes (cópia)',
    JSON.stringify(dep.familias.map(f => f.nome)));
  chk('ela levou a descricao curta da original',
    dep.familias[1].dica === dep.familias[0].dica, JSON.stringify(dep.familias[1]));
  chk('e o id dela e novo, nunca o da original',
    dep.familias[1].id !== dep.familias[0].id && dep.familias[1].id !== dep.familias[2].id,
    JSON.stringify(dep.familias.map(f => f.id)));

  chk('OS DOIS PACOTES DA FAMILIA VIERAM JUNTO (tres viraram cinco)',
    dep.pacotes.length === 5, dep.pacotes.length);
  const novos = dep.pacotes.filter(p => p.fam === dep.familias[1].id);
  chk('os dois novos pertencem a familia nova', novos.length === 2,
    JSON.stringify(dep.pacotes.map(p => [p.cod, p.fam])));
  chk('cada copia nasceu com CODIGO PROPRIO, derivado do original',
    novos[0].cod === 'E905-DU-1H-COPIA' && novos[1].cod === 'E905-DU-2H-COPIA',
    JSON.stringify(novos.map(p => p.cod)));
  chk('nao ha dois pacotes com o mesmo identificador no Pix',
    new Set(dep.pacotes.map(p => String(p.cod).replace(/[^A-Za-z0-9]/g, '').toUpperCase())).size === 5,
    JSON.stringify(dep.pacotes.map(p => p.cod)));
  chk('o NOME dos pacotes NAO ganha marca -- eles nascem em outra familia',
    novos[0].nome === 'Ensaio 1 hora' && novos[1].nome === 'Ensaio 2 horas',
    JSON.stringify(novos.map(p => p.nome)));
  chk('os opcionais vieram junto, com a marca de quantidade',
    (novos[0].ops || []).length === 2 && novos[0].ops[0].qtd === true && novos[0].ops[1].qtd === false,
    JSON.stringify(novos[0].ops));
  chk('e o array de opcionais da copia NAO e o mesmo objeto do original',
    novos[0].ops !== dep.pacotes[0].ops, 'referencia compartilhada');

  chk('OS TRES PACOTES ORIGINAIS FICARAM INTACTOS, campo a campo',
    JSON.stringify(dep.pacotes.slice(0, 3).map(foto)) === JSON.stringify(originais),
    JSON.stringify(dep.pacotes.slice(0, 3).map(foto)));
  chk('a familia original nao foi tocada',
    JSON.stringify(dep.familias[0]) === JSON.stringify(antes.familias[0]), JSON.stringify(dep.familias[0]));
  chk('a segunda familia do cenario continua onde estava, com o pacote dela',
    dep.familias[2].nome === 'Fim de semana' &&
    dep.pacotes.filter(p => p.fam === dep.familias[2].id).length === 1,
    JSON.stringify(dep.familias[2]));

  const naTela = await familiasNaTela(pg);
  chk('a lista na tela mostra as tres familias, com a contagem de cada uma',
    naTela.length === 3 && naTela[0].conta.indexOf('2 pacotes') === 0 &&
    naTela[1].conta.indexOf('2 pacotes') === 0 && naTela[2].conta.indexOf('1 pacote') === 0,
    JSON.stringify(naTela.map(f => f.conta)));

  /* e a geracao continua saindo: nome de familia repetido e codigo colidido barrariam */
  await zerarAlertas(pg);
  await clicar(pg, 'a-gerar');
  await espera(PAUSA);
  chk('o Gerar nao e recusado depois de duplicar a familia',
    (await alertas(pg)).length === 0, JSON.stringify(await alertas(pg)));
  chk('e saiu codigo', (await ler(pg, 'a-out1')).length > 100);
  chk('sem erro de console', errosReais(pg).length === 0, errosReais(pg).join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   12. APAGAR UMA FAMILIA COM CONTEUDO -- confirmacao NOMINAL
   ===================================================================== */
try {
  console.log('\n12. apagar uma familia com conteudo');
  const pg = await abrir(browser, base);
  await cenarioFam(pg);
  const antes = await gravado(pg);
  const fotoDoTerceiro = foto(antes.pacotes[2]);

  /* 12a. CANCELAR nao apaga nada */
  await espiarConfirm(pg, false);
  await botaoDaLinha(pg, 'a-fam-lista', 'Remover', 0);
  await espera(PAUSA);
  let cf = await confirms(pg);
  let g = await gravado(pg);
  chk('apagar familia com pacotes PERGUNTA (deixou de ser proibido)', cf.length === 1, JSON.stringify(cf));
  chk('A CONFIRMACAO LISTA OS PACOTES PELO NOME, e nao so conta',
    cf[0].indexOf('Ensaio 1 hora') > 0 && cf[0].indexOf('Ensaio 2 horas') > 0, cf[0]);
  chk('e mostra tambem o codigo de cada um',
    cf[0].indexOf('E905-DU-1H') > 0 && cf[0].indexOf('E905-DU-2H') > 0, cf[0]);
  chk('a contagem esta na frase', cf[0].indexOf('2 pacotes') > 0, cf[0]);
  chk('NAO cita o pacote da OUTRA familia', cf[0].indexOf('Ensaio 3 horas') < 0, cf[0]);
  chk('a mensagem ensina o caminho de nao perder os pacotes',
    cf[0].indexOf('Cancelar') > 0 && cf[0].indexOf('lápis') > 0, cf[0]);
  chk('CANCELAR nao apagou familia nenhuma', g.familias.length === 2, g.familias.length);
  chk('nem pacote nenhum', g.pacotes.length === 3, g.pacotes.length);

  /* 12b. CONFIRMAR apaga a familia e SO os pacotes dela */
  await espiarConfirm(pg, true);
  await botaoDaLinha(pg, 'a-fam-lista', 'Remover', 0);
  await espera(PAUSA);
  g = await gravado(pg);
  chk('confirmar apagou a familia', g.familias.length === 1 && g.familias[0].nome === 'Fim de semana',
    JSON.stringify(g.familias));
  chk('e os DOIS pacotes dela', g.pacotes.length === 1, JSON.stringify(g.pacotes.map(p => p.cod)));
  chk('O PACOTE DA OUTRA FAMILIA NAO SUMIU, e nao foi tocado',
    foto(g.pacotes[0]) === fotoDoTerceiro, foto(g.pacotes[0]) + ' != ' + fotoDoTerceiro);
  chk('e ele continua apontando para a familia que sobrou',
    g.pacotes[0].fam === g.familias[0].id, g.pacotes[0].fam + ' / ' + g.familias[0].id);

  /* 12c. a recusa da ULTIMA familia continua de pe */
  await zerarAlertas(pg);
  await espiarConfirm(pg, true);
  await botaoDaLinha(pg, 'a-fam-lista', 'Remover', 0);
  await espera(PAUSA);
  const av = await alertas(pg);
  cf = await confirms(pg);
  g = await gravado(pg);
  chk('apagar a UNICA familia continua sendo recusado com aviso',
    av.length === 1 && av[0].indexOf('única família') > 0, JSON.stringify(av));
  chk('e nem chega a perguntar', cf.length === 0, JSON.stringify(cf));
  chk('a familia e o pacote continuam la', g.familias.length === 1 && g.pacotes.length === 1,
    g.familias.length + ' / ' + g.pacotes.length);
  chk('sem erro de console', errosReais(pg).length === 0, errosReais(pg).join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   12b. APAGAR A FAMILIA DE UM PACOTE EM EDICAO, e o indice que acompanha
   ---------------------------------------------------------------------
   'aEditIdx' e um INDICE em aPacotes e SOBREVIVE A RECARGA. Apagar pacotes que estao
   ANTES dele sem baixar o indice faria o proximo "Salvar alterações" gravar por cima
   de outro pacote -- sem erro e sem nada na tela.
   ===================================================================== */
try {
  console.log('\n12b. apagar familia enquanto edita um pacote de OUTRA');
  const pg = await abrir(browser, base);
  await cenarioFam(pg);
  const antes = await gravado(pg);

  await botaoDaLinha(pg, 'a-pac-lista', 'Editar', 2);
  await espera(PAUSA);
  let g = await gravado(pg);
  chk('editando o pacote de indice 2 (o da segunda familia)', g.editidx === 2, g.editidx);

  await espiarConfirm(pg, true);
  await botaoDaLinha(pg, 'a-fam-lista', 'Remover', 0);
  await espera(PAUSA);
  g = await gravado(pg);
  chk('sobrou um pacote so', g.pacotes.length === 1, JSON.stringify(g.pacotes.map(p => p.cod)));
  chk('O INDICE DE EDICAO ACOMPANHOU (2 virou 0)', g.editidx === 0, g.editidx);
  chk('e o formulario continua mostrando o pacote certo',
    (await tela(pg)).cod === 'E905-DU-3H', (await tela(pg)).cod);

  /* salvar uma alteracao tem de mexer NESTE pacote, e nao noutro */
  await set(pg, 'a-ppreco', '1010');
  await clicar(pg, 'a-pac-salvar');
  await espera(PAUSA);
  g = await gravado(pg);
  chk('salvar alterou o pacote certo, sem criar outro',
    g.pacotes.length === 1 && g.pacotes[0].cod === 'E905-DU-3H' && String(g.pacotes[0].preco) === '1010',
    JSON.stringify(g.pacotes));

  /* e o caso simetrico: apagar a familia DO pacote que esta em edicao zera o formulario */
  const pg2 = await abrir(browser, base);
  await cenarioFam(pg2);
  await botaoDaLinha(pg2, 'a-pac-lista', 'Editar', 0);
  await espera(PAUSA);
  chk('editando o pacote de indice 0', (await gravado(pg2)).editidx === 0);
  await espiarConfirm(pg2, true);
  await botaoDaLinha(pg2, 'a-fam-lista', 'Remover', 0);
  await espera(PAUSA);
  const g2 = await gravado(pg2);
  chk('apagar a familia DO pacote em edicao zera o formulario', g2.editidx === -1, g2.editidx);
  chk('e o campo de codigo ficou em branco', (await tela(pg2)).cod === '', (await tela(pg2)).cod);
  chk('o pacote da outra familia continua intacto',
    g2.pacotes.length === 1 && foto(g2.pacotes[0]) === foto(antes.pacotes[2]),
    JSON.stringify(g2.pacotes));
  chk('sem erro de console', errosReais(pg).length === 0 && errosReais(pg2).length === 0,
    errosReais(pg).concat(errosReais(pg2)).join(' | '));
  await pg.close(); await pg2.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   13. DUPLICAR UM CUPOM nas TRES abas
   ===================================================================== */
for (const cfg of [
  { pref: 'u', nome: 'Checkout', aba: 'aba-uni', chave: 'u', montar: cenarioU },
  { pref: 'm', nome: 'Mini loja', aba: 'aba-loja', chave: 'm', montar: cenarioM },
  { pref: 'a', nome: 'Agendamento por pacote', aba: 'aba-pac', chave: 'a', montar: cenario }
]) {
  try {
    console.log('\n13. duplicar um cupom -- ' + cfg.nome);
    const pg = await abrir(browser, base);
    await cfg.montar(pg);
    await clicar(pg, cfg.aba);
    await set(pg, cfg.pref + '-cp-cod', 'NATAL10');
    await set(pg, cfg.pref + '-cp-valor', '10');
    await set(pg, cfg.pref + '-cp-min', '200');
    await clicar(pg, cfg.pref + '-cp-add');
    await espera(PAUSA);

    await zerarAlertas(pg);
    await botaoDaLinha(pg, cfg.pref + '-cp-lista', 'Duplicar este cupom', 0);
    await espera(PAUSA);
    const av = await alertas(pg);
    const lista = await cuponsNaTela(pg, cfg.pref + '-cp-lista');
    const st = await pg.evaluate(k => (JSON.parse(localStorage.getItem('fcConstrutores') || '{}')[k] || {}).cps || [], cfg.chave);

    chk('duplicar nao dispara alerta nenhum', av.length === 0, av.join(' | '));
    chk('a lista passou a ter dois cupons', lista.length === 2, JSON.stringify(lista));
    chk('a copia entrou LOGO ABAIXO, com o codigo derivado',
      lista[1].codigo === 'NATAL10-COPIA', JSON.stringify(lista));
    chk('A RECUSA DE CODIGO REPETIDO NAO ACENDE (nenhuma linha marcada de vermelho)',
      !lista[0].marcado && !lista[1].marcado, JSON.stringify(lista));
    chk('a copia levou tipo, valor, validade e minimo',
      st.length === 2 && st[1].tipo === st[0].tipo && String(st[1].valor) === String(st[0].valor) &&
      String(st[1].minimo) === String(st[0].minimo), JSON.stringify(st));
    chk('o cupom original nao foi tocado', st[0].codigo === 'NATAL10', JSON.stringify(st[0]));

    /* duplicar a COPIA numera, em vez de repetir o -COPIA */
    await botaoDaLinha(pg, cfg.pref + '-cp-lista', 'Duplicar este cupom', 1);
    await espera(PAUSA);
    const l2 = await cuponsNaTela(pg, cfg.pref + '-cp-lista');
    chk('duplicar a copia deriva de novo, sem colidir',
      l2.length === 3 && l2[2].codigo !== l2[1].codigo && !l2[2].marcado,
      JSON.stringify(l2));

    /* e o Gerar nao e barrado por codigo repetido */
    await zerarAlertas(pg);
    await clicar(pg, cfg.pref + '-gerar');
    await espera(PAUSA);
    const av2 = await alertas(pg);
    chk('o Gerar nao e recusado por cupom repetido',
      av2.filter(m => m.indexOf('cupom') >= 0 || m.indexOf('cupons') >= 0).length === 0,
      JSON.stringify(av2));
    chk('sem erro de console', errosReais(pg).length === 0, errosReais(pg).join(' | '));
    await pg.close();
  } catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }
}

/* =====================================================================
   14. DUPLICAR MENSAGEM (Contagem) e OPCAO DE QUALIFICACAO (Leads)
   ===================================================================== */
try {
  console.log('\n14. duplicar mensagem e opcao de qualificacao');
  const pg = await abrir(browser, base);

  /* ---- mensagens da Contagem regressiva ---- */
  await clicar(pg, 'aba-cnt');
  await set(pg, 'c-msg', 'Oferta de Natal termina em {contador}');
  await set(pg, 'c-msgcurta', 'Termina em {contador}');
  await clicar(pg, 'c-msg-add');
  await espera(PAUSA);
  await botaoDaLinha(pg, 'c-msg-lista', 'Duplicar esta mensagem', 0);
  await espera(PAUSA);
  let msgs = await pg.evaluate(() => JSON.parse(localStorage.getItem('fcConstrutores') || '{}').cmsgs || []);
  chk('a lista de mensagens passou de uma para duas', msgs.length === 2, JSON.stringify(msgs));
  chk('a copia entrou LOGO ABAIXO e o texto longo ganhou a marca',
    msgs[1].texto === 'Oferta de Natal termina em {contador} (cópia)', JSON.stringify(msgs[1]));
  chk('O TEXTO CURTO TAMBEM GANHOU A MARCA -- a barra mostra um ou o outro conforme a tela',
    msgs[1].curta === 'Termina em {contador} (cópia)', JSON.stringify(msgs[1]));
  chk('a mensagem original nao foi tocada',
    msgs[0].texto === 'Oferta de Natal termina em {contador}' && msgs[0].curta === 'Termina em {contador}',
    JSON.stringify(msgs[0]));

  /* mensagem SEM versao curta continua sem */
  await set(pg, 'c-msg', 'Ultimo dia');
  await set(pg, 'c-msgcurta', '');
  await clicar(pg, 'c-msg-add');
  await espera(PAUSA);
  await botaoDaLinha(pg, 'c-msg-lista', 'Duplicar esta mensagem', 2);
  await espera(PAUSA);
  msgs = await pg.evaluate(() => JSON.parse(localStorage.getItem('fcConstrutores') || '{}').cmsgs || []);
  chk('mensagem sem versao curta gera copia tambem sem versao curta',
    msgs.length === 4 && msgs[3].texto === 'Ultimo dia (cópia)' && msgs[3].curta === '',
    JSON.stringify(msgs[3]));

  /* ---- opcoes de qualificacao ---- */
  await clicar(pg, 'aba-leads');
  await set(pg, 'l-qop', 'Ensaio gestante');
  await clicar(pg, 'l-q-add');
  await set(pg, 'l-qop', 'Casamento');
  await clicar(pg, 'l-q-add');
  await espera(PAUSA);

  await zerarAlertas(pg);
  await botaoDaLinha(pg, 'l-q-lista', 'Duplicar esta opção', 0);
  await espera(PAUSA);
  let qops = await pg.evaluate(() => ((JSON.parse(localStorage.getItem('fcConstrutores') || '{}').l) || {}).qops || []);
  chk('a lista de opcoes passou de duas para tres', qops.length === 3, JSON.stringify(qops));
  chk('a copia entrou LOGO ABAIXO da original, marcada',
    qops[1] === 'Ensaio gestante (cópia)', JSON.stringify(qops));
  chk('a original ficou onde estava', qops[0] === 'Ensaio gestante', JSON.stringify(qops));

  /* duplicar A MESMA de novo: o texto DERIVA ate ficar unico, senao nasceria o par que
     lQAdd recusa */
  await botaoDaLinha(pg, 'l-q-lista', 'Duplicar esta opção', 0);
  await espera(PAUSA);
  qops = await pg.evaluate(() => ((JSON.parse(localStorage.getItem('fcConstrutores') || '{}').l) || {}).qops || []);
  chk('duplicar a MESMA opcao de novo nao cria texto repetido',
    qops.length === 4 && new Set(qops.map(t => t.trim().toLowerCase())).size === 4, JSON.stringify(qops));
  chk('e a segunda copia veio numerada', qops[1] === 'Ensaio gestante (cópia 2)', JSON.stringify(qops));
  chk('nenhum alerta foi disparado', (await alertas(pg)).length === 0, JSON.stringify(await alertas(pg)));
  chk('sem erro de console', errosReais(pg).length === 0, errosReais(pg).join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

/* =====================================================================
   15. AS FAIXAS DE BOTOES DAS LISTAS NOVAS
   ===================================================================== */
try {
  console.log('\n15. as faixas de botoes das listas novas');
  const pg = await abrir(browser, base);
  await cenarioU(pg);
  await botaoDaLinha(pg, 'u-prod-lista', 'Editar', 0);
  await espera(PAUSA);
  await set(pg, 'u-cp-cod', 'NATAL10');
  await set(pg, 'u-cp-valor', '10');
  await clicar(pg, 'u-cp-add');
  await espera(PAUSA);

  const med = await pg.evaluate(() => {
    function medir(sel) {
      const li = document.querySelector(sel + ' li');
      if (!li) return null;
      const ctrl = li.querySelector('.ctrl');
      const info = li.querySelector('.info');
      const rc = ctrl.getBoundingClientRect(), ri = info.getBoundingClientRect();
      return {
        titulos: Array.prototype.map.call(ctrl.querySelectorAll('button'), b => b.title),
        abaixoNaClasse: li.className.indexOf('acoes-abaixo') >= 0,
        abaixoNaTela: rc.top >= ri.bottom - 1
      };
    }
    return { prod: medir('#u-prod-lista'), op: medir('#u-op-lista'), cp: medir('#u-cp-lista') };
  });
  chk('a lista de produtos tem os cinco botoes, com o duplicar',
    med.prod.titulos.length === 5 && med.prod.titulos.indexOf('Duplicar este produto') >= 0,
    med.prod.titulos.join(','));
  chk('e a faixa dela fica ABAIXO do item', med.prod.abaixoNaClasse && med.prod.abaixoNaTela,
    JSON.stringify(med.prod));
  chk('a lista de opcionais tem os quatro botoes, com o duplicar, abaixo do item',
    med.op.titulos.length === 4 && med.op.titulos.indexOf('Duplicar este opcional') >= 0 &&
    med.op.abaixoNaClasse, med.op.titulos.join(','));
  chk('a de cupons tem DOIS botoes e a faixa continua na LATERAL',
    med.cp.titulos.length === 2 && med.cp.titulos.indexOf('Duplicar este cupom') >= 0 &&
    !med.cp.abaixoNaClasse, med.cp.titulos.join(',') + ' / ' + med.cp.abaixoNaClasse);
  chk('sem erro de console', errosReais(pg).length === 0, errosReais(pg).join(' | '));
  await pg.close();
} catch (e) { chk('o roteiro deste caso rodou ate o fim', false, String(e.message || e)); }

await browser.close();
servidor.close();
process.exit(resumo());
