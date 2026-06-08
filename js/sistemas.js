/* ============================================================
 * sistemas.js — Telemetria e simulação de falhas (sistemas.html)
 * AstroMining OS — Web Development (WD)
 *
 * BOM/Timers: a telemetria oscila sozinha com setInterval.
 * DOM + Eventos: botões (criados via JS) disparam falha/normalização,
 *                gravam no Log Operacional e mudam o diagnóstico.
 * ============================================================ */
(function () {
  "use strict";

  var grid = document.querySelector(".system-health-grid");
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".system-card"));
  var log = document.querySelector(".log-list");

  // localiza um cartão pelo título
  function card(titulo) {
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].querySelector("h2").textContent.trim().indexOf(titulo) === 0) return cards[i];
    }
    return null;
  }
  var cEnergia = card("Energia");
  var cBroca = card("Broca");
  var cBraco = card("Braço");
  var cCom = card("Comunicação");

  function horaAtual() {
    var d = new Date();
    return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" +
           (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  }

  // adiciona uma entrada no topo do Log Operacional (manipulação de DOM)
  function registrar(titulo, detalhe) {
    if (!log) return;
    var li = document.createElement("li");
    li.innerHTML = "<span>" + horaAtual() + "</span><strong>" + titulo +
                   "</strong><p>" + detalhe + "</p>";
    log.insertBefore(li, log.firstChild);
  }

  // escreve valor + estado de cor num cartão
  function setCard(c, valor, nivelVis) { // nivelVis: 'ok' | 'attention' | 'danger'
    if (!c) return;
    c.querySelector("strong").textContent = valor;
    c.classList.remove("ok", "attention", "danger");
    c.classList.add(nivelVis);
  }

  // muda o bloco de diagnóstico (Recomendação Técnica)
  function atualizarDiagnostico(texto, perigo) {
    var callout = document.querySelector(".decision-callout");
    if (!callout) return;
    callout.querySelector("strong").textContent = perigo ? "Operação suspensa" : "Operação permitida";
    callout.querySelector("p").textContent = texto;
    callout.classList.toggle("state-danger", perigo);
    callout.classList.toggle("blink", perigo);
  }

  // ---------- Telemetria flutuante (setInterval = BOM) ----------
  setInterval(function () {
    var e = Math.round(88 + Math.random() * 8); // energia entre 88% e 96%
    setCard(cEnergia, e + "%", e < 90 ? "attention" : "ok");
  }, 4000);

  // ---------- Botões de controle criados via JavaScript ----------
  var header = document.querySelector(".page-header");
  if (header) {
    var box = document.createElement("div");
    box.className = "js-controls";
    box.innerHTML =
      '<button type="button" id="btn-falha" class="danger">Simular falha de subsistema</button>' +
      '<button type="button" id="btn-normalizar">Normalizar sistemas</button>';
    header.parentNode.insertBefore(box, header.nextSibling);

    document.getElementById("btn-falha").addEventListener("click", function () {
      // escolhe um subsistema aleatório e o coloca em estado crítico
      var alvos = [
        { c: cBroca, nome: "Broca", valor: "94%" },
        { c: cCom, nome: "Comunicação", valor: "4.1s" },
        { c: cBraco, nome: "Braço Mecânico", valor: "71%" }
      ];
      var a = alvos[Math.floor(Math.random() * alvos.length)];
      setCard(a.c, a.valor, "danger");
      a.c.classList.add("blink");
      registrar("⚠️ Falha detectada", a.nome + " fora da faixa segura (" + a.valor + ").");
      AstroUI.showToast("⚠️ Falha simulada: " + a.nome, "danger");
      atualizarDiagnostico("Atenção: " + a.nome + " exige intervenção antes de novo ciclo.", true);
    });

    document.getElementById("btn-normalizar").addEventListener("click", function () {
      setCard(cEnergia, "92%", "ok");
      setCard(cBroca, "72%", "attention");
      setCard(cBraco, "98%", "ok");
      setCard(cCom, "2.4s", "attention");
      cards.forEach(function (c) { c.classList.remove("blink"); });
      registrar("✅ Sistemas normalizados", "Todos os subsistemas retornaram à faixa operacional.");
      AstroUI.showToast("✅ Sistemas normalizados.", "success");
      atualizarDiagnostico("Operação permitida. Manter monitoramento da comunicação.", false);
    });
  }

  // ---------- "Detalhes" de cada cartão: consulta com atraso ----------
  grid.addEventListener("click", function (e) {
    var botao = e.target.closest("[data-action]");
    if (!botao) return;
    var nome = botao.closest(".system-card").querySelector("h2").textContent.trim();
    AstroUI.comDelay("Diagnóstico de " + nome, function () {
      AstroUI.showToast("📄 Diagnóstico de " + nome + " concluído.", "success");
    });
  });
})();
