# Terceira fonte de imagem: `cdn.alboompro.com` — design

**Data:** 21/08/2026
**Estado:** aprovado pelo dono
**Alcance:** importador de imagens (Slideshow e Mini loja) e o redimensionamento da loja

---

## 1. O problema

Os importadores reconhecem duas fontes: `storage.alboom.ninja` e `alfred.alboompro.com`. Existe uma terceira, `cdn.alboompro.com`, usada nas **páginas comuns do Prosite** — não em galerias. Exemplo do dono: `https://www.fotocerta.com.br/albuns`.

Hoje um endereço desse CDN é **descartado em silêncio** pelo importador e **não é redimensionado** pela loja.

## 2. O que foi medido — e o que a medição derrubou

Tudo abaixo foi medido na página real do dono, com três fotos diferentes.

### 2.1 A escada de tamanhos existe, mas **não é uniforme**

O caminho tem a forma `/{contaId}_{imagemId}/{degrau}/{arquivo}`.

| Degrau | natalia | v60-01 | journal |
|---|---|---|---|
| `thumb` | 200×133 | 200×133 | 147×200 |
| `small` | 320×213 | 320×213 | 320×435 |
| `medium` | 600×400 | 600×400 | 600×816 |
| `standard` | 840×560 | 840×560 | **ausente** |
| `large` | ausente | ausente | ausente |
| `xlarge` | ausente | ausente | ausente |
| `original_size` | 1080×720 | 1080×720 | 735×1000 |

E a foto de álbum que o dono mandou primeiro **tem** `large` (1280×853) e `xlarge` (1920×1280), que estas três não têm.

**Isso derrubou o desenho inicial.** Trocar o degrau no endereço parecia trivial e seria errado: pedir um degrau ausente devolve 404, e o cliente veria imagem quebrada na loja — em silêncio.

Registro do processo: a primeira sondagem testou `original`, `full`, `big` e `thumbnail` (todos 404) e **não** testou `standard` nem `original_size`. Foram encontrados só ao ler a página do dono. Construir com a lista da primeira sondagem teria ignorado a versão maior de várias fotos.

### 2.2 O redimensionador aceita o CDN

`https://alfred.alboompro.com/resize/width/N/url/cdn.alboompro.com/...` funciona, com ou sem o `?v=1`. Medido em 400 e 1000 px.

### 2.3 Partir de um degrau pequeno **amplia, e não avisa**

Pedindo 400 px da mesma foto, a partir de cada degrau:

| Partindo de | Resultado | Peso |
|---|---|---|
| `thumb` (200 px) | 400×266 | **31 KB** |
| `small` (320 px) | 400×266 | 38 KB |
| `medium` (600 px) | 400×267 | 43 KB |
| `large` (1280 px) | 400×266 | 41 KB |

Menos bytes na mesma dimensão = menos detalhe. É a mesma armadilha dos 1400 px da fase 1.

### 2.4 O código da conta é o discriminador

Nas 51 ocorrências da página, o **primeiro** código é sempre `5eb96ab625241f0001054d46` — a conta do dono. O segundo varia por imagem.

### 2.5 A página já traz vários degraus da mesma foto

**51 endereços para 10 fotos.** O Prosite serve versões diferentes conforme a tela.

## 3. O desenho

**Não trocar degrau. Aproveitar os que a página já traz.**

1. **Filtrar** pelo código da conta — derivado da fonte colada como **o primeiro código mais frequente**. Por ser derivação e não certeza, o código escolhido **aparece na conferência**, junto da contagem, antes de o operador aplicar.
2. **Agrupar** por `{imagemId} + nome do arquivo`.
3. **Ficar com o maior degrau presente na fonte** — existe por construção, já que veio da própria página. Ordem medida: `thumb < small < medium < standard < large < xlarge < original_size`.
   > **Medido em 21/08/2026 (implementação).** Nenhuma das 10 fotos de `/albuns` tem `xlarge` **e** `original_size`: os dois são mutuamente exclusivos, porque `original_size` só aparece quando o original é menor que o próximo degrau da escada — que é justamente por isso que esse próximo dá 404. Quem resolve a ordem é o logo `…-paleta.png`: `large` = 1280×853, `xlarge` = **404**, `original_size` = **1772×1181**. Nas outras duas fotos em que aparece, `original_size` também é estritamente maior que todos os presentes (1080 > 840; 735 > 600). **`original_size` fica no fim da escada.** Incerteza que permanece registrada: a comparação direta `xlarge` × `original_size` na mesma foto não é observável nesta conta.
4. **A loja pede a largura exata ao redimensionador**, partindo desse maior.

Resolve de uma vez: nunca pede degrau inexistente, nunca amplia, e reduz 51 endereços a 10 fotos — o mesmo que o importador de galeria já faz com repetições.

## 4. O que muda no código

- **`S_HOSTS_ALBOOM`** ganha `cdn.alboompro.com`. É a fonte única, consumida pelo importador, pelo selo de host da lista e pela loja.
- **Extração**: um ramo novo de formato. As galerias casam por `/sites/N/(galleries|albuns)/ID/`; o CDN casa por `/{conta}_{imagem}/{degrau}/`.
- **`M_IMG_SRC` / `imgResize`**: passa a embrulhar também o CDN. Mantém a regra de **desembrulhar antes de embrulhar**.
- **A conferência** informa quantas fotos, de qual conta, e que a fonte é o CDN — não a galeria.

## 5. Riscos

- **A heurística do código da conta** é palpite, não certeza. Mitigado por mostrá-la na conferência. Se a fonte tiver imagens de duas contas, o operador vê e decide.
- **Degrau ausente no endereço escolhido** não pode acontecer pelo desenho (só se usa o que veio da fonte), mas o bloco deve **falhar visível** se acontecer.
- ~~**`original_size` pode não ser o maior.** Medir antes de fixar a ordem.~~ **Medido** (ver §3, item 3): é o maior, e nunca convive com `xlarge`.

## 6. Verificação

- **Prova com a página real** `https://www.fotocerta.com.br/albuns`: **10 fotos**, não 51, cada uma no maior degrau presente.
- Prova com uma galeria antiga (`/gallery/121894-estudio-tematico`, 46 fotos) — **o formato antigo não pode regredir**.
- Fonte misturando os dois formatos.
- Endereço do CDN de outra conta → descartado e contado.
- Loja: miniatura pedida a partir do maior degrau; medir que não há ampliação.
- **Regressão:** as saídas dos oito geradores **byte a byte idênticas** para configuração igual.
- Varredura de IDs, ES5, IIFE única, norma de acentuação.

## 7. Estimativa

**2h – 3h**, margem de revisão incluída. Subiu de 1h30–2h30 porque a medição trocou "trocar uma palavra no endereço" por três peças reais: classificar degraus, agrupar por foto e filtrar pela conta.
