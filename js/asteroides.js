/* ============================================================
 * asteroides.js — Seleção de alvos (asteroides.html)
 * AstroMining OS — Web Development (WD)
 *
 * DOM + Eventos: clicar num card de asteroide destaca o card e
 * atualiza o painel "Alvo Selecionado" com os dados daquele alvo.
 * ============================================================ */
(function () {
  "use strict";

  var grid = document.querySelector(".target-grid");
  if (!grid) return;

  // Base de dados dos alvos (a chave é o nome que aparece no card)
  var DADOS = {
    "Psyche 16": { platina: "30%", ferro: "42%", niquel: "18%", viabilidade: "Alta",     status: "Mineral Rico", classe: "attention" },
    "Bennu":     { platina: "8%",  ferro: "22%", niquel: "9%",  viabilidade: "Média",    status: "Científico",   classe: "neutral" },
    "Ryugu":     { platina: "5%",  ferro: "15%", niquel: "6%",  viabilidade: "Baixa",    status: "Limitado",     classe: "neutral" },
    "Apophis":   { platina: "12%", ferro: "28%", niquel: "14%", viabilidade: "Inviável", status: "Alto Risco",   classe: "danger" }
  };

  var painel = document.querySelector(".target-detail-panel");
  var titulo = document.getElementById("alvo-selecionado");
  var badge = painel ? painel.querySelector(".state-badge") : null;
  var specs = painel ? painel.querySelectorAll(".spec-list li strong") : [];

  function selecionar(card) {
    var nome = card.querySelector("strong").textContent.trim();
    var d = DADOS[nome];
    if (!d) return;

    // marca visualmente o card escolhido
    var cards = grid.querySelectorAll(".target-card");
    for (var i = 0; i < cards.length; i++) cards[i].classList.remove("selected");
    card.classList.add("selected");

    // atualiza o painel de detalhe (manipulação de DOM)
    if (titulo) titulo.textContent = nome;
    if (badge) { badge.className = "state-badge " + d.classe; badge.textContent = d.status; }
    if (specs.length >= 4) {
      specs[0].textContent = d.platina;
      specs[1].textContent = d.ferro;
      specs[2].textContent = d.niquel;
      specs[3].textContent = d.viabilidade;
    }
    AstroUI.showToast("🛰️ Alvo selecionado: " + nome, "info");
  }

  // Evento de clique (delegado) em qualquer card
  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".target-card");
    if (card) selecionar(card);
  });
})();
