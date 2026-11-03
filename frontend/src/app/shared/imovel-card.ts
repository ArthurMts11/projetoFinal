import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Imovel } from '../core/models';
import { ROTULO_FINALIDADE } from '../core/rotulos';
import { precoDoImovel, urlCapa } from '../core/util';
import { Badge } from './badge';
import { Icone } from './icone';

/** Card da vitrine: foto, tipo, bairro, cidade, valor e finalidade. */
@Component({
  selector: 'app-imovel-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, Icone, Badge],
  template: `
    <article class="card-imovel">
      <a
        [routerLink]="['/imovel', imovel().id]"
        class="card-imovel-foto"
        [attr.aria-label]="'Ver ' + imovel().titulo"
      >
        @if (capa() && !fotoQuebrada()) {
          <img
            [src]="capa()"
            [alt]="imovel().titulo"
            loading="lazy"
            (error)="fotoQuebrada.set(true)"
          />
        } @else {
          <div class="foto-padrao"><app-icone nome="casa" [tamanho]="44" /></div>
        }
        <span class="etiqueta-finalidade" [class.aluguel]="imovel().finalidade === 'ALUGUEL'">
          {{ rotuloFinalidade[imovel().finalidade] }}
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
          <app-icone nome="coracao" [cheio]="favorito()" [tamanho]="20" />
        </button>
      }
      <div class="card-imovel-corpo">
        <p class="card-imovel-tipo">
          {{ imovel().tipoImovel.nome }}
          @if (imovel().status !== 'DISPONIVEL') {
            <app-badge [status]="imovel().status" />
          }
        </p>
        <h3>
          <a [routerLink]="['/imovel', imovel().id]">{{ imovel().titulo }}</a>
        </h3>
        <p class="card-imovel-local">
          <app-icone nome="local" [tamanho]="15" /> {{ imovel().bairro.nome }},
          {{ imovel().bairro.cidade }}
        </p>
        <p class="card-imovel-preco">
          {{ preco() | currency: 'BRL' }}
          @if (imovel().finalidade === 'ALUGUEL') {
            <small>/mês</small>
          }
        </p>
        <ul class="card-imovel-atributos">
          @if (imovel().dormitorios) {
            <li><app-icone nome="cama" [tamanho]="15" /> {{ imovel().dormitorios }}</li>
          }
          @if (imovel().banheiros) {
            <li><app-icone nome="banho" [tamanho]="15" /> {{ imovel().banheiros }}</li>
          }
          @if (imovel().garagem) {
            <li><app-icone nome="carro" [tamanho]="15" /> {{ imovel().garagem }}</li>
          }
          @if (imovel().areaTotal) {
            <li><app-icone nome="area" [tamanho]="15" /> {{ imovel().areaTotal }} m²</li>
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
