package com.arthur.projeto2.controller;

import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.arthur.projeto2.model.ContratoModel;
import com.arthur.projeto2.services.ContratoService;

/**
 * ADMIN: GET /contratos, PATCH /contratos/{id}/aprovar e /cancelar.
 * CLIENTE: GET /contratos/meus, PATCH /contratos/{id}/assinar.
 * Os dois: GET /contratos/{id}/pdf (o cliente só o dele).
 */
@RestController
@RequestMapping("/contratos")
public class ContratoController {

    private final ContratoService service;

    public ContratoController(ContratoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ContratoModel> listar() {
        return service.listar();
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
