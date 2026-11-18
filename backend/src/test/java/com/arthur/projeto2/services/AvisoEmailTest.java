package com.arthur.projeto2.services;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

/** O e-mail de aviso (templates/email/aviso.html) com o tema da imobiliária. */
class AvisoEmailTest {

    private final Aviso aviso = new Aviso("Contrato nº 7 devolvido", "Contrato nº 7", "Contrato devolvido para correção",
            List.of("O administrador devolveu o contrato do imóvel \"Casa no Centro\"."),
            Map.of("Imóvel", "Casa no Centro"), "O prazo combinado é 12 meses.",
            "Corrigir contrato", "/corretor/contratos/7");

    @Test
    void textoSimplesTrazTudoQueOHtmlMostra() {
        String texto = aviso.textoSimples("http://localhost:4200");
        assertThat(texto).contains("Contrato devolvido para correção", "Casa no Centro",
                "O prazo combinado é 12 meses.", "http://localhost:4200/corretor/contratos/7");
    }

    @Test
    void templateRenderizaTituloDetalhesDestaqueEBotao() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine engine = new SpringTemplateEngine(); // o mesmo motor (SpEL) que o app usa
        engine.setTemplateResolver(resolver);

        Context ctx = new Context();
        ctx.setVariables(Map.of("aviso", aviso, "link", "http://localhost:4200/corretor/contratos/7",
                "imobiliaria", Map.of("nome", "Imobiliária Fogami", "telefone", "(55) 3333-0000",
                        "email", "contato@fogami.com")));
        String html = engine.process("email/aviso", ctx);

        assertThat(html).contains("Contrato devolvido para correção", "Casa no Centro",
                "O prazo combinado é 12 meses.", "href=\"http://localhost:4200/corretor/contratos/7\"",
                "Corrigir contrato", "#1f5f4a", "(55) 3333-0000");
    }
}
