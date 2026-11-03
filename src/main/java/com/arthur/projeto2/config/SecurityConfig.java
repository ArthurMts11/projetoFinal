package com.arthur.projeto2.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.arthur.projeto2.security.JsonErroSeguranca;
import com.arthur.projeto2.security.SecurityFilter;
import com.arthur.projeto2.security.TokenService;

/**
 * Duas cadeias de segurança independentes:
 * 1) API REST (JSON): stateless, autenticada por JWT no header Authorization.
 * 2) Telas JSP: login por formulário e sessão, como já era antes.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] ROTAS_API = {
        "/public/**", "/imoveis/**", "/api/**", "/bairros/**", "/tipos-imoveis/**", "/fotos/**",
        "/ofertas/**", "/contratos/**", "/favoritos/**", "/dashboard/**"
    };

    // Endereço do front Angular (ng serve). Vários separados por vírgula.
    @Value("${app.cors.origens:http://localhost:4200}")
    private String origensPermitidas;

    private static final String[] CADASTROS_PUBLICOS = {
        "/imoveis/**", "/bairros/**", "/tipos-imoveis/**", "/fotos/**"
    };

    @Bean
    @Order(1)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http, JsonErroSeguranca erros,
            TokenService tokenService) throws Exception {
        http
            .securityMatcher(ROTAS_API)
            .authorizeHttpRequests(auth -> auth
                // Público: login, consultas e o "saber mais" do cliente
                .requestMatchers(HttpMethod.POST, "/public/login", "/public/cadastro").permitAll()
                .requestMatchers(HttpMethod.GET, CADASTROS_PUBLICOS).permitAll()
                .requestMatchers(HttpMethod.POST, "/imoveis/sabermais/*").permitAll()
                // Qualquer usuário logado (ADMIN ou CLIENTE)
                .requestMatchers(HttpMethod.PATCH, "/imoveis/*/status").authenticated()
                // Área do cliente
                .requestMatchers("/favoritos/**").hasRole("CLIENTE")
                .requestMatchers(HttpMethod.POST, "/ofertas").hasRole("CLIENTE")
                .requestMatchers(HttpMethod.GET, "/ofertas/minhas").hasRole("CLIENTE")
                .requestMatchers(HttpMethod.PATCH, "/ofertas/*/cancelar").hasRole("CLIENTE")
                .requestMatchers(HttpMethod.GET, "/contratos/meus").hasRole("CLIENTE")
                .requestMatchers(HttpMethod.PATCH, "/contratos/*/assinar").hasRole("CLIENTE")
                // PDF: admin ou o cliente dono do contrato (conferido no ContratoService)
                .requestMatchers(HttpMethod.GET, "/contratos/*/pdf").authenticated()
                // Todo o resto (cadastrar/alterar/remover imóveis, gerenciar usuários...)
                .anyRequest().hasRole("ADMIN")
            )
            // Lê e valida o JWT antes das regras acima serem aplicadas
            // Libera o front (outra origem) a chamar a API; o preflight OPTIONS passa antes das regras
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .addFilterBefore(new SecurityFilter(tokenService), UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(erros)
                .accessDeniedHandler(erros)
            )
            // Sem sessão: cada requisição se identifica sozinha pelo token.
            // Sem cookie de sessão também não há CSRF a proteger.
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable());

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain webSecurityFilterChain(HttpSecurity http, AuthenticationSuccessHandler loginSuccessHandler)
            throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/admin/**").authenticated()
                .anyRequest().permitAll()
            )
            // Requisições JSON (ex.: Thunder Client) não têm o token CSRF que
            // as JSPs mandam no campo oculto. Um <form> HTML comum não
            // consegue forjar Content-Type: application/json, então isentar
            // só esse tipo de requisição do CSRF não abre brecha pros forms.
            .csrf(csrf -> csrf
                .ignoringRequestMatchers(request -> "application/json".equalsIgnoreCase(request.getContentType()))
            )
            .formLogin(form -> form
                .loginPage("/login.jsp")
                .loginProcessingUrl("/login")
                .usernameParameter("email")
                .passwordParameter("senha")
                .successHandler(loginSuccessHandler)
                .failureUrl("/login.jsp?erro=1")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutRequestMatcher(PathPatternRequestMatcher.pathPattern(HttpMethod.GET, "/logout"))
                .logoutSuccessUrl("/login.jsp")
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(origensPermitidas.split("\\s*,\\s*")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        // Para o front ler o nome do arquivo no download do PDF
        config.setExposedHeaders(List.of("Content-Disposition"));
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
