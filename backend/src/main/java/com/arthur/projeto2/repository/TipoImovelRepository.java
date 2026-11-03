package com.arthur.projeto2.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arthur.projeto2.model.TipoImovelModel;

public interface TipoImovelRepository extends JpaRepository<TipoImovelModel, Integer> {

}
