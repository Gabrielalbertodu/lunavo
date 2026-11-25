const unidades = [
  { nome: "UPA Cruzeiro", tipo: "UPA", k: 1.2, f: 1.1, lot: 62 },
  { nome: "Hospital Aurora", tipo: "Hospital", k: 1.6, f: 1.3, lot: 78 },
  { nome: "Clínica Vitta", tipo: "Clínica", k: 0.7, f: 0.7, lot: 41 },
  { nome: "UPA Águas Claras", tipo: "UPA", k: 1.1, f: 1, lot: 55 },
  { nome: "Hospital Santa Luna", tipo: "Hospital", k: 1.4, f: 1.2, lot: 88 },
  { nome: "Clínica Bem Viver", tipo: "Clínica", k: 0.6, f: 0.6, lot: 33 }
];

unidades.forEach((unidade, index) => {
  unidade.id = index;
  unidade.dist = (1.2 + index * 1.7).toFixed(1);
});

let filtro = "Todas";

const el = id => document.getElementById(id);
const clamp = (valor, minimo, maximo) => Math.max(minimo, Math.min(maximo, valor));
const espera = unidade => Math.round(unidade.lot * unidade.k);

const corLotacao = lotacao => {
  if (lotacao > 80) return "var(--warn)";
  if (lotacao > 60) return "#e8b923";
  return "var(--ok)";
};

function curva(hora, fator) {
  const picoManha = 48 * Math.exp(-((hora - 10) ** 2) / 7);
  const picoTarde = 40 * Math.exp(-((hora - 19) ** 2) / 9);
  return Math.round(clamp((22 + picoManha + picoTarde) * fator, 5, 100));
}

function desenharFiltros() {
  el("filtros").innerHTML = ["Todas", "UPA", "Hospital", "Clínica"]
    .map(tipo => `<button class="chip" aria-pressed="${tipo === filtro}" data-tipo="${tipo}">${tipo}</button>`)
    .join("");

  el("filtros").querySelectorAll("button").forEach(botao => {
    botao.addEventListener("click", () => {
      filtro = botao.dataset.tipo;
      desenharFiltros();
      desenharLista();
    });
  });
}

function desenharLista() {
  const lista = unidades
    .filter(unidade => filtro === "Todas" || unidade.tipo === filtro)
    .sort((a, b) => espera(a) - espera(b));

  el("lista").innerHTML = lista.map(unidade => `
    <button class="unit" data-id="${unidade.id}">
      <div>
        <div class="n">${unidade.nome}</div>
        <div class="meta">${unidade.tipo} · ${unidade.dist} km · lotação ${Math.round(unidade.lot)}%</div>
      </div>
      <div class="wait">${espera(unidade)} min</div>
      <div class="bar"><span style="width:${unidade.lot}%;background:${corLotacao(unidade.lot)}"></span></div>
    </button>`).join("");

  el("lista").querySelectorAll("button").forEach(botao => {
    botao.addEventListener("click", () => {
      el("selUnid").value = botao.dataset.id;
      desenharGrafico();
      el("previsao").scrollIntoView();
    });
  });
}

function desenharGrafico() {
  const unidade = unidades[Number(el("selUnid").value)];
  const agora = new Date().getHours();
  const largura = 600;
  const altura = 220;
  const margemEsquerda = 30;
  const margemBaixo = 24;
  const margemTopo = 10;

  const posicaoX = hora => margemEsquerda + (largura - margemEsquerda - 10) * hora / 23;
  const posicaoY = valor => altura - margemBaixo - (altura - margemBaixo - margemTopo) * valor / 100;

  const pontos = [...Array(24).keys()].map(hora => [hora, curva(hora, unidade.f)]);
  const passado = pontos.filter(ponto => ponto[0] <= agora);
  const futuro = pontos.filter(ponto => ponto[0] >= agora);

  const caminho = valores => valores
    .map((ponto, index) => `${index ? "L" : "M"}${posicaoX(ponto[0]).toFixed(1)} ${posicaoY(ponto[1]).toFixed(1)}`)
    .join(" ");

  const grade = [0, 50, 100].map(valor => `
    <line x1="${margemEsquerda}" x2="${largura - 10}" y1="${posicaoY(valor)}" y2="${posicaoY(valor)}" stroke="var(--line)"/>
    <text x="0" y="${posicaoY(valor) + 4}">${valor}</text>`).join("");

  const horas = [0, 6, 12, 18, 23].map(hora => `
    <text x="${posicaoX(hora)}" y="${altura - 6}" text-anchor="middle">${hora}h</text>`).join("");

  el("grafico").innerHTML = `
    ${grade}${horas}
    <path d="${caminho(futuro)}" fill="none" stroke="var(--warn)" stroke-width="2.5" stroke-dasharray="6 5"/>
    <path d="${caminho(passado)}" fill="none" stroke="var(--acc)" stroke-width="2.5"/>
    <line x1="${posicaoX(agora)}" x2="${posicaoX(agora)}" y1="${margemTopo}" y2="${altura - margemBaixo}" stroke="var(--mut)" stroke-dasharray="2 4"/>
    <circle cx="${posicaoX(agora)}" cy="${posicaoY(curva(agora, unidade.f))}" r="5" fill="var(--acc)"/>
    <text x="${posicaoX(agora) + 8}" y="${margemTopo + 10}">agora</text>`;

  const proximasHoras = pontos.filter(ponto => ponto[0] >= agora && ponto[0] <= 22);
  const melhor = proximasHoras.reduce(
    (atual, candidato) => candidato[1] < atual[1] ? candidato : atual,
    proximasHoras[0] || pontos[0]
  );
  const pico = pontos.reduce((atual, candidato) => candidato[1] > atual[1] ? candidato : atual);

  el("insight").innerHTML = `
    <small style="color:var(--mut)">Melhor horário hoje</small>
    <div class="big">${melhor[0]}h</div>
    <p class="tip">Demanda prevista de <b>${melhor[1]}%</b> em ${unidade.nome}.</p>
    <p class="tip">Pico esperado às <b>${pico[0]}h</b> (${pico[1]}%). Linha sólida: dados atuais. Tracejada: previsão da IA.</p>`;
}

function tick() {
  unidades.forEach(unidade => {
    unidade.lot = clamp(unidade.lot + (Math.random() - 0.5) * 7, 15, 98);
  });
  desenharLista();
}

const exames = {
  Ressonância: [["Clínica A", "Hoje · 14h"], ["Clínica B", "Hoje · 16h"], ["Hospital C", "Amanhã · 9h"]],
  Tomografia: [["Hospital C", "Hoje · 17h"], ["Clínica A", "Amanhã · 8h"], ["Clínica D", "Amanhã · 11h"]],
  Ultrassom: [["Clínica B", "Hoje · 13h"], ["Clínica D", "Hoje · 15h"], ["Clínica A", "Amanhã · 10h"]]
};

let exame = "Ressonância";

function desenharExames() {
  el("exames").innerHTML = Object.keys(exames)
    .map(nome => `<button class="chip" aria-pressed="${nome === exame}" data-exame="${nome}">${nome}</button>`)
    .join("");

  el("exames").querySelectorAll("button").forEach(botao => {
    botao.addEventListener("click", () => {
      exame = botao.dataset.exame;
      el("msg").style.display = "none";
      desenharExames();
    });
  });

  el("slots").innerHTML = exames[exame].map((horario, index) => `
    <div class="slot">
      <div><b>${horario[0]}</b><div class="meta">${horario[1]}</div></div>
      <button class="btn ghost" data-index="${index}">Agendar</button>
    </div>`).join("");

  el("slots").querySelectorAll("button").forEach(botao => {
    botao.addEventListener("click", () => {
      const horario = exames[exame][Number(botao.dataset.index)];
      const mensagem = el("msg");
      mensagem.style.display = "block";
      mensagem.textContent = `Horário reservado: ${exame} em ${horario[0]}, ${horario[1]}. Você receberá um lembrete pelo app.`;
    });
  });
}

el("selUnid").innerHTML = unidades
  .map(unidade => `<option value="${unidade.id}">${unidade.nome}</option>`)
  .join("");

el("selUnid").addEventListener("change", desenharGrafico);

desenharFiltros();
desenharLista();
desenharGrafico();
desenharExames();

setInterval(tick, 3000);
setInterval(desenharGrafico, 60000);