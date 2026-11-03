package com.arthur.projeto2.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.arthur.projeto2.config.SecurityConfig;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.arthur.projeto2.controller.AuthController;
import com.arthur.projeto2.controller.ImovelController;
import com.arthur.projeto2.controller.UsuarioApiController;
import com.arthur.projeto2.model.ImovelModel;
import com.arthur.projeto2.model.StatusImovel;
import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.UsuarioRepository;
import com.arthur.projeto2.services.EmailService;
import com.arthur.projeto2.services.FotoImovelService;
import com.arthur.projeto2.services.ImovelService;
import com.arthur.projeto2.services.UsuarioService;

/**
 * Confere a tabela de rotas da atividade: quem acessa cada ação e se a
 * resposta é 401 (sem token / token inválido) ou 403 (sem permissão).
 */
@WebMvcTest(controllers = { AuthController.class, ImovelController.class, UsuarioApiController.class })
@Import({ SecurityConfig.class, JsonErroSeguranca.class, TokenService.class,
        LoginRateLimiter.class, LoginSuccessHandler.class })
@TestPropertySource(properties = "app.jwt.secret=" + ApiSecurityTest.SEGREDO)
class ApiSecurityTest {

    static final String SEGREDO = "chave-de-teste-com-mais-de-32-caracteres";

    private static final String IMOVEL_JSON = "{\"titulo\":\"Casa\"}";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @MockitoBean
    private ImovelService imovelService;

    @MockitoBean
    private UsuarioService usuarioService;

    @MockitoBean
    private EmailService emailService;

    @MockitoBean
    private FotoImovelService fotoService;

    // ---------- Login ----------

    @Test
    void loginComCredenciaisCorretasDevolveToken() throws Exception {
        UsuarioModel admin = usuario(TipoUsuario.ADMIN);
        admin.setSenha(passwordEncoder.encode("1234"));
        when(usuarioRepository.findByEmail("admin@teste.com")).thenReturn(Optional.of(admin));

        mvc.perform(post("/public/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@teste.com\",\"senha\":\"1234\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void loginComSenhaErradaDevolve401() throws Exception {
        UsuarioModel admin = usuario(TipoUsuario.ADMIN);
        admin.setSenha(passwordEncoder.encode("1234"));
        when(usuarioRepository.findByEmail("admin@teste.com")).thenReturn(Optional.of(admin));

        mvc.perform(post("/public/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@teste.com\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginSemEmailDevolve400() throws Exception {
        mvc.perform(post("/public/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"senha\":\"1234\"}"))
                .andExpect(status().isBadRequest());
    }

    // ---------- Rotas públicas ----------

    @Test
    void listarImoveisNaoPrecisaDeToken() throws Exception {
        when(imovelService.getAll()).thenReturn(List.of());
        mvc.perform(get("/imoveis")).andExpect(status().isOk());
    }

    @Test
    void buscarUmImovelNaoPrecisaDeToken() throws Exception {
        when(imovelService.find(1)).thenReturn(new ImovelModel());
        mvc.perform(get("/imoveis/1")).andExpect(status().isOk());
    }

    // ---------- 401: rota protegida sem token ou com token ruim ----------

    @Test
    void cadastrarImovelSemTokenDevolve401() throws Exception {
        mvc.perform(post("/imoveis").contentType(MediaType.APPLICATION_JSON).content(IMOVEL_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
        verify(imovelService, never()).insert(any());
    }

    @Test
    void tokenMalformadoDevolve401() throws Exception {
        mvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, "Bearer nao.e.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenExpiradoDevolve401() throws Exception {
        Instant passado = Instant.now().minusSeconds(3600);
        String expirado = JWT.create().withIssuer(TokenService.ISSUER).withSubject("admin@teste.com")
                .withClaim("role", "ADMIN").withIssuedAt(passado.minusSeconds(60)).withExpiresAt(passado)
                .sign(Algorithm.HMAC256(SEGREDO));

        mvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, "Bearer " + expirado))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenAssinadoComOutraChaveDevolve401() throws Exception {
        String falsificado = JWT.create().withIssuer(TokenService.ISSUER).withSubject("hacker@teste.com")
                .withClaim("role", "ADMIN").sign(Algorithm.HMAC256("outra-chave-qualquer-com-32-caracteres!!"));

        mvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, "Bearer " + falsificado))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void alterarStatusSemTokenDevolve401() throws Exception {
        mvc.perform(patch("/imoveis/1/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"VENDIDO\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- 403: token válido de CLIENTE em rota de ADMIN ----------

    @Test
    void clienteNaoPodeCadastrarImovel() throws Exception {
        mvc.perform(post("/imoveis").header(HttpHeaders.AUTHORIZATION, bearer(TipoUsuario.CLIENTE))
                .contentType(MediaType.APPLICATION_JSON).content(IMOVEL_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        verify(imovelService, never()).insert(any());
    }

    @Test
    void clienteNaoPodeAlterarNemRemoverImovel() throws Exception {
        String token = bearer(TipoUsuario.CLIENTE);
        mvc.perform(put("/imoveis/1").header(HttpHeaders.AUTHORIZATION, token)
                .contentType(MediaType.APPLICATION_JSON).content(IMOVEL_JSON))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/imoveis/1").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isForbidden());
    }

    @Test
    void clienteNaoPodeGerenciarUsuarios() throws Exception {
        String token = bearer(TipoUsuario.CLIENTE);
        mvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/usuarios").header(HttpHeaders.AUTHORIZATION, token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"x\"}"))
                .andExpect(status().isForbidden());
    }

    // ---------- Acessos permitidos com token ----------

    @Test
    void adminPodeCadastrarImovel() throws Exception {
        ImovelModel salvo = new ImovelModel();
        salvo.setId(10);
        when(imovelService.insert(any())).thenReturn(salvo);

        mvc.perform(post("/imoveis").header(HttpHeaders.AUTHORIZATION, bearer(TipoUsuario.ADMIN))
                .contentType(MediaType.APPLICATION_JSON).content(IMOVEL_JSON))
                .andExpect(status().isCreated());
    }

    @Test
    void adminPodeListarUsuarios() throws Exception {
        when(usuarioService.getAllUsers()).thenReturn(List.of(usuario(TipoUsuario.ADMIN)));

        mvc.perform(get("/api/usuarios").header(HttpHeaders.AUTHORIZATION, bearer(TipoUsuario.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("admin@teste.com"));
    }

    @Test
    void clienteAutenticadoPodeAlterarStatus() throws Exception {
        ImovelModel imovel = new ImovelModel();
        imovel.setStatus(StatusImovel.VENDIDO);
        when(imovelService.alterarStatus(eq(1), eq(StatusImovel.VENDIDO))).thenReturn(imovel);

        mvc.perform(patch("/imoveis/1/status").header(HttpHeaders.AUTHORIZATION, bearer(TipoUsuario.CLIENTE))
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"VENDIDO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VENDIDO"));
    }

    private String bearer(TipoUsuario tipo) {
        return "Bearer " + tokenService.gerarToken(usuario(tipo));
    }

    private static UsuarioModel usuario(TipoUsuario tipo) {
        UsuarioModel u = new UsuarioModel();
        u.setId(1);
        u.setNome("Teste");
        u.setEmail(tipo == TipoUsuario.ADMIN ? "admin@teste.com" : "cliente@teste.com");
        u.setTipo(tipo);
        return u;
    }
}
