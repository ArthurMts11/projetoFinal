package com.arthur.projeto2.dtos;

import java.math.BigDecimal;

import com.arthur.projeto2.model.TipoOferta;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Corpo do POST /ofertas, enviado pelo cliente no detalhe do imóvel. */
public record OfertaDTO(
        @NotNull(message = "Informe o imóvel.") Integer imovelId,
        @NotNull(message = "Informe se a oferta é de aluguel ou venda.") TipoOferta tipo,
        @NotNull(message = "Informe o valor proposto.")
        @DecimalMin(value = "0.01", message = "O valor proposto precisa ser maior que zero.") BigDecimal valorProposto,
        @Size(max = 2000, message = "A mensagem pode ter no máximo 2000 caracteres.") String mensagem) {
}
