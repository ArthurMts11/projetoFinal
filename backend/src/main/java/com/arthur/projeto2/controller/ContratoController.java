package com.arthur.projeto2.controller;

import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.arthur.projeto2.dtos.DevolucaoDTO;
import com.arthur.projeto2.dtos.PreparoContratoDTO;
import com.arthur.projeto2.model.ContratoModel;
import com.arthur.projeto2.model.StatusContrato;
import com.arthur.projeto2.services.ContratoService;

import jakarta.validation.Valid;

/**
 * CORRETOR: PUT /contratos/{id} (preparo), PATCH /contratos/{id}/enviar.
 * ADMIN: PATCH /contratos/{id}/aprovar, /devolver e /cancelar.
 * ADMIN e CORRETOR: GET /contratos?status=, GET /contratos/{id}.
 * CLIENTE: GET /contratos/meus, PATCH /contratos/{id}/assinar.
 * Todos: GET /contratos/{id}/pdf (o cliente só o dele, depois de aprovado).
 */
@RestController
@RequestMapping("/contratos")
public class ContratoController {

    private final ContratoService service;

    public ContratoController(ContratoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ContratoModel> listar(@RequestParam(required = false) StatusContrato status) {
        return service.listar(status);
    }

    @GetMapping("/meus")
    public List<ContratoModel> meus() {
        return service.meus();
    }

    @GetMapping("/{id}")
    public ContratoModel find(@PathVariable Integer id) {
        return service.find(id);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Integer id) {
        byte[] pdf = service.pdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("contrato-" + id + ".pdf").build().toString())
                .body(pdf);
    }

    @PutMapping("/{id}")
    public ContratoModel preparar(@PathVariable Integer id, @Valid @RequestBody PreparoContratoDTO dados) {
        return service.preparar(id, dados);
    }

    @PatchMapping("/{id}/enviar")
    public ContratoModel enviar(@PathVariable Integer id) {
        return service.enviar(id);
    }

    @PatchMapping("/{id}/devolver")
    public ContratoModel devolver(@PathVariable Integer id, @Valid @RequestBody DevolucaoDTO dados) {
        return service.devolver(id, dados.motivo());
    }

    @PatchMapping("/{id}/aprovar")
    public ContratoModel aprovar(@PathVariable Integer id) {
        return service.aprovar(id);
    }

    @PatchMapping("/{id}/cancelar")
    public ContratoModel cancelar(@PathVariable Integer id) {
        return service.cancelar(id);
    }

    @PatchMapping("/{id}/assinar")
    public ContratoModel assinar(@PathVariable Integer id) {
        return service.assinar(id);
    }
}
