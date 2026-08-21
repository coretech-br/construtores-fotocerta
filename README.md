# Construtores Foto Certa

Ferramenta interna da [Foto Certa](https://fotocerta.com.br) para gerar códigos prontos para colar no site, que roda na plataforma **Alboom Prosite**.

**Publicada em: [prosite.fotocerta.com.br](https://prosite.fotocerta.com.br)**

A página é um único arquivo HTML sem dependências e sem servidor: todo o processamento acontece no navegador, e as configurações ficam no `localStorage` da própria máquina.

## O que ela gera

| Aba | O que produz |
|---|---|
| Slideshow | Apresentação de fotos com setas, legendas, bolinhas indicadoras e três transições. Aceita fotos horizontais e verticais juntas. |
| Captação de leads | Botão flutuante de WhatsApp com pop-up de nome e recado, mensagem formatada com código de atendimento. |
| Agendamento TidyCal | Embed do TidyCal com expansão e recolhimento do modal dentro de iframe. |
| Checkout | Carrinho com PayPal e/ou Pix, múltiplos produtos com opcionais, cupons e desconto exclusivo para Pix. O Pix sai como BR Code estático no padrão do Banco Central, gerado no navegador. |
| Bordas com efeito | CSS puro para destacar um componente: brilho giratório, degradê contínuo, halo pulsante, listras ou borda fixa. |
| Contagem regressiva | Barra de urgência para o topo da página, com contador que não reinicia quando o visitante recarrega, efeitos de movimento e destaque, e opção de barra fixa. |

## Como usar

Abra o site, preencha os campos da aba desejada, clique em **Gerar código** e cole o resultado onde a própria aba indica — Tag Body da página, componente HTML ou campo CSS Customizado, conforme o caso.

Os valores digitados ficam salvos no navegador. Como o `localStorage` é por origem, o que você salvar em um navegador não aparece em outro nem em outro dispositivo.

## Dados sensíveis

Este repositório é público e **não versiona dados operacionais**. Os campos de WhatsApp, chave Pix e Client ID do PayPal nascem vazios, com um exemplo no `placeholder`, e o que você digitar fica apenas no seu navegador.

Vale lembrar que Client ID do PayPal e chave Pix são públicos por definição — aparecem no código da página de checkout publicada. Mantê-los fora do repositório é para não deixá-los indexáveis aqui, não porque sejam segredos.

## Estrutura

```
index.html                  a ferramenta (é o que o GitHub Pages serve)
CNAME .nojekyll             configuração do Pages
docs/                       documentação do projeto e specs de design
prosite/natal-2026/         espelho dos códigos colados no painel da Alboom
```

## Desenvolvimento

Não há build, dependências nem servidor: abra o `index.html` no navegador e edite o arquivo direto. Publicar é `git push` — o GitHub Pages atualiza o site sozinho.

As regras técnicas do Prosite que todo código gerado precisa respeitar (o sanitizador da plataforma tem várias manhas) estão em [`CLAUDE.md`](CLAUDE.md) e detalhadas em [`docs/documentacao-fotocerta.md`](docs/documentacao-fotocerta.md).
