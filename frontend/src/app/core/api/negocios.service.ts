import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config';
import { Contrato, Dashboard, Imovel, Oferta, StatusOferta, TipoOferta, Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class OfertasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/ofertas`;

  enviar(dados: {
    imovelId: number;
    tipo: TipoOferta;
    valorProposto: number;
    mensagem: string;
  }): Observable<Oferta> {
    return this.http.post<Oferta>(this.url, dados);
  }

  minhas(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.url}/minhas`);
  }

  todas(status?: StatusOferta | ''): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(this.url, { params: status ? { status } : {} });
  }

  aceitar(id: number): Observable<Oferta> {
    return this.http.patch<Oferta>(`${this.url}/${id}/aceitar`, {});
  }

  recusar(id: number): Observable<Oferta> {
    return this.http.patch<Oferta>(`${this.url}/${id}/recusar`, {});
  }

  cancelar(id: number): Observable<Oferta> {
    return this.http.patch<Oferta>(`${this.url}/${id}/cancelar`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class ContratosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/contratos`;

  todos(): Observable<Contrato[]> {
    return this.http.get<Contrato[]>(this.url);
  }

  meus(): Observable<Contrato[]> {
    return this.http.get<Contrato[]>(`${this.url}/meus`);
  }

  aprovar(id: number): Observable<Contrato> {
    return this.http.patch<Contrato>(`${this.url}/${id}/aprovar`, {});
  }

  cancelar(id: number): Observable<Contrato> {
    return this.http.patch<Contrato>(`${this.url}/${id}/cancelar`, {});
  }

  assinar(id: number): Observable<Contrato> {
    return this.http.patch<Contrato>(`${this.url}/${id}/assinar`, {});
  }

  /** Baixa pelo HttpClient (e não por link) para o token ir no cabeçalho. */
  pdf(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/${id}/pdf`, { responseType: 'blob' });
  }
}

@Injectable({ providedIn: 'root' })
export class FavoritosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/favoritos`;

  listar(): Observable<Imovel[]> {
    return this.http.get<Imovel[]>(this.url);
  }

  ids(): Observable<number[]> {
    return this.http.get<number[]>(`${this.url}/ids`);
  }

  adicionar(imovelId: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${imovelId}`, {});
  }

  remover(imovelId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${imovelId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/api/usuarios`;

  listar(busca = ''): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url, { params: busca ? { busca } : {} });
  }

  criar(usuario: Usuario): Observable<void> {
    return this.http.post<void>(this.url, usuario);
  }

  atualizar(id: number, usuario: Usuario): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, usuario);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  resumo(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${API_URL}/dashboard`);
  }
}
