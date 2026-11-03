package com.arthur.projeto2.dtos;

import java.util.List;

import org.springframework.data.domain.Page;

/** Página de resultados num formato estável para o front (o Page do Spring muda entre versões). */
public record PaginaDTO<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PaginaDTO<T> de(Page<T> p) {
        return new PaginaDTO<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }
}
