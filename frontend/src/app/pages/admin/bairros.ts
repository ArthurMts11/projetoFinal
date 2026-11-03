import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { BairrosService } from '../../core/api/cadastros.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { Bairro } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';
import { ErroCampo } from '../../shared/validacao';

const CEP = /^\d{5}-?\d{3}$/;

@Component({
  selector: 'app-bairros',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule, Estado, Icone, ErroCampo],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Bairros</h1>
          <p class="texto-suave">Bairros usados no cadastro e nos filtros da vitrine.</p>
        </div>
        <button type="button" class="btn btn-primario" (click)="novo()">
          <app-icone nome="mais" /> Novo bairro
        </button>
      </div>

      <div class="barra-ferramentas">
        <input
          type="search"
          placeholder="Filtrar por nome ou cidade…"
          [ngModel]="filtro()"
          (ngModelChange)="filtro.set($event)"
          aria-label="Filtrar bairros"
        />
      </div>

      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="visiveis().length === 0"
        mensagemVazio="Nenhum bairro encontrado."
        (tentarDeNovo)="carregar()"
      >
        <div class="tabela-envoltorio">
          <table class="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade / UF</th>
                <th>Faixa de CEP</th>
                <th class="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (b of visiveis(); track b.id) {
                <tr>
                  <td class="celula-principal">
                    <strong>{{ b.nome }}</strong>
                  </td>
                  <td data-rotulo="Cidade / UF">{{ b.cidade }} / {{ b.estado }}</td>
                  <td data-rotulo="CEP">{{ b.cepInicial || '–' }} a {{ b.cepFinal || '–' }}</td>
                  <td class="acoes">
                    <button type="button" class="btn btn-secundario btn-sm" (click)="editar(b)">
                      <app-icone nome="editar" [tamanho]="15" /> Editar
                    </button>
                    <button type="button" class="btn btn-secundario btn-sm" (click)="excluir(b)">
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
      <div class="modal-fundo" (click)="fechar()">
        <div
          class="modal largo"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-bairro"
          (click)="$event.stopPropagation()"
        >
          <h2 id="titulo-bairro">{{ editando() ? 'Editar bairro' : 'Novo bairro' }}</h2>
          <form [formGroup]="form" (ngSubmit)="salvar()" novalidate>
            <div class="grade-form">
              <label class="campo largo"
                ><span>Nome *</span><input formControlName="nome" />
                <app-erro-campo [controle]="form.controls.nome" nome="O nome"
              /></label>
              <label class="campo"
                ><span>Cidade *</span><input formControlName="cidade" />
                <app-erro-campo [controle]="form.controls.cidade" nome="A cidade"
              /></label>
              <label class="campo"
                ><span>UF *</span
                ><input
                  formControlName="estado"
                  maxlength="2"
                  placeholder="PR"
                  style="text-transform: uppercase" />
                <app-erro-campo [controle]="form.controls.estado" nome="A UF"
              /></label>
              <label class="campo"
                ><span>CEP inicial</span
                ><input formControlName="cepInicial" placeholder="00000-000" maxlength="9" />
                <app-erro-campo [controle]="form.controls.cepInicial" nome="O CEP inicial"
              /></label>
              <label class="campo"
                ><span>CEP final</span
                ><input formControlName="cepFinal" placeholder="00000-000" maxlength="9" />
                <app-erro-campo [controle]="form.controls.cepFinal" nome="O CEP final"
              /></label>
            </div>
            @if (erroSalvar()) {
              <div class="alerta alerta-erro" role="alert">{{ erroSalvar() }}</div>
            }
            <div class="modal-acoes">
              <button type="button" class="btn btn-secundario" (click)="fechar()">Cancelar</button>
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
export class Bairros {
  private readonly api = inject(BairrosService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);

  protected readonly lista = signal<Bairro[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly filtro = signal('');
  protected readonly formAberto = signal(false);
  protected readonly editando = signal<Bairro | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erroSalvar = signal<string | null>(null);

  protected readonly visiveis = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    return this.lista()
      .filter((b) => !f || b.nome.toLowerCase().includes(f) || b.cidade?.toLowerCase().includes(f))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    cidade: ['', [Validators.required, Validators.maxLength(100)]],
    estado: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    cepInicial: ['', [Validators.pattern(CEP)]],
    cepFinal: ['', [Validators.pattern(CEP)]],
  });

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listar().subscribe({
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

  protected novo(): void {
    this.editando.set(null);
    this.form.reset();
    this.erroSalvar.set(null);
    this.formAberto.set(true);
  }

  protected editar(b: Bairro): void {
    this.editando.set(b);
    this.form.reset({
      nome: b.nome,
      cidade: b.cidade,
      estado: b.estado,
      cepInicial: b.cepInicial ?? '',
      cepFinal: b.cepFinal ?? '',
    });
    this.erroSalvar.set(null);
    this.formAberto.set(true);
  }

  protected fechar(): void {
    this.formAberto.set(false);
  }

  protected salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const dados: Bairro = {
      ...v,
      nome: v.nome.trim(),
      cidade: v.cidade.trim(),
      estado: v.estado.toUpperCase(),
    };
    this.salvando.set(true);
    const atual = this.editando();
    (atual ? this.api.atualizar(atual.id!, dados) : this.api.criar(dados)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.toast.sucesso(atual ? 'Bairro atualizado.' : 'Bairro cadastrado.');
        this.carregar();
      },
      error: async (e) => {
        this.salvando.set(false);
        this.erroSalvar.set(await mensagemDeErro(e, 'O bairro'));
      },
    });
  }

  protected async excluir(b: Bairro): Promise<void> {
    if (!(await this.confirmacao.excluir(`o bairro "${b.nome}"`))) return;
    this.api.excluir(b.id!).subscribe({
      next: () => {
        this.toast.sucesso('Bairro excluído.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'O bairro')),
    });
  }
}
