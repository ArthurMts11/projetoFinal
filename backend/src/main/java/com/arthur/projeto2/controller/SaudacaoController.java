package com.arthur.projeto2.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class SaudacaoController {

    @PostMapping("/saudacao")
    public String saudacao(@RequestParam String nome, @RequestParam String mensagem, HttpServletRequest request) {
        String saudacao = "Olá, " + nome + "! " + mensagem;
        request.setAttribute("saudacao", saudacao);
        return "saudacao";
    }
}
