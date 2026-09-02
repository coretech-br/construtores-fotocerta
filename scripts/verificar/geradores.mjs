/* ============================================================================
   A FOTOGRAFIA DOS GERADORES
   ============================================================================
   Exercita as dez abas na ARVORE indicada e grava, num JSON, o hash de cada saida
   e o link completo de cada cobranca. Duas fotografias comparadas dizem, sem opiniao,
   se uma rodada mexeu no que ela nao devia.

   Uso:  node scripts/verificar/geradores.mjs <arvore> <porta> <saida.json>

   AS ABAS SAO PREENCHIDAS COM O MINIMO PARA NENHUMA RECUSAR. Sem isso metade das
   saidas sai VAZIA e a comparacao passa com folga sobre nada -- aconteceu, e por isso
   esta escrito aqui. Os campos que moldam o bloco da aba de cobranca sao fixados
   explicitamente pelo mesmo motivo: a aba restaura o que estava guardado, e o que
   sobrou de uma passagem entra na seguinte.
   ============================================================================ */
import { navegador, servir, sha, abrir, set, radio, clicar, ler, alertas } from './lib.mjs';
import fs from 'node:fs';

const ARV = process.argv[2], PORTA = Number(process.argv[3]), SAIDA = process.argv[4];
if(!ARV || !PORTA || !SAIDA){
  console.error('uso: node scripts/verificar/geradores.mjs <arvore> <porta> <saida.json>');
  process.exit(2);
}

/* b-out3..b-out7 (o CSS de cada OUTRO componente, quando ha presets consolidados) entram na
   lista mesmo sem o cenario exercitar a consolidacao: aqui os cinco PRECISAM sair vazios, e a
   fotografia passa a cobrar isso. Saida que so aparece as vezes e onde o lixo de uma passagem
   anterior se esconde. */
const SAIDAS = ['s-out','l-out','t-out1','t-out2','t-out3','t-out4','t-out5','u-out','b-out1','b-out2','b-out3','b-out4','b-out5','b-out6','b-out7','c-out1','p-out1','m-out','e-out1','e-out2','a-out1','a-out2','a-out3'];
const ABAS = [['aba-slide','s-gerar'],['aba-leads','l-gerar'],['aba-tidy','t-gerar'],
  ['aba-uni','u-gerar'],['aba-bor','b-gerar'],['aba-cnt','c-gerar'],['aba-cob','p-gerar'],['aba-loja','m-gerar'],['aba-efe','e-gerar'],['aba-pac','a-gerar']];

/* Identidade de teste. NAO sao dados reais: a chave e um e-mail de exemplo e o Client ID
   e inventado -- este arquivo e versionado num repositorio publico. */
const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};
const BLOCO_FIXO = {
  'p-larg':'420','p-qr':'180','p-c1':'#075E54','p-c2':'#ffffff','p-c3':'#333333',
  'p-corujaalt':'30','p-corujacorpo':'#ffffff','p-corujadet':'#075E54',
  't1':'Pagamento — Foto Certa','t2':'Valor a pagar','t3':'Copiar código Pix',
  't4':'Já paguei','t5':'Não há cobrança aberta neste endereço. Fale com a gente.',
  't6':'Este link de cobrança não é válido. Peça um novo.',
  't7':'Abra o aplicativo do seu banco, escolha Pix › Pagar › Copia e Cola e cole o código.',
  't8':'Válido até {data}.','t9':'Esta cobrança venceu em {data}. Fale com a gente para receber um link novo.'
};
async function preparar(pg){
  for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
  for(const [k,v] of Object.entries(BLOCO_FIXO)) await set(pg, k.startsWith('p-')?k:('p-'+k), v);
  await radio(pg,'p-coruja','esq'); await radio(pg,'p-usapp','sim');
  await radio(pg,'p-ppcor','gold'); await radio(pg,'p-zap','sim');
}
async function conteudo(pg){
  await clicar(pg,'aba-slide');
  for(const [u,l] of [['https://storage.alboom.ninja/exemplo-1.jpg','Ensaio de Natal — familia Silva'],
                      ['https://storage.alboom.ninja/exemplo-2.jpg','Estudio tematico'],
                      ['https://storage.alboom.ninja/exemplo-3.jpg','']]){
    await set(pg,'s-url',u); await set(pg,'s-leg',l); await clicar(pg,'s-add');
  }
  await clicar(pg,'aba-leads'); await set(pg,'l-cod','NATAL26');
  await clicar(pg,'aba-tidy');  await set(pg,'t-path','fotocerta/natal-2026');
  /* A PAGINA DE OBRIGADO ENTRA NO CENARIO, e nao so na lista de saidas. As saidas 4 e 5
     existiam desde 23/08/2026 e nunca foram fotografadas; acrescenta-las sem LIGAR o recurso
     deixaria as duas vazias nas duas arvores, e a comparacao passaria com folga sobre nada --
     a mesma armadilha que o cabecalho deste arquivo ja registra para as outras saidas. */
  await radio(pg,'t-ob-usar','sim');
  await set(pg,'t-ob-url','https://www.fotocerta.com.br/obrigado');
  for(const v of ['nome','tipo','data','hora','quando']){
    await pg.evaluate(v=>{const e=document.getElementById('t-ob-'+v);
      if(e){e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));}},v);
  }
  /* O FORMATO fica no padrao ('como o TidyCal mandar'), de proposito: os valores novos nao
     existem na arvore de referencia, e pedi-los aqui derrubaria a captura inteira. Os quatro
     formatos sao cobertos pelo roteiro proprio da rodada, nao pela fotografia. */
  await clicar(pg,'aba-uni');
  await set(pg,'u-pnome','Ensaio de Natal'); await set(pg,'u-pdesc','30 minutos, 10 fotos tratadas');
  await set(pg,'u-ppreco','420'); await clicar(pg,'u-prod-salvar');
  await set(pg,'u-pnome','Foto extra'); await set(pg,'u-ppreco','35'); await clicar(pg,'u-prod-salvar');
  await cupons(pg,'u');
  await clicar(pg,'aba-cnt'); await set(pg,'c-cod','NATAL26');
  await clicar(pg,'aba-loja');
  await set(pg,'m-pnome','Album 30x30'); await set(pg,'m-pdesc','Capa dura, 20 paginas');
  await set(pg,'m-ppreco','890'); await set(pg,'m-pcat','Albuns');
  await set(pg,'m-pimg','https://storage.alboom.ninja/album-30x30.jpg'); await clicar(pg,'m-prod-salvar');
  await set(pg,'m-pnome','Moldura'); await set(pg,'m-ppreco','120'); await set(pg,'m-pcat','Molduras');
  await set(pg,'m-pimg','https://storage.alboom.ninja/moldura.jpg'); await clicar(pg,'m-prod-salvar');
  await cupons(pg,'m');
  /* AGENDAMENTO POR PACOTE. Dois pacotes de proposito, e os precos nao sao aleatorios: 420 com
     6 parcelas divide exato (70,00), 700 com 6 parcelas NAO divide (116,6667) -- e a parcela
     tem de arredondar para CIMA (116,67), nunca para baixo, senao a soma das seis fica menor
     que o preco escrito na tela (mesma licao do centavo do Pix, ago/2026). Sem os dois casos a
     fotografia nao exercitaria a direcao do arredondamento, so o caminho feliz.
     A ABA E NOVA e nao existe na referencia (main) enquanto a rodada nao mescla -- guardado
     com a MESMA checagem que o loop de ABAS ja usa mais abaixo, para a captura da referencia
     nao lancar tentando clicar num botao que ainda nao existe la. */
  if(await pg.$('#aba-pac')){
    await clicar(pg,'aba-pac');
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-prefixo','FC');
    await set(pg,'a-parcelas','6');
    for(const p of [
      ['MINI','Mini ensaio','1 hora','420','10 fotos tratadas','https://tidycal.com/fotocerta/mini'],
      ['COMPLETO','Ensaio completo','2 horas','700','30 fotos tratadas','https://tidycal.com/fotocerta/completo']
    ]){
      await set(pg,'a-pcod',p[0]); await set(pg,'a-pnome',p[1]); await set(pg,'a-pdur',p[2]);
      await set(pg,'a-ppreco',p[3]); await set(pg,'a-pinclui',p[4]); await set(pg,'a-plink',p[5]);
      await clicar(pg,'a-pac-salvar');
    }
  }
}

/* OS CUPONS ENTRAM NO CENARIO, e nao por capricho. Na Mini loja o campo de cupom so existe
   quando ha cupom cadastrado (usaCupom = cfg.cps.length > 0); sem esta chamada, TODO o
   caminho do cupom da loja ficava fora da fotografia -- e ficou, ate 01/09/2026, quando uma
   mudanca na linha do desconto passou pela regressao sem a loja ser exercitada. E a mesma
   armadilha ja registrada aqui para t-out4/t-out5: saida que so aparece as vezes e onde o
   defeito se esconde. Dois cupons de proposito: um COM prazo e um SEM, porque a linha do
   desconto se comporta diferente nos dois casos. */
async function cupons(pg, pref){
  for(const [cod, valor, val] of [['NATAL10','10','2027-12-25'],['SEMPRE','5','']]){
    await set(pg, pref+'-cp-cod', cod);
    await radio(pg, pref+'-cp-tipo', 'pct_total');
    await set(pg, pref+'-cp-valor', valor);
    await set(pg, pref+'-cp-val', val);
    await clicar(pg, pref+'-cp-add');
  }
}
async function cobranca(pg,c){
  await set(pg,'p-url', c.url ?? 'https://fotocerta.com.br/pagar');
  await set(pg,'p-desc', c.desc ?? 'Ensaio de familia — pacote completo');
  await set(pg,'p-valor', c.valor ?? '1200,50');
  await set(pg,'p-txid', c.txid ?? ''); await set(pg,'p-validade', c.validade ?? '');
  await set(pg,'p-descpix', c.descpix ?? '0');
  await radio(pg,'p-ppmodo', c.ppmodo ?? 'sdk'); await set(pg,'p-pplink', c.pplink ?? '');
}
/* As cobrancas cobrem o que muda o LINK: com e sem desconto, com e sem prazo, os tres
   modos de PayPal, acentos e simbolos, e os extremos do valor. */
const COBRANCAS = [
  {n:'A1 sem desconto',  c:{descpix:''}},
  {n:'A3 identificador', c:{descpix:'0',txid:'ENSAIO2026'}},
  {n:'A4 validade',      c:{descpix:'0',validade:'2099-12-30'}},
  {n:'A5 PayPal link',   c:{descpix:'0',ppmodo:'link',pplink:'https://www.paypal.com/ncp/payment/ABC12345'}},
  {n:'A6 sem PayPal',    c:{descpix:'0',ppmodo:'nao'}},
  {n:'A8 acentos',       c:{descpix:'0',desc:'Álbum 30x30 & moldura "grande" <ok> 100%',valor:'999999,99'}},
  {n:'D1 desconto 10%',  c:{descpix:'10',valor:'450,00'}},
  {n:'D3 desconto 12,5%',c:{descpix:'12.5',valor:'1234,56'}},
  {n:'D8 tudo junto',    c:{descpix:'10',valor:'450,00',txid:'ENSAIO2026',validade:'2099-12-30'}}
];

const srv = await servir(ARV, PORTA);
const br = await navegador();
const base = 'http://127.0.0.1:'+PORTA;
const r = {arvore:ARV, geradores:{}, cobrancas:{}, erros:[]};
{
  const pg = await abrir(br, base);
  await preparar(pg); await conteudo(pg); await cobranca(pg,{});
  /* ABA QUE NAO EXISTE NA ARVORE E PULADA, e nao derruba a captura. Sem isto, acrescentar
     uma aba nova quebrava a regressao INTEIRA -- a referencia (main) nao tem o botao, o
     clique lanca, e nenhuma das outras onze saidas chegava a ser comparada. A saida da aba
     ausente fica vazia daquele lado, que e exatamente o que ela e. */
  for(const [aba,bt] of ABAS){
    if(!(await pg.$('#'+aba))){ r.pulou = (r.pulou||[]).concat(aba); continue; }
    await clicar(pg,aba); await pg.waitForTimeout(60); await clicar(pg,bt);
  }
  await clicar(pg,'p-gerarlink'); await pg.waitForTimeout(200);
  /* t-out2 e t-out3 so existem no modo "pagina intermediaria embutida": sem esta segunda
     passagem, duas das doze saidas ficariam vazias e a regressao nao as cobriria. */
  const tDireta = await ler(pg,'t-out1');
  await clicar(pg,'aba-tidy'); await radio(pg,'t-arq','embutida'); await clicar(pg,'t-gerar');
  await pg.waitForTimeout(60);
  const textos = {};
  for(const id of SAIDAS) textos[id] = (await ler(pg,id)) ?? '';
  textos['t-out1-direta'] = tDireta ?? '';
  for(const [id,t] of Object.entries(textos)) r.geradores[id] = sha(t);
  /* FC_DUMP=<pasta> grava o TEXTO de cada saida, e nao so o hash. O hash responde "mudou?";
     o texto responde "mudou o que?", que e a pergunta que toda rodada com divergencia
     intencional precisa responder na spec. Sem isto, enumerar o diff exigia reconstruir a
     captura a mao dos dois lados -- foi assim ate 01/09/2026. */
  if(process.env.FC_DUMP){
    fs.mkdirSync(process.env.FC_DUMP,{recursive:true});
    for(const [id,t] of Object.entries(textos)) fs.writeFileSync(process.env.FC_DUMP+'/'+id+'.txt', t);
  }
  r.bytes = Object.entries(textos).map(([id,t])=>id+':'+t.length).join(' ');
  r.alertas = await alertas(pg);
  r.erros.push(...pg.erros);
  await pg.close();
}
for(const cen of COBRANCAS){
  const pg = await abrir(br, base);
  await preparar(pg); await clicar(pg,'aba-cob'); await cobranca(pg,cen.c);
  await clicar(pg,'p-gerar'); await clicar(pg,'p-gerarlink'); await pg.waitForTimeout(120);
  r.cobrancas[cen.n] = {bloco:sha((await ler(pg,'p-out1'))||''), link:(await ler(pg,'p-out2'))||''};
  r.erros.push(...pg.erros);
  await pg.close();
}
await br.close(); srv.close();
fs.writeFileSync(SAIDA, JSON.stringify(r,null,1));
const vazias = Object.entries(r.geradores).length;
console.log('fotografia gravada em '+SAIDA+'  ('+vazias+' saidas, '+Object.keys(r.cobrancas).length+' cobrancas)');
console.log('  bytes: '+r.bytes);
if(r.alertas.length) console.log('  ATENCAO -- alertas durante a captura: '+JSON.stringify(r.alertas));
if(r.erros.length)   console.log('  ATENCAO -- erros de console: '+r.erros.slice(0,5).join(' | '));
