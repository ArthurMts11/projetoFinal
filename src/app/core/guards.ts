import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';
import { Perfil } from './models';

/**
 * Protege as rotas privadas: sem login vai para /login (guardando a URL
 * pedida); logado com o perfil errado vai para /acesso-negado.
 * Assim, digitar a URL de uma tela protegida não exibe a tela.
 */
export function perfilGuard(perfil: Perfil): CanActivateFn {
  return (_rota, estado) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.token) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: estado.url } });
    }
    if (auth.usuario()?.perfil !== perfil) {
      return router.createUrlTree(['/acesso-negado']);
    }
    return true;
  };
}

/** Login e cadastro não fazem sentido para quem já entrou. */
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token ? inject(Router).createUrlTree([auth.areaInicial()]) : true;
};
