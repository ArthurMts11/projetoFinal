package com.arthur.projeto2.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arthur.projeto2.model.ContratoModel;
import com.arthur.projeto2.model.StatusContrato;

public interface ContratoRepository extends JpaRepository<ContratoModel, Integer> {

    List<ContratoModel> findAllByOrderByCreatedAtDesc();

    List<ContratoModel> findByStatusOrderByCreatedAtDesc(StatusContrato status);

    // Contratos do cliente nas situações que ele pode ver
    List<ContratoModel> findByOfertaUsuarioIdAndStatusInOrderByCreatedAtDesc(Integer usuarioId,
            Collection<StatusContrato> status);

    long countByStatus(StatusContrato status);

    long countByStatusIn(Collection<StatusContrato> status);
}
