# A ordem das caixas dentro das abas

Pedido do dono em 03/09/2026, a partir de um print da aba Agendamento por pacote:

> *"A criacao da familia esta fora de ordem. Existe uma ordem logica... Primeiro cria-se
> familia, depois os pacotes. Aproveite para revisar a ordem das coisas nas outras abas
> tambem, para que a sequencia faca sentido sempre."*

## O levantamento: seis abas limpas, tres achados

Varredura mecanica primeiro: para **todo** `style.display=` comandado por um `radio(...)` no
arquivo, comparou-se a linha do elemento escondido com a do controle que o comanda.
**Zero casos** de controle depois do alvo, nas dez abas. Nenhum campo condicional depende de
um radio que so aparece adiante.

Sem problema de ordem: **Captacao de leads, TidyCal, Checkout, Bordas, Contagem regressiva e
Efeitos de pagina.** Nas seis, as dependencias correm da esquerda para a direita e da secao
menor para a maior. Aba certa e resultado, nao ausencia de trabalho — registrado para a
proxima revisao nao refazer a varredura.

## Os tres achados, e a decisao de cada um

### 1. Aba `pac`, secao 2 — o caso do print

O `<select id="a-pfam">` e o **primeiro** campo do formulario de pacote e e populado por
`aFamOpcoes` a partir de `aFamilias`, que e alimentada pelos campos da **coluna 2**. Numa
grade de duas colunas a leitura e esquerda→direita: a tela pede primeiro o que depende do que
vem depois.

Medicao que ameniza, mas nao resolve: `aFamilias` nasce com uma familia padrao e o campo fica
**escondido** enquanto houver so uma. O defeito so aparece **depois** de o operador ja ter ido
a coluna 2 criar a segunda — que e exatamente o que o dono fez.

**Decisao: partir em duas secoes numeradas** (opcao (c) do levantamento).

- **"2 Familias de pacotes"** — formulario a esquerda, lista a direita.
- **"3 Pacotes e itens opcionais"** — formulario a esquerda, lista + cupons a direita.

**Por que esta e nao a mais barata.** A opcao mais barata era trocar as duas colunas de lugar,
uma linha de HTML. Ela corrige a leitura e **quebra a convencao** — a coluna do formulario
passaria a conter uma lista, e a proxima aba que copiar o padrao herdaria a quebra. A opcao
escolhida e a unica em que cada secao volta a ter **um** formulario e **uma** lista, que e o
que a convencao descreve.

E ha uma razao mais forte: o dono descreveu o problema como uma **sequencia** ("primeiro
cria-se familia, depois os pacotes"). Secao numerada e justamente como esta ferramenta escreve
sequencia. Corrigir uma ordem quebrada com o mecanismo que ja existe para expressar ordem e
melhor que corrigi-la mudando de coluna.

**Custo, declarado:** renumerar as secoes seguintes da aba, e os textos que citam secao por
numero (ha pelo menos dois). Numero de secao escrito a mao e o mesmo tipo de armadilha que o
`ABAS.length` ja resolveu para a contagem de abas — se houver como derivar, melhor.

### 2. Aba Slideshow, secao 1 — a importacao em dois passos

Tres caixas na grade: cadastro manual, passo 1 da importacao e passo 2. No computador o passo
2 cai na **diagonal** do passo 1; no celular a ordem ja e correta.

**Decisao: juntar os dois passos numa caixa so** (opcao (a)), com os campos de legenda/tamanho
e o botao *Adicionar a lista* no fim dela.

Repare que isso tambem aproxima a secao da convencao em vez de afasta-la: ela passa de **tres**
caixas na grade para **duas**, que e o que a regra do projeto descreve.

Vale registrar o contra-argumento, porque ele e bom: o botao *Adicionar a lista* nasce
`disabled` e so liga depois da conferencia, entao o passo fora de ordem **nunca produz
resultado errado** — produz leitura confusa. E defeito de entendimento, nao de comportamento;
foi consertado porque o pedido do dono era sobre a sequencia fazer sentido.

### 3. Aba Mini loja, secao 2 — consumidor antes da fonte

*Cadastrar produto* tem um campo *Foto do produto* que manda usar o botao **Usar** da caixa
*Importar galeria* — que fica **abaixo** dele, na mesma coluna. O botao escreve direto no
campo. E o texto de ajuda diz **"ao lado"**, quando o lugar e abaixo.

**Decisao: inverter as duas dentro da coluna 1** (opcao (a)) — importacao em cima, cadastro
embaixo. A fonte precede o consumidor, a coluna 2 continua sendo a das listas, e a convencao
fica intacta. O texto de ajuda passa a dizer **"acima"**.

A opcao de so corrigir a palavra ("abaixo" no lugar de "ao lado") consertaria a frase e
deixaria a ordem errada de pe. Texto que descreve corretamente um arranjo ruim continua sendo
um arranjo ruim.

## O que NAO foi mexido, e por que

**A ordem "pagamento antes de produtos"** e igual nas tres abas que cobram (Checkout, Mini
loja, `pac`), e para o **cliente** a ordem e a inversa: ele escolhe o produto e depois paga.
Nao ha dependencia funcional em nenhum sentido, e as tres abas concordam entre si. Inverter
seria mudar tres abas por uma tese sobre o fluxo, sem defeito medido — e a coerencia entre as
tres vale mais que a intuicao. **Fica registrado como pergunta ao dono**, nao como conserto.

**Duas observacoes que nao viraram item**, para nao inflar a lista: a aba Link de cobranca
forca `ppmodo='nao'` quando o PayPal esta desligado na secao 1, sem que o radio da secao 3
mostre isso — e problema de **visibilidade**, que mudar ordem nao conserta; e a dobra de
textos do Checkout agrupa por tema e nao por posicao na pagina, que e uma escolha, nao um
defeito.
