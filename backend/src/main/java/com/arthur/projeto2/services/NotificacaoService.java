package com.arthur.projeto2.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.repository.UsuarioRepository;

/**
 * Avisos por e-mail ao cliente. Se o SMTP não estiver configurado ou falhar,
 * a operação principal (aceitar oferta, aprovar contrato...) não é desfeita:
 * só registramos no log e devolvemos false.
 */
@Service
public class NotificacaoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);

    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;

    public NotificacaoService(EmailService emailService, UsuarioRepository usuarioRepository) {
        this.emailService = emailService;
        this.usuarioRepository = usuarioRepository;
    }

    /** Avisa todos os usuários de um perfil (ex.: corretores quando chega oferta nova). */
    public void avisarPerfil(TipoUsuario perfil, String assunto, String texto) {
        usuarioRepository.findByTipo(perfil).forEach(u -> enviar(u.getEmail(), assunto, texto));
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
