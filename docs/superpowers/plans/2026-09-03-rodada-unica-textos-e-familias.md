# Rodada unica: textos configuraveis + familias de pacotes

Decidida em 03/09/2026 pelo dono. Ele juntou numa entrega so o que eu havia proposto
partir em duas, e **autorizou a publicacao de antemao**: *"Quando terminar, pode publicar.
Prefiro testar usando a pagina publicada. Somente eu uso entao nao tem problema subir."*

Autorizacao vale para ESTA rodada. A seguinte volta ao padrao (push so com aprovacao).

## As decisoes do dono, todas de 03/09/2026

| # | Decisao |
|---|---|
| 1 | **Rodada unica** -- textos, aviso do Pix, subtitulo, previa de celular e familias juntos |
| 2 | **Cartoes altos no computador, linhas compactas no celular** -- mantendo em ambos a organizacao de passos numerados e familias |
| 3 | **A previa de celular sobe junto**, nao antes |
| 4 | **Texto padrao do aviso do Pix**: "O Pix nao avisa a gente automaticamente. Assim que voce pagar, toque em 'Ja paguei' para eu conferir e confirmar." -- configuravel; ele altera se quiser |
| 5 | **Familias: opcao A** -- a familia e o passo 1, tres passos numerados, familias definidas por ele |
| 6 | **Subtitulo opcional com marcador `{pct}`** -- chave simples, coerente com `A_TXT_DEFS` |

## Ordem de execucao, e por que esta

As familias mudam a **forma dos dados** (`aPacotes` deixa de ser lista plana). Toda mudanca
de texto feita ANTES delas continua valendo depois; o contrario nao e verdade. Entao os
textos vem primeiro, e as familias por ultimo, com a regressao inteira entre as duas coisas.

1. **Etapa 1 -- textos das abas `a` e `p`.** (em curso, subagente)
2. **Etapa 2 -- textos do Checkout (`u`) e da Mini loja (`m`).** As duas maiores.
3. **Etapa 3 -- textos das abas pequenas (`s`, `l`, `t`, `c`).** Quase tudo `aria-label`.
4. **Aviso do Pix nas quatro abas de pagamento**, configuravel, texto do item 4 acima.
   Hoje so a Mini loja avisa. Redacao padronizada, nao copiada: a `/pagar` cobra item
   unico, as outras tres tem carrinho.
5. **Subtitulo opcional da vitrine**, com `{pct}`. Em branco = bloco identico ao de hoje.
6. **Previa de celular** -- mesclar `pac-previa-celular` (commit `01ef284`).
7. **Familias.** A maior peca:
   - cadastro de familias na aba (nome definido pelo dono);
   - cada pacote aponta para uma familia;
   - **migracao** de quem ja gravou sem familia -- mesmo padrao da migracao `link`->`path`
     da v2: converter na hora, **nunca calado**, aviso uma vez ao fim;
   - tres passos numerados; uma familia so = volta a dois passos, sem passo vazio;
   - duas linhas de resumo com "trocar" (familia e pacote), textos configuraveis;
   - **cartoes altos no computador, linhas compactas no celular** (`@media`, presa a faixa
     declarada dentro da funcao de configuracao -- ver CLAUDE.md);
   - titulo do passo novo entra junto de `a-t2`/`a-t3`.
8. **Painel consolidado e presets** -- campo novo que nao aparece no painel ou nao entra no
   "Exportar tudo" e campo que o dono perde sem perceber. `fccOrfas` roda a cada desenho.
9. **Regressao byte a byte** contra `main`. Onde mudou, explicar; onde nao deveria e mudou,
   e defeito e volta.
10. **Conferir versoes + carimbo de publicacao.**
11. **Documentacao** e riscar da `pendencias.md`.
12. **Publicar** (autorizado de antemao, item acima).

## O que NAO se corta

A regressao byte a byte, o teste do bloco entregue executando de verdade, e a conferencia
de versoes. O dono vai testar na pagina publicada -- o que torna a prova automatica mais
importante, nao menos: ele nao vai reler o codigo, vai usar.

## Avisos ao dono

Pedido explicito dele: **avisar a cada etapa concluida.**

---

## Revisao do desenho das familias (7a), por mim, 03/09/2026

Desenho: `scratchpad/desenho-familias.md` (777 linhas). **Aprovado**, com tres amarracoes.

O que me convenceu, ponto a ponto:

- **O vinculo e o `id`, nao o nome.** Renomear uma familia e a operacao mais provavel do dono
  ("Dias uteis" vira "Segunda a sexta"), e com o nome como vinculo ela deixaria todos os
  pacotes orfaos **em silencio**. Id deterministico (`'F'+(maior+1)`), nao aleatorio nem por
  relogio — os dois inutilizariam a comparacao byte a byte.
- **A lista continua plana.** Aninhar obrigaria a achatar de volta em quatro consumidores que
  varrem `cfg.pacotes` linearmente. Medido, nao suposto.
- **Uma familia so nao emite nada de familia** — nem `FAMILIAS`, nem `fam`, nem CSS. E o que
  preserva o invariante para quem ja tem a aba configurada.
- **A migracao nao dispara em estado limpo.** `migrouFam` so vira verdadeiro dentro do laco
  sobre `aPacotes`. Sem isso, o arnes (que limpa o `localStorage` antes de cada passagem e
  coleta os alertas) acusaria divergencia — e o dono veria aviso de uma migracao que nao houve.

### Amarracao 1 — a ordem: 6 ANTES de 7b, sem excecao

A previa de celular esta numa branch separada (`pac-previa-celular`, commit `01ef284`) e
toca as mesmas funcoes que as familias vao tocar. Mesclar depois seria resolver conflito no
arquivo mais sensivel da rodada. **Etapa 6 entra primeiro; as familias sobem em cima dela.**

Consequencia operacional: a etapa 6 exige `git merge`, que mexe na arvore de trabalho — e a
arvore e uma so. Ela so pode rodar com **nenhum agente escrevendo no `index.html`**.

### Amarracao 2 — o defeito 9.1 entra na etapa 7b

Importar um backup **v1** descarta `link` (a chave nao esta no molde), a migracao roda com
`p.link` ausente, `path` vira `''` — e o alerta afirma *"Nada foi perdido"*, que naquele
caminho e **falso**. Conserto: `link:''` no molde. E barato e a mentira e do tipo que este
projeto ja recusou antes (trocar defeito visivel por invisivel).

### Amarracao 3 — o ramo de duas familias NAO pode ficar fora da fotografia

O cenario do arnes hoje cadastra pacotes sem familia. Se ele continuar assim, todo o caminho
novo (tres passos, cartao de familia, CSS da familia) fica **fora** da regressao — que foi
exatamente a armadilha do cupom da Mini loja, repetida tres vezes nesta sessao. O cenario
ganha uma segunda familia, em duas etapas: primeiro fotografa-se com uma familia (provando o
invariante), depois acrescenta-se a segunda (fotografando o caminho novo).

### Amarracao 4 — cada resumo pertence ao SEU passo (achado pelo dono, 03/09/2026)

No mockup, depois de escolher o pacote as **duas** caixas de resumo (familia e pacote) saiam
juntas logo abaixo do passo 1, e o passo 2 aparecia **vazio** na tela — como se nada tivesse
sido escolhido nele. O dono viu e mandou o print.

A regra, que vale para o bloco de verdade e nao so para o mockup:

- **Passo 1** mostra a familia escolhida, com o botao "trocar" dela.
- **Passo 2** mostra o pacote escolhido, com o botao "trocar" dele.
- **Passo 3** e o calendario.

Um passo numerado que ja foi resolvido tem de exibir **o que foi resolvido nele**. Passo com
titulo e nada embaixo le-se como etapa pendente, e o cliente fica procurando o que fazer ali.

**Vale a pena reparar de onde veio o achado:** o mockup executa a mesma logica de passos que
o bloco vai executar, entao o defeito de arranjo apareceu antes de existir codigo de verdade.
E o mesmo argumento da regra "previa roda o gerador, nao imita o gerador" — so que um passo
antes, no desenho.
