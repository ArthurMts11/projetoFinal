package com.arthur.projeto2.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arthur.projeto2.model.FotoImovelModel;

public interface FotoImovelRepository extends JpaRepository<FotoImovelModel, Integer> {

    List<FotoImovelModel> findByImovelId(Integer imovelId);

}
