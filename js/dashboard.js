/* ============================================================
 * dashboard.js — Simulação operacional do painel (index.html)
 * AstroMining OS — Web Development (WD)
 *
 * Recursos demonstrados:
 *   - DOM      : valores, medidores, selos, recomendação e alertas mudam na tela
 *   - Eventos  : um ouvinte delegado trata os cliques de todos os botões
 *   - BOM      : setInterval (perfuração, contagem regressiva, telemetria)
 *                e setTimeout (atraso de comunicação, via AstroUI.comDelay)
 * ============================================================ */
(function () {
  "use strict";

  // Este script só deve rodar no Dashboard
  if (!document.querySelector(".kpi-grid")) return;

  // ---------- Estado da missão (fonte única de verdade) ----------
  var CARGA_MAX = 5000; // kg
  var estado = {
    combustivel: 100, // %
    cargaKg: 1750,    // kg
    broca: 72,        // %
    energia: 92,      // %
    latencia: 2.4,    // s
    perfurando: false
  };

  // ---------- Localiza os 4 cartões de KPI pelo título ----------
  function cardPorTitulo(titulo) {
    var cards = document.querySelectorAll(".kpi-grid .metric-card");
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].querySelector("h2").textContent.trim().indexOf(titulo) === 0) {
        return cards[i];
      }
    }
    return null;
  }
  var cardCombustivel = cardPorTitulo("Combustível");
  var cardCarga = cardPorTitulo("Carga");
  var cardBroca = cardPorTitulo("Broca");
  var cardEnergia = cardPorTitulo("Energia");

  var callout = document.querySelector(".decision-callout");
  var listaAlertas = document.querySelector(".alert-list");
  var botaoPerfurar = document.getElementById("startMiningButton");

  // ---------- Helpers de escrita no DOM ----------
  function setMetric(card, valor, unidade) {
    card.querySelector(".metric-value").innerHTML = valor + "<span>" + unidade + "</span>";
  }
  function setBadge(card, texto, classe) {
    var b = card.querySelector(".state-badge");
    b.className = "state-badge " + classe;
    b.textContent = texto;
  }
  function setMeter(card, pct, perigo) {
    pct = Math.max(0, Math.min(100, pct));
    var meter = card.querySelector(".meter");
    meter.querySelector(".meter-fill").style.width = pct + "%";
    meter.setAttribute("aria-valuenow", Math.round(pct));
    meter.classList.toggle("danger", !!perigo);
  }
  function setBorda(card, nivelVis) { // 'ok' | 'attention' | 'danger'
    card.classList.remove("safe", "warning", "danger");
    card.classList.add(nivelVis === "ok" ? "safe" : nivelVis === "attention" ? "warning" : "danger");
  }
  // Classifica um valor em 'ok' | 'attention' | 'danger'.
  // invertido = true quando valores ALTOS é que são ruins (ex.: pressão da broca).
  function classificar(valor, alerta, critico, invertido) {
    if (invertido) {
      if (valor >= critico) return "danger";
      if (valor >= alerta) return "attention";
      return "ok";
    }
    if (valor <= critico) return "danger";
    if (valor <= alerta) return "attention";
    return "ok";
  }

  // ---------- Render: desenha o estado atual na tela ----------
  function render() {
    // Combustível (baixo = ruim)
    var nFuel = classificar(estado.combustivel, 35, 15, false);
    setMetric(cardCombustivel, Math.round(estado.combustivel), "%");
    setMeter(cardCombustivel, estado.combustivel, nFuel === "danger");
    setBadge(cardCombustivel, nFuel === "ok" ? "OK" : nFuel === "attention" ? "Baixo" : "Crítico",
      nFuel === "ok" ? "ok" : nFuel === "attention" ? "attention" : "danger");
    setBorda(cardCombustivel, nFuel);

    // Carga (cheio = atenção/perigo)
    var cargaPct = (estado.cargaKg / CARGA_MAX) * 100;
    var nCarga = cargaPct >= 100 ? "danger" : cargaPct >= 90 ? "attention" : "ok";
    setMetric(cardCarga, Math.round(estado.cargaKg).toLocaleString("pt-BR"), "kg");
    setMeter(cardCarga, cargaPct, nCarga === "danger");
    setBadge(cardCarga, Math.round(cargaPct) + "%",
      nCarga === "ok" ? "neutral" : nCarga === "attention" ? "attention" : "danger");
    setBorda(cardCarga, nCarga);

    // Broca (alto = ruim)
    var nBroca = classificar(estado.broca, 78, 88, true);
    setMetric(cardBroca, Math.round(estado.broca), "%");
    setMeter(cardBroca, estado.broca, nBroca === "danger");
    setBadge(cardBroca, nBroca === "ok" ? "Normal" : nBroca === "attention" ? "Atenção" : "Crítico",
      nBroca === "ok" ? "ok" : nBroca === "attention" ? "attention" : "danger");
    setBorda(cardBroca, nBroca);

    // Energia (baixo = ruim)
    var nEnergia = classificar(estado.energia, 40, 20, false);
    setMetric(cardEnergia, Math.round(estado.energia), "%");
    setMeter(cardEnergia, estado.energia, nEnergia === "danger");
    setBadge(cardEnergia, nEnergia === "ok" ? "Estável" : nEnergia === "attention" ? "Baixa" : "Crítica",
      nEnergia === "ok" ? "ok" : nEnergia === "attention" ? "attention" : "danger");
    setBorda(cardEnergia, nEnergia);

    renderRecomendacao(cargaPct);
    renderAlertas(cargaPct, nFuel, nBroca);
  }

  // ---------- Recomendação rápida (muda de cor e texto) ----------
  function renderRecomendacao(cargaPct) {
    if (!callout) return;
    var titulo, desc, classe;
    if (estado.combustivel <= 15 || estado.energia <= 15 || cargaPct >= 100) {
      classe = "state-danger";
      titulo = "Retornar à base";
      desc = cargaPct >= 100
        ? "Compartimento de carga cheio. Encerrar perfuração e retornar."
        : "Recurso crítico. Abortar operação e retornar a sonda.";
    } else if (estado.broca > 88 || estado.latencia > 3) {
      classe = "state-attention";
      titulo = "Pausar perfuração";
      desc = "Indicador fora da faixa segura. Pausar e reavaliar antes de continuar.";
    } else if (estado.perfurando) {
      classe = "state-safe";
      titulo = "Perfuração nominal";
      desc = "Todos os sistemas dentro da faixa. Extração em andamento.";
    } else {
      classe = "";
      titulo = "Continuar monitorando";
      desc = "Não iniciar nova perfuração até a latência estabilizar abaixo de 2.0s.";
    }
    callout.classList.remove("state-danger", "state-attention", "state-safe");
    if (classe) callout.classList.add(classe);
    callout.classList.toggle("blink", classe === "state-danger");
    callout.querySelector("strong").textContent = titulo;
    callout.querySelector("p").textContent = desc;
  }

  // ---------- Lista de alertas (reconstruída a cada render) ----------
  function criarAlerta(estadoVis, titulo, detalhe) {
    var li = document.createElement("li");
    li.className = "alert-item " + estadoVis;
    li.innerHTML = '<button type="button"><strong>' + titulo +
                   "</strong><span>" + detalhe + "</span></button>";
    return li;
  }
  function renderAlertas(cargaPct, nFuel, nBroca) {
    if (!listaAlertas) return;
    listaAlertas.innerHTML = "";

    listaAlertas.appendChild(
      estado.latencia > 2
        ? criarAlerta("attention", "Latência elevada", estado.latencia.toFixed(1) + "s // Monitorar comunicação")
        : criarAlerta("ok", "Comunicação estável", estado.latencia.toFixed(1) + "s // Dentro do limite")
    );

    listaAlertas.appendChild(
      nBroca === "danger"
        ? criarAlerta("danger", "Pressão crítica", Math.round(estado.broca) + "% // Risco de dano")
        : nBroca === "attention"
          ? criarAlerta("attention", "Pressão elevada", Math.round(estado.broca) + "% // Atenção")
          : criarAlerta("ok", "Pressão controlada", Math.round(estado.broca) + "% // Dentro do limite")
    );

    if (nFuel === "danger") {
      listaAlertas.appendChild(criarAlerta("danger", "Combustível crítico", Math.round(estado.combustivel) + "% // Retornar"));
    } else if (cargaPct >= 100) {
      listaAlertas.appendChild(criarAlerta("danger", "Carga cheia", "100% // Encerrar extração"));
    } else {
      listaAlertas.appendChild(criarAlerta("ok", "Carga segura", Math.round(cargaPct) + "% // Operação normal"));
    }
  }

  // ---------- Simulação da perfuração (setInterval = BOM) ----------
  var intervaloPerfuracao = null;
  function passoPerfuracao() {
    estado.cargaKg = Math.min(CARGA_MAX, estado.cargaKg + (90 + Math.random() * 70));
    estado.combustivel = Math.max(0, estado.combustivel - (1.2 + Math.random() * 1.0));
    estado.energia = Math.max(0, estado.energia - (0.5 + Math.random() * 0.6));
    estado.broca = Math.min(100, Math.max(60, estado.broca + (Math.random() * 6 - 2)));
    render();

    // Paradas automáticas
    if (estado.cargaKg >= CARGA_MAX) {
      pararPerfuracao();
      AstroUI.showToast("✅ Carga máxima atingida. Perfuração encerrada.", "success");
    } else if (estado.combustivel <= 5) {
      pararPerfuracao();
      AstroUI.showToast("⛔ Combustível esgotado! Retornar a sonda.", "danger");
    }
  }
  function iniciarPerfuracao() {
    estado.perfurando = true;
    botaoPerfurar.textContent = "Pausar Perfuração";
    AstroUI.showToast("🛠️ Perfuração iniciada no Setor A-7.", "success");
    intervaloPerfuracao = setInterval(passoPerfuracao, 1000);
    render();
  }
  function pararPerfuracao() {
    estado.perfurando = false;
    botaoPerfurar.textContent = "Iniciar Perfuração";
    if (intervaloPerfuracao) { clearInterval(intervaloPerfuracao); intervaloPerfuracao = null; }
    render();
  }

  // ---------- Contagem regressiva da janela de sinal (setInterval = BOM) ----------
  function iniciarContagem() {
    var alvo = document.querySelector('.mission-strip [data-action="view-signal-window"] strong');
    if (!alvo) return;
    var total = 4 * 3600 + 32 * 60; // 04:32 em segundos
    function dd(n) { return (n < 10 ? "0" : "") + n; }
    setInterval(function () {
      if (total > 0) total--;
      var h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
      alvo.textContent = dd(h) + ":" + dd(m) + ":" + dd(s);
    }, 1000);
  }

  // ---------- Telemetria de comunicação flutuante (setInterval = BOM) ----------
  function iniciarTelemetria() {
    setInterval(function () {
      estado.latencia = +(1.6 + Math.random() * 1.8).toFixed(1); // 1,6s a 3,4s
      var sinal = Math.round(100 - estado.latencia * 8);         // sinal cai com a latência
      var sinalEl = document.querySelector('.map-data [data-action="view-signal"] strong');
      if (sinalEl) sinalEl.textContent = sinal + "%";
      var comEl = document.querySelector('[data-action="system-communication"] strong');
      if (comEl) comEl.textContent = sinal + "%";
      render();
    }, 3000);
  }

  // ---------- Eventos: um único ouvinte delegado para todos os botões ----------
  document.querySelector(".main-panel").addEventListener("click", function (e) {
    var botao = e.target.closest("[data-action]");
    if (!botao) return;
    var acao = botao.getAttribute("data-action");

    if (acao === "start-mining") {
      if (estado.perfurando) { pararPerfuracao(); }
      else { iniciarPerfuracao(); }
      return;
    }

    // Demais botões simulam um comando de teleoperação com atraso de comunicação
    var alvoTexto = botao.querySelector("strong") || botao;
    var rotulo = alvoTexto.textContent.trim();
    AstroUI.comDelay("Comando enviado: " + rotulo, function () {
      AstroUI.showToast("✅ Resposta recebida: " + rotulo, "success");
    });
  });

  // ---------- Inicialização ----------
  render();
  iniciarContagem();
  iniciarTelemetria();
})();
