# AstroMining OS — Interface da Missão

Interface visual (HTML + CSS) do sistema integrado de mineração de asteroides.
Esta é a **face do sistema**: o painel de controle que o operador da missão usa, na
Terra, para ler a telemetria da sonda e decidir o próximo passo da operação.

> **Escopo desta entrega (FED):** apenas **estrutura (HTML)** e **estilo (CSS)**.
> Não há JavaScript — a interatividade será adicionada na disciplina de Web Development
> (WD), neste mesmo repositório.

---

## 1. Usuário real e tarefa crítica

**Usuário:** o **operador da missão**, posicionado no centro de controle terrestre,
acompanhando em tempo real o que a sonda SOND-01 está extraindo no asteroide.

**Tarefa crítica:** com base nos dados recebidos da mineração (combustível, carga,
pressão da broca, energia, latência de comunicação e qualidade dos minérios), o operador
precisa decidir **em segundos** qual a próxima ação da missão:

- **Continuar** a perfuração,
- **Pausar/monitorar** até um indicador se estabilizar, ou
- **Retornar** a sonda.

Toda decisão de layout responde a essa pergunta: *"o operador consegue ler o estado da
sonda e agir corretamente em poucos segundos?"* Por isso os indicadores de risco têm
destaque de cor, os alertas ficam agrupados em um painel de "Decisão Rápida" e cada
métrica mostra um estado claro (OK / Atenção).

---

## 2. Direção visual

A identidade busca um **meio-termo entre o universo espacial/futurista e a clareza de
uso**. A versão inicial era mais "espacial", visualmente impactante, porém **poluída e
pouco intuitiva** — o que é inaceitável para uma interface de missão, onde *ilegível é
igual a invisível*. A direção foi então refeita em uma linha mais **clean**, priorizando a
leitura rápida sem perder o clima de cockpit.

Resumo das decisões (detalhamento completo e análise crítica em
[`assets/moodboard.md`](assets/moodboard.md)):

- **Paleta escura** (quase preto) — remete ao espaço e reduz a fadiga visual em
  monitoramento prolongado, dando contraste máximo aos dados.
- **Ciano** como cor de informação/estrutura e **dourado** como cor de
  atenção/prioridade — um par que comunica estado sem precisar de texto.
- **Tipografia Rajdhani** — condensada e técnica, reforça o tom futurista mantendo ótima
  legibilidade em números e rótulos.
- **Elementos de HUD** (scanlines, grid de fundo, mapa orbital) usados com moderação,
  como ambientação — nunca competindo com o dado.

---

## 3. Visão geral das telas

| Tela | Arquivo | Função para o operador |
|------|---------|------------------------|
| **Dashboard** | `index.html` | Visão tática geral: KPIs da sonda, mapa de extração, painel de decisão rápida com alertas, tabela de minérios e subsistemas. |
| **Asteroides** | `asteroides.html` | Comparação e ranking de alvos (Psyche 16, Bennu, Ryugu, Apophis) por prioridade, risco e distância, com detalhe do alvo selecionado. |
| **Minérios** | `minerios.html` | Inventário da carga extraída: massa, pureza, aplicação e valor de cada minério. |
| **Sistemas** | `sistemas.html` | Saúde dos subsistemas (energia, broca, braço, comunicação) e log operacional de eventos recentes. |

A navegação entre as telas é fixa, via barra lateral (`nav`) presente em todas as páginas.

---

## 4. Decisões de responsividade

Layout fluido com **três breakpoints** definidos no CSS:

- **≤ 1180px (tablet/desktop pequeno):** grids de 4 colunas passam a 2; o painel do
  dashboard empilha em coluna única.
- **≤ 820px (tablet/mobile grande):** a barra lateral deixa de ser fixa e vira uma
  navegação horizontal no topo; painéis e dados reorganizam em colunas menores.
- **≤ 540px (mobile):** tudo colapsa em coluna única; fontes de destaque reduzem e o mapa
  orbital diminui para caber na viewport.

As tabelas de dados ficam dentro de um contêiner com rolagem horizontal
(`overflow-x: auto`), evitando quebra de leitura em telas estreitas.

---

## 5. Decisões de acessibilidade

- **HTML semântico** com landmarks (`header`, `main`, `nav`, `aside`, `section`,
  `article`, `footer`) para navegação assistiva.
- **Contraste WCAG AA**: texto claro sobre fundo escuro; conferido inclusive nos textos
  secundários.
- **Foco visível** em todos os elementos navegáveis (contorno destacado), permitindo uso
  por teclado.
- **ARIA** onde necessário: `aria-current` na página ativa, `role="progressbar"` com
  `aria-valuenow` nos medidores, `role="img"` com descrição no mapa tático,
  `role="status"` no indicador "Sistema Online" e `aria-hidden` em elementos puramente
  decorativos.
- **Tabelas** com `<caption>` e `scope="col"` nos cabeçalhos.
- **Imagens:** todo `<img>` adicionado ao projeto (ex.: moodboard) deve incluir atributo
  `alt` descritivo.

---

## 6. Como abrir o projeto

Por ser um site estático (apenas HTML e CSS), **não requer instalação**:

1. Clone ou baixe este repositório.
2. Abra o arquivo `index.html` em qualquer navegador moderno (duplo clique já funciona).
3. Use a barra lateral para navegar entre Dashboard, Asteroides, Minérios e Sistemas.

> Opcional: para desenvolvimento, recomenda-se a extensão **Live Server** (VS Code),
> que recarrega a página automaticamente a cada alteração.

---

## 7. Estrutura do repositório

```
/
├── README.md
├── integrantes.txt
├── index.html          # Dashboard
├── asteroides.html
├── minerios.html
├── sistemas.html
├── css/
│   └── style.css       # tokens + componentes reutilizáveis
└── assets/             # moodboard, direção de design e screenshots
    ├── moodboard.md
    ├── direcao-de-design.html
    ├── AstroMining-Direcao-de-Design.pdf
    └── screenshots/
```

---

## 8. Integrantes

Ver arquivo [`integrantes.txt`](integrantes.txt).

- Matheus Henrique — RM 571197
- Isaac Israel — RM 570072
- Heitor Anacleto — RM 573599
