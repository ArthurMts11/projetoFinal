<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Login</title>
</head>
<body>
    <h2>Login</h2>

    <% if ("1".equals(request.getParameter("erro"))) { %>
        <p style="color: red;">E-mail ou senha inválidos.</p>
    <% } %>

    <form action="login" method="post">
        <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}">
        <div>
            E-mail: <input type="email" id="email" name="email" required>
        </div>
        <br>
        <div>
            Senha: <input type="password" id="senha" name="senha" required>
        </div>
        <br>
        <div>
            <button type="submit">Login</button>
            <a href="#">Esqueceu a senha?</a>
        </div>
    </form>

    <hr>
    <a href="registrar.jsp">Ainda não tem conta? Cadastre-se</a>
</body>
</html>
