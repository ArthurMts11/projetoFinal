import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { BairrosService, TiposImovelService } from '../../core/api/cadastros.service';
import { ImoveisService } from '../../core/api/imoveis.service';
import { mensagemDeErro } from '../../core/erros';
import { Bairro, Finalidade, Imovel, StatusImovel, TipoImovel } from '../../core/models';
import { ROTULO_STATUS_IMOVEL } from '../../core/rotulos';
import { ToastService } from '../../core/toast.service';
import { Estado } from '../../shared/estado';
import { ErroCampo } from '../../shared/validacao';

const CEP = /^\d{5}-?\d{3}$/;

@Component({
  selector: 'app-imovel-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Estado, ErroCampo],
  templateUrl: './imovel-form.html',
})
export class ImovelForm implements OnInit {
  /** Presente em /admin/imoveis/:id/editar; ausente em /admin/imoveis/novo. */
  readonly id = input<string>();

  private readonly api = inject(ImoveisService);
  private readonly bairrosApi = inject(BairrosService);
  private readonly tiposApi = inject(TiposImovelService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly edicao = computed(() => !!this.id());
  protected readonly bairros = signal<Bairro[]>([]);
  protected readonly tipos = signal<TipoImovel[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erroSalvar = signal<string | null>(null);
  protected readonly situacoes = Object.keys(ROTULO_STATUS_IMOVEL) as StatusImovel[];
  protected readonly rotuloStatus = ROTULO_STATUS_IMOVEL;

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(255)]],
    descricao: [''],
    finalidade: ['VENDA' as Finalidade, Validators.required],
    status: ['DISPONIVEL' as StatusImovel, Validators.required],
    tipoImovelId: [null as number | null, Validators.required],
    bairroId: [null as number | null, Validators.required],
    precoVenda: [null as number | null, [Validators.min(0)]],
    precoAluguel: [null as number | null, [Validators.min(0)]],
    dormitorios: [null as number | null, [Validators.min(0), Validators.max(50)]],
    banheiros: [null as number | null, [Validators.min(0), Validators.max(50)]],
    garagem: [null as number | null, [Validators.min(0), Validators.max(50)]],
    areaTotal: [null as number | null, [Validators.min(0)]],
    areaConstruida: [null as number | null, [Validators.min(0)]],
    endereco: ['', Validators.required],
    numero: [''],
    complemento: [''],
    cep: ['', [Validators.pattern(CEP)]],
    caracteristicas: [''],
    destaque: [false],
  });

  private readonly finalidade = toSignal(this.form.controls.finalidade.valueChanges, {
    initialValue: this.form.controls.finalidade.value,
  });

  constructor() {
    // O preço da finalidade escolhida é obrigatório e maior que zero
    this.form.controls.finalidade.valueChanges.subscribe(() => this.ajustarPrecoObrigatorio());
    this.ajustarPrecoObrigatorio();
  }

  ngOnInit(): void {
    this.carregar();
  }

  protected precoObrigatorio(campo: 'precoVenda' | 'precoAluguel'): boolean {
    return (campo === 'precoVenda') === (this.finalidade() === 'VENDA');
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    forkJoin({ bairros: this.bairrosApi.listar(), tipos: this.tiposApi.listar() }).subscribe({
      next: ({ bairros, tipos }) => {
        this.bairros.set(bairros);
        this.tipos.set(tipos);
        if (this.edicao()) {
          this.carregarImovel();
        } else {
          this.carregando.set(false);
        }
      },
      error: async (e) => {
        this.erro.set(await mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  private carregarImovel(): void {
    this.api.buscarPorId(Number(this.id())).subscribe({
      next: (i) => {
        this.form.patchValue({
          ...i,
          tipoImovelId: i.tipoImovel?.id ?? null,
          bairroId: i.bairro?.id ?? null,
        } as never);
        this.carregando.set(false);
      },
      error: async (e) => {
        this.erro.set(
          e instanceof HttpErrorResponse && e.status === 404
            ? 'Imóvel não encontrado.'
            : await mensagemDeErro(e, 'O imóvel'),
        );
        this.carregando.set(false);
      },
    });
  }

  protected salvar(): void {
    this.form.markAllAsTouched();
    this.erroSalvar.set(null);
    if (this.form.invalid) {
      this.erroSalvar.set('Confira os campos destacados antes de salvar.');
      return;
    }
    const v = this.form.getRawValue();
    const imovel: Imovel = {
      titulo: v.titulo!.trim(),
      descricao: v.descricao,
      finalidade: v.finalidade!,
      status: v.status!,
      precoVenda: v.precoVenda,
      precoAluguel: v.precoAluguel,
      dormitorios: v.dormitorios,
      banheiros: v.banheiros,
      garagem: v.garagem,
      areaTotal: v.areaTotal,
      areaConstruida: v.areaConstruida,
      endereco: v.endereco,
      numero: v.numero,
      complemento: v.complemento,
      cep: v.cep,
      caracteristicas: v.caracteristicas,
      destaque: !!v.destaque,
      tipoImovel: { id: v.tipoImovelId! } as TipoImovel,
      bairro: { id: v.bairroId! } as Bairro,
    };
    this.salvando.set(true);
    const req = this.edicao()
      ? this.api.atualizar(Number(this.id()), imovel)
      : this.api.criar(imovel);
    req.subscribe({
      next: () => {
        this.toast.sucesso(
          this.edicao()
            ? 'Imóvel atualizado.'
            : 'Imóvel cadastrado. Agora adicione as fotos na lista.',
        );
        this.router.navigate(['/admin/imoveis']);
      },
      error: async (e) => {
        this.salvando.set(false);
        this.erroSalvar.set(await mensagemDeErro(e, 'O imóvel'));
      },
    });
  }

  private ajustarPrecoObrigatorio(): void {
    const venda = this.form.controls.finalidade.value === 'VENDA';
    const obrigatorio = [Validators.required, Validators.min(0.01)];
    this.form.controls.precoVenda.setValidators(venda ? obrigatorio : [Validators.min(0)]);
    this.form.controls.precoAluguel.setValidators(venda ? [Validators.min(0)] : obrigatorio);
    this.form.controls.precoVenda.updateValueAndValidity({ emitEvent: false });
    this.form.controls.precoAluguel.updateValueAndValidity({ emitEvent: false });
  }
}
