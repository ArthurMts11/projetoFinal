import { Injectable, signal } from '@angular/core';

export interface PedidoConfirmacao {
  titulo: string;
  mensagem: string;
  botao: string;
  perigo: boolean;
  responder: (ok: boolean) => void;
}

/**
 * Janela de confirmação usada antes de excluir/aceitar/recusar.
 * Uso: if (await confirmacao.perguntar({...})) { ... }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacaoService {
  readonly pedido = signal<PedidoConfirmacao | null>(null);

  perguntar(opcoes: {
    titulo: string;
    mensagem: string;
    botao?: string;
    perigo?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      this.pedido.set({
        titulo: opcoes.titulo,
        mensagem: opcoes.mensagem,
        botao: opcoes.botao ?? 'Confirmar',
        perigo: opcoes.perigo ?? false,
        responder: (ok) => {
          this.pedido.set(null);
          resolve(ok);
        },
      });
    });
  }

  excluir(oQue: string): Promise<boolean> {
    return this.perguntar({
      titulo: 'Confirmar exclusão',
      mensagem: `Tem certeza de que deseja excluir ${oQue}? Esta ação não pode ser desfeita.`,
      botao: 'Excluir',
      perigo: true,
    });
  }
}
