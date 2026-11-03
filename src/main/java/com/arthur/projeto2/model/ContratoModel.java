package com.arthur.projeto2.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Contrato gerado quando o admin aceita uma oferta. Só aparece para o cliente
 * depois que o admin aprova e envia (dataAprovacao preenchida).
 */
@Entity
@Table(name = "contratos")
@Getter
@Setter
public class ContratoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "oferta_id", nullable = false, unique = true)
    private OfertaModel oferta;

    // Caminho do PDF no disco: não vai para o JSON, o download é por GET /contratos/{id}/pdf
    @JsonIgnore
    @Column(name = "caminho_pdf")
    private String caminhoPdf;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(30)")
    private StatusContrato status = StatusContrato.AGUARDANDO_ASSINATURA;

    @Column(name = "data_assinatura")
    private LocalDateTime dataAssinatura;

    @Column(name = "data_aprovacao")
    private LocalDateTime dataAprovacao;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
