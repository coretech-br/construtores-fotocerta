# Link de cobrança — design

**Data:** 20/08/2026
**Estado:** aprovado pelo dono, pronto para implementar
**Aba nova:** a sétima, prefixo `p-`

---

## 1. O problema

O dono presta serviços contratados e precisa mandar um **link de pagamento** para o cliente: descrição do que está sendo cobrado, valor total, e a opção de pagar por **Pix ou PayPal** — sem que o cliente altere o valor.

Decisões dele, tomadas na validação de 20/08/2026:

- **Caminho B**: uma página fixa no Prosite, e um link diferente por cobrança.
- **PayPal junto**, mesmo sendo só para clientes brasileiros. Portanto **BRL nos dois meios**.
- **Comprovante pelo WhatsApp**, como o checkout já faz.
- **Várias cobranças ativas ao mesmo tempo** — foi o motivo de escolher o caminho B.
- **O link é enviado individualmente, nunca em grupo.** A exposição de dados na pré-visualização de link deixa de ser preocupação, e isso está registrado como premissa: se um dia ele mandar em grupo, a descrição e o valor ficam visíveis na prévia.

## 2. O limite que governa o desenho

**Qualquer verificação que rode no computador do cliente pode ser desligada por ele.** Impedir adulteração exige um segredo que o cliente não leia, o que exige servidor — que este projeto não tem, por decisão.

Portanto o objetivo **não** é impedir a alteração. É fazer com que alterar **não adiante**. As duas formas de pagamento se comportam de maneira oposta nisso:

| | Onde o valor mora | Cliente altera? |
|---|---|---|
| **Pix** | Dentro do próprio código Pix, campo 54 | **Não** — o app do banco trava o valor |
| **PayPal (SDK, como a aba Checkout usa)** | Calculado no navegador | **Sim** |

É isso que decide o desenho: **o valor exibido e o valor cobrado saem os dois de dentro do código Pix**, nunca de um parâmetro separado.

## 3. A decisão central: uma fonte de valor, não duas

O link **carrega o código Pix já pronto**, gerado pelo construtor com o valor dentro. A página:

1. **Lê o código Pix do endereço.**
2. **Confere a verificação interna dele (CRC).** Quebrada → **recusa mostrar a cobrança**, com explicação.
3. **Extrai o valor de dentro dele** (campo 54) e é **esse** valor que aparece na tela.
4. Usa **o mesmo valor** para o botão do PayPal.

Consequência que é o ponto do desenho: **tela, Pix e PayPal não têm como divergir**, porque leem o mesmo lugar. É o mesmo princípio que rege as prévias deste projeto — a prévia executa o gerador em vez de imitá-lo.

A **descrição** viaja em parâmetro próprio e é cosmética: alterá-la não muda um centavo do que chega. Vale dizer isso na documentação, para ninguém tentar "proteger" o que não precisa.

**Pix sem valor é recusado na geração.** Um código Pix sem o campo 54 deixa o pagador digitar o valor que quiser — exatamente o que esta aba existe para evitar.

## 4. O que a aba gera

Duas saídas, com ciclos de vida diferentes — e isso precisa estar claro na interface, porque é a novidade em relação às outras seis abas:

| Saída | Quando se usa | Onde vai |
|---|---|---|
| **1. Bloco da página de pagamento** | **Uma vez só** | Componente HTML de uma página fixa do Prosite (ex.: `/pagar`) |
| **2. Link desta cobrança** | **A cada cobrança** | Copiado e enviado ao cliente |

O bloco é **componente**, não campo de página — então o painel consolidado da fase 5 o **lista**, não o junta.

## 5. Configuração da aba

**Fixo, muda raramente** (entra no bloco): chave Pix, nome e cidade do recebedor, Client ID do PayPal, WhatsApp do comprovante, cores, uso da coruja, textos dos rótulos.

**Por cobrança** (entra no link): descrição, valor, e um identificador curto opcional (o `txid` do Pix, útil para conciliar).

Dados operacionais nascem **vazios**, com exemplo no `placeholder`, como manda o `CLAUDE.md`.

## 6. Comportamento da página publicada

- **Sem parâmetros** (alguém abre `/pagar` direto): mensagem cordial dizendo que aquele link não traz uma cobrança. **Nunca** uma página quebrada — ela fica publicamente alcançável.
- **Código Pix adulterado**: recusa com explicação, e o convite a pedir um link novo.
- **Cobrança válida**: descrição, valor, Pix copia e cola, QR Code, botão do PayPal e o botão **"Já paguei"** abrindo o WhatsApp com a descrição e o valor na mensagem — para o dono saber a qual cobrança se refere.
- **Duas cobranças abertas ao mesmo tempo** não se atrapalham: a página não guarda estado, lê tudo do endereço.

## 7. PayPal — os dois modos

1. **Botão do SDK** (o que a aba Checkout já usa): prático, valor calculado no navegador, **adulterável**. A interface diz isso com todas as letras.
2. **Link de cobrança criado no próprio PayPal**, colado pelo dono: o valor fica guardado no PayPal e o cliente não alcança. **À prova de adulteração.**

O modo 2 custa um passo manual por cobrança e é a recomendação para valor alto. A escolha é por cobrança, não global.

## 8. Reúso obrigatório — nada de segunda implementação

A regra do `CLAUDE.md` vale inteira aqui, e esta aba é a maior tentação de duplicar que o projeto já teve:

- **Geração do Pix** (`tlv`, `crc16`, montagem do BR Code): a aba Checkout já as escreve no bloco gerado. **Unificar a fonte que escreve**, nunca copiar. O bloco entregue continua autossuficiente.
- **Formatação de preço**: `PRECO_MOEDAS`.
- **Coruja**: `CORUJA_PECAS`.
- **Cores**: `corSegura` / `CORES_LIVRES` / `corAjustar`.
- **Faixas numéricas**: tabela `P_NUMS`, como as outras seis.
- **Escapes**: `escHtml`, `escAttr`, `escJs`.

## 9. Integração com as cinco fases já entregues

A sétima aba **não é um apêndice** — ela entra em todas as engrenagens:

- **`ABAS`**: `pref`, `fora`, `operacionais`, `resumo`, `redesenhar`, `antesDeSalvar`, `presetOk`, `aposPresets`, `listas`, `importar`.
- **Fase 2**: biblioteca de presets própria, com carimbo.
- **Fase 3**: participa do preset geral, com interruptor ativa/fora e marca de origem. **Sete abas agora**, não seis.
- **Fase 4**: entra no backup, e a chave Pix e o Client ID entram na lista `operacionais`.
- **Fase 5**: o painel a lista como saída por componente.

## 10. A prévia

Regra do projeto: **a prévia executa o bloco gerado**, num quadro isolado, nunca o imita.

Aqui há uma novidade: o bloco lê o **endereço**, e um quadro escrito por `document.write` não tem parâmetros. Então o shim do ambiente — o mesmo que já troca o armazenamento por memória — passa a fornecer também a consulta simulada. Valem as obrigações de sempre: **conferir se a troca pegou e avisar visivelmente se não pegou**, porque falha muda de shim faz a prévia mentir.

A prévia tem de exercitar os três estados: cobrança válida, código adulterado e link sem parâmetros.

## 11. Verificação

- Pix gerado conferido por **CRC recalculado**, e o valor extraído do campo 54 batendo com o digitado.
- **Adulteração provada**: mudar um dígito do código no endereço → a página recusa.
- Valor exibido, valor do Pix e valor do PayPal **iguais por construção** — medidos, não presumidos.
- Textos hostis na descrição (`'`, `</script>`, `<!--`) não quebram o bloco publicado.
- Página sem parâmetros: mensagem cordial.
- **Regressão**: as 9 saídas dos seis geradores existentes **byte a byte idênticas**. A aba nova não pode mudar o que as outras produzem.

## 12. Estimativa

| Parte | Estimativa |
|---|---|
| Aba, bloco da página e gerador de link | 2h – 2h45 |
| Integração com as cinco fases (preset, preset geral, backup, painel) | 45min – 1h15 |
| Revisão independente e rodada de correção | incluída acima (margem de 40%) |
| **Total** | **3h30 – 5h** |

O risco de estouro está na integração: a sétima aba toca `ABAS`, o preset geral, o backup e o painel — quatro engrenagens construídas hoje, todas com prova de regressão própria.

## 13. Premissas registradas

- **O link vai sempre individualmente.** Se um dia for para grupo, descrição e valor aparecem na pré-visualização.
- **O dono confere o valor recebido** antes de entregar o trabalho. É o que torna detecção suficiente onde prevenção é impossível.
