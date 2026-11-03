package com.arthur.projeto2.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

class LoginRateLimiterTest {

    private static final String IP = "10.0.0.1";

    @Test
    void bloqueiaDepoisDoLimiteDeFalhas() {
        LoginRateLimiter limiter = new LoginRateLimiter();
        falhar(limiter, LoginRateLimiter.MAX_FALHAS - 1);
        assertFalse(limiter.bloqueado(IP));

        limiter.registrarFalha(IP);
        assertTrue(limiter.bloqueado(IP));
    }

    @Test
    void sucessoZeraAsFalhas() {
        LoginRateLimiter limiter = new LoginRateLimiter();
        falhar(limiter, LoginRateLimiter.MAX_FALHAS);

        limiter.registrarSucesso(IP);
        assertFalse(limiter.bloqueado(IP));
    }

    @Test
    void desbloqueiaQuandoAJanelaExpira() {
        RelogioAjustavel relogio = new RelogioAjustavel(Instant.parse("2026-01-01T10:00:00Z"));
        LoginRateLimiter limiter = new LoginRateLimiter(relogio);
        falhar(limiter, LoginRateLimiter.MAX_FALHAS);
        assertTrue(limiter.bloqueado(IP));

        relogio.agora = relogio.agora.plus(LoginRateLimiter.JANELA).plusSeconds(1);
        assertFalse(limiter.bloqueado(IP));
    }

    private static void falhar(LoginRateLimiter limiter, int vezes) {
        for (int i = 0; i < vezes; i++) {
            limiter.registrarFalha(IP);
        }
    }

    private static final class RelogioAjustavel extends Clock {
        Instant agora;

        RelogioAjustavel(Instant agora) {
            this.agora = agora;
        }

        @Override
        public Instant instant() {
            return agora;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }
}
