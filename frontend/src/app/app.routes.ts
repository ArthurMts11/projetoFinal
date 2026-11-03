import { Routes } from '@angular/router';

import { perfilGuard, visitanteGuard } from './core/guards';

export const routes: Routes = [
  // Área pública
  {
    path: '',
    title: 'Imóveis',
    loadComponent: () => import('./pages/publico/vitrine').then((m) => m.Vitrine),
  },
  {
    path: 'imovel/:id',
    title: 'Detalhe do imóvel',
    loadComponent: () => import('./pages/publico/imovel-detalhe').then((m) => m.ImovelDetalhe),
  },
  {
    path: 'login',
    title: 'Entrar',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./pages/publico/login').then((m) => m.Login),
  },
  {
    path: 'cadastro',
    title: 'Criar conta',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./pages/publico/cadastro').then((m) => m.Cadastro),
  },
  {
    path: 'acesso-negado',
    title: 'Acesso negado',
    loadComponent: () => import('./pages/publico/acesso-negado').then((m) => m.AcessoNegado),
  },

  // Área do cliente
  {
    path: 'cliente',
    canActivate: [perfilGuard('CLIENTE')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ofertas' },
      {
        path: 'ofertas',
        title: 'Minhas ofertas',
        loadComponent: () => import('./pages/cliente/minhas-ofertas').then((m) => m.MinhasOfertas),
      },
      {
        path: 'favoritos',
        title: 'Favoritos',
        loadComponent: () => import('./pages/cliente/favoritos').then((m) => m.Favoritos),
      },
      {
        path: 'contratos',
        title: 'Meus contratos',
        loadComponent: () => import('./pages/cliente/meus-contratos').then((m) => m.MeusContratos),
      },
    ],
  },

  // Área do admin
  {
    path: 'admin',
    canActivate: [perfilGuard('ADMIN')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'painel' },
      {
        path: 'painel',
        title: 'Painel',
        loadComponent: () => import('./pages/admin/painel').then((m) => m.Painel),
      },
      {
        path: 'imoveis',
        title: 'Imóveis',
        loadComponent: () => import('./pages/admin/imoveis-lista').then((m) => m.ImoveisLista),
      },
      {
        path: 'imoveis/novo',
        title: 'Novo imóvel',
        loadComponent: () => import('./pages/admin/imovel-form').then((m) => m.ImovelForm),
      },
      {
        path: 'imoveis/:id/editar',
        title: 'Editar imóvel',
        loadComponent: () => import('./pages/admin/imovel-form').then((m) => m.ImovelForm),
      },
      {
        path: 'imoveis/:id/fotos',
        title: 'Fotos do imóvel',
        loadComponent: () => import('./pages/admin/fotos').then((m) => m.Fotos),
      },
      {
        path: 'bairros',
        title: 'Bairros',
        loadComponent: () => import('./pages/admin/bairros').then((m) => m.Bairros),
      },
      {
        path: 'tipos',
        title: 'Tipos de imóveis',
        loadComponent: () => import('./pages/admin/tipos').then((m) => m.Tipos),
      },
      {
        path: 'usuarios',
        title: 'Usuários',
        loadComponent: () => import('./pages/admin/usuarios').then((m) => m.Usuarios),
      },
      {
        path: 'ofertas',
        title: 'Ofertas',
        loadComponent: () => import('./pages/admin/ofertas').then((m) => m.OfertasAdmin),
      },
      {
        path: 'contratos',
        title: 'Contratos',
        loadComponent: () => import('./pages/admin/contratos').then((m) => m.ContratosAdmin),
      },
    ],
  },

  {
    path: '**',
    title: 'Página não encontrada',
    loadComponent: () => import('./pages/publico/nao-encontrado').then((m) => m.NaoEncontrado),
  },
];
