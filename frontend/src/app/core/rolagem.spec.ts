import { mudouDePagina } from './rolagem';

describe('mudouDePagina (rolar ao topo só ao trocar de página)', () => {
  it('trocar filtro, aba ou página da lista não é trocar de página', () => {
    expect(mudouDePagina('/?bairroId=2', '/?bairroId=2&page=1')).toBe(false);
    expect(mudouDePagina('/corretor/contratos', '/corretor/contratos?aba=preparar')).toBe(false);
  });

  it('ir para outra tela é trocar de página', () => {
    expect(mudouDePagina('/?bairroId=2', '/imovel/33')).toBe(true);
    expect(mudouDePagina('/corretor/contratos', '/corretor/contratos/3')).toBe(true);
  });

  it('primeira navegação conta como troca de página', () => {
    expect(mudouDePagina(null, '/')).toBe(true);
  });
});
