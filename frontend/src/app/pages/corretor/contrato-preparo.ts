import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { ContratosService } from '../../core/api/negocios.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { Contrato, PreparoContrato } from '../../core/models';
import { ROTULO_FINALIDADE } from '../../core/rotulos';
import { ToastService } from '../../core/toast.service';
import { abrirPdf } from '../../core/util';
import { Badge } from '../../shared/badge';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';
import { TrilhaContrato } from '../../shared/trilha-contrato';
import { ErroCampo, diaDeVencimento } from '../../shared/validacao';

/** O que o corretor vê quando o contrato não está mais com ele. */
const AVISO_SO_LEITURA: Partial<Record<Contrato['status'], string>> = {
  EM_APROVACAO:
    'Aguardando a aprovação do administrador. Se ele devolver, o contrato volta para você.',
  AGUARDANDO_ASSINATURA: 'Aprovado. O cliente já pode assinar.',
  ASSINADO: 'Contrato assinado pelo cliente.',
  CANCELADO: 'Contrato cancelado pelo administrador.',
};

@Component({
  selector: 'app-contrato-preparo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    Estado,
    Badge,
    Icone,
    ErroCampo,
    TrilhaContrato,
  ],
  template: `
    <div class="container pagina pagina-estreita">
      <a routerLink="/corretor/contratos" class="voltar">← Contratos</a>

      <app-estado [carregando]="carregando()" [erro]="erro()" (tentarDeNovo)="carregar()">
        @if (contrato(); as c) {
          <div class="pagina-cabecalho">
            <div>
              <h1>Contrato nº {{ c.id }}</h1>
              <p class="texto-suave">
                {{ rotuloFinalidade[c.oferta.tipo] }} ·
                <a [routerLink]="['/imovel', c.oferta.imovel.id]">{{ c.oferta.imovel.titulo }}</a>
              </p>
            </div>
            <app-badge [status]="c.status" />
          </div>

          <app-trilha-contrato [status]="c.status" />

          @if (c.status === 'DEVOLVIDO' && c.motivoDevolucao) {
            <div class="alerta alerta-devolucao" role="note">
              <strong>Devolvido pelo administrador:</strong> {{ c.motivoDevolucao }}
            </div>
          }

          <section class="cartao contrato-partes" aria-label="Partes e oferta">
            <dl>
              <div>
                <dt>Cliente</dt>
                <dd>
                  {{ c.oferta.usuario.nome }}<small>{{ c.oferta.usuario.email }}</small>
                </dd>
              </div>
              <div>
                <dt>Oferta do cliente</dt>
                <dd>
                  {{ c.oferta.valorProposto | currency: 'BRL' }}
                  <small>em {{ c.oferta.createdAt | date: 'dd/MM/yyyy' }}</small>
                </dd>
              </div>
              @if (c.oferta.mensagem) {
                <div class="largo">
                  <dt>Mensagem do cliente</dt>
                  <dd>“{{ c.oferta.mensagem }}”</dd>
                </div>
              }
            </dl>
          </section>

          @if (editavel()) {
            <form class="cartao" [formGroup]="form" (ngSubmit)="salvar()" novalidate>
              <h2>Condições do contrato</h2>
              <div class="grade-form">
                <label class="campo">
                  <span>Valor final {{ c.oferta.tipo === 'ALUGUEL' ? '(por mês)' : '' }}</span>
                  <input
                    type="number"
                    formControlName="valorFinal"
                    min="0.01"
                    step="0.01"
                    inputmode="decimal"
                  />
                  <app-erro-campo [controle]="form.controls.valorFinal" nome="O valor final" />
                </label>
                @if (c.oferta.tipo === 'ALUGUEL') {
                  <label class="campo">
                    <span>Prazo (meses)</span>
                    <input
                      type="number"
                      formControlName="prazoMeses"
                      min="1"
                      max="120"
                      inputmode="numeric"
                    />
                    <app-erro-campo [controle]="form.controls.prazoMeses" nome="O prazo" />
                  </label>
                }
                <label class="campo">
                  <span>Dia de vencimento</span>
                  <input
                    type="number"
                    formControlName="diaVencimento"
                    min="1"
                    max="28"
                    inputmode="numeric"
                  />
                  <app-erro-campo
                    [controle]="form.controls.diaVencimento"
                    nome="O dia de vencimento"
                  />
                </label>
                <label class="campo largo">
                  <span>Observações do contrato <small class="texto-suave">(opcional)</small></span>
                  <textarea formControlName="observacoes" rows="3" maxlength="1000"></textarea>
                  <app-erro-campo [controle]="form.controls.observacoes" nome="As observações" />
                </label>
              </div>
              <div class="form-acoes">
                <button type="submit" class="btn btn-secundario" [disabled]="ocupado()">
                  Salvar
                </button>
                <button
                  type="button"
                  class="btn btn-primario"
                  [disabled]="ocupado()"
                  (click)="enviar()"
                >
                  Enviar para aprovação
                </button>
                <button
                  type="button"
                  class="btn btn-link"
                  [disabled]="ocupado()"
                  (click)="baixar()"
                >
                  <app-icone nome="pdf" [tamanho]="15" /> Ver PDF
                </button>
              </div>
            </form>
          } @else {
            <section class="cartao">
              <p class="aviso-leitura">{{ avisoLeitura() }}</p>
              <dl class="contrato-condicoes">
                <div>
                  <dt>Valor final</dt>
                  <dd>{{ c.valorFinal | currency: 'BRL' }}</dd>
                </div>
                @if (c.prazoMeses) {
                  <div>
                    <dt>Prazo</dt>
                    <dd>{{ c.prazoMeses }} meses</dd>
                  </div>
                }
                <div>
                  <dt>Vencimento</dt>
                  <dd>dia {{ c.diaVencimento }}</dd>
                </div>
                @if (c.observacoes) {
                  <div class="largo">
                    <dt>Observações</dt>
                    <dd>{{ c.observacoes }}</dd>
                  </div>
                }
              </dl>
              <button type="button" class="btn btn-secundario btn-sm" (click)="baixar()">
                <app-icone nome="pdf" [tamanho]="15" /> Ver PDF
              </button>
            </section>
          }
        }
      </app-estado>
    </div>
  `,
})
export class ContratoPreparo {
  /** :id da rota. */
  readonly id = input.required<string>();

  private readonly api = inject(ContratosService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);

  protected readonly contrato = signal<Contrato | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;

  protected readonly editavel = computed(() => {
    const s = this.contrato()?.status;
    return s === 'RASCUNHO' || s === 'DEVOLVIDO';
  });
  protected readonly avisoLeitura = computed(() => {
    const s = this.contrato()?.status;
    return s ? (AVISO_SO_LEITURA[s] ?? '') : '';
  });

  protected readonly form = inject(FormBuilder).group({
    valorFinal: [null as number | null, [Validators.required, Validators.min(0.01)]],
    prazoMeses: [null as number | null, [Validators.min(1), Validators.max(120)]],
    diaVencimento: [null as number | null, [Validators.required, diaDeVencimento]],
    observacoes: ['', [Validators.maxLength(1000)]],
  });

  constructor() {
    effect(() => {
      this.id();
      this.carregar();
    });
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.um(Number(this.id())).subscribe({
      next: (c) => {
        this.mostrar(c);
        this.carregando.set(false);
      },
      error: async (e) => {
        this.erro.set(await mensagemDeErro(e, 'O contrato'));
        this.carregando.set(false);
      },
    });
  }

  protected salvar(): void {
    const dados = this.dadosValidos();
    if (!dados) return;
    this.ocupado.set(true);
    this.api.preparar(this.contrato()!.id, dados).subscribe({
      next: (c) => {
        this.mostrar(c);
        this.ocupado.set(false);
        this.toast.sucesso('Contrato salvo. O PDF já tem as novas condições.');
      },
      error: (e) => this.falhou(e),
    });
  }

  /** Salva o que está no formulário e envia para o administrador aprovar. */
  protected async enviar(): Promise<void> {
    const dados = this.dadosValidos();
    if (!dados) return;
    const c = this.contrato()!;
    const ok = await this.confirmacao.perguntar({
      titulo: 'Enviar para aprovação',
      mensagem: `Enviar o contrato nº ${c.id} para o administrador aprovar? Enquanto ele analisa, você não pode alterá-lo.`,
      botao: 'Enviar para aprovação',
    });
    if (!ok) return;
    this.ocupado.set(true);
    this.api
      .preparar(c.id, dados)
      .pipe(switchMap(() => this.api.enviar(c.id)))
      .subscribe({
        next: (atualizado) => {
          this.mostrar(atualizado);
          this.ocupado.set(false);
          this.toast.sucesso('Contrato enviado para aprovação.');
        },
        error: (e) => this.falhou(e),
      });
  }

  protected baixar(): void {
    const c = this.contrato()!;
    abrirPdf(this.api.pdf(c.id), `contrato-${c.id}.pdf`, async (e) =>
      this.toast.erro(await mensagemDeErro(e, 'O contrato')),
    );
  }

  private mostrar(c: Contrato): void {
    this.contrato.set(c);
    this.form.reset({
      valorFinal: c.valorFinal,
      prazoMeses: c.prazoMeses,
      diaVencimento: c.diaVencimento,
      observacoes: c.observacoes ?? '',
    });
    // No aluguel o prazo é obrigatório; na venda o campo nem aparece
    const prazo = this.form.controls.prazoMeses;
    prazo.setValidators(
      c.oferta.tipo === 'ALUGUEL'
        ? [Validators.required, Validators.min(1), Validators.max(120)]
        : [],
    );
    prazo.updateValueAndValidity();
  }

  private dadosValidos(): PreparoContrato | null {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return null;
    }
    const v = this.form.getRawValue();
    return {
      valorFinal: v.valorFinal!,
      prazoMeses: this.contrato()!.oferta.tipo === 'ALUGUEL' ? v.prazoMeses : null,
      diaVencimento: v.diaVencimento!,
      observacoes: v.observacoes ?? '',
    };
  }

  private async falhou(e: unknown): Promise<void> {
    this.ocupado.set(false);
    this.toast.erro(await mensagemDeErro(e, 'O contrato'));
    this.carregar();
  }
}
