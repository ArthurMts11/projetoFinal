import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OfertasService } from '../../core/api/negocios.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { Oferta, StatusOferta } from '../../core/models';
import { ROTULO_FINALIDADE, ROTULO_STATUS_OFERTA } from '../../core/rotulos';
import { ToastService } from '../../core/toast.service';
import { urlCapa } from '../../core/util';
import { Badge } from '../../shared/badge';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';

// Explica cada situação para o cliente
const EXPLICACAO: Record<StatusOferta, string> = {
  PENDENTE: 'Aguardando resposta da imobiliária.',
  ACEITA: 'Sua oferta foi aceita! O contrato aparece em "Contratos" quando for liberado.',
  EM_ESPERA:
    'Outra proposta foi aceita para este imóvel. Se ela não for adiante, a sua volta a ser analisada.',
  RECUSADA: 'A imobiliária não aceitou esta proposta.',
  CANCELADA: 'Oferta cancelada.',
};

@Component({
  selector: 'app-minhas-ofertas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, Estado, Badge, Icone],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Minhas ofertas</h1>
          <p class="texto-suave">Acompanhe a situação de cada proposta enviada.</p>
        </div>
        <a routerLink="/" class="btn btn-secundario">Ver imóveis</a>
      </div>

      <div class="filtro-abas barra-ferramentas" role="group" aria-label="Filtrar por situação">
        @for (f of filtros; track f.valor) {
          <button
            type="button"
            [class.ativo]="filtro() === f.valor"
            [attr.aria-pressed]="filtro() === f.valor"
            (click)="filtro.set(f.valor)"
          >
            {{ f.rotulo }}
          </button>
        }
      </div>

      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="visiveis().length === 0"
        [mensagemVazio]="
          ofertas().length === 0
            ? 'Você ainda não fez nenhuma oferta. Encontre um imóvel e clique em “Fazer oferta”.'
            : 'Nenhuma oferta nesta situação.'
        "
        (tentarDeNovo)="carregar()"
      >
        <div class="lista-cartoes">
          @for (o of visiveis(); track o.id) {
            <article class="item-cartao">
              <a class="item-cartao-foto" [routerLink]="['/imovel', o.imovel.id]">
                @if (capa(o)) {
                  <img [src]="capa(o)" alt="" />
                } @else {
                  <div class="foto-padrao"><app-icone nome="casa" [tamanho]="28" /></div>
                }
              </a>
              <div>
                <app-badge [status]="o.status" />
                <h3>
                  <a [routerLink]="['/imovel', o.imovel.id]">{{ o.imovel.titulo }}</a>
                </h3>
                <p class="item-cartao-meta">
                  <span
                    >{{ rotuloFinalidade[o.tipo] }}:
                    <strong>{{ o.valorProposto | currency: 'BRL' }}</strong></span
                  >
                  <span>{{ o.imovel.bairro.nome }}</span>
                  <span>Enviada em {{ o.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                </p>
                <p class="texto-suave" style="margin: 6px 0 0; font-size: .88rem">
                  {{ explicacao[o.status] }}
                </p>
              </div>
              <div class="item-cartao-acoes">
                @if (o.status === 'ACEITA') {
                  <a routerLink="/cliente/contratos" class="btn btn-primario btn-sm"
                    >Ver contrato</a
                  >
                }
                @if (o.status === 'PENDENTE' || o.status === 'EM_ESPERA') {
                  <button type="button" class="btn btn-secundario btn-sm" (click)="cancelar(o)">
                    Cancelar oferta
                  </button>
                }
              </div>
            </article>
          }
        </div>
      </app-estado>
    </div>
  `,
})
export class MinhasOfertas {
  private readonly api = inject(OfertasService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);

  protected readonly ofertas = signal<Oferta[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly filtro = signal<StatusOferta | ''>('');

  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;
  protected readonly explicacao = EXPLICACAO;
  protected readonly filtros = [
    { valor: '' as const, rotulo: 'Todas' },
    ...(['PENDENTE', 'ACEITA', 'EM_ESPERA', 'RECUSADA', 'CANCELADA'] as StatusOferta[]).map(
      (s) => ({
        valor: s,
        rotulo: ROTULO_STATUS_OFERTA[s],
      }),
    ),
  ];

  protected readonly visiveis = computed(() =>
    this.filtro() ? this.ofertas().filter((o) => o.status === this.filtro()) : this.ofertas(),
  );

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.minhas().subscribe({
      next: (o) => {
        this.ofertas.set(o);
        this.carregando.set(false);
      },
      error: async (e) => {
        this.erro.set(await mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  protected capa(o: Oferta): string | null {
    return urlCapa(o.imovel);
  }

  protected async cancelar(o: Oferta): Promise<void> {
    const ok = await this.confirmacao.perguntar({
      titulo: 'Cancelar oferta',
      mensagem: `Deseja cancelar sua oferta para "${o.imovel.titulo}"?`,
      botao: 'Cancelar oferta',
      perigo: true,
    });
    if (!ok) return;
    this.api.cancelar(o.id).subscribe({
      next: () => {
        this.toast.sucesso('Oferta cancelada.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'A oferta')),
    });
  }
}
