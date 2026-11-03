import { HttpErrorResponse } from '@angular/common/http';

/**
 * Converte o erro da API numa frase para o usuário (nunca mostra JSON).
 * A API devolve {"status": 409, "erro": "mensagem"}; algumas rotas de
 * validação devolvem {"campo": "mensagem"}.
 */
export async function mensagemDeErro(erro: unknown, itemNaoEncontrado = 'O item'): Promise<string> {
  if (!(erro instanceof HttpErrorResponse)) {
    return 'Algo deu errado. Tente novamente.';
  }
  const corpo = await lerCorpo(erro.error);
  const doBackend = extrairMensagem(corpo);

  switch (erro.status) {
    case 0:
      return 'Não foi possível conectar ao servidor. Verifique se a API está rodando e tente novamente.';
    case 400:
      return doBackend ?? 'Há dados inválidos no formulário. Confira os campos.';
    case 401:
      return doBackend && !doBackend.includes('/public/login')
        ? doBackend
        : 'Sua sessão expirou. Entre novamente.';
    case 403:
      return 'Acesso negado: ' + (doBackend ?? 'você não tem permissão para esta ação.');
    case 404:
      return doBackend ?? `${itemNaoEncontrado} não foi encontrado.`;
    case 409:
      return doBackend ?? 'A operação não é permitida no estado atual.';
    case 429:
      return doBackend ?? 'Muitas tentativas. Aguarde alguns minutos.';
    default:
      return erro.status >= 500
        ? 'O servidor teve um problema ao processar o pedido. Tente novamente em instantes.'
        : (doBackend ?? 'Algo deu errado. Tente novamente.');
  }
}

// Downloads (PDF) chegam como Blob mesmo quando dão erro
async function lerCorpo(corpo: unknown): Promise<unknown> {
  if (corpo instanceof Blob) {
    try {
      return JSON.parse(await corpo.text());
    } catch {
      return null;
    }
  }
  return corpo;
}

function extrairMensagem(corpo: unknown): string | null {
  if (!corpo || typeof corpo !== 'object') {
    return null;
  }
  const obj = corpo as Record<string, unknown>;
  if (typeof obj['erro'] === 'string') {
    return obj['erro'];
  }
  // Formato {"campo": "mensagem"} das validações
  const primeira = Object.values(obj).find((v) => typeof v === 'string');
  return typeof primeira === 'string' ? primeira : null;
}
