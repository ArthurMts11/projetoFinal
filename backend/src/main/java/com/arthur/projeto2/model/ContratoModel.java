package com.arthur.projeto2.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Contrato gerado quando o corretor aceita uma oferta. O corretor completa os
 * dados e envia para aprovação; o admin aprova (libera para o cliente assinar)
 * ou devolve com um motivo. Ver StatusContrato.
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
    private StatusContrato status = StatusContrato.RASCUNHO;

    // Corretor que aceitou a oferta e prepara o contrato
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne
    @JoinColumn(name = "corretor_id")
    private UsuarioModel corretor;

    @Column(name = "valor_final", precision = 12, scale = 2)
    private BigDecimal valorFinal;

    // Só no aluguel; nulo na venda
    @Column(name = "prazo_meses")
    private Integer prazoMeses;

    @Column(name = "dia_vencimento")
    private Integer diaVencimento;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "motivo_devolucao", columnDefinition = "TEXT")
    private String motivoDevolucao;

    @Column(name = "data_envio")
    private LocalDateTime dataEnvio;

    @Column(name = "data_assinatura")
    private LocalDateTime dataAssinatura;

    @Column(name = "data_aprovacao")
    private LocalDateTime dataAprovacao;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
