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
import { Chart } from 'chart.js';

import { DashboardService } from '../../core/api/negocios.service';
import { mensagemDeErro } from '../../core/erros';
import { Dashboard } from '../../core/models';
import {
  ROTULO_FINALIDADE,
  ROTULO_STATUS_CONTRATO,
  ROTULO_STATUS_OFERTA,
} from '../../core/rotulos';
import { Estado } from '../../shared/estado';
import {
  LinhaGrafico,
  alturaDoGrafico,
  barrasHorizontais,
  linhasPorSituacao,
  somar,
} from '../../shared/graficos';

// Azul/laranja só na barra segmentada das duas finalidades
const COR_VENDA = '#1f5f4a';
const COR_ALUGUEL = '#c7843a';

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
  private readonly canvasContratos = viewChild<ElementRef<HTMLCanvasElement>>('graficoContratos');
  private graficos: Chart[] = [];

  /** Bairros do maior para o menor (barras ordenadas comparam melhor). */
  protected readonly porBairro = computed<LinhaGrafico[]>(() =>
    Object.entries(this.dados()?.imoveisPorBairro ?? {})
      .map(([rotulo, total]) => ({ rotulo, total }))
      .sort((a, b) => b.total - a.total),
  );

  /** Situações das ofertas na ordem do fluxo (pendente → cancelada). */
  protected readonly porSituacao = computed<LinhaGrafico[]>(() =>
    linhasPorSituacao(this.dados()?.ofertasPorSituacao, ROTULO_STATUS_OFERTA),
  );

  protected readonly totalOfertas = computed(() => somar(this.porSituacao()));

  /** Contratos na ordem do fluxo (rascunho → cancelado). */
  protected readonly contratosPorSituacao = computed<LinhaGrafico[]>(() =>
    linhasPorSituacao(this.dados()?.contratosPorSituacao, ROTULO_STATUS_CONTRATO),
  );

  protected readonly totalContratos = computed(() => somar(this.contratosPorSituacao()));
  protected readonly altura = alturaDoGrafico;

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
      const contratos = this.canvasContratos();
      if (!bairros || !ofertas || !contratos || !this.dados()) return;
      this.destruirGraficos();
      this.graficos.push(
        barrasHorizontais(bairros.nativeElement, this.porBairro(), 'imóveis'),
        barrasHorizontais(ofertas.nativeElement, this.porSituacao(), 'ofertas'),
        barrasHorizontais(contratos.nativeElement, this.contratosPorSituacao(), 'contratos'),
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

  private destruirGraficos(): void {
    this.graficos.forEach((g) => g.destroy());
    this.graficos = [];
  }
}
