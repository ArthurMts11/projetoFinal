import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../core/toast.service';
import { Icone } from './icone';

@Component({
  selector: 'app-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icone],
  template: `
    <div class="toasts" aria-live="polite">
      @for (m of servico.mensagens(); track m.id) {
        <div class="toast" [class]="'toast toast-' + m.tipo" role="status">
          <span>{{ m.texto }}</span>
          <button
            type="button"
            class="toast-fechar"
            aria-label="Fechar"
            (click)="servico.fechar(m.id)"
          >
            <app-icone nome="fechar" [tamanho]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  protected readonly servico = inject(ToastService);
}
