import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { UsuariosService } from '../../core/api/negocios.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { Perfil, Usuario } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';
import { ErroCampo, emailValido } from '../../shared/validacao';

@Component({
  selector: 'app-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Estado, Icone, ErroCampo],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Usuários</h1>
          <p class="texto-suave">Cadastre, edite, troque o perfil e exclua usuários.</p>
        </div>
        <button type="button" class="btn btn-primario" (click)="novo()">
          <app-icone nome="mais" /> Novo usuário
        </button>
      </div>

      <div class="barra-ferramentas">
        <input
          type="search"
          [formControl]="busca"
          placeholder="Buscar por nome ou e-mail…"
          aria-label="Buscar usuários"
        />
      </div>

      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="lista().length === 0"
        [mensagemVazio]="
          busca.value ? 'Nenhum usuário com “' + busca.value + '”.' : 'Nenhum usuário cadastrado.'
        "
        (tentarDeNovo)="carregar()"
      >
        <div class="tabela-envoltorio">
          <table class="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th class="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (u of lista(); track u.id) {
                <tr>
                  <td class="celula-principal">
                    <strong>{{ u.nome }}</strong>
                    @if (ehVoce(u)) {
                      <span class="badge badge-info">Você</span>
                    }
                  </td>
                  <td data-rotulo="E-mail">{{ u.email }}</td>
                  <td data-rotulo="Perfil">
                    <span
                      class="badge"
                      [class.badge-alerta]="u.tipo === 'ADMIN'"
                      [class.badge-neutro]="u.tipo !== 'ADMIN'"
                    >
                      {{ u.tipo === 'ADMIN' ? 'Admin' : 'Cliente' }}</span
                    >
                  </td>
                  <td class="acoes">
                    <button
                      type="button"
                      class="btn btn-secundario btn-sm"
                      (click)="trocarPerfil(u)"
                      [disabled]="ehVoce(u)"
                      [title]="ehVoce(u) ? 'Você não pode alterar o seu próprio perfil' : ''"
                    >
                      Tornar {{ u.tipo === 'ADMIN' ? 'cliente' : 'admin' }}
                    </button>
                    <button type="button" class="btn btn-secundario btn-sm" (click)="editar(u)">
                      <app-icone nome="editar" [tamanho]="15" /> Editar
                    </button>
                    <!-- Um admin não pode excluir a si mesmo -->
                    <button
                      type="button"
                      class="btn btn-secundario btn-sm"
                      (click)="excluir(u)"
                      [disabled]="ehVoce(u)"
                      [title]="ehVoce(u) ? 'Você não pode excluir o seu próprio usuário' : ''"
                    >
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
          aria-labelledby="titulo-usuario"
          (click)="$event.stopPropagation()"
        >
          <h2 id="titulo-usuario">{{ editando() ? 'Editar usuário' : 'Novo usuário' }}</h2>
          <form [formGroup]="form" (ngSubmit)="salvar()" novalidate>
            <label class="campo"
              ><span>Nome *</span><input formControlName="nome" />
              <app-erro-campo [controle]="form.controls.nome" nome="O nome"
            /></label>
            <label class="campo"
              ><span>E-mail *</span><input type="email" formControlName="email" />
              <app-erro-campo [controle]="form.controls.email" nome="O e-mail"
            /></label>
            <label class="campo"
              ><span>{{ editando() ? 'Nova senha (deixe vazio para manter)' : 'Senha *' }}</span>
              <input type="password" formControlName="senha" autocomplete="new-password" />
              <app-erro-campo [controle]="form.controls.senha" nome="A senha"
            /></label>
            <fieldset class="campo">
              <legend>Perfil *</legend>
              <div class="opcoes-segmentadas">
                <label
                  ><input type="radio" formControlName="tipo" value="CLIENTE" />
                  <span>Cliente</span></label
                >
                <label
                  ><input type="radio" formControlName="tipo" value="ADMIN" />
                  <span>Admin</span></label
                >
              </div>
            </fieldset>
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
export class Usuarios {
  private readonly api = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);

  protected readonly lista = signal<Usuario[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly formAberto = signal(false);
  protected readonly editando = signal<Usuario | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erroSalvar = signal<string | null>(null);
  protected readonly busca = new FormControl('', { nonNullable: true });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, emailValido]],
    senha: [''],
    tipo: ['CLIENTE' as Perfil, Validators.required],
  });

  constructor() {
    this.carregar();
    this.busca.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.carregar());
  }

  protected ehVoce(u: Usuario): boolean {
    return u.email.toLowerCase() === this.auth.usuario()?.email?.toLowerCase();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listar(this.busca.value.trim()).subscribe({
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
    this.form.reset({ nome: '', email: '', senha: '', tipo: 'CLIENTE' });
    this.form.controls.senha.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.controls.senha.updateValueAndValidity();
    this.erroSalvar.set(null);
    this.formAberto.set(true);
  }

  protected editar(u: Usuario): void {
    this.editando.set(u);
    this.form.reset({ nome: u.nome, email: u.email, senha: '', tipo: u.tipo });
    this.form.controls.senha.setValidators([Validators.minLength(6)]);
    this.form.controls.senha.updateValueAndValidity();
    this.erroSalvar.set(null);
    this.formAberto.set(true);
  }

  protected salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const atual = this.editando();
    const dados: Usuario = {
      nome: v.nome.trim(),
      email: v.email.trim(),
      tipo: v.tipo,
      ...(v.senha ? { senha: v.senha } : {}),
    };
    this.salvando.set(true);
    (atual ? this.api.atualizar(atual.id!, dados) : this.api.criar(dados)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.formAberto.set(false);
        this.toast.sucesso(atual ? 'Usuário atualizado.' : 'Usuário cadastrado.');
        this.carregar();
      },
      error: async (e) => {
        this.salvando.set(false);
        this.erroSalvar.set(await mensagemDeErro(e, 'O usuário'));
      },
    });
  }

  protected async trocarPerfil(u: Usuario): Promise<void> {
    const novo: Perfil = u.tipo === 'ADMIN' ? 'CLIENTE' : 'ADMIN';
    const ok = await this.confirmacao.perguntar({
      titulo: 'Trocar perfil',
      mensagem: `Alterar o perfil de ${u.nome} para ${novo === 'ADMIN' ? 'Admin' : 'Cliente'}?`,
      botao: 'Trocar perfil',
    });
    if (!ok) return;
    this.api.atualizar(u.id!, { nome: u.nome, email: u.email, tipo: novo }).subscribe({
      next: () => {
        this.toast.sucesso('Perfil alterado.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'O usuário')),
    });
  }

  protected async excluir(u: Usuario): Promise<void> {
    if (this.ehVoce(u)) {
      this.toast.erro('Você não pode excluir o seu próprio usuário.');
      return;
    }
    if (!(await this.confirmacao.excluir(`o usuário ${u.nome} (${u.email})`))) return;
    this.api.excluir(u.id!).subscribe({
      next: () => {
        this.toast.sucesso('Usuário excluído.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'O usuário')),
    });
  }
}
