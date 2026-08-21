# Identidade e paleta — configuração acima das abas

**Data:** 21/08/2026
**Estado:** aprovado pelo dono

---

## 1. O problema, medido

Com oito abas, os mesmos dados são digitados várias vezes.

**Identidade — 6 valores em 21 campos:**

| Dado | Abas |
|---|---|
| Chave Pix, nome e cidade do recebedor | Checkout, Cobrança, Loja |
| Client ID do PayPal | Checkout, Cobrança, Loja |
| WhatsApp | Leads (`l-num`), Checkout, Cobrança, Loja (`*-zapnum`) |

Além da digitação repetida, há o risco que importa: **trocar de chave Pix exige lembrar de três lugares.** Esquecer um é defeito silencioso num campo que é dinheiro.

**Cores — parecem repetidas, mas só três abas as compartilham.** Medidos os rótulos:

| | Checkout | Cobrança | Loja | Leads |
|---|---|---|---|---|
| `c1` | Cor de destaque | Cor de destaque | Cor de destaque | **Fundo do cabeçalho** |
| `c2` | Fundo do card | Fundo do cartão | Fundo dos cartões | Fundo do card |
| `c3` | Cor do texto | Cor do texto | Cor do texto | **Botão enviar** |

São **35 campos de cor** no arquivo; só **9** são a mesma coisa. Bordas (`f1`, `f2`, `c1`–`c4`) e Contagem (`cfundo`, `ctexto`, `cdestaque`, `ctafundo`, `ctatexto`, `cprog`, `curg`) têm vocabulário próprio.

**Coruja:** `corujacorpo` e `corujadet` em Leads, Contagem e Cobrança.

## 2. A distinção que governa o desenho

**Identidade não muda por campanha. Aparência muda.**

A chave Pix é a mesma no Natal e na Páscoa. As cores, não. E isso importa porque o **preset geral** já é por campanha e página — esta configuração fica num nível **acima** dele.

**Decisão do dono sobre a coruja:** vai para a **paleta**, não para a identidade. Razão dele, e é boa: *"posso precisar trocar a cor da coruja dependendo da cor do fundo para criar contraste visual"*. Cor de coruja é aparência, não marca.

## 3. O desenho

### 3.1 Identidade — sai das abas

Os 21 campos viram **6**, num lugar só. As abas passam a ler de lá; **não há segunda cópia, logo não há como divergir**.

Campos: chave Pix, nome do recebedor, cidade do recebedor, Client ID do PayPal, WhatsApp.

*(São 5 campos para 6 valores porque nome e cidade são dois campos e a chave é um; a contagem de "6 valores" acima soma o WhatsApp.)*

**Quando estiver vazia**, as abas recusam gerar como já recusam hoje — mas a recusa passa a apontar para o painel de Identidade.

### 3.2 Paleta — fica global, com botão

Cinco cores: **destaque**, **fundo do cartão**, **texto**, **corpo da coruja**, **detalhes da coruja**.

E um botão **"aplicar às abas"**, que copia a paleta para as abas que usam cada cor:

- destaque, fundo, texto → Checkout, Cobrança, Loja
- corpo e detalhes da coruja → Leads, Contagem, Cobrança

**Ação, não amarração.** É a mesma decisão do R3 do preset geral: cópia com origem visível, nunca propagação silenciosa. Assim uma campanha pode ter cores próprias sem quebrar as outras — que é exatamente o caso de contraste que o dono levantou.

**Leads, Bordas e Contagem mantêm seus campos próprios** para tudo que não seja coruja: os nomes coincidem, os significados não.

### 3.3 Onde fica

**Não numa aba** — as oito abas são construtores, e isto não constrói nada.
**Não numa faixa fixa** acima, que empurraria todo o conteúdo para baixo.

**Um segundo painel recolhível na barra do topo, ao lado de "Detalhes", chamado "Identidade".** Mesmo lugar onde a administração já mora, mas **rotulado como pertencente à ferramenta, não à campanha** — a distinção precisa ficar visível, porque é ela que explica por que a identidade não entra no preset geral.

## 4. A migração — o risco desta tarefa

O operador já tem valores digitados nas abas, e eles **podem divergir entre si**.

1. Na primeira abertura da versão nova, a ferramenta **recolhe** o que existe nas abas.
2. **Se as abas discordarem, ela pergunta qual vale** — nomeando as abas e mostrando os valores. Nunca escolhe calada. O preset geral já sabe detectar divergência de campo operacional; é a mesma máquina.
3. **Presets de aba salvos** que carregam identidade: a identidade é ignorada ao aplicar (passou a ser global), e isso é dito na tela uma vez.
4. **Nada se perde.** Em dúvida entre descartar e preservar, preservar.

## 5. Integração

- **`ABAS.operacionais`**: a identidade deixa de ser por aba. O aviso de divergência do R1 entre as duas páginas de uma campanha **deixa de poder acontecer** para esses campos — simplificação, e precisa ser dito na documentação em vez de virar código morto.
- **Preset geral**: não carrega identidade. Consequência boa: um preset geral repassado a outra pessoa não leva os dados de pagamento do dono.
- **Backup (fase 4)**: a identidade entra no **"com dados"** e fica **fora do "sem dados"**. É o dado mais sensível do arquivo.
- **Painel consolidado**: sem mudança — a identidade não gera bloco.
- **Presets de aba**: deixam de guardar identidade.

## 6. Verificação

- **Saídas byte a byte idênticas** para os mesmos valores efetivos. A identidade mudou de lugar, não de valor.
- **Migração** provada com estado real de `main`, incluindo o caso de divergência entre abas.
- **Identidade vazia** → as abas recusam gerar, apontando o painel.
- **Botão da paleta** aplica só onde a cor tem o mesmo significado — e não encosta em Bordas, nem nas cores próprias de Leads e Contagem.
- **Backup**: identidade presente no "com dados", ausente no "sem dados", ida-e-volta fiel.
- **Textos hostis** nos campos de identidade — eles vão para dentro do código gerado.
- Varredura de IDs, ES5, IIFE única, norma de acentuação.

## 7. Estimativa

| Parte | Estimativa |
|---|---|
| Identidade global, migração e remoção dos campos de 4 abas | 2h – 3h |
| Paleta e o botão de aplicar | 45min – 1h15 |
| Integração: preset geral, backup, painel, presets de aba | 1h – 1h30 |
| **Total** | **4h – 6h** |

Risco de estouro na **migração** (estado existente, divergência, presets antigos) e no **backup**, onde a identidade é o dado mais sensível do arquivo.
