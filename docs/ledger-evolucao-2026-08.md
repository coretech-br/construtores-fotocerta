# Ledger da evolução — preset geral, backup e painel

Acompanhamento de **estimado versus real** das cinco fases aprovadas em 20/08/2026.
Spec: `docs/specs/2026-08-20-preset-geral-e-painel-design.md`.

O tempo real é medido pelo **relógio dos commits**: do início do trabalho da fase até o merge dela na `main`. Inclui as rodadas de revisão e correção, que é onde as estimativas erraram nas seis fases anteriores.

## Tabela

| # | Fase | Estimado | Real | Situação |
|---|---|---|---|---|
| 1 | Importador de galeria | 2–3h | — | em execução (início 20/08 11:07) |
| 2 | Presets de aba nas seis abas | 2–3h | — | não iniciada |
| 3 | Preset geral | 4–5h | — | não iniciada |
| 4 | Exportar e importar JSON | 2–3h | — | não iniciada |
| 5 | Painel consolidado | 3–4h | — | não iniciada |
| | **Total** | **13–18h** | **—** | |

## Registro por fase

### Fase 1 — Importador de galeria
- **Início:** 20/08/2026, 11:07
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
