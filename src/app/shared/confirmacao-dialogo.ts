import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ConfirmacaoService } from '../core/confirmacao.service';

@Component({
  selector: 'app-confirmacao-dialogo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (servico.pedido(); as p) {
      <div class="modal-fundo" (click)="p.responder(false)" (keydown.escape)="p.responder(false)">
        <div
          class="modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-titulo"
          (click)="$event.stopPropagation()"
        >
          <h2 id="confirm-titulo">{{ p.titulo }}</h2>
          <p>{{ p.mensagem }}</p>
          <div class="modal-acoes">
            <button type="button" class="btn btn-secundario" (click)="p.responder(false)">
              Voltar
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-perigo]="p.perigo"
              [class.btn-primario]="!p.perigo"
              (click)="p.responder(true)"
              autofocus
            >
              {{ p.botao }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmacaoDialogo {
  protected readonly servico = inject(ConfirmacaoService);
}
