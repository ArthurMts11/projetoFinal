package com.arthur.projeto2.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.arthur.projeto2.model.ProdutoModel;
import com.arthur.projeto2.repository.ProdutoRepository;

import jakarta.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/produtos")
public class ProdutoController {

    private final ProdutoRepository repository;

    public ProdutoController(ProdutoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public String handleGet(@RequestParam(defaultValue = "listar") String action,
            @RequestParam(required = false) Integer id, HttpServletRequest request) {

        switch (action) {
            case "novo":
                return "produto-form";

            case "editar":
                ProdutoModel produto = repository.findById(id).orElse(null);
                request.setAttribute("produto", produto);
                return "produto-form";

            case "excluir":
                repository.deleteById(id);
                return "redirect:produtos";

            default:
                List<ProdutoModel> produtos = repository.findAll();
                request.setAttribute("produtos", produtos);
                return "produtos";
        }
    }

    @PostMapping
    public String salvar(@RequestParam(required = false) Integer id, @RequestParam String nome,
            @RequestParam double preco, @RequestParam int quantidade) {

        if (id == null) {
            repository.save(new ProdutoModel(nome, preco, quantidade));
        } else {
            repository.save(new ProdutoModel(id, nome, preco, quantidade));
        }

        return "redirect:produtos";
    }
}
