package com.arthur.projeto2.model;

public enum StatusOferta {
    PENDENTE,
    ACEITA,
    // Outra oferta do mesmo imóvel foi aceita; volta a PENDENTE se o contrato for cancelado
    EM_ESPERA,
    RECUSADA,
    CANCELADA
}
