package com.arthur.projeto2.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.UsuarioRepository;

import jakarta.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioController(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public String handleGet(@RequestParam(defaultValue = "listar") String action,
            @RequestParam(required = false) Integer id, HttpServletRequest request) {

        switch (action) {
            case "novo":
                return "usuario-form";

            case "editar":
                UsuarioModel usuario = repository.findById(id).orElse(null);
                request.setAttribute("usuario", usuario);
                return "usuario-form";

            case "excluir":
                repository.deleteById(id);
                return "redirect:usuarios";

            default:
                List<UsuarioModel> usuarios = repository.findAll();
                request.setAttribute("usuarios", usuarios);
                return "usuarios";
        }
    }

    // Formulário do JSP (registrar.jsp / usuario-form.jsp): x-www-form-urlencoded.
    @PostMapping(consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String salvar(@RequestParam(required = false) Integer id, @RequestParam String nome,
            @RequestParam String email, @RequestParam(required = false) String senha) {

        if (id == null) {
            UsuarioModel usuario = new UsuarioModel();
            usuario.setNome(nome);
            usuario.setEmail(email);
            usuario.setSenha(passwordEncoder.encode(senha));
            repository.save(usuario);

            // Cadastro público (registrar.jsp): manda o novo usuário fazer login.
            return "redirect:login.jsp";
        }

        // Edita a entidade existente (em vez de reconstruir uma nova) para não
        // perder campos que não vêm do formulário, como "tipo".
        UsuarioModel usuario = repository.findById(id).orElseThrow();
        usuario.setNome(nome);
        usuario.setEmail(email);

        // Campo de senha em branco na edição = mantém a senha atual (já criptografada).
        if (senha != null && !senha.isEmpty()) {
            usuario.setSenha(passwordEncoder.encode(senha));
        }

        repository.save(usuario);

        // Edição via CRUD administrativo: volta para a listagem.
        return "redirect:usuarios";
    }

    // Mesma rota, para clientes JSON (Thunder Client, Postman, etc.). Sempre
    // cria um usuário novo. Usa um DTO em vez da entidade direto no corpo:
    // evita a ambiguidade de construtor do Lombok com o Jackson e impede que
    // o cliente mande "id"/"tipo" e sobrescreva algo que não devia.
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<UsuarioModel> salvarViaJson(@RequestBody NovoUsuarioJson dados) {
        UsuarioModel usuario = new UsuarioModel();
        usuario.setNome(dados.nome());
        usuario.setEmail(dados.email());
        usuario.setSenha(passwordEncoder.encode(dados.senha()));

        UsuarioModel salvo = repository.save(usuario);

        // Não devolve o hash da senha na resposta.
        salvo.setSenha(null);

        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    public record NovoUsuarioJson(String nome, String email, String senha) {
    }
}
