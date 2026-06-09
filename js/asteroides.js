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
    "Psyche 16": { platina: 30, ferro: 42, niquel: 18, viabilidade: "Alta",     status: "Mineral Rico", classe: "attention" },
    "Bennu":     { platina: 8,  ferro: 22, niquel: 9,  viabilidade: "Média",    status: "Científico",   classe: "neutral" },
    "Ryugu":     { platina: 5,  ferro: 15, niquel: 6,  viabilidade: "Baixa",    status: "Limitado",     classe: "neutral" },
    "Apophis":   { platina: 12, ferro: 28, niquel: 14, viabilidade: "Inviável", status: "Alto Risco",   classe: "danger" }
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
})();
