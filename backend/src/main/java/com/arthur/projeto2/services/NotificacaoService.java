package com.arthur.projeto2.services;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.repository.UsuarioRepository;

/**
 * E-mails de aviso do fluxo de ofertas e contratos, no visual da imobiliária
 * (templates/email/aviso.html). Falha no envio não interrompe a operação: só fica no log.
 */
@Service
public class NotificacaoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);

    private final EmailService emailService;
    private final UsuarioRepository usuarioRepository;
    private final TemplateEngine templateEngine;
    private final String urlSite;
    private final Map<String, String> imobiliaria;

    public NotificacaoService(EmailService emailService, UsuarioRepository usuarioRepository,
            TemplateEngine templateEngine, @Value("${app.front-url}") String urlSite,
            @Value("${app.imobiliaria.nome}") String nome, @Value("${app.imobiliaria.telefone}") String telefone,
            @Value("${app.imobiliaria.email}") String email) {
        this.emailService = emailService;
        this.usuarioRepository = usuarioRepository;
        this.templateEngine = templateEngine;
        this.urlSite = urlSite;
        this.imobiliaria = Map.of("nome", nome, "telefone", telefone, "email", email);
    }

    public boolean enviar(String para, Aviso aviso) {
        try {
            Context ctx = new Context();
            ctx.setVariables(Map.of("aviso", aviso, "link", urlSite + aviso.caminho(), "imobiliaria", imobiliaria));
            String html = templateEngine.process("email/aviso", ctx);
            emailService.enviarHtml(para, aviso.assunto(), html, aviso.textoSimples(urlSite));
            return true;
        } catch (RuntimeException e) {
            log.warn("Não foi possível enviar o e-mail \"{}\" para {}: {}", aviso.assunto(), para, e.getMessage());
            return false;
        }
    }

    /** Avisa todos os usuários de um perfil (ex.: corretores quando chega oferta nova). */
    public void avisarPerfil(TipoUsuario perfil, Aviso aviso) {
        usuarioRepository.findByTipo(perfil).forEach(u -> enviar(u.getEmail(), aviso));
    }
}
