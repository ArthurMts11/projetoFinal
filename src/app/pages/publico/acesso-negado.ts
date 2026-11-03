import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-acesso-negado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="container pagina-estreita">
      <div class="estado">
        <p class="codigo-erro">403</p>
        <p class="estado-titulo">Acesso negado</p>
        <p>Seu perfil não tem permissão para abrir esta página.</p>
        @if (auth.logado()) {
          <a [routerLink]="auth.areaInicial()" class="btn btn-primario">Ir para a minha área</a>
        } @else {
          <a routerLink="/login" class="btn btn-primario">Entrar</a>
        }
      </div>
    </div>
  `,
})
export class AcessoNegado {
  protected readonly auth = inject(AuthService);
}
