import { StatusContrato, StatusImovel, StatusOferta } from './models';

// Textos amigáveis para os enums da API

export const ROTULO_STATUS_IMOVEL: Record<StatusImovel, string> = {
  DISPONIVEL: 'Disponível',
  RESERVADO: 'Reservado',
  VENDIDO: 'Vendido',
  ALUGADO: 'Alugado',
  INATIVO: 'Inativo',
};

export const ROTULO_STATUS_OFERTA: Record<StatusOferta, string> = {
  PENDENTE: 'Pendente',
  ACEITA: 'Aceita',
  EM_ESPERA: 'Em espera',
  RECUSADA: 'Recusada',
  CANCELADA: 'Cancelada',
};

export const ROTULO_STATUS_CONTRATO: Record<StatusContrato, string> = {
  AGUARDANDO_ASSINATURA: 'Aguardando assinatura',
  ASSINADO: 'Assinado',
  CANCELADO: 'Cancelado',
};

export const ROTULO_FINALIDADE: Record<string, string> = {
  VENDA: 'Venda',
  ALUGUEL: 'Aluguel',
};

/** Classe CSS da etiqueta (badge) de cada situação. */
export function corDoStatus(status: string): string {
  switch (status) {
    case 'DISPONIVEL':
    case 'ACEITA':
    case 'ASSINADO':
      return 'badge-sucesso';
    case 'PENDENTE':
    case 'AGUARDANDO_ASSINATURA':
    case 'RESERVADO':
      return 'badge-alerta';
    case 'EM_ESPERA':
      return 'badge-info';
    case 'RECUSADA':
    case 'CANCELADA':
    case 'CANCELADO':
      return 'badge-perigo';
    default:
      return 'badge-neutro';
  }
}
