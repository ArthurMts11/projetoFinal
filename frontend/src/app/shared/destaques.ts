import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Imovel } from '../core/models';
import { ROTULO_FINALIDADE } from '../core/rotulos';
import { precoDoImovel, urlCapa } from '../core/util';
import { PlantaBaixa } from './planta-baixa';

/**
 * Faixa "Em destaque" do topo da vitrine: o primeiro imóvel ocupa a coluna maior
 * e os outros dois ficam empilhados ao lado. Usa os imóveis marcados como destaque no admin.
 */
@Component({
  selector: 'app-destaques',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DecimalPipe, PlantaBaixa],
  template: `
    <section class="destaques" aria-labelledby="titulo-destaques">
      <div class="destaques-cabecalho">
        <h2 id="titulo-destaques">{{ titulo() }}</h2>
        <p>Selecionados pela equipe Fogami</p>
      </div>
      <div class="destaques-grade">
        @for (i of imoveis(); track i.id; let primeiro = $first) {
          <article class="destaque" [class.destaque-principal]="primeiro">
            <a
              class="destaque-foto"
              [routerLink]="['/imovel', i.id]"
              tabindex="-1"
              aria-hidden="true"
            >
              @if (capa(i) && !quebradas().has(i.id!)) {
                <img [src]="capa(i)" alt="" (error)="marcarQuebrada(i.id!)" />
              } @else {
                <div class="foto-padrao">
                  <app-planta-baixa
                    [quartos]="i.dormitorios ?? 0"
                    [banheiros]="i.banheiros ?? 0"
                    [vagas]="i.garagem ?? 0"
                    [terreno]="!i.areaConstruida && !i.dormitorios && !i.banheiros"
                  />
                </div>
              }
              <span class="etiquetas-foto">
                <span class="etiqueta-finalidade">{{ rotuloFinalidade[i.finalidade] }}</span>
              </span>
            </a>
            <div class="destaque-corpo">
              <p class="destaque-local">
                {{ i.tipoImovel.nome }} · {{ i.bairro.nome }}, {{ i.bairro.cidade }}
              </p>
              <h3>
                <a [routerLink]="['/imovel', i.id]">{{ i.titulo }}</a>
              </h3>
              <p class="destaque-preco">
                {{ preco(i) | currency: 'BRL' : 'symbol' : '1.0-0' }}
                @if (i.finalidade === 'ALUGUEL') {
                  <small>/mês</small>
                }
              </p>
              <ul class="card-imovel-atributos" aria-label="Características">
                @if (i.areaTotal) {
                  <li>{{ i.areaTotal | number: '1.0-1' }} m²</li>
                }
                @if (i.dormitorios) {
                  <li>{{ i.dormitorios }} {{ i.dormitorios === 1 ? 'quarto' : 'quartos' }}</li>
                }
                @if (i.garagem) {
                  <li>{{ i.garagem }} {{ i.garagem === 1 ? 'vaga' : 'vagas' }}</li>
                }
              </ul>
            </div>
          </article>
        }
      </div>
    </section>
  `,
})
export class Destaques {
  readonly imoveis = input.required<Imovel[]>();
  readonly titulo = input('Em destaque');

  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;
  /** Ids cuja foto não carregou: mostram a planta no lugar. */
  protected readonly quebradas = signal<ReadonlySet<number>>(new Set());

  protected capa(i: Imovel): string | null {
    return urlCapa(i);
  }

  protected preco(i: Imovel): number | null {
    return precoDoImovel(i);
  }

  protected marcarQuebrada(id: number): void {
    this.quebradas.update((s) => new Set(s).add(id));
  }
}
