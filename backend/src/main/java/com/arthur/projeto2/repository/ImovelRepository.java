package com.arthur.projeto2.repository;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.arthur.projeto2.model.FinalidadeImovel;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.model.StatusImovel;

public interface ImovelRepository extends JpaRepository<ImovelModel, Integer> {

    // Preço que vale para o imóvel: o de venda se a finalidade é VENDA, senão o de aluguel
    String PRECO = "(CASE WHEN i.finalidade = com.arthur.projeto2.model.FinalidadeImovel.VENDA "
            + "THEN i.precoVenda ELSE i.precoAluguel END)";

    // Cada filtro é opcional: parâmetro nulo não filtra nada
    String FILTROS = " FROM ImovelModel i WHERE (:status IS NULL OR i.status = :status)"
            + " AND (:bairroId IS NULL OR i.bairro.id = :bairroId)"
            + " AND (:tipoId IS NULL OR i.tipoImovel.id = :tipoId)"
            + " AND (:finalidade IS NULL OR i.finalidade = :finalidade)"
            + " AND (:precoMin IS NULL OR " + PRECO + " >= :precoMin)"
            + " AND (:precoMax IS NULL OR " + PRECO + " <= :precoMax)"
            + " AND (:busca IS NULL OR LOWER(i.titulo) LIKE LOWER(CONCAT('%', :busca, '%')))";

    @Query(value = "SELECT i" + FILTROS
            + " ORDER BY CASE WHEN :ordem = 'preco_asc' THEN " + PRECO + " END ASC,"
            + " CASE WHEN :ordem = 'preco_desc' THEN " + PRECO + " END DESC, i.id DESC",
            countQuery = "SELECT COUNT(i)" + FILTROS)
    Page<ImovelModel> buscar(@Param("status") StatusImovel status,
                             @Param("bairroId") Integer bairroId,
                             @Param("tipoId") Integer tipoId,
                             @Param("finalidade") FinalidadeImovel finalidade,
                             @Param("precoMin") BigDecimal precoMin,
                             @Param("precoMax") BigDecimal precoMax,
                             @Param("busca") String busca,
                             @Param("ordem") String ordem,
                             Pageable pageable);

    long countByStatus(StatusImovel status);

    boolean existsByBairroId(Integer bairroId);

    boolean existsByTipoImovelId(Integer tipoImovelId);
}
