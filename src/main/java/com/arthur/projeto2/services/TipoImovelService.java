package com.arthur.projeto2.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.repository.ImovelRepository;

import com.arthur.projeto2.model.TipoImovelModel;
import com.arthur.projeto2.repository.TipoImovelRepository;

@Service
public class TipoImovelService {

    @Autowired
    private TipoImovelRepository repository;

    @Autowired
    private ImovelRepository imovelRepository;

    public List<TipoImovelModel> getAll() {
        return repository.findAll();
    }

    public Page<TipoImovelModel> getAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public TipoImovelModel find(Integer id) {
        Optional<TipoImovelModel> model = repository.findById(id);
        return model.orElse(null);
    }

    public TipoImovelModel insert(TipoImovelModel model) {
        return repository.save(model);
    }

    public TipoImovelModel update(TipoImovelModel model) {
        try {
            if (find(model.getId()) != null) {
                return repository.save(model);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public void delete(Integer id) {
        if (imovelRepository.existsByTipoImovelId(id)) {
            throw new RegraNegocioException("Não é possível excluir este tipo de imóvel: existem imóveis vinculados a ele.");
        }
        repository.deleteById(id);
    }

}
