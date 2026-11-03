package com.arthur.projeto2.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.arthur.projeto2.dtos.OfertaDTO;
import com.arthur.projeto2.exceptions.AcessoNegadoException;
import com.arthur.projeto2.exceptions.RecursoNaoEncontradoException;
import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.model.ContratoModel;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.model.OfertaModel;
import com.arthur.projeto2.model.StatusImovel;
import com.arthur.projeto2.model.StatusOferta;
import com.arthur.projeto2.model.TipoOferta;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.ImovelRepository;
import com.arthur.projeto2.repository.OfertaRepository;
import com.arthur.projeto2.security.UsuarioLogado;

@Service
public class OfertaService {

    private final OfertaRepository repository;
    private final ImovelRepository imovelRepository;
    private final ContratoService contratoService;
    private final NotificacaoService notificacao;
    private final UsuarioLogado usuarioLogado;

    public OfertaService(OfertaRepository repository, ImovelRepository imovelRepository,
            ContratoService contratoService, NotificacaoService notificacao, UsuarioLogado usuarioLogado) {
        this.repository = repository;
        this.imovelRepository = imovelRepository;
        this.contratoService = contratoService;
        this.notificacao = notificacao;
        this.usuarioLogado = usuarioLogado;
    }

    public OfertaModel find(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Oferta " + id + " não encontrada."));
    }

    public List<OfertaModel> listar(StatusOferta status) {
        return status == null ? repository.findAllByOrderByCreatedAtDesc()
                : repository.findByStatusOrderByCreatedAtDesc(status);
    }

    public List<OfertaModel> minhas() {
        return repository.findByUsuarioIdOrderByCreatedAtDesc(usuarioLogado.get().getId());
    }

    @Transactional
    public OfertaModel criar(OfertaDTO dados) {
        UsuarioModel cliente = usuarioLogado.get();
        ImovelModel imovel = imovelRepository.findById(dados.imovelId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Imóvel " + dados.imovelId() + " não encontrado."));

        // Regra: só imóveis disponíveis recebem ofertas
        if (imovel.getStatus() != StatusImovel.DISPONIVEL) {
            throw new RegraNegocioException("Este imóvel não está disponível para receber ofertas (situação: "
                    + imovel.getStatus().name().toLowerCase() + ").");
        }
        if (!aceitaTipo(imovel, dados.tipo())) {
            throw new RegraNegocioException("Este imóvel não está disponível para "
                    + (dados.tipo() == TipoOferta.VENDA ? "venda." : "aluguel."));
        }
        // Regra: um cliente não pode ter duas ofertas pendentes para o mesmo imóvel
        if (repository.existsByImovelIdAndUsuarioIdAndStatus(imovel.getId(), cliente.getId(), StatusOferta.PENDENTE)) {
            throw new RegraNegocioException("Você já tem uma oferta pendente para este imóvel. "
                    + "Aguarde a resposta ou cancele a anterior.");
        }

        OfertaModel oferta = new OfertaModel();
        oferta.setImovel(imovel);
        oferta.setUsuario(cliente);
        oferta.setTipo(dados.tipo());
        oferta.setValorProposto(dados.valorProposto());
        oferta.setMensagem(dados.mensagem());
        oferta.setStatus(StatusOferta.PENDENTE);
        return repository.save(oferta);
    }

    /**
     * Admin aceita: oferta ACEITA, imóvel RESERVADO, as outras pendentes do
     * imóvel ficam EM_ESPERA e o contrato é gerado (aguardando aprovação do admin).
     */
    @Transactional
    public OfertaModel aceitar(Integer id) {
        OfertaModel oferta = find(id);
        if (oferta.getStatus() != StatusOferta.PENDENTE) {
            throw new RegraNegocioException("Só é possível aceitar ofertas pendentes. Esta está "
                    + descricao(oferta.getStatus()) + ".");
        }
        ImovelModel imovel = oferta.getImovel();
        if (imovel.getStatus() != StatusImovel.DISPONIVEL) {
            throw new RegraNegocioException("O imóvel não está mais disponível (situação: "
                    + imovel.getStatus().name().toLowerCase() + ").");
        }

        oferta.setStatus(StatusOferta.ACEITA);
        imovel.setStatus(StatusImovel.RESERVADO);
        imovelRepository.save(imovel);

        for (OfertaModel outra : repository.findByImovelIdAndStatusIn(imovel.getId(), List.of(StatusOferta.PENDENTE))) {
            if (!outra.getId().equals(oferta.getId())) {
                outra.setStatus(StatusOferta.EM_ESPERA);
            }
        }
        repository.save(oferta);

        ContratoModel contrato = contratoService.gerarParaOferta(oferta);
        notificacao.enviar(oferta.getUsuario().getEmail(), "Sua oferta foi aceita",
                "Olá, " + oferta.getUsuario().getNome() + "!\n\nSua oferta para o imóvel \""
                        + imovel.getTitulo() + "\" foi aceita. O contrato nº " + contrato.getId()
                        + " está sendo preparado e você será avisado quando ele estiver disponível para assinatura.");
        return oferta;
    }

    @Transactional
    public OfertaModel recusar(Integer id) {
        OfertaModel oferta = find(id);
        if (oferta.getStatus() != StatusOferta.PENDENTE && oferta.getStatus() != StatusOferta.EM_ESPERA) {
            throw new RegraNegocioException("Só é possível recusar ofertas pendentes ou em espera. Esta está "
                    + descricao(oferta.getStatus()) + ".");
        }
        oferta.setStatus(StatusOferta.RECUSADA);
        notificacao.enviar(oferta.getUsuario().getEmail(), "Resposta sobre sua oferta",
                "Olá, " + oferta.getUsuario().getNome() + ".\n\nInfelizmente sua oferta para o imóvel \""
                        + oferta.getImovel().getTitulo() + "\" não foi aceita.");
        return repository.save(oferta);
    }

    /** O próprio cliente desiste de uma oferta que ainda não foi aceita. */
    @Transactional
    public OfertaModel cancelarPeloCliente(Integer id) {
        OfertaModel oferta = find(id);
        if (!(oferta.getUsuario().getId() == usuarioLogado.get().getId())) {
            throw new AcessoNegadoException("Esta oferta não é sua.");
        }
        if (oferta.getStatus() != StatusOferta.PENDENTE && oferta.getStatus() != StatusOferta.EM_ESPERA) {
            throw new RegraNegocioException("Só é possível cancelar ofertas pendentes ou em espera.");
        }
        oferta.setStatus(StatusOferta.CANCELADA);
        return repository.save(oferta);
    }

    private boolean aceitaTipo(ImovelModel imovel, TipoOferta tipo) {
        if (tipo == TipoOferta.VENDA) {
            return imovel.getPrecoVenda() != null || imovel.getFinalidade().name().equals("VENDA");
        }
        return imovel.getPrecoAluguel() != null || imovel.getFinalidade().name().equals("ALUGUEL");
    }

    private String descricao(StatusOferta status) {
        return status.name().toLowerCase().replace('_', ' ');
    }
}
