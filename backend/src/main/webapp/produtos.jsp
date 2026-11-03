<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="java.util.List" %>
<%@ page import="com.arthur.projeto2.model.ProdutoModel" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Produtos</title>
</head>
<body>
    <h2>Lista de produtos</h2>

    <p><a href="produtos?action=novo">Novo produto</a></p>

    <%
        @SuppressWarnings("unchecked")
        List<ProdutoModel> produtos = (List<ProdutoModel>) request.getAttribute("produtos");
    %>

    <% if (produtos == null || produtos.isEmpty()) { %>
        <p>Nenhum produto encontrado.</p>
    <% } else { %>
        <table border="1" cellpadding="6" cellspacing="0">
            <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Preço</th>
                <th>Quantidade</th>
                <th>Ações</th>
            </tr>
            <% for (ProdutoModel p : produtos) { %>
                <tr>
                    <td><%= p.getId() %></td>
                    <td><%= p.getNome() %></td>
                    <td>R$ <%= String.format("%.2f", p.getPreco()) %></td>
                    <td><%= p.getQuantidade() %></td>
                    <td>
                        <a href="produtos?action=editar&id=<%= p.getId() %>">Editar</a>
                        |
                        <a href="produtos?action=excluir&id=<%= p.getId() %>"
                           onclick="return confirm('Excluir este produto?');">Excluir</a>
                    </td>
                </tr>
            <% } %>
        </table>
    <% } %>

    <hr>
    <a href="index.jsp">Voltar</a>
</body>
</html>
