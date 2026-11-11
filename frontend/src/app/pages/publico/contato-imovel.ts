import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ImoveisService } from '../../core/api/imoveis.service';
import { AuthService } from '../../core/auth.service';
import { IMOBILIARIA } from '../../core/config';
import { mensagemDeErro } from '../../core/erros';
import { ErroCampo, emailValido, telefoneValido } from '../../shared/validacao';

const MENSAGEM_PADRAO = 'Olá! Tenho interesse neste imóvel e gostaria de receber mais informações.';

/**
 * Contato da página do imóvel: o visitante deixa nome, telefone e e-mail,
 * e a API (POST /imoveis/sabermais/{id}) envia os detalhes e as fotos por e-mail.
 * Os limites dos campos são os mesmos do SaberMaisDTO no backend.
 */
@Component({
  selector: 'app-contato-imovel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ErroCampo],
  template: `
    <section class="cartao" aria-labelledby="titulo-contato">
      <h2 id="titulo-contato">Receber detalhes por e-mail</h2>
      <p class="texto-suave contato-intro">
        Enviamos fotos, valores e endereço deste imóvel para você.
      </p>

      @if (enviadoPara()) {
        <div class="alerta alerta-sucesso" role="status">{{ enviadoPara() }}</div>
        <button type="button" class="btn btn-link" (click)="novoPedido()">
          Enviar para outro e-mail
        </button>
      } @else {
        <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <label class="campo">
            <span>Nome</span>
            <input type="text" formControlName="nome" autocomplete="name" maxlength="100" />
            <app-erro-campo [controle]="form.controls.nome" nome="O nome" />
          </label>
          <label class="campo">
            <span>Telefone</span>
            <input
              type="tel"
              formControlName="telefone"
              autocomplete="tel"
              inputmode="tel"
              maxlength="20"
              placeholder="(55) 99999-0000"
            />
            <app-erro-campo [controle]="form.controls.telefone" nome="O telefone" />
          </label>
          <label class="campo">
            <span>E-mail</span>
            <input
              type="email"
              formControlName="email"
              autocomplete="email"
              maxlength="150"
              placeholder="voce@email.com"
            />
            <app-erro-campo [controle]="form.controls.email" nome="O e-mail" />
          </label>
          <label class="campo">
            <span>Mensagem</span>
            <textarea formControlName="mensagem" rows="3" maxlength="2000"></textarea>
            <app-erro-campo [controle]="form.controls.mensagem" nome="A mensagem" />
          </label>

          @if (erro()) {
            <div class="alerta alerta-erro" role="alert">{{ erro() }}</div>
          }

          <button type="submit" class="btn btn-secundario btn-bloco" [disabled]="enviando()">
            {{ enviando() ? 'Enviando…' : 'Receber detalhes' }}
          </button>
        </form>
      }

      <p class="contato-telefone">
        Prefere falar agora?
        <a [href]="'tel:+55' + telefoneDigitos">{{ imobiliaria.telefone }}</a>
      </p>
    </section>
  `,
})
export class ContatoImovel {
  readonly imovelId = input.required<number>();

  private readonly imoveis = inject(ImoveisService);
  private readonly auth = inject(AuthService);

  protected readonly imobiliaria = IMOBILIARIA;
  protected readonly telefoneDigitos = IMOBILIARIA.telefone.replace(/\D/g, '');
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly enviadoPara = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    telefone: ['', [Validators.required, Validators.maxLength(20), telefoneValido]],
    email: ['', [Validators.required, Validators.maxLength(150), emailValido]],
    mensagem: [MENSAGEM_PADRAO, [Validators.required, Validators.maxLength(2000)]],
  });

  constructor() {
    // Quem está logado já tem nome e e-mail: preenche para poupar digitação
    effect(() => {
      const u = this.auth.usuario();
      if (u && !this.form.dirty) {
        this.form.patchValue({ nome: u.nome, email: u.email });
      }
    });
  }

  protected enviar(): void {
    this.form.markAllAsTouched();
    this.erro.set(null);
    if (this.form.invalid) {
      return;
    }
    this.enviando.set(true);
    const v = this.form.getRawValue();
    this.imoveis
      .pedirInformacoes(this.imovelId(), {
        nome: v.nome.trim(),
        telefone: v.telefone.trim(),
        email: v.email.trim(),
        mensagem: v.mensagem.trim(),
      })
      .subscribe({
        next: (r) => {
          this.enviando.set(false);
          this.enviadoPara.set(r.mensagem);
        },
        error: async (e) => {
          this.enviando.set(false);
          this.erro.set(await mensagemDeErro(e, 'O imóvel'));
        },
      });
  }

  protected novoPedido(): void {
    this.enviadoPara.set(null);
    this.form.controls.email.reset('');
  }
}
