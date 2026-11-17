import { Subject } from 'rxjs';

import { abrirPdf } from './util';

describe('abrirPdf', () => {
  let criarUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    criarUrl = vi.fn(() => 'blob:pdf-1');
    URL.createObjectURL = criarUrl as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => vi.restoreAllMocks());

  it('abre a aba já no clique e mostra o PDF nela quando ele chega', () => {
    const aba = { location: { href: '' }, close: vi.fn() };
    const abrir = vi.spyOn(window, 'open').mockReturnValue(aba as unknown as Window);
    const pdf = new Subject<Blob>();

    abrirPdf(pdf, 'contrato-3.pdf', vi.fn());
    expect(abrir).toHaveBeenCalledTimes(1); // antes da resposta: o bloqueador de pop-ups não barra

    pdf.next(new Blob(['%PDF-1.4']));
    expect(aba.location.href).toBe('blob:pdf-1');
    const blob = criarUrl.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/pdf');
  });

  it('se a aba foi bloqueada, baixa o arquivo', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const clique = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const pdf = new Subject<Blob>();

    abrirPdf(pdf, 'contrato-3.pdf', vi.fn());
    pdf.next(new Blob(['%PDF-1.4']));

    expect(clique).toHaveBeenCalledTimes(1);
  });

  it('se a API falhar, fecha a aba vazia e avisa', () => {
    const aba = { location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(aba as unknown as Window);
    const aoFalhar = vi.fn();
    const pdf = new Subject<Blob>();

    abrirPdf(pdf, 'contrato-3.pdf', aoFalhar);
    pdf.error(new Error('403'));

    expect(aba.close).toHaveBeenCalled();
    expect(aoFalhar).toHaveBeenCalled();
  });
});
