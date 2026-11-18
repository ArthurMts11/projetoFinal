package com.arthur.projeto2.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.arthur.projeto2.dtos.OfertaDTO;
import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.model.ContratoModel;
import com.arthur.projeto2.model.FinalidadeImovel;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.model.OfertaModel;
import com.arthur.projeto2.model.StatusImovel;
import com.arthur.projeto2.model.StatusOferta;
import com.arthur.projeto2.model.TipoOferta;
import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.ImovelRepository;
import com.arthur.projeto2.repository.OfertaRepository;
import com.arthur.projeto2.security.UsuarioLogado;

/** Regras das ofertas: criação pelo cliente e resposta do corretor. */
@ExtendWith(MockitoExtension.class)
class OfertaServiceTest {

    @Mock
    private OfertaRepository repository;
    @Mock
    private ImovelRepository imovelRepository;
    @Mock
    private ContratoService contratoService;
    @Mock
    private NotificacaoService notificacao;
    @Mock
    private UsuarioLogado usuarioLogado;

    @InjectMocks
    private OfertaService service;

    private final UsuarioModel cliente = usuario(10, TipoUsuario.CLIENTE);
    private final UsuarioModel corretor = usuario(20, TipoUsuario.CORRETOR);
    private ImovelModel imovel;

    @BeforeEach
    void setUp() {
        imovel = new ImovelModel();
        imovel.setId(5);
        imovel.setTitulo("Casa no centro");
        imovel.setFinalidade(FinalidadeImovel.ALUGUEL);
        imovel.setPrecoAluguel(new BigDecimal("1500"));
        imovel.setStatus(StatusImovel.DISPONIVEL);
        lenient().when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void aceitarReservaImovelEsperaOutrasEGeraContratoComOCorretor() {
        OfertaModel oferta = oferta(1, StatusOferta.PENDENTE);
        OfertaModel outra = oferta(2, StatusOferta.PENDENTE);
        when(repository.findById(1)).thenReturn(Optional.of(oferta));
        when(repository.findByImovelIdAndStatusIn(anyInt(), anyCollection())).thenReturn(List.of(oferta, outra));
        when(imovelRepository.travar(5)).thenReturn(Optional.of(imovel));
        when(usuarioLogado.get()).thenReturn(corretor);
        ContratoModel contrato = new ContratoModel();
        contrato.setId(7);
        when(contratoService.gerarParaOferta(oferta, corretor)).thenReturn(contrato);

        service.aceitar(1);

        assertThat(oferta.getStatus()).isEqualTo(StatusOferta.ACEITA);
        assertThat(outra.getStatus()).isEqualTo(StatusOferta.EM_ESPERA);
        assertThat(imovel.getStatus()).isEqualTo(StatusImovel.RESERVADO);
        verify(contratoService).gerarParaOferta(oferta, corretor);
        verify(notificacao).enviar(eq(cliente.getEmail()), any());
    }

    @Test
    void aceitarConfereOImovelTravadoNoBancoENaoACopiaEmMemoria() {
        // Outro corretor acabou de aceitar outra oferta deste imóvel: no banco ele já está RESERVADO
        ImovelModel noBanco = new ImovelModel();
        noBanco.setId(5);
        noBanco.setStatus(StatusImovel.RESERVADO);
        when(repository.findById(1)).thenReturn(Optional.of(oferta(1, StatusOferta.PENDENTE)));
        when(imovelRepository.travar(5)).thenReturn(Optional.of(noBanco));

        assertThatThrownBy(() -> service.aceitar(1)).isInstanceOf(RegraNegocioException.class);
        verify(contratoService, never()).gerarParaOferta(any(), any());
    }

    @Test
    void aceitarOfertaNaoPendenteDa409() {
        when(repository.findById(1)).thenReturn(Optional.of(oferta(1, StatusOferta.RECUSADA)));

        assertThatThrownBy(() -> service.aceitar(1)).isInstanceOf(RegraNegocioException.class);
        verify(contratoService, never()).gerarParaOferta(any(), any());
    }

    @Test
    void aceitarComImovelIndisponivelDa409() {
        imovel.setStatus(StatusImovel.RESERVADO);
        when(repository.findById(1)).thenReturn(Optional.of(oferta(1, StatusOferta.PENDENTE)));
        when(imovelRepository.travar(5)).thenReturn(Optional.of(imovel));

        assertThatThrownBy(() -> service.aceitar(1)).isInstanceOf(RegraNegocioException.class);
        verify(contratoService, never()).gerarParaOferta(any(), any());
    }

    @Test
    void criarOfertaAvisaOsCorretores() {
        when(usuarioLogado.get()).thenReturn(cliente);
        when(imovelRepository.findById(5)).thenReturn(Optional.of(imovel));

        service.criar(dto());

        verify(notificacao).avisarPerfil(eq(TipoUsuario.CORRETOR), org.mockito.ArgumentMatchers.argThat((Aviso a) -> a.assunto().contains("Nova oferta")));
    }

    @Test
    void criarOfertaDuplicadaDa409() {
        when(usuarioLogado.get()).thenReturn(cliente);
        when(imovelRepository.findById(5)).thenReturn(Optional.of(imovel));
        when(repository.existsByImovelIdAndUsuarioIdAndStatus(5, 10, StatusOferta.PENDENTE)).thenReturn(true);

        assertThatThrownBy(() -> service.criar(dto()))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("pendente");
    }

    @Test
    void criarEmImovelIndisponivelDa409() {
        imovel.setStatus(StatusImovel.ALUGADO);
        when(usuarioLogado.get()).thenReturn(cliente);
        when(imovelRepository.findById(5)).thenReturn(Optional.of(imovel));

        assertThatThrownBy(() -> service.criar(dto())).isInstanceOf(RegraNegocioException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void recusarMudaSituacaoENotificaCliente() {
        OfertaModel oferta = oferta(1, StatusOferta.EM_ESPERA);
        when(repository.findById(1)).thenReturn(Optional.of(oferta));

        service.recusar(1);

        assertThat(oferta.getStatus()).isEqualTo(StatusOferta.RECUSADA);
        verify(notificacao).enviar(eq(cliente.getEmail()), any());
    }

    private OfertaDTO dto() {
        return new OfertaDTO(5, TipoOferta.ALUGUEL, new BigDecimal("1400"), null);
    }

    private OfertaModel oferta(int id, StatusOferta status) {
        OfertaModel o = new OfertaModel();
        o.setId(id);
        o.setImovel(imovel);
        o.setUsuario(cliente);
        o.setTipo(TipoOferta.ALUGUEL);
        o.setValorProposto(new BigDecimal("1400"));
        o.setStatus(status);
        return o;
    }

    private static UsuarioModel usuario(int id, TipoUsuario tipo) {
        UsuarioModel u = new UsuarioModel();
        u.setId(id);
        u.setNome("Usuário " + id);
        u.setEmail("u" + id + "@teste.com");
        u.setTipo(tipo);
        return u;
    }
}
