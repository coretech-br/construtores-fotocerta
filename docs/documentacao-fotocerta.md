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
2b. **Duas sequências tiram o parser HTML do estado normal de `<script>`, inclusive dentro de uma string JS** — e a blindagem por concatenação do item 2 só cobre as tags que o gerador escreve, não o texto digitado pelo operador que vai parar dentro do script gerado:
    - `</` — fecha o elemento no primeiro `</script` do texto bruto;
    - `<!--` — leva ao estado *script-data-escaped* e, se vier um `<script` depois, ao *double-escaped*; dali o `</script>` legítimo do próprio bloco **deixa de fechar o elemento**, e o que vem depois dele na página é engolido junto.

    Onde o valor é consumido como HTML, `escHtml` já basta (escapa o `<`, o que neutraliza as duas). Onde o valor precisa chegar cru ao runtime — porque vai para `textContent` ou vira chave de `localStorage` —, usar `escJs` (em `index.html`), que é `esc()` mais `replace(/<\//g,'<\\/')` e `replace(/<!--/g,'<\\!--')`: **essas duas sequências e nada mais** — a barra invertida o parser HTML vê, e o interpretador JS descarta.
    - **Vale para o próprio `index.html` da ferramenta, não só para o código gerado**: um comentário no fonte da ferramenta contendo `<!--` e, depois dele, um `<script` literal joga o parser no estado *double-escaped* e o `</script>` final deixa de fechar o bloco — a ferramenta inteira para de carregar. Ao comentar essas regras, escrever "sequência de fechamento de script" em vez da sequência literal.
    - **Cobertura (ago/2026)**: `escJs` passou a valer em **todo** ponto das cinco abas antigas onde texto de campo livre entra numa string JS do bloco gerado (Slideshow: link e legenda; Leads: código, nome da página, os 4 trechos da mensagem, emoji, âncora e os 7 textos do pop-up; Checkout: Client ID, chave Pix, nome, cidade, código do pedido, produtos, opcionais, cupons e todos os `TXT_*`). TidyCal não usa `escJs`: seus dois campos livres vão para **atributo HTML** (`data-path`, `src`) e já usavam `escAttr` — escapar para o destino errado produziria entidade literal visível. Bordas não usa: seu único campo livre (`padding`) vai para **CSS**.
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

Ferramenta de geração de códigos com **6 abas**, estado persistido em localStorage (chave `fcConstrutores`, por navegador/domínio).

### Padrão de layout das abas (seguir sempre, inclusive em abas novas)

Toda aba tem o mesmo fluxo linear, de cima para baixo:

1. **Descrição** (`<p class="descricao">`) — o que o construtor faz, em um parágrafo.
2. **Seções numeradas de configuração** — cada uma abre com `<div class="secao"><span class="secao-n">N</span> Título</div>` (a primeira leva `class="secao primeira"`, que remove a linha divisória do topo) e é seguida por `<div class="grade">` com duas colunas de `<fieldset>`. Agrupar por tema, distribuindo os fieldsets entre as colunas para equilibrar a altura; quando houver formulário de cadastro + lista (imagens, produtos, cupons), o formulário fica à esquerda e a lista à direita.
3. **Última seção: "Prévia e código gerado"** — botões de ação (`Gerar código` e afins) numa `<div class="acoes">` logo abaixo do cabeçalho da seção, depois uma `grade` com a prévia (`<div class="pv-area">`) à esquerda e a(s) saída(s) (`<div class="saida">` com textarea + botão Copiar) à direita. Abas sem prévia (TidyCal) usam a mesma seção só com as saídas.
4. **Instruções ao final** (`<div class="instrucoes">`), em largura total: onde colar, pré-requisitos, como funciona e o que fazer depois de publicar.

Dentro dos fieldsets: `radios` para valores de lista fechada, campos com `<small>` explicando unidade/limites, e `<p class="ajuda">` para orientações. Prefixo de ID por aba (`s-`, `l-`, `t-`, `u-`, `b-`, `c-`) em todos os campos, e o mesmo prefixo nas funções JS correspondentes.

**Prévia: rodar o gerador, não imitá-lo.** Prévia que redesenha o resultado com código próprio é uma segunda implementação do gerador, e duas implementações divergem — na aba Contagem regressiva divergiram duas vezes antes de a duplicação ser removida (escape de HTML presente num lado e ausente no outro; urgência sem ramo de saída no código gerado, com o ramo correto na prévia). O padrão para abas com prévia dinâmica é: a função que monta o bloco entregue (`cBloco` na contagem regressiva) é **fonte única**, e a prévia executa o retorno dela dentro de um `<iframe>` de mesma origem, montado por `document.write`. Ganha-se fidelidade por construção — não por esforço de cópia. Três cuidados que vêm junto:

- **Storage falso.** Se o bloco gerado grava em `localStorage`/`sessionStorage`, injetar no iframe, *antes* do bloco, um shim que troque os dois por objetos em memória. Sem isso a prévia suja as chaves reais da origem da ferramenta e, na segunda abertura, nasce com a contagem já gasta. O bloco entregue continua idêntico: o shim é do ambiente da prévia.
- **Enchimento e alternador de largura.** Blocos cinzentos abaixo da barra dão altura para rolar (sem eles não dá para ver `padding-top`, entrada "depois de rolar" nem barra fixa); dois botões trocam a largura lógica do iframe para atravessar o corte de `@media` configurado, e quem avalia a media query passa a ser o próprio iframe. **Campo numérico que entra numa media query precisa ser preso à faixa declarada na própria `cCfg`, não só na largura da prévia**: `min`/`max` de `<input type="number">` não são impostos a valor digitado, e prender apenas a largura da prévia faz o iframe ir para um valor e o CSS gerado ficar em outro — a media query não casa e o modo Celular exibe layout de computador sem avisar. Preso na fonte da configuração, os dois lados leem o mesmo número. Mas clamp sozinho corrige o código entregue **em silêncio** — o operador lê 100 na tela e copia `max-width:320px`, o mesmo defeito invisível que esta aba já recusou duas vezes no limiar de urgência. Então o campo também **se corrige na interface**, no `change`/`blur`: o valor preso volta para o input, a correção acontece à vista, e o clamp da `cCfg` fica como rede para estado restaurado do `localStorage`. Nunca no `input` — corrigir a cada tecla impediria digitar "320", porque o "3" viraria 320 antes do resto chegar.
- **Falha do shim tem que ser barulhenta.** O `try/catch` do bloco gerado não denuncia um shim que não instalou: `setItem` no Storage real funciona e não lança, e o sintoma só apareceria na segunda abertura da aba como contagem vencida. O shim marca o objeto em memória (`fcPvMemoria`), confere depois da troca e, se não instalou, insere um aviso vermelho visível no topo da prévia.
- **Debounce com timer único.** Remontar a cada tecla pisca e custa caro: 400 ms para mudanças de campo, imediato no botão "Atualizar prévia". Cancelar o timer anterior antes de agendar outro.

O `<p class="ajuda">` abaixo da prévia continua obrigatório, mas muda de conteúdo: em vez de listar o que a prévia não mostra, declara o que ainda difere da página publicada (na contagem regressiva: a barra fixa gruda no topo do quadro e não da janela, o relógio é o da máquina do operador, e a contagem sempre começa agora em vez de na primeira visita do visitante).

1. **Slideshow** — fotos mistas (fundo desfocado), setas, legendas, dots, 3 transições, lazy loading.
2. **Captação de leads** — botão flutuante WhatsApp (ícones: whatsapp/recado/coruja SVG), pop-up nome+recado, modos botão/automático, efeitos pulsar/tremer, mensagem formatada com código de atendimento; opção de incluir âncora inteligente + plano B (gera a Tag Body completa da hospedeira).
3. **Agendamento TidyCal** — expansão/recolhimento do modal pelos sinais `scrollToOffset`/`mutationObserver` do iframe-resizer (origem `https://tidycal.com`), alturas desktop/mobile (2350/2700, corte 700px); modos direto ou embutido (3 saídas).
4. **Checkout** — carrinho completo, em uma só aba: **seletor de formas de pagamento** (PayPal + Pix | somente PayPal | somente Pix), **vários produtos** com opcionais próprios de cada um (seleção única ou múltipla por produto, com "sem opcional"), escolha de como o cliente seleciona produtos (1 só, estilo "escolha seu pacote", ou vários somando), cupons (% produtos, % total, fixo; validade opcional), desconto exclusivo Pix (padrão 10%, só no modo com os dois), largura, cores e cor dos botões PayPal (gold/blue/silver/white/black), marcadores desenhados. PayPal: SDK client-side só com Client ID público, `custom_id` + cupom na descrição, moeda BRL/USD/EUR quando é o único método (com Pix, fixa em BRL). Pix: BR Code estático padrão BC gerado no navegador (TLV + CRC16-CCITT), QR via qrcodejs (cdnjs), Copia e Cola, botão "Já paguei" via wa.me com produtos/opcionais/cupom/valor, txid = código do pedido, QR some se o pedido mudar. O código gerado carrega apenas a maquinaria da(s) forma(s) escolhida(s). Payload Pix validado como idêntico ao do Taggo.
5. **Bordas com efeito** — CSS puro (sem JS) para destacar um componente: 5 efeitos (brilho giratório — a solução original da landing de Natal; degradê contínuo; halo pulsante; listras em movimento; borda fixa) + **fundo interno customizável** (cor sólida, degradê com ângulo e fallback, ou manter). Gera 2 códigos: bloco global para a Tag Head (`@keyframes` + `prefers-reduced-motion`) e as propriedades para o campo CSS Customizado do componente. Técnica: dupla camada de background (`padding-box` + `border-box`) com `background-position` animada.
6. **Contagem regressiva** — barra de urgência para o topo da landing: contagem a partir da primeira abertura (carimbo em `localStorage`, chave `fcbar:<CODIGO>`) ou até uma data-alvo com fuso −03:00 fixo; formato compacto ou em blocos; movimento (estático, rolagem nos dois sentidos, alternância com fade ou deslize), destaque contínuo (pulsar, brilho passante e degradê animado — que quando combinados empilham-se em duas camadas de `background` numa única regra —, separador piscando, tremor), urgência progressiva por limiar, virada dos dígitos (fade ou flip: atualiza o texto do dígito no lugar e alterna uma classe para disparar a transição, sem recriar nós) e entrada da barra; extras de CTA, botão fechar com memória, barra de progresso e a coruja da identidade nas pontas. O bloco `prefers-reduced-motion` sai sempre que houver movimento — por `animation` ou por `transition` — e cobre barra, conteúdo, dígitos e barra de progresso. O radio "fixa no topo / no fluxo" decide o destino: Tag Body ou componente HTML — nunca a Tag Head, porque o bloco é autocontido. Decisões da revisão final (ago/2026): a urgência troca `backgroundColor` (nunca o shorthand `background`, que apagaria brilho e degradê) e tem ramo de saída, para o modo "reiniciar o ciclo" voltar ao normal; os dois intervalos (tique e alternância) são derrubados juntos no fim e no clique de fechar; o `padding-top` da barra fixa acompanha a classe `fcb-visivel`, não a montagem; o trilho da rolagem repete o conteúdo até cada metade cobrir o container (o `translateX(-50%)` exige duas metades idênticas); e `cGerar` recusa código de campanha vazio, nenhuma unidade marcada, limiar de urgência maior ou igual à duração total e `href` de CTA com esquema fora de âncora/caminho relativo/`http(s)`. **Prévia fiel (ago/2026):** a prévia deixou de ter motor próprio — `cFormatarHTML`, `cPartes`, `cAlvoMs` e `cDois` foram removidos, e `cGerar` foi partido em validações + `cBloco(cfg)`, que devolve o bloco. `cPvMontar` escreve, num iframe de mesma origem dentro de `#c-pv-box`, o shim de storage → o retorno de `cBloco` → o enchimento cinzento; o alternador Computador/Celular troca a largura lógica do iframe (`Math.max(920, mob+240)` contra `Math.min(380, mob)`, sempre atravessando o corte configurado), reduzida por `transform:scale` do lado de fora para caber na coluna sem mexer na viewport que a media query lê. `cCfg` passou a prender `mob` a `[320,1024]` (a faixa declarada no campo) — valor dentro da faixa passa intacto e a saída gerada não muda; valor fora dela era emitido inteiro no `@media` e fazia o modo Celular mentir. A prévia é montada **só no clique da aba**, nunca no carregamento da ferramenta: montar na carga executaria o bloco (intervalo de 1 s, listeners, `ResizeObserver`) para quem nunca abre a aba, e ainda com o painel escondido.

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

- **Campo do operador se corrige na interface, nunca em silêncio no gerador** (regra nascida no `c-mob` da Contagem e estendida em ago/2026 às cores das abas Leads e Checkout): valor inválido é substituído pelo padrão **no próprio campo**, no `change`/`blur` (nunca no `input`, que impediria digitar), com o seletor de cor acompanhando. Assim tela e código mostram sempre o mesmo valor. O gerador mantém a validação como rede (`corSegura`), que é quem segura estado restaurado do `localStorage` gravado antes da regra. Antes disso, a prévia validava a cor e o gerador não: o operador via verde-escuro e publicava `naoehcor` — ou, com um apóstrofo no campo, um bloco que executava código arbitrário no carrinho.
- **Chave Pix (aba Checkout)**: nome e cidade já passavam por `semAcento`; a chave ia crua. Regra adotada: o que o operador **não tem como ver** (espaços das pontas, zero-width, NBSP, caracteres de controle) é removido e devolvido ao campo; o que ele **pode ver** (espaço no meio, tamanho acima de 77 do padrão BR Code, campo que ficou vazio depois da limpeza) **recusa a geração com aviso**. Sem regra de formato por tipo de chave — o padrão aceita e-mail, telefone, CPF/CNPJ e aleatória. O limite a ASCII imprimível não é estética: `tlv()` conta com `v.length` e `crc16()` com `charCodeAt` (UTF-16), enquanto o banco conta bytes UTF-8; qualquer caractere fora da faixa faz comprimento e CRC discordarem e o banco recusa o QR sem explicação.

## 6. Estado atual e fluxo de manutenção

- Publicado e testado: hospedeira (leads + âncora + plano B), intermediária (TidyCal), a ferramenta de construtores, checkouts PayPal e Pix validados com pagamentos reais, e as bordas animadas nos blocos da landing de Natal.
- Pendente de teste na página publicada (gerado e validado tecnicamente em ago/2026): a aba **Bordas com efeito**, a aba **Checkout** na versão com seletor de formas de pagamento e múltiplos produtos, e a aba **Contagem regressiva**.
- **Fluxo de atualização**: editar o arquivo correspondente no repositório → commit + push. O GitHub Pages republica `construtores.fotocerta.com.br` sozinho, sem o antigo passo de colar o miolo em componente do Prosite. Os arquivos em `prosite/` continuam sendo colados à mão no painel da Alboom, pois são o espelho do que vive lá.
- **Migração do estado da ferramenta**: o `localStorage` é por origem, então o que estava salvo em `fotocerta.com.br/utl-construtor` não acompanha a mudança para `construtores.fotocerta.com.br`. Produtos, cupons e imagens cadastrados precisam ser recadastrados no novo endereço.

## 7. Arquivos do projeto

Repositório público servido pelo GitHub Pages. A raiz é o que o Pages publica; `prosite/` guarda o espelho do que está colado no painel da Alboom.

- `index.html` — a ferramenta de 6 abas, servida em construtores.fotocerta.com.br
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
