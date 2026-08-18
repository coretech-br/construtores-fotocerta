# Bordas animadas e degradês — CSS aplicado em componentes

Espelho do que está publicado na landing de Natal 2026 (`/natal-2026`). Origem: solução desenvolvida antes da aba "Bordas com efeito" existir; a aba do construtor hoje gera este mesmo padrão, parametrizado.

**Regra de ouro:** at-rules (`@keyframes`) só funcionam em `<style>` — vão no head do site. O campo **CSS Customizado do componente** aceita apenas propriedades soltas, que o Prosite aplica direto no elemento raiz daquele componente (sem precisar de ID Html, classe ou seletor). A única amarração entre os dois códigos é o **nome da animação**.

---

## 1. Bloco global — Configurações → Códigos personalizados → head

Cola-se **uma única vez**; serve a todos os componentes que usarem a animação.

```html
<style>
@keyframes brilho-borda {
  0%   { background-position: 0 0, 0% 0%; }
  100% { background-position: 0 0, 100% 100%; }
}
@media (prefers-reduced-motion: reduce) {
  [style], * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
}
</style>
```

> A aba "Bordas com efeito" do construtor gera um bloco equivalente, com nomes de animação próprios (`fc-borda-brilho`, `fc-borda-gradiente`, `fc-borda-pulso`, `fc-borda-listras`). Ambos podem conviver no mesmo head.

---

## 2. Variante A — bloco "Presenteie uma família" (fundo em degradê + borda animada)

Campo CSS Customizado do componente:

```css
border: 4px solid transparent;
border-radius: 14px;
color: #F7EFDF;
padding: 40px 32px;
background:
  linear-gradient(150deg, #8A4A32, #B5674A) padding-box,
  linear-gradient(120deg,
    #9C5638 0%,   #9C5638 20%,
    #FFC94A 25%,  #FFF6D8 27.5%, #FFC94A 30%,
    #9C5638 33.3%, #9C5638 53.3%,
    #FFC94A 58.3%, #FFF6D8 60.8%, #FFC94A 63.3%,
    #9C5638 66.6%, #9C5638 86.6%,
    #FFC94A 91.6%, #FFF6D8 94.1%, #FFC94A 96.6%,
    #9C5638 100%) border-box;
background-size: 100% 100%, 300% 300%;
background-position: 0 0, 0% 0%;
box-shadow: 0 0 26px rgba(255, 201, 74, 0.35);
animation: brilho-borda 4s linear infinite;
```

## 3. Variante B — card "Pack Standard" (fundo liso + borda animada)

Substitui o selo "O mais escolhido", que o Prosite não permite criar como badge flutuante. A primeira camada repete a cor lisa que o card já tem (bege #EDE6D2).

```css
border: 4px solid transparent;
border-radius: 14px;
background:
  linear-gradient(#EDE6D2, #EDE6D2) padding-box,
  linear-gradient(120deg,
    #A63D2F 0%,   #A63D2F 20%,
    #FFC94A 25%,  #FFF6D8 27.5%, #FFC94A 30%,
    #A63D2F 33.3%, #A63D2F 53.3%,
    #FFC94A 58.3%, #FFF6D8 60.8%, #FFC94A 63.3%,
    #A63D2F 66.6%, #A63D2F 86.6%,
    #FFC94A 91.6%, #FFF6D8 94.1%, #FFC94A 96.6%,
    #A63D2F 100%) border-box;
background-size: 100% 100%, 300% 300%;
background-position: 0 0, 0% 0%;
box-shadow: 0 0 22px rgba(255, 201, 74, 0.3);
animation: brilho-borda 4s linear infinite;
```

## 4. Variante C — só o degradê de fundo, sem borda animada

Para componentes que não oferecem fundo em degradê nativamente. Não depende de nada no head. A primeira linha é fallback sólido para navegadores antigos.

```css
background: #9C5638;
background: linear-gradient(150deg, #8A4A32, #B5674A);
color: #F7EFDF;
border-radius: 14px;
padding: 40px 32px;
```

---

## Como funciona (resumo técnico)

`border: 4px solid transparent` abre um anel transparente. O `background` recebe **duas camadas**: a primeira com `padding-box` (pinta só o miolo) e a segunda com `border-box` (pinta até a borda) — como o miolo fica coberto, a segunda só aparece no anel. Essa segunda camada é um degradê com padrão que se repete a cada 33,3% e `background-size: 300% 300%`; a animação desloca sua `background-position` de `0% 0%` a `100% 100%`, e como o percurso é múltiplo inteiro do período, o loop fecha sem salto.

## Lições registradas

- **Brilho = contraste alto + facho estreito** (~5% do ciclo, núcleo quase branco). A primeira tentativa usava dourado suave sobre terracota claro e o efeito sumia.
- **Validar cor na página real**, não no mockup: o primeiro degradê (#7A2F24 → #A63D2F) leu-se "avermelhado demais" no contexto da página e foi trocado por #8A4A32 → #B5674A.
- Se a borda aparecer **parada**: o `@keyframes` não está no head, ou o nome da animação diverge entre os dois códigos.
- Testar sempre em **aba anônima** (evita cache) e conferir no celular.
