# Mini loja — design

**Data:** 21/08/2026
**Estado:** aprovado pelo dono, escopo cheio numa entrega só
**Aba nova:** a oitava, prefixo `m-`

---

## 1. O problema e o cenário

O dono quer vender produtos sob encomenda numa página do site: vitrine com imagens, carrinho e pagamento por Pix ou PayPal. Não é um e-commerce — é um catálogo com carrinho.

**Respostas dele, que definem o desenho:**

- **15 a 50 produtos**, mudam de vez em quando.
- **Nada tem quantidade limitada — tudo sob encomenda.** Esta é a resposta mais importante: **sem escassez, a pior limitação da arquitetura desaparece.** Não há venda duplicada a impedir, porque vender duas unidades significa produzir duas.
- **Escopo cheio numa entrega só**, sem parada para teste no meio.

## 2. O que já existe e vai ser reaproveitado

A aba **Checkout** já é o motor: vários produtos, opcionais por produto, quantidade, cupons, desconto Pix, sinal com saldo na entrega, PayPal e Pix, resumo copiável e comprovante por WhatsApp.

Já unificados e prontos para consumo:

- `FC_PIX_SRC` — `tlv`, `crc16`, `semAcento`, `lerTlv`, `pixLer`, `montarPayload`
- `P_PP_SRC` — validação do link do PayPal, mesma função dos dois lados
- `PRECO_MOEDAS` / `fcMoedaFmtGer`, `CORUJA_PECAS`, `corSegura`, `fcPvShim`
- O importador de galeria, que já sabe puxar endereços do storage da Alboom

**Regra que governa o reúso, e o risco desta aba:** unifica-se **a fonte que escreve**, nunca a saída. Extrair o motor de cupons/sinal do Checkout é a maior refatoração já tentada neste projeto. **Se a extração mudar um byte do `u-out`, a extração está errada** — não o teste.

## 3. Uma página só, um bloco só

Vitrine em grade → clique abre o **cartão de detalhe na mesma página** → carrinho lateral → checkout embaixo. Sem navegação.

Isso resolve de graça o carrinho que não atravessa páginas: não há para onde atravessar. E é o formato normal de uma página de categoria, não uma concessão.

**O bloco vai para um componente HTML.** O dono mediu: o campo do Prosite aceita **10.000 linhas** — o bloco do Checkout tem ~500. Tamanho de código deixou de ser risco. **Falta conferir publicado**, não só salvo: o Prosite processa o código na publicação, e a regra do projeto é *editor ≠ publicado*.

## 4. O peso das imagens é o requisito, não uma otimização

Com 50 produtos, o peso da página não vem do código — vem das fotos. As imagens do storage medem **de 157 a 868 KB** cada (medido na rodada do importador). Cinquenta delas seriam dezenas de megabytes, e a página levaria dezenas de segundos no celular.

**O redimensionador da Alboom resolve, e já está medido:** qualquer endereço `storage.alboom.ninja/...` pode ser pedido por `https://alfred.alboompro.com/resize/width/N/url/<endereco-sem-esquema>`, e a largura só-largura funciona (medido: `naturalWidth` = o pedido).

Obrigatório:

- **Vitrine** pede miniatura de ~400 px de largura.
- **Cartão de detalhe** pede ~1000 px, e **só quando o cliente abre**.
- Imagens abaixo da dobra com `loading="lazy"`.
- O construtor guarda o endereço original; quem escolhe o tamanho é o bloco.

Sem isso a loja nasce lenta e o defeito só aparece com um cliente reclamando.

## 5. Os limites, declarados

Vale a mesma honestidade da aba de cobrança — **escrever na interface, não só na documentação**:

- **Não há registro de pedidos.** Um pedido existe como três rastros: a mensagem no WhatsApp, a transação no PayPal e o Pix na conta.
- **Não há confirmação automática.** O PayPal não tem para onde avisar. O dono confere e libera à mão.
- **Cupom não é secreto** — está dentro do código da página. Já vale hoje no Checkout.
- **O carrinho não atravessa aparelhos.** Montou no celular, no computador está vazio.
- **Preço tem o mesmo limite do link de cobrança:** tela, Pix e PayPal não divergem entre si, mas alguém determinado monta um pagamento com valor diferente. O dono vê no extrato.
- **Estoque não existe.** Hoje é inofensivo (tudo sob encomenda) — mas se um dia entrar produto com quantidade limitada, **não há como impedir venda duplicada**. Deixar isso escrito, porque o cenário muda com o tempo e a decisão foi tomada sob a premissa atual.

## 6. O catálogo

Cadastro por produto, na aba: **nome, descrição, preço, imagem, categoria** e os **opcionais** que o Checkout já sabe tratar. Os produtos entram no bloco gerado — atualizar preço é regerar e recolar, o mesmo fluxo de todas as outras abas.

A lista de produtos herda o que a fase 2.5 ensinou sobre listas de dezenas de itens: **área de rolagem própria, endereço cortado sem vazar, botão de limpar com confirmação que diz a contagem.**

**Importar imagens** aproveita o importador de galeria: colar o link e o código-fonte de uma galeria traz os endereços, e o operador associa aos produtos — em vez de colar link a link cinquenta vezes.

## 7. Categorias e filtro

Categoria é campo livre por produto, com sugestão das já usadas (mesmo padrão do campo de campanha do preset geral, que evita "Álbuns" e "Albuns" convivendo). Na vitrine, botões de filtro com **"Todos"** como padrão. Produto sem categoria aparece em "Todos" e em mais nada.

## 8. O carrinho

- Guardado no `localStorage`, com **chave derivada de um código da loja** — duas lojas no mesmo site não se atrapalham, como o código de campanha da contagem regressiva.
- Esvazia ao concluir o pedido.
- Mostra quantidade por item, subtotal e total.
- **A prévia usa o shim de memória** (`fcPvShim`), com a conferência que falha alto se a troca não pegar.

## 9. Integração — a oitava aba

Entra em tudo: registro `ABAS` (`pref`, `fora`, `naoEmite`, `operacionais`, `resumo`, `redesenhar`, `antesDeSalvar`, `presetOk`, `aposPresets`, `listas`, `importar`), biblioteca de presets, preset geral, backup em arquivo e painel consolidado (que a **lista** como saída por componente).

**Procure contagens cravadas.** A sétima aba quebrou `trocarAba` e catorze mensagens com a palavra "seis"; uma escapou por dizer "cinco". A regra adotada: comentário não escreve o número quando ele não carrega informação, e texto visível sai de `ABAS.length`.

## 10. A prévia

Executa o bloco gerado num quadro isolado, nunca o imita. Tem de exercitar: vitrine com produtos, filtro por categoria, cartão de detalhe, carrinho com itens, cupom aplicado, e o checkout gerando Pix de verdade.

## 11. Verificação

- **Regressão:** as saídas dos **sete** geradores existentes byte a byte idênticas. A extração do motor do Checkout é o maior risco de regressão do projeto — cobrir os cenários do Checkout (PayPal+Pix, só Pix, só PayPal em EUR, com cupom, com sinal, com quantidade).
- **Coerência do valor:** total da tela = valor do Pix = valor do PayPal, medidos.
- **Peso da página:** medir os bytes de imagem de uma vitrine de 50 produtos, antes e depois do redimensionador.
- **Textos hostis** em nome, descrição e categoria — executar o bloco num quadro e medir.
- **Bloco autossuficiente por execução:** salvar num arquivo avulso, sem a ferramenta, e comprar do começo ao fim.
- **Manual do Prosite** no bloco: sem `on*` inline, tags concatenadas, só `<div>` na estrutura, IIFE, `text-align:left`, at-rules só em `<style>`.
- **IDs repetidos**, ES5, IIFE única, norma de acentuação.
- **Verificar como operador**, digitando e clicando. `alert()` congela o protocolo — neutralizar `window.alert` a partir da página e **reinjetar após cada recarga**.

## 12. Estimativa

| Parte | Estimativa |
|---|---|
| Catálogo, vitrine, carrinho e checkout | 3h30 – 5h |
| Categorias, filtro e cartão de detalhe | 2h – 3h |
| **Total** | **5h30 – 8h** |

O risco de estouro está na **extração do motor do Checkout**, que é a maior refatoração já tentada aqui, e na **oitava aba** tocar cinco engrenagens.

## 13. Premissas registradas

- **Tudo sob encomenda.** Se entrar produto com quantidade limitada, a decisão precisa ser revista.
- **A administração do pedido é do dono**, no WhatsApp e no extrato.
- **O dono confere o valor recebido** antes de produzir.
