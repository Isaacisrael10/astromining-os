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

  // ---------- Lê os minérios da tabela ----------
  function lerMinerios() {
    var arr = [];
    corpo.querySelectorAll("tr").forEach(function (tr) {
      arr.push({
        nome: tr.cells[0].textContent.trim(),
        massa: numero(tr.cells[1].textContent),
        pureza: numero(tr.cells[2].textContent),
        aplicacao: tr.cells[3] ? tr.cells[3].textContent.trim() : "—",
        valor: tr.cells[COL_VALOR].textContent.trim()
      });
    });
    return arr;
  }

  // ---------- Drawer: "Ver carga" (massa por minério) ----------
  function abrirCarga() {
    if (typeof Chart === "undefined") return;
    var dados = lerMinerios();
    AstroDrawer.open({
      titulo: "Carga coletada",
      conteudo: function (c) {
        var cv = AstroCharts.canvas(c);
        var ch = new Chart(cv, {
          type: "bar",
          data: { labels: dados.map(function (d) { return d.nome; }),
            datasets: [{ label: "Massa (kg)", borderWidth: 0, backgroundColor: CORES.cyan,
              data: dados.map(function (d) { return d.massa; }) }] },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false }, title: { display: true, text: "Massa coletada por minério (kg)" } } }
        });
        var total = dados.reduce(function (s, d) { return s + d.massa; }, 0);
        var ul = document.createElement("ul"); ul.className = "kv-list";
        ul.innerHTML =
          "<li><span>Total coletado</span><strong>" + total.toLocaleString("pt-BR") + " kg</strong></li>" +
          "<li><span>Capacidade</span><strong>5.000 kg</strong></li>" +
          "<li><span>Ocupação</span><strong>" + Math.round(total / 5000 * 100) + "%</strong></li>";
        c.appendChild(ul);
        return function () { ch.destroy(); };
      }
    });
  }

  // ---------- Drawer: "Ver platina" (mineral mais valioso) ----------
  function abrirPlatina() {
    if (typeof Chart === "undefined") return;
    var pt = null;
    lerMinerios().forEach(function (d) { if (d.nome.toLowerCase().indexOf("platina") === 0) pt = d; });
    if (!pt) return;
    AstroDrawer.open({
      titulo: "Minério: " + pt.nome,
      conteudo: function (c) {
        var cv = AstroCharts.canvas(c);
        var ch = new Chart(cv, {
          type: "doughnut",
          data: { labels: ["Pureza", "Impureza"],
            datasets: [{ data: [pt.pureza, 100 - pt.pureza], borderWidth: 0,
              backgroundColor: [CORES.gold, "rgba(215,251,255,0.08)"] }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: "68%",
            plugins: { legend: { position: "bottom" } } }
        });
        var ul = document.createElement("ul"); ul.className = "kv-list";
        ul.innerHTML =
          "<li><span>Massa</span><strong>" + pt.massa.toLocaleString("pt-BR") + " kg</strong></li>" +
          "<li><span>Pureza</span><strong>" + pt.pureza + "%</strong></li>" +
          "<li><span>Valor</span><strong>" + pt.valor + "</strong></li>" +
          "<li><span>Aplicação</span><strong>" + pt.aplicacao + "</strong></li>";
        c.appendChild(ul);
        return function () { ch.destroy(); };
      }
    });
  }

  // ---------- Drawer: "Ver pureza" (pureza por minério) ----------
  function abrirPureza() {
    if (typeof Chart === "undefined") return;
    var dados = lerMinerios();
    AstroDrawer.open({
      titulo: "Pureza dos minérios",
      conteudo: function (c) {
        var cv = AstroCharts.canvas(c);
        var ch = new Chart(cv, {
          type: "bar",
          data: { labels: dados.map(function (d) { return d.nome; }),
            datasets: [{ label: "Pureza (%)", borderWidth: 0,
              data: dados.map(function (d) { return d.pureza; }),
              backgroundColor: dados.map(function (d) { return d.pureza >= 80 ? CORES.gold : d.pureza >= 70 ? CORES.cyan : "#9fb4bd"; }) }] },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } },
            plugins: { legend: { display: false }, title: { display: true, text: "Pureza por minério (%)" } } }
        });
        var media = Math.round(dados.reduce(function (s, d) { return s + d.pureza; }, 0) / dados.length);
        var ul = document.createElement("ul"); ul.className = "kv-list";
        ul.innerHTML =
          "<li><span>Pureza média</span><strong>" + media + "%</strong></li>" +
          "<li><span>Meta de triagem</span><strong>acima de 80%</strong></li>";
        c.appendChild(ul);
        return function () { ch.destroy(); };
      }
    });
  }

  // ---------- Botões dos cards de resumo (Ver carga / Ver platina / Ver pureza) ----------
  var mainPanel = document.querySelector(".main-panel");
  if (mainPanel) {
    mainPanel.addEventListener("click", function (e) {
      var b = e.target.closest("[data-action]");
      if (!b) return;
      var acao = b.getAttribute("data-action");
      if (acao === "view-total-cargo") abrirCarga();
      else if (acao === "view-platinum") abrirPlatina();
      else if (acao === "view-purity") abrirPureza();
    });
  }

  // ---------- Inicialização ----------
  montarGrafico();
})();
