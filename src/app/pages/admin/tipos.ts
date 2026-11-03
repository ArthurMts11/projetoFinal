import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { TiposImovelService } from '../../core/api/cadastros.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { TipoImovel } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';
import { ErroCampo } from '../../shared/validacao';

@Component({
  selector: 'app-tipos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Estado, Icone, ErroCampo],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Tipos de imóveis</h1>
          <p class="texto-suave">Casa, apartamento, terreno…</p>
        </div>
        <button type="button" class="btn btn-primario" (click)="novo()">
          <app-icone nome="mais" /> Novo tipo
        </button>
      </div>

      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="lista().length === 0"
        mensagemVazio="Nenhum tipo cadastrado."
        (tentarDeNovo)="carregar()"
      >
        <div class="tabela-envoltorio">
          <table class="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th class="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (t of lista(); track t.id) {
                <tr>
                  <td class="celula-principal">
                    <strong>{{ t.nome }}</strong>
                  </td>
                  <td data-rotulo="Descrição">{{ t.descricao || '–' }}</td>
                  <td class="acoes">
                    <button type="button" class="btn btn-secundario btn-sm" (click)="editar(t)">
                      <app-icone nome="editar" [tamanho]="15" /> Editar
                    </button>
                    <button type="button" class="btn btn-secundario btn-sm" (click)="excluir(t)">
                      <app-icone nome="lixo" [tamanho]="15" /> Excluir
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-estado>
    </div>

    @if (formAberto()) {
      <div class="modal-fundo" (click)="formAberto.set(false)">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-tipo"
          (click)="$event.stopPropagation()"
        >
          <h2 id="titulo-tipo">{{ editando() ? 'Editar tipo' : 'Novo tipo' }}</h2>
          <form [formGroup]="form" (ngSubmit)="salvar()" novalidate>
            <label class="campo"
              ><span>Nome *</span><input formControlName="nome" />
              <app-erro-campo [controle]="form.controls.nome" nome="O nome"
            /></label>
            <label class="campo"
              ><span>Descrição</span><textarea formControlName="descricao" rows="3"></textarea>
              <app-erro-campo [controle]="form.controls.descricao" nome="A descrição"
            /></label>
            @if (erroSalvar()) {
              <div class="alerta alerta-erro" role="alert">{{ erroSalvar() }}</div>
            }
            <div class="modal-acoes">
              <button type="button" class="btn btn-secundario" (click)="formAberto.set(false)">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primario" [disabled]="salvando()">
                {{ salvando() ? 'Salvando…' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class Tipos {
  private readonly api = inject(TiposImovelService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);

  protected readonly lista = signal<TipoImovel[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly formAberto = signal(false);
  protected readonly editando = signal<TipoImovel | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erroSalvar = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    descricao: ['', [Validators.maxLength(1000)]],
  });

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listar().subscribe({
      next: (l) => {
        this.lista.set([...l].sort((a, b) => a.nome.localeCompare(b.nome)));
        this.carregando.set(false);
      },
      error: async (e) => {
        this.erro.set(await mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  protected novo(): void {
    this.editando.set(null);
    this.form.reset();
    this.erroSalvar.set(null);
    this.formAberto.set(true);
  }

  protected editar(t: TipoImovel): void {
    this.editando.set(t);
    this.form.reset({ nome: t.nome, descricao: t.descricao ?? '' });
    this.erroSalvar.set(null);
    this.formAberto.set(true);
  }

  protected salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const atual = this.editando();
    this.salvando.set(true);
    const dados: TipoImovel = { nome: v.nome.trim(), descricao: v.descricao };
    (atual ? this.api.atualizar(atual.id!, dados) : this.api.criar(dados)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.toast.sucesso(atual ? 'Tipo atualizado.' : 'Tipo cadastrado.');
        this.carregar();
      },
      error: async (e) => {
        this.salvando.set(false);
        this.erroSalvar.set(await mensagemDeErro(e, 'O tipo'));
      },
    });
  }

  protected async excluir(t: TipoImovel): Promise<void> {
    if (!(await this.confirmacao.excluir(`o tipo "${t.nome}"`))) return;
    this.api.excluir(t.id!).subscribe({
      next: () => {
        this.toast.sucesso('Tipo excluído.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'O tipo')),
    });
  }
}
