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
 * valor RESERVADO; aqui ela vira VARCHAR (e usuarios.tipo também, por causa do
 * CORRETOR). Também ajusta contratos antigos. Pode rodar várias vezes sem problema.
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
        executar("ALTER TABLE imoveis MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL'");
        // usuarios.tipo era ENUM('ADMIN','CLIENTE'): vira VARCHAR para aceitar CORRETOR
        executar("ALTER TABLE usuarios MODIFY COLUMN tipo VARCHAR(20) NOT NULL");
        // Contratos de antes do perfil corretor: os que o admin ainda não tinha aprovado viram rascunho
        executar("UPDATE contratos SET status = 'RASCUNHO' "
                + "WHERE status = 'AGUARDANDO_ASSINATURA' AND data_aprovacao IS NULL");
        executar("UPDATE contratos c JOIN ofertas o ON o.id = c.oferta_id "
                + "SET c.valor_final = o.valor_proposto WHERE c.valor_final IS NULL");
        executar("UPDATE contratos SET dia_vencimento = 10 WHERE dia_vencimento IS NULL");
        executar("UPDATE contratos c JOIN ofertas o ON o.id = c.oferta_id "
                + "SET c.prazo_meses = 30 WHERE c.prazo_meses IS NULL AND o.tipo = 'ALUGUEL'");
    }

    private void executar(String sql) {
        try {
            jdbc.execute(sql);
        } catch (Exception e) {
            log.warn("Migração não aplicada ({}): {}", sql, e.getMessage());
        }
    }
}
