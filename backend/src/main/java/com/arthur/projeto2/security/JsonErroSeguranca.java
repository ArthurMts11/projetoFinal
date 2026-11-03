package com.arthur.projeto2.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Respostas de erro da API em JSON, no lugar da página/redirect padrão:
 * 401 = sem token, token inválido ou expirado (não sabemos quem é);
 * 403 = token válido, mas o papel não tem permissão (sabemos quem é).
 */
@Component
public class JsonErroSeguranca implements AuthenticationEntryPoint, AccessDeniedHandler {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException e) throws IOException {
        // Padrão RFC 6750: avisa o cliente que a rota espera um Bearer token
        response.setHeader("WWW-Authenticate", "Bearer");
        escrever(response, HttpStatus.UNAUTHORIZED,
                "Token ausente, inválido ou expirado. Faça login em /public/login.");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException e) throws IOException {
        escrever(response, HttpStatus.FORBIDDEN, "Seu usuário não tem permissão para esta ação.");
    }

    private void escrever(HttpServletResponse response, HttpStatus status, String mensagem) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        // Mensagens fixas, sem dado do usuário: não há o que escapar no JSON
        response.getWriter().write("{\"status\":" + status.value() + ",\"erro\":\"" + mensagem + "\"}");
    }
}
