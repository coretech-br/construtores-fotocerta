/* ============================================================================
   A QUANTIDADE DO OPCIONAL NO QUE VAI PARA O PAYPAL -- COM O BLOCO RODANDO
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. A regressao (geradores.mjs/regressao.sh) compara
   TEXTO gerado: ela prova que a linha mudou, nunca que o texto que chega ao
   PayPal ficou certo. E era exatamente ai que o defeito morava -- o preco da
   pagina de obrigado JA multiplicava pela quantidade (subtotal: op.preco *
   qtdOp(j)), mas nomesSelecionados() empilhava so op.nome. Tres albuns de R$ 50
   cobravam R$ 150 e chegavam ao painel do PayPal escritos "Album 20x30", sem o
   "x3": o dono lia o recibo depois e o valor nao fechava com o preco unitario.
   O Checkout e a Mini loja ja escreviam a quantidade; so esta aba nao.

   O QUE ELE MEDE, com o bloco EXECUTANDO numa pagina que imita o Prosite:
     1. opcional que VENDE POR QUANTIDADE, levado em 3 -- o name/description da
        ordem traz " x3" e o valor bate com preco unitario x 3;
     2. opcional SEM quantidade -- nada mudou: nome limpo, sem sufixo;
     3. os dois juntos -- so o de quantidade ganha sufixo;
     4. o CORTE em 127 caracteres, com nomes longos: o PayPal recusa item com
        name maior que isso, e o sufixo novo aproxima do teto. Confere que o
        corte continua acontecendo e que o name nunca sai vazio.

   COMO SE LE O QUE IRIA AO PAYPAL, sem PayPal. O molde bloqueia a rede externa,
   entao o SDK nunca carrega e window.paypal nunca existe. A pagina de teste
   intercepta o document.head.appendChild do proprio bloco -- o MESMO caminho
   que a sonda da previa da ferramenta ja usa (fcPvSondaPP) --, instala um
   window.paypal falso que guarda a configuracao dos Buttons e dispara o onload.
   Dai o createOrder do proprio bloco e chamado com um actions.order.create que
   so DEVOLVE o pedido, em vez de mandar para fora. O que se le e o pedido que o
   bloco montou, nao uma imitacao dele.

   Roda com:  node scripts/verificar/pac-quantidade.mjs
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { set, radio, clicar } from './lib.mjs';

const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};

/* O PACOTE, e os dois opcionais que exercitam os DOIS lados da marcacao 'vende por
   quantidade' no mesmo bloco: um com, um sem. Precos escolhidos para a conta ser lida de
   cabeca -- 400 + 50x3 + 30 = 580, e cada parcela distinguivel na outra. */
const PACOTE = {cod:'TESTE', nome:'Ensaio teste', dur:'2 horas', preco:'400', inclui:'20 fotos'};
const OP_QTD = {nome:'Album 20x30', preco:'50'};
const OP_FIXO = {nome:'Pen drive', preco:'30'};

/* Nomes longos de proposito: 60 + 60 caracteres mais o sufixo e o " (cod: ...)" passam
   dos 127 que o PayPal aceita no name do item. */
const LONGO_PAC = 'Ensaio completo de familia com album grande e caixa fina';
const LONGO_OP  = 'Album impresso extra grande com capa dura e folha de ouro';

async function cadastrarPacote(pg, pac, ops){
  await set(pg,'a-pcod',pac.cod); await set(pg,'a-pnome',pac.nome); await set(pg,'a-pdur',pac.dur);
  await set(pg,'a-ppreco',pac.preco); await set(pg,'a-pinclui',pac.inclui);
  await set(pg,'a-ppath','fotocerta/'+pac.cod.toLowerCase());
  for(const op of ops){
    await set(pg,'a-op-nome',op.nome); await set(pg,'a-op-preco',op.preco);
    await set(pg,'a-op-qtd', !!op.qtd);
    await clicar(pg,'a-op-add');
  }
  await clicar(pg,'a-pac-salvar');
}

const { valores, alertas, erros } = await gerarNaFerramenta(async pg => {
  for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
  await clicar(pg,'aba-pac');
  await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
  await set(pg,'a-prefixo','FC'); await set(pg,'a-parcelas','6');
  /* Desconto do Pix em ZERO: o valor da ordem do PayPal e total(), que nao conhece o
     desconto do Pix -- mas o preco NA TELA conhece, e uma conta a mais so atrapalharia a
     leitura de quem for depurar este teste. */
  await set(pg,'a-descpix','0');
  await radio(pg,'a-metodo','ambos');
  await cadastrarPacote(pg, PACOTE, [{...OP_QTD, qtd:true}, OP_FIXO]);
  await cadastrarPacote(pg, {cod:'LONGO', nome:LONGO_PAC, dur:'3 horas', preco:'900', inclui:'40 fotos'},
    [{nome:LONGO_OP, preco:'250', qtd:true}]);
  await clicar(pg,'a-gerar');
}, ['a-out3']);

chk('a ferramenta gerou a saida sem alerta', alertas.length===0, alertas.join(' | '));
chk('a ferramenta gerou a saida sem erro de console', erros.length===0, erros.join(' | '));
chk('a-out3 nao esta vazia', (valores['a-out3']||'').length>1000);

/* O bloco carrega o desenhador de QR (cdnjs) e o SDK do cartao (paypal.com); o molde
   BLOQUEIA tudo que nao seja o proprio servidor, de proposito, e o navegador registra isso
   como erro de console. Sao os unicos aceitos -- qualquer outro e defeito do bloco. */
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|ERR_FAILED|Failed to load resource/;
const errosReais = e => e.filter(x => !EXTERNO.test(x));

/* A INTERCEPCAO. Vai no <head>, antes do bloco, porque o bloco pendura o SDK ja no
   carregamento -- instalar isto depois chegaria tarde. Mesmo caminho da sonda da previa
   (fcPvSondaPP no index.html): trocar document.head.appendChild e reconhecer o script do
   PayPal pelo src. */
const SONDA = '<scr'+'ipt>(function(){\n'
  + 'var ins=document.head.appendChild;\n'
  + 'document.head.appendChild=function(n){\n'
  + '  if(n&&n.tagName==="SCRIPT"&&/paypal\\.com/.test(String(n.src||""))){\n'
  + '    window.paypal={Buttons:function(bt){window.__pp=bt;return {render:function(){}};}};\n'
  + '    setTimeout(function(){if(n.onload)n.onload();},0);\n'
  + '    return n;\n'
  + '  }\n'
  + '  return ins.call(document.head,n);\n'
  + '};\n'
  + '})();</scr'+'ipt>';

/* O PEDIDO QUE O BLOCO MONTOU. createOrder e do bloco; o actions.order.create so devolve o
   objeto em vez de mandar para fora -- e por isso o que se le aqui e o pedido de verdade. */
const pedido = pg => pg.evaluate(() => {
  const p = window.__pp.createOrder(null, {order:{create:o => o}});
  const u = p.purchase_units[0];
  return {name:u.items[0].name, descricao:u.description, valor:u.amount.value, sku:u.items[0].sku};
});

const naTela = pg => pg.$eval('.fca-ob-preco-valor', el => el.textContent.trim());

/* Marca o opcional pelo LABEL, e nao pelo input: o marcador de selecao e DESENHADO
   (Manual do Prosite) e o input nativo por baixo pode nem estar no caminho do dedo. */
async function marcar(pg, i){
  await pg.locator('.fca-ob-op').nth(i).locator('label').click();
}
/* Sobe a quantidade do opcional i ate n, clicando no "+" do proprio seletor do bloco --
   nunca escrevendo em qtdsOp por dentro. O seletor nasce em 1. */
async function subirAte(pg, i, n){
  const mais = pg.locator('.fca-ob-op').nth(i).locator('.fca-ob-qtd-b').nth(1);
  for(let k=1;k<n;k++) await mais.click();
}

const CASOS = [
  {rotulo:'opcional COM quantidade, levado em 3',
   busca:'?pac=TESTE&data=2027-01-10&hora=10:00',
   acao: async pg => { await marcar(pg,0); await subirAte(pg,0,3); },
   nome:'Ensaio teste + Album 20x30 x3', valor:'550.00'},

  {rotulo:'opcional SEM quantidade -- nada mudou',
   busca:'?pac=TESTE&data=2027-01-10&hora=10:00',
   acao: async pg => { await marcar(pg,1); },
   nome:'Ensaio teste + Pen drive', valor:'430.00'},

  {rotulo:'os dois juntos -- so o de quantidade ganha sufixo',
   busca:'?pac=TESTE&data=2027-01-10&hora=10:00',
   acao: async pg => { await marcar(pg,0); await subirAte(pg,0,3); await marcar(pg,1); },
   nome:'Ensaio teste + Album 20x30 x3 + Pen drive', valor:'580.00'},

  {rotulo:'nenhum opcional -- so o pacote (que nao tem quantidade nenhuma)',
   busca:'?pac=TESTE&data=2027-01-10&hora=10:00',
   acao: async () => {},
   nome:'Ensaio teste', valor:'400.00'}
];

let porta = 8801;
for(const caso of CASOS){
  const r = await comBlocoNaPagina({
    bloco: valores['a-out3'], cabeca: SONDA, porta: porta++, busca: caso.busca,
    medir: async pg => {
      await pg.waitForFunction(() => !!window.__pp);
      await caso.acao(pg);
      return {ped: await pedido(pg), tela: await naTela(pg)};
    }
  });
  chk(caso.rotulo+': bloco rodou sem erro proprio', errosReais(r.erros).length===0, errosReais(r.erros).join(' | '));
  const esperado = caso.nome+' (cod: '+r.ped.sku+')';
  chk(caso.rotulo+': name da ordem', r.ped.name===esperado, 'saiu: '+r.ped.name+' | esperado: '+esperado);
  chk(caso.rotulo+': description = name', r.ped.descricao===r.ped.name, r.ped.descricao);
  chk(caso.rotulo+': valor da ordem', r.ped.valor===caso.valor, 'saiu: '+r.ped.valor+' | esperado: '+caso.valor);
  chk(caso.rotulo+': valor na tela bate com o da ordem',
    r.tela.replace(/[^0-9]/g,'')===caso.valor.replace(/[^0-9]/g,''), 'tela: '+r.tela);
  console.log('    -> PayPal receberia: '+JSON.stringify(r.ped.name)+'  ('+r.ped.valor+')');
}

/* O CORTE EM 127. O sufixo novo acrescenta bytes a um campo que ja tinha teto, entao o
   corte precisa continuar acontecendo -- e o name nunca pode sair vazio (a fonte unica tem
   a guarda 'if(!nm)nm=CODIGO_PEDIDO' justamente porque o PayPal recusa item sem name). */
{
  const r = await comBlocoNaPagina({
    bloco: valores['a-out3'], cabeca: SONDA, porta: porta++,
    busca: '?pac=LONGO&data=2027-01-10&hora=10:00',
    medir: async pg => {
      await pg.waitForFunction(() => !!window.__pp);
      await marcar(pg,0); await subirAte(pg,0,3);
      return {ped: await pedido(pg), tela: await naTela(pg)};
    }
  });
  const inteiro = LONGO_PAC+' + '+LONGO_OP+' x3 (cod: '+r.ped.sku+')';
  chk('corte 127: bloco rodou sem erro proprio', errosReais(r.erros).length===0, errosReais(r.erros).join(' | '));
  chk('corte 127: o nome inteiro passaria do teto', inteiro.length>127, 'inteiro tem '+inteiro.length);
  chk('corte 127: o name saiu com 127 caracteres', r.ped.name.length===127, 'saiu com '+r.ped.name.length);
  chk('corte 127: o name e o comeco exato do nome inteiro', r.ped.name===inteiro.slice(0,127), r.ped.name);
  chk('corte 127: o name nao saiu vazio', r.ped.name.length>0);
  chk('corte 127: valor da ordem (900 + 250x3)', r.ped.valor==='1650.00', 'saiu: '+r.ped.valor);
  console.log('    -> PayPal receberia: '+JSON.stringify(r.ped.name)+'  ('+r.ped.valor+')');
}

process.exit(resumo());
