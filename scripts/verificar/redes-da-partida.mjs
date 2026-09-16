/* ============================================================================
   AS REDES DA PARTIDA DISPARAM MESMO?
   ============================================================================
   A ferramenta acende uma BARRA VERMELHA na abertura quando encontra um estado
   que nao deveria existir. Rede que nunca foi vista disparando e promessa, nao
   rede -- e este projeto ja teve uma prova ficar vermelha desde que nasceu sem
   ninguem notar. Aqui cada rede e medida NOS DOIS SENTIDOS: silencio na arvore
   sa, e barra vermelha NOMEANDO o problema numa copia adulterada de proposito.

   A ARVORE REAL NUNCA E TOCADA. Cada controle negativo escreve uma copia do
   index.html numa pasta temporaria e serve a copia.

   AS DUAS REDES QUE ESTA PROVA COBRE (16/09/2026, item 2 da auditoria):

   1. A ORDEM DO REGISTRO DE ABAS. A ordem de ABAS e a ordem em que o estado e
      devolvido. Uma aba que grava estado de dentro do proprio restaura
      (restauraGrava:true) precisa ser a ULTIMA -- qualquer aba depois dela ainda
      nao foi restaurada quando o salvarEstado dispara, e o que fica gravado sao
      os padroes. O dono perde a configuracao e NAO HA ERRO NA TELA. Ate
      16/09/2026 a unica protecao era um comentario dentro de um array de 125
      linhas.

   2. A LISTA DAS ABAS QUE COBRAM. FC_PAG_PREFS e escrita a mao e alimenta tres
      coisas (o aviso dos textos do sinal, a conferencia de fabrica dos doze
      campos e a memoria da ordem dos meios). Aba que cobra e nao esta nela entra
      em silencio nas tres.

   ROTEIRO: node scripts/verificar/redes-da-partida.mjs
   ============================================================================ */
import { navegador, servir } from './lib.mjs';
import { chk as _chk, resumo } from './pagina.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* Serve uma COPIA da arvore, com o index.html trocado pelo texto dado. */
async function comIndex(texto, medir){
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-redes-'));
  for(const f of ['fc-compartilhado.js','previa.html']){
    if(fs.existsSync(path.join(RAIZ,f))) fs.copyFileSync(path.join(RAIZ,f), path.join(tmp,f));
  }
  fs.writeFileSync(path.join(tmp,'index.html'), texto);
  const srv = await servir(tmp, 8983);
  const br = await navegador();
  try{
    const pg = await br.newPage();
    const erros = [], console_ = [];
    pg.on('pageerror', e => erros.push(String(e.message)));
    /* A BARRA NOMEIA A ETAPA; o detalhe vai para o console. fcFalha escreve
       "<rotulo>: falha ao <fase>." na barra e manda o Error inteiro para
       console.error -- entao as duas superficies sao medidas, e a mensagem da
       rede e cobrada NO CONSOLE, que e onde ela de fato aparece. */
    pg.on('console', m => { if(m.type()==='error') console_.push(m.text()); });
    await pg.goto('http://127.0.0.1:8983/index.html');
    await pg.waitForTimeout(1200);
    const barra = await pg.evaluate(() => {
      const b = document.getElementById('fc-falhas');
      return b ? b.textContent.replace(/\s+/g,' ').trim() : '';
    });
    return await medir({pg, barra, erros, detalhe: console_.join(' | ')});
  } finally {
    await br.close(); srv.close();
    fs.rmSync(tmp, {recursive:true, force:true});
  }
}

const original = fs.readFileSync(path.join(RAIZ,'index.html'),'utf8');

/* ---- 1. a arvore sa fica em SILENCIO ---- */
await comIndex(original, async ({barra, erros}) => {
  _chk('[sa] nenhuma barra vermelha na abertura', barra === '', barra.slice(0,240));
  _chk('[sa] nenhum erro de página', erros.length === 0, erros.slice(0,2).join(' | '));
});

/* ---- 2. ORDEM DAS ABAS quebrada: a aba que grava vem antes de outra ---- */
/* A adulteracao MOVE o marcador restauraGrava para uma aba do meio, que e
   exatamente o que alguem faria ao "arrumar" o registro para bater com a tela. */
{
  const de = "  {id:'pac', nome:'Agendamento por pacote', chaves:['a'],       coleta:aColeta,restaura:aRestaura,gerar:aGerar,\n   restauraGrava:true,";
  const para = "  {id:'pac', nome:'Agendamento por pacote', chaves:['a'],       coleta:aColeta,restaura:aRestaura,gerar:aGerar,";
  _chk('[ordem] achei o marcador para adulterar', original.includes(de));
  const semMarca = original.replace(de, para);
  /* e poe o marcador numa aba que NAO e a ultima */
  const alvo = "  {id:'uni',  nome:'Checkout',            chaves:['u'],         coleta:uColeta,restaura:uRestaura,gerar:uGerar,";
  _chk('[ordem] achei a aba do meio para marcar', semMarca.includes(alvo));
  const ruim = semMarca.replace(alvo, alvo + "\n   restauraGrava:true,");
  await comIndex(ruim, async ({barra, detalhe}) => {
    _chk('[ordem] a barra vermelha ACENDE', barra !== '', '(silêncio)');
    _chk('[ordem] e o detalhe diz que a ordem perde configuração',
         /ordem do registro ABAS perde configuração/i.test(detalhe), detalhe.slice(0,300));
    _chk('[ordem] nomeando as duas abas envolvidas',
         /Checkout/.test(detalhe) && /Agendamento por pacote/.test(detalhe), detalhe.slice(0,300));
  });
}

/* ---- 3. a arvore SA nao dispara a rede da ordem (o par do item 2) ---- */
await comIndex(original, async ({detalhe}) => {
  _chk('[ordem] na árvore sã ela fica calada',
       !/ordem do registro ABAS/i.test(detalhe), detalhe.slice(0,240));
});

/* ---- 4. LISTA DAS ABAS QUE COBRAM: uma aba que cobra sai da lista ---- */
{
  const de = "var FC_PAG_PREFS=['u','a','p','m','v'];";
  _chk('[cobram] achei a lista para adulterar', original.includes(de));
  const ruim = original.replace(de, "var FC_PAG_PREFS=['u','a','p','m'];");
  await comIndex(ruim, async ({barra, detalhe}) => {
    _chk('[cobram] a barra vermelha ACENDE ao tirar a calculadora da lista', barra !== '', '(silêncio)');
    _chk('[cobram] e nomeia a aba que cobra e ficou de fora',
         /Calculadora de álbum cobra e não está/i.test(detalhe), detalhe.slice(0,300));
  });
}

/* ---- 5. o contrario: prefixo na lista sem aba que o declare ---- */
{
  const de = "var FC_PAG_PREFS=['u','a','p','m','v'];";
  const ruim = original.replace(de, "var FC_PAG_PREFS=['u','a','p','m','v','z'];");
  await comIndex(ruim, async ({barra, detalhe}) => {
    _chk('[cobram] a barra ACENDE com prefixo que nenhuma aba declara', barra !== '', '(silêncio)');
    /* DUAS redes cobrem este caso, e a primeira a rodar vence: fcSinalTxtDiverge procura os
       tres campos de sinal do prefixo 'z' e nao os acha, e lanca antes de fcPagPrefsConferir.
       A prova cobra o que importa -- que o prefixo sobrando seja NOMEADO --, e nao qual das
       duas redes falou. Exigir uma delas em particular seria prender a prova a uma ordem de
       execucao que nao e o comportamento prometido. */
    _chk('[cobram] e o detalhe nomeia o prefixo sobrando',
         /\bz-txt-sinal|"z"/.test(detalhe), detalhe.slice(0,300));
  });
}

/* O CODIGO DE SAIDA E O RESULTADO, e nao um zero por descuido (16/09/2026). Nove suites
   chamavam resumo() e saiam com 0 aconteca o que acontecesse -- e chave-pix-limpeza
   estava FALHANDO e anunciando sucesso. Qualquer script que rode a bateria e olhe o
   codigo de saida a via verde. E pior que vermelho permanente: vermelho que ninguem
   olha ainda esta la; verde falso apaga o defeito. */
process.exit(resumo());
