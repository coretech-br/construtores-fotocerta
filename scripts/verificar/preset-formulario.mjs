/* ============================================================================
   O FORMULARIO DE CADASTRO NOS DOIS CAMINHOS: recarga x aplicar preset
   ============================================================================
   POR QUE ISTO EXISTE. As tres abas com catalogo (Checkout, Mini loja e Agendamento
   por pacote) guardam o FORMULARIO INACABADO -- os opcionais digitados e ainda nao
   salvos (`edops`) e o indice do item em edicao (`editidx`). As duas chaves entram
   pelo mesmo lugar em que TUDO entra nessas abas: o `restaura()` da aba. E esse
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
        `edops` e `editidx`).

   NAO E CODIGO DO SITE. Utilitario de linha de comando, roda em Node.
   Uso:  node scripts/verificar/preset-formulario.mjs  [raiz]
   (a raiz serve para apontar uma ARVORE DE REFERENCIA -- por exemplo um `git
   worktree` da `main` -- e ver o defeito falhar la.)
   ============================================================================ */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navegador, servir, abrir, set, clicar } from './lib.mjs';
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
    preparar: async pg => { await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado'); },
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

/* Clica o lapis da linha `i` da lista. Por TITULO e nao por posicao dentro da linha: as
   tres abas montam a barra de botoes em ordens diferentes, e um seletor por indice mediria
   o botao errado sem falhar. */
const editarLinha = (pg, lista, i) => pg.evaluate(([lista, i]) => {
  const bs = document.querySelectorAll('#' + lista + ' button[title="Editar"]');
  if (!bs[i]) throw new Error('sem lapis na linha ' + i + ' de ' + lista);
  bs[i].click();
  return true;
}, [lista, i]);

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
  await pg.close();
}

await browser.close();
servidor.close();
process.exit(resumo());
