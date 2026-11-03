import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  tipo: 'sucesso' | 'erro' | 'aviso';
  texto: string;
}

/** Mensagens rápidas no canto da tela (sucesso, erro, aviso). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly mensagens = signal<Toast[]>([]);
  private proximoId = 1;

  sucesso(texto: string): void {
    this.mostrar('sucesso', texto);
  }

  erro(texto: string): void {
    this.mostrar('erro', texto, 7000);
  }

  aviso(texto: string): void {
    this.mostrar('aviso', texto, 6000);
  }

  fechar(id: number): void {
    this.mensagens.update((lista) => lista.filter((m) => m.id !== id));
  }

  private mostrar(tipo: Toast['tipo'], texto: string, duracao = 4000): void {
    const id = this.proximoId++;
    this.mensagens.update((lista) => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.fechar(id), duracao);
  }
}
