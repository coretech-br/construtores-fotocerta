# Decisoes sobre os 17 duvidosos do levantamento de textos

Levantamento: `scratchpad/inventario-textos-etapa-2-3.md` (112 textos + 17 duvidosos).
Decididas por mim em 03/09/2026, dentro do criterio que o dono fixou: **e configuravel todo
texto que o CLIENTE FINAL le**. Onde a decisao muda a saida byte a byte, esta dito — a
regressao vai acusar, e a acusacao tem de bater com esta lista.

## Vao virar campo

| # | Item | Decisao e por que |
|---|---|---|
| D-1 | `{PCT}` maiusculo | **Padronizar em `{pct}`**, mas a troca **aceita as duas grafias**. Duas convencoes na mesma ferramenta e defeito de amanha; aceitar as duas na leitura protege configuracao ja gravada. *Muda a saida.* |
| D-2 | `Pagando via Pix` + ` (-5%)` colado | **Campo com a frase INTEIRA**: `Pagando via Pix (-{pct}%)`. Metade configuravel e armadilha: o dono troca a frase e um sufixo que ele nao controla continua grudado. *Muda a forma da saida.* |
| D-3 | `Desconto` + ` (CODIGO)` colado | Mesmo de D-2, com `{codigo}`. |
| D-4 | `TXT_FOTO_ERRO` | **Vira campo, revertendo a decisao antiga.** A decisao anterior protegia o *operador* ("ele nunca deveria ver isto"), mas quem ve o texto quando a foto quebra e o **cliente** — e o criterio de 03/09 e sobre o cliente. Reescrever o comentario dizendo isso, para a reversao nao parecer descuido. |
| D-5 | Os quatro avisos de carrinho + a contagem | **Marcador `{n}`**, e a concatenacao `sumidos+' '+TXT_SUMIU` passa a ser substituicao. Sem isso o dono nao consegue escrever "Removemos 2 itens" — so "2 <texto dele>". |
| D-7 | O `✕` de tirar do carrinho (e o `✕` da barra da Contagem regressiva) | **Configuravel e o `aria-label`, nao o glifo.** Glifo editavel pode ficar vazio, e ai o botao some da tela sem erro nenhum. O que o leitor de tela pronuncia e o que importa aqui. |
| D-11 | `Proxima foto` sem acento | **Corrigir para `Próxima foto`.** E defeito, nao configuracao: passou pela rodada de acentos de 01/09. O campo nasce ja com o padrao certo. *Muda a saida — divergencia intencional, declarada.* |
| D-12 | Sufixos `d`/`h`/`m`/`s` da Contagem regressiva | **Quarto elemento no array.** O terceiro continua sendo a identidade que `chaveRelogio` usa; o sufixo visivel passa a ser o quarto. Sem isso, dois sufixos iguais (ou vazios) fariam o relogio parar de se remontar ao cruzar 24h — **em silencio**. |
| D-13 | `c-rd`/`c-rh`/`c-rm`/`c-rs` so valem no formato "blocos" | **Resolver junto de D-12**: os sufixos do formato compacto passam a sair dos **mesmos quatro campos**. Melhor que um aviso de ajuda: em vez de explicar que os campos nao funcionam no formato padrao, faz eles funcionarem. |

## Ficam de fora, de proposito

| # | Item | Por que nao |
|---|---|---|
| D-6 | Descricao do pedido no PayPal | **E payload de pagamento**, nao tela do bloco. O cliente le no PayPal e no recibo, entao o criterio pega — mas edicao errada ali so aparece numa cobranca de verdade, e esta rodada ja e grande. Registrado como divida consciente, nao esquecimento. |
| D-14 | Nomes de mes e de dia da semana | Sao **traducao**, nao customizacao: ninguem troca "janeiro" por flexibilidade. Doze e sete itens em tres tabelas. Se um dia o site for para outra lingua, e aqui que se mexe — e ai a rodada e essa, com todas as tabelas juntas. |
| D-8, D-15 | Prefixos de lista, glifos e pontuacao | Formatacao e simbolo, nao frase. O que uma pessoa precisa ouvir desses botoes esta coberto por D-7. |
| D-9, D-16 | Comentarios e exemplos dentro do bloco gerado | So sao lidos por quem abre o codigo-fonte. Sao codigo. |
| D-10 | Nomes de produto, opcional, categoria, cupom | Ja sao dados cadastrados pelo dono. |
| D-17 | Enchimento da previa, titulos das caixas de saida, `alert`/`confirm` de recusa | Interface da **ferramenta**, dirigida ao dono. O cliente nunca ve. |

## Regra que vale para os 112

**Sete frases existem identicas em duas ou tres abas.** Decisao: **um campo por aba**, com o
**texto de fabrica vindo de uma tabela so**. O dono pediu flexibilidade por aba ("posso ter
uso para outros tipos de necessidade") e tambem coerencia entre abas — um campo por aba da a
primeira; padrao de fonte unica da a segunda, sem deixar as fabricas divergirem por acidente.

**Os textos vao numa secao propria da aba, recolhida por padrao.** Sao dezenas de campos;
soltos no meio dos outros, afogariam a configuracao de uso diario.
