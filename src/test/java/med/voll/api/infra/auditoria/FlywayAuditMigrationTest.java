package med.voll.api.infra.auditoria;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.DriverManager;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FlywayAuditMigrationTest {

    @Test
    @DisplayName("Deveria executar todas as migrations incluindo V10__add-audit-columns com sucesso")
    void executarMigrationsIncluindoV10() throws Exception {
        String jdbcUrl = "jdbc:h2:mem:flyway_v10_check;MODE=MYSQL;DB_CLOSE_DELAY=-1";
        Flyway flyway = Flyway.configure()
                .dataSource(jdbcUrl, "sa", "")
                .locations("classpath:db/migration")
                .load();

        var result = flyway.migrate();
        assertThat(result.migrationsExecuted).isGreaterThanOrEqualTo(10);

        try (var conn = DriverManager.getConnection(jdbcUrl, "sa", "");
             var stmt = conn.createStatement()) {
            for (String tabela : List.of("medicos", "pacientes", "consultas", "prontuarios", "usuarios")) {
                var rs = stmt.executeQuery("select criado_em, atualizado_em, criado_por, atualizado_por from " + tabela);
                assertThat(rs.getMetaData().getColumnCount()).isEqualTo(4);
            }
        }
    }
}
