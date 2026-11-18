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

import com.arthur.projeto2.dtos.PreparoContratoDTO;
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
import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.ContratoRepository;
import com.arthur.projeto2.repository.ImovelRepository;
import com.arthur.projeto2.repository.OfertaRepository;
import com.arthur.projeto2.security.UsuarioLogado;

@Service
public class ContratoService {

    private static final List<StatusContrato> VISIVEIS_AO_CLIENTE =
            List.of(StatusContrato.AGUARDANDO_ASSINATURA, StatusContrato.ASSINADO);
    private static final int VENCIMENTO_PADRAO = 10;
    private static final int PRAZO_PADRAO_MESES = 30;

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

    public List<ContratoModel> listar(StatusContrato status) {
        return status == null ? repository.findAllByOrderByCreatedAtDesc()
                : repository.findByStatusOrderByCreatedAtDesc(status);
    }

    /** O cliente só vê o contrato depois que o admin aprova. */
    public List<ContratoModel> meus() {
        return repository.findByOfertaUsuarioIdAndStatusInOrderByCreatedAtDesc(usuarioLogado.get().getId(),
                VISIVEIS_AO_CLIENTE);
    }

    /** Chamado quando o corretor aceita a oferta: rascunho com os valores da oferta. */
    @Transactional
    public ContratoModel gerarParaOferta(OfertaModel oferta, UsuarioModel corretor) {
        ContratoModel contrato = new ContratoModel();
        contrato.setOferta(oferta);
        contrato.setCorretor(corretor);
        contrato.setStatus(StatusContrato.RASCUNHO);
        contrato.setValorFinal(oferta.getValorProposto());
        contrato.setDiaVencimento(VENCIMENTO_PADRAO);
        contrato.setPrazoMeses(oferta.getTipo() == TipoOferta.ALUGUEL ? PRAZO_PADRAO_MESES : null);
        contrato = repository.save(contrato);
        salvarPdf(contrato);
        return repository.save(contrato);
    }

    /** Corretor completa os dados do contrato (só enquanto está com ele). */
    @Transactional
    public ContratoModel preparar(Integer id, PreparoContratoDTO dados) {
        ContratoModel contrato = find(id);
        exigirComCorretor(contrato, "alterar");
        boolean aluguel = contrato.getOferta().getTipo() == TipoOferta.ALUGUEL;
        if (aluguel && dados.prazoMeses() == null) {
            throw new RegraNegocioException("Informe o prazo da locação em meses.");
        }
        contrato.setValorFinal(dados.valorFinal());
        contrato.setPrazoMeses(aluguel ? dados.prazoMeses() : null);
        contrato.setDiaVencimento(dados.diaVencimento());
        contrato.setObservacoes(dados.observacoes() == null || dados.observacoes().isBlank()
                ? null : dados.observacoes().trim());
        salvarPdf(contrato);
        return repository.save(contrato);
    }

    /** Corretor envia o contrato preparado para o admin aprovar. */
    @Transactional
    public ContratoModel enviar(Integer id) {
        ContratoModel contrato = find(id);
        exigirComCorretor(contrato, "enviar");
        if (contrato.getValorFinal() == null || contrato.getDiaVencimento() == null
                || (contrato.getOferta().getTipo() == TipoOferta.ALUGUEL && contrato.getPrazoMeses() == null)) {
            throw new RegraNegocioException("Complete o valor final, o vencimento e o prazo antes de enviar.");
        }
        contrato.setStatus(StatusContrato.EM_APROVACAO);
        contrato.setDataEnvio(LocalDateTime.now());
        contrato.setMotivoDevolucao(null);
        ContratoModel enviado = repository.save(contrato);
        notificacao.avisarPerfil(TipoUsuario.ADMIN, new Aviso(
                "Contrato nº " + contrato.getId() + " para aprovar", "Contrato nº " + contrato.getId(),
                "Um contrato aguarda sua aprovação",
                List.of(nomeCorretor(contrato) + " preparou o contrato do imóvel \"" + titulo(contrato)
                        + "\" e enviou para aprovação.", "Confira as condições e aprove ou devolva ao corretor."),
                condicoes(contrato), null, "Revisar contrato", "/admin/contratos?status=EM_APROVACAO"));
        return enviado;
    }

    /** Admin revisou o contrato e libera para o cliente assinar. */
    @Transactional
    public ContratoModel aprovar(Integer id) {
        ContratoModel contrato = find(id);
        exigirEmAprovacao(contrato, "aprovar");
        contrato.setStatus(StatusContrato.AGUARDANDO_ASSINATURA);
        contrato.setDataAprovacao(LocalDateTime.now());
        salvarPdf(contrato);
        repository.save(contrato);

        UsuarioModel cliente = contrato.getOferta().getUsuario();
        notificacao.enviar(cliente.getEmail(), new Aviso(
                "Seu contrato está pronto para assinatura", "Contrato nº " + contrato.getId(),
                "Seu contrato está pronto para assinar",
                List.of("Olá, " + cliente.getNome() + "! O contrato do imóvel \"" + titulo(contrato)
                                + "\" foi aprovado pela " + nomeImobiliaria + ".",
                        "Abra o PDF, leia com calma e assine em \"Meus contratos\"."),
                condicoes(contrato), null, "Ler e assinar o contrato", "/cliente/contratos"));
        return contrato;
    }

    /** Admin devolve o contrato ao corretor, explicando o que corrigir. */
    @Transactional
    public ContratoModel devolver(Integer id, String motivo) {
        ContratoModel contrato = find(id);
        exigirEmAprovacao(contrato, "devolver");
        contrato.setStatus(StatusContrato.DEVOLVIDO);
        contrato.setMotivoDevolucao(motivo.trim());
        ContratoModel devolvido = repository.save(contrato);
        if (contrato.getCorretor() != null) {
            notificacao.enviar(contrato.getCorretor().getEmail(), new Aviso(
                    "Contrato nº " + contrato.getId() + " devolvido", "Contrato nº " + contrato.getId(),
                    "Contrato devolvido para correção",
                    List.of("O administrador devolveu o contrato do imóvel \"" + titulo(contrato)
                            + "\". Veja o motivo abaixo, corrija e envie de novo."),
                    Aviso.detalhes("Imóvel", titulo(contrato), "Cliente", contrato.getOferta().getUsuario().getNome()),
                    motivo.trim(), "Corrigir contrato", "/corretor/contratos/" + contrato.getId()));
        }
        return devolvido;
    }

    /**
     * Cliente assina: imóvel vira ALUGADO ou VENDIDO conforme o tipo da oferta,
     * e as outras ofertas do imóvel (pendentes ou em espera) são recusadas.
     */
    @Transactional
    public ContratoModel assinar(Integer id) {
        ContratoModel contrato = find(id);
        UsuarioModel cliente = usuarioLogado.get();
        if (contrato.getOferta().getUsuario().getId() != cliente.getId()) {
            throw new AcessoNegadoException("Este contrato não é seu.");
        }
        if (contrato.getStatus() != StatusContrato.AGUARDANDO_ASSINATURA) {
            throw new RegraNegocioException("Este contrato não está aguardando assinatura (situação: "
                    + descricao(contrato.getStatus()) + ").");
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
        ContratoModel assinado = repository.save(contrato);
        String sobre = "o contrato nº " + contrato.getId() + " do imóvel \"" + imovel.getTitulo() + "\"";
        notificacao.enviar(cliente.getEmail(), new Aviso(
                "Contrato assinado", "Contrato nº " + contrato.getId(), "Contrato assinado com sucesso",
                List.of("Olá, " + cliente.getNome() + "! Você assinou o contrato do imóvel \"" + imovel.getTitulo() + "\".",
                        "O PDF assinado fica disponível em \"Meus contratos\". Obrigado por escolher a "
                                + nomeImobiliaria + "!"),
                condicoes(contrato), null, "Ver meu contrato", "/cliente/contratos"));
        if (contrato.getCorretor() != null) {
            notificacao.enviar(contrato.getCorretor().getEmail(), new Aviso(
                    "Contrato nº " + contrato.getId() + " assinado", "Contrato nº " + contrato.getId(),
                    "O cliente assinou o contrato",
                    List.of(cliente.getNome() + " assinou o contrato do imóvel \"" + imovel.getTitulo()
                            + "\". O imóvel agora está " + (oferta.getTipo() == TipoOferta.VENDA ? "vendido" : "alugado") + "."),
                    condicoes(contrato), null, "Ver contratos", "/corretor/contratos?aba=encerrados"));
        }
        return assinado;
    }

    /**
     * Admin cancela (cliente desistiu) ou recusa o contrato: imóvel volta a ficar
     * DISPONIVEL e as ofertas que estavam em espera voltam a ficar pendentes.
     * Contrato assinado não pode mais ser cancelado.
     */
    @Transactional
    public ContratoModel cancelar(Integer id) {
        ContratoModel contrato = find(id);
        if (contrato.getStatus() == StatusContrato.CANCELADO || contrato.getStatus() == StatusContrato.ASSINADO) {
            throw new RegraNegocioException("Não é possível cancelar um contrato "
                    + descricao(contrato.getStatus()) + ".");
        }
        boolean clienteJaViu = VISIVEIS_AO_CLIENTE.contains(contrato.getStatus());
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

        if (clienteJaViu) {
            UsuarioModel cliente = oferta.getUsuario();
            notificacao.enviar(cliente.getEmail(), new Aviso(
                    "Contrato cancelado", "Contrato nº " + contrato.getId(), "Contrato cancelado",
                    List.of("Olá, " + cliente.getNome() + ". O contrato do imóvel \"" + imovel.getTitulo()
                                    + "\" foi cancelado.",
                            "Se tiver dúvidas, é só responder este e-mail ou ligar para a imobiliária."),
                    Aviso.detalhes("Imóvel", imovel.getTitulo()), null, "Ver imóveis disponíveis", "/"));
        }
        return repository.save(contrato);
    }

    /** PDF do contrato: admin e corretor sempre; o cliente dono só depois da aprovação. */
    public byte[] pdf(Integer id) {
        ContratoModel contrato = find(id);
        UsuarioModel usuario = usuarioLogado.get();
        boolean equipe = usuario.getTipo() == TipoUsuario.ADMIN || usuario.getTipo() == TipoUsuario.CORRETOR;
        boolean dono = contrato.getOferta().getUsuario().getId() == usuario.getId();
        if (!equipe && (!dono || !VISIVEIS_AO_CLIENTE.contains(contrato.getStatus()))) {
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

    private void exigirComCorretor(ContratoModel contrato, String acao) {
        if (contrato.getStatus() != StatusContrato.RASCUNHO && contrato.getStatus() != StatusContrato.DEVOLVIDO) {
            throw new RegraNegocioException("Só é possível " + acao + " contratos em rascunho ou devolvidos. Este está "
                    + descricao(contrato.getStatus()) + ".");
        }
    }

    private void exigirEmAprovacao(ContratoModel contrato, String acao) {
        if (contrato.getStatus() != StatusContrato.EM_APROVACAO) {
            throw new RegraNegocioException("Só é possível " + acao + " contratos em aprovação. Este está "
                    + descricao(contrato.getStatus()) + ".");
        }
    }

    private static String titulo(ContratoModel c) {
        return c.getOferta().getImovel().getTitulo();
    }

    /** Condições do contrato para os e-mails (as mesmas do PDF). */
    private static java.util.Map<String, String> condicoes(ContratoModel c) {
        boolean aluguel = c.getOferta().getTipo() == TipoOferta.ALUGUEL;
        BigDecimal valor = c.getValorFinal() != null ? c.getValorFinal() : c.getOferta().getValorProposto();
        return Aviso.detalhes("Imóvel", titulo(c),
                "Cliente", c.getOferta().getUsuario().getNome(),
                "Valor", moeda(valor) + (aluguel ? " por mês" : ""),
                "Prazo", c.getPrazoMeses() != null ? c.getPrazoMeses() + " meses" : null,
                "Vencimento", c.getDiaVencimento() != null ? "dia " + c.getDiaVencimento() : null,
                "Observações", c.getObservacoes());
    }

    private static String nomeCorretor(ContratoModel c) {
        return c.getCorretor() != null ? c.getCorretor().getNome() : "um corretor";
    }

    private static String descricao(StatusContrato status) {
        return status.name().toLowerCase().replace('_', ' ');
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
        BigDecimal valor = c.getValorFinal() != null ? c.getValorFinal() : o.getValorProposto();
        int vencimento = c.getDiaVencimento() != null ? c.getDiaVencimento() : VENCIMENTO_PADRAO;
        p.add("CLÁUSULA 2 - VALOR. As partes ajustam o valor de " + moeda(valor)
                + (venda ? ", a ser pago na forma combinada entre as partes, com vencimento no dia " + vencimento + "."
                        : " por mês, com vencimento no dia " + vencimento + " de cada mês."));
        if (!venda) {
            int prazo = c.getPrazoMeses() != null ? c.getPrazoMeses() : PRAZO_PADRAO_MESES;
            p.add("CLÁUSULA 3 - PRAZO. A locação vigora por " + prazo
                    + " meses a contar da assinatura, podendo ser renovada.");
        } else {
            p.add("CLÁUSULA 3 - POSSE. A posse do imóvel será transferida ao comprador após a quitação do valor ajustado.");
        }
        p.add("CLÁUSULA 4 - DESISTÊNCIA. Antes da assinatura, qualquer das partes pode desistir, e o imóvel volta a ficar disponível.");
        p.add("CLÁUSULA 5 - FORO. Fica eleito o foro da comarca do imóvel para dirimir eventuais dúvidas.");
        if (o.getMensagem() != null && !o.getMensagem().isBlank()) {
            p.add("");
            p.add("Observações do cliente: " + o.getMensagem());
        }
        if (c.getObservacoes() != null) {
            p.add("Observações do contrato: " + c.getObservacoes());
        }
        if (c.getCorretor() != null) {
            p.add("Corretor responsável: " + c.getCorretor().getNome() + ".");
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
