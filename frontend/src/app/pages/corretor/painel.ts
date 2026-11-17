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
import { DashboardCorretor } from '../../core/models';
import { ROTULO_STATUS_CONTRATO, ROTULO_STATUS_OFERTA } from '../../core/rotulos';
import { Estado } from '../../shared/estado';
import {
  LinhaGrafico,
  alturaDoGrafico,
  barrasHorizontais,
  linhasPorSituacao,
  somar,
} from '../../shared/graficos';

@Component({
  selector: 'app-painel-corretor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Estado],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Painel do corretor</h1>
          <p class="texto-suave">O que está esperando por você agora.</p>
        </div>
        <button type="button" class="btn btn-secundario" (click)="carregar()">Atualizar</button>
      </div>

      <app-estado [carregando]="carregando()" [erro]="erro()" (tentarDeNovo)="carregar()">
        @if (dados(); as d) {
          <div class="kpis">
            <a class="kpi" routerLink="/corretor/ofertas" [queryParams]="{ status: 'PENDENTE' }">
              <p class="kpi-rotulo">Ofertas pendentes</p>
              <p class="kpi-valor">{{ d.ofertasPendentes }}</p>
              <p class="kpi-detalhe">aceite ou recuse</p>
            </a>
            <a class="kpi" routerLink="/corretor/contratos" [queryParams]="{ aba: 'preparar' }">
              <p class="kpi-rotulo">Contratos para preparar</p>
              <p class="kpi-valor">{{ d.contratosParaPreparar }}</p>
              <p class="kpi-detalhe">rascunhos e devolvidos</p>
            </a>
            <a class="kpi" routerLink="/corretor/contratos" [queryParams]="{ aba: 'aprovacao' }">
              <p class="kpi-rotulo">Em aprovação</p>
              <p class="kpi-valor">{{ d.contratosEmAprovacao }}</p>
              <p class="kpi-detalhe">com o administrador</p>
            </a>
          </div>

          <div class="graficos">
            <section class="cartao grafico-cartao" aria-labelledby="gc-ofertas">
              <h2 id="gc-ofertas">Ofertas por situação</h2>
              <p class="texto-suave" style="margin: 0 0 8px">{{ total(ofertas()) }} no total</p>
              <div class="grafico-area" [style.height.px]="altura(ofertas())">
                <canvas
                  #graficoOfertas
                  role="img"
                  aria-label="Gráfico de barras: quantidade de ofertas por situação"
                ></canvas>
              </div>
              <details>
                <summary>Ver como tabela</summary>
                <table class="tabela">
                  <thead>
                    <tr>
                      <th>Situação</th>
                      <th class="num">Ofertas</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (l of ofertas(); track l.rotulo) {
                      <tr>
                        <td>{{ l.rotulo }}</td>
                        <td class="num">{{ l.total }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </details>
            </section>

            <section class="cartao grafico-cartao" aria-labelledby="gc-contratos">
              <h2 id="gc-contratos">Contratos por situação</h2>
              <p class="texto-suave" style="margin: 0 0 8px">{{ total(contratos()) }} no total</p>
              <div class="grafico-area" [style.height.px]="altura(contratos())">
                <canvas
                  #graficoContratos
                  role="img"
                  aria-label="Gráfico de barras: quantidade de contratos por situação"
                ></canvas>
              </div>
              <details>
                <summary>Ver como tabela</summary>
                <table class="tabela">
                  <thead>
                    <tr>
                      <th>Situação</th>
                      <th class="num">Contratos</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (l of contratos(); track l.rotulo) {
                      <tr>
                        <td>{{ l.rotulo }}</td>
                        <td class="num">{{ l.total }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </details>
            </section>
          </div>
        }
      </app-estado>
    </div>
  `,
})
export class PainelCorretor {
  private readonly api = inject(DashboardService);

  protected readonly dados = signal<DashboardCorretor | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly altura = alturaDoGrafico;
  protected readonly total = somar;

  protected readonly ofertas = computed<LinhaGrafico[]>(() =>
    linhasPorSituacao(this.dados()?.ofertasPorSituacao, ROTULO_STATUS_OFERTA),
  );
  protected readonly contratos = computed<LinhaGrafico[]>(() =>
    linhasPorSituacao(this.dados()?.contratosPorSituacao, ROTULO_STATUS_CONTRATO),
  );

  private readonly canvasOfertas = viewChild<ElementRef<HTMLCanvasElement>>('graficoOfertas');
  private readonly canvasContratos = viewChild<ElementRef<HTMLCanvasElement>>('graficoContratos');
  private graficos: Chart[] = [];

  constructor() {
    this.carregar();
    effect(() => {
      const ofertas = this.canvasOfertas();
      const contratos = this.canvasContratos();
      if (!ofertas || !contratos || !this.dados()) return;
      this.destruirGraficos();
      this.graficos.push(
        barrasHorizontais(ofertas.nativeElement, this.ofertas(), 'ofertas'),
        barrasHorizontais(contratos.nativeElement, this.contratos(), 'contratos'),
      );
    });
    inject(DestroyRef).onDestroy(() => this.destruirGraficos());
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.resumoCorretor().subscribe({
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
