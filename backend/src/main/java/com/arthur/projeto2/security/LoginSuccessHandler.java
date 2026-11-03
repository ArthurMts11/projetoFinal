package com.arthur.projeto2.security;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.UsuarioRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Depois do login pelo Spring Security, guarda o UsuarioModel na sessão sob a
 * chave "usuario" — é isso que admin/index.jsp lê diretamente, então as JSPs
 * não precisam saber que agora quem autentica é o Spring Security.
 */
@Component
public class LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UsuarioRepository usuarioRepository;

    public LoginSuccessHandler(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        UsuarioModel usuario = usuarioRepository.findByEmail(authentication.getName()).orElse(null);

        HttpSession session = request.getSession();
        session.setAttribute("usuario", usuario);

        response.sendRedirect(request.getContextPath() + "/admin/");
    }
}
