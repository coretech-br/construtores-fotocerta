/* ============================================================================
   A DESCRICAO DE CADA ITEM OPCIONAL (13/09/2026)
   ============================================================================
   O PEDIDO, nas palavras do dono: "Nos opcionais dos produtos, hoje eu cadastro o
   nome e o valor. Eu gostaria tambem de poder cadastrar uma descricao de cada item
   opcional e que ela aparecesse sem destaque, como na descricao curta do produto."

   AS DUAS DECISOES DELE, que este arquivo existe para travar:
     1. A descricao aparece SO NA HORA DE ESCOLHER -- na lista de opcionais. No
        CARRINHO continuam so o nome e o valor. O carrinho existe para ser conferido
        contra o total, e texto cinza repetido ali o afasta da vista. Este e o ponto
        cujo defeito seria SILENCIOSO: nada quebra, a conta continua certa, e so o
        olho do dono na pagina publicada perceberia.
     2. Texto longo QUEBRA EM VARIAS LINHAS, nao corta com reticencias. Nada some, e
        quem controla o tamanho e o dono, escrevendo menos.

   O QUE A REGRESSAO BYTE A BYTE NAO ALCANCA, e por isso este arquivo existe. Ela
   compara TEXTO gerado com a descricao VAZIA (a fabrica) -- e e exatamente isso que
   ela tem de provar: campo em branco, nenhuma saida muda um byte. O ramo em que a
   descricao EXISTE nao entra na fotografia, porque poe-lo la faria a passagem
   configurada deixar de ser comparavel contra `main`. Entao ele e medido AQUI, com o
   bloco RODANDO numa pagina de verdade -- que e a prova mais forte das duas para este
   campo: ela ve onde o texto cai na tela, e nao so que ele saiu no codigo.

   A ARMADILHA DE MEDICAO, ja paga em 13/09/2026 por linha-de-dinheiro.mjs: a ALTURA
   DA CAIXA nao responde "quebrou em quantas linhas?". Item de flex estica sozinho
   (align-items:stretch), e a caixa fica da altura da linha inteira mesmo com o texto
   numa linha so. A medida certa e quantos FRAGMENTOS DE LINHA o texto ocupa -- um
   Range sobre o conteudo devolve um retangulo por linha.

   A LARGURA E 375 CSS px, o aparelho do dono. Foi onde ele viu o ultimo problema de
   layout, e medir num quadro largo seria a pergunta errada com a resposta correta.

   Uso:  node scripts/verificar/descricao-opcionais.mjs [ref]     (padrao: main)
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gerarNaFerramenta, comBlocoNaPagina, textoSemScripts, chk, resumo } from './pagina.mjs';
import { preparar, conteudo } from './cenario.mjs';
import { set, radio, clicar, marcar } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';
const LARGURA = 375;   /* iPhone XS, o aparelho do dono */

/* AS TRES DESCRICOES. A curta e a frase do print que o dono mandou. A longa nao e
   "a curta repetida": ela precisa passar da largura da coluna a 375px para que a
   quebra seja a MEDIDA, e nao um acidente da fonte do dia. A hostil traz os quatro
   caminhos de escape de uma vez -- apostrofa (o literal do bloco e de aspas simples),
   barra invertida, aspas duplas, acento, '<' e a sequencia '</script', que o Manual do
   Prosite manda blindar: se um deles escapar, o literal fecha no meio e o bloco
   inteiro nao carrega -- em silencio, na pagina publicada. */
const CURTA  = 'Sessao de ate 45 minutos (apenas reserva, nao inclui fotos)';
const LONGA  = 'Inclui o album impresso em capa dura com 20 paginas, revisao de cores '
             + 'folha a folha, caixa rigida para transporte e entrega em ate quinze dias '
             + 'uteis contados a partir da sua aprovacao final das fotos escolhidas.';
const HOSTIL = 'Album "fine art" \\ 100% — não é </script> e it\'s ok';

/* O SEGUNDO opcional de cada item fica SEM descricao, sempre. Nao e economia: o bloco
   tem de desenhar a linha de quem tem e NAO desenhar nada para quem nao tem, e as duas
   coisas na mesma passagem sao o unico jeito de a segunda ser medida. */
const OPS = desc => [
  { nome: 'Album extra',  preco: '80',  desc },
  { nome: 'Making of',    preco: '150', desc: '' }
];

/* ---------------------------------------------------------------- gerar os blocos */
/* Clica o lapis da linha `i` de uma lista. Por TITULO e nao por posicao: a faixa de
   botoes ja mudou de ordem uma vez neste projeto, e um seletor por indice mediria o
   botao errado sem falhar. */
const lapis = (pg, lista, i) => pg.evaluate(([lista, i]) => {
  const bs = document.querySelectorAll('#' + lista + ' button[title="Editar"]');
  if (!bs[i]) throw new Error('sem lapis na linha ' + i + ' de ' + lista);
  bs[i].click();
}, [lista, i]);

async function cadastrarOps(pg, pref, ops) {
  for (const o of ops) {
    await set(pg, pref + '-op-nome', o.nome);
    await set(pg, pref + '-op-preco', o.preco);
    if (o.desc) await set(pg, pref + '-op-desc', o.desc);
    await clicar(pg, pref + '-op-add');
  }
}

/* Os tres blocos, com a descricao pedida (ou sem nenhuma, quando `desc` e vazio).
   O CENARIO BASE E O DA CASA (cenario.mjs): produtos, pacotes, familias e cupons saem
   de la, e nao de uma segunda lista escrita aqui -- cenario escrito duas vezes e a
   mesma armadilha do codigo escrito duas vezes.
   SO PIX nas tres abas: com a rede externa bloqueada (e ela e bloqueada de proposito),
   o SDK do PayPal nunca chega, e o erro de rede viraria ruido que nao diz nada sobre o
   que esta sob teste. O resumo copiavel do Checkout entra LIGADO: e la que a decisao 1
   do dono pode ser quebrada em silencio. */
async function gerarBlocos(desc, porta) {
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg);

    await clicar(pg, 'aba-uni');
    await radio(pg, 'u-metodo', 'pix');
    await radio(pg, 'u-resumo', 'sim');
    await lapis(pg, 'u-prod-lista', 0);
    await cadastrarOps(pg, 'u', OPS(desc));
    await clicar(pg, 'u-prod-salvar');
    await clicar(pg, 'u-gerar');

    await clicar(pg, 'aba-loja');
    await radio(pg, 'm-metodo', 'pix');
    await lapis(pg, 'm-prod-lista', 0);
    await cadastrarOps(pg, 'm', OPS(desc));
    await clicar(pg, 'm-prod-salvar');
    await clicar(pg, 'm-gerar');

    await clicar(pg, 'aba-pac');
    await radio(pg, 'a-metodo', 'pix');
    await lapis(pg, 'a-pac-lista', 0);
    await cadastrarOps(pg, 'a', OPS(desc));
    await clicar(pg, 'a-pac-salvar');
    await clicar(pg, 'a-gerar');
    await pg.waitForTimeout(120);
  }, ['u-out', 'm-out', 'a-out3'], { porta });
  chk('gerou os tres blocos sem alerta' + (desc ? '' : ' (sem descricao)'),
      r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('gerou os tres blocos sem erro de console' + (desc ? '' : ' (sem descricao)'),
      errosReais(r.erros).length === 0, r.erros.slice(0, 2).join(' | '));
  return r.valores;
}

/* O PRIMEIRO pacote do cenario ('MINI') e o que recebeu os opcionais acima.
   'quando' no FUTURO: prazo vencido troca a pagina inteira pelo cartao de recusa, e o
   teste mediria uma tela que nao e a que ele quer medir. */
const BUSCA_PAC = '?pac=MINI&data=' + encodeURIComponent('10/05/2030')
  + '&hora=' + encodeURIComponent('14:00')
  + '&quando=' + encodeURIComponent('2030-05-10T14:00:00Z');

/* ---------------------------------------------------------------- a medicao comum */
/* Para cada linha de opcional: o nome que o cliente le, se o IRMAO SEGUINTE e a
   descricao, o texto dela, a posicao (DOM e pixel) e quantos fragmentos de linha ela
   ocupa. Uma funcao so para as tres abas -- o que muda e o par de seletores. */
const lerOpcionais = (pg, selRow, selDesc) => pg.evaluate(([selRow, selDesc]) => {
  const classe = selDesc.replace(/^\./, '');
  return Array.prototype.map.call(document.querySelectorAll(selRow), row => {
    const spans = row.querySelectorAll('label span');
    const nome = spans.length ? spans[spans.length - 1].textContent : '';
    const prox = row.nextElementSibling;
    const eh = !!(prox && prox.classList && prox.classList.contains(classe));
    if (!eh) return { nome, temDesc: false };
    const rr = row.getBoundingClientRect(), dr = prox.getBoundingClientRect();
    /* OS FRAGMENTOS DE LINHA, e nao a altura da caixa -- ver o cabecalho. Um Range
       sobre o conteudo devolve um retangulo por linha desenhada. */
    const r = document.createRange();
    r.selectNodeContents(prox);
    const cs = getComputedStyle(prox);
    return {
      nome, temDesc: true, desc: prox.textContent,
      /* A POSICAO NO DOM: a descricao vem DEPOIS da linha, e nao dentro dela. */
      depoisNoDom: !!(row.compareDocumentPosition(prox) & Node.DOCUMENT_POSITION_FOLLOWING),
      /* E a posicao NA TELA concorda com a do DOM: o topo dela nao sobe acima da base
         da linha. Sem esta segunda medida, um `position:absolute` poderia deixar o DOM
         certo e a tela errada. */
      abaixoNaTela: dr.top >= rr.bottom - 1,
      esquerda: dr.left, linhaEsquerda: rr.left,
      fragmentos: r.getClientRects().length,
      /* CORTADA? tres perguntas, porque ha tres jeitos de cortar sem erro nenhum. */
      reticencias: cs.textOverflow === 'ellipsis',
      semQuebra: cs.whiteSpace === 'nowrap' || cs.whiteSpace === 'pre',
      escondeu: prox.scrollHeight > prox.clientHeight + 1,
      corTexto: cs.color, tamanho: cs.fontSize
    };
  });
}, [selRow, selDesc]);

/* Quantas vezes um texto aparece na pagina VISIVEL (sem o texto-fonte dos <script>:
   armadilha 1 do molde). E o que responde "vazou para o carrinho?" sem depender de
   conhecer o nome da caixa do carrinho de cada aba. */
async function vezesNaTela(pg, agulha) {
  const t = await textoSemScripts(pg);
  return t.split(agulha).length - 1;
}

/* O RUIDO DE REDE NAO E ERRO DO BLOCO. O molde bloqueia tudo que nao seja o proprio
   servidor, de proposito, e cada recurso barrado vira uma linha de console que nao diz
   nada sobre o que esta sob teste -- as fotos da Mini loja sao o caso obvio. Mesma regra
   de sinal.mjs, escrita igual: se um dia ela mudar, muda nos dois pelo mesmo motivo. */
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|alboom\.ninja|storage\.|ERR_FAILED|Failed to load resource|net::ERR/i;
const errosReais = es => (es || []).filter(e => !EXTERNO.test(e));

console.log('medindo a ' + LARGURA + 'px -- a largura do aparelho do dono');

const comDesc = await gerarBlocos(CURTA, 8951);
const semDesc = await gerarBlocos('', 8952);
const longos  = await gerarBlocos(LONGA, 8953);
const hostis  = await gerarBlocos(HOSTIL, 8954);

/* =====================================================================
   0. O TEXTO GERADO: sem descricao, nada do recurso entra no bloco
   =====================================================================
   E a mesma pergunta que a regressao byte a byte responde contra `main`, feita aqui de
   um jeito que continua valendo depois do merge -- quando `main` ja tiver o recurso e
   a comparacao com ela deixar de dizer alguma coisa sobre isto. */
console.log('\n[0] com o campo VAZIO, nem a regra de CSS nem o JS que a desenha saem');
for (const [rot, saida, marca] of [['Checkout', 'u-out', 'fcu-opdesc'],
                                   ['Mini loja', 'm-out', 'fcm-opdesc'],
                                   ['pac / obrigado', 'a-out3', 'fca-ob-opdesc']]) {
  chk(rot + ': sem descricao, a classe "' + marca + '" nao aparece no codigo gerado',
      semDesc[saida].indexOf(marca) < 0);
  chk(rot + ': sem descricao, nenhum "desc:" entra no array de opcionais',
      semDesc[saida].indexOf(", desc:'") < 0);
  chk(rot + ': COM descricao, a classe e o campo entram',
      comDesc[saida].indexOf(marca) > 0 && comDesc[saida].indexOf(", desc:'") > 0);
}

/* =====================================================================
   1..3. O BLOCO RODANDO: onde a descricao cai, e onde ela NAO cai
   ===================================================================== */
const ABAS = [
  { rot: 'Checkout', saida: 'u-out', raiz: '.fcuni', row: '.fcuni .fcu-op', desc: '.fcu-opdesc',
    porta: 8955,
    /* O Checkout desenha os opcionais assim que a pagina abre; o "carrinho" dele e o
       RESUMO COPIAVEL, e e nele que a decisao 1 do dono pode ser quebrada calada. */
    abrir: async () => {},
    carrinho: async pg => {
      await pg.click('label:has(input[name="fcu-prod"][value="0"])');
      await pg.waitForTimeout(200);
      return await pg.evaluate(() => {
        const t = document.querySelector('.fcuni .fcu-resumo');
        return { nome: 'resumo copiavel', texto: t ? t.value : null };
      });
    } },
  { rot: 'Mini loja', saida: 'm-out', raiz: '.fcmloja', row: '.fcmloja .fcm-op', desc: '.fcm-opdesc',
    porta: 8956,
    /* A loja e uma vitrine: o cartao de detalhe abre primeiro, e so nele existem os
       opcionais. Mesmo caminho de sinal.mjs e de linha-de-dinheiro.mjs. */
    abrir: async pg => { await pg.locator('.fcm-card').first().click(); await pg.waitForTimeout(200); },
    carrinho: async pg => {
      await pg.click('.fcm-op label');            /* marca o primeiro opcional */
      await pg.waitForTimeout(80);
      await pg.click('.fcm-add');
      await pg.waitForTimeout(250);
      const lido = await pg.evaluate(() => {
        const c = document.querySelector('.fcmloja .fcm-itens');
        return { nome: 'cesta', texto: c ? c.textContent : null };
      });
      /* ADICIONAR FECHA O CARTAO DE DETALHE -- e com ele some a lista de opcionais. Medido:
         sem reabrir, a contagem "a descricao aparece uma vez" daria ZERO, e o zero passaria
         por acerto. Reaberto, a cesta e a lista ficam VISIVEIS AO MESMO TEMPO, que e a unica
         tela em que "esta na lista e nao esta na cesta" pode ser medido de uma vez. */
      await pg.locator('.fcm-card').first().click();
      await pg.waitForTimeout(250);
      return lido;
    } },
  { rot: 'pac / obrigado', saida: 'a-out3', raiz: '.fca-ob-raiz', row: '.fca-ob-op',
    desc: '.fca-ob-opdesc', porta: 8957, busca: BUSCA_PAC,
    abrir: async () => {},
    /* Nao ha carrinho aqui: o pacote e fixo. O que faz as vezes dele e o COPIA E COLA
       do Pix, que e o texto que o cliente leva para o banco -- e onde uma descricao
       vazada apareceria dentro de um payload de pagamento. */
    carrinho: async pg => {
      await pg.locator('.fca-ob-op label').first().click();
      await pg.waitForTimeout(120);
      const bt = pg.locator('.fca-ob-bloco button.fca-ob-bt').first();
      if (await bt.count()) { await bt.click(); await pg.waitForTimeout(400); }
      return await pg.evaluate(() => {
        const c = document.querySelector('.fca-ob-cod');
        return { nome: 'copia e cola do Pix', texto: c ? (c.value != null ? c.value : c.textContent) : null };
      });
    } }
];

for (const a of ABAS) {
  console.log('\n[' + (ABAS.indexOf(a) + 1) + '] ' + a.rot + ' -- o bloco rodando a ' + LARGURA + 'px');

  /* ---- 1a. SEM descricao: nenhum elemento de descricao na tela ---- */
  const r0 = await comBlocoNaPagina({
    bloco: semDesc[a.saida], porta: a.porta, busca: a.busca || '',
    medir: async pg => {
      await pg.setViewportSize({ width: LARGURA, height: 1400 });
      await pg.waitForTimeout(300);
      await a.abrir(pg);
      return { n: await pg.locator(a.desc).count(), linhas: await pg.locator(a.row).count() };
    }
  });
  chk(a.rot + ' / sem descricao: as linhas de opcional existem', r0.linhas >= 2, r0.linhas);
  chk(a.rot + ' / sem descricao: NENHUM elemento de descricao foi desenhado', r0.n === 0, r0.n);
  chk(a.rot + ' / sem descricao: sem erro de console', errosReais(r0.erros).length === 0,
      errosReais(r0.erros).slice(0, 2).join(' | '));

  /* ---- 1b. COM descricao curta: aparece ABAIXO, so em quem tem, e nao no carrinho ---- */
  const r1 = await comBlocoNaPagina({
    bloco: comDesc[a.saida], porta: a.porta + 10, busca: a.busca || '',
    medir: async pg => {
      await pg.setViewportSize({ width: LARGURA, height: 1400 });
      await pg.waitForTimeout(300);
      await a.abrir(pg);
      const ops = await lerOpcionais(pg, a.row, a.desc);
      const naTelaAntes = await vezesNaTela(pg, CURTA);
      const car = await a.carrinho(pg);
      const naTelaDepois = await vezesNaTela(pg, CURTA);
      const nDesc = await pg.locator(a.desc).count();
      return { ops, naTelaAntes, naTelaDepois, car, nDesc };
    }
  });
  chk(a.rot + ' / sem erro de console com a descricao na tela',
      errosReais(r1.erros).length === 0, errosReais(r1.erros).slice(0, 2).join(' | '));

  const comTexto = r1.ops.filter(o => o.temDesc);
  chk(a.rot + ': exatamente UM opcional ganhou descricao (o outro nao tem, e nao inventa)',
      comTexto.length === 1, JSON.stringify(r1.ops.map(o => [o.nome, o.temDesc])));
  const d = comTexto[0] || {};
  chk(a.rot + ': a descricao e a que foi cadastrada, inteira', d.desc === CURTA, String(d.desc));
  chk(a.rot + ': ela vem DEPOIS da linha do nome/valor na ordem do DOM', d.depoisNoDom === true);
  chk(a.rot + ': e na TELA ela esta abaixo dessa linha', d.abaixoNaTela === true,
      'topo da descricao acima da base da linha');
  chk(a.rot + ': ela comeca recuada, debaixo do NOME e nao do marcador',
      d.esquerda > d.linhaEsquerda + 10, 'recuo de ' + Math.round(d.esquerda - d.linhaEsquerda) + 'px');
  chk(a.rot + ': sai SEM DESTAQUE -- cinza #777 e corpo menor que o da opcao',
      d.corTexto === 'rgb(119, 119, 119)' && d.tamanho === '12px', d.corTexto + ' / ' + d.tamanho);
  chk(a.rot + ': a descricao aparece UMA vez na tela antes de mexer no carrinho',
      r1.naTelaAntes === 1, r1.naTelaAntes);
  chk(a.rot + ': o ' + r1.car.nome + ' existe e tem conteudo',
      !!r1.car.texto && r1.car.texto.length > 0, String(r1.car.texto).slice(0, 60));
  chk(a.rot + ': A DESCRICAO NAO ENTRA NO ' + r1.car.nome.toUpperCase() + ' (decisao do dono)',
      String(r1.car.texto).indexOf(CURTA) < 0, String(r1.car.texto).slice(0, 200));
  chk(a.rot + ': e depois de usar o carrinho ela continua aparecendo UMA vez so na tela',
      r1.naTelaDepois === 1, r1.naTelaDepois + ' ocorrencias / ' + r1.nDesc + ' elementos');

  /* ---- 1c. Descricao LONGA: quebra em varias linhas, e nada e cortado ---- */
  const r2 = await comBlocoNaPagina({
    bloco: longos[a.saida], porta: a.porta + 20, busca: a.busca || '',
    medir: async pg => {
      await pg.setViewportSize({ width: LARGURA, height: 1600 });
      await pg.waitForTimeout(300);
      await a.abrir(pg);
      return { ops: await lerOpcionais(pg, a.row, a.desc) };
    }
  });
  const L = r2.ops.filter(o => o.temDesc)[0] || {};
  chk(a.rot + ' / longa: o texto chegou inteiro, sem perder um caractere',
      L.desc === LONGA, String(L.desc).slice(0, 80) + '...');
  chk(a.rot + ' / longa: QUEBROU em varias linhas (fragmentos de linha do Range)',
      L.fragmentos >= 3, 'fragmentos=' + L.fragmentos);
  chk(a.rot + ' / longa: nao ha reticencias', L.reticencias === false);
  chk(a.rot + ' / longa: nao ha white-space que impeca a quebra', L.semQuebra === false);
  chk(a.rot + ' / longa: nada ficou escondido por overflow', L.escondeu === false);
  chk(a.rot + ' / longa: sem erro de console', errosReais(r2.erros).length === 0,
      errosReais(r2.erros).slice(0, 2).join(' | '));

  /* ---- 1d. Texto HOSTIL: o documento inteiro sobrevive ---- */
  const r3 = await comBlocoNaPagina({
    bloco: hostis[a.saida], porta: a.porta + 30, busca: a.busca || '',
    medir: async pg => {
      await pg.setViewportSize({ width: LARGURA, height: 1400 });
      await pg.waitForTimeout(300);
      await a.abrir(pg);
      return {
        ops: await lerOpcionais(pg, a.row, a.desc),
        /* O BLOCO CARREGOU DE VERDADE? Uma raiz com filhos e a prova de que o <script>
           do bloco rodou ate o fim -- literal fechado no meio deixaria a raiz vazia e
           TODAS as outras assercoes passariam por vacuidade. */
        raizViva: await pg.evaluate(sel => {
          const r = document.querySelector(sel);
          return !!(r && r.children.length > 0);
        }, a.raiz),
        /* E a marcacao nao virou marcacao: a descricao e TEXTO, entao um <b> dentro
           dela nao pode ter virado elemento. */
        semTagInjetada: await pg.evaluate(sel => {
          const d = document.querySelector(sel);
          return !!d && d.children.length === 0;
        }, a.desc)
      };
    }
  });
  chk(a.rot + ' / hostil: o bloco carregou inteiro (a raiz tem conteudo)', r3.raizViva === true);
  chk(a.rot + ' / hostil: sem erro de console', errosReais(r3.erros).length === 0,
      errosReais(r3.erros).slice(0, 2).join(' | '));
  const H = r3.ops.filter(o => o.temDesc)[0] || {};
  chk(a.rot + ' / hostil: o texto chegou caractere por caractere', H.desc === HOSTIL,
      JSON.stringify(H.desc));
  chk(a.rot + ' / hostil: a descricao continua TEXTO, sem elemento injetado dentro',
      r3.semTagInjetada === true);
}

/* =====================================================================
   4. A BUSCA DA FERRAMENTA ACHA O CAMPO NOVO
   =====================================================================
   MEDIDO ANTES DE DECIDIR: a descricao de um opcional NAO entra em *_TXT_DEFS. Aquelas
   tabelas sao [chave de estado, id do campo, padrao de fabrica] -- uma linha por campo
   da INTERFACE DO BLOCO, e cada linha tem um id unico. A descricao e DADO DE ITEM,
   como o nome e o preco: ha uma por opcional, e nenhum dos dois esta la. Forca-la para
   dentro exigiria um id por opcional, que nao existe.
   A busca a acha assim mesmo, e e isso que se mede aqui: fcsCampos varre TODO input de
   texto dentro de um .painel, com id ou sem -- as linhas da lista sao montadas em tempo
   de execucao e nao tem id nenhum. Sem rotulo proprio vale o placeholder, que e o que
   o resultado mostra. */
console.log('\n[4] a busca acha o campo novo, e o resultado mostra o valor atual');
{
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-uni');
    await cadastrarOps(pg, 'u', [{ nome: 'Album extra', preco: '80', desc: CURTA }]);
    await pg.waitForTimeout(200);
    globalThis.__busca = await pg.evaluate(agulha => {
      const c = document.getElementById('fcs-q');
      c.value = agulha;
      c.dispatchEvent(new Event('input', { bubbles: true }));
      const its = document.querySelectorAll('#fcs-res .fcs-item');
      return Array.prototype.map.call(its, b => ({
        id: b.getAttribute('data-id'),
        rot: (b.querySelector('.fcs-rot') || {}).textContent || '',
        val: (b.querySelector('.fcs-val') || {}).textContent || '',
        onde: (b.querySelector('.fcs-onde') || {}).textContent || ''
      }));
    }, 'apenas reserva');
    /* O campo do FORMULARIO (o que tem id) e procurado pelo proprio rotulo. */
    globalThis.__busca2 = await pg.evaluate(() => {
      const c = document.getElementById('fcs-q');
      c.value = 'Descrição deste opcional';
      c.dispatchEvent(new Event('input', { bubbles: true }));
      return Array.prototype.map.call(document.querySelectorAll('#fcs-res .fcs-item'),
        b => b.getAttribute('data-id'));
    });
  }, [], { porta: 8958 });
  chk('a ferramenta abriu sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  const achados = globalThis.__busca || [];
  chk('procurar um pedaco da descricao acha alguma coisa', achados.length >= 1,
      JSON.stringify(achados));
  const naLista = achados.filter(x => x.rot.indexOf('Descrição') >= 0);
  chk('o achado e um campo de DESCRICAO (o rotulo sai do placeholder da linha)',
      naLista.length >= 1, JSON.stringify(achados.map(x => x.rot)));
  chk('o resultado mostra o VALOR ATUAL do campo, e nao so o nome dele',
      naLista.length >= 1 && naLista[0].val.indexOf('apenas reserva') >= 0,
      naLista.length ? naLista[0].val : '(nada)');
  chk('o resultado diz que o campo esta no Checkout',
      naLista.length >= 1 && naLista[0].onde.indexOf('Checkout') >= 0,
      naLista.length ? naLista[0].onde : '(nada)');
  chk('procurar pelo rotulo acha o campo do FORMULARIO, pelo id',
      (globalThis.__busca2 || []).indexOf('u-op-desc') >= 0,
      JSON.stringify(globalThis.__busca2));
}

/* =====================================================================
   5. BACKUP ANTERIOR A ESTA RODADA ABRE SEM PERDER NADA
   =====================================================================
   O campo novo e ACRESCIMO PURO -- mas isso precisa de PROVA, nao de confianca. O
   estado e COLHIDO DA PROPRIA REFERENCIA: a ferramenta de la, rodando, grava o que ela
   grava. Um JSON escrito a mao aqui envelheceria no dia em que o formato mudasse, e
   passaria a provar o passado. Molde: zap-saldo-migracao.mjs e meio-prio-migracao.mjs.
   ===================================================================== */
console.log('\n[5] backup gravado pela ferramenta da referencia ' + REF + ' abre aqui sem perder nada');
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-opdesc-'));
  process.on('exit', () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} });
  execFileSync('/bin/sh', ['-c',
    'git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(tmp)]);

  const refJaTem = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8').indexOf('u-op-desc') >= 0;
  if (refJaTem) console.log('  AVISO: a referencia ' + REF + ' JA TEM o campo -- este caso deixa de medir a migracao.');

  /* Colher: opcionais cadastrados NA REFERENCIA, nas tres abas. */
  const colhido = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg);
    await clicar(pg, 'aba-uni');
    await lapis(pg, 'u-prod-lista', 0);
    await cadastrarOps(pg, 'u', OPS(''));
    await clicar(pg, 'u-prod-salvar');
    await clicar(pg, 'aba-loja');
    await lapis(pg, 'm-prod-lista', 0);
    await cadastrarOps(pg, 'm', OPS(''));
    await clicar(pg, 'm-prod-salvar');
    await clicar(pg, 'aba-pac');
    await lapis(pg, 'a-pac-lista', 0);
    await cadastrarOps(pg, 'a', OPS(''));
    await clicar(pg, 'a-pac-salvar');
    await pg.waitForTimeout(300);
    globalThis.__est = await pg.evaluate(() => localStorage.getItem('fcConstrutores'));
  }, [], { raiz: tmp, porta: 8959 });
  chk('a referencia gravou o estado sem alerta', colhido.alertas.length === 0,
      JSON.stringify(colhido.alertas));
  const estado = globalThis.__est;
  chk('o estado colhido nao esta vazio', !!estado && estado.length > 100, String(estado).length);

  const antes = JSON.parse(estado || '{}');
  const opsRef = {
    u: ((antes.u || {}).prods || [])[0], m: ((antes.m || {}).prods || [])[0],
    a: ((antes.a || {}).pacotes || [])[0]
  };
  chk('a referencia gravou os dois opcionais nas TRES abas',
      ['u', 'm', 'a'].every(k => opsRef[k] && (opsRef[k].ops || []).length === 2),
      JSON.stringify(Object.keys(opsRef).map(k => (opsRef[k] && (opsRef[k].ops || []).length))));
  chk('e NENHUM deles tem a chave nova (por isso este caso mede alguma coisa)',
      refJaTem || ['u', 'm', 'a'].every(k => (opsRef[k].ops || []).every(o => o.desc === undefined)),
      JSON.stringify(opsRef.u.ops));

  /* Restaurar na arvore de hoje. */
  const depois = await gerarNaFerramenta(async pg => {
    await pg.evaluate(s => localStorage.setItem('fcConstrutores', s), estado);
    await pg.reload();
    await pg.evaluate(() => {
      window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
      window.confirm = () => true; window.open = () => null;
    });
    await pg.waitForTimeout(400);
    globalThis.__dep = await pg.evaluate(() => {
      const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
      const f = document.getElementById('fc-falhas');
      return {
        u: ((st.u || {}).prods || [])[0], m: ((st.m || {}).prods || [])[0],
        a: ((st.a || {}).pacotes || [])[0],
        nProdsU: ((st.u || {}).prods || []).length,
        nProdsM: ((st.m || {}).prods || []).length,
        nPacsA: ((st.a || {}).pacotes || []).length,
        falhas: f ? (f.textContent || '').trim() : ''
      };
    });
    /* O QUE O DONO VE, e nao so o que esta gravado. Restaurar NAO reescreve o
       armazenamento -- a ferramenta le o que estava la e so grava de novo quando alguem
       mexe em alguma coisa --, entao cobrar a chave nova no localStorage logo apos a
       recarga mediria o texto do BACKUP, que obviamente nao a tem. A pergunta do dono e
       outra: "abri meu backup, perdi alguma coisa?". Quem responde e o formulario: abrir
       o item no lapis e ler as linhas de opcional como elas aparecem na tela.
       DEPOIS disso, salvar e reler o armazenamento fecha o outro meio da prova -- a
       chave nova nasce vazia e o resto continua onde estava. */
    globalThis.__tela = {};
    for (const [aba, lista, salvar, chave] of [
      ['aba-uni',  'u-prod-lista', 'u-prod-salvar', 'u'],
      ['aba-loja', 'm-prod-lista', 'm-prod-salvar', 'm'],
      ['aba-pac',  'a-pac-lista',  'a-pac-salvar',  'a']]) {
      await clicar(pg, aba);
      await pg.waitForTimeout(150);
      await lapis(pg, lista, 0);
      await pg.waitForTimeout(250);
      globalThis.__tela[chave] = await pg.evaluate(lista => {
        const ul = document.getElementById(lista.replace('-prod-lista', '-op-lista').replace('-pac-lista', '-op-lista'));
        return Array.prototype.map.call(ul.querySelectorAll('li'), li => {
          const ts = li.querySelectorAll('input[type=text]');
          const n = li.querySelector('input[type=number]');
          const c = li.querySelector('input[type=checkbox]');
          return { nome: ts[0] ? ts[0].value : null, desc: ts[1] ? ts[1].value : null,
                   preco: n ? n.value : null, qtd: !!(c && c.checked) };
        });
      }, lista);
      await clicar(pg, salvar);
      await pg.waitForTimeout(250);
    }
    globalThis.__regravado = await pg.evaluate(() => {
      const st = JSON.parse(localStorage.getItem('fcConstrutores') || '{}');
      return { u: ((st.u || {}).prods || [])[0], m: ((st.m || {}).prods || [])[0],
               a: ((st.a || {}).pacotes || [])[0] };
    });
  }, [], { porta: 8960 });
  chk('a arvore de hoje restaurou o backup sem alerta', depois.alertas.length === 0,
      JSON.stringify(depois.alertas));
  chk('restaurou sem erro de console',
      errosReais(depois.erros).length === 0, errosReais(depois.erros).slice(0, 2).join(' | '));
  const D = globalThis.__dep;
  chk('a barra vermelha de falhas nao acendeu', D.falhas === '', D.falhas.slice(0, 140));
  chk('o catalogo inteiro atravessou (2 produtos, 2 produtos, 3 pacotes)',
      D.nProdsU === 2 && D.nProdsM === 2 && D.nPacsA === 3,
      [D.nProdsU, D.nProdsM, D.nPacsA].join('/'));
  for (const k of ['u', 'm', 'a']) {
    const ref = (opsRef[k].ops || []), hoje = ((D[k] || {}).ops || []);
    const tela = (globalThis.__tela || {})[k] || [];
    const reg = ((globalThis.__regravado || {})[k] || {}).ops || [];
    chk('[' + k + '] os dois opcionais voltaram', hoje.length === 2, hoje.length);
    chk('[' + k + '] nome, preco e "vende por quantidade" atravessaram intactos',
        JSON.stringify(hoje.map(o => [o.nome, o.preco, !!o.qtd])) ===
        JSON.stringify(ref.map(o => [o.nome, o.preco, !!o.qtd])),
        JSON.stringify(hoje.map(o => [o.nome, o.preco, !!o.qtd])));
    chk('[' + k + '] os dois aparecem no formulario, com nome e preco do backup',
        tela.length === 2 &&
        JSON.stringify(tela.map(o => [o.nome, String(o.preco), o.qtd])) ===
        JSON.stringify(ref.map(o => [o.nome, String(o.preco), !!o.qtd])),
        JSON.stringify(tela));
    chk('[' + k + '] O CAMPO DE DESCRICAO APARECE VAZIO -- nem "undefined" nem sumido',
        tela.length === 2 && tela.every(o => o.desc === ''), JSON.stringify(tela.map(o => o.desc)));
    chk('[' + k + '] regravando, a chave nova entra VAZIA e o resto fica onde estava',
        reg.length === 2 && reg.every(o => o.desc === '') &&
        JSON.stringify(reg.map(o => [o.nome, o.preco, !!o.qtd])) ===
        JSON.stringify(ref.map(o => [o.nome, o.preco, !!o.qtd])),
        JSON.stringify(reg));
  }
}

process.exit(resumo());
