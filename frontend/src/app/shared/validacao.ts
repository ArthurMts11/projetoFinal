import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Mostra a mensagem de validação do campo depois que o usuário mexeu nele (ou tentou enviar). */
@Component({
  selector: 'app-erro-campo',
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    @if (controle().invalid && (controle().touched || controle().dirty)) {
      <small class="erro-campo" role="alert">{{ mensagem() }}</small>
    }
  `,
})
export class ErroCampo {
  readonly controle = input.required<AbstractControl>();
  readonly nome = input('Este campo');

  protected mensagem(): string {
    const e = this.controle().errors ?? {};
    if (e['required'])
      return `${this.nome()} é ${this.nome().startsWith('A ') ? 'obrigatória' : 'obrigatório'}.`;
    // Regras específicas antes de min/max, que os atributos do <input> também ligam
    if (e['vencimento']) return 'O vencimento vai do dia 1 ao 28.';
    if (e['email']) return 'Informe um e-mail válido (ex.: nome@dominio.com).';
    if (e['telefone']) return 'Informe o telefone com DDD (ex.: 55 99999-0000).';
    if (e['minlength'])
      return `${this.nome()} precisa ter pelo menos ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength'])
      return `${this.nome()} pode ter no máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (e['min']) return `${this.nome()} precisa ser maior ou igual a ${e['min'].min}.`;
    if (e['max']) return `${this.nome()} precisa ser menor ou igual a ${e['max'].max}.`;
    if (e['pattern']) return `${this.nome()} está em formato inválido.`;
    if (e['numero']) return `${this.nome()} precisa ser um número.`;
    if (e['faixa']) return 'O preço mínimo não pode ser maior que o máximo.';
    return `${this.nome()} ${this.nome().startsWith('A ') ? 'é inválida' : 'é inválido'}.`;
  }
}

/** E-mail com domínio completo (o Validators.email do Angular aceita "nome@x"). */
export function emailValido(controle: AbstractControl): ValidationErrors | null {
  const v = (controle.value ?? '').toString().trim();
  return !v || /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v) ? null : { email: true };
}

/** Telefone brasileiro com DDD: 10 ou 11 dígitos, aceitando espaços, traços e parênteses. */
export function telefoneValido(controle: AbstractControl): ValidationErrors | null {
  const v = (controle.value ?? '').toString().trim();
  const digitos = v.replace(/\D/g, '');
  return !v || (digitos.length >= 10 && digitos.length <= 11) ? null : { telefone: true };
}

/** Dia de vencimento: inteiro de 1 a 28 (existe em todos os meses). */
export function diaDeVencimento(controle: AbstractControl): ValidationErrors | null {
  const v = controle.value;
  if (v === null || v === undefined || v === '') return null;
  return Number.isInteger(v) && v >= 1 && v <= 28 ? null : { vencimento: true };
}
