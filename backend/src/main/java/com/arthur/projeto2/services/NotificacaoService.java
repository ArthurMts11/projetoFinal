package com.arthur.projeto2.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Avisos por e-mail ao cliente. Se o SMTP não estiver configurado ou falhar,
 * a operação principal (aceitar oferta, aprovar contrato...) não é desfeita:
 * só registramos no log e devolvemos false.
 */
@Service
public class NotificacaoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);

    private final EmailService emailService;

    public NotificacaoService(EmailService emailService) {
        this.emailService = emailService;
    }

    public boolean enviar(String para, String assunto, String texto) {
        try {
            emailService.enviarEmailTexto(para, assunto, texto);
            return true;
        } catch (RuntimeException e) {
            log.warn("Não foi possível enviar o e-mail \"{}\" para {}: {}", assunto, para, e.getMessage());
            return false;
        }
    }
}
