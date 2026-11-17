package com.arthur.projeto2.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Corpo do PATCH /contratos/{id}/devolver: o admin explica ao corretor o que corrigir. */
public record DevolucaoDTO(
        @NotBlank(message = "Informe o motivo da devolução.")
        @Size(max = 500, message = "O motivo pode ter no máximo 500 caracteres.") String motivo) {
}
