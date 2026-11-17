import { Contrato, StatusContrato, TipoOferta } from '../app/core/models';

/** Contrato de exemplo para os testes das telas. */
export function contratoExemplo(
  status: StatusContrato = 'RASCUNHO',
  tipo: TipoOferta = 'ALUGUEL',
  extras: Partial<Contrato> = {},
): Contrato {
  return {
    id: 7,
    status,
    valorFinal: 1500,
    prazoMeses: tipo === 'ALUGUEL' ? 30 : null,
    diaVencimento: 10,
    observacoes: null,
    motivoDevolucao: null,
    corretor: { id: 20, nome: 'Carla Corretora', email: 'carla@teste.com', tipo: 'CORRETOR' },
    createdAt: '2026-11-17T10:00:00',
    oferta: {
      id: 3,
      tipo,
      valorProposto: 1500,
      status: 'ACEITA',
      createdAt: '2026-11-16T10:00:00',
      usuario: { id: 10, nome: 'Ana Cliente', email: 'ana@teste.com', tipo: 'CLIENTE' },
      imovel: {
        id: 5,
        titulo: 'Casa no Centro',
        finalidade: tipo === 'VENDA' ? 'VENDA' : 'ALUGUEL',
        status: 'RESERVADO',
        destaque: false,
        tipoImovel: { id: 1, nome: 'Casa' },
        bairro: { id: 1, nome: 'Centro', cidade: 'Panambi', estado: 'RS' },
      },
    },
    ...extras,
  };
}
