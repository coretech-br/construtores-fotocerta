/* ============================================================================
   FOTO CERTA -- FONTE COMPARTILHADA PELAS DUAS PAGINAS DA FERRAMENTA
   ============================================================================
   QUEM CARREGA ESTE ARQUIVO: a ferramenta de construtores (/index.html) e a
   pagina de uso diario (/cobrar/). Nada mais.

   POR QUE ELE EXISTE. Ate 21/08/2026 o index.html precisava ser AUTOCONTIDO,
   porque era colado dentro de um componente do Prosite -- e la nao existe
   importar arquivo. Naquele dia a ferramenta passou a ser SERVIDA num endereco
   proprio, e o dono liberou a separacao. A /cobrar nasceu logo depois, e com
   ela a pergunta que decide este arquivo: quem monta o codigo Pix e quem
   calcula o selo do link, se as duas paginas geram links?

   A RESPOSTA: uma fonte, duas paginas. Duas implementacoes divergem, e aqui
   divergir nao seria cosmetico -- seria a /cobrar produzir links que a propria
   /pagar RECUSA, descoberto com o cliente na frente.

   O QUE **NAO** MUDOU, e nao e negociavel: os blocos GERADOS continuam
   autossuficientes. Eles vao para dentro do Prosite. Por isso as funcoes que
   os blocos carregam continuam vivendo aqui como TEXTO LITERAL (FC_PIX_SRC,
   P_SELO_SRC, P_PP_SRC), e as duas paginas AVALIAM esse mesmo texto.
   Unifica-se a fonte que ESCREVE, nunca a saida.

   O QUE ENTROU AQUI: so o que as DUAS paginas executam -- a maquinaria do BR
   Code, o selo e o prazo, as recusas da cobranca, a montagem do link e a
   leitura da identidade guardada. O que e de uma pagina so ficou onde estava:
   mover codigo compartilhado ja tem custo (ele passa a ter dois donos), e
   mover o que so um lado usa troca duplicacao por acoplamento, que nao e
   melhor -- e diferente.

   A VERSAO E O CACHE. Com arquivo separado, o navegador guarda copias. Uma
   versao velha de um lado e nova do outro produziria links recusados sem
   explicacao -- defeito silencioso e intermitente, a pior combinacao. Por isso
   o endereco deste arquivo e VERSIONADO nas duas paginas
   (fc-compartilhado.js?v=...) e por isso cada pagina confere, ao carregar, se
   a versao que chegou e a que ela pediu; se nao for, ela para e diz.
   AO PUBLICAR UMA MUDANCA AQUI: troque FC_COMPART_VERSAO abaixo E o ?v= das
   duas paginas. A conferencia NAO e um grep a olho, e sim:
     scripts/conferir-versoes.sh
   Ela existe porque a guarda de versao das duas paginas e CEGA POR CONSTRUCAO:
   quem declara a versao e o proprio arquivo cuja atualidade esta em duvida.
   Medido: mudando o comportamento de seloDe (':' -> ';') SEM trocar a versao,
   sob 'immutable', o navegador seguiu servindo a copia velha, os dois arquivos
   passaram a selar diferente (D57C contra 625D) e nenhuma pagina avisou nada.
   O script compara o CONTEUDO com a versao declarada e falha se o arquivo mudou
   sem o troco -- disciplina que depende de lembrar nao e disciplina.

   ES5, sem dependencia externa, sem acesso ao DOM.
   ============================================================================ */
'use strict';
var FCCOMPART=(function(){
var FC_COMPART_VERSAO='2026-08-22b';

/* Limpeza compartilhada pelos DOIS validadores de endereco -- cUrlOk (botao de acao da
   Contagem regressiva) e tUrlOk (pagina intermediaria do TidyCal). Ela faz o que o NAVEGADOR
   faz antes de resolver a URL, para o teste enxergar o mesmo endereco que o clique vai abrir:
   1. Controle e espaco somem: sem isso, um caractere de controle no meio de "javascript:"
      passaria pelo teste e viraria javascript: no clique.
   2. Barra invertida vira barra. Medido: href="/\evil.com/x" e resolvido pelo navegador como
      http://evil.com/x -- OUTRO host --, e passava pelos dois validadores, porque o segundo
      caractere nao era "/". Alinhar as duas abas fechou a coerencia entre elas, mas nao a
      classe do defeito; a classe fecha aqui, num lugar so. Nenhum caminho legitimo do site
      leva barra invertida, entao normalizar nao recusa nada que devesse passar.
   A limpeza vale so para o TESTE: o que sai no codigo continua sendo o que o operador digitou
   -- e, quando o teste recusa, nada sai. */
function urlLimpa(v){
  return String(v).replace(/[\u0000-\u0020]/g,'').replace(/\\/g,'/');
}

/* ===== maquinaria do Pix (BR Code): fonte unica =====
   Ate ago/2026 o payload do Pix era escrito num lugar so -- dentro do gerador do Checkout --,
   e isso bastava. Com a aba "Link de cobranca" ele passou a ser preciso em TRES lugares: o
   bloco do carrinho (Checkout), o bloco da pagina de pagamento (que LE o codigo em vez de
   monta-lo) e a propria ferramenta, que monta o codigo na hora de gerar o link. Tres copias
   do mesmo TLV e do mesmo CRC seriam tres chances de o payload divergir -- e aqui divergir
   nao e cosmetico: e o banco recusar o QR sem explicacao, ou pior, cobrar outro valor.
   O que se unifica e a FONTE QUE ESCREVE, nunca a saida -- mesma decisao de CORUJA_PECAS e de
   PRECO_MOEDAS. Cada bloco entregue continua levando a propria copia do codigo e nao depende
   desta ferramenta para nada.
   O lado da ferramenta nao reescreve as funcoes em JavaScript "de verdade": ele AVALIA a mesma
   fonte (fcPixApi). Assim nao existe uma segunda implementacao nem por descuido -- o codigo que
   a ferramenta executa e, caractere por caractere, o que o bloco publicado vai executar.
   A fonte e literal deste arquivo: nada digitado pelo operador entra nela. */
var FC_PIX_SRC={};
FC_PIX_SRC.semAcento=
  'function semAcento(t,max){\n'+
  "t=String(t||'');\n"+
  "try{t=t.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');}catch(e){}\n"+
  "t=t.replace(/[^A-Za-z0-9 .,-]/g,' ').replace(/ +/g,' ').trim();\n"+
  'return t.substring(0,max);\n}\n\n';
/* O comprimento e SEMPRE calculado do valor (v.length), nunca escrito a mao. E o que impede o
   gerador de produzir um payload cujo comprimento declarado nao bate com o conteudo -- ver o
   comentario de lerTlv, do outro lado da mesma moeda. */
FC_PIX_SRC.tlv=
  'function tlv(id,v){\n'+
  'var l=String(v.length);\n'+
  "if(l.length<2)l='0'+l;\n"+
  'return id+l+v;\n}\n\n';
FC_PIX_SRC.crc16=
  'function crc16(s){\n'+
  'var c=0xFFFF;\n'+
  'for(var i=0;i<s.length;i++){\n'+
  'c^=s.charCodeAt(i)<<8;\n'+
  'for(var j=0;j<8;j++){c=(c&0x8000)?(((c<<1)^0x1021)&0xFFFF):((c<<1)&0xFFFF);}\n'+
  '}\n'+
  'var h=c.toString(16).toUpperCase();\n'+
  "while(h.length<4)h='0'+h;\n"+
  'return h;\n}\n\n';
FC_PIX_SRC.montarPayload=
  'function montarPayload(valor){\n'+
  'var nome=semAcento(NOME_RECEBEDOR,25);\n'+
  'var cid=semAcento(CIDADE,15);\n'+
  "var txid=String(CODIGO_PEDIDO).replace(/[^A-Za-z0-9]/g,'').substring(0,25)||'***';\n"+
  "var p=tlv('00','01');\n"+
  "p+=tlv('26',tlv('00','BR.GOV.BCB.PIX')+tlv('01',CHAVE_PIX));\n"+
  "p+=tlv('52','0000');\n"+
  "p+=tlv('53','986');\n"+
  "p+=tlv('54',valor.toFixed(2));\n"+
  "p+=tlv('58','BR');\n"+
  "p+=tlv('59',nome);\n"+
  "p+=tlv('60',cid);\n"+
  "p+=tlv('62',tlv('05',txid));\n"+
  "p+='6304';\n"+
  'return p+crc16(p);\n}\n\n';
/* LER um BR Code e o inverso de monta-lo, e e onde mora o defeito silencioso desta aba.
   Medido na pagina publicada: um campo 54 declarando comprimento 07 para o valor "75.00" (que
   tem 5 caracteres) faz um leitor por posicao devolver "75.0058" -- sete caracteres, invadindo
   o campo seguinte. Valor errado, sem erro nenhum, num numero que e dinheiro.
   Por isso lerTlv percorre campo a campo e exige que a estrutura FECHE EXATAMENTE no fim:
   comprimento que nao seja dois digitos, valor mais curto que o comprimento declarado ou sobra
   de bytes no fim derrubam a leitura inteira. Nao ha "melhor esforco" aqui: payload que nao
   fecha e payload recusado. */
FC_PIX_SRC.lerTlv=
  'function lerTlv(s){\n'+
  'var i=0,out=[],dois,tam,v;\n'+
  'while(i<s.length){\n'+
  'if(i+4>s.length)return null;\n'+
  'dois=s.substr(i+2,2);\n'+
  'if(!/^[0-9]{2}$/.test(dois))return null;\n'+
  'tam=parseInt(dois,10);\n'+
  'v=s.substr(i+4,tam);\n'+
  'if(v.length!==tam)return null;\n'+
  'out.push([s.substr(i,2),v]);\n'+
  'i+=4+tam;\n'+
  '}\n'+
  'if(i!==s.length)return null;\n'+
  'return out;\n}\n\n';
/* A conferencia inteira de um codigo recebido, em UMA funcao: forma, CRC, e o valor do campo
   54. Devolve {erro:'...'} ou {ok:true,...}. Quem chama decide o que dizer ao visitante. */
FC_PIX_SRC.pixLer=
  'function pixLer(codigo){\n'+
  "var s=String(codigo||'');\n"+
  "if(s.length<20)return {erro:'forma'};\n"+
  /* ASCII imprimivel INCLUINDO o espaco: o campo 59 (nome do recebedor) legitimamente tem
     espaco -- "Foto Certa" --, e semAcento deixa passar espaco de proposito. A faixa sem
     espaco e a da CHAVE (pixChaveErro), que e outra coisa: la o espaco no meio e defeito.
     Trocar uma faixa pela outra recusava todo payload de recebedor com nome composto. */
  "if(!/^[\\x20-\\x7E]+$/.test(s))return {erro:'forma'};\n"+
  'var comId=s.substring(0,s.length-4),dado=s.substring(s.length-4);\n'+
  "if(comId.substring(comId.length-4)!=='6304')return {erro:'forma'};\n"+
  "if(crc16(comId).toUpperCase()!==dado.toUpperCase())return {erro:'crc'};\n"+
  'var itens=lerTlv(comId.substring(0,comId.length-4));\n'+
  "if(!itens)return {erro:'forma'};\n"+
  'var i,j,mapa={},sub,txid=\'\';\n'+
  'for(i=0;i<itens.length;i++)if(mapa[itens[i][0]]===undefined)mapa[itens[i][0]]=itens[i][1];\n'+
  "if(mapa['62']){sub=lerTlv(mapa['62']);if(sub){for(j=0;j<sub.length;j++)if(sub[j][0]==='05')txid=sub[j][1];}}\n"+
  "var bruto=mapa['54'];\n"+
  "if(bruto===undefined)return {erro:'semvalor'};\n"+
  'if(!/^[0-9]{1,10}(\\.[0-9]{1,2})?$/.test(bruto))return {erro:\'semvalor\'};\n'+
  'var n=parseFloat(bruto);\n'+
  "if(isNaN(n)||n<=0)return {erro:'semvalor'};\n"+
  'return {ok:true,valor:n,txid:txid,codigo:s};\n}\n\n';
/* O lado da FERRAMENTA: as mesmas funcoes, avaliadas a partir da mesma fonte. montar() recebe
   os quatro valores que o bloco do Checkout le de variaveis globais e devolve a montarPayload
   pronta -- entao a ferramenta monta o payload pelo caminho exato do carrinho publicado. */
var fcPixFns=null;
function fcPixApi(){
  if(!fcPixFns){
    fcPixFns=(new Function(
      FC_PIX_SRC.semAcento+FC_PIX_SRC.tlv+FC_PIX_SRC.crc16+FC_PIX_SRC.lerTlv+FC_PIX_SRC.pixLer+
      'return {semAcento:semAcento,tlv:tlv,crc16:crc16,lerTlv:lerTlv,pixLer:pixLer,'+
      'montar:function(CHAVE_PIX,NOME_RECEBEDOR,CIDADE,CODIGO_PEDIDO){'+FC_PIX_SRC.montarPayload+
      'return montarPayload;}};'))();
  }
  return fcPixFns;
}
/* ===== formatacao de preco: fonte unica =====
   Ago/2026: subiu da aba Checkout para ca quando a aba Link de cobranca passou a precisar dela.
   A regra vivia em dois lugares de corpo equivalente: uFmt (o que ESTA ferramenta mostra na
   lista de produtos e nos avisos de sinal) e a moedaFmt que ela ESCREVE dentro do carrinho.
   Os dois concordavam, entao nao havia defeito; o risco e a proxima moeda entrar so num deles
   e a tela passar a discordar do carrinho publicado -- sem erro, sem aviso.
   O bloco entregue continua AUTOSSUFICIENTE: ele leva a propria moedaFmt, escrita por
   fcMoedaFmtGer a partir desta tabela. Unificou-se a fonte que escreve, nunca a saida.
   Cada linha e [codigo, prefixo]. O real fica FORA da tabela de proposito: ele e o padrao
   (vale para qualquer codigo que nao esteja listado) e e o unico com virgula decimal. */
var PRECO_MOEDAS=[['EUR','\u20AC '],['USD','$ ']];
var PRECO_PADRAO='R$ ';
function precoFmt(moeda,v){
  var s=v.toFixed(2),i;
  for(i=0;i<PRECO_MOEDAS.length;i++)if(moeda===PRECO_MOEDAS[i][0])return PRECO_MOEDAS[i][1]+s;
  return PRECO_PADRAO+s.replace('.',',');
}

/* ===== chave Pix: limpeza e limites do padrao BR Code =====
   NOME_RECEBEDOR e CIDADE ja passavam por semAcento() dentro do bloco entregue; a chave ia
   crua para o tlv('01', ...). Um espaco nao-quebravel vindo de copiar-e-colar do app do banco
   sobrevivia ate o payload e o banco recusava o QR sem dizer por que. E o campo 01 do BR Code
   cabe em 77 caracteres: uma chave maior desestrutura o TLV (o leitor le "01102aaa..." como
   comprimento 10) enquanto o CRC continua sendo calculado sobre o payload torto -- o QR
   PARECE valido e so um banco de verdade recusa.
   Divisao adotada, por POSICAO e nao por tipo de caractere: nas PONTAS tudo que e espaco ou
   invisivel e removido e devolvido ao campo (ninguem digita isso de proposito, e um espaco a
   mais no fim nao muda a chave que o operador leu); NO MEIO nada e removido -- espaco comum,
   TAB, NBSP e zero-width caem todos na mesma recusa com aviso. A primeira versao desta
   correcao removia NBSP e TAB do meio calada e recusava o espaco comum na mesma posicao: duas
   entradas visualmente identicas com tratamentos opostos, e a silenciosa reescrevendo no meio
   de uma credencial de pagamento. Uma regra so, e o aviso menciona a possibilidade de
   caractere invisivel justamente porque o operador pode nao estar vendo o que esta errado.
   Tambem recusam: tamanho acima do limite e campo que ficou vazio depois da limpeza.
   Nao ha regra de formato aqui de proposito: o padrao aceita e-mail, telefone, CPF/CNPJ e
   chave aleatoria, com formatos diferentes. O limite de caracteres imprimiveis ASCII nao e
   estetico: tlv() conta com v.length e crc16() com charCodeAt, ambos em unidades UTF-16,
   enquanto o banco conta bytes UTF-8 -- qualquer caractere fora dessa faixa faz comprimento e
   CRC discordarem. */
var PIX_CHAVE_MAX=77;
function pixLimpar(t){
  return String(t||'')
    .replace(/^[\u0000-\u0020\u007F-\u00A0\u00AD\u1680\u2000-\u200F\u2028\u2029\u202F\u205F\u2060\u3000\uFEFF]+/,'')
    .replace(/[\u0000-\u0020\u007F-\u00A0\u00AD\u1680\u2000-\u200F\u2028\u2029\u202F\u205F\u2060\u3000\uFEFF]+$/,'');
}

/* 'bruta' e o valor antes da limpeza: chave que so tinha invisiveis merece aviso proprio
   (senao o operador leria "preencha a chave" com o campo aparentemente preenchido); campo
   nunca preenchido cai no aviso geral de campos obrigatorios, que ja existia. */
/* Charset ANTES do tamanho: uma chave de 80 caracteres com emoji reportaria "tem 80
   caracteres" quando o problema e o emoji -- o operador cortaria a chave certa e continuaria
   sem QR valido. O defeito mais especifico e o que deve ser nomeado. */
function pixChaveErro(chave,bruta){
  if(!chave)return String(bruta||'').length?fciRecusa('A chave Pix so tinha espacos ou caracteres invisiveis (vindos de copiar-e-colar) e ficou vazia depois da limpeza das pontas. Digite a chave novamente.'):'';
  if(!/^[!-~]+$/.test(chave))return 'A chave Pix tem, no meio, um espaco ou um caractere fora do padrao -- pode ser um caractere invisivel que veio junto do copiar-e-colar do app do banco e que voce nao esta vendo. O codigo do QR conta os caracteres em bytes, e qualquer um fora da faixa comum (letras, numeros e sinais, sem espacos) faz o banco recusar o pagamento sem explicacao. Apague o campo e digite a chave de novo.';
  if(chave.length>PIX_CHAVE_MAX)return 'A chave Pix tem '+chave.length+' caracteres e o padrao do Banco Central aceita no maximo '+PIX_CHAVE_MAX+' no campo da chave. Uma chave maior desmonta o codigo do QR sem que ele pareca invalido: confira se nao colou algo a mais.';
  return '';
}

var FCI_CHAVE='fcConstrutoresIdentidade';
/* [chave, rotulo de interface com artigo, rotulo curto]. Uma lista so: ela alimenta os
   geradores, a migracao, a recusa, o backup e o texto da tela. */
var FCI_CAMPOS=[
  ['chave','a chave Pix','Chave Pix'],
  ['nomer','o nome do recebedor','Nome do recebedor'],
  ['cidade','a cidade do recebedor','Cidade do recebedor'],
  ['client','o Client ID do PayPal','Client ID do PayPal'],
  ['zapnum','o WhatsApp','WhatsApp']
];
/* Padroes: nome e cidade da marca ficam preenchidos porque sao identidade PUBLICA, nao
   credencial (a mesma regra que ja os mantinha nos padroes do Link de cobranca). Chave Pix,
   Client ID e WhatsApp nascem vazios, com exemplo no placeholder -- o repositorio e publico. */
var FCI_PADRAO={chave:'',nomer:'Foto Certa',cidade:'Vitoria',client:'',zapnum:''};

/* ---- a recusa aponta o painel ----
   As abas ja recusavam gerar sem chave Pix, sem Client ID ou sem WhatsApp. O que muda e o
   ENDERECO da recusa: o campo nao esta mais na aba, e mandar o operador procurar onde ele nao
   esta seria trocar uma recusa util por uma caca ao tesouro. A frase e um sufixo unico, e e
   ela tambem que fciApontarSe reconhece para abrir o painel -- sem estado escondido entre a
   funcao que recusa e a que reage a recusa. */
var FCI_APONTA=' Este campo agora e um so para a ferramenta inteira: preencha no painel Identidade, no topo da pagina.';
function fciRecusa(t){return t+FCI_APONTA;}

/* ===== leitura do que esta guardado no navegador =====
   As duas paginas leem a MESMA chave ('fcConstrutoresIdentidade') e a mesma
   forma. Quem trata a falha e diferente em cada uma -- a ferramenta tem a barra
   vermelha, a /cobrar tem o proprio aviso --, entao o tratamento entra por
   funcao, e nao por copia da leitura.

   TRES ARGUMENTOS NA FALHA, e o terceiro e o que importa: aoFalhar(fase, erro, codigo).
     fase   frase pronta, SEM ACENTO, do jeito que a barra vermelha da ferramenta escreve;
     erro   a excecao, para o console;
     codigo 'ler' ou 'entender' -- estavel, para quem chama DECIDIR e para quem escreve
            com acento montar a propria frase.
   O codigo nasceu de dois defeitos que a frase pronta nao resolvia. Um: a /cobrar embutia
   'fase' no meio de um texto acentuado e saia "Nao deu para entender o que estava gravado --
   o conteudo salvo esta corrompido (configuracoes das abas)", acento e nao-acento na MESMA
   frase. Dois: "nao havia nada gravado" e "nao deu para ler o que estava gravado" chegavam os
   dois como null, e quem funde antes de gravar precisa distinguir -- fundir com null quando a
   leitura FALHOU apaga o que estava la. */
function fcLerJson(chave,aoFalhar){
  var raw,st;
  try{raw=localStorage.getItem(chave);}
  catch(e){if(aoFalhar)aoFalhar('ler o que estava gravado -- armazenamento do navegador indisponivel',e,'ler');return null;}
  if(!raw)return null;
  try{st=JSON.parse(raw);}
  catch(e){if(aoFalhar)aoFalhar('entender o que estava gravado -- o conteudo salvo esta corrompido',e,'entender');return null;}
  if(!st||typeof st!=='object')return null;
  return (Object.prototype.toString.call(st)==='[object Array]')?null:st;
}
/* Os cinco campos da identidade, normalizados: o que veio como texto e honrado
   (inclusive o vazio, que e escolha); o que nao veio cai no padrao. Uma
   normalizacao so, para a ferramenta escrever nos campos e a /cobrar gerar. */
function fcIdentidadeDe(ident){
  var o={},i,k,ok=!!ident&&typeof ident==='object';
  for(i=0;i<FCI_CAMPOS.length;i++){
    k=FCI_CAMPOS[i][0];
    o[k]=(ok&&typeof ident[k]==='string')?ident[k]:FCI_PADRAO[k];
  }
  return o;
}


/* ===== o valor da cobranca =====
   Aceita "1200", "1200,00", "1200.00" e "1.200,00". O separador decimal e o ULTIMO sinal que
   aparecer; o outro e agrupamento de milhar. Ponto sozinho em grupos de tres ("1.200") tambem
   e agrupamento -- sem essa regra, quem digita o milhar a brasileira cobraria R$ 1,20. */
function pValorNum(t){
  var s=String(t==null?'':t).replace(/[\s\u00A0]/g,''),ip,iv;
  if(!s)return NaN;
  s=s.replace(/^R\$/i,'');
  ip=s.lastIndexOf('.');iv=s.lastIndexOf(',');
  if(ip>=0&&iv>=0){
    if(iv>ip)s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(/,/g,'');
  }else if(iv>=0){
    s=s.replace(',','.');
  }else if(ip>=0&&/^[0-9]{1,3}(\.[0-9]{3})+$/.test(s)){
    s=s.replace(/\./g,'');
  }
  if(!/^[0-9]*\.?[0-9]+$/.test(s))return NaN;
  return Math.round(parseFloat(s)*100)/100;
}
var P_VALOR_MAX=999999.99;
/* Teto da descricao. Ela viaja INTEIRA no link, percent-encodada: sem teto, uma descricao
   colada de 3000 caracteres produzia um link de 3140 sem uma palavra de aviso -- e link
   comprido quebra em aplicativo de mensagem, em pre-visualizacao e em cliente de e-mail. O
   numero e generoso para o que a descricao e (uma linha que o cliente le no cartao) e a recusa
   diz quanto passou, em vez de cortar calada: cortar seria reescrever o que o operador esta
   lendo na tela, que e o defeito que esta aba ja recusou no valor e no identificador. */
var P_DESC_MAX=200;

/* Identificador curto: o campo 62>05 do BR Code so aceita letras e numeros, ate 25. A limpeza
   acontece A VISTA, senao o operador leria "ENSAIO-2026" na tela e conciliaria por
   "ENSAIO2026" no extrato. */
function pTxidLimpo(t){return String(t==null?'':t).replace(/[^A-Za-z0-9]/g,'').substring(0,25);}

/* ===== O DESCONTO NO PIX: uma conta so, tres blocos e duas paginas =====
   Ago/2026: subiu da aba Checkout para ca quando a aba Link de cobranca (e a /cobrar) passaram
   a oferecer desconto no Pix. O texto que fcTotalPixSrc escreve NAO mudou uma virgula na
   mudanca de arquivo -- os blocos do Checkout e da Mini loja continuam saindo byte a byte
   iguais --, e agora o bloco da pagina de cobranca leva o MESMO ramo de desconto dentro dele.
   Ele depende de duas coisas que quem o emite fornece: total() e DESCONTO_PIX. No carrinho,
   total() e a soma do pedido; na pagina de cobranca, e o total que veio no link. A conta de
   arredondamento e a mesma nos tres, e e por isso que ela nao e reescrita em lugar nenhum. */
/* As tres formas de totalPix sao mutuamente exclusivas e a escolha depende de tres
   sinalizadores -- por isso ela e uma funcao, e nao um campo. Sem Pix nao se emite nada.
   O ramo do meio e o que mais custaria repetir: com sinal ligado, o Pix cobra o SINAL, e o
   desconto do Pix nao entra porque aplica-lo sobre o sinal seria desconto dobrado (o sinal ja
   sai de um total que pode ter cupom). Quem gera zera o desconto na origem; aqui fica so a
   consequencia. */
function fcTotalPixSrc(descpix,usaPix,usaSinal){
  if(descpix>0){
    return 'function totalPix(){\n'+
           'var t=total();\n'+
           'if(DESCONTO_PIX>0)t=t*(1-DESCONTO_PIX/100);\n'+
           'return Math.round(t*100)/100;\n}\n\n';
  }
  if(usaPix&&usaSinal)return 'function totalPix(){return sinalAgora();}\n\n';
  if(usaPix)return 'function totalPix(){return Math.round(total()*100)/100;}\n\n';
  return '';
}
/* O lado da FERRAMENTA, no molde de fcPixApi: em vez de reescrever "t*(1-pct/100) arredondado
   para centavos" em JavaScript de verdade -- que seria a segunda implementacao da conta que
   decide quanto o cliente paga --, a ferramenta AVALIA o mesmo ramo de fcTotalPixSrc que o
   bloco leva dentro. total() e DESCONTO_PIX entram como argumentos. Nada digitado pelo
   operador entra nesta fonte. */
var fcDescFn=null;
function fcPixDesc(total,pct){
  if(!(pct>0))return Math.round(total*100)/100;
  if(!fcDescFn)fcDescFn=(new Function('TOTAL','DESCONTO_PIX',
    'function total(){return TOTAL;}\n'+fcTotalPixSrc(1,true,false)+'return totalPix();'));
  return fcDescFn(total,pct);
}
/* Teto do percentual, o mesmo do campo do Checkout (max="90"). Acima disso o desconto deixa de
   ser desconto: 100% seria um Pix de valor zero, que e exatamente o que estas abas existem para
   impedir. */
var P_DESC_PCT_MAX=90;
/* O percentual desta cobranca, normalizado, e a UNICA porta por onde ele entra nas duas
   paginas. Vazio, zero, negativo e ilegivel sao a MESMA coisa aqui -- sem desconto --, e e por
   isso que "sem desconto" nao tem como sair diferente de um lado e do outro: o numero que vai
   no link e String() deste retorno, nos dois. */
function fcDescNum(t){
  var n=parseFloat(String(t==null?'':t).replace(',','.'));
  if(!isFinite(n)||n<=0)return 0;
  return n>P_DESC_PCT_MAX?P_DESC_PCT_MAX:n;
}

/* ===== correcao a vista: a PARTE PURA =====
   A ferramenta e a /cobrar tinham, cada uma, a sua versao das mesmas quatro regras -- o trim
   (fciVal / cbTrim), o valor (pValorAjustar / cbValorAjustar), o identificador (pTxidAjustar /
   cbTxidAjustar) e a chave Pix (fcPixChaveAjustar / cbChaveAjustar). Nenhuma divergia em bytes,
   mas as quatro decidem o que o operador LE na tela antes de mandar o link, e e ai que divergir
   custa caro. O argumento "toca o DOM" nao segura a duplicacao: o molde certo ja existia no
   proprio projeto -- pValDia le o campo e chama fcValDia, que e puro. As quatro passaram para
   o mesmo molde.
   CONTRATO DE TODAS: recebem o TEXTO do campo e devolvem o texto corrigido, ou null quando nao
   ha nada a corrigir. Quem toca o DOM sao as duas paginas, cada uma com o seu involucro. */
function fcTrim(s){return String(s==null?'':s).replace(/^\s+/,'').replace(/\s+$/,'');}
/* Valor: campo vazio nao se corrige, e valor que NAO da para interpretar fica como esta --
   reescrever o que nao se entendeu seria assumir, e quem recusa com nome e a geracao. */
function fcValorCorrigido(v){
  var s=String(v==null?'':v),n;
  if(!s.replace(/\s/g,''))return null;
  n=pValorNum(s);
  if(isNaN(n)||n<=0||n>P_VALOR_MAX)return null;
  n=n.toFixed(2).replace('.',',');
  return (n===s)?null:n;
}
function fcTxidCorrigido(v){
  var s=String(v==null?'':v),novo=pTxidLimpo(s);
  return (novo===s)?null:novo;
}
function fcChaveCorrigida(v){
  var s=String(v==null?'':v),novo=pixLimpar(s);
  return (novo===s)?null:novo;
}
/* Percentual do desconto no Pix, pelo mesmo contrato. Campo VAZIO nao se corrige: vazio ja
   significa "sem desconto" e escrever "0" ali seria reescrever, a toa, um campo que o operador
   deixou em branco de proposito. O que se corrige e o que fcDescNum aparou -- 95 virando 90,
   -3 virando 0 --, e ele se corrige NA TELA justamente para o operador nao ler 95 e mandar um
   link de 90: prender so por dentro conserta a saida e mente para quem esta olhando. */
function fcDescCorrigido(v){
  var s=String(v==null?'':v),novo;
  if(!s.replace(/\s/g,''))return null;
  novo=String(fcDescNum(s));
  return (novo===s)?null:novo;
}

/* ===== nome e cidade do recebedor: o que o BANCO DE QUEM PAGA vai mostrar =====
   Os campos 59 e 60 do BR Code tem teto (25 e 15) e so aceitam ASCII sem acento -- e quem
   aplica isso e semAcento, dentro de montarPayload. Enquanto o teto morava so no maxlength do
   <input> da ferramenta, um nome guardado maior (vindo da migracao, de um backup ou da outra
   pagina) era CORTADO em silencio: medido, "Fotografia Luciano Pacheco Ltda ME" virava
   "Fotografia Luciano Pachec" dentro do payload enquanto a tela seguia mostrando o texto
   inteiro. O selo fecha do mesmo jeito, entao nada quebra -- o que se falseia e o RECEBEDOR no
   aplicativo de quem paga, que e pior do que quebrar.
   fcPixTexto e a verdade (o que vai no payload) e serve as linhas que dizem "Recebendo em...".
   fcPixTextoCorrigido e o involucro do contrato acima, com uma guarda: se a normalizacao
   ESVAZIAR um campo que tinha algo (nome escrito so em caracteres que o BR Code nao aceita),
   ela devolve null e o campo fica como esta. Esvaziar mudaria a recusa de uma pagina so, e as
   duas paginas tem de recusar a mesma entrada com a mesma palavra. */
var FC_NOMER_MAX=25, FC_CIDADE_MAX=15;
function fcPixTexto(v,max){return fcPixApi().semAcento(String(v==null?'':v),max);}
function fcPixTextoCorrigido(v,max){
  var s=String(v==null?'':v),novo=fcPixTexto(s,max);
  if(!novo&&s)return null;
  return (novo===s)?null:novo;
}

/* ===== Endereco da pagina de pagamento: INTEIRO, e a razao =====
   Ate ago/2026 este campo aceitava as duas formas -- endereco completo OU caminho do proprio
   site ("/pagar") --, e o padrao de fabrica era o caminho. Funcionava DENTRO do site e nao
   funcionava no unico lugar onde o link e usado: colado numa conversa de WhatsApp, "/pagar"
   nao leva a lugar nenhum. Na pratica o dono montava o prefixo a mao a cada cobranca, que e
   exatamente o trabalho que a /cobrar existe para eliminar.
   Entao o campo passou a EXIGIR o endereco inteiro. Aceitar as duas formas e recusar so na
   hora de colar seria manter o incomodo e mover a descoberta para depois do envio -- e aceitar
   em silencio foi o que produziu o incomodo. Aqui a recusa acontece antes do link existir.
   Mesma urlLimpa de cUrlOk e tUrlOk: o teste enxerga o endereco que o navegador resolveria.
   A autoridade tem de existir ("https://" sozinho nao passa), pelo mesmo motivo de sempre --
   um endereco pela metade e um link quebrado com cara de link. */
function pUrlOk(v){
  var limpo=urlLimpa(v);
  if(!limpo)return false;
  return /^https?:\/\/[^\/?#]+/i.test(limpo);
}
/* "Isto e um caminho do proprio site?" -- a forma que ANTES era aceita, e que por isso merece
   recusa com nome proprio em vez de cair no "nao entendi": quem tem "/pagar" guardado nao
   digitou nada errado, ele digitou o que a ferramenta pedia ate ontem. */
function fcUrlRelativo(v){
  var limpo=urlLimpa(v);
  if(!limpo)return false;
  if(/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(limpo))return false;
  return limpo.charAt(0)==='/'&&limpo.charAt(1)!=='/';
}
var FC_URL_EXEMPLO='https://www.fotocerta.com.br/pagar';
/* As TRES recusas do endereco, numa funcao so, para as duas paginas recusarem a mesma entrada
   com a mesma palavra. Elas sao tres e nao uma porque descrevem situacoes diferentes, e uma
   recusa que nao nomeia o defeito manda o operador procurar no lugar errado. */
function pUrlRecusa(v){
  var s=String(v==null?'':v);
  if(!s.replace(/\s/g,''))return 'Informe o endereco da pagina de pagamento, e ele precisa ser o endereco INTEIRO: com https:// e o dominio (exemplo: '+FC_URL_EXEMPLO+'). O link desta cobranca vai colado numa conversa, fora do site, e ali um endereco pela metade nao leva a lugar nenhum.';
  if(fcUrlRelativo(s))return 'O endereco da pagina de pagamento esta escrito como caminho do proprio site ("'+s+'"). Isso funciona dentro do site e NAO funciona no WhatsApp: colado numa conversa, "'+s+'" nao abre nada. Escreva o endereco INTEIRO, com https:// e o dominio (exemplo: '+FC_URL_EXEMPLO+'). Nenhum link foi gerado.';
  if(!pUrlOk(s))return 'Nao entendi o endereco da pagina de pagamento ("'+s+'"). Ele precisa ser um endereco INTEIRO, comecando com http:// ou https:// e trazendo o dominio do site (exemplo: '+FC_URL_EXEMPLO+'). Nenhum link foi gerado.';
  return '';
}
/* ---- a MIGRACAO do que ja estava guardado: avisa, nunca sobrescreve ----
   O valor guardado neste navegador (ou vindo de um backup, ou da outra pagina) pode ser o
   "/pagar" de fabrica. Trocar por conta propria e impossivel de fazer certo: a ferramenta NAO
   SABE qual e o dominio do dono -- ela nunca soube, e chutar "www.fotocerta.com.br" seria
   escrever uma credencial de destino no lugar dele. Entao o campo fica exatamente como estava,
   com um aviso a vista, e quem completa e o dono. Trocar em silencio um endereco que o operador
   esta lendo na tela e a classe de defeito que este projeto ja recusou no valor, no
   identificador e no limiar de urgencia. */
function fcUrlAvisoMigracao(v){
  if(!fcUrlRelativo(v))return '';
  return 'O endereco da pagina de pagamento guardado aqui e um caminho do proprio site ("'+String(v)+'"), e ele nao serve mais: o link precisa do endereco INTEIRO para funcionar colado numa conversa de WhatsApp. Nada foi trocado sozinho -- a ferramenta nao sabe qual e o seu dominio. Complete o campo com https:// e o dominio (exemplo: '+FC_URL_EXEMPLO+').';
}

/* Lista de permissao do link de cobranca do PayPal. O endereco viaja NO LINK, entao ele e
   escolhido por quem monta o link -- e um link de pagamento apontando para outro lugar e um
   desvio de dinheiro com a cara da pagina do dono. Igualdade EXATA da autoridade inteira
   (tudo entre o esquema e a primeira barra), a mesma regra de S_HOSTS_ALBOOM: e a autoridade
   inteira que recusa "usuario@host", porta e host vazio, e comparar por sufixo aceitaria
   "evil-paypal.com". */
var P_PP_HOSTS=['www.paypal.com','paypal.com','www.paypal.me','paypal.me'];
/* O VALIDADOR TAMBEM E UM SO, e nao apenas a lista. Ate esta correcao a ferramenta validava
   com urlLimpa (que TIRA controle e troca "\" por "/") enquanto o bloco entregue validava o
   texto CRU (recusando "\" e tudo abaixo de espaco). A lista era a mesma, o validador nao, e
   o que viaja no link e o valor cru -- entao a ferramenta dizia sim e a pagina dizia nao.
   Medido de ponta a ponta, com o link gerado aberto num quadro rodando o bloco entregue:

     https://www.paypal.com\@evil.com/x   ferramenta aceita  ->  pagina sem botao
     https://www.pay pal.com/ncp/ABC      ferramenta aceita  ->  pagina sem botao
     https://www.paypal.com/ncp/AB<TAB>C  ferramenta aceita  ->  pagina sem botao

   Nos tres a secao "PayPal, cartao de credito ou debito" saia com NADA embaixo. O gatilho e
   banal -- colar de PDF ou de e-mail traz espaco, quebra ou tabulacao no meio --, e o preco e
   o cliente ficar sem meio de pagamento numa pagina de cobranca, sem o operador ter sido
   avisado de nada.
   O conserto e o mesmo padrao de FC_PIX_SRC: a funcao existe UMA vez, como texto. A ferramenta
   AVALIA esse texto (new Function sobre literal do arquivo, sem nada digitado pelo operador) e
   o bloco leva o MESMO texto dentro. Nao ha como um lado aceitar o que o outro recusa, porque
   e a mesma funcao rodando sobre o mesmo texto cru.
   Espaco nas PONTAS nao chega aqui: pCfg ja faz .trim() no campo. O que se recusa e o
   invisivel no MEIO -- mesma divisao por posicao da chave Pix. */
var P_PP_SRC=
"function paypalLinkOk(u){\n"+
"  var s=String(u||''),resto,corte,aut,i;\n"+
"  if(/[\\u0000-\\u0020\\\\]/.test(s))return false;\n"+
"  if(!/^https:\\/\\//i.test(s))return false;\n"+
"  resto=s.substring(8);\n"+
"  corte=resto.search(/[\\/?#]/);\n"+
"  aut=(corte<0?resto:resto.substring(0,corte)).toLowerCase();\n"+
"  for(i=0;i<PAYPAL_HOSTS.length;i++)if(aut===PAYPAL_HOSTS[i])return true;\n"+
"  return false;\n"+
"}\n";
var pPpFn=null;
function pPpHostOk(v){
  if(!pPpFn)pPpFn=(new Function('PAYPAL_HOSTS',P_PP_SRC+'return paypalLinkOk;'))(P_PP_HOSTS);
  return pPpFn(v);
}

/* ===== O SELO DO LINK, E O PRAZO =====
   O QUE O SELO E. Uma conta sobre TODOS os parametros do endereco, na ordem em que eles saem
   nele. Alterar qualquer um faz a conta nao fechar e a pagina recusa. E OBRIGATORIO: se ele
   fosse opcional bastaria apaga-lo do endereco para burlar.

   O SELO NAO E SEGREDO, e esta escrito assim na aba e nas instrucoes. Quem abrir o codigo-fonte
   desta pagina le a regra e sabe recalcular. Ele impede a EDICAO de um link existente, nao a
   forja de um link novo -- e nao ha como ser diferente sem um segredo que o cliente nao leia,
   ou seja, um servidor, que este projeto nao tem por decisao. Nao e "seguranca"; e um selo.

   O QUE ELE CONSERTA. Ate ele existir, tres parametros do link eram editaveis em silencio:
   a DESCRICAO (cosmetica, mas mentirosa), o PP (a unica porta do link que leva dinheiro para
   FORA -- so se exigia dele continuar sendo um endereco do PayPal, entao aceitava a cobranca de
   OUTRA conta) e agora o V. O C ja era protegido pelo CRC e pela remontagem, e continua sendo:
   o selo e a primeira conferencia, nao a unica.

   POR QUE crc16 E NAO OUTRO HASH. A regra do projeto e nao inventar funcao de hash, e havia
   duas candidatas ja no arquivo: o crc16 de FC_PIX_SRC e o djb2 de mAssinatura (a assinatura do
   catalogo da loja). crc16 ganha por tres motivos, nesta ordem:
     1. Ele JA ESTA dentro deste bloco -- pJs emite FC_PIX_SRC.crc16 para conferir o BR Code.
        O selo custa zero byte de funcao nova no bloco entregue.
     2. Ele JA E fonte unica literal, no formato que esta aba precisa: a ferramenta o AVALIA
        (fcPixApi) a partir do mesmo texto que o bloco leva dentro. O djb2 e uma funcao comum
        da ferramenta -- o bloco da loja recebe o RESULTADO dela, nunca a funcao. Usa-lo aqui
        exigiria transcreve-lo para fonte literal, que e criar uma segunda copia de um hash.
     3. CRC-16 e desenhado exatamente para o caso desta spec: detectar alteracao PEQUENA. Um
        caractere trocado na descricao, um digito na data, um "1" a menos no valor.
   O limite dito sem exagero: sao 16 bits, entao uma alteracao ALEATORIA passaria uma vez em
   65.536. Isso nao muda o modelo de risco, porque quem edita um link nao edita ao acaso -- e
   quem edita de proposito le a regra e recalcula, com 16 bits ou com 256. O texto da aba passou
   a dizer esse limite tambem: a frase de la era absoluta ("mexer em qualquer um deles faz a
   conta nao fechar") e o operador nao tinha como ler a ressalva, que so existia aqui.

   O BYTE ALTO, e por que a serializacao e que foi consertada. crc16 alimenta o registrador com
   charCodeAt(i)<<8, o que descarta os 8 bits ALTOS de cada caractere: medido, crc16('c-cedilha')
   e crc16('g-caron') davam o MESMO selo, e uma descricao trocada de "Ensaio de gestante" para
   uma sosia acentuada passava pela pagina publicada com o selo original. Isso nao e a estatistica
   de 1/65.536 -- e uma classe inteira de edicao VISIVEL passando.
   O crc16 NAO PODE MUDAR: ele calcula o CRC do BR Code do Pix e tem de continuar sendo o
   CRC-16/CCITT-FALSE padrao, byte a byte, ou todo payload gerado nesta ferramenta deixa de
   fechar no aplicativo do banco. Entao quem mudou foi a SERIALIZACAO do selo: seloBytes quebra
   cada caractere nos seus dois bytes (alto e baixo) ANTES de chamar crc16, e os dois entram na
   conta. crc16 continua vendo so bytes -- que agora sao todos os bytes.

   FONTE UNICA, no padrao de FC_PIX_SRC: as cinco funcoes existem UMA vez, como texto. A
   ferramenta as avalia (pSeloApi) e o bloco leva o MESMO texto. Selo calculado de um jeito aqui
   e conferido de outro la produziria link que a propria pagina do dono recusa -- a duplicacao
   se vingando no pior lugar possivel.

   O PRAZO. A data viaja como NUMERO DE DIAS desde 1970-01-01, em base 36: tres ou quatro
   caracteres (a partir do dia 46.656, set/2097, sao quatro), e nao legivel a olho no endereco
   (pedido do dono; e conveniencia visual, nao protecao -- o que protege e o selo). O teto de
   47.481 dias e EXATAMENTE o max="2099-12-31" do campo da aba: antes eram 200.000 dias
   (ago/2517), entao o campo recusava uma data que a pagina aceitaria, e a recusa "longe demais"
   da ferramenta so disparava quase 500 anos depois do que o campo permite. Um teto so, nos dois
   lados. O fim do prazo e 23:59:59.999 do dia escolhido no fuso de BRASILIA (-3,
   sem horario de verao desde 2019), o mesmo fuso fixo da Contagem regressiva: sem isso um
   cliente viajando veria outro prazo. A comparacao e feita em milissegundos desde a epoca, que
   nao dependem do fuso do aparelho -- so do RELOGIO dele, e isso e um limite declarado. */
/* ===== O SELO E O DESCONTO: por que a fonte e PARAMETRIZADA, e nao duplicada =====
   Com desconto no Pix o endereco ganha dois parametros -- t (o total, que o PayPal cobra) e x
   (o percentual) -- e os dois precisam entrar na conta do selo, senao a unica coisa que o
   desconto acrescentaria ao link seria uma porta nova para editar.
   O PROBLEMA: um selo de arita fixa em SEIS mudaria a conta de TODO link, inclusive dos que nao
   tem desconto -- e isso derrubaria, sem ganho nenhum, todas as cobrancas ja enviadas e o bloco
   ja colado na /pagar (que nao e versionado e confere do jeito que estava no dia da colagem).
   A REGRA ADOTADA: os quatro de sempre contam SEMPRE, na ordem de sempre; t e x entram DEPOIS
   deles e SO quando pelo menos um dos dois vem preenchido. Disso saem quatro propriedades, e as
   quatro sao verificaveis:
     1. link sem desconto sela EXATAMENTE como antes -- byte a byte;
     2. um bloco com a conta nova aceita os links antigos (a conta e um superconjunto);
     3. apagar o t, ou o x, ou os dois, muda a contagem e derruba o link;
     4. acrescentar t e x a um link que nao os tinha tambem derruba.
   Os dois entram JUNTOS -- se um deles vem, os dois contam, mesmo vazio -- de proposito: com
   entrada condicional independente, "t=10 sem x" e "x=10 sem t" produziriam a MESMA lista e o
   mesmo selo. Sao dois parametros que so fazem sentido em par, e a conta os trata como par.
   A FONTE E UMA SO, parametrizada: nao existem duas seloDe escritas por extenso para divergir.
   A serializacao, o laco e o crc16 sao os mesmos objetos de texto nos dois casos; o que o
   parametro decide sao a assinatura e as duas linhas do par. O bloco leva o texto que
   pSeloSrc(comDesc) devolve, e a ferramenta AVALIA esse mesmo texto (pSeloApi(comDesc)). */
function pSeloDeSrc(comDesc){
  return "function seloDe(pc,pd,pp,pv"+(comDesc?",pt,px":"")+"){\n"+
    "  var ps=[pc,pd,pp,pv],t='',i,s"+(comDesc?",a,b":"")+";\n"+
    (comDesc?"  a=String(pt==null?'':pt);b=String(px==null?'':px);\n  if(a!==''||b!==''){ps.push(a);ps.push(b);}\n":"")+
    "  for(i=0;i<ps.length;i++){s=String(ps[i]==null?'':ps[i]);t+=s.length+':'+s+'|';}\n"+
    "  return crc16(seloBytes(t));\n"+
    "}\n";
}
function pSeloSrc(comDesc){return P_SELO_ANTES+pSeloDeSrc(comDesc)+P_SELO_DEPOIS;}
var P_SELO_ANTES=
"function seloBytes(s){\n"+
"  var o='',i,c;\n"+
"  for(i=0;i<s.length;i++){c=s.charCodeAt(i);o+=String.fromCharCode((c>>8)&255,c&255);}\n"+
"  return o;\n"+
"}\n";
var P_SELO_DEPOIS=
"function prazoDia(pv){\n"+
"  var s=String(pv||''),d;\n"+
"  if(!/^[0-9a-z]+$/.test(s))return -1;\n"+
"  d=parseInt(s,36);\n"+
"  if(!isFinite(d)||d<1||d>47481)return -1;\n"+
"  return d;\n"+
"}\n"+
"function prazoFim(dia){\n"+
"  return (dia+1)*86400000+10800000-1;\n"+
"}\n"+
"function prazoTexto(dia){\n"+
"  var dt=new Date(dia*86400000),dd=dt.getUTCDate(),mm=dt.getUTCMonth()+1;\n"+
"  return (dd<10?'0':'')+dd+'/'+(mm<10?'0':'')+mm+'/'+dt.getUTCFullYear();\n"+
"}\n\n";
/* O lado da FERRAMENTA: as mesmas cinco funcoes, avaliadas a partir do mesmo texto, e sobre o
   MESMO crc16 que o bloco usa. Nada digitado pelo operador entra nesta fonte.
   DUAS CAIXAS, e nao uma: comDesc decide qual TEXTO e avaliado, e o texto avaliado e sempre o
   que o bloco daquela configuracao leva dentro. Avaliar sempre a versao de seis e comparar
   daria o mesmo numero (a de seis com t e x vazios e identica a de quatro), mas seria a
   ferramenta rodando um codigo que o bloco nao tem -- e a regra deste arquivo e o contrario
   disso. As funcoes de prazo sao as mesmas nas duas caixas. */
var pSeloFns={};
function pSeloApi(comDesc){
  var k=comDesc?'d':'s';
  if(!pSeloFns[k])pSeloFns[k]=(new Function(FC_PIX_SRC.crc16+pSeloSrc(!!comDesc)+
    'return {seloDe:seloDe,prazoDia:prazoDia,prazoFim:prazoFim,prazoTexto:prazoTexto};'))();
  return pSeloFns[k];
}
/* A data escolhida, em numero de dias desde 1970-01-01.
   Date.UTC evita o fuso do computador do operador: "2026-08-25" e o dia civil 2026-08-25, e nao
   um instante. A releitura por getUTC* recusa data impossivel (31/02) que algum navegador
   deixasse passar no campo.

   O SENTINELA NAO PODE SER UM DIA POSSIVEL, e era. Ate esta rodada, "nao ha data" valia -1 --
   que e tambem o numero de dias de 31/12/1969. Pior: como -1 e "ilegivel" e as guardas testavam
   <0 e >0, o dia ZERO (01/01/1970) nao caia em nenhuma das duas. Medido: campo mostrando
   1970-01-01, link gerado SEM &v=, sem alerta nenhum -- um dia so, mas exatamente a classe
   "mudar em silencio um numero que o operador esta lendo na tela". Agora o sentinela e um
   numero que nenhuma data escrevivel produz, e QUALQUER dia legivel passa pelas guardas. */
var P_VAL_NADA=-1e9;

/* ===== a data escolhida, em numero de dias desde 1970-01-01 =====
   A PARTE PURA de pValDia: as duas paginas leem a data de um campo proprio
   (p-validade na ferramenta, c-validade na /cobrar) e passam o TEXTO para ca.
   Date.UTC evita o fuso do computador do operador: "2026-08-25" e o dia civil
   2026-08-25, e nao um instante. A releitura por getUTC* recusa data impossivel
   (31/02) que algum navegador deixasse passar no campo. */
function fcValDia(texto){
  var m=/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(String(texto||''));
  if(!m)return P_VAL_NADA;
  var y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]),ms=Date.UTC(y,mo-1,d),dt;
  if(!isFinite(ms))return P_VAL_NADA;
  dt=new Date(ms);
  if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==mo-1||dt.getUTCDate()!==d)return P_VAL_NADA;
  return Math.round(ms/86400000);
}


function pValCod(cfg){return cfg.valdia===P_VAL_NADA?'':cfg.valdia.toString(36);}
/* A data por extenso, para as MENSAGENS DE RECUSA. Uma so formatacao: as duas recusas de data
   falavam linguas diferentes -- uma citava a data crua do campo ("2517-12-31") e a outra a data
   formatada ("20/08/2026") --, e o operador lia duas grafias do mesmo campo. */
function pValTexto(cfg){
  if(cfg.valdia===P_VAL_NADA)return String(cfg.valbruto);
  return pSeloApi().prazoTexto(cfg.valdia);
}

/* ===== as guardas, sem efeito colateral =====
   Separadas em duas porque as duas saidas tem vidas diferentes: o BLOCO nao sabe nada da
   cobranca, entao gerar o bloco nao pode exigir descricao nem valor; e o LINK precisa das
   duas coisas. Nenhuma das duas mexe no DOM -- a previa roda a cada tecla e nao pode
   reescrever campo nenhum; a correcao a vista e dos botoes, que sao gesto do operador. */
function pRecusaBloco(cfg){
  var erroChave=pixChaveErro(cfg.chave,cfg.chaveBruta);
  if(erroChave)return erroChave;
  if(!cfg.chave||!cfg.nomer||!cfg.cidade)return fciRecusa('Preencha a chave Pix, o nome do recebedor e a cidade. Sao eles que a pagina usa para conferir se um link de cobranca e mesmo seu.');
  if(cfg.usapp&&!cfg.client)return fciRecusa('Informe o Client ID do PayPal, ou marque "Nao -- so Pix" em PayPal.');
  if(cfg.zap&&!cfg.zapnum)return fciRecusa('Informe o numero do WhatsApp de destino, ou desligue o botao "Ja paguei".');
  return '';
}
function pRecusaCobranca(cfg){
  var r=pRecusaBloco(cfg);
  if(r)return r;
  /* O ENDERECO INTEIRO: as tres recusas moram em pUrlRecusa, e as duas paginas usam a mesma. */
  var erroUrl=pUrlRecusa(cfg.url);
  if(erroUrl)return erroUrl;
  if(!String(cfg.desc).replace(/\s/g,''))return 'Escreva a descricao do que esta sendo cobrado. E o que o cliente le na pagina e o que volta na mensagem do WhatsApp.';
  /* Caractere que NAO CABE num endereco. encodeURIComponent LANCA (URIError) diante de uma
     metade solta de par substituto -- o que acontece quando um emoji e cortado ao meio numa
     copia entre aplicativos. Sem esta guarda, o erro subia de pBusca e derrubava as duas saidas
     EM SILENCIO: medido, "Gerar link" nao fazia nada e nao avisava, e a previa ficava parada no
     quadro anterior, mostrando a descricao ANTIGA ao lado do campo novo. Falha muda no caminho
     principal da aba, que e a classe que este projeto mais recusa. */
  if(!pEncOk(cfg.desc))return 'A descricao tem um caractere que o link nao consegue carregar. Costuma ser um emoji que chegou pela metade ao copiar de outro aplicativo, e ele pode estar invisivel na tela. Apague a descricao e digite de novo. Nenhum link foi gerado.';
  if(String(cfg.desc).length>P_DESC_MAX)return 'A descricao tem '+String(cfg.desc).length+' caracteres e o limite e '+P_DESC_MAX+'. Ela viaja inteira dentro do link, e link comprido quebra em aplicativo de mensagem e em cliente de e-mail. Resuma para uma linha -- o detalhe do combinado voce conta na conversa.';
  if(!String(cfg.valorBruto).replace(/\s/g,''))return 'Informe o valor da cobranca. Um codigo Pix sem valor deixa o pagador digitar o que quiser -- que e exatamente o que esta aba existe para impedir.';
  if(isNaN(cfg.valor))return 'Nao entendi o valor "'+cfg.valorBruto+'". Escreva so o numero, com virgula ou ponto nos centavos: 1200 ou 1200,00.';
  /* Valor que o operador entendeu, mas que arredonda para zero (0,004). Dizer "nao entendi"
     aqui seria mentira: a ferramenta entendeu, e o problema e outro -- e o operador ficaria
     conferindo a grafia de um numero que esta escrito certo. */
  if(cfg.valor<=0)return 'O valor "'+cfg.valorBruto+'" arredonda para zero. O Pix cobra em centavos, entao o minimo e R$ 0,01. Um codigo Pix com valor zero deixa o pagador digitar o que quiser -- que e exatamente o que esta aba existe para impedir.';
  if(cfg.valor>P_VALOR_MAX)return 'O valor passa de '+precoFmt('BRL',P_VALOR_MAX)+'. Confira se nao sobrou um zero.';
  /* O DESCONTO NO PIX. Ele e opcional: campo vazio ou zero = link sem desconto, exatamente como
     antes de ele existir. O que se recusa e o desconto que derruba o Pix abaixo de um centavo --
     o Pix cobra em centavos, e um payload de valor zero nem passaria na propria conferencia
     (pConferir), com uma frase que falaria do codigo montado em vez de falar do desconto. O
     defeito mais especifico e o que deve ser nomeado. */
  if(pDescPct(cfg)>0&&pValorPix(cfg)<0.01)return 'O desconto de '+pDescPct(cfg)+'% derruba o valor do Pix para menos de um centavo (o total e '+precoFmt('BRL',cfg.valor)+'). O Pix cobra em centavos, entao o minimo e R$ 0,01: escolha um desconto menor ou um valor maior.';
  /* A validade e opcional: campo vazio = link sem prazo, como antes de ela existir. O que se
     recusa e data que a ferramenta nao entendeu, e data JA VENCIDA -- um link que nasce
     vencido chega ao cliente como uma pagina que nao mostra o pagamento, e o operador so
     descobre pelo cliente. Aqui o relogio consultado e o do PROPRIO operador, que e o mesmo
     limite declarado do outro lado: sem servidor, a hora vem sempre de um aparelho. */
  if(String(cfg.valbruto).replace(/\s/g,'')&&cfg.valdia===P_VAL_NADA)return 'Nao entendi a data "'+cfg.valbruto+'" em "Valido ate". Escolha uma data no calendario do campo, ou apague o campo para gerar um link sem prazo.';
  /* A ORDEM DAS DUAS RECUSAS importa, e e esta: primeiro "ja passou", depois "longe demais".
     Data no passado tambem esta fora da faixa que prazoDia le (01/01/1970 e o dia zero, e a
     faixa comeca no dia 1), e se a faixa fosse conferida antes, 01/01/1970 sairia com a recusa
     "longe demais" -- que e falsa, e mandaria o operador procurar um digito a mais no ano de
     uma data que ele digitou inteira. Vencida primeiro, e sobra para "longe demais" so o que e
     mesmo longe: data FUTURA alem de 31/12/2099. */
  if(cfg.valdia!==P_VAL_NADA&&(new Date()).getTime()>pSeloApi().prazoFim(cfg.valdia))return 'A data "Valido ate" ('+pValTexto(cfg)+') ja passou. O link nasceria vencido: o cliente abriria a pagina e ela nao mostraria o pagamento. Escolha hoje ou uma data adiante, ou apague o campo para gerar um link sem prazo.';
  /* A ida e volta pela MESMA prazoDia que a pagina publicada roda. Sem ela, uma data absurda
     (ano 9999, digitada por engano num campo de data) sairia daqui num link que a propria
     pagina do dono recusaria -- a divergencia "a ferramenta diz sim e a pagina diz nao" que
     esta aba ja pagou uma vez, no endereco do PayPal. */
  if(cfg.valdia!==P_VAL_NADA&&pSeloApi().prazoDia(pValCod(cfg))!==cfg.valdia)return 'A data "Valido ate" ('+pValTexto(cfg)+') esta longe demais: a pagina de pagamento so sabe ler prazos ate 31/12/2099, e recusaria este link. Confira se nao sobrou um digito no ano. Escolha uma data mais proxima, ou apague o campo para gerar um link sem prazo.';
  if(cfg.ppmodo==='link'&&!cfg.pplink)return 'Cole o endereco do link de cobranca criado no PayPal, ou escolha outro modo de PayPal para esta cobranca.';
  if(cfg.ppmodo==='link'&&!pEncOk(cfg.pplink))return 'O endereco do PayPal tem um caractere que o link nao consegue carregar, e ele pode estar invisivel na tela. Apague o campo e cole o endereco de novo. Nenhum link foi gerado.';
  if(cfg.ppmodo==='link'&&!pPpHostOk(cfg.pplink))return 'O link de cobranca do PayPal precisa comecar com https:// e ser de um endereco do proprio PayPal ('+P_PP_HOSTS.join(', ')+'). Um link de pagamento apontando para outro lugar e dinheiro indo para outro lugar.\n\nEspaco, quebra de linha, tabulacao ou barra invertida NO MEIO do endereco tambem sao recusados, e podem estar invisiveis: costumam vir junto ao copiar de um PDF ou de um e-mail. Se o endereco parece certo, apague e digite de novo. Esta e a mesma conferencia que a pagina publicada faz -- se ela passasse aqui e falhasse la, o cliente e que ficaria sem o botao.';
  return '';
}

/* ===== o codigo Pix desta cobranca =====
   Monta pelo MESMO caminho do carrinho publicado: fcPixApi avalia a fonte unica FC_PIX_SRC, a
   mesma que os dois blocos entregues levam dentro. Nao ha uma segunda montagem de payload
   nesta ferramenta -- nem podia haver, porque e o payload que carrega o valor. */
/* ===== os DOIS valores desta cobranca, e onde cada um mora =====
   Sem desconto existe UM valor, e ele mora dentro do codigo Pix -- foi essa decisao que fez
   tela, Pix e PayPal nao terem como divergir. Com desconto passam a existir dois: o TOTAL (que
   o PayPal cobra, e que viaja no parametro t, coberto pelo selo) e o VALOR DO PIX (que continua
   morando dentro do codigo Pix, e de lugar nenhum mais).
   Nao sao duas contas independentes: pValorPix e feita AQUI e RECONFERIDA na pagina, pela mesma
   fcTotalPixSrc que o bloco leva dentro. E o mesmo principio que ja faz a /pagar remontar o
   payload com os dados do recebedor e exigir igualdade byte a byte.
   Sem desconto, pValorPix devolve cfg.valor arredondado a centavos -- que e o que cfg.valor ja
   e (pValorNum arredonda) --, entao o payload sai identico ao de antes do desconto existir. */
function pDescPct(cfg){return fcDescNum(cfg&&cfg.descpix);}
function pValorPix(cfg){return fcPixDesc(cfg.valor,pDescPct(cfg));}
/* Os dois parametros novos do endereco, na forma EXATA em que viajam nele -- e a mesma forma
   que entra na conta do selo. Vazios quando nao ha desconto, e e por isso que o link sem
   desconto continua sendo o de antes. */
function pTotCod(cfg){return pDescPct(cfg)>0?cfg.valor.toFixed(2):'';}
function pDescCod(cfg){return pDescPct(cfg)>0?String(pDescPct(cfg)):'';}
function pPayload(cfg){
  return fcPixApi().montar(cfg.chave,cfg.nomer,cfg.cidade,cfg.txid)(pValorPix(cfg));
}
/* A conferencia que o gerador faz em cima do que ele mesmo produziu. Parece redundante e nao
   e: e ela que garante que NENHUM link saia daqui sem o campo 54, com o campo 54 ilegivel, ou
   com um valor diferente do que o operador digitou. Roda a MESMA pixLer que a pagina publicada
   vai rodar, entao o que passa aqui passa la. */
function pConferir(cfg,codigo){
  var api=fcPixApi(),lido=api.pixLer(codigo),alvo=pValorPix(cfg);
  if(!lido.ok)return 'O codigo Pix montado para esta cobranca nao passou na propria conferencia ('+lido.erro+'). Nenhum link foi gerado. Confira a chave, o nome e a cidade.';
  /* COM DESCONTO, o alvo e o valor JA DESCONTADO -- e o que vai dentro do codigo Pix. Comparar
     com o total aqui recusaria toda cobranca com desconto; comparar com o desconto sem dizer
     isso ao operador faria a frase mentir sobre qual numero nao bateu. */
  if(Math.abs(lido.valor-alvo)>0.0001)return 'O valor dentro do codigo Pix ('+precoFmt('BRL',lido.valor)+') nao bate com o valor que esta cobranca cobra no Pix ('+precoFmt('BRL',alvo)+'). Nenhum link foi gerado.';
  return '';
}
/* ===== a consulta do link: UMA montagem =====
   Ate o selo existir, esta consulta era montada em DOIS lugares -- pLinkDe (o link entregue) e
   pPvBusca (o endereco simulado da previa) --, com uma diferenca miuda entre eles no campo pp.
   Nao dava defeito porque nada dependia da igualdade; com o selo, dependeria tudo: uma previa
   selando parametros diferentes dos do link mostraria "funciona" para um link que a pagina
   recusa. Entao a montagem passou a ser uma so, e o selo e calculado dentro dela.
   A ORDEM importa e e esta: c, d, pp, v, e o selo por ultimo. Os dois lados contam na mesma
   ordem; pp e v entram vazios no selo quando nao vao no endereco, e e por isso que APAGAR um
   parametro do link tambem quebra a conta. */
function pPpParam(cfg){
  if(cfg.ppmodo==='link')return cfg.pplink;
  if(cfg.ppmodo==='nao')return 'nao';
  return '';
}
/* "Este texto cabe num endereco?" -- a pergunta que pRecusaCobranca faz ANTES de pBusca rodar.
   Um try/catch e a unica resposta honesta: quem decide e o proprio encodeURIComponent, e nao uma
   segunda regra escrita aqui sobre pares substitutos, que poderia discordar dele. */
function pEncOk(s){
  try{encodeURIComponent(String(s==null?'':s));return true;}catch(e){return false;}
}
function pBusca(cfg,codigo){
  var pp=pPpParam(cfg),v=pValCod(cfg),t=pTotCod(cfg),x=pDescCod(cfg);
  var q='?c='+encodeURIComponent(codigo)+'&d='+encodeURIComponent(cfg.desc);
  if(pp)q+='&pp='+encodeURIComponent(pp);
  if(v)q+='&v='+encodeURIComponent(v);
  /* t e x entram DEPOIS do v, e so quando ha desconto -- e e nessa ordem que os dois lados
     contam o selo. Sem desconto nao ha t nem x, a conta volta a ser a de quatro, e o endereco
     inteiro sai byte a byte igual ao que esta aba gerava antes de o desconto existir. */
  if(t)q+='&t='+encodeURIComponent(t);
  if(x)q+='&x='+encodeURIComponent(x);
  q+='&s='+pSeloApi(!!t).seloDe(codigo,cfg.desc,pp,v,t,x);
  return q;
}
function pLinkDe(cfg,codigo){
  return String(cfg.url).replace(/[?#].*$/,'')+pBusca(cfg,codigo);
}


return {
  versao:FC_COMPART_VERSAO,
  /* maquinaria do BR Code (texto literal + o avaliador) */
  FC_PIX_SRC:FC_PIX_SRC, fcPixApi:fcPixApi,
  /* preco */
  PRECO_MOEDAS:PRECO_MOEDAS, PRECO_PADRAO:PRECO_PADRAO, precoFmt:precoFmt,
  /* chave Pix */
  PIX_CHAVE_MAX:PIX_CHAVE_MAX, pixLimpar:pixLimpar, pixChaveErro:pixChaveErro,
  /* endereco da pagina de pagamento: inteiro, e a migracao do que estava guardado */
  urlLimpa:urlLimpa, pUrlOk:pUrlOk, fcUrlRelativo:fcUrlRelativo,
  FC_URL_EXEMPLO:FC_URL_EXEMPLO, pUrlRecusa:pUrlRecusa, fcUrlAvisoMigracao:fcUrlAvisoMigracao,
  /* identidade guardada */
  FCI_CHAVE:FCI_CHAVE, FCI_CAMPOS:FCI_CAMPOS, FCI_PADRAO:FCI_PADRAO,
  FCI_APONTA:FCI_APONTA, fciRecusa:fciRecusa,
  fcLerJson:fcLerJson, fcIdentidadeDe:fcIdentidadeDe,
  /* valor, identificador e prazo desta cobranca */
  P_VALOR_MAX:P_VALOR_MAX, P_DESC_MAX:P_DESC_MAX,
  pValorNum:pValorNum, pTxidLimpo:pTxidLimpo,
  /* correcao a vista: a parte pura das quatro regras que as duas paginas aplicam */
  fcTrim:fcTrim, fcValorCorrigido:fcValorCorrigido, fcTxidCorrigido:fcTxidCorrigido,
  fcChaveCorrigida:fcChaveCorrigida, fcDescCorrigido:fcDescCorrigido,
  /* desconto no Pix: a fonte que escreve totalPix nos tres blocos, e o lado que a ferramenta avalia */
  fcTotalPixSrc:fcTotalPixSrc, fcPixDesc:fcPixDesc,
  P_DESC_PCT_MAX:P_DESC_PCT_MAX, fcDescNum:fcDescNum,
  pDescPct:pDescPct, pValorPix:pValorPix, pTotCod:pTotCod, pDescCod:pDescCod,
  /* nome e cidade do recebedor, como o banco de quem paga vai mostrar */
  FC_NOMER_MAX:FC_NOMER_MAX, FC_CIDADE_MAX:FC_CIDADE_MAX,
  fcPixTexto:fcPixTexto, fcPixTextoCorrigido:fcPixTextoCorrigido,
  P_VAL_NADA:P_VAL_NADA, fcValDia:fcValDia, pValCod:pValCod, pValTexto:pValTexto,
  /* PayPal */
  P_PP_HOSTS:P_PP_HOSTS, P_PP_SRC:P_PP_SRC, pPpHostOk:pPpHostOk,
  /* selo e prazo (a fonte parametrizada + o avaliador) */
  pSeloSrc:pSeloSrc, pSeloApi:pSeloApi,
  /* as recusas e a montagem do link -- o coracao do invariante */
  pRecusaBloco:pRecusaBloco, pRecusaCobranca:pRecusaCobranca,
  pPayload:pPayload, pConferir:pConferir,
  pPpParam:pPpParam, pEncOk:pEncOk, pBusca:pBusca, pLinkDe:pLinkDe
};
})();
