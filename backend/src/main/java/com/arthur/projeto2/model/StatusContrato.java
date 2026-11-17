package com.arthur.projeto2.model;

/**
 * RASCUNHO e DEVOLVIDO: com o corretor. EM_APROVACAO: com o admin.
 * AGUARDANDO_ASSINATURA: liberado para o cliente.
 */
public enum StatusContrato {
    RASCUNHO,
    EM_APROVACAO,
    DEVOLVIDO,
    AGUARDANDO_ASSINATURA,
    ASSINADO,
    CANCELADO
}
