import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config';
import { Bairro, Foto, TipoImovel } from '../models';

/** CRUD genérico para as rotas simples (bairros e tipos de imóveis). */
class CrudSimples<T extends { id?: number }> {
  constructor(
    private readonly http: HttpClient,
    private readonly url: string,
  ) {}

  listar(): Observable<T[]> {
    return this.http.get<T[]>(this.url);
  }

  criar(item: T): Observable<void> {
    return this.http.post<void>(this.url, item);
  }

  atualizar(id: number, item: T): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, item);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class BairrosService extends CrudSimples<Bairro> {
  constructor() {
    super(inject(HttpClient), `${API_URL}/bairros`);
  }
}

@Injectable({ providedIn: 'root' })
export class TiposImovelService extends CrudSimples<TipoImovel> {
  constructor() {
    super(inject(HttpClient), `${API_URL}/tipos-imoveis`);
  }
}

@Injectable({ providedIn: 'root' })
export class FotosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/fotos`;

  listar(imovelId: number): Observable<Foto[]> {
    return this.http.get<Foto[]>(this.url, { params: { imovelId } });
  }

  /** Upload em multipart/form-data, campos "arquivo" e "imovelId". */
  enviar(imovelId: number, arquivo: File): Observable<Foto> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    form.append('imovelId', String(imovelId));
    return this.http.post<Foto>(this.url, form);
  }

  alterarOrdem(id: number, ordem: number): Observable<Foto> {
    return this.http.put<Foto>(`${this.url}/${id}`, { ordem });
  }

  tornarCapa(id: number): Observable<Foto> {
    return this.http.put<Foto>(`${this.url}/${id}/capa`, {});
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
