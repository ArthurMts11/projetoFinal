package com.arthur.projeto2.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.repository.ImovelRepository;

import com.arthur.projeto2.model.BairroModel;
import com.arthur.projeto2.repository.BairroRepository;

@Service
public class BairroService {

    @Autowired
    private BairroRepository repository;

    @Autowired
    private ImovelRepository imovelRepository;

    public List<BairroModel> getAll() {
        return repository.findAll();
    }

    public Page<BairroModel> getAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public BairroModel find(Integer id) {
        Optional<BairroModel> model = repository.findById(id);
        return model.orElse(null);
    }

    public BairroModel insert(BairroModel model) {
        return repository.save(model);
    }

    public BairroModel update(BairroModel model) {
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
        if (imovelRepository.existsByBairroId(id)) {
            throw new RegraNegocioException("Não é possível excluir este bairro: existem imóveis vinculados a ele.");
        }
        repository.deleteById(id);
    }

}
