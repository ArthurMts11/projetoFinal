package com.arthur.projeto2.exceptions;

/** Dados obrigatórios ausentes ou inválidos: a API responde 400. */
public class DadosInvalidosException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public DadosInvalidosException(String mensagem) {
        super(mensagem);
    }
}
