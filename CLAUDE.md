# Instruções do projeto — Foto Certa (Prosite + Construtores)

Este projeto mantém o site fotocerta.com.br (Alboom Prosite) e a ferramenta de construtores de código da Foto Certa.

## Antes de responder

Consulte a `docs/documentacao-fotocerta.md` — especialmente o **Manual do Prosite**, cujas regras são obrigatórias em todo código gerado: `addEventListener` em vez de `onclick`; tags `<script>/<style>/<iframe>` blindadas com concatenação (`'<scr'+'ipt>'`) dentro de strings JS; apenas `<div>` (nunca tags semânticas HTML5); todo script em IIFE; marcadores de seleção desenhados (radios/checkboxes nativos são ocultados pelo tema); `text-align:left` forçado nos cards; at-rules (`@keyframes`, `@media`) apenas em `<style>` no head ou body — nunca no campo CSS Customizado do componente, que só aceita propriedades soltas (aplicadas direto no elemento raiz, sem precisar de seletor); sem acentos em código.

## Estrutura do repositório

Repositório **público**, servido pelo GitHub Pages em **construtores.fotocerta.com.br**. A raiz é o que o Pages publica; o resto é material de apoio.

| Caminho | O que é / onde é usado |
|---|---|
| `index.html` | A ferramenta geradora (6 abas: slideshow, captação de leads, agendamento TidyCal, checkout, bordas com efeito, contagem regressiva). É a página servida pelo Pages. |
| `CNAME` | Domínio próprio do Pages: `construtores.fotocerta.com.br`. |
| `.nojekyll` | Impede o Pages de processar o repositório como Jekyll. |
| `docs/documentacao-fotocerta.md` | Contexto completo: arquitetura, manual do Prosite, decisões, estado atual. Fonte da verdade. |
| `docs/specs/` | Specs de design das funcionalidades, um arquivo por feature, nomeados `AAAA-MM-DD-topico-design.md`. |
| `prosite/natal-2026/hospedeira-tag-body.html` | Tag Body da página hospedeira `/natal-2026`: captação de leads + âncora inteligente + plano B. |
| `prosite/natal-2026/hospedeira-componente-iframe.html` | Componente HTML da hospedeira que embute a intermediária (a coluna dele leva ID Html `reserva`). |
| `prosite/natal-2026/intermediaria-tag-body.html` | Tag Body da página intermediária: script `ajustarAltura` do iframe. |
| `prosite/natal-2026/intermediaria-componente-tidycal.html` | Componente HTML da intermediária: embed TidyCal + expansão/recolhimento do modal. |
| `prosite/natal-2026/bordas-css-componentes.md` | Bloco global do head + o CSS das bordas animadas/degradês aplicados em componentes da landing de Natal. |
| `CLAUDE.md` | Este arquivo. |

Os arquivos em `prosite/` são o espelho fiel do que está publicado no Prosite, organizados por campanha. Códigos de checkout, slideshow e bordas com efeito não têm arquivo próprio: são gerados sob demanda pela ferramenta, já customizados por campanha ou componente.

## Dados operacionais não entram no repositório

O repositório é público. **WhatsApp, chave Pix e Client ID do PayPal nunca são versionados**: os campos da ferramenta nascem vazios, com exemplo no `placeholder`, e o valor digitado fica no `localStorage` do navegador. Vale para `index.html`, para os espelhos em `prosite/` e para a documentação.

Ao criar campo novo que receba esse tipo de dado, siga a mesma regra: `value=""` mais `placeholder`, e fallback `|| ''` em `restaurarEstado`. Nome da marca e cidade (`Foto Certa`, `Vitória`) continuam nos padrões — são identidade pública, não credencial.

## Padrão de todo código novo

**No código gerado:** variáveis de customização no topo, comentadas com os valores permitidos; seção "Daqui para baixo nao precisa mexer"; prefixos próprios (classes `fc-` no slideshow, `fcw-` na captação de leads, `fcu-` no checkout, `fcb-` na contagem regressiva; animações `fc-borda-*` nas bordas).

**No layout das abas da ferramenta** (obrigatório também para abas novas — detalhes na seção 4 da documentação): descrição no topo → **seções numeradas** de configuração (`<div class="secao"><span class="secao-n">N</span> Título</div>` + `<div class="grade">` de duas colunas de fieldsets, agrupadas por tema; formulário de cadastro à esquerda e lista à direita quando houver) → **última seção "Prévia e código gerado"**, com os botões de ação, a prévia à esquerda e as saídas de código à direita → **instruções de uso ao final**, em largura total. Campos e funções levam o prefixo da aba (`s-`, `l-`, `t-`, `u-`, `b-`, `c-`).

**CSS gerado programaticamente:** nunca emitir uma segunda regra para um seletor que outra função já declarou. Propriedades shorthand (`transition`, `background`, `animation`) não se fundem entre duas regras do mesmo seletor com a mesma especificidade — a que vier depois no CSS vence por inteiro e apaga a primeira. Acumular tudo (transições, camadas de background, animações) numa única regra existente para aquele seletor.

## Fluxo de manutenção (importante)

1. Ao evoluir qualquer código destes arquivos, **atualizar o arquivo correspondente no repositório** (conteúdo completo, nunca trecho).
2. Ao evoluir a ferramenta, editar o `index.html` e publicar por **commit + push** — o GitHub Pages atualiza `construtores.fotocerta.com.br` sozinho. A página `utl-construtor` do Prosite foi descontinuada; não existe mais o passo de republicar o miolo em componente.
3. Ao mudar arquitetura, regra ou decisão, **atualizar a `docs/documentacao-fotocerta.md`** (e o inventário acima, se surgir arquivo novo).
4. Sempre lembrar: **editor ≠ publicado** — vale para as páginas do Prosite (publicar para testar) e para o Pages (o deploy leva alguns instantes). Console do Safari (Cmd+Option+C) para diagnosticar.
