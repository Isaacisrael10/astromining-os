/* ============================================================
 * minerios.js — Inventário interativo (minerios.html)
 * AstroMining OS — Web Development (WD)
 *
 * DOM + Eventos : ordenar, filtrar e ver detalhe (drawer).
 * Gráfico       : barras de massa que REAGEM ao filtro e à ordenação.
 * ============================================================ */
(function () {
  "use strict";

  var tabela = document.querySelector(".minerals-table");
  if (!tabela) return;
  var corpo = tabela.querySelector("tbody");
  var CORES = (window.AstroCharts && AstroCharts.CORES) || {};

  // Colunas: Minério(0) | Massa(1) | Pureza(2) | Aplicação(3) | Valor(4) | Ação(5)
  var COL_VALOR = 4;
  var PESO = { "Alto": 3, "Médio": 2, "Baixo": 1 };
  var ordemCrescente = true;

  function numero(txt) { return parseFloat(txt.replace(/[^\d.,]/g, "").replace(",", ".")) || 0; }

  // ---------- Gráfico de barras reativo ----------
  var chart = null;
  function montarGrafico() {
    if (typeof Chart === "undefined") return;
    var painel = tabela.closest(".panel");
    var wrapper = tabela.closest(".table-wrapper");
    var box = document.createElement("div");
    box.className = "panel-chart";
    var cv = document.createElement("canvas");
    box.appendChild(cv);
    painel.insertBefore(box, wrapper); // gráfico acima da tabela
    chart = new Chart(cv, {
      type: "bar",
      data: { labels: [], datasets: [{ label: "Massa (kg)", data: [], backgroundColor: CORES.cyan, borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false }, title: { display: true, text: "Massa por minério (kg)" } }
      }
    });
    atualizarGrafico();
  }
  // Lê as linhas VISÍVEIS, na ordem atual do DOM, e redesenha o gráfico
  function atualizarGrafico() {
    if (!chart) return;
    var labels = [], dados = [];
    var linhas = corpo.querySelectorAll("tr");
    for (var i = 0; i < linhas.length; i++) {
      if (linhas[i].style.display === "none") continue;
      labels.push(linhas[i].cells[0].textContent.trim());
      dados.push(numero(linhas[i].cells[1].textContent));
    }
    chart.data.labels = labels;
    chart.data.datasets[0].data = dados;
    chart.update();
  }

  // ---------- Ordenar por valor ----------
  var botaoOrdenar = document.querySelector('[data-action="sort-value"]');
  if (botaoOrdenar) {
    botaoOrdenar.addEventListener("click", function () {
      var linhas = Array.prototype.slice.call(corpo.querySelectorAll("tr"));
      linhas.sort(function (a, b) {
        var pa = PESO[a.cells[COL_VALOR].textContent.trim()] || 0;
        var pb = PESO[b.cells[COL_VALOR].textContent.trim()] || 0;
        return ordemCrescente ? pa - pb : pb - pa;
      });
      linhas.forEach(function (tr) { corpo.appendChild(tr); });
      AstroUI.showToast("📊 Ordenado por valor (" + (ordemCrescente ? "crescente" : "decrescente") + ").", "info");
      ordemCrescente = !ordemCrescente;
      atualizarGrafico();
    });
  }

  // ---------- Filtro (campo criado via JS) ----------
  var wrapper = tabela.closest(".table-wrapper");
  if (wrapper) {
    var filtro = document.createElement("div");
    filtro.className = "js-filter";
    filtro.innerHTML = '<input type="text" placeholder="🔎 Filtrar minério por nome..." aria-label="Filtrar minério por nome">';
    wrapper.parentNode.insertBefore(filtro, wrapper);
    filtro.querySelector("input").addEventListener("input", function (e) {
      var termo = e.target.value.toLowerCase().trim();
      var linhas = corpo.querySelectorAll("tr");
      for (var i = 0; i < linhas.length; i++) {
        var nome = linhas[i].cells[0].textContent.toLowerCase();
        linhas[i].style.display = nome.indexOf(termo) >= 0 ? "" : "none";
      }
      atualizarGrafico();
    });
  }

  // ---------- Detalhes (drawer com rosca de pureza) ----------
  corpo.addEventListener("click", function (e) {
    var botao = e.target.closest("[data-action]");
    if (!botao || typeof Chart === "undefined") return;
    var linha = botao.closest("tr");
    var linhas = corpo.querySelectorAll("tr");
    for (var i = 0; i < linhas.length; i++) linhas[i].classList.remove("row-highlight");
    linha.classList.add("row-highlight");

    var nome = linha.cells[0].textContent.trim();
    var massa = linha.cells[1].textContent.trim();
    var pureza = numero(linha.cells[2].textContent);
    var aplicacao = linha.cells[3] ? linha.cells[3].textContent.trim() : "—";
    var valor = linha.cells[COL_VALOR].textContent.trim();

    AstroDrawer.open({
      titulo: "Minério: " + nome,
      conteudo: function (cont) {
        var cv = AstroCharts.canvas(cont);
        var ch = new Chart(cv, {
          type: "doughnut",
          data: {
            labels: ["Pureza", "Impureza"],
            datasets: [{ data: [pureza, 100 - pureza], borderWidth: 0,
              backgroundColor: [CORES.gold, "rgba(215,251,255,0.08)"] }]
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: "68%",
            plugins: { legend: { position: "bottom" } } }
        });
        var ul = document.createElement("ul");
        ul.className = "kv-list";
        ul.innerHTML =
          "<li><span>Massa</span><strong>" + massa + "</strong></li>" +
          "<li><span>Pureza</span><strong>" + pureza + "%</strong></li>" +
          "<li><span>Valor</span><strong>" + valor + "</strong></li>" +
          "<li><span>Aplicação</span><strong>" + aplicacao + "</strong></li>";
        cont.appendChild(ul);
        return function () { ch.destroy(); };
      }
    });
  });

  // ---------- Inicialização ----------
  montarGrafico();
})();
