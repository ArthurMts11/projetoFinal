import { Perfil } from '../app/core/models';

const CHAVE_TOKEN = 'imobiliaria.token';

/** JWT falso (assinatura não é conferida no front) com o perfil pedido, válido por 1 hora. */
export function tokenFalso(perfil: Perfil): string {
  const payload = {
    sub: `${perfil.toLowerCase()}@teste.com`,
    id: 1,
    nome: 'Teste',
    role: perfil,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const base64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64({ alg: 'HS256', typ: 'JWT' })}.${base64(payload)}.assinatura`;
}

/** Simula o usuário logado; chame antes de criar o AuthService. */
export function entrarComo(perfil: Perfil | null): void {
  if (perfil) {
    localStorage.setItem(CHAVE_TOKEN, tokenFalso(perfil));
  } else {
    localStorage.removeItem(CHAVE_TOKEN);
  }
}
