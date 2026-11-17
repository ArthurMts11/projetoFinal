import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { entrarComo } from '../../testing/token';
import { AuthService } from './auth.service';
import { perfilGuard } from './guards';
import { Perfil } from './models';

function rodarGuard(perfilDaRota: Perfil, url = '/area') {
  return TestBed.runInInjectionContext(() =>
    perfilGuard(perfilDaRota)({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  );
}

function destino(resultado: unknown): string {
  return TestBed.inject(Router).serializeUrl(resultado as UrlTree);
}

describe('perfilGuard e área inicial', () => {
  function configurar(perfil: Perfil | null) {
    entrarComo(perfil);
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  }

  it('sem login vai para /login guardando a URL pedida', () => {
    configurar(null);
    expect(destino(rodarGuard('CORRETOR', '/corretor/contratos'))).toBe(
      '/login?returnUrl=%2Fcorretor%2Fcontratos',
    );
  });

  it('corretor não entra na área do admin', () => {
    configurar('CORRETOR');
    expect(destino(rodarGuard('ADMIN'))).toBe('/acesso-negado');
  });

  it('cliente não entra na área do corretor', () => {
    configurar('CLIENTE');
    expect(destino(rodarGuard('CORRETOR'))).toBe('/acesso-negado');
  });

  it('corretor entra na área do corretor', () => {
    configurar('CORRETOR');
    expect(rodarGuard('CORRETOR')).toBe(true);
  });

  it('depois do login, cada perfil vai para a sua área', () => {
    configurar(null);
    const auth = TestBed.inject(AuthService);
    expect(auth.areaInicial('ADMIN')).toBe('/admin/painel');
    expect(auth.areaInicial('CORRETOR')).toBe('/corretor/painel');
    expect(auth.areaInicial('CLIENTE')).toBe('/cliente/ofertas');
  });
});
