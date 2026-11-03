package com.arthur.projeto2.services;

import java.io.ByteArrayOutputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Gera um PDF de texto simples (A4, fonte Helvetica) sem biblioteca externa.
 * Basta para o contrato: título, parágrafos e quebra automática de linha e de página.
 *
 * Um PDF é uma lista de "objetos" numerados (catálogo, páginas, fonte, conteúdo)
 * mais uma tabela (xref) com a posição em bytes de cada um no arquivo.
 */
public final class PdfSimples {

    // WinAnsiEncoding do PDF é praticamente o windows-1252: cobre os acentos do português
    private static final Charset WIN_ANSI = Charset.forName("windows-1252");
    private static final int LARGURA = 595, ALTURA = 842, MARGEM = 56;
    private static final int MAX_CARACTERES = 88, LINHAS_POR_PAGINA = 52;

    private PdfSimples() {
    }

    /** Linha que começa com "# " vira título (fonte maior, negrito). */
    public static byte[] gerar(List<String> paragrafos) {
        List<String> linhas = new ArrayList<>();
        for (String p : paragrafos) {
            if (p.startsWith("# ")) {
                linhas.add(p);
            } else {
                linhas.addAll(quebrar(p));
            }
        }

        List<List<String>> paginas = new ArrayList<>();
        for (int i = 0; i < linhas.size(); i += LINHAS_POR_PAGINA) {
            paginas.add(linhas.subList(i, Math.min(i + LINHAS_POR_PAGINA, linhas.size())));
        }
        if (paginas.isEmpty()) {
            paginas.add(List.of());
        }

        // Objetos: 1 catálogo, 2 páginas, 3 fonte normal, 4 fonte negrito, depois página+conteúdo
        List<byte[]> objetos = new ArrayList<>();
        StringBuilder kids = new StringBuilder();
        for (int i = 0; i < paginas.size(); i++) {
            kids.append(5 + i * 2).append(" 0 R ");
        }
        objetos.add(ascii("<< /Type /Catalog /Pages 2 0 R >>"));
        objetos.add(ascii("<< /Type /Pages /Kids [" + kids + "] /Count " + paginas.size() + " >>"));
        objetos.add(ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"));
        objetos.add(ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"));

        for (int i = 0; i < paginas.size(); i++) {
            byte[] conteudo = conteudoDaPagina(paginas.get(i), i + 1, paginas.size());
            objetos.add(ascii("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + LARGURA + " " + ALTURA + "]"
                    + " /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " + (6 + i * 2) + " 0 R >>"));
            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            stream.writeBytes(ascii("<< /Length " + conteudo.length + " >>\nstream\n"));
            stream.writeBytes(conteudo);
            stream.writeBytes(ascii("\nendstream"));
            objetos.add(stream.toByteArray());
        }

        ByteArrayOutputStream pdf = new ByteArrayOutputStream();
        pdf.writeBytes(ascii("%PDF-1.4\n"));
        List<Integer> posicoes = new ArrayList<>();
        for (int i = 0; i < objetos.size(); i++) {
            posicoes.add(pdf.size());
            pdf.writeBytes(ascii((i + 1) + " 0 obj\n"));
            pdf.writeBytes(objetos.get(i));
            pdf.writeBytes(ascii("\nendobj\n"));
        }
        int inicioXref = pdf.size();
        StringBuilder xref = new StringBuilder("xref\n0 " + (objetos.size() + 1) + "\n0000000000 65535 f \n");
        for (int pos : posicoes) {
            xref.append(String.format("%010d 00000 n \n", pos));
        }
        xref.append("trailer\n<< /Size ").append(objetos.size() + 1).append(" /Root 1 0 R >>\nstartxref\n")
                .append(inicioXref).append("\n%%EOF\n");
        pdf.writeBytes(ascii(xref.toString()));
        return pdf.toByteArray();
    }

    private static byte[] conteudoDaPagina(List<String> linhas, int pagina, int total) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int y = ALTURA - MARGEM;
        for (String linha : linhas) {
            boolean titulo = linha.startsWith("# ");
            String texto = titulo ? linha.substring(2) : linha;
            int tamanho = titulo ? 15 : 11;
            out.writeBytes(ascii("BT /" + (titulo ? "F2" : "F1") + " " + tamanho + " Tf " + MARGEM + " " + y + " Td ("));
            out.writeBytes(escapar(texto));
            out.writeBytes(ascii(") Tj ET\n"));
            y -= titulo ? 24 : 14;
        }
        out.writeBytes(ascii("BT /F1 9 Tf " + (LARGURA / 2 - 30) + " 30 Td ("));
        out.writeBytes(escapar("Página " + pagina + " de " + total));
        out.writeBytes(ascii(") Tj ET"));
        return out.toByteArray();
    }

    private static List<String> quebrar(String paragrafo) {
        List<String> linhas = new ArrayList<>();
        if (paragrafo.isBlank()) {
            linhas.add("");
            return linhas;
        }
        StringBuilder atual = new StringBuilder();
        for (String palavra : paragrafo.split("\\s+")) {
            if (atual.length() > 0 && atual.length() + 1 + palavra.length() > MAX_CARACTERES) {
                linhas.add(atual.toString());
                atual.setLength(0);
            }
            if (atual.length() > 0) {
                atual.append(' ');
            }
            atual.append(palavra);
        }
        linhas.add(atual.toString());
        return linhas;
    }

    // Parênteses e barra invertida têm significado dentro de uma string do PDF
    private static byte[] escapar(String texto) {
        String limpo = texto.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
        return limpo.getBytes(WIN_ANSI);
    }

    private static byte[] ascii(String s) {
        return s.getBytes(StandardCharsets.US_ASCII);
    }
}
