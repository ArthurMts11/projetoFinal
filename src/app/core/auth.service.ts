import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_URL } from './config';
import { Perfil, UsuarioToken } from './models';

const CHAVE_TOKEN = 'imobiliaria.token';

/**
 * Guarda o JWT no localStorage e expõe o usuário logado como signal.
 * O payload do token já traz id, nome e perfil (claim "role").
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenAtual = signal<string | null>(lerTokenValido());

  readonly usuario = computed<UsuarioToken | null>(() => decodificar(this.tokenAtual()));
  readonly logado = computed(() => this.usuario() !== null);
  readonly isAdmin = computed(() => this.usuario()?.perfil === 'ADMIN');
  readonly isCliente = computed(() => this.usuario()?.perfil === 'CLIENTE');

  get token(): string | null {
    // Confere a validade a cada uso: token vencido é descartado
    const usuario = this.usuario();
    if (usuario && usuario.expiraEm <= Date.now()) {
      this.limpar();
    }
    return this.tokenAtual();
  }

  login(email: string, senha: string): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${API_URL}/public/login`, { email, senha })
      .pipe(tap((r) => this.guardar(r.token)));
  }

  cadastrar(nome: string, email: string, senha: string): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${API_URL}/public/cadastro`, { nome, email, senha })
      .pipe(tap((r) => this.guardar(r.token)));
  }

  /** Apaga o token e volta para a vitrine (ou para o login, se a sessão expirou). */
  logout(destino: string[] = ['/'], queryParams?: Record<string, string>): void {
    this.limpar();
    this.router.navigate(destino, { queryParams });
  }

  limpar(): void {
    try {
      localStorage.removeItem(CHAVE_TOKEN);
    } catch {
      /* navegador sem localStorage */
    }
    this.tokenAtual.set(null);
  }

  /** Área inicial de cada perfil, usada depois do login. */
  areaInicial(perfil?: Perfil): string {
    return (perfil ?? this.usuario()?.perfil) === 'ADMIN' ? '/admin/painel' : '/cliente/ofertas';
  }

  private guardar(token: string): void {
    try {
      localStorage.setItem(CHAVE_TOKEN, token);
    } catch {
      /* segue só em memória */
    }
    this.tokenAtual.set(token);
  }
}

function lerTokenValido(): string | null {
  let token: string | null = null;
  try {
    token = localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
  const usuario = decodificar(token);
  if (!usuario || usuario.expiraEm <= Date.now()) {
    try {
      localStorage.removeItem(CHAVE_TOKEN);
    } catch {
      /* ignora */
    }
    return null;
  }
  return token;
}

/** Lê o payload (parte do meio do JWT, em Base64URL). Não valida assinatura: isso é papel da API. */
function decodificar(token: string | null): UsuarioToken | null {
  if (!token) {
    return null;
  }
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const p = JSON.parse(json);
    return { id: p.id, nome: p.nome, email: p.sub, perfil: p.role, expiraEm: p.exp * 1000 };
  } catch {
    return null;
  }
}
