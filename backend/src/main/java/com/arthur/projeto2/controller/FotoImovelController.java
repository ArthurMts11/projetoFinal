package com.arthur.projeto2.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.arthur.projeto2.model.FotoImovelModel;
import com.arthur.projeto2.services.FotoImovelService;

@RestController
@RequestMapping("/fotos")
public class FotoImovelController {

    @Autowired
    private FotoImovelService service;

    @GetMapping
    public ResponseEntity<List<FotoImovelModel>> getAll(@RequestParam(required = false) Integer imovelId) {
        List<FotoImovelModel> list = imovelId == null ? service.getAll() : service.findByImovelId(imovelId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FotoImovelModel> find(@PathVariable Integer id) {
        FotoImovelModel model = service.find(id);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(model);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FotoImovelModel> salvar(
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam("imovelId") Integer imovelId) {
        try {
            if (arquivo.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            FotoImovelModel fotoImovelModel = service.salvar(arquivo, imovelId);

            return ResponseEntity.status(HttpStatus.CREATED).body(fotoImovelModel);

        } catch (IllegalArgumentException e) {
            // imóvel não existe ou arquivo não é imagem
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FotoImovelModel> editar(@PathVariable Integer id, @RequestBody FotoImovelModel dados) {
        FotoImovelModel model = service.editar(id, dados);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(model);
    }

    @PutMapping("/{id}/capa")
    public ResponseEntity<FotoImovelModel> tornarCapa(@PathVariable Integer id) {
        FotoImovelModel model = service.tornarCapa(id);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(model);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        if (!service.excluir(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
