package com.arthur.projeto2.services;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.FavoritoRepository;
import com.arthur.projeto2.repository.ImovelRepository;
import com.arthur.projeto2.repository.OfertaRepository;
import com.arthur.projeto2.repository.UsuarioRepository;

/**
 * Regra: usuário com histórico (ofertas) ou responsável por imóveis não pode ser excluído;
 * favoritos não impedem a exclusão (são apagados junto).
 */
@ExtendWith(MockitoExtension.class)
class ExclusaoUsuarioTest {

    @Mock
    private UsuarioRepository repository;

    @Mock
    private OfertaRepository ofertaRepository;

    @Mock
    private ImovelRepository imovelRepository;

    @Mock
    private FavoritoRepository favoritoRepository;

    @InjectMocks
    private UsuarioService service;

    private final UsuarioModel cliente = usuario(16, "cliente@exemplo.com");

    @Test
    void recusaQuemTemOfertasRegistradas() {
        when(repository.findById(16)).thenReturn(Optional.of(cliente));
        when(ofertaRepository.existsByUsuarioId(16)).thenReturn(true);

        assertThatThrownBy(() -> service.excluir(16, "admin@exemplo.com"))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("tem ofertas registradas");
        verify(repository, never()).delete(any());
    }

    @Test
    void recusaQuemEResponsavelPorImoveis() {
        when(repository.findById(16)).thenReturn(Optional.of(cliente));
        when(imovelRepository.existsByUsuarioId(16)).thenReturn(true);

        assertThatThrownBy(() -> service.excluir(16, "admin@exemplo.com"))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("responsável por imóveis");
        verify(repository, never()).delete(any());
    }

    @Test
    void apagaOsFavoritosAntesDeExcluirOUsuario() {
        when(repository.findById(16)).thenReturn(Optional.of(cliente));

        service.excluir(16, "admin@exemplo.com");

        InOrder ordem = inOrder(favoritoRepository, repository);
        ordem.verify(favoritoRepository).deleteByUsuarioId(16);
        ordem.verify(repository).delete(cliente);
    }

    private static UsuarioModel usuario(Integer id, String email) {
        UsuarioModel u = new UsuarioModel();
        u.setId(id);
        u.setEmail(email);
        u.setNome("Cliente");
        u.setTipo(TipoUsuario.CLIENTE);
        return u;
    }
}
