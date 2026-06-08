/* ============================================================
 * drawer.js — Painel lateral reutilizável (Web Development)
 * AstroMining OS
 *
 * Uso:
 *   AstroDrawer.open({
 *     titulo: "Título",
 *     conteudo: function (corpo) {
 *       // 'corpo' é o elemento onde você injeta o conteúdo (gráficos, tabelas...)
 *       // pode retornar uma função de limpeza (ex.: destruir gráfico / clearInterval)
 *     }
 *   });
 *   AstroDrawer.close();
 *
 * Fecha ao clicar no fundo, no ✕ ou apertando ESC.
 * ============================================================ */
(function () {
  "use strict";

  var aberto = false;
  var limpeza = null; // função opcional chamada ao fechar (cleanup)

  // Cria os elementos do drawer uma única vez
  function montar() {
    if (document.getElementById("drawer")) return;

    var backdrop = document.createElement("div");
    backdrop.id = "drawer-backdrop";
    backdrop.className = "drawer-backdrop";

    var drawer = document.createElement("aside");
    drawer.id = "drawer";
    drawer.className = "drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.innerHTML =
      '<div class="drawer-head">' +
        '<h2 class="drawer-title"></h2>' +
        '<button type="button" class="drawer-close" aria-label="Fechar painel">✕</button>' +
      "</div>" +
      '<div class="drawer-body"></div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    backdrop.addEventListener("click", fechar);
    drawer.querySelector(".drawer-close").addEventListener("click", fechar);
  }

  function open(opts) {
    montar();
    var drawer = document.getElementById("drawer");
    var backdrop = document.getElementById("drawer-backdrop");

    // limpa conteúdo anterior
    if (limpeza) { try { limpeza(); } catch (e) {} limpeza = null; }

    drawer.querySelector(".drawer-title").textContent = opts.titulo || "";
    var corpo = drawer.querySelector(".drawer-body");
    corpo.innerHTML = "";

    if (typeof opts.conteudo === "function") {
      limpeza = opts.conteudo(corpo) || null;
    }

    // mostra com animação
    window.requestAnimationFrame(function () {
      backdrop.classList.add("show");
      drawer.classList.add("show");
    });
    aberto = true;
  }

  function fechar() {
    if (!aberto) return;
    if (limpeza) { try { limpeza(); } catch (e) {} limpeza = null; }
    var drawer = document.getElementById("drawer");
    var backdrop = document.getElementById("drawer-backdrop");
    if (drawer) drawer.classList.remove("show");
    if (backdrop) backdrop.classList.remove("show");
    aberto = false;
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") fechar();
  });

  window.AstroDrawer = { open: open, close: fechar };
})();
