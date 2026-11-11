package com.arthur.projeto2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.arthur.projeto2.model.BairroModel;

public interface BairroRepository extends JpaRepository<BairroModel, Integer> {

    /**
     * Outro bairro (id diferente; null no cadastro) com o mesmo nome na mesma cidade,
     * sem diferenciar maiúsculas. Cidade vazia conta como "sem cidade".
     */
    @Query("""
            select count(b) > 0 from BairroModel b
            where lower(trim(b.nome)) = lower(trim(:nome))
              and lower(trim(coalesce(b.cidade, ''))) = lower(trim(coalesce(:cidade, '')))
              and (:id is null or b.id <> :id)
            """)
    boolean existeOutroComMesmoNome(@Param("nome") String nome, @Param("cidade") String cidade,
            @Param("id") Integer id);
}
