package com.arthur.projeto2.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.arthur.projeto2.exceptions.AcessoNegadoException;
import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.UsuarioRepository;

/**
 * Descobre quem está fazendo a requisição: o SecurityFilter coloca o e-mail
 * (subject do JWT) no SecurityContext, e aqui buscamos o usuário no banco.
 */
@Component
public class UsuarioLogado {

    private final UsuarioRepository repository;

    public UsuarioLogado(UsuarioRepository repository) {
        this.repository = repository;
    }

    public UsuarioModel get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AcessoNegadoException("Faça login para continuar.");
        }
        return repository.findByEmail(auth.getName())
                .orElseThrow(() -> new AcessoNegadoException("Usuário do token não existe mais."));
    }

    public boolean isAdmin() {
        return get().getTipo() == TipoUsuario.ADMIN;
    }
}
