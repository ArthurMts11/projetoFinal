import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { FavoritosService, OfertasService } from '../../core/api/negocios.service';
import { ImoveisService } from '../../core/api/imoveis.service';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/erros';
import { Imovel, TipoOferta } from '../../core/models';
import { ROTULO_FINALIDADE, ROTULO_STATUS_IMOVEL } from '../../core/rotulos';
import { ToastService } from '../../core/toast.service';
import { precoDoImovel, urlFoto } from '../../core/util';
import { Badge } from '../../shared/badge';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';
import { PlantaBaixa } from '../../shared/planta-baixa';
import { ContatoImovel } from './contato-imovel';
import { ErroCampo } from '../../shared/validacao';

@Component({
  selector: 'app-imovel-detalhe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    Estado,
    Icone,
    Badge,
    ErroCampo,
    PlantaBaixa,
    ContatoImovel,
  ],
  templateUrl: './imovel-detalhe.html',
})
export class ImovelDetalhe {
  /** Vem da rota /imovel/:id (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly imoveis = inject(ImoveisService);
  private readonly ofertas = inject(OfertasService);
  private readonly favoritosApi = inject(FavoritosService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly imovel = signal<Imovel | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly naoEncontrado = signal(false);
  protected readonly fotoAtual = signal(0);
  protected readonly favorito = signal(false);
  protected readonly enviando = signal(false);
  protected readonly ofertaEnviada = signal(false);
  protected readonly erroOferta = signal<string | null>(null);

  protected readonly rotuloFinalidade = ROTULO_FINALIDADE;
  protected readonly rotuloStatus = ROTULO_STATUS_IMOVEL;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    tipo: ['VENDA' as TipoOferta, Validators.required],
    valorProposto: [
      null as unknown as number,
      [Validators.required, Validators.min(1), Validators.max(999999999)],
    ],
    mensagem: ['', [Validators.maxLength(2000)]],
  });

  /** URLs que deram erro ao carregar (ex.: arquivo apagado do servidor): somem da galeria. */
  private readonly fotosQuebradas = signal<ReadonlySet<string>>(new Set());
  protected readonly fotos = computed(() =>
    (this.imovel()?.fotos ?? [])
      .map((f) => urlFoto(f.url))
      .filter((url) => !this.fotosQuebradas().has(url)),
  );
  protected readonly preco = computed(() => (this.imovel() ? precoDoImovel(this.imovel()!) : null));
  /** "Rua X, 120 · Centro, Panambi/RS", pulando as partes que não foram cadastradas. */
  protected readonly endereco = computed(() => {
    const i = this.imovel();
    if (!i) return '';
    const rua = [i.endereco, i.numero].filter(Boolean).join(', ');
    const cidade = [i.bairro.cidade, i.bairro.estado].filter(Boolean).join('/');
    const local = [i.bairro.nome, cidade].filter(Boolean).join(', ');
    return [rua, local].filter(Boolean).join(' · ');
  });
  protected readonly caracteristicas = computed(() =>
    (this.imovel()?.caracteristicas ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean),
  );

  /** Tipos de oferta possíveis: os que têm preço cadastrado (ou a finalidade do imóvel). */
  protected readonly tiposOferta = computed<TipoOferta[]>(() => {
    const i = this.imovel();
    if (!i) return [];
    const tipos: TipoOferta[] = [];
    if (i.precoVenda || i.finalidade === 'VENDA') tipos.push('VENDA');
    if (i.precoAluguel || i.finalidade === 'ALUGUEL') tipos.push('ALUGUEL');
    return tipos;
  });

  /** Regra: só imóveis disponíveis mostram o botão "Fazer oferta". */
  protected readonly podeOfertar = computed(() => this.imovel()?.status === 'DISPONIVEL');

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.carregar(id));
    });
  }

  protected carregar(id = Number(this.id())): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.naoEncontrado.set(false);
    if (!Number.isInteger(id) || id <= 0) {
      this.naoEncontrado.set(true);
      this.carregando.set(false);
      return;
    }
    this.imoveis.buscarPorId(id).subscribe({
      next: (i) => {
        this.imovel.set(i);
        this.fotoAtual.set(0);
        this.form.reset({ tipo: i.finalidade, valorProposto: undefined, mensagem: '' });
        this.carregando.set(false);
      },
      error: async (e) => {
        if (e instanceof HttpErrorResponse && e.status === 404) {
          this.naoEncontrado.set(true);
        } else {
          this.erro.set(await mensagemDeErro(e, 'O imóvel'));
        }
        this.carregando.set(false);
      },
    });
    if (this.auth.isCliente()) {
      this.favoritosApi
        .ids()
        .subscribe({ next: (ids) => this.favorito.set(ids.includes(id)), error: () => {} });
    }
  }

  protected entrarParaOfertar(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  protected enviarOferta(): void {
    this.form.markAllAsTouched();
    this.erroOferta.set(null);
    if (this.form.invalid || !this.imovel()) {
      return;
    }
    this.enviando.set(true);
    const v = this.form.getRawValue();
    this.ofertas
      .enviar({
        imovelId: this.imovel()!.id!,
        tipo: v.tipo,
        valorProposto: Number(v.valorProposto),
        mensagem: v.mensagem,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.ofertaEnviada.set(true);
          this.toast.sucesso('Oferta enviada! Acompanhe a resposta em "Minhas ofertas".');
        },
        error: async (e) => {
          this.enviando.set(false);
          this.erroOferta.set(await mensagemDeErro(e, 'O imóvel'));
        },
      });
  }

  protected alternarFavorito(): void {
    const id = this.imovel()!.id!;
    const era = this.favorito();
    (era ? this.favoritosApi.remover(id) : this.favoritosApi.adicionar(id)).subscribe({
      next: () => {
        this.favorito.set(!era);
        this.toast.sucesso(era ? 'Removido dos favoritos.' : 'Adicionado aos favoritos.');
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e)),
    });
  }

  protected fotoQuebrou(url: string): void {
    this.fotosQuebradas.update((s) => new Set(s).add(url));
    // A lista encolheu: mantém o índice dentro do limite
    this.fotoAtual.set(Math.min(this.fotoAtual(), Math.max(0, this.fotos().length - 1)));
  }

  protected fotoAnterior(): void {
    const n = this.fotos().length;
    this.fotoAtual.set((this.fotoAtual() - 1 + n) % n);
  }

  protected proximaFoto(): void {
    this.fotoAtual.set((this.fotoAtual() + 1) % this.fotos().length);
  }
}
