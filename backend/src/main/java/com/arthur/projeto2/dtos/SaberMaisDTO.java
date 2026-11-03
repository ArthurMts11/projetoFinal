package com.arthur.projeto2.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corpo do POST /imoveis/sabermais/{id}: os dados que o cliente preenche
 * para pedir mais informações sobre um imóvel.
 */
public record SaberMaisDTO(
        @NotBlank(message = "Informe o nome") @Size(max = 100) String nome,
        @NotBlank(message = "Informe o telefone") @Size(max = 20) String telefone,
        @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") @Size(max = 150) String email,
        @NotBlank(message = "Escreva uma mensagem") @Size(max = 2000) String mensagem) {
}
