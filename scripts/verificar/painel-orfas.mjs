/* ============================================================================
   fccOrfas: A REDE DO PAINEL CONSOLIDADO, VISTA ACENDENDO (16/09/2026)
   ============================================================================
   O QUE ELA E. O painel consolidado monta a Tag Head e a Tag Body de UMA pagina a
   partir de um mapa escrito a mao (fccDaAba) mais uma lista declarada do que nao vai
   para campo nenhum do Prosite (FCC_FORA). Mapa escrito a mao envelhece: em
   23/08/2026 a Tag Body da pagina de obrigado foi gerada por uma aba e NAO entrou no
   mapa. O esquecimento foi silencioso -- a saida existia na aba, o painel montava sem
   ela, e o operador so descobriria pela pagina publicada sem o codigo.
   fccOrfas e a resposta: a cada desenho do painel ela compara TODA caixa de saida com
   conteudo contra o plano mais o FCC_FORA, e o que sobrar aparece em vermelho,
   NOMEANDO a saida. Ela nao conserta o mapa; ela faz o buraco aparecer.

   POR QUE ESTA PROVA EXISTE. Ate hoje ela NUNCA foi vista disparando. Rede que
   ninguem viu acender e promessa, nao rede -- pode estar quebrada ha meses, e o
   buraco que ela existe para mostrar continuaria invisivel. Pior: o silencio dela na
   arvore sa seria lido como "esta tudo mapeado" quando poderia significar "ela nunca
   roda".

   O QUE ESTA PROVA IMPEDE. Que fccOrfas deixe de funcionar sem ninguem notar -- e,
   junto, que o silencio dela seja medido sobre uma tela vazia. As duas metades sao
   necessarias, e a segunda e a que mais engana: sem preset geral selecionado o painel
   nem monta plano; sem aba LIGADA fccOrfas pula a saida de proposito; e com as caixas
   de codigo vazias ela pula tudo, por construcao. Uma prova descuidada mediria
   qualquer um desses tres estados e chamaria de "silencio".

   COMO ELA MEDE, nos dois sentidos -- o mesmo desenho de redes-da-partida.mjs:
     1. SILENCIO NA ARVORE SA, com o painel REALMENTE desenhado (o nome da campanha na
        tela), as onze abas LIGADAS e as caixas de saida REALMENTE preenchidas (a
        lista das que tem conteudo e impressa, e o teste exige um minimo).
     2. VERMELHO NUMA COPIA ADULTERADA DE PROPOSITO, em dois pontos independentes:
        a) o mapa fccDaAba perde a saida 5 do TidyCal -- que e, letra por letra, o
           defeito de 23/08/2026 reconstruido;
        b) FCC_FORA perde o p-out2 -- o outro caminho pelo qual uma saida fica
           legitimamente fora do plano.
        Nos dois a prova cobra que o aviso NOMEIA a saida e a aba. "Alguma coisa esta
        errada" nao serve de rede: ninguem conserta um mapa de mais de cem linhas com
        isso.
     3. O NEGATIVO DA ADULTERACAO: com o MESMO mapa quebrado e a aba TidyCal DESLIGADA
        desta pagina, o painel fica calado. E comportamento declarado (aba fora desta
        pagina nao e esquecimento), e sem esta medida a parte 2 poderia estar passando
        por um alarme que acende para qualquer coisa.

   A ARVORE REAL NUNCA E TOCADA: cada adulteracao escreve uma copia do index.html numa
   pasta temporaria e serve a copia.

   SEM REFERENCIA CONGELADA. Nada aqui compara com 'main' nem com commit nenhum: a
   propriedade medida e da arvore de hoje, e as adulteracoes sao feitas em memoria
   sobre o texto de hoje. Nao envelhece.

   ROTEIRO: node scripts/verificar/painel-orfas.mjs
   Precisa de Node e Playwright -- ver scripts/verificar/lib.mjs.
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { navegador, servir, abrir, set, radio, clicar, alertas } from './lib.mjs';
import { chk, resumo } from './pagina.mjs';
import { preparar, conteudo, cobranca } from './cenario.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGINAL = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

/* A frase pela qual o aviso de orfa e reconhecido na tela. Fragmento curto e sem o
   comeco da frase de proposito: o texto pode ganhar palavras na frente sem que a
   prova pare de achar o bloco certo. */
const MARCA_ORFA = 'não soube onde colocar';

/* ============================================================================
   Serve uma COPIA da arvore com o index.html trocado pelo texto dado, monta o cenario
   inteiro, liga as abas pedidas, manda gerar TUDO e devolve o que o painel desenhou.
   ============================================================================ */
async function comArvore({ texto, porta, desligar = [], rotulo }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-orfas-'));
  for (const f of ['fc-compartilhado.js', 'previa.html']) {
    if (fs.existsSync(path.join(RAIZ, f))) fs.copyFileSync(path.join(RAIZ, f), path.join(tmp, f));
  }
  fs.writeFileSync(path.join(tmp, 'index.html'), texto);
  const srv = await servir(tmp, porta);
  const br = await navegador();
  try {
    const pg = await abrir(br, 'http://127.0.0.1:' + porta);

    /* ---- o cenario: as abas preenchidas com o minimo para nenhuma recusar ----
       Sem isto metade das caixas de saida sai VAZIA, e caixa vazia fccOrfas pula de
       proposito -- o silencio seria o de uma tela sem nada. */
    await preparar(pg);
    await conteudo(pg);
    await clicar(pg, 'aba-cob');
    await cobranca(pg, {});

    /* ---- o preset geral: sem ele o painel nem monta plano ---- */
    await set(pg, 'fcg-campanha', 'Prova das orfas');
    await radio(pg, 'fcg-pagina', 'hospedeira');
    await clicar(pg, 'fcg-criar');

    /* ---- LIGAR as abas. A lista sai do DOM, e nao de um array escrito aqui: o
       numero de abas nao se escreve a mao neste projeto, e uma aba nova precisa
       entrar nesta prova sozinha. ---- */
    const abas = await pg.evaluate(() => {
      const r = [], rs = document.querySelectorAll('input[type="radio"][name^="fcg-usar-"]');
      for (let i = 0; i < rs.length; i++) {
        const id = rs[i].name.substring('fcg-usar-'.length);
        if (r.indexOf(id) < 0) r.push(id);
      }
      return r;
    });
    /* AS ABAS SAO TODAS LIGADAS AQUI, inclusive as que a prova vai desligar depois:
       "Gerar todos os codigos" so percorre aba LIGADA, e uma aba desligada antes da
       geracao ficaria com as caixas VAZIAS -- e caixa vazia fccOrfas pula de proposito.
       Medir o desligamento exige a saida CHEIA e a aba fora, que e exatamente o estado
       do operador que gerou tudo e depois tirou a aba desta pagina. */
    for (const id of abas) await radio(pg, 'fcg-usar-' + id, 'sim');
    await pg.waitForTimeout(400);

    /* O link de UMA cobranca nao sai do "Gerar todos": ele tem botao proprio. E ele e
       justamente a saida que FCC_FORA declara, entao sem este clique a parte que mede
       FCC_FORA nao mediria nada.
       ELE VEM ANTES do "Gerar todos", e a ordem foi MEDIDA: pGerarLink nao chama
       fccMarcar, entao ele nao agenda redesenho nenhum do painel -- clicado por ultimo,
       o link ficaria na caixa sem o painel ter olhado para ela, e a prova de FCC_FORA
       mediria um painel desenhado antes de a saida existir. fccGerarTodos, ao contrario,
       termina chamando fccRender() na hora. */
    await clicar(pg, 'p-gerarlink');
    await pg.waitForTimeout(200);

    /* ---- gerar TUDO pelo botao do proprio painel: e o caminho do operador, e ele
       percorre o registro ABAS vivo em vez de uma lista repetida aqui. ---- */
    const clicou = await pg.evaluate(() => {
      const b = document.querySelector('#fcc-corpo [data-fcc-gerar]');
      if (!b) return false;
      b.click();
      return true;
    });
    await pg.waitForTimeout(800);

    /* ---- e SO ENTAO a aba sai desta pagina, com a caixa dela ja cheia ---- */
    for (const id of desligar) await radio(pg, 'fcg-usar-' + id, 'nao');
    if (desligar.length) await pg.waitForTimeout(800);

    /* ---- o que o painel desenhou ---- */
    const painel = await pg.evaluate(marca => {
      const box = document.getElementById('fcc-corpo');
      if (!box) return { semCaixa: true };
      const ps = box.querySelectorAll('p.fcc-perigo');
      let orfa = null;
      for (let i = 0; i < ps.length; i++) {
        if (ps[i].textContent.indexOf(marca) < 0) continue;
        const itens = [], lis = ps[i].parentNode.querySelectorAll('li');
        for (let j = 0; j < lis.length; j++) itens.push(lis[j].textContent.replace(/\s+/g, ' ').trim());
        orfa = { texto: ps[i].textContent.replace(/\s+/g, ' ').trim(), itens: itens };
        break;
      }
      const perigos = [];
      for (let i = 0; i < ps.length; i++) perigos.push(ps[i].textContent.replace(/\s+/g, ' ').trim().slice(0, 90));
      return { semCaixa: false, orfa: orfa, perigos: perigos,
               texto: box.textContent.replace(/\s+/g, ' ').trim() };
    }, marcaOrfa());

    /* ---- as caixas de saida que REALMENTE tem conteudo ---- */
    const cheias = await pg.evaluate(() => {
      const r = [], tas = document.getElementsByTagName('textarea');
      for (let i = 0; i < tas.length; i++) {
        const el = tas[i];
        if (!/^[a-z]-out[0-9]*$/.test(el.id)) continue;
        if (!el.value) continue;
        r.push(el.id);
      }
      return r.sort();
    });

    const barra = await pg.evaluate(() => {
      const b = document.getElementById('fc-falhas');
      return b ? b.textContent.replace(/\s+/g, ' ').trim() : '';
    });

    const av = await alertas(pg);
    console.log('  [' + rotulo + '] abas na pagina: ' + (abas.length - desligar.length) +
                ' de ' + abas.length + ' | caixas com conteudo: ' + cheias.length +
                ' (' + cheias.join(' ') + ')');
    await pg.close();
    return { painel, cheias, barra, alertas: av, abas, clicou, erros: pg.erros.slice() };
  } finally {
    await br.close();
    srv.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
function marcaOrfa() { return MARCA_ORFA; }

/* ============================================================================
   1. A ARVORE SA: silencio, e silencio MEDIDO sobre um painel de verdade
   ============================================================================ */
console.log('\n=== 1. arvore sa: o painel desenhado, as caixas cheias, e NENHUMA orfa ===');
{
  const r = await comArvore({ texto: ORIGINAL, porta: 9511, rotulo: 'sa' });
  chk('[sa] o botao "Gerar todos os codigos" existia no painel', r.clicou === true);
  chk('[sa] o painel montou o plano (o nome da campanha esta na tela)',
      r.painel.semCaixa === false && r.painel.texto.indexOf('Prova das orfas') >= 0,
      r.painel.texto ? r.painel.texto.slice(0, 160) : '(sem caixa)');
  chk('[sa] o painel NAO esta no estado "sem preset geral"',
      r.painel.texto.indexOf('Sem preset geral selecionado') < 0);
  chk('[sa] as abas foram todas ligadas nesta pagina',
      r.painel.texto.indexOf(r.abas.length + ' de ' + r.abas.length + ' abas') >= 0,
      r.painel.texto.slice(0, 160));
  /* O silencio so vale se houver o que medir. Quatorze e o piso: hoje sao mais, e o
     numero exato envelheceria a cada aba nova -- o que nao pode envelhecer e a
     exigencia de que o silencio seja medido sobre caixas CHEIAS. */
  chk('[sa] ha caixas de saida com conteudo de verdade (>= 14)', r.cheias.length >= 14,
      r.cheias.length + ': ' + r.cheias.join(' '));
  chk('[sa] o link de cobranca (p-out2) foi gerado -- e ele quem exercita o FCC_FORA',
      r.cheias.indexOf('p-out2') >= 0, r.cheias.join(' '));
  chk('[sa] a saida 5 do TidyCal foi gerada -- e ela quem exercita a parte 2a',
      r.cheias.indexOf('t-out5') >= 0, r.cheias.join(' '));
  chk('[sa] NENHUMA orfa no painel', r.painel.orfa === null,
      r.painel.orfa ? JSON.stringify(r.painel.orfa) : '');
  chk('[sa] nenhuma barra vermelha na abertura', r.barra === '', r.barra.slice(0, 200));
  chk('[sa] nenhum erro de pagina durante a passagem', r.erros.length === 0,
      r.erros.slice(0, 2).join(' | '));
}

/* ============================================================================
   2a. O DEFEITO DE 23/08/2026 RECONSTRUIDO: o mapa perde a saida 5 do TidyCal
   ============================================================================
   A adulteracao nao apaga linha nem mexe em acento: ela troca cada push da saida 5 por
   uma expressao que nao empurra nada ('0&&...'). O item deixa de entrar no plano
   exatamente como entraria se alguem tivesse esquecido de mapea-lo -- que e o
   esquecimento que fccOrfas existe para denunciar. */
console.log('\n=== 2a. mapa adulterado: t-out5 sai do plano (o defeito de 23/08/2026) ===');
{
  const deBody  = "plano.body.push(fccItem(a,'t-out5'";
  const deOutra = "plano.outra.push(fccItem(a,'t-out5'";
  chk('[2a] achei os dois pontos do mapa para adulterar',
      ORIGINAL.indexOf(deBody) >= 0 && ORIGINAL.indexOf(deOutra) >= 0);
  const ruim = ORIGINAL.split(deBody).join('0&&' + deBody).split(deOutra).join('0&&' + deOutra);
  chk('[2a] a adulteracao mudou o texto', ruim !== ORIGINAL);

  const r = await comArvore({ texto: ruim, porta: 9512, rotulo: '2a' });
  chk('[2a] a saida 5 continua sendo GERADA (o defeito e no mapa, nao no gerador)',
      r.cheias.indexOf('t-out5') >= 0, r.cheias.join(' '));
  chk('[2a] o painel ACUSA uma orfa', r.painel.orfa !== null,
      '(silencio) perigos: ' + JSON.stringify(r.painel.perigos));
  if (r.painel.orfa) {
    chk('[2a] e o aviso NOMEIA a saida: t-out5',
        r.painel.orfa.itens.some(t => t.indexOf('t-out5') >= 0),
        JSON.stringify(r.painel.orfa.itens));
    chk('[2a] e NOMEIA a aba: Agendamento TidyCal',
        r.painel.orfa.itens.some(t => t.indexOf('TidyCal') >= 0),
        JSON.stringify(r.painel.orfa.itens));
    chk('[2a] e nao acusa nada alem do que foi quebrado',
        r.painel.orfa.itens.length === 1, JSON.stringify(r.painel.orfa.itens));
    chk('[2a] o aviso diz que a falha e da ferramenta, e manda copiar da aba',
        /falha da ferramenta/i.test(r.painel.orfa.texto) &&
        /Copie-o direto da aba/i.test(r.painel.orfa.texto),
        r.painel.orfa.texto.slice(0, 220));
  }
  chk('[2a] o painel continuou desenhando o resto (nao morreu no meio)',
      r.painel.texto.indexOf('Prova das orfas') >= 0, r.painel.texto.slice(0, 160));
}

/* ============================================================================
   2b. O OUTRO CAMINHO: FCC_FORA perde o p-out2
   ============================================================================
   Uma saida pode ficar legitimamente fora do plano de duas maneiras -- estando no mapa
   ou estando declarada em FCC_FORA. Medir so a primeira deixaria metade da rede sem
   prova, e e a metade que cobre o link de cada cobranca, que e dinheiro. */
console.log('\n=== 2b. FCC_FORA adulterado: p-out2 deixa de ser declarado ===');
{
  const de = "'p-out2':'o link de cada";
  chk('[2b] achei a declaracao de FCC_FORA para adulterar', ORIGINAL.indexOf(de) >= 0);
  const ruim = ORIGINAL.replace(de, "'p-out2-DESLIGADO':'o link de cada");
  chk('[2b] a adulteracao mudou o texto', ruim !== ORIGINAL);

  const r = await comArvore({ texto: ruim, porta: 9513, rotulo: '2b' });
  chk('[2b] o link continua sendo GERADO', r.cheias.indexOf('p-out2') >= 0, r.cheias.join(' '));
  chk('[2b] o painel ACUSA uma orfa', r.painel.orfa !== null,
      '(silencio) perigos: ' + JSON.stringify(r.painel.perigos));
  if (r.painel.orfa) {
    chk('[2b] e o aviso NOMEIA a saida: p-out2',
        r.painel.orfa.itens.some(t => t.indexOf('p-out2') >= 0),
        JSON.stringify(r.painel.orfa.itens));
    chk('[2b] e NOMEIA a aba: Link de cobranca',
        r.painel.orfa.itens.some(t => /Link de cobran/i.test(t)),
        JSON.stringify(r.painel.orfa.itens));
    chk('[2b] e nao acusa nada alem do que foi quebrado',
        r.painel.orfa.itens.length === 1, JSON.stringify(r.painel.orfa.itens));
  }
}

/* ============================================================================
   3. O NEGATIVO DA ADULTERACAO: aba DESLIGADA nao e esquecimento
   ============================================================================
   Com o MESMO mapa quebrado da parte 2a e a aba TidyCal fora desta pagina, o painel
   tem de ficar calado -- e comportamento declarado no proprio fccOrfas ("aba fora
   desta pagina nao e esquecimento: as saidas dela nao pertencem a este plano").
   Sem esta medida, a parte 2a poderia estar passando por um alarme que acende para
   qualquer coisa, e a prova nao saberia a diferenca. */
console.log('\n=== 3. mesmo mapa quebrado, aba TidyCal DESLIGADA: o painel fica calado ===');
{
  const deBody  = "plano.body.push(fccItem(a,'t-out5'";
  const deOutra = "plano.outra.push(fccItem(a,'t-out5'";
  const ruim = ORIGINAL.split(deBody).join('0&&' + deBody).split(deOutra).join('0&&' + deOutra);
  const r = await comArvore({ texto: ruim, porta: 9514, desligar: ['tidy'], rotulo: '3' });
  chk('[3] a saida 5 continua com conteudo na aba', r.cheias.indexOf('t-out5') >= 0,
      r.cheias.join(' '));
  chk('[3] o painel NAO acusa orfa nenhuma', r.painel.orfa === null,
      r.painel.orfa ? JSON.stringify(r.painel.orfa) : '');
  chk('[3] e o painel continua desenhando o plano das outras abas',
      r.painel.texto.indexOf('Prova das orfas') >= 0, r.painel.texto.slice(0, 160));
}

/* O CODIGO DE SAIDA E O RESULTADO, e nao um zero por descuido (16/09/2026). Nove
   suites chamavam resumo() e saiam com 0 aconteca o que acontecesse -- e uma delas
   estava FALHANDO e anunciando sucesso. Verde falso apaga o defeito. */
process.exit(resumo());
