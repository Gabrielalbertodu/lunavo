const tunidades = [
  { nome: "UPA Cruzeiro", ocupacao: 62, aguardando: 28, espera: 34 },
  { nome: "Hospital Aurora", ocupacao: 78, aguardando: 41, espera: 52 },
  { nome: "Clínica Vitta", ocupacao: 41, aguardando: 12, espera: 18 },
  { nome: "UPA Águas Claras", ocupacao: 55, aguardando: 23, espera: 29 },
  { nome: "Hospital Santa Luna", ocupacao: 88, aguardando: 37, espera: 61 },
  { nome: "Clínica Bem Viver", ocupacao: 33, aguardando: 9, espera: 14 }
];

const el = id => document.getElementById(id);
const limitar = (valor, minimo, maximo) => Math.max(minimo, Math.min(maximo, valor));
let intervalo;
let atendimentosHora = 46;

function atualizarPainel() {
  const totalAguardando = unidades.reduce((total, unidade) => total + unidade.aguardando, 0);
  const ocupacaoMedia = Math.round(unidades.reduce((total, unidade) => total + unidade.ocupacao, 0) / unidades.length);
  const esperaMedia = Math.round(unidades.reduce((total, unidade) => total + unidade.espera, 0) / unidades.length);
  const alertas = unidades.filter(unidade => unidade.ocupacao >= 80);
  const proximoPico = new Date();
  proximoPico.setHours(proximoPico.getHours() + (ocupacaoMedia >= 70 ? 1 : 3), 0, 0, 0);

  el("waitingValue").textContent = totalAguardando;
  el("waitingTrend").textContent = `${atendimentosHora} atendimentos na última hora`;
  el("occupancyValue").textContent = `${ocupacaoMedia}%`;
  el("waitValue").textContent = `${esperaMedia} min`;
  el("alertValue").textContent = alertas.length;
  el("peakValue").textContent = proximoPico.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  el("servedValue").textContent = atendimentosHora;
  el("lastUpdate").textContent = new Date().toLocaleTimeString("pt-BR");
  el("recommendation").textContent = alertas.length
    ? `${alertas.map(unidade => unidade.nome).join(" e ")} ${alertas.length > 1 ? "estão" : "está"} com ocupação elevada. Avalie o remanejamento de equipe e acompanhe a fila.`
    : "Nenhuma unidade acima do limite de ocupação. Mantenha o acompanhamento das filas e da previsão de demanda.";

  el("unitRows").innerHTML = unidades.map(unidade => {
    const emAlerta = unidade.ocupacao >= 80;
    const status = emAlerta ? "Atenção" : unidade.ocupacao >= 65 ? "Monitorar" : "Normal";
    return `<tr>
      <th scope="row">${unidade.nome}</th>
      <td><span class="table-occupancy">${unidade.ocupacao}%</span><span class="table-meter"><i style="width:${unidade.ocupacao}%"></i></span></td>
      <td>${unidade.aguardando}</td>
      <td>${unidade.espera} min</td>
      <td><span class="status-pill ${emAlerta ? "status-alert" : unidade.ocupacao >= 65 ? "status-watch" : "status-normal"}">${status}</span></td>
    </tr>`;
  }).join("");

  const demanda = [0, 1, 2, 3, 4, 5].map((passo, index) => {
    const hora = (new Date().getHours() + passo) % 24;
    const variacao = Math.round(Math.sin((hora - 8) * Math.PI / 12) * 13);
    const altura = limitar(ocupacaoMedia + variacao + Math.round((Math.random() - 0.5) * 8), 18, 96);
    return `<div class="chart-column"><div class="chart-value">${altura}%</div><div class="chart-track"><i style="height:${altura}%"></i></div><span>${String(hora).padStart(2, "0")}h</span></div>`;
  }).join("");
  el("demandChart").innerHTML = demanda;
}

el("loginForm").addEventListener("submit", evento => {
  evento.preventDefault();
  const usuario = el("username").value.trim();
  const senha = el("password").value;

  if (usuario !== "123" || senha !== "123") {
    el("loginError").hidden = false;
    return;
  }

  el("loginError").hidden = true;
  el("loginView").hidden = true;
  el("dashboardView").hidden = false;
  atualizarPainel();
  intervalo = window.setInterval(() => {
    unidades.forEach(unidade => {
      unidade.ocupacao = limitar(unidade.ocupacao + Math.round((Math.random() - 0.48) * 5), 18, 98);
      unidade.aguardando = limitar(unidade.aguardando + Math.round((Math.random() - 0.5) * 5), 2, 80);
      unidade.espera = limitar(unidade.espera + Math.round((Math.random() - 0.5) * 7), 5, 90);
    });
    atendimentosHora = limitar(atendimentosHora + Math.round((Math.random() - 0.5) * 4), 20, 90);
    atualizarPainel();
  }, 3000);
});

el("logoutButton").addEventListener("click", () => {
  window.clearInterval(intervalo);
  el("dashboardView").hidden = true;
  el("loginView").hidden = false;
  el("loginForm").reset();
  el("username").focus();
});