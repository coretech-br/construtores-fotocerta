/* ============================================================================
   O VALOR MINIMO DO PEDIDO PARA O CUPOM VALER -- COM OS BLOCOS RODANDO
   ============================================================================
   POR QUE ESTE ARQUIVO EXISTE. A regressao (geradores.mjs/regressao.sh) compara
   TEXTO gerado; ela nunca cola o bloco numa pagina e roda. O centro desta
   funcionalidade e COMPORTAMENTO -- o cupom cair sozinho quando o pedido desce
   abaixo do minimo (decisao D2 da spec) --, e comportamento nao aparece em
   fotografia. O molde de pagina.mjs existe justamente para isto.

   O QUE ELE MEDE, nas TRES abas que tem cupom, porque os tres carrinhos sao
   diferentes e e exatamente ai que uma implementacao copiada de uma para a
   outra falha em silencio:
     Checkout (u)  -- o cliente marca/desmarca CAIXAS de produto;
     Mini loja (m) -- o cliente tira uma LINHA da cesta;
     pac (a)       -- o cliente desmarca um OPCIONAL do pacote.

   OS CINCO CASOS (spec, "O que precisa ser provado com o bloco RODANDO"):
     1. aplicado acima do minimo               -> o desconto entra;
     2. recusado abaixo                        -> a mensagem certa, COM o valor;
     3. A QUEDA AUTOMATICA                     -> tira item, o desconto SAI;
     4. voltar a subir                         -> NAO reaplica sozinho;
     5. cupom SEM minimo                       -> comportamento de hoje, intacto.

   O TOTAL E LIDO NA TELA, nunca de uma variavel do bloco. Ler total() por
   evaluate() mediria a conta, nao o que o cliente ve -- e o defeito que esta
   funcionalidade pode ter e justamente a tela ficar com o numero velho.

   CENARIO, igual nas tres: um item de R$ 200 e outro de R$ 150 (subtotal 350),
   cupom MIN300 de 10% com minimo de R$ 300 e cupom SEMMIN de 10% sem minimo.
   350 fica ACIMA do minimo e 200 fica ABAIXO -- os dois lados da regra com um
   clique so de distancia.

   Roda com:  node scripts/verificar/cupom-minimo.mjs
   ============================================================================ */
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';
import { navegador, servir, abrir, set, radio, clicar, ler, alertas as lerAlertas } from './lib.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};

const CUPONS = [['MIN300','10','300'],['SEMMIN','10','']];
const MIN_TXT   = 'Este cupom vale a partir de R$ 300,00.';
const QUEDA_TXT = 'O cupom saiu: ele vale a partir de R$ 300,00, e o pedido ficou abaixo disso.';

async function cadastrarCupons(pg, pref){
  for(const [cod,val,min] of CUPONS){
    await set(pg, pref+'-cp-cod', cod);
    await radio(pg, pref+'-cp-tipo', 'pct_total');
    await set(pg, pref+'-cp-valor', val);
    await set(pg, pref+'-cp-min', min);
    await clicar(pg, pref+'-cp-add');
  }
}

const { valores, alertas, erros } = await gerarNaFerramenta(async pg => {
  for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);

  await clicar(pg,'aba-uni');
  await radio(pg,'u-metodo','pix');
  await set(pg,'u-pnome','Ensaio'); await set(pg,'u-ppreco','200'); await clicar(pg,'u-prod-salvar');
  await set(pg,'u-pnome','Album');  await set(pg,'u-ppreco','150'); await clicar(pg,'u-prod-salvar');
  /* Multiplo, e nao "escolhe 1": e o unico modo em que o cliente pode TIRAR um item e
     deixar o pedido abaixo do minimo, que e o caso 3. */
  await radio(pg,'u-selprod','multiplo');
  await cadastrarCupons(pg,'u');
  await clicar(pg,'u-gerar');

  await clicar(pg,'aba-loja');
  await radio(pg,'m-metodo','pix');
  await set(pg,'m-pnome','Album'); await set(pg,'m-ppreco','200'); await set(pg,'m-pcat','A');
  await set(pg,'m-pimg','https://storage.alboom.ninja/a.jpg'); await clicar(pg,'m-prod-salvar');
  await set(pg,'m-pnome','Moldura'); await set(pg,'m-ppreco','150'); await set(pg,'m-pcat','A');
  await set(pg,'m-pimg','https://storage.alboom.ninja/b.jpg'); await clicar(pg,'m-prod-salvar');
  await cadastrarCupons(pg,'m');
  await clicar(pg,'m-gerar');

  await clicar(pg,'aba-pac');
  await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
  await set(pg,'a-prefixo','FC'); await set(pg,'a-parcelas','6');
  /* Desconto do Pix em ZERO de proposito: o preco na tela desta aba e precoPix(total()),
     e com desconto o numero lido teria duas contas dentro. O minimo nao muda com isso --
     ele compara com o SUBTOTAL (decisao D1), que nao conhece desconto do Pix. */
  await set(pg,'a-descpix','0');
  await set(pg,'a-pcod','MINI'); await set(pg,'a-pnome','Mini ensaio'); await set(pg,'a-pdur','1 hora');
  await set(pg,'a-ppreco','200'); await set(pg,'a-pinclui','10 fotos');
  await set(pg,'a-ppath','fotocerta/mini');
  await set(pg,'a-op-nome','Album extra'); await set(pg,'a-op-preco','150'); await clicar(pg,'a-op-add');
  await clicar(pg,'a-pac-salvar');
  await cadastrarCupons(pg,'a');
  await clicar(pg,'a-gerar');
}, ['u-out','m-out','a-out3']);

chk('a ferramenta gerou as tres saidas sem alerta', alertas.length===0, alertas.join(' | '));
chk('a ferramenta gerou as tres saidas sem erro de console', erros.length===0, erros.join(' | '));
for(const id of ['u-out','m-out','a-out3']) chk('saida '+id+' nao esta vazia', (valores[id]||'').length>1000);

/* Os blocos carregam o desenhador de QR (cdnjs) e o SDK do cartao (paypal.com); o molde
   BLOQUEIA tudo que nao seja o proprio servidor, de proposito, e o navegador registra isso
   como erro de console. Sao os unicos aceitos -- qualquer outro e defeito do bloco. */
const EXTERNO = /cdnjs\.cloudflare\.com|paypal\.com|ERR_FAILED|Failed to load resource/;
const errosReais = e => e.filter(x => !EXTERNO.test(x));

/* --------------------------------------------------------------------------
   O ROTEIRO, IDENTICO NAS TRES. Quem muda e como se poe e se tira o item de
   R$ 150 -- e essa e a diferenca que este teste existe para exercitar.
   -------------------------------------------------------------------------- */
async function roteiro(pg, aba, sel, porItem){
  const total = () => pg.$eval(sel.total, el => el.textContent.trim());
  const msg   = () => pg.$eval(sel.msg,   el => el.textContent.trim());
  const aplicar = async cod => {
    await pg.fill(sel.cupomInput, cod);
    await pg.click(sel.cupomBotao);
  };
  const passos = [];
  const p = (rotulo, valor) => passos.push([rotulo, valor]);

  await porItem(pg, true);                       /* 200 + 150 = 350 */
  p(aba+' | 1. subtotal cheio antes de qualquer cupom', await total());
  await aplicar('MIN300');
  p(aba+' | 1. total com MIN300 acima do minimo', await total());
  p(aba+' | 1. recado com MIN300 aceito',          await msg());

  /* limpa o cupom (campo vazio = tira o cupom, comportamento que ja existia) */
  await aplicar('');
  await porItem(pg, false);                      /* 200 */
  p(aba+' | 2. total sem o item de 150',           await total());
  await aplicar('MIN300');
  p(aba+' | 2. total apos MIN300 RECUSADO abaixo', await total());
  p(aba+' | 2. recado da recusa',                  await msg());

  /* --- 3: a queda automatica --- */
  await porItem(pg, true);
  await aplicar('MIN300');
  p(aba+' | 3. total com o cupom aplicado (350)',  await total());
  await porItem(pg, false);                      /* tira o item COM o cupom aplicado */
  p(aba+' | 3. TOTAL NA TELA apos a queda',        await total());
  p(aba+' | 3. recado da queda',                   await msg());

  /* --- 4: voltar a subir NAO reaplica --- */
  await porItem(pg, true);
  p(aba+' | 4. total ao repor o item',             await total());

  /* --- 5: cupom SEM minimo, com o pedido pequeno --- */
  await aplicar('');
  await porItem(pg, false);
  await aplicar('SEMMIN');
  p(aba+' | 5. total com SEMMIN em 200',           await total());
  p(aba+' | 5. recado do SEMMIN',                  await msg());
  await porItem(pg, true);
  p(aba+' | 5. total com SEMMIN em 350 (segue valendo)', await total());

  return Object.fromEntries(passos);
}

const ESPERADO = aba => ({
  [aba+' | 1. subtotal cheio antes de qualquer cupom']: 'R$ 350,00',
  [aba+' | 1. total com MIN300 acima do minimo']:       'R$ 315,00',
  [aba+' | 1. recado com MIN300 aceito']:               'Cupom aplicado!',
  [aba+' | 2. total sem o item de 150']:                'R$ 200,00',
  [aba+' | 2. total apos MIN300 RECUSADO abaixo']:      'R$ 200,00',
  [aba+' | 2. recado da recusa']:                       MIN_TXT,
  [aba+' | 3. total com o cupom aplicado (350)']:       'R$ 315,00',
  [aba+' | 3. TOTAL NA TELA apos a queda']:             'R$ 200,00',
  [aba+' | 3. recado da queda']:                        QUEDA_TXT,
  [aba+' | 4. total ao repor o item']:                  'R$ 350,00',
  [aba+' | 5. total com SEMMIN em 200']:                'R$ 180,00',
  [aba+' | 5. recado do SEMMIN']:                       'Cupom aplicado!',
  [aba+' | 5. total com SEMMIN em 350 (segue valendo)']:'R$ 315,00'
});

function conferir(aba, lido){
  const esp = ESPERADO(aba);
  for(const k of Object.keys(esp)) chk(k+' = '+JSON.stringify(esp[k]), lido[k]===esp[k], 'leu '+JSON.stringify(lido[k]));
}

/* ===================== Checkout: marca/desmarca a CAIXA do produto ===================== */
{
  const r = await comBlocoNaPagina({
    bloco: valores['u-out'], porta: 8794,
    medir: pg => roteiro(pg, 'Checkout',
      {total:'.fcu-total-v', msg:'.fcu-cupom-msg', cupomInput:'.fcu-cupom-l input', cupomBotao:'.fcu-cupom-l button'},
      async (pg, ligado) => {
        /* Clica no LABEL, e nao no input: o marcador de selecao e DESENHADO (Manual do
           Prosite), e o input nativo por baixo pode nem estar no caminho do dedo. */
        const marcado = await pg.$eval('input[name="fcu-prod"][value="1"]', el => el.checked);
        if(marcado !== ligado) await pg.click('label:has(input[name="fcu-prod"][value="1"])');
      })
  });
  chk('Checkout: bloco rodou sem erro proprio', errosReais(r.erros).length===0, errosReais(r.erros).join(' | '));
  conferir('Checkout', r);
}

/* ===================== Mini loja: poe e tira a LINHA da cesta ===================== */
{
  const r = await comBlocoNaPagina({
    bloco: valores['m-out'], porta: 8795,
    medir: async pg => {
      /* O primeiro produto (200) entra na cesta e fica; o segundo (150) e o que sobe e
         desce ao longo do roteiro. */
      await pg.locator('.fcm-card').nth(0).click();
      await pg.click('.fcm-add');
      return roteiro(pg, 'Mini loja',
        {total:'.fcm-total-v', msg:'.fcm-cupom-msg', cupomInput:'.fcm-cupom-l input', cupomBotao:'.fcm-cupom-l button'},
        async (pg, ligado) => {
          const linhas = await pg.locator('.fcm-item').count();
          if(ligado && linhas < 2){
            await pg.locator('.fcm-card').nth(1).click();
            await pg.click('.fcm-add');
          }else if(!ligado && linhas > 1){
            await pg.locator('.fcm-item .fcm-tirar').nth(1).click();
          }
        });
    }
  });
  chk('Mini loja: bloco rodou sem erro proprio', errosReais(r.erros).length===0, errosReais(r.erros).join(' | '));
  conferir('Mini loja', r);
}

/* ===================== pac: marca/desmarca o OPCIONAL do pacote ===================== */
{
  const r = await comBlocoNaPagina({
    bloco: valores['a-out3'], porta: 8796, busca: '?pac=MINI&data=2027-01-10&hora=10:00',
    medir: pg => roteiro(pg, 'Agendamento por pacote',
      {total:'.fca-ob-preco-valor', msg:'.fca-ob-cupom-msg', cupomInput:'.fca-ob-cupom-l input', cupomBotao:'.fca-ob-cupom-l button'},
      async (pg, ligado) => {
        const marcado = await pg.$eval('.fca-ob-op input[type="checkbox"]', el => el.checked);
        if(marcado !== ligado) await pg.click('.fca-ob-op label');
      })
  });
  chk('pac: bloco rodou sem erro proprio', errosReais(r.erros).length===0, errosReais(r.erros).join(' | '));
  conferir('Agendamento por pacote', r);
}

/* ============================================================================
   A COMPATIBILIDADE: cupom SEM a chave nova, backup e preset
   ============================================================================
   Tres coisas, e as tres pela INTERFACE, nunca por dentro:
     1. estado gravado por versao ANTERIOR (cupom sem 'minimo') restaura sem
        aviso, o campo nasce vazio, e o bloco gerado nao ganha uma linha --
        que e a decisao D3 vista do outro lado da regressao;
     2. o "Exportar tudo" leva o minimo, e reimportar o proprio arquivo o
        devolve (o molde de fcxConformar e type-strict: chave que nao esta
        declarada la e DESCARTADA em silencio, e e por isso que isto e medido
        e nao suposto);
     3. o preset de aba guarda e devolve o minimo -- inclusive na aba pac, cuja
        restauracao RECONSTROI o cupom chave a chave e perderia o campo se ele
        nao estivesse nomeado.
   ============================================================================ */
{
  const srv = await servir(RAIZ_REPO, 8797);
  const br  = await navegador();
  const base = 'http://127.0.0.1:8797';
  try{
    /* ---------- 1. estado de versao anterior ---------- */
    {
      const pg = await abrir(br, base);
      const velho = cp => ({codigo:'VELHO',tipo:'pct_total',valor:10,validade:''});
      const ANTIGO = {
        u:{prods:[{nome:'Ensaio',desc:'',preco:200,opsel:'unico',opnenhum:'nao',qtd:false,ops:[]}],cps:[velho()]},
        m:{cps:[velho()]}, a:{cps:[velho()]}};
      await pg.evaluate(st => localStorage.setItem('fcConstrutores', JSON.stringify(st)), ANTIGO);
      await pg.goto(base+'/index.html');
      await pg.evaluate(()=>{window.__alertas=[];window.alert=m=>window.__alertas.push(String(m));window.confirm=()=>true;window.open=()=>null;});
      await pg.reload();
      await pg.evaluate(()=>{window.__alertas=[];window.alert=m=>window.__alertas.push(String(m));window.confirm=()=>true;window.open=()=>null;});
      const barra = await pg.evaluate(()=>{const b=document.getElementById('fc-falhas');return b?b.textContent:'';});
      chk('estado anterior: restaura sem barra vermelha', barra==='', barra.slice(0,200));
      chk('estado anterior: restaura sem alerta', (await lerAlertas(pg)).length===0, JSON.stringify(await lerAlertas(pg)));
      for(const [pref,aba] of [['u','aba-uni'],['m','aba-loja'],['a','aba-pac']]){
        await clicar(pg, aba);
        const r = await pg.evaluate(pf=>{
          const li=document.querySelectorAll('#'+pf+'-cp-lista li');
          if(!li.length) return {n:0};
          const nums=li[0].querySelectorAll('input[type="number"]');
          return {n:li.length, cod:li[0].querySelector('input[type="text"]').value,
                  min:nums.length?nums[nums.length-1].value:'(sem campo de minimo)'};
        }, pref);
        chk(pref+': o cupom sem a chave nova aparece na lista', r.n===1 && r.cod==='VELHO', JSON.stringify(r));
        chk(pref+': o campo de minimo dele nasce VAZIO', r.min==='', JSON.stringify(r));
      }
      for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
      await clicar(pg,'aba-uni'); await clicar(pg,'u-gerar');
      chk('cupom sem minimo: a aba gerou sem recusa', (await lerAlertas(pg)).length===0, JSON.stringify(await lerAlertas(pg)));
      const out = await ler(pg,'u-out');
      chk('cupom sem minimo: o bloco continua trazendo o cupom', out.indexOf("codigo:'VELHO'")>=0);
      chk('cupom sem minimo: o bloco NAO ganha uma linha do minimo',
          out.indexOf('cupomMinimoOk')<0 && out.indexOf('minimo:')<0 && out.indexOf('TXT_CUPOM_MINIMO')<0);
      await pg.close();
    }

    /* ---------- 2. "Exportar tudo" e a volta pela importacao ---------- */
    let arquivo = '';
    {
      const pg = await abrir(br, base);
      await clicar(pg,'aba-uni');
      await set(pg,'u-pnome','Ensaio'); await set(pg,'u-ppreco','200'); await clicar(pg,'u-prod-salvar');
      await set(pg,'u-cp-cod','MIN300'); await radio(pg,'u-cp-tipo','pct_total');
      await set(pg,'u-cp-valor','10'); await set(pg,'u-cp-min','300'); await clicar(pg,'u-cp-add');
      const st = JSON.parse(await pg.evaluate(()=>localStorage.getItem('fcConstrutores')));
      chk('o estado gravado leva o minimo', st.u.cps[0].minimo==='300', JSON.stringify(st.u.cps[0]));

      await pg.evaluate(()=>document.getElementById('fcx-tudo').click());
      await pg.waitForTimeout(400);
      const [dl] = await Promise.all([pg.waitForEvent('download'),
        pg.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Sem os dados');
                         if(!b) throw new Error('sem o botao "Sem os dados" no dialogo de exportar'); b.click();})]);
      arquivo = path.join(os.tmpdir(), 'fc-cupom-minimo-'+Date.now()+'.json');
      await dl.saveAs(arquivo);
      chk('"Exportar tudo" grava o minimo do cupom', /"minimo"\s*:\s*"300"/.test(fs.readFileSync(arquivo,'utf8')));

      await pg.evaluate(()=>localStorage.clear());
      await pg.goto(base+'/index.html');
      await pg.evaluate(()=>{window.__alertas=[];window.alert=m=>window.__alertas.push(String(m));window.confirm=()=>true;window.open=()=>null;});
      await pg.setInputFiles('#fcx-arquivo', arquivo);
      await pg.waitForTimeout(600);
      /* Duas caixas em sequencia: "Importar este arquivo?" e depois a do RASCUNHO -- e e no
         rascunho que a configuracao da tela (com o cupom) viaja. */
      for(const rot of ['Importar','Substituir a tela pelo rascunho do arquivo']){
        const achou = await pg.evaluate(r=>{const el=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()===r);
                                            if(!el.length) return false; el[el.length-1].click(); return true;}, rot);
        chk('importacao: a caixa "'+rot+'" apareceu', achou);
        await pg.waitForTimeout(600);
      }
      await clicar(pg,'aba-uni');
      const rr = await pg.evaluate(()=>{
        const li=document.querySelectorAll('#u-cp-lista li');
        if(!li.length) return {n:0};
        const nums=li[0].querySelectorAll('input[type="number"]');
        return {n:li.length, cod:li[0].querySelector('input[type="text"]').value, min:nums[nums.length-1].value};
      });
      chk('reimportado: o cupom volta COM o minimo', rr.n===1 && rr.cod==='MIN300' && rr.min==='300', JSON.stringify(rr));
      const aviso = await pg.evaluate(()=>{const e=document.getElementById('fcx-aviso');return e?e.textContent:'';});
      chk('reimportado: nenhum descarte anunciado', !/descart/i.test(aviso), aviso.slice(0,300));
      try{ fs.unlinkSync(arquivo); }catch(e){}
      await pg.close();
    }

    /* ---------- 3. preset de aba ---------- */
    {
      const pg = await abrir(br, base);
      for(const [pref,aba] of [['u','aba-uni'],['a','aba-pac']]){
        await clicar(pg, aba);
        if(pref==='a'){
          await set(pg,'a-pcod','MINI'); await set(pg,'a-pnome','Mini'); await set(pg,'a-pdur','1h');
          await set(pg,'a-ppreco','200'); await set(pg,'a-pinclui','10 fotos');
          await set(pg,'a-ppath','fotocerta/mini'); await clicar(pg,'a-pac-salvar');
        }else{
          await set(pg,'u-pnome','Ensaio'); await set(pg,'u-ppreco','200'); await clicar(pg,'u-prod-salvar');
        }
        await set(pg,pref+'-cp-cod','MIN300'); await radio(pg,pref+'-cp-tipo','pct_total');
        await set(pg,pref+'-cp-valor','10'); await set(pg,pref+'-cp-min','300'); await clicar(pg,pref+'-cp-add');
        await set(pg,'fcp-'+pref+'-nome','com minimo'); await clicar(pg,'fcp-'+pref+'-salvar');
        /* apaga o minimo NA TELA e manda o preset de volta: sem apagar antes, "voltou" e
           indistinguivel de "nunca saiu". */
        await pg.evaluate(pf=>{const li=document.querySelector('#'+pf+'-cp-lista li');
          const n=li.querySelectorAll('input[type="number"]'), el=n[n.length-1];
          el.value=''; el.dispatchEvent(new Event('input',{bubbles:true}));}, pref);
        const antes = await pg.evaluate(()=>JSON.parse(localStorage.getItem('fcConstrutores')||'{}'));
        chk(pref+': o minimo saiu da tela antes de aplicar o preset', antes[pref].cps[0].minimo==='', JSON.stringify(antes[pref].cps[0]));
        await pg.evaluate(pf=>{const b=[...document.querySelectorAll('#fcp-'+pf+'-lista button')].find(x=>/aplicar/i.test(x.textContent));
          if(!b) throw new Error('sem botao Aplicar na lista de presets de '+pf); b.click();}, pref);
        await pg.waitForTimeout(300);
        const dep = await pg.evaluate(()=>JSON.parse(localStorage.getItem('fcConstrutores')||'{}'));
        chk(pref+': aplicar o preset devolve o minimo', String(dep[pref].cps[0].minimo)==='300',
            JSON.stringify(dep[pref].cps[0])+' | alertas: '+JSON.stringify(await lerAlertas(pg)));
      }
      await pg.close();
    }
  } finally {
    await br.close();
    srv.close();
  }
}

process.exit(resumo());
