package com.arthur.projeto2.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Roda antes de cada requisição da API: lê "Authorization: Bearer <token>",
 * valida o JWT e, se estiver tudo certo, diz ao Spring Security quem é o
 * usuário e qual o papel dele (ROLE_ADMIN / ROLE_CLIENTE).
 *
 * Token ausente ou inválido não é barrado aqui: a requisição segue sem
 * usuário, e o SecurityConfig decide (rota pública passa, protegida dá 401).
 *
 * Não é @Component de propósito: senão o Spring Boot o registraria também
 * como filtro global, rodando fora da cadeia da API.
 */
public class SecurityFilter extends OncePerRequestFilter {

    private static final String PREFIXO = "Bearer ";

    private final TokenService tokenService;

    public SecurityFilter(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith(PREFIXO)) {
            try {
                DecodedJWT jwt = tokenService.validarToken(header.substring(PREFIXO.length()));
                var permissoes = List.of(new SimpleGrantedAuthority("ROLE_" + jwt.getClaim("role").asString()));
                var autenticacao = new UsernamePasswordAuthenticationToken(jwt.getSubject(), null, permissoes);
                SecurityContextHolder.getContext().setAuthentication(autenticacao);
            } catch (JWTVerificationException e) {
                // Assinatura errada, token alterado ou expirado: segue sem usuário
                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(request, response);
    }
}
