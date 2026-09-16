/* ============================================================================
   A CHAVE PIX DA ABA "AGENDAMENTO POR PACOTE": UMA LIMPEZA SO (leva 6, 14/09/2026)
   ============================================================================
   O DEFEITO QUE ISTO MEDE. Ate esta rodada as duas pontas da mesma chave passavam
   por limpezas DIFERENTES: aRecusa validava cfg.chave, que nasce de pixLimpar, e o
   gerador da pagina de obrigado emitia fciVal('chave'), que passa por fcTrim.
   fcTrim apara so o que \s cobre; pixLimpar apara tambem os invisiveis de controle
   (U+0000 a U+001F, U+007F), o hifen suave (U+00AD), a faixa U+200B a U+200F e o
   word joiner (U+2060). Consequencia: chave com invisivel na ponta era
   VALIDADA por uma string e COBRADA por outra -- sem erro, sem aviso, e num campo
   que e dinheiro.

   ATE ONDE ELE ALCANCAVA, e isto foi MEDIDO e nao suposto: aGerar chama
   fcPixChaveAjustar('fci-chave') antes de aCfg(), entao a saida da TEXTAREA ja saia
   limpa. Quem NAO limpa e a PREVIA -- aPvMontar e aPvObMontar leem aCfg() direto.
   Era ela que EXECUTAVA um bloco com a chave suja logo depois de aRecusa ter
   aceitado a limpa, e e por isso que a prova aqui roda pelas DUAS pontas: a previa
   da propria ferramenta (bloco executando, dentro do iframe dela) e o bloco da
   textarea (executando no molde de pagina.mjs). Na referencia as duas pontas
   produzem BR Codes diferentes para UMA configuracao aceita; na arvore de hoje
   produzem o mesmo.

   O CAMINHO QUE ALCANCA ISSO e a COLAGEM, e foi preciso medir para achar o certo. A
   correcao a vista do campo so roda em 'change'/'blur' -- nunca em 'input' --, e o
   estado GRAVADO tambem nao serve de porta: a partida da ferramenta tem um passo
   ("Correcao das cores livres e da chave Pix na carga") que chama fcPixChaveAjustar
   e regrava, entao chave suja guardada volta limpa na abertura seguinte. Medido: a
   primeira versao deste arquivo sujava o localStorage e recarregava, e a chave
   voltava limpa -- a prova nao alcancava o estado, que e exatamente o buraco que
   este projeto manda declarar.
   O que ALCANCA e colar a chave e olhar a previa SEM sair do campo: 'input' dispara
   fciTalvezGravar, que grava e chama fciPreviaDaAberta(false); 400 ms depois a
   previa monta e EXECUTA um bloco com a chave suja. E o gesto mais provavel de
   todos -- colar a chave vinda do aplicativo do banco (de onde os invisiveis vem) e
   conferir na previa.

   O LEITOR TLV E ESCRITO AQUI DENTRO, de proposito: conferir o projeto com o lerTlv
   do projeto seria perguntar a ele se concorda consigo mesmo. O CRC16 tambem, e ele
   serve de guarda -- payload que nao fecha o CRC nao e payload, e a medicao para.

   A REFERENCIA E PRESA a 7e2baec (o commit ANTERIOR a esta rodada). Ela NAO pode ser
   'main': no dia em que esta rodada for mesclada, o lado "antes" passaria a medir a
   si mesmo e o arquivo acusaria falhas sem defeito nenhum por tras. O envelhecimento
   e DETECTADO lendo do proprio index.html da referencia o sinal da divergencia
   (escJs(fciVal('chave')) na emissao de CHAVE_PIX), e a parte 1 diz "NAO MEDIU" --
   nunca falha por envelhecer.

   Roda com:  node scripts/verificar/chave-pix-limpeza.mjs [ref]   (padrao: 7e2baec)
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, radio, clicar } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || '7e2baec';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-chavepix-'));
process.on('exit', () => { try{ fs.rmSync(tmp, {recursive:true, force:true}); }catch(e){} });
const dirRef = path.join(tmp, 'ref');
fs.mkdirSync(dirRef, {recursive:true});
execFileSync('/bin/sh', ['-c',
  'git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(dirRef)]);
console.log('referencia: ' + REF);

/* O SINAL DA DIVERGENCIA, lido do arquivo da referencia. Enquanto ele estiver la, a
   referencia serve; quando sumir, ela virou "depois" e a parte 1 nao mede mais nada. */
const idxRef = fs.readFileSync(path.join(dirRef, 'index.html'), 'utf8');
const refAindaTemODefeito = idxRef.indexOf("escJs(fciVal('chave'))") >= 0;
if(!refAindaTemODefeito)
  console.log('AVISO: a referencia ' + REF + ' JA tem o conserto -- a parte 1 nao mede nada.');

/* A ponta do invisivel: ZERO WIDTH SPACE. Escolhido porque separa exatamente as duas
   limpezas -- \s do JavaScript NAO o cobre (fcTrim o mantem) e pixLimpar o apara. */
/* Escrito por CODIGO, e nao colado: caractere invisivel dentro do fonte de um teste e
   exatamente o que ninguem enxerga ao ler o arquivo depois. */
const ZWSP = String.fromCharCode(0x200B);
const CHAVE_LIMPA = 'ensaio@fotocerta.com.br';
const CHAVE_SUJA  = CHAVE_LIMPA + ZWSP;
const IDENT = {chave:CHAVE_LIMPA, nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};
const PACOTE = {cod:'TESTE', nome:'Ensaio teste', dur:'2 horas', preco:'400', inclui:'20 fotos'};

/* ===== O LEITOR TLV E O CRC16, ESCRITOS AQUI ===== */
function lerTlv(s){
  const out = {};
  let i = 0;
  while(i < s.length){
    if(i + 4 > s.length) return null;
    const id = s.substr(i, 2), dois = s.substr(i + 2, 2);
    if(!/^[0-9]{2}$/.test(dois)) return null;
    const tam = parseInt(dois, 10);
    if(i + 4 + tam > s.length) return null;
    out[id] = s.substr(i + 4, tam);
    i += 4 + tam;
  }
  return out;
}
function crc16(str){
  let c = 0xFFFF;
  for(let i = 0; i < str.length; i++){
    c ^= (str.charCodeAt(i) & 0xFF) << 8;
    for(let j = 0; j < 8; j++) c = (c & 0x8000) ? (((c << 1) ^ 0x1021) & 0xFFFF) : ((c << 1) & 0xFFFF);
  }
  return ('0000' + c.toString(16).toUpperCase()).slice(-4);
}
/* Devolve {chave, valor, txid, crcOk} de um BR Code, ou null se ele nao fechar. */
function abrirPayload(p){
  if(typeof p !== 'string' || p.length < 8) return null;
  const corpo = p.slice(0, -4), lido = p.slice(-4);
  const campos = lerTlv(p);
  if(!campos || !campos['26']) return null;
  const conta = lerTlv(campos['26']);
  if(!conta) return null;
  return {chave: conta['01'], valor: campos['54'], txid: (lerTlv(campos['62'] || '') || {})['05'],
          campos, crcOk: crc16(corpo) === lido};
}
/* O TXID NAO E COMPARAVEL ENTRE DUAS VISITAS, e isto foi MEDIDO, nao suposto: o bloco desta
   aba compoe o identificador de conciliacao com o PREFIXO mais o codigo do pacote mais uma
   cauda POR VISITA (reservaChave), entao duas aberturas da mesma pagina produzem txid
   diferente de proposito -- e por isso dois BR Codes da mesma configuracao nunca sao iguais
   caractere por caractere. Medido: FCTESTEzcln6as5 contra FCTESTEukqgjbcq.
   O que se compara, entao, e o payload INTEIRO menos o campo 62 (onde o txid mora), mais o
   PREFIXO do txid -- que e a parte que a configuracao decide. Comparar o resto por igualdade
   exata continua sendo o que denuncia a divergencia da chave. */
function comparavel(d){
  const c = Object.assign({}, d.campos);
  delete c['62'];   /* o txid, com a cauda por visita */
  delete c['63'];   /* o CRC, que muda porque o txid mudou */
  return JSON.stringify(c);
}

/* ===== A FERRAMENTA, COM A CHAVE SUJA COLADA NO CAMPO =====
   'input' e SO 'input': e o que uma colagem dispara. set() de lib.mjs dispara tambem
   'change' e 'blur', que corrigem o campo a vista e apagariam o proprio caso de teste --
   por isso a chave suja entra por evaluate, e as outras quatro pelo caminho normal. */
async function colher(raiz, porta){
  const r = await gerarNaFerramenta(async pg => {
    for(const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC');
    await set(pg, 'a-descpix', '0');
    await radio(pg, 'a-metodo', 'pix');   /* so Pix: sem SDK de cartao no caminho */
    await set(pg, 'a-pcod', PACOTE.cod);   await set(pg, 'a-pnome', PACOTE.nome);
    await set(pg, 'a-pdur', PACOTE.dur);   await set(pg, 'a-ppreco', PACOTE.preco);
    await set(pg, 'a-pinclui', PACOTE.inclui);
    await set(pg, 'a-ppath', 'fotocerta/teste');
    await clicar(pg, 'a-pac-salvar');

    /* A COLAGEM: 'input' e so 'input'. */
    globalThis.__trocou = await pg.evaluate(suja => {
      const e = document.getElementById('fci-chave');
      if(!e) return false;
      e.value = suja;
      e.dispatchEvent(new Event('input', {bubbles:true}));
      return true;
    }, CHAVE_SUJA);
    await pg.waitForTimeout(900);   /* o debounce da previa e de 400 ms */

    globalThis.__campo = await pg.evaluate(() => {
      const e = document.getElementById('fci-chave'); return e ? e.value : null;
    });

    /* A PREVIA DA PAGINA DE OBRIGADO, com o bloco EXECUTANDO dentro do iframe da
       propria ferramenta. Le o CHAVE_PIX que o gerador emitiu e, clicando em "Gerar Pix",
       o BR Code que o bloco montou. */
    const frame = pg.frameLocator('#a-pv-ob-frame');
    let previa = {emitida:null, payload:null, houve:false};
    try{
      await frame.locator('.fca-ob-raiz').first().waitFor({timeout:8000});
      previa.houve = true;
      previa.emitida = await pg.evaluate(() => {
        const f = document.getElementById('a-pv-ob-frame');
        const d = f && (f.contentDocument || (f.contentWindow && f.contentWindow.document));
        if(!d) return null;
        const m = /var CHAVE_PIX='([^']*)'/.exec(d.documentElement.outerHTML);
        return m ? m[1] : null;
      });
      await frame.locator('.fca-ob-bt').first().click();
      await frame.locator('.fca-ob-pixarea.on').waitFor({timeout:8000});
      previa.payload = await frame.locator('.fca-ob-pixarea textarea').inputValue();
    }catch(e){ previa.erro = String(e).slice(0,200); }
    globalThis.__previa = previa;

    await clicar(pg, 'a-gerar');
    globalThis.__campoDepois = await pg.evaluate(() => {
      const e = document.getElementById('fci-chave'); return e ? e.value : null;
    });
  }, ['a-out3'], {raiz, porta});
  return {saida: r.valores['a-out3'] || '', alertas: r.alertas, erros: r.erros,
          trocou: globalThis.__trocou, campo: globalThis.__campo,
          campoDepois: globalThis.__campoDepois, previa: globalThis.__previa};
}

/* A chave que o bloco da textarea carrega, lida do texto dele. */
function chaveEmitida(bloco){
  const m = /var CHAVE_PIX='([^']*)'/.exec(bloco);
  return m ? m[1] : null;
}

/* O BLOCO DA TEXTAREA EXECUTANDO, no molde de pagina.mjs: gera o Pix e devolve o BR Code
   que ele montou. O QR pede o cdnjs, que o molde bloqueia de proposito -- o payload ja
   esta na textarea antes de desenharQr ser chamada. */
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|ERR_FAILED|Failed to load resource/;
async function payloadDoBloco(bloco, porta){
  const r = await comBlocoNaPagina({
    bloco, porta, busca:'?pac=TESTE',
    medir: async pg => {
      await pg.locator('.fca-ob-raiz').first().waitFor({timeout:8000});
      await pg.locator('.fca-ob-bt').first().click();
      await pg.locator('.fca-ob-pixarea.on').waitFor({timeout:8000});
      return {payload: await pg.locator('.fca-ob-pixarea textarea').inputValue()};
    }
  });
  return {payload: r.payload, erros: r.erros.filter(x => !EXTERNO.test(x))};
}

/* ============================================================================ */
console.log('\n[1] ANTES do conserto: a mesma configuracao, ACEITA, com dois BR Codes');
let antes = null;
if(!refAindaTemODefeito){
  console.log('  -- NAO MEDIU: a referencia ' + REF + ' ja emite escJs(cfg.chave).');
  console.log('     Para medir de verdade, passe um commit anterior a esta rodada:');
  console.log('     node scripts/verificar/chave-pix-limpeza.mjs 7e2baec');
}else{
  antes = await colher(dirRef, 8871);
  chk('[antes] a chave suja foi colada no campo', antes.trocou === true);
  chk('[antes] o campo ficou SUJO (input nao corrige; so change/blur corrigem)',
      antes.campo === CHAVE_SUJA, JSON.stringify(antes.campo));
  chk('[antes] aRecusa ACEITOU -- nenhum alerta, a previa montou',
      antes.alertas.length === 0 && antes.previa.houve === true,
      JSON.stringify(antes.alertas) + ' | previa: ' + JSON.stringify(antes.previa.erro || ''));
  chk('[antes] a PREVIA emitiu a chave COM o invisivel',
      antes.previa.emitida === CHAVE_SUJA, JSON.stringify(antes.previa.emitida));
  chk('[antes] a TEXTAREA emitiu a chave SEM o invisivel (aGerar limpou o campo antes)',
      chaveEmitida(antes.saida) === CHAVE_LIMPA, JSON.stringify(chaveEmitida(antes.saida)));

  const pvAntes = abrirPayload(antes.previa.payload);
  const taAntes = await payloadDoBloco(antes.saida, 8872);
  const txAntes = abrirPayload(taAntes.payload);
  chk('[antes] o BR Code da previa fecha o CRC', !!pvAntes && pvAntes.crcOk, String(antes.previa.payload).slice(0,60));
  chk('[antes] o BR Code da textarea fecha o CRC', !!txAntes && txAntes.crcOk, String(taAntes.payload).slice(0,60));
  chk('[antes] o bloco da textarea rodou sem erro proprio', taAntes.erros.length === 0, taAntes.erros.join(' | '));
  chk('[antes] O DEFEITO: os dois BR Codes da MESMA configuracao aceita sao DIFERENTES',
      antes.previa.payload !== taAntes.payload, 'iguais -- o defeito nao apareceu');
  chk('[antes] e a diferenca esta na CHAVE, lida pelo TLV deste arquivo',
      !!pvAntes && !!txAntes && pvAntes.chave === CHAVE_SUJA && txAntes.chave === CHAVE_LIMPA,
      'previa=' + JSON.stringify(pvAntes && pvAntes.chave) + ' textarea=' + JSON.stringify(txAntes && txAntes.chave));
  chk('[antes] a divergencia e SO a chave: o resto do payload (fora o txid por visita) e igual',
      !!pvAntes && !!txAntes && pvAntes.valor === txAntes.valor &&
      String(pvAntes.txid).slice(0,7) === String(txAntes.txid).slice(0,7) &&
      comparavel(pvAntes) !== comparavel(txAntes),
      'previa=' + JSON.stringify(pvAntes) + ' textarea=' + JSON.stringify(txAntes));
}

console.log('\n[2] DEPOIS do conserto: uma limpeza so, um BR Code so');
{
  const hoje = await colher(RAIZ, 8873);
  chk('[hoje] a chave suja foi colada no campo', hoje.trocou === true);
  chk('[hoje] o campo ficou SUJO (o conserto e no gerador, nao na correcao a vista)',
      hoje.campo === CHAVE_SUJA, JSON.stringify(hoje.campo));
  chk('[hoje] aRecusa ACEITOU -- nenhum alerta, a previa montou',
      hoje.alertas.length === 0 && hoje.previa.houve === true,
      JSON.stringify(hoje.alertas) + ' | previa: ' + JSON.stringify(hoje.previa.erro || ''));
  chk('[hoje] a PREVIA emite a chave LIMPA', hoje.previa.emitida === CHAVE_LIMPA,
      JSON.stringify(hoje.previa.emitida));
  chk('[hoje] a TEXTAREA emite a chave LIMPA', chaveEmitida(hoje.saida) === CHAVE_LIMPA,
      JSON.stringify(chaveEmitida(hoje.saida)));

  const pv = abrirPayload(hoje.previa.payload);
  const ta = await payloadDoBloco(hoje.saida, 8874);
  const tx = abrirPayload(ta.payload);
  chk('[hoje] o bloco da textarea rodou sem erro proprio', ta.erros.length === 0, ta.erros.join(' | '));
  chk('[hoje] os dois BR Codes fecham o CRC', !!pv && pv.crcOk && !!tx && tx.crcOk);
  chk('[hoje] OS DOIS BR CODES SAO IGUAIS fora o txid por visita -- e o campo 26 bate byte a byte',
      !!pv && !!tx && comparavel(pv) === comparavel(tx),
      'previa=' + JSON.stringify(pv && pv.campos) + ' | textarea=' + JSON.stringify(tx && tx.campos));
  chk('[hoje] o prefixo do txid, que a configuracao decide, tambem bate',
      !!pv && !!tx && String(pv.txid).slice(0,7) === String(tx.txid).slice(0,7),
      String(pv && pv.txid) + ' | ' + String(tx && tx.txid));
  chk('[hoje] e a chave dentro deles e a LIMPA, lida pelo TLV deste arquivo',
      !!pv && !!tx && pv.chave === CHAVE_LIMPA && tx.chave === CHAVE_LIMPA,
      'previa=' + JSON.stringify(pv && pv.chave) + ' textarea=' + JSON.stringify(tx && tx.chave));
}

console.log('\n[3] a chave com invisivel no MEIO continua RECUSADA -- o conserto nao afrouxou nada');
{
  const r = await gerarNaFerramenta(async pg => {
    for(const [k, v] of Object.entries(IDENT)) await set(pg, 'fci-' + k, v);
    await clicar(pg, 'aba-pac');
    await set(pg, 'a-urlobrigado', 'https://www.fotocerta.com.br/obrigado');
    await set(pg, 'a-prefixo', 'FC'); await set(pg, 'a-descpix', '0');
    await radio(pg, 'a-metodo', 'pix');
    await set(pg, 'a-pcod', PACOTE.cod);   await set(pg, 'a-pnome', PACOTE.nome);
    await set(pg, 'a-pdur', PACOTE.dur);   await set(pg, 'a-ppreco', PACOTE.preco);
    await set(pg, 'a-pinclui', PACOTE.inclui); await set(pg, 'a-ppath', 'fotocerta/teste');
    await clicar(pg, 'a-pac-salvar');
    await pg.evaluate(meio => {
      const e = document.getElementById('fci-chave');
      e.value = meio;
      e.dispatchEvent(new Event('input', {bubbles:true}));
    }, 'ensaio@foto' + ZWSP + 'certa.com.br');
    await pg.waitForTimeout(300);
    await clicar(pg, 'a-gerar');
  }, ['a-out3'], {porta: 8875});
  chk('recusou com aviso na tela', r.alertas.length > 0, JSON.stringify(r.alertas));
  chk('e nao gerou bloco nenhum', (r.valores['a-out3'] || '') === '', (r.valores['a-out3'] || '').slice(0,80));
}

console.log('\n[4] as OUTRAS TRES abas de pagamento: o mesmo descompasso existe la?');
{
  /* Varredura ESTATICA, e nao mais um navegador: a pergunta e "que texto o gerador emite",
     e isso se le no fonte. Ela vale por dois: mede que as outras tres ja estavam certas
     (e por isso esta rodada nao mexeu nelas) e impede que a linha errada volte -- em
     qualquer aba, inclusive numa aba nova. */
  const idx = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const emiteChave = [...idx.matchAll(/CHAVE_PIX='"\+escJs\(([^)]*)\)/g)].map(m => m[1]);
  const cfgChave = (idx.match(/chave:pixLimpar\(fciBruto\('chave'\)\)/g) || []).length;
  /* O NUMERO SAI DA LISTA UNICA DAS ABAS QUE COBRAM, e nao de um 4 cravado (16/09/2026). Com
     a chegada da 11a aba esta assertiva ficou vermelha sem defeito por tras -- e, pior, a
     vizinha CONTINUOU VERDE pelo motivo errado: quatro abas usavam pixLimpar e a quinta usava
     fciVal (so o trim), entao o 4 fechava e a divergencia passava. Vermelho que e sempre
     vermelho esconde o proximo; numero cravado que por acaso fecha esconde o de hoje. */
  const nPag = (/var FC_PAG_PREFS=\[([^\]]*)\]/.exec(idx) || [,''])[1]
    .split(',').filter(x => x.trim()).length;
  chk('a lista das abas que cobram foi lida do fonte', nPag > 0, String(nPag));
  /* MEDIDO, e nao suposto: as CINCO emitem, inclusive o Link de cobranca -- o bloco da /pagar
     leva a chave dentro, e o que viaja no link e o valor. 'chave' (sem o cfg.) e o alias local
     do Checkout, e por isso as duas grafias sao aceitas. */
  chk('toda aba que cobra emite CHAVE_PIX a partir de cfg.chave',
      emiteChave.length === nPag && emiteChave.every(x => x === 'cfg.chave' || x === 'chave'),
      JSON.stringify(emiteChave) + ' para ' + nPag + ' abas que cobram');
  chk('nenhum gerador emite a chave por fciVal (que passa por fcTrim)',
      idx.indexOf("escJs(fciVal('chave'))") < 0);
  chk('toda aba que cobra monta cfg.chave com pixLimpar', cfgChave === nPag,
      cfgChave + ' para ' + nPag + ' abas que cobram');
  /* A /cobrar e a quinta ponta, e ela ja usava a mesma limpeza nas duas -- medido aqui para
     a afirmacao nao ficar por conta da memoria de quem leu o arquivo uma vez. */
  const cob = fs.readFileSync(path.join(RAIZ, 'cobrar', 'index.html'), 'utf8');
  chk('a /cobrar tambem monta a chave com pixLimpar', cob.indexOf('C.pixLimpar(id.chave)') >= 0);
}

resumo();
