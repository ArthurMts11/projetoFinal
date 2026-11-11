import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Imovel } from '../core/models';
import { ROTULO_FINALIDADE } from '../core/rotulos';
import { precoDoImovel, urlCapa } from '../core/util';
import { Badge } from './badge';
import { Icone } from './icone';
import { PlantaBaixa } from './planta-baixa';

/** Card da vitrine: foto, preço, título, bairro e a ficha resumida do imóvel. */
@Component({
  selector: 'app-imovel-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DecimalPipe, Icone, Badge, PlantaBaixa],
  template: `
    <article class="card-imovel">
      <a
        [routerLink]="['/imovel', imovel().id]"
        class="card-imovel-foto"
        tabindex="-1"
        aria-hidden="true"
      >
        @if (capa() && !fotoQuebrada()) {
          <img [src]="capa()" alt="" loading="lazy" (error)="fotoQuebrada.set(true)" />
        } @else {
          <div class="foto-padrao">
            <app-planta-baixa
              [quartos]="imovel().dormitorios ?? 0"
              [banheiros]="imovel().banheiros ?? 0"
              [vagas]="imovel().garagem ?? 0"
              [terreno]="!imovel().areaConstruida && !imovel().dormitorios && !imovel().banheiros"
            />
            <span class="foto-padrao-legenda">Planta ilustrativa · sem foto</span>
          </div>
        }
        <span class="etiquetas-foto">
          <span class="etiqueta-finalidade">{{ rotuloFinalidade[imovel().finalidade] }}</span>
          @if (imovel().status !== 'DISPONIVEL') {
            <app-badge [status]="imovel().status" />
          }
        </span>
      </a>
      @if (mostrarFavorito()) {
        <button
          type="button"
          class="btn-favorito"
          [class.ativo]="favorito()"
          [attr.aria-pressed]="favorito()"
          [attr.aria-label]="favorito() ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
          (click)="alternarFavorito.emit(imovel())"
        >
          <app-icone nome="coracao" [cheio]="favorito()" [tamanho]="18" />
        </button>
      }
      <div class="card-imovel-corpo">
        <p class="card-imovel-preco">
          {{ preco() | currency: 'BRL' : 'symbol' : '1.0-0' }}
          @if (imovel().finalidade === 'ALUGUEL') {
            <small>/mês</small>
          }
        </p>
        <h3>
          <a [routerLink]="['/imovel', imovel().id]">{{ imovel().titulo }}</a>
        </h3>
        <p class="card-imovel-local">{{ imovel().bairro.nome }}, {{ imovel().bairro.cidade }}</p>
        <!-- Resumo curto para caber em uma linha; banheiros e área construída ficam no detalhe -->
        <ul class="card-imovel-atributos" aria-label="Características">
          @if (imovel().areaTotal) {
            <li>{{ imovel().areaTotal | number: '1.0-1' }} m²</li>
          }
          @if (imovel().dormitorios) {
            <li>
              {{ imovel().dormitorios }} {{ imovel().dormitorios === 1 ? 'quarto' : 'quartos' }}
            </li>
          }
          @if (imovel().garagem) {
            <li>{{ imovel().garagem }} {{ imovel().garagem === 1 ? 'vaga' : 'vagas' }}</li>
          }
        </ul>
      </div>
    </article>
  `,
})
export class ImovelCard {
  readonly imovel = input.required<Imovel>();
  readonly favorito = input(false);
  readonly mostrarFavorito = input(false);
  readonly alternarFavorito = output<Imovel>();

  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;
  protected readonly fotoQuebrada = signal(false);
  protected readonly capa = computed(() => urlCapa(this.imovel()));
  protected readonly preco = computed(() => precoDoImovel(this.imovel()));
}
