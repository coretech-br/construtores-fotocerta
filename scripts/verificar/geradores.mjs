/* ============================================================================
   A FOTOGRAFIA DOS GERADORES
   ============================================================================
   Exercita as dez abas na ARVORE indicada e grava, num JSON, o hash de cada saida
   e o link completo de cada cobranca. Duas fotografias comparadas dizem, sem opiniao,
   se uma rodada mexeu no que ela nao devia.

   Uso:  node scripts/verificar/geradores.mjs <arvore> <porta> <saida.json>

   O CENARIO (o que se preenche em cada aba, e os 28 textos da passagem configurada)
   mora em cenario.mjs, que este arquivo e o textos-escape.mjs compartilham.

   ---------------------------------------------------------------------------
   DUAS PASSAGENS: "fabrica" e "configurada". POR QUE A SEGUNDA EXISTE.
   ---------------------------------------------------------------------------
   Ate 03/09/2026 este arquivo tinha UMA passagem, e ela nao escrevia em NENHUM campo
   de texto (nenhum '*-txt-*'). Naquele dia a rodada dos textos configuraveis criou 162
   campos desses -- todo texto que o cliente final le nas dez abas passou a ser
   editavel --, e a fotografia continuou provando apenas o CAMINHO DE FABRICA: com os
   textos no padrao, ela dizia que a saida nao mudou, e nao dizia nada sobre o que
   acontece quando o dono escreve o texto dele.

   O buraco nao e teorico. Medido em 03/09/2026, com esta segunda passagem ja escrita:
   os quatro avisos de carrinho da Mini loja tinham ganhado o marcador {n} no texto de
   fabrica, mas o consumidor no bloco continuava CONCATENANDO o numero ("2 "+texto) em
   vez de substituir -- o cliente leria "2 {n} itens do seu carrinho sairam...", com o
   marcador cru na tela. A passagem de fabrica via a declaracao da variavel e passava;
   so a configurada alcanca o uso.

   E a mesma armadilha ja registrada quatro vezes neste projeto -- TESTE QUE NAO ALCANCA
   O ESTADO NAO PROVA NADA SOBRE AQUELE ESTADO (o cupom da Mini loja, a quantidade dos
   opcionais, o ramo "somente cartao", e agora os textos).

   O QUE CADA PASSAGEM PROVA:
     - fabrica     -> o INVARIANTE: mexer numa aba nao muda um byte do que as outras
                      geram com a configuracao padrao. E a passagem historica, e ela
                      NAO MUDA -- acrescentar a segunda nao pode alterar a primeira.
     - configurada -> que o texto do dono CHEGA ao bloco, com o escape certo e com os
                      marcadores substituidos. Cobre o que a de fabrica nao alcanca:
                      o subtitulo da vitrine (que so e emitido quando preenchido), o
                      escape de aspas/barra/'</script', e cada tipo de marcador.

   A PROVA DE QUE A SEGUNDA PASSAGEM ALCANCA O QUE PROMETE. Cada texto configurado leva
   um selo unico ('ZxNN'). Depois de gerar, o script procura cada selo nas saidas e grava
   em 'configSemVestigio' os que nao apareceram em nenhuma. Selo que some e campo mal
   ligado, ou ramo que o cenario nao exercita -- e nos dois casos a passagem seria tao
   cega quanto a antiga, so que mais cara. Ramo nao exercitado e legitimo, mas SO quando
   declarado na quarta coluna da tabela em cenario.mjs, com o motivo. Lista vazia e a
   condicao de aprovacao; 'regressao.sh' falha se ela nao estiver.

   O QUE ESTE ARQUIVO CONTINUA NAO FAZENDO: executar o bloco. Ele compara TEXTO. Quem pega
   os blocos com os textos de escape e os roda numa pagina de verdade e o textos-escape.mjs,
   que usa o mesmo cenario e o molde de pagina.mjs.
   ============================================================================ */
import { navegador, servir, sha, abrir, radio, clicar, ler, alertas } from './lib.mjs';
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
/* p-out2 (o LINK da cobranca aberta nesta mesma passagem) entra na lista desde 03/09/2026,
   junto da passagem configurada: e o jeito barato de cobrar que TEXTO NAO ENTRA NO LINK. Se
   um dia um campo de texto vazar para o payload, o link muda entre as duas passagens e a
   comparacao acusa -- sem isso, a unica cobertura do link seriam as nove cobrancas abaixo,
   todas com os textos de fabrica. */
const SAIDAS = ['s-out','l-out','t-out1','t-out2','t-out3','t-out4','t-out5','u-out','b-out1','b-out2','b-out3','b-out4','b-out5','b-out6','b-out7','c-out1','p-out1','p-out2','m-out','e-out1','e-out2','a-out1','a-out2','a-out3'];

/* O CENARIO -- o que se preenche na ferramenta antes de gerar -- mora em cenario.mjs desde
   03/09/2026, porque o teste que EXECUTA os blocos com os textos de escape
   (textos-escape.mjs) precisa exatamente do mesmo. Cenario escrito duas vezes e a mesma
   armadilha do codigo escrito duas vezes: as copias concordam hoje e divergem amanha. */
import { TEXTOS, preparar, conteudo, configurarTextos, cobranca, gerarTodas } from './cenario.mjs';

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
const r = {arvore:ARV, geradores:{}, configurado:{}, cobrancas:{}, erros:[]};

/* UMA PASSAGEM: o cenario inteiro numa aba do navegador com armazenamento limpo, terminando
   com o texto de cada saida. 'comTextos' liga a segunda passagem (ver o cabecalho). O corpo
   e o MESMO nas duas de proposito: se a passagem configurada seguisse outro roteiro, a
   diferenca entre as duas fotografias deixaria de ser "o texto do dono" e passaria a ser
   "o texto do dono mais tudo que os dois roteiros nao tem em comum". */
async function passagem(comTextos, pasta){
  const pg = await abrir(br, base);
  await preparar(pg); await conteudo(pg); await cobranca(pg,{});
  const ausentes = comTextos ? await configurarTextos(pg) : [];
  const pulou = await gerarTodas(pg);
  /* t-out2 e t-out3 so existem no modo "pagina intermediaria embutida": sem esta segunda
     passagem, duas das doze saidas ficariam vazias e a regressao nao as cobriria. */
  const tDireta = await ler(pg,'t-out1');
  await clicar(pg,'aba-tidy'); await radio(pg,'t-arq','embutida'); await clicar(pg,'t-gerar');
  await pg.waitForTimeout(60);
  const saidas = {};
  for(const id of SAIDAS) saidas[id] = (await ler(pg,id)) ?? '';
  saidas['t-out1-direta'] = tDireta ?? '';
  /* FC_DUMP=<pasta> grava o TEXTO de cada saida, e nao so o hash. O hash responde "mudou?";
     o texto responde "mudou o que?", que e a pergunta que toda rodada com divergencia
     intencional precisa responder na spec. Sem isto, enumerar o diff exigia reconstruir a
     captura a mao dos dois lados -- foi assim ate 01/09/2026. A passagem configurada grava
     na subpasta 'config/', para as duas poderem ser lidas lado a lado. */
  if(process.env.FC_DUMP){
    const dir = process.env.FC_DUMP + (pasta ? '/'+pasta : '');
    fs.mkdirSync(dir,{recursive:true});
    for(const [id,t] of Object.entries(saidas)) fs.writeFileSync(dir+'/'+id+'.txt', t);
  }
  const res = {saidas, pulou, ausentes,
    bytes: Object.entries(saidas).map(([id,t])=>id+':'+t.length).join(' '),
    alertas: await alertas(pg), erros: pg.erros.slice()};
  await pg.close();
  return res;
}

const fab = await passagem(false, '');
for(const [id,t] of Object.entries(fab.saidas)) r.geradores[id] = sha(t);
r.bytes = fab.bytes; r.alertas = fab.alertas; r.erros.push(...fab.erros);
if(fab.pulou.length) r.pulou = fab.pulou;

const cfg = await passagem(true, 'config');
for(const [id,t] of Object.entries(cfg.saidas)) r.configurado[id] = sha(t);
r.bytesConfig = cfg.bytes;
r.alertasConfig = cfg.alertas;
r.erros.push(...cfg.erros);
r.configTextosAusentes = cfg.ausentes;
/* A PROVA DE QUE A PASSAGEM CONFIGURADA ALCANCA O QUE PROMETE. Cada selo tem de aparecer em
   pelo menos uma saida. Selo que nao aparece em nenhuma e uma de duas coisas -- campo mal
   ligado (defeito) ou campo que so age num ramo que este cenario nao exercita (e ai o cenario
   e que esta incompleto). Nas duas, a passagem seria tao cega quanto a antiga. Guarda-se
   tambem ONDE cada selo caiu: e o que permite dizer, na spec, que texto chega a que saida. */
r.configOnde = {}; r.configSemVestigio = []; r.configRamoDeclaradoQueApareceu = [];
if(!cfg.ausentes.length){
  for(const [id,valor,,ramo] of TEXTOS){
    const selo = (valor.match(/Zx\d\d/)||[''])[0];
    const onde = Object.keys(cfg.saidas).filter(k => cfg.saidas[k].indexOf(selo) >= 0);
    r.configOnde[id] = onde.join(' ') || (ramo ? '(ramo nao exercitado)' : '');
    /* Um campo pode estar preso a um ramo que este cenario nao percorre. Isso e legitimo, mas
       so quando esta DECLARADO na quarta coluna da tabela, com o motivo -- do contrario o
       silencio volta a ser a resposta padrao, que e o defeito que esta passagem existe para
       acabar. A checagem vale nos DOIS sentidos: ramo declarado que passa a aparecer significa
       que a declaracao envelheceu (o cenario cresceu, ou o gerador mudou), e tambem e avisado. */
    if(!onde.length && !ramo) r.configSemVestigio.push(id+' ('+selo+')');
    if(onde.length && ramo)   r.configRamoDeclaradoQueApareceu.push(id+' ('+selo+')');
  }
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
console.log('fotografia gravada em '+SAIDA+'  ('+vazias+' saidas x 2 passagens, '+Object.keys(r.cobrancas).length+' cobrancas)');
console.log('  bytes fabrica:     '+r.bytes);
console.log('  bytes configurada: '+r.bytesConfig);
if(r.configTextosAusentes.length){
  console.log('  passagem configurada NAO comparavel nesta arvore: '+r.configTextosAusentes.length+
              ' dos '+TEXTOS.length+' campos de texto nao existem aqui (ex.: '+r.configTextosAusentes[0]+')');
}else{
  const decl = TEXTOS.filter(t=>t[3]).length;
  if(r.configSemVestigio.length)
    console.log('  ATENCAO -- texto configurado que NAO apareceu em saida nenhuma: '+r.configSemVestigio.join(', '));
  if(r.configRamoDeclaradoQueApareceu.length)
    console.log('  ATENCAO -- ramo declarado como nao exercitado que APARECEU (declaracao envelheceu): '+
                r.configRamoDeclaradoQueApareceu.join(', '));
  if(!r.configSemVestigio.length && !r.configRamoDeclaradoQueApareceu.length)
    console.log('  os '+(TEXTOS.length-decl)+' textos configurados apareceram nas saidas ('+decl+
                ' presos a ramo declarado, fora do cenario).');
}
if(r.alertas.length)      console.log('  ATENCAO -- alertas na passagem de fabrica: '+JSON.stringify(r.alertas));
if(r.alertasConfig.length)console.log('  ATENCAO -- alertas na passagem configurada: '+JSON.stringify(r.alertasConfig));
if(r.erros.length)        console.log('  ATENCAO -- erros de console: '+r.erros.slice(0,5).join(' | '));
