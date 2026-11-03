package com.arthur.projeto2.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Freia força bruta no /public/login: depois de MAX_FALHAS tentativas erradas
 * vindas do mesmo IP, bloqueia esse IP até a janela expirar. Fica em memória,
 * o que basta para uma instância só do servidor.
 */
@Component
public class LoginRateLimiter {

    static final int MAX_FALHAS = 5;
    static final Duration JANELA = Duration.ofMinutes(15);

    private record Tentativas(int falhas, Instant inicio) {
    }

    private final Map<String, Tentativas> porIp = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginRateLimiter() {
        this(Clock.systemUTC());
    }

    LoginRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public boolean bloqueado(String ip) {
        Tentativas t = porIp.get(ip);
        if (t == null) {
            return false;
        }
        if (expirou(t)) {
            porIp.remove(ip, t);
            return false;
        }
        return t.falhas() >= MAX_FALHAS;
    }

    public void registrarFalha(String ip) {
        porIp.compute(ip, (chave, t) -> t == null || expirou(t)
                ? new Tentativas(1, clock.instant())
                : new Tentativas(t.falhas() + 1, t.inicio()));
    }

    public void registrarSucesso(String ip) {
        porIp.remove(ip);
    }

    private boolean expirou(Tentativas t) {
        return clock.instant().isAfter(t.inicio().plus(JANELA));
    }
}
