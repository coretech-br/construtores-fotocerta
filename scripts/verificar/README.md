# O arnes de verificacao

Utilitarios de linha de comando (Node + Playwright) para conferir a ferramenta
e os blocos que ela gera. Nada aqui e servido nem colado no Prosite -- e
material de apoio, roda no seu computador.

## O que ha aqui

| Arquivo | O que e | Quando usar |
|---|---|---|
| `lib.mjs` | Helpers comuns: achar o Playwright, subir um servidor estatico, abrir a ferramenta com armazenamento limpo, preencher campo/checkbox/radio disparando os mesmos eventos do teclado, ler saida, capturar alerta/erro de console. | Nunca sozinho -- e a base dos outros arquivos. Leia antes de escrever qualquer coisa nova neste diretorio. |
| `cenario.mjs` | O CENARIO: o que se preenche em cada uma das dez abas antes de gerar (identidade de teste, produtos, pacotes, familias, cupons, cobranca) e a tabela `TEXTOS`, com os 28 campos de texto da passagem configurada. Nao mede nada e nao abre navegador. | Ao acrescentar aba, campo ou texto que precise entrar na prova. E o unico lugar onde o cenario existe -- `geradores.mjs` e `textos-escape.mjs` leem os dois o mesmo. |
| `geradores.mjs` | Fotografa o TEXTO que as dez abas produzem, em DUAS passagens (`fabrica` e `configurada`), mais o link completo de cada cenario de cobranca, e grava num JSON. | Para provar que uma mudanca no gerador nao alterou um byte do que as outras abas produzem -- e que o texto configurado pelo dono chega ao bloco. Chamado por `regressao.sh`; raramente direto. |
| `regressao.sh` | Compara a fotografia da arvore de trabalho com a de uma referencia (`main` por padrao). | Ao fim de toda rodada que mexer em codigo gerado. `scripts/verificar/regressao.sh` ou `scripts/verificar/regressao.sh <ref>`. |
| `textos-escape.mjs` | Pega os blocos gerados COM os textos de escape (aspas simples e duplas, barra invertida, acento e `</script`) e os EXECUTA numa pagina de verdade, uma por bloco. Checa que nenhum `</script` engoliu o resto do documento, que o bloco desenhou, que nao houve erro de console e que o texto do dono chegou inteiro a tela. | Ao mexer em qualquer escape (`esc`, `escJs`, `escJsD`, `escAttr`, `aTplJs`) ou em qualquer texto configuravel. `node scripts/verificar/textos-escape.mjs`. |
| `cupom-minimo.mjs` | O VALOR MINIMO DO PEDIDO PARA O CUPOM VALER, com os blocos RODANDO: gera as tres abas que tem cupom (Checkout, Mini loja e Agendamento por pacote) com um cupom de minimo e um sem, executa cada bloco numa pagina e percorre os cinco casos -- aplicado acima, recusado abaixo, a QUEDA AUTOMATICA ao tirar um item, o voltar a subir que nao reaplica, e o cupom sem minimo intacto. Le o total NA TELA, nunca a variavel. Fecha com a compatibilidade: estado de versao anterior, "Exportar tudo"/importar e preset de aba. | Ao mexer em qualquer coisa do cupom nas tres abas -- a regra do minimo, `FC_CARRINHO_SRC`, `fcCpSerial` ou os dois textos novos. `node scripts/verificar/cupom-minimo.mjs`. |
| `lista-cupons.mjs` | O EDITOR EM LINHA da lista de cupons, nas TRES abas que tem cupom. Para cada um dos cinco campos da linha (codigo, tipo, valor, validade, minimo): que ele APARECE, que edita-lo GRAVA (le o `localStorage`), que edita-lo REMONTA A PREVIA (le a lista `CUPONS` de dentro do iframe) e que o valor sobrevive a recarga. | Ao mexer em qualquer `*CpRender`, ou ao criar lista cadastrada com campo editavel na propria linha. A regressao NAO alcanca isto: os campos da linha sao criados por JavaScript, nao tem id nem name, e escapam dos ouvintes delegados de cada aba -- foi assim que a Mini loja passou a mentir na previa e a esconder a validade sem quebrar nada. `node scripts/verificar/lista-cupons.mjs`. |
| `pac-quantidade.mjs` | A QUANTIDADE DO OPCIONAL NO QUE VAI PARA O PAYPAL, na aba Agendamento por pacote, com o bloco RODANDO. Intercepta o `document.head.appendChild` do proprio bloco (o mesmo caminho da sonda da previa, `fcPvSondaPP`), instala um `window.paypal` que guarda a configuracao dos Buttons e chama o `createOrder` do bloco com um `order.create` que so devolve o pedido. Le o `name`/`description` que iriam a ordem nos quatro casos (com quantidade, sem quantidade, os dois juntos, so o pacote) e o corte em 127 caracteres. | Ao mexer em `nomesSelecionados` de qualquer aba, ou em `fcPpBotoesSrc` -- que e a fonte unica do que o PayPal recebe. A regressao NAO alcanca isto: ela compara texto gerado, e o defeito que este arquivo pegou (preco multiplicava pela quantidade, nome nao dizia por quanto) era texto gerado coerente e recibo errado. `node scripts/verificar/pac-quantidade.mjs`. |
| `preset-formulario.mjs` | O FORMULARIO DE CADASTRO nos DOIS caminhos que passam pelo `restaura()` de cada aba, e que querem coisas opostas: **recarregar** a ferramenta tem de DEVOLVER o formulario inacabado (opcionais digitados, item em edicao e, desde 03/09/2026, os CAMPOS DE TEXTO dele), e **aplicar um preset** tem de ZERA-LO. Nas tres abas com catalogo (Checkout, Mini loja, Agendamento por pacote), em tres partes: **A.** monta o cenario, mede o estado ANTES do clique, aplica, confere que os 6/8/7 campos do formulario voltaram ao padrao, e fecha com a prova que importa -- cadastrar logo depois ACRESCENTA em vez de sobrescrever o item de indice 1. **B.** recarrega e depois DIGITA POR CIMA dos campos sem salvar e recarrega de novo: todos os campos medidos em `*ProdSalvar`/`aPacSalvar` voltam com o que foi digitado, e o rotulo do botao mais o aviso de pendencia continuam falando do MESMO item (campo restaurado com o botao dizendo outra coisa e pior que campo perdido). **C.** apaga a chave `form` do estado gravado -- que e exatamente o que um backup anterior a 03/09/2026 tem -- e confere que a ferramenta abre no comportamento de ontem, sem alerta, sem barra vermelha e sem erro de console; na aba Agendamento por pacote, mais o caso vizinho da FAMILIA que nao existe mais, que nao pode deixar o seletor em branco. | Ao mexer em `fcPresetAplicar`, `fcgAplicarAba`, `restaurarEstado`, em qualquer `*EditRestaurar`/`*ProdLimpar`/`*PacLimpar`, em `fcFormLer`/`fcFormRestaura`/`U_FORM`/`M_FORM`/`A_FORM`, ou nas listas `fora`/`formulario` de `ABAS`. A regressao NAO alcanca isto: e interface, e os dois defeitos (03/09/2026) eram silenciosos -- um gravava por cima de um produto sem erro de console e sem alerta, o outro perdia tudo o que o dono tinha digitado no formulario a cada recarga. Medido na `main` de 03/09/2026: 6 das 98 verificacoes falham la, uma por aba mais a que confere que a chave `form` passou a ser gravada. `node scripts/verificar/preset-formulario.mjs`; um caminho como argumento aponta outra arvore (um `git worktree` da referencia) para ver o defeito falhar la. |
| `tidycal-origem.mjs` | O **filtro de origem** das mensagens do TidyCal, com os dois blocos RODANDO, mais a guarda do campo e a migracao. Cinco partes: dominio proprio (o iframe aponta para ele e o sinal vindo DELE e aceito), tidycal.com (continua como sempre), o **negativo** em cada um -- sinal de outra origem e descartado --, dois pacotes em **dominios diferentes** na mesma pagina (escolhe um, mede os dois sentidos, troca, mede de novo), a tabela de 20 casos do que o campo aceita e recusa (exercitada pelo botao "Abrir a pagina de teste", nao pela funcao), e a migracao das tres formas gravadas (`link` -> `path` -> `cal`), com o aviso saindo uma vez e nao repetindo na recarga. Os tres primeiros rodam **nos dois valores** do campo `t-medir`/`a-medir`, porque o que denuncia "o sinal foi aceito" muda com ele: no modo calibrado e o `min-height` que `expandir()` escreve; no modo que mede (o padrao) `expandir()` nao faz nada, e quem denuncia e a **altura** que veio no proprio sinal. O sinal de outra origem e simulado com `new MessageEvent(..., {origin})`: `postMessage` sempre carimba a origem da propria pagina. | Ao mexer no endereco do TidyCal de qualquer das duas abas, no filtro de origem dos blocos, em `fcTidyUrl`/`fcTidyUrlOk`/`fcTidyOrigem` ou na migracao de `aRestaura`/`tRestaura`. A regressao NAO alcanca isto: uma origem cravada e texto gerado perfeitamente coerente, e o defeito seria mudo -- o calendario apareceria e a expansao do formulario nunca aconteceria. `node scripts/verificar/tidycal-origem.mjs`. |
| `tidycal-altura.mjs` | A **ALTURA AUTOMATICA DO CALENDARIO**, nos dois blocos que criam o proprio iframe (aba TidyCal em dominio proprio e Agendamento por pacote). Espia o `contentWindow.postMessage` do bloco para provar que o **aperto de mao** sai, com o formato medido e para a origem certa; corre uma bateria de sinais TRANSCRITOS da medicao real (75, 507, 553, 716, 770) e prova os tres casos: a altura acompanha o conteudo, fica na de partida quando o sinal nao chega, e valor fora da faixa (50000, negativo, nao-numero, `:0:0:`) nao passa. Cada bloco corre a bateria **duas vezes, uma por valor** do campo `t-medir`/`a-medir`: desligado, o aperto de mao sai com `bodyOffset` e o `scrollToOffset` expande por `min-height` ate a altura calibrada; ligado (o padrao), o aperto de mao sai com `lowestElement`, o `scrollToOffset` NAO expande nada, e o quadro cresce e volta pela altura anunciada (1662 -> 764, transcritos). Fecha com a troca de pacote -- altura volta para a de partida e o aperto de mao recomeca na origem nova. | Ao mexer em `fcTidyAlturaSrc` (a fonte unica das duas abas), na faixa da guarda, no ouvinte de `message` de qualquer dos dois blocos, ou em `abrirCalendario`. A regressao NAO alcanca isto: ate 03/09/2026 os dois blocos escutavam `[iFrameSizer]` sem NUNCA mandar o aperto de mao -- texto gerado perfeitamente coerente, e **medido**, calendario de 700px fixos num lado e de **150px** no outro, sem erro nenhum no console. `node scripts/verificar/tidycal-altura.mjs`. |
| `tidycal-unificado.mjs` | O **CALENDARIO UNIFICADO, CONTRA O TIDYCAL DE VERDADE** -- o unico arquivo do arnes que fala com a internet, e de proposito. Gera os blocos da arvore de trabalho E os da referencia (`main` por padrao) e roda os **tres casos** lado a lado -- aba TidyCal em tidycal.com, a mesma aba em dominio proprio, e a vitrine de pacotes com dois pacotes em dominios diferentes --, medindo em cada um: a altura em repouso, a expansao quando o formulario de reserva abre, quantos iframes ha na pagina e os erros de console. **E cada caso e medido nos dois valores do campo `t-medir`/`a-medir`**: o `[calibrado]` e o que se compara com a referencia, porque e o mesmo comportamento dela; o `[medindo]` -- o padrao desde 03/09/2026 -- e medido contra os dois lados da troca, em repouso ele fica acima do calibrado (o preco) e com o formulario aberto ele cresce ate o necessario, ficando **abaixo** dos 2350 calibrados e voltando ao repouso quando o modal fecha. Fecha com os tres casos de degradacao (a biblioteca deles carrega / nao carrega / carrega e o sinal nao vem) e com **dois blocos na mesma pagina** (o `embed.js` entra uma vez so, e nenhum bloco tem os seletores que ele varre). | Ao mexer em `fcTidyCalSrc`, no bloco de qualquer das duas abas, ou no dia em que o TidyCal trocar a biblioteca deles. A regressao NAO alcanca isto: a saida dos dois blocos mudou DE PROPOSITO na unificacao, entao byte a byte so sabe dizer "mudou" -- a pergunta que importa ("o novo se comporta pelo menos tao bem quanto o de hoje?") so tem resposta com o calendario real do outro lado. `node scripts/verificar/tidycal-unificado.mjs`, ou com outra referencia como argumento. |
| `calendario-aquecido.mjs` | A **PRE-CONEXAO, O AQUECIMENTO DO CALENDARIO E O PERIGO QUE VEM JUNTO** (04/09/2026). Quatro partes. **1.** com a rede fechada, le os `<link data-fc-pre>` que cada bloco poe no `head` ao carregar: `preconnect` e `dns-prefetch` para o dominio do calendario e para o CDN do `embed.js`, um aviso por origem (a vitrine com pacotes em dois dominios avisa os dois; dois blocos na mesma pagina nao repetem). **2.** o **negativo que e o centro da rodada**: cria um iframe ISCA de MESMA ORIGEM do calendario e dispara `[iFrameSizer]fcx:1234:...` com o `e.origin` certo e o `e.source` do isca -- a altura tem de ser IGNORADA --, e logo depois o mesmo sinal com o `source` do quadro que esta na tela, que tem de ser ACEITO (sem o positivo, um bloco que ignorasse tudo passaria com louvor). **3.** contra o TidyCal de verdade, a armadilha que nao se supoe: antes de qualquer gatilho nao existe iframe nenhum (quem entra e sai nao paga); escolher a familia cria o iframe DENTRO de um ancestral `display:none` (medido: `offsetParent` nulo e altura zero); e ele **carregou mesmo** -- sairam requisicoes para o dominio do calendario e o documento disparou `load`. Fecha provando que ele nao e um zumbi: revelado, nao ha troca de `src` (o risco do `f.src=` com o mesmo valor, que recarregaria justamente o caso em que o aquecimento acertou), nao ha `load` novo, o no do DOM e o MESMO (re-parentear um iframe o recarregaria do zero) e o quadro passa a anunciar altura. **3b.** o INTERRUPTOR DESLIGADO (`AQUECER_CALENDARIO=false`): escolher a familia nao cria calendario nenhum, a caixa nao fica com a classe do aquecimento, e clicar no pacote mostra o calendario com largura e altura de verdade -- o esconderijo e uma classe de CSS, e classe esquecida no lugar errado deixaria uma faixa vazia sem erro nenhum no console. **4.** os TEMPOS, arvore de trabalho contra referencia, com a linha do tempo identica nos dois lados (gatilho, a mesma pausa de leitura, clique): o primeiro pacote, a troca, a LARGURA do quadro durante o aquecimento e as mensagens CRUAS depois da revelacao, lado a lado. | Ao mexer em `preConectar`, `doQuadro`, `aquecer`/`aquecerCartao`/`primeiroDaFamilia`, em `abrirCalendario`/`escolher`, ou no CSS que esconde `.fca-cal` (`.fca-aquec` inclusive). A regressao NAO alcanca isto: ela diz que `a-out1` mudou, o que ja se sabia. "O aquecimento carregou?", "carregou do TAMANHO CERTO?" e "o clique ficou mais rapido?" so tem resposta com o calendario real do outro lado, e "a altura do quadro errado e ignorada?" so tem resposta com um segundo quadro na pagina. `node scripts/verificar/calendario-aquecido.mjs`, ou com outra referencia como argumento. Medido em 04/09/2026 contra a `main` de entao (sem aquecimento): primeiro pacote 3072ms -> 0ms (com familias) e 2394ms -> 0ms (sem familias), com a troca de pacote inalterada (~400ms nos dois lados). **A LARGURA, acrescentada no mesmo dia, depois de o dono ver na pagina publicada o calendario "sumir e voltar com um efeito tipo fade":** o quadro era aquecido dentro de um `display:none`, ou seja com largura 0, e o TidyCal se desenhava para uma tela de zero pixel (ele anunciava 3800px de altura) e refazia tudo ao ser revelado. Medido contra a `main` que ja aquecia: largura durante o aquecimento **0px -> 960px**, altura anunciada escondido **3800px -> 1021px** (a de verdade e 1054), e a rajada depois de revelar **3 sinais, com `animationstart` dentro (685, 718, 1054), -> 1 sinal de ajuste (1054), sem `animationstart`** -- nos dois ramos da vitrine. **Quando a referencia JA aquece**, as duas passagens chegam a 0ms e cobrar "ficou mais rapido" seria cobrar o impossivel: o arquivo detecta isso e passa a cobrar "nao ficou mais lento" mais a largura e a rajada. |
| `acentos.mjs` | O ACENTO QUE FALTA no texto que uma PESSOA le. Tokeniza o `index.html` de verdade (string, comentario e codigo separados), recolhe as frases que chegam a um sink de interface (`alert`, `confirm`, `.textContent`, `.placeholder`, `.title`, `.alt`, `setAttribute('aria-label')`, `fcFalha`, `fciRecusa`, o texto e os atributos do HTML da ferramenta) mais todo literal que PARECE PROSA, e cobra acento comparando com o VOCABULARIO acentuado da propria arvore. Nao acusa codigo: comentario, `<style>`, `<code>`, marcador `{codigo}`, identificador, classe CSS, `value` de radio, comentario do bloco gerado e a lista declarada de HOMOGRAFOS (`e`/`é`, `esta`/`está`, `pode`/`pôde`...). Sai com codigo 1 quando acha algo. | Ao escrever qualquer texto novo que uma pessoa va ler -- e como guarda, antes de fechar a rodada. `node scripts/verificar/acentos.mjs`; `--vocabulario` mostra o que ele aprendeu; um caminho como argumento analisa outro arquivo. Medido em 03/09/2026: 118 frases na `main`, zero depois da rodada dos acentos. |
| `duplicar-itens.mjs` | OS BOTOES DE DUPLICAR de toda a ferramenta, e o que eles nunca podem sobrescrever ou apagar. Casos 1 a 7, aba Agendamento por pacote: duplicar um pacote COM OPCIONAIS (o formulario vem completo, em modo criar, e salvar cria um SEGUNDO pacote -- o original e comparado campo a campo antes e depois), duplicar ENQUANTO EDITA outro pacote (o que estava em edicao fica intacto), duplicar e RECARREGAR sem salvar (o estado persistido devolve a copia ainda em modo criar, com os SETE campos de texto dela, e SALVAR depois da recarga cria a copia deixando os dois pacotes do cenario intactos campo a campo), duplicar um OPCIONAL (a copia entra logo abaixo da original, com preco e "vende por quantidade" iguais), a RECUSA DE CODIGO REPETIDO (no cadastro e na geracao, inclusive o caso que so o Pix enxerga -- "MINI-1H" x "MINI1H" --, e o negativo: salvar uma edicao sem mexer no codigo nao pode ser recusada), o ARRANJO dos botoes (a faixa embaixo do item, os cinco botoes, e o simbolo do duplicar que nao pode ser um retangulo vazio na fonte do sistema) e o AVISO DE PENDENTES citando o rotulo que esta na tela. Casos 8 a 15, acrescentados na leva 3 de 03/09/2026: duplicar um PRODUTO no Checkout e na Mini loja (os mesmos tres caminhos que quebram dados -- com opcionais, enquanto edita outro, e recarregar-e-salvar --, com o produto de origem e o que estava em edicao comparados campo a campo); na Mini loja, a decisao medida desta aba: a copia HERDA A FOTO E A CATEGORIA, e sem a foto `mProdSalvar` recusaria a copia no primeiro clique; duplicar um OPCIONAL nas duas abas; DUPLICAR UMA FAMILIA COM O CONTEUDO DELA (um clique cria a familia e todos os pacotes com os opcionais, cada pacote com codigo proprio pela normalizacao do Pix, a familia com nome derivado, e NENHUM original tocado); APAGAR UMA FAMILIA COM CONTEUDO (a confirmacao lista os pacotes PELO NOME e nao cita os de outra familia; Cancelar nao apaga nada; confirmar apaga a familia e SO os pacotes dela; a recusa da ultima familia continua; e `aEditIdx` acompanha -- apagar pacotes que estao ANTES do que esta em edicao sem baixar o indice faria o proximo "Salvar alteracoes" gravar por cima de outro); duplicar um CUPOM nas TRES abas (a copia nasce com codigo derivado, entao a recusa de codigo repetido nao acende e o Gerar nao e barrado); duplicar MENSAGEM da Contagem (os DOIS textos ganham a marca, porque a barra mostra um ou o outro conforme a largura da tela) e OPCAO DE QUALIFICACAO (que deriva ate ficar unica, porque esta lista tem recusa de texto repetido); e as FAIXAS das listas novas (cinco botoes abaixo do item nos produtos, quatro nos opcionais, e a de cupons com dois botoes continuando na lateral). Cada caso corre num `try` proprio: numa arvore sem o botao o caso acusa e o roteiro segue. | Ao mexer em qualquer `*Duplicar`, em `aFamDel`/`aFamDuplicar`, nos `*Editar`/`*Limpar`/`*Salvar` das tres abas com catalogo, em `fcDupCod`/`fcDupNome`/`fcCtrl`, ou ao levar o duplicar a mais uma aba. A regressao NAO alcanca isto: o catalogo pode PERDER UM PACOTE INTEIRO sem que uma linha do bloco gerado mude de forma -- muda o conteudo, que e o que ninguem ve num diff de 24 mil bytes. Duas medicoes na `main`, em dias diferentes: contra a `main` que ainda NAO tinha o botao de duplicar, 11 das 23 verificacoes de entao falhavam, e duas delas eram defeitos que existiam la (codigo repetido aceito no cadastro; o aviso de pendentes mandando apertar um botao que ja nao esta na tela). Contra a `main` de 03/09/2026 (com o duplicar, sem a persistencia dos campos), 10 das 90 falham, todas no caso 3: a copia recarregada volta com o formulario em branco, e salvar e recusado com "Informe o codigo do pacote". Desde a leva 3 ele cobre tambem o unico caminho da ferramenta que APAGA varios itens de uma vez (`aFamDel` levando os pacotes junto): a medida que importa ali nao e "apagou", e sim "nenhum pacote de outra familia sumiu", e ela e feita comparando o pacote sobrevivente campo a campo com a fotografia de antes. `node scripts/verificar/duplicar-itens.mjs`. |
| `pagina.mjs` | O MOLDE reutilizavel para pegar um bloco gerado e executa-lo de verdade numa pagina que imita uma do Prosite (servidor de uma rota, rede externa bloqueada -- com as excecoes declaradas por `permitir`/`bloquear` --, relogio falso opcional, `reducedMotion` opcional). Exporta `comBlocoNaPagina`, `gerarNaFerramenta`, `textoSemScripts`, `chk`, `resumo`. | Quando o teste precisa que o bloco RODE num DOM (anima? o botao aparece? o valor calculado bate?), nao so que o texto gerado seja igual a uma referencia. Cada teste concreto e um script pequeno que importa este modulo -- ver exemplo abaixo. |

## Como rodar

Precisa de Node e do Playwright com o Chromium baixado -- `lib.mjs` diz o que
instalar se faltar (`npx playwright install chromium`, ou apontar um
Chromium/Playwright ja existente com `FC_CHROME`/`FC_PLAYWRIGHT`).

```sh
# regressao byte a byte contra a main -- as DUAS passagens, num comando so
scripts/verificar/regressao.sh

# regressao contra outro commit/branch
scripts/verificar/regressao.sh algum-commit

# os blocos com os textos de escape, executando de verdade
node scripts/verificar/textos-escape.mjs

# o valor minimo do cupom, com os tres blocos rodando de verdade
node scripts/verificar/cupom-minimo.mjs

# o editor em linha da lista de cupons, nas tres abas
node scripts/verificar/lista-cupons.mjs

# a quantidade do opcional no que vai para o PayPal, com o bloco rodando
node scripts/verificar/pac-quantidade.mjs

# o botao de duplicar: pacote, opcional, e o original que nao pode ser sobrescrito
node scripts/verificar/duplicar-itens.mjs
# o mesmo teste apontado para a main, para ver os casos falharem la
git worktree add --detach /tmp/ref main && node scripts/verificar/duplicar-itens.mjs /tmp/ref

# o formulario de cadastro: a recarga devolve, o preset zera (as tres abas)
node scripts/verificar/preset-formulario.mjs
# o mesmo teste apontado para uma arvore de referencia, para ver o defeito falhar la
git worktree add /tmp/ref main && node scripts/verificar/preset-formulario.mjs /tmp/ref

# o filtro de origem do TidyCal, a guarda do campo e a migracao
node scripts/verificar/tidycal-origem.mjs

# a altura automatica do calendario, nos dois blocos que criam o proprio iframe
node scripts/verificar/tidycal-altura.mjs

# o calendario unificado, contra o TidyCal de verdade (PRECISA DE INTERNET)
node scripts/verificar/tidycal-unificado.mjs
node scripts/verificar/tidycal-unificado.mjs algum-commit

# a pre-conexao, o aquecimento do calendario e o e.source (PRECISA DE INTERNET nas partes 3 e 4)
node scripts/verificar/calendario-aquecido.mjs
node scripts/verificar/calendario-aquecido.mjs algum-commit

# o acento que falta no texto que uma pessoa le (sai 1 se achar algo)
node scripts/verificar/acentos.mjs
node scripts/verificar/acentos.mjs --vocabulario

# um teste novo que use o molde de pagina.mjs (exemplo, nao existe no repo)
node scripts/verificar/teste-bordas.mjs
```

## As duas passagens da fotografia

Desde 03/09/2026 `geradores.mjs` roda o cenario DUAS vezes:

- **fabrica** -- todos os textos no padrao. E a passagem historica, e prova o
  invariante: mexer numa aba nao muda um byte do que as outras geram.
- **configurada** -- 28 campos `*-txt-*` preenchidos, escolhidos por criterio:
  um por aba (as dez, menos Bordas e Efeitos de pagina, que **nao tem nenhum**
  campo de texto), todos os tipos de marcador (`{pct} {valor} {n} {data}
  {codigo} {nome} {cod} {desc}`), os quatro caminhos de escape da ferramenta, e
  o subtitulo da vitrine, que so e emitido quando preenchido.

Ela existe porque a de fabrica **nao dizia nada sobre o caminho configurado**:
com os textos no padrao, um texto que o gerador deixasse de emitir, ou que
escapasse errado, passaria sem acusar nada. Na rodada que criou os 162 campos
de texto, um marcador `{n}` chegou a ficar cru na tela do cliente -- a passagem
de fabrica via a declaracao da variavel e passava; so a configurada alcanca o
uso.

**Cada texto configurado leva um selo (`ZxNN`), e o script cobra que ele apareca
em alguma saida.** Selo que some e campo mal ligado, ou ramo que o cenario nao
percorre -- e ramo nao percorrido so e aceito quando esta **declarado**, com o
motivo, na quarta coluna da tabela `TEXTOS` em `cenario.mjs`. A declaracao
tambem e conferida ao contrario: se o ramo declarado voltar a aparecer, o script
avisa que a declaracao envelheceu.

## Exemplo minimo de uso do molde (`pagina.mjs`)

```js
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';

// 1. gera o bloco na propria ferramenta
const { valores } = await gerarNaFerramenta(async pg => {
  // ...preencher campos e clicar no botao de gerar da aba...
}, ['b-out1', 'b-out2']);

// 2. executa o bloco gerado numa pagina de verdade
const r = await comBlocoNaPagina({
  cabeca: valores['b-out1'],                       // vai na Tag Head
  corpoAntes: '<div id="alvo">conteudo</div>',
  corpoDepois: '<scr'+'ipt>document.getElementById("alvo").style.cssText += ";' + valores['b-out2'].replace(/"/g,'\\"') + '";</scr'+'ipt>',
  medir: async pg => ({
    animacao: await pg.$eval('#alvo', el => getComputedStyle(el).animationName)
  })
});

// 3. confere e fecha
chk('animacao comeca com fc-borda-', r.animacao.indexOf('fc-borda-') === 0, r.animacao);
process.exit(resumo());
```

Um teste novo desta familia costuma ter esse formato: gerar com
`gerarNaFerramenta`, executar com `comBlocoNaPagina`, e um punhado de `chk(...)`
seguido de `process.exit(resumo())`. O molde nao sabe o que e uma "borda" ou
uma "cobranca" -- quem sabe e a funcao `medir` que cada teste escreve.

## O que este arnes NAO cobre

- **Nao substitui a conferencia visual.** Ele mede o que o codigo calcula
  (um valor, um nome de animacao, um texto), nao como a pagina fica na tela.
  Layout, espacamento e legibilidade continuam exigindo olhar.
- **Nao substitui o teste na pagina publicada.** Editor de Prosite e pagina
  publicada sao coisas diferentes (ver `CLAUDE.md` -- "editor != publicado"),
  e o sanitizador do Prosite (Manual do Prosite, em
  `docs/documentacao-fotocerta.md`) so age quando a pagina e de fato
  publicada. Um bloco que passa aqui ainda precisa ser colado e publicado
  para confirmar que o sanitizador nao mordeu nada.
- **`geradores.mjs`/`regressao.sh` comparam TEXTO, nunca executam o bloco.**
  Para conferir comportamento (anima, calcula, reage a clique) o teste
  precisa ser escrito com `pagina.mjs` -- e `textos-escape.mjs` e o exemplo
  vivo disso para os textos configuraveis.
- **O detector de acento nao alcanca tudo, e ele mesmo diz o que.** As cinco
  faixas estao escritas no cabecalho do `acentos.mjs`; as duas que mais pesam:
  palavra cuja forma ACENTUADA nao existe em lugar nenhum da arvore (nao ha com
  o que comparar) e HOMOGRAFO (`e`/`é`, `esta`/`está`, `pode`/`pôde`), que ele
  perdoa sempre -- inclusive quando o acento faltava mesmo. A "irma acentuada"
  (frase igual a outra a menos dos acentos) pega parte desses; o resto continua
  dependendo de leitura humana.
- **A INTERFACE da ferramenta fica quase toda fora.** `geradores.mjs` preenche
  campos e le saidas; ele nao confere se um campo da tela gravou, se uma lista
  mostra o que guarda, ou se um alerta esta acentuado. `lista-cupons.mjs` cobre
  um pedaco disso (o editor em linha das listas de cupons),
  `preset-formulario.mjs` outro (o formulario de cadastro na recarga, no
  "Aplicar" e num estado gravado sem a chave `form`) e `duplicar-itens.mjs` um terceiro (os botoes de duplicar das
  seis listas que os ganharam, e a exclusao de familia com o conteudo dela)
  porque foi ali que os defeitos apareceram; o resto
  continua dependendo de leitura e de olhar.
- **O cenario nao percorre todo ramo da ferramenta.** Os quatro ramos que a
  passagem configurada declara hoje como fora dele: o formato de data da pagina
  de obrigado do TidyCal (o cenario mantem "como o TidyCal mandar"), o modo
  SINAL do Checkout e da Mini loja, o botao de fechar da Contagem regressiva
  (o padrao e "Nao ter") e o marcador `{prazo}` nas mensagens dela. Ligar
  qualquer um deles mudaria a passagem de FABRICA, que e a que prova o
  invariante -- entao a escolha e consciente, e esta escrita em `cenario.mjs`.
- **Sem service worker, sem PWA de verdade.** O servidor de `pagina.mjs` e
  de uma rota so, so para hospedar o bloco sob teste.
- **Dois arquivos daqui falam com a internet, e so dois.** `pagina.mjs` aborta toda
  requisicao que nao seja do proprio servidor, de proposito -- teste que
  depende de CDN falha por rede e o erro nao teria nada a ver com o bloco. A
  excecao esta declarada em `permitir` (hosts) e `bloquear` (pedacos de URL), e
  quem a usa sao o `tidycal-unificado.mjs` e as partes 3 e 4 do
  `calendario-aquecido.mjs` (as partes 1 e 2 dele correm com a rede fechada):
  so o TidyCal de verdade sabe dizer se
  a altura acompanha o conteudo e se o formulario de reserva abre espaco, e uma
  biblioteca de terceiro pode mudar amanha. Esse arquivo PODE falhar por rede, e
  quando falhar a leitura certa e "nao mediu", nao "quebrou".
  O `tidycal-altura.mjs` continua provando o bloco contra sinais **transcritos**
  de uma medicao -- os dois se completam: aquele cobre a faixa da guarda e os
  casos que o calendario real nao produz sob encomenda (altura absurda,
  negativa, de outra origem); este cobre o comportamento contra o servico vivo.
