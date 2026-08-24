# O pop-up automático respeita o horário de atendimento

**Data:** 24/08/2026
**Estado:** implementado e verificado
**Toca:** `index.html` (aba Captação de leads). Nenhum arquivo compartilhado.

---

## 1. O pedido

Com o modo de exibição em **"pop-up abre sozinho"**, ele não deve abrir automaticamente quando estiver **fora do horário de atendimento** — se o horário estiver configurado.

## 2. O que já existia, e por que a mudança não é óbvia

A aba já tem a seção **Horário de atendimento**: dias, hora de abertura e de fechamento, fuso fixo de Brasília, e um aviso mostrado fora do expediente. E o bloco já emite `dentroDoHorario()`, usada para exibir esse aviso dentro do cartão.

Ou seja: **o comportamento antigo não era um defeito.** O pop-up abria à noite e mostrava *"Estamos fora do horário de atendimento. Deixe seu recado"* — o que capta recado fora do expediente, com uma frase honesta. É uma escolha defensável, e era a que estava publicada.

Por isso a mudança entrou como **escolha visível**, e não como acoplamento silencioso entre duas configurações que até hoje eram independentes:

- **Não abrir** (padrão novo) — o pedido do dono.
- **Abrir mesmo assim, com o aviso** — o comportamento anterior, preservado.

**O ausente vale "não abrir".** Estado gravado por versão anterior não traz a chave: quem tinha horário configurado e pop-up automático estava sendo interrompido fora do expediente **sem ter escolhido isso**, então o padrão novo é o que ele teria escolhido se lhe tivessem perguntado.

## 3. As três decisões

**A conferência é na hora de abrir, não na hora de montar.** Entre a carga da página e o disparo passam os segundos configurados, e quem chega pouco antes de fechar cruzaria o expediente esperando. Conferir dentro do `setTimeout` é o único jeito de a decisão valer para o instante em que o pop-up apareceria.

**Não chama `marcarVisto()` quando segura.** O visitante não viu nada; se ele abrir outra página do site dentro do horário, o pop-up ainda tem a vez dele. Marcar como visto gastaria uma oportunidade que nunca existiu.

**O botão flutuante continua na tela, sempre.** Escolher "não abrir" não deixa de captar recado à noite — quem clicar no botão abre o pop-up a qualquer hora, com o aviso de fora do horário. O que se evita é **interromper** quem está lendo a página. Isso está dito na ajuda do campo, porque é a diferença que decide a escolha.

**Zerado na origem.** No modo "abre no clique" não há abertura automática para segurar, então a guarda **não é emitida** — e a escolha fica à vista, desabilitada, com aviso âmbar, como o desconto Pix com sinal ligado. O bloco entregue continua carregando apenas a maquinaria escolhida.

## 4. Verificação

Primeira aplicação do **molde versionado** (`scripts/verificar/pagina.mjs`) a um segundo bloco — o que também o validou fora da aba em que nasceu. Relógio falso instalado antes da carga; rede externa bloqueada.

- **Modo automático + horário + "não abrir":** o bloco leva a guarda; **dentro** do horário (segunda, 14h) o pop-up abre sozinho; **fora** (segunda, 22h) não abre, e o botão continua na tela; em **dia não atendido** (domingo, 14h) não abre. Zero erro de JS.
- **"Abrir mesmo assim":** o bloco **não** leva a guarda, abre fora do horário e mostra o aviso — o comportamento anterior, intacto.
- **Sem horário configurado:** o bloco não leva a guarda e abre a qualquer hora. Nada mudou para quem não usa o recurso.
- **Modo "abre no clique":** a guarda não é emitida, nada abre sozinho, e o botão está lá.
- **Na interface:** a escolha aparece com o horário ligado, desabilita com aviso âmbar no modo "abre no clique", some junto dos campos quando o horário é desligado, nasce em "não abrir" e sobrevive à recarga.
- **Regressão:** as 12 saídas e as 9 cobranças **byte a byte idênticas** — inclusive o `l-out`, porque o padrão de fábrica da aba tem o horário desligado e a guarda não sai.
