import { ViewportScroller } from '@angular/common';
import { Router, Scroll } from '@angular/router';
import { filter } from 'rxjs';

/** Só a rota (sem ?filtros e #âncora) define se o usuário foi para outra página. */
export function mudouDePagina(anterior: string | null, atual: string): boolean {
  const caminho = (url: string) => url.split(/[?#]/)[0];
  return anterior === null || caminho(anterior) !== caminho(atual);
}

/**
 * Rolagem do site: voltar/avançar do navegador restaura a posição; ir para outra
 * página vai ao topo; trocar filtro, aba ou página da lista mantém o usuário onde está.
 */
export function controlarRolagem(router: Router, rolagem: ViewportScroller): void {
  let urlAnterior: string | null = null;
  router.events.pipe(filter((e): e is Scroll => e instanceof Scroll)).subscribe((e) => {
    const url = e.routerEvent.url;
    if (e.position) {
      rolagem.scrollToPosition(e.position);
    } else if (e.anchor) {
      rolagem.scrollToAnchor(e.anchor);
    } else if (mudouDePagina(urlAnterior, url)) {
      rolagem.scrollToPosition([0, 0]);
    }
    urlAnterior = url;
  });
}
