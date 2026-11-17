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
import { finalize } from 'rxjs';

import { ContratosService } from '../../core/api/negocios.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { Contrato, StatusContrato } from '../../core/models';
import { ROTULO_FINALIDADE } from '../../core/rotulos';
import { ToastService } from '../../core/toast.service';
import { abrirPdf } from '../../core/util';
import { Badge } from '../../shared/badge';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';

interface Aba {
  chave: string;
  rotulo: string;
  status: StatusContrato[];
}

// Agrupa as situações por onde o contrato está; "Em aprovação" é o que espera o admin
const ABAS: Aba[] = [
  { chave: 'aprovacao', rotulo: 'Em aprovação', status: ['EM_APROVACAO'] },
  { chave: 'cliente', rotulo: 'Com o cliente', status: ['AGUARDANDO_ASSINATURA'] },
  { chave: 'corretor', rotulo: 'Com o corretor', status: ['RASCUNHO', 'DEVOLVIDO'] },
  { chave: 'encerrados', rotulo: 'Encerrados', status: ['ASSINADO', 'CANCELADO'] },
  { chave: 'todos', rotulo: 'Todos', status: [] },
];

const MAX_MOTIVO = 500;

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
            Confira as condições preparadas pelo corretor. Aprove para o cliente assinar ou devolva
            explicando o que corrigir.
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
          aba() === 'aprovacao'
            ? 'Nenhum contrato esperando sua aprovação.'
            : 'Nenhum contrato nesta situação.'
        "
        (tentarDeNovo)="carregar()"
      >
        <div class="tabela-envoltorio">
          <table class="tabela">
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Cliente</th>
                <th>Corretor</th>
                <th>Condições</th>
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
                    @if (c.dataEnvio && c.status === 'EM_APROVACAO') {
                      <span class="celula-sub"
                        >Enviado em {{ c.dataEnvio | date: 'dd/MM/yy HH:mm' }}</span
                      >
                    }
                  </td>
                  <td data-rotulo="Cliente">
                    {{ c.oferta.usuario.nome
                    }}<span class="celula-sub">{{ c.oferta.usuario.email }}</span>
                  </td>
                  <td data-rotulo="Corretor">{{ c.corretor?.nome ?? '–' }}</td>
                  <td data-rotulo="Condições">
                    {{ c.valorFinal ?? c.oferta.valorProposto | currency: 'BRL' }}
                    <span class="celula-sub">
                      @if (c.prazoMeses) {
                        {{ c.prazoMeses }} meses ·
                      }
                      vence dia {{ c.diaVencimento ?? '–' }}
                    </span>
                    @if (c.valorFinal !== null && c.valorFinal !== c.oferta.valorProposto) {
                      <span class="celula-sub"
                        >oferta: {{ c.oferta.valorProposto | currency: 'BRL' }}</span
                      >
                    }
                  </td>
                  <td data-rotulo="Situação"><app-badge [status]="c.status" /></td>
                  <td class="acoes">
                    <button
                      type="button"
                      class="btn btn-secundario btn-sm"
                      (click)="baixar(c)"
                      [disabled]="baixando() === c.id"
                      [attr.aria-label]="'Abrir PDF do contrato ' + c.id"
                    >
                      <app-icone nome="pdf" [tamanho]="15" /> PDF
                    </button>
                    @if (c.status === 'EM_APROVACAO') {
                      <button type="button" class="btn btn-sucesso btn-sm" (click)="aprovar(c)">
                        Aprovar
                      </button>
                      <button
                        type="button"
                        class="btn btn-secundario btn-sm"
                        (click)="abrirDevolucao(c)"
                      >
                        Devolver
                      </button>
                    }
                    @if (podeCancelar(c)) {
                      <button type="button" class="btn btn-link btn-sm" (click)="cancelar(c)">
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

    @if (devolvendo(); as c) {
      <div class="modal-fundo" (click)="fecharDevolucao()" (keydown.escape)="fecharDevolucao()">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="devolver-titulo"
          (click)="$event.stopPropagation()"
        >
          <h2 id="devolver-titulo">Devolver contrato nº {{ c.id }}</h2>
          <p>
            O contrato volta para {{ c.corretor?.nome ?? 'o corretor' }}, que verá o motivo, poderá
            corrigir e enviar de novo.
          </p>
          <label class="campo">
            <span>O que precisa ser corrigido?</span>
            <textarea
              rows="4"
              [attr.maxlength]="maxMotivo"
              [value]="motivo()"
              (input)="digitarMotivo($event)"
              [attr.aria-invalid]="erroMotivo() ? true : null"
              autofocus
            ></textarea>
            @if (erroMotivo(); as e) {
              <small class="erro-campo" role="alert">{{ e }}</small>
            }
          </label>
          <div class="modal-acoes">
            <button type="button" class="btn btn-secundario" (click)="fecharDevolucao()">
              Voltar
            </button>
            <button
              type="button"
              class="btn btn-primario"
              [disabled]="enviandoDevolucao()"
              (click)="devolver(c)"
            >
              Devolver ao corretor
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ContratosAdmin implements OnInit {
  /** ?status=EM_APROVACAO ou AGUARDANDO_ASSINATURA (os cards do painel abrem já filtrados). */
  readonly status = input<string>();

  private readonly api = inject(ContratosService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly lista = signal<Contrato[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly baixando = signal<number | null>(null);
  protected readonly aba = signal('aprovacao');
  protected readonly abas = ABAS;
  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;

  protected readonly devolvendo = signal<Contrato | null>(null);
  protected readonly motivo = signal('');
  protected readonly erroMotivo = signal<string | null>(null);
  protected readonly enviandoDevolucao = signal(false);
  protected readonly maxMotivo = MAX_MOTIVO;

  protected readonly visiveis = computed(() => {
    const aba = ABAS.find((a) => a.chave === this.aba())!;
    return aba.status.length
      ? this.lista().filter((c) => aba.status.includes(c.status))
      : this.lista();
  });

  ngOnInit(): void {
    const s = this.status();
    const doStatus = s ? ABAS.find((a) => a.status.includes(s as StatusContrato)) : undefined;
    if (doStatus) this.aba.set(doStatus.chave);
    this.carregar();
  }

  protected escolher(chave: string): void {
    this.aba.set(chave);
    this.router.navigate([], { queryParams: { status: null }, replaceUrl: true });
  }

  protected contar(aba: Aba): number {
    return aba.status.length
      ? this.lista().filter((c) => aba.status.includes(c.status)).length
      : this.lista().length;
  }

  protected podeCancelar(c: Contrato): boolean {
    return c.status !== 'ASSINADO' && c.status !== 'CANCELADO';
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
    abrirPdf(
      this.api.pdf(c.id).pipe(finalize(() => this.baixando.set(null))),
      `contrato-${c.id}.pdf`,
      async (e) => this.toast.erro(await mensagemDeErro(e, 'O contrato')),
    );
  }

  protected async aprovar(c: Contrato): Promise<void> {
    const ok = await this.confirmacao.perguntar({
      titulo: 'Aprovar contrato',
      mensagem: `Aprovar o contrato nº ${c.id}? ${c.oferta.usuario.nome} recebe um e-mail e já pode assinar em "Contratos".`,
      botao: 'Aprovar',
    });
    if (!ok) return;
    this.api.aprovar(c.id).subscribe({
      next: () => {
        this.toast.sucesso('Contrato aprovado. O cliente já pode assinar.');
        this.carregar();
      },
      error: async (e) => {
        this.toast.erro(await mensagemDeErro(e, 'O contrato'));
        this.carregar();
      },
    });
  }

  protected abrirDevolucao(c: Contrato): void {
    this.motivo.set('');
    this.erroMotivo.set(null);
    this.devolvendo.set(c);
  }

  protected fecharDevolucao(): void {
    this.devolvendo.set(null);
  }

  protected digitarMotivo(evento: Event): void {
    this.motivo.set((evento.target as HTMLTextAreaElement).value);
    if (this.erroMotivo()) this.erroMotivo.set(null);
  }

  protected devolver(c: Contrato): void {
    const motivo = this.motivo().trim();
    if (!motivo) {
      this.erroMotivo.set('Informe o motivo da devolução.');
      return;
    }
    this.enviandoDevolucao.set(true);
    this.api.devolver(c.id, motivo).subscribe({
      next: () => {
        this.enviandoDevolucao.set(false);
        this.devolvendo.set(null);
        this.toast.sucesso('Contrato devolvido ao corretor.');
        this.carregar();
      },
      error: async (e) => {
        this.enviandoDevolucao.set(false);
        this.erroMotivo.set(await mensagemDeErro(e, 'O contrato'));
      },
    });
  }

  /** Cliente desistiu ou o negócio não vai seguir: o imóvel volta a ficar disponível. */
  protected async cancelar(c: Contrato): Promise<void> {
    const ok = await this.confirmacao.perguntar({
      titulo: 'Cancelar contrato',
      mensagem: `Cancelar o contrato nº ${c.id}? O imóvel "${c.oferta.imovel.titulo}" volta a ficar disponível e as ofertas em espera voltam a ficar pendentes.`,
      botao: 'Cancelar contrato',
      perigo: true,
    });
    if (!ok) return;
    this.api.cancelar(c.id).subscribe({
      next: () => {
        this.toast.sucesso('Contrato cancelado. O imóvel está disponível novamente.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'O contrato')),
    });
  }
}
