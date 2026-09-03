/* ============================================================================
   O DETECTOR DE ACENTO FALTANDO NO TEXTO QUE UMA PESSOA LE
   ============================================================================
   A NORMA (01/09/2026) tem duas faixas e so duas:

     - TEXTO QUE UMA PESSOA LE SAI ACENTUADO. O que o cliente final ve no bloco
       gerado, o que o dono ve na tela da ferramenta (alert, confirm, rotulos,
       placeholder, ajuda) e aria-label/alt/title, que o leitor de tela
       PRONUNCIA EM VOZ ALTA.
     - CODIGO NAO LEVA ACENTO: comentario, identificador, classe CSS, marcador
       ({codigo}, {pct}) e o payload do Pix.

   Este arquivo transforma a primeira faixa em medida. Roda por linha de
   comando, aponta a frase e a palavra, e SAI COM CODIGO 1 quando acha algo --
   e por isso serve de guarda permanente, e nao so de varredura de uma vez.

       node scripts/verificar/acentos.mjs                 # o index.html da arvore
       node scripts/verificar/acentos.mjs <arquivo>       # outro arquivo
       node scripts/verificar/acentos.mjs --vocabulario   # o que ele aprendeu

   ---------------------------------------------------------------------------
   POR QUE ESTA FORMA, E NAO A DA VARREDURA ANTERIOR
   ---------------------------------------------------------------------------
   A varredura de 01/09/2026 procurava "frase sem NENHUM acento" com expressao
   regular sobre as linhas do arquivo. Ela mesma se declarou incompleta, e os
   dois buracos eram estruturais, nao de ajuste:

     1. NAO VIA 'e' -> 'e' acentuado, nem nenhuma outra troca de UMA letra que
        ela nao tivesse escrito a mao numa lista;
     2. NAO VIA STRING CONCATENADA EM VARIAS LINHAS -- e a ferramenta escreve
        assim o tempo todo (alert('...'+x+'\n\n'+'...')), entao a metade de
        baixo da frase passava sem ser lida.

   As tres pecas abaixo respondem aos dois:

   (a) UM TOKENIZADOR DE VERDADE, em vez de expressao regular por linha. Ele
       separa string, comentario e codigo. Isso resolve o buraco 2 de graca --
       uma concatenacao e uma sequencia de literais no MESMO ponto do codigo,
       e o detector a le inteira, quantas linhas tiver. E resolve tambem o
       maior risco do lado oposto: TODO o codigo gerado deste arquivo mora
       DENTRO de literais (c+='function total(){...}'), e um literal nunca e
       lido como codigo -- entao um 'textContent' que aparece dentro do bloco
       gerado nao vira sink por acidente.

   (b) O VOCABULARIO SAI DO PROPRIO ARQUIVO. Nao ha lista de palavras escrita a
       mao: o detector recolhe toda palavra ACENTUADA que existe no arquivo
       ('preco' com cedilha, 'codigo' com acento, 'voce', 'e' acentuado...) e
       monta a tabela "forma sem acento -> forma acentuada". Depois procura a
       forma sem acento no texto de interface. A propria arvore e a fonte, e e
       por isso que o mecanismo pega 'e'->'e acentuado' e 'preco'->'preco com
       cedilha' pelo MESMO caminho, sem regra especial para nenhum dos dois.

   (c) A IRMA ACENTUADA, por frase inteira. Duas frases que so diferem nos
       acentos sao a mesma frase escrita duas vezes, uma delas errada. Quando
       existe irma, o detector mostra o texto dela: a correcao e copiar,
       nao inventar uma terceira redacao.

   ---------------------------------------------------------------------------
   O QUE ELE NAO ACUSA (rule 3 -- detector que grita em cima de {codigo} e
   detector que ninguem usa)
   ---------------------------------------------------------------------------
     - comentario (de barra dupla, de barra-asterisco, e o de HTML): o
       tokenizador os descarta;
     - <style> inteiro, e o atributo class;
     - marcador entre chaves ({pct}, {valor}, {n}): apagado antes de ler;
     - token que e IDENTIFICADOR e nao palavra: tem digito, '_', '/', ponto
       seguido de letra (op.preco, index.html), dois ou mais hifens
       (fca-ob-preco) ou termina em hifen (prefixo 'fcu-');
     - HOMOGRAFO: palavra que em portugues existe COM e SEM acento ('e' e 'e'
       acentuado, 'esta' e 'esta' acentuado, 'pais' e 'pais' acentuado). Vao na
       lista HOMOGRAFOS, abaixo, cada uma com o par que a justifica. Sem essa
       lista o detector acusaria toda conjuncao 'e' do arquivo e ninguem o
       rodaria duas vezes.

   ---------------------------------------------------------------------------
   O QUE ELE NAO ALCANCA -- declarado, para nao ser suposto
   ---------------------------------------------------------------------------
     1. PALAVRA CUJA FORMA ACENTUADA NAO EXISTA NO ARQUIVO. O vocabulario e o
        proprio arquivo: se 'orcamento' nunca foi escrito certo em lugar
        nenhum, nao ha com o que comparar. Cobertura cresce sozinha a cada
        frase acentuada que entra.
     2. HOMOGRAFO ERRADO. Toda ocorrencia de 'e', 'esta', 'pais' e perdoada,
        inclusive as que deviam levar acento. A irma (peca c) pega parte
        desses; o resto depende de leitura humana.
     3. TEXTO DO BLOCO GERADO ESCRITO A MAO DENTRO DE UM LITERAL. O detector le
        os literais que chegam a um sink DA FERRAMENTA. Texto do cliente que
        nasce dentro de uma string de codigo gerado (por exemplo o aria-label
        que fcFazQtdSrc escreve) so e visto pela varredura extra do fim -- que
        procura sink com valor literal DENTRO de codigo gerado, e por isso
        alcanca menos do que a principal.
     4. CONCORDANCIA, CRASE E ORTOGRAFIA. Ele compara palavra com palavra. Nao
        sabe se 'a' devia ser 'a' com crase, e nao inventa acento onde a forma
        acentuada nunca foi escrita.
     5. ELE NAO LE O QUE O PROSITE PUBLICA. Como todo o resto deste arnes, ele
        le a arvore, nao a pagina no ar.
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const args = process.argv.slice(2);
const soVocabulario = args.includes('--vocabulario');
const ALVO = args.find(a => a[0] !== '-') || path.join(RAIZ, 'index.html');

/* ===========================================================================
   HOMOGRAFOS: existem em portugues COM e SEM acento, com sentidos diferentes.
   Acusa-los seria acusar o arquivo inteiro. Cada linha traz o par que a
   justifica -- entrada nova so com o par escrito, senao a lista vira um lugar
   de esconder defeito.
   =========================================================================== */
const HOMOGRAFOS = new Set([
  'a',        // artigo "a aba"            x  crase "à direita"
  'as',       // artigo "as abas"          x  crase "às vezes"
  'aquele',   // "aquele campo"            x  crase "àquele campo"
  'aquela',   // "aquela aba"              x  crase "àquela aba"
  'continua', // verbo "ele continua"      x  adjetivo "contagem contínua"
  'copia',    // verbo "voce copia"        x  substantivo "uma cópia"
  'da',       // "da aba"                  x  verbo "ela dá"
  'e',        // conjuncao "isto e aquilo" x  verbo "isto é"
  'esta',     // pronome "esta aba"        x  verbo "está pronta"
  'la',       // pronome enclitico "abri-la" x  adverbio "lá"
  'no',       // preposicao "no campo"     x  substantivo "nó"
  'nos',      // "nos campos"             x  pronome "nós"
  'pode',     // presente "ele pode"       x  passado "ele pôde"
  'porque',   // conjuncao "porque sim"    x  substantivo "o porquê"
  'por',      // preposicao "por aba"      x  verbo "pôr"
  'publica',  // verbo "voce publica"      x  adjetivo "pagina pública"
  'que',      // "que campo"               x  "por quê"
  'vira',     // presente "ele vira"       x  futuro "ele virá"
  'tem',      // singular "ela tem"        x  plural "elas têm"
  'vem',      // singular "ela vem"        x  plural "elas vêm"
]);

/* NAO E PALAVRA: sequencia acentuada que existe no arquivo como PEDACO de
   texto, e nao como palavra. Sem esta lista o pedaco entra no vocabulario e
   passa a cobrar acento de uma palavra legitima.
     'ão' -- vem de "nao está(ão) no storage" (a saida do plano da aba
             Slideshow, que escreve a concordancia entre parenteses). Ele
             cobraria acento em cada "ao" do arquivo: 70 falsos, medidos. */
const NAO_E_PALAVRA = new Set(['ão']);

/* Sinks da FERRAMENTA. Lidos sobre o esqueleto do codigo (literais trocados
   por marcas), nunca sobre o texto cru -- por isso um 'textContent' que so
   existe dentro de uma string de codigo gerado nao entra aqui. */
const SINKS_ATRIB = ['textContent','placeholder','title','alt','innerHTML','value','ariaLabel','label'];
const SINKS_FUNC  = ['alert','confirm','fciRecusa','fcFalha','fciApontarSe'];
const ATRIBS_HTML = ['placeholder','title','alt','aria-label','value','label'];

const texto = fs.readFileSync(ALVO, 'utf8');

/* =========================================================================
   1. AS REGIOES DO ARQUIVO
   ========================================================================= */
/* O CURSOR DE BUSCA E O INICIO DA REGIAO SAO DUAS COISAS: escrever um so foi
   o primeiro defeito deste arquivo -- a regiao HTML comecava no meio de uma
   tag (logo depois de um '<' que nao era de script), e dai o detector lia o
   miolo de um comentario HTML como se fosse texto da tela. */
function regioes(s){
  const out = [];
  let i = 0, inicioHtml = 0;
  const baixoTudo = s.toLowerCase();
  while(i < s.length){
    const abre = baixoTudo.indexOf('<', i);
    if(abre < 0) break;
    let tag = null;
    if(baixoTudo.startsWith('<script', abre)) tag = 'script';
    else if(baixoTudo.startsWith('<style', abre)) tag = 'style';
    if(!tag){ i = abre + 1; continue; }
    const fimAbertura = s.indexOf('>', abre);
    if(fimAbertura < 0) break;
    const fechamento = baixoTudo.indexOf('</' + tag + '>', fimAbertura);
    const fim = fechamento < 0 ? s.length : fechamento;
    out.push({tipo:'html', ini:inicioHtml, fim:abre});
    if(tag === 'script') out.push({tipo:'js', ini:fimAbertura + 1, fim});
    i = inicioHtml = fechamento < 0 ? s.length : fechamento + tag.length + 3;
  }
  if(inicioHtml < s.length) out.push({tipo:'html', ini:inicioHtml, fim:s.length});
  return out.filter(r => r.fim > r.ini);
}

/* Linha (1-based) de um deslocamento. Tabela montada uma vez -- procurar
   '\n' a cada achado seria quadratico num arquivo de 22 mil linhas. */
const QUEBRAS = [];
for(let k = 0; k < texto.length; k++) if(texto[k] === '\n') QUEBRAS.push(k);
function linhaDe(pos){
  let lo = 0, hi = QUEBRAS.length;
  while(lo < hi){ const m = (lo + hi) >> 1; if(QUEBRAS[m] < pos) lo = m + 1; else hi = m; }
  return lo + 1;
}

/* =========================================================================
   2. O TOKENIZADOR DE JAVASCRIPT
   -------------------------------------------------------------------------
   Devolve (a) o ESQUELETO: o mesmo codigo com cada literal trocado por uma
   marca \x00<n>\x00 e cada comentario trocado por espacos (as quebras de
   linha ficam, para as linhas continuarem batendo); e (b) a lista dos
   literais, com o conteudo ja sem as sequencias de escape que importam.

   A deteccao de expressao regular e a heuristica classica: '/' comeca uma
   regex quando o ultimo simbolo significativo antes dela nao pode terminar
   um valor. Errar para o lado da regex e barato aqui -- o pior caso e um
   trecho de codigo virar texto ignorado, nunca um literal virar codigo.
   ========================================================================= */
function tokenizarJs(s, base){
  const literais = [];
  let esq = '';
  let i = 0, ultimoSig = '';
  const podeSerRegex = () => ultimoSig === '' || /[({[,;:=!&|?+\-*%~^<>]/.test(ultimoSig) ||
    /\b(return|typeof|case|in|of|new|delete|void|do|else)$/.test(ultimoSig);
  while(i < s.length){
    const c = s[i];
    if(c === '/' && s[i+1] === '/'){
      const fim = s.indexOf('\n', i); const ate = fim < 0 ? s.length : fim;
      esq += ' '.repeat(ate - i); i = ate; continue;
    }
    if(c === '/' && s[i+1] === '*'){
      const fim = s.indexOf('*/', i + 2); const ate = fim < 0 ? s.length : fim + 2;
      for(let k = i; k < ate; k++) esq += (s[k] === '\n' ? '\n' : ' ');
      i = ate; continue;
    }
    if(c === '/' && podeSerRegex()){
      let k = i + 1, dentro = false, ok = false;
      while(k < s.length){
        const d = s[k];
        if(d === '\\'){ k += 2; continue; }
        if(d === '\n') break;
        if(dentro){ if(d === ']') dentro = false; }
        else if(d === '[') dentro = true;
        else if(d === '/'){ ok = true; break; }
        k++;
      }
      if(ok){
        while(k + 1 < s.length && /[a-z]/.test(s[k+1])) k++;
        esq += ' '.repeat(k - i + 1); i = k + 1; ultimoSig = 'x'; continue;
      }
    }
    if(c === "'" || c === '"' || c === '`'){
      let k = i + 1, val = '';
      while(k < s.length){
        const d = s[k];
        if(d === '\\'){
          const e = s[k+1];
          val += (e === 'n' ? '\n' : e === 't' ? '\t' : e === 'r' ? '' :
                  e === '\n' ? '' : e === 'u' || e === 'x' ? ' ' : e);
          k += 2; continue;
        }
        if(d === c) break;
        if(c !== '`' && d === '\n') break;   // literal nao fechado: nao arrasta
        val += d; k++;
      }
      const n = literais.length;
      literais.push({valor: val, pos: base + i, aspas: c});
      const marca = '\x00' + n + '\x00';
      esq += marca + ' '.repeat(Math.max(0, (k - i + 1) - marca.length));
      /* Quando a marca e MAIOR que o literal (literais de 1-2 caracteres), o
         esqueleto deixa de ter o mesmo comprimento do original. Isso nao
         importa: nenhuma posicao do esqueleto e usada para voltar ao arquivo
         -- quem guarda a posicao e o proprio literal. */
      i = k + 1; ultimoSig = 'x'; continue;
    }
    esq += c;
    if(!/\s/.test(c)) ultimoSig = (ultimoSig + c).slice(-8);
    i++;
  }
  return {esqueleto: esq, literais};
}

/* Colhe as marcas de literal de uma EXPRESSAO que comeca em 'de' no
   esqueleto: anda para a frente somando as marcas ate a expressao terminar
   (';' no nivel de fora, ou ',' / ')' no nivel em que ela comecou). E este
   passo -- e nao uma expressao regular por linha -- que le a concatenacao
   inteira, tenha ela quantas linhas tiver. */
function marcasDaExpressao(esq, de, ateFecharParenteses){
  const achadas = [];
  let d = 0;
  for(let k = de; k < esq.length; k++){
    const c = esq[k];
    if(c === '\x00'){
      let m = k + 1, num = '';
      while(esq[m] !== '\x00' && m < esq.length){ num += esq[m]; m++; }
      achadas.push(Number(num)); k = m; continue;
    }
    if(c === '(' || c === '[' || c === '{') d++;
    else if(c === ')' || c === ']' || c === '}'){ if(d === 0) break; d--; }
    else if(c === ';' && d === 0) break;
    else if(c === ',' && d === 0 && !ateFecharParenteses) break;
    else if(c === '\n'){
      /* Quebra de linha so encerra quando a expressao ja acabou de verdade:
         o que continua com '+' na proxima linha (ou terminou com '+' nesta)
         segue sendo a mesma frase. */
      const antes = esq.slice(Math.max(0, k - 200), k).replace(/\s+$/, '');
      const depois = esq.slice(k + 1).replace(/^\s+/, '');
      if(!/[+,(]$/.test(antes) && !/^[+)]/.test(depois) && d === 0) break;
    }
  }
  return achadas;
}

/* =========================================================================
   3. AS FRASES DE INTERFACE
   ========================================================================= */
const frases = [];   // {txt, linha, origem}
function juntar(lits, idxs, linha, origem, comidos){
  const partes = idxs.map(n => lits[n] && lits[n].valor).filter(v => typeof v === 'string');
  if(comidos) idxs.forEach(n => comidos.add(n));
  if(!partes.length) return;
  const txt = partes.join(' ');
  if(txt.trim()) frases.push({txt, linha, origem});
}

/* ===========================================================================
   A SEGUNDA FAIXA DE LEITURA: PROSA
   ---------------------------------------------------------------------------
   So os sinks nao bastam, e isso foi MEDIDO. Boa parte do texto que o dono le
   nao chega a tela num sink com o literal do lado: ele passa por uma variavel
   (a mensagem de versao errada, montada num ternario e mostrada depois), por
   um ajudante da propria ferramenta (fcFalha, o aviso vermelho, o resumo de
   cada preset) ou por um objeto de configuracao (o texto do aviso da previa,
   em fcPvShim). Rastrear isso exigiria seguir dado por dentro do codigo; o que
   custa pouco e alcanca quase tudo e ler TODO literal que PARECE PROSA.

   O PORTAO, e o que cada regra evita:
     - curto demais, ou com menos de tres palavras -> chave, id, sigla;
     - sinal de codigo (;{}=, </, var, function, return, document., .style) ->
       o codigo gerado, que mora todo dentro de literais;
     - abre ou fecha COMENTARIO (barra-asterisco) -> comentario do bloco
       gerado, que pela norma NAO leva acento;
     - termina em quebra de linha -> linha de codigo gerado, que sempre termina
       assim;
     - nenhuma palavra funcional do portugues -> valor de CSS
       ("fcw-degrade 8s linear infinite"), seletor (".fcb-barra .fcb-conteudo"),
       at-rule ("@media (max-width:"). Frase que uma pessoa le tem "de", "que",
       "para", "uma"... ; identificador nao tem.

   E um PORTAO, nao uma prova: ele erra para o lado de deixar passar menos
   (um texto de interface escrito sem nenhuma palavra funcional fica de fora,
   e isso esta na lista do que o detector nao alcanca). O que ele nao pode
   fazer e acusar codigo -- e por isso cada regra acima nasceu de um falso
   positivo medido, e nao de suposicao. */
const FUNCIONAIS = /(^|[^A-Za-zÀ-ÿ])(de|do|da|dos|das|no|na|nos|nas|o|a|os|as|e|ou|que|para|por|com|sem|um|uma|uns|umas|ao|aos|se|ja|nao|este|esta|isso|isto|deste|desta|dele|dela|seu|sua|mais|menos|ate|so|quando|onde|como|mas|cada|todo|toda|todos|todas)([^A-Za-zÀ-ÿ]|$)/i;
/* COMENTARIO DO BLOCO GERADO, PARTIDO EM PEDACOS. O gerador escreve o
   cabecalho do bloco em varias linhas seguidas:
     c+='<!-- =====================\n';
     c+='     FOTO CERTA - BARRA DE CONTAGEM REGRESSIVA\n';
     c+='     ONDE COLAR: '+(cfg.fixa?'campo Tag Body da pagina':'...')+'\n';
   e o terceiro pedaco, lido sozinho, parece prosa: nao tem sinal de codigo e
   nao abre comentario nenhum. Quem sabe que ele e comentario sao os LITERAIS
   ANTERIORES -- e por isso a busca anda para tras pela lista de literais ate
   achar quem abre ou quem fecha. Andar pelos LITERAIS, e nao pelo texto cru, e
   o que torna isto seguro: comentario da propria ferramenta nao e literal, e
   por isso nao entra na conta.
   Medido: sem isto, 'campo Tag Body da pagina' -- que e comentario dentro do
   bloco entregue, e pela norma NAO leva acento -- seria acusado, e acentua-lo
   mudaria a saida c-out1 por causa de um comentario. */
function emComentarioGerado(literais, n){
  const linhaAqui = linhaDe(literais[n].pos);
  for(let k = n; k >= 0 && k > n - 40; k--){
    const v = literais[k].valor;
    if(linhaAqui - linhaDe(literais[k].pos) > 30) break;
    const fecha = Math.max(v.lastIndexOf('*/'), v.lastIndexOf('-->'));
    const abre  = Math.max(v.lastIndexOf('/*'), v.lastIndexOf('<!--'));
    if(k === n && abre < 0 && fecha < 0) continue;
    if(abre > fecha) return true;
    if(fecha >= 0) return false;
  }
  return false;
}
function pareceProsa(v){
  if(v.length < 12) return false;
  /* PONTO E VIRGULA DE PROSA vem seguido de espaco ("recarregue; se continuar");
     o de codigo fecha a instrucao e vem colado no que vier depois. Sem essa
     distincao o portao descartava a metade de baixo do aviso de versao errada,
     que tem um ponto e virgula no meio: medido. */
  if(/;(?!\s)|[{}=]|<\/|\bvar\b|\bfunction\b|\breturn\b|document\.|\.style|createElement/.test(v)) return false;
  if(v.indexOf('/*') >= 0 || v.indexOf('*/') >= 0) return false;
  if(/\n\s*$/.test(v)) return false;
  if((v.match(/[A-Za-zÀ-ÿ]{2,}/g) || []).length < 3) return false;
  return FUNCIONAIS.test(v);
}

const regs = regioes(texto);
const literaisJs = [];      // guardados para a varredura extra do fim
for(const r of regs){
  if(r.tipo !== 'js') continue;
  const trecho = texto.slice(r.ini, r.fim);
  const {esqueleto, literais} = tokenizarJs(trecho, r.ini);
  literaisJs.push(...literais);

  const comidos = new Set();
  /* A chamada de funcao vai ate FECHAR O PARENTESES, e nao ate a primeira
     virgula: fcFalha('Ferramenta','ler as configuracoes gravadas -- ...',e,'')
     leva o texto no SEGUNDO argumento, e parar na virgula lia so o primeiro. */
  const reFunc = new RegExp('\\b(' + SINKS_FUNC.join('|') + ')\\s*\\(', 'g');
  let m;
  while((m = reFunc.exec(esqueleto))){
    const idxs = marcasDaExpressao(esqueleto, m.index + m[0].length, true);
    if(idxs.length) juntar(literais, idxs, linhaDe(literais[idxs[0]].pos), m[1] + '()', comidos);
  }
  const reAtr = new RegExp('\\.(' + SINKS_ATRIB.join('|') + ')\\s*\\+?=[^=]', 'g');
  while((m = reAtr.exec(esqueleto))){
    const idxs = marcasDaExpressao(esqueleto, m.index + m[0].length - 1);
    if(idxs.length) juntar(literais, idxs, linhaDe(literais[idxs[0]].pos), '.' + m[1] + '=', comidos);
  }
  /* setAttribute('aria-label', ...) e irmaos: o primeiro argumento diz qual
     atributo e, e por isso ele precisa ser lido antes de aceitar o segundo. */
  const reSet = /setAttribute\s*\(\s*\x00(\d+)\x00\s*,/g;
  while((m = reSet.exec(esqueleto))){
    const nome = (literais[Number(m[1])] || {}).valor;
    if(!ATRIBS_HTML.includes(nome)) continue;
    const idxs = marcasDaExpressao(esqueleto, m.index + m[0].length);
    if(idxs.length) juntar(literais, idxs, linhaDe(literais[idxs[0]].pos), 'setAttribute(' + nome + ')', comidos);
  }
  /* O que sobrou dos sinks, lido pelo portao de prosa. */
  literais.forEach((l, n) => {
    if(comidos.has(n) || !pareceProsa(l.valor)) return;
    if(emComentarioGerado(literais, n)) return;
    frases.push({txt: l.valor, linha: linhaDe(l.pos), origem: 'prosa'});
  });
}

/* --- a regiao HTML: a interface da propria ferramenta -------------------- */
const ENTIDADES = {nbsp:' ', amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", times:'x',
  mdash:'-', ndash:'-', hellip:'...', larr:'<-', rarr:'->', middot:'.', laquo:'"', raquo:'"'};
function decodificar(s){
  return s.replace(/&(#?\w+);/g, (t, e) => {
    if(e[0] === '#') return ' ';
    return Object.prototype.hasOwnProperty.call(ENTIDADES, e) ? ENTIDADES[e] : ' ';
  });
}
/* Tags cujo TEXTO nao e da interface: o <option> tem texto de interface, mas
   o <script>/<style> ja sairam por regiao. Nada mais precisa ser excluido --
   todo o resto do HTML deste arquivo e a tela do dono. */
for(const r of regs){
  if(r.tipo !== 'html') continue;
  const s = texto.slice(r.ini, r.fim);
  let i = 0;
  while(i < s.length){
    const abre = s.indexOf('<', i);
    if(abre < 0 || abre >= s.length){ empurrarTexto(s.slice(i), r.ini + i); break; }
    empurrarTexto(s.slice(i, abre), r.ini + i);
    if(s.startsWith('<!--', abre)){
      const f = s.indexOf('-->', abre); i = f < 0 ? s.length : f + 3; continue;
    }
    /* <code>/<kbd>/<samp>/<pre> guardam CODIGO por definicao -- o nome da
       chave do localStorage, o comentario que abre o bloco, o seletor CSS.
       Acusa-los seria a rule 3 ao contrario. */
    const mCod = /^<(code|kbd|samp|pre)\b/i.exec(s.slice(abre, abre + 8));
    if(mCod){
      const f = s.toLowerCase().indexOf('</' + mCod[1].toLowerCase() + '>', abre);
      i = f < 0 ? s.length : f + mCod[1].length + 3; continue;
    }
    const f = s.indexOf('>', abre);
    if(f < 0) break;
    lerAtributos(s.slice(abre, f + 1), r.ini + abre);
    i = f + 1;
  }
}
function empurrarTexto(t, pos){
  const limpo = decodificar(t).replace(/\s+/g, ' ').trim();
  if(limpo) frases.push({txt: limpo, linha: linhaDe(pos), origem: 'html'});
}
function lerAtributos(tag, pos){
  const re = /([a-zA-Z-]+)\s*=\s*"([^"]*)"/g;
  let m;
  /* SO O value DE CAMPO DE TEXTO E TEXTO. O value de <option>, de radio e de
     checkbox e CHAVE de configuracao ('nao', 'padrao', 'circulo', 'degrade')
     -- ela viaja no localStorage e no preset, e acentua-la quebraria estado
     ja gravado. Medido: 13 falsos nesta unica regra. O value de <input
     type="text"> e o contrario disso: e o texto de fabrica dos 162 campos
     configuraveis, que o cliente final le. */
  const valeValue = /^<input\b/i.test(tag) && /type\s*=\s*"text"/i.test(tag);
  while((m = re.exec(tag))){
    const nome = m[1].toLowerCase();
    if(!ATRIBS_HTML.includes(nome)) continue;
    if(nome === 'value' && !valeValue) continue;
    const v = decodificar(m[2]).trim();
    if(v) frases.push({txt: v, linha: linhaDe(pos), origem: 'html@' + nome});
  }
}

/* =========================================================================
   4. O VOCABULARIO -- extraido do proprio arquivo
   ========================================================================= */
const ACENTUADA = /[À-ÿ]/;
const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
/* A ARVORE INTEIRA E A FONTE, e nao so o arquivo sob analise. A mesma palavra
   que falta acento na tela da ferramenta ja foi escrita certa em algum lugar
   deste projeto -- na documentacao, na /cobrar, no arquivo compartilhado. Ler
   so o index.html deixava de fora 'conexão' e 'começar', que existem na
   documentacao e faltavam na tela: medido. */
function fontesDoVocabulario(){
  const fontes = [ALVO];
  const cand = ['index.html', 'cobrar/index.html', 'fc-compartilhado.js', 'CLAUDE.md'];
  for(const c of cand){ const f = path.join(RAIZ, c); if(fs.existsSync(f)) fontes.push(f); }
  const docs = path.join(RAIZ, 'docs');
  if(fs.existsSync(docs))
    for(const nome of fs.readdirSync(docs, {recursive: true})){
      const f = path.join(docs, String(nome));
      if(/\.(md|txt)$/i.test(f) && fs.statSync(f).isFile()) fontes.push(f);
    }
  return [...new Set(fontes)];
}
const VOCAB = new Map();     // 'preco' -> Map('preço' -> 12)
/* PALAVRA INTEIRA, E SO ELA. Vizinho hifen ou aspa faz a palavra ser um
   PEDACO, e pedaco envenena o vocabulario:
     - 'apaga-lo' acentuado vira a entrada apaga -> apagá, e dai o detector
       passa a exigir acento em todo verbo 'apaga' do arquivo;
     - uma string quebrada em duas linhas ('configura' + 'ção') vira a entrada
       ao -> ão.
   As duas foram MEDIDAS na primeira execucao deste arquivo. Palavra comum nao
   perde nada com a regra -- ela aparece solta em outros cem lugares. */
const VIZINHO_RUIM = /[A-Za-zÀ-ÿ'"`\\\-]/;
for(const fonte of fontesDoVocabulario()){
  const bruto = fs.readFileSync(fonte, 'utf8');
  const re = /[A-Za-zÀ-ÿ]+/g;
  let m;
  while((m = re.exec(bruto))){
    const w = m[0];
    if(!ACENTUADA.test(w)) continue;
    if(NAO_E_PALAVRA.has(w.toLowerCase())) continue;
    const antes = bruto[m.index - 1] || ' ', depois = bruto[m.index + w.length] || ' ';
    if(VIZINHO_RUIM.test(antes) || VIZINHO_RUIM.test(depois)) continue;
    const chave = semAcento(w).toLowerCase();
    if(!VOCAB.has(chave)) VOCAB.set(chave, new Map());
    const mm = VOCAB.get(chave);
    mm.set(w.toLowerCase(), (mm.get(w.toLowerCase()) || 0) + 1);
  }
}
function sugestao(chave){
  const m = VOCAB.get(chave);
  if(!m) return null;
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

if(soVocabulario){
  const linhas = [...VOCAB.keys()].sort().map(k => '  ' + k + ' -> ' + sugestao(k));
  console.log('vocabulario aprendido em ' + path.basename(ALVO) + ': ' + VOCAB.size + ' palavras');
  console.log(linhas.join('\n'));
  process.exit(0);
}

/* =========================================================================
   5. A LEITURA DE UMA FRASE
   ========================================================================= */
/* A BORDA QUE SE TIRA E SO A PONTUACAO DE FRASE. Tirar '/' junto foi o
   segundo defeito medido aqui: "/portfolio/..." virava "portfolio" e o
   detector cobrava acento de um CAMINHO. O que marca codigo tem de sobreviver
   ao corte para poder ser reconhecido logo abaixo. */
const BORDA = /^[.,;:!?"'\u201c\u201d\u2018\u2019()\[\]\u2026\u2014\u2013\u00ab\u00bb\u00a0\s]+|[.,;:!?"'\u201c\u201d\u2018\u2019()\[\]\u2026\u2014\u2013\u00ab\u00bb\u00a0\s]+$/g;
/* PONTUACAO DE FIM DE FRASE NAO E MARCA DE CODIGO -- mas marca de codigo no
   COMECO e. '.fcb-conteudo' precisa continuar sendo lido com o ponto (senao
   deixa de parecer seletor); 'comecar:' precisa perder os dois pontos, e
   '(versao' precisa perder o parentese (senao deixam de ser palavra). Os tres
   foram medidos: testar o token cru inteiro escondia 'comecar', 'conexao',
   '(versao' e toda palavra no fim de uma oracao. Aspas e parentese de ABRIR
   sao pontuacao; ponto, barra, cerquilha e arroba de abrir sao codigo -- e por
   isso a lista da frente e curta e nomeada, em vez de "tudo que nao e letra". */
function semPontoFinal(t){
  return t.replace(/^["'\u201c\u2018\u00ab(,]+/, '')
          .replace(/[.,;:!?"'\u201d\u2019)\]\u2026\u2014\u2013\u00bb]+$/, '');
}
function tokenDeCodigo(t){
  if(/[0-9_\/\\<>{}\[\]=;()|*#$@%+~^:]/.test(t)) return true;  // caminho, seletor, chave
  if(/\.[A-Za-zÀ-ÿ]/.test(t)) return true;              // op.preco, index.html
  if((t.match(/-/g) || []).length >= 2) return true;              // fca-ob-preco
  if(/^-|-$/.test(t)) return true;                                // prefixo 'fcu-'
  if(/[a-z][A-Z]/.test(t)) return true;                           // camelCase: nomesSelecionados
  return false;
}
function faltando(txt){
  const achadas = [];
  const semMarcador = txt.replace(/\{[^}]*\}/g, ' ').replace(/&\w+;/g, ' ');
  for(const bruto of semMarcador.split(/\s+/)){
    const t = bruto.replace(BORDA, '');
    if(!t || tokenDeCodigo(semPontoFinal(bruto)) || tokenDeCodigo(t)) continue;
    for(const w of t.split(/[^A-Za-zÀ-ÿ]+/)){
      if(!w || ACENTUADA.test(w)) continue;
      const chave = w.toLowerCase();
      if(HOMOGRAFOS.has(chave)) continue;
      if(!VOCAB.has(chave)) continue;
      achadas.push(w + ' -> ' + sugestao(chave));
    }
  }
  return [...new Set(achadas)];
}

/* A IRMA: mesma frase, mesmos caracteres a menos dos acentos. */
const porForma = new Map();
const forma = s => semAcento(s).toLowerCase().replace(/\s+/g, ' ').trim();
for(const f of frases){
  const k = forma(f.txt);
  if(!porForma.has(k)) porForma.set(k, []);
  porForma.get(k).push(f.txt);
}
function irma(txt){
  const lista = porForma.get(forma(txt)) || [];
  const acc = lista.filter(t => ACENTUADA.test(t) && t !== txt);
  return acc.length ? acc[0] : null;
}

/* =========================================================================
   6. A VARREDURA EXTRA: sink com valor LITERAL dentro de codigo gerado
   -------------------------------------------------------------------------
   Alcance menor que o da principal, e de proposito: aqui nao ha tokenizador
   por baixo (estamos DENTRO de uma string), entao so se aceita a forma
   fechada -- atributo/propriedade recebendo um literal inteiro, sem
   concatenacao. E o suficiente para o punhado de textos que o bloco gerado
   escreve a mao (aria-label do seletor de quantidade, por exemplo).
   ========================================================================= */
const extra = [];
const RE_GER = /(?:\.(?:textContent|title|alt|placeholder)\s*=\s*|setAttribute\(\s*['"](?:aria-label|title|alt|placeholder)['"]\s*,\s*)['"]([^'"+]{3,})['"]/g;
for(const lit of literaisJs){
  if(lit.valor.length < 20) continue;
  let m;
  RE_GER.lastIndex = 0;
  while((m = RE_GER.exec(lit.valor))){
    const t = m[1].trim();
    if(t) extra.push({txt: t, linha: linhaDe(lit.pos), origem: 'bloco gerado'});
  }
}

/* =========================================================================
   7. O RELATORIO
   ========================================================================= */
const todas = frases.concat(extra);
const achados = [];
const vistas = new Set();
for(const f of todas){
  const chave = f.origem + '' + f.txt;
  if(vistas.has(chave)) continue;
  vistas.add(chave);
  const p = faltando(f.txt);
  if(!p.length) continue;
  achados.push({...f, palavras: p, irma: irma(f.txt)});
}
achados.sort((a, b) => a.linha - b.linha);

const corte = s => s.length > 150 ? s.slice(0, 150) + '...' : s;
console.log('ACENTOS -- ' + path.relative(RAIZ, ALVO));
console.log('  frases de interface lidas: ' + todas.length +
            '  (js: ' + frases.filter(f => f.origem !== 'html' && !f.origem.startsWith('html@')).length +
            ', html: ' + frases.filter(f => f.origem === 'html' || f.origem.startsWith('html@')).length +
            ', bloco gerado: ' + extra.length + ')');
console.log('  vocabulario aprendido do proprio arquivo: ' + VOCAB.size + ' palavras acentuadas');
console.log('');
for(const a of achados){
  console.log('  linha ' + a.linha + '  [' + a.origem + ']');
  console.log('    ' + JSON.stringify(corte(a.txt)));
  console.log('    falta: ' + a.palavras.join(', '));
  if(a.irma) console.log('    IRMA ACENTUADA: ' + JSON.stringify(corte(a.irma)));
}
console.log('');
if(!achados.length){
  console.log('ACENTOS: OK  (nenhuma frase de interface com acento faltando)');
  process.exit(0);
}
console.log('ACENTOS: ' + achados.length + ' FRASE(S) com acento faltando.');
process.exit(1);
