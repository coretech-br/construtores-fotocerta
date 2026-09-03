# Duplicar familia, com o conteudo dela

Decidido com o dono em 03/09/2026, a partir de uma pergunta dele que corrigiu o meu plano.

## A pergunta que mudou o desenho

O levantamento das listas que ganhariam duplicacao tratou **familia como mais um item de
lista**: a copia levaria nome e descricao, e os pacotes ficariam para tras. O dono perguntou:

> *"Essa duplicacao de familia vai carregar tudo que tem abaixo da original para a copia
> (pacotes e opcionais)?"*

E, ao saber que a duplicacao de pacote **ja leva os opcionais**, completou: *"E o mesmo
comportamento que eu espero para a familia."*

**Ele esta certo, e a razao e melhor que a minha.** "Duplicar leva o que esta dentro" e uma
regra; familia funcionando diferente seria a incoerencia. A minha objecao era que o ganho e
so evitar quatro cliques (os codigos e precos continuam a ser editados um a um) -- verdade,
mas coerencia de regra vale mais que essa contagem. Alem disso o caso real dele sao **as
mesmas duracoes em duas familias com precos diferentes**, que e exatamente onde a copia com
conteudo rende.

## Caminho escolhido: A

**Duplicar a familia cria, de uma vez, a familia e todos os pacotes dela, com os opcionais.**

Isso a torna a **unica** operacao da ferramenta que cria varios itens sem o dono confirmar
cada um -- todas as outras duplicacoes pre-preenchem o formulario, e a copia so existe quando
ele salva. A excecao e consciente, e o preco dela e tratado abaixo.

Cada pacote copiado nasce com o codigo derivado (`-COPIA`), pela mesma mecanica ja publicada,
para o dono distinguir a olho o que veio da copia e ainda nao foi ajustado.

## A assimetria que veio junto, e que NAO se deixa para depois

Medido em `aFamDel` (na `main`): **apagar uma familia que tem pacotes e proibido**.

> *"A familia 'X' ainda tem 4 pacotes. Abra cada um no lapis, escolha outra familia e salve;
> depois apague esta. Mover os pacotes sozinho seria mexer no seu cadastro sem voce mandar."*

A recusa e boa e a razao dela tambem. Mas com a duplicacao ela cria um desequilibrio:

- **um clique cria** uma familia com quatro pacotes e os opcionais deles;
- **desfazer custa nove passos** (abrir cada pacote, trocar a familia, salvar; so entao apagar).

Criar barato e desfazer caro e como um cadastro vira bagunca: o dono experimenta, se
arrepende, e o custo de limpar e alto o bastante para a sujeira ficar.

**Decisao:** apagar uma familia passa a poder levar os pacotes dela, com **confirmacao
nominal** -- a lista dos pacotes que vao embora, pelo nome, e a contagem. Nao e a ferramenta
decidindo pelo dono: e ele lendo o que vai perder antes de confirmar. E o que preserva a razao
original da recusa ("nao mexer no cadastro sem voce mandar") pagando o preco certo por ela.

## O que NAO muda

- As outras seis duplicacoes continuam pre-preenchendo o formulario. A familia e a excecao, e
  esta declarada.
- A recusa de nome de familia repetido continua: a copia nasce com nome derivado, senao a
  recusa acende sozinha e parece defeito.
- Nenhuma saida de gerador muda: isto e interface da ferramenta, e a regressao byte a byte
  tem de dar zero.
