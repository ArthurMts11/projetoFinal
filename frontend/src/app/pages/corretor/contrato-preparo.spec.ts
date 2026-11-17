import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { contratoExemplo } from '../../../testing/contratos';
import { API_URL } from '../../core/config';
import { Contrato } from '../../core/models';
import { ContratoPreparo } from './contrato-preparo';

const URL_CONTRATO = `${API_URL}/contratos/7`;

describe('ContratoPreparo (corretor)', () => {
  let fixture: ComponentFixture<ContratoPreparo>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ContratoPreparo);
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const tela = () => fixture.nativeElement as HTMLElement;
  const texto = () => tela().textContent ?? '';
  const campo = (nome: string) =>
    tela().querySelector<HTMLInputElement>(`[formControlName="${nome}"]`);

  // A mensagem de erro é montada de forma assíncrona (pode ler o corpo de um Blob)
  async function atualizar() {
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    fixture.detectChanges();
  }

  async function responder(contrato: Contrato) {
    http.expectOne(URL_CONTRATO).flush(contrato);
    await atualizar();
  }

  function preencher(nome: string, valor: string) {
    const input = campo(nome)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function clicar(rotulo: string) {
    const botao = [...tela().querySelectorAll('button')].find((b) =>
      b.textContent?.includes(rotulo),
    );
    expect(botao, `botão "${rotulo}"`).toBeTruthy();
    botao!.click();
    fixture.detectChanges();
  }

  it('mostra "Carregando…" e depois o formulário com os dados do contrato', async () => {
    expect(texto()).toContain('Carregando…');
    await responder(contratoExemplo());
    expect(texto()).toContain('Contrato nº 7');
    expect(texto()).toContain('Ana Cliente');
    expect(campo('valorFinal')!.value).toBe('1500');
    expect(campo('prazoMeses')!.value).toBe('30');
  });

  it('mostra o erro quando a API falha', async () => {
    http
      .expectOne(URL_CONTRATO)
      .flush(
        { status: 404, erro: 'Contrato 7 não encontrado.' },
        { status: 404, statusText: 'Not Found' },
      );
    await atualizar();
    expect(texto()).toContain('Contrato 7 não encontrado.');
  });

  it('não envia o formulário com dia de vencimento inválido', async () => {
    await responder(contratoExemplo());
    preencher('diaVencimento', '31');
    clicar('Salvar');
    expect(texto()).toContain('O vencimento vai do dia 1 ao 28.');
    http.expectNone({ method: 'PUT', url: URL_CONTRATO });
  });

  it('salva os dados preparados', async () => {
    await responder(contratoExemplo());
    preencher('valorFinal', '1400');
    clicar('Salvar');
    const req = http.expectOne({ method: 'PUT', url: URL_CONTRATO });
    expect(req.request.body).toEqual({
      valorFinal: 1400,
      prazoMeses: 30,
      diaVencimento: 10,
      observacoes: '',
    });
    req.flush(contratoExemplo('RASCUNHO', 'ALUGUEL', { valorFinal: 1400 }));
  });

  it('na venda não pede prazo', async () => {
    await responder(contratoExemplo('RASCUNHO', 'VENDA'));
    expect(campo('prazoMeses')).toBeNull();
  });

  it('contrato devolvido mostra o motivo do admin', async () => {
    await responder(
      contratoExemplo('DEVOLVIDO', 'ALUGUEL', { motivoDevolucao: 'O prazo combinado é 12 meses.' }),
    );
    expect(texto()).toContain('O prazo combinado é 12 meses.');
  });

  it('contrato em aprovação fica só para leitura', async () => {
    await responder(contratoExemplo('EM_APROVACAO'));
    expect(campo('valorFinal')).toBeNull();
    expect(texto()).not.toContain('Enviar para aprovação');
    expect(texto()).toContain('Aguardando a aprovação do administrador');
  });
});
