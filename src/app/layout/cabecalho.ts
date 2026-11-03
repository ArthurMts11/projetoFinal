import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../core/auth.service';
import { IMOBILIARIA } from '../core/config';
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
        <a routerLink="/" class="marca">
          <span class="marca-simbolo"><app-icone nome="casa" [tamanho]="20" /></span>
          <span>{{ nome }}</span>
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
                {{ u.nome }} <small>{{ u.perfil === 'ADMIN' ? 'Admin' : 'Cliente' }}</small>
              </span>
              <button type="button" class="btn btn-secundario btn-sm" (click)="sair()">
                <app-icone nome="sair" [tamanho]="16" /> Sair
              </button>
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
  protected readonly aberto = signal(false);

  protected readonly itens = computed(() => {
    if (this.auth.isAdmin()) return MENU_ADMIN;
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
