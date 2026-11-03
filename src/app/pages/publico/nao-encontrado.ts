import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nao-encontrado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="container pagina-estreita">
      <div class="estado">
        <p class="codigo-erro">404</p>
        <p class="estado-titulo">Página não encontrada</p>
        <p>O endereço digitado não existe ou foi alterado.</p>
        <a routerLink="/" class="btn btn-primario">Ver imóveis</a>
      </div>
    </div>
  `,
})
export class NaoEncontrado {}
