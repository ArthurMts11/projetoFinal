package com.arthur.projeto2.exceptions;

/** Violação de regra de negócio: a API responde 409 com a mensagem no campo "erro". */
public class RegraNegocioException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
