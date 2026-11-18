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
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.arthur.projeto2.dtos.PreparoContratoDTO;
import com.arthur.projeto2.exceptions.AcessoNegadoException;
import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.model.BairroModel;
import com.arthur.projeto2.model.ContratoModel;
import com.arthur.projeto2.model.FinalidadeImovel;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.model.OfertaModel;
import com.arthur.projeto2.model.StatusContrato;
import com.arthur.projeto2.model.StatusImovel;
import com.arthur.projeto2.model.StatusOferta;
import com.arthur.projeto2.model.TipoImovelModel;
import com.arthur.projeto2.model.TipoOferta;
import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.ContratoRepository;
import com.arthur.projeto2.repository.ImovelRepository;
import com.arthur.projeto2.repository.OfertaRepository;
import com.arthur.projeto2.security.UsuarioLogado;

/** Máquina de estados do contrato: corretor prepara, admin aprova ou devolve, cliente assina. */
@ExtendWith(MockitoExtension.class)
class ContratoServiceTest {

    @Mock
    private ContratoRepository repository;
    @Mock
    private OfertaRepository ofertaRepository;
    @Mock
    private ImovelRepository imovelRepository;
    @Mock
    private NotificacaoService notificacao;
    @Mock
    private UsuarioLogado usuarioLogado;

    @TempDir
    Path pasta;

    private ContratoService service;

    private final UsuarioModel cliente = usuario(10, TipoUsuario.CLIENTE);
    private final UsuarioModel outroCliente = usuario(11, TipoUsuario.CLIENTE);
    private final UsuarioModel corretor = usuario(20, TipoUsuario.CORRETOR);

    @BeforeEach
    void setUp() {
        service = new ContratoService(repository, ofertaRepository, imovelRepository, notificacao, usuarioLogado,
                pasta.toString(), "Imobiliária Teste");
        lenient().when(repository.save(any())).thenAnswer(i -> {
            ContratoModel c = i.getArgument(0);
            if (c.getId() == null) {
                c.setId(1);
            }
            return c;
        });
    }

    // ---------- Geração ----------

    @Test
    void gerarCriaRascunhoComCorretorEValoresPadrao() {
        OfertaModel oferta = oferta(TipoOferta.ALUGUEL);

        ContratoModel c = service.gerarParaOferta(oferta, corretor);

        assertThat(c.getStatus()).isEqualTo(StatusContrato.RASCUNHO);
        assertThat(c.getCorretor()).isSameAs(corretor);
        assertThat(c.getValorFinal()).isEqualByComparingTo("1500.00");
        assertThat(c.getDiaVencimento()).isEqualTo(10);
        assertThat(c.getPrazoMeses()).isEqualTo(30);
    }

    @Test
    void gerarVendaNaoTemPrazo() {
        ContratoModel c = service.gerarParaOferta(oferta(TipoOferta.VENDA), corretor);
        assertThat(c.getPrazoMeses()).isNull();
    }

    // ---------- Preparo pelo corretor ----------

    @Test
    void prepararAtualizaDados() {
        ContratoModel c = contrato(StatusContrato.RASCUNHO, TipoOferta.ALUGUEL);

        service.preparar(1, new PreparoContratoDTO(new BigDecimal("1400.00"), 24, 5, "Pintura por conta do locador"));

        assertThat(c.getValorFinal()).isEqualByComparingTo("1400.00");
        assertThat(c.getPrazoMeses()).isEqualTo(24);
        assertThat(c.getDiaVencimento()).isEqualTo(5);
        assertThat(c.getObservacoes()).isEqualTo("Pintura por conta do locador");
    }

    @Test
    void prepararAluguelSemPrazoDa409() {
        contrato(StatusContrato.RASCUNHO, TipoOferta.ALUGUEL);

        assertThatThrownBy(() -> service.preparar(1, new PreparoContratoDTO(new BigDecimal("1400"), null, 5, null)))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("prazo");
    }

    @Test
    void prepararVendaIgnoraPrazo() {
        ContratoModel c = contrato(StatusContrato.RASCUNHO, TipoOferta.VENDA);

        service.preparar(1, new PreparoContratoDTO(new BigDecimal("300000"), 24, 5, null));

        assertThat(c.getPrazoMeses()).isNull();
    }

    @Test
    void prepararDevolvidoEPermitido() {
        ContratoModel c = contrato(StatusContrato.DEVOLVIDO, TipoOferta.ALUGUEL);
        service.preparar(1, new PreparoContratoDTO(new BigDecimal("1300"), 12, 10, null));
        assertThat(c.getValorFinal()).isEqualByComparingTo("1300");
    }

    @Test
    void prepararEmAprovacaoDa409() {
        ContratoModel c = contrato(StatusContrato.EM_APROVACAO, TipoOferta.ALUGUEL);

        assertThatThrownBy(() -> service.preparar(1, new PreparoContratoDTO(new BigDecimal("1"), 12, 10, null)))
                .isInstanceOf(RegraNegocioException.class);
        assertThat(c.getValorFinal()).isEqualByComparingTo("1500.00");
    }

    // ---------- Envio para aprovação ----------

    @Test
    void enviarRascunhoVaiParaAprovacaoELimpaMotivo() {
        ContratoModel c = contrato(StatusContrato.DEVOLVIDO, TipoOferta.ALUGUEL);
        c.setMotivoDevolucao("Valor errado");

        service.enviar(1);

        assertThat(c.getStatus()).isEqualTo(StatusContrato.EM_APROVACAO);
        assertThat(c.getDataEnvio()).isNotNull();
        assertThat(c.getMotivoDevolucao()).isNull();
    }

    @Test
    void enviarAvisaOsAdministradores() {
        contrato(StatusContrato.RASCUNHO, TipoOferta.ALUGUEL);
        service.enviar(1);
        verify(notificacao).avisarPerfil(eq(TipoUsuario.ADMIN), org.mockito.ArgumentMatchers.argThat((Aviso a) -> a.assunto().contains("aprovar")));
    }

    @Test
    void devolverAvisaOCorretorComOMotivo() {
        contrato(StatusContrato.EM_APROVACAO, TipoOferta.ALUGUEL);
        service.devolver(1, "Prazo deve ser 12 meses");
        verify(notificacao).enviar(eq(corretor.getEmail()), org.mockito.ArgumentMatchers.argThat(
                (Aviso a) -> "Prazo deve ser 12 meses".equals(a.destaque())));
    }

    @Test
    void assinarConfirmaAoClienteEAvisaOCorretor() {
        contrato(StatusContrato.AGUARDANDO_ASSINATURA, TipoOferta.VENDA);
        when(usuarioLogado.get()).thenReturn(cliente);
        service.assinar(1);
        verify(notificacao).enviar(eq(cliente.getEmail()), any());
        verify(notificacao).enviar(eq(corretor.getEmail()), any());
    }

    @Test
    void enviarAluguelSemPrazoDa409() {
        ContratoModel c = contrato(StatusContrato.RASCUNHO, TipoOferta.ALUGUEL);
        c.setPrazoMeses(null);

        assertThatThrownBy(() -> service.enviar(1)).isInstanceOf(RegraNegocioException.class);
        assertThat(c.getStatus()).isEqualTo(StatusContrato.RASCUNHO);
    }

    @Test
    void enviarContratoJaAprovadoDa409() {
        contrato(StatusContrato.AGUARDANDO_ASSINATURA, TipoOferta.ALUGUEL);
        assertThatThrownBy(() -> service.enviar(1)).isInstanceOf(RegraNegocioException.class);
    }

    // ---------- Aprovação e devolução pelo admin ----------

    @Test
    void aprovarLiberaParaAssinaturaENotificaCliente() {
        ContratoModel c = contrato(StatusContrato.EM_APROVACAO, TipoOferta.ALUGUEL);

        service.aprovar(1);

        assertThat(c.getStatus()).isEqualTo(StatusContrato.AGUARDANDO_ASSINATURA);
        assertThat(c.getDataAprovacao()).isNotNull();
        verify(notificacao).enviar(eq(cliente.getEmail()), any());
    }

    @Test
    void aprovarDevolvidoDa409() {
        contrato(StatusContrato.DEVOLVIDO, TipoOferta.ALUGUEL);
        assertThatThrownBy(() -> service.aprovar(1)).isInstanceOf(RegraNegocioException.class);
        verify(notificacao, never()).enviar(any(), any());
    }

    @Test
    void devolverGuardaMotivo() {
        ContratoModel c = contrato(StatusContrato.EM_APROVACAO, TipoOferta.ALUGUEL);

        service.devolver(1, "Prazo deve ser 12 meses");

        assertThat(c.getStatus()).isEqualTo(StatusContrato.DEVOLVIDO);
        assertThat(c.getMotivoDevolucao()).isEqualTo("Prazo deve ser 12 meses");
    }

    @Test
    void devolverForaDeAprovacaoDa409() {
        contrato(StatusContrato.RASCUNHO, TipoOferta.ALUGUEL);
        assertThatThrownBy(() -> service.devolver(1, "x")).isInstanceOf(RegraNegocioException.class);
    }

    // ---------- Assinatura pelo cliente ----------

    @Test
    void assinarContratoAlheioDa403() {
        contrato(StatusContrato.AGUARDANDO_ASSINATURA, TipoOferta.ALUGUEL);
        when(usuarioLogado.get()).thenReturn(outroCliente);

        assertThatThrownBy(() -> service.assinar(1)).isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void assinarNaoAprovadoDa409() {
        contrato(StatusContrato.EM_APROVACAO, TipoOferta.ALUGUEL);
        when(usuarioLogado.get()).thenReturn(cliente);

        assertThatThrownBy(() -> service.assinar(1)).isInstanceOf(RegraNegocioException.class);
    }

    @Test
    void assinarMarcaImovelERecusaOutras() {
        ContratoModel c = contrato(StatusContrato.AGUARDANDO_ASSINATURA, TipoOferta.VENDA);
        when(usuarioLogado.get()).thenReturn(cliente);
        OfertaModel outra = new OfertaModel();
        outra.setStatus(StatusOferta.EM_ESPERA);
        when(ofertaRepository.findByImovelIdAndStatusIn(anyInt(), anyCollection())).thenReturn(List.of(outra));

        service.assinar(1);

        assertThat(c.getStatus()).isEqualTo(StatusContrato.ASSINADO);
        assertThat(c.getOferta().getImovel().getStatus()).isEqualTo(StatusImovel.VENDIDO);
        assertThat(outra.getStatus()).isEqualTo(StatusOferta.RECUSADA);
    }

    // ---------- Cancelamento pelo admin ----------

    @Test
    void cancelarAssinadoDa409() {
        ContratoModel c = contrato(StatusContrato.ASSINADO, TipoOferta.VENDA);
        c.getOferta().getImovel().setStatus(StatusImovel.VENDIDO);

        assertThatThrownBy(() -> service.cancelar(1)).isInstanceOf(RegraNegocioException.class);
        assertThat(c.getOferta().getImovel().getStatus()).isEqualTo(StatusImovel.VENDIDO);
    }

    @Test
    void cancelarVoltaEsperaParaPendenteELiberaImovel() {
        ContratoModel c = contrato(StatusContrato.RASCUNHO, TipoOferta.ALUGUEL);
        OfertaModel espera = new OfertaModel();
        espera.setStatus(StatusOferta.EM_ESPERA);
        when(ofertaRepository.findByImovelIdAndStatusIn(anyInt(), anyCollection())).thenReturn(List.of(espera));

        service.cancelar(1);

        assertThat(c.getStatus()).isEqualTo(StatusContrato.CANCELADO);
        assertThat(c.getOferta().getImovel().getStatus()).isEqualTo(StatusImovel.DISPONIVEL);
        assertThat(espera.getStatus()).isEqualTo(StatusOferta.PENDENTE);
        // Rascunho nunca chegou ao cliente: não avisa
        verify(notificacao, never()).enviar(any(), any());
    }

    // ---------- Visibilidade para o cliente ----------

    @Test
    void clienteNaoBaixaPdfDeRascunho() {
        contrato(StatusContrato.RASCUNHO, TipoOferta.ALUGUEL);
        when(usuarioLogado.get()).thenReturn(cliente);

        assertThatThrownBy(() -> service.pdf(1)).isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void corretorBaixaPdfDeRascunho() {
        contrato(StatusContrato.RASCUNHO, TipoOferta.ALUGUEL);
        when(usuarioLogado.get()).thenReturn(corretor);

        assertThat(service.pdf(1)).isNotEmpty();
    }

    @Test
    void meusSoMostraLiberados() {
        when(usuarioLogado.get()).thenReturn(cliente);
        service.meus();
        verify(repository).findByOfertaUsuarioIdAndStatusInOrderByCreatedAtDesc(10,
                List.of(StatusContrato.AGUARDANDO_ASSINATURA, StatusContrato.ASSINADO));
    }

    // ---------- Apoio ----------

    private ContratoModel contrato(StatusContrato status, TipoOferta tipo) {
        ContratoModel c = new ContratoModel();
        c.setId(1);
        c.setOferta(oferta(tipo));
        c.setStatus(status);
        c.setCorretor(corretor);
        c.setValorFinal(new BigDecimal("1500.00"));
        c.setDiaVencimento(10);
        c.setPrazoMeses(tipo == TipoOferta.ALUGUEL ? 30 : null);
        lenient().when(repository.findById(1)).thenReturn(Optional.of(c));
        return c;
    }

    private OfertaModel oferta(TipoOferta tipo) {
        TipoImovelModel tipoImovel = new TipoImovelModel();
        tipoImovel.setNome("Casa");
        BairroModel bairro = new BairroModel();
        bairro.setNome("Centro");
        bairro.setCidade("Panambi");
        ImovelModel imovel = new ImovelModel();
        imovel.setId(5);
        imovel.setTitulo("Casa no centro");
        imovel.setFinalidade(tipo == TipoOferta.VENDA ? FinalidadeImovel.VENDA : FinalidadeImovel.ALUGUEL);
        imovel.setStatus(StatusImovel.RESERVADO);
        imovel.setTipoImovel(tipoImovel);
        imovel.setBairro(bairro);
        OfertaModel o = new OfertaModel();
        o.setId(3);
        o.setImovel(imovel);
        o.setUsuario(cliente);
        o.setTipo(tipo);
        o.setValorProposto(new BigDecimal("1500.00"));
        o.setStatus(StatusOferta.ACEITA);
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
