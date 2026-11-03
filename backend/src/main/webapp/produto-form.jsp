<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.arthur.projeto2.model.ProdutoModel" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Produto</title>
</head>
<body>
    <%
        ProdutoModel produto = (ProdutoModel) request.getAttribute("produto");
    %>

    <h2><%= (produto == null) ? "Novo produto" : "Editar produto" %></h2>

    <form action="produtos" method="post">
        <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}">
        <% if (produto != null) { %>
            <input type="hidden" name="id" value="<%= produto.getId() %>">
        <% } %>

        <label for="nome">Nome:</label>
        <input type="text" id="nome" name="nome" required
               value="<%= (produto != null) ? produto.getNome() : "" %>">
        <br><br>

        <label for="preco">Preço:</label>
        <input type="number" step="0.01" id="preco" name="preco" required
               value="<%= (produto != null) ? produto.getPreco() : "" %>">
        <br><br>

        <label for="quantidade">Quantidade:</label>
        <input type="number" id="quantidade" name="quantidade" required
               value="<%= (produto != null) ? produto.getQuantidade() : "" %>">
        <br><br>

        <button type="submit">Salvar</button>
    </form>

    <hr>
    <a href="produtos">Voltar</a>
</body>
</html>
