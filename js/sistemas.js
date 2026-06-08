/* ============================================================
 * sistemas.js — Telemetria dos instrumentos da sonda Psyche (sistemas.html)
 * AstroMining OS — Web Development (WD)
 *
 * BOM/Timers   : telemetria oscila com setInterval e alimenta o histórico.
 * DOM + Eventos: simular falha / normalizar / log + drawer com gráfico.
 * ============================================================ */
(function () {
  "use strict";

  var grid = document.querySelector(".system-health-grid");
  if (!grid) return;

  var CORES = (window.AstroCharts && AstroCharts.CORES) || {};
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".system-card"));
  var log = document.querySelector(".log-list");

  // localiza um cartão pelo início do título
  function card(titulo) {
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].querySelector("h2").textContent.trim().indexOf(titulo) === 0) return cards[i];
    }
    return null;
  }
  var cPropulsao = card("Propulsão");
  var cEspectro = card("Espectrômetro");
  var cImageador = card("Imageador");
  var cTelecom = card("Telecom");

  function numero(txt) { return parseFloat(txt.replace(/[^\d.,]/g, "").replace(",", ".")) || 0; }

  // ---------- Histórico (chave = título completo do cartão) ----------
  var hist = { "Propulsão Solar": [], "Espectrômetro GRNS": [], "Imageador Multiespectral": [], "Telecom Banda X": [] };
  function semear(chave, base, variacao) {
    for (var i = 0; i < 16; i++) hist[chave].push(+(base + (Math.random() * variacao - variacao / 2)).toFixed(1));
  }
  semear("Propulsão Solar", 92, 6);
  semear("Espectrômetro GRNS", 72, 8);
  semear("Imageador Multiespectral", 98, 3);
  semear("Telecom Banda X", 2.4, 1.2);

  function empurrar(chave, valor) {
    if (!hist[chave]) hist[chave] = [];
    hist[chave].push(+(+valor).toFixed(1));
    if (hist[chave].length > 24) hist[chave].shift();
  }

  function horaAtual() {
    var d = new Date();
    return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  }
  function registrar(titulo, detalhe) {
    if (!log) return;
    var li = document.createElement("li");
    li.innerHTML = "<span>" + horaAtual() + "</span><strong>" + titulo + "</strong><p>" + detalhe + "</p>";
    log.insertBefore(li, log.firstChild);
  }
  function setCard(c, valor, nivelVis) {
    if (!c) return;
    c.querySelector("strong").textContent = valor;
    c.classList.remove("ok", "attention", "danger");
    c.classList.add(nivelVis);
  }
  function atualizarDiagnostico(texto, perigo) {
    var callout = document.querySelector(".decision-callout");
    if (!callout) return;
    callout.querySelector("strong").textContent = perigo ? "Operação suspensa" : "Operação permitida";
    callout.querySelector("p").textContent = texto;
    callout.classList.toggle("state-danger", perigo);
    callout.classList.toggle("blink", perigo);
  }

  // ---------- Telemetria flutuante: propulsão solar (setInterval) ----------
  setInterval(function () {
    var p = Math.round(88 + Math.random() * 8); // 88-96%
    setCard(cPropulsao, p + "%", p < 90 ? "attention" : "ok");
    empurrar("Propulsão Solar", p);
  }, 4000);

  // ---------- Botões de controle (criados via JS) ----------
  var header = document.querySelector(".page-header");
  if (header) {
    var box = document.createElement("div");
    box.className = "js-controls";
    box.innerHTML =
      '<button type="button" id="btn-falha" class="danger">Simular falha de instrumento</button>' +
      '<button type="button" id="btn-normalizar">Normalizar sistemas</button>';
    header.parentNode.insertBefore(box, header.nextSibling);

    document.getElementById("btn-falha").addEventListener("click", function () {
      var alvos = [
        { c: cEspectro, nome: "Espectrômetro GRNS", valor: 38, txt: "38%" },
        { c: cTelecom, nome: "Telecom Banda X", valor: 4.1, txt: "4.1s" },
        { c: cImageador, nome: "Imageador Multiespectral", valor: 61, txt: "61%" }
      ];
      var a = alvos[Math.floor(Math.random() * alvos.length)];
      setCard(a.c, a.txt, "danger");
      a.c.classList.add("blink");
      empurrar(a.nome, a.valor);
      registrar("⚠️ Falha detectada", a.nome + " fora da faixa segura (" + a.txt + ").");
      AstroUI.showToast("⚠️ Falha simulada: " + a.nome, "danger");
      atualizarDiagnostico("Atenção: " + a.nome + " exige intervenção antes de novo ciclo.", true);
    });

    document.getElementById("btn-normalizar").addEventListener("click", function () {
      setCard(cPropulsao, "92%", "ok");
      setCard(cEspectro, "72%", "attention");
      setCard(cImageador, "98%", "ok");
      setCard(cTelecom, "2.4s", "attention");
      cards.forEach(function (c) { c.classList.remove("blink"); });
      registrar("✅ Sistemas normalizados", "Todos os instrumentos retornaram à faixa operacional.");
      AstroUI.showToast("✅ Sistemas normalizados.", "success");
      atualizarDiagnostico("Operação permitida. Manter monitoramento da telecomunicação.", false);
    });
  }

  // ---------- "Detalhes": drawer com gráfico (sparkline) do histórico ----------
  grid.addEventListener("click", function (e) {
    var botao = e.target.closest("[data-action]");
    if (!botao || typeof Chart === "undefined") return;
    var c = botao.closest(".system-card");
    var nome = c.querySelector("h2").textContent.trim();
    var valorAtual = c.querySelector("strong").textContent.trim();
    empurrar(nome, numero(valorAtual));

    AstroDrawer.open({
      titulo: "Instrumento: " + nome,
      conteudo: function (cont) {
        var p = document.createElement("p");
        p.textContent = "Leitura atual: " + valorAtual + ". Histórico recente do sensor abaixo.";
        cont.appendChild(p);
        var cv = AstroCharts.canvas(cont);
        var ch = new Chart(cv, {
          type: "line",
          data: {
            labels: hist[nome].map(function (_, i) { return i + 1; }),
            datasets: [{ label: nome, data: hist[nome].slice(), borderColor: CORES.cyan,
              backgroundColor: "rgba(0,242,254,0.18)", fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }]
          },
          options: { responsive: true, maintainAspectRatio: false, animation: false,
            plugins: { legend: { display: false } } }
        });
        var iv = setInterval(function () {
          ch.data.labels = hist[nome].map(function (_, i) { return i + 1; });
          ch.data.datasets[0].data = hist[nome].slice();
          ch.update("none");
        }, 1000);
        return function () { clearInterval(iv); ch.destroy(); };
      }
    });
  });
})();
