package com.arthur.projeto2.controller;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.arthur.projeto2.dtos.UserDTO;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.services.UsuarioService;

/**
 * API JSON com DTO, separada de /usuarios (que continua servindo as telas
 * JSP do admin) para não conflitar com o GET que já existe lá.
 */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioApiController {

    private final UsuarioService service;

    public UsuarioApiController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers(@RequestParam(required = false) String busca) {
        // ?busca= filtra por nome ou e-mail
        List<UsuarioModel> listaModel = busca == null ? service.getAllUsers() : service.buscar(busca);
        List<UserDTO> listaDto = listaModel.stream().map(UserDTO::new).collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.OK).body(listaDto);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> find(@PathVariable Integer id) {
        UsuarioModel model = service.find(id);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new UserDTO(model));
    }

    @PostMapping
    public ResponseEntity<Void> insert(@RequestBody UserDTO dto) {
        UsuarioModel model = service.insert(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(model.getId()).toUri();
        return ResponseEntity.created(uri).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@RequestBody UserDTO dto, @PathVariable Integer id) {
        dto.setId(id);
        UsuarioModel model = service.update(dto);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    // Um admin não pode excluir a si mesmo (o service responde 409)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id, Authentication auth) {
        service.excluir(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
