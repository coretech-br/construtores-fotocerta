/* ============================================================================
   O CENARIO: o que se preenche na ferramenta antes de gerar
   ============================================================================
   POR QUE ISTO E UM ARQUIVO SEPARADO. Ate 03/09/2026 este cenario morava dentro de
   geradores.mjs, e era usado so por ele. Naquele dia a rodada dos textos configuraveis
   exigiu um SEGUNDO consumidor -- o teste que pega os blocos com os textos de escape e
   os EXECUTA numa pagina de verdade (textos-escape.mjs) --, e um cenario escrito duas
   vezes e a mesma armadilha que a CLAUDE.md registra para o codigo gerado: as duas
   copias concordam hoje e divergem amanha, sem erro e sem aviso. Aqui a regra e a
   mesma de sempre -- UNIFICA-SE A FONTE, e cada consumidor decide o que medir.

   O QUE ESTE ARQUIVO NAO E. Nao mede nada e nao abre navegador: recebe uma pagina ja
   aberta (por lib.mjs) e escreve nos campos. Quem fotografa e geradores.mjs; quem
   executa o bloco e textos-escape.mjs.

   AS ABAS SAO PREENCHIDAS COM O MINIMO PARA NENHUMA RECUSAR. Sem isso metade das saidas
   sai VAZIA e a comparacao passa com folga sobre nada -- aconteceu, e por isso esta
   escrito aqui. Os campos que moldam o bloco da aba de cobranca sao fixados
   explicitamente pelo mesmo motivo: a aba restaura o que estava guardado, e o que
   sobrou de uma passagem entra na seguinte.
   ============================================================================ */
import { set, radio, clicar } from './lib.mjs';

/* Identidade de teste. NAO sao dados reais: a chave e um e-mail de exemplo e o Client ID
   e inventado -- este arquivo e versionado num repositorio publico. */
export const IDENT = {chave:'ensaio@fotocerta.com.br', nomer:'Foto Certa', cidade:'Vitoria',
  client:'AbCdEf123456789ClientIdDeTeste', zapnum:'5527999998888'};
export const BLOCO_FIXO = {
  'p-larg':'420','p-qr':'180','p-c1':'#075E54','p-c2':'#ffffff','p-c3':'#333333',
  'p-corujaalt':'30','p-corujacorpo':'#ffffff','p-corujadet':'#075E54',
  't1':'Pagamento — Foto Certa','t2':'Valor a pagar','t3':'Copiar código Pix',
  't4':'Já paguei','t5':'Não há cobrança aberta neste endereço. Fale com a gente.',
  't6':'Este link de cobrança não é válido. Peça um novo.',
  't7':'Abra o aplicativo do seu banco, escolha Pix › Pagar › Copia e Cola e cole o código.',
  't8':'Válido até {data}.','t9':'Esta cobrança venceu em {data}. Fale com a gente para receber um link novo.'
};
export async function preparar(pg){
  for(const [k,v] of Object.entries(IDENT)) await set(pg,'fci-'+k,v);
  for(const [k,v] of Object.entries(BLOCO_FIXO)) await set(pg, k.startsWith('p-')?k:('p-'+k), v);
  await radio(pg,'p-coruja','esq'); await radio(pg,'p-usapp','sim');
  await radio(pg,'p-ppcor','gold'); await radio(pg,'p-zap','sim');
}
export async function conteudo(pg){
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
     nao lancar tentando clicar num botao que ainda nao existe la.
     A COLUNA p[5] E A URL INTEIRA de proposito (Task 4 do plano v2, 03/09/2026): o campo
     'a-plink' virou 'a-ppath' e passou a pedir so o caminho, mas aPacSalvar aceita colar a URL
     inteira tambem -- o prefixo 'https://tidycal.com/' e removido sozinho (fcTidyPathNorm).
     Manter a URL aqui, sem editar o valor, exercita esse caminho tolerante.
     O CAMPO E ACHADO EM TEMPO DE EXECUCAO (a-ppath ou, na REFERENCIA anterior a Task 4,
     a-plink): a mesma checagem de '#aba-pac' logo abaixo, so que por campo -- sem ela este
     script quebra ao rodar contra uma arvore de referencia anterior a esta rodada.
     O OPCIONAL COM QUANTIDADE (Task 5c) e O CUPOM (Task 4) entram aqui de proposito, e nao
     por completude: sem eles os dois caminhos que a v2 criou -- a multiplicacao de
     QUANTIDADE_MAXIMA no pagamento e a linha de desconto/validade na pagina de obrigado --
     ficam FORA da fotografia byte a byte, a mesma armadilha que ja pegou o cupom da Mini loja
     em 01/09 e a propria aba pac na v1. O opcional entra so no COMPLETO (o MINI fica sem
     opcional nenhum, de proposito: exercita os dois caminhos -- pacote com e sem catalogo de
     opcionais -- na mesma fotografia). */
  if(await pg.$('#aba-pac')){
    await clicar(pg,'aba-pac');
    await set(pg,'a-urlobrigado','https://www.fotocerta.com.br/obrigado');
    await set(pg,'a-prefixo','FC');
    await set(pg,'a-parcelas','6');
    const campoLink = await pg.$('#a-ppath') ? 'a-ppath' : 'a-plink';
    for(const p of [
      ['MINI','Mini ensaio','1 hora','420','10 fotos tratadas','https://tidycal.com/fotocerta/mini'],
      ['COMPLETO','Ensaio completo','2 horas','700','30 fotos tratadas','https://tidycal.com/fotocerta/completo']
    ]){
      await set(pg,'a-pcod',p[0]); await set(pg,'a-pnome',p[1]); await set(pg,'a-pdur',p[2]);
      await set(pg,'a-ppreco',p[3]); await set(pg,'a-pinclui',p[4]); await set(pg,campoLink,p[5]);
      if(p[0]==='COMPLETO' && await pg.$('#a-op-nome')){
        await set(pg,'a-op-nome','Álbum extra');
        await set(pg,'a-op-preco','80');
        await set(pg,'a-op-qtd',true);
        await clicar(pg,'a-op-add');
      }
      await clicar(pg,'a-pac-salvar');
    }
    /* A SEGUNDA FAMILIA, e o terceiro pacote dentro dela (03/09/2026). Sem ela TODO o caminho
       novo -- os tres passos, o cartao de familia, a linha de resumo da familia e as regras de
       CSS que so existem nesse ramo -- ficaria FORA da fotografia byte a byte, que e exatamente
       a armadilha ja registrada no cabecalho deste arquivo para t-out4/t-out5 e para o cupom da
       Mini loja: saida que so aparece as vezes e onde o lixo de uma passagem anterior se
       esconde.
       A PRIMEIRA familia nao e criada aqui: ela ja existe ('Pacotes', id F1), criada pela
       propria ferramenta -- e por isso os dois pacotes acima caem nela sem ninguem escolher
       nada. A segunda recebe id F2, DETERMINISTICO por construcao ('F' + maior + 1), que e o
       que torna esta fotografia reproduzivel; se um dia a regra do id mudar, este set falha
       alto em vez de mentir baixo.
       A dica entra so na SEGUNDA familia, de proposito: exercita os dois caminhos -- cartao de
       familia com e sem descricao curta -- na mesma fotografia. */
    if(await pg.$('#a-fam-nome')){
      await set(pg,'a-fam-nome','Fins de semana');
      await set(pg,'a-fam-dica','Sábado, domingo e feriados');
      await clicar(pg,'a-fam-add');
      await set(pg,'a-pfam','F2');
      await set(pg,'a-pcod','FDS'); await set(pg,'a-pnome','Ensaio de fim de semana');
      await set(pg,'a-pdur','2 horas'); await set(pg,'a-ppreco','980');
      await set(pg,'a-pinclui','30 fotos tratadas');
      await set(pg,campoLink,'https://tidycal.com/fotocerta/fds');
      await clicar(pg,'a-pac-salvar');
    }
    if(await pg.$('#a-cp-cod')) await cupons(pg,'a');
  }
}

/* ============================================================================
   OS TEXTOS DA PASSAGEM CONFIGURADA
   ============================================================================
   Sao 28 dos 162 campos, escolhidos por CRITERIO e nao por amostragem. Cada linha e
   [id do campo, valor, por que este] -- e, quando o campo so age num ramo que este
   cenario nao percorre, uma QUARTA coluna com o motivo. Sem essa quarta coluna, campo
   que nao chega a saida nenhuma e tratado como defeito, que e o padrao certo. O criterio
   da escolha, na ordem:

   1. UM POR ABA, nas oito abas que tem texto configuravel. As outras duas (Bordas e
      Efeitos de pagina) tem ZERO campos '*-txt-*' -- medido, nao suposto: elas geram
      CSS e animacao, e nenhum texto que o cliente leia. Nao ha o que preencher la.
   2. TODOS OS TIPOS DE MARCADOR que a rodada usa, cada um em pelo menos um campo, e
      com o marcador PRESERVADO no valor (senao o teste mediria um texto sem marcador):
      {pct} {valor} {n} {data} {codigo} {nome} {cod} e {desc}.
   3. OS QUATRO CAMINHOS DE ESCAPE da ferramenta, cada um com o caractere que mais
      machuca nele -- e onde mora o defeito silencioso:
        escAttr          (atributo HTML)               -> aspas duplas, '<', '&'
        escJs / esc      (literal JS entre aspas ')    -> apostrofa, barra invertida
        escJsD           (literal JS entre aspas ")    -> aspas duplas, barra invertida
        escJs(escAttr()) (atributo dentro de string JS) -> escape DUPLO, aspas duplas
        aTplJs           (literal partido nos marcadores) -> tudo isso, por pedaco
      A sequencia '</script' entra em tres deles de proposito: e o que o Manual do
      Prosite manda blindar, e um bloco que a emita crua fecha o <script> no meio.
   4. O SUBTITULO DA VITRINE ('a-txt-subtitulo'), que de fabrica e VAZIO e por isso nao
      emite nem CSS, nem div, nem variavel. Ele so existe na passagem configurada -- a
      de fabrica nunca chega perto dele.

   O SELO 'ZxNN' no comeco de cada valor e o que torna a cobertura verificavel: e so
   letra e digito, entao sobrevive a todos os escapes acima sem se transformar, e o
   script procura cada um nas saidas depois de gerar (ver 'configSemVestigio'). */
export const TEXTOS = [
  /* ----- Slideshow (s) ----- */
  ['s-txt-aria-galeria','Zx01 Galeria "oficial" & cia',
   'atributo HTML por escAttr: aspas duplas e & no meio de aria-label'],
  ['s-txt-aria-dot','Zx02 Ir para a foto {n} do ensaio da mae',
   'marcador {n} montado por aTplJs entre aspas simples, em tempo de execucao'],
  ['s-txt-alt-padrao','Zx03 Foto {n} \\ do acervo',
   'barra invertida num literal JS -- se esc() nao a dobrar, o bloco nao carrega'],
  /* ----- Captacao de leads (l) ----- */
  ['l-txt-aria-botao','Zx04 Falar "agora" no WhatsApp',
   'escape DUPLO, escJs(escAttr(...)): atributo dentro de uma string JS'],
  ['l-txt-rotulo-codigo',' (cód Zx05: *{cod}*) </script>',
   'marcador {cod}, acento e </script juntos, no literal partido por aTplJs'],
  /* ----- Agendamento TidyCal (t) ----- */
  ['t-txt-iframe-titulo','Zx06 Agenda "oficial" </script> — não é aqui',
   'title do iframe: escAttr precisa comer as aspas duplas E o "<" do </script'],
  ['t-txt-ob-conector-hora',' Zx07 às ',
   'literal JS da pagina de obrigado (t-out5) -- o conector entre a data e a hora',
   'so e emitido quando o FORMATO DE DATA nao e "como o TidyCal mandar": em cfg.fmt==="comoveio" '+
   'o gerador nao emite MESES_PT/DIAS_PT/lerData/legivel nenhum, e nao ha onde o conector entrar. '+
   'O cenario mantem o formato padrao de proposito (ver o comentario em conteudo()), e a passagem '+
   'de fabrica nao pode mudar -- ela e quem prova o invariante.'],
  /* ----- Checkout (u) ----- */
  ['u-txt-desconto','Zx08 Desconto ({codigo}) — não é \'acumulável\'',
   'marcador {codigo} (D-3) mais apostrofa dentro de literal JS entre aspas simples'],
  ['u-txt-ou-desc','Zx09 ou pague com Pix com {pct}% de desconto',
   'marcador {pct} minusculo (D-1), no ramo com desconto'],
  ['u-txt-zap-valor','Zx10 Valor pago: *{valor}*',
   'marcador {valor} na mensagem de WhatsApp (ramo SEM sinal, que e o do cenario)'],
  ['u-txt-zap-total','Zx26 Total do pedido: {valor}',
   'o mesmo marcador no ramo COM sinal -- a frase existe so la',
   'so e emitido quando o Checkout cobra SINAL (usaSinal). O cenario da fotografia nao liga '+
   'sinal em nenhuma das duas abas grandes, entao os textos do sinal (zapTotal, zapSinal, '+
   'sinal-maior, sinal-zero, sinal-recusado) ficam fora dela. Ligar o sinal mudaria a passagem '+
   'de FABRICA, que e a que prova o invariante -- e isso esta fora do alcance desta tarefa. '+
   'Fica declarado como buraco conhecido, nao como esquecimento.'],
  ['u-txt-zap-pedido','Zx11 Pedido cod: *{cod}*',
   'marcador {cod} numa SEGUNDA aba -- marcador igual em abas diferentes ja divergiu antes'],
  ['u-txt-nota','Zx12 Confira o nome do recebedor \\ antes de pagar',
   'barra invertida num literal JS de outra aba, com outro caminho de emissao'],
  /* ----- Contagem regressiva (c) ----- */
  ['c-txt-suf-d','Zx13d',
   'o sufixo do formato compacto (D-12/D-13) -- o quarto elemento do array, novo nesta rodada'],
  ['c-txt-sep-relogio',' Zx14 ',
   'o separador entre as unidades do relogio compacto, que e o formato padrao da aba'],
  ['c-txt-aria-fechar','Zx28 Fechar o aviso "agora" & pronto',
   'atributo HTML por escAttr na barra da contagem -- aspas duplas e & num aria-label',
   'so e emitido quando a barra TEM botao de fechar (cfg.fechar!=="nao"), e "Nao ter" e o '+
   'padrao da aba. Trocar o padrao no cenario mudaria a passagem de fabrica.'],
  ['c-txt-prazo-conector',' Zx27 de ',
   'conector entre o dia e o mes do prazo, no formato por extenso',
   'so e emitido quando ALGUMA mensagem usa o marcador {prazo} (cUsaPrazo) E o formato do '+
   'prazo e "extenso"/"extensohora". O cenario nao usa {prazo} em mensagem nenhuma, e o bloco '+
   'entregue nao carrega maquinaria que ninguem pediu -- entao nao ha onde o conector entrar.'],
  /* ----- Link de cobranca (p) ----- */
  ['p-txt-zapmsg','Zx15 Olá! Acabei de pagar: {desc} -- {valor}',
   'os marcadores {desc} e {valor} juntos, na unica frase que os usa'],
  ['p-txt-pixrotulo','Zx16 Pagando via Pix (-{pct}%)',
   'a frase INTEIRA com {pct} (D-2), na pagina /pagar'],
  ['p-txt-secao-paypal','Zx17 PayPal, cartão "ou" débito',
   'aspas duplas dentro de literal JS entre aspas simples -- esc() nao as toca, e nao precisa'],
  /* ----- Mini loja (m) ----- */
  ['m-txt-tirar-aria','Zx18 Tirar {nome} do carrinho',
   'marcador {nome} -- o unico campo da ferramenta que o usa'],
  ['m-txt-sumiram','Zx19 Removemos {n} itens que saíram do catálogo.',
   'D-5, com o {n} NO MEIO da frase: e exatamente o que a ajuda da aba promete e o que '+
   'estava quebrado (o bloco concatenava o numero e deixava o marcador cru na tela)'],
  ['m-txt-cesta-estragada','Zx20 O carrinho estava ilegível </script> e foi descartado',
   '</script dentro de literal JS entre aspas simples (escJs)'],
  /* ----- Agendamento por pacote (a) ----- */
  ['a-txt-subtitulo','Zx21 Até {pct}% de desconto pagando no Pix',
   'O SUBTITULO: vazio de fabrica, nao emite nem CSS nem div nem variavel -- so a passagem '+
   'configurada o alcanca. O {pct} e trocado em tempo de GERACAO, nao de execucao'],
  ['a-txt-prazo-barra','Zx22 Reserva garantida até {data}.',
   'marcador {data} -- so existe nesta aba e na /pagar'],
  ['a-txt-parcela','Zx23, em até {n}x de {valor}',
   '{n} e {valor} na mesma frase, e ela ainda passa por aParcelaSolta (que corta a virgula '+
   'inicial numa das duas saidas) -- duas transformacoes sobre o mesmo texto'],
  ['a-txt-familia-apartir','Zx24 a partir de {valor}',
   'texto NOVO das familias: so e emitido no ramo de duas ou mais familias'],
  ['a-txt-pix-manual','Zx25 O Pix não avisa: me avise \\ "assim" que pagar </script>',
   'o unico caminho escJsD (literal entre aspas DUPLAS) -- aspas duplas, barra invertida e '+
   '</script no mesmo texto']
];
/* Preenche o campo se ele existir, e devolve os que NAO existiam. A arvore de referencia
   pode ser anterior a rodada dos textos, e la nenhum destes campos existe: o set() de
   lib.mjs lanca nesse caso, e derrubaria a captura da referencia inteira -- a mesma razao
   pela qual o laco de ABAS pula aba ausente. Campo ausente nao vira silencio: entra em
   'configTextosAusentes', e regressao.sh usa essa lista para dizer, em vez de esconder,
   que a passagem configurada nao e comparavel contra aquela referencia. */
export async function configurarTextos(pg){
  const ausentes = [];
  for(const [id,valor] of TEXTOS){
    if(await pg.$('#'+id)) await set(pg,id,valor);
    else ausentes.push(id);
  }
  return ausentes;
}

/* OS CUPONS ENTRAM NO CENARIO, e nao por capricho. Na Mini loja o campo de cupom so existe
   quando ha cupom cadastrado (usaCupom = cfg.cps.length > 0); sem esta chamada, TODO o
   caminho do cupom da loja ficava fora da fotografia -- e ficou, ate 01/09/2026, quando uma
   mudanca na linha do desconto passou pela regressao sem a loja ser exercitada. E a mesma
   armadilha ja registrada aqui para t-out4/t-out5: saida que so aparece as vezes e onde o
   defeito se esconde. Dois cupons de proposito: um COM prazo e um SEM, porque a linha do
   desconto se comporta diferente nos dois casos. */
export async function cupons(pg, pref){
  for(const [cod, valor, val] of [['NATAL10','10','2027-12-25'],['SEMPRE','5','']]){
    await set(pg, pref+'-cp-cod', cod);
    await radio(pg, pref+'-cp-tipo', 'pct_total');
    await set(pg, pref+'-cp-valor', valor);
    await set(pg, pref+'-cp-val', val);
    await clicar(pg, pref+'-cp-add');
  }
}
export async function cobranca(pg,c){
  await set(pg,'p-url', c.url ?? 'https://fotocerta.com.br/pagar');
  await set(pg,'p-desc', c.desc ?? 'Ensaio de familia — pacote completo');
  await set(pg,'p-valor', c.valor ?? '1200,50');
  await set(pg,'p-txid', c.txid ?? ''); await set(pg,'p-validade', c.validade ?? '');
  await set(pg,'p-descpix', c.descpix ?? '0');
  await radio(pg,'p-ppmodo', c.ppmodo ?? 'sdk'); await set(pg,'p-pplink', c.pplink ?? '');
}


/* AS DEZ ABAS e o botao que gera cada uma. Vive aqui, e nao no consumidor, porque os dois
   consumidores precisam do MESMO laco -- e porque acrescentar uma aba nova a ferramenta tem
   de ser uma linha em um lugar so. */
export const ABAS = [['aba-slide','s-gerar'],['aba-leads','l-gerar'],['aba-tidy','t-gerar'],
  ['aba-uni','u-gerar'],['aba-bor','b-gerar'],['aba-cnt','c-gerar'],['aba-cob','p-gerar'],
  ['aba-loja','m-gerar'],['aba-efe','e-gerar'],['aba-pac','a-gerar']];

/* Clica em gerar nas dez abas, e devolve as que NAO EXISTEM naquela arvore.
   ABA QUE NAO EXISTE NA ARVORE E PULADA, e nao derruba a captura. Sem isto, acrescentar uma
   aba nova quebrava a regressao INTEIRA -- a referencia (main) nao tem o botao, o clique
   lanca, e nenhuma das outras saidas chegava a ser comparada. A saida da aba ausente fica
   vazia daquele lado, que e exatamente o que ela e. */
export async function gerarTodas(pg){
  const pulou = [];
  for(const [aba,bt] of ABAS){
    if(!(await pg.$('#'+aba))){ pulou.push(aba); continue; }
    await clicar(pg,aba); await pg.waitForTimeout(60); await clicar(pg,bt);
  }
  await clicar(pg,'p-gerarlink'); await pg.waitForTimeout(200);
  return pulou;
}
