/* ============================================================================
   O CALENDARIO UNIFICADO, CONTRA O TIDYCAL DE VERDADE
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE, E POR QUE A REGRESSAO NAO SERVE AQUI. Em
   03/09/2026 as tres implementacoes de calendario viraram uma so, e uma delas
   -- a aba TidyCal apontada para tidycal.com -- estava EM PRODUCAO desde
   agosto. A saida daquele bloco mudou DE PROPOSITO (ele deixou de usar o
   caminho automatico do embed.js e passou a criar o proprio iframe), entao a
   prova byte a byte, que e a prova de sempre deste projeto, nao diz nada sobre
   ele: ela so sabe dizer "mudou". A pergunta que importa e outra -- o bloco
   NOVO se comporta pelo menos tao bem quanto o de HOJE? --, e ela so tem
   resposta com o calendario de verdade do outro lado.

   POR ISSO ESTE E O UNICO ARQUIVO DO ARNES QUE FALA COM A INTERNET. Ele libera
   tres hosts, e nenhum a mais:
     tidycal.com                   -- o calendario em si
     agendamento.fotocerta.com.br  -- o mesmo calendario em dominio proprio
     asset-tidycal.b-cdn.net       -- o embed.js deles (a biblioteca de altura)
   O preco esta assumido e escrito: este teste PODE falhar por rede, e essa
   falha nao tem nada a ver com o bloco. Quando isso acontecer, a leitura certa
   e "nao mediu", nao "quebrou". O resto do arnes continua com a rede fechada.

   O QUE ELE MEDE, lado a lado, NOVO contra ATUAL (a arvore de referencia, por
   padrao 'main'), nos TRES casos:
     1. aba TidyCal em tidycal.com        (o bloco que esta em producao)
     2. aba TidyCal em dominio proprio
     3. aba Agendamento por pacote        (endereco que troca com o pacote)
   Para cada um: a altura em repouso acompanha o conteudo? a altura cresce
   quando o formulario de reserva abre? nasceu algum iframe fantasma? houve
   erro de console?

   E MEDE OS TRES CASOS DE DEGRADACAO no bloco novo, que sao a razao de o
   aperto de mao proprio continuar existindo:
     a. a biblioteca deles carrega          -> e ela quem cuida da altura
     b. a biblioteca NAO carrega (CDN fora) -> o aperto de mao proprio assume
     c. carrega e o sinal nao vem           -> nada quebra, nada zera

   Rodar: node scripts/verificar/tidycal-unificado.mjs
          node scripts/verificar/tidycal-unificado.mjs <ref>   (outra referencia)
============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, clicar } from './lib.mjs';
import { preparar } from './cenario.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';

/* Os enderecos de verdade. Trocar um deles por um que nao exista faz o teste medir
   "nao carregou" em toda linha -- e o que se ve na tela e um quadro cinzento. */
const TIDY = 'https://tidycal.com/fotocerta/natal-2026';
const PROP = 'https://agendamento.fotocerta.com.br/estudio-905-seg-a-sex-1-hora';
const REDE = ['tidycal.com', 'agendamento.fotocerta.com.br', 'asset-tidycal.b-cdn.net'];

/* A altura calibrada de fabrica das duas abas. E o piso que a expansao do formulario tem de
   alcancar quando MEDIR_FORMULARIO esta desligado (o padrao). */
const CALIBRADA = 2350;

/* ===== gerar ===== */
async function gerarTidy(raiz, url, porta){
  const { valores } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-tidy');
    await set(pg, 't-path', url);
    await clicar(pg, 't-gerar');
  }, ['t-out1'], { raiz, porta });
  return valores['t-out1'];
}

/* A vitrine com DOIS pacotes em DOMINIOS DIFERENTES, de proposito: e a unica forma de medir
   a troca de dominio, que e o caso em que a conferencia de origem da biblioteca do TidyCal
   ficaria presa ao endereco anterior se o iframe fosse reaproveitado. */
async function gerarPac(raiz, porta){
  const { valores } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC');
    const campo = await pg.$('#a-ppath') ? 'a-ppath' : 'a-plink';
    for(const p of [['UM', 'Pacote um', '45 minutos', '420', '10 fotos', TIDY],
                    ['DOIS', 'Pacote dois', '1 hora', '700', '20 fotos', PROP]]){
      await set(pg, 'a-pcod', p[0]); await set(pg, 'a-pnome', p[1]); await set(pg, 'a-pdur', p[2]);
      await set(pg, 'a-ppreco', p[3]); await set(pg, 'a-pinclui', p[4]); await set(pg, campo, p[5]);
      await clicar(pg, 'a-pac-salvar');
    }
    await clicar(pg, 'a-gerar');
  }, ['a-out1'], { raiz, porta });
  return valores['a-out1'];
}

/* ===== executar e medir ===== */
const ENCHIMENTO = '<div style="height:1200px;background:#eee"></div>';

/* A ALTURA QUE IMPORTA E A RENDERIZADA, e nao a do atributo style: no caminho de tidycal.com
   de HOJE quem escreve a altura e o embed.js deles, e no caminho novo pode ser a biblioteca
   ou o bloco -- getBoundingClientRect() nao se importa com qual dos tres escreveu. */
const alturaReal = pg => pg.evaluate(() => {
  const f = document.querySelector('iframe.tidycal-embed, iframe.fca-tidycal');
  return f ? Math.round(f.getBoundingClientRect().height) : null;
});
const contarIframes = pg => pg.evaluate(() => document.querySelectorAll('iframe').length);

/* ESPERAR A ALTURA PARAR, e nao esperar um prazo fixo. O calendario nao anuncia a altura de
   uma vez: medido, ele passa por 350, depois 555, depois 559, ao longo de dois a tres
   segundos, e numa rede lenta esse desfile se estica. Um prazo fixo transforma essa lentidao
   numa leitura no meio do caminho (medido: 500px, que e o PISO, lido enquanto o resto ainda
   vinha) e o teste acusaria uma regressao que nao existe. Aqui a leitura so vale quando o
   valor repete tres vezes seguidas -- e se nunca parar, devolve a ultima, para a falha ser
   "nao estabilizou" e nao um numero inventado.

   OS DOIS VALORES DE ESPERA. 500 e o PISO (ALTURA_MINIMA) e 700 e a altura de PARTIDA: os
   dois significam "ainda nao mediu nada de verdade", entao parar neles seria fotografar o
   carregamento. So param a espera antes do limite os valores que nao sao nem um nem outro. */
const PISO_ESPERA = [500, 700];
async function alturaEstavel(pg, limite = 45000){
  let anterior = null, iguais = 0, gasto = 0;
  while(gasto < limite){
    await pg.waitForTimeout(1200); gasto += 1200;
    const h = await alturaReal(pg);
    iguais = (h !== null && h === anterior) ? iguais + 1 : 0;
    anterior = h;
    if(iguais >= 3 && gasto >= 10000 && PISO_ESPERA.indexOf(h) < 0) return h;
  }
  return anterior;
}

/* O ERRO QUE CONTA e o do bloco, e nao o da rede que este teste mesmo fechou. Tudo que a
   pagina do TidyCal tenta buscar de terceiros (Stripe, fontes, telemetria) e abortado pelo
   molde, e cada aborto vira uma linha de erro no console -- do IFRAME, nao do bloco. Contar
   essas linhas faria o teste acusar defeito onde ha so a rede fechada de proposito. */
const RUIDO = ['Failed to load resource', 'net::ERR_', 'Failed to load Stripe.js'];
const errosDoBloco = e => e.filter(x => !RUIDO.some(r => x.indexOf(r) >= 0));

/* Clica num horario DENTRO do calendario, que e o que abre o formulario de reserva.
   O iframe da aba TidyCal leva '?embed=1'; o da aba Agendamento por pacote nao leva -- por
   isso a busca e pelo HOST, e nao pela consulta. */
async function abrirFormulario(pg){
  const fr = pg.frames().find(f => /^https:\/\/(tidycal\.com|agendamento\.fotocerta\.com\.br)\//.test(f.url()));
  if(!fr) return 'sem iframe do TidyCal';
  const horario = () => fr.locator('button', { hasText: /^\d\d:\d\d/ }).first();
  try{
    /* No quadro largo o TidyCal ja mostra os horarios do dia; no estreito (que e o caso da
       vitrine de pacotes, onde o calendario divide a largura com os cartoes) e preciso
       escolher o DIA antes. Tentar o horario primeiro e cair no dia so quando ele nao existe
       cobre os dois sem precisar saber de antemao qual layout apareceu. */
    if(await horario().count() === 0){
      await fr.locator('.nice-dates-day:not(.-disabled):not(.-outside)').nth(3).click({ timeout: 20000 });
      await pg.waitForTimeout(2500);
    }
    await horario().click({ timeout: 25000 });
    return null;
  }catch(e){ return String(e.message || e).split('\n')[0]; }
}

async function medirCalendario({ bloco, porta, escolherPacote = false, permitir = REDE, bloquear = [], esperaExtra = 0 }){
  return await comBlocoNaPagina({
    bloco, porta, permitir, bloquear,
    corpoDepois: ENCHIMENTO,
    medir: async pg => {
      const r = {};
      if(escolherPacote){
        /* o calendario da vitrine so nasce quando um pacote e escolhido */
        await pg.locator('.fca-card').first().click({ timeout: 15000 });
      }
      if(esperaExtra) await pg.waitForTimeout(esperaExtra);
      r.repouso = await alturaEstavel(pg);
      r.iframes = await contarIframes(pg);
      r.lib = await pg.evaluate(() => {
        const f = document.querySelector('iframe.tidycal-embed, iframe.fca-tidycal');
        return f ? (f.getAttribute('data-fc-lib') || '') : '';
      });
      r.falhaClique = await abrirFormulario(pg);
      await pg.waitForTimeout(5000);
      r.comFormulario = await alturaReal(pg);
      /* a expansao do formulario vem de min-height, e min-height ganha do height: o valor
         lido acima ja e o do quadro expandido */
      if(escolherPacote){
        /* a TROCA DE PACOTE, que na vitrine troca tambem o dominio */
        try{
          await pg.locator('.fca-trocar').first().click({ timeout: 8000 });
          await pg.locator('.fca-card').nth(1).click({ timeout: 8000 });
          r.aposTrocar = await alturaEstavel(pg);
          r.iframesAposTrocar = await contarIframes(pg);
        }catch(e){ r.aposTrocar = 'nao trocou: ' + String(e.message || e).split('\n')[0]; }
      }
      return r;
    }
  });
}

/* UMA SEGUNDA CHANCE QUANDO A MEDIDA NAO SAIU. Medido: com varias passagens seguidas o
   servidor do TidyCal as vezes demora tanto que o calendario nao termina de desenhar dentro
   dos 30s -- e o que se le entao e o PISO (500px, posto pela propria biblioteca deles como
   min-height) ou a altura de PARTIDA. Nenhum dos dois e uma medida: sao o carregamento. Em
   vez de aceitar esse numero e acusar uma regressao que nao existe, a passagem inteira e
   refeita uma vez. Se na segunda tambem nao sair, o numero vai para a tela como esta e a
   verificacao falha -- que e o certo: "nao mediu" tem de aparecer, nao ser escondido. */
async function medirComSegundaChance(op, tentativas = 3){
  let r = null;
  for(let i = 0; i < tentativas; i++){
    r = await medirCalendario(Object.assign({}, op, { porta: op.porta + i * 100 }));
    if(PISO_ESPERA.indexOf(r.repouso) < 0) return r;
    console.log('      (a altura nao saiu do carregamento -- ' + r.repouso + 'px' +
                (i + 1 < tentativas ? '; refazendo a passagem)' : '; desisti)'));
  }
  return r;
}

/* ===== a comparacao NOVO x ATUAL ===== */
function comparar(rot, novo, atual){
  const eA = errosDoBloco(atual.erros), eN = errosDoBloco(novo.erros);
  console.log('\n  ' + rot);
  console.log('      atual: repouso=' + atual.repouso + '  formulario=' + atual.comFormulario +
              '  iframes=' + atual.iframes + '  erros=' + eA.length +
              (atual.falhaClique ? '  [clique: ' + atual.falhaClique.slice(0, 40) + ']' : ''));
  console.log('      novo : repouso=' + novo.repouso + '  formulario=' + novo.comFormulario +
              '  iframes=' + novo.iframes + '  lib=' + (novo.lib || '-') + '  erros=' + eN.length +
              (novo.falhaClique ? '  [clique: ' + novo.falhaClique.slice(0, 40) + ']' : ''));
  chk(rot + ': a altura em repouso acompanha o conteudo (saiu da de partida, 700px)',
      novo.repouso !== null && novo.repouso > 0 && novo.repouso !== 700, 'repouso=' + novo.repouso);
  chk(rot + ': a altura em repouso do novo nao e pior que a do atual (ate 8px de folga)',
      novo.repouso !== null && atual.repouso !== null && Math.abs(novo.repouso - atual.repouso) <= 8,
      'novo=' + novo.repouso + ' atual=' + atual.repouso);
  chk(rot + ': o formulario de reserva abre espaco (altura calibrada)',
      novo.comFormulario >= CALIBRADA, 'novo=' + novo.comFormulario);
  chk(rot + ': o atual tambem abria espaco -- a comparacao e justa',
      atual.comFormulario >= CALIBRADA, 'atual=' + atual.comFormulario);
  chk(rot + ': um iframe do calendario, sem fantasma do embed.js',
      novo.iframes <= atual.iframes, 'novo=' + novo.iframes + ' atual=' + atual.iframes);
  chk(rot + ': sem erro de console no bloco novo',
      eN.length === 0, JSON.stringify(eN.slice(0, 2)));
}

/* ===== main ===== */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-tidy-'));
try{
  execFileSync('sh', ['-c', 'git -C "' + RAIZ + '" archive ' + REF + ' | tar -x -C "' + tmp + '"']);
}catch(e){
  console.log('Nao consegui extrair a referencia "' + REF + '": ' + (e.message || e));
  process.exit(1);
}
console.log('referencia: ' + REF + '\nhosts liberados: ' + REDE.join(', ') + '\n');

console.log('gerando os blocos (arvore de trabalho e referencia)...');
const bloco = {
  novoTidy:  await gerarTidy(RAIZ, TIDY, 8961),
  novoProp:  await gerarTidy(RAIZ, PROP, 8962),
  novoPac:   await gerarPac(RAIZ, 8963),
  atualTidy: await gerarTidy(tmp, TIDY, 8964),
  atualProp: await gerarTidy(tmp, PROP, 8965),
  atualPac:  await gerarPac(tmp, 8966)
};
for(const k of Object.keys(bloco))
  chk('bloco ' + k + ' foi gerado', (bloco[k] || '').length > 200, 'tamanho=' + (bloco[k] || '').length);

console.log('\n===== 1. aba TidyCal em tidycal.com (o bloco que esta em producao) =====');
comparar('tidycal.com',
  await medirComSegundaChance({ bloco: bloco.novoTidy,  porta: 8971 }),
  await medirComSegundaChance({ bloco: bloco.atualTidy, porta: 8972 }));

console.log('\n===== 2. aba TidyCal em dominio proprio =====');
comparar('dominio proprio',
  await medirComSegundaChance({ bloco: bloco.novoProp,  porta: 8973 }),
  await medirComSegundaChance({ bloco: bloco.atualProp, porta: 8974 }));

console.log('\n===== 3. Agendamento por pacote (dois pacotes, dois dominios) =====');
const pacNovo  = await medirComSegundaChance({ bloco: bloco.novoPac,  porta: 8975, escolherPacote: true });
const pacAtual = await medirComSegundaChance({ bloco: bloco.atualPac, porta: 8976, escolherPacote: true });
comparar('por pacote', pacNovo, pacAtual);
console.log('      troca de pacote (e de dominio): atual=' + pacAtual.aposTrocar +
            '  novo=' + pacNovo.aposTrocar + '  iframes depois=' + pacNovo.iframesAposTrocar);
chk('por pacote: trocar de pacote (e de dominio) mede a altura do novo calendario',
    typeof pacNovo.aposTrocar === 'number' && pacNovo.aposTrocar > 0 && pacNovo.aposTrocar !== 700,
    'aposTrocar=' + pacNovo.aposTrocar);
chk('por pacote: e a altura depois da troca e a mesma do bloco atual (ate 8px de folga)',
    typeof pacNovo.aposTrocar === 'number' && typeof pacAtual.aposTrocar === 'number' &&
    Math.abs(pacNovo.aposTrocar - pacAtual.aposTrocar) <= 8,
    'novo=' + pacNovo.aposTrocar + ' atual=' + pacAtual.aposTrocar);
chk('por pacote: trocar de pacote nao deixa dois iframes na pagina',
    pacNovo.iframesAposTrocar === 1, 'iframes=' + pacNovo.iframesAposTrocar);

console.log('\n===== 4. os tres casos de degradacao (so no bloco novo) =====');
/* a. tudo liberado -- ja medido acima: a marca data-fc-lib diz que a biblioteca assumiu. */
const degA = await medirComSegundaChance({ bloco: bloco.novoTidy, porta: 8977 });
chk('degradacao a) a biblioteca carrega e assume a altura', degA.lib === '1', 'data-fc-lib=' + degA.lib);
chk('degradacao a) e a altura acompanha o conteudo', degA.repouso > 0 && degA.repouso !== 700, 'repouso=' + degA.repouso);

/* b. O embed.js nao chega, e o aperto de mao proprio assume. O que se bloqueia e o ARQUIVO,
   e nao o host: medido, o CDN deles tambem serve os scripts da propria pagina do calendario,
   entao fechar o host inteiro mediria uma pagina em branco, e nao um bloco sem biblioteca. */
const degB = await medirComSegundaChance({ bloco: bloco.novoTidy, porta: 8978, bloquear: ['/js/embed.js'] });
console.log('      b) embed.js bloqueado: repouso=' + degB.repouso + '  formulario=' + degB.comFormulario +
            '  lib=' + (degB.lib || '-') + '  erros=' + errosDoBloco(degB.erros).length);
chk('degradacao b) sem a biblioteca, o aperto de mao proprio assume', degB.lib !== '1', 'data-fc-lib=' + degB.lib);
chk('degradacao b) e a altura continua acompanhando o conteudo', degB.repouso > 0 && degB.repouso !== 700, 'repouso=' + degB.repouso);
chk('degradacao b) e o formulario continua abrindo espaco', degB.comFormulario >= CALIBRADA, 'altura=' + degB.comFormulario);
chk('degradacao b) sem erro de console', errosDoBloco(degB.erros).length === 0, JSON.stringify(errosDoBloco(degB.erros).slice(0, 2)));

/* c. a biblioteca carrega e o calendario nao responde (aqui: o proprio iframe bloqueado).
   O que se cobra e o que o cabecalho da fonte promete -- nada quebra e nada zera: a altura
   fica na de PARTIDA (700px), que e o mesmo numero que o embed.js deles usa antes de medir. */
const degC = await medirCalendario({ bloco: bloco.novoTidy, porta: 8979,
  permitir: ['asset-tidycal.b-cdn.net'] });
console.log('      c) calendario mudo: repouso=' + degC.repouso + '  iframes=' + degC.iframes +
            '  erros=' + errosDoBloco(degC.erros).length);
chk('degradacao c) sinal nenhum: a altura fica na de partida, e nao zera',
    degC.repouso === 700, 'repouso=' + degC.repouso);
chk('degradacao c) sem erro de console', errosDoBloco(degC.erros).length === 0, JSON.stringify(errosDoBloco(degC.erros).slice(0, 2)));

console.log('\n===== 5. DOIS blocos na mesma pagina =====');
/* O cuidado que a rodada pediu para medir, e nao para supor: dois blocos destes podem cair na
   mesma pagina do Prosite (um calendario simples e uma vitrine de pacotes). O embed.js nao
   pode ser baixado duas vezes, e as duas instancias nao podem se atrapalhar. Medido tambem
   aqui o outro cuidado: o embed.js varre 'div.tidycal-embed' e '#tidycal-embed' ao carregar --
   nenhum dos dois blocos tem esses seletores, entao nao nasce iframe fantasma apontando para
   tidycal.com ao lado dos nossos. */
const dois = await comBlocoNaPagina({
  bloco: bloco.novoTidy, corpoDepois: bloco.novoPac + ENCHIMENTO, porta: 8980, permitir: REDE,
  medir: async pg => {
    await pg.locator('.fca-card').first().click({ timeout: 15000 });
    await alturaEstavel(pg);
    return await pg.evaluate(() => ({
      tags: document.querySelectorAll('script[data-fc-tidycal]').length,
      embedjs: Array.from(document.scripts).filter(s => s.src.indexOf('embed.js') >= 0).length,
      iframes: document.querySelectorAll('iframe').length,
      alturaT: Math.round(document.querySelector('iframe.tidycal-embed').getBoundingClientRect().height),
      alturaP: Math.round(document.querySelector('iframe.fca-tidycal').getBoundingClientRect().height),
      divs: document.querySelectorAll('div.tidycal-embed, #tidycal-embed').length
    }));
  }
});
console.log('      tags data-fc-tidycal=' + dois.tags + '  scripts embed.js=' + dois.embedjs +
            '  iframes=' + dois.iframes + '  altura(tidycal)=' + dois.alturaT +
            '  altura(pacote)=' + dois.alturaP + '  erros=' + errosDoBloco(dois.erros).length);
chk('dois blocos: o embed.js entra na pagina UMA vez so', dois.embedjs === 1 && dois.tags === 1,
    'tags=' + dois.tags + ' scripts=' + dois.embedjs);
chk('dois blocos: nenhum seletor que o embed.js varre (nada de iframe fantasma)', dois.divs === 0, 'divs=' + dois.divs);
chk('dois blocos: dois iframes, um de cada bloco', dois.iframes === 2, 'iframes=' + dois.iframes);
chk('dois blocos: o calendario da aba TidyCal mediu a propria altura',
    dois.alturaT > 0 && dois.alturaT !== 700, 'altura=' + dois.alturaT);
chk('dois blocos: o calendario da vitrine mediu a propria altura',
    dois.alturaP > 0 && dois.alturaP !== 700, 'altura=' + dois.alturaP);
chk('dois blocos: sem erro de console', errosDoBloco(dois.erros).length === 0,
    JSON.stringify(errosDoBloco(dois.erros).slice(0, 2)));

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(resumo());
