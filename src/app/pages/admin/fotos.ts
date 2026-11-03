import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { concatMap, from, toArray } from 'rxjs';

import { FotosService } from '../../core/api/cadastros.service';
import { ImoveisService } from '../../core/api/imoveis.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { mensagemDeErro } from '../../core/erros';
import { Foto, Imovel } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { urlFoto } from '../../core/util';
import { Estado } from '../../shared/estado';
import { Icone } from '../../shared/icone';

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO = 10 * 1024 * 1024;

/** CRUD de fotos de um imóvel: enviar, listar, alterar ordem/capa e excluir. */
@Component({
  selector: 'app-fotos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Estado, Icone],
  template: `
    <div class="container pagina">
      <a routerLink="/admin/imoveis" class="voltar">‹ Voltar para imóveis</a>
      <div class="pagina-cabecalho">
        <div>
          <h1>Fotos do imóvel</h1>
          @if (imovel(); as i) {
            <p class="texto-suave">{{ i.titulo }} · Cód. {{ i.id }}</p>
          }
        </div>
      </div>

      <section class="cartao">
        <h2>Adicionar fotos</h2>
        <div class="area-upload">
          <input
            #arquivo
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            (change)="selecionar(arquivo)"
            aria-label="Escolher fotos"
          />
          <button
            type="button"
            class="btn btn-primario"
            [disabled]="selecionados().length === 0 || enviando()"
            (click)="enviar(arquivo)"
          >
            {{ enviando() ? 'Enviando…' : 'Enviar ' + (selecionados().length || '') + ' foto(s)' }}
          </button>
        </div>
        <p class="texto-suave" style="margin: 8px 0 0; font-size: .88rem">
          JPG, PNG ou WEBP, até 10 MB cada. A primeira foto vira capa automaticamente se o imóvel
          não tiver uma.
        </p>
        @if (erroUpload()) {
          <div class="alerta alerta-erro" role="alert" style="margin-top: 10px">
            {{ erroUpload() }}
          </div>
        }
      </section>

      <app-estado
        [carregando]="carregando()"
        [erro]="erro()"
        [vazio]="fotos().length === 0"
        mensagemVazio="Este imóvel ainda não tem fotos."
        (tentarDeNovo)="carregar()"
      >
        <div class="grade-fotos">
          @for (f of fotos(); track f.id) {
            <figure class="foto-item" [class.capa]="f.capa" style="margin: 0">
              <img [src]="url(f)" [alt]="'Foto ' + f.ordem" loading="lazy" />
              <div class="foto-item-corpo">
                @if (f.capa) {
                  <span class="badge badge-sucesso">Capa</span>
                }
                <div class="foto-item-linha">
                  <label class="texto-suave" [for]="'ordem-' + f.id" style="font-size: .85rem"
                    >Ordem</label
                  >
                  <input
                    type="number"
                    min="1"
                    step="1"
                    [id]="'ordem-' + f.id"
                    [value]="f.ordem"
                    #ordem
                  />
                  <button
                    type="button"
                    class="btn btn-secundario btn-sm"
                    (click)="salvarOrdem(f, ordem.value)"
                  >
                    Salvar
                  </button>
                </div>
                <div class="foto-item-linha">
                  @if (!f.capa) {
                    <button type="button" class="btn btn-secundario btn-sm" (click)="tornarCapa(f)">
                      <app-icone nome="estrela" [tamanho]="15" /> Tornar capa
                    </button>
                  }
                  <button
                    type="button"
                    class="btn btn-secundario btn-sm"
                    (click)="excluir(f)"
                    aria-label="Excluir foto"
                  >
                    <app-icone nome="lixo" [tamanho]="15" /> Excluir
                  </button>
                </div>
              </div>
            </figure>
          }
        </div>
      </app-estado>
    </div>
  `,
})
export class Fotos implements OnInit {
  readonly id = input.required<string>();

  private readonly api = inject(FotosService);
  private readonly imoveis = inject(ImoveisService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly toast = inject(ToastService);

  protected readonly imovel = signal<Imovel | null>(null);
  protected readonly fotos = signal<Foto[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly selecionados = signal<File[]>([]);
  protected readonly enviando = signal(false);
  protected readonly erroUpload = signal<string | null>(null);

  ngOnInit(): void {
    this.imoveis
      .buscarPorId(this.imovelId)
      .subscribe({ next: (i) => this.imovel.set(i), error: () => {} });
    this.carregar();
  }

  private get imovelId(): number {
    return Number(this.id());
  }

  protected url(f: Foto): string {
    return urlFoto(f.url);
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listar(this.imovelId).subscribe({
      next: (lista) => {
        this.fotos.set(
          [...lista].sort(
            (a, b) => Number(b.capa) - Number(a.capa) || (a.ordem ?? 0) - (b.ordem ?? 0),
          ),
        );
        this.carregando.set(false);
      },
      error: async (e) => {
        this.erro.set(await mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  protected selecionar(input: HTMLInputElement): void {
    this.erroUpload.set(null);
    const arquivos = Array.from(input.files ?? []);
    const invalido = arquivos.find(
      (a) => !TIPOS_ACEITOS.includes(a.type) || a.size > TAMANHO_MAXIMO,
    );
    if (invalido) {
      this.erroUpload.set(`"${invalido.name}" não é uma imagem JPG, PNG ou WEBP de até 10 MB.`);
      this.selecionados.set([]);
      input.value = '';
      return;
    }
    this.selecionados.set(arquivos);
  }

  protected enviar(input: HTMLInputElement): void {
    const semCapa = !this.fotos().some((f) => f.capa);
    this.enviando.set(true);
    // Um por vez, para manter a ordem
    from(this.selecionados())
      .pipe(
        concatMap((a) => this.api.enviar(this.imovelId, a)),
        toArray(),
      )
      .subscribe({
        next: (novas) => {
          this.enviando.set(false);
          this.selecionados.set([]);
          input.value = '';
          this.toast.sucesso(`${novas.length} foto(s) enviada(s).`);
          if (semCapa && novas.length) {
            this.api
              .tornarCapa(novas[0].id)
              .subscribe({ next: () => this.carregar(), error: () => this.carregar() });
          } else {
            this.carregar();
          }
        },
        error: async (e) => {
          this.enviando.set(false);
          this.erroUpload.set(await mensagemDeErro(e, 'O imóvel'));
          this.carregar();
        },
      });
  }

  protected salvarOrdem(f: Foto, valor: string): void {
    const ordem = Number(valor);
    if (!Number.isInteger(ordem) || ordem < 1) {
      this.toast.erro('A ordem precisa ser um número inteiro a partir de 1.');
      return;
    }
    this.api.alterarOrdem(f.id, ordem).subscribe({
      next: () => {
        this.toast.sucesso('Ordem atualizada.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'A foto')),
    });
  }

  protected tornarCapa(f: Foto): void {
    this.api.tornarCapa(f.id).subscribe({
      next: () => {
        this.toast.sucesso('Capa atualizada.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'A foto')),
    });
  }

  protected async excluir(f: Foto): Promise<void> {
    if (!(await this.confirmacao.excluir('esta foto'))) return;
    this.api.excluir(f.id).subscribe({
      next: () => {
        this.toast.sucesso('Foto excluída.');
        this.carregar();
      },
      error: async (e) => this.toast.erro(await mensagemDeErro(e, 'A foto')),
    });
  }
}
