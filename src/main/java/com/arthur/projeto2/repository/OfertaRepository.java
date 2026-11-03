package com.arthur.projeto2.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arthur.projeto2.model.OfertaModel;
import com.arthur.projeto2.model.StatusOferta;

public interface OfertaRepository extends JpaRepository<OfertaModel, Integer> {

    List<OfertaModel> findByUsuarioIdOrderByCreatedAtDesc(Integer usuarioId);

    List<OfertaModel> findAllByOrderByCreatedAtDesc();

    List<OfertaModel> findByStatusOrderByCreatedAtDesc(StatusOferta status);

    List<OfertaModel> findByImovelIdAndStatusIn(Integer imovelId, Collection<StatusOferta> status);

    boolean existsByImovelIdAndUsuarioIdAndStatus(Integer imovelId, Integer usuarioId, StatusOferta status);

    boolean existsByImovelId(Integer imovelId);

    long countByStatus(StatusOferta status);
}
