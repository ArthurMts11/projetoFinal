import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/erros';
import { ErroCampo, emailValido } from '../../shared/validacao';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ErroCampo],
  template: `
    <div class="container pagina-estreita">
      <div class="cartao cartao-auth">
        <h1>Entrar</h1>
        <p class="texto-suave">
          Acesse sua área para fazer ofertas, favoritar imóveis e assinar contratos.
        </p>

        @if (saiu()) {
          <div class="alerta alerta-info" role="status">Você saiu da sua conta.</div>
        }
        @if (returnUrl()) {
          <div class="alerta alerta-info" role="status">Entre para continuar.</div>
        }

        <form [formGroup]="form" (ngSubmit)="entrar()" novalidate>
          <label class="campo">
            <span>E-mail</span>
            <input
              type="email"
              formControlName="email"
              autocomplete="username"
              placeholder="voce@email.com"
            />
            <app-erro-campo [controle]="form.controls.email" nome="O e-mail" />
          </label>
          <label class="campo">
            <span>Senha</span>
            <input type="password" formControlName="senha" autocomplete="current-password" />
            <app-erro-campo [controle]="form.controls.senha" nome="A senha" />
          </label>

          @if (erro()) {
            <div class="alerta alerta-erro" role="alert">{{ erro() }}</div>
          }

          <button type="submit" class="btn btn-primario btn-bloco" [disabled]="enviando()">
            {{ enviando() ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>
        <p class="texto-suave centro">
          Ainda não tem conta?
          <a routerLink="/cadastro" [queryParams]="returnUrl() ? { returnUrl: returnUrl() } : {}"
            >Cadastre-se</a
          >
        </p>
      </div>
    </div>
  `,
})
export class Login {
  readonly returnUrl = input<string>();
  readonly saiu = input<string>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, emailValido]],
    senha: ['', [Validators.required]],
  });

  protected entrar(): void {
    this.form.markAllAsTouched();
    this.erro.set(null);
    if (this.form.invalid) {
      return;
    }
    this.enviando.set(true);
    const { email, senha } = this.form.getRawValue();
    this.auth.login(email.trim(), senha).subscribe({
      next: () => {
        // Cada perfil vai para a sua área inicial (ou volta para onde estava)
        const perfil = this.auth.usuario()?.perfil;
        const volta = this.returnUrl();
        const voltaPermitida =
          volta &&
          (perfil === 'ADMIN' ? !volta.startsWith('/cliente') : !volta.startsWith('/admin'));
        this.router.navigateByUrl(voltaPermitida ? volta : this.auth.areaInicial(perfil));
      },
      error: async (e) => {
        this.enviando.set(false);
        this.erro.set(e?.status === 401 ? 'E-mail ou senha inválidos.' : await mensagemDeErro(e));
      },
    });
  }
}
