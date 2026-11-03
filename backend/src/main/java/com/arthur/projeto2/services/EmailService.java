package com.arthur.projeto2.services;

import java.io.UnsupportedEncodingException;
import java.nio.file.Path;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Envia e-mail por SMTP (Gmail). O remetente é a própria conta autenticada
 * (spring.mail.username): o Gmail não deixa enviar em nome de outro endereço.
 */
@Service
public class EmailService {

    private static final Map<String, String> TIPOS_IMAGEM = Map.of(
            "jpg", "image/jpeg", "jpeg", "image/jpeg", "png", "image/png", "webp", "image/webp");

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String remetente;
    private final String nomeRemetente;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine,
                        @Value("${spring.mail.username}") String remetente,
                        @Value("${app.imobiliaria.nome}") String nomeRemetente) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.remetente = remetente;
        this.nomeRemetente = nomeRemetente;
    }

    public void enviarEmailTexto(String para, String assunto, String texto) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(para);
        mensagem.setSubject(assunto);
        mensagem.setText(texto);
        mailSender.send(mensagem);
    }

    /**
     * @param template caminho dentro de templates/, sem .html (ex.: "email/template")
     */
    public void enviarEmailComTemplate(String para, String assunto, String template, Map<String, Object> variaveis) {
        enviarEmailComTemplate(para, assunto, template, variaveis, Map.of());
    }

    /**
     * @param imagens imagens embutidas no corpo do e-mail: a chave é o id usado no
     *                template como {@code src="cid:<id>"}, o valor é o arquivo no disco
     */
    public void enviarEmailComTemplate(String para, String assunto, String template,
                                       Map<String, Object> variaveis, Map<String, Path> imagens) {
        Context context = new Context();
        context.setVariables(variaveis);
        String html = templateEngine.process(template, context);

        MimeMessage mime = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(remetente, nomeRemetente);
            helper.setTo(para);
            helper.setSubject(assunto);
            // setText precisa vir antes do addInline
            helper.setText(html, true);
            for (Map.Entry<String, Path> imagem : imagens.entrySet()) {
                helper.addInline(imagem.getKey(), new FileSystemResource(imagem.getValue()), tipoDaImagem(imagem.getValue()));
            }
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new MailPreparationException("Não foi possível montar o e-mail para " + para, e);
        }
        mailSender.send(mime);
    }

    private String tipoDaImagem(Path arquivo) {
        String extensao = StringUtils.getFilenameExtension(arquivo.getFileName().toString());
        return TIPOS_IMAGEM.getOrDefault(extensao == null ? "" : extensao.toLowerCase(), "application/octet-stream");
    }
}
