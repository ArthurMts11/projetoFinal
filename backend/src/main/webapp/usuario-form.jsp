<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.arthur.projeto2.model.UsuarioModel" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Usuário</title>
</head>
<body>
    <%
        UsuarioModel usuario = (UsuarioModel) request.getAttribute("usuario");
    %>

    <h2><%= (usuario == null) ? "Novo usuário" : "Editar usuário" %></h2>

    <form action="usuarios" method="post">
        <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}">
        <% if (usuario != null) { %>
            <input type="hidden" name="id" value="<%= usuario.getId() %>">
        <% } %>

        <label for="nome">Nome:</label>
        <input type="text" id="nome" name="nome" required
               value="<%= (usuario != null) ? usuario.getNome() : "" %>">
        <br><br>

        <label for="email">E-mail:</label>
        <input type="email" id="email" name="email" required
               value="<%= (usuario != null) ? usuario.getEmail() : "" %>">
        <br><br>

        <label for="senha">Senha:</label>
        <input type="password" id="senha" name="senha"
               <%= (usuario == null) ? "required" : "" %>>
        <% if (usuario != null) { %>
            <br><small>Deixe em branco para manter a senha atual.</small>
        <% } %>
        <br><br>

        <button type="submit">Salvar</button>
    </form>

    <hr>
    <a href="usuarios">Voltar</a>
</body>
</html>
