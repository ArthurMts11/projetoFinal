package com.arthur.projeto2.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.services.FavoritoService;

/** Favoritos do cliente logado. */
@RestController
@RequestMapping("/favoritos")
public class FavoritoController {

    private final FavoritoService service;

    public FavoritoController(FavoritoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ImovelModel> listar() {
        return service.meus();
    }

    // Só os ids, para o front marcar o coração nos cards
    @GetMapping("/ids")
    public List<Integer> ids() {
        return service.idsDosMeus();
    }

    @PostMapping("/{imovelId}")
    public ResponseEntity<Void> adicionar(@PathVariable Integer imovelId) {
        service.adicionar(imovelId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{imovelId}")
    public ResponseEntity<Void> remover(@PathVariable Integer imovelId) {
        service.remover(imovelId);
        return ResponseEntity.noContent().build();
    }
}
