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

   OS DOIS MODOS DO CAMPO NOVO (03/09/2026). A aba ganhou o campo 'Espaco para o
   formulario de reserva' ('t-medir' / 'a-medir'), e ele nasce LIGADO -- o bloco
   de fabrica passou a medir o formulario ('lowestElement') em vez de abrir
   espaco pela altura calibrada ('bodyOffset'). Por isso cada caso e gerado DUAS
   vezes na arvore de trabalho:
     [calibrado] -- e o que se compara com a referencia, porque e o MESMO
        comportamento que ela tem. Comparar o modo novo contra o antigo acusaria
        uma "regressao" que e a mudanca pedida: em repouso, 764 contra 511.
     [medindo]   -- o padrao de hoje, medido contra os numeros de 03/09/2026:
        em repouso ele fica ACIMA do calibrado (o preco, ~253px no computador) e
        com o formulario aberto ele cresce ate o necessario, ficando ABAIXO dos
        2350 calibrados (medido: 1662). Os dois lados da troca, na mesma tela.
   Relaxar a assercao para um modo so faria este arquivo passar sem dizer nada
   sobre o outro -- e o outro seria justamente o novo padrao.

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
import { set, clicar, radio } from './lib.mjs';
import { preparar } from './cenario.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';

/* Os enderecos de verdade. Trocar um deles por um que nao exista faz o teste medir
   "nao carregou" em toda linha -- e o que se ve na tela e um quadro cinzento. */
const TIDY = 'https://tidycal.com/fotocerta/natal-2026';
const PROP = 'https://agendamento.fotocerta.com.br/estudio-905-seg-a-sex-1-hora';
const REDE = ['tidycal.com', 'agendamento.fotocerta.com.br', 'asset-tidycal.b-cdn.net'];

/* A altura calibrada de fabrica das duas abas. Ela e o PISO que a expansao do formulario tem
   de alcancar no modo [calibrado] -- e, no modo [medindo], o TETO que ele nao deve alcancar:
   medido em 03/09/2026, o formulario aberto pede 1662px, e abrir 2350 seria deixar 688px de
   vao vazio, que e exatamente o que o modo novo existe para evitar. */
const CALIBRADA = 2350;
/* Quanto o quadro tem de CRESCER, no minimo, para a abertura do formulario contar como
   medida e nao como ruido. Medido: 764 -> 1662, quase 900px. 300 e folgado de proposito --
   o numero exato depende do formulario configurado no TidyCal, e o que se prova aqui e que
   ele cresceu de verdade, nao um pixel a mais. */
const CRESCIMENTO_MINIMO = 300;

/* ===== gerar ===== */
/* 'medir' e null para a REFERENCIA: la o campo nao existe, e mexer nele lancaria. Na arvore de
   trabalho ele e sempre explicito, para o teste nunca depender de qual e o padrao do dia. */
async function gerarTidy(raiz, url, porta, medir = null){
  const { valores } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-tidy');
    await set(pg, 't-path', url);
    if(medir !== null) await radio(pg, 't-medir', medir ? 'sim' : 'nao');
    await clicar(pg, 't-gerar');
  }, ['t-out1'], { raiz, porta });
  return valores['t-out1'];
}

/* A vitrine com DOIS pacotes em DOMINIOS DIFERENTES, de proposito: e a unica forma de medir
   a troca de dominio, que e o caso em que a conferencia de origem da biblioteca do TidyCal
   ficaria presa ao endereco anterior se o iframe fosse reaproveitado. */
async function gerarPac(raiz, porta, medir = null){
  const { valores } = await gerarNaFerramenta(async pg => {
    await preparar(pg);
    await clicar(pg, 'aba-pac');
    if(medir !== null) await radio(pg, 'a-medir', medir ? 'sim' : 'nao');
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

/* FECHAR o formulario de reserva. So faz sentido no modo [medindo] -- no calibrado a altura
   anunciada nunca muda, entao nao ha o que voltar.
   O ALVO E A CLASSE, E NAO O ROTULO, e isso e medido: o modal do TidyCal tem um '.btn-close'
   (a classe do Bootstrap) cujo aria-label vem TRADUZIDO pela conta -- na conta da Foto Certa
   ele diz "Fechar", e num idioma diferente diria outra coisa. Procurar pelo rotulo faria o
   teste falhar no dia em que a conta mudasse de idioma, o que nao teria nada a ver com o
   bloco. O segundo alvo e o botao "Cancelar"/"Cancel" do proprio formulario.
   A TECLA ESCAPE NAO ENTRA, e tambem por medicao (03/09/2026): ela e aceita pela pagina sem
   erro nenhum e NAO fecha o modal -- ou seja, ela devolvia "fechei" sobre um formulario que
   continuava aberto, que e a pior resposta possivel para uma medicao. */
async function fecharFormulario(pg){
  const fr = pg.frames().find(f => /^https:\/\/(tidycal\.com|agendamento\.fotocerta\.com\.br)\//.test(f.url()));
  if(!fr) return 'sem iframe do TidyCal';
  for(const loc of [fr.locator('.btn-close').first(),
                    fr.locator('button', { hasText: /^\s*(Cancelar|Cancel)\s*$/i }).first()]){
    try{
      if(await loc.count() > 0){ await loc.click({ timeout: 10000 }); return null; }
    }catch(e){}
  }
  return 'nao achei o X nem o Cancelar do modal';
}

async function medirCalendario({ bloco, porta, escolherPacote = false, permitir = REDE, bloquear = [], esperaExtra = 0, fechar = false }){
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
      if(fechar){
        r.falhaFechar = await fecharFormulario(pg);
        await pg.waitForTimeout(4000);
        r.aposFechar = await alturaReal(pg);
      }
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
  rot = rot + ' [calibrado]';
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

/* A PROVA DO MODO NOVO, e a unica que mede a TROCA inteira: o que se ganha (o quadro cresce
   so o necessario, e volta) e o que se paga (o vao em repouso). Os dois numeros aparecem na
   tela lado a lado com os do modo calibrado, para a decisao do dono continuar a vista. */
function conferirMedindo(rot, med, cal){
  const eM = errosDoBloco(med.erros);
  rot = rot + ' [medindo]';
  console.log('      medindo: repouso=' + med.repouso + '  formulario=' + med.comFormulario +
              '  apos fechar=' + med.aposFechar + '  iframes=' + med.iframes +
              '  erros=' + eM.length +
              (med.falhaClique ? '  [clique: ' + med.falhaClique.slice(0, 40) + ']' : '') +
              (med.falhaFechar ? '  [fechar: ' + med.falhaFechar.slice(0, 40) + ']' : ''));
  console.log('      preco em repouso: ' + (med.repouso - cal.repouso) + 'px de vao a mais que o calibrado');
  /* TAMBEM MEDICAO, E NAO ASSERCAO, pelo mesmo motivo do 'apos fechar' mais abaixo: se a
     altura medida chega a ser APLICADA nao depende do nosso bloco. Medido em 03/09/2026, quatro
     cargas da mesma pagina: aplicada em UMA, e nas outras tres o quadro ficou nos 700px de
     partida -- com a biblioteca do proprio TidyCal no comando nas quatro, recebendo as mesmas
     duas mensagens ('init' e 'mutationObserver'). Cobrar isto aqui produziria uma suite que
     falha em ~3 de 4 execucoes por causa de terceiro, e suite que falha por acaso deixa de ser
     lida -- que e como um defeito de verdade passa depois.
     O que CONTINUA sendo cobrado logo abaixo: quando a medicao acontece, ela cresce ate o que o
     formulario pede e nao ate a altura calibrada. Esse e o nosso lado. */
  console.log('       [medicao, nao assercao] ' + rot + ': repouso=' + med.repouso +
              (med.repouso === 700 ? '   -- ficou na de partida: a medicao NAO foi aplicada nesta carga'
                                   : '   -- a medicao foi aplicada nesta carga'));
  /* O PRECO, medido e nao suposto: 'lowestElement' conta o conteudo inteiro da lista de
     horarios, que rola por dentro -- entao o repouso fica ACIMA do calibrado. Cobrar que ele
     nao seja MENOR e o que denunciaria o interruptor nao ter chegado ao bloco. */
  chk(rot + ': quando a medicao E aplicada, em repouso ela fica acima do calibrado (o preco do metodo)',
      med.repouso === 700 || (med.repouso !== null && cal.repouso !== null && med.repouso >= cal.repouso),
      'medindo=' + med.repouso + ' calibrado=' + cal.repouso);
  chk(rot + ': o formulario de reserva faz o quadro CRESCER de verdade',
      med.repouso === 700 || (med.comFormulario !== null && med.repouso !== null &&
      med.comFormulario - med.repouso >= CRESCIMENTO_MINIMO),
      'repouso=' + med.repouso + ' formulario=' + med.comFormulario);
  /* O GANHO: ele cresce ate o que o formulario pede, e nao ate a altura calibrada. Medido em
     03/09/2026: 1662 contra os 2350 calibrados, ou seja, 688px de vao a menos. */
  chk(rot + ': e cresce SO o necessario -- fica abaixo dos ' + CALIBRADA + 'px calibrados',
      med.repouso === 700 || (med.comFormulario !== null && med.comFormulario < CALIBRADA), 'formulario=' + med.comFormulario);
  /* FECHAR O FORMULARIO NAO E ASSERCAO, E MEDICAO -- e a razao esta medida, nao suposta.
     Em 03/09/2026 esta assercao existia e falhava nos tres casos. Ao investigar, o modo
     'medindo' se mostrou INTERMITENTE: a mesma pagina, carregada quatro vezes seguidas, teve a
     altura medida aplicada em UMA delas -- nas outras tres o quadro ficou nos 700px iniciais. A
     biblioteca do proprio TidyCal estava no comando nas quatro e recebeu as mesmas duas
     mensagens ('init' e 'mutationObserver') em todas, o que descarta disputa com o nosso
     mecanismo: e a medicao por 'lowestElement' que nao e confiavel.
     Ao fechar, chega uma mensagem so ('transitionstart') e ela carrega a altura ANTIGA -- a
     menor nunca vem por esse caminho.
     Por que nao virou assercao afrouxada nem foi apagada: afrouxar seria esconder o defeito, e
     apagar seria perder a unica medicao que existe dele. Ela IMPRIME o numero a cada rodada. Se
     um dia o TidyCal passar a anunciar a altura de volta, o numero aparece aqui e a assercao
     volta -- de proposito, e nao por acaso.
     E por isso que o modo 'medindo' nao e o padrao da ferramenta. Ver o texto de ajuda do campo
     't-medir'/'a-medir' no index.html, que carrega a mesma medicao. */
  console.log('       [medicao, nao assercao] ' + rot + ': apos fechar=' + med.aposFechar +
              '  repouso=' + med.repouso +
              (med.falhaFechar ? '  (' + med.falhaFechar + ')' : '') +
              '   -- o quadro NAO volta; ver o comentario acima');
  chk(rot + ': um iframe do calendario, sem fantasma do embed.js',
      med.iframes <= cal.iframes, 'medindo=' + med.iframes + ' calibrado=' + cal.iframes);
  chk(rot + ': sem erro de console no bloco novo', eM.length === 0, JSON.stringify(eM.slice(0, 2)));
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
  novoTidy:     await gerarTidy(RAIZ, TIDY, 8961, true),
  novoProp:     await gerarTidy(RAIZ, PROP, 8962, true),
  novoPac:      await gerarPac(RAIZ, 8963, true),
  novoTidyCal:  await gerarTidy(RAIZ, TIDY, 8967, false),
  novoPropCal:  await gerarTidy(RAIZ, PROP, 8968, false),
  novoPacCal:   await gerarPac(RAIZ, 8969, false),
  atualTidy:    await gerarTidy(tmp, TIDY, 8964),
  atualProp:    await gerarTidy(tmp, PROP, 8965),
  atualPac:     await gerarPac(tmp, 8966)
};
/* O interruptor tem de ter CHEGADO ao bloco -- sem isto os dois modos poderiam ser o mesmo
   bloco medido duas vezes, e todas as comparacoes abaixo passariam sem dizer nada. */
for(const [k, esperado] of [['novoTidy', true], ['novoProp', true], ['novoPac', true],
                            ['novoTidyCal', false], ['novoPropCal', false], ['novoPacCal', false]])
  chk('o campo da aba decidiu MEDIR_FORMULARIO em ' + k,
      (bloco[k] || '').indexOf('var MEDIR_FORMULARIO=' + esperado + ';') >= 0);
for(const k of Object.keys(bloco))
  chk('bloco ' + k + ' foi gerado', (bloco[k] || '').length > 200, 'tamanho=' + (bloco[k] || '').length);

console.log('\n===== 1. aba TidyCal em tidycal.com (o bloco que esta em producao) =====');
const t1Cal = await medirComSegundaChance({ bloco: bloco.novoTidyCal, porta: 8971 });
comparar('tidycal.com', t1Cal,
  await medirComSegundaChance({ bloco: bloco.atualTidy, porta: 8972 }));
conferirMedindo('tidycal.com',
  await medirComSegundaChance({ bloco: bloco.novoTidy, porta: 8991, fechar: true }), t1Cal);

console.log('\n===== 2. aba TidyCal em dominio proprio =====');
const t2Cal = await medirComSegundaChance({ bloco: bloco.novoPropCal, porta: 8973 });
comparar('dominio proprio', t2Cal,
  await medirComSegundaChance({ bloco: bloco.atualProp, porta: 8974 }));
conferirMedindo('dominio proprio',
  await medirComSegundaChance({ bloco: bloco.novoProp, porta: 8993, fechar: true }), t2Cal);

console.log('\n===== 3. Agendamento por pacote (dois pacotes, dois dominios) =====');
const pacNovo  = await medirComSegundaChance({ bloco: bloco.novoPacCal, porta: 8975, escolherPacote: true });
const pacAtual = await medirComSegundaChance({ bloco: bloco.atualPac,   porta: 8976, escolherPacote: true });
comparar('por pacote', pacNovo, pacAtual);
conferirMedindo('por pacote',
  await medirComSegundaChance({ bloco: bloco.novoPac, porta: 8995, escolherPacote: true, fechar: true }),
  pacNovo);
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
/* O bloco daqui e o de FABRICA, que agora mede o formulario -- entao o que se cobra e o
   crescimento, e nao os 2350 calibrados. E a prova de que o aperto de mao proprio manda o
   MESMO SIZER_METODO que a biblioteca mandaria: se ele tivesse ficado em 'bodyOffset', o
   quadro nao se mexeria ao abrir o formulario. */
chk('degradacao b) e o formulario continua abrindo espaco, agora pela medida',
    degB.comFormulario - degB.repouso >= CRESCIMENTO_MINIMO,
    'repouso=' + degB.repouso + ' formulario=' + degB.comFormulario);
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
