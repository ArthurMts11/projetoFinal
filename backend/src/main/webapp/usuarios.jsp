<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="java.util.List" %>
<%@ page import="com.arthur.projeto2.model.UsuarioModel" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Usuários</title>
</head>
<body>
    <h2>Lista de usuários</h2>

    <p><a href="usuarios?action=novo">Novo usuário</a></p>

    <%
        @SuppressWarnings("unchecked")
        List<UsuarioModel> usuarios = (List<UsuarioModel>) request.getAttribute("usuarios");
    %>

    <% if (usuarios == null || usuarios.isEmpty()) { %>
        <p>Nenhum usuário encontrado.</p>
    <% } else { %>
        <table border="1" cellpadding="6" cellspacing="0">
            <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Ações</th>
            </tr>
            <% for (UsuarioModel u : usuarios) { %>
                <tr>
                    <td><%= u.getId() %></td>
                    <td><%= u.getNome() %></td>
                    <td><%= u.getEmail() %></td>
                    <td>
                        <a href="usuarios?action=editar&id=<%= u.getId() %>">Editar</a>
                        |
                        <a href="usuarios?action=excluir&id=<%= u.getId() %>"
                           onclick="return confirm('Excluir este usuário?');">Excluir</a>
                    </td>
                </tr>
            <% } %>
        </table>
    <% } %>

    <hr>
    <a href="index.jsp">Voltar</a>
</body>
</html>
