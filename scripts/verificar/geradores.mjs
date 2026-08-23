/* ============================================================================
   A FOTOGRAFIA DOS GERADORES
   ============================================================================
   Exercita as oito abas na ARVORE indicada e grava, num JSON, o hash de cada saida
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

const SAIDAS = ['s-out','l-out','t-out1','t-out2','t-out3','u-out','b-out1','b-out2','c-out1','p-out1','m-out'];
const ABAS = [['aba-slide','s-gerar'],['aba-leads','l-gerar'],['aba-tidy','t-gerar'],
  ['aba-uni','u-gerar'],['aba-bor','b-gerar'],['aba-cnt','c-gerar'],['aba-cob','p-gerar'],['aba-loja','m-gerar']];

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
  await clicar(pg,'aba-uni');
  await set(pg,'u-pnome','Ensaio de Natal'); await set(pg,'u-pdesc','30 minutos, 10 fotos tratadas');
  await set(pg,'u-ppreco','420'); await clicar(pg,'u-prod-salvar');
  await set(pg,'u-pnome','Foto extra'); await set(pg,'u-ppreco','35'); await clicar(pg,'u-prod-salvar');
  await clicar(pg,'aba-cnt'); await set(pg,'c-cod','NATAL26');
  await clicar(pg,'aba-loja');
  await set(pg,'m-pnome','Album 30x30'); await set(pg,'m-pdesc','Capa dura, 20 paginas');
  await set(pg,'m-ppreco','890'); await set(pg,'m-pcat','Albuns');
  await set(pg,'m-pimg','https://storage.alboom.ninja/album-30x30.jpg'); await clicar(pg,'m-prod-salvar');
  await set(pg,'m-pnome','Moldura'); await set(pg,'m-ppreco','120'); await set(pg,'m-pcat','Molduras');
  await set(pg,'m-pimg','https://storage.alboom.ninja/moldura.jpg'); await clicar(pg,'m-prod-salvar');
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
  for(const [aba,bt] of ABAS){ await clicar(pg,aba); await pg.waitForTimeout(60); await clicar(pg,bt); }
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
