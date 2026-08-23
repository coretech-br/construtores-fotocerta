# As dívidas pequenas, e a correção do "head do site"

**Data:** 23/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html`, `cobrar/index.html`, `fc-compartilhado.js` (`2026-08-22d` → `2026-08-23a`), `scripts/verificar/`

---

## 0. A correção que veio antes das dívidas

O dono ajustou um entendimento: **o Prosite não tem cabeçalho global.** A Alboom só oferece Tag Head e Tag Body **por página**, e é lá que ele sempre colou — e tudo funcionou.

A ferramenta afirmava o contrário em **onze lugares**, e um deles dava um caminho de menu que não existe: *"Configurações → Códigos personalizados → campo do cabeçalho (head) do site"*. Ela estava mandando o operador usar um campo inexistente.

Nada quebrou na prática, porque ele colou por página desde sempre. O que se corrigiu foi a **verdade dos textos** — e uma consequência que passa a estar dita: *uma página nova que use borda animada precisa do código 1 no head **dela**; sem isso o CSS do componente fica lá, a animação não existe, e a borda não se mexe, sem erro nenhum.*

Isso muda `b-out1` em um byte (o comentário do topo) e é **intencional**.

## 1. A recusa da chave Pix passou a apontar o campo

Só a recusa de campo **vazio** abria o painel Identidade. As três que dizem *"a chave está errada assim"* — caractere estranho, longa demais, formato impossível — deixavam o operador procurando onde consertar.

Dois obstáculos, os dois resolvidos:

- **A frase do ponteiro dizia "preencha"**, o que não serve para um campo preenchido errado. Virou **"abra o painel Identidade"**, que serve aos dois casos. Como ela mora no arquivo compartilhado, as duas páginas mudaram juntas — o invariante "as recusas dizem as mesmas palavras nos dois lados" se manteve por construção, e foi remedido.
- **Quem reagia focava o primeiro campo vazio**, e num erro de formato nada está vazio. A regra virou **o primeiro campo com problema** (`fciPrimeiroProblema`), e "problema" inclui o formato da chave — conferido pela **mesma `pixChaveErro`** que recusa a geração, para não existir uma segunda ideia do que é uma chave boa.

## 2. As regras de CSS do PayPal só saem com PayPal

`.fcpg-sep`, `.fcpg-semtopo` e `.fcpg-pp` saíam no código 1 mesmo num bloco sem PayPal — CSS morto dentro do código colado. As três passaram a depender de `cfg.usapp`. O `.fcpg-pp` saía solto pelo mesmo descuido desde antes do separador existir; estão juntas agora porque a condição é a mesma.

## 3. O nome de um item opcional não fica mais vazio

O editor em linha do Checkout e da Mini loja deixava apagar o **nome** de um opcional, e ele saía como `{nome:''}` — uma opção em branco na tela do cliente.

**A diferença com o preço importa e está registrada:** opcional de graça existe (a própria aba emite *"Sem opcional"* a preço zero), opcional sem nome não. E como o item só entra na lista **com** nome (`uOpAdd`/`mOpAdd` recusam vazio), sempre há um nome bom para devolver — então o campo **se corrige à vista** no `change`/`blur`, como o preço, em vez de recusar. Nunca no `input`: corrigir a cada tecla impediria apagar para redigitar.

## 4. O arnês que executa os blocos virou molde versionado

Era reescrito a cada rodada — três vezes, e uma delas produziu **falso alarme**. Virou `scripts/verificar/pagina.mjs`, com o molde comum: pegar um bloco gerado, montar uma página que imita uma do Prosite, abortar toda rede externa, e medir.

Duas armadilhas que custaram caro ficaram **registradas no próprio molde**:

1. **Medir `document.body.textContent` inclui o texto-fonte do próprio `<script>` do bloco** — o que dá falso negativo em qualquer checagem de "sobrou a palavra X". O jeito certo é clonar o body, remover os `script` do clone e só então ler.
2. **Trocar `<select>` por `el.value=…` mais evento sintético não é confiável** em controles que a ferramenta redesenha. Usar a interação real do Playwright.

## 5. Verificação

- **Regressão:** uma única divergência, `b-out1`, de **um byte** — o comentário do topo, declarado acima como intencional. As outras 11 saídas e as 9 cobranças, byte a byte idênticas.
- **Dívida 1, 13 medidas:** com chave impossível, com espaço no meio, longa demais e vazia, a recusa aparece, **o painel abre** e **o foco vai ao campo da chave**; com a chave boa e a cidade vazia, o foco vai à cidade.
- **Dívida 2:** com PayPal as três regras saem; sem PayPal, nenhuma sai.
- **Dívida 3:** nas duas abas, o campo **pode** ficar vazio durante a digitação e **volta à vista** ao sair; renomear para um nome válido continua funcionando.
- **Invariante das duas páginas:** 5 links byte a byte idênticos entre a aba e a `/cobrar`; e as **4 recusas de chave** dizendo as mesmas palavras nos dois lados, sem gerar link, todas mandando abrir o painel.
- Versão do arquivo compartilhado trocada nos três lugares, com `--registrar`.
