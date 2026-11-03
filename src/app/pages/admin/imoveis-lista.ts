import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { ImoveisService } from '../../core/api/imoveis.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { Imovel, Pagina, StatusImovel } from '../../core/models';
import { ROTULO_FINALIDADE, ROTULO_STATUS_IMOVEL } from '../../core/rotulos';
import { ToastService } from '../../core/toast.service';
import { precoDoImovel, urlCapa } from '../../core/util';
import { Badge } from '../../shared/badge';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';
import { Paginacao } from '../../shared/paginacao';

@Component({
  selector: 'app-imoveis-lista',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule, Estado, Badge, Icone, Paginacao],
  template: `
    <div class="container pagina">
      <div class="pagina-cabecalho">
        <div>
          <h1>Imóveis</h1>
          <p class="texto-suave">Cadastre, edite, gerencie fotos e exclua imóveis.</p>
        </div>
        <a routerLink="/admin/imoveis/novo" class="btn btn-primario"
          ><app-icone nome="mais" /> Novo imóvel</a
        >
      </div>

      <div class="barra-ferramentas">
        <label class="campo">
          <span class="visualmente-oculto">Buscar por título</span>
          <input type="search" [formControl]="busca" placeholder="Buscar por título…" />
        </label>
        <label class="campo campo-inline">
          <span>Situação</span>
          <select [formControl]="status">
            <option value="">Todas</option>
            @for (s of situacoes; track s) {
              <option [value]="s">{{ rotuloStatus[s] }}</option>
            }
          </select>
        </label>
      </div>

      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="resultado()?.content?.length === 0"
        mensagemVazio="Nenhum imóvel encontrado com esses filtros."
        (tentarDeNovo)="carregar()"
      >
        <div class="tabela-envoltorio">
          <table class="tabela">
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Tipo / bairro</th>
                <th>Finalidade</th>
                <th class="num">Preço</th>
                <th>Situação</th>
                <th class="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (i of resultado()?.content ?? []; track i.id) {
                <tr>
                  <td class="celula-principal">
                    <div class="celula-imovel">
                      @if (capa(i)) {
                        <img [src]="capa(i)" alt="" />
                      } @else {
                        <div class="foto-padrao"><app-icone nome="casa" /></div>
                      }
                      <div>
                        <a [routerLink]="['/imovel', i.id]">{{ i.titulo }}</a
                        ><span class="celula-sub"
                          >Cód. {{ i.id }} · {{ i.fotos?.length ?? 0 }} foto(s)</span
                        >
                      </div>
                    </div>
                  </td>
                  <td data-rotulo="Tipo / bairro">
                    {{ i.tipoImovel.nome }}<span class="celula-sub">{{ i.bairro.nome }}</span>
                  </td>
                  <td data-rotulo="Finalidade">{{ rotuloFinalidade[i.finalidade] }}</td>
                  <td class="num" data-rotulo="Preço">{{ preco(i) | currency: 'BRL' }}</td>
                  <td data-rotulo="Situação"><app-badge [status]="i.status" /></td>
                  <td class="acoes">
                    <a
                      [routerLink]="['/admin/imoveis', i.id, 'editar']"
                      class="btn btn-secundario btn-sm"
                      ><app-icone nome="editar" [tamanho]="15" /> Editar</a
                    >
                    <a
                      [routerLink]="['/admin/imoveis', i.id, 'fotos']"
                      class="btn btn-secundario btn-sm"
                      ><app-icone nome="foto" [tamanho]="15" /> Fotos</a
                    >
                    <button
                      type="button"
                      class="btn btn-secundario btn-sm"
                      (click)="excluir(i)"
                      [attr.aria-label]="'Excluir ' + i.titulo"
                    >
                      <app-icone nome="lixo" [tamanho]="15" /> Excluir
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (resultado(); as r) {
          <app-paginacao
            [pagina]="r.page"
            [totalPaginas]="r.totalPages"
            [totalItens]="r.totalElements"
            (mudar)="irPara($event)"
          />
        }
      </app-estado>
    </div>
  `,
})
export class ImoveisLista {
  private readonly api = inject(ImoveisService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);

  protected readonly resultado = signal<Pagina<Imovel> | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly busca = new FormControl('', { nonNullable: true });
  protected readonly status = new FormControl<StatusImovel | ''>('', { nonNullable: true });
  protected readonly situacoes = Object.keys(ROTULO_STATUS_IMOVEL) as StatusImovel[];
  protected readonly rotuloStatus = ROTULO_STATUS_IMOVEL;
  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;

  private pagina = 0;
  private requisicao?: Subscription;

  constructor() {
    this.carregar();
    this.busca.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.pagina = 0;
        this.carregar();
      });
    this.status.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.pagina = 0;
      this.carregar();
    });
    inject(DestroyRef).onDestroy(() => this.requisicao?.unsubscribe());
  }

  protected carregar(): void {
    this.requisicao?.unsubscribe();
    this.carregando.set(true);
    this.erro.set(null);
    this.requisicao = this.api
      .buscar({ busca: this.busca.value, status: this.status.value, page: this.pagina, size: 10 })
      .subscribe({
        next: (r) => {
          // Se excluiu o último item da última página, volta uma página
          if (r.content.length === 0 && r.page > 0) {
            this.pagina = r.totalPages - 1;
            this.carregar();
            return;
          }
          this.resultado.set(r);
          this.carregando.set(false);
        },
        error: async (e) => {
          this.erro.set(await mensagemDeErro(e));
          this.carregando.set(false);
        },
      });
  }

  protected irPara(p: number): void {
    this.pagina = p;
    this.carregar();
  }

  protected capa(i: Imovel): string | null {
    return urlCapa(i);
  }

  protected preco(i: Imovel): number | null {
    return precoDoImovel(i);
  }

  protected async excluir(i: Imovel): Promise<void> {
    if (!(await this.confirmacao.excluir(`o imóvel "${i.titulo}"`))) return;
    this.api.excluir(i.id!).subscribe({
      next: () => {
        this.toast.sucesso('Imóvel excluído.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'O imóvel')),
    });
  }
}
