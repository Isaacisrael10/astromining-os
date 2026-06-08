/* ============================================================
 * ui.js — Utilidades de interface compartilhadas (Web Development)
 * AstroMining OS
 *
 * Fornece, para todas as telas:
 *   - showToast()  : notificações no canto da tela (cria/remove elementos no DOM)
 *   - comDelay()   : simula o atraso de comunicação Terra-Sonda (setTimeout = BOM)
 *   - relógio      : horário da missão ao vivo na barra lateral (setInterval = BOM)
 * ============================================================ */
(function () {
  "use strict";

  // Cria (uma única vez) a camada que segura as notificações
  function camadaToast() {
    var camada = document.getElementById("toast-layer");
    if (!camada) {
      camada = document.createElement("div");
      camada.id = "toast-layer";
      camada.className = "toast-layer";
      document.body.appendChild(camada);
    }
    return camada;
  }

  // Mostra uma notificação. tipo: "info" | "success" | "warning" | "danger"
  function showToast(mensagem, tipo) {
    var camada = camadaToast();
    var toast = document.createElement("div");
    toast.className = "toast toast-" + (tipo || "info");
    toast.textContent = mensagem;
    camada.appendChild(toast);

    // some sozinha depois de 3,5s (setTimeout = parte do BOM)
    setTimeout(function () {
      toast.classList.add("toast-out");
      setTimeout(function () { toast.remove(); }, 300);
    }, 3500);
  }

  // Simula o tempo de espera da comunicação com o espaço:
  // avisa que o comando foi enviado e só executa "acao" após o atraso.
  function comDelay(mensagemEnvio, acao) {
    showToast("📡 " + mensagemEnvio + " — aguardando resposta da sonda...", "info");
    var atraso = 1200 + Math.floor(Math.random() * 1300); // entre 1,2s e 2,5s
    setTimeout(acao, atraso);
  }

  // Relógio da missão: injeta um elemento na barra lateral e atualiza a cada 1s.
  function iniciarRelogio() {
    var status = document.querySelector(".sidebar-status");
    if (!status) return;

    var clock = document.createElement("div");
    clock.className = "mission-clock";
    clock.innerHTML = '<span>HORÁRIO DA MISSÃO</span><time data-clock>--:--:--</time>';
    status.parentNode.insertBefore(clock, status.nextSibling);

    var alvo = clock.querySelector("[data-clock]");
    function doisDigitos(n) { return (n < 10 ? "0" : "") + n; }
    function tick() {
      var d = new Date();
      alvo.textContent = doisDigitos(d.getHours()) + ":" +
                         doisDigitos(d.getMinutes()) + ":" +
                         doisDigitos(d.getSeconds());
    }
    tick();
    setInterval(tick, 1000); // setInterval = BOM
  }

  // Rodapé de créditos + aviso de simulação (injetado em todas as telas)
  function injetarCreditos() {
    var main = document.querySelector(".main-panel");
    if (!main || main.querySelector(".mission-credits")) return;
    var el = document.createElement("footer");
    el.className = "mission-credits";
    el.innerHTML =
      "Dados ilustrativos baseados na missão <strong>Psyche</strong> da NASA " +
      "(NASA/JPL-Caltech/ASU). Telemetria simulada para fins acadêmicos — Global Solution 2026.";
    main.appendChild(el);
  }

  // Disponibiliza as funções para os scripts de cada página
  window.AstroUI = { showToast: showToast, comDelay: comDelay };

  document.addEventListener("DOMContentLoaded", function () {
    iniciarRelogio();
    injetarCreditos();
  });
})();
