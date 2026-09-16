/* ============================================================================
   OS CINCO FORMATOS DE CHAVE PIX, EM TODA ABA QUE COBRA (16/09/2026)
   ============================================================================
   O BURACO QUE ISTO FECHA. Toda suite de Pix deste projeto usa chave em formato de
   E-MAIL -- geradores.mjs, chave-pix-limpeza.mjs, limites-visiveis.mjs, id-orcamento.mjs,
   qr-configuravel.mjs, o cenario inteiro. Os outros quatro formatos que o Banco Central
   aceita (CPF, CNPJ, telefone com +55 e chave aleatoria) nunca foram medidos em lugar
   nenhum, em aba nenhuma.

   POR QUE ISSO IMPORTA, e nao e zelo. O BR Code e um formato de campos com TAMANHO
   DECLARADO (TLV) fechado por um CRC16. A chave mora no campo 26, dentro do subcampo
   01, e o comprimento dela e escrito no proprio codigo. Os cinco formatos tem
   comprimentos e conjuntos de caracteres bem diferentes -- 11 digitos, 14 digitos, 14
   caracteres com um '+' na frente, 36 caracteres com hifens, e um e-mail de tamanho
   qualquer. Um erro de comprimento em UM campo desloca todos os seguintes e quebra o
   codigo inteiro; e quem descobre e o cliente, no aplicativo do banco, com uma mensagem
   que nao explica nada. E o defeito mais caro desta ferramenta: silencioso na tela de
   quem gera, barulhento na tela de quem paga.

   O QUE ESTA PROVA MEDE. Para cada um dos CINCO formatos (o e-mail entra como
   controle), em CADA aba que cobra -- a lista sai de FC_PAG_PREFS, lida do index.html
   em vez de cravada aqui, para que uma aba de pagamento nova entre nesta prova sozinha:
     1. a ferramenta ACEITA a chave e gera o bloco, sem alerta e sem erro de console;
     2. o bloco emite a chave EXATAMENTE como ela e depois da limpeza da ferramenta;
     3. o bloco EXECUTA numa pagina de verdade e monta o BR Code;
     4. o BR Code, relido por um leitor TLV escrito AQUI DENTRO, FECHA: campo a campo,
        comprimento declarado batendo com o conteudo, e nada sobrando no fim;
     5. o CRC16 recalculado AQUI bate com o campo 63 do proprio codigo;
     6. o campo 26 traz o identificador do arranjo e a chave esperada, caractere por
        caractere, com o comprimento certo;
     7. o campo 54 traz o MESMO valor que o cliente le na tela.

   O LEITOR TLV E O CRC16 SAO ESCRITOS AQUI, e nao importados. Conferir o projeto com a
   implementacao do projeto seria perguntar a ele se concorda consigo mesmo. E
   transcrever a conta do original -- copiar o laco de bits de FC_PIX_SRC.crc16 -- seria
   eco, nao segunda opiniao: o mesmo engano seria reproduzido dos dois lados e a
   conferencia passaria. Por isso o CRC16 daqui e o CRC-16/CCITT-FALSE calculado por
   TABELA, byte a byte -- a mesma norma por um caminho estruturalmente diferente do laco
   de bits do arquivo compartilhado. Se os dois discordarem, um dos dois esta errado, e
   e isso que se quer poder descobrir.

   O QUE A LIMPEZA FAZ, e foi LIDO no codigo e nao suposto (fc-compartilhado.js,
   pixLimpar): ela apara das PONTAS espacos, caracteres de controle e invisiveis -- e
   MAIS NADA. Ela NAO tira pontuacao de CPF, de CNPJ nem de telefone. Quem cuida disso e
   pixChaveFormato, que RECUSA -- e a recusa e deliberada, esta escrita no proprio
   arquivo ("RECUSA, nunca correcao"). Entao a forma final esperada de cada formato e a
   forma canonica do Banco Central, e a parte 3 desta prova mede o outro lado: chave com
   a pontuacao que uma pessoa naturalmente digita e RECUSADA, e nenhum bloco sai.

   SEM REFERENCIA CONGELADA. Nada aqui compara com 'main' nem com commit nenhum: a
   propriedade medida e da arvore de hoje. Nao envelhece.

   A REDE EXTERNA FICA FECHADA: o QR e desenhado por uma biblioteca de cdnjs, e ela nao
   e necessaria -- o payload ja esta na caixa de copiar antes de desenharQr ser chamada,
   e desenharQr degrada sozinha quando a biblioteca nao chega.

   ROTEIRO: node scripts/verificar/chave-pix-formatos.mjs
   Precisa de Node e Playwright -- ver scripts/verificar/lib.mjs.
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, radio, clicar } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const IDX = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

/* ============================================================================
   A LISTA VIVA DAS ABAS QUE COBRAM
   ============================================================================
   Sai de FC_PAG_PREFS, que e a lista unica do projeto (uma rede da partida ja obriga
   toda aba com pagamento:true a estar nela). Cravar os cinco prefixos aqui criaria a
   sexta copia da mesma lista, que e o defeito que este projeto ja eliminou tres vezes. */
const PREFS = ((/var FC_PAG_PREFS=\[([^\]]*)\]/.exec(IDX) || [, ''])[1]
  .match(/'([a-z]+)'/g) || []).map(s => s.replace(/'/g, ''));

/* ============================================================================
   AS CINCO CHAVES
   ============================================================================
   Nenhuma delas e real -- este repositorio e publico. O CPF e o CNPJ sao os dois
   exemplos classicos de documento com digitos verificadores validos usados em teste, e
   a chave aleatoria e o UUID de exemplo da propria RFC. O telefone e o mesmo numero de
   exemplo que o placeholder da ferramenta mostra. */
const CHAVES = [
  ['email',     'ensaio@fotocerta.com.br',               'o controle: e o unico formato que as outras suites ja exercitam'],
  ['cpf',       '11144477735',                           '11 digitos, sem pontuacao -- e o que pixChaveFormato aceita'],
  ['cnpj',      '11222333000181',                        '14 digitos, sem pontuacao'],
  ['telefone',  '+5527999998888',                        'comeca com "+", que e o unico formato com caractere de pontuacao'],
  ['aleatoria', '123e4567-e89b-12d3-a456-426614174000',  '36 caracteres com hifen: a mais longa das cinco']
];

/* As chaves que uma PESSOA digita, com a pontuacao que ela le no documento. Nenhuma
   delas pode gerar bloco: pixChaveFormato recusa, de proposito. */
const HUMANAS = [
  ['cpf pontuado',      '111.444.777-35'],
  ['cnpj pontuado',     '11.222.333/0001-81'],
  ['telefone sem +55',  '27999998888'],
  ['telefone formatado','(27) 99999-8888'],
  ['aleatoria sem hifen','123e4567e89b12d3a456426614174000']
];

const IDENT_BASE = { nomer: 'Foto Certa', cidade: 'Vitoria',
  client: 'AbCdEf123456789ClientIdDeTeste', zapnum: '5527999998888' };

/* ============================================================================
   O LEITOR TLV E O CRC16 -- ESCRITOS AQUI, DE PROPOSITO
   ============================================================================ */
/* CRC-16/CCITT-FALSE por TABELA (polinomio 0x1021, inicial 0xFFFF, sem reflexao e sem
   xor final). A tabela e construida uma vez, na carga. */
const TAB_CRC = (() => {
  const t = new Uint16Array(256);
  for (let b = 0; b < 256; b++) {
    let r = b << 8;
    for (let k = 0; k < 8; k++) r = (r & 0x8000) ? (((r << 1) ^ 0x1021) & 0xFFFF) : ((r << 1) & 0xFFFF);
    t[b] = r;
  }
  return t;
})();
function crc16(texto) {
  let r = 0xFFFF;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    /* Fora de ASCII o BR Code ja e invalido -- e quem cobra isso e a parte 'ascii'
       abaixo. Aqui o byte e tomado explicitamente, para a conta nunca ficar ambigua. */
    r = ((r << 8) & 0xFFFF) ^ TAB_CRC[((r >> 8) ^ (c & 0xFF)) & 0xFF];
  }
  return ('000' + r.toString(16).toUpperCase()).slice(-4);
}

/* Percorre uma cadeia TLV e exige que ela FECHE EXATAMENTE. Devolve
   {campos:{id:valor}, ordem:[[id,valor]...]} ou {erro:'...'}. Nao ha melhor esforco:
   comprimento que nao seja dois digitos, conteudo mais curto que o declarado, ou
   qualquer byte sobrando no fim derrubam a leitura -- que e exatamente o que o
   aplicativo do banco faz. */
function lerTlv(s) {
  const campos = {}, ordem = [];
  let i = 0;
  while (i < s.length) {
    if (i + 4 > s.length) return { erro: 'cabecalho cortado na posicao ' + i };
    const id = s.substr(i, 2), dois = s.substr(i + 2, 2);
    if (!/^[0-9]{2}$/.test(id)) return { erro: 'id nao numerico "' + id + '" na posicao ' + i };
    if (!/^[0-9]{2}$/.test(dois)) return { erro: 'comprimento nao numerico "' + dois + '" na posicao ' + (i + 2) };
    const tam = parseInt(dois, 10);
    const v = s.substr(i + 4, tam);
    if (v.length !== tam) return { erro: 'campo ' + id + ' declara ' + tam + ' e so ha ' + v.length };
    if (campos[id] === undefined) { campos[id] = v; }
    ordem.push([id, v]);
    i += 4 + tam;
  }
  if (i !== s.length) return { erro: 'sobraram bytes no fim' };
  return { campos, ordem };
}

/* Abre um BR Code inteiro: separa o CRC, confere a forma, le os campos e devolve o que
   esta prova pergunta. Cada recusa tem um nome proprio, para a falha dizer ONDE parou
   em vez de so "nao deu". */
function abrirBrCode(p) {
  if (typeof p !== 'string' || p.length < 20) return { erro: 'payload curto demais: ' + JSON.stringify(p) };
  if (!/^[\x20-\x7E]+$/.test(p)) return { erro: 'ha caractere fora do ASCII imprimivel no payload' };
  const corpo = p.slice(0, -4), crcLido = p.slice(-4);
  if (corpo.slice(-4) !== '6304') return { erro: 'o payload nao termina com o campo 63 de 4 digitos' };
  const r = lerTlv(corpo.slice(0, -4));
  if (r.erro) return { erro: 'TLV: ' + r.erro };
  const crcCalc = crc16(corpo);
  const conta = r.campos['26'] === undefined ? { erro: 'sem campo 26' } : lerTlv(r.campos['26']);
  const adic = r.campos['62'] === undefined ? { campos: {} } : lerTlv(r.campos['62']);
  return {
    campos: r.campos,
    ordem: r.ordem,
    crcLido, crcCalc, crcOk: crcLido.toUpperCase() === crcCalc,
    arranjo: conta.erro ? null : conta.campos['00'],
    chave: conta.erro ? null : conta.campos['01'],
    contaErro: conta.erro || '',
    valor: r.campos['54'],
    txid: adic.erro ? null : adic.campos['05']
  };
}

/* "R$ 1.200,50" -> "1200.50". O que o cliente le na tela, na forma do campo 54. */
function daTela(t) {
  const s = String(t == null ? '' : t).replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(/,/g, '.');
  const n = Number(s);
  return isFinite(n) ? n.toFixed(2) : '(ilegivel: ' + JSON.stringify(t) + ')';
}

/* ============================================================================
   A PASSAGEM PELA FERRAMENTA: as cinco abas que cobram, com UMA chave
   ============================================================================
   'quando' no FUTURO de proposito: com horario passado a pagina de obrigado desenha o
   cartao de prazo vencido, que nao tem secao de pagamento nenhuma. */
const BUSCA_PAC = '?pac=ENS&data=' + encodeURIComponent('10/05/2030')
  + '&hora=' + encodeURIComponent('14:00') + '&quando=' + encodeURIComponent('2030-05-10T14:00:00Z');

/* A sonda do SDK do PayPal, no <head> e ANTES do bloco: os blocos penduram o script do
   SDK ja no carregamento, e a rede esta fechada. Sem ela o bloco fica esperando um
   onload que nunca chega. Mesmo texto de qr-configuravel.mjs, pelo mesmo motivo. */
const CABECA = '<scr' + 'ipt>(function(){\n'
  + 'var ins=document.head.appendChild;\n'
  + 'document.head.appendChild=function(n){\n'
  + '  if(n&&n.tagName==="SCRIPT"&&/paypal\\.com/.test(String(n.src||""))){\n'
  + '    window.paypal={Buttons:function(bt){window.__pp=bt;return {render:function(){}};}};\n'
  + '    setTimeout(function(){if(n.onload)n.onload();},0);\n'
  + '    return n;\n'
  + '  }\n'
  + '  return ins.call(document.head,n);\n'
  + '};\n'
  + 'window.alert=function(m){window.__av=(window.__av||[]);window.__av.push(String(m));};\n'
  + 'window.open=function(){return null;};\n'
  + '})();</scr' + 'ipt>';

const SAIDA   = { u: 'u-out', m: 'm-out', p: 'p-out1', a: 'a-out3', v: 'v-out' };
const PAYLOAD = { u: '.fcu-cola', m: '.fcm-cola', v: '.fcal-cola',
                  a: '.fca-ob-pixarea textarea', p: '.fcpg-cod' };
const NATELA  = { u: '.fcu-pixval-v', m: '.fcm-pixval-v', v: '.fcal-pixval-v',
                  a: '.fca-ob-preco-valor', p: '.fcpg-valor' };
const NOME    = { u: 'Checkout', m: 'Mini loja', p: 'Link de cobranca',
                  a: 'Agendamento por pacote', v: 'Calculadora de album' };

async function gerarComChave(chave, porta) {
  return await gerarNaFerramenta(async pg => {
    for (const [k, v] of Object.entries(IDENT_BASE)) await set(pg, 'fci-' + k, v);
    await set(pg, 'fci-chave', chave);

    /* ---------- Checkout (u) ---------- */
    await clicar(pg, 'aba-uni');
    await set(pg, 'u-pnome', 'Ensaio de familia'); await set(pg, 'u-ppreco', '1200');
    await clicar(pg, 'u-prod-salvar');
    await clicar(pg, 'u-gerar');

    /* ---------- Mini loja (m) ---------- */
    await clicar(pg, 'aba-loja');
    await set(pg, 'm-pnome', 'Album 30x30'); await set(pg, 'm-ppreco', '890');
    await set(pg, 'm-pcat', 'Albuns');
    /* A vitrine RECUSA produto sem foto -- sem este campo a aba nao gera nada. */
    await set(pg, 'm-pimg', 'https://storage.alboom.ninja/album-30x30.jpg');
    await clicar(pg, 'm-prod-salvar');
    await clicar(pg, 'm-gerar');

    /* ---------- Link de cobranca (p) ----------
       Esta aba mede duas coisas de uma vez: o BLOCO carrega a chave e o LINK carrega o
       payload montado pela ferramenta. A propria pagina remonta o codigo com a chave
       dela e RECUSA se der diferente -- entao um formato em que as duas pontas
       divergissem nao desenharia cartao nenhum. */
    await clicar(pg, 'aba-cob');
    await set(pg, 'p-url', 'https://fotocerta.com.br/pagar');
    await set(pg, 'p-desc', 'Ensaio de familia - pacote completo');
    await set(pg, 'p-valor', '1200,50');
    await set(pg, 'p-descpix', '0');
    await clicar(pg, 'p-gerar');
    await clicar(pg, 'p-gerarlink');

    /* ---------- Agendamento por pacote (a) ----------
       So Pix: sem SDK de cartao no caminho, um passo a menos entre o clique e a caixa
       de copiar, que e o que esta prova le. */
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC');
    await set(pg, 'a-descpix', '0');
    await radio(pg, 'a-metodo', 'pix');
    await set(pg, 'a-pcod', 'ENS'); await set(pg, 'a-pnome', 'Ensaio de familia');
    await set(pg, 'a-pdur', '1h'); await set(pg, 'a-ppreco', '1200');
    await set(pg, 'a-pinclui', '20 fotos'); await set(pg, 'a-ppath', 'fotocerta/ens');
    await clicar(pg, 'a-pac-salvar');
    await clicar(pg, 'a-gerar');

    /* ---------- Calculadora de album (v) ----------
       O SINAL SAI: nesta aba ele nasce LIGADO em 50%, e com ele o numero do campo 54 e
       o do sinal, nao o do album. Nao ha defeito nenhum nisso -- e so que a pergunta
       desta prova ("o campo 54 e o que o cliente le?") fica mais direta com um caminho
       a menos, e o valor do sinal ja tem suite propria. */
    await clicar(pg, 'aba-alb');
    await set(pg, 'v-cod', 'ALB26');
    await radio(pg, 'v-sinal', 'nao');
    await clicar(pg, 'v-gerar');
  }, ['u-out', 'm-out', 'p-out1', 'p-out2', 'a-out3', 'v-out'], { porta });
}

/* A chave que cada bloco carrega, lida do TEXTO dele. Barata, e independente da
   execucao: se ela ja estiver errada, o BR Code nem precisa ser montado para saber. */
function chaveEmitida(bloco) {
  const m = /var CHAVE_PIX='([^']*)'/.exec(String(bloco || ''));
  return m ? m[1] : null;
}

/* Abrir a area do Pix -- a unica coisa diferente entre as abas. Clica no LABEL, e nao
   no input: o marcador de selecao e DESENHADO (Manual do Prosite). */
async function abrirPix(pg, pref) {
  if (pref === 'u') {
    const lb = pg.locator('label:has(input[name="fcu-prod"][value="0"])');
    if (await lb.count()) { await lb.click(); await pg.waitForTimeout(150); }
    await pg.click('.fcu-gerar');
  } else if (pref === 'm') {
    await pg.locator('.fcm-card').first().click();
    await pg.waitForTimeout(150);
    await pg.click('.fcm-add');
    await pg.waitForTimeout(150);
    await pg.click('.fcm-gerar');
  } else if (pref === 'v') {
    await pg.locator('.fcal-tam').first().click();
    await pg.waitForTimeout(150);
    await pg.click('.fcal-gerar');
  } else if (pref === 'a') {
    await pg.locator('.fca-ob-bt').first().click();
  }
  /* 'p' nao precisa de clique nenhum: o cartao inteiro, com a caixa de copiar ja
     preenchida, e desenhado na carga a partir do proprio endereco. */
  await pg.waitForTimeout(450);
}

/* Roda UM bloco numa pagina e devolve o BR Code mais o valor que esta na tela. */
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|ERR_FAILED|Failed to load resource|ERR_BLOCKED/;
async function rodarBloco(valores, pref, porta) {
  const busca = pref === 'a' ? BUSCA_PAC
    : (pref === 'p' ? ('?' + ((valores['p-out2'] || '').split('?')[1] || '')) : '');
  const r = await comBlocoNaPagina({
    bloco: valores[SAIDA[pref]] || '', cabeca: CABECA, porta, busca,
    medir: async pg => {
      await pg.setViewportSize({ width: 1024, height: 1400 });
      let falha = '';
      try { await abrirPix(pg, pref); } catch (e) { falha = String(e).slice(0, 160); }
      await pg.waitForTimeout(400);
      const lido = await pg.evaluate(([sPay, sTela]) => {
        const ta = document.querySelector(sPay);
        const tv = document.querySelector(sTela);
        return { payload: ta ? (ta.value || ta.textContent || '') : null,
                 tela: tv ? tv.textContent : null,
                 avisos: (window.__av || []).slice(0, 3) };
      }, [PAYLOAD[pref], NATELA[pref]]);
      return { lido, falha };
    }
  });
  return { ...r.lido, falha: r.falha, erros: r.erros.filter(x => !EXTERNO.test(x)) };
}

/* ============================================================================
   0. O INSTRUMENTO, ANTES DE MEDIR COM ELE
   ============================================================================
   Leitor e CRC escritos aqui sao uma segunda opiniao -- mas so valem como opiniao se
   souberem dizer NAO. Um leitor que aceita tudo faz a suite inteira ficar verde sobre
   qualquer coisa, e e a forma mais silenciosa de verde falso que existe.
   O CRC e ancorado num VETOR PUBLICO da norma, e nao no proprio projeto: o CRC-16/
   CCITT-FALSE de "123456789" e 0x29B1. Se a implementacao daqui fechasse com a do
   projeto por estarem as duas erradas do mesmo jeito, esta linha nao fecharia. */
console.log('\n=== 0. o instrumento deste arquivo: ele sabe dizer NAO? ===');
chk('[instrumento] o CRC16 daqui bate com o vetor publico da norma (123456789 -> 29B1)',
    crc16('123456789') === '29B1', crc16('123456789'));
chk('[instrumento] o TLV aceita uma cadeia bem formada',
    !lerTlv('0002010102AB').erro, JSON.stringify(lerTlv('0002010102AB')));
chk('[instrumento] e RECUSA comprimento maior que o conteudo',
    !!lerTlv('009901').erro, JSON.stringify(lerTlv('009901')));
chk('[instrumento] e RECUSA comprimento que nao e numero',
    !!lerTlv('00AB01').erro, JSON.stringify(lerTlv('00AB01')));
chk('[instrumento] e RECUSA byte sobrando no fim',
    !!lerTlv('000201X').erro, JSON.stringify(lerTlv('000201X')));

/* ============================================================================
   1. A LISTA DAS ABAS QUE COBRAM
   ============================================================================ */
console.log('\n=== 1. a lista viva das abas que cobram ===');
chk('FC_PAG_PREFS foi lida do index.html', PREFS.length > 0, JSON.stringify(PREFS));
chk('esta prova conhece o caminho do Pix de cada uma delas',
    PREFS.every(p => SAIDA[p] && PAYLOAD[p] && NATELA[p]),
    'sem caminho declarado: ' + JSON.stringify(PREFS.filter(p => !SAIDA[p])));
console.log('  abas que cobram: ' + PREFS.map(p => p + ' (' + (NOME[p] || '?') + ')').join(', '));

/* ============================================================================
   2. OS CINCO FORMATOS, ABA POR ABA, COM O BLOCO RODANDO
   ============================================================================ */
let porta = 9530;
/* O primeiro BR Code REAL que sair -- usado na parte 4 para provar que o leitor deste
   arquivo recusa um codigo adulterado. Adulterar um payload de verdade e mais forte que
   adulterar um sintetico: o sintetico so exercita o leitor, o real exercita os dois. */
let primeiroReal = null;
for (const [rotulo, chave, porque] of CHAVES) {
  console.log('\n=== 2. formato "' + rotulo + '" (' + chave + ') -- ' + porque + ' ===');
  const r = await gerarComChave(chave, porta++);

  chk('[' + rotulo + '] a ferramenta ACEITOU a chave -- nenhum alerta', r.alertas.length === 0,
      JSON.stringify(r.alertas).slice(0, 300));
  chk('[' + rotulo + '] a ferramenta gerou sem erro de console', r.erros.length === 0,
      r.erros.slice(0, 2).join(' | '));

  for (const pref of PREFS) {
    const bloco = r.valores[SAIDA[pref]] || '';
    const tag = '[' + rotulo + '][' + pref + ']';
    chk(tag + ' o bloco saiu', bloco.length > 1000, bloco.length + ' bytes');
    /* A chave no TEXTO do bloco: forma final esperada = a chave canonica. pixLimpar so
       apara as pontas, entao nada dentro dela pode ter mudado. */
    chk(tag + ' o bloco emite a chave inteira, sem transformacao',
        chaveEmitida(bloco) === chave, JSON.stringify(chaveEmitida(bloco)));
    if (bloco.length < 1000) continue;

    const x = await rodarBloco(r.valores, pref, porta++);
    chk(tag + ' o bloco rodou e chegou a caixa de copiar do Pix',
        typeof x.payload === 'string' && x.payload.length > 20,
        'payload=' + JSON.stringify(String(x.payload).slice(0, 60)) +
        ' falha=' + x.falha + ' avisos=' + JSON.stringify(x.avisos));
    chk(tag + ' o bloco rodou sem erro proprio', x.erros.length === 0, x.erros.slice(0, 2).join(' | '));
    if (!(typeof x.payload === 'string' && x.payload.length > 20)) continue;

    const br = abrirBrCode(x.payload);
    chk(tag + ' o BR Code FECHA, lido campo a campo pelo TLV deste arquivo', !br.erro,
        br.erro || '');
    if (br.erro) continue;

    chk(tag + ' o CRC16 recalculado aqui bate com o campo 63 do codigo', br.crcOk,
        'no codigo=' + br.crcLido + ' recalculado=' + br.crcCalc);
    if (primeiroReal === null && br.crcOk) primeiroReal = x.payload;
    chk(tag + ' o campo 26 traz o identificador do arranjo',
        br.arranjo === 'BR.GOV.BCB.PIX', JSON.stringify(br.arranjo) + ' ' + br.contaErro);
    chk(tag + ' e a CHAVE dentro dele e exatamente a esperada (' + chave.length + ' caracteres)',
        br.chave === chave,
        'lida=' + JSON.stringify(br.chave) + ' (' + String(br.chave).length + ')');
    chk(tag + ' o campo 54 traz o valor que o cliente le na tela',
        br.valor === daTela(x.tela),
        'campo 54=' + JSON.stringify(br.valor) + ' na tela=' + JSON.stringify(x.tela) +
        ' -> ' + daTela(x.tela));
  }
}

/* ============================================================================
   3. A PONTUACAO QUE UMA PESSOA DIGITA: RECUSA, e bloco nenhum
   ============================================================================
   pixLimpar apara as PONTAS e mais nada -- ela nao tira ponto de CPF, barra de CNPJ nem
   parenteses de telefone. Isso e decisao escrita no proprio arquivo ("RECUSA, nunca
   correcao"), e o outro lado dela precisa de prova: se um dia alguem "consertar" a
   limpeza para tirar pontuacao, a chave passaria a ser SILENCIOSAMENTE reescrita, e
   reescrever o destino de um dinheiro e o que este projeto ja recusou no endereco da
   pagina. A medida aqui e a mais forte possivel: a recusa aparece na tela E nenhuma
   caixa de codigo e escrita. */
console.log('\n=== 3. chave com a pontuacao de uma pessoa: recusada, e sem bloco ===');
for (const [rotulo, chave] of HUMANAS) {
  const r = await gerarComChave(chave, porta++);
  chk('[' + rotulo + '] "' + chave + '" foi RECUSADA com aviso na tela', r.alertas.length > 0,
      '(nenhum alerta)');
  const vazias = ['u-out', 'm-out', 'p-out1', 'p-out2', 'a-out3', 'v-out']
    .filter(id => (r.valores[id] || '').length > 0);
  chk('[' + rotulo + '] e NENHUMA caixa de codigo foi escrita', vazias.length === 0,
      'escreveram: ' + vazias.join(' '));
  if (r.alertas.length) console.log('    recusa: ' + r.alertas[0].replace(/\s+/g, ' ').slice(0, 150));
}

/* ============================================================================
   4. O MESMO BR CODE, ADULTERADO: o leitor deste arquivo tem de recusar
   ============================================================================
   Um payload REAL saido da ferramenta, quebrado de quatro maneiras que um erro de
   comprimento produziria de verdade. Se o leitor aceitasse qualquer uma delas, as 200 e
   tantas verificacoes acima estariam medindo nada -- e nao haveria como saber. */
console.log('\n=== 4. um BR Code real, adulterado: o leitor recusa? ===');
if (primeiroReal === null) {
  chk('[adulterado] NAO MEDIU: nenhum BR Code valido chegou ate aqui', false,
      'a parte 2 nao produziu payload nenhum');
} else {
  const p0 = primeiroReal;
  chk('[adulterado] o codigo original, intocado, continua sendo ACEITO',
      !abrirBrCode(p0).erro && abrirBrCode(p0).crcOk === true, JSON.stringify(abrirBrCode(p0).erro));
  /* 1. um digito do CRC trocado: a forma continua perfeita, so a conta e que nao fecha --
     e e exatamente assim que um payload editado a mao chega ao aplicativo do banco. */
  const outroDigito = p0.slice(-1) === '0' ? '1' : '0';
  const crcTorto = p0.slice(0, -1) + outroDigito;
  const rc = abrirBrCode(crcTorto);
  chk('[adulterado] CRC trocado: a forma passa e a CONTA nao fecha',
      !rc.erro && rc.crcOk === false, JSON.stringify(rc.erro) + ' crcOk=' + rc.crcOk);
  /* 2. um caractere a menos no fim: o campo 63 deixa de ser o ultimo. */
  const rt = abrirBrCode(p0.slice(0, -1));
  chk('[adulterado] um caractere a menos: recusado pela forma', !!rt.erro, JSON.stringify(rt.erro));
  /* 3. dois caracteres a mais no fim: idem, pelo outro lado. */
  const rs = abrirBrCode(p0 + 'XX');
  chk('[adulterado] dois caracteres a mais: recusado pela forma', !!rs.erro, JSON.stringify(rs.erro));
  /* 4. o comprimento declarado do PRIMEIRO campo estragado -- o defeito de TLV puro, que
     e o que faz um leitor por posicao devolver o valor do campo vizinho. */
  chk('[adulterado] o codigo comeca pelo campo 00 como o padrao manda',
      p0.indexOf('000201') === 0, p0.slice(0, 12));
  const rl = abrirBrCode('00AB01' + p0.slice(6));
  chk('[adulterado] comprimento nao numerico no campo 00: recusado pelo TLV',
      !!rl.erro, JSON.stringify(rl.erro));
}

/* O CODIGO DE SAIDA E O RESULTADO, e nao um zero por descuido (16/09/2026). Nove suites
   chamavam resumo() e saiam com 0 aconteca o que acontecesse -- e uma delas estava
   FALHANDO e anunciando sucesso. Verde falso apaga o defeito. */
process.exit(resumo());
