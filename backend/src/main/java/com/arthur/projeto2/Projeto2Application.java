package com.arthur.projeto2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * extends SpringBootServletInitializer para o WAR continuar podendo ser
 * publicado num Tomcat externo, como já era feito antes da migração.
 */
@SpringBootApplication
public class Projeto2Application extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(Projeto2Application.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(Projeto2Application.class, args);
    }
}
