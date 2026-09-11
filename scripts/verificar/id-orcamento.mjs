/* ============================================================================
   O ORCAMENTO DO IDENTIFICADOR DE CONCILIACAO -- COM OS BLOCOS RODANDO
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. Em duas abas o identificador que chega ao Pix e
   COMPOSTO: o que o operador digita mais uma cauda que o proprio bloco
   acrescenta. Ate 11/09/2026 nada avisava, e o estouro nao dava erro em lugar
   nenhum -- os dois defeitos abaixo sao SILENCIOSOS por natureza, e por isso
   nenhum deles podia ser dado por consertado sem ser MEDIDO antes e depois:

     Mini loja           -- novoPedido() e CODIGO_LOJA + '-' + base36 do relogio.
                            Com o codigo da loja grande demais, o identificador que
                            o cliente LE na tela deixa de ser o txid que chega ao
                            extrato do dono: truncado, sem aviso.
     Agendamento pacote  -- idConciliacao() e PREFIXO + codigo do pacote + dia/hora.
                            Com prefixo e codigo grandes demais, o corte acontece na
                            CONCATENACAO, e dois pacotes DIFERENTES chegam ao extrato
                            com o MESMO txid. Nao e truncagem, e COLISAO.

   O QUE ELE MEDE, com os blocos EXECUTANDO numa pagina que imita o Prosite:
     1. A COLISAO, na arvore de REFERENCIA: dois pacotes diferentes, um txid so.
     2. A RECUSA, na arvore de trabalho: a mesma configuracao nao gera.
     3. A TRUNCAGEM, na referencia: o identificador da tela != o txid do payload.
     4. A RECUSA, na arvore de trabalho: a mesma configuracao nao gera.
     5. O NEGATIVO: configuracao DENTRO do limite gera sem recusa, nas duas abas.
        Recusa que barra uso legitimo e pior que o defeito que ela conserta.
     6. O LIMITE EXATO: no teto, o txid sai com 25 caracteres e o payload continua
        valido -- lido com um TLV e um CRC16 ESCRITOS AQUI DENTRO. Conferir o
        projeto com o lerTlv do proprio projeto seria perguntar a ele se ele
        concorda consigo mesmo.

   A REFERENCIA sai de 'git archive <ref>' para uma pasta temporaria (o mesmo
   caminho de regressao.sh): nao mexe na arvore de trabalho e nao precisa de
   checkout. Sem o lado "antes", este arquivo provaria que a recusa existe --
   nunca que ela conserta alguma coisa.

   Roda com:  node scripts/verificar/id-orcamento.mjs [ref]      (ref: main)
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, radio, clicar, ler, zerarAlertas } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';

/* ===================== O LEITOR PROPRIO DO PAYLOAD =====================
   Escrito aqui, e nao importado do projeto, de proposito: o que esta sob teste e
   justamente o identificador que o projeto poe dentro do payload. Um leitor
   emprestado do projeto so responderia se o projeto concorda consigo mesmo.
   Formato EMV/BR Code: cada campo e ID(2) + tamanho(2) + valor. O txid vive em
   62 -> 05. O CRC16 e o CCITT-FALSE (polinomio 0x1021, semente 0xFFFF) sobre
   TUDO ate o "6304" inclusive. */
function tlvProprio(s){
  const saida = [];
  let i = 0;
  while(i + 4 <= s.length){
    const id = s.substr(i, 2), tam = s.substr(i + 2, 2);
    if(!/^\d{2}$/.test(id) || !/^\d{2}$/.test(tam)) return null;
    const n = parseInt(tam, 10);
    if(i + 4 + n > s.length) return null;
    saida.push([id, s.substr(i + 4, n)]);
    i += 4 + n;
  }
  return i === s.length ? saida : null;
}
function crc16Proprio(s){
  let c = 0xFFFF;
  for(let i = 0; i < s.length; i++){
    c ^= (s.charCodeAt(i) & 0xFF) << 8;
    for(let b = 0; b < 8; b++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF;
  }
  return ('000' + c.toString(16).toUpperCase()).slice(-4);
}
function crcConfere(p){
  if(p.length < 8 || p.slice(-8, -4) !== '6304') return false;
  return crc16Proprio(p.slice(0, -4)) === p.slice(-4);
}
/* A linha do resumo e "<rotulo> <identificador>": o identificador e o ultimo
   pedaco separado por espaco. Cortar por "ate o primeiro digito" nao serve --
   o proprio codigo da loja pode ser so letras, e a poda comeria metade dele. */
const soId = linha => String(linha).trim().split(/\s+/).pop();
/* O limite que a RECUSA diz ao operador. O teste nao alcanca as variaveis da
   ferramenta (ela roda dentro de uma IIFE, de proposito), entao o que se compara
   e o que o operador LE contra o que a ferramenta FAZ -- que e a pergunta que
   importa: mensagem e comportamento nao podem discordar. */
const limiteCitado = msg => { const m = /no m\u00e1ximo (\d+)/.exec(String(msg)); return m ? Number(m[1]) : null; };
function txidDoPayload(p){
  const raiz = tlvProprio(p);
  if(!raiz) return null;
  const c62 = raiz.find(x => x[0] === '62');
  if(!c62) return null;
  const sub = tlvProprio(c62[1]);
  if(!sub) return null;
  const c05 = sub.find(x => x[0] === '05');
  return c05 ? c05[1] : null;
}

/* ===================== O CENARIO =====================
   Identidade de teste -- NAO sao dados reais (repositorio publico). Somente Pix
   nas duas abas: sem SDK do PayPal o bloco tem menos rede para o molde barrar, e
   o que esta sob teste e o txid, que e do Pix. */
const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  zapnum:'5527999998888'};
const IMG = 'https://storage.alboom.ninja/album-30x30.jpg';
const QUANDO = '?data=2027-01-10&hora=10:00';
const DIAHORA = '202701101000';               /* o que diaHoraId faz com o de cima */
const RELOGIO = Date.UTC(2027, 0, 10, 13, 0, 0);

/* A COLISAO, montada de proposito. O prefixo tem 16 e cada codigo tem 12: a
   concatenacao passa dos 25 ANTES de chegar ao caractere que distingue um pacote
   do outro ('1H' contra '4H', nas posicoes 26-28). O corte apaga justamente a
   diferenca, e os dois viram "FOTOCERTAESTUDIOMINIENSAI". */
const COL_PREFIXO = 'FOTOCERTAESTUDIO';
const COL_A = 'MINIENSAIO1H';
const COL_B = 'MINIENSAIO4H';
/* A TRUNCAGEM, montada de proposito: 20 letras de codigo de loja mais os 8 da
   cauda dao 28 -- tres a mais do que cabe. */
const TRUNC_COD = 'LOJAFOTOCERTAVITORIA';

async function pacote(pg, cod, nome, preco){
  await set(pg,'a-pcod',cod); await set(pg,'a-pnome',nome); await set(pg,'a-pdur','1 hora');
  await set(pg,'a-ppreco',preco); await set(pg,'a-pinclui','10 fotos tratadas');
  await set(pg,'a-ppath','https://tidycal.com/fotocerta/'+cod.toLowerCase());
  await clicar(pg,'a-pac-salvar');
}
async function abaPac(pg, prefixo, pacotes){
  await clicar(pg,'aba-pac');
  await radio(pg,'a-metodo','pix');
  await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
  await set(pg,'a-descpix','0');
  await set(pg,'a-prefixo',prefixo);
  for(const p of pacotes) await pacote(pg, p[0], p[1], p[2]);
}
async function abaLoja(pg, cod){
  await clicar(pg,'aba-loja');
  await radio(pg,'m-metodo','pix');
  await radio(pg,'m-resumo','sim');
  await set(pg,'m-cod',cod);
  await set(pg,'m-pnome','Album 30x30'); await set(pg,'m-ppreco','890');
  await set(pg,'m-pcat','Albuns'); await set(pg,'m-pimg',IMG);
  await clicar(pg,'m-prod-salvar');
}
async function identidade(pg){
  for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
}

/* Clica em gerar com o registro de alertas ZERADO, e devolve o que a ferramenta
   disse e o que ela escreveu. A recusa deste projeto e um alert que ANTECEDE o
   return: "nao avisou" e "nao gerou" sao duas medidas, e as duas importam. */
async function gerar(pg, botao, saida){
  await zerarAlertas(pg);
  await clicar(pg, botao);
  const avisos = await pg.evaluate(() => window.__alertas.slice());
  return { avisos, texto: (await ler(pg, saida)) ?? '' };
}

/* O bloco da MINI LOJA rodando: poe o produto na cesta, manda gerar o Pix, e
   devolve o identificador que o CLIENTE LE (primeira linha do resumo copiavel) e
   o payload que iria ao banco. */
const medirLoja = async pg => {
  await pg.locator('.fcm-card').nth(0).click();
  await pg.click('.fcm-add');
  await pg.click('.fcm-gerar');
  return {
    naTela: await pg.$eval('.fcm-resumo', el => el.value.split('\n')[0]),
    payload: await pg.$eval('.fcm-cola', el => el.value)
  };
};
/* O bloco do AGENDAMENTO rodando: o botao "Gerar Pix" e o primeiro .fca-ob-bt. */
const medirPac = async pg => {
  await pg.locator('.fca-ob-bt').first().click();
  return { payload: await pg.$eval('.fca-ob-cod', el => el.value) };
};

/* O molde barra a rede externa de proposito, e o navegador registra isso como
   erro de console. Sao os unicos aceitos -- qualquer outro e defeito do bloco. */
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|alboom\.ninja|ERR_FAILED|Failed to load resource/;
const errosReais = e => e.filter(x => !EXTERNO.test(x));

/* ===================== A ARVORE DE REFERENCIA ===================== */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-idorc-'));
process.on('exit', () => { try{ fs.rmSync(tmp, {recursive:true, force:true}); }catch(e){} });
try{
  execSync('git -C ' + JSON.stringify(RAIZ) + ' rev-parse --verify ' + JSON.stringify(REF), {stdio:'ignore'});
}catch(e){
  console.log('FALHOU -- a referencia "' + REF + '" nao existe neste repositorio.');
  process.exit(1);
}
execSync('git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(tmp), {shell:'/bin/sh'});
console.log('referencia: ' + REF + ' (' + execSync('git -C ' + JSON.stringify(RAIZ) + ' rev-parse --short ' + JSON.stringify(REF)).toString().trim() + ')');

console.log('\n--- ANTES (a versao publicada, em ' + REF + ') ---');
const antes = await gerarNaFerramenta(async pg => {
  await identidade(pg);
  await abaPac(pg, COL_PREFIXO, [[COL_A,'Mini ensaio','420'], [COL_B,'Ensaio de 4 horas','980']]);
  const g = await gerar(pg, 'a-gerar', 'a-out3');
  chk('referencia: a colisao NAO e recusada (o defeito existe)', g.avisos.length === 0, g.avisos.join(' | '));
  await abaLoja(pg, TRUNC_COD);
  const h = await gerar(pg, 'm-gerar', 'm-out');
  chk('referencia: o codigo de loja longo NAO e recusado (o defeito existe)', h.avisos.length === 0, h.avisos.join(' | '));
}, ['a-out3','m-out'], {raiz: tmp, porta: 8961});

chk('referencia: a-out3 saiu', (antes.valores['a-out3']||'').length > 1000);
chk('referencia: m-out saiu', (antes.valores['m-out']||'').length > 1000);

const colA = await comBlocoNaPagina({bloco: antes.valores['a-out3'], porta: 8951,
  busca: '?pac=' + COL_A + '&' + QUANDO.slice(1), medir: medirPac});
const colB = await comBlocoNaPagina({bloco: antes.valores['a-out3'], porta: 8952,
  busca: '?pac=' + COL_B + '&' + QUANDO.slice(1), medir: medirPac});
const txA = txidDoPayload(colA.payload), txB = txidDoPayload(colB.payload);
console.log('    pacote "' + COL_A + '" -> txid ' + JSON.stringify(txA));
console.log('    pacote "' + COL_B + '" -> txid ' + JSON.stringify(txB));
chk('referencia: os dois payloads sao legiveis e o CRC fecha',
  !!txA && !!txB && crcConfere(colA.payload) && crcConfere(colB.payload));
chk('referencia: A COLISAO ESTA PROVADA -- dois pacotes diferentes, o MESMO txid',
  !!txA && txA === txB, 'txA=' + txA + ' txB=' + txB);
chk('referencia: os blocos rodaram sem erro proprio',
  errosReais(colA.erros).length === 0 && errosReais(colB.erros).length === 0,
  errosReais(colA.erros).concat(errosReais(colB.erros)).join(' | '));

const trunc = await comBlocoNaPagina({bloco: antes.valores['m-out'], porta: 8953,
  relogio: RELOGIO, medir: medirLoja});
const txT = txidDoPayload(trunc.payload);
const naTelaId = soId(trunc.naTela);
console.log('    na tela do cliente: ' + JSON.stringify(trunc.naTela));
console.log('    no extrato (txid):  ' + JSON.stringify(txT));
chk('referencia: o payload da loja e legivel e o CRC fecha', !!txT && crcConfere(trunc.payload));
chk('referencia: A TRUNCAGEM ESTA PROVADA -- o identificador da tela nao chega ao extrato',
  !!txT && naTelaId.replace(/[^A-Za-z0-9]/g,'') !== txT,
  'tela=' + naTelaId + ' txid=' + txT);
chk('referencia: e o txid e um PREFIXO do que o cliente leu (foi cortado, nao trocado)',
  !!txT && naTelaId.replace(/[^A-Za-z0-9]/g,'').indexOf(txT) === 0);
chk('referencia: o bloco da loja rodou sem erro proprio',
  errosReais(trunc.erros).length === 0, errosReais(trunc.erros).join(' | '));

/* ===================== A ARVORE DE TRABALHO =====================
   TRES SESSOES, e nao uma. Os pacotes se ACUMULAM na lista da aba, entao cadastrar
   um cenario por cima de outro mediria uma terceira configuracao que nao e nem a do
   "antes" nem a do limite -- e a recusa sairia pelo pacote errado. Cada sessao abre a
   ferramenta com o armazenamento limpo (garantia de lib.mjs/abrir).

   A FRONTEIRA E MEDIDA PELA INTERFACE, um caractere por vez, e nao lida de dentro da
   ferramenta: o codigo dela roda dentro de uma IIFE (escopo isolado, de proposito) e
   espiar variavel de la seria medir a intencao em vez do comportamento. O que se
   compara e o que a ferramenta FAZ contra o numero que ela DIZ ao operador -- os dois
   discordarem e justamente o defeito que um limite decorado produz. */
console.log('\n--- DEPOIS (a arvore de trabalho) ---');

/* Varre uma faixa de tamanhos e devolve o maior que passou mais o limite citado na
   primeira recusa. Aceito-depois-de-recusado seria buraco no meio da faixa, e a
   conferencia abaixo pega isso. */
function fronteira(medidas){
  const aceitos = medidas.filter(m => m.ok).map(m => m.n);
  const recusados = medidas.filter(m => !m.ok);
  return {
    maiorAceito: aceitos.length ? Math.max(...aceitos) : null,
    menorRecusado: recusados.length ? Math.min(...recusados.map(m => m.n)) : null,
    citado: recusados.length ? limiteCitado(recusados[0].msg) : null,
    monotona: medidas.every(m => m.ok === (m.n <= (aceitos.length ? Math.max(...aceitos) : -1)))
  };
}

/* 1. A FRONTEIRA DO AGENDAMENTO. So o PREFIXO muda entre as medidas -- a lista de
      pacotes e a mesma -- entao a unica diferenca e o caractere que atravessa o
      limite. O codigo do pacote tem 11; o total vai de 12 a 15. */
const CODPAC = 'AAAAAAAAAAA';
let fPac = null;
const wPac = await gerarNaFerramenta(async pg => {
  await identidade(pg);
  await abaPac(pg, 'F', [[CODPAC,'Ensaio no limite','420']]);
  const medidas = [];
  for(const pre of ['F','FC','FCX','FCXY']){
    await set(pg,'a-prefixo',pre);
    const g = await gerar(pg, 'a-gerar', 'a-out3');
    medidas.push({n: pre.length + CODPAC.length, ok: g.avisos.length === 0, msg: g.avisos[0] || '', texto: g.texto});
    console.log('    pac: prefixo+codigo = ' + (pre.length + CODPAC.length) + ' -> ' + (g.avisos.length ? 'RECUSADO' : 'gerou'));
  }
  fPac = fronteira(medidas);
  chk('pac: a fronteira e limpa (aceita ate um numero, recusa dai para cima)', fPac.monotona);
  chk('pac: a recusa comeca UM caractere depois do ultimo aceito',
    fPac.menorRecusado === fPac.maiorAceito + 1, 'aceito ' + fPac.maiorAceito + ', recusado ' + fPac.menorRecusado);
  chk('pac: o numero que a recusa DIZ e o mesmo que ela FAZ',
    fPac.citado === fPac.maiorAceito, 'diz ' + fPac.citado + ', faz ' + fPac.maiorAceito);
  chk('pac: dentro do limite o bloco sai', medidas.some(m => m.ok && m.texto.length > 1000));
  chk('pac: a recusa diz o que aconteceria (o MESMO identificador)',
    /MESMO identificador/.test(medidas.filter(m => !m.ok)[0].msg));

  /* volta ao limite: o bloco que sai desta sessao e o que vai ser executado */
  await set(pg,'a-prefixo','FC');
  const volta = await gerar(pg, 'a-gerar', 'a-out3');
  chk('pac: encurtar o prefixo desfaz a recusa', volta.avisos.length === 0, volta.avisos.join(' | '));
}, ['a-out3'], {raiz: RAIZ, porta: 8962});
chk('pac: a ferramenta nao teve erro de console', wPac.erros.length === 0, wPac.erros.join(' | '));

/* 2. A CONFIGURACAO QUE COLIDIA -- a MESMA que o "antes" acabou de executar. */
const wCol = await gerarNaFerramenta(async pg => {
  await identidade(pg);
  await abaPac(pg, COL_PREFIXO, [[COL_A,'Mini ensaio','420'], [COL_B,'Ensaio de 4 horas','980']]);
  const colide = await gerar(pg, 'a-gerar', 'a-out3');
  chk('pac: A CONFIGURACAO QUE COLIDIA E RECUSADA', colide.avisos.length === 1, colide.avisos.join(' | '));
  chk('pac: e ela NAO gerou bloco nenhum', colide.texto === '');
  chk('pac: a recusa nomeia o prefixo e o codigo do pacote',
    (colide.avisos[0]||'').indexOf(COL_PREFIXO) >= 0 && (colide.avisos[0]||'').indexOf(COL_A) >= 0,
    colide.avisos[0]);
  console.log('    recusa: ' + (colide.avisos[0]||''));
}, [], {raiz: RAIZ, porta: 8963});
chk('pac/colisao: a ferramenta nao teve erro de console', wCol.erros.length === 0, wCol.erros.join(' | '));

/* 3. A FRONTEIRA DA MINI LOJA. So o CAMPO do codigo muda -- o catalogo e o mesmo. */
let fLoja = null;
const wLoja = await gerarNaFerramenta(async pg => {
  await identidade(pg);
  await abaLoja(pg, TRUNC_COD.substring(0, 15));
  const medidas = [];
  for(let n = 15; n <= 19; n++){
    await set(pg,'m-cod', TRUNC_COD.substring(0, n));
    const g = await gerar(pg, 'm-gerar', 'm-out');
    medidas.push({n, ok: g.avisos.length === 0, msg: g.avisos[0] || '', texto: g.texto});
    console.log('    loja: codigo com ' + n + ' letras -> ' + (g.avisos.length ? 'RECUSADO' : 'gerou'));
  }
  fLoja = fronteira(medidas);
  chk('loja: a fronteira e limpa (aceita ate um numero, recusa dai para cima)', fLoja.monotona);
  chk('loja: a recusa comeca UM caractere depois do ultimo aceito',
    fLoja.menorRecusado === fLoja.maiorAceito + 1, 'aceito ' + fLoja.maiorAceito + ', recusado ' + fLoja.menorRecusado);
  chk('loja: o numero que a recusa DIZ e o mesmo que ela FAZ',
    fLoja.citado === fLoja.maiorAceito, 'diz ' + fLoja.citado + ', faz ' + fLoja.maiorAceito);
  chk('loja: dentro do limite o bloco sai', medidas.some(m => m.ok && m.texto.length > 1000));

  /* HIFEN E SUBLINHADO NAO GASTAM ORCAMENTO: eles somem na limpeza do txid, e uma
     recusa que os contasse barraria uso legitimo -- pior que o defeito que ela
     conserta. 20 caracteres digitados, 17 uteis. */
  await set(pg,'m-cod','LOJA-FOTO_CERTA-VITO');
  const comHifen = await gerar(pg, 'm-gerar', 'm-out');
  chk('loja: 20 digitados com hifen e sublinhado (17 uteis) NAO e recusada',
    comHifen.avisos.length === 0, comHifen.avisos.join(' | '));

  /* A CONFIGURACAO QUE TRUNCAVA -- a MESMA que o "antes" acabou de executar. */
  await set(pg,'m-cod', TRUNC_COD);
  const trunca = await gerar(pg, 'm-gerar', 'm-out');
  chk('loja: A CONFIGURACAO QUE TRUNCAVA E RECUSADA', trunca.avisos.length === 1, trunca.avisos.join(' | '));
  console.log('    recusa: ' + (trunca.avisos[0]||''));

  /* volta ao limite: o bloco que sai desta sessao e o que vai ser executado */
  await set(pg,'m-cod', TRUNC_COD.substring(0, 17));
  const volta = await gerar(pg, 'm-gerar', 'm-out');
  chk('loja: encurtar o codigo desfaz a recusa', volta.avisos.length === 0, volta.avisos.join(' | '));
}, ['m-out'], {raiz: RAIZ, porta: 8964});
chk('loja: a ferramenta nao teve erro de console', wLoja.erros.length === 0, wLoja.erros.join(' | '));

console.log('\n  os limites, MEDIDOS pela interface:');
console.log('    mini loja: ' + fLoja.maiorAceito + ' | agendamento: ' + fPac.maiorAceito +
  '  (com o txid em 25: cauda de ' + (25 - fLoja.maiorAceito) + ' e de ' + (25 - fPac.maiorAceito) + ')');

/* ===================== O LIMITE EXATO, COM O PAYLOAD LIDO =====================
   O 25 ESTA ESCRITO AQUI DE PROPOSITO. E o teto do campo 05 do BR Code -- vem da
   especificacao do Pix, nao da ferramenta -- e o teste tem de conhece-lo por conta
   propria: perguntar o teto a ferramenta e depois conferir a ferramenta contra ele
   seria perguntar a ela se ela concorda consigo mesma. */
const TXID_PIX = 25;

const limPac = await comBlocoNaPagina({bloco: wPac.valores['a-out3'], porta: 8954,
  busca: '?pac=' + CODPAC + '&' + QUANDO.slice(1), medir: medirPac});
const txLimPac = txidDoPayload(limPac.payload);
console.log('    agendamento -> txid ' + JSON.stringify(txLimPac) + ' (' + (txLimPac||'').length + ' caracteres)');
chk('limite/pac: o payload e legivel e o CRC proprio fecha', !!txLimPac && crcConfere(limPac.payload));
chk('limite/pac: o txid cabe nos ' + TXID_PIX + ' caracteres do Pix',
  (txLimPac||'').length > 0 && txLimPac.length <= TXID_PIX, String(txLimPac));
chk('limite/pac: no teto ele usa os ' + TXID_PIX + ' inteiros',
  (txLimPac||'').length === TXID_PIX, String(txLimPac));
chk('limite/pac: e o txid e prefixo + codigo + dia e hora, inteiro e sem corte',
  txLimPac === 'FC' + CODPAC + DIAHORA, String(txLimPac));
chk('limite/pac: o limite medido pela interface bate com o que sobrou do txid',
  fPac.maiorAceito === TXID_PIX - DIAHORA.length,
  'medido ' + fPac.maiorAceito + ', conta ' + (TXID_PIX - DIAHORA.length));
chk('limite/pac: o bloco rodou sem erro proprio',
  errosReais(limPac.erros).length === 0, errosReais(limPac.erros).join(' | '));

const limLoja = await comBlocoNaPagina({bloco: wLoja.valores['m-out'], porta: 8955,
  relogio: RELOGIO, medir: medirLoja});
const txLimLoja = txidDoPayload(limLoja.payload);
const telaLim = soId(limLoja.naTela).replace(/[^A-Za-z0-9]/g,'');
console.log('    loja, na tela: ' + JSON.stringify(limLoja.naTela));
console.log('    loja, txid:    ' + JSON.stringify(txLimLoja) + ' (' + (txLimLoja||'').length + ' caracteres)');
chk('limite/loja: o payload e legivel e o CRC proprio fecha', !!txLimLoja && crcConfere(limLoja.payload));
chk('limite/loja: o txid cabe nos ' + TXID_PIX + ' caracteres do Pix',
  (txLimLoja||'').length > 0 && txLimLoja.length <= TXID_PIX, String(txLimLoja));
chk('limite/loja: no teto ele usa os ' + TXID_PIX + ' inteiros',
  (txLimLoja||'').length === TXID_PIX, String(txLimLoja));
chk('limite/loja: O QUE O CLIENTE LE E O QUE CHEGA AO EXTRATO (nada foi cortado)',
  telaLim === txLimLoja, 'tela=' + telaLim + ' txid=' + txLimLoja);
/* A CAUDA, medida no que o cliente le: o identificador da tela e "<codigo>-<cauda>",
   e e a cauda que consome o resto dos 25. Limite medido mais cauda medida tem de dar
   exatamente o teto do Pix -- e essa igualdade que diz que o limite foi DERIVADO da
   montagem, e nao escolhido de fora dela. */
const caudaLoja = soId(limLoja.naTela).split('-').pop();
chk('limite/loja: limite medido (' + fLoja.maiorAceito + ') + cauda medida (' + caudaLoja.length + ') = ' + TXID_PIX,
  fLoja.maiorAceito + caudaLoja.length === TXID_PIX);
chk('limite/loja: o bloco rodou sem erro proprio',
  errosReais(limLoja.erros).length === 0, errosReais(limLoja.erros).join(' | '));

process.exit(resumo());
