# Design — Fase 5: recursos novos das seis abas

> Spec validado com o usuário em 19/08/2026. Alvo: `index.html`, projeto Foto Certa / Alboom Prosite.

## 1. Escopo

Dezenove recursos, em duas origens (um vigésimo, o R16, foi removido pelo dono depois da validação — ver 2.4):

- **14 sugestões** das auditorias das cinco abas antigas (a décima quinta — permitir mais de um slideshow por página — já foi entregue na fase 3).
- **6 pedidos novos** do dono, feitos depois de usar a aba Contagem regressiva na prática.

Nenhum esbarra em limitação técnica. As decisões de projeto que exigiam escolha do dono estão registradas na seção 3.

## 2. Os recursos, por aba

### 2.1 Checkout — os dois mais pesados

**R1. Cobrança de sinal com saldo na entrega.** É o modo de venda mais comum de ensaio fotográfico, e hoje a ferramenta só sabe cobrar o valor cheio.

- **Configurável:** um radio liga ou desliga o modo. Desligado, o carrinho gerado é exatamente o de hoje.
- Ligado, o operador define o sinal como **percentual do total** ou **valor fixo**, e o texto do saldo (ex.: "restante na entrega").
- O que muda no bloco entregue: o PayPal cobra o sinal, não o total; o Pix gera QR do sinal; a mensagem do WhatsApp declara sinal pago e saldo devido; o carrinho exibe as três linhas (total, sinal agora, saldo na entrega).
- **Interação obrigatória com o que já existe:** cupom e desconto Pix incidem sobre o **total**, e o sinal é calculado depois. Um cupom que zere o total tem de continuar sendo barrado. O desconto Pix aplicado ao sinal seria desconto dobrado — não aplicar.

**R2. Quantidade por produto e por item opcional.**

- **Configurável por item:** cada produto e cada opcional declara se aceita quantidade. Serviço não vendido por quantidade continua sendo sim/não.
- Quando aceita, o carrinho mostra um seletor de quantidade e o subtotal multiplica.
- **Interação obrigatória:** quantidade multiplica antes de cupom e antes do sinal. No modo "escolha um pacote" a quantidade vale para o pacote escolhido.

**R3. Resumo copiável do pedido para conciliação.** O Pix estático não confirma pagamento — a conciliação é por extrato. Um resumo copiável (produtos, opcionais, cupom, valor, código do pedido) reduz o trabalho manual.

### 2.2 Slideshow

**R4. Proporção diferente no celular.** Foto em retrato hoje aparece minúscula no telefone, que é onde a maioria vê.

**R5. Ordem aleatória.** Embaralha ao carregar a página: cada visitante vê uma ordem diferente, e a primeira foto também varia.

**R6. Ligar e desligar setas e bolinhas.** Dois controles independentes. Com ambos desligados e avanço automático ligado, o visitante perde qualquer controle — é escolha de vitrine legítima, mas o campo avisa.

**R7. Arrastar para trocar de foto no celular, e pausar ao tocar ou passar o mouse.**

### 2.3 Captação de leads

**R8. Horário de atendimento.** Faixa de dias e horas; fora dela o pop-up troca o texto e avisa em vez de prometer resposta que não virá.

**R9. Pergunta de qualificação opcional.** Lista fechada configurável, cuja resposta chega junto na mensagem do WhatsApp.

**R10. Posição do botão flutuante configurável** — canto esquerdo ou direito, e distância do rodapé.

**R11. Efeitos de destaque no cabeçalho do pop-up.** Os cinco da Contagem regressiva: pulsar, brilho passante, degradê animado, separador piscando e tremor.

**R12. Movimento do conteúdo no cabeçalho do pop-up.** Apenas as opções de mensagem única: estático, rolagem para a esquerda, rolagem para a direita. As duas de alternância não se aplicam — exigem duas ou mais mensagens, e o cabeçalho tem título único.

**R13. Cores da coruja no cabeçalho** — corpo e detalhes separados, como na Contagem. Hoje a cor é amarrada à do botão.

**R14. Posição da coruja no cabeçalho** — não usar, à esquerda, à direita, dos dois lados.

### 2.4 Agendamento TidyCal

**R15. Botão para abrir a página de teste** antes de gerar, evitando descobrir o endereço errado só depois de publicar.

~~**R16. Pré-preenchimento do formulário do TidyCal** por parâmetros de URL.~~ **Removido em 19/08/2026, a pedido do dono.** A premissa não se sustenta no fluxo real: o pop-up de captação existe para quem tem dúvida e vai ao WhatsApp; quem já decidiu vai direto ao calendário. Os dois públicos não se cruzam, então não há dado capturado para repassar. Implementar seria esforço sem ganho.

**R17. Presets de altura por tipo de agendamento**, em vez de calibrar os números à mão.

### 2.5 Bordas com efeito

**R18. Prévia sobre fundo configurável.** A documentação já registra a lição de que cor renderizada muda com o contexto; a prévia sobre o fundo real torna isso verificável antes de publicar.

**R19. Biblioteca de presets salvos**, para reusar a mesma identidade em toda campanha.

**R20. Bloco do cabeçalho consolidado** quando a página usa dois efeitos, em vez de dois blocos concorrentes.

### 2.6 Contagem regressiva

**R21. Posição da coruja** — não usar, à esquerda, à direita, dos dois lados. Substitui o atual liga/desliga.

**R22. Coruja acompanhando a altura da barra.** Quando a barra quebra em mais de uma linha, a coruja cresce para ocupar a altura disponível. Vale no celular e no computador.

## 3. Decisões de projeto validadas pelo dono

**D1. "Mostrar no celular?" continua sendo controle separado** da posição da coruja. Razão: é legítimo querer as duas corujas no computador e só uma, ou nenhuma, no celular.

**D2. O campo de altura da coruja vira um teto**, não uma escolha entre fixo e automático. A coruja cresce com a barra até no máximo aquele valor. Um controle a menos, e protege contra barra de três ou quatro linhas produzindo uma coruja desproporcional.

> **Nota de implementação (fase 5, entregue).** "Cresce com a barra", "para no teto" e "com uma linha só fica no tamanho do teto" não são simultaneamente realizáveis: se a coruja também **impõe** o teto como altura mínima da linha, a linha nunca fica abaixo do teto e `min(teto, linha)` dá teto sempre — o recurso vira letra morta. Piso e teto no mesmo número se anulam. Como D2 diz que o número é o **teto** (e que o modo fixo saiu), a implementação não põe piso: a coruja acompanha a altura da linha e para no teto. Consequência: numa barra cuja linha é mais baixa que o teto (texto curto, sem botão de ação e sem botão de fechar) a coruja fica menor que o teto em vez de esticar a barra. A condição é a **linha ser mais baixa que o teto**. Com o teto padrão de 26 px, barra com botão de ação não muda (linha de ~50 px). Mas quem tiver subido o teto para 40 ou 60 verá a coruja menor do que via antes — medido: com teto 60, o desenho cai de 59,99 para 30,33 px, e a barra encolhe de 80 para 50,33. Subir o teto também alarga o espaço reservado nas pontas, mesmo quando a coruja não cresce, porque a largura do quadro acompanha o teto.

**D3. Os cinco efeitos de destaque vão para o pop-up de leads**, mesmo os que tendem a irritar num cabeçalho pequeno. Razão do dono: fica pronto, e a decisão de usar é dele no momento da campanha. Registrada a ressalva de que pulsar e tremer são pouco recomendáveis ali.

> **Notas de implementação (fase 5, Leads — entregue).** Três pontos que o spec deixou em aberto e foram decididos na implementação:
> - **O que muda fora do horário (R8).** O botão continua abrindo, o formulário continua enviando e a mensagem continua indo para o WhatsApp. O que muda é a promessa: um aviso âmbar aparece no topo do formulário. Critério: mensagem de WhatsApp fica esperando, então barrar o recado perderia o lead sem proteger ninguém — e prometer resposta imediata às 22h é a promessa que não se cumpre. O aviso é recalculado **em cada abertura do pop-up**, porque uma aba deixada aberta atravessa a virada do expediente.
> - **Fuso (R8).** Fixo no código gerado (`HORARIO_FUSO=-3`), como a data-alvo da Contagem regressiva. O horário de atendimento é o do fotógrafo, não o do visitante; com a hora local do aparelho, o mesmo instante seria "dentro" para um visitante e "fora" para outro. Faixa que cruza a meia-noite é aceita (o dia marcado é o do início); abertura igual a fechamento é recusada com aviso; sem dia marcado ou com hora em branco o modo fica desligado, com aviso visível na aba.
> - **A resposta na mensagem (R9).** Entra como linha própria entre a página e o `(cod: …)`, no formato `Interesse *Ensaio newborn*.`, com o prefixo configurável em campo próprio (mesmo padrão dos outros "antecede…" da aba). A resposta é **opcional para o visitante**: sem escolha a linha não existe e a mensagem sai idêntica à de quem não usa o recurso.
>
> Além disso, a **rolagem do cabeçalho é medida na abertura do pop-up**, e não na montagem do bloco: o pop-up nasce com `display:none` e dentro de elemento escondido toda medida dá zero — a solução de repetir o conteúdo até cobrir o container foi reaproveitada da Contagem, mas o momento da medição precisou mudar. E o **separador piscando** foi adaptado: sem relógio no cabeçalho, ele entra como um ponto (`•`) piscando antes do título, com a adaptação escrita na ajuda do campo.

**D4. A posição da coruja no Leads vale apenas para o cabeçalho do pop-up.** O botão flutuante tem a coruja como ícone único, onde posição não se aplica.

**D5. O movimento do conteúdo no Leads leva só as opções de mensagem única.**

## 4. Restrições e riscos

### 4.1 Restrições herdadas

- **ES5 apenas.** Sem `let`, `const`, arrow function, template literal.
- **Arquivo único.** A separação foi avaliada e recusada — sem ganho de desempenho, e a falha que motivaria a mudança já foi resolvida na fase 2.
- O código gerado obedece o manual do Prosite: `addEventListener` sempre, só `<div>`, IIFE, sem acentos no código gerado, at-rules dentro do `<style>` do próprio bloco.
- **Escape por destino:** `escHtml` para `innerHTML`, `escAttr` para atributo, `escJs` para string JS do bloco gerado. Escapar para o destino errado produz entidade literal visível.
- **Nada de valor padrão para dado operacional** — o repositório é público.
- **Estrutura de isolamento por aba** (`fcFrag`, `fcSoLeitura`, `fcBarra`, `ABAS`) e os helpers de faixa (`fcPreso`, `fcAjustar`) não podem ser alterados.
- **Campo com valor inválido** se corrige na própria interface no `change`/`blur`, ou recusa com aviso quando não há valor certo a assumir. Nunca corrige em silêncio.
- **Nunca emitir segunda regra CSS para um seletor que outra função já declara** — shorthand não se funde entre regras de mesma especificidade.
- **A prévia roda o gerador, não o imita.** Onde houver prévia dinâmica, ela executa o bloco gerado num iframe de mesma origem, com storage em memória.

### 4.2 Riscos específicos desta fase

**O Checkout mexe em dinheiro.** Sinal e quantidade convivem com cupons, desconto Pix e opcionais. Cada combinação nova multiplica o que precisa ser conferido. A ordem de cálculo é: quantidade multiplica → cupom incide sobre o total → sinal é calculado sobre o total já com desconto → desconto Pix **não** se aplica sobre o sinal.

**A rolagem no cabeçalho do pop-up sofre o defeito já conhecido.** O cabeçalho é estreito e o título é curto: a técnica de duplicar e transladar deixa vão visível. A solução já existe na Contagem regressiva — repetir o conteúdo até cobrir o container — e deve ser reaproveitada, não reimplementada.

**A coruja no cabeçalho precisa ficar fora da área que rola**, como na barra de contagem. Dentro do trilho, ela sumiria junto com o texto.

**A coruja que acompanha a altura** resolve-se por CSS, sem JavaScript: a barra já é flexível, o desenho tem proporção fixa, e a largura acompanha a altura sozinha. O teto do campo entra como limite máximo.

**Efeitos no Leads exigem `@keyframes` no mesmo `<style>`** do bloco da Tag Body — é como a aba já funciona.

## 5. Casos de borda

| Situação | Comportamento |
|---|---|
| Sinal maior que o total | Recusa com aviso |
| Sinal com cupom que zera o total | O bloqueio de total zero prevalece |
| Quantidade zero | Equivale a item não escolhido |
| Quantidade em produto no modo "escolha um pacote" | Vale para o pacote escolhido |
| Ordem aleatória com uma foto só | Sem efeito, não quebra |
| Setas e bolinhas desligadas sem avanço automático | Visitante fica preso na primeira foto — recusar ou avisar |
| Coruja "dos dois lados" no celular com título longo | O corte do celular já esconde as duas se "Mostrar no celular" estiver desligado |
| ~~Barra de uma linha só~~ | ~~A coruja fica no tamanho do teto~~ — **riscado na entrega:** contradiz D2 e é irrealizável junto com "cresce com a barra". Ver a nota em 3/D2. Medido: 19,50 px contra teto de 26. |
| Horário de atendimento sem faixa preenchida | O modo fica desligado |
| Pergunta de qualificação sem opções cadastradas | O campo não aparece no pop-up |

## 6. Verificação

Cada recurso precisa de verificação no navegador, servindo por `localhost` — `file://` bloqueia `localStorage`, e o endereço de rede multiplica pedidos de permissão. Asserções dirigidas por DOM, porque o script vive numa IIFE única. Antes de cada roteiro, limpar o armazenamento **e recarregar**: `clear()` sozinho não basta, o estado em memória sobrevive.

Os recursos do Checkout exigem, além disso, conferência aritmética de cada combinação: quantidade × cupom, quantidade × sinal, cupom × sinal, e as três juntas, nos modos PayPal, Pix e ambos.

A regressão contra a `main` precisa mostrar que a saída muda **apenas** onde o recurso novo atua, e que o bloco gerado com todos os recursos desligados é idêntico ao de hoje.
