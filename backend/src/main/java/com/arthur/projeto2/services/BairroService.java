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
        exigirNomeUnico(model);
        return repository.save(model);
    }

    public BairroModel update(BairroModel model) {
        if (find(model.getId()) == null) {
            return null;
        }
        // Fora do try: a regra precisa chegar ao controller como 409, não virar 404
        exigirNomeUnico(model);
        try {
            return repository.save(model);
        } catch (Exception e) {
            return null;
        }
    }

    private void exigirNomeUnico(BairroModel model) {
        if (repository.existeOutroComMesmoNome(model.getNome(), model.getCidade(), model.getId())) {
            String cidade = model.getCidade() == null || model.getCidade().isBlank()
                    ? "sem cidade informada"
                    : model.getCidade().trim();
            throw new RegraNegocioException(
                    "Já existe o bairro \"" + model.getNome().trim() + "\" em " + cidade + ".");
        }
    }

    public void delete(Integer id) {
        if (imovelRepository.existsByBairroId(id)) {
            throw new RegraNegocioException("Não é possível excluir este bairro: existem imóveis vinculados a ele.");
        }
        repository.deleteById(id);
    }

}
