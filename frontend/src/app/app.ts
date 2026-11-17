import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { IMOBILIARIA } from './core/config';
import { controlarRolagem } from './core/rolagem';
import { Cabecalho } from './layout/cabecalho';
import { ConfirmacaoDialogo } from './shared/confirmacao-dialogo';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, Cabecalho, Toasts, ConfirmacaoDialogo],
  template: `
    <a class="pular-conteudo" href="#conteudo">Pular para o conteúdo</a>
    <app-cabecalho />
    <main id="conteudo" class="principal">
      <router-outlet />
    </main>
    <footer class="rodape">
      <div class="container rodape-colunas">
        <div class="rodape-sobre">
          <p class="rodape-marca">Fogami.</p>
          <p>
            Imóveis à venda e para alugar em Panambi (RS), com atendimento de quem conhece a cidade.
          </p>
        </div>
        <nav aria-label="Imóveis">
          <h2 class="rodape-titulo">Imóveis</h2>
          <a routerLink="/" [queryParams]="{ finalidade: 'VENDA' }">Para comprar</a>
          <a routerLink="/" [queryParams]="{ finalidade: 'ALUGUEL' }">Para alugar</a>
          <a routerLink="/">Todos os imóveis</a>
        </nav>
        <nav aria-label="Sua conta">
          <h2 class="rodape-titulo">Sua conta</h2>
          <a routerLink="/login">Entrar</a>
          <a routerLink="/cadastro">Criar conta</a>
        </nav>
        <div>
          <h2 class="rodape-titulo">Contato</h2>
          <a [href]="'tel:' + telefoneLink">{{ imobiliaria.telefone }}</a>
          <a [href]="'mailto:' + imobiliaria.email">{{ imobiliaria.email }}</a>
        </div>
      </div>
      <div class="container rodape-base">
        <span>© {{ ano }} {{ imobiliaria.nome }}</span>
        <span>Trabalho final de Programação Web IV · IFFar Panambi</span>
      </div>
    </footer>
    <app-toasts />
    <app-confirmacao-dialogo />
  `,
})
export class App {
  protected readonly imobiliaria = IMOBILIARIA;
  protected readonly ano = new Date().getFullYear();
  protected readonly telefoneLink = '+55' + IMOBILIARIA.telefone.replace(/\D/g, '');

  constructor() {
    controlarRolagem(inject(Router), inject(ViewportScroller));
  }
}
