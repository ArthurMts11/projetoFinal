package com.arthur.projeto2.dtos;

import com.arthur.projeto2.model.StatusImovel;

import jakarta.validation.constraints.NotNull;

public record StatusImovelDTO(@NotNull(message = "Informe o status.") StatusImovel status) {
}
