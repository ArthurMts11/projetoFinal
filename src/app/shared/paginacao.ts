import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Navegação entre páginas: anterior, números (com reticências) e próxima. A página é base 0, como na API. */
@Component({
  selector: 'app-paginacao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPaginas() > 1) {
      <nav class="paginacao" aria-label="Paginação">
        <button
          type="button"
          class="btn btn-secundario btn-sm"
          [disabled]="pagina() === 0"
          (click)="mudar.emit(pagina() - 1)"
        >
          ‹ Anterior
        </button>
        @for (p of paginas(); track $index) {
          @if (p === -1) {
            <span class="paginacao-reticencias">…</span>
          } @else {
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primario]="p === pagina()"
              [class.btn-secundario]="p !== pagina()"
              [attr.aria-current]="p === pagina() ? 'page' : null"
              (click)="mudar.emit(p)"
            >
              {{ p + 1 }}
            </button>
          }
        }
        <button
          type="button"
          class="btn btn-secundario btn-sm"
          [disabled]="pagina() >= totalPaginas() - 1"
          (click)="mudar.emit(pagina() + 1)"
        >
          Próxima ›
        </button>
      </nav>
      <p class="paginacao-info">
        Página {{ pagina() + 1 }} de {{ totalPaginas() }} · {{ totalItens() }} imóveis
      </p>
    }
  `,
})
export class Paginacao {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly totalItens = input(0);
  readonly mudar = output<number>();

  // Primeira, última e vizinhas da atual; -1 marca as reticências
  protected readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const atual = this.pagina();
    const lista: number[] = [];
    for (let p = 0; p < total; p++) {
      if (p === 0 || p === total - 1 || Math.abs(p - atual) <= 1) {
        lista.push(p);
      } else if (lista[lista.length - 1] !== -1) {
        lista.push(-1);
      }
    }
    return lista;
  });
}
