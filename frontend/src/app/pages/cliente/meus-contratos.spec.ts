import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { contratoExemplo } from '../../../testing/contratos';
import { API_URL } from '../../core/config';
import { MeusContratos } from './meus-contratos';

registerLocaleData(localePt);

describe('MeusContratos (cliente)', () => {
  it('mostra o valor final negociado pelo corretor, não o da oferta', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
      ],
    });
    const fixture = TestBed.createComponent(MeusContratos);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne(`${API_URL}/contratos/meus`)
      .flush([contratoExemplo('AGUARDANDO_ASSINATURA', 'ALUGUEL', { valorFinal: 1420 })]);
    await fixture.whenStable();
    fixture.detectChanges();

    // O pipe de moeda usa espaço não separável entre "R$" e o número
    const texto = ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s/g, ' ');
    expect(texto).toContain('R$ 1.420,00');
    expect(texto).not.toContain('R$ 1.500,00');
  });
});
