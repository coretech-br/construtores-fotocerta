# Página de obrigado do TidyCal: marcadores no próprio texto

**Data:** 23/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba Agendamento TidyCal). Nenhum arquivo compartilhado novo; o leitor de parâmetros vira fonte única.

---

## 1. O pedido

O TidyCal redireciona quem agenda para uma página escolhida, e permite passar dados do agendamento na consulta do endereço. O dono quer uma página de obrigado que **mostre esses dados**: nome de quem agendou, tipo de agendamento, data e horário.

Variáveis contempladas, escolhidas por ele:

| Variável do TidyCal | Marcador na página | Parâmetro |
|---|---|---|
| `{{contact.name}}` | `{{nome}}` | `nome` |
| `{{booking.date}}` | `{{data}}` | `data` |
| `{{booking.time}}` | `{{hora}}` | `hora` |
| `{{booking.starts_at}}` | `{{quando}}` | `quando` |
| `{{booking_type.title}}` | `{{tipo}}` | `tipo` |

**O e-mail ficou de fora, por decisão.** Ele não é necessário numa página de obrigado, e a URL com nome e e-mail entra no histórico do navegador do cliente, em qualquer analytics do site e no cabeçalho `Referer` de todo recurso externo que a página carregar. Menos dado pessoal circulando por menos lugares.

## 2. Por que marcadores, e não ID Html

A primeira ideia era marcar cada campo com o **ID Html** do Prosite e escrever o valor nele. Ela funciona, e tem dois defeitos:

1. **O ID vai na coluna, não no texto.** Está registrado neste projeto desde a landing de Natal (a coluna do componente do iframe leva `ID Html = reserva`). Escrever `textContent` na coluna substitui *todos os filhos* por um nó de texto solto: o `<p>` do tema some, e com ele a tipografia, o espaçamento e as classes que a Alboom gerou.
2. **Um ID por variável é um componente por variável.** Não dá para escrever "Obrigado, **Fulano**! Seu **ensaio** está confirmado para **12/12**" numa frase só.

A variante adotada mantém a ideia — dizer onde o valor entra — e muda o alvo: em vez de apontar para um componente, o operador **marca o lugar dentro do texto**. Ele escreve, num componente de texto normal do Prosite, com a tipografia que quiser:

> Obrigado, `{{nome}}`! Seu `{{tipo}}` está confirmado para `{{data}}` às `{{hora}}`.

Um script na **Tag Body daquela página** troca cada marcador pelo valor, tocando **apenas nós de texto**. O tema continua mandando no visual.

## 3. As decisões

**Só nós de texto, nunca `innerHTML`.** Os valores vêm da URL, que qualquer pessoa edita. A troca percorre nós de texto e escreve `nodeValue`; nada do que chega pode virar marcação. É a mesma disciplina que a `/pagar` já aplica na descrição da cobrança.

**Nós de texto dentro de `script`, `style`, `textarea`, `input` e `select` são pulados.** Um marcador dentro de um script não é conteúdo, é código.

**Sem parâmetro, ninguém vê marcador.** Cada variável tem um **texto reserva** configurável. Quem abrir a página direto lê uma frase que continua fazendo sentido, em vez de `{{nome}}`. É o mesmo princípio do recado cordial da `/pagar`.

**O `{{quando}}` é reformatado só quando dá.** `{{booking.starts_at}}` deve chegar em ISO, mas o formato exato da conta do dono não é conhecido daqui. Com "data legível" ligado, o script só reformata se o valor **casar com ISO**; qualquer outra coisa sai **como veio**. Ele não inventa data.

**A troca acontece de novo se o conteúdo chegar tarde.** O tema pode montar componentes depois que a Tag Body roda. O script passa uma vez ao carregar e observa o documento por um instante curto, refazendo a troca no que aparecer. Sem isso, um componente renderizado tarde ficaria com o marcador cru na tela.

**Onde mora:** dentro da **aba Agendamento TidyCal**, em seções próprias. É a mesma sessão de trabalho — configurar o widget e a página de obrigado — e o preset da aba guarda os dois juntos, em vez de criar uma nona aba para o mesmo assunto.

**Nasce desligado.** `t-ob-usar` começa em "não": quem não usa a página de obrigado não ganha saída nova nem vê seção nova gerando código.

## 4. Fonte única do leitor de parâmetros

O `param()` que lê a consulta do endereço — incluindo o `+` que vira espaço, que é o que faz nome composto chegar certo — **já existe escrito dentro do gerador da `/pagar`**. Este construtor precisa exatamente do mesmo. Pela regra do projeto, ele passa a ser **texto literal compartilhado** (`FC_PARAM_SRC`), consumido pelos dois geradores.

O invariante que isso não pode quebrar: o `p-out1` sai **byte a byte idêntico** depois da extração. Se mudar um byte, a extração está errada — não o teste.

## 5. As duas saídas

- **`t-out4`** — o endereço para colar no TidyCal, com só as variáveis marcadas.
- **`t-out5`** — o script da Tag Body da página de confirmação.

## 6. O limite que era do dono — fechado em 23/08/2026

O dono colou a Tag Body na página de confirmação e fez um agendamento de verdade. As duas incógnitas caíram:

- **O editor de texto do Prosite aceita `{{` e `}}`** sem transformar em outra coisa. Os marcadores sobrevivem à publicação.
- **A Tag Body roda a tempo** dos componentes do tema. O reobservador de cinco segundos cobre o caso do componente tardio, mas na prática nem foi preciso esperar por ele.

## 7. O limite original, para registro

**Quando a Tag Body roda em relação aos componentes do tema.** Há precedente (a intermediária de Natal faz trabalho de DOM pela Tag Body), e o script está preparado para conteúdo tardio — mas o comportamento exato numa página publicada do Prosite só uma colagem responde. Junto: confirmar que o editor de texto do Prosite aceita `{{` e `}}` sem transformar em outra coisa.


---

## 7. O que a implementação acrescentou

**Um acoplamento que não existia foi desfeito.** Na primeira versão a página de obrigado era gerada **depois** das recusas do widget — então, com o caminho do booking type vazio, `tGerar` voltava antes e ela não saía. Um campo que nada tem a ver com ela bloqueava o recurso inteiro, e isso contradizia o próprio comentário do código, que dizia que os dois são independentes. Quem foi encontrar o defeito foi o arnês, que não preenchia o caminho.

Agora cada parte recusa pelo próprio motivo: a página de obrigado é gerada **primeiro**, e a recusa do caminho passou a dizer o que já saiu — *"Os códigos 4 e 5, da página de obrigado, foram gerados normalmente — eles não dependem dele."*

**O `às` ganhou acento.** A data reescrita é texto que o **cliente** lê, e o Manual proíbe acento em código, não em conteúdo visível — a mesma decisão já registrada para os textos fixos do bloco da `/pagar`.

**A lista `CAMPOS` sai sem vírgula pendurada** e com os comentários alinhados: é código que o operador abre e lê.

## 8. Verificação

- **O invariante:** `scripts/verificar/regressao.sh` → OK. As 12 saídas e as 9 cobranças byte a byte idênticas, **inclusive o `p-out1`**, que a extração do `param()` para fonte única não podia mexer.
- **O script da Tag Body, executado numa página que imita uma do Prosite** (bloco de conteúdo com marcadores espalhados em `p`, `h2` e `span`, o script no fim do body, rede externa abortada), em oito cenários:
  - **completo** — os quatro marcadores trocados;
  - **data legível** — `2026-12-12T15:00:00-03:00` vira `12/12/2026 às 15:00`;
  - **valor que não é ISO** com a reescrita ligada — sai **como veio**, sem inventar;
  - **sem parâmetro nenhum** — nenhum marcador sobra na tela e os textos reserva aparecem;
  - **parcial** — o que veio é trocado, o que faltou cai na reserva;
  - **hostil** — `<img src=x onerror=alert(1)>` e `</script><b>x</b>` aparecem **literais**: zero `img` novo, zero `script` extra, zero alerta;
  - **acentos e `+`** — `Ana Conceição` e `João+Pedro` chegam com acento e com espaço;
  - **conteúdo tardio** — bloco inserido 300 ms depois do carregamento tem os marcadores trocados do mesmo jeito.
  - Em todos: a **estrutura sobrevive** (a contagem de `p`, `h2` e `span` não muda) e zero erro de JS.
- **O endereço (`t-out4`)** leva só as variáveis marcadas, com as chaves cruas do TidyCal, e **não contém e-mail**.
- **Na interface:** nasce desligada; ligada, a seção aparece; recusa sem endereço e sem variável, cada uma nomeando o campo; **gera mesmo sem o caminho do booking type**, com o aviso dizendo isso; desligar esvazia as saídas e esconde as caixas. **602 IDs, nenhum repetido**, zero erro de console.

## 9. Uma correção no próprio arnês, que vale registrar

A primeira medição de "sobrou marcador na tela?" lia o `textContent` do `body` — e dava **falso negativo sempre**, porque o texto-fonte do próprio script da Tag Body contém a string `{{` (ele precisa dela para procurar). A medição passou a clonar o `body`, remover os `script` do clone e só então ler o texto. **Medir o DOM inteiro inclui o código que age sobre ele.**
