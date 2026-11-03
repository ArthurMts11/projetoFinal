package com.arthur.projeto2.services;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.arthur.projeto2.exceptions.AcessoNegadoException;
import com.arthur.projeto2.exceptions.RecursoNaoEncontradoException;
import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.model.ContratoModel;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.model.OfertaModel;
import com.arthur.projeto2.model.StatusContrato;
import com.arthur.projeto2.model.StatusImovel;
import com.arthur.projeto2.model.StatusOferta;
import com.arthur.projeto2.model.TipoOferta;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.ContratoRepository;
import com.arthur.projeto2.repository.ImovelRepository;
import com.arthur.projeto2.repository.OfertaRepository;
import com.arthur.projeto2.security.UsuarioLogado;

@Service
public class ContratoService {

    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

    private final ContratoRepository repository;
    private final OfertaRepository ofertaRepository;
    private final ImovelRepository imovelRepository;
    private final NotificacaoService notificacao;
    private final UsuarioLogado usuarioLogado;
    private final String uploadDir;
    private final String nomeImobiliaria;

    public ContratoService(ContratoRepository repository, OfertaRepository ofertaRepository,
            ImovelRepository imovelRepository, NotificacaoService notificacao, UsuarioLogado usuarioLogado,
            @Value("${app.upload-dir}") String uploadDir, @Value("${app.imobiliaria.nome}") String nomeImobiliaria) {
        this.repository = repository;
        this.ofertaRepository = ofertaRepository;
        this.imovelRepository = imovelRepository;
        this.notificacao = notificacao;
        this.usuarioLogado = usuarioLogado;
        this.uploadDir = uploadDir;
        this.nomeImobiliaria = nomeImobiliaria;
    }

    public ContratoModel find(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Contrato " + id + " não encontrado."));
    }

    public List<ContratoModel> listar() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public List<ContratoModel> meus() {
        return repository.findByOfertaUsuarioIdAndDataAprovacaoIsNotNullOrderByCreatedAtDesc(usuarioLogado.get().getId());
    }

    /** Chamado quando o admin aceita a oferta. */
    @Transactional
    public ContratoModel gerarParaOferta(OfertaModel oferta) {
        ContratoModel contrato = new ContratoModel();
        contrato.setOferta(oferta);
        contrato.setStatus(StatusContrato.AGUARDANDO_ASSINATURA);
        contrato = repository.save(contrato);
        salvarPdf(contrato);
        return repository.save(contrato);
    }

    /** Admin revisou o PDF e envia para o cliente assinar. */
    @Transactional
    public ContratoModel aprovar(Integer id) {
        ContratoModel contrato = find(id);
        if (contrato.getStatus() != StatusContrato.AGUARDANDO_ASSINATURA) {
            throw new RegraNegocioException("Só é possível aprovar contratos aguardando assinatura.");
        }
        if (contrato.getDataAprovacao() != null) {
            throw new RegraNegocioException("Este contrato já foi aprovado e enviado ao cliente.");
        }
        contrato.setDataAprovacao(LocalDateTime.now());
        repository.save(contrato);

        UsuarioModel cliente = contrato.getOferta().getUsuario();
        notificacao.enviar(cliente.getEmail(), "Seu contrato está pronto para assinatura",
                "Olá, " + cliente.getNome() + "!\n\nO contrato nº " + contrato.getId() + " do imóvel \""
                        + contrato.getOferta().getImovel().getTitulo() + "\" foi aprovado pela " + nomeImobiliaria
                        + ".\nEntre na sua área de cliente, em \"Meus contratos\", para baixar o PDF e assinar.");
        return contrato;
    }

    /**
     * Cliente assina: imóvel vira ALUGADO ou VENDIDO conforme o tipo da oferta,
     * e as outras ofertas do imóvel (pendentes ou em espera) são recusadas.
     */
    @Transactional
    public ContratoModel assinar(Integer id) {
        ContratoModel contrato = find(id);
        UsuarioModel cliente = usuarioLogado.get();
        if (!(contrato.getOferta().getUsuario().getId() == cliente.getId())) {
            throw new AcessoNegadoException("Este contrato não é seu.");
        }
        if (contrato.getDataAprovacao() == null) {
            throw new RegraNegocioException("O contrato ainda não foi liberado pela imobiliária.");
        }
        if (contrato.getStatus() != StatusContrato.AGUARDANDO_ASSINATURA) {
            throw new RegraNegocioException("Este contrato não está aguardando assinatura (situação: "
                    + contrato.getStatus().name().toLowerCase().replace('_', ' ') + ").");
        }

        contrato.setStatus(StatusContrato.ASSINADO);
        contrato.setDataAssinatura(LocalDateTime.now());

        OfertaModel oferta = contrato.getOferta();
        ImovelModel imovel = oferta.getImovel();
        imovel.setStatus(oferta.getTipo() == TipoOferta.VENDA ? StatusImovel.VENDIDO : StatusImovel.ALUGADO);
        imovelRepository.save(imovel);

        for (OfertaModel outra : ofertaRepository.findByImovelIdAndStatusIn(imovel.getId(),
                List.of(StatusOferta.PENDENTE, StatusOferta.EM_ESPERA))) {
            outra.setStatus(StatusOferta.RECUSADA);
        }

        salvarPdf(contrato);
        return repository.save(contrato);
    }

    /**
     * Admin cancela (cliente desistiu) ou recusa o contrato: imóvel volta a ficar
     * DISPONIVEL e as ofertas que estavam em espera voltam a ficar pendentes.
     */
    @Transactional
    public ContratoModel cancelar(Integer id) {
        ContratoModel contrato = find(id);
        if (contrato.getStatus() == StatusContrato.CANCELADO) {
            throw new RegraNegocioException("Este contrato já está cancelado.");
        }
        contrato.setStatus(StatusContrato.CANCELADO);

        OfertaModel oferta = contrato.getOferta();
        oferta.setStatus(StatusOferta.CANCELADA);
        ofertaRepository.save(oferta);

        ImovelModel imovel = oferta.getImovel();
        imovel.setStatus(StatusImovel.DISPONIVEL);
        imovelRepository.save(imovel);

        for (OfertaModel espera : ofertaRepository.findByImovelIdAndStatusIn(imovel.getId(),
                List.of(StatusOferta.EM_ESPERA))) {
            espera.setStatus(StatusOferta.PENDENTE);
        }

        if (contrato.getDataAprovacao() != null) {
            UsuarioModel cliente = oferta.getUsuario();
            notificacao.enviar(cliente.getEmail(), "Contrato cancelado",
                    "Olá, " + cliente.getNome() + ".\n\nO contrato nº " + contrato.getId() + " do imóvel \""
                            + imovel.getTitulo() + "\" foi cancelado.");
        }
        return repository.save(contrato);
    }

    /** PDF do contrato: só o admin ou o cliente dono da oferta. */
    public byte[] pdf(Integer id) {
        ContratoModel contrato = find(id);
        UsuarioModel usuario = usuarioLogado.get();
        boolean dono = contrato.getOferta().getUsuario().getId() == usuario.getId();
        if (!usuarioLogado.isAdmin() && (!dono || contrato.getDataAprovacao() == null)) {
            throw new AcessoNegadoException("Você não tem acesso a este contrato.");
        }
        try {
            Path arquivo = contrato.getCaminhoPdf() == null ? null : Paths.get(contrato.getCaminhoPdf());
            if (arquivo == null || !Files.isRegularFile(arquivo)) {
                return montarPdf(contrato);
            }
            return Files.readAllBytes(arquivo);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private void salvarPdf(ContratoModel contrato) {
        try {
            Path pasta = Paths.get(uploadDir, "contratos");
            Files.createDirectories(pasta);
            Path arquivo = pasta.resolve("contrato-" + contrato.getId() + ".pdf");
            Files.write(arquivo, montarPdf(contrato));
            contrato.setCaminhoPdf(arquivo.toString());
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível salvar o PDF do contrato", e);
        }
    }

    private byte[] montarPdf(ContratoModel c) {
        OfertaModel o = c.getOferta();
        ImovelModel i = o.getImovel();
        UsuarioModel cliente = o.getUsuario();
        boolean venda = o.getTipo() == TipoOferta.VENDA;

        List<String> p = new ArrayList<>();
        p.add("# " + nomeImobiliaria);
        p.add("# Contrato de " + (venda ? "compra e venda" : "locação") + " nº " + c.getId());
        p.add("");
        p.add((venda ? "COMPRADOR(A): " : "LOCATÁRIO(A): ") + cliente.getNome() + " (" + cliente.getEmail() + ")");
        p.add((venda ? "VENDEDORA: " : "LOCADORA: ") + nomeImobiliaria + ", representando o proprietário do imóvel.");
        p.add("");
        p.add("IMÓVEL: código " + i.getId() + " - " + i.getTitulo());
        p.add("Tipo: " + (i.getTipoImovel() != null ? i.getTipoImovel().getNome() : "-")
                + " | Bairro: " + (i.getBairro() != null ? i.getBairro().getNome() + ", " + i.getBairro().getCidade() : "-"));
        p.add("Endereço: " + texto(i.getEndereco()) + ", " + texto(i.getNumero())
                + (i.getComplemento() != null && !i.getComplemento().isBlank() ? " - " + i.getComplemento() : "")
                + " | CEP " + texto(i.getCep()));
        p.add("");
        p.add("CLÁUSULA 1 - OBJETO. O presente contrato tem por objeto a " + (venda ? "compra e venda" : "locação")
                + " do imóvel descrito acima, nas condições da oferta nº " + o.getId() + ", aceita pela imobiliária.");
        p.add("CLÁUSULA 2 - VALOR. As partes ajustam o valor de " + moeda(o.getValorProposto())
                + (venda ? ", a ser pago na forma combinada entre as partes." : " por mês, com vencimento no dia 10 de cada mês."));
        if (!venda) {
            p.add("CLÁUSULA 3 - PRAZO. A locação vigora por 30 (trinta) meses a contar da assinatura, podendo ser renovada.");
        } else {
            p.add("CLÁUSULA 3 - POSSE. A posse do imóvel será transferida ao comprador após a quitação do valor ajustado.");
        }
        p.add("CLÁUSULA 4 - DESISTÊNCIA. Antes da assinatura, qualquer das partes pode desistir, e o imóvel volta a ficar disponível.");
        p.add("CLÁUSULA 5 - FORO. Fica eleito o foro da comarca do imóvel para dirimir eventuais dúvidas.");
        if (o.getMensagem() != null && !o.getMensagem().isBlank()) {
            p.add("");
            p.add("Observações do cliente: " + o.getMensagem());
        }
        p.add("");
        p.add("Gerado em " + LocalDateTime.now().format(DATA_HORA) + ".");
        if (c.getDataAprovacao() != null) {
            p.add("Aprovado pela imobiliária em " + c.getDataAprovacao().format(DATA_HORA) + ".");
        }
        if (c.getDataAssinatura() != null) {
            p.add("ASSINADO ELETRONICAMENTE por " + cliente.getNome() + " em " + c.getDataAssinatura().format(DATA_HORA) + ".");
        } else {
            p.add("");
            p.add("_____________________________________          _____________________________________");
            p.add(cliente.getNome() + "                                        " + nomeImobiliaria);
        }
        return PdfSimples.gerar(p);
    }

    private static String texto(String s) {
        return s == null || s.isBlank() ? "-" : s;
    }

    private static String moeda(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(Locale.of("pt", "BR")).format(valor);
    }
}
