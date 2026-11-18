package com.arthur.projeto2.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.IContext;

import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.UsuarioRepository;

/** Avisos por e-mail para todos os usuários de um perfil (ex.: todos os corretores). */
@ExtendWith(MockitoExtension.class)
class NotificacaoServiceTest {

    @Mock
    private EmailService emailService;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TemplateEngine templateEngine;

    private NotificacaoService service;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        service = new NotificacaoService(emailService, usuarioRepository, templateEngine, "http://localhost:4200",
                "Imobiliária Fogami", "(55) 3333-0000", "contato@fogami.com");
    }

    @Test
    void avisaCadaUsuarioDoPerfilMesmoSeUmEnvioFalhar() {
        when(templateEngine.process(anyString(), any(IContext.class))).thenReturn("<html></html>");
        when(usuarioRepository.findByTipo(TipoUsuario.CORRETOR))
                .thenReturn(List.of(usuario("a@teste.com"), usuario("b@teste.com")));
        doThrow(new RuntimeException("SMTP fora")).when(emailService)
                .enviarHtml(eq("a@teste.com"), anyString(), anyString(), anyString());
        Aviso aviso = new Aviso("Nova oferta", "Oferta", "Nova oferta", java.util.List.of("texto"),
                java.util.Map.of(), null, "Ver ofertas", "/corretor/ofertas");

        service.avisarPerfil(TipoUsuario.CORRETOR, aviso);

        verify(emailService).enviarHtml(eq("b@teste.com"), eq("Nova oferta"), anyString(), anyString());
    }

    private static UsuarioModel usuario(String email) {
        UsuarioModel u = new UsuarioModel();
        u.setEmail(email);
        return u;
    }
}
