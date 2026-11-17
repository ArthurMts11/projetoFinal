import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);
Chart.defaults.font.family = "'Public Sans', system-ui, sans-serif";

// Uma cor só para comparar quantidades (o pinho do site)
const COR_BARRA = '#1f5f4a';
const TINTA = '#16181d';
const TINTA_SUAVE = '#5e636e';
const GRADE = '#ecece9';

export interface LinhaGrafico {
  rotulo: string;
  total: number;
}

/** Converte {"PENDENTE": 3, ...} em linhas com rótulo amigável, na ordem que veio da API. */
export function linhasPorSituacao(
  mapa: Record<string, number> | undefined,
  rotulos: Record<string, string>,
): LinhaGrafico[] {
  return Object.entries(mapa ?? {}).map(([s, total]) => ({ rotulo: rotulos[s] ?? s, total }));
}

export function somar(linhas: LinhaGrafico[]): number {
  return linhas.reduce((s, l) => s + l.total, 0);
}

/** Altura do gráfico para que cada barra tenha o mesmo espaço, com qualquer quantidade de linhas. */
export function alturaDoGrafico(linhas: LinhaGrafico[]): number {
  return 60 + linhas.length * 34;
}

export function barrasHorizontais(
  canvas: HTMLCanvasElement,
  linhas: LinhaGrafico[],
  unidade: string,
): Chart {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: linhas.map((l) => l.rotulo),
      datasets: [
        {
          data: linhas.map((l) => l.total),
          backgroundColor: COR_BARRA,
          hoverBackgroundColor: '#164536',
          borderRadius: 4,
          borderSkipped: 'start',
          maxBarThickness: 22,
          categoryPercentage: 0.8,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: TINTA,
          padding: 10,
          displayColors: false,
          callbacks: { label: (ctx) => `${ctx.parsed.x} ${unidade}` },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0, color: TINTA_SUAVE },
          grid: { color: GRADE },
          border: { display: false },
        },
        y: {
          ticks: { color: TINTA, font: { size: 13 } },
          grid: { display: false },
          border: { color: '#cfcfcb' },
        },
      },
    },
  });
}
