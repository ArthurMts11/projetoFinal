package com.arthur.projeto2.exceptions;

/** Item não existe: a API responde 404. */
public class RecursoNaoEncontradoException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
