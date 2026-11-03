import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Feedback padrão das telas que buscam dados:
 * "carregando", mensagem de erro amigável (com "tentar de novo") e "sem resultados".
 * O conteúdo (ng-content) só aparece quando há dados.
 */
@Component({
  selector: 'app-estado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (carregando()) {
      <div class="estado" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <p>Carregando…</p>
      </div>
    } @else if (erro()) {
      <div class="estado estado-erro" role="alert">
        <p class="estado-titulo">Não foi possível carregar</p>
        <p>{{ erro() }}</p>
        <button type="button" class="btn btn-secundario" (click)="tentarDeNovo.emit()">
          Tentar de novo
        </button>
      </div>
    } @else if (vazio()) {
      <div class="estado">
        <p class="estado-titulo">Sem resultados</p>
        <p>{{ mensagemVazio() }}</p>
        <ng-content select="[vazio]" />
      </div>
    } @else {
      <ng-content />
    }
  `,
})
export class Estado {
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);
  readonly vazio = input(false);
  readonly mensagemVazio = input('Nenhum item encontrado.');
  readonly tentarDeNovo = output<void>();
}
