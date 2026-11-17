import { Observable } from 'rxjs';

import { API_URL } from './config';
import { Imovel } from './models';

/** Preço que vale para o imóvel, conforme a finalidade. */
export function precoDoImovel(imovel: Imovel): number | null {
  return (imovel.finalidade === 'VENDA' ? imovel.precoVenda : imovel.precoAluguel) ?? null;
}

/** URL da foto de capa (ou null, e o card mostra a ilustração padrão). */
export function urlCapa(imovel: Imovel): string | null {
  const foto = imovel.fotos?.find((f) => f.capa) ?? imovel.fotos?.[0];
  return foto ? API_URL + foto.url : null;
}

export function urlFoto(caminho: string): string {
  return API_URL + caminho;
}

/** Salva um Blob como arquivo no computador do usuário. */
export function baixarArquivo(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Abre o PDF numa aba nova, no visualizador do navegador.
 * A aba é aberta já no clique (antes da resposta da API) para o bloqueador de
 * pop-ups não barrar; se mesmo assim for bloqueada, o arquivo é baixado.
 */
export function abrirPdf(
  pdf: Observable<Blob>,
  nomeArquivo: string,
  aoFalhar: (erro: unknown) => void,
): void {
  const aba = window.open('', '_blank');
  pdf.subscribe({
    next: (conteudo) => {
      const blob = new Blob([conteudo], { type: 'application/pdf' });
      if (!aba) {
        baixarArquivo(blob, nomeArquivo);
        return;
      }
      const url = URL.createObjectURL(blob);
      aba.location.href = url;
      // A aba precisa da URL enquanto carrega o PDF
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    error: (erro: unknown) => {
      aba?.close();
      aoFalhar(erro);
    },
  });
}

/** Quantos itens há em cada situação; a chave '' traz o total (aba "Todas"). */
export function contarPorStatus(itens: readonly { status: string }[]): Map<string, number> {
  const contagem = new Map<string, number>([['', itens.length]]);
  for (const item of itens) {
    contagem.set(item.status, (contagem.get(item.status) ?? 0) + 1);
  }
  return contagem;
}
