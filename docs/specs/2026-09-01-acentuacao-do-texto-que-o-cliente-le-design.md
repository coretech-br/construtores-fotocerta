# Acentuação de todo texto que uma pessoa lê — design

**Data:** 01/09/2026
**Estado:** implementado
**Alcance:** os blocos do **Checkout** e da **Mini loja**, mais o texto da própria ferramenta

---

## 1. Como esta rodada nasceu

Ao ver `Valido ate` na tela, o dono pediu o acento. Corrigido, ele mandou fechar a questão: *"Revise se há algum outro texto que ficou sem acento nos outros construtores e aproveite a rodada para corrigir tudo. O que me interessa é o que o usuário vê e o que o código que os construtores geram (e que vão para tela do usuário)."*

## 2. A regra, que já existia e não estava sendo seguida

O **item 10 do Manual do Prosite** diz: *sem acentos em código colado; textos visíveis com acento OK*. A ferramenta já tinha registrado essa análise por escrito em ago/2026, na aba Link de cobrança, com o precedente publicado (`MSG_FINAL='Promoção encerrada'`, da Contagem regressiva).

Mesmo assim o projeto andou nas **duas direções**: o Link de cobrança ganhou acentos, e a Mini loja **perdeu** os dela, alinhada ao Checkout, "para o bloco inteiro ficar ASCII". Esta rodada desempata e fixa a fronteira em três faixas:

| Faixa | Acento | Por quê |
|---|---|---|
| **Texto que uma pessoa lê** — tela do cliente e tela da ferramenta | **sim** | é português escrito à vista de quem compra da marca |
| **Mensagem do WhatsApp** montada pelo bloco | **não** | convenção deliberada, registrada desde a aba Leads |
| **Código**: comentários, identificadores, CSS, payload Pix | **não** | item 10 do Manual; no Pix é obrigatório (`semAcento`) |

## 3. Como o inventário foi levantado — e por que não bastou grep

Procurar "palavras erradas" com uma lista escrita à mão erra dos dois lados: deixa passar o que não está na lista (`aleatoria`, `ilegivel`) e acusa o que está certo (`e`, `esta`, `so`, `ate` são palavras válidas sem acento).

O que funcionou foi **deixar a própria ferramenta ser o dicionário**: colher todas as palavras **acentuadas** que ela já escreve, tirar o acento delas, e procurar essa forma aparecendo em outro lugar. Se a ferramenta escreve `página` num ponto e `pagina` noutro, um dos dois está errado — e não é preciso saber português para perceber. Sobrou uma lista curta de ambíguas (`e`, `esta`, `só`, `há`, `três`, `mês`), revisadas à mão.

E foram **duas** varreduras, sobre duas realidades diferentes:

1. **O que os construtores geram**: as 21 saídas foram gravadas em arquivo e varridas. Para isso o arnês ganhou `FC_DUMP=<pasta>` (ver §6).
2. **O que a ferramenta mostra ao dono**: a página foi aberta num navegador, as nove abas percorridas, e **todo texto visível** colhido do DOM renderizado — nós de texto, `placeholder`, `title`, `aria-label` e `<option>`. Ler do fonte teria confundido comentário com interface; ler da tela não confunde.

## 4. O que mudou

**Nos blocos entregues (Checkout e Mini loja), 24 textos:**

- `Copiar código Pix`, `Código copiado!`, `Já paguei - avisar no WhatsApp`, `Cupom inválido.`
- `Não foi possível concluir o pagamento. Tente novamente.` e `Resumo para conferência` (padrões de campo do operador)
- `Escolha ao menos um item: o pedido está em zero.` (nas duas abas, mais os dois `alert` da loja)
- `O sinal deste carrinho/pedido é maior que o total…`
- Da Mini loja: `Seu carrinho está vazio…`, `Esta foto não carregou. Confira o endereço dela…`, as quatro mensagens de item que **saiu do catálogo**, `…estava ilegível e foi descartado`, e `…era de outra versão desta loja… para você não pagar um preço que não é o que está na tela`
- **O rodapé de limites da loja inteiro** (`mLimitesTexto`), seis frases que o cliente lê embaixo do carrinho

**Na ferramenta, 9 textos:** o carimbo de publicação (`Esta é a versão que o SEU navegador está executando… se estiver atrás da que foi publicada`), os dois `Cole aqui o código-fonte inteiro da página`, `chave aleatória`, os três títulos de prévia (`Prévia do carrinho de checkout`, `Prévia da barra de contagem regressiva`, `Prévia da página de cobrança`), `O link desta cobrança aparece aqui`, os exemplos de campanha (`ensaio temático`, `loja de álbuns`), a caixa de prévia das Bordas (`Presenteie uma família` / `Este é o componente destacado…` / a legenda inteira) e os **quatro parágrafos de limites** da aba Efeitos.

**Uma nota que ficou falsa foi reescrita**, e não apagada: o Checkout dizia ao operador que *"os padrões da aba são escritos sem acento, como 'Nao foi possivel concluir o pagamento'"*. Agora diz o que passou a valer — o que o cliente lê sai acentuado, o que vai na mensagem do WhatsApp sai sem acento, de propósito.

## 5. O que NÃO mudou, e a razão de cada um

- **A mensagem do WhatsApp** (`Ola! Acabei de pagar via Pix.`, `Pedido cod:`, e as três frases da aba Leads). Convenção deliberada, já registrada.
- **Comentários e identificadores dentro do bloco** — `FOTO CERTA - BOTAO FLUTUANTE`, `HORARIO_FUSO`, `CHAVE_CESTA`. São código.
- **O payload Pix.** Nome e cidade do recebedor continuam passando por `semAcento`; é obrigação da norma do BC, não estilo.
- **Exemplos que são endereço de verdade** (`/albuns`, `usuario/nome-do-agendamento`, `#secao-2`, `fcbar:SEU-CODIGO`).

## 6. O arnês ganhou uma peça

`scripts/verificar/geradores.mjs` passou a aceitar **`FC_DUMP=<pasta>`**, gravando o **texto** de cada saída além do hash. O hash responde *"mudou?"*; o texto responde *"mudou o quê?"* — que é a pergunta que toda rodada com divergência intencional precisa responder na spec. Até aqui, enumerar o diff exigia reconstruir a captura à mão dos dois lados.

Foi com ele que o §7 abaixo saiu pronto.

## 7. O que foi medido

**Regressão byte a byte contra a `main`: 2 divergências, as duas intencionais** — `u-out` e `m-out`. As outras **19 saídas** e as **9 cobranças** (link e bloco de cada uma) idênticas. O tamanho em caracteres **não mudou** nas duas: acento troca a letra, não acrescenta letra — mais uma razão para o diff ser lido, e não só o número.

**O diff enumerado**, saída por saída, com `FC_DUMP` nos dois lados: em `u-out`, 6 linhas, todas `var TXT_…`; em `m-out`, 21 linhas — 20 `var TXT_…` mais **um** `alert()` do caminho Pix. Nenhuma outra linha dos dois blocos mudou: nem CSS, nem identificador, nem a montagem do payload.

**Os dois blocos executados de verdade** numa página que imita o Prosite — **18 verificações, 18 ok**:

- o rótulo do botão lido **da tela renderizada** é `Copiar código Pix` (e não a sequência quebrada que um erro de codificação produziria);
- o botão do WhatsApp é `Já paguei - avisar no WhatsApp`;
- o **payload Pix gerado é 100 % ASCII**;
- a **estrutura TLV fecha exatamente** e o **CRC confere**, relidos por um leitor escrito só a partir da norma — se ele copiasse a implementação do bloco, os dois errariam junto;
- o campo 59 (nome do recebedor) continua sem acento.

Essa última bateria é o que separa esta rodada de uma troca de letras: acento que vazasse para dentro do BR Code quebraria a cobrança, e nenhuma leitura de código prova isso — só reler o payload prova.

**Varredura final:** nenhuma palavra acentuada em um lugar continua sem acento em outro, nem nas 21 saídas nem nos 2 100 trechos de texto da tela da ferramenta. As exceções que sobraram são as declaradas no §5.

## 8. Dívida encontrada e declarada, não corrigida aqui

A Mini loja escreve a frase `Escolha ao menos um item: o pedido está em zero.` **três vezes**: uma como `TXT_TOTAL_ZERO` e mais duas cruas, dentro de dois `alert()` do caminho Pix. Hoje as três concordam. Amanhã, o dono que trocar `TXT_TOTAL_ZERO` no bloco publicado verá dois avisos continuarem com o texto antigo — sem erro e sem aviso.

Não foi corrigido nesta rodada de propósito: `TXT_TOTAL_ZERO` só é emitido dentro de `if(usaPP)`, então usá-lo no caminho Pix exige mover a declaração — e loja em "somente Pix" com variável ausente é exatamente o defeito que já matou esta aba uma vez (`MOEDA is not defined`, sem produtos e sem aviso). Trocar comportamento numa rodada de tipografia é como se esconde defeito. Está em `docs/pendencias.md`.

> **Dívida paga no mesmo dia.** Ainda em 01/09/2026, `docs/specs/2026-09-01-whatsapp-acentuado-e-frase-unificada-design.md` moveu a declaração de `TXT_TOTAL_ZERO` para `if(usaPP||usaPix)` e unificou as três ocorrências — com o Checkout ganhando a mesma unificação de quebra, a pedido do dono.

## 9. Tempo

Estimado: 30–45 min. Real: **~1h10** — o levantamento custou mais que a correção, e valeu: metade dos achados (o rodapé de limites da loja, os quatro parágrafos da aba Efeitos, o carimbo de publicação) não estava no meu palpite inicial.
