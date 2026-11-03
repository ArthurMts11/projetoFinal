package com.arthur.projeto2.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.UsuarioRepository;

/**
 * Autentica pelo e-mail do usuário. A senha aqui já vem hasheada com BCrypt
 * (via SenhaUtil antigamente, agora via PasswordEncoder), então o
 * DaoAuthenticationProvider consegue comparar direto com BCryptPasswordEncoder.
 */
@Service
public class SecurityUsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public SecurityUsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UsuarioModel usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));

        return User.builder()
                .username(usuario.getEmail())
                .password(usuario.getSenha())
                .roles("USER")
                .build();
    }
}
