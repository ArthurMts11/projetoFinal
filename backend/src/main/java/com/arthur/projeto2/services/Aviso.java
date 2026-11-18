package com.arthur.projeto2.services;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Conteúdo de um e-mail de aviso (templates/email/aviso.html).
 *
 * @param assunto    linha de assunto
 * @param etiqueta   rótulo pequeno acima do título (ex.: "Contrato nº 7")
 * @param titulo     título do e-mail
 * @param paragrafos texto principal
 * @param detalhes   linhas "rótulo: valor" (ex.: Imóvel, Valor), na ordem do mapa
 * @param destaque   observação em destaque (ex.: motivo da devolução); pode ser null
 * @param botaoTexto texto do botão
 * @param caminho    tela do site aberta pelo botão (ex.: "/corretor/contratos/7")
 */
public record Aviso(String assunto, String etiqueta, String titulo, List<String> paragrafos,
        Map<String, String> detalhes, String destaque, String botaoTexto, String caminho) {

    /** Monta os detalhes a partir de pares rótulo, valor; valores vazios ficam de fora. */
    public static Map<String, String> detalhes(String... pares) {
        Map<String, String> mapa = new LinkedHashMap<>();
        for (int i = 0; i + 1 < pares.length; i += 2) {
            if (pares[i + 1] != null && !pares[i + 1].isBlank()) {
                mapa.put(pares[i], pares[i + 1]);
            }
        }
        return mapa;
    }

    /** Versão em texto puro, enviada junto com o HTML para leitores de e-mail sem HTML. */
    public String textoSimples(String urlSite) {
        StringBuilder t = new StringBuilder(titulo).append("\n\n");
        paragrafos.forEach(p -> t.append(p).append("\n\n"));
        detalhes.forEach((rotulo, valor) -> t.append(rotulo).append(": ").append(valor).append('\n'));
        if (destaque != null) {
            t.append('\n').append(destaque).append('\n');
        }
        return t.append('\n').append(botaoTexto).append(": ").append(urlSite).append(caminho).toString();
    }
}
