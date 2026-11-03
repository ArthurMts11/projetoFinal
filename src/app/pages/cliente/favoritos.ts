import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FavoritosService } from '../../core/api/negocios.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { Imovel } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { ImovelCard } from '../../shared/imovel-card';

@Component({
  selector: 'app-favoritos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Estado, ImovelCard],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Favoritos</h1>
          <p class="texto-suave">Imóveis que você salvou. Toque no coração para remover.</p>
        </div>
        <a routerLink="/" class="btn btn-secundario">Adicionar mais imóveis</a>
      </div>
      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="imoveis().length === 0"
        mensagemVazio="Sua lista está vazia. Na vitrine, toque no coração de um imóvel para salvá-lo aqui."
        (tentarDeNovo)="carregar()"
      >
        <div class="grade-imoveis">
          @for (i of imoveis(); track i.id) {
            <app-imovel-card
              [imovel]="i"
              [mostrarFavorito]="true"
              [favorito]="true"
              (alternarFavorito)="remover($event)"
            />
          }
        </div>
      </app-estado>
    </div>
  `,
})
export class Favoritos {
  private readonly api = inject(FavoritosService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);

  protected readonly imoveis = signal<Imovel[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listar().subscribe({
      next: (lista) => {
        this.imoveis.set(lista);
        this.carregando.set(false);
      },
      error: async (e) => {
        this.erro.set(await mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  protected async remover(imovel: Imovel): Promise<void> {
    const ok = await this.confirmacao.perguntar({
      titulo: 'Remover dos favoritos',
      mensagem: `Remover "${imovel.titulo}" da sua lista de favoritos?`,
      botao: 'Remover',
      perigo: true,
    });
    if (!ok) return;
    this.api.remover(imovel.id!).subscribe({
      next: () => {
        this.imoveis.update((l) => l.filter((i) => i.id !== imovel.id));
        this.toast.sucesso('Removido dos favoritos.');
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'O favorito')),
    });
  }
}
