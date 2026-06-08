/* ============================================================
 * charts.js — Configuração e ajudantes do Chart.js (Web Development)
 * AstroMining OS
 *
 * Aplica o tema escuro do projeto ao Chart.js e expõe atalhos
 * em window.AstroCharts para os scripts de cada página.
 * ============================================================ */
(function () {
  "use strict";
  if (typeof Chart === "undefined") {
    console.warn("Chart.js não carregou — gráficos indisponíveis.");
    return;
  }

  // Tema padrão (combina com style.css)
  Chart.defaults.color = "rgba(215, 251, 255, 0.70)";
  Chart.defaults.font.family = "'Rajdhani', sans-serif";
  Chart.defaults.font.size = 13;
  Chart.defaults.borderColor = "rgba(0, 242, 254, 0.12)";

  var CORES = {
    cyan: "#00f2fe",
    gold: "#f5a400",
    green: "#22c55e",
    red: "#ef4444",
    muted: "rgba(215, 251, 255, 0.45)"
  };

  // Cria um <canvas> dentro de um contêiner .chart-wrap e devolve o canvas
  function canvas(destino, classe) {
    var wrap = document.createElement("div");
    wrap.className = classe || "chart-wrap";
    var c = document.createElement("canvas");
    wrap.appendChild(c);
    destino.appendChild(wrap);
    return c;
  }

  window.AstroCharts = { CORES: CORES, canvas: canvas };
})();
