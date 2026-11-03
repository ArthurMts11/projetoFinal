package com.arthur.projeto2.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.arthur.projeto2.dtos.CadastroDTO;
import com.arthur.projeto2.dtos.LoginDTO;
import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.UsuarioRepository;
import com.arthur.projeto2.security.LoginRateLimiter;
import com.arthur.projeto2.security.TokenService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Login da API REST: troca e-mail + senha por um JWT. Não cria sessão; o
 * cliente guarda o token e manda em "Authorization: Bearer <token>".
 */
@RestController
@RequestMapping("/public")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final LoginRateLimiter rateLimiter;

    public AuthController(UsuarioRepository repository, PasswordEncoder passwordEncoder,
            TokenService tokenService, LoginRateLimiter rateLimiter) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginDTO dados, HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        if (rateLimiter.bloqueado(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("erro", "Muitas tentativas de login. Aguarde alguns minutos."));
        }

        Optional<UsuarioModel> usuario = repository.findByEmail(dados.email())
                .filter(u -> passwordEncoder.matches(dados.senha(), u.getSenha()));

        if (usuario.isEmpty()) {
            rateLimiter.registrarFalha(ip);
            log.info("Login recusado para {} (ip {})", dados.email(), ip);
            // Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails existem
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("erro", "E-mail ou senha inválidos."));
        }

        rateLimiter.registrarSucesso(ip);
        return ResponseEntity.ok(Map.of("token", tokenService.gerarToken(usuario.get())));
    }

    /** Cadastro público: cria sempre um CLIENTE e já devolve o token (entra direto). */
    @PostMapping("/cadastro")
    public ResponseEntity<Map<String, String>> cadastro(@Valid @RequestBody CadastroDTO dados) {
        if (repository.existsByEmailIgnoreCase(dados.email().trim())) {
            throw new RegraNegocioException("Já existe uma conta com este e-mail. Faça login.");
        }
        UsuarioModel novo = new UsuarioModel();
        novo.setNome(dados.nome().trim());
        novo.setEmail(dados.email().trim());
        novo.setSenha(passwordEncoder.encode(dados.senha()));
        novo.setTipo(TipoUsuario.CLIENTE);
        novo = repository.save(novo);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("token", tokenService.gerarToken(novo)));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> dadosInvalidos(MethodArgumentNotValidException e) {
        Map<String, String> erros = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(erro -> erros.put(erro.getField(), erro.getDefaultMessage()));
        return ResponseEntity.badRequest().body(erros);
    }
}
