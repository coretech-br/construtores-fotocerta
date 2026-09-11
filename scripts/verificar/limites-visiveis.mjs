/* ============================================================================
   OS LIMITES VISIVEIS NOS CAMPOS QUE ALIMENTAM API
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. A regressao (geradores.mjs/regressao.sh) prova
   que o TEXTO gerado nao mudou -- e nesta rodada ele nao podia mudar mesmo, por
   contrato. O que ela nao alcanca e justamente o que a rodada entregou: um
   numero na tela que diz quanto do campo vai chegar ao payload. Contador errado
   nao quebra nada: ele mente, o operador acredita, e o defeito aparece no
   aplicativo do banco de quem paga.

   O QUE ELE MEDE -- as cinco provas pedidas na spec
   (docs/specs/2026-09-11-limites-visiveis-nos-campos-design.md):

     1. O CONTADOR DIZ A VERDADE. Digita nome com acento e com '&', cidade com
        acento e identificador com hifen e barra, LE o numero da tela e compara
        com o que o gerador realmente emitiu -- o payload do BR Code extraido do
        link de cobranca, lido por um analisador de TLV escrito AQUI. O lerTlv do
        projeto nao serve para conferir o proprio projeto: se ele e a maquina que
        monta, nao pode ser tambem a testemunha.

     2. O CURSOR FICA ONDE DEVERIA (decisao D4). Posiciona o cursor no MEIO do
        texto, digita um caractere recusado e um aceito, e confere a posicao
        depois de cada um. Filtro ingenuo passa no teste que digita do inicio ao
        fim e falha aqui -- e e assim que ele chega em producao.

     3. O maxlength NAO QUEBRA O COLAR. Cola um texto maior que o teto e confere
        que sobrou o texto cortado no teto, que o aviso de corte apareceu (corte
        silencioso e o que esta rodada existe para eliminar) e que ele some
        quando o operador mexe no campo de novo.

     4. A CORRECAO A VISTA CONTINUA. O valor que chega por outra porta que nao o
        teclado (estado restaurado, backup importado, preset aplicado) nao passa
        pelo filtro de 'input'; quem o conserta e o pTxidAjustar de 'change'/
        'blur', que ja existia. Confere que ele continua consertando.

     5. O PIX CONTINUA VALIDO NO LIMITE. Nome com 25, cidade com 15 e
        identificador com 25 depois da limpeza: monta o link, extrai o BR Code e
        confere campo a campo -- 59, 60, 62>05 -- e o CRC16, recalculado por uma
        implementacao independente escrita neste arquivo.

   Roda com:  node scripts/verificar/limites-visiveis.mjs
   ============================================================================ */
import { navegador, servir, abrir, set, clicar, ler } from './lib.mjs';
import { chk, resumo } from './pagina.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORTA = 8841;

/* ---------------------------------------------------------------------------
   A TESTEMUNHA INDEPENDENTE: TLV e CRC16 escritos aqui, do zero.
   Reaproveitar lerTlv/crc16 do projeto faria a mesma funcao montar e conferir,
   e um erro dentro dela passaria nas duas pontas sem aparecer.
   --------------------------------------------------------------------------- */
function tlvLer(s){
  const fora = {};
  let i = 0;
  while(i + 4 <= s.length){
    const id = s.slice(i, i + 2);
    const n = parseInt(s.slice(i + 2, i + 4), 10);
    if(!(n >= 0) || i + 4 + n > s.length) throw new Error('TLV malformado em ' + i);
    fora[id] = s.slice(i + 4, i + 4 + n);
    i += 4 + n;
  }
  if(i !== s.length) throw new Error('sobrou byte fora de TLV');
  return fora;
}
function crcProprio(s){
  let c = 0xFFFF;
  for(let i = 0; i < s.length; i++){
    c ^= s.charCodeAt(i) << 8;
    for(let j = 0; j < 8; j++) c = (c & 0x8000) ? (((c << 1) ^ 0x1021) & 0xFFFF) : ((c << 1) & 0xFFFF);
  }
  return c.toString(16).toUpperCase().padStart(4, '0');
}
/* O codigo Pix viaja no parametro 'c' do link gerado. */
function pixDoLink(link){
  const m = /[?&]c=([^&]*)/.exec(link);
  if(!m) throw new Error('o link nao traz o parametro c: ' + link);
  return decodeURIComponent(m[1]);
}

/* ---------------------------------------------------------------------------
   Digitar de verdade: tecla por tecla, com foco, para o maxlength do navegador e
   o filtro de 'input' agirem como agem no dedo do operador. `set()` da lib
   atribui .value direto, que e outra coisa -- e e por isso que ela serve a prova
   4 e nao serve as demais.
   --------------------------------------------------------------------------- */
async function digitar(pg, id, texto){
  await pg.focus('#' + id);
  await pg.evaluate(i => { const e = document.getElementById(i); e.value = ''; e.dispatchEvent(new Event('input', {bubbles:true})); }, id);
  await pg.focus('#' + id);
  await pg.keyboard.type(texto, {delay: 1});
}
const contador = (pg, id) => pg.evaluate(i => {
  const e = document.getElementById('fcl-' + i);
  return e ? e.textContent : null;
}, id);
const corte = (pg, id) => pg.evaluate(i => {
  const e = document.getElementById('fcl-corte-' + i);
  return (e && e.style.display !== 'none') ? e.textContent : '';
}, id);
const cursor = (pg, id) => pg.evaluate(i => document.getElementById(i).selectionStart, id);
/* Abre o painel Identidade SO se ele estiver fechado. O botao alterna, e alternar
   as cegas foi o que deixou a prova 5 digitando em campo escondido -- sem erro
   nenhum, com o contador dizendo "0 de 25". */
async function abrirIdentidade(pg){
  const aberto = await pg.evaluate(() => {
    const e = document.getElementById('fci-painel');
    return !!(e && e.offsetParent !== null);
  });
  if(!aberto) await clicar(pg, 'fci-botao');
}
const porCursor = (pg, id, n) => pg.evaluate(([i, n]) => {
  const e = document.getElementById(i);
  e.focus(); e.setSelectionRange(n, n);
}, [id, n]);
/* O valor que chega SEM tecla nenhuma -- estado restaurado, backup, preset. */
const setSemInput = (pg, id, v) => pg.evaluate(([i, v]) => {
  const e = document.getElementById(i);
  e.value = v;
  e.dispatchEvent(new Event('change', {bubbles:true}));
  e.dispatchEvent(new Event('blur', {bubbles:true}));
}, [id, v]);
/* O numero que o contador anuncia como "o que sobra". */
function numeroDoContador(txt){
  const m = /^(\d+) de (\d+)/.exec(String(txt || ''));
  return m ? {n: parseInt(m[1], 10), max: parseInt(m[2], 10)} : null;
}

const srv = await servir(RAIZ, PORTA);
const br = await navegador();
const base = 'http://127.0.0.1:' + PORTA;
const pg = await abrir(br, base);
try{
  await abrirIdentidade(pg);
  await set(pg, 'fci-chave', 'ensaio@fotocerta.com.br');
  await set(pg, 'fci-client', 'AbCdEf123456789ClientIdDeTeste');
  await set(pg, 'fci-zapnum', '5527999998888');

  /* =======================================================================
     PROVA 1 -- o contador conta o que SOBRA, e o que sobra e o que o gerador emite
     ======================================================================= */
  console.log('\n[1] o contador conta o que sobra');

  /* "Jose & Maria Fotografia": o '&' nao existe no BR Code (vira espaco) e os
     espacos colapsam -- a tela fica com 23 e o payload com 21. */
  await digitar(pg, 'fci-nomer', 'José & María Fotografia');
  await digitar(pg, 'fci-cidade', 'São Paulo Serra');
  const cNome = await contador(pg, 'fci-nomer');
  const cCid = await contador(pg, 'fci-cidade');
  chk('nome: o contador mostra os dois numeros', /^21 de 25 \(23 digitados\)$/.test(cNome), 'saiu: ' + cNome);
  chk('cidade: 15 de 15, no teto', /^15 de 15$/.test(cCid), 'saiu: ' + cCid);

  await clicar(pg, 'aba-cob');
  await set(pg, 'p-url', 'https://fotocerta.com.br/pagar');
  await set(pg, 'p-desc', 'Ensaio de familia');
  await set(pg, 'p-valor', '1200,50');
  await digitar(pg, 'p-txid', 'ENSAIO-2026/NATAL');
  const cTx = await contador(pg, 'p-txid');
  chk('identificador: o filtro tirou hifen e barra na tecla',
    (await ler(pg, 'p-txid')) === 'ENSAIO2026NATAL', 'campo: ' + (await ler(pg, 'p-txid')));
  chk('identificador: contador sem divergencia (o filtro ja limpou)', /^15 de 25$/.test(cTx), 'saiu: ' + cTx);

  await clicar(pg, 'p-gerarlink');
  await pg.waitForTimeout(200);
  const link1 = await ler(pg, 'p-out2');
  const br1 = tlvLer(pixDoLink(link1));
  const nomePay = br1['59'], cidPay = br1['60'], txPay = tlvLer(br1['62'])['05'];
  chk('nome: o payload leva exatamente o que o contador anunciou',
    nomePay.length === numeroDoContador(cNome).n, 'payload: ' + JSON.stringify(nomePay) + ' (' + nomePay.length + ')');
  chk('nome: e o texto e o limpo, sem acento e sem "&"', nomePay === 'Jose Maria Fotografia', 'payload: ' + JSON.stringify(nomePay));
  chk('cidade: o payload leva o que o contador anunciou',
    cidPay.length === numeroDoContador(cCid).n && cidPay === 'Sao Paulo Serra', 'payload: ' + JSON.stringify(cidPay));
  chk('identificador: o payload leva o que o contador anunciou',
    txPay.length === numeroDoContador(cTx).n && txPay === 'ENSAIO2026NATAL', 'payload: ' + JSON.stringify(txPay));

  /* O codigo do pedido do Checkout: o hifen SOBREVIVE no PayPal e no WhatsApp e e jogado fora
     no txid do Pix -- por isso ele nao filtra (o caractere nao e recusado em todo destino) e
     por isso o contador precisa dizer os dois numeros. */
  await clicar(pg, 'aba-uni');
  await digitar(pg, 'u-cod', 'CAMPANHA-2026');
  chk('codigo do pedido: o hifen fica no campo (ele sobrevive no PayPal e no WhatsApp)',
    (await ler(pg, 'u-cod')) === 'CAMPANHA-2026', 'campo: ' + (await ler(pg, 'u-cod')));
  chk('codigo do pedido: o contador diz que o Pix leva um a menos',
    /^12 de 25 \(13 digitados\)$/.test(await contador(pg, 'u-cod')), 'saiu: ' + (await contador(pg, 'u-cod')));

  /* O WhatsApp: nao-digito nunca chega ao endereco do wa.me, entao ele filtra na tecla. */
  await abrirIdentidade(pg);
  await digitar(pg, 'fci-zapnum', '+55 (27) 99999-8888');
  chk('WhatsApp: o filtro deixou so os digitos',
    (await ler(pg, 'fci-zapnum')) === '5527999998888', 'campo: ' + (await ler(pg, 'fci-zapnum')));
  chk('WhatsApp: sem contador, porque nao ha teto declarado em lugar nenhum',
    (await contador(pg, 'fci-zapnum')) === null, 'contador: ' + (await contador(pg, 'fci-zapnum')));
  await clicar(pg, 'fci-botao');   /* aqui ele esta aberto: fecha para a aba voltar a frente */
  await clicar(pg, 'aba-cob');

  /* O segundo teto da descricao: a recusa e de 200, mas o PayPal ve 127. */
  await set(pg, 'p-desc', 'x'.repeat(130));
  chk('descricao: passando de 127, o contador avisa do teto do PayPal',
    /^130 de 200 .* 127 primeiros$/.test(await contador(pg, 'p-desc')), 'saiu: ' + (await contador(pg, 'p-desc')));
  await set(pg, 'p-desc', 'Ensaio de familia');
  chk('descricao: abaixo de 127, o aviso do PayPal some',
    /^17 de 200$/.test(await contador(pg, 'p-desc')), 'saiu: ' + (await contador(pg, 'p-desc')));

  /* =======================================================================
     PROVA 2 -- o cursor no MEIO do texto (decisao D4)
     ======================================================================= */
  console.log('\n[2] o cursor fica onde deveria');
  await digitar(pg, 'p-txid', 'ENSAIO2026');
  await porCursor(pg, 'p-txid', 6);
  await pg.keyboard.type('-', {delay: 1});
  chk('recusado no meio: o texto nao mudou', (await ler(pg, 'p-txid')) === 'ENSAIO2026', 'campo: ' + (await ler(pg, 'p-txid')));
  chk('recusado no meio: o cursor ficou no 6', (await cursor(pg, 'p-txid')) === 6, 'cursor: ' + (await cursor(pg, 'p-txid')));
  await pg.keyboard.type('X', {delay: 1});
  chk('aceito no meio: entrou no lugar certo', (await ler(pg, 'p-txid')) === 'ENSAIOX2026', 'campo: ' + (await ler(pg, 'p-txid')));
  chk('aceito no meio: o cursor avancou para 7', (await cursor(pg, 'p-txid')) === 7, 'cursor: ' + (await cursor(pg, 'p-txid')));
  /* e continua funcionando depois de varias recusas seguidas no mesmo ponto */
  await pg.keyboard.type('- .', {delay: 1});
  chk('tres recusados seguidos: nada entrou', (await ler(pg, 'p-txid')) === 'ENSAIOX2026', 'campo: ' + (await ler(pg, 'p-txid')));
  chk('tres recusados seguidos: o cursor continua no 7', (await cursor(pg, 'p-txid')) === 7, 'cursor: ' + (await cursor(pg, 'p-txid')));

  /* =======================================================================
     PROVA 3 -- o maxlength e o colar
     ======================================================================= */
  console.log('\n[3] o maxlength nao quebra o colar');
  await digitar(pg, 'p-txid', 'A'.repeat(40));
  chk('digitando alem do teto: parou em 25', (await ler(pg, 'p-txid')) === 'A'.repeat(25), 'campo com ' + (await ler(pg, 'p-txid')).length);

  const colou = await pg.evaluate(() => {
    const e = document.getElementById('p-txid');
    e.value = ''; e.dispatchEvent(new Event('input', {bubbles:true}));
    e.focus(); e.setSelectionRange(0, 0);
    const dt = new DataTransfer();
    dt.setData('text', 'B'.repeat(40));
    const ok = e.dispatchEvent(new ClipboardEvent('paste', {clipboardData: dt, bubbles: true, cancelable: true}));
    /* o navegador so insere de verdade num colar do usuario; aqui o evento avisa a
       pagina e a insercao e feita a seguir, respeitando o maxlength como ele faz. */
    if(ok){
      const max = parseInt(e.getAttribute('maxlength'), 10);
      e.value = 'B'.repeat(40).slice(0, max);
      e.dispatchEvent(new Event('input', {bubbles:true}));
    }
    return e.value;
  });
  await pg.waitForTimeout(50);
  chk('colando alem do teto: ficou o texto cortado no teto', colou === 'B'.repeat(25), 'campo: ' + colou.length + ' caracteres');
  chk('colando alem do teto: o corte apareceu na tela, com os dois numeros',
    /40 caracteres.*aceita 25/.test(await corte(pg, 'p-txid')), 'aviso: ' + JSON.stringify(await corte(pg, 'p-txid')));
  await pg.focus('#p-txid');
  await pg.keyboard.press('Backspace');
  chk('mexendo no campo de novo, o aviso de corte some', (await corte(pg, 'p-txid')) === '', 'aviso: ' + JSON.stringify(await corte(pg, 'p-txid')));

  /* =======================================================================
     PROVA 4 -- a correcao a vista de 'change'/'blur' continua
     ======================================================================= */
  console.log('\n[4] a correcao a vista continua');
  await setSemInput(pg, 'p-txid', 'ensaio-2026 natal');
  chk('valor que chegou sem tecla: pTxidAjustar limpou no change/blur',
    (await ler(pg, 'p-txid')) === 'ensaio2026natal', 'campo: ' + (await ler(pg, 'p-txid')));
  chk('e o contador acompanhou', /^15 de 25$/.test(await contador(pg, 'p-txid')), 'saiu: ' + (await contador(pg, 'p-txid')));

  /* =======================================================================
     PROVA 5 -- o Pix continua valido com tudo no limite
     ======================================================================= */
  console.log('\n[5] o Pix continua valido no limite');
  await abrirIdentidade(pg);
  await digitar(pg, 'fci-nomer', 'Fotografia Lucianá Pacheco Ltda');
  await digitar(pg, 'fci-cidade', 'Vitória da Conquista');
  const cNome2 = await contador(pg, 'fci-nomer'), cCid2 = await contador(pg, 'fci-cidade');
  chk('nome no teto: 25 de 25', /^25 de 25/.test(cNome2), 'saiu: ' + cNome2);
  chk('cidade no teto: 15 de 15', /^15 de 15/.test(cCid2), 'saiu: ' + cCid2);
  await clicar(pg, 'aba-cob');
  await digitar(pg, 'p-txid', 'C'.repeat(30));
  chk('identificador no teto: 25 de 25', /^25 de 25$/.test(await contador(pg, 'p-txid')), 'saiu: ' + (await contador(pg, 'p-txid')));
  await clicar(pg, 'p-gerarlink');
  await pg.waitForTimeout(200);
  const link2 = await ler(pg, 'p-out2');
  const cod2 = pixDoLink(link2);
  const campos2 = tlvLer(cod2);
  chk('payload: o nome saiu com 25, limpo, igual ao que o contador anunciou',
    campos2['59'] === 'Fotografia Luciana Pachec', 'payload: ' + JSON.stringify(campos2['59']));
  chk('payload: a cidade saiu com 15, limpa, igual ao que o contador anunciou',
    campos2['60'] === 'Vitoria da Conq', 'payload: ' + JSON.stringify(campos2['60']));
  chk('payload: o identificador saiu com 25', tlvLer(campos2['62'])['05'] === 'C'.repeat(25), 'payload: ' + JSON.stringify(tlvLer(campos2['62'])['05']));
  chk('payload: o CRC fecha pela conta independente deste arquivo',
    cod2.slice(-4) === crcProprio(cod2.slice(0, -4)), 'no codigo: ' + cod2.slice(-4) + ' | calculado: ' + crcProprio(cod2.slice(0, -4)));
  chk('payload: o campo 54 (valor) continua o da cobranca', campos2['54'] === '1200.50', 'payload: ' + campos2['54']);

  /* =======================================================================
     O que a tela nao pode ter feito: erro no console.
     ======================================================================= */
  chk('nenhum erro de console na passagem inteira', pg.erros.length === 0, pg.erros.join(' | '));
} finally {
  await pg.close();
  await br.close();
  srv.close();
}
process.exit(resumo());
