<%@ page import="com.arthur.projeto2.model.UsuarioModel" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Área Logada</title>
</head>
<body>
    <h2>Área Logada</h2>

    <%
        UsuarioModel usuario = (UsuarioModel) session.getAttribute("usuario");

        if (usuario != null) {
            out.println("Bem vindo(a), " + usuario.getNome() + ".");
    %>
            <br>
            <a href="<%= request.getContextPath() %>/logout">Sair</a>
    <%
        } else {
            // Não deve acontecer: o AuthFilter já bloqueia /admin/* sem sessão.
            out.println("Usuário não está logado.");
    %>
            <br>
            <a href="<%= request.getContextPath() %>/login.jsp">Ir para o login</a>
    <%
        }
    %>
</body>
</html>
