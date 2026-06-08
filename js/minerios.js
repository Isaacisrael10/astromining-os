/* ============================================================
 * minerios.js — Inventário interativo (minerios.html)
 * AstroMining OS — Web Development (WD)
 *
 * DOM + Eventos:
 *   - Ordenar a tabela por valor (botão existente), alternando a ordem
 *   - Filtrar a tabela por nome (campo de busca criado via JavaScript)
 *   - "Detalhes" destaca a linha e simula consulta com atraso (setTimeout)
 * ============================================================ */
(function () {
  "use strict";

  var tabela = document.querySelector(".minerals-table");
  if (!tabela) return;
  var corpo = tabela.querySelector("tbody");

  // Coluna "Valor" é a 5ª (índice 4): Minério | Massa | Pureza | Aplicação | Valor | Ação
  var COL_VALOR = 4;
  var PESO = { "Alto": 3, "Médio": 2, "Baixo": 1 };
  var ordemCrescente = true;

  // ---------- Ordenar por valor (botão já existe no HTML) ----------
  var botaoOrdenar = document.querySelector('[data-action="sort-value"]');
  if (botaoOrdenar) {
    botaoOrdenar.addEventListener("click", function () {
      var linhas = Array.prototype.slice.call(corpo.querySelectorAll("tr"));
      linhas.sort(function (a, b) {
        var pa = PESO[a.cells[COL_VALOR].textContent.trim()] || 0;
        var pb = PESO[b.cells[COL_VALOR].textContent.trim()] || 0;
        return ordemCrescente ? pa - pb : pb - pa;
      });
      // reordena no DOM (re-anexar move o elemento)
      linhas.forEach(function (tr) { corpo.appendChild(tr); });
      AstroUI.showToast("📊 Tabela ordenada por valor (" +
        (ordemCrescente ? "crescente" : "decrescente") + ").", "info");
      ordemCrescente = !ordemCrescente;
    });
  }

  // ---------- Campo de filtro criado via JavaScript ----------
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
    });
  }

  // ---------- Botões "Detalhes": destaca a linha e simula consulta ----------
  corpo.addEventListener("click", function (e) {
    var botao = e.target.closest("[data-action]");
    if (!botao) return;
    var linha = botao.closest("tr");
    var linhas = corpo.querySelectorAll("tr");
    for (var i = 0; i < linhas.length; i++) linhas[i].classList.remove("row-highlight");
    linha.classList.add("row-highlight");

    var minerio = linha.cells[0].textContent.trim();
    AstroUI.comDelay("Consultando " + minerio, function () {
      AstroUI.showToast("📄 Dados de " + minerio + " carregados.", "success");
    });
  });
})();
