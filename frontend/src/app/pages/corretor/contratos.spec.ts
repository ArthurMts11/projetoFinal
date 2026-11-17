import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { contratoExemplo } from '../../../testing/contratos';
import { API_URL } from '../../core/config';
import { ContratosCorretor } from './contratos';

describe('ContratosCorretor (lista)', () => {
  function montar() {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ContratosCorretor);
    fixture.detectChanges();
    return {
      fixture,
      http: TestBed.inject(HttpTestingController),
      texto: () => (fixture.nativeElement as HTMLElement).textContent ?? '',
    };
  }

  it('carrega e lista os contratos com a situação', async () => {
    const { fixture, http, texto } = montar();
    expect(texto()).toContain('Carregando…');
    http
      .expectOne(`${API_URL}/contratos`)
      .flush([contratoExemplo('DEVOLVIDO'), contratoExemplo('EM_APROVACAO', 'VENDA', { id: 8 })]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(texto()).toContain('Nº 7');
    expect(texto()).toContain('Nº 8');
    expect(texto()).toContain('Devolvido');
    expect(texto()).toContain('Em aprovação');
  });

  it('mostra o erro quando a API não responde', async () => {
    const { fixture, http, texto } = montar();
    http.expectOne(`${API_URL}/contratos`).flush(null, { status: 0, statusText: 'Unknown Error' });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r)); // mensagem de erro é assíncrona
    fixture.detectChanges();
    expect(texto()).toContain('Não foi possível conectar ao servidor');
  });

  it('sem contratos explica de onde eles vêm', async () => {
    const { fixture, http, texto } = montar();
    http.expectOne(`${API_URL}/contratos`).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(texto()).toContain('Os contratos aparecem aqui quando você aceita uma oferta.');
  });
});
