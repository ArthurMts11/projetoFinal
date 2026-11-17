import { HttpErrorResponse } from '@angular/common/http';

import { mensagemDeErro } from './erros';

const erro = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });

describe('mensagemDeErro', () => {
  it('409 mostra a regra de negócio que veio do backend', async () => {
    const msg = await mensagemDeErro(erro(409, { status: 409, erro: 'Só é possível aprovar contratos em aprovação.' }));
    expect(msg).toBe('Só é possível aprovar contratos em aprovação.');
  });

  it('403 deixa claro que é acesso negado', async () => {
    expect(await mensagemDeErro(erro(403))).toMatch(/^Acesso negado/);
  });

  it('404 cita o item que não foi encontrado', async () => {
    expect(await mensagemDeErro(erro(404), 'O contrato')).toBe('O contrato não foi encontrado.');
  });

  it('401 pede para entrar de novo', async () => {
    expect(await mensagemDeErro(erro(401))).toBe('Sua sessão expirou. Entre novamente.');
  });

  it('API fora do ar (status 0) explica que não conectou', async () => {
    expect(await mensagemDeErro(erro(0))).toContain('Não foi possível conectar');
  });

  it('400 de validação mostra a mensagem do campo', async () => {
    expect(await mensagemDeErro(erro(400, { motivo: 'Informe o motivo da devolução.' }))).toBe(
      'Informe o motivo da devolução.',
    );
  });

  it('erro em download (Blob) também é lido', async () => {
    const json = JSON.stringify({ erro: 'Você não tem acesso a este contrato.' });
    // O Blob do jsdom não implementa text(); nos navegadores ele existe
    const blob = Object.assign(new Blob([json]), { text: async () => json });
    expect(await mensagemDeErro(erro(403, blob))).toContain('Você não tem acesso a este contrato.');
  });
});
