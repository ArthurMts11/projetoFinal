package com.arthur.projeto2.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.arthur.projeto2.services.EmailService;

/**
 * Teste rápido do envio: abrir GET /teste-email no navegador ou no Postman.
 * O destinatário é fixo (app.email-teste) para que a rota pública não sirva
 * para mandar e-mail a qualquer pessoa. Remover quando o envio estiver validado.
 */
@RestController
public class TesteEmailController {

    private static final Logger log = LoggerFactory.getLogger(TesteEmailController.class);

    private final EmailService service;
    private final String destinatario;

    public TesteEmailController(EmailService service, @Value("${app.email-teste}") String destinatario) {
        this.service = service;
        this.destinatario = destinatario;
    }

    @GetMapping("/teste-email")
    public ResponseEntity<Map<String, String>> enviar() {
        try {
            service.enviarEmailTexto(destinatario, "Teste Mailgun - projeto2", "Se você recebeu isto, o enviarEmailTexto está funcionando.");
            return ResponseEntity.ok(Map.of("mensagem", "E-mail enviado para " + destinatario));
        } catch (MailException e) {
            log.error("Falha ao enviar e-mail de teste para {}", destinatario, e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("erro", "Não foi possível enviar o e-mail: " + e.getMessage()));
        }
    }

    @GetMapping("/teste-email/template")
    public ResponseEntity<Map<String, String>> enviarComTemplate() {
        try {
            service.enviarEmailComTemplate(destinatario, "Bem-vindo!", "email/template", Map.of(
                    "nome", "Maria",
                    "itens", List.of("Plano Pro", "Suporte 24h"),
                    "link", "https://meusite.com"));
            return ResponseEntity.ok(Map.of("mensagem", "E-mail com template enviado para " + destinatario));
        } catch (MailException e) {
            log.error("Falha ao enviar e-mail com template para {}", destinatario, e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("erro", "Não foi possível enviar o e-mail: " + e.getMessage()));
        }
    }
}
