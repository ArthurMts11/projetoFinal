import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config';
import { FiltrosImovel, Imovel, Pagina, PedidoDeContato, StatusImovel } from '../models';

@Injectable({ providedIn: 'root' })
export class ImoveisService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/imoveis`;

  /** Filtros vazios não vão na URL, assim a API não filtra por eles. */
  buscar(filtros: FiltrosImovel): Observable<Pagina<Imovel>> {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtros)) {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(chave, String(valor));
      }
    }
    return this.http.get<Pagina<Imovel>>(`${this.url}/buscar`, { params });
  }

  buscarPorId(id: number): Observable<Imovel> {
    return this.http.get<Imovel>(`${this.url}/${id}`);
  }

  criar(imovel: Imovel): Observable<void> {
    return this.http.post<void>(this.url, imovel);
  }

  atualizar(id: number, imovel: Imovel): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, imovel);
  }

  alterarStatus(id: number, status: StatusImovel): Observable<Imovel> {
    return this.http.patch<Imovel>(`${this.url}/${id}/status`, { status });
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Formulário público de contato: a API envia os detalhes do imóvel para o e-mail informado. */
  pedirInformacoes(id: number, contato: PedidoDeContato): Observable<{ mensagem: string }> {
    return this.http.post<{ mensagem: string }>(`${this.url}/sabermais/${id}`, contato);
  }
}
