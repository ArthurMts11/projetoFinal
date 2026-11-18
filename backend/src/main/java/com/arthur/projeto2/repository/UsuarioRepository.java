package com.arthur.projeto2.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.arthur.projeto2.model.TipoUsuario;
import com.arthur.projeto2.model.UsuarioModel;

public interface UsuarioRepository extends JpaRepository<UsuarioModel, Integer> {

    Optional<UsuarioModel> findByEmail(String email);

    List<UsuarioModel> findByTipo(TipoUsuario tipo);

    boolean existsByEmailIgnoreCase(String email);

    List<UsuarioModel> findByNomeContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByNome(String nome, String email);
}
