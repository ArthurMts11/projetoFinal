package com.arthur.projeto2.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * O ddl-auto=update cria tabelas e colunas novas, mas não altera colunas que
 * já existem. A coluna imoveis.status foi criada como ENUM do MySQL sem o
 * valor RESERVADO; aqui ela vira VARCHAR. Pode rodar várias vezes sem problema.
 */
@Component
public class MigracaoBanco implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MigracaoBanco.class);

    private final JdbcTemplate jdbc;

    public MigracaoBanco(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbc.execute("ALTER TABLE imoveis MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL'");
        } catch (Exception e) {
            log.warn("Não foi possível ajustar a coluna imoveis.status: {}", e.getMessage());
        }
    }
}
