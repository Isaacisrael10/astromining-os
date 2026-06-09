/* ============================================================
 * dashboard.js — Simulação operacional do painel (index.html)
 * AstroMining OS — Web Development (WD)
 *
 * DOM/Eventos : simulação de perfuração, KPIs clicáveis (drawer + gráfico),
 *               mapa interativo (pinos, escanear, definir alvo)
 * BOM/Timers  : setInterval (perfuração, contagem, telemetria, histórico)
 *               e setTimeout (atraso de comunicação / escaneamento)
 * Gráficos    : Chart.js (drawer lateral)
 * ============================================================ */
(function () {
  "use strict";
  if (!document.querySelector(".kpi-grid")) return;

  var CORES = (window.AstroCharts && AstroCharts.CORES) || {};
  var CARGA_MAX = 5000;

  var estado = {
    combustivel: 100, cargaKg: 1750, broca: 72, energia: 92, latencia: 2.4, perfurando: false
  };
  function cargaPct() { return (estado.cargaKg / CARGA_MAX) * 100; }

  // ---------- Referências de DOM ----------
  function cardPorTitulo(titulo) {
    var cards = document.querySelectorAll(".kpi-grid .metric-card");
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].querySelector("h2").textContent.trim().indexOf(titulo) === 0) return cards[i];
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
  var statusCmd = document.getElementById("command-status");
  function setStatus(txt) { if (statusCmd) statusCmd.textContent = txt; }

  // ---------- Helpers de DOM ----------
  function setMetric(card, valor, unidade) {
    card.querySelector(".metric-value").innerHTML = valor + "<span>" + unidade + "</span>";
  }
  function setBadge(card, texto, classe) {
    var b = card.querySelector(".state-badge");
    b.className = "state-badge " + classe; b.textContent = texto;
  }
  function setMeter(card, pct, perigo) {
    pct = Math.max(0, Math.min(100, pct));
    var meter = card.querySelector(".meter");
    meter.querySelector(".meter-fill").style.width = pct + "%";
    meter.setAttribute("aria-valuenow", Math.round(pct));
    meter.classList.toggle("danger", !!perigo);
  }
  function setBorda(card, nivelVis) {
    card.classList.remove("safe", "warning", "danger");
    card.classList.add(nivelVis === "ok" ? "safe" : nivelVis === "attention" ? "warning" : "danger");
  }
  function classificar(valor, alerta, critico, invertido) {
    if (invertido) { return valor >= critico ? "danger" : valor >= alerta ? "attention" : "ok"; }
    return valor <= critico ? "danger" : valor <= alerta ? "attention" : "ok";
  }

  // ---------- Render ----------
  function render() {
    var nFuel = classificar(estado.combustivel, 35, 15, false);
    setMetric(cardCombustivel, Math.round(estado.combustivel), "%");
    setMeter(cardCombustivel, estado.combustivel, nFuel === "danger");
    setBadge(cardCombustivel, nFuel === "ok" ? "OK" : nFuel === "attention" ? "Baixo" : "Crítico",
      nFuel === "ok" ? "ok" : nFuel === "attention" ? "attention" : "danger");
    setBorda(cardCombustivel, nFuel);

    var cp = cargaPct();
    var nCarga = cp >= 100 ? "danger" : cp >= 90 ? "attention" : "ok";
    setMetric(cardCarga, Math.round(estado.cargaKg).toLocaleString("pt-BR"), "kg");
    setMeter(cardCarga, cp, nCarga === "danger");
    setBadge(cardCarga, Math.round(cp) + "%",
      nCarga === "ok" ? "neutral" : nCarga === "attention" ? "attention" : "danger");
    setBorda(cardCarga, nCarga);

    var nBroca = classificar(estado.broca, 78, 88, true);
    setMetric(cardBroca, Math.round(estado.broca), "%");
    setMeter(cardBroca, estado.broca, nBroca === "danger");
    setBadge(cardBroca, nBroca === "ok" ? "Normal" : nBroca === "attention" ? "Atenção" : "Crítico",
      nBroca === "ok" ? "ok" : nBroca === "attention" ? "attention" : "danger");
    setBorda(cardBroca, nBroca);

    var nEnergia = classificar(estado.energia, 40, 20, false);
    setMetric(cardEnergia, Math.round(estado.energia), "%");
    setMeter(cardEnergia, estado.energia, nEnergia === "danger");
    setBadge(cardEnergia, nEnergia === "ok" ? "Estável" : nEnergia === "attention" ? "Baixa" : "Crítica",
      nEnergia === "ok" ? "ok" : nEnergia === "attention" ? "attention" : "danger");
    setBorda(cardEnergia, nEnergia);

    renderRecomendacao(cp);
    renderAlertas(cp, nFuel, nBroca);
  }

  function renderRecomendacao(cp) {
    if (!callout) return;
    var titulo, desc, classe;
    if (estado.combustivel <= 15 || estado.energia <= 15 || cp >= 100) {
      classe = "state-danger"; titulo = "Retornar à base";
      desc = cp >= 100 ? "Compartimento de carga cheio. Encerrar perfuração e retornar."
        : "Recurso crítico. Abortar operação e retornar a sonda.";
    } else if (estado.broca > 88 || estado.latencia > 3) {
      classe = "state-attention"; titulo = "Pausar perfuração";
      desc = "Indicador fora da faixa segura. Pausar e reavaliar antes de continuar.";
    } else if (estado.perfurando) {
      classe = "state-safe"; titulo = "Perfuração nominal";
      desc = "Todos os sistemas dentro da faixa. Extração em andamento.";
    } else {
      classe = ""; titulo = "Continuar monitorando";
      desc = "Não iniciar nova perfuração até a latência estabilizar abaixo de 2.0s.";
    }
    callout.classList.remove("state-danger", "state-attention", "state-safe");
    if (classe) callout.classList.add(classe);
    callout.classList.toggle("blink", classe === "state-danger");
    callout.querySelector("strong").textContent = titulo;
    callout.querySelector("p").textContent = desc;
  }

  function criarAlerta(estadoVis, titulo, detalhe) {
    var li = document.createElement("li");
    li.className = "alert-item " + estadoVis;
    li.innerHTML = '<button type="button"><strong>' + titulo + "</strong><span>" + detalhe + "</span></button>";
    return li;
  }
  function renderAlertas(cp, nFuel, nBroca) {
    if (!listaAlertas) return;
    listaAlertas.innerHTML = "";
    listaAlertas.appendChild(estado.latencia > 2
      ? criarAlerta("attention", "Latência elevada", estado.latencia.toFixed(1) + "s // Monitorar comunicação")
      : criarAlerta("ok", "Comunicação estável", estado.latencia.toFixed(1) + "s // Dentro do limite"));
    listaAlertas.appendChild(nBroca === "danger"
      ? criarAlerta("danger", "Pressão crítica", Math.round(estado.broca) + "% // Risco de dano")
      : nBroca === "attention"
        ? criarAlerta("attention", "Pressão elevada", Math.round(estado.broca) + "% // Atenção")
        : criarAlerta("ok", "Pressão controlada", Math.round(estado.broca) + "% // Dentro do limite"));
    if (nFuel === "danger") {
      listaAlertas.appendChild(criarAlerta("danger", "Combustível crítico", Math.round(estado.combustivel) + "% // Retornar"));
    } else if (cp >= 100) {
      listaAlertas.appendChild(criarAlerta("danger", "Carga cheia", "100% // Encerrar extração"));
    } else {
      listaAlertas.appendChild(criarAlerta("ok", "Carga segura", Math.round(cp) + "% // Operação normal"));
    }
  }

  // ---------- Simulação da perfuração (setInterval) ----------
  var intervaloPerfuracao = null;
  function passoPerfuracao() {
    estado.cargaKg = Math.min(CARGA_MAX, estado.cargaKg + (90 + Math.random() * 70));
    estado.combustivel = Math.max(0, estado.combustivel - (1.2 + Math.random() * 1.0));
    estado.energia = Math.max(0, estado.energia - (0.5 + Math.random() * 0.6));
    estado.broca = Math.min(100, Math.max(60, estado.broca + (Math.random() * 6 - 2)));
    render();
    if (estado.cargaKg >= CARGA_MAX) { pararPerfuracao(); setStatus("Carga máxima atingida — perfuração concluída"); AstroUI.showToast("✅ Carga máxima atingida. Perfuração encerrada.", "success"); }
    else if (estado.combustivel <= 5) { pararPerfuracao(); setStatus("Combustível esgotado — retornar a sonda"); AstroUI.showToast("⛔ Combustível esgotado! Retornar a sonda.", "danger"); }
  }
  function iniciarPerfuracao() {
    estado.perfurando = true;
    botaoPerfurar.textContent = "Pausar Perfuração";
    setStatus("Perfuração em andamento — teleoperação ativa");
    AstroUI.showToast("🛠️ Perfuração iniciada no Setor A-7.", "success");
    intervaloPerfuracao = setInterval(passoPerfuracao, 1000);
    render();
  }
  function pararPerfuracao() {
    estado.perfurando = false;
    botaoPerfurar.textContent = "Iniciar Perfuração";
    setStatus("Sistema pronto — aguardando comando de perfuração");
    if (intervaloPerfuracao) { clearInterval(intervaloPerfuracao); intervaloPerfuracao = null; }
    render();
  }

  // ---------- Histórico para os gráficos (setInterval) ----------
  var historico = { labels: [], combustivel: [], cargaPct: [], broca: [], energia: [] };
  function amostrar() {
    var t = historico.labels.length;
    historico.labels.push(t + "s");
    historico.combustivel.push(Math.round(estado.combustivel));
    historico.cargaPct.push(Math.round(cargaPct()));
    historico.broca.push(Math.round(estado.broca));
    historico.energia.push(Math.round(estado.energia));
    var MAX = 40, chaves = ["labels", "combustivel", "cargaPct", "broca", "energia"];
    chaves.forEach(function (k) { if (historico[k].length > MAX) historico[k].shift(); });
  }
  amostrar(); // primeiro ponto
  setInterval(amostrar, 1000);

  // ---------- Drawer: gráfico ao vivo de um KPI ----------
  var KPI = {
    combustivel: { titulo: "Combustível (%)", cor: CORES.cyan },
    cargaPct: { titulo: "Carga Mineral (%)", cor: CORES.gold },
    broca: { titulo: "Pressão da Broca (%)", cor: CORES.gold },
    energia: { titulo: "Energia (%)", cor: CORES.green }
  };
  function abrirKpi(chave) {
    if (typeof Chart === "undefined") { AstroUI.showToast("Gráficos indisponíveis.", "warning"); return; }
    var cfg = KPI[chave];
    AstroDrawer.open({
      titulo: cfg.titulo,
      conteudo: function (corpo) {
        var p = document.createElement("p");
        p.textContent = "Histórico em tempo real. Inicie a perfuração para ver os valores mudarem.";
        corpo.appendChild(p);
        var cv = AstroCharts.canvas(corpo);
        var chart = new Chart(cv, {
          type: "line",
          data: {
            labels: historico.labels.slice(),
            datasets: [{
              label: cfg.titulo, data: historico[chave].slice(),
              borderColor: cfg.cor, backgroundColor: cfg.cor + "33",
              fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { y: { min: 0, max: 100 } },
            plugins: { legend: { display: false } }
          }
        });
        var iv = setInterval(function () {
          chart.data.labels = historico.labels.slice();
          chart.data.datasets[0].data = historico[chave].slice();
          chart.update("none");
        }, 1000);
        return function () { clearInterval(iv); chart.destroy(); };
      }
    });
  }

  // ---------- Drawer: ponto mineral do mapa (rosca de pureza) ----------
  var MINERIOS = {
    "pin-gold": { nome: "Ouro", pureza: 74, massa: "410kg", cor: CORES.gold },
    "pin-iron": { nome: "Ferro", pureza: 63, massa: "720kg", cor: "#9fb4bd" },
    "pin-platinum": { nome: "Platina", pureza: 88, massa: "620kg", cor: "#e6f7ff" }
  };
  function abrirMineral(acao) {
    var d = MINERIOS[acao];
    if (!d || typeof Chart === "undefined") { return; }
    AstroDrawer.open({
      titulo: "Ponto mineral: " + d.nome,
      conteudo: function (corpo) {
        var cv = AstroCharts.canvas(corpo);
        var chart = new Chart(cv, {
          type: "doughnut",
          data: {
            labels: ["Pureza", "Impureza"],
            datasets: [{ data: [d.pureza, 100 - d.pureza], borderWidth: 0,
              backgroundColor: [d.cor, "rgba(215,251,255,0.08)"] }]
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: "68%",
            plugins: { legend: { position: "bottom" } } }
        });
        var ul = document.createElement("ul");
        ul.className = "kv-list";
        ul.innerHTML =
          "<li><span>Minério</span><strong>" + d.nome + "</strong></li>" +
          "<li><span>Pureza estimada</span><strong>" + d.pureza + "%</strong></li>" +
          "<li><span>Massa no ponto</span><strong>" + d.massa + "</strong></li>" +
          "<li><span>Setor</span><strong>A-7</strong></li>";
        corpo.appendChild(ul);
        return function () { chart.destroy(); };
      }
    });
  }

  // ---------- Drawer: detalhe do minério da tabela de triagem ----------
  function abrirDetalheMineral(botao) {
    if (typeof Chart === "undefined") return;
    var linha = botao.closest("tr");
    if (!linha) return;
    var nome = linha.cells[0].textContent.trim();
    var massa = linha.cells[1].textContent.trim();
    var pureza = parseFloat(linha.cells[2].textContent) || 0;
    var valor = linha.cells[3].textContent.trim();
    AstroDrawer.open({
      titulo: "Minério: " + nome,
      conteudo: function (corpo) {
        var cv = AstroCharts.canvas(corpo);
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
          "<li><span>Valor</span><strong>" + valor + "</strong></li>";
        corpo.appendChild(ul);
        return function () { ch.destroy(); };
      }
    });
  }

  // ---------- Mapa: botão "Escanear setor" (injetado) ----------
  function injetarEscanear() {
    var heading = document.querySelector(".tactical-map .panel-heading");
    if (!heading) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "state-badge attention badge-button";
    btn.textContent = "Escanear setor";
    heading.appendChild(btn);
    btn.addEventListener("click", function () {
      var pins = document.querySelectorAll(".mineral-pin");
      var nomes = ["Ouro", "Ferro", "Platina"];
      pins.forEach(function (p) { p.classList.add("pin-hidden"); });
      AstroUI.showToast("🔍 Escaneando Setor A-7...", "info");
      pins.forEach(function (p, i) {
        setTimeout(function () {
          p.classList.remove("pin-hidden");
          AstroUI.showToast("✨ Ponto mineral detectado: " + (nomes[i] || "mineral"), "success");
        }, 700 * (i + 1));
      });
    });
  }

  // ---------- Mapa tático INTERATIVO: pan, zoom, sonda arrastável, retículo ----------
  function initMapaInterativo() {
    var stage = document.querySelector(".map-stage");
    if (!stage) return;
    var tituloMapa = document.getElementById("mapa-titulo");
    var distanciaEl = document.querySelector('.map-data [data-action="view-distance"] strong');

    function setorDe(x, y, r) {
      var col = Math.max(0, Math.min(5, Math.floor(x / r.width * 6)));
      var lin = Math.max(1, Math.min(9, Math.floor(y / r.height * 9) + 1));
      return "ABCDEF".charAt(col) + "-" + lin;
    }

    // 1) Envolve o conteúdo do mapa numa "cena" que dá para mover/dar zoom
    var cena = document.createElement("div");
    cena.className = "map-scene";
    while (stage.firstChild) cena.appendChild(stage.firstChild);
    stage.appendChild(cena);

    var view = { x: 0, y: 0, escala: 1 };
    function aplicarView() {
      cena.style.transform = "translate(" + view.x + "px," + view.y + "px) scale(" + view.escala + ")";
    }

    // 2) Retículo que segue o mouse
    var reticulo = document.createElement("div");
    reticulo.className = "map-reticle";
    reticulo.innerHTML = '<span class="map-reticle-h"></span><span class="map-reticle-v"></span><span class="map-reticle-label"></span>';
    stage.appendChild(reticulo);
    var label = reticulo.querySelector(".map-reticle-label");

    // 3) Sonda arrastável + linha (tether) até o centro
    var tether = document.createElement("div");
    tether.className = "probe-tether";
    var probe = document.createElement("button");
    probe.type = "button";
    probe.className = "map-probe";
    probe.setAttribute("aria-label", "Sonda SOND-01 — arraste para reposicionar");
    probe.textContent = "▲";
    stage.appendChild(tether);
    stage.appendChild(probe);
    var probePos = { x: 70, y: 70 };
    function centro() { var r = stage.getBoundingClientRect(); return { x: r.width / 2, y: r.height / 2 }; }
    function posicionarProbe() {
      probe.style.left = probePos.x + "px";
      probe.style.top = probePos.y + "px";
      var c = centro();
      var dx = c.x - probePos.x, dy = c.y - probePos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      tether.style.left = probePos.x + "px";
      tether.style.top = probePos.y + "px";
      tether.style.width = dist + "px";
      tether.style.transform = "rotate(" + (Math.atan2(dy, dx) * 180 / Math.PI) + "deg)";
      if (distanciaEl) distanciaEl.textContent = Math.round(dist * 6).toLocaleString("pt-BR") + "km";
    }

    // 4) Controles de zoom e dica
    var ctrl = document.createElement("div");
    ctrl.className = "map-zoom";
    ctrl.innerHTML = '<button type="button" data-z="in" aria-label="Aproximar">+</button>' +
                     '<button type="button" data-z="out" aria-label="Afastar">−</button>' +
                     '<button type="button" data-z="reset" aria-label="Resetar">⟲</button>';
    stage.appendChild(ctrl);
    var hint = document.createElement("div");
    hint.className = "map-hint";
    hint.textContent = "Arraste a sonda ▲ • use +/− p/ zoom (ou Ctrl+roda) • arraste o fundo p/ mover • clique p/ mirar";
    stage.appendChild(hint);

    // ----- Retículo segue o mouse -----
    stage.addEventListener("mousemove", function (e) {
      var r = stage.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      reticulo.style.left = x + "px";
      reticulo.style.top = y + "px";
      label.textContent = "Setor " + setorDe(x, y, r);
      reticulo.classList.add("show");
    });
    stage.addEventListener("mouseleave", function () { reticulo.classList.remove("show"); });

    // ----- Arrastar a sonda -----
    var arrastandoProbe = false;
    probe.addEventListener("mousedown", function (e) {
      arrastandoProbe = true; e.preventDefault(); e.stopPropagation();
      probe.classList.add("dragging");
    });

    // ----- Pan (arrastar o fundo) vs clique (mirar) -----
    var pan = null, moveu = false;
    stage.addEventListener("mousedown", function (e) {
      if (e.target.closest(".mineral-pin") || e.target.closest(".map-probe") || e.target.closest(".map-zoom")) return;
      pan = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      moveu = false;
    });

    document.addEventListener("mousemove", function (e) {
      if (arrastandoProbe) {
        var r = stage.getBoundingClientRect();
        probePos.x = Math.max(0, Math.min(r.width, e.clientX - r.left));
        probePos.y = Math.max(0, Math.min(r.height, e.clientY - r.top));
        posicionarProbe();
        return;
      }
      if (pan) {
        var dx = e.clientX - pan.x, dy = e.clientY - pan.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moveu = true;
        if (moveu) { view.x = pan.vx + dx; view.y = pan.vy + dy; aplicarView(); }
      }
    });

    document.addEventListener("mouseup", function (e) {
      if (arrastandoProbe) {
        arrastandoProbe = false; probe.classList.remove("dragging");
        return;
      }
      if (pan) {
        if (!moveu && !e.target.closest(".mineral-pin") && !e.target.closest(".map-zoom")) {
          // clique simples no mapa -> define alvo de perfuração
          var r = stage.getBoundingClientRect();
          var x = e.clientX - r.left, y = e.clientY - r.top;
          if (x >= 0 && y >= 0 && x <= r.width && y <= r.height) {
            var antigo = stage.querySelector(".map-target");
            if (antigo) antigo.remove();
            var m = document.createElement("div");
            m.className = "map-target";
            m.style.left = x + "px"; m.style.top = y + "px";
            stage.appendChild(m);
            var setor = setorDe(x, y, r);
            if (tituloMapa) tituloMapa.textContent = "Zona de Extração // Setor " + setor;
            AstroUI.showToast("🎯 Alvo de perfuração definido: Setor " + setor, "info");
          }
        }
        pan = null;
      }
    });

    // ----- Zoom com a roda do mouse SOMENTE com Ctrl pressionado -----
    // (sem Ctrl, a roda rola a página normalmente — evita "sequestrar" o scroll)
    stage.addEventListener("wheel", function (e) {
      if (!e.ctrlKey) return;          // deixa a página rolar
      e.preventDefault();              // só aqui assumimos a roda = zoom
      view.escala = Math.max(0.6, Math.min(2.5, view.escala + (e.deltaY < 0 ? 0.12 : -0.12)));
      aplicarView();
    }, { passive: false });

    // ----- Botões de zoom -----
    ctrl.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      e.stopPropagation();
      var z = b.getAttribute("data-z");
      if (z === "in") view.escala = Math.min(2.5, view.escala + 0.2);
      else if (z === "out") view.escala = Math.max(0.6, view.escala - 0.2);
      else { view.x = 0; view.y = 0; view.escala = 1; }
      aplicarView();
    });

    posicionarProbe();
    injetarEscanear(); // botão "Escanear setor"
  }

  // ---------- Contagem regressiva da janela de sinal ----------
  function iniciarContagem() {
    var alvo = document.querySelector('.mission-strip [data-action="view-signal-window"] strong');
    if (!alvo) return;
    var total = 4 * 3600 + 32 * 60;
    function dd(n) { return (n < 10 ? "0" : "") + n; }
    setInterval(function () {
      if (total > 0) total--;
      alvo.textContent = dd(Math.floor(total / 3600)) + ":" + dd(Math.floor((total % 3600) / 60)) + ":" + dd(total % 60);
    }, 1000);
  }

  // ---------- Telemetria de comunicação flutuante ----------
  function iniciarTelemetria() {
    setInterval(function () {
      estado.latencia = +(1.6 + Math.random() * 1.8).toFixed(1);
      var sinal = Math.round(100 - estado.latencia * 8);
      var sinalEl = document.querySelector('.map-data [data-action="view-signal"] strong');
      if (sinalEl) sinalEl.textContent = sinal + "%";
      var comEl = document.querySelector('[data-action="system-communication"] strong');
      if (comEl) comEl.textContent = sinal + "%";
      render();
    }, 3000);
  }

  // ---------- Eventos: ouvinte delegado para os botões ----------
  var KPIKEY = { "details-fuel": "combustivel", "details-cargo": "cargaPct", "details-drill": "broca", "details-energy": "energia" };
  document.querySelector(".main-panel").addEventListener("click", function (e) {
    var botao = e.target.closest("[data-action]");
    if (!botao) return;
    var acao = botao.getAttribute("data-action");

    if (acao === "start-mining") { estado.perfurando ? pararPerfuracao() : iniciarPerfuracao(); return; }
    if (KPIKEY[acao]) { abrirKpi(KPIKEY[acao]); return; }
    if (MINERIOS[acao]) { abrirMineral(acao); return; }
    if (acao.indexOf("mineral-") === 0) { abrirDetalheMineral(botao); return; }
    // Botões de estatística/atalho (Missão, Distância, Sinal, etc.) não disparam notificação.
  });

  // ---------- Inicialização ----------
  render();
  initMapaInterativo();
  iniciarContagem();
  iniciarTelemetria();
})();
