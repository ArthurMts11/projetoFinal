package com.arthur.projeto2.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.arthur.projeto2.model.FavoritoModel;

public interface FavoritoRepository extends JpaRepository<FavoritoModel, Integer> {

    List<FavoritoModel> findByUsuarioIdOrderByIdDesc(Integer usuarioId);

    Optional<FavoritoModel> findByUsuarioIdAndImovelId(Integer usuarioId, Integer imovelId);

    @Transactional
    void deleteByImovelId(Integer imovelId);
}
