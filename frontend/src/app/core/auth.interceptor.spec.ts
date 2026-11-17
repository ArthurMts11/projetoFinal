import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { entrarComo } from '../../testing/token';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { API_URL } from './config';

describe('authInterceptor', () => {
  beforeEach(() => {
    entrarComo('CORRETOR');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  it('envia o token no cabeçalho Authorization', () => {
    TestBed.inject(HttpClient).get(`${API_URL}/contratos`).subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(`${API_URL}/contratos`);
    expect(req.request.headers.get('Authorization')).toMatch(/^Bearer /);
    req.flush([]);
  });

  it('401 apaga o token e leva ao login', () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    TestBed.inject(HttpClient).get(`${API_URL}/contratos`).subscribe({ error: () => undefined });
    TestBed.inject(HttpTestingController)
      .expectOne(`${API_URL}/contratos`)
      .flush({ status: 401, erro: 'Token inválido' }, { status: 401, statusText: 'Unauthorized' });

    expect(TestBed.inject(AuthService).logado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/login'], expect.anything());
  });
});
