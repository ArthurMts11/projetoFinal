import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContratosService } from '../../core/api/negocios.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { Contrato, StatusContrato } from '../../core/models';
import { ROTULO_FINALIDADE, ROTULO_STATUS_CONTRATO } from '../../core/rotulos';
import { ToastService } from '../../core/toast.service';
import { baixarArquivo } from '../../core/util';
import { Badge } from '../../shared/badge';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';

@Component({
  selector: 'app-contratos-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, Estado, Badge, Icone],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Contratos</h1>
          <p class="texto-suave">
            Baixe o PDF, aprove e envie ao cliente (por e-mail), ou recuse/cancele.
          </p>
        </div>
      </div>

      <div class="filtro-abas barra-ferramentas" role="group" aria-label="Filtrar por situação">
        <button type="button" [class.ativo]="!filtro()" (click)="filtro.set('')">Todos</button>
        @for (s of situacoes; track s) {
          <button type="button" [class.ativo]="filtro() === s" (click)="filtro.set(s)">
            {{ rotuloStatus[s] }}
          </button>
        }
      </div>

      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="visiveis().length === 0"
        mensagemVazio="Nenhum contrato. Eles são gerados quando você aceita uma oferta."
        (tentarDeNovo)="carregar()"
      >
        <div class="tabela-envoltorio">
          <table class="tabela">
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Cliente</th>
                <th class="num">Valor</th>
                <th>Enviado</th>
                <th>Assinado</th>
                <th>Situação</th>
                <th class="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (c of visiveis(); track c.id) {
                <tr>
                  <td class="celula-principal">
                    <strong>Nº {{ c.id }}</strong> · {{ rotuloFinalidade[c.oferta.tipo] }}
                    <span class="celula-sub"
                      ><a [routerLink]="['/imovel', c.oferta.imovel.id]">{{
                        c.oferta.imovel.titulo
                      }}</a></span
                    >
                  </td>
                  <td data-rotulo="Cliente">
                    {{ c.oferta.usuario.nome
                    }}<span class="celula-sub">{{ c.oferta.usuario.email }}</span>
                  </td>
                  <td class="num" data-rotulo="Valor">
                    {{ c.oferta.valorProposto | currency: 'BRL' }}
                  </td>
                  <td data-rotulo="Enviado">
                    {{
                      c.dataAprovacao ? (c.dataAprovacao | date: 'dd/MM/yy HH:mm') : 'Não enviado'
                    }}
                  </td>
                  <td data-rotulo="Assinado">
                    {{ c.dataAssinatura ? (c.dataAssinatura | date: 'dd/MM/yy HH:mm') : '–' }}
                  </td>
                  <td data-rotulo="Situação"><app-badge [status]="c.status" /></td>
                  <td class="acoes">
                    <button
                      type="button"
                      class="btn btn-secundario btn-sm"
                      (click)="baixar(c)"
                      [disabled]="baixando() === c.id"
                    >
                      <app-icone nome="pdf" [tamanho]="15" /> PDF
                    </button>
                    @if (c.status === 'AGUARDANDO_ASSINATURA' && !c.dataAprovacao) {
                      <button type="button" class="btn btn-sucesso btn-sm" (click)="aprovar(c)">
                        Aprovar e enviar
                      </button>
                      <button
                        type="button"
                        class="btn btn-secundario btn-sm"
                        (click)="cancelar(c, true)"
                      >
                        Recusar
                      </button>
                    }
                    @if (c.status !== 'CANCELADO' && c.dataAprovacao) {
                      <button
                        type="button"
                        class="btn btn-secundario btn-sm"
                        (click)="cancelar(c, false)"
                      >
                        Cancelar
                      </button>
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
export class ContratosAdmin {
  private readonly api = inject(ContratosService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);

  protected readonly lista = signal<Contrato[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly baixando = signal<number | null>(null);
  protected readonly filtro = signal<StatusContrato | ''>('');
  protected readonly situacoes = Object.keys(ROTULO_STATUS_CONTRATO) as StatusContrato[];
  protected readonly rotuloStatus = ROTULO_STATUS_CONTRATO;
  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;

  protected readonly visiveis = computed(() =>
    this.filtro() ? this.lista().filter((c) => c.status === this.filtro()) : this.lista(),
  );

  constructor() {
    this.carregar();
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

  protected baixar(c: Contrato): void {
    this.baixando.set(c.id);
    this.api.pdf(c.id).subscribe({
      next: (blob) => {
        baixarArquivo(blob, `contrato-${c.id}.pdf`);
        this.baixando.set(null);
      },
      error: async (e) => {
        this.baixando.set(null);
        this.toast.erro(await mensagemDeErro(e, 'O contrato'));
      },
    });
  }

  protected async aprovar(c: Contrato): Promise<void> {
    const ok = await this.confirmacao.perguntar({
      titulo: 'Aprovar e enviar contrato',
      mensagem: `Aprovar o contrato nº ${c.id} e enviar para ${c.oferta.usuario.nome} (${c.oferta.usuario.email})? O cliente recebe um e-mail e poderá assinar.`,
      botao: 'Aprovar e enviar',
    });
    if (!ok) return;
    this.api.aprovar(c.id).subscribe({
      next: () => {
        this.toast.sucesso('Contrato aprovado e enviado ao cliente.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'O contrato')),
    });
  }

  /** Recusar (antes de enviar) ou cancelar (cliente desistiu): o imóvel volta a ficar disponível. */
  protected async cancelar(c: Contrato, recusa: boolean): Promise<void> {
    const ok = await this.confirmacao.perguntar({
      titulo: recusa ? 'Recusar contrato' : 'Cancelar contrato',
      mensagem: `${recusa ? 'Recusar' : 'Cancelar'} o contrato nº ${c.id}? O imóvel "${c.oferta.imovel.titulo}" volta a ficar disponível e as ofertas em espera voltam a ficar pendentes.`,
      botao: recusa ? 'Recusar contrato' : 'Cancelar contrato',
      perigo: true,
    });
    if (!ok) return;
    this.api.cancelar(c.id).subscribe({
      next: () => {
        this.toast.sucesso(
          recusa ? 'Contrato recusado.' : 'Contrato cancelado. O imóvel está disponível novamente.',
        );
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'O contrato')),
    });
  }
}
