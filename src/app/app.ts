import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { IMOBILIARIA } from './core/config';
import { Cabecalho } from './layout/cabecalho';
import { ConfirmacaoDialogo } from './shared/confirmacao-dialogo';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Cabecalho, Toasts, ConfirmacaoDialogo],
  template: `
    <a class="pular-conteudo" href="#conteudo">Pular para o conteúdo</a>
    <app-cabecalho />
    <main id="conteudo" class="principal">
      <router-outlet />
    </main>
    <footer class="rodape">
      <div class="container">
        <strong>{{ imobiliaria.nome }}</strong> · {{ imobiliaria.telefone }} ·
        {{ imobiliaria.email }}
      </div>
    </footer>
    <app-toasts />
    <app-confirmacao-dialogo />
  `,
})
export class App {
  protected readonly imobiliaria = IMOBILIARIA;
}
