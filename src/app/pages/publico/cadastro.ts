import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/erros';
import { ToastService } from '../../core/toast.service';
import { ErroCampo, emailValido } from '../../shared/validacao';

function senhasIguais(g: AbstractControl): ValidationErrors | null {
  return g.get('senha')?.value === g.get('confirmacao')?.value ? null : { diferentes: true };
}

@Component({
  selector: 'app-cadastro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ErroCampo],
  template: `
    <div class="container pagina-estreita">
      <div class="cartao cartao-auth">
        <h1>Criar conta</h1>
        <p class="texto-suave">
          Cadastre-se como cliente para fazer ofertas e salvar seus favoritos.
        </p>
        <form [formGroup]="form" (ngSubmit)="cadastrar()" novalidate>
          <label class="campo">
            <span>Nome completo</span>
            <input formControlName="nome" autocomplete="name" />
            <app-erro-campo [controle]="form.controls.nome" nome="O nome" />
          </label>
          <label class="campo">
            <span>E-mail</span>
            <input type="email" formControlName="email" autocomplete="email" />
            <app-erro-campo [controle]="form.controls.email" nome="O e-mail" />
          </label>
          <label class="campo">
            <span>Senha</span>
            <input type="password" formControlName="senha" autocomplete="new-password" />
            <app-erro-campo [controle]="form.controls.senha" nome="A senha" />
          </label>
          <label class="campo">
            <span>Confirme a senha</span>
            <input type="password" formControlName="confirmacao" autocomplete="new-password" />
            @if (form.errors?.['diferentes'] && form.controls.confirmacao.touched) {
              <small class="erro-campo" role="alert">As senhas não conferem.</small>
            }
          </label>
          @if (erro()) {
            <div class="alerta alerta-erro" role="alert">{{ erro() }}</div>
          }
          <button type="submit" class="btn btn-primario btn-bloco" [disabled]="enviando()">
            {{ enviando() ? 'Criando conta…' : 'Criar conta' }}
          </button>
        </form>
        <p class="texto-suave centro">Já tem conta? <a routerLink="/login">Entrar</a></p>
      </div>
    </div>
  `,
})
export class Cadastro {
  readonly returnUrl = input<string>();
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, emailValido]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmacao: ['', [Validators.required]],
    },
    { validators: senhasIguais },
  );

  protected cadastrar(): void {
    this.form.markAllAsTouched();
    this.erro.set(null);
    if (this.form.invalid) return;
    this.enviando.set(true);
    const v = this.form.getRawValue();
    this.auth.cadastrar(v.nome.trim(), v.email.trim(), v.senha).subscribe({
      next: () => {
        this.toast.sucesso('Conta criada! Bem-vindo(a).');
        const volta = this.returnUrl();
        this.router.navigateByUrl(volta && !volta.startsWith('/admin') ? volta : '/');
      },
      error: async (e) => {
        this.enviando.set(false);
        this.erro.set(await mensagemDeErro(e));
      },
    });
  }
}
