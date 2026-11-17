package com.arthur.projeto2.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.arthur.projeto2.services.DashboardService;

/** Totais e dados dos gráficos dos painéis do admin e do corretor. */
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> resumo() {
        return service.resumo();
    }

    @GetMapping("/corretor")
    public Map<String, Object> resumoCorretor() {
        return service.resumoCorretor();
    }
}
