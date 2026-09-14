/* ============================================================================
   A MIGRACAO DO MEIO PRIORITARIO, E O OUTRO LADO DA REGRESSAO
   ============================================================================
   POR QUE ISTO EXISTE. A rodada de 12/09/2026 trocou o PADRAO DE FABRICA de duas
   frases do Checkout e da Mini loja ('ou pague com Pix' -> 'ou pague com cartao',
   porque o Pix passou a vir em cima). Trocar o padrao NAO CHEGA a quem ja usou a
   ferramenta: os campos de texto sao gravados a cada tecla, entao o estado do dono
   ja contem a frase antiga, e valor gravado vence padrao. Sem migracao, o bloco
   dele sairia dizendo "ou pague com Pix" logo ACIMA do Pix.
   A migracao e de uma vez so, e so mexe no que for, caractere por caractere, a
   fabrica ANTERIOR -- nesse caso o dono nunca personalizou. Texto dele fica.

   O QUE ELE PROVA:
     1. Estado colhido da PROPRIA referencia (git archive + a ferramenta de la
        gravando de verdade) -- nunca um JSON escrito a mao aqui, que envelheceria
        no dia em que o formato mudasse.
     2. Valor igual a fabrica antiga -> MIGRA.
     3. Valor personalizado -> INTOCADO (o teste escreve um texto proprio na
        referencia e confere que ele atravessa inteiro).
     4. fcTxtFabricaDiverge NAO ACENDE numa ferramenta recem-aberta, nas duas
        escolhas -- a barra vermelha existe para denunciar fabrica divergente, e
        uma que acende sozinha nao denuncia mais nada.
     5. O OUTRO LADO DA REGRESSAO: com o meio prioritario em 'cartao', o Checkout e
        a Mini loja voltam a ser BYTE A BYTE identicos aos da referencia. Se nao
        voltarem, a mudanca levou junto algo que nao era a ordem.
        E, com 'Pix' (a fabrica), a VITRINE da aba Agendamento por pacote tambem seria
        byte a byte identica -- aquela aba ja era Pix-primeiro. ESSA ULTIMA AFIRMACAO
        FICOU SEM COMMIT QUE A RESPONDA (medido em 14/09/2026): ela exige uma referencia
        anterior a 12/09 E posterior a leva 5 de 13/09, que mudou a-out1 por um motivo
        legitimo -- as duas condicoes nao se encontram. Ela agora diz "NAO MEDIU" com a
        razao escrita, em vez de acusar falha todo dia; quem cobre a vitrine e a
        PROPRIEDADE ao lado (trocar a escolha muda pouco, e so a ordem).

   AS PARTES 1, 2 e 4 PRECISAM DE UMA REFERENCIA ANTERIOR A 12/09/2026. Desde que a
   rodada chegou a 'main', o padrao deixou de servir para elas -- e o arquivo passou a
   acusar nove falhas todo dia, sem defeito nenhum por tras (medido em 13/09/2026, iguais
   numa arvore limpa de 'main'). Um vermelho que e sempre vermelho esconde o proximo, que
   seria de verdade. Agora ele DETECTA a situacao e diz "nao mediu", em vez de falhar; e a
   parte 4 troca de pergunta, cobrando que a escolha de FABRICA saia byte a byte igual a da
   referencia. Para medir a MIGRACAO de verdade, passe um commit anterior a rodada.

   Uso:  node scripts/verificar/meio-prio-migracao.mjs [ref]     (padrao: main)
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { preparar, conteudo, cobranca, gerarTodas } from './cenario.mjs';
import { radio, clicar } from './lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = process.argv[2] || 'main';

/* A REFERENCIA sai de 'git archive' para uma pasta temporaria -- nao mexe na arvore de
   trabalho e nao precisa de checkout. Mesmo caminho de regressao.sh. */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-meioprio-'));
process.on('exit', () => { try{ fs.rmSync(tmp, {recursive:true, force:true}); }catch(e){} });
const dirRef = path.join(tmp, 'ref');
fs.mkdirSync(dirRef, {recursive:true});
execFileSync('/bin/sh', ['-c',
  'git -C ' + JSON.stringify(RAIZ) + ' archive ' + JSON.stringify(REF) + ' | tar -x -C ' + JSON.stringify(dirRef)]);
console.log('referencia: ' + REF);

const CAMPOS = [['u','u-txt-ou','u-txt-ou-desc'], ['m','m-txt-ou','m-txt-ou-desc']];
const FABRICA_ANTIGA = {
  'u-txt-ou':'ou pague com Pix', 'u-txt-ou-desc':'ou pague com Pix com {pct}% de desconto',
  'm-txt-ou':'ou pague com Pix', 'm-txt-ou-desc':'ou pague com Pix com {pct}% de desconto'
};
/* ONDE UM ESTADO ANTIGO VAI PARAR NA ARVORE DE HOJE.
   Ate 13/09/2026 isto era "a fabrica da ordem nova" -- 'ou pague com cartao' --, porque a unica
   migracao no caminho era fcOrdMigrar. Com a decisao 24 do dono o separador virou NEUTRO nas
   quatro abas, e agora sao DUAS migracoes em fila dentro de uRestaura/mRestaura: fcOrdMigrar
   leva a fabrica antiga da ordem ('ou pague com Pix') a fabrica da ordem nova, e fcSepNeutro
   leva essa ao texto neutro. O destino final e 'OU' -- e a afirmacao ficou mais forte, nao mais
   fraca: venha de QUAL for a fabrica antiga, um separador que o dono nunca escreveu termina
   neutro, junto com as duas abas que ja eram.
   O nome mudou junto: chamar isto de "fabrica nova" era descrever o caminho do meio como se
   fosse o fim, e nome que descreve o estado de ontem manda procurar no lugar errado. */
const DESTINO_HOJE = {
  'u-txt-ou':'OU', 'u-txt-ou-desc':'OU',
  'm-txt-ou':'OU', 'm-txt-ou-desc':'OU'
};
const MEU = 'Prefiro que voce pague no Pix, por favor';

/* ===== 1. o estado COLHIDO da referencia ===== */
/* 'personalizar' escreve um texto do dono em u-txt-ou antes de colher -- e o unico caso
   em que a migracao NAO pode tocar em nada. */
async function colherDaRef(personalizar){
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg); await cobranca(pg,{descpix:'10', valor:'450,00'});
    if(personalizar){
      const { set } = await import('./lib.mjs');
      await set(pg, 'u-txt-ou', MEU);
    }
    /* Colhe o que a ferramenta DA REFERENCIA gravou sozinha, e nao um objeto montado aqui. */
    globalThis.__colhido = await pg.evaluate(() => localStorage.getItem('fcConstrutores'));
    globalThis.__naRef = await pg.evaluate(ids => {
      const o = {}; ids.forEach(i => { const e = document.getElementById(i); o[i] = e ? e.value : null; });
      return o;
    }, Object.keys(FABRICA_ANTIGA));
  }, [], {raiz: dirRef, porta: 8895});
  chk('a referencia gerou sem alerta ao colher', r.alertas.length === 0, JSON.stringify(r.alertas));
  return { estado: globalThis.__colhido, naRef: globalThis.__naRef };
}

/* ===== 2. o estado colhido, restaurado na arvore de HOJE ===== */
async function restaurarAqui(estado){
  const r = await gerarNaFerramenta(async pg => {
    /* Grava o estado da referencia e RECARREGA: e a recarga que faz o restaura() rodar --
       escrever no armazenamento com a pagina ja aberta nao restaura nada. */
    await pg.evaluate(s => localStorage.setItem('fcConstrutores', s), estado);
    await pg.reload();
    /* A recarga devolve o alert original -- re-injetar e obrigatorio, senao alertas() logo
       abaixo le um __alertas que nao existe mais (mesma razao registrada em lib.abrir). */
    await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                              window.confirm = () => true; window.open = () => null; });
    await pg.waitForTimeout(200);
    globalThis.__agora = await pg.evaluate(ids => {
      const o = {}; ids.forEach(i => { const e = document.getElementById(i); o[i] = e ? e.value : null; });
      o.__prioU = (document.querySelector('input[name="u-prio"]:checked')||{}).value;
      o.__prioM = (document.querySelector('input[name="m-prio"]:checked')||{}).value;
      o.__diverge = (typeof fcTxtFabricaDiverge === 'function') ? fcTxtFabricaDiverge() : ['sem a funcao'];
      return o;
    }, Object.keys(FABRICA_ANTIGA));
  }, [], {porta: 8896});
  chk('a arvore de hoje restaurou sem alerta', r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('a arvore de hoje restaurou sem erro de console', r.erros.length === 0, r.erros.slice(0,2).join(' | '));
  return globalThis.__agora;
}

/* ============================================================================
   A REFERENCIA E ANTERIOR A RODADA? -- decidido UMA vez, antes de qualquer prova
   ============================================================================
   AS PARTES 1, 2 e 4 so significam alguma coisa contra uma referencia ANTERIOR a
   rodada do meio prioritario (12/09/2026): migrar so tem sentido a partir da
   fabrica velha, e "com o cartao prioritario o bloco volta a ser o da referencia"
   so tem sentido se a referencia for a de quando o cartao vinha primeiro.

   Desde que a rodada chegou a 'main', a referencia PADRAO deixou de ser anterior
   -- e este arquivo passou a acusar NOVE falhas todo dia, sem nenhum defeito por
   tras. Medido em 13/09/2026: 9 falhas de 52, iguais numa arvore limpa de 'main'.
   Isso e pior que nao ter o teste: um vermelho que e sempre vermelho esconde o
   vermelho seguinte, que seria de verdade.

   E a mesma licao que textos-migrados.mjs ja carrega escrita ("assercao com prazo
   de validade e defeito adiado"), e a mesma forma de regressao.sh, que declara a
   passagem configurada NAO COMPARAVEL contra referencia velha em vez de acusar
   divergencias que so dizem "a referencia e mais nova".

   Entao: contra referencia anterior, as tres partes rodam como sempre. Contra uma
   que ja tem a rodada, elas viram "nao mediu" -- com o motivo na tela e com o
   comando para medir de verdade --, e a parte 4 troca de pergunta: o que se cobra
   ali passa a ser que a escolha de FABRICA (Pix) sai byte a byte igual a da
   referencia, e que a outra escolha realmente muda. Isso continua sendo uma rede,
   e e uma que a referencia atual consegue sustentar. */
console.log('\n== 1. estado de fabrica colhido da referencia ==');
const colhido = await colherDaRef(false);
const refAnterior = !/"prio"/.test(colhido.estado);
if(refAnterior){
  for(const id of Object.keys(FABRICA_ANTIGA)){
    chk('a referencia gravou a fabrica ANTIGA em '+id, colhido.naRef[id] === FABRICA_ANTIGA[id],
        JSON.stringify(colhido.naRef[id]));
  }
  const migrado = await restaurarAqui(colhido.estado);
  for(const id of Object.keys(DESTINO_HOJE)){
    chk('MIGROU ate o separador NEUTRO de hoje (duas migracoes em fila): '+id,
        migrado[id] === DESTINO_HOJE[id], JSON.stringify(migrado[id]));
  }
  chk('o meio prioritario caiu no padrao de fabrica (Pix) no Checkout', migrado.__prioU === 'pix', migrado.__prioU);
  chk('o meio prioritario caiu no padrao de fabrica (Pix) na Mini loja', migrado.__prioM === 'pix', migrado.__prioM);
}else{
  console.log('  ..    NAO MEDIU -- a referencia "'+REF+'" JA TEM a rodada do meio prioritario');
  console.log('  ..    (o estado colhido dela ja traz a chave "prio"). Migrar so tem sentido a');
  console.log('  ..    partir da fabrica ANTERIOR. Para medir de verdade, passe um commit de');
  console.log('  ..    antes de 12/09/2026:  node scripts/verificar/meio-prio-migracao.mjs <commit>');
}

console.log('\n== 2. estado com texto do DONO, colhido da referencia ==');
if(refAnterior){
  const meu = await colherDaRef(true);
  chk('a referencia gravou o texto do dono', meu.naRef['u-txt-ou'] === MEU, JSON.stringify(meu.naRef['u-txt-ou']));
  const apos = await restaurarAqui(meu.estado);
  chk('o texto do dono ficou INTOCADO', apos['u-txt-ou'] === MEU, JSON.stringify(apos['u-txt-ou']));
  chk('e o campo ao lado, que estava na fabrica antiga, migrou do mesmo jeito',
      apos['u-txt-ou-desc'] === DESTINO_HOJE['u-txt-ou-desc'], JSON.stringify(apos['u-txt-ou-desc']));
}else{
  console.log('  ..    NAO MEDIU -- mesma razao da parte 1.');
}

/* ===== 3. a fabrica divergente numa ferramenta recem-aberta =====
   fcTxtFabricaDiverge vive dentro da IIFE da ferramenta e nao e alcancavel de fora -- e nao
   e para ser. O que se mede e o que o DONO veria: a barra vermelha (#fc-falhas), que e o
   unico efeito dela. O passo que a chama roda NO CARREGAMENTO, entao "nas duas escolhas"
   quer dizer: com o estado de fabrica, e com o estado ja gravado em 'cartao' -- este ultimo
   por recarga, que e como o dono abriria a ferramenta no dia seguinte. */
async function barraApos(prio){
  const r = await gerarNaFerramenta(async pg => {
    if(prio){
      for(const [pref] of CAMPOS) await radio(pg, pref+'-prio', prio);
      await pg.reload();
      await pg.evaluate(() => { window.__alertas = []; window.alert = m => { window.__alertas.push(String(m)); };
                                window.confirm = () => true; window.open = () => null; });
      await pg.waitForTimeout(200);
    }
    globalThis.__barra = await pg.evaluate(() => {
      const b = document.getElementById('fc-falhas');
      return b ? b.textContent.trim() : '';
    });
  }, [], {porta: 8897});
  chk('sem alerta ('+(prio||'recem-aberta')+')', r.alertas.length === 0, JSON.stringify(r.alertas));
  chk('sem erro de console ('+(prio||'recem-aberta')+')',
      r.erros.filter(e => !/Failed to load resource|net::ERR|favicon/i.test(e)).length === 0,
      r.erros.slice(0,2).join(' | '));
  return globalThis.__barra;
}
console.log('\n== 3. a barra vermelha da fabrica divergente ==');
const b0 = await barraApos(null);
chk('ferramenta recem-aberta: a barra vermelha NAO acende', b0 === '', b0);
for(const prio of ['pix','pp']){
  const b = await barraApos(prio);
  chk('depois de gravar o meio prioritario em "'+prio+'" e recarregar: a barra NAO acende', b === '', b);
}

/* ===== 4. o OUTRO LADO da regressao ===== */
console.log('\n== 4. byte a byte contra a referencia ==');
async function saidasCom(raiz, porta, prio){
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg); await cobranca(pg,{descpix:'10', valor:'450,00'});
    if(prio) for(const [aba,pref] of [['aba-uni','u'],['aba-loja','m'],['aba-pac','a']]){
      if(!(await pg.$('#'+aba))) continue;
      await clicar(pg,aba); await pg.waitForTimeout(40);
      await radio(pg, pref+'-prio', prio);
    }
    await gerarTodas(pg);
  }, ['u-out','m-out','a-out1'], {raiz, porta});
  return r.valores;
}
const daRef  = await saidasCom(dirRef, 8898, null);
const comPP  = await saidasCom(RAIZ,   8899, 'pp');
const comPix = await saidasCom(RAIZ,   8900, 'pix');
/* ===== O QUE ESTA PARTE MEDE, DEPOIS DE 13/09/2026 =====
   Ate esta data ela cobrava IGUALDADE BYTE A BYTE com um commit congelado: "com o cartao
   prioritario, u-out e identico ao da referencia anterior a rodada". Essa forma tem prazo de
   validade por construcao -- ela morre na primeira vez que QUALQUER outra rodada legitima toque
   aquelas saidas. E morreu: a rodada do numero de dinheiro (13/09) acrescentou duas regras de
   CSS a u-out e m-out, e a partir dali a assercao falhava contra 4c66719 mesmo numa arvore de
   'main' intocada -- medido, 2 falhas de 51, com os bytes 25808x25621 e 46392x46197.
   E a QUINTA vez que o arnes tropeca em referencia datada (id-orcamento, textos-reserva,
   meio-prio-migracao, sinal-cobranca, e agora esta).

   A PROPRIEDADE DE VERDADE nao precisa de referencia nenhuma: trocar a escolha muda SO a ordem
   e o destaque, e mais nada. Isso se mede comparando as DUAS escolhas da arvore de HOJE entre
   si e exigindo que toda linha divergente caia numa lista declarada. Nao envelhece, e diz mais:
   a forma antiga so sabia dizer "igual ou diferente"; esta diz ONDE pode diferir. */
const MARCAS = ['pixlinha','-gerar{','-gerar ','fcu-botoes','fcm-botoes','-sep','TXT_OU','margin-top'];
function linhasQueMudam(a,b){
  const A=a.split('\n'), B=b.split('\n'), setB=new Set(B), setA=new Set(A);
  return A.filter(l=>!setB.has(l)).concat(B.filter(l=>!setA.has(l)));
}
for(const [nome,saida] of [['Checkout','u-out'],['Mini loja','m-out']]){
  const dif = linhasQueMudam(comPix[saida], comPP[saida]);
  chk(nome+': trocar a escolha REALMENTE muda a saida', dif.length > 0);
  const fora = dif.filter(l => !MARCAS.some(m => l.indexOf(m) >= 0));
  chk(nome+': e muda SO a ordem e o destaque -- nada mais',
      fora.length === 0, fora.slice(0,3).map(l=>l.trim().slice(0,90)).join(' | '));
  /* O TETO existe porque a lista de marcas sozinha e fraca: uma mudanca grande e alheia que por
     acaso contivesse uma das palavras passaria por ela. Poucas linhas divergentes e a assinatura
     de "so a ordem mudou"; muitas sao outra coisa, e ai o teste fala mesmo sem saber o que e. */
  chk(nome+': e sao POUCAS linhas -- a assinatura de uma troca de ordem',
      dif.length <= 12, dif.length+' linhas divergentes');
}

/* A SETIMA VEZ, e a ultima linha deste arquivo que ainda dependia de um congelado (leva 5,
   13/09/2026). Ela cobrava "a vitrine com o Pix prioritario e byte a byte igual a da
   referencia" -- uma afirmacao de MIGRACAO, que so uma referencia anterior a rodada do meio
   prioritario consegue responder. Quando a leva 5 consertou o atalho `font:` invalido de
   .fca-trocar, a-out1 mudou por um motivo legitimo e esta linha passou a acusar falha todo dia,
   sem defeito nenhum por tras: 29378 contra 29337 bytes. E o mesmo vermelho permanente que o
   resto deste arquivo ja tinha aprendido a nao produzir.
   AGORA SAO DUAS LINHAS, e so a primeira depende de referencia:
   1. a afirmacao de migracao fica atras do MESMO guarda das partes 1 e 2 -- contra referencia
      moderna ela diz "nao mediu", com o comando que mediria de verdade;
   2. no lugar dela entra uma PROPRIEDADE da arvore de hoje, que nao envelhece: trocar a escolha
      muda a vitrine, e muda POUCO. O teto de linhas e o que a mede sem depender de commit
      nenhum. Nao se usou aqui a lista de marcas das duas abas acima de proposito: na vitrine a
      troca move o CORPO de duas funcoes (textoCartao e textoPix), e a lista teria de aceitar
      linhas nuas como `return t;`, que deixariam passar quase qualquer coisa -- teto sozinho
      mede menos, mas nao mente sobre o que mede. */
/* ===== A OITAVA VEZ, e desta vez a conclusao e que a pergunta NAO TEM MAIS RESPOSTA =====
   Medido em 14/09/2026 (leva 6): contra 4c66719 -- o commit que este proprio arquivo indica --
   a linha acusava falha, 29378 contra 29337 bytes, numa arvore SEM nenhum defeito. O guarda
   'refAnterior' nao bastava: ele so responde "a referencia e anterior a rodada do meio
   prioritario", e a comparacao tambem exige que a referencia ja tenha a leva 5, que consertou o
   atalho `font:` invalido de .fca-trocar e mudou a-out1 por um motivo legitimo.
   AS DUAS CONDICOES SAO INCOMPATIVEIS: anterior a 12/09 E posterior a 13/09 nao existe, e nao
   vai passar a existir. Entao esta afirmacao ficou sem commit que a responda -- e uma linha que
   nao pode mais medir nada nao pode continuar falhando todo dia, porque vermelho permanente
   esconde o proximo vermelho. Ela passa a DIZER isso, com a razao escrita, e a propriedade que
   nao envelhece (logo abaixo) continua sendo o que de fato cobre a vitrine.
   O SINAL E LIDO DO PROPRIO ARQUIVO DA REFERENCIA, e nao de uma data: o atalho `font:` antigo. */
const refTemLeva5 = !/font:600 12px\/1\.2 inherit/.test(
  fs.readFileSync(path.join(dirRef, 'index.html'), 'utf8'));
if(refAnterior && refTemLeva5){
  chk('vitrine da Agendamento por pacote com o PIX prioritario == referencia, byte a byte',
      comPix['a-out1'] === daRef['a-out1'],
      'tamanhos '+comPix['a-out1'].length+' x '+daRef['a-out1'].length);
}else if(!refAnterior){
  console.log('  ..    NAO MEDIU (byte a byte da vitrine) -- mesma razao das partes 1 e 2.');
  console.log('        Para medir a migracao de verdade: node scripts/verificar/meio-prio-migracao.mjs <commit anterior a 12/09/2026>');
}else{
  console.log('  ..    NAO MEDIU (byte a byte da vitrine): a referencia e anterior a leva 5, que');
  console.log('        mudou a-out1 por um motivo legitimo (o atalho `font:` de .fca-trocar).');
  console.log('        Esta afirmacao exigiria um commit anterior a 12/09 E posterior a 13/09 --');
  console.log('        nao existe. Quem cobre a vitrine e a propriedade medida logo abaixo.');
}
{
  const difA = linhasQueMudam(comPix['a-out1'], comPP['a-out1']);
  chk('vitrine da Agendamento por pacote: trocar a escolha REALMENTE muda a vitrine',
      difA.length > 0, 'nenhuma linha divergente');
  chk('vitrine da Agendamento por pacote: e muda POUCO -- a assinatura de uma troca de ordem',
      difA.length <= 20, difA.length+' linhas divergentes');
}

/* ===== 5. COM UM MEIO SO, a escolha nao muda um byte =====
   A ferramenta desliga o campo nesse caso (fcOrdSo1), mas o valor gravado continua indo ao
   gerador -- de proposito: forcar o padrao em uCfg/mCfg esconderia um defeito em vez de
   impedi-lo. Esta e a prova de que nao ha o que esconder. */
console.log('\n== 5. com um meio so, a escolha nao muda a saida ==');
async function umMeioSo(metodo, prio, porta){
  const r = await gerarNaFerramenta(async pg => {
    await preparar(pg); await conteudo(pg); await cobranca(pg,{descpix:'10', valor:'450,00'});
    for(const [aba,pref] of [['aba-uni','u'],['aba-loja','m'],['aba-pac','a']]){
      await clicar(pg,aba); await pg.waitForTimeout(40);
      await radio(pg, pref+'-prio', prio);
      await radio(pg, pref+'-metodo', metodo);
    }
    /* O Link de cobranca nao tem tres formas: ou oferece PayPal, ou so Pix. */
    await clicar(pg,'aba-cob'); await pg.waitForTimeout(40);
    await radio(pg,'p-prio',prio); await radio(pg,'p-usapp','nao');
    await gerarTodas(pg);
    globalThis.__off = await pg.evaluate(() => {
      const o = {};
      for(const pref of ['u','m','a','p']){
        o[pref] = {
          desligado: !!(document.querySelector('input[name="'+pref+'-prio"]')||{}).disabled,
          aviso: ((document.getElementById(pref+'-prio-so1')||{}).style||{}).display
        };
      }
      return o;
    });
  }, ['u-out','m-out','a-out1','a-out3','p-out1'], {porta});
  return {v:r.valores, off:globalThis.__off};
}
for(const metodo of ['pix','paypal']){
  const a = await umMeioSo(metodo, 'pix', 8901);
  const b = await umMeioSo(metodo, 'pp',  8902);
  for(const saida of ['u-out','m-out','a-out1','a-out3','p-out1'])
    chk('"somente '+metodo+'": '+saida+' sai igual nas duas escolhas', a.v[saida] === b.v[saida],
        'tamanhos '+a.v[saida].length+' x '+b.v[saida].length);
  for(const pref of ['u','m','a','p'])
    chk('"somente '+metodo+'": o campo de '+pref+' fica DESLIGADO e com o porque na tela',
        a.off[pref].desligado === true && a.off[pref].aviso === 'block', JSON.stringify(a.off[pref]));
}

process.exit(resumo());
