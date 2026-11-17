package com.arthur.projeto2.dtos;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Corpo do PUT /contratos/{id}: dados que o corretor completa antes de enviar para aprovação. */
public record PreparoContratoDTO(
        @NotNull(message = "Informe o valor final.")
        @DecimalMin(value = "0.01", message = "O valor final precisa ser maior que zero.") BigDecimal valorFinal,
        @Min(value = 1, message = "O prazo precisa ser de pelo menos 1 mês.")
        @Max(value = 120, message = "O prazo pode ser de no máximo 120 meses.") Integer prazoMeses,
        @NotNull(message = "Informe o dia de vencimento.")
        @Min(value = 1, message = "O dia de vencimento vai de 1 a 28.")
        @Max(value = 28, message = "O dia de vencimento vai de 1 a 28.") Integer diaVencimento,
        @Size(max = 1000, message = "As observações podem ter no máximo 1000 caracteres.") String observacoes) {
}
