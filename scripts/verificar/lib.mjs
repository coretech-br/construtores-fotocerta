/* ============================================================================
   ARNES DE VERIFICACAO -- as pecas comuns
   ============================================================================
   POR QUE ISTO EXISTE NO REPOSITORIO. A disciplina desta ferramenta se apoia num
   invariante: mexer numa aba nao pode mudar um byte do que as outras produzem. Provar
   isso exige uma FOTOGRAFIA de referencia -- as saidas de todos os geradores numa
   versao anterior -- e um jeito de comparar. Ate 22/08/2026 esse arnes era reescrito
   a cada sessao numa pasta temporaria; ele foi perdido duas vezes no meio de uma
   rodada, e cada perda custou recapturar tudo. Ferramenta de medicao que some nao e
   ferramenta: e um ritual.

   NAO E CODIGO DO SITE. Nada aqui e servido nem colado no Prosite. E utilitario de
   linha de comando, roda em Node e nao entra em nenhuma pagina.

   DEPENDENCIA. Precisa do Playwright e de um Chromium. O repositorio nao tem
   package.json de proposito, entao a busca e por ordem, e a falha DIZ o que fazer:
     1. FC_PLAYWRIGHT  -- caminho do modulo, se voce quiser mandar num especifico
     2. import('playwright') -- se estiver instalado no ambiente
     3. o cache do npx, procurando por node_modules de playwright dentro de ~/.npm/_npx
   ============================================================================ */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

export async function playwright(){
  if(process.env.FC_PLAYWRIGHT){
    return await import(path.resolve(process.env.FC_PLAYWRIGHT));
  }
  try{ return await import('playwright'); }catch(e){}
  const cache = path.join(os.homedir(), '.npm', '_npx');
  if(fs.existsSync(cache)){
    for(const d of fs.readdirSync(cache)){
      const p = path.join(cache, d, 'node_modules', 'playwright', 'index.mjs');
      if(fs.existsSync(p)) return await import(p);
    }
  }
  throw new Error(
    'Playwright nao encontrado. Instale com:\n' +
    '    npx playwright install chromium\n' +
    'ou aponte o modulo com a variavel FC_PLAYWRIGHT=/caminho/para/node_modules/playwright/index.mjs');
}

/* O Chromium: deixa o Playwright resolver sozinho, e so usa FC_CHROME quando a
   instalacao do Playwright nao bate com os navegadores baixados (acontece quando o
   modulo vem do cache do npx, que pode estar numa versao diferente). */
export async function navegador(){
  const { chromium } = await playwright();
  const op = process.env.FC_CHROME ? {executablePath:process.env.FC_CHROME} : {};
  try{ return await chromium.launch(op); }
  catch(e){
    const achado = acharChromium();
    if(achado) return await chromium.launch({executablePath:achado});
    throw new Error(String(e.message||e) +
      '\nSe o navegador nao estiver baixado: npx playwright install chromium' +
      '\nOu aponte o executavel com FC_CHROME=/caminho/para/chrome-headless-shell');
  }
}
function acharChromium(){
  const raizes = [
    path.join(os.homedir(),'Library','Caches','ms-playwright'),
    path.join(os.homedir(),'.cache','ms-playwright')
  ];
  for(const r of raizes){
    if(!fs.existsSync(r)) continue;
    const dirs = fs.readdirSync(r).filter(d=>d.indexOf('chromium')===0).sort().reverse();
    for(const d of dirs){
      for(const rel of ['chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
                        'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
                        'chrome-headless-shell-mac-arm64/chrome-headless-shell',
                        'chrome-linux/chrome']){
        const p = path.join(r,d,rel);
        if(fs.existsSync(p)) return p;
      }
    }
  }
  return null;
}

const TIPOS = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
  '.json':'application/json','.png':'image/png','.md':'text/plain; charset=utf-8'};

/* Servidor estatico. Serve para a arvore ser exercitada por HTTP, e nao por file:// --
   em file:// o localStorage e o endereco simulado se comportam diferente, e ja produziram
   falso positivo neste projeto. */
export function servir(raiz, porta){
  const s = http.createServer((req,res)=>{
    let p = decodeURIComponent(req.url.split('?')[0]);
    if(p.endsWith('/')) p += 'index.html';
    const f = path.join(raiz, p);
    if(!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){res.writeHead(404);res.end('nao');return;}
    res.writeHead(200,{'Content-Type':TIPOS[path.extname(f)]||'application/octet-stream'});
    res.end(fs.readFileSync(f));
  });
  return new Promise(r=>s.listen(porta,()=>r(s)));
}

export const sha = t => crypto.createHash('sha256').update(t,'utf8').digest('hex');

/* Abre a ferramenta com o armazenamento LIMPO e recarregada -- as duas coisas, sempre.
   Limpar sem recarregar deixa em memoria o estado que a pagina ja tinha lido, e foi assim
   que uma comparacao passou sobre configuracao vazada da passagem anterior. O alert e
   neutralizado e RE-INJETADO apos a recarga, porque a recarga o devolve ao original. */
export async function abrir(browser, base){
  const pg = await browser.newPage();
  const erros = [];
  pg.on('pageerror', e => erros.push('pageerror: '+e.message));
  pg.on('console', m => { if(m.type()==='error') erros.push('console: '+m.text()); });
  pg.erros = erros;
  await pg.goto(base+'/index.html');
  await pg.evaluate(()=>{ localStorage.clear(); sessionStorage.clear(); });
  await pg.goto(base+'/index.html');
  await pg.evaluate(()=>{
    window.__alertas = [];
    window.alert = m => { window.__alertas.push(String(m)); };
    window.confirm = () => true;
    window.open = () => null;
  });
  return pg;
}

/* Preenche disparando os MESMOS eventos do teclado: input, change e blur. A correcao a
   vista deste projeto acontece no change/blur, entao atribuir .value sem os eventos
   mediria um estado que o operador nunca ve. */
export async function set(pg, id, valor){
  await pg.evaluate(([id,valor])=>{
    const el = document.getElementById(id);
    if(!el) throw new Error('sem campo '+id);
    if(el.type==='checkbox') el.checked = !!valor; else el.value = valor;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el.dispatchEvent(new Event('blur',{bubbles:true}));
  },[id,valor]);
}
export async function marcar(pg, id, ligado){
  await pg.evaluate(([id,ligado])=>{
    const el = document.getElementById(id);
    if(!el) throw new Error('sem caixa '+id);
    el.checked = !!ligado;
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el.dispatchEvent(new Event('input',{bubbles:true}));
  },[id,ligado]);
}
export async function radio(pg, nome, valor){
  await pg.evaluate(([nome,valor])=>{
    const el = document.querySelector('input[name="'+nome+'"][value="'+valor+'"]');
    if(!el) throw new Error('sem radio '+nome+'='+valor);
    el.checked = true;
    el.dispatchEvent(new Event('change',{bubbles:true}));
  },[nome,valor]);
}
export async function clicar(pg, id){
  await pg.evaluate(id=>{
    const el = document.getElementById(id);
    if(!el) throw new Error('sem botao '+id);
    el.click();
  }, id);
}
export const ler = (pg,id) => pg.evaluate(id=>{
  const el = document.getElementById(id);
  return el ? el.value : null;
}, id);
export const alertas = pg => pg.evaluate(()=>window.__alertas.slice());
export const zerarAlertas = pg => pg.evaluate(()=>{window.__alertas.length=0;});
