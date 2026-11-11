package com.arthur.projeto2.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

/** O formulário público de contato envia e-mails: cada IP tem um limite de envios por janela. */
class ContatoRateLimiterTest {

    private final MutableClock clock = new MutableClock(Instant.parse("2026-11-10T12:00:00Z"));
    private final ContatoRateLimiter limiter = new ContatoRateLimiter(clock);

    @Test
    void permiteAteOLimiteEBloqueiaOProximo() {
        for (int i = 0; i < ContatoRateLimiter.MAX_ENVIOS; i++) {
            assertThat(limiter.permitir("1.1.1.1")).as("envio %d", i + 1).isTrue();
        }
        assertThat(limiter.permitir("1.1.1.1")).isFalse();
    }

    @Test
    void cadaIpTemSeuProprioLimite() {
        for (int i = 0; i < ContatoRateLimiter.MAX_ENVIOS; i++) {
            limiter.permitir("1.1.1.1");
        }
        assertThat(limiter.permitir("2.2.2.2")).isTrue();
    }

    @Test
    void liberaDeNovoQuandoAJanelaExpira() {
        for (int i = 0; i <= ContatoRateLimiter.MAX_ENVIOS; i++) {
            limiter.permitir("1.1.1.1");
        }
        clock.avancar(ContatoRateLimiter.JANELA.plusSeconds(1));
        assertThat(limiter.permitir("1.1.1.1")).isTrue();
    }

    private static final class MutableClock extends Clock {
        private Instant agora;

        MutableClock(Instant agora) {
            this.agora = agora;
        }

        void avancar(java.time.Duration d) {
            agora = agora.plus(d);
        }

        @Override
        public Instant instant() {
            return agora;
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }
    }
}
