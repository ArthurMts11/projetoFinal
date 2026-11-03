import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  ROTULO_STATUS_CONTRATO,
  ROTULO_STATUS_IMOVEL,
  ROTULO_STATUS_OFERTA,
  corDoStatus,
} from '../core/rotulos';

/** Etiqueta colorida com a situação (de imóvel, oferta ou contrato). */
@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="cor()">{{ rotulo() }}</span>`,
})
export class Badge {
  readonly status = input.required<string>();

  protected readonly rotulo = computed(() => {
    const s = this.status();
    return (
      (ROTULO_STATUS_OFERTA as Record<string, string>)[s] ??
      (ROTULO_STATUS_CONTRATO as Record<string, string>)[s] ??
      (ROTULO_STATUS_IMOVEL as Record<string, string>)[s] ??
      s
    );
  });
  protected readonly cor = computed(() => 'badge ' + corDoStatus(this.status()));
}
