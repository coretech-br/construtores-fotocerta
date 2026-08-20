# Ledger da evolução — preset geral, backup e painel

Acompanhamento de **estimado versus real** das cinco fases aprovadas em 20/08/2026.
Spec: `docs/specs/2026-08-20-preset-geral-e-painel-design.md`.

O tempo real é medido pelo **relógio dos commits**: do início do trabalho da fase até o merge dela na `main`. Inclui as rodadas de revisão e correção, que é onde as estimativas erraram nas seis fases anteriores.

## Tabela

| # | Fase | Estimado | Real | Situação |
|---|---|---|---|---|
| 1 | Importador de galeria | 2–3h | **56 min** | ✅ mesclada (`0041655`) |
| 2 | Presets de aba nas seis abas | 2–3h | — | 🔄 em execução (início 20/08 12:03) |
| 3 | Preset geral | 4–5h | — | não iniciada |
| 4 | Exportar e importar JSON | 2–3h | — | não iniciada |
| 5 | Painel consolidado | 3–4h | — | não iniciada |
| | **Total** | **13–18h** | **56 min até aqui** | |

## Registro por fase

### Fase 1 — Importador de galeria — CONCLUÍDA
- **11:07 → 12:03 = 56 min.** Estimado 2–3h. **Fechou abaixo do piso da faixa.**
- Merge `0041655`.
- **Duas decisões do plano revertidas por medição:** os 1400 px (o storage já entrega tudo em 1200; 1400 é ampliação, arquivo maior que o original em 5 de 6 fotos) e a contagem de 59 no portfólio (era a capa contada duas vezes; são 58).
- Revisão independente: **zero Critical**, 1 Important, 5 Minor — todas fechadas antes do merge. A Important: a regra de pasta não restringia o host, e `storage.alboom.ninja@evil.example` era exibido na lista começando por `storage.alboom.ninja`.
- Regressão: 26 saídas byte a byte idênticas.
- **Por que fechou rápido:** escopo pequeno e bem medido antes de despachar. As duas incógnitas ("o endereço de 1400 px funciona?", "o `?t=` atrapalha?") foram mandadas medir explicitamente, em vez de supostas — e uma delas derrubou uma decisão do plano.

### Fase 2 — Presets de aba
- **Início:** 20/08/2026, 12:03
- **Base:** `main` = `0041655`
- **Base:** `main` = `88ee159`
- **Alvo de prova:** 46 fotos em `/gallery/121894-estudio-tematico`, 59 em `/portfolio/ensaio-casal/1518588-fernanda-ricardo-pre-casamento`, sem logotipo, imagens do tema ou miniaturas de galerias relacionadas.
- **A medir, não supor:** se o endereço de 1400 px do redimensionador funciona; se o `?t=` atrapalha ao embrulhar.
- **Regressão:** `s-out` byte a byte idêntica à de `main` para configuração igual.

---

## Referência: as seis fases anteriores

Concluídas em 20/08/2026 (merge `9aa7a40`), para calibrar as estimativas desta rodada.

| # | Fase | Estimado | Real |
|---|---|---|---|
| 1 | Falhas graves | 45–75 min | 62 |
| 2 | Isolar salvamento | 60–90 min | 84 |
| 3 | Achados médios | 90–150 min | 131 |
| 4 | Atritos de interface | 30–45 min | 100 |
| 5 | Recursos novos | 300–480 min | 391 |
| 6 | Revisão final | 30–45 min | 75 |
| | **Total** | **555–885 min** | **843 min (14h03)** |

**Lição aplicada nesta rodada:** as duas fases que estouraram (4 e 6) estouraram pelo mesmo motivo — eu estimei o tempo de *implementar* e esqueci o de *corrigir o que a revisão acha*. De 13 revisões independentes, 9 geraram rodada de correção. As estimativas de 13–18h já trazem 40% somados por isso.

---

## Achados de interface do dono — 20/08/2026, após testar o importador

Quatro pontos, levantados com a lista já carregada com 46 fotos importadas.

**Os dois primeiros foram criados pela fase 1:** a lista de imagens nunca tinha sido desenhada para dezenas de itens, porque cadastrar dezenas à mão era proibitivo. O importador removeu o limite prático e expôs o layout.

| # | Achado | Onde entra |
|---|---|---|
| A | O endereço da foto **vaza para fora do cartão** — os links do storage são longos demais para a caixa. | Fase 2.5 |
| B | Falta **"Limpar lista"**. Carregou uma galeria grande e quer refazer? Só removendo uma a uma. | Fase 2.5 |
| C | Lista grande **empurra todas as demais configurações para baixo**. Provável solução: área de rolagem própria para a lista. | Fase 2.5 |
| D | A ferramenta é **centralizada e de largura fixa**, sobrando espaço nas laterais (o dono usa monitor 2K). As abas têm duas colunas; poderiam ter mais conforme o espaço, e a lista de imagens poderia ocupar a largura inteira, abaixo dos parâmetros da seção 1. | **Fase 5** |

### Por que A, B e C viram uma fase 2.5, e D não

A, B e C são locais à lista de imagens, pequenos, e a dor é de agora — o importador acabou de tornar comum a lista de 46 itens. Entram logo após a fase 2 mesclar.

**D é acoplado à fase 5 e seria refeito se antecipado.** O painel consolidado foi pedido para ficar *ao lado das abas*, justamente aproveitando o espaço lateral. Decidir a largura e o número de colunas agora significaria decidir o envelope de layout da fase 5 às cegas — e depois refazer quando o painel chegasse. Vai junto, e a fase 5 passa a incluir explicitamente: largura que acompanha a janela, número de colunas conforme o espaço, e a lista de imagens em largura inteira.

Nada foi despachado enquanto a fase 2 corre: ela mexe na estrutura das seis abas, e uma mudança de layout do Slideshow em paralelo colidiria.

**Confirmado pelo dono em 20/08/2026**, com um enunciado mais preciso do acoplamento do que o meu: *"o ajuste já passará a contar com o painel consolidado usando parte da área à direita das abas"*.

Isso vira **restrição de layout da fase 5**: as abas não devem se esticar até a borda da janela: o painel consolidado ocupa parte da faixa à direita, e a largura das abas é o que sobra. O número de colunas dentro da aba se ajusta a essa largura restante, não à janela inteira.
