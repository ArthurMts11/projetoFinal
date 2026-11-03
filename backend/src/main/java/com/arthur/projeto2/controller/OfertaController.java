package com.arthur.projeto2.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.arthur.projeto2.dtos.OfertaDTO;
import com.arthur.projeto2.model.OfertaModel;
import com.arthur.projeto2.model.StatusOferta;
import com.arthur.projeto2.services.OfertaService;

import jakarta.validation.Valid;

/**
 * CLIENTE: POST /ofertas, GET /ofertas/minhas, PATCH /ofertas/{id}/cancelar.
 * ADMIN: GET /ofertas?status=, PATCH /ofertas/{id}/aceitar e /recusar.
 */
@RestController
@RequestMapping("/ofertas")
public class OfertaController {

    private final OfertaService service;

    public OfertaController(OfertaService service) {
        this.service = service;
    }

    @GetMapping
    public List<OfertaModel> listar(@RequestParam(required = false) StatusOferta status) {
        return service.listar(status);
    }

    @GetMapping("/minhas")
    public List<OfertaModel> minhas() {
        return service.minhas();
    }

    @PostMapping
    public ResponseEntity<OfertaModel> criar(@Valid @RequestBody OfertaDTO dados) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(dados));
    }

    @PatchMapping("/{id}/aceitar")
    public OfertaModel aceitar(@PathVariable Integer id) {
        return service.aceitar(id);
    }

    @PatchMapping("/{id}/recusar")
    public OfertaModel recusar(@PathVariable Integer id) {
        return service.recusar(id);
    }

    @PatchMapping("/{id}/cancelar")
    public OfertaModel cancelar(@PathVariable Integer id) {
        return service.cancelarPeloCliente(id);
    }
}
