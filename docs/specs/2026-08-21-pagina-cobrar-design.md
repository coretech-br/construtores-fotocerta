# `/cobrar` — página de uso diário para gerar links de cobrança

**Data:** 21/08/2026
**Estado:** aprovado pelo dono
**Endereço:** `prosite.fotocerta.com.br/cobrar`

---

## 1. O problema

A aba **Link de cobrança** é completa demais para o uso diário. Gerar um link exige abrir a ferramenta inteira, achar a aba, e passar por seções de aparência e textos que não mudam nunca.

O dono quer uma página separada, **mobile-first**, com **apenas os dados que mudam a cada cobrança**: descrição, valor, validade, identificador, e o link do PayPal quando usar aquele modo. Preenche, clica, copia, manda no WhatsApp.

## 2. A premissa que ele levantou, e a correção

Ele perguntou: *"Entendo que as informações de PIX/PayPal já estarão no componente HTML, certo?"*

**Não.** Quem monta o código Pix é o **gerador do link**, não a página de cobrança — o código carrega dentro dele a chave, o nome, a cidade, o valor e o identificador. O bloco da `/pagar` também tem os dados do recebedor, mas com outra finalidade: **remontar e conferir**, que é o que faz a página recusar um link montado com a chave de outra pessoa.

Então `/cobrar` **precisa** da identidade para gerar.

**A saída:** `/cobrar` fica no **mesmo endereço** da ferramenta, então compartilha o armazenamento do navegador. Ela lê `fcConstrutoresIdentidade` — a mesma que a ferramenta centralizou hoje.

**Ressalva, e ela vale por aparelho:** no celular do dono, na primeira vez, os campos estarão vazios. Então `/cobrar` tem uma **configuração inicial** pedindo os cinco dados, gravando no mesmo lugar. Ferramenta e `/cobrar` ficam em sincronia naquele aparelho, e o backup em arquivo continua sendo o caminho para trazer tudo de outro.

## 3. A regra que governa: uma fonte, duas páginas

`/cobrar` **não pode reimplementar** a montagem do Pix nem o cálculo do selo. Duas implementações divergem, e aqui produziriam **links que a própria `/pagar` recusa** — o pior lugar possível, porque o defeito só aparece com o cliente na frente.

**O `index.html` deixou de precisar ser autocontido** (liberado pelo dono em 21/08/2026, quando a ferramenta passou a ser servida em vez de colada). Então as fontes compartilhadas saem para arquivo próprio, importado pelas duas páginas.

**O que NÃO muda: os blocos gerados continuam autossuficientes.** Eles vão para dentro do Prosite, onde não existe importar arquivo. É por isso que as funções compartilhadas com os blocos vivem como **texto literal** que o bloco carrega dentro de si, e a ferramenta *avalia* esse mesmo texto. **Unifica-se a fonte que escreve, nunca a saída.**

### O que extrair

O que as **duas páginas** precisam executar: montagem do payload Pix (`FC_PIX_SRC`), o selo (`P_SELO_SRC`), e a leitura da identidade guardada.

**O que não extrair:** o que é de uma página só. Mover código compartilhado tem custo — ele passa a ter dois donos. Extrair o que só uma usa troca duplicação por acoplamento, que não é melhor, é diferente.

### O cache, que é requisito e não detalhe

Com arquivo separado, o navegador **guarda cópias**. Se `/cobrar` carregar uma versão antiga do arquivo do selo enquanto a `/pagar` já espera a nova, o dono vê links recusados sem entender por quê.

**Versionar o endereço do arquivo a cada publicação** (`?v=…` ou nome com versão). Sem isso, a extração introduz uma classe de defeito nova — silenciosa e intermitente, a pior combinação.

## 4. O invariante que prova que não divergiram

**Para os mesmos dados de entrada, o link gerado por `/cobrar` tem de ser byte a byte idêntico ao gerado pela aba da ferramenta.**

É a prova central desta rodada. Se diferirem em um caractere, o selo não fecha e a `/pagar` recusa.

## 5. A página

- **Mobile-first de verdade**, não uma versão espremida da ferramenta. Campos grandes, teclado numérico no valor, um botão de ação.
- **Campos:** descrição, valor, validade (opcional), identificador (opcional), link do PayPal (só no modo link).
- **Botão de copiar** o link pronto, com confirmação visível.
- **As mesmas recusas da aba**, com as mesmas palavras: identidade vazia, valor impagável, data já vencida, endereço do PayPal inválido.
- **A identidade em uso fica à vista**, de forma discreta — para o dono perceber se estiver gerando com a chave errada.
- **Nada do que se digita ali é enviado para lugar nenhum.** Não há servidor; o link é montado no próprio aparelho.

## 6. PWA: manifesto sim, service worker não

**Manifesto** dá o ícone na tela de início e a abertura em tela cheia. Custa pouco e é o que faz parecer aplicativo.

**Service worker não.** Ele guarda uma cópia da página e pode continuar servindo a versão antiga depois de uma publicação — é assim que se produz um app que nunca atualiza, e o dono não entende por quê. E offline não serve aqui: para mandar o link é preciso rede de qualquer jeito.

Decisão registrada para não ser reaberta por hábito.

## 7. Verificação

- **O invariante da seção 4**, com pelo menos 10 combinações de entrada — com e sem validade, com e sem identificador, nos dois modos de PayPal, com texto hostil na descrição.
- **O link gerado por `/cobrar` é aceito pela `/pagar`** — execute o bloco entregue num quadro com o endereço simulado.
- **As saídas dos oito geradores byte a byte idênticas** depois da extração. É a prova de que mover código para arquivo externo não mudou o que a ferramenta produz.
- **A configuração inicial** num armazenamento limpo: pede os cinco dados, grava no mesmo lugar, e a ferramenta os enxerga depois.
- **Cache:** prove que uma publicação nova não deixa `/cobrar` com o arquivo velho.
- **Manifesto:** a página se instala na tela de início e abre em tela cheia.
- Mobile-first em 360, 390 e 430 px de largura; sem rolagem horizontal.
- Varredura de IDs, ES5, norma de acentuação.

## 8. Estimativa

| Parte | Estimativa |
|---|---|
| Página `/cobrar`, mobile-first, com botão de copiar | 1h30 – 2h15 |
| Leitura da identidade e configuração inicial no aparelho | 30 – 45min |
| Manifesto e ícone | 20 – 30min |
| Extração da fonte compartilhada, provando que nada muda | 45min – 1h15 |
| **Total** | **3h – 4h30** |

É a rodada com **mais incerteza** de todas: carrega a primeira mudança de forma do projeto. O risco de estouro está na extração e no cache.
