import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { contratoExemplo } from '../../../testing/contratos';
import { API_URL } from '../../core/config';
import { ContratosAdmin } from './contratos';

describe('ContratosAdmin (aprovação e devolução)', () => {
  let fixture: ComponentFixture<ContratosAdmin>;
  let http: HttpTestingController;
  const tela = () => fixture.nativeElement as HTMLElement;
  const texto = () => tela().textContent ?? '';

  function clicar(rotulo: string) {
    const botao = [...tela().querySelectorAll('button')].find(
      // Ignora a contagem que as abas mostram no fim (ex.: "Encerrados 1")
      (b) => b.textContent?.trim().replace(/\s+\d+$/, '') === rotulo,
    );
    expect(botao, `botão "${rotulo}"`).toBeTruthy();
    botao!.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ContratosAdmin);
    fixture.detectChanges();
    http
      .expectOne(`${API_URL}/contratos`)
      .flush([
        contratoExemplo('EM_APROVACAO', 'ALUGUEL', { valorFinal: 1450, prazoMeses: 24 }),
        contratoExemplo('ASSINADO', 'VENDA', { id: 9 }),
      ]);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('abre filtrado em "Em aprovação", com as condições preparadas e o corretor', () => {
    expect(texto()).toContain('Nº 7');
    expect(texto()).not.toContain('Nº 9');
    expect(texto()).toContain('24 meses');
    expect(texto()).toContain('Carla Corretora');
  });

  it('devolver sem motivo não chama a API', () => {
    clicar('Devolver');
    clicar('Devolver ao corretor');
    expect(texto()).toContain('Informe o motivo da devolução.');
    http.expectNone({ method: 'PATCH', url: `${API_URL}/contratos/7/devolver` });
  });

  it('devolver com motivo envia o motivo para a API', () => {
    clicar('Devolver');
    const campo = tela().querySelector<HTMLTextAreaElement>('textarea')!;
    campo.value = 'O prazo combinado foi de 30 meses.';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    clicar('Devolver ao corretor');

    const req = http.expectOne({ method: 'PATCH', url: `${API_URL}/contratos/7/devolver` });
    expect(req.request.body).toEqual({ motivo: 'O prazo combinado foi de 30 meses.' });
    req.flush(contratoExemplo('DEVOLVIDO'));
    http.expectOne(`${API_URL}/contratos`).flush([]);
  });

  it('contrato assinado não pode ser cancelado', () => {
    clicar('Encerrados');
    expect(texto()).toContain('Nº 9');
    expect(texto()).not.toContain('Cancelar');
  });
});
