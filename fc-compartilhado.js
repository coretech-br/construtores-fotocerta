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
   duas paginas. A conferencia:
     grep -c "fc-compartilhado.js?v=2026-08-21a" index.html cobrar/index.html
   tem de sair 1 nos dois.

   ES5, sem dependencia externa, sem acesso ao DOM.
   ============================================================================ */
'use strict';
var FCCOMPART=(function(){
var FC_COMPART_VERSAO='2026-08-21a';

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
   funcao, e nao por copia da leitura. */
function fcLerJson(chave,aoFalhar){
  var raw,st;
  try{raw=localStorage.getItem(chave);}
  catch(e){if(aoFalhar)aoFalhar('ler o que estava gravado -- armazenamento do navegador indisponivel',e);return null;}
  if(!raw)return null;
  try{st=JSON.parse(raw);}
  catch(e){if(aoFalhar)aoFalhar('entender o que estava gravado -- o conteudo salvo esta corrompido',e);return null;}
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

/* Endereco da pagina de pagamento. Mesmo criterio de cUrlOk e tUrlOk, pela mesma urlLimpa:
   ancora nao serve aqui (a pagina precisa de um endereco de verdade), entao sao aceitos
   http(s) e caminho do proprio site comecando com UMA barra. */
function pUrlOk(v){
  var limpo=urlLimpa(v);
  if(!limpo)return false;
  if(/^https?:\/\//i.test(limpo))return true;
  if(/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(limpo))return false;
  return limpo.charAt(0)==='/'&&limpo.charAt(1)!=='/';
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
var P_SELO_SRC=
"function seloBytes(s){\n"+
"  var o='',i,c;\n"+
"  for(i=0;i<s.length;i++){c=s.charCodeAt(i);o+=String.fromCharCode((c>>8)&255,c&255);}\n"+
"  return o;\n"+
"}\n"+
"function seloDe(pc,pd,pp,pv){\n"+
"  var ps=[pc,pd,pp,pv],t='',i,s;\n"+
"  for(i=0;i<ps.length;i++){s=String(ps[i]==null?'':ps[i]);t+=s.length+':'+s+'|';}\n"+
"  return crc16(seloBytes(t));\n"+
"}\n"+
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
/* O lado da FERRAMENTA: as mesmas quatro funcoes, avaliadas a partir do mesmo texto, e sobre o
   MESMO crc16 que o bloco usa. Nada digitado pelo operador entra nesta fonte. */
var pSeloFns=null;
function pSeloApi(){
  if(!pSeloFns)pSeloFns=(new Function(FC_PIX_SRC.crc16+P_SELO_SRC+
    'return {seloDe:seloDe,prazoDia:prazoDia,prazoFim:prazoFim,prazoTexto:prazoTexto};'))();
  return pSeloFns;
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
  if(!cfg.url||!pUrlOk(cfg.url))return 'Informe o endereco da pagina de pagamento: um endereco http(s) completo, ou um caminho do proprio site comecando com barra (/pagar).';
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
function pPayload(cfg){
  return fcPixApi().montar(cfg.chave,cfg.nomer,cfg.cidade,cfg.txid)(cfg.valor);
}
/* A conferencia que o gerador faz em cima do que ele mesmo produziu. Parece redundante e nao
   e: e ela que garante que NENHUM link saia daqui sem o campo 54, com o campo 54 ilegivel, ou
   com um valor diferente do que o operador digitou. Roda a MESMA pixLer que a pagina publicada
   vai rodar, entao o que passa aqui passa la. */
function pConferir(cfg,codigo){
  var api=fcPixApi(),lido=api.pixLer(codigo);
  if(!lido.ok)return 'O codigo Pix montado para esta cobranca nao passou na propria conferencia ('+lido.erro+'). Nenhum link foi gerado. Confira a chave, o nome e a cidade.';
  if(Math.abs(lido.valor-cfg.valor)>0.0001)return 'O valor dentro do codigo Pix ('+precoFmt('BRL',lido.valor)+') nao bate com o valor digitado ('+precoFmt('BRL',cfg.valor)+'). Nenhum link foi gerado.';
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
  var pp=pPpParam(cfg),v=pValCod(cfg);
  var q='?c='+encodeURIComponent(codigo)+'&d='+encodeURIComponent(cfg.desc);
  if(pp)q+='&pp='+encodeURIComponent(pp);
  if(v)q+='&v='+encodeURIComponent(v);
  q+='&s='+pSeloApi().seloDe(codigo,cfg.desc,pp,v);
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
  /* endereco */
  urlLimpa:urlLimpa, pUrlOk:pUrlOk,
  /* identidade guardada */
  FCI_CHAVE:FCI_CHAVE, FCI_CAMPOS:FCI_CAMPOS, FCI_PADRAO:FCI_PADRAO,
  FCI_APONTA:FCI_APONTA, fciRecusa:fciRecusa,
  fcLerJson:fcLerJson, fcIdentidadeDe:fcIdentidadeDe,
  /* valor, identificador e prazo desta cobranca */
  P_VALOR_MAX:P_VALOR_MAX, P_DESC_MAX:P_DESC_MAX,
  pValorNum:pValorNum, pTxidLimpo:pTxidLimpo,
  P_VAL_NADA:P_VAL_NADA, fcValDia:fcValDia, pValCod:pValCod, pValTexto:pValTexto,
  /* PayPal */
  P_PP_HOSTS:P_PP_HOSTS, P_PP_SRC:P_PP_SRC, pPpHostOk:pPpHostOk,
  /* selo e prazo (texto literal + o avaliador) */
  P_SELO_SRC:P_SELO_SRC, pSeloApi:pSeloApi,
  /* as recusas e a montagem do link -- o coracao do invariante */
  pRecusaBloco:pRecusaBloco, pRecusaCobranca:pRecusaCobranca,
  pPayload:pPayload, pConferir:pConferir,
  pPpParam:pPpParam, pEncOk:pEncOk, pBusca:pBusca, pLinkDe:pLinkDe
};
})();
