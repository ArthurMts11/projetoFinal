package com.arthur.projeto2.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arthur.projeto2.model.ContratoModel;
import com.arthur.projeto2.model.StatusContrato;

public interface ContratoRepository extends JpaRepository<ContratoModel, Integer> {

    List<ContratoModel> findAllByOrderByCreatedAtDesc();

    // Contratos que o admin já enviou para o cliente
    List<ContratoModel> findByOfertaUsuarioIdAndDataAprovacaoIsNotNullOrderByCreatedAtDesc(Integer usuarioId);

    long countByStatus(StatusContrato status);
}
