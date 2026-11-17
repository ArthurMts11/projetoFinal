import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../core/auth.service';
import { IMOBILIARIA } from '../core/config';
import { ROTULO_PERFIL } from '../core/rotulos';
import { Icone } from '../shared/icone';

interface ItemMenu {
  rotulo: string;
  link: string;
}

// O menu muda conforme o perfil logado: cada um só vê as próprias opções
const MENU_VISITANTE: ItemMenu[] = [{ rotulo: 'Imóveis', link: '/' }];
const MENU_CLIENTE: ItemMenu[] = [
  { rotulo: 'Imóveis', link: '/' },
  { rotulo: 'Minhas ofertas', link: '/cliente/ofertas' },
  { rotulo: 'Favoritos', link: '/cliente/favoritos' },
  { rotulo: 'Contratos', link: '/cliente/contratos' },
];
const MENU_CORRETOR: ItemMenu[] = [
  { rotulo: 'Painel', link: '/corretor/painel' },
  { rotulo: 'Ofertas', link: '/corretor/ofertas' },
  { rotulo: 'Contratos', link: '/corretor/contratos' },
  { rotulo: 'Imóveis', link: '/' },
];
const MENU_ADMIN: ItemMenu[] = [
  { rotulo: 'Painel', link: '/admin/painel' },
  { rotulo: 'Imóveis', link: '/admin/imoveis' },
  { rotulo: 'Ofertas', link: '/admin/ofertas' },
  { rotulo: 'Contratos', link: '/admin/contratos' },
  { rotulo: 'Usuários', link: '/admin/usuarios' },
  { rotulo: 'Bairros', link: '/admin/bairros' },
  { rotulo: 'Tipos', link: '/admin/tipos' },
];

@Component({
  selector: 'app-cabecalho',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icone],
  template: `
    <header class="cabecalho">
      <div class="container cabecalho-conteudo">
        <a routerLink="/" class="marca" [attr.aria-label]="nome + ', página inicial'">
          <span class="marca-nome">Fogami</span>
          <span class="marca-desc">Imobiliária</span>
        </a>

        <button
          type="button"
          class="btn-menu"
          [attr.aria-expanded]="aberto()"
          aria-controls="menu-principal"
          aria-label="Abrir menu"
          (click)="aberto.set(!aberto())"
        >
          <app-icone [nome]="aberto() ? 'fechar' : 'menu'" [tamanho]="24" />
        </button>

        <nav id="menu-principal" class="menu" [class.aberto]="aberto()" aria-label="Menu principal">
          @for (item of itens(); track item.link) {
            <a
              [routerLink]="item.link"
              routerLinkActive="ativo"
              [routerLinkActiveOptions]="{ exact: item.link === '/' }"
            >
              {{ item.rotulo }}
            </a>
          }
          <div class="menu-usuario">
            @if (auth.usuario(); as u) {
              <span class="menu-nome" [title]="u.email">
                {{ u.nome }}
                <small>{{ rotuloPerfil[u.perfil] }}</small>
              </span>
              <button type="button" class="btn btn-secundario btn-sm" (click)="sair()">Sair</button>
            } @else {
              <a routerLink="/login" class="btn btn-primario btn-sm">Entrar</a>
            }
          </div>
        </nav>
      </div>
    </header>
  `,
})
export class Cabecalho {
  protected readonly auth = inject(AuthService);
  protected readonly nome = IMOBILIARIA.nome;
  protected readonly rotuloPerfil = ROTULO_PERFIL;
  protected readonly aberto = signal(false);

  protected readonly itens = computed(() => {
    if (this.auth.isAdmin()) return MENU_ADMIN;
    if (this.auth.isCorretor()) return MENU_CORRETOR;
    if (this.auth.isCliente()) return MENU_CLIENTE;
    return MENU_VISITANTE;
  });

  constructor() {
    // Fecha o menu do celular ao trocar de página
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.aberto.set(false));
  }

  protected sair(): void {
    this.auth.logout(['/login'], { saiu: '1' });
  }
}
