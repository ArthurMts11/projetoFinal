package com.arthur.projeto2.controller;

import java.math.BigDecimal;
import java.net.URI;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.arthur.projeto2.dtos.PaginaDTO;
import com.arthur.projeto2.dtos.SaberMaisDTO;
import com.arthur.projeto2.dtos.StatusImovelDTO;
import com.arthur.projeto2.model.FinalidadeImovel;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.model.StatusImovel;
import com.arthur.projeto2.services.EmailService;
import com.arthur.projeto2.services.FotoImovelService;
import com.arthur.projeto2.services.ImovelService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/imoveis")
public class ImovelController {

    private static final Logger log = LoggerFactory.getLogger(ImovelController.class);

    // Gmail aceita até 25 MB por e-mail; 6 fotos deixam folga
    private static final int MAX_FOTOS_EMAIL = 6;

    private final ImovelService service;
    private final EmailService emailService;
    private final FotoImovelService fotoService;
    private final Map<String, String> imobiliaria;

    public ImovelController(ImovelService service, EmailService emailService, FotoImovelService fotoService,
                            @Value("${app.imobiliaria.nome}") String nome,
                            @Value("${app.imobiliaria.telefone}") String telefone,
                            @Value("${app.imobiliaria.email}") String email) {
        this.service = service;
        this.emailService = emailService;
        this.fotoService = fotoService;
        this.imobiliaria = Map.of("nome", nome, "telefone", telefone, "email", email);
    }

    @GetMapping
    public ResponseEntity<List<ImovelModel>> getAllImoveis() {
        List<ImovelModel> list = service.getAll();
        return ResponseEntity.status(HttpStatus.OK).body(list);
    }

    @GetMapping("/imoveis-page")
    public Page<ImovelModel> getPosts(Pageable pageable) {
        return service.getAll(pageable);
    }

    /**
     * Vitrine: GET /imoveis/buscar?status=DISPONIVEL&bairroId=1&finalidade=VENDA
     * &precoMin=100000&precoMax=500000&ordem=preco_asc&page=0&size=9
     * Todos os filtros são opcionais e podem ser combinados.
     * ordem: recentes (padrão), preco_asc ou preco_desc.
     */
    @GetMapping("/buscar")
    public PaginaDTO<ImovelModel> buscar(@RequestParam(required = false) StatusImovel status,
                                         @RequestParam(required = false) Integer bairroId,
                                         @RequestParam(required = false) Integer tipoId,
                                         @RequestParam(required = false) FinalidadeImovel finalidade,
                                         @RequestParam(required = false) BigDecimal precoMin,
                                         @RequestParam(required = false) BigDecimal precoMax,
                                         @RequestParam(required = false) String busca,
                                         @RequestParam(defaultValue = "recentes") String ordem,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "9") int size) {
        return PaginaDTO.de(service.buscar(status, bairroId, tipoId, finalidade, precoMin, precoMax, busca, ordem, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ImovelModel> find(@PathVariable Integer id) {
        ImovelModel model = service.find(id);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(model);
    }

    @PostMapping
    public ResponseEntity<Void> insert(@RequestBody ImovelModel model) {
        model = service.insert(model);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(model.getId()).toUri();
        return ResponseEntity.created(uri).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@RequestBody ImovelModel model, @PathVariable Integer id) {
        model.setId(id);
        model = service.update(model);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    // Liberado para qualquer usuário autenticado (ver SecurityConfig), não só ADMIN
    @PatchMapping("/{id}/status")
    public ResponseEntity<ImovelModel> alterarStatus(@PathVariable Integer id, @Valid @RequestBody StatusImovelDTO dados) {
        ImovelModel model = service.alterarStatus(id, dados.status());
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(model);
    }

    /**
     * Cliente pede mais informações sobre o imóvel: envia para o e-mail dele
     * os dados do imóvel e uma mensagem da imobiliária (template email/saber-mais).
     */
    @PostMapping("/sabermais/{id}")
    public ResponseEntity<Map<String, String>> saberMais(@PathVariable Integer id, @Valid @RequestBody SaberMaisDTO dados) {
        ImovelModel imovel = service.find(id);
        if (imovel == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", "Imóvel " + id + " não encontrado."));
        }

        // Cada foto vira uma imagem embutida, referenciada no template por "cid:foto0", "cid:foto1"...
        Map<String, Path> fotos = new LinkedHashMap<>();
        List<Path> arquivos = fotoService.arquivosDasFotos(id, MAX_FOTOS_EMAIL);
        for (int i = 0; i < arquivos.size(); i++) {
            fotos.put("foto" + i, arquivos.get(i));
        }

        try {
            emailService.enviarEmailComTemplate(dados.email(),
                    imovel.getTitulo() + " | " + imobiliaria.get("nome"),
                    "email/saber-mais", Map.of(
                            "cliente", dados,
                            "imovel", imovel,
                            "fotos", List.copyOf(fotos.keySet()),
                            "imobiliaria", imobiliaria),
                    fotos);
            return ResponseEntity.ok(Map.of("mensagem", "Enviamos as informações do imóvel para " + dados.email()));
        } catch (MailException e) {
            log.error("Falha ao enviar e-mail do imóvel {} para {}", id, dados.email(), e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("erro", "Não foi possível enviar o e-mail agora. Tente novamente mais tarde."));
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> dadosInvalidos(MethodArgumentNotValidException e) {
        Map<String, String> erros = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(erro -> erros.put(erro.getField(), erro.getDefaultMessage()));
        return ResponseEntity.badRequest().body(erros);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

}
