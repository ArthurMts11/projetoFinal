import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';

/**
 * Feedback padrão das telas que buscam dados:
 * "carregando", mensagem de erro amigável (com "tentar de novo") e "sem resultados".
 * O spinner só ocupa a tela no primeiro carregamento; nas buscas seguintes (trocar
 * filtro, aba, página) o conteúdo atual continua visível, esmaecido, até chegar o novo.
 */
@Component({
  selector: 'app-estado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (carregando() && !jaMostrou()) {
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
    } @else if (vazio() && !carregando()) {
      <div class="estado">
        <p class="estado-titulo">Sem resultados</p>
        <p>{{ mensagemVazio() }}</p>
        <ng-content select="[vazio]" />
      </div>
    } @else {
      <div
        class="estado-conteudo"
        [class.atualizando]="carregando()"
        [attr.aria-busy]="carregando()"
      >
        <ng-content />
      </div>
    }
  `,
})
export class Estado {
  readonly carregando = input(false);
  readonly erro = input<string | null>(null);
  readonly vazio = input(false);
  readonly mensagemVazio = input('Nenhum item encontrado.');
  readonly tentarDeNovo = output<void>();

  /** Já houve um carregamento completo: os próximos não escondem o conteúdo. */
  protected readonly jaMostrou = signal(false);

  constructor() {
    effect(() => {
      if (!this.carregando() && !this.erro()) this.jaMostrou.set(true);
    });
  }
}
