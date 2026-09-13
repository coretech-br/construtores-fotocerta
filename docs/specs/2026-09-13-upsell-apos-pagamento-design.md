# Levar o cliente a outra página depois do pagamento (upsell)

Pedido do dono em 13/09/2026: *"Depois que o cliente faz o pagamento no PayPal com sucesso, é
possível encaminhar o cliente para alguma outra página? Por exemplo, eu poderia enviar para uma
página de UPSELL em alguns tipos de campanha."* Escolheu **A + C**.

## O que já existe, medido

`fcPpBotoesSrc` tem um quinto parâmetro, `aoAprovarExtra`: um texto de JS que roda **depois** de
`actions.order.capture()` dar certo. Já é usado — a Mini loja passa `cestaLimpar();`. O ponto de
encaixe existe, está numa fonte única e serve às três abas que usam essa função. A `/pagar` tem o
seu próprio `onApprove` (`pJs`), sem o gancho.

## A assimetria que manda no desenho

**O Pix não avisa a página quando o cliente paga.** Ele copia o código, sai para o app do banco, e
a página não é consultada no momento do pagamento — limitação já registrada no projeto. Então:

- **A (PayPal):** redirecionamento **automático**, porque houve confirmação de verdade.
- **C (Pix):** o botão **"Já paguei"**, que já existe, passa a poder levar ao upsell. Não é
  automático, e **não deve ser**: redirecionar sozinho no Pix afirmaria uma confirmação que
  ninguém deu.

Com a prioridade do Pix publicada em 12/09, o Pix tende a ser o caminho da maioria — então C não é
um extra, é a metade que alcança a maior parte dos clientes.

**Registrado para o dono, e é decisão de negócio dele:** a página de upsell vai receber gente que
ainda **não pagou** pelo caminho C. Se a oferta depender do primeiro pagamento estar feito, o
problema é do desenho da campanha, não do código.

## O campo

Um por aba de pagamento, vazio de fábrica. **Vazio = nada muda**, e o bloco sai byte a byte como
hoje — mesmo critério dos três textos do sinal.

**Validação obrigatória:** o projeto já recusa `href` com esquema fora de âncora, caminho relativo e
`http(s)` (`cGerar`, na Contagem regressiva). **Reusar essa regra**, não escrever outra — um campo
de endereço que aceite `javascript:` é um buraco que o dono cola no próprio site.

## O que PRECISA ser medido antes de escrever o C

O "Já paguei" hoje faz `window.open` para o WhatsApp. Acrescentar um redirecionamento da página
atual **logo depois** é a parte frágil, e não se resolve por raciocínio:

- no celular, abrir o WhatsApp normalmente **tira o cliente da página** — e aí redirecionar a página
  de trás pode não significar nada, ou pior, o cliente volta e está noutro lugar sem entender;
- `window.open` seguido de navegação imediata pode **perder a aba** que acabou de abrir.

**Medir os dois caminhos** (com e sem WhatsApp configurado, em largura de celular e de computador)
e **declarar o comportamento escolhido com a medição ao lado**. Se a medição disser que os dois não
convivem, a saída provável é o C virar um **botão próprio** ("ver a oferta"), separado do "Já
paguei" — e isso é decisão a levar ao dono, não a tomar sozinho.

## Provas obrigatórias

1. `regressao.sh main` → **zero divergência** com o campo vazio.
2. Com endereço preenchido: o PayPal aprovado leva à página, conferido com o `capture()` simulado
   pela sonda do SDK que as suítes já usam.
3. O esquema recusado (`javascript:`, `data:`) não gera bloco.
4. O caminho C medido nos dois cenários acima, com o comportamento declarado.
5. **A ordem importa:** no caso da Mini loja o gancho já esvazia a cesta. Provar que o
   esvaziamento acontece **antes** do redirecionamento — senão o cliente volta com a cesta cheia.

## O alcance: TODOS os construtores de pagamento (decidido em 13/09/2026)

Pedido do dono: *"Vamos fazer isso em todos os construtores de pagamento. Inclusive no link de
cobrança (/cobrar /pagar)."* São quatro: Checkout, Mini loja, Agendamento por pacote e Link de
cobrança.

### No Link de cobrança: FIXO DA PÁGINA, não por cobrança

Decisão dele, depois de ver o custo dos dois caminhos.

**Por que isso importa tanto aqui:** endereço escolhido por cobrança **viajaria no link**, e tudo
que viaja no link **entra no selo** — o que derrubaria todo link novo em qualquer `/pagar` com o
código 1 antigo, obrigando o dono a **recolar de novo**, poucos dias depois de já ter recolado pela
rodada D. Fixo da página não toca o selo, não muda um byte de link nenhum, e **entra no mesmo
código 1 que ele ainda vai colar** — custo zero de tarefa para ele.

**Consequência declarada:** todas as cobranças daquela página levam ao mesmo upsell. Se um dia ele
quiser upsell por campanha no link, isso é rodada própria, com selo e recolar — e é o que a opção
que ele recusou custaria.

**A `/pagar` não usa `fcPpBotoesSrc`:** ela tem o próprio `onApprove` em `pJs`, sem o gancho
`aoAprovarExtra`. Ou o gancho é levado até lá, ou o redirecionamento é escrito ali — **medir e
decidir**, preferindo a fonte única, mas sem forçar: extração parcial bem justificada é melhor que
completa e frágil, e esta aba já ficou de fora de uma extração antes, com a medida do porquê.

### O caminho C nas quatro

O "Já paguei" existe no Checkout, na Mini loja e na `/pagar`. **Na aba Agendamento por pacote não
há carrinho com "Já paguei"** — medir o que existe ali e declarar; se não houver ponto natural, o C
não se aplica àquela aba, e isso se diz em vez de se inventar um botão.

### O que NÃO muda

`fc-compartilhado.js` só é tocado se o gancho for levado à `/pagar` por lá. Se for, vale a
disciplina de versão em **QUATRO** lugares (ver a correção de 13/09) e `conferir-versoes.sh`.

## O interruptor, e a edição direta no código (pedido do dono, 13/09/2026)

*"Lembrando que o redirecionamento só deve ser realizado se ele estiver configurado nos
construtores. Além de ter a URL de redirecionamento, eu gostaria de ter um botão de seleção para
ativar/desativar. E para não ter que ficar regerando código, eu poderia editar diretamente o código
na página, alterando a variável que controla esse flag."*

São **dois** controles na aba, não um: o **endereço** e um **interruptor** ligado/desligado.

### As duas variáveis nascem NO TOPO do bloco, editáveis

Isto já é o padrão da casa — *"variáveis de customização no topo, comentadas com os valores
permitidos"* — e agora ele tem uso concreto: ligar e desligar o upsell **no site, sem voltar à
ferramenta e sem recolar nada**.

```
var UPSELL_ATIVO = true;              /* true ou false */
var UPSELL_URL   = 'https://...';     /* para onde ir depois do pagamento aprovado */
```

O nome final segue o prefixo de cada bloco. O comentário ao lado diz os valores aceitos, como os
outros do topo.

### A regra de emissão — e ela é o ponto delicado

| Endereço | Interruptor | O que o bloco leva |
|---|---|---|
| vazio | desligado | **nada** — bloco byte a byte igual ao de hoje |
| preenchido | ligado | as duas variáveis, com `ATIVO = true` |
| preenchido | desligado | **as duas variáveis, com `ATIVO = false`** |
| vazio | ligado | **a ferramenta RECUSA gerar** |

A terceira linha é a que atende o pedido dele: **desligado não pode significar "não emitir"**, senão
não existiria variável para editar na página, e o "sem regerar" não valeria nada. Desligado emite o
código inteiro, inerte, esperando um `true`.

A quarta linha é recusa e não aviso: ligado sem destino é um estado que **não faz nada** e parece
que faz. O projeto já recusa código de campanha vazio e `href` com esquema inválido pelo mesmo
motivo. A mensagem tem de dizer o que fazer — preencher o endereço ou desligar o interruptor.

### O que isso obriga nas provas

- **Os quatro estados da tabela**, com o bloco **executando**: o desligado tem de carregar as
  variáveis e **não redirecionar**; ligar `UPSELL_ATIVO` **no código, sem regerar** tem de passar a
  redirecionar. Esta última é a prova que representa o pedido dele — sem ela, "editar direto no
  código" é promessa não medida.
- **A recusa** do estado incoerente, com a frase que ela mostra.
- A validação de esquema continua valendo, e vale **na hora de gerar**. No código editado à mão o
  dono é o responsável — mas o bloco não deve quebrar feio se o endereço for inválido: medir o que
  acontece e declarar.
