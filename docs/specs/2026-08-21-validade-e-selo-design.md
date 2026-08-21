# Validade do link de cobrança e selo contra edição do endereço

**Data:** 21/08/2026
**Estado:** aprovado pelo dono
**Alcance:** aba Link de cobrança (`p-`)

---

## 1. Os dois pedidos, e por que viram um

**Validade:** o dono define uma data limite ao gerar o link. Dentro do prazo, o cliente vê o prazo na tela. Depois dele, a página diz que o link expirou e manda falar com o dono.

**Selo:** o dono quer que **editar o endereço invalide o link**. Ele enunciou o próprio modelo de risco, e ele está correto: *"meu público-alvo não tem essa habilidade, e se algum tiver não vai criar problema. Só gostaria de proteger a edição do link mesmo."*

Viram um porque o selo precisa cobrir a data de qualquer forma, e porque a página passa a ter **um só** caminho de recusa em vez de dois.

## 2. Selo, não ofuscação

**Ofuscar** esconde o valor — protege pouco. **Selar** acrescenta um código calculado sobre **todos** os parâmetros: alterar qualquer um faz a conta não fechar, e a página recusa.

**O selo não é segredo, e a documentação tem de dizer isso.** Quem lê o código da página descobre a regra e sabe recalcular. Para o público descrito, é a proteção certa — e chamá-la de segurança seria a quarta vez nesta semana que um texto desta ferramenta promete demais.

A data continua **não legível a olho** no endereço (codificada de forma compacta), porque o dono pediu. Isso é conveniência visual, não proteção — o que protege é o selo.

## 3. O que o selo conserta além da data

| Parâmetro | Hoje | Com selo |
|---|---|---|
| `c` — código Pix | Já protegido: CRC conferido **e** remontagem com os dados do recebedor exigindo igualdade byte a byte | Sem mudança |
| `d` — descrição | **Editável em silêncio** | Quebra o selo |
| `pp` — link do PayPal | **Editável**: exige só que continue sendo endereço do PayPal, então aceita a cobrança de **outra conta** | Quebra o selo |
| `v` — validade (novo) | — | Quebra o selo |

**O `pp` vale mais que a data.** É a única porta do link que leva dinheiro para fora, e hoje está aberta.

## 4. A validade é um recado, não uma tranca

**O código Pix não tem validade.** O "copia e cola" funciona para sempre; a página não é consultada no momento do pagamento.

Então a validade entrega:
- o cliente **vê o prazo**, o que muda comportamento;
- depois da data, a página **para de mostrar o pagamento** e manda falar com o dono.

E **não** entrega:
- não impede quem guardou o código Pix antes;
- não impede quem alterar o relógio do aparelho — sem servidor, a hora vem do cliente.

Quem fecha a conta continua sendo o dono conferindo **valor e data no extrato**, premissa já registrada para esta aba.

## 5. Comportamento

- **Campo "Válido até"**, opcional. Vazio = sem validade, como hoje.
- **Dentro do prazo:** o cartão mostra o prazo junto do valor.
- **Depois do prazo:** recusa mostrar o pagamento — **mesma família** das recusas que já existem (código não conferido, link sem cobrança) — dizendo que expirou e para falar com o dono.
- **"Já paguei" continua funcionando mesmo expirado.** O cliente pode ter pago no prazo e só agora estar avisando.
- **Fuso de Brasília fixo**, como a aba de contagem regressiva já faz, senão um cliente viajando veria outro prazo. O limite é o **fim do dia** escolhido (23:59:59 −03:00).

## 6. O selo é obrigatório — e isso quebra links antigos

Se o selo fosse opcional, bastaria apagá-lo do endereço para burlar. Então **link sem selo é recusado**.

**Consequência operacional:** no momento em que o dono trocar o bloco da página `/pagar`, **toda cobrança já enviada e ainda não paga para de funcionar** e precisa ser regerada.

Isso **tem de ser dito na aba**, ao lado do código 1, e não só na documentação — é a única mudança desta rodada que alcança gente fora da ferramenta.

## 7. Implementação

- **Reúso obrigatório:** não invente função de hash. O arquivo já tem `crc16` (em `FC_PIX_SRC`) e a assinatura djb2 do catálogo da loja. Escolha entre as existentes e **justifique**; se nenhuma servir, diga por quê antes de criar.
- O selo é calculado sobre os parâmetros **na ordem em que saem no endereço**, para os dois lados computarem igual.
- **Fonte única**, no padrão do `FC_PIX_SRC`: a mesma fonte literal que a ferramenta avalia é a que vai dentro do bloco. Selo calculado de um jeito na ferramenta e conferido de outro no bloco é a duplicação que este projeto persegue — e aqui produziria link que a própria página recusa.

## 8. Verificação

- **Editar cada parâmetro, um a um** (`c`, `d`, `pp`, `v`) → recusa. Inclusive alterações mínimas: um caractere na descrição, um dígito na data.
- **Apagar o selo** → recusa. **Apagar outro parâmetro** → recusa.
- **Link íntegro** → funciona, e o payload Pix continua conferindo por leitor TLV independente.
- **Validade:** véspera, o próprio dia (até 23:59:59 de Brasília), dia seguinte. Relógio do aparelho adiantado e atrasado.
- **Sem validade** (campo vazio) → nenhuma menção a prazo na tela.
- **"Já paguei"** funciona expirado.
- **Textos hostis** na descrição continuam contidos, com o selo por cima.
- **Regressão:** as saídas dos outros sete geradores **byte a byte idênticas**. O `p-out1` muda (o bloco ganha a conferência do selo e a tela de expirado) e o `p-out2` muda (o link ganha o selo) — mudanças justificadas, com o diff enumerado.

## 9. Estimativa

**2h – 3h**, margem de revisão incluída. Contido: uma aba só, o motor de recusa já existe, e a integração com preset, backup e painel é pequena porque a aba já está lá.
