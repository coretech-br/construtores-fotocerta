# O contador da barra virou opcional

**Data:** 22/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba Contagem regressiva). **Nenhum arquivo compartilhado** — sem troca de versão.

---

## 1. O pedido, e o que ele não é

O dono queria escolher se a barra **mostra ou não** o tempo restante. Nas palavras dele: *"Nada muda em relação à contagem regressiva em si. Apenas quero definir se ela aparece ou não."*

É essa fronteira que governa o desenho: **o contador é a tela; a contagem é o motor.** Com o contador desligado, o prazo continua correndo — a urgência entra na hora marcada, a barra de progresso anda e o "quando a contagem zerar" acontece igual. As três olham o `restante`, nunca o relógio, e por isso nada nelas foi tocado.

Serve a um caso real: querer a pressão do prazo sem o número piscando na cara do visitante.

## 2. Por que o esforço foi baixo

O gerador já era construído assim: `if(cfg.prog)` para a barra de progresso, `if(cfg.urg.ativo)` para a urgência. O relógio virou o terceiro interruptor no mesmo molde. E o relógio já estava isolado em cinco variáveis de configuração e quatro funções (`itensRelogio`, `chaveRelogio`, `relogio`, `atualizarRelogio`), nenhuma delas consultada pelo `tick` para decidir o que fazer com o tempo.

**O que some do bloco entregue** com o contador desligado: as seis regras CSS do relógio, o piscar do separador, a virada dos dígitos (e a linha correspondente no `@media (prefers-reduced-motion)`), as cinco variáveis, as quatro funções, o marcador `data-fcb-rel` e a chamada `atualizarRelogio(restante)` dentro do `tick`. Medido: **8715 bytes com o contador, 4867 sem** — e zero resto de relógio no bloco desligado, conferido por varredura de dezessete identificadores.

**O que fica:** o `tick`, a urgência, o progresso, o encerramento, a mensagem, o botão de ação, a coruja, a rolagem e a alternância.

## 3. As três decisões

**O `{contador}` é removido, não deixado literal.** A mensagem pode trazer o marcador que diz onde o relógio entra. Sem relógio, `comMarca` passa a trocá-lo por vazio — deixá-lo mostraria a palavra `{contador}` na barra, que é pior. A aba **diz isso na tela**, no aviso âmbar.

**Cinco escolhas ficam à vista, desabilitadas, com aviso âmbar** — unidades, rótulos, formato, "esconder os dias zerados", animação dos dígitos e o efeito *piscar* (que pisca o separador do relógio). É o mesmo tratamento do desconto Pix com sinal ligado e do pulsar com alternância deslizante. Esconder faria os valores sumirem sem explicação.

**A recusa "marque pelo menos uma unidade" passou a valer só com o contador ligado** — com ele desligado, "nenhuma unidade" é a configuração pedida, e não um descuido. A mensagem da recusa agora aponta o interruptor.

**Estado antigo vale como ligado.** Preset ou estado salvo por versão anterior não traz a chave `contador`; ausente = ligado, que é como a barra sempre se comportou. Restaurar um preset antigo não pode apagar o relógio.

## 4. Um buraco antigo que apareceu no caminho

A pílula de seleção de `.radios` **não tinha estilo de desabilitado**. O `<input>` é escondido (`opacity:0`) e quem se vê é o `<span>`, que não herdava nada do estado do controle — um campo desligado ficava idêntico a um ligado, e o operador clicaria sem entender por que nada acontece.

Isso alcançava **três casos anteriores** a esta rodada: o "reiniciar" fora do modo abertura, o pulsar com alternância deslizante e o pulsar de urgência. Corrigido com uma regra (`opacity:.45; cursor:not-allowed`), na mesma linguagem visual do `.botao[disabled]` que o arquivo já usava. Metade do padrão "desabilitado com aviso âmbar" estava faltando desde que ele foi criado.

## 5. Verificação

- **O invariante: com o contador LIGADO (o padrão), as 12 saídas dos oito geradores, os 14 links e as 12 variações de bloco saíram byte a byte idênticas** à `main` (`bad8080`). É a prova de que a mudança não escreveu nada de novo — ela só passou a poder omitir.
- **O bloco entregue, executado numa página servida de verdade** (documento mínimo, rede externa abortada), em **oito combinações** — mensagem única, mensagem com o marcador `{contador}`, urgência ligada e barra de progresso ligada, cada uma com o contador ligado e desligado. Em cada uma: a barra existe e tem conteúdo; o literal `{contador}` **nunca** aparece; com o contador ligado há `.fcb-num` e o texto **muda** em 2,2 s; com ele desligado **não** há `.fcb-num` e o texto **não** muda; zero erro de JS. **48 de 48.**
- **Na interface, nos dois estados:** aviso âmbar aparecendo e sumindo, as quatro unidades, os quatro rótulos, o piscar, o "esconder dias", o formato e a animação dos dígitos desabilitando e reabilitando, e a **prévia** (que executa o bloco) com e sem relógio, nunca com o literal `{contador}`.
- **570 IDs na ferramenta, nenhum repetido.** Zero erro de console em toda a rodada.

## 6. Nota de método

O arnês que executa a barra foi escrito por um subagente em **Sonnet**, em segundo plano, enquanto as edições do gerador seguiam no modelo principal — a primeira aplicação do método econômico combinado nesta data e registrado na `CLAUDE.md`. A divisão seguiu a regra: o que é mecânico e separável delega; o que decide comportamento emitido, não.
