package com.arthur.projeto2.exceptions;

/** Usuário logado tentando mexer em algo que não é dele: a API responde 403. */
public class AcessoNegadoException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
