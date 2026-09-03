/* ============================================================================
   O FORMULARIO DE CADASTRO NOS DOIS CAMINHOS: recarga x aplicar preset
   ============================================================================
   POR QUE ISTO EXISTE. As tres abas com catalogo (Checkout, Mini loja e Agendamento
   por pacote) guardam o FORMULARIO INACABADO -- os opcionais digitados e ainda nao
   salvos (`edops`), o indice do item em edicao (`editidx`) e, desde 03/09/2026, os
   CAMPOS DE TEXTO dele (`form`). As tres chaves entram pelo mesmo lugar em que TUDO
   entra nessas abas: o `restaura()` da aba. E esse
   `restaura()` tem DOIS chamadores que querem coisas OPOSTAS:

     restaurarEstado()  -- ao abrir a ferramenta: o formulario inacabado deve VOLTAR,
                           senao o dono reabre amanha e perde o que digitou.
     fcPresetAplicar()  -- ao aplicar um preset: o formulario deve ser ZERADO, porque
     fcgAplicarAba()       o preset e a fotografia da aba INTEIRA e traz outro catalogo.

   O DEFEITO QUE ISTO PEGA (medido na `main` de 03/09/2026, com este mesmo arquivo:
   as verificacoes do bloco "aplicar preset" falham la e passam aqui). Com o item de
   indice 1 em edicao e dois opcionais digitados, aplicar um preset deixava o
   formulario apontando para a posicao 1 do catalogo NOVO: o botao dizia "Salvar
   alterações" e o clique seguinte gravava POR CIMA de um item que o dono nunca
   escolheu editar. Nao ha erro de console, nao ha alerta, e a regressao byte a byte
   nao alcanca -- ela compara o texto que os geradores produzem, e isto e interface.

   O QUE ELE COBRE, nas tres abas:
     A. APLICAR PRESET -- com um item em edicao e dois opcionais nao salvos:
        1. o cenario ANTES do clique e mesmo o do defeito (botao "Salvar alterações",
           aviso de pendencia nomeando o item em edicao);
        2. depois de aplicar: botao volta a "Adicionar ...", aviso some, `editidx`
           volta a -1, `edops` fica vazio e os campos do formulario ficam em branco;
        3. o catalogo que chegou com o preset e exatamente o do preset;
        4. e a prova que importa: cadastrar um item logo depois ACRESCENTA, em vez de
           sobrescrever o item de indice 1. Na `main` este passo destroi o item.
     B. RECARGA -- o caminho de ontem, que NAO pode regredir: com um item em edicao e
        dois opcionais nao salvos, recarregar devolve tudo (botao, aviso, campos,
        `edops` e `editidx`). E, desde 03/09/2026, um segundo turno: DIGITAR POR CIMA
        dos campos sem salvar e recarregar de novo -- todos os campos medidos em
        `*ProdSalvar`/`aPacSalvar` voltam com o que foi digitado, e o rotulo do botao
        e o aviso continuam falando do MESMO item. Na `main` de 03/09/2026 este turno
        falha: os campos voltam com o valor GRAVADO do item, e o que o dono digitou
        some sem aviso nenhum.
     C. ESTADO ANTIGO -- a prova de que a chave `form` e ACRESCIMO: apagando-a do
        estado gravado (que e exatamente o que um backup de ontem tem), a ferramenta
        abre no comportamento de ontem -- campos vindos do item gravado, `edops` e
        `editidx` de pe --, sem alerta, sem barra vermelha e sem erro de console. E,
        na aba Agendamento por pacote, o caso vizinho: `form` apontando para uma
        FAMILIA que nao existe mais nao pode deixar o seletor em branco.
     D. O BACKUP EM ARQUIVO, pelos botoes de verdade: "Exportar tudo" com os dados,
        apagar a chave `form` do arquivo (que e o que um backup anterior a 03/09/2026
        tem) e importa-lo de volta por "Importar de um arquivo...". A conferencia da
        importacao (`fcxConformar`, molde tirado do `coleta()` de cada aba) nao pode
        contar NENHUM item a mais como "nao reconhecido" por causa da chave que falta --
        e a comparacao e contra o MESMO arquivo sem apagar nada, medida na propria tela
        de confirmacao. Cobre tambem a outra metade da regra: o arquivo mostra que os
        PRESETS nao levam `form` (fcPresetCapturar o tira) e que o RASCUNHO leva.

   NAO E CODIGO DO SITE. Utilitario de linha de comando, roda em Node.
   Uso:  node scripts/verificar/preset-formulario.mjs  [raiz]
   (a raiz serve para apontar uma ARVORE DE REFERENCIA -- por exemplo um `git
   worktree` da `main` -- e ver o defeito falhar la.)
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navegador, servir, abrir, set, clicar, radio as marcarRadio, alertas } from './lib.mjs';
import { IDENT } from './cenario.mjs';
import { chk, resumo } from './pagina.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(AQUI, '..', '..');
const PORTA = 8819;

const espera = ms => new Promise(r => setTimeout(r, ms));
/* As tres abas remontam a previa com debounce de ~400 ms; 900 ms da folga sem tornar o
   teste lento. Nenhuma verificacao daqui depende da previa, mas ler o localStorage no meio
   de um debounce ja produziu falso negativo neste projeto. */
const PAUSA = 900;

/* Os tres nomes de item que o cenario usa. 'Beta' e o de indice 1 -- o que o formulario
   fica editando, e o que a `main` sobrescreve. */
const ALFA = 'Alfa', BETA = 'Beta', GAMA = 'Gama', DELTA = 'Delta';

const ABAS = [
  {
    pref: 'u', nome: 'Checkout', botao: 'aba-uni',
    lista: 'u-prod-lista', salvar: 'u-prod-salvar', pendente: 'u-op-pendente',
    campoNome: 'u-pnome', catalogo: 'prods',
    rotAdd: 'Adicionar produto', rotEdit: 'Salvar alterações',
    /* OS CAMPOS DO FORMULARIO: [tipo, id, o que se digita, como ele fica ZERADO].
       A lista e a de `uProdSalvar` -- e ele quem decide o que compoe um produto. */
    form: [['c', 'u-pnome', 'Beta rebatizado', ''],
           ['c', 'u-pdesc', 'Descricao a meio de escrever', ''],
           ['c', 'u-ppreco', '777', ''],
           ['r', 'u-opsel', 'multiplo', 'unico'],
           ['r', 'u-opnenhum', 'sim', 'nao'],
           ['r', 'u-pqtd', 'sim', 'nao']],
    preparar: async () => {},
    novo: async (pg, nome) => {
      await set(pg, 'u-pnome', nome); await set(pg, 'u-ppreco', '420');
      await clicar(pg, 'u-prod-salvar');
    },
    opcional: async (pg, nome, preco) => {
      await set(pg, 'u-op-nome', nome); await set(pg, 'u-op-preco', preco);
      await clicar(pg, 'u-op-add');
    }
  },
  {
    pref: 'm', nome: 'Mini loja', botao: 'aba-loja',
    lista: 'm-prod-lista', salvar: 'm-prod-salvar', pendente: 'm-op-pendente',
    campoNome: 'm-pnome', catalogo: 'prods',
    rotAdd: 'Adicionar produto', rotEdit: 'Salvar alterações',
    /* Lista de `mProdSalvar`: dois campos a mais que o Checkout (categoria e foto). */
    form: [['c', 'm-pnome', 'Beta rebatizado', ''],
           ['c', 'm-pdesc', 'Descricao a meio de escrever', ''],
           ['c', 'm-ppreco', '777', ''],
           ['c', 'm-pcat', 'Albuns', ''],
           ['c', 'm-pimg', 'https://storage.alboom.ninja/beta-trocada.jpg', ''],
           ['r', 'm-opsel', 'multiplo', 'unico'],
           ['r', 'm-opnenhum', 'sim', 'nao'],
           ['r', 'm-pqtd', 'sim', 'nao']],
    preparar: async () => {},
    novo: async (pg, nome) => {
      await set(pg, 'm-pnome', nome); await set(pg, 'm-ppreco', '890');
      /* host da Alboom de proposito: foto que nao passa pelo redimensionador abre um
         confirm, e teste que depende de confirm mede o dublê, nao a ferramenta */
      await set(pg, 'm-pimg', 'https://storage.alboom.ninja/' + nome.toLowerCase() + '.jpg');
      await clicar(pg, 'm-prod-salvar');
    },
    opcional: async (pg, nome, preco) => {
      await set(pg, 'm-op-nome', nome); await set(pg, 'm-op-preco', preco);
      await clicar(pg, 'm-op-add');
    }
  },
  {
    pref: 'a', nome: 'Agendamento por pacote', botao: 'aba-pac',
    lista: 'a-pac-lista', salvar: 'a-pac-salvar', pendente: 'a-op-pendente',
    campoNome: 'a-pnome', catalogo: 'pacotes',
    rotAdd: 'Adicionar pacote', rotEdit: 'Salvar alterações',
    /* Lista de `aPacSalvar`. O ultimo e um <select>: a SEGUNDA familia so existe porque
       `preparar` a cria -- com uma familia so, "o seletor voltou certo" nao prova nada. */
    form: [['c', 'a-pcod', 'BETA-TROCADO', ''],
           ['c', 'a-pnome', 'Beta rebatizado', ''],
           ['c', 'a-pdur', '2 horas', ''],
           ['c', 'a-ppreco', '777', ''],
           ['c', 'a-pinclui', '20 fotos tratadas', ''],
           ['c', 'a-ppath', 'https://tidycal.com/fotocerta/beta-trocado', ''],
           ['c', 'a-pfam', 'F2', 'F1']],
    preparar: async pg => {
      await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
      await set(pg, 'a-fam-nome', 'Fim de semana');
      await clicar(pg, 'a-fam-add');
    },
    novo: async (pg, nome) => {
      await set(pg, 'a-pcod', nome.toUpperCase()); await set(pg, 'a-pnome', nome);
      await set(pg, 'a-pdur', '1 hora'); await set(pg, 'a-ppreco', '420');
      await set(pg, 'a-pinclui', '10 fotos tratadas');
      await set(pg, 'a-ppath', 'fotocerta/' + nome.toLowerCase());
      await clicar(pg, 'a-pac-salvar');
    },
    opcional: async (pg, nome, preco) => {
      await set(pg, 'a-op-nome', nome); await set(pg, 'a-op-preco', preco);
      await clicar(pg, 'a-op-add');
    }
  }
];

/* O que esta GRAVADO: localStorage, e nao a variavel da pagina. E o que sobrevive a
   recarga, e e o que o operador tem a perder. */
const gravado = (pg, pref, chave) => pg.evaluate(([p, c]) => {
  const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
  const o = st[p] || {};
  return {
    itens: (o[c] || []).map(x => x.nome),
    edops: (o.edops || []).map(x => x.nome),
    editidx: (typeof o.editidx === 'number') ? o.editidx : null
  };
}, [pref, chave]);

/* O que a TELA esta dizendo: o rotulo do botao (que e quem decide se o proximo clique
   acrescenta ou sobrescreve), o aviso de pendencia e o campo de nome do formulario. */
const tela = (pg, aba) => pg.evaluate(([salvar, pendente, campoNome]) => {
  const b = document.getElementById(salvar);
  const p = document.getElementById(pendente);
  const n = document.getElementById(campoNome);
  return {
    botao: b ? b.textContent : null,
    avisoVisivel: !!(p && p.style.display !== 'none'),
    avisoTexto: p ? p.textContent : '',
    nome: n ? n.value : null
  };
}, [aba.salvar, aba.pendente, aba.campoNome]);

/* Digita nos campos do formulario (indice 2 da tabela) e le de volta o que esta neles.
   O radio e lido pelo :checked, e nao pelo id: o que importa e a opcao MARCADA. */
async function preencherForm(pg, aba) {
  for (const d of aba.form) {
    if (d[0] === 'r') await marcarRadio(pg, d[1], d[2]);
    else await set(pg, d[1], d[2]);
  }
}
const lerForm = (pg, aba) => pg.evaluate(defs => {
  const o = {};
  for (const d of defs) {
    if (d[0] === 'r') {
      const r = document.querySelector('input[name="' + d[1] + '"]:checked');
      o[d[1]] = r ? r.value : '';
    } else {
      const el = document.getElementById(d[1]);
      o[d[1]] = el ? el.value : null;
    }
  }
  return o;
}, aba.form);
/* Devolve a lista de campos que NAO estao no valor esperado (indice 2 = digitado,
   3 = zerado). Lista, e nao um booleano: quando falha, o que se quer ler e QUAL campo. */
const forades = (aba, lidos, idx) => aba.form
  .filter(d => lidos[d[1]] !== d[idx])
  .map(d => d[1] + '=' + JSON.stringify(lidos[d[1]]) + ' (esperado ' + JSON.stringify(d[idx]) + ')');

/* `abrir` instala a captura de alertas DEPOIS da carga, e uma recarga a leva embora -- e
   um alerta disparado durante a restauracao acontece antes de qualquer reinstalacao. Isto
   arma a captura ANTES de cada navegacao, que e a unica forma de medir "abriu sem alerta". */
const armarAlertas = pg => pg.addInitScript(() => {
  window.__alertas = [];
  window.alert = m => { window.__alertas.push(String(m)); };
  window.confirm = () => true;
  window.open = () => null;
});

/* O estado gravado, cru -- para apagar dele a chave `form` e simular um backup de ontem. */
const estadoCru = pg => pg.evaluate(() => JSON.parse(localStorage.getItem('fcConstrutores') || '{}'));
const gravarCru = (pg, st) => pg.evaluate(st => {
  localStorage.setItem('fcConstrutores', JSON.stringify(st));
}, st);
/* A barra vermelha de falha (fcBarra) so existe no DOM depois de uma falha acontecer. */
const barraVermelha = pg => pg.evaluate(() => {
  const b = document.getElementById('fc-falhas');
  return b ? (document.getElementById('fc-falhas-lista') || b).textContent : '';
});

/* Clica o lapis da linha `i` da lista. Por TITULO e nao por posicao dentro da linha: as
   tres abas montam a barra de botoes em ordens diferentes, e um seletor por indice mediria
   o botao errado sem falhar. */
const editarLinha = (pg, lista, i) => pg.evaluate(([lista, i]) => {
  const bs = document.querySelectorAll('#' + lista + ' button[title="Editar"]');
  if (!bs[i]) throw new Error('sem lapis na linha ' + i + ' de ' + lista);
  bs[i].click();
  return true;
}, [lista, i]);

/* Os modais da ferramenta (fcgPerguntar) sao <div class="fcg-modal"> com os botoes em
   .acoes. Clica o PRIMEIRO rotulo da lista que existir -- a tela de importacao troca
   "Importar" por "Substituir os que ja existem" quando ha colisao de nome. */
const modalClicar = (pg, rotulos) => pg.evaluate(rs => {
  const bs = document.querySelectorAll('.fcg-modal .acoes button');
  const ha = Array.prototype.map.call(bs, b => b.textContent.trim());
  for (const r of rs) for (const b of bs) if (b.textContent.trim() === r) { b.click(); return r; }
  throw new Error('nenhum de [' + rs.join(' / ') + '] no modal; ha: ' + ha.join(' / '));
}, rotulos);
const modalTexto = pg => pg.evaluate(() => {
  const m = document.querySelector('.fcg-modal .fcg-cx');
  return m ? m.textContent : '';
});
/* Quantos itens a tela de confirmacao diz que NAO foram reconhecidos. -1 = a frase nem
   aparece, que e o caso bom. */
const descartados = txt => {
  const m = /([0-9]+) item\(ns\) do arquivo N\u00c3O foram reconhecidos/.exec(txt);
  return m ? parseInt(m[1], 10) : -1;
};

const salvarPreset = async (pg, pref, nome) => {
  await set(pg, 'fcp-' + pref + '-nome', nome);
  await clicar(pg, 'fcp-' + pref + '-salvar');
};
const aplicarPreset = (pg, pref, i) => pg.evaluate(([pref, i]) => {
  const bs = document.querySelectorAll('#fcp-' + pref + '-lista [data-fc-aplicar]');
  if (!bs[i]) throw new Error('sem preset ' + i + ' na biblioteca de ' + pref);
  bs[i].click();
  return true;
}, [pref, i]);

/* O cenario comum aos dois caminhos: catalogo com Alfa e Beta, o item 1 (Beta) em edicao
   e dois opcionais digitados e NAO salvos. */
async function montarCenario(pg, aba) {
  for (const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
  await clicar(pg, aba.botao);
  await aba.preparar(pg);
  await aba.novo(pg, ALFA);
  await aba.novo(pg, BETA);
  await espera(PAUSA);
  await editarLinha(pg, aba.lista, 1);
  await aba.opcional(pg, 'Moldura', '50');
  await aba.opcional(pg, 'Pendrive', '80');
  await espera(PAUSA);
}

const servidor = await servir(RAIZ, PORTA);
const browser = await navegador();
console.log('arvore sob teste: ' + RAIZ);

for (const aba of ABAS) {
  console.log('\n' + aba.nome + ' -- A. aplicar um preset');
  let pg = await abrir(browser, 'http://127.0.0.1:' + PORTA);
  if (!(await pg.$('#' + aba.botao))) {
    chk(aba.nome + ': a aba existe nesta arvore', false, 'sem #' + aba.botao);
    await pg.close();
    continue;
  }
  for (const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
  await clicar(pg, aba.botao);
  await aba.preparar(pg);

  /* catalogo do PRESET: Alfa e Beta */
  await aba.novo(pg, ALFA);
  await aba.novo(pg, BETA);
  await espera(PAUSA);
  await salvarPreset(pg, aba.pref, 'Cenario A');
  const noPreset = (await gravado(pg, aba.pref, aba.catalogo)).itens.join(',');
  chk(aba.nome + ': o preset guardou o catalogo Alfa,Beta', noPreset === ALFA + ',' + BETA, noPreset);

  /* catalogo da TELA: um terceiro item, para o preset trazer um catalogo diferente */
  await aba.novo(pg, GAMA);
  await espera(PAUSA);
  /* item 1 (Beta) em edicao, com dois opcionais digitados e nao salvos */
  await editarLinha(pg, aba.lista, 1);
  await aba.opcional(pg, 'Moldura', '50');
  await aba.opcional(pg, 'Pendrive', '80');
  /* e o formulario inteiro digitado por cima, que e o que 'form' guarda */
  await preencherForm(pg, aba);
  await espera(PAUSA);

  /* ---- ANTES: o cenario e mesmo o do defeito ---- */
  const antesT = await tela(pg, aba);
  const antesG = await gravado(pg, aba.pref, aba.catalogo);
  chk(aba.nome + ': ANTES o botao diz "' + aba.rotEdit + '"', antesT.botao === aba.rotEdit, antesT.botao);
  chk(aba.nome + ': ANTES o aviso de pendencia nomeia "' + BETA + '"',
      antesT.avisoVisivel && antesT.avisoTexto.indexOf(BETA) >= 0,
      antesT.avisoVisivel + ' | ' + antesT.avisoTexto);
  chk(aba.nome + ': ANTES o formulario aponta para o indice 1 com 2 opcionais',
      antesG.editidx === 1 && antesG.edops.length === 2, JSON.stringify(antesG));

  /* ---- APLICAR ---- */
  await aplicarPreset(pg, aba.pref, 0);
  await espera(PAUSA);
  const depT = await tela(pg, aba);
  const depG = await gravado(pg, aba.pref, aba.catalogo);
  chk(aba.nome + ': DEPOIS o botao volta a "' + aba.rotAdd + '"', depT.botao === aba.rotAdd, depT.botao);
  chk(aba.nome + ': DEPOIS o aviso de pendencia some', !depT.avisoVisivel, depT.avisoTexto);
  chk(aba.nome + ': DEPOIS o campo de nome do formulario fica em branco', depT.nome === '', JSON.stringify(depT.nome));
  const depF = forades(aba, await lerForm(pg, aba), 3);
  chk(aba.nome + ': DEPOIS TODOS os ' + aba.form.length + ' campos do formulario voltam ao padrao',
      depF.length === 0, depF.join(' | '));
  chk(aba.nome + ': DEPOIS editidx volta a -1 e edops fica vazio',
      depG.editidx === -1 && depG.edops.length === 0, JSON.stringify(depG));
  chk(aba.nome + ': DEPOIS o catalogo e o do preset (Alfa,Beta)',
      depG.itens.join(',') === ALFA + ',' + BETA, depG.itens.join(','));

  /* ---- a prova que importa: o proximo cadastro ACRESCENTA, nao sobrescreve ---- */
  await aba.novo(pg, DELTA);
  await espera(PAUSA);
  const fim = await gravado(pg, aba.pref, aba.catalogo);
  chk(aba.nome + ': cadastrar depois de aplicar ACRESCENTA (nenhum item do catalogo novo e alterado)',
      fim.itens.join(',') === [ALFA, BETA, DELTA].join(','), fim.itens.join(','));
  chk(aba.nome + ': sem erro de console (aplicar preset)', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();

  /* ================= B. o caminho da RECARGA, que nao pode regredir ================= */
  console.log(aba.nome + ' -- B. recarregar a ferramenta');
  pg = await abrir(browser, 'http://127.0.0.1:' + PORTA);
  await montarCenario(pg, aba);
  const preT = await tela(pg, aba);
  chk(aba.nome + ': antes da recarga o formulario esta editando "' + BETA + '"',
      preT.botao === aba.rotEdit && preT.nome === BETA, JSON.stringify(preT));

  await pg.reload();
  await espera(PAUSA);
  await clicar(pg, aba.botao);   /* a aba visivel nao e restaurada; o estado dela e */
  const posT = await tela(pg, aba);
  const posG = await gravado(pg, aba.pref, aba.catalogo);
  chk(aba.nome + ': RECARGA devolve o botao "' + aba.rotEdit + '"', posT.botao === aba.rotEdit, posT.botao);
  chk(aba.nome + ': RECARGA devolve o aviso de pendencia nomeando "' + BETA + '"',
      posT.avisoVisivel && posT.avisoTexto.indexOf(BETA) >= 0,
      posT.avisoVisivel + ' | ' + posT.avisoTexto);
  chk(aba.nome + ': RECARGA devolve o item em edicao ao formulario', posT.nome === BETA, posT.nome);
  chk(aba.nome + ': RECARGA devolve os dois opcionais nao salvos e o indice 1',
      posG.editidx === 1 && posG.edops.join(',') === 'Moldura,Pendrive', JSON.stringify(posG));
  chk(aba.nome + ': RECARGA nao alterou o catalogo', posG.itens.join(',') === ALFA + ',' + BETA, posG.itens.join(','));
  chk(aba.nome + ': sem erro de console (recarga)', pg.erros.length === 0, pg.erros.join(' | '));

  /* ---- segundo turno: DIGITAR POR CIMA e recarregar de novo ----
     E aqui que o defeito de 03/09/2026 aparece: ate hoje `form` nao existia, e o que o
     dono digitava no formulario sem salvar sumia na recarga -- os campos voltavam com o
     valor GRAVADO do item, calados. */
  await preencherForm(pg, aba);
  await espera(PAUSA);
  const digT = forades(aba, await lerForm(pg, aba), 2);
  chk(aba.nome + ': o formulario aceitou os ' + aba.form.length + ' campos digitados', digT.length === 0, digT.join(' | '));

  await pg.reload();
  await espera(PAUSA);
  await clicar(pg, aba.botao);
  const volF = forades(aba, await lerForm(pg, aba), 2);
  const volT = await tela(pg, aba);
  const volG = await gravado(pg, aba.pref, aba.catalogo);
  chk(aba.nome + ': RECARGA devolve os ' + aba.form.length + ' campos DIGITADOS do formulario',
      volF.length === 0, volF.join(' | '));
  /* COERENCIA: o texto que voltou e o rotulo do botao tem de falar do mesmo item. Campo
     restaurado com o botao dizendo outra coisa e pior que campo perdido. */
  chk(aba.nome + ': e o botao continua em "' + aba.rotEdit + '", apontando para o indice 1',
      volT.botao === aba.rotEdit && volG.editidx === 1, volT.botao + ' | editidx=' + volG.editidx);
  chk(aba.nome + ': e o aviso de pendencia continua nomeando o item GRAVADO ("' + BETA + '")',
      volT.avisoVisivel && volT.avisoTexto.indexOf(BETA) >= 0, volT.avisoTexto);
  chk(aba.nome + ': RECARGA (2o turno) nao alterou o catalogo',
      volG.itens.join(',') === ALFA + ',' + BETA, volG.itens.join(','));
  chk(aba.nome + ': sem erro de console (recarga com campos digitados)', pg.erros.length === 0, pg.erros.join(' | '));
  await pg.close();

  /* ============ C. ESTADO ANTIGO, sem a chave `form` ============
     A prova de que isto e ACRESCIMO e nao mudanca de formato: apagar `form` do estado
     gravado deixa exatamente o backup de ontem. Ele tem de abrir no comportamento de
     ontem -- os campos vindos do item GRAVADO --, sem alerta, sem barra vermelha e sem
     erro de console. */
  console.log(aba.nome + ' -- C. estado antigo, sem a chave "form"');
  pg = await abrir(browser, 'http://127.0.0.1:' + PORTA);
  await armarAlertas(pg);
  await montarCenario(pg, aba);
  await preencherForm(pg, aba);
  await espera(PAUSA);
  let st = await estadoCru(pg);
  const tinha = !!(st[aba.pref] && st[aba.pref].form);
  chk(aba.nome + ': o estado GRAVADO passou a trazer a chave "form"', tinha, Object.keys(st[aba.pref] || {}).join(','));
  delete st[aba.pref].form;
  await gravarCru(pg, st);
  await pg.reload();
  await espera(PAUSA);
  await clicar(pg, aba.botao);
  const antT = await tela(pg, aba);
  const antG = await gravado(pg, aba.pref, aba.catalogo);
  chk(aba.nome + ': SEM "form" a aba abre com o item gravado no formulario (comportamento de ontem)',
      antT.nome === BETA, JSON.stringify(antT.nome));
  chk(aba.nome + ': SEM "form" os opcionais e o indice continuam voltando',
      antG.editidx === 1 && antG.edops.join(',') === 'Moldura,Pendrive', JSON.stringify(antG));
  chk(aba.nome + ': SEM "form" o catalogo fica intacto', antG.itens.join(',') === ALFA + ',' + BETA, antG.itens.join(','));
  chk(aba.nome + ': SEM "form" nao ha alerta', (await alertas(pg)).length === 0, (await alertas(pg)).join(' | '));
  chk(aba.nome + ': SEM "form" nao ha barra vermelha', (await barraVermelha(pg)) === '', await barraVermelha(pg));
  chk(aba.nome + ': SEM "form" nao ha erro de console', pg.erros.length === 0, pg.erros.join(' | '));

  /* O caso vizinho, so na aba que tem <select>: `form` apontando para uma familia que ja
     nao existe. O seletor NAO pode ficar em branco -- aPacSalvar le o valor dele. */
  if (aba.pref === 'a') {
    st = await estadoCru(pg);
    st.a.form = st.a.form || {};
    st.a.form.a_pfam = 'F99';
    await gravarCru(pg, st);
    await pg.reload();
    await espera(PAUSA);
    await clicar(pg, aba.botao);
    const fam = await pg.evaluate(() => document.getElementById('a-pfam').value);
    chk(aba.nome + ': familia gravada que nao existe mais cai na primeira, e nao em branco',
        fam === 'F1', JSON.stringify(fam));
    chk(aba.nome + ': e nao ha erro de console nesse caminho', pg.erros.length === 0, pg.erros.join(' | '));
  }
  await pg.close();
}

/* ============================================================================
   D. O BACKUP EM ARQUIVO -- exportar, apagar a chave `form`, importar de volta
   ============================================================================ */
console.log('\nD. o backup em arquivo, sem a chave "form"');
try {
  const pg = await abrir(browser, 'http://127.0.0.1:' + PORTA);
  await armarAlertas(pg);
  for (const aba of ABAS) {
    await montarCenario(pg, aba);
    await preencherForm(pg, aba);
    await salvarPreset(pg, aba.pref, 'Cenario D');
  }
  await espera(PAUSA);

  /* ---- exportar pelo botao de verdade ---- */
  const [baixado] = await Promise.all([
    pg.waitForEvent('download'),
    (async () => {
      await clicar(pg, 'fcx-tudo');
      await espera(400);
      await modalClicar(pg, ['Com os dados']);
    })()
  ]);
  const arq = JSON.parse(fs.readFileSync(await baixado.path(), 'utf8'));

  /* ---- o que o arquivo leva, e o que ele NAO leva ---- */
  const semForm = [], comForm = [];
  for (const aba of ABAS) {
    const r = (arq.rascunho || {})[aba.pref] || {};
    (r.form ? comForm : semForm).push(aba.pref);
  }
  chk('o RASCUNHO do arquivo leva o formulario inacabado das tres abas',
      semForm.length === 0, 'sem form: ' + semForm.join(','));
  const presetsComForm = [];
  for (const id of Object.keys(arq.presetsDeAba || {})) {
    for (const it of arq.presetsDeAba[id] || []) {
      for (const k of Object.keys(it.valores || {})) {
        if (it.valores[k] && it.valores[k].form !== undefined) presetsComForm.push(id + '/' + it.nome);
      }
    }
  }
  chk('e NENHUM preset de aba do arquivo leva o formulario (fcPresetCapturar o tira)',
      presetsComForm.length === 0, presetsComForm.join(' | '));

  /* ---- a medida de referencia: o MESMO arquivo, sem apagar nada ---- */
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-form-'));
  const arqAtual = path.join(dir, 'atual.json');
  fs.writeFileSync(arqAtual, JSON.stringify(arq, null, 2));
  await pg.setInputFiles('#fcx-arquivo', arqAtual);
  await espera(800);
  const txtAtual = await modalTexto(pg);
  const dAtual = descartados(txtAtual);
  chk('o arquivo recem-exportado nao tem item nao reconhecido', dAtual === -1, 'descartados=' + dAtual);
  await modalClicar(pg, ['Cancelar']);
  await espera(300);

  /* ---- e agora o arquivo ANTIGO: sem a chave `form` em aba nenhuma ---- */
  for (const aba of ABAS) delete arq.rascunho[aba.pref].form;
  const arqAntigo = path.join(dir, 'antigo.json');
  fs.writeFileSync(arqAntigo, JSON.stringify(arq, null, 2));
  await pg.setInputFiles('#fcx-arquivo', arqAntigo);
  await espera(800);
  const txtAntigo = await modalTexto(pg);
  const dAntigo = descartados(txtAntigo);
  chk('o arquivo SEM "form" nao produz nenhum item nao reconhecido a mais',
      dAntigo === dAtual, 'antigo=' + dAntigo + ' atual=' + dAtual);
  chk('e a confirmacao continua oferecendo o rascunho do arquivo',
      txtAntigo.indexOf('o rascunho') >= 0, txtAntigo.substring(0, 300));

  await modalClicar(pg, ['Substituir os que já existem', 'Importar']);
  await espera(400);
  await modalClicar(pg, ['Substituir a tela pelo rascunho do arquivo']);
  await espera(PAUSA);

  /* O UNICO alerta esperado e o resumo de sucesso da propria importacao. "Sem alerta" seria
     a afirmacao errada: o que nao pode aparecer e alerta de FALHA ou de item descartado. */
  const avD = await alertas(pg);
  chk('importar o arquivo antigo alerta so o resumo de sucesso',
      avD.length === 1 && avD[0].indexOf('Importa\u00e7\u00e3o conclu\u00edda.') === 0 &&
      avD[0].indexOf('O rascunho do arquivo foi aplicado na tela.') > 0,
      avD.join(' | '));
  chk('importar o arquivo antigo nao acende a barra vermelha', (await barraVermelha(pg)) === '', await barraVermelha(pg));
  chk('importar o arquivo antigo nao gera erro de console', pg.erros.length === 0, pg.erros.join(' | '));

  for (const aba of ABAS) {
    await clicar(pg, aba.botao);
    await espera(300);
    const t = await tela(pg, aba);
    const g = await gravado(pg, aba.pref, aba.catalogo);
    chk(aba.nome + ': o catalogo do arquivo antigo chegou inteiro',
        g.itens.join(',') === ALFA + ',' + BETA, g.itens.join(','));
    chk(aba.nome + ': os opcionais e o indice do formulario tambem',
        g.editidx === 1 && g.edops.join(',') === 'Moldura,Pendrive', JSON.stringify(g));
    chk(aba.nome + ': e o formulario abre com o item GRAVADO (comportamento de ontem)',
        t.nome === BETA && t.botao === aba.rotEdit, JSON.stringify(t.nome) + ' | ' + t.botao);
  }
  fs.rmSync(dir, { recursive: true, force: true });
  await pg.close();
} catch (e) { chk('o roteiro do backup em arquivo rodou ate o fim', false, String(e.message || e)); }

await browser.close();
servidor.close();
process.exit(resumo());
