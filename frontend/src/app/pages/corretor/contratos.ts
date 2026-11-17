import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ContratosService } from '../../core/api/negocios.service';
import { mensagemDeErro } from '../../core/erros';
import { Contrato, StatusContrato } from '../../core/models';
import { ROTULO_FINALIDADE } from '../../core/rotulos';
import { Badge } from '../../shared/badge';
import { Estado } from '../../shared/estado';

interface Aba {
  chave: string;
  rotulo: string;
  status: StatusContrato[];
}

// Agrupa as situações pelo que o corretor precisa fazer
const ABAS: Aba[] = [
  { chave: 'todos', rotulo: 'Todos', status: [] },
  { chave: 'preparar', rotulo: 'Para preparar', status: ['RASCUNHO', 'DEVOLVIDO'] },
  { chave: 'aprovacao', rotulo: 'Em aprovação', status: ['EM_APROVACAO'] },
  { chave: 'cliente', rotulo: 'Com o cliente', status: ['AGUARDANDO_ASSINATURA'] },
  { chave: 'encerrados', rotulo: 'Encerrados', status: ['ASSINADO', 'CANCELADO'] },
];

@Component({
  selector: 'app-contratos-corretor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, Estado, Badge],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Contratos</h1>
          <p class="texto-suave">
            Complete as condições de cada contrato e envie para o administrador aprovar.
          </p>
        </div>
      </div>

      <div class="filtro-abas" role="group" aria-label="Filtrar contratos">
        @for (a of abas; track a.chave) {
          <button
            type="button"
            [class.ativo]="aba() === a.chave"
            [attr.aria-pressed]="aba() === a.chave"
            (click)="escolher(a.chave)"
          >
            {{ a.rotulo }}
            @if (!carregando()) {
              <span class="aba-contagem">{{ contar(a) }}</span>
            }
          </button>
        }
      </div>

      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="visiveis().length === 0"
        [mensagemVazio]="
          lista().length === 0
            ? 'Os contratos aparecem aqui quando você aceita uma oferta.'
            : 'Nenhum contrato nesta situação.'
        "
        (tentarDeNovo)="carregar()"
      >
        @if (lista().length === 0) {
          <a
            vazio
            routerLink="/corretor/ofertas"
            [queryParams]="{ status: 'PENDENTE' }"
            class="btn btn-primario btn-sm"
          >
            Ver ofertas pendentes
          </a>
        }
        <div class="tabela-envoltorio">
          <table class="tabela">
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Cliente</th>
                <th class="num">Valor final</th>
                <th>Gerado em</th>
                <th>Situação</th>
                <th class="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (c of visiveis(); track c.id) {
                <tr>
                  <td class="celula-principal">
                    <strong>Nº {{ c.id }}</strong> · {{ rotuloFinalidade[c.oferta.tipo] }}
                    <span class="celula-sub">{{ c.oferta.imovel.titulo }}</span>
                    @if (c.status === 'DEVOLVIDO' && c.motivoDevolucao) {
                      <span class="celula-sub celula-devolucao"
                        >Devolvido: {{ c.motivoDevolucao }}</span
                      >
                    }
                  </td>
                  <td data-rotulo="Cliente">{{ c.oferta.usuario.nome }}</td>
                  <td class="num" data-rotulo="Valor final">
                    {{ c.valorFinal ?? c.oferta.valorProposto | currency: 'BRL' }}
                  </td>
                  <td data-rotulo="Gerado em">{{ c.createdAt | date: 'dd/MM/yy' }}</td>
                  <td data-rotulo="Situação"><app-badge [status]="c.status" /></td>
                  <td class="acoes">
                    <a
                      [routerLink]="['/corretor/contratos', c.id]"
                      class="btn btn-sm"
                      [class.btn-primario]="paraPreparar(c)"
                      [class.btn-secundario]="!paraPreparar(c)"
                    >
                      {{ paraPreparar(c) ? 'Preparar' : 'Ver' }}
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-estado>
    </div>
  `,
})
export class ContratosCorretor implements OnInit {
  /** ?aba=preparar (o card do painel abre já filtrado). */
  readonly abaInicial = input<string>(undefined, { alias: 'aba' });

  private readonly api = inject(ContratosService);
  private readonly router = inject(Router);

  protected readonly lista = signal<Contrato[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly aba = signal('todos');
  protected readonly abas = ABAS;
  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;

  protected readonly visiveis = computed(() => {
    const aba = ABAS.find((a) => a.chave === this.aba())!;
    return aba.status.length
      ? this.lista().filter((c) => aba.status.includes(c.status))
      : this.lista();
  });

  ngOnInit(): void {
    const inicial = this.abaInicial();
    if (inicial && ABAS.some((a) => a.chave === inicial)) this.aba.set(inicial);
    this.carregar();
  }

  protected escolher(chave: string): void {
    this.aba.set(chave);
    this.router.navigate([], {
      queryParams: { aba: chave === 'todos' ? null : chave },
      replaceUrl: true,
    });
  }

  protected contar(aba: Aba): number {
    return aba.status.length
      ? this.lista().filter((c) => aba.status.includes(c.status)).length
      : this.lista().length;
  }

  protected paraPreparar(c: Contrato): boolean {
    return c.status === 'RASCUNHO' || c.status === 'DEVOLVIDO';
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.todos().subscribe({
      next: (l) => {
        this.lista.set(l);
        this.carregando.set(false);
      },
      error: async (e) => {
        this.erro.set(await mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }
}
