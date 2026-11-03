import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { BairrosService, TiposImovelService } from '../../core/api/cadastros.service';
import { FavoritosService } from '../../core/api/negocios.service';
import { ImoveisService } from '../../core/api/imoveis.service';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/erros';
import { Bairro, FiltrosImovel, Imovel, Pagina, TipoImovel } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { ImovelCard } from '../../shared/imovel-card';
import { Paginacao } from '../../shared/paginacao';
import { ErroCampo } from '../../shared/validacao';

const POR_PAGINA = 9;

// Preço mínimo não pode passar do máximo
function faixaDePreco(grupo: AbstractControl): ValidationErrors | null {
  const min = grupo.get('precoMin')?.value;
  const max = grupo.get('precoMax')?.value;
  return min != null && max != null && min !== '' && max !== '' && Number(min) > Number(max)
    ? { faixa: true }
    : null;
}

/**
 * Vitrine pública. Os filtros ficam na URL (?bairroId=1&finalidade=VENDA&page=2...),
 * então dá para voltar, recarregar ou compartilhar a busca.
 */
@Component({
  selector: 'app-vitrine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ImovelCard, Paginacao, Estado, ErroCampo],
  templateUrl: './vitrine.html',
})
export class Vitrine {
  private readonly imoveis = inject(ImoveisService);
  private readonly favoritosApi = inject(FavoritosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly bairros = signal<Bairro[]>([]);
  protected readonly tipos = signal<TipoImovel[]>([]);
  protected readonly resultado = signal<Pagina<Imovel> | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly favoritos = signal<Set<number>>(new Set());
  protected readonly filtrosAbertos = signal(false);

  protected readonly form = inject(FormBuilder).group(
    {
      bairroId: [null as number | null],
      tipoId: [null as number | null],
      finalidade: [''],
      precoMin: [null as number | null, [Validators.min(0)]],
      precoMax: [null as number | null, [Validators.min(0)]],
      ordem: ['recentes'],
    },
    { validators: faixaDePreco },
  );

  private filtrosAtuais: FiltrosImovel = {};
  private busca?: Subscription;

  constructor() {
    inject(BairrosService)
      .listar()
      .subscribe({ next: (b) => this.bairros.set(b), error: () => {} });
    inject(TiposImovelService)
      .listar()
      .subscribe({ next: (t) => this.tipos.set(t), error: () => {} });
    if (this.auth.isCliente()) {
      this.favoritosApi
        .ids()
        .subscribe({ next: (ids) => this.favoritos.set(new Set(ids)), error: () => {} });
    }
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((p) => {
      this.filtrosAtuais = this.lerFiltros(p);
      this.form.patchValue(
        {
          bairroId: this.filtrosAtuais.bairroId ?? null,
          tipoId: this.filtrosAtuais.tipoId ?? null,
          finalidade: this.filtrosAtuais.finalidade ?? '',
          precoMin: this.filtrosAtuais.precoMin ?? null,
          precoMax: this.filtrosAtuais.precoMax ?? null,
          ordem: this.filtrosAtuais.ordem ?? 'recentes',
        },
        { emitEvent: false },
      );
      this.carregar();
    });
    inject(DestroyRef).onDestroy(() => this.busca?.unsubscribe());
  }

  protected carregar(): void {
    this.busca?.unsubscribe(); // cancela a busca anterior se o usuário trocar o filtro rápido
    this.carregando.set(true);
    this.erro.set(null);
    this.busca = this.imoveis
      .buscar({ ...this.filtrosAtuais, status: 'DISPONIVEL', size: POR_PAGINA })
      .subscribe({
        next: (r) => {
          this.resultado.set(r);
          this.carregando.set(false);
        },
        error: async (e) => {
          this.erro.set(await mensagemDeErro(e));
          this.carregando.set(false);
        },
      });
  }

  protected aplicar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    this.navegar({
      bairroId: v.bairroId || null,
      tipoId: v.tipoId || null,
      finalidade: v.finalidade || null,
      precoMin: v.precoMin ?? null,
      precoMax: v.precoMax ?? null,
      ordem: v.ordem === 'recentes' ? null : v.ordem,
      page: null, // filtro novo volta para a primeira página
    });
    this.filtrosAbertos.set(false);
  }

  protected limpar(): void {
    this.form.reset({
      bairroId: null,
      tipoId: null,
      finalidade: '',
      precoMin: null,
      precoMax: null,
      ordem: 'recentes',
    });
    this.router.navigate([], { queryParams: {} });
  }

  // Ordenação aplica na hora, sem precisar clicar em "Buscar"
  protected ordenar(): void {
    this.navegar({
      ordem: this.form.value.ordem === 'recentes' ? null : this.form.value.ordem,
      page: null,
    });
  }

  protected irParaPagina(pagina: number): void {
    this.navegar({ page: pagina > 0 ? pagina : null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected async alternarFavorito(imovel: Imovel): Promise<void> {
    const id = imovel.id!;
    const ehFavorito = this.favoritos().has(id);
    const req = ehFavorito ? this.favoritosApi.remover(id) : this.favoritosApi.adicionar(id);
    req.subscribe({
      next: () => {
        const novo = new Set(this.favoritos());
        ehFavorito ? novo.delete(id) : novo.add(id);
        this.favoritos.set(novo);
        this.toast.sucesso(ehFavorito ? 'Removido dos favoritos.' : 'Adicionado aos favoritos.');
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'O imóvel')),
    });
  }

  protected temFiltro(): boolean {
    const f = this.filtrosAtuais;
    return !!(f.bairroId || f.tipoId || f.finalidade || f.precoMin != null || f.precoMax != null);
  }

  private navegar(params: Record<string, unknown>): void {
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
  }

  private lerFiltros(p: ParamMap): FiltrosImovel {
    const numero = (chave: string) => {
      const v = p.get(chave);
      return v !== null && v !== '' && !isNaN(Number(v)) ? Number(v) : null;
    };
    const finalidade = p.get('finalidade');
    const ordem = p.get('ordem');
    return {
      bairroId: numero('bairroId'),
      tipoId: numero('tipoId'),
      finalidade: finalidade === 'VENDA' || finalidade === 'ALUGUEL' ? finalidade : '',
      precoMin: numero('precoMin'),
      precoMax: numero('precoMax'),
      ordem: ordem === 'preco_asc' || ordem === 'preco_desc' ? ordem : 'recentes',
      page: Math.max(0, numero('page') ?? 0),
    };
  }
}
