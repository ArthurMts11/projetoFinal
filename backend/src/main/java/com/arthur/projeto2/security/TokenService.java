package com.arthur.projeto2.security;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.arthur.projeto2.model.UsuarioModel;

/**
 * Gera e valida o JWT da API. O token é assinado com HMAC-SHA256 (HS256): a
 * mesma chave secreta assina no login e confere a assinatura em cada
 * requisição. O payload é só Base64, então nunca leva senha nem dado sensível.
 */
@Service
public class TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenService.class);

    static final String ISSUER = "projeto2";

    // HS256 exige chave de pelo menos 256 bits
    private static final int TAMANHO_MINIMO_CHAVE = 32;

    private final Algorithm algoritmo;
    private final JWTVerifier verificador;
    private final Duration validade;

    public TokenService(@Value("${app.jwt.secret}") String segredo,
            @Value("${app.jwt.expiracao-minutos}") long expiracaoMinutos) {
        this.algoritmo = Algorithm.HMAC256(chave(segredo));
        this.verificador = JWT.require(algoritmo).withIssuer(ISSUER).build();
        this.validade = Duration.ofMinutes(expiracaoMinutos);
    }

    public String gerarToken(UsuarioModel usuario) {
        Instant agora = Instant.now();
        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(usuario.getEmail())
                .withIssuedAt(agora)
                .withExpiresAt(agora.plus(validade))
                .withClaim("id", usuario.getId())
                .withClaim("nome", usuario.getNome())
                .withClaim("role", usuario.getTipo().name())
                .sign(algoritmo);
    }

    /**
     * Confere assinatura, emissor e expiração. Lança JWTVerificationException
     * se o token foi alterado, é de outro emissor ou já expirou.
     */
    public DecodedJWT validarToken(String token) throws JWTVerificationException {
        return verificador.verify(token);
    }

    private static byte[] chave(String segredo) {
        byte[] bytes = segredo.getBytes(StandardCharsets.UTF_8);
        if (bytes.length >= TAMANHO_MINIMO_CHAVE) {
            return bytes;
        }
        // Sem JWT_SECRET o sistema ainda sobe (útil em aula), mas com uma
        // chave aleatória: os tokens emitidos deixam de valer ao reiniciar.
        log.warn("JWT_SECRET ausente ou com menos de {} bytes: usando chave aleatória temporária.",
                TAMANHO_MINIMO_CHAVE);
        byte[] aleatoria = new byte[TAMANHO_MINIMO_CHAVE];
        new SecureRandom().nextBytes(aleatoria);
        return aleatoria;
    }
}
