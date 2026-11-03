package com.arthur.projeto2.services;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.arthur.projeto2.exceptions.DadosInvalidosException;
import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.model.FinalidadeImovel;
import com.arthur.projeto2.model.FotoImovelModel;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.model.StatusImovel;
import com.arthur.projeto2.repository.FavoritoRepository;
import com.arthur.projeto2.repository.FotoImovelRepository;
import com.arthur.projeto2.repository.ImovelRepository;
import com.arthur.projeto2.repository.OfertaRepository;
import com.arthur.projeto2.repository.UsuarioRepository;

@Service
public class ImovelService {

    private final ImovelRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final OfertaRepository ofertaRepository;
    private final FavoritoRepository favoritoRepository;
    private final FotoImovelRepository fotoRepository;
    private final FotoImovelService fotoService;

    public ImovelService(ImovelRepository repository, UsuarioRepository usuarioRepository,
            OfertaRepository ofertaRepository, FavoritoRepository favoritoRepository,
            FotoImovelRepository fotoRepository, FotoImovelService fotoService) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.ofertaRepository = ofertaRepository;
        this.favoritoRepository = favoritoRepository;
        this.fotoRepository = fotoRepository;
        this.fotoService = fotoService;
    }

    public List<ImovelModel> getAll() {
        return repository.findAll();
    }

    public Page<ImovelModel> getAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    /** Vitrine e listagem do admin: filtros combináveis, ordenação por preço e paginação. */
    public Page<ImovelModel> buscar(StatusImovel status, Integer bairroId, Integer tipoId, FinalidadeImovel finalidade,
            BigDecimal precoMin, BigDecimal precoMax, String busca, String ordem, int pagina, int tamanho) {
        String texto = busca == null || busca.isBlank() ? null : busca.trim();
        String ordenacao = ordem == null ? "recentes" : ordem;
        int tam = Math.max(1, Math.min(tamanho, 50));
        return repository.buscar(status, bairroId, tipoId, finalidade, precoMin, precoMax, texto, ordenacao,
                PageRequest.of(Math.max(0, pagina), tam));
    }

    public ImovelModel find(Integer id) {
        Optional<ImovelModel> model = repository.findById(id);
        return model.orElse(null);
    }

    public ImovelModel insert(ImovelModel model) {
        validar(model);
        model.setId(null);
        if (model.getStatus() == null) {
            model.setStatus(StatusImovel.DISPONIVEL);
        }
        // O responsável pelo imóvel é o admin logado, se o JSON não informar outro
        if (model.getUsuario() == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                usuarioRepository.findByEmail(auth.getName()).ifPresent(model::setUsuario);
            }
        }
        return repository.save(model);
    }

    /** Copia os campos editáveis para o registro do banco (mantém dono, datas e fotos). */
    public ImovelModel update(ImovelModel dados) {
        ImovelModel existente = find(dados.getId());
        if (existente == null) {
            return null;
        }
        validar(dados);
        existente.setTitulo(dados.getTitulo());
        existente.setDescricao(dados.getDescricao());
        existente.setPrecoVenda(dados.getPrecoVenda());
        existente.setPrecoAluguel(dados.getPrecoAluguel());
        existente.setFinalidade(dados.getFinalidade());
        if (dados.getStatus() != null) {
            existente.setStatus(dados.getStatus());
        }
        existente.setDormitorios(dados.getDormitorios());
        existente.setBanheiros(dados.getBanheiros());
        existente.setGaragem(dados.getGaragem());
        existente.setAreaTotal(dados.getAreaTotal());
        existente.setAreaConstruida(dados.getAreaConstruida());
        existente.setEndereco(dados.getEndereco());
        existente.setNumero(dados.getNumero());
        existente.setComplemento(dados.getComplemento());
        existente.setCep(dados.getCep());
        existente.setCaracteristicas(dados.getCaracteristicas());
        existente.setDestaque(dados.isDestaque());
        existente.setTipoImovel(dados.getTipoImovel());
        existente.setBairro(dados.getBairro());
        if (dados.getUsuario() != null) {
            existente.setUsuario(dados.getUsuario());
        }
        return repository.save(existente);
    }

    public ImovelModel alterarStatus(Integer id, StatusImovel status) {
        ImovelModel model = find(id);
        if (model == null) {
            return null;
        }
        model.setStatus(status);
        return repository.save(model);
    }

    /** Apaga também fotos e favoritos; imóvel com histórico de ofertas não pode ser excluído. */
    @Transactional
    public void delete(Integer id) {
        if (find(id) == null) {
            return;
        }
        if (ofertaRepository.existsByImovelId(id)) {
            throw new RegraNegocioException("Este imóvel tem ofertas registradas e não pode ser excluído. "
                    + "Se ele saiu do mercado, altere a situação para INATIVO.");
        }
        favoritoRepository.deleteByImovelId(id);
        for (FotoImovelModel foto : fotoRepository.findByImovelId(id)) {
            fotoService.excluir(foto.getId());
        }
        repository.deleteById(id);
    }

    private void validar(ImovelModel m) {
        if (m.getTitulo() == null || m.getTitulo().isBlank()) {
            throw new DadosInvalidosException("Informe o título do imóvel.");
        }
        if (m.getFinalidade() == null) {
            throw new DadosInvalidosException("Informe a finalidade (venda ou aluguel).");
        }
        if (m.getBairro() == null || m.getBairro().getId() == null) {
            throw new DadosInvalidosException("Informe o bairro.");
        }
        if (m.getTipoImovel() == null || m.getTipoImovel().getId() == null) {
            throw new DadosInvalidosException("Informe o tipo do imóvel.");
        }
        BigDecimal preco = m.getFinalidade() == FinalidadeImovel.VENDA ? m.getPrecoVenda() : m.getPrecoAluguel();
        if (preco == null || preco.signum() <= 0) {
            throw new DadosInvalidosException("Informe o preço de " + (m.getFinalidade() == FinalidadeImovel.VENDA ? "venda." : "aluguel."));
        }
    }
}
