import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Planta baixa esquemática, desenhada quando o imóvel não tem foto.
 * Não é a planta real: é montada só com a quantidade de quartos, banheiros e vagas,
 * e por isso a legenda diz "planta ilustrativa".
 */

interface Comodo {
  x: number;
  y: number;
  w: number;
  h: number;
  rotulo: string;
}

interface Porta {
  /** Trecho da parede apagado para abrir o vão. */
  vao: { x1: number; x2: number; y: number };
  /** Folha da porta (linha) + arco de abertura, em um único path. */
  folha: string;
}

export interface Planta {
  externa: { x: number; y: number; w: number; h: number };
  comodos: Comodo[];
  /** Meia-parede entre sala e cozinha (cozinha americana). */
  meiaParede: { x: number; y1: number; y2: number } | null;
  portas: Porta[];
  portaEntrada: Porta;
  vaga: Comodo | null;
}

// Área de desenho dentro do viewBox 400 x 300 (mesma proporção 4:3 da foto do card)
const X0 = 28;
const Y0 = 54;
const LARGURA = 344;
const ALTURA = 190;
const LARGURA_VAGA = 70;
const PESO_QUARTO = 3;
const PESO_BANHEIRO = 1.7;
const MAX_QUARTOS = 5;
const MAX_BANHEIROS = 3;

/** Distribui a largura entre os cômodos proporcionalmente aos pesos. */
function dividir(
  x: number,
  largura: number,
  itens: { rotulo: string; peso: number }[],
): { x: number; w: number; rotulo: string }[] {
  const total = itens.reduce((s, i) => s + i.peso, 0);
  let cursor = x;
  return itens.map((i) => {
    const w = (largura * i.peso) / total;
    const parte = { x: cursor, w, rotulo: i.rotulo };
    cursor += w;
    return parte;
  });
}

/** Porta numa parede horizontal (y), abrindo para cima. */
function portaHorizontal(x: number, y: number, largura: number): Porta {
  return {
    vao: { x1: x, x2: x + largura, y },
    folha: `M ${x} ${y} L ${x} ${y - largura} A ${largura} ${largura} 0 0 1 ${x + largura} ${y}`,
  };
}

/** Rótulo curto quando o cômodo é estreito demais para o nome inteiro. */
function rotuloQueCabe(nome: string, curto: string, largura: number): string {
  return largura < nome.length * 8 + 12 ? curto : nome;
}

export function desenharPlanta(quartos: number, banheiros: number, vagas: number): Planta {
  const q = Math.min(Math.max(quartos, 0), MAX_QUARTOS);
  const b = Math.min(Math.max(banheiros, 0), MAX_BANHEIROS);
  const larguraCasa = vagas > 0 ? LARGURA - LARGURA_VAGA : LARGURA;

  const comodos: Comodo[] = [];
  const portas: Porta[] = [];
  let meiaParede: Planta['meiaParede'] = null;

  // Faixa de cima: quartos intercalados com banheiros
  const intimos: { rotulo: string; peso: number }[] = [];
  for (let i = 0; i < Math.max(q, b); i++) {
    if (i < q) intimos.push({ rotulo: 'Quarto', peso: PESO_QUARTO });
    if (i < b && q > 0) intimos.push({ rotulo: 'Banho', peso: PESO_BANHEIRO });
  }

  const alturaIntima = intimos.length ? Math.round(ALTURA * 0.48) : 0;
  const ySocial = Y0 + alturaIntima;
  const alturaSocial = ALTURA - alturaIntima;

  for (const c of dividir(X0, larguraCasa, intimos)) {
    const curto = c.rotulo === 'Quarto' ? 'Qto' : 'Bh';
    comodos.push({
      x: c.x,
      y: Y0,
      w: c.w,
      h: alturaIntima,
      rotulo: rotuloQueCabe(c.rotulo, curto, c.w),
    });
    portas.push(portaHorizontal(c.x + 6, ySocial, Math.min(16, c.w * 0.45)));
  }

  // Faixa de baixo: sala + cozinha. Sem quartos (sala comercial), um ambiente único + banheiros.
  if (q > 0) {
    const [sala, cozinha] = dividir(X0, larguraCasa, [
      { rotulo: 'Sala', peso: 3 },
      { rotulo: 'Cozinha', peso: 2 },
    ]);
    comodos.push({ x: sala.x, y: ySocial, w: sala.w, h: alturaSocial, rotulo: 'Sala' });
    comodos.push({
      x: cozinha.x,
      y: ySocial,
      w: cozinha.w,
      h: alturaSocial,
      rotulo: rotuloQueCabe('Cozinha', 'Coz.', cozinha.w),
    });
    meiaParede = { x: cozinha.x, y1: ySocial, y2: ySocial + alturaSocial * 0.45 };
  } else {
    const banhos = Array.from({ length: b }, () => ({ rotulo: 'Banho', peso: 1 }));
    for (const c of dividir(X0, larguraCasa, [{ rotulo: 'Ambiente', peso: 4 }, ...banhos])) {
      comodos.push({
        x: c.x,
        y: ySocial,
        w: c.w,
        h: alturaSocial,
        rotulo: rotuloQueCabe(c.rotulo, 'Bh', c.w),
      });
    }
  }

  const portaEntrada = portaHorizontal(X0 + 22, Y0 + ALTURA, 22);

  // Vaga: anexa à faixa social, do lado de fora da casa
  const vaga =
    vagas > 0
      ? {
          x: X0 + larguraCasa,
          y: ySocial,
          w: LARGURA_VAGA,
          h: alturaSocial,
          rotulo: vagas === 1 ? 'Vaga' : `${vagas} vagas`,
        }
      : null;

  return {
    externa: { x: X0, y: Y0, w: larguraCasa, h: ALTURA },
    comodos,
    meiaParede,
    portas,
    portaEntrada,
    vaga,
  };
}

@Component({
  selector: 'app-planta-baixa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="planta"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      [attr.aria-label]="descricao()"
    >
      @if (terreno()) {
        <rect
          class="planta-lote"
          [attr.x]="lote.x"
          [attr.y]="lote.y"
          [attr.width]="lote.w"
          [attr.height]="lote.h"
        />
        <text class="planta-rotulo" [attr.x]="lote.x + lote.w / 2" [attr.y]="lote.y + lote.h / 2">
          Lote sem construção
        </text>
      } @else {
        @let p = planta();
        @if (p.vaga; as v) {
          <rect
            class="planta-vaga"
            [attr.x]="v.x"
            [attr.y]="v.y"
            [attr.width]="v.w"
            [attr.height]="v.h"
          />
          <text class="planta-rotulo" [attr.x]="v.x + v.w / 2" [attr.y]="v.y + v.h / 2">
            {{ v.rotulo }}
          </text>
        }
        @for (c of p.comodos; track $index) {
          <rect
            class="planta-divisoria"
            [attr.x]="c.x"
            [attr.y]="c.y"
            [attr.width]="c.w"
            [attr.height]="c.h"
          />
        }
        @if (p.meiaParede; as m) {
          <line
            class="planta-divisoria"
            [attr.x1]="m.x"
            [attr.x2]="m.x"
            [attr.y1]="m.y1"
            [attr.y2]="m.y2"
          />
        }
        <rect
          class="planta-externa"
          [attr.x]="p.externa.x"
          [attr.y]="p.externa.y"
          [attr.width]="p.externa.w"
          [attr.height]="p.externa.h"
        />
        @for (porta of p.portas; track $index) {
          <line
            class="planta-vao"
            [attr.x1]="porta.vao.x1"
            [attr.x2]="porta.vao.x2"
            [attr.y1]="porta.vao.y"
            [attr.y2]="porta.vao.y"
          />
          <path class="planta-porta" [attr.d]="porta.folha" />
        }
        <line
          class="planta-vao planta-vao-externo"
          [attr.x1]="p.portaEntrada.vao.x1"
          [attr.x2]="p.portaEntrada.vao.x2"
          [attr.y1]="p.portaEntrada.vao.y"
          [attr.y2]="p.portaEntrada.vao.y"
        />
        <path class="planta-porta" [attr.d]="p.portaEntrada.folha" />
        @for (c of p.comodos; track $index) {
          <text class="planta-rotulo" [attr.x]="c.x + c.w / 2" [attr.y]="c.y + c.h / 2">
            {{ c.rotulo }}
          </text>
        }
      }
    </svg>
  `,
})
export class PlantaBaixa {
  readonly quartos = input(0);
  readonly banheiros = input(0);
  readonly vagas = input(0);
  /** Terreno não tem construção: desenha só o contorno do lote. */
  readonly terreno = input(false);

  protected readonly lote = { x: X0, y: Y0, w: LARGURA, h: ALTURA };

  protected readonly planta = computed(() =>
    desenharPlanta(this.quartos(), this.banheiros(), this.vagas()),
  );

  protected readonly descricao = computed(() =>
    this.terreno()
      ? 'Ilustração: lote sem construção'
      : `Planta ilustrativa: ${this.quartos()} quarto(s), ${this.banheiros()} banheiro(s), ${this.vagas()} vaga(s)`,
  );
}
