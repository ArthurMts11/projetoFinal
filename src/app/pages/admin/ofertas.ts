import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { OfertasService } from '../../core/api/negocios.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { Oferta, StatusOferta } from '../../core/models';
import { ROTULO_FINALIDADE, ROTULO_STATUS_OFERTA } from '../../core/rotulos';
import { ToastService } from '../../core/toast.service';
import { precoDoImovel } from '../../core/util';
import { Badge } from '../../shared/badge';
import { Estado } from '../../shared/estado';

const SITUACOES: StatusOferta[] = ['PENDENTE', 'ACEITA', 'EM_ESPERA', 'RECUSADA', 'CANCELADA'];

@Component({
  selector: 'app-ofertas-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, Estado, Badge],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Ofertas</h1>
          <p class="texto-suave">Aceite ou recuse as propostas dos clientes.</p>
        </div>
      </div>

      <div class="filtro-abas barra-ferramentas" role="group" aria-label="Filtrar por situação">
        <button type="button" [class.ativo]="!filtro()" (click)="filtrar('')">Todas</button>
        @for (s of situacoes; track s) {
          <button
            type="button"
            [class.ativo]="filtro() === s"
            [attr.aria-pressed]="filtro() === s"
            (click)="filtrar(s)"
          >
            {{ rotuloStatus[s] }}
          </button>
        }
      </div>

      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="lista().length === 0"
        [mensagemVazio]="
          filtro() ? 'Nenhuma oferta ' + rotuloFiltro() + '.' : 'Nenhuma oferta recebida ainda.'
        "
        (tentarDeNovo)="carregar()"
      >
        <div class="tabela-envoltorio">
          <table class="tabela">
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th class="num">Proposta</th>
                <th>Data</th>
                <th>Situação</th>
                <th class="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (o of lista(); track o.id) {
                <tr>
                  <td class="celula-principal">
                    <a [routerLink]="['/imovel', o.imovel.id]">{{ o.imovel.titulo }}</a>
                    <span class="celula-sub"
                      >Cód. {{ o.imovel.id }} · anunciado por {{ preco(o) | currency: 'BRL' }}</span
                    >
                    @if (o.mensagem) {
                      <span class="celula-sub">“{{ o.mensagem }}”</span>
                    }
                  </td>
                  <td data-rotulo="Cliente">
                    {{ o.usuario.nome }}<span class="celula-sub">{{ o.usuario.email }}</span>
                  </td>
                  <td data-rotulo="Tipo">{{ rotuloFinalidade[o.tipo] }}</td>
                  <td class="num" data-rotulo="Proposta">
                    {{ o.valorProposto | currency: 'BRL' }}
                  </td>
                  <td data-rotulo="Data">{{ o.createdAt | date: 'dd/MM/yy HH:mm' }}</td>
                  <td data-rotulo="Situação"><app-badge [status]="o.status" /></td>
                  <td class="acoes">
                    @if (o.status === 'PENDENTE') {
                      <button type="button" class="btn btn-sucesso btn-sm" (click)="aceitar(o)">
                        Aceitar
                      </button>
                    }
                    @if (o.status === 'PENDENTE' || o.status === 'EM_ESPERA') {
                      <button type="button" class="btn btn-secundario btn-sm" (click)="recusar(o)">
                        Recusar
                      </button>
                    }
                    @if (o.status === 'ACEITA') {
                      <a routerLink="/admin/contratos" class="btn btn-secundario btn-sm"
                        >Ver contrato</a
                      >
                    }
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
export class OfertasAdmin implements OnInit {
  /** ?status=PENDENTE (o card do painel abre já filtrado). */
  readonly status = input<string>();

  private readonly api = inject(OfertasService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly lista = signal<Oferta[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly filtro = signal<StatusOferta | ''>('');
  protected readonly situacoes = SITUACOES;
  protected readonly rotuloStatus = ROTULO_STATUS_OFERTA;
  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;

  protected rotuloFiltro(): string {
    const f = this.filtro();
    return f ? ROTULO_STATUS_OFERTA[f].toLowerCase() : '';
  }

  ngOnInit(): void {
    const s = this.status();
    if (s && (SITUACOES as string[]).includes(s)) this.filtro.set(s as StatusOferta);
    this.carregar();
  }

  protected filtrar(s: StatusOferta | ''): void {
    this.filtro.set(s);
    this.router.navigate([], { queryParams: { status: s || null }, replaceUrl: true });
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.todas(this.filtro()).subscribe({
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

  protected preco(o: Oferta): number | null {
    return precoDoImovel(o.imovel);
  }

  protected async aceitar(o: Oferta): Promise<void> {
    const ok = await this.confirmacao.perguntar({
      titulo: 'Aceitar oferta',
      mensagem: `Aceitar a oferta de ${o.usuario.nome} para "${o.imovel.titulo}"? O imóvel ficará reservado, as outras ofertas pendentes dele ficarão em espera e o contrato será gerado.`,
      botao: 'Aceitar oferta',
    });
    if (!ok) return;
    this.api.aceitar(o.id).subscribe({
      next: () => {
        this.toast.sucesso(
          'Oferta aceita. O contrato foi gerado e aguarda sua aprovação em "Contratos".',
        );
        this.carregar();
      },
      error: async (e) => {
        this.toast.erro(await mensagemDeErro(e, 'A oferta'));
        this.carregar();
      },
    });
  }

  protected async recusar(o: Oferta): Promise<void> {
    const ok = await this.confirmacao.perguntar({
      titulo: 'Recusar oferta',
      mensagem: `Recusar a oferta de ${o.usuario.nome} para "${o.imovel.titulo}"?`,
      botao: 'Recusar',
      perigo: true,
    });
    if (!ok) return;
    this.api.recusar(o.id).subscribe({
      next: () => {
        this.toast.sucesso('Oferta recusada.');
        this.carregar();
      },
      error: async (e) => {
        this.toast.erro(await mensagemDeErro(e, 'A oferta'));
        this.carregar();
      },
    });
  }
}
