import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StatusContrato } from '../core/models';

interface Etapa {
  rotulo: string;
  quem: string;
}

// As quatro etapas do contrato, na ordem em que acontecem
const ETAPAS: Etapa[] = [
  { rotulo: 'Preparo', quem: 'Corretor' },
  { rotulo: 'Aprovação', quem: 'Administrador' },
  { rotulo: 'Assinatura', quem: 'Cliente' },
  { rotulo: 'Assinado', quem: '' },
];

const ETAPA_DO_STATUS: Record<StatusContrato, number> = {
  RASCUNHO: 0,
  DEVOLVIDO: 0,
  EM_APROVACAO: 1,
  AGUARDANDO_ASSINATURA: 2,
  ASSINADO: 3,
  CANCELADO: -1,
};

/** Mostra em que etapa o contrato está e quem precisa agir agora. */
@Component({
  selector: 'app-trilha-contrato',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cancelado()) {
      <p class="trilha-cancelada">Contrato cancelado. O imóvel voltou a ficar disponível.</p>
    } @else {
      <ol class="trilha" aria-label="Etapas do contrato">
        @for (e of etapas; track e.rotulo; let i = $index) {
          <li
            [class.feita]="i < atual()"
            [class.atual]="i === atual()"
            [attr.aria-current]="i === atual() ? 'step' : null"
          >
            <span class="trilha-marca" aria-hidden="true">{{ i < atual() ? '✓' : i + 1 }}</span>
            <span class="trilha-texto">
              <strong>{{ e.rotulo }}</strong>
              @if (e.quem) {
                <small>{{ e.quem }}</small>
              }
            </span>
          </li>
        }
      </ol>
    }
  `,
})
export class TrilhaContrato {
  readonly status = input.required<StatusContrato>();

  protected readonly etapas = ETAPAS;
  protected readonly atual = computed(() => ETAPA_DO_STATUS[this.status()]);
  protected readonly cancelado = computed(() => this.status() === 'CANCELADO');
}
