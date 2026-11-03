package com.arthur.projeto2.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.arthur.projeto2.exceptions.RecursoNaoEncontradoException;
import com.arthur.projeto2.model.FavoritoModel;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.FavoritoRepository;
import com.arthur.projeto2.repository.ImovelRepository;
import com.arthur.projeto2.security.UsuarioLogado;

@Service
public class FavoritoService {

    private final FavoritoRepository repository;
    private final ImovelRepository imovelRepository;
    private final UsuarioLogado usuarioLogado;

    public FavoritoService(FavoritoRepository repository, ImovelRepository imovelRepository, UsuarioLogado usuarioLogado) {
        this.repository = repository;
        this.imovelRepository = imovelRepository;
        this.usuarioLogado = usuarioLogado;
    }

    public List<ImovelModel> meus() {
        return repository.findByUsuarioIdOrderByIdDesc(usuarioLogado.get().getId()).stream()
                .map(FavoritoModel::getImovel).toList();
    }

    public List<Integer> idsDosMeus() {
        return meus().stream().map(ImovelModel::getId).toList();
    }

    // Adicionar duas vezes não dá erro: o imóvel simplesmente já está na lista
    @Transactional
    public void adicionar(Integer imovelId) {
        UsuarioModel usuario = usuarioLogado.get();
        ImovelModel imovel = imovelRepository.findById(imovelId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Imóvel " + imovelId + " não encontrado."));
        if (repository.findByUsuarioIdAndImovelId(usuario.getId(), imovelId).isEmpty()) {
            repository.save(new FavoritoModel(usuario, imovel));
        }
    }

    @Transactional
    public void remover(Integer imovelId) {
        FavoritoModel favorito = repository.findByUsuarioIdAndImovelId(usuarioLogado.get().getId(), imovelId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Este imóvel não está nos seus favoritos."));
        repository.delete(favorito);
    }
}
