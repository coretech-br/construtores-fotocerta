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
| `pagina.mjs` | O MOLDE reutilizavel para pegar um bloco gerado e executa-lo de verdade numa pagina que imita uma do Prosite (servidor de uma rota, rede externa bloqueada, relogio falso opcional, `reducedMotion` opcional). Exporta `comBlocoNaPagina`, `gerarNaFerramenta`, `textoSemScripts`, `chk`, `resumo`. | Quando o teste precisa que o bloco RODE num DOM (anima? o botao aparece? o valor calculado bate?), nao so que o texto gerado seja igual a uma referencia. Cada teste concreto e um script pequeno que importa este modulo -- ver exemplo abaixo. |

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
- **A INTERFACE da ferramenta fica quase toda fora.** `geradores.mjs` preenche
  campos e le saidas; ele nao confere se um campo da tela gravou, se uma lista
  mostra o que guarda, ou se um alerta esta acentuado. `lista-cupons.mjs` cobre
  um pedaco disso (o editor em linha das listas de cupons) porque foi ali que o
  defeito apareceu; o resto continua dependendo de leitura e de olhar.
- **O cenario nao percorre todo ramo da ferramenta.** Os quatro ramos que a
  passagem configurada declara hoje como fora dele: o formato de data da pagina
  de obrigado do TidyCal (o cenario mantem "como o TidyCal mandar"), o modo
  SINAL do Checkout e da Mini loja, o botao de fechar da Contagem regressiva
  (o padrao e "Nao ter") e o marcador `{prazo}` nas mensagens dela. Ligar
  qualquer um deles mudaria a passagem de FABRICA, que e a que prova o
  invariante -- entao a escolha e consciente, e esta escrita em `cenario.mjs`.
- **Sem service worker, sem PWA de verdade.** O servidor de `pagina.mjs` e
  de uma rota so, so para hospedar o bloco sob teste.
