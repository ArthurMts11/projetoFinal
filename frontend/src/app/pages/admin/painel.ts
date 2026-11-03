import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';

import { DashboardService } from '../../core/api/negocios.service';
import { mensagemDeErro } from '../../core/erros';
import { Dashboard, StatusOferta } from '../../core/models';
import { ROTULO_FINALIDADE, ROTULO_STATUS_OFERTA } from '../../core/rotulos';
import { Estado } from '../../shared/estado';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

// Cores dos gráficos: uma cor só para comparar quantidades; azul/laranja para as duas finalidades
const COR_BARRA = '#2a78d6';
const COR_VENDA = '#2a78d6';
const COR_ALUGUEL = '#eb6834';
const TINTA_SUAVE = '#5b6b7b';
const GRADE = '#edf0f3';

interface Linha {
  rotulo: string;
  total: number;
}

@Component({
  selector: 'app-painel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Estado],
  templateUrl: './painel.html',
})
export class Painel {
  private readonly api = inject(DashboardService);

  protected readonly dados = signal<Dashboard | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  private readonly canvasBairros = viewChild<ElementRef<HTMLCanvasElement>>('graficoBairros');
  private readonly canvasOfertas = viewChild<ElementRef<HTMLCanvasElement>>('graficoOfertas');
  private graficos: Chart[] = [];

  /** Bairros do maior para o menor (barras ordenadas comparam melhor). */
  protected readonly porBairro = computed<Linha[]>(() =>
    Object.entries(this.dados()?.imoveisPorBairro ?? {})
      .map(([rotulo, total]) => ({ rotulo, total }))
      .sort((a, b) => b.total - a.total),
  );

  /** Situações das ofertas na ordem do fluxo (pendente → cancelada). */
  protected readonly porSituacao = computed<Linha[]>(() =>
    Object.entries(this.dados()?.ofertasPorSituacao ?? {}).map(([s, total]) => ({
      rotulo: ROTULO_STATUS_OFERTA[s as StatusOferta] ?? s,
      total,
    })),
  );

  protected readonly totalOfertas = computed(() =>
    this.porSituacao().reduce((s, l) => s + l.total, 0),
  );

  /** Partes da barra segmentada de finalidade, com a porcentagem de cada uma. */
  protected readonly porFinalidade = computed(() => {
    const mapa = this.dados()?.imoveisPorFinalidade ?? {};
    const total = Object.values(mapa).reduce((s, n) => s + n, 0);
    return Object.entries(mapa).map(([f, n]) => ({
      rotulo: ROTULO_FINALIDADE[f] ?? f,
      total: n,
      pct: total ? Math.round((n / total) * 100) : 0,
      cor: f === 'VENDA' ? COR_VENDA : COR_ALUGUEL,
    }));
  });

  protected readonly descricaoFinalidade = computed(() =>
    this.porFinalidade()
      .map((p) => `${p.rotulo} ${p.total} (${p.pct}%)`)
      .join(', '),
  );

  constructor() {
    this.carregar();
    // Desenha os gráficos quando os dados e os <canvas> existem
    effect(() => {
      const bairros = this.canvasBairros();
      const ofertas = this.canvasOfertas();
      if (!bairros || !ofertas || !this.dados()) return;
      this.destruirGraficos();
      this.graficos.push(
        this.barrasHorizontais(bairros.nativeElement, this.porBairro(), 'imóveis'),
      );
      this.graficos.push(
        this.barrasHorizontais(ofertas.nativeElement, this.porSituacao(), 'ofertas'),
      );
    });
    inject(DestroyRef).onDestroy(() => this.destruirGraficos());
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.resumo().subscribe({
      next: (d) => {
        this.dados.set(d);
        this.carregando.set(false);
      },
      error: async (e) => {
        this.erro.set(await mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  private barrasHorizontais(canvas: HTMLCanvasElement, linhas: Linha[], unidade: string): Chart {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: linhas.map((l) => l.rotulo),
        datasets: [
          {
            data: linhas.map((l) => l.total),
            backgroundColor: COR_BARRA,
            hoverBackgroundColor: '#1f5fae',
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
            backgroundColor: '#1b2a3a',
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
            ticks: { color: '#1b2a3a', font: { size: 13 } },
            grid: { display: false },
            border: { color: '#c3ccd5' },
          },
        },
      },
    });
  }

  private destruirGraficos(): void {
    this.graficos.forEach((g) => g.destroy());
    this.graficos = [];
  }
}
