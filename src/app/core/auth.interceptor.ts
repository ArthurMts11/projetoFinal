import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { API_URL } from './config';
import { ToastService } from './toast.service';

/**
 * Toda requisição para a API leva "Authorization: Bearer <token>".
 * Resposta 401 (token ausente, inválido ou vencido) apaga o token e leva ao login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const token = auth.token;
  const paraApi = req.url.startsWith(API_URL);
  const requisicao =
    token && paraApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requisicao).pipe(
    catchError((erro: unknown) => {
      const ehLogin = req.url.includes('/public/');
      if (erro instanceof HttpErrorResponse && erro.status === 401 && paraApi && !ehLogin) {
        auth.limpar();
        toast.aviso('Sua sessão expirou. Entre novamente para continuar.');
        const voltarPara = router.url.startsWith('/login') ? undefined : router.url;
        router.navigate(['/login'], { queryParams: voltarPara ? { returnUrl: voltarPara } : {} });
      }
      return throwError(() => erro);
    }),
  );
};
