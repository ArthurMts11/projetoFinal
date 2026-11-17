// Formato dos objetos que a API devolve

export type Perfil = 'ADMIN' | 'CORRETOR' | 'CLIENTE';
export type Finalidade = 'VENDA' | 'ALUGUEL';
export type StatusImovel = 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO' | 'ALUGADO' | 'INATIVO';
export type TipoOferta = 'VENDA' | 'ALUGUEL';
export type StatusOferta = 'PENDENTE' | 'ACEITA' | 'EM_ESPERA' | 'RECUSADA' | 'CANCELADA';
export type StatusContrato =
  'RASCUNHO' | 'EM_APROVACAO' | 'DEVOLVIDO' | 'AGUARDANDO_ASSINATURA' | 'ASSINADO' | 'CANCELADO';

export interface Bairro {
  id?: number;
  nome: string;
  cidade: string;
  estado: string;
  cepInicial?: string | null;
  cepFinal?: string | null;
}

export interface TipoImovel {
  id?: number;
  nome: string;
  descricao?: string | null;
}

export interface Foto {
  id: number;
  nomeArquivo: string;
  url: string;
  capa: boolean;
  ordem: number | null;
}

export interface Imovel {
  id?: number;
  titulo: string;
  descricao?: string | null;
  precoVenda?: number | null;
  precoAluguel?: number | null;
  finalidade: Finalidade;
  status: StatusImovel;
  dormitorios?: number | null;
  banheiros?: number | null;
  garagem?: number | null;
  areaTotal?: number | null;
  areaConstruida?: number | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  cep?: string | null;
  caracteristicas?: string | null;
  destaque: boolean;
  tipoImovel: TipoImovel;
  bairro: Bairro;
  fotos?: Foto[];
}

export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  tipo: Perfil;
  senha?: string;
}

export interface Oferta {
  id: number;
  imovel: Imovel;
  usuario: Usuario;
  tipo: TipoOferta;
  valorProposto: number;
  mensagem?: string | null;
  status: StatusOferta;
  createdAt: string;
}

export interface Contrato {
  id: number;
  oferta: Oferta;
  status: StatusContrato;
  valorFinal: number | null;
  prazoMeses: number | null;
  diaVencimento: number | null;
  observacoes: string | null;
  motivoDevolucao: string | null;
  corretor: Usuario | null;
  dataEnvio?: string | null;
  dataAprovacao?: string | null;
  dataAssinatura?: string | null;
  createdAt: string;
}

/** Corpo do PUT /contratos/{id}: dados que o corretor completa. */
export interface PreparoContrato {
  valorFinal: number;
  prazoMeses: number | null;
  diaVencimento: number;
  observacoes: string;
}

export interface Pagina<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface FiltrosImovel {
  status?: StatusImovel | '';
  bairroId?: number | null;
  tipoId?: number | null;
  finalidade?: Finalidade | '';
  precoMin?: number | null;
  precoMax?: number | null;
  busca?: string;
  destaque?: boolean;
  ordem?: 'recentes' | 'preco_asc' | 'preco_desc';
  page?: number;
  size?: number;
}

export interface Dashboard {
  imoveisDisponiveis: number;
  ofertasPendentes: number;
  contratosAguardandoAssinatura: number;
  totalImoveis: number;
  imoveisPorBairro: Record<string, number>;
  ofertasPorSituacao: Record<string, number>;
  imoveisPorFinalidade: Record<string, number>;
  contratosEmAprovacao: number;
  contratosPorSituacao: Record<string, number>;
}

export interface DashboardCorretor {
  ofertasPendentes: number;
  contratosParaPreparar: number;
  contratosEmAprovacao: number;
  ofertasPorSituacao: Record<string, number>;
  contratosPorSituacao: Record<string, number>;
}

/** Dados que vêm dentro do JWT (payload). */
export interface UsuarioToken {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  expiraEm: number; // milissegundos
}

/** Corpo do POST /imoveis/sabermais/{id} (SaberMaisDTO no backend). */
export interface PedidoDeContato {
  nome: string;
  telefone: string;
  email: string;
  mensagem: string;
}
