<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Enviar Mensagem</title>
</head>
<body>
    <h2>Enviar mensagem</h2>

    <form action="saudacao" method="post">
        <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}">
        <label for="nome">Seu nome:</label>
        <input type="text" id="nome" name="nome" placeholder="Ex: Arthur" required>
        <br><br>
        <label for="mensagem">Mensagem:</label>
        <br>
        <textarea id="mensagem" name="mensagem" rows="8" cols="50" placeholder="Ex: Boa tarde!" required></textarea>
        <br><br>
        <button type="submit">Enviar</button>
    </form>

    <hr>
    <a href="produtos">Ver listagem de produtos</a>
    <br>
    <a href="usuarios">Ver listagem de usuários</a>
    <br>
    <a href="registrar.jsp">Cadastrar novo usuário</a>
    <br>
    <a href="login.jsp">Login</a>
</body>
</html>
