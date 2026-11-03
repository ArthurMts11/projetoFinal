package com.arthur.projeto2.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.arthur.projeto2.services.EmailService;

/**
 * Endpoint para testar o envio pelo Mailgun. Fica em /admin/** para exigir
 * login: público, qualquer um poderia usar o servidor para mandar e-mail.
 */
@RestController
@RequestMapping("/admin/email")
public class EmailController {

    private static final Logger log = LoggerFactory.getLogger(EmailController.class);

    private final EmailService service;

    public EmailController(EmailService service) {
        this.service = service;
    }

    @PostMapping("/teste")
    public ResponseEntity<Map<String, String>> enviarTeste(@RequestBody EmailTesteJson dados) {
        if (dados.para() == null || !dados.para().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Informe um e-mail de destino válido em \"para\"."));
        }

        try {
            service.enviarEmailTexto(dados.para(), "Teste Mailgun - projeto2", "Se você recebeu isto, o envio de e-mail está funcionando.");
            return ResponseEntity.ok(Map.of("mensagem", "E-mail enviado para " + dados.para()));
        } catch (MailException e) {
            log.error("Falha ao enviar e-mail de teste para {}", dados.para(), e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("erro", "Não foi possível enviar o e-mail: " + e.getMessage()));
        }
    }

    public record EmailTesteJson(String para) {
    }
}
