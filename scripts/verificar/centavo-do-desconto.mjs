/* ============================================================================
   O CENTAVO DO DESCONTO -- a conta em centavos inteiros (13/09/2026)
   ============================================================================
   O DEFEITO. descontoAtual() multiplicava o subtotal pelo percentual em PONTO
   FLUTUANTE e arredondava depois. Com subtotal 10,35 e cupom de 10%, o exato e
   1,035 -> 1,04; o binario guarda 1,0349999999999999 -> 1,03. Desconto um centavo
   MENOR, total um centavo MAIOR -- cobrado do cliente.

   NAO era incoerencia entre tela e cobranca: tela, Pix e PayPal mostravam e
   cobravam o MESMO numero. O numero e que estava alto. Por isso nenhuma suite
   anterior o pegou -- todas comparam as pontas entre si, e as pontas concordavam.

   O que o pega e comparar com uma conta EXATA, escrita aqui em inteiros. E por
   isso que este arquivo existe separado: ele nao pergunta "as pontas batem?", e
   sim "o numero esta certo?".

   O CRITERIO da varredura: subtotais de R$ 0,01 a R$ 8.000,00 (centavo a centavo)
   x percentuais de 1 a 99. Nao e sorteio -- e a familia inteira em que o meio
   centavo pode aparecer, e o mesmo criterio da correcao de ago/2026.

   Uso:  node scripts/verificar/centavo-do-desconto.mjs
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chk, resumo } from './pagina.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* A CONTA QUE ESTA NO GERADOR, extraida do proprio arquivo e avaliada -- nao
   transcrita aqui. Transcrever criaria uma segunda implementacao, e o teste
   passaria a medir a copia em vez do original. Mesmo caminho de fcPixApi. */
const idx = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const m = idx.match(/FC_CARRINHO_SRC\.descontoAtual=\n([\s\S]*?);\n/);
chk('achei a fonte de descontoAtual no index.html', !!m);
const fonteDesconto = m ? eval(m[1]) : '';
chk('a fonte declara a funcao', fonteDesconto.indexOf('function descontoAtual(') === 0,
    fonteDesconto.slice(0, 40));

/* O ambiente minimo que a funcao espera: subtotal(), somaProdutos() e cupomAtivo.
   COMPILADO UMA VEZ, e nao por caso. A primeira versao deste arquivo chamava new Function()
   dentro do laco -- 79 milhoes de compilacoes -- e levava mais de dez minutos sem medir nada de
   diferente. O custo era todo do compilador, nao da conta. Aqui o texto do gerador vira uma
   fabrica so, que recebe subtotal, percentual e tipo por parametro. */
const fabricar = new Function('sub', 'pct', 'tipo',
  'var cupomAtivo={tipo:tipo,valor:pct};\n' +
  'function subtotal(){return sub;}\n' +
  'function somaProdutos(){return sub;}\n' +
  fonteDesconto + '\nreturn descontoAtual();');

/* A CONTA EXATA, em centavos inteiros. E a segunda opiniao -- e ela nao le nada
   do projeto, de proposito. */
function exato(sub, pct){
  const c = Math.round(sub * 100);
  return Math.round(c * pct / 100) / 100;
}

for(const tipo of ['pct_total', 'pct_produto']){
  let n = 0, div = 0, primeiro = null;
  for(let c = 1; c <= 800000; c++){
    const sub = c / 100;
    for(let p = 1; p <= 99; p++){
      n++;
      const a = fabricar(sub, p, tipo), b = exato(sub, p);
      if(a !== b){ div++; if(!primeiro) primeiro = {sub, p, gerador: a, exato: b}; }
    }
  }
  chk(tipo + ': nenhuma divergencia da conta exata em ' + n.toLocaleString('pt-BR') + ' combinacoes',
      div === 0, div + ' divergencias, a primeira: ' + JSON.stringify(primeiro));
}

/* A PROVA DO CONTRARIO. Sem ela, os dois "ok" acima poderiam vir de uma varredura
   que nao exercita nada -- um erro de ambiente (cupomAtivo nulo, subtotal zero)
   faria tudo devolver 0 e a comparacao fecharia por vacuidade.
   Estes casos foram medidos na forma ANTIGA da conta e divergiam la. */
for(const caso of [{sub:10.35,p:10,esp:1.04},{sub:16.30,p:15,esp:2.45},{sub:16.65,p:30,esp:5.00}]){
  chk('caso que divergia antes: ' + caso.sub.toFixed(2) + ' com ' + caso.p + '% da ' + caso.esp.toFixed(2),
      fabricar(caso.sub, caso.p, 'pct_total') === caso.esp,
      'devolveu ' + fabricar(caso.sub, caso.p, 'pct_total'));
}

/* O cupom de VALOR FIXO nao passa pelo ramo mudado -- e a prova de que o
   Math.round final continua fazendo falta a alguem. */
chk('cupom de valor fixo continua intacto', fabricar(50, 12.34, 'valor') === 12.34,
    String(fabricar(50, 12.34, 'valor')));
chk('desconto maior que o subtotal e preso no subtotal', fabricar(10, 999, 'valor') === 10,
    String(fabricar(10, 999, 'valor')));

/* O CODIGO DE SAIDA E O RESULTADO, e nao um zero por descuido (16/09/2026). Nove suites
   chamavam resumo() e saiam com 0 aconteca o que acontecesse -- e chave-pix-limpeza
   estava FALHANDO e anunciando sucesso. Qualquer script que rode a bateria e olhe o
   codigo de saida a via verde. E pior que vermelho permanente: vermelho que ninguem
   olha ainda esta la; verde falso apaga o defeito. */
process.exit(resumo());
