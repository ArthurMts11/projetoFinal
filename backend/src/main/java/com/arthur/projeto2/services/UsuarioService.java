package com.arthur.projeto2.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.arthur.projeto2.dtos.UserDTO;
import com.arthur.projeto2.exceptions.DadosInvalidosException;
import com.arthur.projeto2.exceptions.RecursoNaoEncontradoException;
import com.arthur.projeto2.exceptions.RegraNegocioException;
import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.model.UsuarioModel;
import com.arthur.projeto2.repository.UsuarioRepository;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UsuarioModel> getAllUsers() {
        return repository.findAll();
    }

    public UsuarioModel find(Integer id) {
        Optional<UsuarioModel> usuario = repository.findById(id);
        return usuario.orElse(null);
    }

    public UsuarioModel insert(UsuarioModel usuario) {
        return repository.save(usuario);
    }

    public UsuarioModel update(UsuarioModel usuario) {
        try {
            UsuarioModel existente = find(usuario.getId());
            if (existente == null) {
                return null;
            } else {
                if (usuario.getNome() != null) {
                    existente.setNome(usuario.getNome());
                }
            }
            return repository.save(existente);
        } catch (Exception e) {
            return null;
        }
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    public List<UsuarioModel> buscar(String termo) {
        if (termo == null || termo.isBlank()) {
            return repository.findAll();
        }
        return repository.findByNomeContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByNome(termo.trim(), termo.trim());
    }

    public UsuarioModel insert(UserDTO dto) {
        validar(dto, true);
        if (repository.existsByEmailIgnoreCase(dto.getEmail().trim())) {
            throw new RegraNegocioException("Já existe um usuário com o e-mail " + dto.getEmail() + ".");
        }
        UsuarioModel model = new UsuarioModel();
        model.setNome(dto.getNome().trim());
        model.setEmail(dto.getEmail().trim());
        model.setSenha(passwordEncoder.encode(dto.getSenha()));
        model.setTipo(tipo(dto.getTipo()));
        return repository.save(model);
    }

    /** Edita nome, e-mail, perfil e (se vier preenchida) a senha. */
    public UsuarioModel update(UserDTO dto) {
        UsuarioModel model = find(dto.getId());
        if (model == null) {
            return null;
        }
        validar(dto, false);
        repository.findByEmail(dto.getEmail().trim())
                .filter(outro -> outro.getId() != model.getId())
                .ifPresent(outro -> {
                    throw new RegraNegocioException("O e-mail " + dto.getEmail() + " já pertence a outro usuário.");
                });
        model.setNome(dto.getNome().trim());
        model.setEmail(dto.getEmail().trim());
        if (dto.getTipo() != null) {
            model.setTipo(tipo(dto.getTipo()));
        }
        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            model.setSenha(passwordEncoder.encode(dto.getSenha()));
        }
        return repository.save(model);
    }

    /** Regra: um admin não pode excluir a si mesmo. */
    public void excluir(Integer id, String emailLogado) {
        UsuarioModel model = find(id);
        if (model == null) {
            throw new RecursoNaoEncontradoException("Usuário " + id + " não encontrado.");
        }
        if (model.getEmail().equalsIgnoreCase(emailLogado)) {
            throw new RegraNegocioException("Você não pode excluir o seu próprio usuário.");
        }
        repository.delete(model);
        repository.flush();
    }

    private void validar(UserDTO dto, boolean novo) {
        if (dto.getNome() == null || dto.getNome().isBlank()) {
            throw new DadosInvalidosException("Informe o nome.");
        }
        if (dto.getEmail() == null || !dto.getEmail().trim().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new DadosInvalidosException("Informe um e-mail válido.");
        }
        if (novo && (dto.getSenha() == null || dto.getSenha().length() < 6)) {
            throw new DadosInvalidosException("A senha precisa ter pelo menos 6 caracteres.");
        }
        if (!novo && dto.getSenha() != null && !dto.getSenha().isBlank() && dto.getSenha().length() < 6) {
            throw new DadosInvalidosException("A nova senha precisa ter pelo menos 6 caracteres.");
        }
    }

    private TipoUsuario tipo(String valor) {
        if (valor == null || valor.isBlank()) {
            return TipoUsuario.CLIENTE;
        }
        try {
            return TipoUsuario.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new DadosInvalidosException("Perfil inválido: use ADMIN ou CLIENTE.");
        }
    }
}
