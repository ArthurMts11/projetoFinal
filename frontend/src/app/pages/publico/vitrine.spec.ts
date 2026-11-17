import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { API_URL } from '../../core/config';
import { Vitrine } from './vitrine';

describe('Vitrine: destaques acompanham o filtro', () => {
  it('busca os destaques com os mesmos filtros da busca', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '', component: Vitrine }], withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/?bairroId=4&finalidade=VENDA');

    const http = TestBed.inject(HttpTestingController);
    const destaques = http.match(
      (r) => r.url === `${API_URL}/imoveis/buscar` && r.params.get('destaque') === 'true',
    );
    expect(destaques.length).toBe(1);
    expect(destaques[0].request.params.get('bairroId')).toBe('4');
    expect(destaques[0].request.params.get('finalidade')).toBe('VENDA');
    expect(destaques[0].request.params.get('status')).toBe('DISPONIVEL');
  });
});
