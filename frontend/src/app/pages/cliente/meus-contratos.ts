import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ContratosService } from '../../core/api/negocios.service';
import { mensagemDeErro } from '../../core/erros';
import { Contrato } from '../../core/models';
import { ROTULO_FINALIDADE } from '../../core/rotulos';
import { ToastService } from '../../core/toast.service';
import { baixarArquivo, urlCapa } from '../../core/util';
import { Badge } from '../../shared/badge';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';

@Component({
  selector: 'app-meus-contratos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule, Estado, Badge, Icone],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Meus contratos</h1>
          <p class="texto-suave">
            Contratos enviados pela imobiliária. Baixe o PDF, leia e assine.
          </p>
        </div>
      </div>

      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="contratos().length === 0"
        mensagemVazio="Nenhum contrato por aqui ainda. Quando uma oferta sua for aceita e a imobiliária liberar o contrato, ele aparece nesta lista."
        (tentarDeNovo)="carregar()"
      >
        <div class="lista-cartoes">
          @for (c of contratos(); track c.id) {
            <article class="item-cartao">
              <a class="item-cartao-foto" [routerLink]="['/imovel', c.oferta.imovel.id]">
                @if (capa(c)) {
                  <img [src]="capa(c)" alt="" />
                } @else {
                  <div class="foto-padrao"><app-icone nome="casa" [tamanho]="28" /></div>
                }
              </a>
              <div>
                <app-badge [status]="c.status" />
                <h3>Contrato nº {{ c.id }} · {{ c.oferta.imovel.titulo }}</h3>
                <p class="item-cartao-meta">
                  <span
                    >{{ rotuloFinalidade[c.oferta.tipo] }}:
                    <strong>{{ c.oferta.valorProposto | currency: 'BRL' }}</strong></span
                  >
                  <span>Enviado em {{ c.dataAprovacao | date: 'dd/MM/yyyy' }}</span>
                  @if (c.dataAssinatura) {
                    <span>Assinado em {{ c.dataAssinatura | date: 'dd/MM/yyyy HH:mm' }}</span>
                  }
                </p>
              </div>
              <div class="item-cartao-acoes">
                <button
                  type="button"
                  class="btn btn-secundario btn-sm"
                  (click)="baixar(c)"
                  [disabled]="baixando() === c.id"
                >
                  <app-icone nome="pdf" [tamanho]="16" />
                  {{ baixando() === c.id ? 'Baixando…' : 'Baixar PDF' }}
                </button>
                @if (c.status === 'AGUARDANDO_ASSINATURA') {
                  <button
                    type="button"
                    class="btn btn-primario btn-sm"
                    (click)="abrirAssinatura(c)"
                  >
                    Assinar contrato
                  </button>
                }
              </div>
            </article>
          }
        </div>
      </app-estado>
    </div>

    <!-- Confirmação da assinatura: exige marcar que leu o contrato -->
    @if (assinando(); as c) {
      <div class="modal-fundo" (click)="assinando.set(null)">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-assinar"
          (click)="$event.stopPropagation()"
        >
          <h2 id="titulo-assinar">Assinar contrato nº {{ c.id }}</h2>
          <p>
            {{ c.oferta.imovel.titulo }} — {{ rotuloFinalidade[c.oferta.tipo] }} por
            <strong>{{ c.oferta.valorProposto | currency: 'BRL' }}</strong
            >{{ c.oferta.tipo === 'ALUGUEL' ? ' por mês' : '' }}.
          </p>
          <p class="texto-suave">
            Ao assinar, o imóvel passa a ficar
            {{ c.oferta.tipo === 'VENDA' ? 'vendido' : 'alugado' }} para você.
          </p>
          <label class="campo-check">
            <input type="checkbox" [(ngModel)]="concordo" />
            <span>Li o contrato (PDF) e concordo com os termos.</span>
          </label>
          <div class="modal-acoes">
            <button type="button" class="btn btn-secundario" (click)="assinando.set(null)">
              Voltar
            </button>
            <button
              type="button"
              class="btn btn-primario"
              [disabled]="!concordo || enviando()"
              (click)="assinar(c)"
            >
              {{ enviando() ? 'Assinando…' : 'Assinar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MeusContratos {
  private readonly api = inject(ContratosService);
  private readonly toast = inject(ToastService);

  protected readonly contratos = signal<Contrato[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly baixando = signal<number | null>(null);
  protected readonly assinando = signal<Contrato | null>(null);
  protected readonly enviando = signal(false);
  protected concordo = false;

  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.meus().subscribe({
      next: (c) => {
        this.contratos.set(c);
        this.carregando.set(false);
      },
      error: async (e) => {
        this.erro.set(await mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  protected capa(c: Contrato): string | null {
    return urlCapa(c.oferta.imovel);
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

  protected abrirAssinatura(c: Contrato): void {
    this.concordo = false;
    this.assinando.set(c);
  }

  protected assinar(c: Contrato): void {
    this.enviando.set(true);
    this.api.assinar(c.id).subscribe({
      next: () => {
        this.enviando.set(false);
        this.assinando.set(null);
        this.toast.sucesso('Contrato assinado! Parabéns pelo novo imóvel.');
        this.carregar();
      },
      error: async (e) => {
        this.enviando.set(false);
        this.assinando.set(null);
        this.toast.erro(await mensagemDeErro(e, 'O contrato'));
        this.carregar();
      },
    });
  }
}
