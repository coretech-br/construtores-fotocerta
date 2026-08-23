# O arnes de verificacao

Utilitarios de linha de comando (Node + Playwright) para conferir a ferramenta
e os blocos que ela gera. Nada aqui e servido nem colado no Prosite -- e
material de apoio, roda no seu computador.

## O que ha aqui

| Arquivo | O que e | Quando usar |
|---|---|---|
| `lib.mjs` | Helpers comuns: achar o Playwright, subir um servidor estatico, abrir a ferramenta com armazenamento limpo, preencher campo/checkbox/radio disparando os mesmos eventos do teclado, ler saida, capturar alerta/erro de console. | Nunca sozinho -- e a base dos outros arquivos. Leia antes de escrever qualquer coisa nova neste diretorio. |
| `geradores.mjs` | Fotografa o TEXTO que as oito abas produzem (hash de cada saida, link completo de cada cenario de cobranca) e grava num JSON. | Para provar que uma mudanca no gerador nao alterou um byte do que as outras abas produzem. Chamado por `regressao.sh`; raramente direto. |
| `regressao.sh` | Compara a fotografia da arvore de trabalho com a de uma referencia (`main` por padrao). | Ao fim de toda rodada que mexer em codigo gerado. `scripts/verificar/regressao.sh` ou `scripts/verificar/regressao.sh <ref>`. |
| `pagina.mjs` | O MOLDE reutilizavel para pegar um bloco gerado e executa-lo de verdade numa pagina que imita uma do Prosite (servidor de uma rota, rede externa bloqueada, relogio falso opcional, `reducedMotion` opcional). Exporta `comBlocoNaPagina`, `gerarNaFerramenta`, `textoSemScripts`, `chk`, `resumo`. | Quando o teste precisa que o bloco RODE num DOM (anima? o botao aparece? o valor calculado bate?), nao so que o texto gerado seja igual a uma referencia. Cada teste concreto e um script pequeno que importa este modulo -- ver exemplo abaixo. |

## Como rodar

Precisa de Node e do Playwright com o Chromium baixado -- `lib.mjs` diz o que
instalar se faltar (`npx playwright install chromium`, ou apontar um
Chromium/Playwright ja existente com `FC_CHROME`/`FC_PLAYWRIGHT`).

```sh
# regressao byte a byte contra a main
scripts/verificar/regressao.sh

# regressao contra outro commit/branch
scripts/verificar/regressao.sh algum-commit

# um teste que use o molde de pagina.mjs (exemplo, nao existe no repo)
node scripts/verificar/teste-bordas.mjs
```

## Exemplo minimo de uso do molde (`pagina.mjs`)

```js
import { comBlocoNaPagina, gerarNaFerramenta, chk, resumo } from './pagina.mjs';

// 1. gera o bloco na propria ferramenta
const { valores } = await gerarNaFerramenta(async pg => {
  // ...preencher campos e clicar no botao de gerar da aba...
}, ['b-out1', 'b-out2']);

// 2. executa o bloco gerado numa pagina de verdade
const r = await comBlocoNaPagina({
  cabeca: valores['b-out1'],                       // vai na Tag Head
  corpoAntes: '<div id="alvo">conteudo</div>',
  corpoDepois: '<scr'+'ipt>document.getElementById("alvo").style.cssText += ";' + valores['b-out2'].replace(/"/g,'\\"') + '";</scr'+'ipt>',
  medir: async pg => ({
    animacao: await pg.$eval('#alvo', el => getComputedStyle(el).animationName)
  })
});

// 3. confere e fecha
chk('animacao comeca com fc-borda-', r.animacao.indexOf('fc-borda-') === 0, r.animacao);
process.exit(resumo());
```

Um teste novo desta familia costuma ter esse formato: gerar com
`gerarNaFerramenta`, executar com `comBlocoNaPagina`, e um punhado de `chk(...)`
seguido de `process.exit(resumo())`. O molde nao sabe o que e uma "borda" ou
uma "cobranca" -- quem sabe e a funcao `medir` que cada teste escreve.

## O que este arnes NAO cobre

- **Nao substitui a conferencia visual.** Ele mede o que o codigo calcula
  (um valor, um nome de animacao, um texto), nao como a pagina fica na tela.
  Layout, espacamento e legibilidade continuam exigindo olhar.
- **Nao substitui o teste na pagina publicada.** Editor de Prosite e pagina
  publicada sao coisas diferentes (ver `CLAUDE.md` -- "editor != publicado"),
  e o sanitizador do Prosite (Manual do Prosite, em
  `docs/documentacao-fotocerta.md`) so age quando a pagina e de fato
  publicada. Um bloco que passa aqui ainda precisa ser colado e publicado
  para confirmar que o sanitizador nao mordeu nada.
- **`geradores.mjs`/`regressao.sh` comparam TEXTO, nunca executam o bloco.**
  Para conferir comportamento (anima, calcula, reage a clique) o teste
  precisa ser escrito com `pagina.mjs`.
- **Sem service worker, sem PWA de verdade.** O servidor de `pagina.mjs` e
  de uma rota so, so para hospedar o bloco sob teste.
