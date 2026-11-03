package com.arthur.projeto2.dtos;

import com.arthur.projeto2.model.UsuarioModel;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDTO {
    private Integer id;
    private String nome;
    private String email;
    private String tipo;

    // Só é lida quando vem no corpo de uma requisição (POST) — nunca aparece
    // no JSON de saída (GET). Existe porque UsuarioModel.senha é NOT NULL.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    public UserDTO() {
    }

    public UserDTO(UsuarioModel usuarioModel) {
        this.id = usuarioModel.getId();
        this.nome = usuarioModel.getNome();
        this.email = usuarioModel.getEmail();
        this.tipo = usuarioModel.getTipo() != null ? usuarioModel.getTipo().name() : null;
    }

    public UserDTO(Integer id, String nome, String email, String tipo) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.tipo = tipo;
    }
}
