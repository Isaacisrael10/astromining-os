/* ============================================================
 * asteroides.js — Seleção e comparação de alvos (asteroides.html)
 * AstroMining OS — Web Development (WD)
 *
 * DOM + Eventos : clicar num card destaca e atualiza o painel de detalhe.
 * Gráfico       : botão abre drawer com gráfico de barras da composição.
 * ============================================================ */
(function () {
  "use strict";

  var grid = document.querySelector(".target-grid");
  if (!grid) return;

  var CORES = (window.AstroCharts && AstroCharts.CORES) || {};

  var DADOS = {
    "Psyche 16": { platina: 30, ferro: 42, niquel: 18, viabilidade: "Alta",     status: "Mineral Rico", classe: "attention", distancia: 1500, risco: 50, riscoLabel: "Médio" },
    "Bennu":     { platina: 8,  ferro: 22, niquel: 9,  viabilidade: "Média",    status: "Científico",   classe: "neutral",   distancia: 2100, risco: 25, riscoLabel: "Baixo" },
    "Ryugu":     { platina: 5,  ferro: 15, niquel: 6,  viabilidade: "Baixa",    status: "Limitado",     classe: "neutral",   distancia: 2850, risco: 25, riscoLabel: "Baixo" },
    "Apophis":   { platina: 12, ferro: 28, niquel: 14, viabilidade: "Inviável", status: "Alto Risco",   classe: "danger",    distancia: 3200, risco: 85, riscoLabel: "Alto" }
  };

  var painel = document.querySelector(".target-detail-panel");
  var titulo = document.getElementById("alvo-selecionado");
  var badge = painel ? painel.querySelector(".state-badge") : null;
  var specs = painel ? painel.querySelectorAll(".spec-list li strong") : [];
  var selecionado = "Psyche 16";

  function selecionar(card) {
    var nome = card.querySelector("strong").textContent.trim();
    var d = DADOS[nome];
    if (!d) return;
    selecionado = nome;

    var cards = grid.querySelectorAll(".target-card");
    for (var i = 0; i < cards.length; i++) cards[i].classList.remove("selected");
    card.classList.add("selected");

    if (titulo) titulo.textContent = nome;
    if (badge) { badge.className = "state-badge " + d.classe; badge.textContent = d.status; }
    if (specs.length >= 4) {
      specs[0].textContent = d.platina + "%";
      specs[1].textContent = d.ferro + "%";
      specs[2].textContent = d.niquel + "%";
      specs[3].textContent = d.viabilidade;
    }
  }

  // Abre o drawer com o gráfico de composição do alvo selecionado
  function abrirGrafico() {
    if (typeof Chart === "undefined") { AstroUI.showToast("Gráficos indisponíveis.", "warning"); return; }
    var d = DADOS[selecionado];
    AstroDrawer.open({
      titulo: "Composição: " + selecionado,
      conteudo: function (corpo) {
        var cv = AstroCharts.canvas(corpo);
        var chart = new Chart(cv, {
          type: "bar",
          data: {
            labels: ["Platina", "Ferro", "Níquel"],
            datasets: [{
              label: "% estimado",
              data: [d.platina, d.ferro, d.niquel],
              backgroundColor: [CORES.gold, CORES.cyan, "#9fb4bd"],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 50 } },
            plugins: { legend: { display: false } }
          }
        });
        var p = document.createElement("p");
        p.textContent = "Viabilidade da missão: " + d.viabilidade + ".";
        corpo.appendChild(p);
        return function () { chart.destroy(); };
      }
    });
  }

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".target-card");
    if (card) selecionar(card);
  });

  // Botão "Ver composição" injetado no painel de detalhe
  if (painel) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card-action";
    btn.style.marginTop = "16px";
    btn.textContent = "Ver composição (gráfico)";
    btn.addEventListener("click", abrirGrafico);
    painel.appendChild(btn);
  }

  // ---------- Drawer: análise de rota (distância dos alvos) ----------
  function abrirRota() {
    if (typeof Chart === "undefined") { AstroUI.showToast("Gráficos indisponíveis.", "warning"); return; }
    var nomes = Object.keys(DADOS);
    AstroDrawer.open({
      titulo: "Análise de rota",
      conteudo: function (corpo) {
        var cv = AstroCharts.canvas(corpo);
        var ch = new Chart(cv, {
          type: "bar",
          data: {
            labels: nomes,
            datasets: [{ label: "Distância (km)", borderWidth: 0,
              data: nomes.map(function (n) { return DADOS[n].distancia; }),
              backgroundColor: nomes.map(function (n) { return n === "Psyche 16" ? CORES.gold : CORES.cyan; }) }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false }, title: { display: true, text: "Distância dos alvos (km)" } }
          }
        });
        var ul = document.createElement("ul");
        ul.className = "kv-list";
        ul.innerHTML =
          "<li><span>Alvo principal</span><strong>Psyche 16</strong></li>" +
          "<li><span>Distância</span><strong>1.500 km</strong></li>" +
          "<li><span>Janela de comunicação</span><strong>Operável</strong></li>" +
          "<li><span>Status da rota</span><strong>Dentro da teleoperação</strong></li>";
        corpo.appendChild(ul);
        return function () { ch.destroy(); };
      }
    });
  }

  // ---------- Drawer: risco orbital (índice por alvo) ----------
  function abrirRisco() {
    if (typeof Chart === "undefined") { AstroUI.showToast("Gráficos indisponíveis.", "warning"); return; }
    var nomes = Object.keys(DADOS);
    function cor(v) { return v >= 70 ? CORES.red : v >= 45 ? CORES.gold : CORES.green; }
    AstroDrawer.open({
      titulo: "Risco orbital",
      conteudo: function (corpo) {
        var cv = AstroCharts.canvas(corpo);
        var ch = new Chart(cv, {
          type: "bar",
          data: {
            labels: nomes,
            datasets: [{ label: "Risco", borderWidth: 0,
              data: nomes.map(function (n) { return DADOS[n].risco; }),
              backgroundColor: nomes.map(function (n) { return cor(DADOS[n].risco); }) }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: { legend: { display: false }, title: { display: true, text: "Índice de risco por alvo" } }
          }
        });
        var ul = document.createElement("ul");
        ul.className = "kv-list";
        ul.innerHTML = nomes.map(function (n) {
          return "<li><span>" + n + "</span><strong>" + DADOS[n].riscoLabel + "</strong></li>";
        }).join("");
        corpo.appendChild(ul);
        return function () { ch.destroy(); };
      }
    });
  }

  // ---------- Botões dos cards de resumo (Ver alvo / Analisar rota / Ver risco) ----------
  var mainPanel = document.querySelector(".main-panel");
  if (mainPanel) {
    mainPanel.addEventListener("click", function (e) {
      var b = e.target.closest("[data-action]");
      if (!b) return;
      var acao = b.getAttribute("data-action");
      if (acao === "target-psyche") {
        var psyche = null;
        grid.querySelectorAll(".target-card").forEach(function (c) {
          if (c.querySelector("strong").textContent.trim() === "Psyche 16") psyche = c;
        });
        if (psyche) selecionar(psyche);
        abrirGrafico();
      } else if (acao === "distance-analysis") {
        abrirRota();
      } else if (acao === "risk-analysis") {
        abrirRisco();
      }
    });
  }
})();
