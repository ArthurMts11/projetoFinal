package com.arthur.projeto2.services;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    @InjectMocks
    private NotificacaoService service;

    @Test
    void avisaCadaUsuarioDoPerfilMesmoSeUmEnvioFalhar() {
        when(usuarioRepository.findByTipo(TipoUsuario.CORRETOR))
                .thenReturn(List.of(usuario("a@teste.com"), usuario("b@teste.com")));
        doThrow(new RuntimeException("SMTP fora")).when(emailService)
                .enviarEmailTexto(eq("a@teste.com"), anyString(), anyString());

        service.avisarPerfil(TipoUsuario.CORRETOR, "Nova oferta", "texto");

        verify(emailService).enviarEmailTexto("b@teste.com", "Nova oferta", "texto");
    }

    private static UsuarioModel usuario(String email) {
        UsuarioModel u = new UsuarioModel();
        u.setEmail(email);
        return u;
    }
}
