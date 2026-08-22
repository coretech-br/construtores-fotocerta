# O formato da chave Pix: recusar antes do banco do cliente

**Data:** 22/08/2026
**Estado:** implementado e verificado
**Toca:** `fc-compartilhado.js` (só) — alcança os **quatro** geradores de Pix e a `/cobrar`
**Versão do arquivo compartilhado:** `2026-08-22c` → `2026-08-22d`

---

## 1. O defeito, medido nos dois lados

O dono fez a primeira cobrança real. O app do banco respondeu:

> **O QR Code não é válido.** A instituição recebedora não conseguiu processar o pagamento. Peça um novo código a quem irá receber ou pague via chave Pix. `[QR129H]`

Aconteceu tanto pelo copia-e-cola quanto pelo QR — logo, não era o desenho do QR, era o conteúdo do payload.

**O que a mensagem dizia, lida com atenção.** *"A **instituição recebedora** não conseguiu processar"* e *"ou pague via chave Pix"*: o app **leu** o BR Code e extraiu a chave; o que falhou foi resolvê-la no diretório do Banco Central. Isso aponta para a chave, não para a estrutura.

**O que foi descartado, com medida:**

- **A estrutura do payload.** Parseada por um leitor TLV independente, escrito só a partir da norma: todos os campos fecham, o CRC recalculado bate, zero caractere fora do ASCII.
- **O espaço no nome do recebedor** (`5910Foto Certa`), que foi a primeira suspeita do dono. O `10` conta o espaço, a estrutura fecha, o CRC confere — testado também em caixa alta, sem espaço e com cidade composta. E o Checkout já recebera **pagamentos reais** com esse mesmo gerador e esse mesmo nome.
- **A rodada daquele dia.** A maquinaria do Pix não foi tocada e os 26 links saíram byte a byte idênticos aos da véspera.

**A causa raiz, lida na página publicada.** Buscando o bloco colado em `/pagar`:

```
var CHAVE_PIX='contato'
```

A chave era a palavra `contato` — o e-mail sem o `@fotocerta.com.br`. Um payload perfeitamente bem formado, com uma chave que não existe em diretório nenhum.

**E isso explica os dois sintomas de uma vez.** Depois de o dono corrigir a chave no painel Identidade, a `/cobrar` passou a gerar links com `contato@fotocerta.com.br` enquanto a página seguia com `contato` colado. A `/pagar` remonta o payload com **os seus próprios** dados de recebedor e exige igualdade byte a byte — então ela recusou, com *"o código da cobrança chegou alterado ou incompleto"*. Medido:

```
a página remonta : ...0107contato5204...        (26 tem 29 bytes)
o link  trouxe   : ...0124contato@fotocerta.com.br5204...   (26 tem 46 bytes)
```

O selo, esse, **fechava**: `32C1` pela conta de seis, exatamente o que o link trazia. A recusa veio da remontagem, que é a tranca certa fazendo o trabalho certo.

## 2. O buraco que deixou isso chegar ao cliente

`pixChaveErro` conferia **só o conjunto de caracteres e o tamanho**. Medido antes da correção:

| Chave digitada assim | A ferramenta | Na vida real |
|---|---|---|
| `contato` | **aceitava** | não é chave |
| `27999998888` (telefone sem `+55`) | **aceitava** | não resolve |
| `123.456.789-01` (CPF pontuado) | **aceitava** | não resolve |
| `12.345.678/0001-99` (CNPJ pontuado) | **aceitava** | não resolve |
| `123e4567e89b…` (aleatória sem hífens) | **aceitava** | não resolve |

O erro aparecia no **último lugar possível**, que é o pior: a tela de quem está pagando.

## 3. A correção

`pixChaveFormato`, dentro de `pixChaveErro`, no arquivo compartilhado. O diretório do Banco Central conhece **cinco** formatos e mais nenhum; texto fora deles não é chave, e o gerador consegue saber disso sozinho — então deve saber.

1. **Aleatória**: UUID canônico, 8-4-4-4-12 hexadecimal.
2. **E-mail**: algo antes do arroba, domínio depois, ao menos um ponto no domínio.
3. **Telefone**: `+55` + DDD + 8 ou 9 dígitos.
4. **CPF / CNPJ**: 11 ou 14 dígitos **com os dígitos verificadores conferidos**.
5. Nada disso → recusa nomeando o que a chave não é.

**Por que os dígitos verificadores, e não só o tamanho.** Um telefone digitado sem o `+55` — `27999998888` — tem exatamente os 11 dígitos de um CPF e passaria por uma conferência que só contasse. O DV separa os dois casos sem consultar ninguém, e a recusa consegue dizer a coisa útil: *"Se você quis usar o TELEFONE, ele precisa vir com o +55 e o DDD: +5527999998888."* Sequência de dígitos repetidos (`11111111111`) é recusada à parte.

**Recusa, nunca correção.** Não há como adivinhar o que faltou: `contato` pode virar `contato@fotocerta.com.br` ou `contato@outracoisa.com`, e escrever no lugar do operador o **destino de um dinheiro** é o que este projeto já recusou no endereço da página.

**O limite, dito na interface e no comentário.** Esta conferência sabe que `contato` nunca poderia ser chave. Ela **não sabe** se `contato@fotocerta.com.br` está registrada, nem em qual banco — isso só o diretório responde, e este projeto não tem servidor. O teste do dono continua sendo a cobrança de um centavo.

**Um lugar só, quatro geradores.** `pixChaveErro` já era chamada pelo Checkout, pela Mini loja, pela aba Link de cobrança e pela `/cobrar` (esta pelo `pRecusaBloco` compartilhado). A correção num lugar alcança os cinco caminhos — o que era a pergunta do dono ao ver o defeito: *"não sei se isso também acontece no Checkout e na Mini loja"*. Acontecia.

## 4. Verificação

- **Falsos positivos, o risco real desta mudança:** **800 documentos válidos** gerados pelo próprio algoritmo (400 CPFs e 400 CNPJs) — **todos aceitos**. Mais e-mail simples, com maiúsculas, curto (`a@b.co`), com ponto/mais/subdomínio; celular de 9 e fixo de 8 dígitos; aleatória em minúscula e em maiúscula. Nenhuma chave legítima recusada.
- **Falsos negativos:** 22 chaves impossíveis, **todas recusadas** — o caso real (`contato`), palavra solta, telefone sem `+55`, sem o `+`, formatado, com espaços, com zero na frente, CPF e CNPJ pontuados, dígitos repetidos, DV errado nos dois tamanhos, 9 dígitos, aleatória sem hífens e com um dígito a menos, arroba sem domínio, sem usuário, domínio sem ponto, arroba dobrada, endereço de site e nome com espaço.
- **As guardas antigas continuam valendo:** só espaços, acima do teto de 77, espaço no meio.
- **Os quatro geradores e a `/cobrar`, na interface:** com cada uma de quatro chaves ruins na Identidade, os cinco caminhos **recusam, não geram nada, e recusam com a MESMA palavra**. Com a chave certa, os cinco geram normalmente.
- **Regressão:** as **12 saídas**, os **14 links** e as **12 variações de bloco** saíram **idênticos** aos de antes desta mudança. Zero erro de console.
- **Norma:** `fc-compartilhado.js` continua 100 % ASCII e ES5. `scripts/conferir-versoes.sh` OK, com `--registrar`.

## 5. Dívida registrada

A recusa de formato devolve texto simples, como já faziam as recusas de charset e de tamanho — então ela **não abre o painel Identidade**. As recusas de campo *vazio* abrem (via `FCI_APONTA`), mas a frase daquele sufixo diz "preencha", que não serve para um campo preenchido errado. Mudar o sufixo mexeria em cinco mensagens já cobertas pelo invariante "as recusas dizem as mesmas palavras nos dois lados", e nenhuma medição pediu isso agora. Fica anotado em `docs/pendencias.md`.
