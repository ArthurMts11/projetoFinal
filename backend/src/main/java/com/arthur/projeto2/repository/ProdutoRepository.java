package com.arthur.projeto2.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arthur.projeto2.model.ProdutoModel;

public interface ProdutoRepository extends JpaRepository<ProdutoModel, Integer> {
}
