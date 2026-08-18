# Documentação — Foto Certa: Site Prosite e Construtores

> Documento de contexto para a base de conhecimento do projeto. Resume tudo que foi construído e as regras técnicas aprendidas. Última atualização: 18/08/2026.

## 1. Visão geral

- Negócio: **Foto Certa**, estúdio de fotografia (Vitória/ES). Identidade visual: coruja-suindara.
- Site: **fotocerta.com.br**, plataforma **Alboom Prosite**.
- Agendamento: **TidyCal** (booking type `fotocerta/natal-2026`), pagamentos do TidyCal via Stripe.
- **Dados operacionais não ficam neste repositório.** WhatsApp comercial, chave Pix (com recebedor e cidade) e Client ID Live do PayPal são digitados na ferramenta e guardados no `localStorage` do navegador — os campos nascem vazios, com exemplo no placeholder. Como o repositório é público, nenhum desses valores é versionado.
- Formato esperado de cada um: WhatsApp em DDI+DDD+número só dígitos; chave Pix no formato aceito pelo BC (e-mail, telefone, CPF/CNPJ ou aleatória); recebedor com até 25 caracteres e cidade com até 15, ambos sem acento no código Pix gerado.

## 2. Arquitetura das páginas (campanha Natal 2026)

- **Página hospedeira**: `fotocerta.com.br/natal-2026` — página de venda. Contém hero com botão âncora `#reserva`, slideshow, preço, e embute a intermediária via iframe.
- **Página intermediária**: `fotocerta.com.br/iframe-agendamento-natal` — contém o embed do TidyCal. É embutida na hospedeira por um `<iframe>` manual (mesmo domínio, o que permite scripts atravessarem via `contentDocument`).
- **Ferramenta de construtores**: `construtores.fotocerta.com.br` — repositório público servido pelo GitHub Pages, raiz `index.html`. Substituiu a página oculta `fotocerta.com.br/utl-construtor`, **descontinuada** em ago/2026.

### Onde cada código mora

| Local | Conteúdo |
|---|---|
| Site → Configurações → Códigos personalizados (head) | bloco global das animações de borda (`@keyframes` + `prefers-reduced-motion`), quando a aba "Bordas com efeito" é usada — cola-se uma vez e vale para todo o site |
| Hospedeira → Tag Head | vazia |
| Hospedeira → Tag Body | 3 blocos: (1) Captação de leads WhatsApp (style+script), (2) Âncora inteligente (script), (3) Plano B rolagem suave (style: `html{scroll-behavior:smooth}` + `#reserva{scroll-margin-top:24px}`) |
| Hospedeira → componente HTML do agendamento | `<iframe>` para a intermediária, height inicial 1600; a coluna desse componente tem **ID Html = `reserva`** (aba Avançado) |
| Intermediária → Tag Head | vazia |
| Intermediária → Tag Body | script `ajustarAltura` (usa `window.frameElement.style.height = scrollHeight`, com load/resize/ResizeObserver + reforços em 300/1000/2500ms) |
| Intermediária → componente HTML | embed TidyCal + style transição + script dos sinais do modal |
| construtores.fotocerta.com.br | `index.html` do repositório, servido pelo GitHub Pages |
| Componentes com destaque visual → campo CSS Customizado | propriedades da borda com efeito / fundo em degradê (ver `bordas-css-componentes.md`) |

Os códigos completos estão nos arquivos anexos do projeto e podem ser regenerados pela ferramenta.

## 3. Manual do Prosite (manhas do sanitizador — CRÍTICO para qualquer código novo)

1. **Remove `onclick`/eventos inline** → sempre `addEventListener`.
2. **Corrompe strings contendo** `<script`, `</script>`, `<style`, `<iframe` dentro de JS (na publicação) → blindar com concatenação: `'<scr'+'ipt>'`, `'</scr'+'ipt>'`, `'<sty'+'le>'`, `'</sty'+'le>'`, `'<ifr'+'ame'`.
3. **Remove tags semânticas HTML5** (`<section>`, `<header>`, `<nav>`) mantendo o conteúdo solto → usar só `<div>`.
4. **A página publicada carrega jQuery da Alboom que sobrescreve `$` global** → embrulhar todo script em IIFE `(function(){...})()`.
5. **Editor ≠ publicado**: sempre publicar para testar. Console do Safari (Cmd+Option+C) é a ferramenta de diagnóstico.
6. **Componentes HTML vivem em iframe do mesmo domínio** → scripts atravessam via `contentDocument`/`frameElement`.
7. **O CSS do tema esconde radios/checkboxes nativos** dentro de componentes → desenhar marcadores próprios (input invisível + span estilizado com `:checked + span`).
8. **O tema centraliza textos** dentro de componentes → forçar `text-align:left` no card e nos elementos.
9. **At-rules (`@keyframes`, `@media`) só funcionam em `<style>`** — na Tag Head do site (Configurações → Códigos personalizados → cabeçalho), na Tag Body ou dentro de um componente HTML. **Nunca no campo CSS Customizado do componente**, que aceita apenas propriedades soltas. Com o `@keyframes` no head, animações em componentes funcionam normalmente (ver aba "Bordas com efeito"). A exceção que permanece: animar **elementos de texto do editor** do Prosite (reconstruídos na publicação) — considerar inviável.
    - **Campo CSS Customizado do componente**: as propriedades soltas são aplicadas direto no elemento raiz daquele componente — **não precisa de ID Html, classe nem seletor**. Se algum componente exigir regra completa, inspecionar o elemento publicado, pegar a classe gerada pela Alboom e levar a regra (com seletor) para o head.
10. **Sem acentos/emojis em código colado** (precaução com o validador); textos visíveis com acento OK.
11. Tag Body aceita `<style>` + `<script>`.

## 4. Ferramenta de construtores (arquivo `index.html`, em construtores.fotocerta.com.br)

Ferramenta de geração de códigos com **5 abas**, estado persistido em localStorage (chave `fcConstrutores`, por navegador/domínio).

### Padrão de layout das abas (seguir sempre, inclusive em abas novas)

Toda aba tem o mesmo fluxo linear, de cima para baixo:

1. **Descrição** (`<p class="descricao">`) — o que o construtor faz, em um parágrafo.
2. **Seções numeradas de configuração** — cada uma abre com `<div class="secao"><span class="secao-n">N</span> Título</div>` (a primeira leva `class="secao primeira"`, que remove a linha divisória do topo) e é seguida por `<div class="grade">` com duas colunas de `<fieldset>`. Agrupar por tema, distribuindo os fieldsets entre as colunas para equilibrar a altura; quando houver formulário de cadastro + lista (imagens, produtos, cupons), o formulário fica à esquerda e a lista à direita.
3. **Última seção: "Prévia e código gerado"** — botões de ação (`Gerar código` e afins) numa `<div class="acoes">` logo abaixo do cabeçalho da seção, depois uma `grade` com a prévia (`<div class="pv-area">`) à esquerda e a(s) saída(s) (`<div class="saida">` com textarea + botão Copiar) à direita. Abas sem prévia (TidyCal) usam a mesma seção só com as saídas.
4. **Instruções ao final** (`<div class="instrucoes">`), em largura total: onde colar, pré-requisitos, como funciona e o que fazer depois de publicar.

Dentro dos fieldsets: `radios` para valores de lista fechada, campos com `<small>` explicando unidade/limites, e `<p class="ajuda">` para orientações. Prefixo de ID por aba (`s-`, `l-`, `t-`, `u-`, `b-`) em todos os campos, e o mesmo prefixo nas funções JS correspondentes.

1. **Slideshow** — fotos mistas (fundo desfocado), setas, legendas, dots, 3 transições, lazy loading.
2. **Captação de leads** — botão flutuante WhatsApp (ícones: whatsapp/recado/coruja SVG), pop-up nome+recado, modos botão/automático, efeitos pulsar/tremer, mensagem formatada com código de atendimento; opção de incluir âncora inteligente + plano B (gera a Tag Body completa da hospedeira).
3. **Agendamento TidyCal** — expansão/recolhimento do modal pelos sinais `scrollToOffset`/`mutationObserver` do iframe-resizer (origem `https://tidycal.com`), alturas desktop/mobile (2350/2700, corte 700px); modos direto ou embutido (3 saídas).
4. **Checkout** — carrinho completo, em uma só aba: **seletor de formas de pagamento** (PayPal + Pix | somente PayPal | somente Pix), **vários produtos** com opcionais próprios de cada um (seleção única ou múltipla por produto, com "sem opcional"), escolha de como o cliente seleciona produtos (1 só, estilo "escolha seu pacote", ou vários somando), cupons (% produtos, % total, fixo; validade opcional), desconto exclusivo Pix (padrão 10%, só no modo com os dois), largura, cores e cor dos botões PayPal (gold/blue/silver/white/black), marcadores desenhados. PayPal: SDK client-side só com Client ID público, `custom_id` + cupom na descrição, moeda BRL/USD/EUR quando é o único método (com Pix, fixa em BRL). Pix: BR Code estático padrão BC gerado no navegador (TLV + CRC16-CCITT), QR via qrcodejs (cdnjs), Copia e Cola, botão "Já paguei" via wa.me com produtos/opcionais/cupom/valor, txid = código do pedido, QR some se o pedido mudar. O código gerado carrega apenas a maquinaria da(s) forma(s) escolhida(s). Payload Pix validado como idêntico ao do Taggo.
5. **Bordas com efeito** — CSS puro (sem JS) para destacar um componente: 5 efeitos (brilho giratório — a solução original da landing de Natal; degradê contínuo; halo pulsante; listras em movimento; borda fixa) + **fundo interno customizável** (cor sólida, degradê com ângulo e fallback, ou manter). Gera 2 códigos: bloco global para a Tag Head (`@keyframes` + `prefers-reduced-motion`) e as propriedades para o campo CSS Customizado do componente. Técnica: dupla camada de background (`padding-box` + `border-box`) com `background-position` animada.

> Histórico: até ago/2026 existiam abas separadas de Checkout PayPal e Checkout Pix; foram unificadas na aba Checkout, que passou a ter seletor de formas de pagamento e múltiplos produtos. Nada se perdeu — o modo "somente PayPal" preserva a escolha de moeda, e o "somente Pix", o carrinho sem PayPal.


## 5. Decisões de arquitetura registradas

- **Sem servidor, sem segredos**: tudo roda client-side. Client ID do PayPal e chave Pix são públicos por definição; Secret do PayPal nunca é usado.
- **Stripe**: descartado como checkout próprio (valor dinâmico exige chave secreta em servidor). Permanece só como processador interno do TidyCal.
- **Boleto PayPal**: descartado (exige webhook/servidor; assíncrono não combina com reserva).
- **Pix pelo PayPal (PPCP)**: existe desde abr/2026 mediante solicitação/elegibilidade, formato link de valor fixo — não integrado; nosso Pix estático cobre melhor.
- **Parcelamento PayPal**: ativa-se no painel (até 12x, recebimento à vista); confirmado funcionando inclusive no botão preto (guest).
- **Pix estático não tem confirmação automática** → conciliação por extrato + mensagem do WhatsApp ("Já paguei").
- Efeito pulsar em **texto do editor** Prosite: abandonado (ver manual, item 9). Já em **componentes**, animações funcionam: o caminho validado é `@keyframes` no head + `animation:` nas propriedades do campo CSS Customizado (base da aba "Bordas com efeito").
- **Bordas com efeito** (origem: landing de Natal 2026, blocos "Presenteie uma família" e card "Pack Standard"): brilho = **contraste alto** entre base escura e facho claro, com facho **estreito** (~5% do ciclo) — cores próximas em luminosidade viram ondulação sutil. Cor renderizada muda com o contexto: validar sempre na página real, não no mockup. O Prosite não permite selo/badge flutuante sobre card — a borda animada cumpre esse papel (com o texto "O mais escolhido" na primeira linha).

## 6. Estado atual e fluxo de manutenção

- Publicado e testado: hospedeira (leads + âncora + plano B), intermediária (TidyCal), a ferramenta de construtores, checkouts PayPal e Pix validados com pagamentos reais, e as bordas animadas nos blocos da landing de Natal.
- Pendente de teste na página publicada (gerado e validado tecnicamente em ago/2026): a aba **Bordas com efeito** e a aba **Checkout** na versão com seletor de formas de pagamento e múltiplos produtos.
- **Fluxo de atualização**: editar o arquivo correspondente no repositório → commit + push. O GitHub Pages republica `construtores.fotocerta.com.br` sozinho, sem o antigo passo de colar o miolo em componente do Prosite. Os arquivos em `prosite/` continuam sendo colados à mão no painel da Alboom, pois são o espelho do que vive lá.
- **Migração do estado da ferramenta**: o `localStorage` é por origem, então o que estava salvo em `fotocerta.com.br/utl-construtor` não acompanha a mudança para `construtores.fotocerta.com.br`. Produtos, cupons e imagens cadastrados precisam ser recadastrados no novo endereço.

## 7. Arquivos do projeto

Repositório público servido pelo GitHub Pages. A raiz é o que o Pages publica; `prosite/` guarda o espelho do que está colado no painel da Alboom.

- `index.html` — a ferramenta de 5 abas, servida em construtores.fotocerta.com.br
- `CNAME`, `.nojekyll` — configuração do GitHub Pages (domínio próprio e desligamento do Jekyll)
- `docs/documentacao-fotocerta.md` — este documento (fonte da verdade do contexto)
- `docs/specs/` — specs de design das funcionalidades, um arquivo por feature
- `prosite/natal-2026/hospedeira-tag-body.html` — Tag Body da hospedeira (leads + âncora + plano B)
- `prosite/natal-2026/hospedeira-componente-iframe.html` — componente que embute a intermediária (coluna com ID Html `reserva`)
- `prosite/natal-2026/intermediaria-tag-body.html` — Tag Body da intermediária (ajustarAltura)
- `prosite/natal-2026/intermediaria-componente-tidycal.html` — componente do TidyCal (embed + modal expande/recolhe)
- `prosite/natal-2026/bordas-css-componentes.md` — bloco global do head + o CSS das bordas/degradês aplicados nos componentes da landing de Natal
- `CLAUDE.md` — instruções do projeto e fluxo de manutenção (carregado automaticamente pelo Claude Code)

Regra: os arquivos desta pasta devem sempre espelhar o que está publicado no Prosite — toda evolução atualiza o arquivo correspondente por completo.
