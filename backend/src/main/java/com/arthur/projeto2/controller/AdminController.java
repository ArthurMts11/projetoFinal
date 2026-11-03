package com.arthur.projeto2.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * O DispatcherServlet do Spring (mapeado em "/") não resolve arquivo de boas-
 * vindas para subpastas como Tomcat fazia sozinho antes (só a raiz "/" ganha
 * esse tratamento automático, via WelcomePageHandlerMapping). Esse mapeamento
 * explícito reproduz o comportamento antigo de "/admin/" abrir admin/index.jsp.
 */
@Controller
public class AdminController {

    @GetMapping({"/admin", "/admin/"})
    public String index() {
        return "admin/index";
    }
}
