<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cadastro</title>
</head>
<body>
    <h2>Cadastro</h2>

    <form action="usuarios" method="post">
        <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}">
        <div>
            Nome: <input type="text" id="nome" name="nome" required>
        </div>
        <br>
        <div>
            E-mail: <input type="email" id="email" name="email" required>
        </div>
        <br>
        <div>
            Senha: <input type="password" id="senha" name="senha" required>
        </div>
        <br>
        <div>
            <button type="submit">Cadastrar</button>
        </div>
    </form>

    <hr>
    <a href="login.jsp">Já tem conta? Entrar</a>
</body>
</html>
