package com.arthur.projeto2.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.arthur.projeto2.model.TipoImovelModel;

public interface TipoImovelRepository extends JpaRepository<TipoImovelModel, Integer> {

    /** Outro tipo (id diferente; null no cadastro) com o mesmo nome, sem diferenciar maiúsculas. */
    @Query("""
            select count(t) > 0 from TipoImovelModel t
            where lower(trim(t.nome)) = lower(trim(:nome))
              and (:id is null or t.id <> :id)
            """)
    boolean existeOutroComMesmoNome(@Param("nome") String nome, @Param("id") Integer id);
}
