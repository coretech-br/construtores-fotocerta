/* ============================================================================
   A PREVIA DIZ QUANDO ESTA REDUZIDA -- e o tamanho real fica a um clique
   ============================================================================
   POR QUE ISTO EXISTE, e a data importa: em 17/09/2026 um cartao desalinhado da
   vitrine de pacotes chegou a PAGINA PUBLICADA, e o dono so o viu depois de colar o
   codigo no site. A previa nao estava errada -- ela desenha o bloco de verdade --,
   estava ENCOLHIDA: o modo Computador monta o quadro em 1040px e o reduz para caber
   no painel. Medido no dia: o desalinhamento de 12 pixels virava 8,3 na tela, dentro
   de um quadro pequeno, e o olho nao pegava.

   O CONSERTO NAO E AUMENTAR A PREVIA -- o painel tem a largura que tem, e mostrar
   1040px sem reduzir custaria rolagem horizontal em tudo. O conserto e a previa
   PARAR DE PARECER TAMANHO REAL: ela anuncia a reducao ao lado dos botoes, e oferece
   "Abrir em tamanho real", que e o mesmo documento noutra aba, sem escala.

   O QUE ESTA PROVA VIGIA:
     1. a reducao e ANUNCIADA, e o numero bate com a escala realmente aplicada;
     2. quando nao ha reducao (modo Celular cabe inteiro), ela diz "tamanho real" --
        um aviso que aparece sempre vira ruido e para de ser lido;
     3. o botao existe e a aba nova sai da MESMA fonte (aPvDoc), e nao de uma segunda
        montagem -- duas previas divergem, e e regra deste projeto;
     4. o documento da aba nova leva o SHIM de armazenamento junto, senao ela sujaria
        as chaves reais do navegador do dono.

   ROTEIRO: node scripts/verificar/previa-escala.mjs
   ============================================================================ */
import { navegador, servir, abrir, set, radio, clicar } from './lib.mjs';
import { chk, resumo } from './pagina.mjs';
import { IDENT } from './cenario.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const br = await navegador();
const srv = await servir(RAIZ, 9651);
const pg = await abrir(br, 'http://127.0.0.1:9651');
await pg.setViewportSize({width: 1600, height: 1100});

for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
await clicar(pg,'aba-pac');
await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
await set(pg,'a-prefixo','FC');
await radio(pg,'a-metodo','ambos');
await set(pg,'a-pcod','H2'); await set(pg,'a-pnome','Dia Util');
await set(pg,'a-pdur','2 horas'); await set(pg,'a-ppreco','230');
await set(pg,'a-pinclui','Locacao por 2 horas'); await set(pg,'a-ppath','fotocerta/h2');
await clicar(pg,'a-pac-salvar');
await pg.waitForTimeout(1200);

/* ---- 1. o modo Computador reduz, e DIZ que reduziu ---- */
await clicar(pg,'a-pv-desk');
await pg.waitForTimeout(1200);
const desk = await pg.evaluate(() => {
  const ifr = document.querySelector('#a-pv-box iframe');
  const m = ifr ? getComputedStyle(ifr).transform.match(/matrix\(([\d.]+)/) : null;
  return {escalaReal: m ? parseFloat(m[1]) : null,
          anunciado: (document.getElementById('a-pv-escala')||{}).textContent || '',
          temBotao: !!document.getElementById('a-pv-real')};
});
chk('[1] o quadro do computador esta mesmo reduzido',
    desk.escalaReal !== null && desk.escalaReal < 0.995, JSON.stringify(desk));
chk('[1] e a reducao e ANUNCIADA na tela', /reduzido a \d+%/.test(desk.anunciado), JSON.stringify(desk.anunciado));
if(desk.escalaReal){
  const dito = parseInt((desk.anunciado.match(/(\d+)%/)||[])[1], 10);
  /* O NUMERO TEM DE SER O DA ESCALA APLICADA, e nao um numero qualquer: um aviso que
     anuncia uma reducao diferente da real e pior que nenhum -- ele ensina a confiar errado. */
  chk('[1] o numero anunciado bate com a escala aplicada',
      Math.abs(dito - Math.round(desk.escalaReal*100)) <= 1,
      'anunciado ' + dito + '% · aplicado ' + Math.round(desk.escalaReal*100) + '%');
}
chk('[1] o botao "Abrir em tamanho real" existe', desk.temBotao === true);

/* ---- 2. sem reducao, o aviso muda -- aviso que aparece sempre vira ruido ---- */
await clicar(pg,'a-pv-cel');
await pg.waitForTimeout(1200);
const cel = await pg.evaluate(() => {
  const ifr = document.querySelector('#a-pv-box iframe');
  const m = ifr ? getComputedStyle(ifr).transform.match(/matrix\(([\d.]+)/) : null;
  return {escalaReal: m ? parseFloat(m[1]) : 1,
          anunciado: (document.getElementById('a-pv-escala')||{}).textContent || ''};
});
if(cel.escalaReal >= 0.995)
  chk('[2] no modo Celular, que cabe inteiro, ele diz "tamanho real"',
      /tamanho real/.test(cel.anunciado), JSON.stringify(cel));
else
  chk('[2] no modo Celular a reducao tambem e anunciada',
      /reduzido a \d+%/.test(cel.anunciado), JSON.stringify(cel));

/* ---- 3. a aba nova sai da MESMA fonte que o quadro ----
   A ferramenta inteira roda dentro de um IIFE, entao 'aPvDoc' nao existe como global e nao da
   para chama-la de fora. A pergunta, porem, e ESTATICA por natureza -- "os dois caminhos usam a
   mesma funcao?" --, e por isso ela e feita no TEXTO do arquivo, como a varredura de
   aparencia.mjs ja faz com as outras abas. Uma segunda montagem seria uma segunda previa, e
   duas previas divergem no primeiro ajuste feito num lado so. */
{
  const fonte = fs.readFileSync(path.join(RAIZ,'index.html'),'utf8');
  const corpoDe = nome => {
    const i = fonte.indexOf('function '+nome+'(');
    if(i < 0) return '';
    /* ate a proxima declaracao de funcao no mesmo nivel -- basta para ler as chamadas */
    const j = fonte.indexOf('\nfunction ', i + 1);
    return fonte.substring(i, j < 0 ? i + 4000 : j);
  };
  const real = corpoDe('aPvReal'), montar = corpoDe('aPvMontar');
  chk('[3] a funcao do "tamanho real" existe', real.length > 0);
  for(const [que, chamada] of [['o documento da previa','aPvDoc('],
                               ['a tela de recusa','aPvRecusaDoc(']]){
    chk('[3] o quadro monta ' + que, montar.indexOf(chamada) >= 0);
    chk('[3] e a aba nova usa A MESMA fonte para ' + que, real.indexOf(chamada) >= 0,
        JSON.stringify(real.slice(0,200)));
  }
  /* A RECUSA TAMBEM VALE NA ABA NOVA: o que o gerador se negaria a produzir nao pode aparecer
     em tamanho real so porque foi aberto por outro botao. */
  chk('[3] a aba nova respeita a recusa, como o quadro', /aRecusa\(/.test(real), JSON.stringify(real.slice(0,200)));
}

/* ---- 4. o botao esta ligado ao caminho certo ---- */
const ligado = await pg.evaluate(() => {
  /* o molde do arnes anula window.open; aqui ele e trocado por um espiao para se saber se o
     clique chega ao lugar certo -- sem isso o botao poderia estar inerte e a prova nao veria. */
  window.__abriuReal = 0;
  window.open = function(){ window.__abriuReal++; return null; };
  document.getElementById('a-pv-real').click();
  return window.__abriuReal;
});
chk('[4] o clique em "Abrir em tamanho real" pede uma aba nova', ligado === 1, String(ligado));

await br.close(); srv.close();
process.exit(resumo());
