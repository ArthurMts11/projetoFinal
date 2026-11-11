package com.arthur.projeto2.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Limita o POST público /imoveis/sabermais/{id}: cada pedido faz o servidor
 * enviar um e-mail, então sem limite a rota viraria um disparador de spam.
 * Conta todo pedido (não só falhas) por IP, em memória (uma instância só).
 */
@Component
public class ContatoRateLimiter {

    static final int MAX_ENVIOS = 5;
    static final Duration JANELA = Duration.ofMinutes(15);

    private record Envios(int quantidade, Instant inicio) {
    }

    private final Map<String, Envios> porIp = new ConcurrentHashMap<>();
    private final Clock clock;

    public ContatoRateLimiter() {
        this(Clock.systemUTC());
    }

    ContatoRateLimiter(Clock clock) {
        this.clock = clock;
    }

    /** Registra o pedido e diz se ele pode seguir. */
    public boolean permitir(String ip) {
        Envios atual = porIp.compute(ip, (chave, e) -> e == null || expirou(e)
                ? new Envios(1, clock.instant())
                : new Envios(e.quantidade() + 1, e.inicio()));
        return atual.quantidade() <= MAX_ENVIOS;
    }

    private boolean expirou(Envios e) {
        return clock.instant().isAfter(e.inicio().plus(JANELA));
    }
}
