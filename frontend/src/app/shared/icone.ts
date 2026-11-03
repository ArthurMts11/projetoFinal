import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Ícones em SVG (traço), para não depender de biblioteca externa
const ICONES: Record<string, string> = {
  cama: 'M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 14h18M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3',
  banho: 'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2',
  carro: 'M5 17h14M6 17v2M18 17v2M4 13l2-5h12l2 5v4H4v-4zM7.5 14.5h.01M16.5 14.5h.01',
  area: 'M4 4h6M4 4v6M20 20h-6M20 20v-6M4 4l6 6M20 20l-6-6',
  local:
    'M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  coracao: 'M12 20s-7-4.4-9.2-9A4.8 4.8 0 0 1 12 6.6 4.8 4.8 0 0 1 21.2 11C19 15.6 12 20 12 20z',
  email: 'M3 6h18v12H3zM3 7l9 6 9-6',
  sair: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  menu: 'M4 7h16M4 12h16M4 17h16',
  fechar: 'M6 6l12 12M18 6L6 18',
  casa: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
  pdf: 'M7 3h7l5 5v13H7zM14 3v5h5M9.5 16h5M9.5 12.5h5',
  lixo: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  editar: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  estrela: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  foto: 'M4 7h3l2-2h6l2 2h3v12H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  mais: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  busca: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
};

@Component({
  selector: 'app-icone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    [attr.width]="tamanho()"
    [attr.height]="tamanho()"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="caminho()" [attr.fill]="cheio() ? 'currentColor' : 'none'" />
  </svg>`,
  host: { class: 'icone' },
})
export class Icone {
  readonly nome = input.required<string>();
  readonly tamanho = input(18);
  readonly cheio = input(false);
  protected readonly caminho = computed(() => ICONES[this.nome()] ?? '');
}
