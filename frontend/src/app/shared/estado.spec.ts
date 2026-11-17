import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Estado } from './estado';

@Component({
  imports: [Estado],
  template: `
    <app-estado
      [carregando]="carregando()"
      [erro]="erro()"
      [vazio]="vazio()"
      mensagemVazio="Nenhum contrato."
      (tentarDeNovo)="tentativas = tentativas + 1"
    >
      <p class="conteudo">Lista</p>
    </app-estado>
  `,
})
class Hospedeiro {
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly vazio = signal(false);
  tentativas = 0;
}

function montar() {
  const fixture = TestBed.createComponent(Hospedeiro);
  fixture.detectChanges();
  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  return { fixture, host: fixture.componentInstance, texto };
}

describe('Estado (carregando, erro, vazio)', () => {
  it('mostra "Carregando…" e esconde o conteúdo enquanto carrega', () => {
    const { fixture, host, texto } = montar();
    host.carregando.set(true);
    fixture.detectChanges();
    expect(texto()).toContain('Carregando…');
    expect(texto()).not.toContain('Lista');
  });

  it('mostra a mensagem de erro e o botão "Tentar de novo" emite o evento', () => {
    const { fixture, host, texto } = montar();
    host.erro.set('Não foi possível conectar ao servidor.');
    fixture.detectChanges();
    expect(texto()).toContain('Não foi possível carregar');
    expect(texto()).toContain('Não foi possível conectar ao servidor.');
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    expect(host.tentativas).toBe(1);
  });

  it('mostra "Sem resultados" com a mensagem própria da tela', () => {
    const { fixture, host, texto } = montar();
    host.vazio.set(true);
    fixture.detectChanges();
    expect(texto()).toContain('Sem resultados');
    expect(texto()).toContain('Nenhum contrato.');
  });

  it('mostra o conteúdo quando há dados', () => {
    const { texto } = montar();
    expect(texto()).toContain('Lista');
  });
});
